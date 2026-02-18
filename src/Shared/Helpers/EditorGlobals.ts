/**
 * EditorGlobals — Module-level references to the active Monaco editor and action handler.
 *
 * Replaces the previous `(window as any).__monacoEditor` / `__editorAction` pattern
 * with typed, module-scoped accessors. These references are set by EditorPanelViewPresenter
 * on mount and cleared on unmount.
 */

let monacoEditor: any = null;
let editorAction: any = null;

export function SetMonacoEditor(editor: any): void
{
    monacoEditor = editor;
}

export function GetMonacoEditor(): any
{
    return monacoEditor;
}

export function ClearMonacoEditor(): void
{
    monacoEditor = null;
}

export function SetEditorAction(action: any): void
{
    editorAction = action;
}

export function GetEditorAction(): any
{
    return editorAction;
}

export function ClearEditorAction(): void
{
    editorAction = null;
}
