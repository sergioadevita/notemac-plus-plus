import { useNotemacStore } from "../Model/Store";
import type { AIProvider, AIProviderType, AICredential, AIMessage, AIContextItem } from "../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

// ─── Helpers ─────────────────────────────────────────────────────

function GetStore()
{
    return useNotemacStore.getState();
}

// Active AbortController for cancelling in-flight requests
let activeAbortController: AbortController | null = null;

// ─── Request Building ───────────────────────────────────────────

interface ChatCompletionOptions
{
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    systemPrompt?: string;
}

function BuildOpenAIBody(messages: { role: string; content: string }[], modelId: string, options: ChatCompletionOptions): any
{
    return {
        model: modelId,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: options.stream ?? true,
    };
}

function BuildAnthropicBody(messages: { role: string; content: string }[], modelId: string, options: ChatCompletionOptions): any
{
    // Anthropic separates system prompt from messages — single-pass split
    const systemParts: string[] = [];
    const nonSystemMessages: { role: string; content: string }[] = [];
    for (let i = 0, len = messages.length; i < len; i++)
    {
        if ('system' === messages[i].role)
            systemParts.push(messages[i].content);
        else
            nonSystemMessages.push(messages[i]);
    }

    return {
        model: modelId,
        system: 0 < systemParts.length ? systemParts.join('\n') : undefined,
        messages: nonSystemMessages.map(m => ({
            role: m.role,
            content: m.content,
        })),
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        stream: options.stream ?? true,
    };
}

