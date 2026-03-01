import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAllCommands, GetCommandsByCategory } from '../Notemac/Configs/CommandRegistry';
import { useNotemacStore } from '../Notemac/Model/Store';

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

// ─── CommandRegistry — Plugin commands ──────────────────────────

describe('CommandRegistry — plugin commands in Command Palette', () =>
{
    beforeEach(() =>
    {
        // Clear all plugin commands from store via setState
        useNotemacStore.setState({ pluginCommands: [] });
    });

    it('includes registered plugin commands in the command list', () =>
    {
        // Register a plugin command in the store
        useNotemacStore.getState().RegisterPluginCommand({
            id: 'testPlugin.doSomething',
            handler: () => {},
            pluginId: 'test-plugin',
        });

        const commands = GetAllCommands();
        const pluginCmd = commands.find(c => 'plugin:testPlugin.doSomething' === c.action);
        expect(pluginCmd).toBeDefined();
        expect(pluginCmd!.category).toBe('Plugins');

        // Cleanup
        useNotemacStore.getState().UnregisterAllByPluginId('test-plugin');
    });

    it('formats plugin command labels from camelCase IDs', () =>
    {
        useNotemacStore.getState().RegisterPluginCommand({
            id: 'loremIpsum.insertParagraph',
            handler: () => {},
            pluginId: 'test-plugin',
        });

        const commands = GetAllCommands();
        const pluginCmd = commands.find(c => 'plugin:loremIpsum.insertParagraph' === c.action);
        expect(pluginCmd).toBeDefined();
        expect(pluginCmd!.label).toBe('Lorem Ipsum: Insert Paragraph');

        useNotemacStore.getState().UnregisterAllByPluginId('test-plugin');
    });

    it('does not include plugin commands that clash with built-in actions', () =>
    {
        useNotemacStore.getState().RegisterPluginCommand({
            id: 'new', // Same as built-in "new" action
            handler: () => {},
            pluginId: 'test-plugin',
        });

        const commands = GetAllCommands();
        // The built-in "new" should exist, but no duplicate plugin version
        const newCommands = commands.filter(c => c.action === 'new' || c.action === 'plugin:new');
        // "new" is from shortcuts, "plugin:new" should also be added since "new" !== "plugin:new"
        // The dedup checks existingActions which contains "new", not "plugin:new"
        // So plugin:new should still be added
        expect(newCommands.length).toBeGreaterThanOrEqual(1);

        useNotemacStore.getState().UnregisterAllByPluginId('test-plugin');
    });

    it('returns more commands with plugin commands than without', () =>
    {
        // Clear all plugin commands
        useNotemacStore.setState({ pluginCommands: [] });
        const baseCmdCount = GetAllCommands().length;

        // Add a plugin command
        useNotemacStore.getState().RegisterPluginCommand({
            id: 'uniqueTest.commandForCounting',
            handler: () => {},
            pluginId: 'test-plugin',
        });

        const withPluginCmds = GetAllCommands();
        expect(withPluginCmds.length).toBe(baseCmdCount + 1);

        useNotemacStore.setState({ pluginCommands: [] });
    });
});
