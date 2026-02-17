import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultSettings } from '../Notemac/Configs/EditorConfig';
import { LIMIT_ZOOM_MIN, LIMIT_ZOOM_MAX } from '../Notemac/Commons/Constants';

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
    });
}

describe('UIModel — sidebar', () =>
{
    beforeEach(() => resetStore());

    it('sets sidebar panel', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('sets sidebar to different panels', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('search');
        expect(useNotemacStore.getState().sidebarPanel).toBe('search');

        store.setSidebarPanel('functions');
        expect(useNotemacStore.getState().sidebarPanel).toBe('functions');

        store.setSidebarPanel('clipboardHistory');
        expect(useNotemacStore.getState().sidebarPanel).toBe('clipboardHistory');
    });

    it('sets sidebar to null (closed)', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        store.setSidebarPanel(null);
        expect(null === useNotemacStore.getState().sidebarPanel).toBe(true);
    });

    it('toggleSidebar opens explorer when closed', () =>
    {
        const store = useNotemacStore.getState();
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('toggleSidebar closes when open', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        store.toggleSidebar();
        expect(null === useNotemacStore.getState().sidebarPanel).toBe(true);
    });
});

describe('UIModel — zoom', () =>
{
    beforeEach(() => resetStore());

    it('sets zoom level', () =>
    {
        const store = useNotemacStore.getState();
        store.setZoomLevel(3);
        expect(3 === useNotemacStore.getState().zoomLevel).toBe(true);
    });

    it('clamps zoom to minimum', () =>
    {
        const store = useNotemacStore.getState();
        store.setZoomLevel(-100);
        expect(LIMIT_ZOOM_MIN === useNotemacStore.getState().zoomLevel).toBe(true);
    });

    it('clamps zoom to maximum', () =>
    {
        const store = useNotemacStore.getState();
        store.setZoomLevel(100);
        expect(LIMIT_ZOOM_MAX === useNotemacStore.getState().zoomLevel).toBe(true);
    });

    it('allows negative zoom within range', () =>
    {
        const store = useNotemacStore.getState();
        store.setZoomLevel(-3);
        expect(-3 === useNotemacStore.getState().zoomLevel).toBe(true);
    });
});

describe('UIModel — split view', () =>
{
    beforeEach(() => resetStore());

    it('sets horizontal split', () =>
    {
        const store = useNotemacStore.getState();
        store.setSplitView('horizontal', 'tab123');
        const state = useNotemacStore.getState();

        expect(state.splitView).toBe('horizontal');
        expect(state.splitTabId).toBe('tab123');
    });

    it('sets vertical split', () =>
    {
        const store = useNotemacStore.getState();
        store.setSplitView('vertical');
        expect(useNotemacStore.getState().splitView).toBe('vertical');
    });

    it('clears split view', () =>
    {
        const store = useNotemacStore.getState();
        store.setSplitView('horizontal', 'tab1');
        store.setSplitView('none');
        const state = useNotemacStore.getState();

        expect(state.splitView).toBe('none');
        expect(null === state.splitTabId).toBe(true);
    });
});

describe('UIModel — clipboard history', () =>
{
    beforeEach(() => resetStore());

    it('adds clipboard entry', () =>
    {
        const store = useNotemacStore.getState();
        store.addClipboardEntry('hello world');
        const state = useNotemacStore.getState();

        expect(1 === state.clipboardHistory.length).toBe(true);
        expect(state.clipboardHistory[0].text).toBe('hello world');
        expect(0 < state.clipboardHistory[0].timestamp).toBe(true);
    });

    it('newest entries are first', () =>
    {
        const store = useNotemacStore.getState();
        store.addClipboardEntry('first');
        store.addClipboardEntry('second');
        const state = useNotemacStore.getState();

        expect(state.clipboardHistory[0].text).toBe('second');
        expect(state.clipboardHistory[1].text).toBe('first');
    });

    it('limits clipboard history to 50 entries', () =>
    {
        const store = useNotemacStore.getState();
        for (let i = 0, maxCount = 55; i < maxCount; i++)
        {
            store.addClipboardEntry(`entry ${i}`);
        }
        const state = useNotemacStore.getState();
        expect(50 === state.clipboardHistory.length).toBe(true);
    });
});

