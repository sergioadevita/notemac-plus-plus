/**
 * CredentialStorageService — Unified credential storage with encryption routing and expiry.
 *
 * Auto-selects the best encryption method:
 *   1. Electron safeStorage (if running in Electron)
 *   2. crypto.subtle AES-GCM (if available in browser)
 *   3. Plain text (fallback — logs warning)
 *
 * Session-only credentials are stored in an in-memory Map and never touch localStorage.
 * Persistent credentials are encrypted and stored in localStorage with expiry metadata.
 */

import { IsElectronAvailable, IsSafeStorageAvailable, EncryptWithSafeStorage, DecryptWithSafeStorage } from './SafeStorageService';
import { IsEncryptionAvailable, EncryptValue, DecryptValue } from './SecureEncryptionService';

const CRED_PREFIX = 'SecureCred_';

type EncryptionMethod = 'safeStorage' | 'cryptoSubtle' | 'none';

interface CredentialEntry
{
    encrypted: string;
    method: EncryptionMethod;
    storedAt: number;
    expiresAt: number | null;
}

// In-memory store for session-only credentials
const sessionStore: Map<string, string> = new Map();

function GetPrefixedKey(key: string): string
{
    return `${CRED_PREFIX}${key}`;
}

async function SelectEncryptionMethod(): Promise<EncryptionMethod>
{
    if (IsElectronAvailable())
    {
        const safeAvailable = await IsSafeStorageAvailable();
        if (safeAvailable)
            return 'safeStorage';
    }

    if (IsEncryptionAvailable())
        return 'cryptoSubtle';

    console.warn('[CredentialStorage] No encryption available — credentials stored in plain text');
    return 'none';
}

async function EncryptByMethod(plaintext: string, method: EncryptionMethod): Promise<string>
{
    if ('safeStorage' === method)
        return await EncryptWithSafeStorage(plaintext);
    if ('cryptoSubtle' === method)
        return await EncryptValue(plaintext);
    return plaintext;
}

async function DecryptByMethod(encrypted: string, method: EncryptionMethod): Promise<string>
{
    if ('safeStorage' === method)
        return await DecryptWithSafeStorage(encrypted);
    if ('cryptoSubtle' === method)
        return await DecryptValue(encrypted);
    return encrypted;
}

function IsExpired(entry: CredentialEntry): boolean
{
    if (null === entry.expiresAt)
        return false;
    return Date.now() > entry.expiresAt;
}

/**
 * Store a credential value securely.
 * @param key — Storage key (without prefix)
 * @param plaintext — The credential value to store
 * @param expirySeconds — Time-to-live in seconds. Pass null/undefined for no expiry.
 *                         Pass 0 for session-only (in-memory, no localStorage).
 */
export async function StoreSecureValue(
    key: string,
    plaintext: string,
    expirySeconds?: number | null,
): Promise<void>
{
    // Session-only: store in memory, skip localStorage entirely
    if (0 === expirySeconds)
    {
        sessionStore.set(key, plaintext);
        return;
    }

    try
    {
        const method = await SelectEncryptionMethod();
        const encrypted = await EncryptByMethod(plaintext, method);

        const entry: CredentialEntry = {
            encrypted,
            method,
            storedAt: Date.now(),
            expiresAt: null !== expirySeconds && undefined !== expirySeconds
                ? Date.now() + (expirySeconds * 1000)
                : null,
        };

        localStorage.setItem(GetPrefixedKey(key), JSON.stringify(entry));
    }
    catch (err)
    {
        console.warn('[CredentialStorage] Failed to store credential:', err);
        // Fallback: store session-only
        sessionStore.set(key, plaintext);
    }
}

/**
 * Retrieve a credential value. Returns null if expired or not found.
 */
export async function RetrieveSecureValue(key: string): Promise<string | null>
{
    // Check session store first
    const sessionValue = sessionStore.get(key);
    if (undefined !== sessionValue)
        return sessionValue;

    // Check persistent store
    try
    {
        const raw = localStorage.getItem(GetPrefixedKey(key));
        if (null === raw)
            return null;

        const entry: CredentialEntry = JSON.parse(raw);

        // Check expiry
        if (IsExpired(entry))
        {
            localStorage.removeItem(GetPrefixedKey(key));
            return null;
        }

        return await DecryptByMethod(entry.encrypted, entry.method);
    }
    catch (err)
    {
        console.warn('[CredentialStorage] Failed to retrieve credential:', err);
        return null;
    }
}

/**
 * Remove a credential from both session and persistent storage.
 */
export function RemoveSecureValue(key: string): void
{
    sessionStore.delete(key);

    try
    {
        localStorage.removeItem(GetPrefixedKey(key));
    }
    catch
    {
        // Silently fail
    }
}

/**
 * Check if a credential exists and is still valid (not expired).
 */
export async function HasValidSecureValue(key: string): Promise<boolean>
{
    // Check session store
    if (sessionStore.has(key))
        return true;

    // Check persistent store
    try
    {
        const raw = localStorage.getItem(GetPrefixedKey(key));
        if (null === raw)
            return false;

        const entry: CredentialEntry = JSON.parse(raw);

        if (IsExpired(entry))
        {
            localStorage.removeItem(GetPrefixedKey(key));
            return false;
        }

        return true;
    }
    catch
    {
        return false;
    }
}

/**
 * Clear all secure credential entries from both session and persistent storage.
 */
export function ClearAllSecureValues(): void
{
    sessionStore.clear();

    try
    {
        const keysToRemove: string[] = [];
        for (let i = 0, maxCount = localStorage.length; i < maxCount; i++)
        {
            const storageKey = localStorage.key(i);
            if (null !== storageKey && storageKey.startsWith(CRED_PREFIX))
                keysToRemove.push(storageKey);
        }

        for (let i = 0, maxCount = keysToRemove.length; i < maxCount; i++)
            localStorage.removeItem(keysToRemove[i]);
    }
    catch
    {
        // Silently fail
    }
}

/**
 * Get metadata about a stored credential (encryption method, timestamps).
 * Returns null if not found or expired.
 */
export function GetCredentialMetadata(key: string): { method: EncryptionMethod; storedAt: number; expiresAt: number | null } | null
{
    if (sessionStore.has(key))
        return { method: 'none', storedAt: 0, expiresAt: null };

    try
    {
        const raw = localStorage.getItem(GetPrefixedKey(key));
        if (null === raw)
            return null;

        const entry: CredentialEntry = JSON.parse(raw);

        if (IsExpired(entry))
        {
            localStorage.removeItem(GetPrefixedKey(key));
            return null;
        }

        return {
            method: entry.method,
            storedAt: entry.storedAt,
            expiresAt: entry.expiresAt,
        };
    }
    catch
    {
        return null;
    }
}
