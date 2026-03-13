export interface ShortcutItem
{
    category: string;
    name: string;
    shortcut: string;
    action: string;
}

export const DEFAULT_SHORTCUTS: readonly ShortcutItem[] = [
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
    { category: 'View', name: 'Toggle Terminal', shortcut: 'Cmd+`', action: 'toggle-terminal' },
    { category: 'Edit', name: 'Compare Files', shortcut: '', action: 'compare-files' },
    { category: 'Edit', name: 'Snippet Manager', shortcut: '', action: 'snippet-manager' },

    // Git
    { category: 'Git', name: 'Source Control Panel', shortcut: 'Cmd+Shift+G', action: 'show-git-panel' },
    { category: 'Git', name: 'Clone Repository', shortcut: '', action: 'clone-repository' },
    { category: 'Git', name: 'Git Settings', shortcut: '', action: 'git-settings' },

    // AI
    { category: 'AI', name: 'AI Chat Panel', shortcut: 'Cmd+Shift+A', action: 'ai-chat' },
    { category: 'AI', name: 'Explain Code', shortcut: 'Cmd+Shift+E', action: 'ai-explain' },
    { category: 'AI', name: 'Refactor Code', shortcut: 'Cmd+Shift+R', action: 'ai-refactor' },
    { category: 'AI', name: 'Generate Tests', shortcut: '', action: 'ai-generate-tests' },
    { category: 'AI', name: 'Generate Docs', shortcut: '', action: 'ai-generate-docs' },
    { category: 'AI', name: 'Fix Error', shortcut: '', action: 'ai-fix-error' },
    { category: 'AI', name: 'Simplify Code', shortcut: '', action: 'ai-simplify' },
    { category: 'AI', name: 'AI Settings', shortcut: '', action: 'ai-settings' },
    { category: 'AI', name: 'Toggle Inline Completions', shortcut: '', action: 'ai-toggle-inline' },

    // Plugins
    { category: 'Plugins', name: 'Plugin Manager', shortcut: 'Cmd+Shift+X', action: 'show-plugin-manager' },
    { category: 'Plugins', name: 'Reload Plugins', shortcut: '', action: 'reload-plugins' },

    // Hex Editor
    { category: 'Hex', name: 'View as Hex', shortcut: '', action: 'view-as-hex' },
    { category: 'Hex', name: 'View as Text', shortcut: '', action: 'view-as-text' },
    { category: 'Hex', name: 'Go to Hex Offset', shortcut: '', action: 'hex-goto-offset' },
    { category: 'Hex', name: 'Toggle Hex Bytes Per Row', shortcut: '', action: 'hex-toggle-bytes-per-row' },
] as const;

const STORAGE_KEY: string = 'notemac-custom-shortcuts';

export function LoadCustomShortcuts(): Record<string, string>
{
    try
    {
        if (typeof window === 'undefined' || null === window.localStorage)
        {
            return {};
        }

        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (null === stored || '' === stored)
        {
            return {};
        }

        const parsed = JSON.parse(stored);
        if ('object' !== typeof parsed || null === parsed)
        {
            return {};
        }

        return parsed as Record<string, string>;
    }
    catch
    {
        return {};
    }
}

export function SaveCustomShortcuts(overrides: Record<string, string>): void
{
    try
    {
        if (typeof window === 'undefined' || null === window.localStorage)
        {
            return;
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
    catch
    {
        // Silently fail if storage is unavailable
    }
}

export function GetEffectiveShortcuts(overrides?: Record<string, string>, baseShortcuts?: readonly ShortcutItem[]): ShortcutItem[]
{
    const customOverrides = overrides ?? LoadCustomShortcuts();
    const base = baseShortcuts ?? DEFAULT_SHORTCUTS;

    return base.map((baseItem) =>
    {
        const overriddenShortcut = customOverrides[baseItem.action];

        if (undefined !== overriddenShortcut && '' !== overriddenShortcut)
        {
            return {
                ...baseItem,
                shortcut: overriddenShortcut
            };
        }

        return baseItem;
    });
}

export function FindConflict(
    shortcut: string,
    excludeAction: string,
    overrides?: Record<string, string>,
    baseShortcuts?: readonly ShortcutItem[]
): ShortcutItem | null
{
    if ('' === shortcut)
    {
        return null;
    }

    const customOverrides = overrides ?? LoadCustomShortcuts();
    const effective = GetEffectiveShortcuts(customOverrides, baseShortcuts);

    for (const item of effective)
    {
        if (excludeAction === item.action)
        {
            continue;
        }

        if (shortcut === item.shortcut)
        {
            return item;
        }
    }

    return null;
}

export function NormalizeKeyboardEvent(e: KeyboardEvent): string
{
    const parts: string[] = [];

    // Add Cmd for metaKey or ctrlKey
    if (e.metaKey || e.ctrlKey)
    {
        parts.push('Cmd');
    }

    // Add Shift
    if (e.shiftKey)
    {
        parts.push('Shift');
    }

    // Add Alt
    if (e.altKey)
    {
        parts.push('Alt');
    }

    // Normalize the key
    let key = e.key;

    // Handle special arrow keys
    if ('ArrowUp' === key)
    {
        key = 'Up';
    }
    else if ('ArrowDown' === key)
    {
        key = 'Down';
    }
    else if ('ArrowLeft' === key)
    {
        key = 'Left';
    }
    else if ('ArrowRight' === key)
    {
        key = 'Right';
    }
    else if ('Backquote' === key || '`' === key)
    {
        key = '`';
    }
    else if ('Escape' === key)
    {
        key = 'Escape';
    }
    else if (1 === key.length && 'a' <= key && key <= 'z')
    {
        // Uppercase single letters
        key = key.toUpperCase();
    }

    // Check if key is ONLY a modifier
    if ('Meta' === key || 'Control' === key || 'Shift' === key || 'Alt' === key)
    {
        return '';
    }

    parts.push(key);

    return parts.join('+');
}

export function IsValidShortcut(shortcut: string): boolean
{
    if ('' === shortcut)
    {
        return false;
    }

    // Must contain at least one non-modifier key
    const parts = shortcut.split('+');

    for (const part of parts)
    {
        if ('Cmd' !== part && 'Shift' !== part && 'Alt' !== part)
        {
            return true;
        }
    }

    return false;
}

export function GetDefaultShortcuts(): readonly ShortcutItem[]
{
    return DEFAULT_SHORTCUTS;
}

export function GetShortcutCategories(baseShortcuts?: readonly ShortcutItem[]): string[]
{
    const base = baseShortcuts ?? DEFAULT_SHORTCUTS;
    const categories = new Set<string>();
    for (const shortcut of base)
    {
        categories.add(shortcut.category);
    }
    return Array.from(categories);
}

export function GetShortcutsByCategory(category: string, baseShortcuts?: readonly ShortcutItem[]): ShortcutItem[]
{
    const base = baseShortcuts ?? DEFAULT_SHORTCUTS;
    return base.filter(s => s.category === category) as ShortcutItem[];
}
