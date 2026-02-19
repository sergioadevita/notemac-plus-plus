import { useNotemacStore } from "../Model/Store";

/**
 * Handles keyboard shortcut routing for the application.
 * Translates keyboard events into menu actions.
 */
export function HandleKeyDown(e: KeyboardEvent, activeTabId: string | null, zoomLevel: number): void
{
    // Only intercept shortcuts when the app has focus.
    // This prevents Notemac shortcuts from overriding browser shortcuts
    // when the user is interacting with browser chrome (address bar, etc.).
    const activeEl = document.activeElement;
    const appContainer = document.querySelector('.notemac-app');
    const isAppFocused = appContainer?.contains(activeEl) || activeEl === document.body;
    if (!isAppFocused) return;

    const isMod = e.metaKey || e.ctrlKey;
    const store = useNotemacStore.getState();

    if (isMod && 'n' === e.key)
    {
        e.preventDefault();
        store.addTab();
    }
    else if (isMod && 'w' === e.key)
    {
        e.preventDefault();
        if (null !== activeTabId)
            store.closeTab(activeTabId);
    }
    else if (isMod && e.shiftKey && 'T' === e.key)
    {
        e.preventDefault();
        store.restoreLastClosedTab();
    }
    else if (isMod && 'f' === e.key)
    {
        e.preventDefault();
        store.setShowFindReplace(true, 'find');
    }
    else if (isMod && 'h' === e.key)
    {
        e.preventDefault();
        store.setShowFindReplace(true, 'replace');
    }
    else if (isMod && 'g' === e.key)
    {
        e.preventDefault();
        store.setShowGoToLine(true);
    }
    else if (isMod && 'b' === e.key)
    {
        e.preventDefault();
        store.toggleSidebar();
    }
    else if (isMod && ',' === e.key)
    {
        e.preventDefault();
        store.setShowSettings(true);
    }
    else if (isMod && '=' === e.key)
    {
        e.preventDefault();
        store.setZoomLevel(zoomLevel + 1);
    }
    else if (isMod && '-' === e.key)
    {
        e.preventDefault();
        store.setZoomLevel(zoomLevel - 1);
    }
    else if (isMod && '0' === e.key)
    {
        e.preventDefault();
        store.setZoomLevel(0);
    }
    else if (isMod && e.shiftKey && 'P' === e.key)
    {
        e.preventDefault();
        store.setShowCommandPalette(true);
    }
    else if (isMod && e.shiftKey && 'F' === e.key)
    {
        e.preventDefault();
        store.setShowFindReplace(true, 'findInFiles');
    }
    else if (isMod && 'p' === e.key)
    {
        e.preventDefault();
        store.setShowQuickOpen(true);
    }
    else if (e.ctrlKey && '`' === e.key)
    {
        e.preventDefault();
        store.setShowTerminalPanel(!store.showTerminalPanel);
    }
    else if (e.ctrlKey && e.shiftKey && 'G' === e.key)
    {
        e.preventDefault();
        store.setSidebarPanel(store.sidebarPanel === 'git' ? null : 'git');
    }
    else if ('Escape' === e.key)
    {
        store.setShowFindReplace(false);
        store.setShowSettings(false);
        store.setShowGoToLine(false);
        store.setShowAbout(false);
        store.setShowRunCommand(false);
        store.setShowColumnEditor(false);
        store.setShowSummary(false);
        store.setShowCharInRange(false);
        store.setShowShortcutMapper(false);
        store.setShowCommandPalette(false);
        store.setShowQuickOpen(false);
        store.setShowDiffViewer(false);
        store.setShowSnippetManager(false);
        store.setShowCloneDialog(false);
        store.setShowGitSettings(false);
    }
}
