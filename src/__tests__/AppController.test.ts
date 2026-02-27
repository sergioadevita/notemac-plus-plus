import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandleKeyDown } from '../Notemac/Controllers/AppController';
import { useNotemacStore } from '../Notemac/Model/Store';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

function createKeyboardEvent(key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent
{
    return new KeyboardEvent('keydown', {
        key,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...options,
    });
}

describe('AppController — HandleKeyDown', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            addTab: vi.fn(),
            closeTab: vi.fn(),
            restoreLastClosedTab: vi.fn(),
            setShowFindReplace: vi.fn(),
            setShowGoToLine: vi.fn(),
            toggleSidebar: vi.fn(),
            setShowSettings: vi.fn(),
            setZoomLevel: vi.fn(),
            setShowCommandPalette: vi.fn(),
            setShowQuickOpen: vi.fn(),
            setShowTerminalPanel: vi.fn(),
            showTerminalPanel: false,
            setSidebarPanel: vi.fn(),
            sidebarPanel: null,
            setShowAbout: vi.fn(),
            setShowRunCommand: vi.fn(),
            setShowColumnEditor: vi.fn(),
            setShowSummary: vi.fn(),
            setShowCharInRange: vi.fn(),
            setShowShortcutMapper: vi.fn(),
            setShowDiffViewer: vi.fn(),
            setShowSnippetManager: vi.fn(),
            setShowCloneDialog: vi.fn(),
            setShowGitSettings: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    // Ctrl/Cmd+N: new tab
    it('opens new tab with Cmd+N or Ctrl+N', () =>
    {
        const event = createKeyboardEvent('n', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.addTab).toHaveBeenCalled();
    });

    it('opens new tab with Ctrl+N on non-Mac', () =>
    {
        const event = createKeyboardEvent('n', { ctrlKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.addTab).toHaveBeenCalled();
    });

    // Ctrl/Cmd+W: close tab
    it('closes active tab with Cmd+W or Ctrl+W', () =>
    {
        const event = createKeyboardEvent('w', { metaKey: true });
        HandleKeyDown(event, 'tab-1', 0);
        expect(mockStore.closeTab).toHaveBeenCalledWith('tab-1');
    });

    it('does nothing closing tab when no active tab', () =>
    {
        const event = createKeyboardEvent('w', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.closeTab).not.toHaveBeenCalled();
    });

    // Ctrl/Cmd+Shift+T: restore last closed tab
    it('restores last closed tab with Cmd+Shift+T or Ctrl+Shift+T', () =>
    {
        const event = createKeyboardEvent('T', { metaKey: true, shiftKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.restoreLastClosedTab).toHaveBeenCalled();
    });

    // Ctrl/Cmd+F: find
    it('opens find with Cmd+F or Ctrl+F', () =>
    {
        const event = createKeyboardEvent('f', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'find');
    });

    // Ctrl/Cmd+H: replace
    it('opens replace with Cmd+H or Ctrl+H', () =>
    {
        const event = createKeyboardEvent('h', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'replace');
    });

    // Ctrl/Cmd+G: go to line
    it('opens go to line with Cmd+G or Ctrl+G', () =>
    {
        const event = createKeyboardEvent('g', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowGoToLine).toHaveBeenCalled();
    });

    // Ctrl/Cmd+B: toggle sidebar
    it('toggles sidebar with Cmd+B or Ctrl+B', () =>
    {
        const event = createKeyboardEvent('b', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.toggleSidebar).toHaveBeenCalled();
    });

    // Ctrl/Cmd+,: settings
    it('opens settings with Cmd+, or Ctrl+,', () =>
    {
        const event = createKeyboardEvent(',', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowSettings).toHaveBeenCalled();
    });

    // Ctrl/Cmd+=: zoom in
    it('zooms in with Cmd+= or Ctrl+=', () =>
    {
        const event = createKeyboardEvent('=', { metaKey: true });
        HandleKeyDown(event, null, 3);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(4);
    });

    // Ctrl/Cmd+-: zoom out
    it('zooms out with Cmd+- or Ctrl+-', () =>
    {
        const event = createKeyboardEvent('-', { metaKey: true });
        HandleKeyDown(event, null, 2);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(1);
    });

    // Ctrl/Cmd+0: reset zoom
    it('resets zoom with Cmd+0 or Ctrl+0', () =>
    {
        const event = createKeyboardEvent('0', { metaKey: true });
        HandleKeyDown(event, null, 5);
        expect(mockStore.setZoomLevel).toHaveBeenCalledWith(0);
    });

    // Ctrl/Cmd+Shift+P: command palette
    it('opens command palette with Cmd+Shift+P or Ctrl+Shift+P', () =>
    {
        const event = createKeyboardEvent('P', { metaKey: true, shiftKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowCommandPalette).toHaveBeenCalledWith(true);
    });

    // Ctrl/Cmd+Shift+F: find in files
    it('opens find in files with Cmd+Shift+F or Ctrl+Shift+F', () =>
    {
        const event = createKeyboardEvent('F', { metaKey: true, shiftKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(true, 'findInFiles');
    });

    // Ctrl/Cmd+P: quick open
    it('opens quick open with Cmd+P or Ctrl+P', () =>
    {
        const event = createKeyboardEvent('p', { metaKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowQuickOpen).toHaveBeenCalled();
    });

    // Ctrl+`: toggle terminal
    it('toggles terminal panel with Ctrl+`', () =>
    {
        const event = createKeyboardEvent('`', { ctrlKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowTerminalPanel).toHaveBeenCalledWith(true);
    });

    it('toggles terminal panel on/off', () =>
    {
        mockStore.showTerminalPanel = true;
        const event = createKeyboardEvent('`', { ctrlKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowTerminalPanel).toHaveBeenCalledWith(false);
    });

    // Ctrl+Shift+G: git panel
    it('toggles git panel with Ctrl+Shift+G', () =>
    {
        mockStore.sidebarPanel = null;
        const event = createKeyboardEvent('G', { ctrlKey: true, shiftKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setSidebarPanel).toHaveBeenCalledWith('git');
    });

    it('closes git panel if already open with Ctrl+Shift+G', () =>
    {
        mockStore.sidebarPanel = 'git';
        const event = createKeyboardEvent('G', { ctrlKey: true, shiftKey: true });
        HandleKeyDown(event, null, 0);
        expect(mockStore.setSidebarPanel).toHaveBeenCalledWith(null);
    });

    // Escape: close dialogs
    it('closes all dialogs with Escape', () =>
    {
        const event = createKeyboardEvent('Escape');
        HandleKeyDown(event, null, 0);
        expect(mockStore.setShowFindReplace).toHaveBeenCalledWith(false);
        expect(mockStore.setShowSettings).toHaveBeenCalledWith(false);
        expect(mockStore.setShowGoToLine).toHaveBeenCalledWith(false);
        expect(mockStore.setShowAbout).toHaveBeenCalledWith(false);
    });

    // Unknown keys should not crash
    it('does not crash on unknown key combination', () =>
    {
        const event = createKeyboardEvent('z', { metaKey: true, shiftKey: true });
        expect(() =>
        {
            HandleKeyDown(event, null, 0);
        }).not.toThrow();
    });

    // Modifier key edge cases
    it('does not trigger Cmd+N when only Cmd is pressed', () =>
    {
        const event = createKeyboardEvent('Meta');
        HandleKeyDown(event, null, 0);
        expect(mockStore.addTab).not.toHaveBeenCalled();
    });

    it('handles both metaKey and ctrlKey properly', () =>
    {
        const event = createKeyboardEvent('n', { metaKey: true, ctrlKey: true });
        HandleKeyDown(event, null, 0);
        // Should trigger because metaKey is true
        expect(mockStore.addTab).toHaveBeenCalled();
    });
});
