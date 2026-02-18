import { useNotemacStore } from "../Model/Store";
import { SendChatCompletion, BuildContextString, ExtractCodeBlocks } from "./LLMController";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import type { AIMessage, AIConversation, AIContextItem } from "../Commons/Types";
import { generateId } from '../../Shared/Helpers/IdHelpers';

// ─── Helpers ─────────────────────────────────────────────────────

function GetStore()
{
    return useNotemacStore.getState();
}

function CreateUserMessage(content: string): AIMessage
{
    return {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        codeBlocks: [],
    };
}

function CreateAssistantMessage(content: string = ''): AIMessage
{
    const codeBlocks = ExtractCodeBlocks(content);
    return {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        codeBlocks: codeBlocks.map(b => ({
            language: b.language,
            code: b.code,
            action: 'replace' as const,
        })),
    };
}

function CreateNewConversation(title: string): AIConversation
{
    const store = GetStore();
    return {
        id: generateId(),
        title,
        messages: [],
        modelId: store.activeModelId,
        providerId: store.activeProviderId,
        createdAt: Date.now(),
    };
}

// ─── Chat Functions ─────────────────────────────────────────────

/**
 * Send a message in the active conversation (or create a new one).
 */
export async function SendChatMessage(userContent: string): Promise<void>
{
    const store = GetStore();
    let conversationId = store.activeConversationId;

    // Create new conversation if none active
    if (null === conversationId)
    {
        const title = userContent.length > 50 ? userContent.substring(0, 50) + '...' : userContent;
        const conv = CreateNewConversation(title);
        store.AddConversation(conv);
        conversationId = conv.id;
    }

    // Add user message
    const userMsg = CreateUserMessage(userContent);
    store.AddMessageToConversation(conversationId, userMsg);

    // Build messages array from conversation history
    const conversation = store.conversations.find(c => c.id === conversationId);
    if (!conversation)
        return;

    // Include context items
    const contextString = BuildContextString(store.aiContextItems);
    const messages: { role: string; content: string }[] = [];

    if (0 < contextString.length)
        messages.push({ role: 'system', content: `Here is relevant context:\n\n${contextString}` });

    const maxMsgs = conversation.messages.length;
    for (let i = 0; i < maxMsgs; i++)
    {
        messages.push({
            role: conversation.messages[i].role,
            content: conversation.messages[i].content,
        });
    }

    // Add placeholder assistant message
    const assistantMsg = CreateAssistantMessage();
    store.AddMessageToConversation(conversationId, assistantMsg);
    store.SetIsAiStreaming(true);
    store.SetAiStreamContent('');
    store.SetAiOperationError(null);

    let fullResponse = '';

    try
    {
        await SendChatCompletion(
            messages,
            { temperature: store.aiSettings.chatTemperature },
            (chunk) =>
            {
                fullResponse += chunk;
                store.SetAiStreamContent(fullResponse);
                store.UpdateLastMessage(conversationId!, fullResponse);
                Dispatch(NOTEMAC_EVENTS.AI_STREAM_CHUNK, { text: chunk });
            },
            (finalText) =>
            {
                // Update with final parsed code blocks
                const updatedMsg = CreateAssistantMessage(finalText);
                store.UpdateLastMessage(conversationId!, finalText);
                Dispatch(NOTEMAC_EVENTS.AI_RESPONSE_COMPLETE, { conversationId, text: finalText });
            },
            (error) =>
            {
                store.SetAiOperationError(error);
                Dispatch(NOTEMAC_EVENTS.AI_ERROR, { error });
            },
        );
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
        store.SetAiStreamContent('');
        store.SaveAIState();
    }
}

// ─── Code Actions ───────────────────────────────────────────────

/**
 * Explain the given code selection.
 */
