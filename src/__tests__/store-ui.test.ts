import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../../Shared/Helpers/IdHelpers', async (importOriginal) => {
    const actual = await importOriginal();
    let idCounter = 0;
    return {
        ...actual,
        generateId: () => `id-${++idCounter}`,
    };
});

vi.mock('../Configs/EditorConfig', () => ({
    GetDefaultSettings: () => ({
        theme: 'dark',
        fontSize: 12,
        fontFamily: 'monospace',
        tabSize: 4,
        wordWrap: false,
        lineNumbers: true,
        autoSave: true,
        autoSaveInterval: 5000,
    }),
}));

function resetStore(): void {
    useNotemacStore.setState({
        sidebarPanel: null,
        sidebarWidth: 260,
        showStatusBar: true,
        showToolbar: true,
        splitView: 'none',
        splitTabId: null,
        zoomLevel: 0,
        foldAllState: false,
        clipboardHistory: [],
        settings: {
            theme: 'dark',
            fontSize: 12,
            fontFamily: 'monospace',
            tabSize: 4,
            wordWrap: false,
            lineNumbers: true,
            autoSave: true,
            autoSaveInterval: 5000,
        },
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
        terminalHeight: 200,
        showCloneDialog: false,
        showGitSettings: false,
        tabs: [],
        activeTabId: null,
    });
}

