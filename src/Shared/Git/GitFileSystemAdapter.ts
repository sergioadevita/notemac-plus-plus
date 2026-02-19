import LightningFS from '@isomorphic-git/lightning-fs';

/**
 * Unified file system adapter for isomorphic-git.
 * Abstracts three backends:
 * - Electron: native fs via IPC
 * - Chromium web: File System Access API (real files)
 * - Firefox/Safari: lightning-fs backed by IndexedDB
 */

// ─── Types ───────────────────────────────────────────────────────

export interface FsReadOptions { encoding?: string; mode?: number }
export interface FsStat { isFile(): boolean; isDirectory(): boolean; isSymbolicLink(): boolean; size: number; mode: number; mtimeMs: number }

export interface FsAdapter
{
    readFile(filepath: string, opts?: FsReadOptions | string): Promise<Uint8Array | string>;
    writeFile(filepath: string, data: Uint8Array | string, opts?: FsReadOptions | string): Promise<void>;
    unlink(filepath: string): Promise<void>;
    readdir(filepath: string): Promise<string[]>;
    mkdir(filepath: string): Promise<void>;
    rmdir(filepath: string): Promise<void>;
    stat(filepath: string): Promise<FsStat>;
    lstat(filepath: string): Promise<FsStat>;
}

export type FsBackendType = 'electron' | 'webfs' | 'lightningfs';

// ─── Environment Detection ───────────────────────────────────────

export function DetectFsBackend(): FsBackendType
{
    if ('undefined' !== typeof window && window.electronAPI)
        return 'electron';
    if ('showDirectoryPicker' in window)
        return 'webfs';
    return 'lightningfs';
}

export function IsElectronEnvironment(): boolean
{
    return 'electron' === DetectFsBackend();
}

export function IsWebFsEnvironment(): boolean
{
    return 'webfs' === DetectFsBackend();
}

export function IsBrowserWorkspaceEnvironment(): boolean
{
    return 'lightningfs' === DetectFsBackend();
}

// ─── Lightning FS (IndexedDB) Backend ────────────────────────────

const lightningFsInstances = new Map<string, LightningFS>();

export function GetLightningFs(namespace: string): LightningFS
{
    if (!lightningFsInstances.has(namespace))
        lightningFsInstances.set(namespace, new LightningFS(namespace));
    return lightningFsInstances.get(namespace)!;
}

export function DeleteLightningFs(namespace: string): void
{
    lightningFsInstances.delete(namespace);
    // Wipe IndexedDB
    if ('indexedDB' in window)
        window.indexedDB.deleteDatabase(namespace);
}

/**
 * Creates an fs adapter for lightning-fs that isomorphic-git can use directly.
 * lightning-fs already implements the correct interface — we just return its promises property.
 */
export function CreateLightningFsAdapter(namespace: string): FsAdapter
{
    const lfs = GetLightningFs(namespace);
    return lfs.promises;
}

// ─── Web File System Access API Backend ──────────────────────────

/**
 * Stores directory handles by workspace path for the Web FS Access API backend.
 * When a user opens a folder via showDirectoryPicker, we store the handle here
 * so isomorphic-git can read/write real files.
 */
const dirHandleRegistry = new Map<string, FileSystemDirectoryHandle>();

export function RegisterDirHandle(workspacePath: string, handle: FileSystemDirectoryHandle): void
{
    dirHandleRegistry.set(workspacePath, handle);
}

export function GetDirHandle(workspacePath: string): FileSystemDirectoryHandle | undefined
{
    return dirHandleRegistry.get(workspacePath);
}

/**
 * Creates an fs adapter for the Web File System Access API.
 * This maps isomorphic-git's fs calls to the real file system via directory handles.
 */
