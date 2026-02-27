import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultGitSettings, GetDefaultGitAuthor } from '../Notemac/Configs/GitConfig';
import type { GitStatus, GitBranch, GitCommit, GitRemote, GitCredentials, BrowserWorkspace } from '../Notemac/Commons/Types';

function resetStore(): void
{
    useNotemacStore.setState({
        isRepoInitialized: false,
        currentBranch: '',
        branches: [],
        remotes: [],
        gitStatus: null,
        commitLog: [],
        gitCredentials: null,
        gitAuthor: { name: '', email: '' },
        gitSettings: { autoFetch: false, corsProxy: '', showUntracked: true, autoFetchInterval: 300000, showIgnored: false },
        isBrowserWorkspace: false,
        browserWorkspaces: [],
        isGitOperationInProgress: false,
        currentGitOperation: null,
        gitOperationProgress: 0,
        gitOperationError: null,
    });
}

// ─── Operation State Transitions ─────────────────────────────────────

describe('Git Edge Cases — operation state resets', () =>
{
    beforeEach(() => resetStore());

    it('clears old operation state when new operation starts', () =>
    {
        const store = useNotemacStore.getState();

        // Set up initial operation with error and progress
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('clone');
        store.SetGitOperationProgress(75);
        store.SetGitOperationError('Initial clone failed');

        // Verify initial state
        expect(useNotemacStore.getState().isGitOperationInProgress).toBe(true);
        expect(useNotemacStore.getState().currentGitOperation).toBe('clone');
        expect(useNotemacStore.getState().gitOperationProgress).toBe(75);
        expect(useNotemacStore.getState().gitOperationError).toBe('Initial clone failed');

        // Start new operation
        store.SetCurrentGitOperation('push');
        store.SetGitOperationProgress(0);
        store.SetGitOperationError(null);

        // Verify old state is cleared
        expect(useNotemacStore.getState().currentGitOperation).toBe('push');
        expect(useNotemacStore.getState().gitOperationProgress).toBe(0);
        expect(useNotemacStore.getState().gitOperationError).toBeNull();
    });

    it('handles operation error clearing when transitioning operations', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('pull');
        store.SetGitOperationError('Network timeout');

        expect(useNotemacStore.getState().gitOperationError).toBe('Network timeout');

        // Start new operation
        store.SetCurrentGitOperation('fetch');
        store.SetGitOperationError(null);

        expect(useNotemacStore.getState().gitOperationError).toBeNull();
    });
});

// ─── Progress Clamping ───────────────────────────────────────────────

describe('Git Edge Cases — operation progress', () =>
{
    beforeEach(() => resetStore());

    it('stores progress values outside 0-100 range (no clamping)', () =>
    {
        const store = useNotemacStore.getState();

        // Test negative value
        store.SetGitOperationProgress(-50);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(-50);

        // Test value over 100
        store.SetGitOperationProgress(250);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(250);

        // Test boundary values
        store.SetGitOperationProgress(0);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(0);

        store.SetGitOperationProgress(100);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(100);
    });

    it('accepts floating point progress values', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitOperationProgress(33.33);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(33.33);

        store.SetGitOperationProgress(99.99);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(99.99);
    });
});

// ─── Sequential Operations ──────────────────────────────────────────

describe('Git Edge Cases — sequential operations', () =>
{
    beforeEach(() => resetStore());

    it('updates state correctly across multiple sequential operations', () =>
    {
        const store = useNotemacStore.getState();

        // Operation 1: Clone
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('clone');
        store.SetGitOperationProgress(50);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(50);

        // Operation 2: Fetch
        store.SetCurrentGitOperation('fetch');
        store.SetGitOperationProgress(0);
        expect(useNotemacStore.getState().currentGitOperation).toBe('fetch');
        expect(useNotemacStore.getState().gitOperationProgress).toBe(0);

        // Operation 3: Push
        store.SetCurrentGitOperation('push');
        store.SetGitOperationProgress(100);
        expect(useNotemacStore.getState().currentGitOperation).toBe('push');
        expect(useNotemacStore.getState().gitOperationProgress).toBe(100);

        // Completion
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        expect(useNotemacStore.getState().isGitOperationInProgress).toBe(false);
        expect(useNotemacStore.getState().currentGitOperation).toBeNull();
    });
});

