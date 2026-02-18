import { useNotemacStore } from "../Model/Store";
import { RegisterSnippetCompletionProvider } from "./SnippetController";

/**
 * Registers all custom completion providers for the editor.
 * Returns an array of disposables that should be cleaned up on unmount.
 */
export function RegisterCompletionProviders(monaco: any, editor: any): any[]
{
    const disposables: any[] = [];

    // 1. Cross-tab word completions (words from all open tabs)
    disposables.push(
        monaco.languages.registerCompletionItemProvider('*', {
            provideCompletionItems: (model: any, position: any) =>
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
            provideCompletionItems: (model: any, position: any) =>
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
                    const addTreeEntries = (nodes: any[], prefix: string) =>
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

    return disposables;
}
