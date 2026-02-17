import { useNotemacStore } from "../Model/Store";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';
import type { FileTab } from "../Commons/Types";

/**
 * Routes menu actions to the appropriate store mutations and side effects.
 * This is the central action dispatcher for all menu-triggered commands.
 */
export function HandleMenuAction(
    action: string,
    activeTabId: string | null,
    tabs: FileTab[],
    zoomLevel: number,
    value?: any,
): void
{
    const store = useNotemacStore.getState();
    const editorAction = (window as any).__editorAction;

    switch (action)
    {
        // File actions
        case 'new':
            store.addTab();
            break;
        case 'open':
            HandleOpenFile();
            break;
        case 'open-folder':
            HandleOpenFolder();
            break;
        case 'save':
            HandleSaveFile(activeTabId, tabs, false);
            break;
        case 'save-as':
            HandleSaveFile(activeTabId, tabs, true);
            break;
        case 'save-copy-as':
            HandleSaveFile(activeTabId, tabs, true);
            break;
        case 'save-all':
            HandleSaveAllFiles(tabs);
            break;
        case 'reload-from-disk':
            HandleReloadFromDisk(activeTabId, tabs);
            break;
        case 'rename-file':
            HandleRenameFile(activeTabId, tabs);
            break;
        case 'delete-file':
            // Cannot delete from disk in web — only close the tab
            if (null !== activeTabId)
                store.closeTab(activeTabId);
            break;
        case 'close-tab':
            if (null !== activeTabId)
                store.closeTab(activeTabId);
            break;
        case 'close-all':
            store.closeAllTabs();
            break;
        case 'close-others':
            if (null !== activeTabId)
                store.closeOtherTabs(activeTabId);
            break;
        case 'close-tabs-to-left':
            if (null !== activeTabId)
                store.closeTabsToLeft(activeTabId);
            break;
        case 'close-tabs-to-right':
            if (null !== activeTabId)
                store.closeTabsToRight(activeTabId);
            break;
        case 'close-unchanged':
            store.closeUnchangedTabs();
            break;
        case 'close-all-but-pinned':
            store.closeAllButPinned();
            break;
        case 'restore-last-closed':
            store.restoreLastClosedTab();
            break;
        case 'pin-tab':
            if (null !== activeTabId)
                store.togglePinTab(activeTabId);
            break;
        case 'print':
            window.print();
            break;

        // Search actions
        case 'find':
            store.setShowFindReplace(true, 'find');
            break;
        case 'replace':
            store.setShowFindReplace(true, 'replace');
            break;
        case 'find-in-files':
            store.setShowFindReplace(true, 'findInFiles');
            break;
        case 'mark':
            store.setShowFindReplace(true, 'mark');
            break;
        case 'incremental-search':
            store.setShowIncrementalSearch(true);
            break;
        case 'goto-line':
            store.setShowGoToLine(true);
            break;
        case 'find-char-in-range':
            store.setShowCharInRange(true);
            break;

        // View actions
        case 'word-wrap':
            store.updateSettings({ wordWrap: value });
            break;
        case 'show-whitespace':
            store.updateSettings({ showWhitespace: value, renderWhitespace: value ? 'all' : 'none' });
            break;
        case 'show-eol':
            store.updateSettings({ showEOL: value });
            break;
        case 'show-non-printable':
            store.updateSettings({ showNonPrintable: value });
            break;
        case 'show-wrap-symbol':
            store.updateSettings({ showWrapSymbol: value });
            break;
        case 'indent-guide':
            store.updateSettings({ showIndentGuides: value });
            break;
        case 'show-line-numbers':
            store.updateSettings({ showLineNumbers: value });
            break;
        case 'toggle-minimap':
            store.updateSettings({ showMinimap: value });
            break;
        case 'zoom-in':
            store.setZoomLevel(zoomLevel + 1);
            break;
        case 'zoom-out':
            store.setZoomLevel(zoomLevel - 1);
            break;
        case 'zoom-reset':
            store.setZoomLevel(0);
            break;
        case 'toggle-sidebar':
            store.toggleSidebar();
            break;
        case 'show-doc-list':
            store.setSidebarPanel('docList');
            break;
        case 'show-function-list':
            store.setSidebarPanel('functions');
            break;
        case 'show-project-panel':
            store.setSidebarPanel('project');
            break;
        case 'distraction-free':
            store.updateSettings({ distractionFreeMode: value });
            break;
        case 'always-on-top':
        {
            store.updateSettings({ alwaysOnTop: value });
            if (window.electronAPI)
                (window.electronAPI as any).setAlwaysOnTop?.(value);
            break;
        }
        case 'sync-scroll-v':
            store.updateSettings({ syncScrollVertical: value });
            break;
        case 'sync-scroll-h':
            store.updateSettings({ syncScrollHorizontal: value });
            break;
        case 'split-right':
            if (null !== activeTabId)
                store.setSplitView('vertical', activeTabId);
            break;
        case 'split-down':
            if (null !== activeTabId)
                store.setSplitView('horizontal', activeTabId);
            break;
        case 'close-split':
            store.setSplitView('none');
            break;
        case 'show-summary':
            store.setShowSummary(true);
            break;
        case 'toggle-monitoring':
        {
            if (null !== activeTabId)
            {
                const tab = tabs.find(t => t.id === activeTabId);
                if (tab)
                    store.updateTab(activeTabId, { isMonitoring: !tab.isMonitoring });
            }
            break;
        }

        // Language / Encoding
        case 'language':
            if (null !== activeTabId)
                store.updateTab(activeTabId, { language: value });
            break;
        case 'encoding':
            if (null !== activeTabId)
                store.updateTab(activeTabId, { encoding: value });
            break;
        case 'line-ending':
            if (null !== activeTabId)
                store.updateTab(activeTabId, { lineEnding: value });
            break;

        // Macro
        case 'macro-start':
            store.startRecordingMacro();
            break;
        case 'macro-stop':
            store.stopRecordingMacro();
            break;

        // Dialogs
        case 'preferences':
            store.setShowSettings(true);
            break;
        case 'about':
            store.setShowAbout(true);
            break;
        case 'run-command':
            store.setShowRunCommand(true);
            break;
        case 'column-editor':
            store.setShowColumnEditor(true);
            break;
        case 'shortcut-mapper':
            store.setShowShortcutMapper(true);
            break;
        case 'clipboard-history':
            store.setSidebarPanel('clipboardHistory');
            break;
        case 'char-panel':
            store.setSidebarPanel('charPanel');
            break;

        // Run menu
        case 'search-google':
        {
            const sel = window.getSelection()?.toString();
            if (sel)
                window.open(`https://www.google.com/search?q=${encodeURIComponent(sel)}`, '_blank');
            break;
        }
        case 'search-wikipedia':
        {
            const sel = window.getSelection()?.toString();
            if (sel)
                window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(sel)}`, '_blank');
            break;
        }
        case 'open-in-browser':
        {
            const tab = tabs.find(t => t.id === activeTabId);
            if (tab && tab.path)
                window.open(`file://${tab.path}`, '_blank');
            break;
        }

        // Session management
        case 'save-session':
        {
            const session = store.saveSession();
            const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'session.json';
            a.click();
            URL.revokeObjectURL(url);
            break;
        }
        case 'load-session':
        {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) =>
            {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file)
                {
                    const text = await file.text();
                    try
                    {
                        useNotemacStore.getState().loadSession(JSON.parse(text));
                    }
                    catch {}
                }
            };
            input.click();
            break;
        }

        // All editor-handled actions (pass through)
        default:
            if (editorAction)
                editorAction(action, value);
            break;
    }
}

