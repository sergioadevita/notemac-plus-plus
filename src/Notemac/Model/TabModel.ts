import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { FileTab } from "../Commons/Types";
import type { TabColor } from "../Commons/Enums";
import { detectLanguage } from '../../Shared/Helpers/FileHelpers';
import { generateId } from '../../Shared/Helpers/IdHelpers';
import { LIMIT_CLOSED_TABS, LIMIT_RECENT_FILES } from '../Commons/Constants';

export interface NotemacTabSlice
{
    tabs: FileTab[];
    activeTabId: string | null;
    closedTabs: FileTab[];
    recentFiles: { path: string; name: string }[];

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
    moveTab: (fromIndex: number, toIndex: number) => void;
    nextTab: () => void;
    prevTab: () => void;
    goToTab: (index: number) => void;
    moveTabForward: () => void;
    moveTabBackward: () => void;
    addRecentFile: (path: string, name: string) => void;
}

export const createTabSlice: StateCreator<NotemacTabSlice, [], [], NotemacTabSlice> = (set, get) => ({
    tabs: [],
    activeTabId: null,
    closedTabs: [],
    recentFiles: [],

    addTab: (tab) =>
    {
        const id = generateId();
        const newTab: FileTab =
        {
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

        set(produce((state: NotemacTabSlice) =>
        {
            state.tabs.push(newTab);
            state.activeTabId = id;
        }));

        return id;
    },

    closeTab: (id) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const index = state.tabs.findIndex(t => t.id === id);
            if (-1 === index)
                return;

            state.closedTabs.push({ ...state.tabs[index] });
            if (state.closedTabs.length > LIMIT_CLOSED_TABS)
                state.closedTabs.shift();

            state.tabs.splice(index, 1);

            if (state.activeTabId === id)
            {
                if (0 < state.tabs.length)
                {
                    const newIndex = Math.min(index, state.tabs.length - 1);
                    state.activeTabId = state.tabs[newIndex].id;
                }
                else
                {
                    state.activeTabId = null;
                }
            }
        }));
    },

    closeAllTabs: () =>
    {
        const currentTabs = get().tabs;
        set(produce((state: NotemacTabSlice) =>
        {
            state.closedTabs.push(...currentTabs);
            state.tabs = [];
            state.activeTabId = null;
        }));
    },

    closeOtherTabs: (id) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const closed = state.tabs.filter(t => t.id !== id);
            state.closedTabs.push(...closed);
            state.tabs = state.tabs.filter(t => t.id === id);
            state.activeTabId = id;
        }));
    },

    closeTabsToLeft: (id) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const index = state.tabs.findIndex(t => t.id === id);
            if (0 >= index)
                return;
            const closed = state.tabs.splice(0, index);
            state.closedTabs.push(...closed);
        }));
    },

    closeTabsToRight: (id) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const index = state.tabs.findIndex(t => t.id === id);
            if (-1 === index || index >= state.tabs.length - 1)
                return;
            const closed = state.tabs.splice(index + 1);
            state.closedTabs.push(...closed);
        }));
    },

    closeUnchangedTabs: () =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const unchanged = state.tabs.filter(t => !t.isModified);
            state.closedTabs.push(...unchanged);
            state.tabs = state.tabs.filter(t => t.isModified);
            if (0 < state.tabs.length && !state.tabs.find(t => t.id === state.activeTabId))
                state.activeTabId = state.tabs[0].id;
            else if (0 === state.tabs.length)
                state.activeTabId = null;
        }));
    },

    closeAllButPinned: () =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const unpinned = state.tabs.filter(t => !t.isPinned);
            state.closedTabs.push(...unpinned);
            state.tabs = state.tabs.filter(t => t.isPinned);
            if (0 < state.tabs.length && !state.tabs.find(t => t.id === state.activeTabId))
                state.activeTabId = state.tabs[0].id;
            else if (0 === state.tabs.length)
                state.activeTabId = null;
        }));
    },

    restoreLastClosedTab: () =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            if (0 === state.closedTabs.length)
                return;
            const tab = state.closedTabs.pop()!;
            tab.id = generateId();
            state.tabs.push(tab);
            state.activeTabId = tab.id;
        }));
    },

    setActiveTab: (id) => set({ activeTabId: id }),

    updateTab: (id, updates) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const tab = state.tabs.find(t => t.id === id);
            if (tab)
                Object.assign(tab, updates);
        }));
    },

    updateTabContent: (id, content) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const tab = state.tabs.find(t => t.id === id);
            if (tab)
            {
                tab.content = content;
                tab.isModified = content !== tab.originalContent;
            }
        }));
    },

    togglePinTab: (id) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const tab = state.tabs.find(t => t.id === id);
            if (tab)
                tab.isPinned = !tab.isPinned;
        }));
    },

    setTabColor: (id, color) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const tab = state.tabs.find(t => t.id === id);
            if (tab)
                tab.tabColor = color;
        }));
    },

    moveTab: (fromIndex, toIndex) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            const [tab] = state.tabs.splice(fromIndex, 1);
            state.tabs.splice(toIndex, 0, tab);
        }));
    },

    nextTab: () =>
    {
        const { tabs, activeTabId } = get();
        if (1 >= tabs.length)
            return;
        const idx = tabs.findIndex(t => t.id === activeTabId);
        const next = (idx + 1) % tabs.length;
        set({ activeTabId: tabs[next].id });
    },

    prevTab: () =>
    {
        const { tabs, activeTabId } = get();
        if (1 >= tabs.length)
            return;
        const idx = tabs.findIndex(t => t.id === activeTabId);
        const prev = (idx - 1 + tabs.length) % tabs.length;
        set({ activeTabId: tabs[prev].id });
    },

    goToTab: (index) =>
    {
        const { tabs } = get();
        if (0 <= index && index < tabs.length)
            set({ activeTabId: tabs[index].id });
    },

    moveTabForward: () =>
    {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex(t => t.id === activeTabId);
        if (idx < tabs.length - 1)
        {
            set(produce((state: NotemacTabSlice) =>
            {
                const [tab] = state.tabs.splice(idx, 1);
                state.tabs.splice(idx + 1, 0, tab);
            }));
        }
    },

    moveTabBackward: () =>
    {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex(t => t.id === activeTabId);
        if (0 < idx)
        {
            set(produce((state: NotemacTabSlice) =>
            {
                const [tab] = state.tabs.splice(idx, 1);
                state.tabs.splice(idx - 1, 0, tab);
            }));
        }
    },

    addRecentFile: (path, name) =>
    {
        set(produce((state: NotemacTabSlice) =>
        {
            state.recentFiles = state.recentFiles.filter(f => f.path !== path);
            state.recentFiles.unshift({ path, name });
            if (state.recentFiles.length > LIMIT_RECENT_FILES)
                state.recentFiles.pop();
        }));
    },
});
