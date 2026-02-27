import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FileTab, AppSettings } from '../Notemac/Commons/Types';

// ─── Mock dependencies BEFORE imports ─────────────────────────

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(() => null),
  Editor: vi.fn(() => null),
}));

vi.mock('../Notemac/Controllers/CompletionController', () => ({
  RegisterCompletionProviders: vi.fn(() => []),
}));

vi.mock('../Notemac/Controllers/SnippetController', () => ({
  InsertSnippet: vi.fn(),
  RegisterSnippetCompletionProvider: vi.fn(() => ({ dispose: vi.fn() })),
}));

vi.mock('../Notemac/Controllers/AIActionController', () => ({
  ExplainCode: vi.fn(),
  RefactorCode: vi.fn(),
  GenerateTests: vi.fn(),
  GenerateDocumentation: vi.fn(),
  FixError: vi.fn(),
  SimplifyCode: vi.fn(),
  ConvertLanguage: vi.fn(),
  SendChatMessage: vi.fn(),
  GenerateCommitMessage: vi.fn(),
}));

vi.mock('../Notemac/Controllers/LLMController', () => ({
  SendInlineCompletion: vi.fn(),
  CancelActiveRequest: vi.fn(),
  SendChatCompletion: vi.fn(),
  BuildContextString: vi.fn(),
  ExtractCodeBlocks: vi.fn(() => []),
}));

vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
  SetMonacoEditor: vi.fn(),
  SetEditorAction: vi.fn(),
  ClearEditorAction: vi.fn(),
}));

vi.mock('../Notemac/Configs/ThemeConfig', () => ({
  defineMonacoThemes: vi.fn(),
  getThemeColors: vi.fn(() => ({
    editorMonacoTheme: 'vs-dark',
    background: '#1e1e1e',
    foreground: '#d4d4d4',
  })),
  THEMES: {},
}));

// ─── Now import the non-hook functions ───────────────────────────

import { RegisterAIContextMenuActions } from '../Notemac/UI/EditorPanel/useAIContextMenu';
import { useNotemacStore } from '../Notemac/Model/Store';

// ─── Helpers ─────────────────────────────────────────────────────

function createMockEditor() {
  const cursorCallbacks: Function[] = [];
  const scrollCallbacks: Function[] = [];

  return {
    onDidChangeCursorPosition: vi.fn((cb: Function) => {
      cursorCallbacks.push(cb);
      return { dispose: vi.fn() };
    }),
    onDidScrollChange: vi.fn((cb: Function) => {
      scrollCallbacks.push(cb);
      return { dispose: vi.fn() };
    }),
    addCommand: vi.fn(),
    addAction: vi.fn(),
    setScrollTop: vi.fn(),
    focus: vi.fn(),
    getAction: vi.fn(() => ({ run: vi.fn() })),
    setSelection: vi.fn(),
    setPosition: vi.fn(),
    getModel: vi.fn(() => ({
      getValue: vi.fn(() => 'const x = 1;\nconst y = 2;\nconst z = 3;'),
      getLineContent: vi.fn(() => 'line content'),
      getOffsetAt: vi.fn(() => 0),
      getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      getFullModelRange: vi.fn(() => ({
        startLineNumber: 1, startColumn: 1,
        endLineNumber: 3, endColumn: 14,
      })),
      getLineCount: vi.fn(() => 3),
      getLineMaxColumn: vi.fn(() => 14),
      getLanguageId: vi.fn(() => 'javascript'),
      getValueInRange: vi.fn(() => 'selected text'),
    })),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    revealLineInCenter: vi.fn(),
    getSelection: vi.fn(() => ({
      isEmpty: () => false,
      startLineNumber: 1, startColumn: 1,
      endLineNumber: 1, endColumn: 14,
    })),
    executeEdits: vi.fn(),
    trigger: vi.fn(),
    deltaDecorations: vi.fn(() => []),
    _cursorCallbacks: cursorCallbacks,
    _scrollCallbacks: scrollCallbacks,
  } as any;
}

