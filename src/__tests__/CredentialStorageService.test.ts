import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests for the CredentialStorageService orchestration logic.
 * Since crypto.subtle and IndexedDB are not available in jsdom/vitest,
 * we test the CredentialStorageService with mocked encryption backends.
 */

// Mock the encryption services before importing
vi.mock('../../src/Shared/Persistence/SecureEncryptionService', () => ({
    IsEncryptionAvailable: vi.fn(() => true),
    EncryptValue: vi.fn(async (plaintext: string) => `encrypted:${plaintext}`),
    DecryptValue: vi.fn(async (encrypted: string) =>
    {
        if (encrypted.startsWith('encrypted:'))
            return encrypted.substring('encrypted:'.length);
        return encrypted;
    }),
    InitializeEncryptionKey: vi.fn(async () => {}),
}));

vi.mock('../../src/Shared/Persistence/SafeStorageService', () => ({
    IsElectronAvailable: vi.fn(() => false),
    IsSafeStorageAvailable: vi.fn(async () => false),
    EncryptWithSafeStorage: vi.fn(async (plaintext: string) => `safe:${plaintext}`),
    DecryptWithSafeStorage: vi.fn(async (encrypted: string) => encrypted.substring('safe:'.length)),
}));

import {
    StoreSecureValue,
    RetrieveSecureValue,
    RemoveSecureValue,
    HasValidSecureValue,
    ClearAllSecureValues,
    GetCredentialMetadata,
} from '../Shared/Persistence/CredentialStorageService';

import { IsElectronAvailable, IsSafeStorageAvailable } from '../Shared/Persistence/SafeStorageService';
import { IsEncryptionAvailable } from '../Shared/Persistence/SecureEncryptionService';
import {
    CRED_STORAGE_PREFIX, CRED_DEFAULT_AI_EXPIRY_HOURS, CRED_DEFAULT_GIT_EXPIRY_HOURS,
    CRED_ENCRYPTION_KEY_ID, GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_SCOPE,
} from '../Notemac/Commons/Constants';

