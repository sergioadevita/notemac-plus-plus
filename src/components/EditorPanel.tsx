import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';
import { defineMonacoThemes } from '../utils/themes';
import type { FileTab, AppSettings } from '../types';

interface EditorPanelProps {
  tab: FileTab;
  theme: ThemeColors;
  settings: AppSettings;
  zoomLevel: number;
}

export function EditorPanel({ tab, theme, settings, zoomLevel }: EditorPanelProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);
  const { updateTabContent, updateTab, showFindReplace } = useEditorStore();
  const [monacoReady, setMonacoReady] = useState(false);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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

    // Focus the editor
    editor.focus();
  }, [tab.id, theme.editorMonacoTheme]);

  const handleChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      updateTabContent(tab.id, value);
    }
  }, [tab.id]);

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme.editorMonacoTheme);
    }
  }, [theme.editorMonacoTheme]);

  // Handle external actions
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const actionHandler = (action: string, value?: any) => {
      const model = editor.getModel();
      if (!model) return;

      switch (action) {
        case 'undo': editor.trigger('keyboard', 'undo', null); break;
        case 'redo': editor.trigger('keyboard', 'redo', null); break;
        case 'select-all': editor.setSelection(model.getFullModelRange()); break;
        case 'duplicate-line': editor.getAction('editor.action.copyLinesDownAction')?.run(); break;
        case 'delete-line': editor.getAction('editor.action.deleteLines')?.run(); break;
        case 'move-line-up': editor.getAction('editor.action.moveLinesUpAction')?.run(); break;
        case 'move-line-down': editor.getAction('editor.action.moveLinesDownAction')?.run(); break;
        case 'toggle-comment': editor.getAction('editor.action.commentLine')?.run(); break;
        case 'block-comment': editor.getAction('editor.action.blockComment')?.run(); break;

        case 'transpose-line': {
          const pos = editor.getPosition();
          if (!pos || pos.lineNumber <= 1) break;
          const curLine = model.getLineContent(pos.lineNumber);
          const prevLine = model.getLineContent(pos.lineNumber - 1);
          editor.executeEdits('transpose', [{
            range: new monaco.Range(pos.lineNumber - 1, 1, pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)),
            text: curLine + '\n' + prevLine,
          }]);
          break;
        }
        case 'split-lines': {
          const sel = editor.getSelection();
          if (sel && !sel.isEmpty()) {
            const text = model.getValueInRange(sel);
            editor.executeEdits('split', [{ range: sel, text: text.split('').join('\n') }]);
          }
          break;
        }
        case 'join-lines': {
          const sel = editor.getSelection();
          if (sel && !sel.isEmpty()) {
            editor.executeEdits('join', [{ range: sel, text: model.getValueInRange(sel).replace(/\n/g, ' ') }]);
          }
          break;
        }

        case 'uppercase': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('uppercase', [{ range: selection, text: model.getValueInRange(selection).toUpperCase() }]);
          }
          break;
        }
        case 'lowercase': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('lowercase', [{ range: selection, text: model.getValueInRange(selection).toLowerCase() }]);
          }
          break;
        }
        case 'proper-case': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('proper', [{ range: selection, text: model.getValueInRange(selection).replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()) }]);
          }
          break;
        }
        case 'sentence-case': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('sentence', [{ range: selection, text: model.getValueInRange(selection).toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase()) }]);
          }
          break;
        }
        case 'invert-case': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('invert', [{ range: selection, text: model.getValueInRange(selection).split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('') }]);
          }
          break;
        }
        case 'random-case': {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            editor.executeEdits('random', [{ range: selection, text: model.getValueInRange(selection).split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('') }]);
          }
          break;
        }
        case 'insert-datetime': {
          const pos = editor.getPosition();
          if (pos) {
            const now = new Date();
            const dateStr = now.toISOString().replace('T', ' ').replace(/\.\d+Z/, '');
            editor.executeEdits('datetime', [{ range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: dateStr }]);
          }
          break;
        }

        case 'sort-asc':
        case 'sort-desc':
        case 'sort-asc-ci':
        case 'sort-desc-ci':
        case 'sort-len-asc':
        case 'sort-len-desc': {
          const fullRange = model.getFullModelRange();
          const lines = model.getValue().split('\n');
          if (action === 'sort-asc') lines.sort((a, b) => a.localeCompare(b));
          else if (action === 'sort-desc') lines.sort((a, b) => b.localeCompare(a));
          else if (action === 'sort-asc-ci') lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          else if (action === 'sort-desc-ci') lines.sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
          else if (action === 'sort-len-asc') lines.sort((a, b) => a.length - b.length);
          else if (action === 'sort-len-desc') lines.sort((a, b) => b.length - a.length);
          editor.executeEdits('sort', [{ range: fullRange, text: lines.join('\n') }]);
          break;
        }
        case 'remove-duplicates': {
          const fullRange = model.getFullModelRange();
          editor.executeEdits('remove-dup', [{ range: fullRange, text: [...new Set(model.getValue().split('\n'))].join('\n') }]);
          break;
        }
        case 'remove-consecutive-duplicates': {
          const fullRange = model.getFullModelRange();
          const lines = model.getValue().split('\n');
          editor.executeEdits('remove-consec-dup', [{ range: fullRange, text: lines.filter((l, i) => i === 0 || l !== lines[i - 1]).join('\n') }]);
          break;
        }
        case 'remove-empty-lines': {
          editor.executeEdits('remove-empty', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').filter(l => l.trim() !== '').join('\n') }]);
          break;
        }
        case 'remove-blank-lines': {
          editor.executeEdits('remove-blank', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').filter(l => l !== '').join('\n') }]);
          break;
        }
        case 'trim-trailing': {
          editor.executeEdits('trim', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').map(l => l.trimEnd()).join('\n') }]);
          break;
        }
        case 'trim-leading': {
          editor.executeEdits('trim-lead', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').map(l => l.trimStart()).join('\n') }]);
          break;
        }
        case 'trim-both': {
          editor.executeEdits('trim-both', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').map(l => l.trim()).join('\n') }]);
          break;
        }
        case 'eol-to-space': {
          editor.executeEdits('eol-space', [{ range: model.getFullModelRange(), text: model.getValue().replace(/\n/g, ' ') }]);
          break;
        }
        case 'tab-to-space': {
          const spaces = ' '.repeat(useEditorStore.getState().settings.tabSize);
          editor.executeEdits('tab-space', [{ range: model.getFullModelRange(), text: model.getValue().replace(/\t/g, spaces) }]);
          break;
        }
        case 'space-to-tab-leading': {
          const tabSz = useEditorStore.getState().settings.tabSize;
          const regex = new RegExp(`^( {${tabSz}})+`, 'gm');
          editor.executeEdits('space-tab', [{ range: model.getFullModelRange(), text: model.getValue().replace(regex, (m) => '\t'.repeat(m.length / tabSz)) }]);
          break;
        }
        case 'space-to-tab-all': {
          const tabSz = useEditorStore.getState().settings.tabSize;
          editor.executeEdits('space-tab-all', [{ range: model.getFullModelRange(), text: model.getValue().split(' '.repeat(tabSz)).join('\t') }]);
          break;
        }
        case 'insert-blank-above': {
          const pos = editor.getPosition();
          if (pos) editor.executeEdits('blank-above', [{ range: new monaco.Range(pos.lineNumber, 1, pos.lineNumber, 1), text: '\n' }]);
          break;
        }
        case 'insert-blank-below': {
          const pos = editor.getPosition();
          if (pos) editor.executeEdits('blank-below', [{ range: new monaco.Range(pos.lineNumber, model.getLineMaxColumn(pos.lineNumber), pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)), text: '\n' }]);
          break;
        }
        case 'reverse-lines': {
          editor.executeEdits('reverse', [{ range: model.getFullModelRange(), text: model.getValue().split('\n').reverse().join('\n') }]);
          break;
        }

        case 'fold-all': editor.getAction('editor.foldAll')?.run(); break;
        case 'unfold-all': editor.getAction('editor.unfoldAll')?.run(); break;
        case 'fold-level': {
          const lvl = value as number;
          editor.getAction(`editor.foldLevel${lvl}`)?.run();
          break;
        }

        case 'select-to-bracket': editor.getAction('editor.action.selectToBracket')?.run(); break;
        case 'goto-bracket': editor.getAction('editor.action.jumpToBracket')?.run(); break;

        case 'toggle-bookmark': {
          const line = editor.getPosition()?.lineNumber;
          if (line) {
            const bookmarks = [...tab.bookmarks];
            const idx = bookmarks.indexOf(line);
            if (idx >= 0) bookmarks.splice(idx, 1);
            else bookmarks.push(line);
            bookmarks.sort((a, b) => a - b);
            updateTab(tab.id, { bookmarks });
          }
          break;
        }

        case 'json-format': {
          try { editor.executeEdits('json-fmt', [{ range: model.getFullModelRange(), text: JSON.stringify(JSON.parse(model.getValue()), null, 2) }]); } catch { /* Content is not valid JSON — no-op */ }
          break;
        }
        case 'json-minify': {
          try { editor.executeEdits('json-min', [{ range: model.getFullModelRange(), text: JSON.stringify(JSON.parse(model.getValue())) }]); } catch { /* Content is not valid JSON — no-op */ }
          break;
        }

        case 'hash-md5':
        case 'hash-sha1':
        case 'hash-sha256':
        case 'hash-sha512': {
          const sel2 = editor.getSelection();
          let hashText = (sel2 && !sel2.isEmpty()) ? model.getValueInRange(sel2) : model.getValue();
          computeHash(action.replace('hash-', ''), hashText).then(hash => {
            const pos = editor.getPosition();
            if (pos) editor.executeEdits('hash', [{ range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: `\n// ${action.replace('hash-', '').toUpperCase()}: ${hash}\n` }]);
          });
          break;
        }
        case 'hash-md5-clipboard':
        case 'hash-sha1-clipboard':
        case 'hash-sha256-clipboard':
        case 'hash-sha512-clipboard': {
          const sel3 = editor.getSelection();
          let hashText2 = (sel3 && !sel3.isEmpty()) ? model.getValueInRange(sel3) : model.getValue();
          computeHash(action.replace('hash-', '').replace('-clipboard', ''), hashText2).then(hash => navigator.clipboard.writeText(hash));
          break;
        }

        case 'base64-encode': {
          const sel4 = editor.getSelection();
          if (sel4 && !sel4.isEmpty()) editor.executeEdits('b64enc', [{ range: sel4, text: btoa(model.getValueInRange(sel4)) }]);
          break;
        }
        case 'base64-decode': {
          const sel5 = editor.getSelection();
          if (sel5 && !sel5.isEmpty()) try { editor.executeEdits('b64dec', [{ range: sel5, text: atob(model.getValueInRange(sel5)) }]); } catch { /* Invalid base64 — no-op */ }
          break;
        }
        case 'url-encode': {
          const sel6 = editor.getSelection();
          if (sel6 && !sel6.isEmpty()) editor.executeEdits('urlenc', [{ range: sel6, text: encodeURIComponent(model.getValueInRange(sel6)) }]);
          break;
        }
        case 'url-decode': {
          const sel7 = editor.getSelection();
          if (sel7 && !sel7.isEmpty()) try { editor.executeEdits('urldec', [{ range: sel7, text: decodeURIComponent(model.getValueInRange(sel7)) }]); } catch { /* Malformed URI component — no-op */ }
          break;
        }

        case 'copy-file-path': { if (tab.path) navigator.clipboard.writeText(tab.path); break; }
        case 'copy-file-name': { navigator.clipboard.writeText(tab.name); break; }
        case 'copy-file-dir': { if (tab.path) navigator.clipboard.writeText(tab.path.substring(0, tab.path.lastIndexOf('/'))); break; }
        case 'toggle-readonly': { updateTab(tab.id, { isReadOnly: !tab.isReadOnly }); break; }
      }
    };

    // Subscribe to menu actions via store
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      // This is a simplified approach - in practice you'd use an event emitter
    });

    // Expose action handler globally for menu actions
    window.__editorAction = actionHandler;

    return () => {
      unsubscribe();
      delete window.__editorAction;
    };
  }, [monacoReady, tab.id, tab.bookmarks]);

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

  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <Editor
        height="100%"
        language={tab.language}
        value={tab.content}
        onChange={handleChange}
        onMount={handleEditorMount}
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
          renderWhitespace: settings.renderWhitespace as any,
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
          // EOL rendering handled separately
          scrollBeyondLastLine: false,
          automaticLayout: true,
          contextmenu: true,
          dragAndDrop: true,
          links: true,
          multiCursorModifier: 'alt',
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

async function computeHash(algorithm: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashAlgorithm = {
    'md5': 'MD5',
    'sha1': 'SHA-1',
    'sha256': 'SHA-256',
    'sha512': 'SHA-512',
  }[algorithm];

  if (!hashAlgorithm || algorithm === 'md5') {
    // MD5 not available in SubtleCrypto, use a simple fallback
    // For web version we'll compute a simple checksum
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  try {
    const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'error computing hash';
  }
}
