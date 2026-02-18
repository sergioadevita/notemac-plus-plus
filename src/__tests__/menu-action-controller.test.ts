import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandleMenuAction } from '../Notemac/Controllers/MenuActionController';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { FileTab } from '../Notemac/Commons/Types';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// Mock editor globals
vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
    GetEditorAction: vi.fn(() => null),
}));

function createMockTab(overrides?: Partial<FileTab>): FileTab
{
    return {
        id: 'tab-1',
        name: 'test.ts',
        path: '/path/to/test.ts',
        content: 'console.log("hello");',
        originalContent: 'console.log("hello");',
        language: 'typescript',
        encoding: 'utf-8',
        lineEnding: 'LF',
        isModified: false,
        isReadOnly: false,
        isPinned: false,
        tabColor: 'none',
        cursorLine: 0,
        cursorColumn: 0,
        scrollTop: 0,
        bookmarks: [],
        marks: [],
        hiddenLines: [],
        isMonitoring: false,
        ...overrides,
    };
}

describe('MenuActionController — HandleMenuAction', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            addTab: vi.fn(),
            closeTab: vi.fn(),
            closeAllTabs: vi.fn(),
            closeOtherTabs: vi.fn(),
            closeTabsToLeft: vi.fn(),
            closeTabsToRight: vi.fn(),
            closeUnchangedTabs: vi.fn(),
            closeAllButPinned: vi.fn(),
            restoreLastClosedTab: vi.fn(),
            togglePinTab: vi.fn(),
            setShowFindReplace: vi.fn(),
            setShowGoToLine: vi.fn(),
            setShowIncrementalSearch: vi.fn(),
            setShowCharInRange: vi.fn(),
            updateSettings: vi.fn(),
            setZoomLevel: vi.fn(),
            toggleSidebar: vi.fn(),
            setSidebarPanel: vi.fn(),
            setShowSummary: vi.fn(),
            updateTab: vi.fn(),
            setShowCommandPalette: vi.fn(),
            setShowQuickOpen: vi.fn(),
            setShowDiffViewer: vi.fn(),
            setShowSnippetManager: vi.fn(),
            setShowTerminalPanel: vi.fn(),
            showTerminalPanel: false,
            setShowCloneDialog: vi.fn(),
            setShowGitSettings: vi.fn(),
            SetShowAiSettings: vi.fn(),
            SetInlineSuggestionEnabled: vi.fn(),
            inlineSuggestionEnabled: false,
            setShowSettings: vi.fn(),
            setShowAbout: vi.fn(),
            setShowRunCommand: vi.fn(),
            setShowColumnEditor: vi.fn(),
            setShowShortcutMapper: vi.fn(),
            saveSession: vi.fn(() => ({})),
            loadSession: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    // File actions
    it('handles new file action', () =>
    {
        HandleMenuAction('new', null, [], 0);
        expect(mockStore.addTab).toHaveBeenCalled();
    });

    it('handles close-tab action with active tab', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('close-tab', 'tab-1', tabs, 0);
        expect(mockStore.closeTab).toHaveBeenCalledWith('tab-1');
    });

    it('does nothing for close-tab with no active tab', () =>
    {
        HandleMenuAction('close-tab', null, [], 0);
        expect(mockStore.closeTab).not.toHaveBeenCalled();
    });

    it('handles close-all action', () =>
    {
        const tabs = [createMockTab(), createMockTab({ id: 'tab-2' })];
        HandleMenuAction('close-all', 'tab-1', tabs, 0);
        expect(mockStore.closeAllTabs).toHaveBeenCalled();
    });

    // Search actions
    it('handles find action', () =>
    {
        HandleMenuAction('find', null, [], 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'find');
    });

    it('handles replace action', () =>
    {
        HandleMenuAction('replace', null, [], 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'replace');
    });

    it('handles find-in-files action', () =>
    {
        HandleMenuAction('find-in-files', null, [], 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'findInFiles');
    });

    it('handles goto-line action', () =>
    {
        HandleMenuAction('goto-line', null, [], 0);
        expect(mockStore.setShowGoToLine).toHaveBeenCalled();
    });

    // View actions
    it('handles zoom-in action', () =>
    {
        HandleMenuAction('zoom-in', null, [], 3);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(4);
    });

    it('handles zoom-out action', () =>
    {
        HandleMenuAction('zoom-out', null, [], 2);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(1);
    });

    it('handles zoom-reset action', () =>
    {
        HandleMenuAction('zoom-reset', null, [], 5);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(0);
    });

    it('handles toggle-sidebar action', () =>
    {
        HandleMenuAction('toggle-sidebar', null, [], 0);
        expect(mockStore.toggleSidebar).toHaveBeenCalled();
    });

    it('handles distraction-free action with value', () =>
    {
        HandleMenuAction('distraction-free', null, [], 0, true);
        expect(mockStore.updateSettings).toHaveBeenCalledWith({ distractionFreeMode: true });
    });

    // Tab actions
    it('handles close-tabs-to-left action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('close-tabs-to-left', 'tab-1', tabs, 0);
        expect(mockStore.closeTabsToLeft).toHaveBeenCalledWith('tab-1');
    });

    it('handles close-tabs-to-right action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('close-tabs-to-right', 'tab-1', tabs, 0);
        expect(mockStore.closeTabsToRight).toHaveBeenCalledWith('tab-1');
    });

    it('handles pin-tab action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('pin-tab', 'tab-1', tabs, 0);
        expect(mockStore.togglePinTab).toHaveBeenCalledWith('tab-1');
    });

    // Language and encoding
    it('handles language change action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('language', 'tab-1', tabs, 0, 'python');
        expect(mockStore.updateTab).toHaveBeenCalledWith('tab-1', { language: 'python' });
    });

    it('handles encoding change action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('encoding', 'tab-1', tabs, 0, 'utf-16');
        expect(mockStore.updateTab).toHaveBeenCalledWith('tab-1', { encoding: 'utf-16' });
    });

    it('handles line-ending change action', () =>
    {
        const tabs = [createMockTab()];
        HandleMenuAction('line-ending', 'tab-1', tabs, 0, 'CRLF');
        expect(mockStore.updateTab).toHaveBeenCalledWith('tab-1', { lineEnding: 'CRLF' });
    });

    // Macro actions
    it('handles macro-start action', () =>
    {
        mockStore.startRecordingMacro = vi.fn();
        HandleMenuAction('macro-start', null, [], 0);
        expect(mockStore.startRecordingMacro).toHaveBeenCalled();
    });

    it('handles macro-stop action', () =>
    {
        mockStore.stopRecordingMacro = vi.fn();
        HandleMenuAction('macro-stop', null, [], 0);
        expect(mockStore.stopRecordingMacro).toHaveBeenCalled();
    });

    // Dialog actions
    it('handles command-palette action', () =>
    {
        HandleMenuAction('command-palette', null, [], 0);
        expect(mockStore.setShowCommandPalette).toHaveBeenCalledWith(true);
    });

    it('handles preferences action', () =>
    {
        HandleMenuAction('preferences', null, [], 0);
        expect(mockStore.setShowSettings).toHaveBeenCalledWith(true);
    });

    it('handles about action', () =>
    {
        HandleMenuAction('about', null, [], 0);
        expect(mockStore.setShowAbout).toHaveBeenCalledWith(true);
    });

    // Unknown action should not crash
    it('does not crash on unknown action', () =>
    {
        expect(() =>
        {
            HandleMenuAction('unknown-action-xyz', null, [], 0);
        }).not.toThrow();
    });
});
