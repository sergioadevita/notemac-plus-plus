import { useCallback } from 'react';
import type { editor } from 'monaco-editor';
import type { OnMount } from '@monaco-editor/react';
import type { ThemeColors } from "../../Configs/ThemeConfig";
import { defineMonacoThemes } from "../../Configs/ThemeConfig";
import type { FileTab } from "../../Commons/Types";
import { RegisterCompletionProviders } from "../../Controllers/CompletionController";
import { SetMonacoEditor } from '../../../Shared/Helpers/EditorGlobals';

interface IDisposable {
  dispose: () => void;
}

const completionDisposablesMap = new WeakMap<editor.IStandaloneCodeEditor, IDisposable[]>();

/**
 * useEditorSetup - Custom hook for editor initialization and configuration
 *
 * Handles:
 * - Monaco editor mount and initialization
 * - Theme application
 * - Cursor and scroll position tracking
 * - Built-in keyboard shortcuts (copy, duplicate, delete, move, comment)
 * - Scroll restoration
 * - Completion provider registration
 */
export function useEditorSetup(
  tab: FileTab,
  theme: ThemeColors,
  updateTab: (tabId: string, updates: Partial<FileTab>) => void,
  setMonacoReady: (ready: boolean) => void,
): OnMount {
  return useCallback<OnMount>(
    (editor, monaco) => {
      // Define custom themes
      defineMonacoThemes(monaco);

      // Set the theme
      monaco.editor.setTheme(theme.editorMonacoTheme);

      setMonacoReady(true);

      // Cursor position tracking
      editor.onDidChangeCursorPosition((e) => {
        updateTab(tab.id, {
          cursorLine: e.position.lineNumber,
          cursorColumn: e.position.column,
        });
      });

      // Scroll position tracking
      editor.onDidScrollChange((e) => {
        updateTab(tab.id, { scrollTop: e.scrollTop });
      });

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        editor.getAction('editor.action.copyLinesDownAction')?.run();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
        editor.getAction('editor.action.deleteLines')?.run();
      });

      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        editor.getAction('editor.action.moveLinesUpAction')?.run();
      });

      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.getAction('editor.action.moveLinesDownAction')?.run();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        editor.getAction('editor.action.commentLine')?.run();
      });

      // Restore scroll position
      if (tab.scrollTop) {
        editor.setScrollTop(tab.scrollTop);
      }

      // Expose editor reference for AI chat "Insert" button
      SetMonacoEditor(editor);

      // Register custom completion providers (IntelliSense)
      const completionDisposables = RegisterCompletionProviders(monaco, editor);
      completionDisposablesMap.set(editor, completionDisposables);

      // Focus the editor
      editor.focus();
    },
    [tab.id, tab.scrollTop, theme.editorMonacoTheme, updateTab, setMonacoReady]
  );
}

/**
 * Clean up completion provider disposables
 */
export function cleanupCompletionDisposables(editor: editor.IStandaloneCodeEditor | null): void {
  if (!editor) return;
  const disposables = completionDisposablesMap.get(editor);
  if (disposables) {
    for (const d of disposables) {
      d?.dispose?.();
    }
  }
}
