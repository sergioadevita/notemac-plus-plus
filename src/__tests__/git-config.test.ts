import { describe, it, expect } from 'vitest';
import { GetDefaultGitSettings, GetDefaultGitAuthor, GetDefaultCredentials } from '../Notemac/Configs/GitConfig';
import {
    DB_GIT_CREDENTIALS,
    DB_GIT_AUTHOR,
    DB_GIT_SETTINGS,
    DB_BROWSER_WORKSPACES,
    GIT_DEFAULT_CORS_PROXY,
    GIT_DEFAULT_AUTHOR_NAME,
    GIT_DEFAULT_AUTHOR_EMAIL,
    GIT_COMMIT_FETCH_LIMIT,
} from '../Notemac/Commons/Constants';

// ─── GitConfig — GetDefaultGitSettings ──────────────────────────

describe('GitConfig — GetDefaultGitSettings', () =>
{
    it('returns a complete settings object', () =>
    {
        const settings = GetDefaultGitSettings();
        expect(settings).toBeDefined();
        expect(true === settings.autoFetch).toBe(true);
        expect(300000 === settings.autoFetchInterval).toBe(true);
        expect(true === settings.showUntracked).toBe(true);
        expect(false === settings.showIgnored).toBe(true);
        expect(settings.corsProxy).toBe(GIT_DEFAULT_CORS_PROXY);
    });

    it('returns a fresh copy each time', () =>
    {
        const s1 = GetDefaultGitSettings();
        const s2 = GetDefaultGitSettings();
        expect(s1).not.toBe(s2);
        expect(s1).toEqual(s2);
    });
});

// ─── GitConfig — GetDefaultGitAuthor ────────────────────────────

describe('GitConfig — GetDefaultGitAuthor', () =>
{
    it('returns default author', () =>
    {
        const author = GetDefaultGitAuthor();
        expect(author.name).toBe(GIT_DEFAULT_AUTHOR_NAME);
        expect(author.email).toBe(GIT_DEFAULT_AUTHOR_EMAIL);
    });

    it('returns a fresh copy each time', () =>
    {
        const a1 = GetDefaultGitAuthor();
        const a2 = GetDefaultGitAuthor();
        expect(a1).not.toBe(a2);
        expect(a1).toEqual(a2);
    });
});

// ─── GitConfig — GetDefaultCredentials ──────────────────────────

describe('GitConfig — GetDefaultCredentials', () =>
{
    it('returns empty token credentials', () =>
    {
        const creds = GetDefaultCredentials();
        expect(creds.type).toBe('token');
        expect(creds.username).toBe('');
        expect(creds.token).toBe('');
    });

    it('returns a fresh copy each time', () =>
    {
        const c1 = GetDefaultCredentials();
        const c2 = GetDefaultCredentials();
        expect(c1).not.toBe(c2);
        expect(c1).toEqual(c2);
    });
});

// ─── Git Constants ──────────────────────────────────────────────

describe('Git Constants', () =>
{
    it('has correct persistence key constants', () =>
    {
        expect(DB_GIT_CREDENTIALS).toBe('GitCredentials');
        expect(DB_GIT_AUTHOR).toBe('GitAuthor');
        expect(DB_GIT_SETTINGS).toBe('GitSettings');
        expect(DB_BROWSER_WORKSPACES).toBe('BrowserWorkspaces');
    });

    it('has correct default values', () =>
    {
        expect(GIT_DEFAULT_CORS_PROXY).toBe('https://cors.isomorphic-git.org');
        expect(GIT_DEFAULT_AUTHOR_NAME).toBe('Notemac++ User');
        expect(GIT_DEFAULT_AUTHOR_EMAIL).toBe('user@notemac.app');
    });

    it('has reasonable commit fetch limit', () =>
    {
        expect(0 < GIT_COMMIT_FETCH_LIMIT).toBe(true);
        expect(500 >= GIT_COMMIT_FETCH_LIMIT).toBe(true);
    });
});
