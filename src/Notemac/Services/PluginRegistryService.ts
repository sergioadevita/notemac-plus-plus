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
        const manifest: PluginManifest = {
            id: entry.id,
            name: entry.name,
            version: entry.version,
            description: entry.description,
            author: entry.author,
            main: 'index.js',
        };

        let code = '';

        // Use bundled code if available (demo/offline plugins), otherwise download
        if (entry.bundledCode)
        {
            code = entry.bundledCode;
        }
        else
        {
            const response = await fetch(entry.downloadUrl);
            if (!response.ok)
            {
                throw new Error(`Download failed: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json'))
            {
                const data = await response.json();
                const remoteManifest = data.manifest || data;
                code = data.code || '';

                // Merge remote manifest fields if present
                if (remoteManifest.main)
                    manifest.main = remoteManifest.main;
                if (remoteManifest.contributes)
                    manifest.contributes = remoteManifest.contributes;
            }
            else
            {
                code = await response.text();
            }
        }

        // Create plugin subfolder and write files
        const pluginFolder = await pluginDir.getDirectoryHandle(entry.id, { create: true });

        const manifestHandle = await pluginFolder.getFileHandle('manifest.json', { create: true });
        const manifestWritable = await manifestHandle.createWritable();
        await manifestWritable.write(JSON.stringify(manifest, null, 2));
        await manifestWritable.close();

        if (code)
        {
            const mainFile = manifest.main || 'index.js';
            const codeHandle = await pluginFolder.getFileHandle(mainFile, { create: true });
            const codeWritable = await codeHandle.createWritable();
            await codeWritable.write(code);
            await codeWritable.close();
        }

        return manifest;
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
            bundledCode: GetWordCounterCode(),
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
            bundledCode: GetColorPickerCode(),
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
            bundledCode: GetMarkdownPreviewCode(),
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
            bundledCode: GetTodoHighlightCode(),
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
            bundledCode: GetFileIconsCode(),
        },
    ];
}

// ─── Bundled Demo Plugin Code ──────────────────────────────────────

function GetWordCounterCode(): string
{
    return `
export function activate(ctx) {
    const update = () => {
        const text = ctx.editor.getText() || '';
        const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
        const chars = text.length;
        const lines = text.split('\\n').length;
        ctx.ui.setStatusBarText('Words: ' + words + ' | Chars: ' + chars + ' | Lines: ' + lines);
    };
    ctx.events.on('editor:contentChanged', update);
    ctx.events.on('editor:tabChanged', update);
    update();
    ctx.commands.register('wordCounter.showCount', update);
}
export function deactivate() {}
`;
}

function GetColorPickerCode(): string
{
    return `
export function activate(ctx) {
    ctx.commands.register('colorPicker.insert', () => {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        ctx.editor.insertText(color);
    });
    ctx.ui.setStatusBarText('Color Picker ready');
}
export function deactivate() {}
`;
}

function GetMarkdownPreviewCode(): string
{
    return `
export function activate(ctx) {
    ctx.commands.register('markdownPreview.toggle', () => {
        const text = ctx.editor.getText() || '';
        const html = text
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/\`(.+?)\`/g, '<code>$1</code>')
            .replace(/\\n/g, '<br>');
        ctx.storage.set('lastPreview', html);
    });
    ctx.ui.setStatusBarText('MD Preview ready');
}
export function deactivate() {}
`;
}

function GetTodoHighlightCode(): string
{
    return `
let decorations = [];
export function activate(ctx) {
    const highlight = () => {
        const editor = ctx.editor.getMonacoEditor();
        if (!editor) return;
        const model = editor.getModel();
        if (!model) return;
        const matches = [];
        const text = model.getValue();
        const regex = /\\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\\b/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const pos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);
            matches.push({
                range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: endPos.lineNumber, endColumn: endPos.column },
                options: { inlineClassName: 'todo-highlight-decoration', hoverMessage: { value: match[0] + ' comment' } }
            });
        }
        decorations = editor.deltaDecorations(decorations, matches);
    };
    ctx.events.on('editor:contentChanged', highlight);
    ctx.events.on('editor:tabChanged', highlight);
    highlight();
    ctx.ui.setStatusBarText('TODO Highlight active');
}
export function deactivate() { decorations = []; }
`;
}

function GetFileIconsCode(): string
{
    return `
export function activate(ctx) {
    const iconMap = {
        js: '\\u{1F7E8}', ts: '\\u{1F535}', jsx: '\\u{269B}', tsx: '\\u{269B}',
        html: '\\u{1F7E0}', css: '\\u{1F7E3}', json: '\\u{1F4CB}', md: '\\u{1F4DD}',
        py: '\\u{1F40D}', rs: '\\u{2699}', go: '\\u{1F439}', java: '\\u{2615}',
        sh: '\\u{1F4BB}', yml: '\\u{2699}', yaml: '\\u{2699}', toml: '\\u{2699}',
        txt: '\\u{1F4C4}', svg: '\\u{1F3A8}', png: '\\u{1F5BC}', jpg: '\\u{1F5BC}',
    };
    ctx.commands.register('fileIcons.getIcon', () => {
        const fileName = ctx.editor.getFileName() || '';
        const ext = fileName.split('.').pop() || '';
        return iconMap[ext] || '\\u{1F4C4}';
    });
    ctx.ui.setStatusBarText('File Icons active');
}
export function deactivate() {}
`;
}