// ─── File Operation Helpers ───────────────────────────────────────

function HandleOpenFile(): void
{
    if (window.electronAPI)
    {
        window.electronAPI.openFile?.();
        return;
    }

    // Web: use file input dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () =>
    {
        if (!input.files)
            return;

        const store = useNotemacStore.getState();
        for (const file of Array.from(input.files))
        {
            const content = await file.text();
            store.addTab({
                name: file.name,
                content,
                language: detectLanguage(file.name),
                lineEnding: detectLineEnding(content),
            });
        }
    };
    input.click();
}

function HandleOpenFolder(): void
{
    if (window.electronAPI)
    {
        window.electronAPI.openFolder?.();
        return;
    }

    // Web: use directory picker if available
    const input = document.createElement('input');
    input.type = 'file';
    (input as any).webkitdirectory = true;
    input.onchange = async () =>
    {
        if (!input.files || 0 === input.files.length)
            return;

        const store = useNotemacStore.getState();
        for (const file of Array.from(input.files))
        {
            const content = await file.text();
            store.addTab({
                name: file.name,
                content,
                language: detectLanguage(file.name),
                lineEnding: detectLineEnding(content),
            });
        }
    };
    input.click();
}

function HandleSaveFile(activeTabId: string | null, tabs: FileTab[], saveAs: boolean): void
{
    if (null === activeTabId)
        return;

    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab)
        return;

    if (window.electronAPI)
    {
        if (saveAs || !tab.path)
            window.electronAPI.saveFileAs?.(tab.content, tab.name);
        else
            window.electronAPI.saveFile?.(tab.content, tab.path);

        // Mark as saved
        useNotemacStore.getState().updateTab(activeTabId, { isModified: false });
        return;
    }

    // Web: download as blob
    const blob = new Blob([tab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.name;
    a.click();
    URL.revokeObjectURL(url);

    useNotemacStore.getState().updateTab(activeTabId, { isModified: false });
}

function HandleSaveAllFiles(tabs: FileTab[]): void
{
    const store = useNotemacStore.getState();

    for (const tab of tabs)
    {
        if (!tab.isModified)
            continue;

        if (window.electronAPI && tab.path)
        {
            window.electronAPI.saveFile?.(tab.content, tab.path);
            store.updateTab(tab.id, { isModified: false });
        }
        else
        {
            // Web: download each modified file
            const blob = new Blob([tab.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = tab.name;
            a.click();
            URL.revokeObjectURL(url);
            store.updateTab(tab.id, { isModified: false });
        }
    }
}

function HandleReloadFromDisk(activeTabId: string | null, tabs: FileTab[]): void
{
    if (null === activeTabId)
        return;

    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab)
        return;

    if (window.electronAPI && tab.path)
    {
        window.electronAPI.readFile?.(tab.path).then((content: string) =>
        {
            useNotemacStore.getState().updateTabContent(activeTabId, content);
            useNotemacStore.getState().updateTab(activeTabId, { isModified: false });
        });
        return;
    }

    // Web: re-open file picker for reload
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () =>
    {
        const file = input.files?.[0];
        if (file)
        {
            const content = await file.text();
            useNotemacStore.getState().updateTabContent(activeTabId, content);
            useNotemacStore.getState().updateTab(activeTabId, { isModified: false, name: file.name });
        }
    };
    input.click();
}

function HandleRenameFile(activeTabId: string | null, tabs: FileTab[]): void
{
    if (null === activeTabId)
        return;

    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab)
        return;

    const newName = prompt('Enter new file name:', tab.name);
    if (newName && newName !== tab.name)
    {
        useNotemacStore.getState().updateTab(activeTabId, { name: newName });

        if (window.electronAPI && tab.path)
            window.electronAPI.renameFile?.(tab.path, newName);
    }
}
