/**
 * TauriBridge — Adapts Tauri's invoke/listen API to the same shape as window.electronAPI.
 *
 * This allows FileController, SafeStorageService, and other consumers to use
 * identical callback patterns regardless of whether the backend is Electron or Tauri.
 */

import type { FileTreeNode } from '../Commons/Types';

// ─── Tauri API Imports (dynamic to avoid errors in non-Tauri envs) ──

let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let tauriListen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

async function EnsureTauriAPI(): Promise<boolean>
{
    if (null !== tauriInvoke)
        return true;

    try
    {
        const core = await import('@tauri-apps/api/core');
        const eventMod = await import('@tauri-apps/api/event');
        tauriInvoke = core.invoke;
        tauriListen = eventMod.listen;
        return true;
    }
    catch
    {
        return false;
    }
}

// ─── Public Interface (mirrors window.electronAPI shape) ────────

export interface TauriAPI
{
    onMenuAction: (callback: (action: string, value?: boolean | string | number) => void) => void;
    onFileOpened: (callback: (data: { path: string; content: string; name: string }) => void) => void;
    onFolderOpened: (callback: (data: { path: string; tree: FileTreeNode[] }) => void) => void;
    onFileSaved: (callback: (data: { path: string; name: string }) => void) => void;
    openFile: () => void;
    openFolder: () => void;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<boolean>;
    readDir: (path: string) => Promise<FileTreeNode[]>;
    saveFileAs: (content: string, suggestedName: string) => void;
    renameFile: (oldPath: string, newName: string) => void;
    setAlwaysOnTop: (value: boolean) => void;
    safeStorageEncrypt: (plaintext: string) => Promise<string>;
    safeStorageDecrypt: (encrypted: string) => Promise<string>;
    isSafeStorageAvailable: () => Promise<boolean>;
}

// ─── Bridge Implementation ──────────────────────────────────────

export async function CreateTauriBridge(): Promise<TauriAPI | null>
{
    const ready = await EnsureTauriAPI();
    if (!ready || null === tauriInvoke || null === tauriListen)
        return null;

    const invoke = tauriInvoke;
    const listen = tauriListen;

    return {
        onMenuAction(callback)
        {
            listen('menu-action', (event: { payload: unknown }) =>
            {
                const payload = event.payload as { action: string; value?: boolean | string | number };
                callback(payload.action, payload.value ?? undefined);
            });
        },

        onFileOpened(callback)
        {
            listen('file-opened', (event: { payload: unknown }) =>
            {
                callback(event.payload as { path: string; content: string; name: string });
            });
        },

        onFolderOpened(callback)
        {
            listen('folder-opened', (event: { payload: unknown }) =>
            {
                callback(event.payload as { path: string; tree: FileTreeNode[] });
            });
        },

        onFileSaved(callback)
        {
            listen('file-saved', (event: { payload: unknown }) =>
            {
                callback(event.payload as { path: string; name: string });
            });
        },

        openFile()
        {
            invoke('open_file_dialog');
        },

        openFolder()
        {
            invoke('open_folder_dialog');
        },

        async readFile(path: string): Promise<string>
        {
            return (await invoke('read_file', { path })) as string;
        },

        async writeFile(path: string, content: string): Promise<boolean>
        {
            return (await invoke('write_file', { path, content })) as boolean;
        },

        async readDir(path: string): Promise<FileTreeNode[]>
        {
            return (await invoke('read_dir', { path })) as FileTreeNode[];
        },

        saveFileAs(content: string, suggestedName: string)
        {
            invoke('save_file_dialog', { content, suggestedName });
        },

        renameFile(oldPath: string, newName: string)
        {
            invoke('rename_file', { oldPath, newName });
        },

        setAlwaysOnTop(value: boolean)
        {
            invoke('set_always_on_top', { value });
        },

        async safeStorageEncrypt(plaintext: string): Promise<string>
        {
            return (await invoke('safe_storage_encrypt', { plaintext })) as string;
        },

        async safeStorageDecrypt(encrypted: string): Promise<string>
        {
            return (await invoke('safe_storage_decrypt', { encrypted })) as string;
        },

        async isSafeStorageAvailable(): Promise<boolean>
        {
            return (await invoke('is_safe_storage_available')) as boolean;
        },
    };
}
