import { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { FileTab, AppSettings } from "../Commons/Types";
import { Subscribe, Unsubscribe, NOTEMAC_EVENTS } from "../../Shared/EventDispatcher/EventDispatcher";
import { InsertSnippet } from "../Controllers/SnippetController";
import { useEditorSetup, cleanupCompletionDisposables } from './EditorPanel/useEditorSetup';
import { useEditorEvents } from './EditorPanel/useEditorEvents';
import { useEditorActions, registerActionHandler, unregisterActionHandler } from './EditorPanel/useEditorActions';
import { useMacroPlayback } from './EditorPanel/useMacroPlayback';
import { RegisterAIContextMenuActions } from './EditorPanel/useAIContextMenu';

interface EditorPanelProps {
  tab: FileTab;
  theme: ThemeColors;
  settings: AppSettings;
  zoomLevel: number;
}

export function EditorPanel({ tab, theme, settings, zoomLevel }: EditorPanelProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const { updateTabContent, updateTab } = useNotemacStore();
  const [monacoReady, setMonacoReady] = useState(false);

  const handleEditorMount = useEditorSetup(
    tab,
    theme,
    updateTab,
    setMonacoReady
  );

  const handleChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      updateTabContent(tab.id, value);
    }
  }, [tab.id, updateTabContent]);

  // Setup macro playback handler
  const macroPlaybackHandler = useMacroPlayback(editorRef.current);

  // Setup editor actions handler
  const actionHandler = useEditorActions(
    editorRef.current,
    monacoRef.current,
    tab,
    settings,
    updateTab,
    updateTabContent,
    monacoReady,
    macroPlaybackHandler,
  );

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme.editorMonacoTheme);
    }
  }, [theme.editorMonacoTheme]);

  // Snippet insertion handler
  useEffect(() => {
    const handleSnippetInsert = (data: { body: string }) => {
      if (editorRef.current && data?.body) {
        InsertSnippet(editorRef.current, data.body);
        editorRef.current.focus();
      }
    };
    Subscribe(NOTEMAC_EVENTS.INSERT_SNIPPET, handleSnippetInsert);
    return () => Unsubscribe(NOTEMAC_EVENTS.INSERT_SNIPPET, handleSnippetInsert);
  }, []);

  // Cleanup completion providers on unmount
  useEffect(() => {
    return () => {
      cleanupCompletionDisposables(editorRef.current);
    };
  }, []);

  // Custom event listeners for find, replace, mark, go-to-line, column-edit
  // Must be called at top level (React hook)
  useEditorEvents(editorRef.current, monacoRef.current, tab, updateTab);

  // Handle external actions
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    registerActionHandler(actionHandler);

    // Register AI context menu actions
    RegisterAIContextMenuActions(editor, monaco, tab);

    return () => {
      unregisterActionHandler();
    };
  }, [monacoReady, tab.id, tab.bookmarks, tab.marks, actionHandler, updateTab]);

  // Update bookmark decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !monacoReady) return;

    const decorations = tab.bookmarks.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: 'bookmark-decoration',
        glyphMarginClassName: 'bookmark-glyph',
        overviewRuler: {
          color: '#007acc',
          position: 1,
        },
      },
    }));

    const ids = editor.deltaDecorations([], decorations);
    return () => {
      editor.deltaDecorations(ids, []);
    };
  }, [tab.bookmarks, monacoReady]);

  // Handle editor mount
  const handleEditorMountWrapper: typeof handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    handleEditorMount(editor, monaco);
  }, [handleEditorMount]);

  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <Editor
        height="100%"
        language={tab.language}
        value={tab.content}
        onChange={handleChange}
        onMount={handleEditorMountWrapper}
        theme={theme.editorMonacoTheme}
        options={{
          fontSize: settings.fontSize + zoomLevel,
          fontFamily: settings.fontFamily,
          tabSize: settings.tabSize,
          insertSpaces: settings.insertSpaces,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          lineNumbers: settings.showLineNumbers ? 'on' : 'off',
          minimap: {
            enabled: settings.showMinimap,
            scale: 1,
            showSlider: 'mouseover',
          },
          renderWhitespace: settings.renderWhitespace,
          guides: {
            indentation: settings.showIndentGuides,
            bracketPairs: true,
          },
          cursorBlinking: settings.cursorBlinking,
          cursorStyle: settings.cursorStyle,
          smoothScrolling: settings.smoothScrolling,
          bracketPairColorization: { enabled: true },
          matchBrackets: settings.matchBrackets ? 'always' : 'never',
          autoClosingBrackets: settings.autoCloseBrackets ? 'always' : 'never',
          autoClosingQuotes: settings.autoCloseQuotes ? 'always' : 'never',
          renderLineHighlight: settings.highlightCurrentLine ? 'all' : 'none',
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          glyphMargin: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          contextmenu: true,
          dragAndDrop: true,
          links: true,
          multiCursorModifier: 'alt',
          inlineSuggest: { enabled: true },
          snippetSuggestions: 'top',
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: 'currentDocument',
          padding: { top: 8 },
          readOnly: tab.isReadOnly,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: false,
          colorDecorators: true,
          columnSelection: true,
          copyWithSyntaxHighlighting: true,
          emptySelectionClipboard: true,
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always',
          },
        }}
        loading={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.textMuted,
          }}>
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