describe('CredentialStorageService', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
        ClearAllSecureValues();
        vi.clearAllMocks();
        // Reset defaults
        (IsElectronAvailable as any).mockReturnValue(false);
        (IsSafeStorageAvailable as any).mockResolvedValue(false);
        (IsEncryptionAvailable as any).mockReturnValue(true);
    });

    afterEach(() =>
    {
        localStorage.clear();
    });

    // ─── Store & Retrieve ─────────────────────────────────────────

    it('stores and retrieves a credential via crypto.subtle', async () =>
    {
        await StoreSecureValue('test_key', 'my_secret_api_key');
        const result = await RetrieveSecureValue('test_key');
        expect(result).toBe('my_secret_api_key');
    });

    it('stores and retrieves multiple independent credentials', async () =>
    {
        await StoreSecureValue('key_a', 'secret_a');
        await StoreSecureValue('key_b', 'secret_b');

        const a = await RetrieveSecureValue('key_a');
        const b = await RetrieveSecureValue('key_b');

        expect(a).toBe('secret_a');
        expect(b).toBe('secret_b');
    });

    it('returns null for non-existent credential', async () =>
    {
        const result = await RetrieveSecureValue('does_not_exist');
        expect(null).toBe(result);
    });

    it('handles JSON credential values', async () =>
    {
        const creds = { providerId: 'openai', apiKey: 'sk-abc123', rememberKey: true };
        await StoreSecureValue('ai_creds', JSON.stringify(creds));

        const raw = await RetrieveSecureValue('ai_creds');
        expect(null !== raw).toBe(true);
        const parsed = JSON.parse(raw!);
        expect(parsed.providerId).toBe('openai');
        expect(parsed.apiKey).toBe('sk-abc123');
    });

    // ─── Expiry ───────────────────────────────────────────────────

    it('returns null for expired credentials', async () =>
    {
        // Store with very short TTL — we'll manually expire it
        await StoreSecureValue('expiring_key', 'secret', 1);

        // Manually set the expiresAt to the past
        const prefixedKey = 'SecureCred_expiring_key';
        const stored = JSON.parse(localStorage.getItem(prefixedKey)!);
        stored.expiresAt = Date.now() - 1000;
        localStorage.setItem(prefixedKey, JSON.stringify(stored));

        const result = await RetrieveSecureValue('expiring_key');
        expect(null).toBe(result);
    });

    it('removes expired credential from localStorage on access', async () =>
    {
        await StoreSecureValue('cleanup_key', 'secret', 1);

        // Expire it
        const prefixedKey = 'SecureCred_cleanup_key';
        const stored = JSON.parse(localStorage.getItem(prefixedKey)!);
        stored.expiresAt = Date.now() - 1000;
        localStorage.setItem(prefixedKey, JSON.stringify(stored));

        await RetrieveSecureValue('cleanup_key');
        expect(null).toBe(localStorage.getItem(prefixedKey));
    });

    it('stores with no expiry when expirySeconds is undefined', async () =>
    {
        await StoreSecureValue('no_expiry', 'secret');

        const prefixedKey = 'SecureCred_no_expiry';
        const stored = JSON.parse(localStorage.getItem(prefixedKey)!);
        expect(null).toBe(stored.expiresAt);
    });

    it('non-expired credential is still retrievable', async () =>
    {
        await StoreSecureValue('valid_key', 'secret', 3600);
        const result = await RetrieveSecureValue('valid_key');
        expect(result).toBe('secret');
    });

    // ─── Session-Only (in-memory) ────────────────────────────────

    it('stores session-only credential in memory, not localStorage', async () =>
    {
        await StoreSecureValue('session_key', 'session_secret', 0);

        // Should NOT be in localStorage
        const prefixedKey = 'SecureCred_session_key';
        expect(null).toBe(localStorage.getItem(prefixedKey));

        // But should be retrievable from memory
        const result = await RetrieveSecureValue('session_key');
        expect(result).toBe('session_secret');
    });

    it('session-only credential is cleared by ClearAllSecureValues', async () =>
    {
        await StoreSecureValue('session_key', 'session_secret', 0);
        ClearAllSecureValues();
        const result = await RetrieveSecureValue('session_key');
        expect(null).toBe(result);
    });

    // ─── Remove ──────────────────────────────────────────────────

    it('removes credential from persistent storage', async () =>
    {
        await StoreSecureValue('remove_me', 'secret');
        RemoveSecureValue('remove_me');
        const result = await RetrieveSecureValue('remove_me');
        expect(null).toBe(result);
    });

    it('removes credential from session storage', async () =>
    {
        await StoreSecureValue('remove_session', 'secret', 0);
        RemoveSecureValue('remove_session');
        const result = await RetrieveSecureValue('remove_session');
        expect(null).toBe(result);
    });

    // ─── HasValidSecureValue ─────────────────────────────────────

    it('HasValidSecureValue returns true for valid credential', async () =>
    {
        await StoreSecureValue('valid', 'secret', 3600);
        const valid = await HasValidSecureValue('valid');
        expect(true).toBe(valid);
    });

    it('HasValidSecureValue returns false for expired credential', async () =>
    {
        await StoreSecureValue('expired', 'secret', 1);

        const prefixedKey = 'SecureCred_expired';
        const stored = JSON.parse(localStorage.getItem(prefixedKey)!);
        stored.expiresAt = Date.now() - 1000;
        localStorage.setItem(prefixedKey, JSON.stringify(stored));

        const valid = await HasValidSecureValue('expired');
        expect(false).toBe(valid);
    });

    it('HasValidSecureValue returns false for non-existent key', async () =>
    {
        const valid = await HasValidSecureValue('nope');
        expect(false).toBe(valid);
    });

    it('HasValidSecureValue returns true for session-only credential', async () =>
    {
        await StoreSecureValue('session', 'secret', 0);
        const valid = await HasValidSecureValue('session');
        expect(true).toBe(valid);
    });

    // ─── ClearAllSecureValues ────────────────────────────────────

    it('ClearAllSecureValues removes all prefixed keys from localStorage', async () =>
    {
        await StoreSecureValue('key1', 'a');
        await StoreSecureValue('key2', 'b');
        localStorage.setItem('UnrelatedKey', 'keep_me');

        ClearAllSecureValues();

        expect(null).toBe(localStorage.getItem('SecureCred_key1'));
        expect(null).toBe(localStorage.getItem('SecureCred_key2'));
        expect('keep_me').toBe(localStorage.getItem('UnrelatedKey'));
    });

    // ─── GetCredentialMetadata ───────────────────────────────────

    it('GetCredentialMetadata returns metadata for stored credential', async () =>
    {
        await StoreSecureValue('meta_key', 'secret', 3600);

        const metadata = GetCredentialMetadata('meta_key');
        expect(null !== metadata).toBe(true);
        expect(metadata!.method).toBe('cryptoSubtle');
        expect(0 < metadata!.storedAt).toBe(true);
        expect(null !== metadata!.expiresAt).toBe(true);
    });

    it('GetCredentialMetadata returns null for non-existent key', () =>
    {
        const metadata = GetCredentialMetadata('no_key');
        expect(null).toBe(metadata);
    });

    it('GetCredentialMetadata returns null for expired key', async () =>
    {
        await StoreSecureValue('meta_expired', 'secret', 1);

        const prefixedKey = 'SecureCred_meta_expired';
        const stored = JSON.parse(localStorage.getItem(prefixedKey)!);
        stored.expiresAt = Date.now() - 1000;
        localStorage.setItem(prefixedKey, JSON.stringify(stored));

        const metadata = GetCredentialMetadata('meta_expired');
        expect(null).toBe(metadata);
    });

    // ─── Encryption Method Selection ─────────────────────────────

    it('uses cryptoSubtle when Electron is not available', async () =>
    {
        await StoreSecureValue('crypto_key', 'secret');

        const metadata = GetCredentialMetadata('crypto_key');
        expect(metadata!.method).toBe('cryptoSubtle');
    });

    it('uses safeStorage when Electron is available', async () =>
    {
        (IsElectronAvailable as any).mockReturnValue(true);
        (IsSafeStorageAvailable as any).mockResolvedValue(true);

        await StoreSecureValue('safe_key', 'secret');

        const metadata = GetCredentialMetadata('safe_key');
        expect(metadata!.method).toBe('safeStorage');
    });

    it('falls back to none when no encryption available', async () =>
    {
        (IsEncryptionAvailable as any).mockReturnValue(false);

        await StoreSecureValue('plain_key', 'secret');

        const metadata = GetCredentialMetadata('plain_key');
        expect(metadata!.method).toBe('none');

        // Should still be retrievable
        const result = await RetrieveSecureValue('plain_key');
        expect(result).toBe('secret');
    });

    // ─── Constants Verification ──────────────────────────────────

    it('credential security constants are defined', () =>
    {
        expect(CRED_STORAGE_PREFIX).toBe('SecureCred_');
        expect(CRED_DEFAULT_AI_EXPIRY_HOURS).toBe(24);
        expect(CRED_DEFAULT_GIT_EXPIRY_HOURS).toBe(8);
        expect(0 < CRED_ENCRYPTION_KEY_ID.length).toBe(true);
    });

    it('GitHub OAuth constants are defined', () =>
    {
        expect(0 < GITHUB_OAUTH_CLIENT_ID.length).toBe(true);
        expect(GITHUB_OAUTH_SCOPE).toBe('repo');
    });
});
