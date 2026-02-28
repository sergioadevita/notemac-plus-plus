import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type {
    PluginInstance,
    RegisteredSidebarPanel,
    RegisteredStatusBarItem,
    RegisteredMenuItem,
    RegisteredCommand,
    PluginRegistryEntry,
} from '../Notemac/Commons/PluginTypes';
import React from 'react';

describe('PluginModel', () =>
{
    beforeEach(() =>
    {
        // Reset plugin state before each test
        const store = useNotemacStore.getState();
        store.SetPluginInstances([]);
        store.SetShowPluginManager(false);
        store.SetPluginDialogComponent(null);
        store.SetPluginRegistryEntries([]);
        store.SetPluginRegistryLoading(false);
    });

    describe('SetPluginInstances', () =>
    {
        it('should set plugin instances in store', () =>
        {
            const store = useNotemacStore.getState();
            const instances: PluginInstance[] = [
                {
                    id: 'plugin-1',
                    manifest: {
                        id: 'plugin-1',
                        name: 'Plugin 1',
                        version: '1.0.0',
                        author: 'pub',
                        description: 'Test',
                        main: 'index.js',
                    },
                    status: 'active',
                    loadError: null,
                },
            ];

            store.SetPluginInstances(instances);

            const updated = useNotemacStore.getState();
            expect(1 === updated.pluginInstances.length).toBe(true);
            expect('plugin-1' === updated.pluginInstances[0].id).toBe(true);
        });

        it('should replace existing instances', () =>
        {
            const store = useNotemacStore.getState();
            store.SetPluginInstances([
                { id: 'plugin-1', manifest: { id: 'plugin-1', name: 'P1', version: '1.0.0', author: 'a', description: 'd', main: 'i.js' }, status: 'active', loadError: null },
            ]);
            expect(1 === useNotemacStore.getState().pluginInstances.length).toBe(true);

            store.SetPluginInstances([
                { id: 'plugin-2', manifest: { id: 'plugin-2', name: 'P2', version: '2.0.0', author: 'a', description: 'd', main: 'i.js' }, status: 'inactive', loadError: null },
            ]);
            const updated = useNotemacStore.getState();
            expect(1 === updated.pluginInstances.length).toBe(true);
            expect('plugin-2' === updated.pluginInstances[0].id).toBe(true);
        });

        it('should handle empty instances array', () =>
        {
            const store = useNotemacStore.getState();
            store.SetPluginInstances([]);

            expect(0 === useNotemacStore.getState().pluginInstances.length).toBe(true);
        });
    });

    describe('RegisterPluginSidebarPanel', () =>
    {
        it('should register a sidebar panel', () =>
        {
            const store = useNotemacStore.getState();
            const panel: RegisteredSidebarPanel = {
                id: 'panel-1',
                label: 'Test Panel',
                icon: 'icon.svg',
                pluginId: 'plugin-1',
            };

            store.RegisterPluginSidebarPanel(panel);

            const updated = useNotemacStore.getState();
            expect(undefined !== updated.pluginSidebarPanels.find(p => 'panel-1' === p.id)).toBe(true);
        });

        it('should register multiple sidebar panels', () =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginSidebarPanel({ id: 'panel-1', label: 'P1', icon: 'i1', pluginId: 'plugin-1' });
            store.RegisterPluginSidebarPanel({ id: 'panel-2', label: 'P2', icon: 'i2', pluginId: 'plugin-2' });

            expect(2 <= useNotemacStore.getState().pluginSidebarPanels.length).toBe(true);
        });
    });

    describe('UnregisterPluginSidebarPanel', () =>
    {
        it('should unregister a sidebar panel', () =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginSidebarPanel({ id: 'panel-1', label: 'P', icon: 'i', pluginId: 'plugin-1' });
            expect(undefined !== useNotemacStore.getState().pluginSidebarPanels.find(p => 'panel-1' === p.id)).toBe(true);

            store.UnregisterPluginSidebarPanel('panel-1');
            expect(undefined === useNotemacStore.getState().pluginSidebarPanels.find(p => 'panel-1' === p.id)).toBe(true);
        });
    });

    describe('RegisterPluginStatusBarItem', () =>
    {
        it('should register a status bar item', () =>
        {
            const store = useNotemacStore.getState();
            const item: RegisteredStatusBarItem = {
                id: 'status-1',
                position: 'left',
                priority: 10,
                pluginId: 'plugin-1',
                component: (() => null) as any,
            };

            store.RegisterPluginStatusBarItem(item);

            expect(undefined !== useNotemacStore.getState().pluginStatusBarItems.find(i => 'status-1' === i.id)).toBe(true);
        });
    });

    describe('RegisterPluginCommand', () =>
    {
        it('should register a command', () =>
        {
            const store = useNotemacStore.getState();
            const command: RegisteredCommand = {
                id: 'cmd-1',
                handler: () => {},
                pluginId: 'plugin-1',
            };

            store.RegisterPluginCommand(command);

            expect(undefined !== useNotemacStore.getState().pluginCommands.find(c => 'cmd-1' === c.id)).toBe(true);
        });
    });

    describe('SetShowPluginManager', () =>
    {
        it('should set show plugin manager to true', () =>
        {
            const store = useNotemacStore.getState();
            store.SetShowPluginManager(true);

            expect(true === useNotemacStore.getState().showPluginManager).toBe(true);
        });

        it('should set show plugin manager to false', () =>
        {
            const store = useNotemacStore.getState();
            store.SetShowPluginManager(true);
            store.SetShowPluginManager(false);

            expect(false === useNotemacStore.getState().showPluginManager).toBe(true);
        });
    });

    describe('SetPluginDialogComponent', () =>
    {
        it('should set plugin dialog component', () =>
        {
            const store = useNotemacStore.getState();
            const MockComp = () => null;

            store.SetPluginDialogComponent(MockComp);

            expect(null !== useNotemacStore.getState().pluginDialogComponent).toBe(true);
        });

        it('should clear plugin dialog component', () =>
        {
            const store = useNotemacStore.getState();
            store.SetPluginDialogComponent((() => null) as any);
            store.SetPluginDialogComponent(null);

            expect(null === useNotemacStore.getState().pluginDialogComponent).toBe(true);
        });
    });

    describe('SetPluginRegistryEntries', () =>
    {
        it('should set registry entries', () =>
        {
            const store = useNotemacStore.getState();
            const entries: PluginRegistryEntry[] = [
                {
                    id: 'entry-1',
                    name: 'Entry 1',
                    version: '1.0.0',
                    description: 'Test entry',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                },
            ];

            store.SetPluginRegistryEntries(entries);

            const updated = useNotemacStore.getState();
            expect(1 === updated.pluginRegistryEntries.length).toBe(true);
            expect('entry-1' === updated.pluginRegistryEntries[0].id).toBe(true);
        });
    });

    describe('SetPluginRegistryLoading', () =>
    {
        it('should set registry loading to true', () =>
        {
            useNotemacStore.getState().SetPluginRegistryLoading(true);
            expect(true === useNotemacStore.getState().pluginRegistryLoading).toBe(true);
        });

        it('should set registry loading to false', () =>
        {
            const store = useNotemacStore.getState();
            store.SetPluginRegistryLoading(true);
            store.SetPluginRegistryLoading(false);
            expect(false === useNotemacStore.getState().pluginRegistryLoading).toBe(true);
        });
    });

    describe('UnregisterAllByPluginId', () =>
    {
        it('should unregister all components for a plugin', () =>
        {
            const store = useNotemacStore.getState();

            store.RegisterPluginSidebarPanel({ id: 'panel-1', label: 'P', icon: 'i', pluginId: 'plugin-1' });
            store.RegisterPluginStatusBarItem({ id: 'status-1', position: 'left', priority: 10, pluginId: 'plugin-1', component: (() => null) as any });
            store.RegisterPluginCommand({ id: 'cmd-1', handler: () => {}, pluginId: 'plugin-1' });

            store.UnregisterAllByPluginId('plugin-1');

            const updated = useNotemacStore.getState();
            expect(undefined === updated.pluginSidebarPanels.find(p => 'plugin-1' === p.pluginId)).toBe(true);
            expect(undefined === updated.pluginStatusBarItems.find(i => 'plugin-1' === i.pluginId)).toBe(true);
            expect(undefined === updated.pluginCommands.find(c => 'plugin-1' === c.pluginId)).toBe(true);
        });

        it('should only remove components from specified plugin', () =>
        {
            const store = useNotemacStore.getState();

            store.RegisterPluginSidebarPanel({ id: 'panel-1', label: 'P1', icon: 'i', pluginId: 'plugin-1' });
            store.RegisterPluginSidebarPanel({ id: 'panel-2', label: 'P2', icon: 'i', pluginId: 'plugin-2' });

            store.UnregisterAllByPluginId('plugin-1');

            const updated = useNotemacStore.getState();
            expect(undefined === updated.pluginSidebarPanels.find(p => 'panel-1' === p.id)).toBe(true);
            expect(undefined !== updated.pluginSidebarPanels.find(p => 'panel-2' === p.id)).toBe(true);
        });
    });
});
