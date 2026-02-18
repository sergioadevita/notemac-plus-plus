import { describe, it, expect } from 'vitest';
import { GetAllCommands, GetCommandsByCategory } from '../Notemac/Configs/CommandRegistry';
import { GetDefaultShortcuts, GetShortcutCategories, GetShortcutsByCategory } from '../Notemac/Configs/ShortcutConfig';

// ─── CommandRegistry — Git commands ─────────────────────────────

describe('CommandRegistry — git commands', () =>
{
    it('includes git commands in full command list', () =>
    {
        const commands = GetAllCommands();
        const gitCommands = commands.filter(c => 'Git' === c.category);
        expect(0 < gitCommands.length).toBe(true);
    });

    it('has Source Control Panel command', () =>
    {
        const commands = GetAllCommands();
        const cmd = commands.find(c => 'show-git-panel' === c.action);
        expect(cmd).toBeDefined();
        expect(cmd!.category).toBe('Git');
        expect(cmd!.label).toBe('Source Control Panel');
    });

    it('has Clone Repository command', () =>
    {
        const commands = GetAllCommands();
        const cmd = commands.find(c => 'clone-repository' === c.action);
        expect(cmd).toBeDefined();
        expect(cmd!.category).toBe('Git');
    });

    it('has Git Settings command', () =>
    {
        const commands = GetAllCommands();
        const cmd = commands.find(c => 'git-settings' === c.action);
        expect(cmd).toBeDefined();
        expect(cmd!.category).toBe('Git');
    });

    it('GetCommandsByCategory returns only git commands', () =>
    {
        const gitCommands = GetCommandsByCategory('Git');
        for (const cmd of gitCommands)
        {
            expect(cmd.category).toBe('Git');
        }
        expect(3 <= gitCommands.length).toBe(true);
    });

    it('does not have duplicate command ids', () =>
    {
        const commands = GetAllCommands();
        const ids = commands.map(c => c.id);
        const uniqueIds = new Set(ids);
        expect(ids.length === uniqueIds.size).toBe(true);
    });

    it('does not have duplicate command actions', () =>
    {
        const commands = GetAllCommands();
        const actions = commands.map(c => c.action);
        const uniqueActions = new Set(actions);
        expect(actions.length === uniqueActions.size).toBe(true);
    });
});

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
