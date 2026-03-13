import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    GetDefaultShortcuts,
    GetShortcutCategories,
    GetShortcutsByCategory,
    GetEffectiveShortcuts,
    FindConflict,
    NormalizeKeyboardEvent,
    IsValidShortcut,
    LoadCustomShortcuts,
    SaveCustomShortcuts
} from '../Notemac/Configs/ShortcutConfig';

// ─── ShortcutConfig — Git shortcuts ─────────────────────────────

describe('ShortcutConfig — git shortcuts', () =>
{
    it('includes Git category', () =>
    {
        const categories = GetShortcutCategories();
        expect(categories).toContain('Git');
    });

    it('has git shortcuts', () =>
    {
        const gitShortcuts = GetShortcutsByCategory('Git');
        expect(0 < gitShortcuts.length).toBe(true);
    });

    it('has Source Control Panel shortcut with Ctrl+Shift+G', () =>
    {
        const gitShortcuts = GetShortcutsByCategory('Git');
        const sourceControl = gitShortcuts.find(s => 'show-git-panel' === s.action);
        expect(sourceControl).toBeDefined();
        expect(sourceControl!.shortcut).toBe('Ctrl+Shift+G');
    });

    it('has Clone Repository shortcut', () =>
    {
        const gitShortcuts = GetShortcutsByCategory('Git');
        const clone = gitShortcuts.find(s => 'clone-repository' === s.action);
        expect(clone).toBeDefined();
    });

    it('has Git Settings shortcut', () =>
    {
        const gitShortcuts = GetShortcutsByCategory('Git');
        const settings = gitShortcuts.find(s => 'git-settings' === s.action);
        expect(settings).toBeDefined();
    });

    it('all shortcuts have required fields', () =>
    {
        const shortcuts = GetDefaultShortcuts();
        for (const shortcut of shortcuts)
        {
            expect(shortcut.category).toBeTruthy();
            expect(shortcut.name).toBeTruthy();
            expect(shortcut.action).toBeTruthy();
            // shortcut key may be empty for some
            expect('string' === typeof shortcut.shortcut).toBe(true);
        }
    });

    it('default shortcuts returns readonly array', () =>
    {
        const shortcuts = GetDefaultShortcuts();
        expect(Array.isArray(shortcuts)).toBe(true);
        expect(0 < shortcuts.length).toBe(true);
    });
});

// ─── GetEffectiveShortcuts ──────────────────────────────────────

describe('GetEffectiveShortcuts', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
    });

    it('returns defaults when no overrides exist', () =>
    {
        const effective = GetEffectiveShortcuts({});
        const defaults = GetDefaultShortcuts();

        expect(effective.length).toBe(defaults.length);
        for (let i = 0; i < effective.length; i++)
        {
            expect(effective[i]).toEqual(defaults[i]);
        }
    });

    it('applies override for a specific action', () =>
    {
        const overrides = { 'new': 'Cmd+Alt+N' };
        const effective = GetEffectiveShortcuts(overrides);

        const newAction = effective.find(s => 'new' === s.action);
        expect(newAction).toBeDefined();
        expect(newAction!.shortcut).toBe('Cmd+Alt+N');
    });

    it('does not affect other shortcuts when one is overridden', () =>
    {
        const overrides = { 'new': 'Cmd+Alt+N' };
        const effective = GetEffectiveShortcuts(overrides);

        const saveAction = effective.find(s => 'save' === s.action);
        const defaults = GetDefaultShortcuts();
        const defaultSave = defaults.find(s => 'save' === s.action);

        expect(saveAction!.shortcut).toBe(defaultSave!.shortcut);
    });

    it('handles empty override value (ignores it)', () =>
    {
        const overrides = { 'new': '' };
        const effective = GetEffectiveShortcuts(overrides);

        const newAction = effective.find(s => 'new' === s.action);
        const defaults = GetDefaultShortcuts();
        const defaultNew = defaults.find(s => 'new' === s.action);

        expect(newAction!.shortcut).toBe(defaultNew!.shortcut);
    });
});

// ─── FindConflict ──────────────────────────────────────────────

