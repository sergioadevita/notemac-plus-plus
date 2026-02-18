import type { editor, languages, IDisposable } from 'monaco-editor';
import type { FileTreeNode } from '../Commons/Types';
import { useNotemacStore } from "../Model/Store";
import { RegisterSnippetCompletionProvider } from "./SnippetController";
import { SendInlineCompletion, CancelActiveRequest } from "./LLMController";
import { AI_DEFAULT_DEBOUNCE_MS, AI_INLINE_MAX_CONTEXT_CHARS } from "../Commons/Constants";

/** The Monaco namespace object passed at runtime from @monaco-editor/react. */
type MonacoNamespace = typeof import('monaco-editor');

// ─── Inline Completion State ────────────────────────────────────

let inlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastInlineRequestId = 0;

/**
 * Registers all custom completion providers for the editor.
 * Returns an array of disposables that should be cleaned up on unmount.
 */
export function RegisterCompletionProviders(monaco: MonacoNamespace, editorInstance: editor.IStandaloneCodeEditor): IDisposable[]
{
    const disposables: IDisposable[] = [];

    // 1. Cross-tab word completions (words from all open tabs)
    disposables.push(
        monaco.languages.registerCompletionItemProvider('*', {
            provideCompletionItems: (model: editor.ITextModel, position: { lineNumber: number; column: number }) =>
            {
                const { tabs } = useNotemacStore.getState();
                const currentTabContent = model.getValue();
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                // Collect unique words from all tabs
                const wordSet = new Set<string>();
                const wordRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]{2,}\b/g;
                const maxTabs = tabs.length;

                for (let i = 0; i < maxTabs; i++)
                {
                    const content = tabs[i].content;
                    if (content === currentTabContent)
                        continue; // Skip current tab — Monaco handles it natively

                    let match;
                    wordRegex.lastIndex = 0;
                    while (null !== (match = wordRegex.exec(content)))
                    {
                        wordSet.add(match[0]);
                    }
                }

                // Filter out the current word being typed
                if (word.word)
                    wordSet.delete(word.word);

                const suggestions = Array.from(wordSet).map(w => ({
                    label: w,
                    kind: monaco.languages.CompletionItemKind.Text,
                    detail: 'from other tabs',
                    insertText: w,
                    range,
                    sortText: '~' + w, // Sort after built-in suggestions
                }));

                return { suggestions };
            },
        })
    );

    // 2. Snippet completions
    disposables.push(RegisterSnippetCompletionProvider(monaco));

    // 3. Path completions (trigger on ./ or ../)
    disposables.push(
        monaco.languages.registerCompletionItemProvider('*', {
            triggerCharacters: ['/'],
            provideCompletionItems: (model: editor.ITextModel, position: { lineNumber: number; column: number }) =>
            {
                const lineContent = model.getLineContent(position.lineNumber);
                const beforeCursor = lineContent.substring(0, position.column - 1);

                // Only trigger on path-like patterns
                if (!beforeCursor.match(/['".]\/[^'"]*$/))
                    return { suggestions: [] };

                const { tabs, fileTree } = useNotemacStore.getState();
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                // Suggest open tab names as path completions
                const suggestions = tabs.map(tab => ({
                    label: tab.name,
                    kind: monaco.languages.CompletionItemKind.File,
                    detail: tab.path || 'open tab',
                    insertText: tab.name,
                    range,
                }));

                // Add file tree entries if available
                if (fileTree)
                {
                    const addTreeEntries = (nodes: FileTreeNode[], prefix: string) =>
                    {
                        for (const node of nodes)
                        {
                            suggestions.push({
                                label: prefix + node.name,
                                kind: node.isDirectory
                                    ? monaco.languages.CompletionItemKind.Folder
                                    : monaco.languages.CompletionItemKind.File,
                                detail: node.path,
                                insertText: node.name,
                                range,
                            });
                            if (node.children)
                                addTreeEntries(node.children, prefix + node.name + '/');
                        }
                    };
                    addTreeEntries(fileTree, '');
                }

                return { suggestions };
            },
        })
    );

    // 4. AI inline completions (ghost text)
    disposables.push(RegisterAIInlineCompletionProvider(monaco, editorInstance));

    return disposables;
}

// ─── AI Inline Completion Provider ──────────────────────────────

/**
 * Registers an inline completion provider that requests ghost-text
 * suggestions from the configured LLM. Debounced to avoid excessive
 * API calls while typing.
 */
export function RegisterAIInlineCompletionProvider(monaco: MonacoNamespace, editorInstance: editor.IStandaloneCodeEditor): IDisposable
{
    const provider = monaco.languages.registerInlineCompletionsProvider('*', {
        provideInlineCompletions: async (model: editor.ITextModel, position: { lineNumber: number; column: number }, _context: languages.InlineCompletionContext, token: { onCancellationRequested: (fn: () => void) => void }) =>
        {
            const store = useNotemacStore.getState();

            // Guard: AI must be enabled with a valid credential
            if (!store.aiEnabled || !store.inlineSuggestionEnabled)
                return { items: [] };

            if (!store.aiSettings.inlineCompletionEnabled)
                return { items: [] };

            const activeProvider = store.GetActiveProvider();
            if (null === activeProvider)
                return { items: [] };

            const credential = store.GetCredentialForProvider(activeProvider.id);
            if (null === credential || 0 === credential.apiKey.length)
                return { items: [] };

            // Debounce: cancel previous pending request
            if (null !== inlineDebounceTimer)
            {
                clearTimeout(inlineDebounceTimer);
                inlineDebounceTimer = null;
            }

            const requestId = ++lastInlineRequestId;
            const debounceMs = store.aiSettings.inlineDebounceMs || AI_DEFAULT_DEBOUNCE_MS;

            // Wait for the debounce period
            const shouldProceed = await new Promise<boolean>((resolve) =>
            {
                inlineDebounceTimer = setTimeout(() =>
                {
                    inlineDebounceTimer = null;
                    // Only proceed if this is still the latest request
                    resolve(requestId === lastInlineRequestId);
                }, debounceMs);

                // Cancel on cancellation token
                token.onCancellationRequested(() =>
                {
                    if (null !== inlineDebounceTimer)
                    {
                        clearTimeout(inlineDebounceTimer);
                        inlineDebounceTimer = null;
                    }
                    resolve(false);
                });
            });

            if (!shouldProceed)
                return { items: [] };

            // Build prefix and suffix from the editor content
            // Truncate to a reasonable window to avoid sending huge files
            const offset = model.getOffsetAt(position);
            const fullText = model.getValue();
            const rawPrefix = fullText.substring(0, offset);
            const rawSuffix = fullText.substring(offset);
            const prefix = rawPrefix.length > AI_INLINE_MAX_CONTEXT_CHARS
                ? rawPrefix.substring(rawPrefix.length - AI_INLINE_MAX_CONTEXT_CHARS)
                : rawPrefix;
            const suffix = rawSuffix.length > AI_INLINE_MAX_CONTEXT_CHARS
                ? rawSuffix.substring(0, AI_INLINE_MAX_CONTEXT_CHARS)
                : rawSuffix;

            // Skip if prefix is too short or ends with whitespace only
            const trimmedPrefix = prefix.trimEnd();
            if (trimmedPrefix.length < 5)
                return { items: [] };

            // Get language ID
            const languageId = model.getLanguageId() || 'plaintext';

            try
            {
                const completion = await SendInlineCompletion(
                    prefix,
                    suffix,
                    languageId,
                );

                // Verify this is still the latest request
                if (requestId !== lastInlineRequestId)
                    return { items: [] };

                if (0 === completion.length)
                    return { items: [] };

                // Clean up the completion — remove leading/trailing code fences if present
                let cleanCompletion = completion.trim();
                if (cleanCompletion.startsWith('```'))
                {
                    const lines = cleanCompletion.split('\n');
                    lines.shift(); // Remove opening fence
                    if (0 < lines.length && lines[lines.length - 1].startsWith('```'))
                        lines.pop(); // Remove closing fence
                    cleanCompletion = lines.join('\n');
                }

                if (0 === cleanCompletion.length)
                    return { items: [] };

                return {
                    items: [
                        {
                            insertText: cleanCompletion,
                            range: new monaco.Range(
                                position.lineNumber,
                                position.column,
                                position.lineNumber,
                                position.column,
                            ),
                        },
                    ],
                };
            }
            catch
            {
                return { items: [] };
            }
        },

        freeInlineCompletions: () =>
        {
            // Nothing to clean up
        },
    });

    return provider;
}

/**
 * Cancel any pending inline completion request and debounce timer.
 */
export function CancelInlineCompletion(): void
{
    if (null !== inlineDebounceTimer)
    {
        clearTimeout(inlineDebounceTimer);
        inlineDebounceTimer = null;
    }
    lastInlineRequestId++;
    CancelActiveRequest();
}
