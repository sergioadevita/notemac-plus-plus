import { create } from 'zustand';
import { produce } from 'immer';
import type { FileTab, FileTreeNode, MacroAction, SavedMacro, SearchOptions, AppSettings, SidebarPanel, ClipboardEntry, SessionData, TabColor, FindResult } from '../types';
import { detectLanguage, generateId } from '../utils/helpers';

interface EditorState {
  // Tabs
  tabs: FileTab[];
  activeTabId: string | null;
  closedTabs: FileTab[]; // for restore last closed

  // UI
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;
  showStatusBar: boolean;
  showToolbar: boolean;
  splitView: 'none' | 'horizontal' | 'vertical';
  splitTabId: string | null;

  // Search
  showFindReplace: boolean;
  findReplaceMode: 'find' | 'replace' | 'findInFiles' | 'mark';
  searchOptions: SearchOptions;
  searchResults: FindResult[];
  showIncrementalSearch: boolean;

  // Macros
  isRecordingMacro: boolean;
  currentMacroActions: MacroAction[];
  savedMacros: SavedMacro[];

  // File explorer
  fileTree: FileTreeNode[];
  workspacePath: string | null;

  // Settings
  settings: AppSettings;

  // Dialogs
  showSettings: boolean;
  showGoToLine: boolean;
  showAbout: boolean;
  showRunCommand: boolean;
  showColumnEditor: boolean;
  showSummary: boolean;
  showCharInRange: boolean;
  showShortcutMapper: boolean;

  // Zoom
  zoomLevel: number;

  // Recent files
  recentFiles: { path: string; name: string }[];

  // Clipboard history
  clipboardHistory: ClipboardEntry[];

  // Fold state
  foldAllState: boolean;

  // Actions
  addTab: (tab?: Partial<FileTab>) => string;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  closeTabsToLeft: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  closeUnchangedTabs: () => void;
  closeAllButPinned: () => void;
  restoreLastClosedTab: () => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<FileTab>) => void;
  updateTabContent: (id: string, content: string) => void;
  togglePinTab: (id: string) => void;
  setTabColor: (id: string, color: TabColor) => void;

  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleSidebar: () => void;

  setShowFindReplace: (show: boolean, mode?: 'find' | 'replace' | 'findInFiles' | 'mark') => void;
  updateSearchOptions: (options: Partial<SearchOptions>) => void;
  setShowIncrementalSearch: (show: boolean) => void;

  startRecordingMacro: () => void;
  stopRecordingMacro: () => void;
  addMacroAction: (action: MacroAction) => void;
  saveMacro: (name: string) => void;

  setFileTree: (tree: FileTreeNode[]) => void;
  setWorkspacePath: (path: string | null) => void;
  toggleTreeNode: (path: string) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;

  setShowSettings: (show: boolean) => void;
  setShowGoToLine: (show: boolean) => void;
  setShowAbout: (show: boolean) => void;
  setShowRunCommand: (show: boolean) => void;
  setShowColumnEditor: (show: boolean) => void;
  setShowSummary: (show: boolean) => void;
  setShowCharInRange: (show: boolean) => void;
  setShowShortcutMapper: (show: boolean) => void;

  setZoomLevel: (level: number) => void;

  setSplitView: (split: 'none' | 'horizontal' | 'vertical', tabId?: string | null) => void;

  moveTab: (fromIndex: number, toIndex: number) => void;

  addRecentFile: (path: string, name: string) => void;

  addClipboardEntry: (text: string) => void;

  // Session management
  saveSession: () => SessionData;
  loadSession: (session: SessionData) => void;

  // Tab navigation
  nextTab: () => void;
  prevTab: () => void;
  goToTab: (index: number) => void;
  moveTabForward: () => void;
  moveTabBackward: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'mac-glass',
  fontSize: 14,
  fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
  tabSize: 4,
  insertSpaces: true,
  wordWrap: false,
  showWhitespace: false,
  showLineNumbers: true,
  showMinimap: true,
  showIndentGuides: true,
  showEOL: false,
  showNonPrintable: false,
  showWrapSymbol: false,
  autoSave: false,
  autoSaveDelay: 5000,
  highlightCurrentLine: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  autoIndent: true,
  smoothScrolling: true,
  cursorBlinking: 'blink',
  cursorStyle: 'line',
  renderWhitespace: 'none',
  virtualSpace: false,
  alwaysOnTop: false,
  distractionFreeMode: false,
  darkMode: true,
  syncScrollVertical: false,
  syncScrollHorizontal: false,
  rememberLastSession: true,
  searchEngine: 'https://www.google.com/search?q=',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
};

