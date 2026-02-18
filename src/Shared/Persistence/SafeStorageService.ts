/**
 * SafeStorageService — Electron safeStorage wrapper.
 * safeStorage is a main-process-only API, so we communicate via IPC
 * through the electronAPI bridge exposed by preload.js.
 */

interface ElectronSafeStorageAPI
{
    safeStorageEncrypt: (plaintext: string) => Promise<string>;
    safeStorageDecrypt: (base64: string) => Promise<string>;
    isSafeStorageAvailable: () => Promise<boolean>;
}

function GetElectronAPI(): ElectronSafeStorageAPI | null
{
    const api = (window as any).electronAPI;
    if (null === api || undefined === api)
        return null;
    if ('function' !== typeof api.safeStorageEncrypt)
        return null;
    return api as ElectronSafeStorageAPI;
}

export function IsElectronAvailable(): boolean
{
    return null !== GetElectronAPI();
}

export async function IsSafeStorageAvailable(): Promise<boolean>
{
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
    const api = GetElectronAPI();
    if (null === api)
        throw new Error('Electron safeStorage not available');

    return await api.safeStorageEncrypt(plaintext);
}

export async function DecryptWithSafeStorage(encrypted: string): Promise<string>
{
    const api = GetElectronAPI();
    if (null === api)
        throw new Error('Electron safeStorage not available');

    return await api.safeStorageDecrypt(encrypted);
}