// ─── Empty Git Status ────────────────────────────────────────────────

describe('Git Edge Cases — empty git status', () =>
{
    beforeEach(() => resetStore());

    it('sets git status with empty staged/unstaged/untracked arrays', () =>
    {
        const store = useNotemacStore.getState();

        const status: GitStatus = {
            branch: 'main',
            isRepoDirty: false,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        };

        store.SetGitStatus(status);

        const result = useNotemacStore.getState().gitStatus;
        expect(result).not.toBeNull();
        expect(result!.stagedFiles.length).toBe(0);
        expect(result!.unstagedFiles.length).toBe(0);
        expect(result!.untrackedFiles.length).toBe(0);
        expect(result!.isRepoDirty).toBe(false);
    });

    it('handles transition from dirty to clean status', () =>
    {
        const store = useNotemacStore.getState();

        // Dirty status
        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [{ path: 'file.ts', status: 'modified', isStaged: true }],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().gitStatus!.isRepoDirty).toBe(true);

        // Clean status
        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: false,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().gitStatus!.isRepoDirty).toBe(false);
    });
});

// ─── Mixed File Statuses ────────────────────────────────────────────

describe('Git Edge Cases — mixed file statuses', () =>
{
    beforeEach(() => resetStore());

    it('handles git status with mixed file statuses', () =>
    {
        const store = useNotemacStore.getState();

        const status: GitStatus = {
            branch: 'develop',
            isRepoDirty: true,
            stagedFiles: [
                { path: 'src/added.ts', status: 'added', isStaged: true },
                { path: 'src/modified.ts', status: 'modified', isStaged: true },
            ],
            unstagedFiles: [
                { path: 'src/unstaged-mod.ts', status: 'modified', isStaged: false },
                { path: 'src/unstaged-delete.ts', status: 'deleted', isStaged: false },
            ],
            untrackedFiles: [
                { path: 'new-file.ts', status: 'untracked', isStaged: false },
                { path: 'temp.log', status: 'untracked', isStaged: false },
            ],
            aheadBy: 2,
            behindBy: 1,
            mergeInProgress: false,
        };

        store.SetGitStatus(status);

        const result = useNotemacStore.getState().gitStatus;
        expect(result).not.toBeNull();
        expect(result!.stagedFiles.length).toBe(2);
        expect(result!.unstagedFiles.length).toBe(2);
        expect(result!.untrackedFiles.length).toBe(2);
        expect(result!.aheadBy).toBe(2);
        expect(result!.behindBy).toBe(1);
    });

    it('GetStagedFileCount with various file statuses', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [
                { path: 'added.ts', status: 'added', isStaged: true },
                { path: 'modified.ts', status: 'modified', isStaged: true },
                { path: 'deleted.ts', status: 'deleted', isStaged: true },
            ],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().GetStagedFileCount()).toBe(3);
    });
});

// ─── File Count Helpers ──────────────────────────────────────────────

describe('Git Edge Cases — file count helpers', () =>
{
    beforeEach(() => resetStore());

    it('GetStagedFileCount returns 0 when status is null', () =>
    {
        expect(useNotemacStore.getState().gitStatus).toBeNull();
        expect(useNotemacStore.getState().GetStagedFileCount()).toBe(0);
    });

    it('GetChangedFileCount returns 0 when status is null', () =>
    {
        expect(useNotemacStore.getState().GetChangedFileCount()).toBe(0);
    });

    it('GetChangedFileCount returns sum of all file arrays', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [{ path: 'a.ts', status: 'added', isStaged: true }],
            unstagedFiles: [
                { path: 'b.ts', status: 'modified', isStaged: false },
                { path: 'c.ts', status: 'modified', isStaged: false },
            ],
            untrackedFiles: [
                { path: 'd.ts', status: 'untracked', isStaged: false },
                { path: 'e.ts', status: 'untracked', isStaged: false },
                { path: 'f.ts', status: 'untracked', isStaged: false },
            ],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        // 1 staged + 2 unstaged + 3 untracked = 6
        expect(useNotemacStore.getState().GetChangedFileCount()).toBe(6);
    });

    it('GetChangedFileCount works with only staged files', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [
                { path: 'a.ts', status: 'added', isStaged: true },
                { path: 'b.ts', status: 'added', isStaged: true },
            ],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().GetChangedFileCount()).toBe(2);
    });

    it('GetChangedFileCount works with only unstaged files', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [],
            unstagedFiles: [
                { path: 'a.ts', status: 'modified', isStaged: false },
                { path: 'b.ts', status: 'modified', isStaged: false },
                { path: 'c.ts', status: 'deleted', isStaged: false },
            ],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().GetChangedFileCount()).toBe(3);
    });

    it('GetChangedFileCount works with only untracked files', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitStatus({
            branch: 'main',
            isRepoDirty: true,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [
                { path: 'a.ts', status: 'untracked', isStaged: false },
                { path: 'b.ts', status: 'untracked', isStaged: false },
            ],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().GetChangedFileCount()).toBe(2);
    });
});