export function CreateWebFsAdapter(rootHandle: FileSystemDirectoryHandle): FsAdapter
{
    async function resolvePath(filepath: string): Promise<{ dir: FileSystemDirectoryHandle; name: string }>
    {
        const parts = filepath.split('/').filter(p => 0 < p.length);
        if (0 === parts.length)
            return { dir: rootHandle, name: '' };

        const fileName = parts.pop()!;
        let current = rootHandle;

        for (const part of parts)
        {
            current = await current.getDirectoryHandle(part, { create: false });
        }

        return { dir: current, name: fileName };
    }

    async function resolveDir(filepath: string): Promise<FileSystemDirectoryHandle>
    {
        const parts = filepath.split('/').filter(p => 0 < p.length);
        let current = rootHandle;

        for (const part of parts)
        {
            current = await current.getDirectoryHandle(part, { create: false });
        }

        return current;
    }

    const adapter = {
        readFile: async (filepath: string, opts?: FsReadOptions | string) =>
        {
            const { dir, name } = await resolvePath(filepath);
            const fileHandle = await dir.getFileHandle(name);
            const file = await fileHandle.getFile();

            const encoding = 'string' === typeof opts ? opts : opts?.encoding;
            if ('utf8' === encoding)
                return await file.text();
            return new Uint8Array(await file.arrayBuffer());
        },

        writeFile: async (filepath: string, data: Uint8Array | string, _opts?: FsReadOptions | string) =>
        {
            // Ensure parent dirs exist
            const parts = filepath.split('/').filter(p => 0 < p.length);
            const fileName = parts.pop()!;
            let current = rootHandle;

            for (const part of parts)
            {
                current = await current.getDirectoryHandle(part, { create: true });
            }

            const fileHandle = await current.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
        },

        unlink: async (filepath: string) =>
        {
            const { dir, name } = await resolvePath(filepath);
            await dir.removeEntry(name);
        },

        readdir: async (filepath: string) =>
        {
            const dir = 0 === filepath.length || '/' === filepath || '.' === filepath
                ? rootHandle
                : await resolveDir(filepath);
            const entries: string[] = [];
            for await (const entry of dir.values())
            {
                entries.push(entry.name);
            }
            return entries;
        },

        mkdir: async (filepath: string) =>
        {
            const parts = filepath.split('/').filter(p => 0 < p.length);
            let current = rootHandle;
            for (const part of parts)
            {
                current = await current.getDirectoryHandle(part, { create: true });
            }
        },

        rmdir: async (filepath: string) =>
        {
            const { dir, name } = await resolvePath(filepath);
            await dir.removeEntry(name, { recursive: true });
        },

        stat: async (filepath: string) =>
        {
            if (0 === filepath.length || '/' === filepath || '.' === filepath)
            {
                return {
                    isFile: () => false,
                    isDirectory: () => true,
                    isSymbolicLink: () => false,
                    size: 0,
                    mode: 0o40755,
                    mtimeMs: Date.now(),
                };
            }

            try
            {
                await resolveDir(filepath);
                return {
                    isFile: () => false,
                    isDirectory: () => true,
                    isSymbolicLink: () => false,
                    size: 0,
                    mode: 0o40755,
                    mtimeMs: Date.now(),
                };
            }
            catch
            {
                const { dir, name } = await resolvePath(filepath);
                const fileHandle = await dir.getFileHandle(name);
                const file = await fileHandle.getFile();
                return {
                    isFile: () => true,
                    isDirectory: () => false,
                    isSymbolicLink: () => false,
                    size: file.size,
                    mode: 0o100644,
                    mtimeMs: file.lastModified,
                };
            }
        },

        lstat: async (filepath: string) =>
        {
            // Web FS doesn't have symlinks, delegate to our own stat
            return adapter.stat(filepath);
        },
    };

    return adapter;
}

/**
 * Gets the appropriate fs module for isomorphic-git based on current environment.
 * For Electron, returns a placeholder — the actual fs is provided by the main process.
 * For web, returns an adapter over the File System Access API or lightning-fs.
 */
export function GetFsForGit(workspacePath: string, dirHandle?: FileSystemDirectoryHandle): FsAdapter | null
{
    const backend = DetectFsBackend();

    if ('electron' === backend)
    {
        // Electron uses node fs — isomorphic-git can use it directly via require('fs')
        // We return null here; the electron bridge handles this
        return null;
    }

    if ('webfs' === backend && dirHandle)
    {
        return CreateWebFsAdapter(dirHandle);
    }

    // Fallback: lightning-fs for browser workspace
    return CreateLightningFsAdapter(workspacePath);
}
