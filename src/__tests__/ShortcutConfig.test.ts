import { describe, it, expect } from 'vitest';
import { GetDefaultShortcuts, GetShortcutCategories, GetShortcutsByCategory } from '../Notemac/Configs/ShortcutConfig';

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
