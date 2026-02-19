import { useNotemacStore } from "../Model/Store";
import { SendChatCompletion, BuildContextString, ExtractCodeBlocks } from "./LLMController";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import type { AIMessage, AIConversation } from "../Commons/Types";
import { generateId } from '../../Shared/Helpers/IdHelpers';
import { AI_COMMIT_MESSAGE_MAX_TOKENS, AI_COMMIT_MESSAGE_TEMPERATURE, AI_COMMIT_SUMMARY_MAX_CHARS } from "../Commons/Constants";

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
    catch (error: unknown)
    {
        store.SetAiOperationError(error instanceof Error ? error.message : String(error));
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
 * Shared helper for code-action functions that follow the same
 * pattern: set streaming, send a system + user prompt, extract a
 * code block from the result, call onResult, handle errors.
 */
async function RunCodeAction(
    systemPrompt: string,
    userPrompt: string,
    onResult: (code: string) => void,
): Promise<void>
{
    const store = GetStore();
    store.SetIsAiStreaming(true);
    store.SetAiOperationError(null);

    try
    {
        const result = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: store.aiSettings.codeTemperature, stream: false },
        );

        const blocks = ExtractCodeBlocks(result);
        onResult(0 < blocks.length ? blocks[0].code : result);
    }
    catch (error: unknown)
    {
        store.SetAiOperationError(error instanceof Error ? error.message : String(error));
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}

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

/** Refactor code and return the result for diff preview. */
export async function RefactorCode(code: string, language: string, onResult: (refactored: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a code refactoring assistant. Refactor the given code to improve readability, performance, and maintainability. Return ONLY the refactored code in a single code block. No explanations before or after.`,
        `Refactor this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        onResult,
    );
}

/** Generate unit tests for the given code. */
export async function GenerateTests(code: string, language: string, onResult: (tests: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a test generation assistant. Generate comprehensive unit tests for the given code. Return ONLY the test code in a single code block. Use appropriate testing framework for the language. No explanations.`,
        `Generate unit tests for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        onResult,
    );
}

/** Generate documentation (JSDoc/docstring) for the given code. */
export async function GenerateDocumentation(code: string, language: string, onResult: (documented: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a documentation assistant. Add comprehensive documentation (JSDoc, docstrings, or appropriate format) to the given code. Return ONLY the fully documented code in a single code block. No explanations.`,
        `Add documentation to this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        onResult,
    );
}

/** Fix an error in the given code. */
export async function FixError(code: string, language: string, errorMessage: string, onResult: (fixed: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a debugging assistant. Fix the error in the given code. Return ONLY the fixed code in a single code block. No explanations before or after.`,
        `Fix this ${language} code.\n\nError: ${errorMessage}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
        onResult,
    );
}

/** Simplify the given code. */
export async function SimplifyCode(code: string, language: string, onResult: (simplified: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a code simplification assistant. Simplify the given code while maintaining the same functionality. Return ONLY the simplified code in a single code block. No explanations.`,
        `Simplify this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        onResult,
    );
}

/** Convert code to another language. */
export async function ConvertLanguage(code: string, fromLanguage: string, toLanguage: string, onResult: (converted: string) => void): Promise<void>
{
    await RunCodeAction(
        `You are a code conversion assistant. Convert the given code from ${fromLanguage} to ${toLanguage}. Return ONLY the converted code in a single code block. No explanations.`,
        `Convert this ${fromLanguage} code to ${toLanguage}:\n\n\`\`\`${fromLanguage}\n${code}\n\`\`\``,
        onResult,
    );
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

    const systemPrompt = `You are a git commit message assistant. Write a clear, concise commit message following conventional commits style. First line should be a short summary (under ${AI_COMMIT_SUMMARY_MAX_CHARS} chars). Optionally add a blank line and a longer description if the changes are complex. Output ONLY the commit message text, nothing else.`;

    let fullMessage = '';

    try
    {
        fullMessage = await SendChatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a commit message for these changes:\n\n${diffContent}` },
            ],
            { temperature: AI_COMMIT_MESSAGE_TEMPERATURE, maxTokens: AI_COMMIT_MESSAGE_MAX_TOKENS },
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
    catch (error: unknown)
    {
        store.SetAiOperationError(error instanceof Error ? error.message : String(error));
        return '';
    }
    finally
    {
        store.SetIsAiStreaming(false);
    }
}
