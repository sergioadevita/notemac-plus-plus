import type { ShortcutItem } from './ShortcutConfig';
import { GetDefaultShortcuts } from './ShortcutConfig';

// ─── Types ────────────────────────────────────────────────────────

export interface ShortcutMappingPreset
{
    id: string;
    name: string;
    description: string;
    shortcuts: ShortcutItem[];
}

// ─── Storage ──────────────────────────────────────────────────────

const PRESET_STORAGE_KEY: string = 'notemac-active-preset';
const DEFAULT_PRESET_ID: string = 'notemac-default';

export function LoadActivePresetId(): string
{
    try
    {
        if (typeof window === 'undefined' || null === window.localStorage)
        {
            return DEFAULT_PRESET_ID;
        }

        const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
        if (null === stored || '' === stored)
        {
            return DEFAULT_PRESET_ID;
        }

        return stored;
    }
    catch
    {
        return DEFAULT_PRESET_ID;
    }
}

export function SaveActivePresetId(presetId: string): void
{
    try
    {
        if (typeof window === 'undefined' || null === window.localStorage)
        {
            return;
        }

        window.localStorage.setItem(PRESET_STORAGE_KEY, presetId);
    }
    catch
    {
        // Silently fail if storage is unavailable
    }
}

// ─── Built-in Presets ─────────────────────────────────────────────

export const NOTEMAC_DEFAULT_PRESET: ShortcutMappingPreset =
{
    id: 'notemac-default',
    name: 'Notemac++ Default',
    description: 'Standard Notemac++ keyboard shortcuts',
    shortcuts: [...GetDefaultShortcuts()]
};

/**
 * ReSharper preset — keyboard shortcuts inspired by JetBrains ReSharper / IntelliJ IDEA.
 * All 85 actions are covered; only differing bindings are explicitly changed.
 */
