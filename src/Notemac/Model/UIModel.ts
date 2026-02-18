import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { AppSettings, ClipboardEntry, SessionData, FileTab } from "../Commons/Types";
import type { SidebarPanel, SplitViewMode } from "../Commons/Enums";
import { GetDefaultSettings } from "../Configs/EditorConfig";
import { generateId } from '../../Shared/Helpers/IdHelpers';
import { LIMIT_CLIPBOARD_HISTORY, LIMIT_ZOOM_MIN, LIMIT_ZOOM_MAX, TERMINAL_DEFAULT_HEIGHT, TERMINAL_MIN_HEIGHT, TERMINAL_MAX_HEIGHT } from '../Commons/Constants';

export interface NotemacUISlice
{
    sidebarPanel: SidebarPanel;
    sidebarWidth: number;
    showStatusBar: boolean;
    showToolbar: boolean;
    splitView: SplitViewMode;
    splitTabId: string | null;
    zoomLevel: number;
    foldAllState: boolean;
    clipboardHistory: ClipboardEntry[];
    settings: AppSettings;

    showSettings: boolean;
    showGoToLine: boolean;
    showAbout: boolean;
    showRunCommand: boolean;
    showColumnEditor: boolean;
    showSummary: boolean;
    showCharInRange: boolean;
    showShortcutMapper: boolean;
    showCommandPalette: boolean;
    showQuickOpen: boolean;
    showDiffViewer: boolean;
    showSnippetManager: boolean;
    showTerminalPanel: boolean;
    terminalHeight: number;

    setSidebarPanel: (panel: SidebarPanel) => void;
    toggleSidebar: () => void;
    setZoomLevel: (level: number) => void;
    setSplitView: (split: SplitViewMode, tabId?: string | null) => void;
    addClipboardEntry: (text: string) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    setShowSettings: (show: boolean) => void;
    setShowGoToLine: (show: boolean) => void;
    setShowAbout: (show: boolean) => void;
    setShowRunCommand: (show: boolean) => void;
    setShowColumnEditor: (show: boolean) => void;
    setShowSummary: (show: boolean) => void;
    setShowCharInRange: (show: boolean) => void;
    setShowShortcutMapper: (show: boolean) => void;
    setShowCommandPalette: (show: boolean) => void;
    setShowQuickOpen: (show: boolean) => void;
    setShowDiffViewer: (show: boolean) => void;
    setShowSnippetManager: (show: boolean) => void;
    setShowTerminalPanel: (show: boolean) => void;
    setTerminalHeight: (height: number) => void;

    saveSession: () => SessionData;
    loadSession: (session: SessionData) => void;
}

export const createUISlice: StateCreator<NotemacUISlice & { tabs: FileTab[]; activeTabId: string | null }, [], [], NotemacUISlice> = (set, get) => ({
    sidebarPanel: null,
    sidebarWidth: 260,
    showStatusBar: true,
    showToolbar: true,
    splitView: 'none',
    splitTabId: null,
    zoomLevel: 0,
    foldAllState: false,
    clipboardHistory: [],
    settings: GetDefaultSettings(),

    showSettings: false,
    showGoToLine: false,
    showAbout: false,
    showRunCommand: false,
    showColumnEditor: false,
    showSummary: false,
    showCharInRange: false,
    showShortcutMapper: false,
    showCommandPalette: false,
    showQuickOpen: false,
    showDiffViewer: false,
    showSnippetManager: false,
    showTerminalPanel: false,
    terminalHeight: TERMINAL_DEFAULT_HEIGHT,

    setSidebarPanel: (panel) => set({ sidebarPanel: panel }),

    toggleSidebar: () =>
    {
        const current = get().sidebarPanel;
        set({ sidebarPanel: current ? null : 'explorer' });
    },

    setZoomLevel: (level) => set({ zoomLevel: Math.max(LIMIT_ZOOM_MIN, Math.min(LIMIT_ZOOM_MAX, level)) }),

    setSplitView: (split, tabId) => set({ splitView: split, splitTabId: tabId || null }),

    addClipboardEntry: (text) =>
    {
        set(produce((state: any) =>
        {
            state.clipboardHistory.unshift({ text, timestamp: Date.now() });
            if (state.clipboardHistory.length > LIMIT_CLIPBOARD_HISTORY)
                state.clipboardHistory.pop();
        }));
    },

    updateSettings: (newSettings) =>
    {
        set(produce((state: any) =>
        {
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
    setShowCommandPalette: (show) => set({ showCommandPalette: show }),
    setShowQuickOpen: (show) => set({ showQuickOpen: show }),
    setShowDiffViewer: (show) => set({ showDiffViewer: show }),
    setShowSnippetManager: (show) => set({ showSnippetManager: show }),
    setShowTerminalPanel: (show) => set({ showTerminalPanel: show }),
    setTerminalHeight: (height) => set({ terminalHeight: Math.max(TERMINAL_MIN_HEIGHT, Math.min(TERMINAL_MAX_HEIGHT, height)) }),

    saveSession: () =>
    {
        const state = get();
        return {
            tabs: state.tabs.map(t => ({
                path: t.path,
                name: t.name,
                language: t.language,
                cursorLine: t.cursorLine,
                cursorColumn: t.cursorColumn,
                scrollTop: t.scrollTop,
                content: t.path ? undefined : t.content,
            })),
            activeTabIndex: state.tabs.findIndex(t => t.id === state.activeTabId),
            sidebarPanel: state.sidebarPanel,
        };
    },

    loadSession: (session) =>
    {
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
        } as any);
    },
});
