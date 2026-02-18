import type { CommandDefinition } from "../Commons/Types";
import { GetDefaultShortcuts } from "./ShortcutConfig";

/**
 * Builds and returns the full list of available commands for the Command Palette.
 * Combines shortcut-mapped commands with additional menu actions.
 */
export function GetAllCommands(): CommandDefinition[]
{
    const commands: CommandDefinition[] = [];
    const shortcuts = GetDefaultShortcuts();
    const maxCount = shortcuts.length;

    // Build from shortcut config
    for (let i = 0; i < maxCount; i++)
    {
        const s = shortcuts[i];
        commands.push({
            id: s.action,
            label: s.name,
            category: s.category,
            keybinding: s.shortcut,
            action: s.action,
        });
    }

    // Additional commands not in shortcuts
    const extraCommands: CommandDefinition[] = [
        { id: 'command-palette', label: 'Command Palette', category: 'View', action: 'command-palette' },
        { id: 'quick-open', label: 'Quick Open File', category: 'File', action: 'quick-open' },
        { id: 'compare-files', label: 'Compare Files', category: 'Edit', action: 'compare-files' },
        { id: 'snippet-manager', label: 'Snippet Manager', category: 'Edit', action: 'snippet-manager' },
        { id: 'toggle-terminal', label: 'Toggle Terminal', category: 'View', action: 'toggle-terminal' },
        { id: 'open-folder', label: 'Open Folder as Workspace', category: 'File', action: 'open-folder' },
        { id: 'save-copy-as', label: 'Save Copy As...', category: 'File', action: 'save-copy-as' },
        { id: 'save-all', label: 'Save All', category: 'File', action: 'save-all' },
        { id: 'reload-from-disk', label: 'Reload from Disk', category: 'File', action: 'reload-from-disk' },
        { id: 'rename-file', label: 'Rename File', category: 'File', action: 'rename-file' },
        { id: 'close-all', label: 'Close All Tabs', category: 'File', action: 'close-all' },
        { id: 'close-others', label: 'Close Other Tabs', category: 'File', action: 'close-others' },
        { id: 'close-unchanged', label: 'Close Unchanged Tabs', category: 'File', action: 'close-unchanged' },
        { id: 'pin-tab', label: 'Pin/Unpin Tab', category: 'File', action: 'pin-tab' },
        { id: 'incremental-search', label: 'Incremental Search', category: 'Search', action: 'incremental-search' },
        { id: 'find-char-in-range', label: 'Find Characters in Range', category: 'Search', action: 'find-char-in-range' },
        { id: 'show-whitespace', label: 'Toggle Show Whitespace', category: 'View', action: 'show-whitespace' },
        { id: 'show-eol', label: 'Toggle Show EOL', category: 'View', action: 'show-eol' },
        { id: 'toggle-minimap', label: 'Toggle Minimap', category: 'View', action: 'toggle-minimap' },
        { id: 'show-line-numbers', label: 'Toggle Line Numbers', category: 'View', action: 'show-line-numbers' },
        { id: 'indent-guide', label: 'Toggle Indent Guides', category: 'View', action: 'indent-guide' },
        { id: 'distraction-free', label: 'Distraction Free Mode', category: 'View', action: 'distraction-free' },
        { id: 'split-right', label: 'Split Editor Right', category: 'View', action: 'split-right' },
        { id: 'split-down', label: 'Split Editor Down', category: 'View', action: 'split-down' },
        { id: 'close-split', label: 'Close Split', category: 'View', action: 'close-split' },
        { id: 'show-summary', label: 'Summary', category: 'View', action: 'show-summary' },
        { id: 'show-doc-list', label: 'Document List', category: 'View', action: 'show-doc-list' },
        { id: 'show-function-list', label: 'Function List', category: 'View', action: 'show-function-list' },
        { id: 'show-project-panel', label: 'Project Panel', category: 'View', action: 'show-project-panel' },
        { id: 'clipboard-history', label: 'Clipboard History', category: 'Edit', action: 'clipboard-history' },
        { id: 'char-panel', label: 'Character Panel', category: 'Edit', action: 'char-panel' },
        { id: 'run-command', label: 'Run Command...', category: 'Run', action: 'run-command' },
        { id: 'search-google', label: 'Search on Google', category: 'Run', action: 'search-google' },
        { id: 'search-wikipedia', label: 'Search on Wikipedia', category: 'Run', action: 'search-wikipedia' },
        { id: 'save-session', label: 'Save Session', category: 'File', action: 'save-session' },
        { id: 'load-session', label: 'Load Session', category: 'File', action: 'load-session' },
        { id: 'about', label: 'About Notemac++', category: 'Help', action: 'about' },

        // Editor text actions
        { id: 'uppercase', label: 'UPPERCASE', category: 'Edit', action: 'uppercase' },
        { id: 'lowercase', label: 'lowercase', category: 'Edit', action: 'lowercase' },
        { id: 'titlecase', label: 'Title Case', category: 'Edit', action: 'titlecase' },
        { id: 'sort-asc', label: 'Sort Lines Ascending', category: 'Edit', action: 'sort-asc' },
        { id: 'sort-desc', label: 'Sort Lines Descending', category: 'Edit', action: 'sort-desc' },
        { id: 'remove-duplicates', label: 'Remove Duplicate Lines', category: 'Edit', action: 'remove-duplicates' },
        { id: 'trim-trailing', label: 'Trim Trailing Spaces', category: 'Edit', action: 'trim-trailing' },
        { id: 'trim-leading', label: 'Trim Leading Spaces', category: 'Edit', action: 'trim-leading' },
        { id: 'join-lines', label: 'Join Lines', category: 'Edit', action: 'join-lines' },
        { id: 'split-lines', label: 'Split Lines', category: 'Edit', action: 'split-lines' },
        { id: 'reverse-lines', label: 'Reverse Line Order', category: 'Edit', action: 'reverse-lines' },
        { id: 'base64-encode', label: 'Base64 Encode', category: 'Edit', action: 'base64-encode' },
        { id: 'base64-decode', label: 'Base64 Decode', category: 'Edit', action: 'base64-decode' },
        { id: 'url-encode', label: 'URL Encode', category: 'Edit', action: 'url-encode' },
        { id: 'url-decode', label: 'URL Decode', category: 'Edit', action: 'url-decode' },

        // Git commands
        { id: 'show-git-panel', label: 'Source Control Panel', category: 'Git', action: 'show-git-panel' },
        { id: 'clone-repository', label: 'Clone Repository', category: 'Git', action: 'clone-repository' },
        { id: 'git-settings', label: 'Git Settings', category: 'Git', action: 'git-settings' },
    ];

    // Deduplicate: only add extra commands whose action isn't already in the list
    const existingActions = new Set(commands.map(c => c.action));
    for (const cmd of extraCommands)
    {
        if (!existingActions.has(cmd.action))
            commands.push(cmd);
    }

    return commands;
}

export function GetCommandsByCategory(category: string): CommandDefinition[]
{
    return GetAllCommands().filter(c => c.category === category);
}
