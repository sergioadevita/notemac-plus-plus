import { describe, it, expect } from 'vitest';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_SCOPE } from '../Notemac/Commons/Constants';

/**
 * OAuth Integration Tests — hits the real GitHub Device Flow API.
 *
 * These tests verify that:
 *   1. The configured client ID is valid and accepted by GitHub
 *   2. The device code endpoint returns all required fields
 *   3. The token polling endpoint accepts our client ID and device code
 *
 * No human interaction is needed — we only initiate the flow and verify
 * the first step (device code request) succeeds. The actual user approval
 * step is not automated.
 */

describe('GitHub OAuth Integration — Real API', () =>
{
    it('GITHUB_OAUTH_CLIENT_ID is configured (not placeholder)', () =>
    {
        expect(GITHUB_OAUTH_CLIENT_ID).not.toBe('Iv1.CONFIGURE_YOUR_APP');
        expect(GITHUB_OAUTH_CLIENT_ID.length).toBeGreaterThan(5);
    });

    it('device code endpoint returns valid response', async () =>
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

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);

        const data = await response.json();

        // GitHub returns these fields for device flow
        expect(data.device_code).toBeTruthy();
        expect(typeof data.device_code).toBe('string');

        expect(data.user_code).toBeTruthy();
        expect(typeof data.user_code).toBe('string');
        // User code format: XXXX-XXXX
        expect(data.user_code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

        expect(data.verification_uri).toBe('https://github.com/login/device');

        expect(data.expires_in).toBeGreaterThan(0);
        expect(data.interval).toBeGreaterThan(0);
    });

    it('token polling endpoint returns authorization_pending for new device code', async () =>
    {
        // First, get a fresh device code
        const codeResponse = await fetch('https://github.com/login/device/code', {
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

        const codeData = await codeResponse.json();
        expect(codeData.device_code).toBeTruthy();

        // Now poll — since no user approved it, should get 'authorization_pending'
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_OAUTH_CLIENT_ID,
                device_code: codeData.device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
        });

        expect(tokenResponse.ok).toBe(true);

        const tokenData = await tokenResponse.json();

        // Not yet authorized — should be pending
        expect(tokenData.error).toBe('authorization_pending');
        expect(tokenData.access_token).toBeUndefined();
    });

    it('device code endpoint rejects invalid client ID', async () =>
    {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: 'INVALID_CLIENT_ID_12345',
                scope: 'repo',
            }),
        });

        // GitHub returns an error for invalid client IDs
        const data = await response.json();
        // Either HTTP error or JSON error field
        expect(response.ok === false || data.error !== undefined).toBe(true);
    });

    it('token polling endpoint rejects invalid device code', async () =>
    {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_OAUTH_CLIENT_ID,
                device_code: 'completely-invalid-device-code',
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
        });

        const data = await response.json();

        // Should not return an access token
        expect(data.access_token).toBeUndefined();
        // Should have an error
        expect(data.error).toBeTruthy();
    });

    it('scope is set to repo', () =>
    {
        expect(GITHUB_OAUTH_SCOPE).toBe('repo');
    });
});
