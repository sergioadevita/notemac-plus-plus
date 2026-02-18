import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultGitSettings, GetDefaultGitAuthor } from '../Notemac/Configs/GitConfig';
import type { GitStatus, GitBranch, GitCommit, GitRemote, GitCredentials, BrowserWorkspace } from '../Notemac/Commons/Types';

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

// ─── Repo State ─────────────────────────────────────────────────

describe('GitModel — repo state', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to not initialized', () =>
    {
        const state = useNotemacStore.getState();
        expect(false === state.isRepoInitialized).toBe(true);
        expect(state.currentBranch).toBe('main');
    });

    it('sets repo initialized', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRepoInitialized(true);
        expect(true === useNotemacStore.getState().isRepoInitialized).toBe(true);
    });

    it('sets current branch', () =>
    {
        const store = useNotemacStore.getState();
        store.SetCurrentBranch('develop');
        expect(useNotemacStore.getState().currentBranch).toBe('develop');
    });
});

// ─── Branches & Remotes ─────────────────────────────────────────

describe('GitModel — branches & remotes', () =>
{
    beforeEach(() => resetGitState());

    it('sets branches', () =>
    {
        const store = useNotemacStore.getState();
        const branches: GitBranch[] = [
            { name: 'main', isRemote: false, isCurrentBranch: true, lastCommitOid: '' },
            { name: 'feature', isRemote: false, isCurrentBranch: false, lastCommitOid: '' },
        ];
        store.SetBranches(branches);
        expect(2 === useNotemacStore.getState().branches.length).toBe(true);
    });

    it('sets remotes', () =>
    {
        const store = useNotemacStore.getState();
        const remotes: GitRemote[] = [
            { name: 'origin', url: 'https://github.com/test/repo.git' },
        ];
        store.SetRemotes(remotes);
        expect(1 === useNotemacStore.getState().remotes.length).toBe(true);
        expect(useNotemacStore.getState().remotes[0].name).toBe('origin');
    });
});

// ─── Git Status ─────────────────────────────────────────────────

describe('GitModel — git status', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to null status', () =>
    {
        expect(null === useNotemacStore.getState().gitStatus).toBe(true);
    });

    it('sets git status', () =>
    {
        const store = useNotemacStore.getState();
        const status: GitStatus = {
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [{ path: 'a.ts', status: 'modified', isStaged: true }],
            unstagedFiles: [{ path: 'b.ts', status: 'modified', isStaged: false }],
            untrackedFiles: [{ path: 'c.ts', status: 'untracked', isStaged: false }],
            aheadBy: 1,
            behindBy: 0,
            mergeInProgress: false,
        };
        store.SetGitStatus(status);

        const result = useNotemacStore.getState().gitStatus;
        expect(null !== result).toBe(true);
        expect(1 === result!.stagedFiles.length).toBe(true);
        expect(1 === result!.unstagedFiles.length).toBe(true);
        expect(1 === result!.untrackedFiles.length).toBe(true);
    });

    it('GetStagedFileCount returns correct count', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [
                { path: 'a.ts', status: 'added', isStaged: true },
                { path: 'b.ts', status: 'modified', isStaged: true },
            ],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(2 === useNotemacStore.getState().GetStagedFileCount()).toBe(true);
    });

    it('GetChangedFileCount returns total of staged + unstaged + untracked', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [{ path: 'a.ts', status: 'added', isStaged: true }],
            unstagedFiles: [{ path: 'b.ts', status: 'modified', isStaged: false }],
            untrackedFiles: [{ path: 'c.ts', status: 'untracked', isStaged: false }, { path: 'd.ts', status: 'untracked', isStaged: false }],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(4 === useNotemacStore.getState().GetChangedFileCount()).toBe(true);
    });

    it('GetChangedFileCount returns 0 when status is null', () =>
    {
        expect(0 === useNotemacStore.getState().GetChangedFileCount()).toBe(true);
    });

    it('GetStagedFileCount returns 0 when status is null', () =>
    {
        expect(0 === useNotemacStore.getState().GetStagedFileCount()).toBe(true);
    });
});

// ─── Commit Log ─────────────────────────────────────────────────

describe('GitModel — commit log', () =>
{
    beforeEach(() => resetGitState());

    it('sets commit log', () =>
    {
        const store = useNotemacStore.getState();
        const commits: GitCommit[] = [
            { oid: 'abc123', message: 'Initial commit', author: { name: 'Test', email: 'test@test.com' }, timestamp: 1234567890 },
            { oid: 'def456', message: 'Second commit', author: { name: 'Test', email: 'test@test.com' }, timestamp: 1234567900 },
        ];
        store.SetCommitLog(commits);
        expect(2 === useNotemacStore.getState().commitLog.length).toBe(true);
        expect(useNotemacStore.getState().commitLog[0].oid).toBe('abc123');
    });

    it('clears commit log', () =>
    {
        const store = useNotemacStore.getState();
        store.SetCommitLog([{ oid: 'a', message: 'm', author: { name: 'n', email: 'e' }, timestamp: 0 }]);
        store.SetCommitLog([]);
        expect(0 === useNotemacStore.getState().commitLog.length).toBe(true);
    });
});

// ─── Credentials ────────────────────────────────────────────────

describe('GitModel — credentials', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to null credentials', () =>
    {
        expect(null === useNotemacStore.getState().gitCredentials).toBe(true);
    });

    it('sets credentials', () =>
    {
        const store = useNotemacStore.getState();
        const creds: GitCredentials = { type: 'token', username: 'user', token: 'tok123' };
        store.SetGitCredentials(creds);

        const result = useNotemacStore.getState().gitCredentials;
        expect(null !== result).toBe(true);
        expect(result!.type).toBe('token');
        expect(result!.username).toBe('user');
    });

    it('clears credentials', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitCredentials({ type: 'token', username: 'u', token: 't' });
        store.SetGitCredentials(null);
        expect(null === useNotemacStore.getState().gitCredentials).toBe(true);
    });
});