function BuildGoogleBody(messages: { role: string; content: string }[], options: ChatCompletionOptions): any
{
    // Google uses a different message format
    const contents = messages
        .filter(m => 'system' !== m.role)
        .map(m => ({
            role: 'assistant' === m.role ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find(m => 'system' === m.role);

    return {
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 4096,
        },
    };
}

function GetEndpointUrl(provider: AIProvider, modelId: string, stream: boolean): string
{
    if ('anthropic' === provider.type)
        return `${provider.baseUrl}/v1/messages`;

    if ('google' === provider.type)
    {
        const streamSuffix = stream ? '?alt=sse' : '';
        return `${provider.baseUrl}/v1beta/models/${modelId}:${stream ? 'streamGenerateContent' : 'generateContent'}${streamSuffix}`;
    }

    // OpenAI and custom (OpenAI-compatible)
    return `${provider.baseUrl}/v1/chat/completions`;
}

function GetHeaders(provider: AIProvider, credential: AICredential): Record<string, string>
{
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if ('anthropic' === provider.type)
    {
        headers['x-api-key'] = credential.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    else if ('google' === provider.type)
    {
        // Google uses query param, but we add it to the URL
        headers['x-goog-api-key'] = credential.apiKey;
    }
    else
    {
        // OpenAI / custom
        headers['Authorization'] = `Bearer ${credential.apiKey}`;
    }

    return headers;
}

// ─── Stream Parsing ─────────────────────────────────────────────

function ParseOpenAIChunk(line: string): string | null
{
    if (!line.startsWith('data: '))
        return null;

    const data = line.slice(6).trim();
    if ('[DONE]' === data)
        return null;

    try
    {
        const parsed = JSON.parse(data);
        return parsed.choices?.[0]?.delta?.content || null;
    }
    catch
    {
        return null;
    }
}

function ParseAnthropicChunk(line: string): string | null
{
    if (!line.startsWith('data: '))
        return null;

    const data = line.slice(6).trim();

    try
    {
        const parsed = JSON.parse(data);
        if ('content_block_delta' === parsed.type)
            return parsed.delta?.text || null;
        return null;
    }
    catch
    {
        return null;
    }
}

function ParseGoogleChunk(line: string): string | null
{
    if (!line.startsWith('data: '))
        return null;

    const data = line.slice(6).trim();

    try
    {
        const parsed = JSON.parse(data);
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    catch
    {
        return null;
    }
}

function ParseChunk(providerType: AIProviderType, line: string): string | null
{
    if ('anthropic' === providerType)
        return ParseAnthropicChunk(line);
    if ('google' === providerType)
        return ParseGoogleChunk(line);
    return ParseOpenAIChunk(line);
}

// ─── Core API Functions ─────────────────────────────────────────

/**
 * Send a chat completion request with streaming support.
 * Calls onChunk for each text delta and onDone when complete.
 */
export async function SendChatCompletion(
    messages: { role: string; content: string }[],
    options: ChatCompletionOptions = {},
    onChunk?: (text: string) => void,
    onDone?: (fullText: string) => void,
    onError?: (error: string) => void,
): Promise<string>
{
    const store = GetStore();
    const provider = store.GetActiveProvider();
    if (null === provider)
    {
        const err = 'No active AI provider configured';
        onError?.(err);
        throw new Error(err);
    }

    const credential = store.GetCredentialForProvider(provider.id);
    if (null === credential)
    {
        const err = `No API key configured for ${provider.name}`;
        onError?.(err);
        throw new Error(err);
    }

    const modelId = store.activeModelId;
    const shouldStream = options.stream !== false;

    // Build system prompt
    const allMessages = [...messages];
    if (options.systemPrompt && !allMessages.some(m => 'system' === m.role))
        allMessages.unshift({ role: 'system', content: options.systemPrompt });

    // Add default system prompt from settings if none provided
    const defaultSystemPrompt = store.aiSettings.systemPrompt;
    if (defaultSystemPrompt && !allMessages.some(m => 'system' === m.role))
        allMessages.unshift({ role: 'system', content: defaultSystemPrompt });

    // Build request
    let body: any;
    if ('anthropic' === provider.type)
        body = BuildAnthropicBody(allMessages, modelId, { ...options, stream: shouldStream });
    else if ('google' === provider.type)
        body = BuildGoogleBody(allMessages, { ...options });
    else
        body = BuildOpenAIBody(allMessages, modelId, { ...options, stream: shouldStream });

    const url = GetEndpointUrl(provider, modelId, shouldStream);
    const headers = GetHeaders(provider, credential);

    // Cancel any existing request
    CancelActiveRequest();
    activeAbortController = new AbortController();

    try
    {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: activeAbortController.signal,
        });

        if (!response.ok)
        {
            const errorBody = await response.text();
            let errorMessage = `API error ${response.status}`;
            try
            {
                const parsed = JSON.parse(errorBody);
                errorMessage = parsed.error?.message || parsed.message || errorMessage;
            }
            catch { /* Use status code message */ }

            onError?.(errorMessage);
            throw new Error(errorMessage);
        }

        if (shouldStream && response.body)
        {
            return await StreamResponse(response.body, provider.type, onChunk, onDone);
        }
        else
        {
            // Non-streaming response
            const data = await response.json();
            let content = '';

            if ('anthropic' === provider.type)
                content = data.content?.[0]?.text || '';
            else if ('google' === provider.type)
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            else
                content = data.choices?.[0]?.message?.content || '';

            onDone?.(content);
            return content;
        }
    }
    catch (error: any)
    {
        if ('AbortError' === error.name)
        {
            onDone?.('');
            return '';
        }
        onError?.(error.message);
        throw error;
    }
    finally
    {
        activeAbortController = null;
    }
}

/**
 * Process a streaming response body.
 */
async function StreamResponse(
    body: ReadableStream<Uint8Array>,
    providerType: AIProviderType,
    onChunk?: (text: string) => void,
    onDone?: (fullText: string) => void,
): Promise<string>
{
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    try
    {
        while (true)
        {
            const { done, value } = await reader.read();
            if (done)
                break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            const maxLines = lines.length;
            for (let i = 0; i < maxLines; i++)
            {
                const line = lines[i].trim();
                if (0 === line.length)
                    continue;

                const text = ParseChunk(providerType, line);
                if (null !== text && 0 < text.length)
                {
                    fullText += text;
                    onChunk?.(text);
                }
            }
        }

        // Process any remaining buffer
        if (0 < buffer.trim().length)
        {
            const text = ParseChunk(providerType, buffer.trim());
            if (null !== text && 0 < text.length)
            {
                fullText += text;
                onChunk?.(text);
            }
        }
    }
    finally
    {
        reader.releaseLock();
    }

    onDone?.(fullText);
    return fullText;
}

/**
 * Send an inline completion request (for ghost-text suggestions).
 * Uses a chat completion with a fill-in-middle style prompt.
 */
export async function SendInlineCompletion(
    prefix: string,
    suffix: string,
    language: string,
    onDone?: (completion: string) => void,
    onError?: (error: string) => void,
): Promise<string>
{
    const store = GetStore();
    const settings = store.aiSettings;

    const systemPrompt = `You are an intelligent code completion assistant. Complete the code at the cursor position. Only output the completion text, no explanations, no markdown, no code fences. The code is in ${language}.`;

    const userPrompt = `Complete the code at [CURSOR]:

${prefix}[CURSOR]${suffix}

Output ONLY the completion text that goes at [CURSOR]. No explanations.`;

    return SendChatCompletion(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        {
            temperature: settings.codeTemperature,
            maxTokens: settings.inlineMaxTokens,
            stream: false,
        },
        undefined,
        onDone,
        onError,
    );
}

/**
 * Cancel any active LLM request.
 */
export function CancelActiveRequest(): void
{
    if (null !== activeAbortController)
    {
        activeAbortController.abort();
        activeAbortController = null;
    }
}

/**
 * Test if a provider connection works with the given credentials.
 */
export async function TestProviderConnection(
    provider: AIProvider,
    credential: AICredential,
): Promise<{ success: boolean; error?: string }>
{
    try
    {
        const modelId = 0 < provider.models.length ? provider.models[0].id : '';
        const url = GetEndpointUrl(provider, modelId, false);
        const headers = GetHeaders(provider, credential);

        let body: any;
        const testMessages = [{ role: 'user', content: 'Say "ok".' }];

        if ('anthropic' === provider.type)
            body = BuildAnthropicBody(testMessages, modelId, { maxTokens: 10, stream: false });
        else if ('google' === provider.type)
            body = BuildGoogleBody(testMessages, { maxTokens: 10 });
        else
            body = BuildOpenAIBody(testMessages, modelId, { maxTokens: 10, stream: false });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (response.ok)
            return { success: true };

        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try
        {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.error?.message || parsed.message || errorMessage;
        }
        catch { /* Use status code message */ }

        return { success: false, error: errorMessage };
    }
    catch (error: any)
    {
        return { success: false, error: error.message };
    }
}

// ─── Context Building ───────────────────────────────────────────

/**
 * Build a context string from attached context items.
 */
export function BuildContextString(items: AIContextItem[]): string
{
    if (0 === items.length)
        return '';

    const parts: string[] = [];
    const maxItems = items.length;

    for (let i = 0; i < maxItems; i++)
    {
        const item = items[i];
        if ('file' === item.type)
            parts.push(`--- File: ${item.label} (${item.language || 'unknown'}) ---\n${item.content}`);
        else if ('selection' === item.type)
            parts.push(`--- Selected code (${item.language || 'unknown'}) ---\n${item.content}`);
        else if ('error' === item.type)
            parts.push(`--- Error ---\n${item.content}`);
        else if ('diff' === item.type)
            parts.push(`--- Diff ---\n${item.content}`);
    }

    return parts.join('\n\n');
}

/**
 * Estimate token count (rough approximation: ~4 chars per token).
 */
export function EstimateTokenCount(text: string): number
{
    return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within a token budget.
 */
export function TruncateToTokenBudget(text: string, maxTokens: number): string
{
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars)
        return text;
    return text.slice(0, maxChars) + '\n... (truncated)';
}

// ─── Code Block Extraction ──────────────────────────────────────

/**
 * Extract code blocks from a markdown-formatted AI response.
 */
export function ExtractCodeBlocks(content: string): { language: string; code: string }[]
{
    const blocks: { language: string; code: string }[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while (null !== (match = regex.exec(content)))
    {
        blocks.push({
            language: match[1] || 'text',
            code: match[2].trim(),
        });
    }

    return blocks;
}
