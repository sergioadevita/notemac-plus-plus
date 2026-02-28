import { describe, it, expect } from 'vitest';
import type {
    PluginManifest,
    PluginContributions,
    PluginInstance,
    PluginRegistryEntry,
    PluginCommandDef,
    PluginShortcutDef,
    PluginContext,
    RegisteredSidebarPanel,
    RegisteredStatusBarItem,
    RegisteredCommand,
} from '../Notemac/Commons/PluginTypes';

describe('PluginTypes', () =>
{
    it('should create a valid PluginManifest object', () =>
    {
        const manifest: PluginManifest = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'A test plugin',
            author: 'Test Author',
            main: 'dist/index.js',
        };

        expect('test-plugin' === manifest.id).toBe(true);
        expect('Test Plugin' === manifest.name).toBe(true);
        expect('1.0.0' === manifest.version).toBe(true);
    });

    it('should create PluginInstance with active status', () =>
    {
        const instance: PluginInstance = {
            id: 'plugin-1',
            manifest: {
                id: 'plugin-1',
                name: 'Test Plugin',
                version: '1.0.0',
                description: 'Test description',
                author: 'Test Author',
                main: 'index.js',
            },
            status: 'active',
            context: null,
            module: null,
        };

        expect('active' === instance.status).toBe(true);
        expect(null === instance.context).toBe(true);
    });

    it('should create PluginContext with all required APIs', () =>
    {
        const context: PluginContext = {
            pluginId: 'test-plugin',
            editor: {
                GetContent: () => 'content',
                SetContent: () => {},
                InsertText: () => {},
                GetLanguage: () => 'typescript',
                GetSelection: () => '',
                SetSelection: () => {},
            },
            events: {
                Subscribe: () => {},
                Dispatch: () => {},
            },
            ui: {
                RegisterSidebarPanel: () => {},
                RegisterStatusBarItem: () => {},
                RegisterMenuItem: () => {},
                RegisterSettingsSection: () => {},
                ShowNotification: () => {},
                ShowDialog: () => {},
            },
            commands: {
                Register: () => {},
                Execute: () => {},
            },
            themes: {
                Register: () => {},
            },
            languages: {
                Register: () => {},
            },
            storage: {
                Get: () => undefined,
                Set: () => {},
            },
        };

        expect('test-plugin' === context.pluginId).toBe(true);
        expect(null !== context.editor).toBe(true);
    });

    it('should create PluginContributions with command definitions', () =>
    {
        const contributions: PluginContributions = {
            commands: [
                {
                    id: 'test.command',
                    label: 'Test Command',
                    category: 'Test',
                },
            ],
        };

        expect(1 === contributions.commands?.length).toBe(true);
        expect('test.command' === contributions.commands?.[0].id).toBe(true);
    });

    it('should create RegisteredSidebarPanel with plugin association', () =>
    {
        const panel: RegisteredSidebarPanel = {
            id: 'test-panel',
            label: 'Test Panel',
            icon: 'icon-test',
            pluginId: 'test-plugin',
            component: () => null as any,
        };

        expect('test-panel' === panel.id).toBe(true);
        expect('test-plugin' === panel.pluginId).toBe(true);
    });
});
