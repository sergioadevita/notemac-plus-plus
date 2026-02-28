/**
 * PluginController — Lifecycle orchestration for the plugin system.
 *
 * Manages initialization, activation, deactivation, reload, and command execution.
 * Each plugin loads in isolation — one failure does not block others.
 */

import type { PluginInstance, PluginManifest } from '../Commons/PluginTypes';
import { useNotemacStore } from '../Model/Store';
import { CreatePluginContext, CleanupPluginContext } from '../Services/PluginAPIService';
import { ScanPluginDirectory, LoadPluginFromDirectory } from '../Services/PluginLoaderService';
import { FetchRegistryIndex, GetDemoRegistryEntries } from '../Services/PluginRegistryService';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

// Plugin directory handle (set during initialization)
let pluginDirectoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Initialize the plugin system.
 * Scans the plugin directory (if available) and activates all found plugins.
 */
export async function InitializePluginSystem(): Promise<void>
{
    const store = useNotemacStore.getState();

    if (!store.settings.pluginsEnabled)
        return;

    // Try to get the plugins directory from the workspace
    try
    {
        if (pluginDirectoryHandle)
        {
            const plugins = await ScanPluginDirectory(pluginDirectoryHandle);
            const instances: PluginInstance[] = [];

            for (const { path, manifest } of plugins)
            {
                const instance: PluginInstance = {
                    id: manifest.id,
                    manifest,
                    status: 'inactive',
                    context: null,
                    module: null,
                };

                try
                {
                    const pluginDir = await pluginDirectoryHandle.getDirectoryHandle(path);
                    const module = await LoadPluginFromDirectory(pluginDir, manifest.main);
                    instance.module = module;

                    const context = CreatePluginContext(manifest.id);
                    instance.context = context;

                    await module.activate(context);
                    instance.status = 'active';

                    RegisterManifestContributions(manifest);

                    Dispatch(NOTEMAC_EVENTS.PLUGIN_ACTIVATED, { pluginId: manifest.id });
                }
                catch (err)
                {
                    instance.status = 'error';
                    instance.error = err instanceof Error ? err.message : String(err);
                    Dispatch(NOTEMAC_EVENTS.PLUGIN_ERROR, { pluginId: manifest.id, error: instance.error });
                }

                instances.push(instance);
            }

            store.SetPluginInstances(instances);
        }
    }
    catch
    {
        // Plugin system initialization failed — continue without plugins
    }

    // Load registry entries (demo fallback for now)
    await LoadRegistryEntries();
}

/**
 * Set the plugin directory handle for filesystem-based operations.
 */
export function SetPluginDirectoryHandle(handle: FileSystemDirectoryHandle | null): void
{
    pluginDirectoryHandle = handle;
}

/**
 * Get the current plugin directory handle.
 */
export function GetPluginDirectoryHandle(): FileSystemDirectoryHandle | null
{
    return pluginDirectoryHandle;
}

/**
 * Activate a specific plugin by ID.
 */
export async function ActivatePlugin(pluginId: string): Promise<void>
{
    const store = useNotemacStore.getState();
    const instances = [...store.pluginInstances];
    const index = instances.findIndex(p => p.id === pluginId);

    if (-1 === index)
        return;

    const instance = { ...instances[index] };

    if ('active' === instance.status)
        return;

    try
    {
        if (!instance.module)
            throw new Error('Plugin module not loaded');

        const context = CreatePluginContext(pluginId);
        instance.context = context;

        await instance.module.activate(context);
        instance.status = 'active';
        instance.error = undefined;

        RegisterManifestContributions(instance.manifest);

        Dispatch(NOTEMAC_EVENTS.PLUGIN_ACTIVATED, { pluginId });
    }
    catch (err)
    {
        instance.status = 'error';
        instance.error = err instanceof Error ? err.message : String(err);
        Dispatch(NOTEMAC_EVENTS.PLUGIN_ERROR, { pluginId, error: instance.error });
    }

    instances[index] = instance;
    store.SetPluginInstances(instances);
}

/**
 * Deactivate a specific plugin by ID.
 */
