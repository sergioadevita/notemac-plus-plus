/**
 * EditorGlobals — Module-level references to the active Monaco editor and action handler.
 *
 * Replaces the previous `(window as any).__monacoEditor` / `__editorAction` pattern
 * with typed, module-scoped accessors. These references are set by EditorPanelViewPresenter
 * on mount and cleared on unmount.
 */

import type { editor } from 'monaco-editor';

type EditorActionFn = (action: string, value?: unknown) => void;

let monacoEditor: editor.IStandaloneCodeEditor | null = null;
let editorAction: EditorActionFn | null = null;

export function SetMonacoEditor(instance: editor.IStandaloneCodeEditor): void
{
    monacoEditor = instance;
}

export function GetMonacoEditor(): editor.IStandaloneCodeEditor | null
{
    return monacoEditor;
}

export function ClearMonacoEditor(): void
{
    monacoEditor = null;
}

export function SetEditorAction(action: EditorActionFn): void
{
    editorAction = action;
}

export function GetEditorAction(): EditorActionFn | null
{
    return editorAction;
}

export function ClearEditorAction(): void
{
    editorAction = null;
}