// ─── Git Author ─────────────────────────────────────────────────

describe('GitModel — author', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to Notemac++ User', () =>
    {
        const author = useNotemacStore.getState().gitAuthor;
        expect(author.name).toBe('Notemac++ User');
        expect(author.email).toBe('user@notemac.app');
    });

    it('sets author', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitAuthor({ name: 'John', email: 'john@example.com' });

        const author = useNotemacStore.getState().gitAuthor;
        expect(author.name).toBe('John');
        expect(author.email).toBe('john@example.com');
    });
});

// ─── Git Settings ───────────────────────────────────────────────

describe('GitModel — settings', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to auto-fetch enabled', () =>
    {
        const settings = useNotemacStore.getState().gitSettings;
        expect(true === settings.autoFetch).toBe(true);
        expect(300000 === settings.autoFetchInterval).toBe(true);
        expect(true === settings.showUntracked).toBe(true);
        expect(false === settings.showIgnored).toBe(true);
    });

    it('updates individual git settings', () =>
    {
        const store = useNotemacStore.getState();
        store.UpdateGitSettings({ autoFetch: false });
        expect(false === useNotemacStore.getState().gitSettings.autoFetch).toBe(true);
    });

    it('preserves other settings when updating', () =>
    {
        const store = useNotemacStore.getState();
        store.UpdateGitSettings({ showIgnored: true });
        const settings = useNotemacStore.getState().gitSettings;
        expect(true === settings.autoFetch).toBe(true); // unchanged
        expect(true === settings.showIgnored).toBe(true); // updated
    });
});

// ─── Operation State ────────────────────────────────────────────

describe('GitModel — operation state', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to no operation', () =>
    {
        const state = useNotemacStore.getState();
        expect(false === state.isGitOperationInProgress).toBe(true);
        expect(null === state.currentGitOperation).toBe(true);
        expect(0 === state.gitOperationProgress).toBe(true);
        expect(null === state.gitOperationError).toBe(true);
    });

    it('sets operation in progress', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('clone');
        store.SetGitOperationProgress(50);
        expect(true === useNotemacStore.getState().isGitOperationInProgress).toBe(true);
        expect(useNotemacStore.getState().currentGitOperation).toBe('clone');
        expect(50 === useNotemacStore.getState().gitOperationProgress).toBe(true);
    });

    it('sets and clears operation error', () =>
    {
        const store = useNotemacStore.getState();
        store.SetGitOperationError('Something failed');
        expect(useNotemacStore.getState().gitOperationError).toBe('Something failed');

        store.SetGitOperationError(null);
        expect(null === useNotemacStore.getState().gitOperationError).toBe(true);
    });
});

// ─── Browser Workspaces ─────────────────────────────────────────

describe('GitModel — browser workspaces', () =>
{
    beforeEach(() => resetGitState());

    it('defaults to empty browser workspaces', () =>
    {
        const state = useNotemacStore.getState();
        expect(false === state.isBrowserWorkspace).toBe(true);
        expect(0 === state.browserWorkspaces.length).toBe(true);
    });

    it('adds browser workspace', () =>
    {
        const store = useNotemacStore.getState();
        const ws: BrowserWorkspace = {
            id: 'ws1',
            name: 'Test Workspace',
            createdAt: Date.now(),
            lastOpenedAt: Date.now(),
        };
        store.AddBrowserWorkspace(ws);
        expect(1 === useNotemacStore.getState().browserWorkspaces.length).toBe(true);
        expect(useNotemacStore.getState().browserWorkspaces[0].name).toBe('Test Workspace');
    });

    it('deduplicates when adding workspace with same id', () =>
    {
        const store = useNotemacStore.getState();
        const ws: BrowserWorkspace = {
            id: 'ws1',
            name: 'Original',
            createdAt: Date.now(),
            lastOpenedAt: Date.now(),
        };
        store.AddBrowserWorkspace(ws);
        store.AddBrowserWorkspace({ ...ws, name: 'Updated' });

        const workspaces = useNotemacStore.getState().browserWorkspaces;
        expect(1 === workspaces.length).toBe(true);
        expect(workspaces[0].name).toBe('Updated');
    });

    it('removes browser workspace', () =>
    {
        const store = useNotemacStore.getState();
        store.AddBrowserWorkspace({ id: 'ws1', name: 'WS1', createdAt: 1, lastOpenedAt: 1 });
        store.AddBrowserWorkspace({ id: 'ws2', name: 'WS2', createdAt: 2, lastOpenedAt: 2 });
        store.RemoveBrowserWorkspace('ws1');

        const workspaces = useNotemacStore.getState().browserWorkspaces;
        expect(1 === workspaces.length).toBe(true);
        expect(workspaces[0].id).toBe('ws2');
    });

    it('removing non-existent workspace does nothing', () =>
    {
        const store = useNotemacStore.getState();
        store.AddBrowserWorkspace({ id: 'ws1', name: 'WS1', createdAt: 1, lastOpenedAt: 1 });
        store.RemoveBrowserWorkspace('nonexistent');
        expect(1 === useNotemacStore.getState().browserWorkspaces.length).toBe(true);
    });

    it('sets browser workspace flag', () =>
    {
        const store = useNotemacStore.getState();
        store.SetIsBrowserWorkspace(true);
        expect(true === useNotemacStore.getState().isBrowserWorkspace).toBe(true);
    });
});
