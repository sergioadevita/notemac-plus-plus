/**
 * SafeStorageService — Credential encryption wrapper.
 * Supports both Electron safeStorage (via IPC) and Tauri keyring (via invoke).
 * Falls back gracefully when neither is available (web mode).
 */

import { IsTauriEnvironment } from '../../Notemac/Services/PlatformBridge';

// ─── Electron API ───────────────────────────────────────────────

interface SafeStorageElectronAPI
{
    safeStorageEncrypt: (plaintext: string) => Promise<string>;
    safeStorageDecrypt: (base64: string) => Promise<string>;
    isSafeStorageAvailable: () => Promise<boolean>;
}

function GetElectronAPI(): SafeStorageElectronAPI | null
{
    const api = window.electronAPI;
    if (null == api)
        return null;
    if ('function' !== typeof api.safeStorageEncrypt)
        return null;
    return api as SafeStorageElectronAPI;
}

// ─── Tauri API ──────────────────────────────────────────────────

let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

async function GetTauriInvoke(): Promise<typeof tauriInvoke>
{
    if (null !== tauriInvoke)
        return tauriInvoke;

    try
    {
        const core = await import('@tauri-apps/api/core');
        tauriInvoke = core.invoke;
        return tauriInvoke;
    }
    catch
    {
        return null;
    }
}

// ─── Public Interface ───────────────────────────────────────────

export function IsElectronAvailable(): boolean
{
    return null !== GetElectronAPI() || IsTauriEnvironment();
}

export async function IsSafeStorageAvailable(): Promise<boolean>
{
    // Tauri path
    if (IsTauriEnvironment())
    {
        try
        {
            const invoke = await GetTauriInvoke();
            if (null === invoke) return false;
            return (await invoke('is_safe_storage_available')) as boolean;
        }
        catch
        {
            return false;
        }
    }

    // Electron path
    const api = GetElectronAPI();
    if (null === api)
        return false;

    try
    {
        return await api.isSafeStorageAvailable();
    }
    catch
    {
        return false;
    }
}

export async function EncryptWithSafeStorage(plaintext: string): Promise<string>
{
    // Tauri path
    if (IsTauriEnvironment())
    {
        const invoke = await GetTauriInvoke();
        if (null === invoke)
            throw new Error('Tauri safe storage not available');
        return (await invoke('safe_storage_encrypt', { plaintext })) as string;
    }

    // Electron path
    const api = GetElectronAPI();
    if (null === api)
        throw new Error('Safe storage not available');

    return await api.safeStorageEncrypt(plaintext);
}

export async function DecryptWithSafeStorage(encrypted: string): Promise<string>
{
    // Tauri path
    if (IsTauriEnvironment())
    {
        const invoke = await GetTauriInvoke();
        if (null === invoke)
            throw new Error('Tauri safe storage not available');
        return (await invoke('safe_storage_decrypt', { encrypted })) as string;
    }

    // Electron path
    const api = GetElectronAPI();
    if (null === api)
        throw new Error('Safe storage not available');

    return await api.safeStorageDecrypt(encrypted);
}