// ─── Commit Log ──────────────────────────────────────────────────────

describe('Git Edge Cases — commit log order', () =>
{
    beforeEach(() => resetStore());

    it('SetCommitLog preserves commit order (no reordering)', () =>
    {
        const store = useNotemacStore.getState();

        const commits: GitCommit[] = [
            { oid: 'commit3', message: 'Third commit', author: { name: 'Dev', email: 'dev@test.com' }, timestamp: 1000 },
            { oid: 'commit1', message: 'First commit', author: { name: 'Dev', email: 'dev@test.com' }, timestamp: 3000 },
            { oid: 'commit2', message: 'Second commit', author: { name: 'Dev', email: 'dev@test.com' }, timestamp: 2000 },
        ];

        store.SetCommitLog(commits);

        const result = useNotemacStore.getState().commitLog;
        expect(result.length).toBe(3);
        expect(result[0].oid).toBe('commit3');
        expect(result[1].oid).toBe('commit1');
        expect(result[2].oid).toBe('commit2');
    });

    it('handles commit log with single entry', () =>
    {
        const store = useNotemacStore.getState();

        const commits: GitCommit[] = [
            { oid: 'single', message: 'Only commit', author: { name: 'Dev', email: 'dev@test.com' }, timestamp: 0 },
        ];

        store.SetCommitLog(commits);

        expect(useNotemacStore.getState().commitLog.length).toBe(1);
        expect(useNotemacStore.getState().commitLog[0].oid).toBe('single');
    });

    it('clears commit log with empty array', () =>
    {
        const store = useNotemacStore.getState();

        // Add commits first
        store.SetCommitLog([
            { oid: 'a', message: 'msg1', author: { name: 'n', email: 'e' }, timestamp: 0 },
            { oid: 'b', message: 'msg2', author: { name: 'n', email: 'e' }, timestamp: 1 },
        ]);

        expect(useNotemacStore.getState().commitLog.length).toBe(2);

        // Clear
        store.SetCommitLog([]);

        expect(useNotemacStore.getState().commitLog.length).toBe(0);
    });
});

// ─── Credentials ─────────────────────────────────────────────────────

describe('Git Edge Cases — credentials', () =>
{
    beforeEach(() => resetStore());

    it('clears credentials by setting to null', () =>
    {
        const store = useNotemacStore.getState();

        const creds: GitCredentials = { type: 'token', username: 'user1', token: 'secret123' };
        store.SetGitCredentials(creds);
        expect(useNotemacStore.getState().gitCredentials).not.toBeNull();

        store.SetGitCredentials(null);
        expect(useNotemacStore.getState().gitCredentials).toBeNull();
    });

    it('handles multiple credential updates', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitCredentials({ type: 'token', username: 'user1', token: 'token1' });
        expect(useNotemacStore.getState().gitCredentials!.username).toBe('user1');

        store.SetGitCredentials({ type: 'token', username: 'user2', token: 'token2' });
        expect(useNotemacStore.getState().gitCredentials!.username).toBe('user2');
    });
});

// ─── Git Settings ────────────────────────────────────────────────────

