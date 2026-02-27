import { describe, it, expect } from 'vitest';
import { GetAllCommands, GetCommandsByCategory } from '../Notemac/Configs/CommandRegistry';

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
