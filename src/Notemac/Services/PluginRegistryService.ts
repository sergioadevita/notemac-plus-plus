/**
 * PluginRegistryService — Remote registry + local plugin management.
 *
 * Handles fetching the registry index, searching, installing and
 * uninstalling plugins, and checking for updates.
 */

import type { PluginRegistryEntry, PluginManifest } from '../Commons/PluginTypes';
import { CompareVersions } from './PluginLoaderService';

/**
 * Fetch the plugin registry index from a remote URL.
 */
export async function FetchRegistryIndex(registryUrl: string): Promise<PluginRegistryEntry[]>
{
    try
    {
        const response = await fetch(`${registryUrl}/plugins`);

        if (!response.ok)
        {
            throw new Error(`Registry fetch failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data))
        {
            return [];
        }

        return data.filter(ValidateRegistryEntry);
    }
    catch
    {
        // Network error or invalid response — return empty
        return [];
    }
}

/**
 * Validate a registry entry has all required fields.
 */
export function ValidateRegistryEntry(entry: unknown): entry is PluginRegistryEntry
{
    if (null === entry || 'object' !== typeof entry)
        return false;

    const e = entry as Record<string, unknown>;
    return (
        'string' === typeof e.id && 0 < e.id.length &&
        'string' === typeof e.name && 0 < e.name.length &&
        'string' === typeof e.description &&
        'string' === typeof e.author &&
        'string' === typeof e.version &&
        'string' === typeof e.downloadUrl
    );
}

/**
 * Search registry entries by query (matches name, description, or author).
 */
export function SearchRegistry(query: string, entries: PluginRegistryEntry[]): PluginRegistryEntry[]
{
    if (0 === query.trim().length)
        return entries;

    const lowerQuery = query.toLowerCase();

    return entries.filter(entry =>
    {
        return (
            entry.name.toLowerCase().includes(lowerQuery) ||
            entry.description.toLowerCase().includes(lowerQuery) ||
            entry.author.toLowerCase().includes(lowerQuery)
        );
    });
}

/**
 * Install a plugin from the registry by downloading and extracting it.
 * Returns the manifest of the installed plugin.
 */
export async function InstallPlugin(
    entry: PluginRegistryEntry,
    pluginDir: FileSystemDirectoryHandle,
): Promise<PluginManifest | null>
{
    try
    {
        // Download the plugin bundle
        const response = await fetch(entry.downloadUrl);
        if (!response.ok)
        {
            throw new Error(`Download failed: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Create plugin subfolder
        const pluginFolder = await pluginDir.getDirectoryHandle(entry.id, { create: true });

        if (contentType.includes('application/json'))
        {
            // Single-file plugin: manifest + inline code
            const data = await response.json();
            const manifest = data.manifest || data;
            const code = data.code || '';

            // Write manifest
            const manifestHandle = await pluginFolder.getFileHandle('manifest.json', { create: true });
            const manifestWritable = await manifestHandle.createWritable();
            await manifestWritable.write(JSON.stringify(manifest, null, 2));
            await manifestWritable.close();

            // Write code
            if (code)
            {
                const mainFile = manifest.main || 'index.js';
                const codeHandle = await pluginFolder.getFileHandle(mainFile, { create: true });
                const codeWritable = await codeHandle.createWritable();
                await codeWritable.write(code);
                await codeWritable.close();
            }

            return manifest as PluginManifest;
        }
        else
        {
            // Treat as JS bundle — create a default manifest
            const code = await response.text();

            const manifest: PluginManifest = {
                id: entry.id,
                name: entry.name,
                version: entry.version,
                description: entry.description,
                author: entry.author,
                main: 'index.js',
            };

            // Write manifest
            const manifestHandle = await pluginFolder.getFileHandle('manifest.json', { create: true });
            const manifestWritable = await manifestHandle.createWritable();
            await manifestWritable.write(JSON.stringify(manifest, null, 2));
            await manifestWritable.close();

            // Write code
            const codeHandle = await pluginFolder.getFileHandle('index.js', { create: true });
            const codeWritable = await codeHandle.createWritable();
            await codeWritable.write(code);
            await codeWritable.close();

            return manifest;
        }
    }
    catch
    {
        return null;
    }
}

/**
 * Uninstall a plugin by removing its folder.
 */
export async function UninstallPlugin(
    pluginId: string,
    pluginDir: FileSystemDirectoryHandle,
): Promise<boolean>
{
    try
    {
        await pluginDir.removeEntry(pluginId, { recursive: true });
        return true;
    }
    catch
    {
        return false;
    }
}

/**
 * Check for available updates by comparing installed vs registry versions.
 */
export function CheckForUpdates(
    installed: { id: string; version: string }[],
    registry: PluginRegistryEntry[],
): { pluginId: string; currentVersion: string; availableVersion: string }[]
{
    const updates: { pluginId: string; currentVersion: string; availableVersion: string }[] = [];

    for (const plugin of installed)
    {
        const registryEntry = registry.find(r => r.id === plugin.id);
        if (registryEntry && CompareVersions(registryEntry.version, plugin.version) > 0)
        {
            updates.push({
                pluginId: plugin.id,
                currentVersion: plugin.version,
                availableVersion: registryEntry.version,
            });
        }
    }

    return updates;
}

/**
 * Create a sample/demo registry for development and testing.
 */
export function GetDemoRegistryEntries(): PluginRegistryEntry[]
{
    return [
        {
            id: 'word-counter',
            name: 'Word Counter',
            description: 'Shows word, character, and line count in the status bar.',
            author: 'Notemac Community',
            version: '1.0.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/word-counter/download',
            stars: 127,
            downloads: 4521,
        },
        {
            id: 'color-picker',
            name: 'Color Picker',
            description: 'Inline color picker for CSS and design files.',
            author: 'Notemac Community',
            version: '1.2.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/color-picker/download',
            stars: 89,
            downloads: 3210,
        },
        {
            id: 'markdown-preview',
            name: 'Markdown Preview',
            description: 'Live preview panel for Markdown files.',
            author: 'Notemac Community',
            version: '2.0.1',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/markdown-preview/download',
            stars: 256,
            downloads: 8901,
        },
        {
            id: 'todo-highlight',
            name: 'TODO Highlight',
            description: 'Highlights TODO, FIXME, and HACK comments in code.',
            author: 'Notemac Community',
            version: '1.1.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/todo-highlight/download',
            stars: 198,
            downloads: 6745,
        },
        {
            id: 'file-icons',
            name: 'File Icons',
            description: 'Rich file icons for the explorer and tab bar.',
            author: 'Notemac Community',
            version: '1.0.2',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/file-icons/download',
            stars: 312,
            downloads: 12040,
        },
    ];
}
