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
            id: 'lorem-ipsum',
            name: 'Lorem Ipsum Generator',
            description: 'Insert placeholder text at the cursor. Supports paragraphs and short sentences.',
            author: 'Notemac Community',
            version: '1.0.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/lorem-ipsum/download',
            stars: 145,
            downloads: 5230,
            bundledCode: GetLoremIpsumCode(),
        },
        {
            id: 'sort-lines',
            name: 'Sort Lines',
            description: 'Sort selected lines alphabetically, in reverse, or by line length.',
            author: 'Notemac Community',
            version: '1.1.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/sort-lines/download',
            stars: 203,
            downloads: 7840,
            bundledCode: GetSortLinesCode(),
        },
        {
            id: 'markdown-preview',
            name: 'Markdown Preview',
            description: 'Convert the current Markdown document to HTML and store the result for preview.',
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
            description: 'Highlights TODO, FIXME, HACK, XXX, NOTE, and BUG comments in code.',
            author: 'Notemac Community',
            version: '1.1.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/todo-highlight/download',
            stars: 198,
            downloads: 6745,
            bundledCode: GetTodoHighlightCode(),
        },
        {
            id: 'bookmarks',
            name: 'Bookmarks',
            description: 'Toggle line bookmarks and jump between them with keyboard shortcuts.',
            author: 'Notemac Community',
            version: '1.0.0',
            downloadUrl: 'https://registry.notemac.dev/api/v1/plugins/bookmarks/download',
            stars: 312,
            downloads: 11200,
            bundledCode: GetBookmarksCode(),
        },
    ];
}

// ─── Bundled Demo Plugin Code ──────────────────────────────────────

function GetLoremIpsumCode(): string
{
    return `
const PARAGRAPHS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
    'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.',
    'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.',
];

export function activate(ctx) {
    ctx.commands.Register('loremIpsum.insertParagraph', () => {
        const idx = Math.floor(Math.random() * PARAGRAPHS.length);
        ctx.editor.InsertText(PARAGRAPHS[idx] + '\\n\\n');
    });
    ctx.commands.Register('loremIpsum.insertThree', () => {
        const shuffled = [...PARAGRAPHS].sort(() => Math.random() - 0.5);
        ctx.editor.InsertText(shuffled.slice(0, 3).join('\\n\\n') + '\\n\\n');
    });
    ctx.ui.ShowNotification('Lorem Ipsum Generator ready');
}
export function deactivate() {}
`;
}

function GetSortLinesCode(): string
{
    return `
export function activate(ctx) {
    ctx.commands.Register('sortLines.ascending', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => a.localeCompare(b)).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.descending', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => b.localeCompare(a)).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.byLength', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => a.length - b.length).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.removeDuplicates', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines first'); return; }
        const unique = [...new Set(sel.split('\\n'))].join('\\n');
        ctx.editor.InsertText(unique);
    });
    ctx.ui.ShowNotification('Sort Lines ready — use Command Palette');
}
export function deactivate() {}
`;
}

function GetMarkdownPreviewCode(): string
{
    return `
export function activate(ctx) {
    ctx.commands.Register('markdownPreview.convert', () => {
        const text = ctx.editor.GetContent() || '';
        const html = text
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/\`(.+?)\`/g, '<code>$1</code>')
            .replace(/\\n/g, '<br>');
        ctx.storage.Set('lastPreview', html);
        ctx.ui.ShowNotification('Markdown converted — ' + html.length + ' chars of HTML');
    });
    ctx.ui.ShowNotification('Markdown Preview ready');
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
        const content = ctx.editor.GetContent() || '';
        if (!content) return;
        const lines = content.split('\\n');
        const matches = [];
        const keywords = /\\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\\b/g;
        for (let i = 0; i < lines.length; i++) {
            let match;
            while ((match = keywords.exec(lines[i])) !== null) {
                matches.push({
                    range: {
                        startLineNumber: i + 1,
                        startColumn: match.index + 1,
                        endLineNumber: i + 1,
                        endColumn: match.index + match[0].length + 1
                    },
                    options: {
                        inlineClassName: 'todo-highlight-decoration',
                        hoverMessage: { value: match[0] + ' comment' }
                    }
                });
            }
            keywords.lastIndex = 0;
        }
        ctx.storage.Set('highlightCount', matches.length);
        ctx.ui.ShowNotification('Found ' + matches.length + ' TODO-style comments');
    };
    ctx.events.Subscribe('editor:contentChanged', highlight);
    ctx.events.Subscribe('editor:tabChanged', highlight);
    ctx.commands.Register('todoHighlight.scan', highlight);
    highlight();
}
export function deactivate() { decorations = []; }
`;
}

function GetBookmarksCode(): string
{
    return `
let bookmarkedLines = [];

export function activate(ctx) {
    ctx.commands.Register('bookmarks.toggle', () => {
        const content = ctx.editor.GetContent() || '';
        const sel = ctx.editor.GetSelection();
        if (!content) return;
        const beforeCursor = content.substring(0, content.indexOf(sel) || 0);
        const currentLine = (beforeCursor.match(/\\n/g) || []).length + 1;
        const idx = bookmarkedLines.indexOf(currentLine);
        if (-1 !== idx) {
            bookmarkedLines.splice(idx, 1);
            ctx.ui.ShowNotification('Bookmark removed from line ' + currentLine);
        } else {
            bookmarkedLines.push(currentLine);
            bookmarkedLines.sort((a, b) => a - b);
            ctx.ui.ShowNotification('Bookmark set on line ' + currentLine);
        }
        ctx.storage.Set('bookmarks', bookmarkedLines);
    });
    ctx.commands.Register('bookmarks.next', () => {
        if (0 === bookmarkedLines.length) {
            ctx.ui.ShowNotification('No bookmarks set');
            return;
        }
        ctx.ui.ShowNotification('Bookmarks on lines: ' + bookmarkedLines.join(', '));
    });
    ctx.commands.Register('bookmarks.clear', () => {
        bookmarkedLines = [];
        ctx.storage.Set('bookmarks', []);
        ctx.ui.ShowNotification('All bookmarks cleared');
    });

    const saved = ctx.storage.Get('bookmarks');
    if (saved && Array.isArray(saved)) {
        bookmarkedLines = saved;
    }
    ctx.ui.ShowNotification('Bookmarks ready — ' + bookmarkedLines.length + ' bookmarks loaded');
}
export function deactivate() { bookmarkedLines = []; }
`;
}