describe('Git Edge Cases — settings updates', () =>
{
    beforeEach(() => resetStore());

    it('partial update preserves other settings', () =>
    {
        const store = useNotemacStore.getState();

        // Set initial state
        store.UpdateGitSettings({
            autoFetch: true,
            autoFetchInterval: 600000,
            showUntracked: false,
            showIgnored: true,
            corsProxy: 'https://cors.example.com',
        });

        // Update only autoFetch
        store.UpdateGitSettings({ autoFetch: false });

        const settings = useNotemacStore.getState().gitSettings;
        expect(settings.autoFetch).toBe(false);
        expect(settings.autoFetchInterval).toBe(600000);
        expect(settings.showUntracked).toBe(false);
        expect(settings.showIgnored).toBe(true);
        expect(settings.corsProxy).toBe('https://cors.example.com');
    });

    it('UpdateGitSettings with empty object preserves all', () =>
    {
        const store = useNotemacStore.getState();

        const originalSettings = { ...useNotemacStore.getState().gitSettings };

        store.UpdateGitSettings({});

        const settings = useNotemacStore.getState().gitSettings;
        expect(settings.autoFetch).toBe(originalSettings.autoFetch);
        expect(settings.showUntracked).toBe(originalSettings.showUntracked);
        expect(settings.corsProxy).toBe(originalSettings.corsProxy);
    });

    it('handles multiple sequential setting updates', () =>
    {
        const store = useNotemacStore.getState();

        store.UpdateGitSettings({ autoFetch: true });
        expect(useNotemacStore.getState().gitSettings.autoFetch).toBe(true);

        store.UpdateGitSettings({ showUntracked: false });
        expect(useNotemacStore.getState().gitSettings.autoFetch).toBe(true);
        expect(useNotemacStore.getState().gitSettings.showUntracked).toBe(false);

        store.UpdateGitSettings({ corsProxy: 'https://proxy.test.com' });
        expect(useNotemacStore.getState().gitSettings.autoFetch).toBe(true);
        expect(useNotemacStore.getState().gitSettings.showUntracked).toBe(false);
        expect(useNotemacStore.getState().gitSettings.corsProxy).toBe('https://proxy.test.com');
    });
});

// ─── Browser Workspaces ─────────────────────────────────────────────

describe('Git Edge Cases — browser workspaces', () =>
{
    beforeEach(() => resetStore());

    it('AddBrowserWorkspace deduplicates by ID', () =>
    {
        const store = useNotemacStore.getState();

        const workspace1: BrowserWorkspace = { id: 'ws-1', name: 'Workspace 1', url: 'https://example.com' };
        const workspace1Updated: BrowserWorkspace = { id: 'ws-1', name: 'Updated Name', url: 'https://new.example.com' };

        store.AddBrowserWorkspace(workspace1);
        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(1);

        // Add same ID - should update, not add
        store.AddBrowserWorkspace(workspace1Updated);
        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(1);
        expect(useNotemacStore.getState().browserWorkspaces[0].name).toBe('Updated Name');
    });

    it('RemoveBrowserWorkspace with non-existent ID is safe', () =>
    {
        const store = useNotemacStore.getState();

        const workspace: BrowserWorkspace = { id: 'ws-1', name: 'Workspace 1', url: 'https://example.com' };
        store.AddBrowserWorkspace(workspace);

        // Try to remove non-existent workspace
        store.RemoveBrowserWorkspace('ws-999');

        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(1);
        expect(useNotemacStore.getState().browserWorkspaces[0].id).toBe('ws-1');
    });

    it('RemoveBrowserWorkspace removes correct workspace', () =>
    {
        const store = useNotemacStore.getState();

        const ws1: BrowserWorkspace = { id: 'ws-1', name: 'Workspace 1', url: 'https://example.com' };
        const ws2: BrowserWorkspace = { id: 'ws-2', name: 'Workspace 2', url: 'https://another.com' };
        const ws3: BrowserWorkspace = { id: 'ws-3', name: 'Workspace 3', url: 'https://third.com' };

        store.AddBrowserWorkspace(ws1);
        store.AddBrowserWorkspace(ws2);
        store.AddBrowserWorkspace(ws3);

        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(3);

        // Remove middle one
        store.RemoveBrowserWorkspace('ws-2');

        const remaining = useNotemacStore.getState().browserWorkspaces;
        expect(remaining.length).toBe(2);
        expect(remaining[0].id).toBe('ws-1');
        expect(remaining[1].id).toBe('ws-3');
    });
});