const defaultSearchOptions: SearchOptions = {
  query: '',
  replaceText: '',
  isRegex: false,
  isCaseSensitive: false,
  isWholeWord: false,
  searchInSelection: false,
  wrapAround: true,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  closedTabs: [],

  sidebarPanel: null,
  sidebarWidth: 260,
  showStatusBar: true,
  showToolbar: true,
  splitView: 'none',
  splitTabId: null,

  showFindReplace: false,
  findReplaceMode: 'find',
  searchOptions: { ...defaultSearchOptions },
  searchResults: [],
  showIncrementalSearch: false,

  isRecordingMacro: false,
  currentMacroActions: [],
  savedMacros: [],

  fileTree: [],
  workspacePath: null,

  settings: { ...defaultSettings },

  showSettings: false,
  showGoToLine: false,
  showAbout: false,
  showRunCommand: false,
  showColumnEditor: false,
  showSummary: false,
  showCharInRange: false,
  showShortcutMapper: false,

  zoomLevel: 0,

  recentFiles: [],

  clipboardHistory: [],

  foldAllState: false,

  addTab: (tab) => {
    const id = generateId();
    const newTab: FileTab = {
      id,
      name: tab?.name || `new ${get().tabs.length + 1}`,
      path: tab?.path || null,
      content: tab?.content || '',
      originalContent: tab?.content || '',
      language: tab?.language || detectLanguage(tab?.name || ''),
      encoding: tab?.encoding || 'utf-8',
      lineEnding: tab?.lineEnding || 'LF',
      isModified: false,
      isReadOnly: tab?.isReadOnly || false,
      isPinned: false,
      tabColor: 'none',
      cursorLine: 1,
      cursorColumn: 1,
      scrollTop: 0,
      bookmarks: [],
      marks: [],
      hiddenLines: [],
      isMonitoring: false,
    };

    set(produce((state: EditorState) => {
      state.tabs.push(newTab);
      state.activeTabId = id;
    }));

    return id;
  },

  closeTab: (id) => {
    set(produce((state: EditorState) => {
      const index = state.tabs.findIndex(t => t.id === id);
      if (index === -1) return;

      // Save to closed tabs for restore
      state.closedTabs.push({ ...state.tabs[index] });
      if (state.closedTabs.length > 20) state.closedTabs.shift();

      state.tabs.splice(index, 1);

      if (state.activeTabId === id) {
        if (state.tabs.length > 0) {
          const newIndex = Math.min(index, state.tabs.length - 1);
          state.activeTabId = state.tabs[newIndex].id;
        } else {
          state.activeTabId = null;
        }
      }

      if (state.splitTabId === id) {
        state.splitView = 'none';
        state.splitTabId = null;
      }
    }));
  },

  closeAllTabs: () => {
    const tabs = get().tabs;
    set(produce((state: EditorState) => {
      state.closedTabs.push(...tabs);
      state.tabs = [];
      state.activeTabId = null;
      state.splitView = 'none';
      state.splitTabId = null;
    }));
  },

  closeOtherTabs: (id) => {
    set(produce((state: EditorState) => {
      const closed = state.tabs.filter(t => t.id !== id);
      state.closedTabs.push(...closed);
      state.tabs = state.tabs.filter(t => t.id === id);
      state.activeTabId = id;
    }));
  },

  closeTabsToLeft: (id) => {
    set(produce((state: EditorState) => {
      const index = state.tabs.findIndex(t => t.id === id);
      if (index <= 0) return;
      const closed = state.tabs.splice(0, index);
      state.closedTabs.push(...closed);
    }));
  },

  closeTabsToRight: (id) => {
    set(produce((state: EditorState) => {
      const index = state.tabs.findIndex(t => t.id === id);
      if (index === -1 || index >= state.tabs.length - 1) return;
      const closed = state.tabs.splice(index + 1);
      state.closedTabs.push(...closed);
    }));
  },

  closeUnchangedTabs: () => {
    set(produce((state: EditorState) => {
      const unchanged = state.tabs.filter(t => !t.isModified);
      state.closedTabs.push(...unchanged);
      state.tabs = state.tabs.filter(t => t.isModified);
      if (state.tabs.length > 0 && !state.tabs.find(t => t.id === state.activeTabId)) {
        state.activeTabId = state.tabs[0].id;
      } else if (state.tabs.length === 0) {
        state.activeTabId = null;
      }
    }));
  },

  closeAllButPinned: () => {
    set(produce((state: EditorState) => {
      const unpinned = state.tabs.filter(t => !t.isPinned);
      state.closedTabs.push(...unpinned);
      state.tabs = state.tabs.filter(t => t.isPinned);
      if (state.tabs.length > 0 && !state.tabs.find(t => t.id === state.activeTabId)) {
        state.activeTabId = state.tabs[0].id;
      } else if (state.tabs.length === 0) {
        state.activeTabId = null;
      }
    }));
  },

  restoreLastClosedTab: () => {
    set(produce((state: EditorState) => {
      if (state.closedTabs.length === 0) return;
      const tab = state.closedTabs.pop()!;
      tab.id = generateId(); // new id
      state.tabs.push(tab);
      state.activeTabId = tab.id;
    }));
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => {
    set(produce((state: EditorState) => {
      const tab = state.tabs.find(t => t.id === id);
      if (tab) Object.assign(tab, updates);
    }));
  },

  updateTabContent: (id, content) => {
    set(produce((state: EditorState) => {
      const tab = state.tabs.find(t => t.id === id);
      if (tab) {
        tab.content = content;
        tab.isModified = content !== tab.originalContent;
      }
    }));
  },

  togglePinTab: (id) => {
    set(produce((state: EditorState) => {
      const tab = state.tabs.find(t => t.id === id);
      if (tab) tab.isPinned = !tab.isPinned;
    }));
  },

  setTabColor: (id, color) => {
    set(produce((state: EditorState) => {
      const tab = state.tabs.find(t => t.id === id);
      if (tab) tab.tabColor = color;
    }));
  },

  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),

  toggleSidebar: () => {
    const current = get().sidebarPanel;
    set({ sidebarPanel: current ? null : 'explorer' });
  },

  setShowFindReplace: (show, mode) => set({
    showFindReplace: show,
    findReplaceMode: mode || get().findReplaceMode
  }),

  updateSearchOptions: (options) => {
    set(produce((state: EditorState) => {
      Object.assign(state.searchOptions, options);
    }));
  },

  setShowIncrementalSearch: (show) => set({ showIncrementalSearch: show }),

  startRecordingMacro: () => set({ isRecordingMacro: true, currentMacroActions: [] }),
  stopRecordingMacro: () => set({ isRecordingMacro: false }),

  addMacroAction: (action) => {
    if (!get().isRecordingMacro) return;
    set(produce((state: EditorState) => {
      state.currentMacroActions.push(action);
    }));
  },

  saveMacro: (name) => {
    const actions = get().currentMacroActions;
    if (actions.length === 0) return;
    set(produce((state: EditorState) => {
      state.savedMacros.push({ id: generateId(), name, actions: [...actions] });
    }));
  },

  setFileTree: (tree) => set({ fileTree: tree }),
  setWorkspacePath: (path) => set({ workspacePath: path }),

  toggleTreeNode: (path) => {
    set(produce((state: EditorState) => {
      const toggleNode = (nodes: FileTreeNode[]): boolean => {
        for (const node of nodes) {
          if (node.path === path) { node.isExpanded = !node.isExpanded; return true; }
          if (node.children && toggleNode(node.children)) return true;
        }
        return false;
      };
      toggleNode(state.fileTree);
    }));
  },

  updateSettings: (newSettings) => {
    set(produce((state: EditorState) => {
      Object.assign(state.settings, newSettings);
    }));
  },

  setShowSettings: (show) => set({ showSettings: show }),
  setShowGoToLine: (show) => set({ showGoToLine: show }),
  setShowAbout: (show) => set({ showAbout: show }),
  setShowRunCommand: (show) => set({ showRunCommand: show }),
  setShowColumnEditor: (show) => set({ showColumnEditor: show }),
  setShowSummary: (show) => set({ showSummary: show }),
  setShowCharInRange: (show) => set({ showCharInRange: show }),
  setShowShortcutMapper: (show) => set({ showShortcutMapper: show }),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(-5, Math.min(10, level)) }),

  setSplitView: (split, tabId) => set({ splitView: split, splitTabId: tabId || null }),

  moveTab: (fromIndex, toIndex) => {
    set(produce((state: EditorState) => {
      const [tab] = state.tabs.splice(fromIndex, 1);
      state.tabs.splice(toIndex, 0, tab);
    }));
  },

  addRecentFile: (path, name) => {
    set(produce((state: EditorState) => {
      state.recentFiles = state.recentFiles.filter(f => f.path !== path);
      state.recentFiles.unshift({ path, name });
      if (state.recentFiles.length > 20) state.recentFiles.pop();
    }));
  },

  addClipboardEntry: (text) => {
    set(produce((state: EditorState) => {
      state.clipboardHistory.unshift({ text, timestamp: Date.now() });
      if (state.clipboardHistory.length > 50) state.clipboardHistory.pop();
    }));
  },

  saveSession: () => {
    const state = get();
    return {
      tabs: state.tabs.map(t => ({
        path: t.path, name: t.name, language: t.language,
        cursorLine: t.cursorLine, cursorColumn: t.cursorColumn,
        scrollTop: t.scrollTop, content: t.path ? undefined : t.content,
      })),
      activeTabIndex: state.tabs.findIndex(t => t.id === state.activeTabId),
      sidebarPanel: state.sidebarPanel,
    };
  },

  loadSession: (session) => {
    const tabs: FileTab[] = session.tabs.map((t) => ({
      id: generateId(),
      name: t.name,
      path: t.path,
      content: t.content || '',
      originalContent: t.content || '',
      language: t.language,
      encoding: 'utf-8',
      lineEnding: 'LF' as const,
      isModified: false,
      isReadOnly: false,
      isPinned: false,
      tabColor: 'none' as const,
      cursorLine: t.cursorLine,
      cursorColumn: t.cursorColumn,
      scrollTop: t.scrollTop,
      bookmarks: [],
      marks: [],
      hiddenLines: [],
      isMonitoring: false,
    }));

    set({
      tabs,
      activeTabId: tabs[session.activeTabIndex]?.id || tabs[0]?.id || null,
      sidebarPanel: session.sidebarPanel,
    });
  },

  nextTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const next = (idx + 1) % tabs.length;
    set({ activeTabId: tabs[next].id });
  },

  prevTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const prev = (idx - 1 + tabs.length) % tabs.length;
    set({ activeTabId: tabs[prev].id });
  },

  goToTab: (index) => {
    const { tabs } = get();
    if (index >= 0 && index < tabs.length) {
      set({ activeTabId: tabs[index].id });
    }
  },

  moveTabForward: () => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex(t => t.id === activeTabId);
    if (idx < tabs.length - 1) {
      set(produce((state: EditorState) => {
        const [tab] = state.tabs.splice(idx, 1);
        state.tabs.splice(idx + 1, 0, tab);
      }));
    }
  },

  moveTabBackward: () => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex(t => t.id === activeTabId);
    if (idx > 0) {
      set(produce((state: EditorState) => {
        const [tab] = state.tabs.splice(idx, 1);
        state.tabs.splice(idx - 1, 0, tab);
      }));
    }
  },
}));