export async function ExplainCode(code: string, language: string): Promise<void>
{
    const store = GetStore();
    store.setSidebarPanel('ai');

    const prompt = `Explain the following ${language} code in detail. What does it do, and why?\n\n\`\`\`${language}\n${code}\n\`\`\``;
    await SendChatMessage(prompt);
}

/**
 * Refactor code and return the result for diff preview.
 */
export async function RefactorCode(
    code: string,
    language: string,
    onResult: (refactored: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a code refactoring assistant. Refactor the given code to improve readability, performance, and maintainability. Return ONLY the refactored code in a single code block. No explanations before or after.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Refactor this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const refactored = 0 < blocks.length ? blocks[0].code : result;
        onResult(refactored);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

/**
 * Generate unit tests for the given code.
 */
export async function GenerateTests(
    code: string,
    language: string,
    onResult: (tests: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a test generation assistant. Generate comprehensive unit tests for the given code. Return ONLY the test code in a single code block. Use appropriate testing framework for the language. No explanations.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate unit tests for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const tests = 0 < blocks.length ? blocks[0].code : result;
        onResult(tests);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

/**
 * Generate documentation (JSDoc/docstring) for the given code.
 */
export async function GenerateDocumentation(
    code: string,
    language: string,
    onResult: (documented: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a documentation assistant. Add comprehensive documentation (JSDoc, docstrings, or appropriate format) to the given code. Return ONLY the fully documented code in a single code block. No explanations.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Add documentation to this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const documented = 0 < blocks.length ? blocks[0].code : result;
        onResult(documented);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

/**
 * Fix an error in the given code.
 */
export async function FixError(
    code: string,
    language: string,
    errorMessage: string,
    onResult: (fixed: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a debugging assistant. Fix the error in the given code. Return ONLY the fixed code in a single code block. No explanations before or after.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Fix this ${language} code.\n\nError: ${errorMessage}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const fixed = 0 < blocks.length ? blocks[0].code : result;
        onResult(fixed);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

/**
 * Simplify the given code.
 */
export async function SimplifyCode(
    code: string,
    language: string,
    onResult: (simplified: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a code simplification assistant. Simplify the given code while maintaining the same functionality. Return ONLY the simplified code in a single code block. No explanations.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Simplify this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const simplified = 0 < blocks.length ? blocks[0].code : result;
        onResult(simplified);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

/**
 * Convert code to another language.
 */
export async function ConvertLanguage(
    code: string,
    fromLanguage: string,
    toLanguage: string,
    onResult: (converted: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a code conversion assistant. Convert the given code from ${fromLanguage} to ${toLanguage}. Return ONLY the converted code in a single code block. No explanations.`;

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Convert this ${fromLanguage} code to ${toLanguage}:\n\n\`\`\`${fromLanguage}\n${code}\n\`\`\`` },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        const converted = 0 < blocks.length ? blocks[0].code : result;
        onResult(converted);
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

// ─── Git Commit Message ─────────────────────────────────────────

/**
 * Generate a commit message from staged diff content.
 */
export async function GenerateCommitMessage(
    diffContent: string,
    onChunk?: (text: string) => void,
    onDone?: (message: string) => void,
): Promise<string>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    const systemPrompt = `You are a git commit message assistant. Write a clear, concise commit message following conventional commits style. First line should be a short summary (under 72 chars). Optionally add a blank line and a longer description if the changes are complex. Output ONLY the commit message text, nothing else.`;

    let fullMessage = '';

    try
    {
        fullMessage = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a commit message for these changes:\n\n${diffContent}` },
            ],
            { temperature: 0.3, maxTokens: 256 },
            (chunk) =>
            {
                fullMessage += chunk;
                store.SetCommitMessageDraft(fullMessage);
                onChunk?.(chunk);
            },
            (finalText) =>
            {
                store.SetCommitMessageDraft(finalText);
                onDone?.(finalText);
            },
        );

        return fullMessage;
    }
    catch (error: any)
    {
        store.SetAiOperationError(error.message);
        return '';
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}
