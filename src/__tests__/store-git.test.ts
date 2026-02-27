import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../../Shared/Persistence/PersistenceService', () => ({
    GetValue: vi.fn(() => null),
    SetValue: vi.fn(),
    RemoveValue: vi.fn(),
}));

vi.mock('../Configs/GitConfig', () => ({
    GetDefaultGitSettings: () => ({
        autoSync: false,
        showDiffSummary: true,
        signCommits: false,
    }),
    GetDefaultGitAuthor: () => ({
        name: 'Unknown',
        email: 'unknown@example.com',
    }),
}));

function resetStore(): void {
    useNotemacStore.setState({
        isRepoInitialized: false,
        currentBranch: 'main',
        branches: [],
        remotes: [],
        gitStatus: null,
        commitLog: [],
        gitCredentials: null,
        gitAuthor: { name: 'Unknown', email: 'unknown@example.com' },
        gitSettings: { autoSync: false, showDiffSummary: true, signCommits: false },
        isBrowserWorkspace: false,
        browserWorkspaces: [],
        isGitOperationInProgress: false,
        currentGitOperation: null,
        gitOperationProgress: 0,
        gitOperationError: null,
    });
}

describe('GitModel — SetRepoInitialized', () => {
    beforeEach(() => resetStore());

    it('marks repo as initialized', () => {
        const store = useNotemacStore.getState();
        store.SetRepoInitialized(true);
        expect(useNotemacStore.getState().isRepoInitialized).toBe(true);
    });
});

describe('GitModel — SetCurrentBranch', () => {
    beforeEach(() => resetStore());

    it('sets current branch', () => {
        const store = useNotemacStore.getState();
        store.SetCurrentBranch('feature/test');
        expect(useNotemacStore.getState().currentBranch).toBe('feature/test');
    });
});

describe('GitModel — SetBranches', () => {
    beforeEach(() => resetStore());

    it('sets branches list', () => {
        const store = useNotemacStore.getState();
        const branches = [
            { name: 'main', isCurrentBranch: true },
            { name: 'develop', isCurrentBranch: false },
        ];
        store.SetBranches(branches);
        const state = useNotemacStore.getState();

        expect(state.branches.length).toBe(2);
        expect(state.branches[0].name).toBe('main');
    });
});

describe('GitModel — SetRemotes', () => {
    beforeEach(() => resetStore());

    it('sets remotes list', () => {
        const store = useNotemacStore.getState();
        const remotes = [
            { name: 'origin', url: 'https://github.com/user/repo.git' },
        ];
        store.SetRemotes(remotes);
        expect(useNotemacStore.getState().remotes.length).toBe(1);
    });
});

describe('GitModel — SetGitStatus', () => {
    beforeEach(() => resetStore());

    it('sets git status', () => {
        const store = useNotemacStore.getState();
        const status = {
            stagedFiles: [{ path: 'file.ts', status: 'added' }],
            unstagedFiles: [],
            untrackedFiles: [],
        };
        store.SetGitStatus(status);
        expect(useNotemacStore.getState().gitStatus?.stagedFiles.length).toBe(1);
    });

    it('clears git status', () => {
        const store = useNotemacStore.getState();
        const status = {
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: [],
        };
        store.SetGitStatus(status);
        store.SetGitStatus(null);
        expect(useNotemacStore.getState().gitStatus).toBeNull();
    });
});

describe('GitModel — SetCommitLog', () => {
    beforeEach(() => resetStore());

    it('sets commit log', () => {
        const store = useNotemacStore.getState();
        const commits = [
            { hash: 'abc123', message: 'Initial commit', author: 'User', timestamp: 1000 },
        ];
        store.SetCommitLog(commits);
        expect(useNotemacStore.getState().commitLog.length).toBe(1);
    });
});

describe('GitModel — SetGitCredentials', () => {
    beforeEach(() => resetStore());

    it('sets git credentials', () => {
        const store = useNotemacStore.getState();
        store.SetGitCredentials({ type: 'token', username: 'user', token: 'secret' });
        const state = useNotemacStore.getState();

        expect(state.gitCredentials?.type).toBe('token');
        expect(state.gitCredentials?.username).toBe('user');
    });

    it('clears git credentials', () => {
        const store = useNotemacStore.getState();
        store.SetGitCredentials({ type: 'token', username: 'user', token: 'secret' });
        store.SetGitCredentials(null);
        expect(useNotemacStore.getState().gitCredentials).toBeNull();
    });
});

describe('GitModel — SetGitAuthor', () => {
    beforeEach(() => resetStore());

    it('sets git author', () => {
        const store = useNotemacStore.getState();
        store.SetGitAuthor({ name: 'John Doe', email: 'john@example.com' });
        const state = useNotemacStore.getState();

        expect(state.gitAuthor.name).toBe('John Doe');
        expect(state.gitAuthor.email).toBe('john@example.com');
    });
});

describe('GitModel — UpdateGitSettings', () => {
    beforeEach(() => resetStore());

    it('updates git settings', () => {
        const store = useNotemacStore.getState();
        store.UpdateGitSettings({ autoSync: true });
        const state = useNotemacStore.getState();

        expect(state.gitSettings.autoSync).toBe(true);
        expect(state.gitSettings.showDiffSummary).toBe(true);
    });

    it('updates multiple settings', () => {
        const store = useNotemacStore.getState();
        store.UpdateGitSettings({ autoSync: true, signCommits: true });
        const state = useNotemacStore.getState();

        expect(state.gitSettings.autoSync).toBe(true);
        expect(state.gitSettings.signCommits).toBe(true);
    });
});

describe('GitModel — SetIsBrowserWorkspace', () => {
    beforeEach(() => resetStore());

    it('marks as browser workspace', () => {
        const store = useNotemacStore.getState();
        store.SetIsBrowserWorkspace(true);
        expect(useNotemacStore.getState().isBrowserWorkspace).toBe(true);
    });
});

