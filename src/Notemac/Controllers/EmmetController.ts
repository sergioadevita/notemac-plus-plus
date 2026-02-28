import { useNotemacStore } from '../Model/Store';
import { ExpandAbbreviation, IsEmmetContext } from '../Services/EmmetService';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';

/**
 * EmmetController — Registers and manages Emmet abbreviation expansion.
 */

let completionDisposable: { dispose: () => void } | null = null;

export function IsEmmetEnabled(): boolean
{
    return useNotemacStore.getState().settings.emmetEnabled;
}

export function ToggleEmmet(): boolean
{
    const store = useNotemacStore.getState();
    const newValue = !store.settings.emmetEnabled;
    store.updateSettings({ emmetEnabled: newValue });
    return newValue;
}

export async function ExpandEmmetAbbreviation(): Promise<boolean>
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return false;

    const model = editor.getModel();
    if (null === model)
        return false;

    const language = model.getLanguageId();
    if (!IsEmmetContext(language))
        return false;

    if (!IsEmmetEnabled())
        return false;

    const position = editor.getPosition();
    if (null === position)
        return false;

    // Get the text before the cursor on the current line
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);

    // Find the abbreviation (last word-like sequence before cursor)
    const match = textBeforeCursor.match(/[\w.#>+*^()[\]{}@$!:%-]+$/);
    if (null === match)
        return false;

    const abbreviation = match[0];
    const expanded = await ExpandAbbreviation(abbreviation, language);

    if (expanded === abbreviation)
        return false;

    const startColumn = position.column - abbreviation.length;
    const monaco = (window as any).monaco;
    if (undefined === monaco || null === monaco)
        return false;

    editor.executeEdits('emmet-expand', [{
        range: new monaco.Range(
            position.lineNumber,
            startColumn,
            position.lineNumber,
            position.column,
        ),
        text: expanded,
    }]);

    return true;
}

export function RegisterEmmetCompletionProvider(monaco: any): { dispose: () => void } | null
{
    if (null !== completionDisposable)
        return completionDisposable;

    try
    {
        completionDisposable = monaco.languages.registerCompletionItemProvider(
            ['html', 'css', 'scss', 'less'],
            {
                triggerCharacters: ['>', '+', '^', '*', ')', ']', '}', '.', '#', ':'],
                provideCompletionItems: async (model: any, position: any) =>
                {
                    if (!IsEmmetEnabled())
                        return { suggestions: [] };

                    const language = model.getLanguageId();
                    if (!IsEmmetContext(language))
                        return { suggestions: [] };

                    const lineContent = model.getLineContent(position.lineNumber);
                    const textBeforeCursor = lineContent.substring(0, position.column - 1);
                    const match = textBeforeCursor.match(/[\w.#>+*^()[\]{}@$!:%-]+$/);

                    if (null === match)
                        return { suggestions: [] };

                    const abbreviation = match[0];

                    try
                    {
                        const expanded = await ExpandAbbreviation(abbreviation, language);
                        if (expanded === abbreviation)
                            return { suggestions: [] };

                        return {
                            suggestions: [{
                                label: `Emmet: ${abbreviation}`,
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: expanded,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column - abbreviation.length,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column,
                                },
                                detail: 'Emmet abbreviation',
                                documentation: expanded,
                            }],
                        };
                    }
                    catch
                    {
                        return { suggestions: [] };
                    }
                },
            },
        );

        return completionDisposable;
    }
    catch
    {
        return null;
    }
}

export function DisposeEmmetCompletionProvider(): void
{
    if (null !== completionDisposable)
    {
        completionDisposable.dispose();
        completionDisposable = null;
    }
}