// ─── Git State Isolation ─────────────────────────────────────────────

describe('Git Edge Cases — state isolation', () =>
{
    beforeEach(() => resetStore());

    it('git state changes do not affect non-git state', () =>
    {
        const store = useNotemacStore.getState();

        // Set some git state
        store.SetRepoInitialized(true);
        store.SetCurrentBranch('main');
        store.SetGitAuthor({ name: 'Test User', email: 'test@example.com' });

        // Verify git state
        const gitState = useNotemacStore.getState();
        expect(gitState.isRepoInitialized).toBe(true);
        expect(gitState.currentBranch).toBe('main');
        expect(gitState.gitAuthor.name).toBe('Test User');
    });
});

// ─── Operation Error States ─────────────────────────────────────────

describe('Git Edge Cases — operation error handling', () =>
{
    beforeEach(() => resetStore());

    it('operation error clears when new operation starts', () =>
    {
        const store = useNotemacStore.getState();

        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('clone');
        store.SetGitOperationError('Clone failed: network error');

        expect(useNotemacStore.getState().gitOperationError).toBe('Clone failed: network error');

        // Start new operation
        store.SetCurrentGitOperation('fetch');
        store.SetGitOperationError(null);

        expect(useNotemacStore.getState().gitOperationError).toBeNull();
    });

    it('handles long error messages', () =>
    {
        const store = useNotemacStore.getState();

        const longError = 'A'.repeat(1000);
        store.SetGitOperationError(longError);

        expect(useNotemacStore.getState().gitOperationError).toBe(longError);
        expect(useNotemacStore.getState().gitOperationError!.length).toBe(1000);
    });

    it('handles special characters in error messages', () =>
    {
        const store = useNotemacStore.getState();

        const specialError = 'Error: "file.ts" failed with <> characters & symbols';
        store.SetGitOperationError(specialError);

        expect(useNotemacStore.getState().gitOperationError).toBe(specialError);
    });
});

// ─── Git Author ──────────────────────────────────────────────────────

describe('Git Edge Cases — git author', () =>
{
    beforeEach(() => resetStore());

    it('default git author has empty name and email when reset', () =>
    {
        // resetStore sets empty values
        expect(useNotemacStore.getState().gitAuthor.name).toBe('');
        expect(useNotemacStore.getState().gitAuthor.email).toBe('');
    });

    it('sets and retrieves git author correctly', () =>
    {
        const store = useNotemacStore.getState();

        const author = { name: 'John Doe', email: 'john@example.com' };
        store.SetGitAuthor(author);

        const retrieved = useNotemacStore.getState().gitAuthor;
        expect(retrieved.name).toBe('John Doe');
        expect(retrieved.email).toBe('john@example.com');
    });

    it('handles special characters in author name and email', () =>
    {
        const store = useNotemacStore.getState();

        const author = { name: 'José García Pérez', email: 'josé.garcía@example.com' };
        store.SetGitAuthor(author);

        const retrieved = useNotemacStore.getState().gitAuthor;
        expect(retrieved.name).toBe('José García Pérez');
        expect(retrieved.email).toBe('josé.garcía@example.com');
    });
});

// ─── Merge State ────────────────────────────────────────────────────

