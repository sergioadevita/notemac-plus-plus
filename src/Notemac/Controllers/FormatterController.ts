import { useNotemacStore } from '../Model/Store';
import { FormatDocument, FormatSelection, IsLanguageSupported } from '../Services/FormatterService';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

/**
 * FormatterController — Orchestrates code formatting operations.
 */

export async function FormatCurrentDocument(): Promise<boolean>
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return false;

    const model = editor.getModel();
    if (null === model)
        return false;

    const language = model.getLanguageId();
    if (!IsLanguageSupported(language))
        return false;

    const content = model.getValue();
    const formatted = await FormatDocument(content, language, GetFormatOptions());

    if (formatted !== content)
    {
        editor.executeEdits('format-document', [{
            range: model.getFullModelRange(),
            text: formatted,
        }]);
    }

    Dispatch(NOTEMAC_EVENTS.FORMAT_DOCUMENT, { language, success: true });
    return true;
}

export async function FormatCurrentSelection(): Promise<boolean>
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return false;

    const model = editor.getModel();
    if (null === model)
        return false;

    const selection = editor.getSelection();
    if (null === selection || selection.isEmpty())
        return false;

    const language = model.getLanguageId();
    if (!IsLanguageSupported(language))
        return false;

    const content = model.getValue();
    const startOffset = model.getOffsetAt(selection.getStartPosition());
    const endOffset = model.getOffsetAt(selection.getEndPosition());

    const formatted = await FormatSelection(content, startOffset, endOffset, language, GetFormatOptions());

    if (formatted !== content)
    {
        editor.executeEdits('format-selection', [{
            range: model.getFullModelRange(),
            text: formatted,
        }]);
    }

    return true;
}

export async function FormatOnSave(): Promise<void>
{
    const settings = useNotemacStore.getState().settings;
    if (!settings.formatOnSave)
        return;

    await FormatCurrentDocument();
}

export function IsFormatOnSaveEnabled(): boolean
{
    return useNotemacStore.getState().settings.formatOnSave;
}

export function ToggleFormatOnSave(): boolean
{
    const store = useNotemacStore.getState();
    const newValue = !store.settings.formatOnSave;
    store.updateSettings({ formatOnSave: newValue });
    return newValue;
}

function GetFormatOptions(): { tabWidth: number; useTabs: boolean }
{
    const settings = useNotemacStore.getState().settings;
    return {
        tabWidth: settings.tabSize,
        useTabs: !settings.insertSpaces,
    };
}
