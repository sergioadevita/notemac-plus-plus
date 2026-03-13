import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    NOTEMAC_DEFAULT_PRESET,
    RESHARPER_PRESET,
    BUILT_IN_PRESETS,
    GetPresetById,
    GetDefaultPresetId,
    LoadActivePresetId,
    SaveActivePresetId,
} from '../Notemac/Configs/ShortcutPresets';
import { GetDefaultShortcuts } from '../Notemac/Configs/ShortcutConfig';

// ─── Preset Structure ─────────────────────────────────────────────

describe('ShortcutMappingPreset structure', () =>
{
    it('NOTEMAC_DEFAULT_PRESET has correct id', () =>
    {
        expect('notemac-default' === NOTEMAC_DEFAULT_PRESET.id).toBe(true);
    });

    it('NOTEMAC_DEFAULT_PRESET has correct name', () =>
    {
        expect('Notemac++ Default' === NOTEMAC_DEFAULT_PRESET.name).toBe(true);
    });

    it('NOTEMAC_DEFAULT_PRESET has description', () =>
    {
        expect(NOTEMAC_DEFAULT_PRESET.description.length > 0).toBe(true);
    });

    it('NOTEMAC_DEFAULT_PRESET shortcuts match GetDefaultShortcuts length', () =>
    {
        const defaults = GetDefaultShortcuts();
        expect(NOTEMAC_DEFAULT_PRESET.shortcuts.length === defaults.length).toBe(true);
    });

    it('RESHARPER_PRESET has correct id', () =>
    {
        expect('resharper' === RESHARPER_PRESET.id).toBe(true);
    });

    it('RESHARPER_PRESET has correct name', () =>
    {
        expect('ReSharper' === RESHARPER_PRESET.name).toBe(true);
    });

    it('RESHARPER_PRESET has description', () =>
    {
        expect(RESHARPER_PRESET.description.length > 0).toBe(true);
    });

    it('RESHARPER_PRESET covers all default actions', () =>
    {
        const defaults = GetDefaultShortcuts();
        const defaultActions = new Set(defaults.map(s => s.action));
        const resharperActions = new Set(RESHARPER_PRESET.shortcuts.map(s => s.action));

        for (const action of defaultActions)
        {
            expect(resharperActions.has(action)).toBe(true);
        }
    });

    it('RESHARPER_PRESET has same number of shortcuts as defaults', () =>
    {
        const defaults = GetDefaultShortcuts();
        expect(RESHARPER_PRESET.shortcuts.length === defaults.length).toBe(true);
    });

    it('all preset shortcuts have required fields', () =>
    {
        for (const preset of BUILT_IN_PRESETS)
        {
            for (const shortcut of preset.shortcuts)
            {
                expect('string' === typeof shortcut.action).toBe(true);
                expect('' !== shortcut.action).toBe(true);
                expect('string' === typeof shortcut.name).toBe(true);
                expect('string' === typeof shortcut.category).toBe(true);
                expect('string' === typeof shortcut.shortcut).toBe(true);
            }
        }
    });

    it('no duplicate actions within a preset', () =>
    {
        for (const preset of BUILT_IN_PRESETS)
        {
            const actions = preset.shortcuts.map(s => s.action);
            const uniqueActions = new Set(actions);
            expect(uniqueActions.size === actions.length).toBe(true);
        }
    });
});

// ─── ReSharper Key Differences ────────────────────────────────────

