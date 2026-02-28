/**
 * PluginLoaderService — Plugin discovery, manifest validation, and bundle loading.
 *
 * Scans plugin directories, parses manifests, validates them, and dynamically
 * imports plugin entry point modules. Each plugin loads in isolation with
 * try/catch — one failure does not block others.
 */

import type { PluginManifest, PluginModule } from '../Commons/PluginTypes';
import { PLUGIN_MANIFEST_FILENAME, PLUGIN_API_VERSION } from '../Commons/Constants';

/**
 * Validate a plugin manifest has all required fields and version compatibility.
 */
export function ValidateManifest(manifest: unknown): manifest is PluginManifest
{
    if (null === manifest || 'object' !== typeof manifest)
        return false;

    const m = manifest as Record<string, unknown>;

    if ('string' !== typeof m.id || 0 === m.id.length)
        return false;
    if ('string' !== typeof m.name || 0 === m.name.length)
        return false;
    if ('string' !== typeof m.version || 0 === m.version.length)
        return false;
    if ('string' !== typeof m.description)
        return false;
    if ('string' !== typeof m.author)
        return false;
    if ('string' !== typeof m.main || 0 === m.main.length)
        return false;

    // Check engine compatibility (semver-simple)
    if (m.engines && 'object' === typeof m.engines)
    {
        const engines = m.engines as Record<string, unknown>;
        if ('string' === typeof engines.notemac)
        {
            const required = engines.notemac;
            if (!CheckVersionCompatibility(required, PLUGIN_API_VERSION))
                return false;
        }
    }

    return true;
}

/**
 * Simple semver compatibility check.
 * Supports: ">=X.Y.Z" and exact "X.Y.Z" patterns.
 */
export function CheckVersionCompatibility(requirement: string, current: string): boolean
{
    const trimmed = requirement.trim();

    if (trimmed.startsWith('>='))
    {
        const requiredVersion = trimmed.slice(2).trim();
        return CompareVersions(current, requiredVersion) >= 0;
    }

    if (trimmed.startsWith('^'))
    {
        const requiredVersion = trimmed.slice(1).trim();
        const reqParts = requiredVersion.split('.').map(Number);
        const curParts = current.split('.').map(Number);
        // Major must match, current minor/patch must be >= required
        return curParts[0] === reqParts[0] && CompareVersions(current, requiredVersion) >= 0;
    }

    // Exact match
    return CompareVersions(current, trimmed) >= 0;
}

/**
 * Compare two semver strings. Returns -1, 0, or 1.
 */
export function CompareVersions(a: string, b: string): number
{
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    const len = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < len; i++)
    {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal > bVal) return 1;
        if (aVal < bVal) return -1;
    }

    return 0;
}

/**
 * Scan a plugin directory (FileSystemDirectoryHandle) for plugins.
 * Each subfolder is expected to contain a manifest.json.
 */
export async function ScanPluginDirectory(dirHandle: FileSystemDirectoryHandle): Promise<{ path: string; manifest: PluginManifest }[]>
{
    const plugins: { path: string; manifest: PluginManifest }[] = [];

    try
    {
        for await (const entry of dirHandle.values())
        {
            if ('directory' !== entry.kind)
                continue;

            try
            {
                const pluginDir = entry as FileSystemDirectoryHandle;
                const manifestHandle = await pluginDir.getFileHandle(PLUGIN_MANIFEST_FILENAME);
                const manifestFile = await manifestHandle.getFile();
                const manifestText = await manifestFile.text();
                const parsed = JSON.parse(manifestText);

                if (ValidateManifest(parsed))
                {
                    plugins.push({ path: entry.name, manifest: parsed });
                }
            }
            catch
            {
                // Plugin folder missing manifest or invalid — skip silently
            }
        }
    }
    catch
    {
        // Directory not accessible — return empty
    }

    return plugins;
}

/**
 * Dynamically import a plugin's JS bundle from a Blob URL.
 * Expects the module to export an activate function.
 */
export async function LoadPluginBundle(code: string): Promise<PluginModule>
{
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try
    {
        const module = await import(/* @vite-ignore */ url);

        if ('function' !== typeof module.activate)
        {
            throw new Error('Plugin module must export an activate function');
        }

        return {
            activate: module.activate,
            deactivate: 'function' === typeof module.deactivate ? module.deactivate : undefined,
        };
    }
    finally
    {
        URL.revokeObjectURL(url);
    }
}

/**
 * Load a plugin bundle from a FileSystemDirectoryHandle.
 */
export async function LoadPluginFromDirectory(dirHandle: FileSystemDirectoryHandle, mainFile: string): Promise<PluginModule>
{
    const fileHandle = await dirHandle.getFileHandle(mainFile);
    const file = await fileHandle.getFile();
    const code = await file.text();
    return LoadPluginBundle(code);
}

/**
 * Parse a manifest from JSON text.
 */
export function ParseManifest(jsonText: string): PluginManifest | null
{
    try
    {
        const parsed = JSON.parse(jsonText);
        if (ValidateManifest(parsed))
            return parsed;
        return null;
    }
    catch
    {
        return null;
    }
}