describe('UIModel — setSidebarPanel', () => {
    beforeEach(() => resetStore());

    it('sets sidebar panel', () => {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('clears sidebar panel', () => {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('search');
        store.setSidebarPanel(null);
        expect(useNotemacStore.getState().sidebarPanel).toBeNull();
    });
});

describe('UIModel — toggleSidebar', () => {
    beforeEach(() => resetStore());

    it('opens sidebar when closed', () => {
        const store = useNotemacStore.getState();
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('closes sidebar when open', () => {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('search');
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBeNull();
    });
});

describe('UIModel — setZoomLevel', () => {
    beforeEach(() => resetStore());

    it('sets zoom level', () => {
        const store = useNotemacStore.getState();
        store.setZoomLevel(5);
        expect(useNotemacStore.getState().zoomLevel).toBe(5);
    });

    it('clamps zoom to minimum', () => {
        const store = useNotemacStore.getState();
        store.setZoomLevel(-10);
        const state = useNotemacStore.getState();
        expect(state.zoomLevel).toBeGreaterThanOrEqual(-5);
    });

    it('clamps zoom to maximum', () => {
        const store = useNotemacStore.getState();
        store.setZoomLevel(100);
        const state = useNotemacStore.getState();
        expect(state.zoomLevel).toBeLessThanOrEqual(10);
    });
});

describe('UIModel — setSplitView', () => {
    beforeEach(() => resetStore());

    it('sets split view mode', () => {
        const store = useNotemacStore.getState();
        store.setSplitView('vertical');
        const state = useNotemacStore.getState();
        expect(state.splitView).toBe('vertical');
    });

    it('sets split view with tab id', () => {
        const store = useNotemacStore.getState();
        store.setSplitView('horizontal', 'tab-123');
        const state = useNotemacStore.getState();
        expect(state.splitView).toBe('horizontal');
        expect(state.splitTabId).toBe('tab-123');
    });

    it('clears split view', () => {
        const store = useNotemacStore.getState();
        store.setSplitView('vertical', 'tab-123');
        store.setSplitView('none');
        const state = useNotemacStore.getState();
        expect(state.splitView).toBe('none');
        expect(state.splitTabId).toBeNull();
    });
});

describe('UIModel — addClipboardEntry', () => {
    beforeEach(() => resetStore());

    it('adds clipboard entry', () => {
        const store = useNotemacStore.getState();
        store.addClipboardEntry('copied text');
        const state = useNotemacStore.getState();

        expect(state.clipboardHistory.length).toBe(1);
        expect(state.clipboardHistory[0].text).toBe('copied text');
    });

    it('adds multiple entries in reverse chronological order', () => {
        const store = useNotemacStore.getState();
        store.addClipboardEntry('first');
        store.addClipboardEntry('second');
        const state = useNotemacStore.getState();

        expect(state.clipboardHistory[0].text).toBe('second');
        expect(state.clipboardHistory[1].text).toBe('first');
    });

    it('respects clipboard history limit', () => {
        const store = useNotemacStore.getState();
        for (let i = 0; i < 100; i++) {
            store.addClipboardEntry(`entry-${i}`);
        }
        const state = useNotemacStore.getState();
        expect(state.clipboardHistory.length).toBeLessThanOrEqual(50);
    });

    it('sets timestamp on entry', () => {
        const store = useNotemacStore.getState();
        const before = Date.now();
        store.addClipboardEntry('test');
        const after = Date.now();
        const state = useNotemacStore.getState();

        expect(state.clipboardHistory[0].timestamp).toBeGreaterThanOrEqual(before);
        expect(state.clipboardHistory[0].timestamp).toBeLessThanOrEqual(after);
    });
});

describe('UIModel — updateSettings', () => {
    beforeEach(() => resetStore());

    it('updates single setting', () => {
        const store = useNotemacStore.getState();
        store.updateSettings({ fontSize: 16 });
        const state = useNotemacStore.getState();

        expect(state.settings.fontSize).toBe(16);
        expect(state.settings.theme).toBe('dark');
    });

    it('updates multiple settings', () => {
        const store = useNotemacStore.getState();
        store.updateSettings({ fontSize: 14, wordWrap: true });
        const state = useNotemacStore.getState();

        expect(state.settings.fontSize).toBe(14);
        expect(state.settings.wordWrap).toBe(true);
    });
});

describe('UIModel — setShowSettings', () => {
    beforeEach(() => resetStore());

    it('shows settings', () => {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);
        expect(useNotemacStore.getState().showSettings).toBe(true);
    });

    it('hides settings', () => {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);
        store.setShowSettings(false);
        expect(useNotemacStore.getState().showSettings).toBe(false);
    });
});

describe('UIModel — setShowGoToLine', () => {
    beforeEach(() => resetStore());

    it('shows go to line', () => {
        const store = useNotemacStore.getState();
        store.setShowGoToLine(true);
        expect(useNotemacStore.getState().showGoToLine).toBe(true);
    });

    it('hides go to line', () => {
        const store = useNotemacStore.getState();
        store.setShowGoToLine(true);
        store.setShowGoToLine(false);
        expect(useNotemacStore.getState().showGoToLine).toBe(false);
    });
});

describe('UIModel — setShowAbout', () => {
    beforeEach(() => resetStore());

    it('shows about dialog', () => {
        const store = useNotemacStore.getState();
        store.setShowAbout(true);
        expect(useNotemacStore.getState().showAbout).toBe(true);
    });
});

describe('UIModel — setShowRunCommand', () => {
    beforeEach(() => resetStore());

    it('shows run command', () => {
        const store = useNotemacStore.getState();
        store.setShowRunCommand(true);
        expect(useNotemacStore.getState().showRunCommand).toBe(true);
    });
});

describe('UIModel — setShowColumnEditor', () => {
    beforeEach(() => resetStore());

    it('shows column editor', () => {
        const store = useNotemacStore.getState();
        store.setShowColumnEditor(true);
        expect(useNotemacStore.getState().showColumnEditor).toBe(true);
    });
});

describe('UIModel — setShowSummary', () => {
    beforeEach(() => resetStore());

    it('shows summary', () => {
        const store = useNotemacStore.getState();
        store.setShowSummary(true);
        expect(useNotemacStore.getState().showSummary).toBe(true);
    });
});

describe('UIModel — setShowCharInRange', () => {
    beforeEach(() => resetStore());

    it('shows char in range', () => {
        const store = useNotemacStore.getState();
        store.setShowCharInRange(true);
        expect(useNotemacStore.getState().showCharInRange).toBe(true);
    });
});

describe('UIModel — setShowShortcutMapper', () => {
    beforeEach(() => resetStore());

    it('shows shortcut mapper', () => {
        const store = useNotemacStore.getState();
        store.setShowShortcutMapper(true);
        expect(useNotemacStore.getState().showShortcutMapper).toBe(true);
    });
});

describe('UIModel — setShowCommandPalette', () => {
    beforeEach(() => resetStore());

    it('shows command palette', () => {
        const store = useNotemacStore.getState();
        store.setShowCommandPalette(true);
        expect(useNotemacStore.getState().showCommandPalette).toBe(true);
    });
});

describe('UIModel — setShowQuickOpen', () => {
    beforeEach(() => resetStore());

    it('shows quick open', () => {
        const store = useNotemacStore.getState();
        store.setShowQuickOpen(true);
        expect(useNotemacStore.getState().showQuickOpen).toBe(true);
    });
});

describe('UIModel — setShowDiffViewer', () => {
    beforeEach(() => resetStore());

    it('shows diff viewer', () => {
        const store = useNotemacStore.getState();
        store.setShowDiffViewer(true);
        expect(useNotemacStore.getState().showDiffViewer).toBe(true);
    });
});

describe('UIModel — setShowSnippetManager', () => {
    beforeEach(() => resetStore());

    it('shows snippet manager', () => {
        const store = useNotemacStore.getState();
        store.setShowSnippetManager(true);
        expect(useNotemacStore.getState().showSnippetManager).toBe(true);
    });
});

describe('UIModel — setShowTerminalPanel', () => {
    beforeEach(() => resetStore());

    it('shows terminal panel', () => {
        const store = useNotemacStore.getState();
        store.setShowTerminalPanel(true);
        expect(useNotemacStore.getState().showTerminalPanel).toBe(true);
    });
});

describe('UIModel — setTerminalHeight', () => {
    beforeEach(() => resetStore());

    it('sets terminal height', () => {
        const store = useNotemacStore.getState();
        store.setTerminalHeight(300);
        expect(useNotemacStore.getState().terminalHeight).toBe(300);
    });

    it('clamps terminal height to minimum', () => {
        const store = useNotemacStore.getState();
        store.setTerminalHeight(0);
        const state = useNotemacStore.getState();
        expect(state.terminalHeight).toBeGreaterThanOrEqual(50);
    });

    it('clamps terminal height to maximum', () => {
        const store = useNotemacStore.getState();
        store.setTerminalHeight(10000);
        const state = useNotemacStore.getState();
        expect(state.terminalHeight).toBeLessThanOrEqual(800);
    });
});

describe('UIModel — setShowCloneDialog', () => {
    beforeEach(() => resetStore());

    it('shows clone dialog', () => {
        const store = useNotemacStore.getState();
        store.setShowCloneDialog(true);
        expect(useNotemacStore.getState().showCloneDialog).toBe(true);
    });
});

describe('UIModel — setShowGitSettings', () => {
    beforeEach(() => resetStore());

    it('shows git settings', () => {
        const store = useNotemacStore.getState();
        store.setShowGitSettings(true);
        expect(useNotemacStore.getState().showGitSettings).toBe(true);
    });
});

describe('UIModel — saveSession', () => {
    beforeEach(() => resetStore());

    it('saves session data', () => {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        const session = store.saveSession();

        expect(session.tabs).toBeDefined();
        expect(session.activeTabIndex).toBeDefined();
        expect(session.sidebarPanel).toBe('explorer');
    });
});

describe('UIModel — loadSession', () => {
    beforeEach(() => resetStore());

    it('loads session data', () => {
        const store = useNotemacStore.getState();
        const sessionData = {
            tabs: [
                { name: 'file1.ts', path: '/file1.ts', language: 'typescript', content: undefined, cursorLine: 1, cursorColumn: 1, scrollTop: 0 },
                { name: 'file2.ts', path: '/file2.ts', language: 'typescript', content: undefined, cursorLine: 5, cursorColumn: 10, scrollTop: 100 },
            ],
            activeTabIndex: 0,
            sidebarPanel: 'search' as const,
        };

        store.loadSession(sessionData);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(2);
        expect(state.sidebarPanel).toBe('search');
        expect(state.activeTabId).toBe(state.tabs[0].id);
    });

    it('handles missing active tab index', () => {
        const store = useNotemacStore.getState();
        const sessionData = {
            tabs: [
                { name: 'file1.ts', path: '/file1.ts', language: 'typescript', content: undefined, cursorLine: 1, cursorColumn: 1, scrollTop: 0 },
            ],
            activeTabIndex: 99,
            sidebarPanel: null as any,
        };

        store.loadSession(sessionData);
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBe(state.tabs[0].id);
    });

    it('preserves unsaved content in session', () => {
        const store = useNotemacStore.getState();
        const sessionData = {
            tabs: [
                { name: 'unsaved.ts', path: null, language: 'typescript', content: 'console.log()', cursorLine: 1, cursorColumn: 1, scrollTop: 0 },
            ],
            activeTabIndex: 0,
            sidebarPanel: null as any,
        };

        store.loadSession(sessionData);
        const state = useNotemacStore.getState();

        expect(state.tabs[0].content).toBe('console.log()');
    });
});
