/**
 * SecureEncryptionService — Browser-native AES-GCM encryption using crypto.subtle.
 * Encryption key is stored in IndexedDB (NOT localStorage) as a non-exportable CryptoKey.
 * No external libraries required.
 */

const DB_NAME = 'NotemacKeyStore';
const DB_STORE_NAME = 'keys';
const KEY_ID = 'NotemacCryptoKey_v1';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

let cachedKey: CryptoKey | null = null;

export function IsEncryptionAvailable(): boolean
{
    return 'undefined' !== typeof crypto && null !== crypto.subtle && 'undefined' !== typeof crypto.subtle;
}

function OpenKeyDatabase(): Promise<IDBDatabase>
{
    return new Promise((resolve, reject) =>
    {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () =>
        {
            const db = request.result;
            if (!db.objectStoreNames.contains(DB_STORE_NAME))
                db.createObjectStore(DB_STORE_NAME, { keyPath: 'id' });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function LoadKeyFromDB(): Promise<CryptoKey | null>
{
    try
    {
        const db = await OpenKeyDatabase();
        return new Promise((resolve) =>
        {
            const tx = db.transaction(DB_STORE_NAME, 'readonly');
            const store = tx.objectStore(DB_STORE_NAME);
            const request = store.get(KEY_ID);

            request.onsuccess = () =>
            {
                const result = request.result;
                resolve(null !== result && undefined !== result ? result.key : null);
            };
            request.onerror = () => resolve(null);
        });
    }
    catch
    {
        return null;
    }
}

async function SaveKeyToDB(key: CryptoKey): Promise<void>
{
    try
    {
        const db = await OpenKeyDatabase();
        return new Promise((resolve, reject) =>
        {
            const tx = db.transaction(DB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(DB_STORE_NAME);
            store.put({ id: KEY_ID, key });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    catch
    {
        // Silently fail — encryption will use fallback
    }
}

async function GetEncryptionKey(): Promise<CryptoKey>
{
    if (null !== cachedKey)
        return cachedKey;

    const existingKey = await LoadKeyFromDB();
    if (null !== existingKey)
    {
        cachedKey = existingKey;
        return cachedKey;
    }

    const newKey = await crypto.subtle.generateKey(
        { name: ALGORITHM, length: KEY_LENGTH },
        false, // non-exportable
        ['encrypt', 'decrypt']
    );

    await SaveKeyToDB(newKey);
    cachedKey = newKey;
    return cachedKey;
}

export async function InitializeEncryptionKey(): Promise<void>
{
    if (!IsEncryptionAvailable())
    {
        console.warn('[SecureEncryption] crypto.subtle not available — credentials will not be encrypted');
        return;
    }

    try
    {
        await GetEncryptionKey();
    }
    catch (err)
    {
        console.warn('[SecureEncryption] Failed to initialize encryption key:', err);
    }
}

export async function EncryptValue(plaintext: string): Promise<string>
{
    if (!IsEncryptionAvailable())
        return plaintext;

    try
    {
        const key = await GetEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        // Combine IV + ciphertext into a single buffer
        const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), IV_LENGTH);

        // Return as base64
        // Build base64 in chunks to avoid call-stack overflow on large data
        let binary = '';
        const len = combined.byteLength;
        for (let i = 0; i < len; i++)
            binary += String.fromCharCode(combined[i]);
        return btoa(binary);
    }
    catch (err)
    {
        console.warn('[SecureEncryption] Encrypt failed, storing as plaintext:', err);
        return plaintext;
    }
}

export async function DecryptValue(encrypted: string): Promise<string>
{
    if (!IsEncryptionAvailable())
        return encrypted;

    try
    {
        const key = await GetEncryptionKey();

        // Decode base64
        const raw = atob(encrypted);
        const combined = new Uint8Array(raw.length);
        for (let i = 0, maxCount = raw.length; i < maxCount; i++)
            combined[i] = raw.charCodeAt(i);

        // Extract IV and ciphertext
        const iv = combined.slice(0, IV_LENGTH);
        const ciphertext = combined.slice(IV_LENGTH);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }
    catch (err)
    {
        // If decryption fails, the value might be unencrypted (legacy migration)
        console.warn('[SecureEncryption] Decrypt failed — returning raw value:', err);
        return encrypted;
    }
}

export async function ClearEncryptionKey(): Promise<void>
{
    cachedKey = null;

    try
    {
        const db = await OpenKeyDatabase();
        return new Promise((resolve) =>
        {
            const tx = db.transaction(DB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(DB_STORE_NAME);
            store.delete(KEY_ID);

            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }
    catch
    {
        // Silently fail
    }
}
