import type { editor, IDisposable } from 'monaco-editor';
import { useNotemacStore } from "../Model/Store";
import type { SavedSnippet } from "../Commons/Types";

/** The Monaco namespace object passed at runtime from @monaco-editor/react. */
type MonacoNamespace = typeof import('monaco-editor');

/**
 * Gets snippets filtered for the given language.
 * Snippets with language '*' match all languages.
 */
export function GetSnippetsForLanguage(language: string): SavedSnippet[]
{
    const { savedSnippets } = useNotemacStore.getState();
    return savedSnippets.filter(s => '*' === s.language || s.language === language);
}

/**
 * Inserts a snippet body at the current cursor position using Monaco's snippet API.
 * Handles tab-stop syntax ($1, $2, $0 for final cursor position).
 */
export function InsertSnippet(editor: editor.IStandaloneCodeEditor, snippetBody: string): void
{
    if (!editor)
        return;

    const contribution = editor.getContribution('snippetController2') as { insert(template: string): void } | null;
    if (contribution)
    {
        // Use Monaco's built-in snippet controller (internal API)
        contribution.insert(snippetBody);
    }
    else
    {
        // Fallback: insert as plain text (strip tab-stop markers)
        const plainText = snippetBody
            .replace(/\$\{?\d+(?::([^}]*))?\}?/g, '$1')
            .replace(/\$0/g, '');

        const selection = editor.getSelection();
        if (selection)
        {
            editor.executeEdits('snippet', [{
                range: selection,
                text: plainText,
                forceMoveMarkers: true,
            }]);
        }
    }
}

/**
 * Registers a completion item provider for snippets.
 * Returns a disposable that should be cleaned up on unmount.
 */
export function RegisterSnippetCompletionProvider(monaco: MonacoNamespace): IDisposable
{
    return monaco.languages.registerCompletionItemProvider('*', {
        provideCompletionItems: (model: editor.ITextModel, position: { lineNumber: number; column: number }) =>
        {
            const language = model.getLanguageId();
            const snippets = GetSnippetsForLanguage(language);

            if (0 === snippets.length)
                return { suggestions: [] };

            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = snippets.map(snippet => ({
                label: snippet.prefix,
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: snippet.description || snippet.name,
                insertText: snippet.body,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `Snippet: ${snippet.name}`,
                range,
            }));

            return { suggestions };
        },
    });
}