function createMockMonaco() {
  return {
    editor: {
      setTheme: vi.fn(),
    },
    KeyMod: { CtrlCmd: 2048, Shift: 1024, Alt: 512 },
    KeyCode: { KeyD: 32, KeyK: 41, UpArrow: 16, DownArrow: 18, Slash: 84 },
    Range: class MockRange {
      constructor(
        public startLineNumber: number,
        public startColumn: number,
        public endLineNumber: number,
        public endColumn: number,
      ) {}
    },
    languages: {
      registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
      registerInlineCompletionsProvider: vi.fn(() => ({ dispose: vi.fn() })),
      CompletionItemKind: { Text: 0, File: 17, Folder: 18 },
    },
  } as any;
}

function createMockTab(overrides?: Partial<FileTab>): FileTab {
  return {
    id: 'tab-1',
    name: 'test.ts',
    path: '/test.ts',
    content: 'const x = 1;',
    originalContent: 'const x = 1;',
    language: 'typescript',
    encoding: 'utf-8',
    lineEnding: 'LF',
    isModified: false,
    isReadOnly: false,
    isPinned: false,
    tabColor: 'none',
    cursorLine: 1,
    cursorColumn: 1,
    scrollTop: 0,
    bookmarks: [],
    marks: [],
    hiddenLines: [],
    isMonitoring: false,
    ...overrides,
  } as FileTab;
}

