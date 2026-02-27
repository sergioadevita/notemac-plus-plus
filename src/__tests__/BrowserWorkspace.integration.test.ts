import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultGitSettings, GetDefaultGitAuthor } from '../Notemac/Configs/GitConfig';
import {
    CreateBrowserWorkspace,
    GetBrowserWorkspaces,
    IsBrowserWorkspaceActive,
} from '../Notemac/Controllers/BrowserWorkspaceController';

function resetGitState(): void
{
    useNotemacStore.setState({
        isRepoInitialized: false,
        currentBranch: 'main',
        branches: [],
        remotes: [],
        gitStatus: null,
        commitLog: [],
        gitCredentials: null,
        gitAuthor: GetDefaultGitAuthor(),
        gitSettings: GetDefaultGitSettings(),
        isBrowserWorkspace: false,
        browserWorkspaces: [],
        isGitOperationInProgress: false,
        currentGitOperation: null,
        gitOperationProgress: 0,
        gitOperationError: null,
    });
}

// ─── BrowserWorkspaceController ─────────────────────────────────

describe('BrowserWorkspaceController — CreateBrowserWorkspace', () =>
{
    beforeEach(() => resetGitState());

    it('creates a workspace with generated id', () =>
    {
        const ws = CreateBrowserWorkspace('My Project');
        expect(ws.id).toBeTruthy();
        expect(ws.name).toBe('My Project');
        expect(0 < ws.createdAt).toBe(true);
        expect(0 < ws.lastOpenedAt).toBe(true);
    });

    it('creates a workspace with optional repoUrl', () =>
    {
        const ws = CreateBrowserWorkspace('Repo Project', 'https://github.com/test/repo.git');
        expect(ws.repoUrl).toBe('https://github.com/test/repo.git');
    });

    it('workspace without repoUrl has undefined repoUrl', () =>
    {
        const ws = CreateBrowserWorkspace('No Repo');
        expect(undefined === ws.repoUrl).toBe(true);
    });

    it('adds workspace to store', () =>
    {
        CreateBrowserWorkspace('WS1');
        CreateBrowserWorkspace('WS2');
        const workspaces = GetBrowserWorkspaces();
        expect(2 === workspaces.length).toBe(true);
    });

    it('each workspace has unique id', () =>
    {
        const ws1 = CreateBrowserWorkspace('A');
        const ws2 = CreateBrowserWorkspace('B');
        expect(ws1.id).not.toBe(ws2.id);
    });
});

describe('BrowserWorkspaceController — GetBrowserWorkspaces', () =>
{
    beforeEach(() => resetGitState());

    it('returns empty array when no workspaces', () =>
    {
        const workspaces = GetBrowserWorkspaces();
        expect(0 === workspaces.length).toBe(true);
    });

    it('returns all created workspaces', () =>
    {
        CreateBrowserWorkspace('First');
        CreateBrowserWorkspace('Second');
        CreateBrowserWorkspace('Third');
        expect(3 === GetBrowserWorkspaces().length).toBe(true);
    });
});

describe('BrowserWorkspaceController — IsBrowserWorkspaceActive', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to false', () =>
    {
        expect(false === IsBrowserWorkspaceActive()).toBe(true);
    });

    it('reflects store state', () =>
    {
        useNotemacStore.getState().SetIsBrowserWorkspace(true);
        expect(true === IsBrowserWorkspaceActive()).toBe(true);
    });
});
