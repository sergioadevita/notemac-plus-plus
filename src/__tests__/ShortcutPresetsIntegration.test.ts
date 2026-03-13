import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetEffectiveShortcuts, FindConflict, GetDefaultShortcuts } from '../Notemac/Configs/ShortcutConfig';
import { NOTEMAC_DEFAULT_PRESET, RESHARPER_PRESET, GetPresetById } from '../Notemac/Configs/ShortcutPresets';

// ─── Preset + Override Merging ────────────────────────────────────

describe('Preset + override merging via GetEffectiveShortcuts', () =>
{
    it('returns default shortcuts when no overrides and no base', () =>
    {
        const effective = GetEffectiveShortcuts();
        const defaults = GetDefaultShortcuts();
        expect(effective.length === defaults.length).toBe(true);
    });

    it('returns default preset shortcuts when using default base', () =>
    {
        const effective = GetEffectiveShortcuts({}, NOTEMAC_DEFAULT_PRESET.shortcuts);
        const defaults = GetDefaultShortcuts();
        expect(effective.length === defaults.length).toBe(true);

        const newFile = effective.find(s => 'new' === s.action);
        expect(null !== newFile && undefined !== newFile).toBe(true);
        expect('Cmd+N' === newFile!.shortcut).toBe(true);
    });

    it('returns ReSharper shortcuts when using ReSharper base', () =>
    {
        const effective = GetEffectiveShortcuts({}, RESHARPER_PRESET.shortcuts);
        expect(effective.length === RESHARPER_PRESET.shortcuts.length).toBe(true);

        const newFile = effective.find(s => 'new' === s.action);
        expect(null !== newFile && undefined !== newFile).toBe(true);
        expect('Cmd+Alt+N' === newFile!.shortcut).toBe(true);
    });

    it('user override takes precedence over ReSharper base', () =>
    {
        const overrides: Record<string, string> = { 'new': 'Cmd+Shift+Alt+N' };
        const effective = GetEffectiveShortcuts(overrides, RESHARPER_PRESET.shortcuts);

        const newFile = effective.find(s => 'new' === s.action);
        expect(null !== newFile && undefined !== newFile).toBe(true);
        expect('Cmd+Shift+Alt+N' === newFile!.shortcut).toBe(true);
    });

    it('user override takes precedence over default base', () =>
    {
        const overrides: Record<string, string> = { 'save': 'Cmd+Alt+K' };
        const effective = GetEffectiveShortcuts(overrides, NOTEMAC_DEFAULT_PRESET.shortcuts);

        const save = effective.find(s => 'save' === s.action);
        expect(null !== save && undefined !== save).toBe(true);
        expect('Cmd+Alt+K' === save!.shortcut).toBe(true);
    });

    it('non-overridden shortcuts retain preset values', () =>
    {
        const overrides: Record<string, string> = { 'new': 'Cmd+Shift+Alt+N' };
        const effective = GetEffectiveShortcuts(overrides, RESHARPER_PRESET.shortcuts);

        const deleteLine = effective.find(s => 'delete-line' === s.action);
        expect(null !== deleteLine && undefined !== deleteLine).toBe(true);
        expect('Cmd+Y' === deleteLine!.shortcut).toBe(true);
    });

    it('overrides persist across preset switching (conceptual)', () =>
    {
        const overrides: Record<string, string> = { 'find': 'Cmd+Alt+F' };

        const effectiveDefault = GetEffectiveShortcuts(overrides, NOTEMAC_DEFAULT_PRESET.shortcuts);
        const effectiveReSharper = GetEffectiveShortcuts(overrides, RESHARPER_PRESET.shortcuts);

        const findDefault = effectiveDefault.find(s => 'find' === s.action);
        const findReSharper = effectiveReSharper.find(s => 'find' === s.action);

        // Both should have the override value
        expect('Cmd+Alt+F' === findDefault!.shortcut).toBe(true);
        expect('Cmd+Alt+F' === findReSharper!.shortcut).toBe(true);
    });
});

// ─── Conflict Detection ──────────────────────────────────────────

describe('Conflict detection with presets', () =>
{
    it('detects conflict in default preset base', () =>
    {
        const conflict = FindConflict('Cmd+N', 'save', {}, NOTEMAC_DEFAULT_PRESET.shortcuts);
        expect(null !== conflict).toBe(true);
        expect('new' === conflict!.action).toBe(true);
    });

    it('detects conflict in ReSharper preset base', () =>
    {
        const conflict = FindConflict('Cmd+Alt+N', 'save', {}, RESHARPER_PRESET.shortcuts);
        expect(null !== conflict).toBe(true);
        expect('new' === conflict!.action).toBe(true);
    });

    it('no conflict for same action (self-assignment)', () =>
    {
        const conflict = FindConflict('Cmd+N', 'new', {}, NOTEMAC_DEFAULT_PRESET.shortcuts);
        expect(null === conflict).toBe(true);
    });

    it('detects conflict in overrides layer', () =>
    {
        const overrides: Record<string, string> = { 'find': 'Cmd+K' };
        const conflict = FindConflict('Cmd+K', 'save', overrides, NOTEMAC_DEFAULT_PRESET.shortcuts);
        expect(null !== conflict).toBe(true);
        expect('find' === conflict!.action).toBe(true);
    });

    it('no conflict for unused shortcut in ReSharper', () =>
    {
        // Find a shortcut that's definitely not used
        const conflict = FindConflict('Cmd+Alt+Shift+F12', 'save', {}, RESHARPER_PRESET.shortcuts);
        expect(null === conflict).toBe(true);
    });
});

// ─── GetPresetById ────────────────────────────────────────────────

describe('GetPresetById integration', () =>
{
    it('retrieved preset shortcuts are usable with GetEffectiveShortcuts', () =>
    {
        const preset = GetPresetById('resharper');
        expect(null !== preset).toBe(true);

        const effective = GetEffectiveShortcuts({}, preset!.shortcuts);
        expect(effective.length > 0).toBe(true);

        const newFile = effective.find(s => 'new' === s.action);
        expect('Cmd+Alt+N' === newFile!.shortcut).toBe(true);
    });

    it('null preset falls back to defaults in GetEffectiveShortcuts', () =>
    {
        const preset = GetPresetById('nonexistent');
        expect(null === preset).toBe(true);

        // When preset is null, pass undefined as base — falls back to defaults
        const effective = GetEffectiveShortcuts({}, undefined);
        const defaults = GetDefaultShortcuts();
        expect(effective.length === defaults.length).toBe(true);
    });
});

// ─── Category Coverage ────────────────────────────────────────────

describe('Preset category coverage', () =>
{
    it('ReSharper preset covers all categories from default', () =>
    {
        const defaults = GetDefaultShortcuts();
        const defaultCategories = new Set(defaults.map(s => s.category));
        const resharperCategories = new Set(RESHARPER_PRESET.shortcuts.map(s => s.category));

        for (const category of defaultCategories)
        {
            expect(resharperCategories.has(category)).toBe(true);
        }
    });

    it('both presets have same set of action ids', () =>
    {
        const defaultActions = new Set(NOTEMAC_DEFAULT_PRESET.shortcuts.map(s => s.action));
        const resharperActions = new Set(RESHARPER_PRESET.shortcuts.map(s => s.action));

        expect(defaultActions.size === resharperActions.size).toBe(true);

        for (const action of defaultActions)
        {
            expect(resharperActions.has(action)).toBe(true);
        }
    });
});