describe('FindConflict', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
    });

    it('returns null for empty shortcut', () =>
    {
        const conflict = FindConflict('', 'new', {});
        expect(null === conflict).toBe(true);
    });

    it('returns null when no conflict exists', () =>
    {
        const conflict = FindConflict('Cmd+Alt+Q', 'new', {});
        expect(null === conflict).toBe(true);
    });

    it('detects conflict with existing shortcut', () =>
    {
        const conflict = FindConflict('Cmd+N', 'save', {});
        expect(null !== conflict).toBe(true);
        expect(conflict!.action).toBe('new');
    });

    it('excludes specified action from conflict check', () =>
    {
        const conflict = FindConflict('Cmd+N', 'new', {});
        expect(null === conflict).toBe(true);
    });

    it('detects conflict with custom override', () =>
    {
        const overrides = { 'save': 'Cmd+X' };
        const conflict = FindConflict('Cmd+X', 'new', overrides);
        expect(null !== conflict).toBe(true);
        expect(conflict!.action).toBe('save');
    });
});

// ─── NormalizeKeyboardEvent ────────────────────────────────────

describe('NormalizeKeyboardEvent', () =>
{
    it('normalizes Cmd+F', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'f',
            metaKey: true
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('Cmd+F');
    });

    it('normalizes Cmd+Shift+P', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'p',
            metaKey: true,
            shiftKey: true
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('Cmd+Shift+P');
    });

    it('normalizes Alt+ArrowUp to Alt+Up', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'ArrowUp',
            altKey: true
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('Alt+Up');
    });

    it('normalizes single letter to uppercase', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'a'
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('A');
    });

    it('returns empty string for modifier-only key (Meta)', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'Meta',
            metaKey: true
        });

        const result = NormalizeKeyboardEvent(event);
        expect('' === result).toBe(true);
    });

    it('normalizes Ctrl as Cmd', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'n',
            ctrlKey: true
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('Cmd+N');
    });

    it('normalizes backtick key', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'Backquote'
        });

        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('`');
    });

    it('normalizes arrow keys', () =>
    {
        const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight' });

        expect(NormalizeKeyboardEvent(eventDown)).toBe('Down');
        expect(NormalizeKeyboardEvent(eventLeft)).toBe('Left');
        expect(NormalizeKeyboardEvent(eventRight)).toBe('Right');
    });

    it('preserves Escape key', () =>
    {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        const result = NormalizeKeyboardEvent(event);
        expect(result).toBe('Escape');
    });
});

// ─── IsValidShortcut ────────────────────────────────────────────

describe('IsValidShortcut', () =>
{
    it('returns false for empty string', () =>
    {
        const result = IsValidShortcut('');
        expect(false === result).toBe(true);
    });

    it('returns true for Cmd+N', () =>
    {
        const result = IsValidShortcut('Cmd+N');
        expect(true === result).toBe(true);
    });

    it('returns false for Cmd+Shift+Alt (only modifiers)', () =>
    {
        const result = IsValidShortcut('Cmd+Shift+Alt');
        expect(false === result).toBe(true);
    });

    it('returns true for single letter (F)', () =>
    {
        const result = IsValidShortcut('F');
        expect(true === result).toBe(true);
    });

    it('returns true for Escape', () =>
    {
        const result = IsValidShortcut('Escape');
        expect(true === result).toBe(true);
    });

    it('returns true for Alt+Up', () =>
    {
        const result = IsValidShortcut('Alt+Up');
        expect(true === result).toBe(true);
    });
});

// ─── Persistence ────────────────────────────────────────────────

describe('Persistence', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
    });

    afterEach(() =>
    {
        localStorage.clear();
    });

    it('SaveCustomShortcuts and LoadCustomShortcuts round-trip', () =>
    {
        const overrides = {
            'new': 'Cmd+Alt+N',
            'save': 'Cmd+Alt+S',
            'find': 'Cmd+Alt+F'
        };

        SaveCustomShortcuts(overrides);
        const loaded = LoadCustomShortcuts();

        expect(loaded).toEqual(overrides);
    });

    it('LoadCustomShortcuts returns empty on no stored data', () =>
    {
        const loaded = LoadCustomShortcuts();
        expect(loaded).toEqual({});
    });

    it('LoadCustomShortcuts returns empty on corrupted data', () =>
    {
        localStorage.setItem('notemac-custom-shortcuts', 'invalid json {');
        const loaded = LoadCustomShortcuts();
        expect(loaded).toEqual({});
    });

    it('SaveCustomShortcuts overwrites previous data', () =>
    {
        const first = { 'new': 'Cmd+Alt+N' };
        const second = { 'save': 'Cmd+Alt+S' };

        SaveCustomShortcuts(first);
        let loaded = LoadCustomShortcuts();
        expect(loaded).toEqual(first);

        SaveCustomShortcuts(second);
        loaded = LoadCustomShortcuts();
        expect(loaded).toEqual(second);
    });
});
