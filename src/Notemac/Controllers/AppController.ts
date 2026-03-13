import { useNotemacStore } from "../Model/Store";
import { GetEffectiveShortcuts, NormalizeKeyboardEvent } from "../Configs/ShortcutConfig";
import { GetPresetById } from "../Configs/ShortcutPresets";
import { HandleMenuAction } from "./MenuActionController";

/**
 * Handles keyboard shortcut routing for the application.
 * Translates keyboard events into menu actions using a dynamic lookup map.
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

    const store = useNotemacStore.getState();

    // Special case: Escape key closes all dialogs
    if ('Escape' === e.key)
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
        return;
    }

    // Build dynamic lookup map from effective shortcuts
    // Resolve base shortcuts from active preset
    const activePreset = GetPresetById(store.activePresetId);
    const baseShortcuts = null !== activePreset ? activePreset.shortcuts : undefined;
    const effectiveShortcuts = GetEffectiveShortcuts(store.customShortcutOverrides, baseShortcuts);
    const shortcutMap: Record<string, string> = {};

    for (const item of effectiveShortcuts)
    {
        if ('' !== item.shortcut)
        {
            shortcutMap[item.shortcut] = item.action;
        }
    }

    // Normalize keyboard event to shortcut string
    const normalizedShortcut = NormalizeKeyboardEvent(e);

    // Look up the normalized shortcut in the map
    if ('' !== normalizedShortcut && undefined !== shortcutMap[normalizedShortcut])
    {
        e.preventDefault();
        const action = shortcutMap[normalizedShortcut];
        HandleMenuAction(action, activeTabId, store.tabs, zoomLevel);
    }
}