describe('GitModel — AddBrowserWorkspace', () => {
    beforeEach(() => resetStore());

    it('adds browser workspace', () => {
        const store = useNotemacStore.getState();
        const workspace = { id: 'ws-1', name: 'Test Workspace', storageType: 'indexeddb' as const };
        store.AddBrowserWorkspace(workspace);
        const state = useNotemacStore.getState();

        expect(state.browserWorkspaces.length).toBe(1);
        expect(state.browserWorkspaces[0].id).toBe('ws-1');
    });

    it('updates existing workspace with same id', () => {
        const store = useNotemacStore.getState();
        store.AddBrowserWorkspace({ id: 'ws-1', name: 'Original', storageType: 'indexeddb' as const });
        store.AddBrowserWorkspace({ id: 'ws-1', name: 'Updated', storageType: 'indexeddb' as const });
        const state = useNotemacStore.getState();

        expect(state.browserWorkspaces.length).toBe(1);
        expect(state.browserWorkspaces[0].name).toBe('Updated');
    });
});

describe('GitModel — RemoveBrowserWorkspace', () => {
    beforeEach(() => resetStore());

    it('removes browser workspace', () => {
        const store = useNotemacStore.getState();
        store.AddBrowserWorkspace({ id: 'ws-1', name: 'Test', storageType: 'indexeddb' as const });
        store.RemoveBrowserWorkspace('ws-1');
        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(0);
    });

    it('does nothing for non-existent workspace', () => {
        const store = useNotemacStore.getState();
        store.AddBrowserWorkspace({ id: 'ws-1', name: 'Test', storageType: 'indexeddb' as const });
        store.RemoveBrowserWorkspace('ws-999');
        expect(useNotemacStore.getState().browserWorkspaces.length).toBe(1);
    });
});

describe('GitModel — SetGitOperationInProgress', () => {
    beforeEach(() => resetStore());

    it('marks operation as in progress', () => {
        const store = useNotemacStore.getState();
        store.SetGitOperationInProgress(true);
        expect(useNotemacStore.getState().isGitOperationInProgress).toBe(true);
    });
});

describe('GitModel — SetCurrentGitOperation', () => {
    beforeEach(() => resetStore());

    it('sets current git operation', () => {
        const store = useNotemacStore.getState();
        store.SetCurrentGitOperation('push');
        expect(useNotemacStore.getState().currentGitOperation).toBe('push');
    });

    it('clears current git operation', () => {
        const store = useNotemacStore.getState();
        store.SetCurrentGitOperation('pull');
        store.SetCurrentGitOperation(null);
        expect(useNotemacStore.getState().currentGitOperation).toBeNull();
    });
});

describe('GitModel — SetGitOperationProgress', () => {
    beforeEach(() => resetStore());

    it('sets operation progress', () => {
        const store = useNotemacStore.getState();
        store.SetGitOperationProgress(50);
        expect(useNotemacStore.getState().gitOperationProgress).toBe(50);
    });
});

describe('GitModel — SetGitOperationError', () => {
    beforeEach(() => resetStore());

    it('sets operation error', () => {
        const store = useNotemacStore.getState();
        store.SetGitOperationError('Connection failed');
        expect(useNotemacStore.getState().gitOperationError).toBe('Connection failed');
    });

    it('clears operation error', () => {
        const store = useNotemacStore.getState();
        store.SetGitOperationError('Some error');
        store.SetGitOperationError(null);
        expect(useNotemacStore.getState().gitOperationError).toBeNull();
    });
});

describe('GitModel — GetStagedFileCount', () => {
    beforeEach(() => resetStore());

    it('returns count of staged files', () => {
        const store = useNotemacStore.getState();
        const status = {
            stagedFiles: [
                { path: 'file1.ts', status: 'modified' },
                { path: 'file2.ts', status: 'added' },
            ],
            unstagedFiles: [{ path: 'file3.ts', status: 'modified' }],
            untrackedFiles: [],
        };
        store.SetGitStatus(status);
        expect(store.GetStagedFileCount()).toBe(2);
    });

    it('returns 0 when no status', () => {
        const store = useNotemacStore.getState();
        expect(store.GetStagedFileCount()).toBe(0);
    });
});

describe('GitModel — GetChangedFileCount', () => {
    beforeEach(() => resetStore());

    it('returns total count of all changed files', () => {
        const store = useNotemacStore.getState();
        const status = {
            stagedFiles: [{ path: 'file1.ts', status: 'modified' }],
            unstagedFiles: [{ path: 'file2.ts', status: 'modified' }],
            untrackedFiles: [{ path: 'file3.ts', status: 'untracked' }],
        };
        store.SetGitStatus(status);
        expect(store.GetChangedFileCount()).toBe(3);
    });

    it('returns 0 when no status', () => {
        const store = useNotemacStore.getState();
        expect(store.GetChangedFileCount()).toBe(0);
    });
});

describe('GitModel — LoadGitState', () => {
    beforeEach(() => resetStore());

    it('loads git state from persistence', () => {
        const store = useNotemacStore.getState();
        store.LoadGitState();
        const state = useNotemacStore.getState();

        expect(state.gitAuthor).toBeDefined();
        expect(state.gitSettings).toBeDefined();
    });
});

describe('GitModel — SaveGitState', () => {
    beforeEach(() => resetStore());

    it('saves git state to persistence', () => {
        const store = useNotemacStore.getState();
        store.SetGitAuthor({ name: 'Test User', email: 'test@example.com' });
        store.SaveGitState();
        expect(useNotemacStore.getState().gitAuthor.name).toBe('Test User');
    });
});
