import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    SaveCredentials,
    SaveCredentialsWithToken,
    ClearCredentials,
} from '../Notemac/Controllers/AuthController';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { GitCredentials } from '../Notemac/Commons/Types';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// Mock persistence services
vi.mock('../Shared/Persistence/PersistenceService', () => ({
    GetValue: vi.fn(() => null),
    RemoveValue: vi.fn(),
}));

vi.mock('../Shared/Persistence/CredentialStorageService', () => ({
    StoreSecureValue: vi.fn(),
    RetrieveSecureValue: vi.fn(() => null),
    RemoveSecureValue: vi.fn(),
}));

// Mock isomorphic-git (used in TestAuthentication)
vi.mock('isomorphic-git', () => ({
    default: {
        getRemoteInfo: vi.fn(),
    },
}));

describe('AuthController — SaveCredentials', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            SetGitCredentials: vi.fn(),
            gitSettings: {
                corsProxy: null,
            },
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('stores credentials in store', async () =>
    {
        const creds: GitCredentials = {
            type: 'token',
            username: 'testuser',
            token: 'secret-token',
        };

        await SaveCredentials(creds);

        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(creds);
    });

    it('calls StoreSecureValue with DB key', async () =>
    {
        const { StoreSecureValue } = await import('../Shared/Persistence/CredentialStorageService');

        const creds: GitCredentials = {
            type: 'token',
            username: 'testuser',
        };

        await SaveCredentials(creds);

        expect(StoreSecureValue).toHaveBeenCalled();
        const call = (StoreSecureValue as any).mock.calls[0];
        expect(call[0]).toBe('GitCredentials');
    });
});

describe('AuthController — SaveCredentialsWithToken', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            SetGitCredentials: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('stores full credentials when rememberMe is true', async () =>
    {
        const creds: GitCredentials = {
            type: 'token',
            username: 'testuser',
            token: 'secret-token',
        };

        await SaveCredentialsWithToken(creds, true);

        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(creds);
    });

    it('stores credentials when rememberMe is false', async () =>
    {
        const creds: GitCredentials = {
            type: 'token',
            username: 'testuser',
            token: 'secret-token',
        };

        await SaveCredentialsWithToken(creds, false);

        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(creds);
    });

    it('defaults rememberMe to false', async () =>
    {
        const creds: GitCredentials = {
            type: 'oauth',
            username: 'oauth',
            token: 'oauth-token',
        };

        // Should not throw when rememberMe is not specified
        await SaveCredentialsWithToken(creds);

        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(creds);
    });
});

describe('AuthController — ClearCredentials', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            SetGitCredentials: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('clears credentials from store', () =>
    {
        ClearCredentials();

        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(null);
    });

    it('calls RemoveSecureValue with DB key', async () =>
    {
        const { RemoveSecureValue } = await import('../Shared/Persistence/CredentialStorageService');

        ClearCredentials();

        expect(RemoveSecureValue).toHaveBeenCalledWith('GitCredentials');
    });

    it('calls RemoveValue with DB key for legacy cleanup', async () =>
    {
        const { RemoveValue } = await import('../Shared/Persistence/PersistenceService');

        ClearCredentials();

        expect(RemoveValue).toHaveBeenCalledWith('GitCredentials');
    });
});

describe('AuthController — OAuth Functions', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('StartGitHubOAuth calls device code endpoint', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    device_code: 'test-device-code',
                    user_code: 'ABCD-1234',
                    verification_uri: 'https://github.com/login/device',
                    expires_in: 900,
                    interval: 5,
                }),
            } as Response),
        );

        const { StartGitHubOAuth } = await import('../Notemac/Controllers/AuthController');

        const result = await StartGitHubOAuth();

        expect(result).not.toBeNull();
        expect(result!.deviceCode).toBe('test-device-code');
        expect(result!.userCode).toBe('ABCD-1234');
        expect(result!.verificationUri).toBe('https://github.com/login/device');
        expect(result!.expiresIn).toBe(900);
        expect(result!.interval).toBe(5);

        expect(global.fetch).toHaveBeenCalledWith(
            'https://github.com/login/device/code',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Accept': 'application/json',
                }),
            }),
        );
    });

    it('StartGitHubOAuth returns null on HTTP error', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.resolve({ ok: false } as Response),
        );

        const { StartGitHubOAuth } = await import('../Notemac/Controllers/AuthController');

        const result = await StartGitHubOAuth();

        expect(null === result).toBe(true);
    });

    it('StartGitHubOAuth returns null on network error', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.reject(new Error('Network error')),
        );

        const { StartGitHubOAuth } = await import('../Notemac/Controllers/AuthController');

        const result = await StartGitHubOAuth();

        expect(null === result).toBe(true);
    });

    it('PollGitHubOAuthToken returns token on success', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'gho_test_token_12345',
                    token_type: 'bearer',
                    scope: 'repo',
                }),
            } as Response),
        );

        const mockStore = {
            SetGitCredentials: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);

        const { PollGitHubOAuthToken } = await import('../Notemac/Controllers/AuthController');

        const result = await PollGitHubOAuthToken('device-code-123');

        expect(result).toBe('gho_test_token_12345');
        expect(mockStore.SetGitCredentials).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'oauth',
                token: 'gho_test_token_12345',
            }),
        );
    });

    it('PollGitHubOAuthToken returns null when still pending', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    error: 'authorization_pending',
                }),
            } as Response),
        );

        const { PollGitHubOAuthToken } = await import('../Notemac/Controllers/AuthController');

        const result = await PollGitHubOAuthToken('device-code-123');

        expect(null === result).toBe(true);
    });

    it('PollGitHubOAuthToken handles network errors gracefully', async () =>
    {
        global.fetch = vi.fn(() =>
            Promise.reject(new Error('Network error')),
        );

        const { PollGitHubOAuthToken } = await import('../Notemac/Controllers/AuthController');

        const result = await PollGitHubOAuthToken('device-code-123');

        expect(null === result).toBe(true);
    });
});

describe('AuthController — Credential Constants', () =>
{
    it('exports DB_GIT_CREDENTIALS constant', async () =>
    {
        const { DB_GIT_CREDENTIALS } = await import('../Notemac/Commons/Constants');

        expect(DB_GIT_CREDENTIALS).toBe('GitCredentials');
    });

    it('exports GITHUB_OAUTH_CLIENT_ID constant', async () =>
    {
        const { GITHUB_OAUTH_CLIENT_ID } = await import('../Notemac/Commons/Constants');

        expect(0 < GITHUB_OAUTH_CLIENT_ID.length).toBe(true);
    });

    it('exports GITHUB_OAUTH_SCOPE constant', async () =>
    {
        const { GITHUB_OAUTH_SCOPE } = await import('../Notemac/Commons/Constants');

        expect(GITHUB_OAUTH_SCOPE).toBe('repo');
    });

    it('exports CRED_DEFAULT_GIT_EXPIRY_HOURS constant', async () =>
    {
        const { CRED_DEFAULT_GIT_EXPIRY_HOURS } = await import('../Notemac/Commons/Constants');

        expect(0 < CRED_DEFAULT_GIT_EXPIRY_HOURS).toBe(true);
    });
});
