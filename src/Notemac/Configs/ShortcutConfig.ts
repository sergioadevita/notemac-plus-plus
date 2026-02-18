interface ShortcutItem
{
    category: string;
    name: string;
    shortcut: string;
    action: string;
}

const DEFAULT_SHORTCUTS: readonly ShortcutItem[] = [
    // File
    { category: 'File', name: 'New File', shortcut: 'Cmd+N', action: 'new' },
    { category: 'File', name: 'Open File', shortcut: 'Cmd+O', action: 'open' },
    { category: 'File', name: 'Save', shortcut: 'Cmd+S', action: 'save' },
    { category: 'File', name: 'Save As', shortcut: 'Cmd+Shift+S', action: 'save-as' },
    { category: 'File', name: 'Save All', shortcut: 'Cmd+Alt+S', action: 'save-all' },
    { category: 'File', name: 'Close Tab', shortcut: 'Cmd+W', action: 'close-tab' },
    { category: 'File', name: 'Restore Last Closed', shortcut: 'Cmd+Shift+T', action: 'restore-last-closed' },
    { category: 'File', name: 'Quick Open', shortcut: 'Cmd+P', action: 'quick-open' },

    // Edit
    { category: 'Edit', name: 'Undo', shortcut: 'Cmd+Z', action: 'undo' },
    { category: 'Edit', name: 'Redo', shortcut: 'Cmd+Shift+Z', action: 'redo' },
    { category: 'Edit', name: 'Cut', shortcut: 'Cmd+X', action: 'cut' },
    { category: 'Edit', name: 'Copy', shortcut: 'Cmd+C', action: 'copy' },
    { category: 'Edit', name: 'Paste', shortcut: 'Cmd+V', action: 'paste' },
    { category: 'Edit', name: 'Select All', shortcut: 'Cmd+A', action: 'select-all' },
    { category: 'Edit', name: 'Duplicate Line', shortcut: 'Cmd+D', action: 'duplicate-line' },
    { category: 'Edit', name: 'Delete Line', shortcut: 'Cmd+Shift+K', action: 'delete-line' },
    { category: 'Edit', name: 'Move Line Up', shortcut: 'Alt+Up', action: 'move-line-up' },
    { category: 'Edit', name: 'Move Line Down', shortcut: 'Alt+Down', action: 'move-line-down' },
    { category: 'Edit', name: 'Toggle Comment', shortcut: 'Cmd+/', action: 'toggle-comment' },
    { category: 'Edit', name: 'Column Editor', shortcut: 'Alt+C', action: 'column-editor' },

    // Search
    { category: 'Search', name: 'Find', shortcut: 'Cmd+F', action: 'find' },
    { category: 'Search', name: 'Replace', shortcut: 'Cmd+H', action: 'replace' },
    { category: 'Search', name: 'Find in Files', shortcut: 'Cmd+Shift+F', action: 'find-in-files' },
    { category: 'Search', name: 'Go to Line', shortcut: 'Cmd+G', action: 'goto-line' },
    { category: 'Search', name: 'Go to Matching Brace', shortcut: 'Cmd+Shift+\\', action: 'goto-matching-brace' },
    { category: 'Search', name: 'Mark', shortcut: 'Cmd+M', action: 'mark' },

    // View
    { category: 'View', name: 'Toggle Sidebar', shortcut: 'Cmd+B', action: 'toggle-sidebar' },
    { category: 'View', name: 'Zoom In', shortcut: 'Cmd+=', action: 'zoom-in' },
    { category: 'View', name: 'Zoom Out', shortcut: 'Cmd+-', action: 'zoom-out' },
    { category: 'View', name: 'Reset Zoom', shortcut: 'Cmd+0', action: 'zoom-reset' },
    { category: 'View', name: 'Word Wrap', shortcut: 'Alt+Z', action: 'word-wrap' },
    { category: 'View', name: 'Fold All', shortcut: 'Cmd+K Cmd+0', action: 'fold-all' },
    { category: 'View', name: 'Unfold All', shortcut: 'Cmd+K Cmd+J', action: 'unfold-all' },

    // Settings
    { category: 'Settings', name: 'Preferences', shortcut: 'Cmd+,', action: 'preferences' },
    { category: 'Settings', name: 'Shortcut Mapper', shortcut: 'Cmd+Alt+S', action: 'shortcut-mapper' },

    // Macro
    { category: 'Macro', name: 'Start Recording', shortcut: 'Cmd+Shift+R', action: 'macro-start' },
    { category: 'Macro', name: 'Stop Recording', shortcut: 'Cmd+Shift+R', action: 'macro-stop' },
    { category: 'Macro', name: 'Playback', shortcut: 'Cmd+Shift+P', action: 'macro-playback' },

    // New features
    { category: 'View', name: 'Command Palette', shortcut: 'Cmd+Shift+P', action: 'command-palette' },
    { category: 'View', name: 'Toggle Terminal', shortcut: 'Ctrl+`', action: 'toggle-terminal' },
    { category: 'Edit', name: 'Compare Files', shortcut: '', action: 'compare-files' },
    { category: 'Edit', name: 'Snippet Manager', shortcut: '', action: 'snippet-manager' },
] as const;

export function GetDefaultShortcuts(): readonly ShortcutItem[]
{
    return DEFAULT_SHORTCUTS;
}

export function GetShortcutCategories(): string[]
{
    const categories = new Set<string>();
    for (const shortcut of DEFAULT_SHORTCUTS)
    {
        categories.add(shortcut.category);
    }
    return Array.from(categories);
}

export function GetShortcutsByCategory(category: string): ShortcutItem[]
{
    return DEFAULT_SHORTCUTS.filter(s => s.category === category) as ShortcutItem[];
}
