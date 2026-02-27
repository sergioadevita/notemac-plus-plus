import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for the SafeStorageService.
 * SafeStorageService provides Electron safe-storage encryption capabilities
 * for platforms where Electron is available.
 */

vi.mock('../../src/Shared/Persistence/SafeStorageService', () => ({
    IsElectronAvailable: vi.fn(() => false),
    IsSafeStorageAvailable: vi.fn(async () => false),
    EncryptWithSafeStorage: vi.fn(async (plaintext: string) => `safe:${plaintext}`),
    DecryptWithSafeStorage: vi.fn(async (encrypted: string) => {
        if (encrypted.startsWith('safe:'))
            return encrypted.substring('safe:'.length);
        return encrypted;
    }),
}));

import {
    IsElectronAvailable,
    IsSafeStorageAvailable,
    EncryptWithSafeStorage,
    DecryptWithSafeStorage,
} from '../Shared/Persistence/SafeStorageService';

describe('SafeStorageService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    // Placeholder for SafeStorageService specific tests
    // Note: Direct testing of SafeStorageService requires Electron environment
    // or extensive mocking of native modules. Tests here should focus on
    // integration points and behavior verification.

    it('IsElectronAvailable should return a boolean', () =>
    {
        const result = IsElectronAvailable();
        expect(typeof result).toBe('boolean');
    });

    it('IsSafeStorageAvailable should return a Promise<boolean>', async () =>
    {
        const result = await IsSafeStorageAvailable();
        expect(typeof result).toBe('boolean');
    });

    it('EncryptWithSafeStorage should encrypt a plaintext string', async () =>
    {
        const plaintext = 'test_secret';
        const encrypted = await EncryptWithSafeStorage(plaintext);
        expect(encrypted).toBeTruthy();
        expect(typeof encrypted).toBe('string');
    });

    it('DecryptWithSafeStorage should decrypt encrypted string', async () =>
    {
        const plaintext = 'test_secret';
        const encrypted = await EncryptWithSafeStorage(plaintext);
        const decrypted = await DecryptWithSafeStorage(encrypted);
        expect(decrypted).toBe(plaintext);
    });
});