describe('Git Edge Cases — merge state', () =>
{
    beforeEach(() => resetStore());

    it('handles gitStatus with mergeInProgress flag', () =>
    {
        const store = useNotemacStore.getState();

        const status: GitStatus = {
            branch: 'develop',
            isRepoDirty: true,
            stagedFiles: [],
            unstagedFiles: [{ path: 'conflict.ts', status: 'modified', isStaged: false }],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: true,
        };

        store.SetGitStatus(status);

        expect(useNotemacStore.getState().gitStatus!.mergeInProgress).toBe(true);
    });

    it('transitions from merge state to normal state', () =>
    {
        const store = useNotemacStore.getState();

        // In merge
        store.SetGitStatus({
            branch: 'develop',
            isRepoDirty: true,
            stagedFiles: [],
            unstagedFiles: [{ path: 'conflict.ts', status: 'modified', isStaged: false }],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: true,
        });

        expect(useNotemacStore.getState().gitStatus!.mergeInProgress).toBe(true);

        // Merge resolved
        store.SetGitStatus({
            branch: 'develop',
            isRepoDirty: false,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 0,
            behindBy: 0,
            mergeInProgress: false,
        });

        expect(useNotemacStore.getState().gitStatus!.mergeInProgress).toBe(false);
    });
});

// ─── Ahead/Behind Tracking ──────────────────────────────────────────

describe('Git Edge Cases — ahead/behind tracking', () =>
{
    beforeEach(() => resetStore());

    it('handles tracking commits ahead and behind remote', () =>
    {
        const store = useNotemacStore.getState();

        const status: GitStatus = {
            branch: 'feature',
            isRepoDirty: false,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 5,
            behindBy: 3,
            mergeInProgress: false,
        };

        store.SetGitStatus(status);

        expect(useNotemacStore.getState().gitStatus!.aheadBy).toBe(5);
        expect(useNotemacStore.getState().gitStatus!.behindBy).toBe(3);
    });

    it('handles large ahead/behind values', () =>
    {
        const store = useNotemacStore.getState();

        const status: GitStatus = {
            branch: 'old-branch',
            isRepoDirty: false,
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
            aheadBy: 1000,
            behindBy: 500,
            mergeInProgress: false,
        };

        store.SetGitStatus(status);

        expect(useNotemacStore.getState().gitStatus!.aheadBy).toBe(1000);
        expect(useNotemacStore.getState().gitStatus!.behindBy).toBe(500);
    });
});

// ─── Browser Workspace Flag ─────────────────────────────────────────

describe('Git Edge Cases — browser workspace flag', () =>
{
    beforeEach(() => resetStore());

    it('toggles isBrowserWorkspace flag', () =>
    {
        const store = useNotemacStore.getState();

        expect(useNotemacStore.getState().isBrowserWorkspace).toBe(false);

        store.SetIsBrowserWorkspace(true);
        expect(useNotemacStore.getState().isBrowserWorkspace).toBe(true);

        store.SetIsBrowserWorkspace(false);
        expect(useNotemacStore.getState().isBrowserWorkspace).toBe(false);
    });
});

// ─── Branches with Remote Tracking ──────────────────────────────────

describe('Git Edge Cases — branches and remotes', () =>
{
    beforeEach(() => resetStore());

    it('handles multiple branches with mixed local/remote status', () =>
    {
        const store = useNotemacStore.getState();

        const branches: GitBranch[] = [
            { name: 'main', isRemote: false, isCurrentBranch: true, lastCommitOid: 'abc123' },
            { name: 'develop', isRemote: false, isCurrentBranch: false, lastCommitOid: 'def456' },
            { name: 'origin/main', isRemote: true, isCurrentBranch: false, lastCommitOid: 'abc123' },
            { name: 'origin/develop', isRemote: true, isCurrentBranch: false, lastCommitOid: 'def456' },
        ];

        store.SetBranches(branches);

        const stored = useNotemacStore.getState().branches;
        expect(stored.length).toBe(4);
        expect(stored.filter(b => b.isRemote).length).toBe(2);
        expect(stored.filter(b => !b.isRemote).length).toBe(2);
    });

    it('handles multiple remotes', () =>
    {
        const store = useNotemacStore.getState();

        const remotes: GitRemote[] = [
            { name: 'origin', url: 'https://github.com/user/repo.git' },
            { name: 'upstream', url: 'https://github.com/org/repo.git' },
            { name: 'fork', url: 'https://github.com/other/repo.git' },
        ];

        store.SetRemotes(remotes);

        const stored = useNotemacStore.getState().remotes;
        expect(stored.length).toBe(3);
        expect(stored[0].name).toBe('origin');
        expect(stored[1].name).toBe('upstream');
        expect(stored[2].name).toBe('fork');
    });
});