describe('UIModel — dialog toggles', () =>
{
    beforeEach(() => resetStore());

    it('toggles settings dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSettings(true);
        expect(useNotemacStore.getState().showSettings).toBe(true);
        store.setShowSettings(false);
        expect(useNotemacStore.getState().showSettings).toBe(false);
    });

    it('toggles go-to-line dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowGoToLine(true);
        expect(useNotemacStore.getState().showGoToLine).toBe(true);
    });

    it('toggles about dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowAbout(true);
        expect(useNotemacStore.getState().showAbout).toBe(true);
    });

    it('toggles run command dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowRunCommand(true);
        expect(useNotemacStore.getState().showRunCommand).toBe(true);
    });

    it('toggles column editor dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowColumnEditor(true);
        expect(useNotemacStore.getState().showColumnEditor).toBe(true);
    });

    it('toggles summary dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowSummary(true);
        expect(useNotemacStore.getState().showSummary).toBe(true);
    });

    it('toggles char in range dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowCharInRange(true);
        expect(useNotemacStore.getState().showCharInRange).toBe(true);
    });

    it('toggles shortcut mapper dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowShortcutMapper(true);
        expect(useNotemacStore.getState().showShortcutMapper).toBe(true);
    });
});

describe('UIModel — settings', () =>
{
    beforeEach(() => resetStore());

    it('returns default settings', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.settings.theme).toBe('dark');
        expect(14 === state.settings.fontSize).toBe(true);
        expect(4 === state.settings.tabSize).toBe(true);
        expect(state.settings.wordWrap).toBe(false);
        expect(state.settings.showLineNumbers).toBe(true);
        expect(state.settings.showMinimap).toBe(true);
    });

    it('updates individual settings', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSettings({ fontSize: 18 });
        expect(18 === useNotemacStore.getState().settings.fontSize).toBe(true);
    });

    it('updates multiple settings at once', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSettings({ fontSize: 20, theme: 'monokai', wordWrap: true });
        const settings = useNotemacStore.getState().settings;

        expect(20 === settings.fontSize).toBe(true);
        expect(settings.theme).toBe('monokai');
        expect(settings.wordWrap).toBe(true);
    });

    it('preserves other settings when updating', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSettings({ fontSize: 16 });
        const settings = useNotemacStore.getState().settings;

        expect(settings.theme).toBe('dark');
        expect(settings.showLineNumbers).toBe(true);
        expect(4 === settings.tabSize).toBe(true);
    });

    it('updates cursor settings', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSettings({ cursorStyle: 'block', cursorBlinking: 'smooth' });
        const settings = useNotemacStore.getState().settings;

        expect(settings.cursorStyle).toBe('block');
        expect(settings.cursorBlinking).toBe('smooth');
    });

    it('updates boolean toggles', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSettings({
            autoSave: true,
            highlightCurrentLine: false,
            matchBrackets: false,
            smoothScrolling: false,
        });
        const settings = useNotemacStore.getState().settings;

        expect(settings.autoSave).toBe(true);
        expect(settings.highlightCurrentLine).toBe(false);
        expect(settings.matchBrackets).toBe(false);
        expect(settings.smoothScrolling).toBe(false);
    });
});

describe('UIModel — session save/load', () =>
{
    beforeEach(() =>
    {
        resetStore();
        useNotemacStore.setState({
            tabs: [],
            activeTabId: null,
        });
    });

    it('saves and loads session', () =>
    {
        const store = useNotemacStore.getState();

        const id1 = store.addTab({ name: 'file1.ts', content: 'code1' });
        const id2 = store.addTab({ name: 'file2.py', content: 'code2' });
        store.setActiveTab(id1);
        store.setSidebarPanel('explorer');

        const session = useNotemacStore.getState().saveSession();

        expect(2 === session.tabs.length).toBe(true);
        expect(session.tabs[0].name).toBe('file1.ts');
        expect(session.tabs[1].name).toBe('file2.py');
        expect(0 === session.activeTabIndex).toBe(true);
        expect(session.sidebarPanel).toBe('explorer');

        // Clear and reload
        useNotemacStore.setState({ tabs: [], activeTabId: null, sidebarPanel: null });
        store.loadSession(session);

        const loaded = useNotemacStore.getState();
        expect(2 === loaded.tabs.length).toBe(true);
        expect(loaded.tabs[0].name).toBe('file1.ts');
        expect(loaded.sidebarPanel).toBe('explorer');
    });

    it('handles empty session', () =>
    {
        const store = useNotemacStore.getState();
        store.loadSession({ tabs: [], activeTabIndex: -1, sidebarPanel: null });
        const state = useNotemacStore.getState();

        expect(0 === state.tabs.length).toBe(true);
        expect(null === state.activeTabId).toBe(true);
    });
});
