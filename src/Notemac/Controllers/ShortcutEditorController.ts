import { useNotemacStore } from "../Model/Store";
import { FindConflict, IsValidShortcut, NormalizeKeyboardEvent, GetDefaultShortcuts } from "../Configs/ShortcutConfig";
import type { ShortcutItem } from "../Configs/ShortcutConfig";
import type { ShortcutMappingPreset } from "../Configs/ShortcutPresets";
import { BUILT_IN_PRESETS, GetPresetById } from "../Configs/ShortcutPresets";

/**
 * Edits a keyboard shortcut with validation and conflict detection
 * @param action The action identifier for the shortcut
 * @param newShortcut The new shortcut key combination string
 * @returns Object containing success status, optional error message, and optional conflicting action
 */
export function EditShortcut(action: string, newShortcut: string): { success: boolean; error?: string; conflictAction?: string }
{
    if (!IsValidShortcut(newShortcut))
    {
        return { success: false, error: 'Invalid shortcut format' };
    }

    const store = useNotemacStore.getState();
    const overrides = store.customShortcutOverrides;
    const baseShortcuts = GetActivePresetShortcuts();

    const conflict = FindConflict(newShortcut, action, overrides, baseShortcuts);
    if (null !== conflict)
    {
        return {
            success: false,
            error: `Shortcut already used by: ${conflict.action}`,
            conflictAction: conflict.action
        };
    }

    store.UpdateShortcut(action, newShortcut);
    return { success: true };
}

/**
 * Captures a keyboard event and returns the normalized shortcut string
 * @param e The keyboard event to capture
 * @returns The normalized shortcut string
 */
export function CaptureShortcut(e: KeyboardEvent): string
{
    return NormalizeKeyboardEvent(e);
}

/**
 * Resets a single shortcut to its default value
 * @param action The action identifier for the shortcut to reset
 */
export function ResetShortcutToDefault(action: string): void
{
    const store = useNotemacStore.getState();
    store.ResetShortcut(action);
}

/**
 * Resets all shortcuts to their default values
 */
export function ResetAllToDefaults(): void
{
    const store = useNotemacStore.getState();
    store.ResetAllShortcuts();
}

/**
 * Exports all shortcuts as JSON string
 * @returns JSON string representation of all shortcuts
 */
export function ExportShortcuts(): string
{
    const store = useNotemacStore.getState();
    return store.ExportShortcutsAsJSON();
}

/**
 * Imports shortcuts from a JSON string
 * @param json The JSON string containing shortcut mappings
 * @returns Object containing success status, optional error message, and count of imported overrides
 */
export function ImportShortcuts(json: string): { success: boolean; error?: string; count?: number }
{
    try
    {
        const parsed = JSON.parse(json);

        if (typeof parsed !== 'object' || null === parsed || Array.isArray(parsed))
        {
            return { success: false, error: 'Invalid JSON format: expected object' };
        }

        for (const key in parsed)
        {
            if (Object.prototype.hasOwnProperty.call(parsed, key))
            {
                if ('string' !== typeof key || 'string' !== typeof parsed[key])
                {
                    return { success: false, error: 'Invalid format: all keys and values must be strings' };
                }
            }
        }

        const store = useNotemacStore.getState();
        store.ImportShortcutsFromJSON(json);

        const importedCount = Object.keys(parsed).length;
        return { success: true, count: importedCount };
    }
    catch (error)
    {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to parse JSON: ${errorMessage}` };
    }
}

/**
 * Gets the count of custom shortcut overrides
 * @returns The number of shortcut overrides currently set
 */
export function GetOverrideCount(): number
{
    const store = useNotemacStore.getState();
    return Object.keys(store.customShortcutOverrides).length;
}

// ─── Preset Management ────────────────────────────────────────────

/**
 * Gets the active preset ID from the store
 */
export function GetActivePresetId(): string
{
    const store = useNotemacStore.getState();
    return store.activePresetId;
}

/**
 * Gets the base shortcuts for the currently active preset
 */
export function GetActivePresetShortcuts(): readonly ShortcutItem[]
{
    const store = useNotemacStore.getState();
    const preset = GetPresetById(store.activePresetId);

    if (null !== preset)
    {
        return preset.shortcuts;
    }

    // Check plugin presets
    const pluginPresets = store.pluginPresets;
    for (const pp of pluginPresets)
    {
        if (store.activePresetId === pp.id)
        {
            // Build full ShortcutItem[] from plugin preset by merging with defaults
            const defaults = GetDefaultShortcuts();
            return defaults.map((defaultItem) =>
            {
                const pluginOverride = pp.shortcuts.find(s => s.action === defaultItem.action);
                if (undefined !== pluginOverride)
                {
                    return { ...defaultItem, shortcut: pluginOverride.shortcut };
                }
                return defaultItem;
            }) as ShortcutItem[];
        }
    }

    // Fallback to defaults
    return GetDefaultShortcuts();
}

/**
 * Switches the active shortcut mapping preset
 * @param presetId The ID of the preset to switch to
 */
export function SetActivePreset(presetId: string): void
{
    const store = useNotemacStore.getState();
    store.SetActivePreset(presetId);
}

/**
 * Gets all available presets (built-in + plugin-contributed)
 * @returns Array of available mapping presets
 */
export function GetAvailablePresets(): ShortcutMappingPreset[]
{
    const store = useNotemacStore.getState();
    const allPresets: ShortcutMappingPreset[] = [...BUILT_IN_PRESETS];

    // Add plugin-contributed presets
    for (const pp of store.pluginPresets)
    {
        const defaults = GetDefaultShortcuts();
        const fullShortcuts: ShortcutItem[] = defaults.map((defaultItem) =>
        {
            const pluginOverride = pp.shortcuts.find(s => s.action === defaultItem.action);
            if (undefined !== pluginOverride)
            {
                return { ...defaultItem, shortcut: pluginOverride.shortcut };
            }
            return defaultItem;
        });

        allPresets.push({
            id: pp.id,
            name: pp.name,
            description: pp.description,
            shortcuts: fullShortcuts
        });
    }

    return allPresets;
}
