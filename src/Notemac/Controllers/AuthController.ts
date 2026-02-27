import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { useNotemacStore } from "../Model/Store";
import type { GitCredentials } from "../Commons/Types";
import { GetValue, RemoveValue } from '../../Shared/Persistence/PersistenceService';
import { StoreSecureValue, RetrieveSecureValue, RemoveSecureValue } from '../../Shared/Persistence/CredentialStorageService';
import { DB_GIT_CREDENTIALS, GIT_DEFAULT_CORS_PROXY, CRED_DEFAULT_GIT_EXPIRY_HOURS, GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_SCOPE } from '../Commons/Constants';

// ─── Credential Management ───────────────────────────────────────

/**
 * Save credentials to store — metadata only (type, username).
 * Token is stored in Zustand memory only (session-only, not persisted).
 */
export async function SaveCredentials(credentials: GitCredentials): Promise<void>
{
    const store = useNotemacStore.getState();
    store.SetGitCredentials(credentials);

    // Persist metadata only — token stays in memory for security
    await StoreSecureValue(DB_GIT_CREDENTIALS, JSON.stringify({
        type: credentials.type,
        username: credentials.username,
    }), CRED_DEFAULT_GIT_EXPIRY_HOURS * 3600);
}

/**
 * Save credentials including the token (encrypted).
 * @param credentials — Git credentials including token
 * @param rememberMe — If true, persist encrypted to localStorage with expiry.
 *                       If false, store session-only (in-memory, no localStorage).
 */
export async function SaveCredentialsWithToken(
    credentials: GitCredentials,
    rememberMe: boolean = false,
): Promise<void>
{
    const store = useNotemacStore.getState();
    store.SetGitCredentials(credentials);

    if (rememberMe)
    {
        // Persist encrypted with expiry
        await StoreSecureValue(
            DB_GIT_CREDENTIALS,
            JSON.stringify(credentials),
            CRED_DEFAULT_GIT_EXPIRY_HOURS * 3600
        );
    }
    else
    {
        // Session-only: expirySeconds=0 stores in memory map only
        await StoreSecureValue(DB_GIT_CREDENTIALS, JSON.stringify(credentials), 0);
    }
}

/**
 * Load credentials from secure storage.
 * Handles migration from old unencrypted localStorage format.
 */
export async function LoadCredentials(): Promise<GitCredentials | null>
{
    // Try secure storage first
    const credStr = await RetrieveSecureValue(DB_GIT_CREDENTIALS);
    if (null !== credStr)
    {
        try
        {
            const cred = JSON.parse(credStr) as GitCredentials;
            useNotemacStore.getState().SetGitCredentials(cred);
            return cred;
        }
        catch
        {
            // Corrupted — fall through to legacy
        }
    }

    // Migration: check for old unencrypted credentials
    const legacy = GetValue<GitCredentials>(DB_GIT_CREDENTIALS);
    if (null !== legacy && undefined !== legacy)
    {
        useNotemacStore.getState().SetGitCredentials(legacy);

        // Re-encrypt and remove old plaintext
        if (legacy.token)
            await StoreSecureValue(DB_GIT_CREDENTIALS, JSON.stringify(legacy), CRED_DEFAULT_GIT_EXPIRY_HOURS * 3600);
        else
            await StoreSecureValue(DB_GIT_CREDENTIALS, JSON.stringify(legacy), CRED_DEFAULT_GIT_EXPIRY_HOURS * 3600);

        RemoveValue(DB_GIT_CREDENTIALS);
        return legacy;
    }

    return null;
}

/**
 * Clear all stored credentials.
 */
export function ClearCredentials(): void
{
    useNotemacStore.getState().SetGitCredentials(null);
    RemoveSecureValue(DB_GIT_CREDENTIALS);
    RemoveValue(DB_GIT_CREDENTIALS); // Also clean up any legacy plaintext
}

/**
 * Test if credentials are valid by trying to list remote refs.
 */
export async function TestAuthentication(repoUrl: string, credentials: GitCredentials): Promise<{ success: boolean; error?: string }>
{
    try
    {
        const corsProxy = useNotemacStore.getState().gitSettings.corsProxy || GIT_DEFAULT_CORS_PROXY;

        await git.getRemoteInfo({
            http,
            url: repoUrl,
            corsProxy,
            onAuth: () => ({
                username: credentials.username || credentials.token || '',
                password: credentials.token || '',
            }),
        });

        return { success: true };
    }
    catch (error: unknown)
    {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// ─── OAuth Flow (GitHub Device Flow) ─────────────────────────────

export interface OAuthState
{
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
}

/**
 * Start GitHub Device Flow OAuth.
 * Returns the user code and verification URL for the user to complete in their browser.
 *
 * Requires GITHUB_OAUTH_CLIENT_ID to be configured (not the placeholder value).
 * Set the env var VITE_GITHUB_OAUTH_CLIENT_ID or update Constants.ts.
 */
export async function StartGitHubOAuth(): Promise<OAuthState | null>
{
    if (!GITHUB_OAUTH_CLIENT_ID || (GITHUB_OAUTH_CLIENT_ID as string) === 'Iv1.CONFIGURE_YOUR_APP')
    {
        console.warn('[OAuth] GitHub OAuth client ID not configured. Set VITE_GITHUB_OAUTH_CLIENT_ID or update Constants.ts.');
        return null;
    }

    try
    {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_OAUTH_CLIENT_ID,
                scope: GITHUB_OAUTH_SCOPE,
            }),
        });

        if (!response.ok)
            return null;

        const data = await response.json();
        return {
            deviceCode: data.device_code,
            userCode: data.user_code,
            verificationUri: data.verification_uri,
            expiresIn: data.expires_in,
            interval: data.interval,
        };
    }
    catch
    {
        return null;
    }
}

/**
 * Poll for OAuth token after user has authorized.
 * On success, saves credential as session-only (not persisted by default).
 */
export async function PollGitHubOAuthToken(deviceCode: string): Promise<string | null>
{
    if (!GITHUB_OAUTH_CLIENT_ID || (GITHUB_OAUTH_CLIENT_ID as string) === 'Iv1.CONFIGURE_YOUR_APP')
        return null;

    try
    {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_OAUTH_CLIENT_ID,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
        });

        if (!response.ok)
            return null;

        const data = await response.json();
        if (data.access_token)
        {
            // Save as session-only credential (not persisted by default)
            const creds: GitCredentials = {
                type: 'oauth',
                username: 'oauth',
                token: data.access_token,
            };
            await SaveCredentialsWithToken(creds, false);
            return data.access_token;
        }

        return null;
    }
    catch
    {
        return null;
    }
}
