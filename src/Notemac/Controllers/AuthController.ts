import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { useNotemacStore } from "../Model/Store";
import type { GitCredentials } from "../Commons/Types";
import { GetValue, SetValue, RemoveValue } from '../../Shared/Persistence/PersistenceService';
import { DB_GIT_CREDENTIALS, GIT_DEFAULT_CORS_PROXY } from '../Commons/Constants';

// ─── Credential Management ───────────────────────────────────────

/**
 * Save credentials to store and persistence.
 * NOTE: In web mode, tokens are stored in localStorage — not ideal for production.
 * In Electron, we could use safeStorage or keychain.
 */
export function SaveCredentials(credentials: GitCredentials): void
{
    const store = useNotemacStore.getState();
    store.SetGitCredentials(credentials);

    // Persist — we only store type and username, not the actual token
    // Token is stored in memory only for security (user re-enters on session start)
    SetValue(DB_GIT_CREDENTIALS, {
        type: credentials.type,
        username: credentials.username,
    });
}

/**
 * Save credentials including the token (less secure, for convenience).
 * User can opt-in to this in settings.
 */
export function SaveCredentialsWithToken(credentials: GitCredentials): void
{
    const store = useNotemacStore.getState();
    store.SetGitCredentials(credentials);
    SetValue(DB_GIT_CREDENTIALS, credentials);
}

/**
 * Load credentials from persistence.
 */
export function LoadCredentials(): GitCredentials | null
{
    const saved = GetValue<GitCredentials>(DB_GIT_CREDENTIALS);
    if (null !== saved && undefined !== saved)
    {
        useNotemacStore.getState().SetGitCredentials(saved);
        return saved;
    }
    return null;
}

/**
 * Clear all stored credentials.
 */
export function ClearCredentials(): void
{
    useNotemacStore.getState().SetGitCredentials(null);
    RemoveValue(DB_GIT_CREDENTIALS);
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
    catch (error: any)
    {
        return { success: false, error: error.message };
    }
}

// ─── OAuth Flow (GitHub Device Flow) ─────────────────────────────

const GITHUB_CLIENT_ID = 'Iv1.notemac_placeholder'; // Users should register their own OAuth app

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
 * Note: This requires a registered GitHub OAuth App client ID.
 * For now, this is a placeholder — users should use PAT tokens instead.
 */
export async function StartGitHubOAuth(): Promise<OAuthState | null>
{
    try
    {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                scope: 'repo',
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
 */
export async function PollGitHubOAuthToken(deviceCode: string): Promise<string | null>
{
    try
    {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
        });

        if (!response.ok)
            return null;

        const data = await response.json();
        if (data.access_token)
        {
            // Save as credential
            const creds: GitCredentials = {
                type: 'oauth',
                username: 'oauth',
                token: data.access_token,
            };
            SaveCredentials(creds);
            return data.access_token;
        }

        return null;
    }
    catch
    {
        return null;
    }
}