describe('ReSharper preset key differences', () =>
{
    const findShortcut = (action: string): string =>
    {
        const item = RESHARPER_PRESET.shortcuts.find(s => s.action === action);
        return null !== item && undefined !== item ? item.shortcut : '';
    };

    const findDefault = (action: string): string =>
    {
        const defaults = GetDefaultShortcuts();
        const item = defaults.find(s => s.action === action);
        return null !== item && undefined !== item ? item.shortcut : '';
    };

    it('New File uses Cmd+Alt+N', () =>
    {
        expect('Cmd+Alt+N' === findShortcut('new')).toBe(true);
    });

    it('New File differs from default', () =>
    {
        expect(findShortcut('new') !== findDefault('new')).toBe(true);
    });

    it('Delete Line uses Cmd+Y', () =>
    {
        expect('Cmd+Y' === findShortcut('delete-line')).toBe(true);
    });

    it('Move Line Up uses Shift+Alt+Up', () =>
    {
        expect('Shift+Alt+Up' === findShortcut('move-line-up')).toBe(true);
    });

    it('Command Palette uses Cmd+Shift+A', () =>
    {
        expect('Cmd+Shift+A' === findShortcut('command-palette')).toBe(true);
    });

    it('Toggle Sidebar uses Alt+1', () =>
    {
        expect('Alt+1' === findShortcut('toggle-sidebar')).toBe(true);
    });

    it('Quick Open uses Cmd+Shift+N', () =>
    {
        expect('Cmd+Shift+N' === findShortcut('quick-open')).toBe(true);
    });

    it('Go to Line uses Cmd+L', () =>
    {
        expect('Cmd+L' === findShortcut('goto-line')).toBe(true);
    });

    it('Replace uses Cmd+R', () =>
    {
        expect('Cmd+R' === findShortcut('replace')).toBe(true);
    });

    it('Source Control Panel uses Alt+9', () =>
    {
        expect('Alt+9' === findShortcut('show-git-panel')).toBe(true);
    });
});

// ─── BUILT_IN_PRESETS ─────────────────────────────────────────────

describe('BUILT_IN_PRESETS', () =>
{
    it('contains exactly 2 presets', () =>
    {
        expect(2 === BUILT_IN_PRESETS.length).toBe(true);
    });

    it('first preset is notemac-default', () =>
    {
        expect('notemac-default' === BUILT_IN_PRESETS[0].id).toBe(true);
    });

    it('second preset is resharper', () =>
    {
        expect('resharper' === BUILT_IN_PRESETS[1].id).toBe(true);
    });

    it('is readonly array', () =>
    {
        // TypeScript enforces readonly at compile time; runtime check that it is an array
        expect(Array.isArray(BUILT_IN_PRESETS)).toBe(true);
    });
});

// ─── GetPresetById ────────────────────────────────────────────────

describe('GetPresetById', () =>
{
    it('returns notemac-default preset by id', () =>
    {
        const preset = GetPresetById('notemac-default');
        expect(null !== preset).toBe(true);
        expect('notemac-default' === preset!.id).toBe(true);
        expect('Notemac++ Default' === preset!.name).toBe(true);
    });

    it('returns resharper preset by id', () =>
    {
        const preset = GetPresetById('resharper');
        expect(null !== preset).toBe(true);
        expect('resharper' === preset!.id).toBe(true);
        expect('ReSharper' === preset!.name).toBe(true);
    });

    it('returns null for unknown id', () =>
    {
        const preset = GetPresetById('vim');
        expect(null === preset).toBe(true);
    });

    it('returns null for empty id', () =>
    {
        const preset = GetPresetById('');
        expect(null === preset).toBe(true);
    });
});

// ─── GetDefaultPresetId ───────────────────────────────────────────

describe('GetDefaultPresetId', () =>
{
    it('returns notemac-default', () =>
    {
        expect('notemac-default' === GetDefaultPresetId()).toBe(true);
    });
});

// ─── Storage Functions ────────────────────────────────────────────

describe('LoadActivePresetId', () =>
{
    beforeEach(() =>
    {
        window.localStorage.clear();
    });

    it('returns default when nothing stored', () =>
    {
        expect('notemac-default' === LoadActivePresetId()).toBe(true);
    });

    it('returns stored value', () =>
    {
        window.localStorage.setItem('notemac-active-preset', 'resharper');
        expect('resharper' === LoadActivePresetId()).toBe(true);
    });

    it('returns default for empty string in storage', () =>
    {
        window.localStorage.setItem('notemac-active-preset', '');
        expect('notemac-default' === LoadActivePresetId()).toBe(true);
    });
});

describe('SaveActivePresetId', () =>
{
    beforeEach(() =>
    {
        window.localStorage.clear();
    });

    it('saves preset id to localStorage', () =>
    {
        SaveActivePresetId('resharper');
        expect('resharper' === window.localStorage.getItem('notemac-active-preset')).toBe(true);
    });

    it('overwrites previous value', () =>
    {
        SaveActivePresetId('resharper');
        SaveActivePresetId('notemac-default');
        expect('notemac-default' === window.localStorage.getItem('notemac-active-preset')).toBe(true);
    });
});
