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

    it('StartGitHubOAuth returns null with default client ID', async () =>
    {
        const { StartGitHubOAuth } = await import('../Notemac/Controllers/AuthController');

        const result = await StartGitHubOAuth();

        expect(null === result).toBe(true);
    });

    it('PollGitHubOAuthToken returns null with default client ID', async () =>
    {
        const { PollGitHubOAuthToken } = await import('../Notemac/Controllers/AuthController');

        const result = await PollGitHubOAuthToken('fake-device-code');

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