export const RESHARPER_PRESET: ShortcutMappingPreset =
{
    id: 'resharper',
    name: 'ReSharper',
    description: 'JetBrains ReSharper / IntelliJ IDEA style keyboard shortcuts',
    shortcuts:
    [
        // File
        { category: 'File', name: 'New File', shortcut: 'Cmd+Alt+N', action: 'new' },
        { category: 'File', name: 'Open File', shortcut: 'Cmd+O', action: 'open' },
        { category: 'File', name: 'Save', shortcut: 'Cmd+S', action: 'save' },
        { category: 'File', name: 'Save As', shortcut: 'Cmd+Shift+S', action: 'save-as' },
        { category: 'File', name: 'Save All', shortcut: 'Cmd+Alt+S', action: 'save-all' },
        { category: 'File', name: 'Close Tab', shortcut: 'Cmd+W', action: 'close-tab' },
        { category: 'File', name: 'Restore Last Closed', shortcut: 'Cmd+Shift+T', action: 'restore-last-closed' },
        { category: 'File', name: 'Quick Open', shortcut: 'Cmd+Shift+N', action: 'quick-open' },

        // Edit
        { category: 'Edit', name: 'Undo', shortcut: 'Cmd+Z', action: 'undo' },
        { category: 'Edit', name: 'Redo', shortcut: 'Cmd+Shift+Z', action: 'redo' },
        { category: 'Edit', name: 'Cut', shortcut: 'Cmd+X', action: 'cut' },
        { category: 'Edit', name: 'Copy', shortcut: 'Cmd+C', action: 'copy' },
        { category: 'Edit', name: 'Paste', shortcut: 'Cmd+V', action: 'paste' },
        { category: 'Edit', name: 'Select All', shortcut: 'Cmd+A', action: 'select-all' },
        { category: 'Edit', name: 'Duplicate Line', shortcut: 'Cmd+D', action: 'duplicate-line' },
        { category: 'Edit', name: 'Delete Line', shortcut: 'Cmd+Y', action: 'delete-line' },
        { category: 'Edit', name: 'Move Line Up', shortcut: 'Shift+Alt+Up', action: 'move-line-up' },
        { category: 'Edit', name: 'Move Line Down', shortcut: 'Shift+Alt+Down', action: 'move-line-down' },
        { category: 'Edit', name: 'Toggle Comment', shortcut: 'Cmd+/', action: 'toggle-comment' },
        { category: 'Edit', name: 'Column Editor', shortcut: 'Alt+C', action: 'column-editor' },

        // Search
        { category: 'Search', name: 'Find', shortcut: 'Cmd+F', action: 'find' },
        { category: 'Search', name: 'Replace', shortcut: 'Cmd+R', action: 'replace' },
        { category: 'Search', name: 'Find in Files', shortcut: 'Cmd+Shift+F', action: 'find-in-files' },
        { category: 'Search', name: 'Go to Line', shortcut: 'Cmd+L', action: 'goto-line' },
        { category: 'Search', name: 'Go to Matching Brace', shortcut: 'Cmd+Shift+\\', action: 'goto-matching-brace' },
        { category: 'Search', name: 'Mark', shortcut: 'Cmd+M', action: 'mark' },

        // View
        { category: 'View', name: 'Toggle Sidebar', shortcut: 'Alt+1', action: 'toggle-sidebar' },
        { category: 'View', name: 'Zoom In', shortcut: 'Cmd+=', action: 'zoom-in' },
        { category: 'View', name: 'Zoom Out', shortcut: 'Cmd+-', action: 'zoom-out' },
        { category: 'View', name: 'Reset Zoom', shortcut: 'Cmd+0', action: 'zoom-reset' },
        { category: 'View', name: 'Word Wrap', shortcut: 'Alt+Z', action: 'word-wrap' },
        { category: 'View', name: 'Fold All', shortcut: 'Cmd+Shift+-', action: 'fold-all' },
        { category: 'View', name: 'Unfold All', shortcut: 'Cmd+Shift+=', action: 'unfold-all' },

        // Settings
        { category: 'Settings', name: 'Preferences', shortcut: 'Cmd+,', action: 'preferences' },
        { category: 'Settings', name: 'Shortcut Mapper', shortcut: 'Cmd+Alt+S', action: 'shortcut-mapper' },

        // Macro
        { category: 'Macro', name: 'Start Recording', shortcut: 'Cmd+Shift+R', action: 'macro-start' },
        { category: 'Macro', name: 'Stop Recording', shortcut: 'Cmd+Shift+R', action: 'macro-stop' },
        { category: 'Macro', name: 'Playback', shortcut: 'Cmd+Shift+P', action: 'macro-playback' },

        // View — New features
        { category: 'View', name: 'Command Palette', shortcut: 'Cmd+Shift+A', action: 'command-palette' },
        { category: 'View', name: 'Toggle Terminal', shortcut: 'Alt+F12', action: 'toggle-terminal' },
        { category: 'Edit', name: 'Compare Files', shortcut: '', action: 'compare-files' },
        { category: 'Edit', name: 'Snippet Manager', shortcut: '', action: 'snippet-manager' },

        // Git
        { category: 'Git', name: 'Source Control Panel', shortcut: 'Alt+9', action: 'show-git-panel' },
        { category: 'Git', name: 'Clone Repository', shortcut: '', action: 'clone-repository' },
        { category: 'Git', name: 'Git Settings', shortcut: '', action: 'git-settings' },

        // AI
        { category: 'AI', name: 'AI Chat Panel', shortcut: 'Cmd+Shift+A', action: 'ai-chat' },
        { category: 'AI', name: 'Explain Code', shortcut: 'Cmd+Shift+E', action: 'ai-explain' },
        { category: 'AI', name: 'Refactor Code', shortcut: 'Cmd+Alt+R', action: 'ai-refactor' },
        { category: 'AI', name: 'Generate Tests', shortcut: '', action: 'ai-generate-tests' },
        { category: 'AI', name: 'Generate Docs', shortcut: '', action: 'ai-generate-docs' },
        { category: 'AI', name: 'Fix Error', shortcut: '', action: 'ai-fix-error' },
        { category: 'AI', name: 'Simplify Code', shortcut: '', action: 'ai-simplify' },
        { category: 'AI', name: 'AI Settings', shortcut: '', action: 'ai-settings' },
        { category: 'AI', name: 'Toggle Inline Completions', shortcut: '', action: 'ai-toggle-inline' },

        // Plugins
        { category: 'Plugins', name: 'Plugin Manager', shortcut: 'Cmd+Shift+X', action: 'show-plugin-manager' },
        { category: 'Plugins', name: 'Reload Plugins', shortcut: '', action: 'reload-plugins' },

        // Compile & Run (same as default — no ReSharper-specific overrides)
        { category: 'Run', name: 'Run File', shortcut: 'F5', action: 'compile-run' },
        { category: 'Run', name: 'Run with Arguments', shortcut: 'Shift+F5', action: 'compile-run-args' },
        { category: 'Run', name: 'Stop Execution', shortcut: 'Ctrl+F5', action: 'compile-run-stop' },
        { category: 'Run', name: 'Clear Console', shortcut: '', action: 'compile-run-clear' },
        { category: 'Run', name: 'Toggle Console', shortcut: 'Cmd+Shift+Y', action: 'compile-run-toggle-panel' },

        // Hex
        { category: 'Hex', name: 'View as Hex', shortcut: '', action: 'view-as-hex' },
        { category: 'Hex', name: 'View as Text', shortcut: '', action: 'view-as-text' },
        { category: 'Hex', name: 'Go to Hex Offset', shortcut: '', action: 'hex-goto-offset' },
        { category: 'Hex', name: 'Toggle Hex Bytes Per Row', shortcut: '', action: 'hex-toggle-bytes-per-row' },
    ]
};

export const BUILT_IN_PRESETS: readonly ShortcutMappingPreset[] = [
    NOTEMAC_DEFAULT_PRESET,
    RESHARPER_PRESET,
];

// ─── Helpers ──────────────────────────────────────────────────────

export function GetPresetById(id: string): ShortcutMappingPreset | null
{
    for (const preset of BUILT_IN_PRESETS)
    {
        if (id === preset.id)
        {
            return preset;
        }
    }

    return null;
}

export function GetDefaultPresetId(): string
{
    return DEFAULT_PRESET_ID;
}
