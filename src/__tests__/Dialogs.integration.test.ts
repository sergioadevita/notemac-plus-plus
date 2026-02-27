import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultSettings } from '../Notemac/Configs/EditorConfig';

function resetStore(): void
{
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
        terminalHeight: 200,
        showCloneDialog: false,
        showGitSettings: false,
        tabs: [],
        activeTabId: null,
    });
}

describe('Dialog Model — missing dialog toggles', () =>
{
    beforeEach(() => resetStore());

    it('toggles command palette dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowCommandPalette(true);
        expect(useNotemacStore.getState().showCommandPalette).toBe(true);
        store.setShowCommandPalette(false);
        expect(useNotemacStore.getState().showCommandPalette).toBe(false);
    });

    it('toggles quick open dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowQuickOpen(true);
        expect(useNotemacStore.getState().showQuickOpen).toBe(true);
        store.setShowQuickOpen(false);
        expect(useNotemacStore.getState().showQuickOpen).toBe(false);
    });

    it('toggles diff viewer dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowDiffViewer(true);
        expect(useNotemacStore.getState().showDiffViewer).toBe(true);
        store.setShowDiffViewer(false);
        expect(useNotemacStore.getState().showDiffViewer).toBe(false);
    });

    it('toggles snippet manager dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSnippetManager(true);
        expect(useNotemacStore.getState().showSnippetManager).toBe(true);
        store.setShowSnippetManager(false);
        expect(useNotemacStore.getState().showSnippetManager).toBe(false);
    });

    it('toggles clone dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowCloneDialog(true);
        expect(useNotemacStore.getState().showCloneDialog).toBe(true);
        store.setShowCloneDialog(false);
        expect(useNotemacStore.getState().showCloneDialog).toBe(false);
    });

    it('toggles git settings dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowGitSettings(true);
        expect(useNotemacStore.getState().showGitSettings).toBe(true);
        store.setShowGitSettings(false);
        expect(useNotemacStore.getState().showGitSettings).toBe(false);
    });
});

describe('Dialog Model — edge cases', () =>
{
    beforeEach(() => resetStore());

    it('all 14 dialog states default to false', () =>
    {
        resetStore();
        const state = useNotemacStore.getState();
        expect(state.showSettings).toBe(false);
        expect(state.showGoToLine).toBe(false);
        expect(state.showAbout).toBe(false);
        expect(state.showRunCommand).toBe(false);
        expect(state.showColumnEditor).toBe(false);
        expect(state.showSummary).toBe(false);
        expect(state.showCharInRange).toBe(false);
        expect(state.showShortcutMapper).toBe(false);
        expect(state.showCommandPalette).toBe(false);
        expect(state.showQuickOpen).toBe(false);
        expect(state.showDiffViewer).toBe(false);
        expect(state.showSnippetManager).toBe(false);
        expect(state.showCloneDialog).toBe(false);
        expect(state.showGitSettings).toBe(false);
    });

    it('multiple dialogs can be set to true simultaneously in store', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);
        store.setShowCommandPalette(true);
        store.setShowQuickOpen(true);
        const state = useNotemacStore.getState();
        expect(state.showSettings).toBe(true);
        expect(state.showCommandPalette).toBe(true);
        expect(state.showQuickOpen).toBe(true);
    });

    it('closing all dialogs sets all to false', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);
        store.setShowCommandPalette(true);
        store.setShowDiffViewer(true);
        store.setShowCloneDialog(true);
        store.setShowGitSettings(true);
        expect(useNotemacStore.getState().showSettings).toBe(true);
        expect(useNotemacStore.getState().showCommandPalette).toBe(true);

        store.setShowSettings(false);
        store.setShowCommandPalette(false);
        store.setShowDiffViewer(false);
        store.setShowCloneDialog(false);
        store.setShowGitSettings(false);

        const state = useNotemacStore.getState();
        expect(state.showSettings).toBe(false);
        expect(state.showCommandPalette).toBe(false);
        expect(state.showDiffViewer).toBe(false);
        expect(state.showCloneDialog).toBe(false);
        expect(state.showGitSettings).toBe(false);
    });

    it('toggle dialog on/off rapidly preserves correct state', () =>
    {
        const store = useNotemacStore.getState();
        for (let i = 0; i < 5; i++)
        {
            store.setShowSummary(true);
            expect(useNotemacStore.getState().showSummary).toBe(true);
            store.setShowSummary(false);
            expect(useNotemacStore.getState().showSummary).toBe(false);
        }
        expect(useNotemacStore.getState().showSummary).toBe(false);
    });

    it('dialog state is independent from sidebar panel state', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        store.setShowCommandPalette(true);

        const state = useNotemacStore.getState();
        expect(state.sidebarPanel).toBe('explorer');
        expect(state.showCommandPalette).toBe(true);

        store.setSidebarPanel(null);
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
        expect(useNotemacStore.getState().showCommandPalette).toBe(true);
    });

    it('opening dialog does not affect tab state', () =>
    {
        const store = useNotemacStore.getState();
        const tab1 = store.addTab({ name: 'file1.ts', content: 'code1' });
        const tab2 = store.addTab({ name: 'file2.py', content: 'code2' });
        store.setActiveTab(tab1);

        expect(useNotemacStore.getState().tabs.length).toBe(2);
        expect(useNotemacStore.getState().activeTabId).toBe(tab1);

        store.setShowDiffViewer(true);
        store.setShowQuickOpen(true);

        const state = useNotemacStore.getState();
        expect(state.tabs.length).toBe(2);
        expect(state.activeTabId).toBe(tab1);
        expect(state.showDiffViewer).toBe(true);
        expect(state.showQuickOpen).toBe(true);
    });

    it('opening settings dialog and checking default settings are accessible', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);

        const state = useNotemacStore.getState();
        expect(state.showSettings).toBe(true);
        expect(state.settings).toBeTruthy();
        expect(state.settings.theme).toBe('mac-glass');
        expect(state.settings.fontSize).toBe(14);
    });

    it('quick open with tabs: add tabs first, verify tab list accessible alongside dialog', () =>
    {
        const store = useNotemacStore.getState();
        const tab1 = store.addTab({ name: 'tab1.ts', content: 'content1' });
        const tab2 = store.addTab({ name: 'tab2.py', content: 'content2' });
        store.setActiveTab(tab1);

        store.setShowQuickOpen(true);

        const state = useNotemacStore.getState();
        expect(state.tabs.length).toBe(2);
        expect(state.tabs[0].name).toBe('tab1.ts');
        expect(state.tabs[1].name).toBe('tab2.py');
        expect(state.showQuickOpen).toBe(true);
    });

    it('summary dialog with active tab: add tab with content, verify content metrics accessible', () =>
    {
        const store = useNotemacStore.getState();
        const tabId = store.addTab({ name: 'document.txt', content: 'Hello world\nSecond line' });
        store.setActiveTab(tabId);

        store.setShowSummary(true);

        const state = useNotemacStore.getState();
        expect(state.showSummary).toBe(true);
        expect(state.activeTabId).toBe(tabId);
        const activeTab = state.tabs.find(t => t.id === state.activeTabId);
        expect(activeTab).toBeTruthy();
        expect(activeTab?.content).toBe('Hello world\nSecond line');
        expect(activeTab?.content.split('\n').length).toBe(2);
    });
});