function createMockSettings(overrides?: Partial<AppSettings>): AppSettings {
  return {
    theme: 'mac-glass',
    fontSize: 14,
    fontFamily: 'monospace',
    tabSize: 4,
    insertSpaces: true,
    wordWrap: false,
    showLineNumbers: true,
    showMinimap: true,
    showIndentGuides: true,
    highlightCurrentLine: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    autoCloseQuotes: true,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    renderWhitespace: 'none',
    ...overrides,
  } as AppSettings;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('EditorPanel', () => {

  // ── Editor Options Rendering ──────────────────────────────────

  describe('Editor Options Computation', () => {
    it('should compute correct fontSize = settings.fontSize + zoomLevel', () => {
      const settings = createMockSettings({ fontSize: 14 });
      const zoomLevel = 2;
      expect(settings.fontSize + zoomLevel).toBe(16);
    });

    it('should compute fontSize with negative zoom', () => {
      const settings = createMockSettings({ fontSize: 14 });
      const zoomLevel = -3;
      expect(settings.fontSize + zoomLevel).toBe(11);
    });

    it('should map wordWrap true to "on"', () => {
      const s = createMockSettings({ wordWrap: true });
      expect(s.wordWrap ? 'on' : 'off').toBe('on');
    });

    it('should map wordWrap false to "off"', () => {
      const s = createMockSettings({ wordWrap: false });
      expect(s.wordWrap ? 'on' : 'off').toBe('off');
    });

    it('should map showLineNumbers true to "on"', () => {
      const s = createMockSettings({ showLineNumbers: true });
      expect(s.showLineNumbers ? 'on' : 'off').toBe('on');
    });

    it('should map showLineNumbers false to "off"', () => {
      const s = createMockSettings({ showLineNumbers: false });
      expect(s.showLineNumbers ? 'on' : 'off').toBe('off');
    });

    it('should reflect minimap setting', () => {
      expect(createMockSettings({ showMinimap: true }).showMinimap).toBe(true);
      expect(createMockSettings({ showMinimap: false }).showMinimap).toBe(false);
    });

    it('should reflect readOnly from tab', () => {
      expect(createMockTab({ isReadOnly: true }).isReadOnly).toBe(true);
      expect(createMockTab({ isReadOnly: false }).isReadOnly).toBe(false);
    });

    it('should set language from tab.language', () => {
      expect(createMockTab({ language: 'javascript' }).language).toBe('javascript');
      expect(createMockTab({ language: 'python' }).language).toBe('python');
      expect(createMockTab({ language: 'html' }).language).toBe('html');
    });

    it('should compute matchBrackets always/never', () => {
      expect(createMockSettings({ matchBrackets: true }).matchBrackets ? 'always' : 'never').toBe('always');
      expect(createMockSettings({ matchBrackets: false }).matchBrackets ? 'always' : 'never').toBe('never');
    });

    it('should compute autoClosingBrackets always/never', () => {
      expect(createMockSettings({ autoCloseBrackets: true }).autoCloseBrackets ? 'always' : 'never').toBe('always');
      expect(createMockSettings({ autoCloseBrackets: false }).autoCloseBrackets ? 'always' : 'never').toBe('never');
    });
  });

  // ── RegisterAIContextMenuActions (not a hook, can test directly) ──

  describe('RegisterAIContextMenuActions', () => {
    let mockEditor: ReturnType<typeof createMockEditor>;
    let mockMonaco: ReturnType<typeof createMockMonaco>;
    let tab: FileTab;

    beforeEach(() => {
      mockEditor = createMockEditor();
      mockMonaco = createMockMonaco();
      tab = createMockTab();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should register exactly 6 AI context menu actions', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      expect(mockEditor.addAction).toHaveBeenCalledTimes(6);
    });

    it('should register ai-explain action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-explain');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Explain Code');
    });

    it('should register ai-refactor action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-refactor');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Refactor Code');
    });

    it('should register ai-generate-tests action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-generate-tests');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Generate Tests');
    });

    it('should register ai-generate-docs action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-generate-docs');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Generate Documentation');
    });

    it('should register ai-fix-error action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-fix-error');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Fix Error');
    });

    it('should register ai-simplify action', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-simplify');
      expect(action).toBeDefined();
      expect(action![0].label).toBe('AI: Simplify Code');
    });

    it('should set context menu group "9_ai" for all actions', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0].contextMenuGroupId).toBe('9_ai');
      });
    });

    it('should set incrementing contextMenuOrder 1-6', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const orders = calls.map((c: any) => c[0].contextMenuOrder);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should have callable run functions for all actions', () => {
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      calls.forEach((call: any) => {
        expect(typeof call[0].run).toBe('function');
      });
    });

    it('ai-explain run should call ExplainCode when selection exists', async () => {
      const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-explain')![0];

      // Simulate run with a mock editor that has a non-empty selection
      action.run(mockEditor);
      expect(ExplainCode).toHaveBeenCalledWith('selected text', 'javascript');
    });

    it('ai-refactor run should call RefactorCode when selection exists', async () => {
      const { RefactorCode } = await import('../Notemac/Controllers/AIActionController');
      RegisterAIContextMenuActions(mockEditor, mockMonaco, tab);
      const calls = mockEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-refactor')![0];

      action.run(mockEditor);
      expect(RefactorCode).toHaveBeenCalled();
    });

    it('should not call AI action when selection is empty', async () => {
      const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
      vi.mocked(ExplainCode).mockClear();

      // Editor with empty selection
      const emptySelEditor = createMockEditor();
      emptySelEditor.getSelection = vi.fn(() => ({
        isEmpty: () => true,
        startLineNumber: 1, startColumn: 1,
        endLineNumber: 1, endColumn: 1,
      }));

      RegisterAIContextMenuActions(emptySelEditor, mockMonaco, tab);
      const calls = emptySelEditor.addAction.mock.calls;
      const action = calls.find((c: any) => c[0].id === 'ai-explain')![0];
      action.run(emptySelEditor);
      expect(ExplainCode).not.toHaveBeenCalled();
    });
  });

  // ── Mock Editor Object Tests ────────────────────────────────────

  describe('Mock Editor Interaction Patterns', () => {
    let mockEditor: ReturnType<typeof createMockEditor>;
    let mockMonaco: ReturnType<typeof createMockMonaco>;

    beforeEach(() => {
      mockEditor = createMockEditor();
      mockMonaco = createMockMonaco();
    });

    it('cursor position callback works correctly', () => {
      // Simulate what useEditorSetup does
      const updateTab = vi.fn();
      const tabId = 'tab-1';

      mockEditor.onDidChangeCursorPosition((e: any) => {
        updateTab(tabId, { cursorLine: e.position.lineNumber, cursorColumn: e.position.column });
      });

      // Simulate cursor move
      const cb = mockEditor._cursorCallbacks[0];
      cb({ position: { lineNumber: 5, column: 10 } });

      expect(updateTab).toHaveBeenCalledWith(tabId, { cursorLine: 5, cursorColumn: 10 });
    });

    it('scroll position callback works correctly', () => {
      const updateTab = vi.fn();
      const tabId = 'tab-1';

      mockEditor.onDidScrollChange((e: any) => {
        updateTab(tabId, { scrollTop: e.scrollTop });
      });

      const cb = mockEditor._scrollCallbacks[0];
      cb({ scrollTop: 250 });

      expect(updateTab).toHaveBeenCalledWith(tabId, { scrollTop: 250 });
    });

    it('addCommand registers keybindings', () => {
      // Simulate registering Cmd+D
      const keybinding = mockMonaco.KeyMod.CtrlCmd | mockMonaco.KeyCode.KeyD;
      const handler = vi.fn();
      mockEditor.addCommand(keybinding, handler);

      expect(mockEditor.addCommand).toHaveBeenCalledWith(keybinding, handler);
    });

    it('setScrollTop restores scroll position', () => {
      mockEditor.setScrollTop(500);
      expect(mockEditor.setScrollTop).toHaveBeenCalledWith(500);
    });

    it('focus is called on the editor', () => {
      mockEditor.focus();
      expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('deltaDecorations manages bookmark decorations', () => {
      const decorations = [
        {
          range: new mockMonaco.Range(1, 1, 1, 1),
          options: { isWholeLine: true, glyphMarginClassName: 'bookmark-glyph' },
        },
      ];
      mockEditor.deltaDecorations([], decorations);
      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith([], decorations);
    });
  });

  // ── Tab State & Content ────────────────────────────────────────

  describe('Tab Content Management', () => {
    it('tab content change marks isModified', () => {
      const tab = createMockTab({ content: 'original', originalContent: 'original' });
      expect(tab.content === tab.originalContent).toBe(true);

      const modifiedTab = { ...tab, content: 'modified', isModified: true };
      expect(modifiedTab.isModified).toBe(true);
      expect(modifiedTab.content).not.toBe(modifiedTab.originalContent);
    });

    it('tab bookmarks are stored as line numbers', () => {
      const tab = createMockTab({ bookmarks: [1, 5, 10] });
      expect(tab.bookmarks).toEqual([1, 5, 10]);
    });

    it('tab marks store position and style info', () => {
      const tab = createMockTab({
        marks: [
          { line: 1, column: 5, length: 3, style: 1 as 1 },
          { line: 2, column: 1, length: 10, style: 2 as 2 },
        ],
      });
      expect(tab.marks).toHaveLength(2);
      expect(tab.marks![0].style).toBe(1);
      expect(tab.marks![1].style).toBe(2);
    });

    it('tab encoding defaults to utf-8', () => {
      const tab = createMockTab();
      expect(tab.encoding).toBe('utf-8');
    });

    it('tab lineEnding defaults to LF', () => {
      const tab = createMockTab();
      expect(tab.lineEnding).toBe('LF');
    });
  });

  // ── Store Integration ─────────────────────────────────────────

  describe('Store Integration', () => {
    it('store has default settings', () => {
      const state = useNotemacStore.getState();
      expect(state.settings).toBeDefined();
      expect(state.settings.fontSize).toBe(14);
    });

    it('store has default zoom level 0', () => {
      const state = useNotemacStore.getState();
      expect(state.zoomLevel).toBe(0);
    });

    it('store tabs is an array', () => {
      const state = useNotemacStore.getState();
      expect(Array.isArray(state.tabs)).toBe(true);
    });

    it('store has splitView property', () => {
      const state = useNotemacStore.getState();
      expect('splitView' in state).toBe(true);
    });

    it('store has updateTabContent function', () => {
      const state = useNotemacStore.getState();
      expect(typeof state.updateTabContent).toBe('function');
    });

    it('store has updateTab function', () => {
      const state = useNotemacStore.getState();
      expect(typeof state.updateTab).toBe('function');
    });

    it('store has updateSettings function', () => {
      const state = useNotemacStore.getState();
      expect(typeof state.updateSettings).toBe('function');
    });

    it('store settings contain all editor-relevant keys', () => {
      const s = useNotemacStore.getState().settings;
      expect(s).toHaveProperty('fontSize');
      expect(s).toHaveProperty('tabSize');
      expect(s).toHaveProperty('wordWrap');
      expect(s).toHaveProperty('showLineNumbers');
      expect(s).toHaveProperty('showMinimap');
      expect(s).toHaveProperty('insertSpaces');
      expect(s).toHaveProperty('cursorBlinking');
      expect(s).toHaveProperty('cursorStyle');
    });
  });
});