export async function DeactivatePlugin(pluginId: string): Promise<void>
{
    const store = useNotemacStore.getState();
    const instances = [...store.pluginInstances];
    const index = instances.findIndex(p => p.id === pluginId);

    if (-1 === index)
        return;

    const instance = { ...instances[index] };

    try
    {
        if (instance.module?.deactivate)
        {
            await instance.module.deactivate();
        }
    }
    catch
    {
        // Deactivation error — continue cleanup
    }

    CleanupPluginContext(pluginId);

    instance.status = 'inactive';
    instance.context = null;
    instance.error = undefined;

    instances[index] = instance;
    store.SetPluginInstances(instances);

    Dispatch(NOTEMAC_EVENTS.PLUGIN_DEACTIVATED, { pluginId });
}

/**
 * Reload a specific plugin (deactivate → re-load → activate).
 */
export async function ReloadPlugin(pluginId: string): Promise<void>
{
    await DeactivatePlugin(pluginId);

    const store = useNotemacStore.getState();
    const instances = [...store.pluginInstances];
    const index = instances.findIndex(p => p.id === pluginId);

    if (-1 === index || !pluginDirectoryHandle)
        return;

    const instance = { ...instances[index] };

    try
    {
        const pluginDir = await pluginDirectoryHandle.getDirectoryHandle(instance.manifest.id);
        const module = await LoadPluginFromDirectory(pluginDir, instance.manifest.main);
        instance.module = module;

        instances[index] = instance;
        store.SetPluginInstances(instances);

        await ActivatePlugin(pluginId);
    }
    catch (err)
    {
        instance.status = 'error';
        instance.error = err instanceof Error ? err.message : String(err);
        instances[index] = instance;
        store.SetPluginInstances(instances);
    }
}

/**
 * Enable a plugin (toggle status + activate).
 */
export async function EnablePlugin(pluginId: string): Promise<void>
{
    await ActivatePlugin(pluginId);
}

/**
 * Disable a plugin (toggle status + deactivate).
 */
export async function DisablePlugin(pluginId: string): Promise<void>
{
    await DeactivatePlugin(pluginId);
}

/**
 * Get plugin status.
 */
export function GetPluginStatus(pluginId: string): 'active' | 'inactive' | 'error'
{
    const store = useNotemacStore.getState();
    const instance = store.pluginInstances.find(p => p.id === pluginId);
    return instance?.status || 'inactive';
}

/**
 * Execute a registered plugin command.
 */
export function ExecutePluginCommand(commandId: string): void
{
    const store = useNotemacStore.getState();
    const command = store.pluginCommands.find(c => c.id === commandId);

    if (command)
    {
        try
        {
            command.handler();
        }
        catch
        {
            // Plugin command execution failed — silently handled
        }
    }
}

/**
 * Register contributions declared in the plugin manifest.
 */
function RegisterManifestContributions(manifest: PluginManifest): void
{
    const store = useNotemacStore.getState();
    const contributes = manifest.contributes;

    if (!contributes)
        return;

    // Register shortcuts from manifest
    if (contributes.shortcuts)
    {
        for (const shortcut of contributes.shortcuts)
        {
            store.RegisterPluginShortcut({
                shortcut: shortcut.shortcut,
                action: shortcut.action,
                category: shortcut.category,
                pluginId: manifest.id,
            });
        }
    }

    // Note: Sidebar panels, status bar items, menu items, settings sections
    // are registered dynamically by the plugin via the context API (not manifest).
    // However, some basic metadata from manifest contributes can be used for
    // discovery before the plugin is activated.
}

/**
 * Load registry entries (with demo fallback).
 */
async function LoadRegistryEntries(): Promise<void>
{
    const store = useNotemacStore.getState();
    store.SetPluginRegistryLoading(true);

    try
    {
        const registryUrl = store.settings.pluginRegistryUrl;
        const entries = await FetchRegistryIndex(registryUrl);

        if (0 < entries.length)
        {
            store.SetPluginRegistryEntries(entries);
        }
        else
        {
            // Fall back to demo entries for offline/development use
            store.SetPluginRegistryEntries(GetDemoRegistryEntries());
        }
    }
    catch
    {
        // Fallback to demo entries
        store.SetPluginRegistryEntries(GetDemoRegistryEntries());
    }
    finally
    {
        store.SetPluginRegistryLoading(false);
    }
}
