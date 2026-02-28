import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { GitBranch, GitCommit, GitStatus, GitRemote, GitCredentials, GitAuthor, BrowserWorkspace, BlameInfo, StashEntry, ConflictRegion } from "../Commons/Types";
import type { GitSettings } from "../Configs/GitConfig";
import { GetDefaultGitSettings, GetDefaultGitAuthor } from "../Configs/GitConfig";
import { GetValue, SetValue } from '../../Shared/Persistence/PersistenceService';
import { DB_GIT_CREDENTIALS, DB_GIT_AUTHOR, DB_GIT_SETTINGS, DB_BROWSER_WORKSPACES } from '../Commons/Constants';

export interface NotemacGitSlice
{
    // State
    isRepoInitialized: boolean;
    currentBranch: string;
    branches: GitBranch[];
    remotes: GitRemote[];
    gitStatus: GitStatus | null;
    commitLog: GitCommit[];
    gitCredentials: GitCredentials | null;
    gitAuthor: GitAuthor;
    gitSettings: GitSettings;

    // Browser workspace
    isBrowserWorkspace: boolean;
    browserWorkspaces: BrowserWorkspace[];

    // Operation state
    isGitOperationInProgress: boolean;
    currentGitOperation: 'clone' | 'push' | 'pull' | 'fetch' | 'commit' | null;
    gitOperationProgress: number;
    gitOperationError: string | null;

    // Setters
    SetRepoInitialized: (initialized: boolean) => void;
    SetCurrentBranch: (branch: string) => void;
    SetBranches: (branches: GitBranch[]) => void;
    SetRemotes: (remotes: GitRemote[]) => void;
    SetGitStatus: (status: GitStatus | null) => void;
    SetCommitLog: (commits: GitCommit[]) => void;
    SetGitCredentials: (credentials: GitCredentials | null) => void;
    SetGitAuthor: (author: GitAuthor) => void;
    UpdateGitSettings: (settings: Partial<GitSettings>) => void;
    SetIsBrowserWorkspace: (isBrowser: boolean) => void;
    AddBrowserWorkspace: (workspace: BrowserWorkspace) => void;
    RemoveBrowserWorkspace: (id: string) => void;
    SetGitOperationInProgress: (inProgress: boolean) => void;
    SetCurrentGitOperation: (operation: 'clone' | 'push' | 'pull' | 'fetch' | 'commit' | null) => void;
    SetGitOperationProgress: (progress: number) => void;
    SetGitOperationError: (error: string | null) => void;

    // Persistence
    LoadGitState: () => void;
    SaveGitState: () => void;

    // Blame
    blameData: BlameInfo[];
    blameVisible: boolean;
    SetBlameData: (data: BlameInfo[]) => void;
    SetBlameVisible: (visible: boolean) => void;

    // Stash
    stashes: StashEntry[];
    SetStashes: (stashes: StashEntry[]) => void;

    // Merge conflicts
    conflicts: ConflictRegion[];
    SetConflicts: (conflicts: ConflictRegion[]) => void;

    // Convenience
    GetStagedFileCount: () => number;
    GetChangedFileCount: () => number;
}

export const createGitSlice: StateCreator<NotemacGitSlice> = (set, get) => ({
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

    blameData: [],
    blameVisible: false,
    stashes: [],
    conflicts: [],

    SetRepoInitialized: (initialized) => set({ isRepoInitialized: initialized }),
    SetCurrentBranch: (branch) => set({ currentBranch: branch }),
    SetBranches: (branches) => set({ branches }),
    SetRemotes: (remotes) => set({ remotes }),
    SetGitStatus: (status) => set({ gitStatus: status }),
    SetCommitLog: (commits) => set({ commitLog: commits }),

    SetGitCredentials: (credentials) =>
    {
        set({ gitCredentials: credentials });
        if (null !== credentials)
            SetValue(DB_GIT_CREDENTIALS, { type: credentials.type, username: credentials.username });
        else
            SetValue(DB_GIT_CREDENTIALS, null);
    },

    SetGitAuthor: (author) =>
    {
        set({ gitAuthor: author });
        SetValue(DB_GIT_AUTHOR, author);
    },

    UpdateGitSettings: (newSettings) =>
    {
        set(produce((state: NotemacGitSlice) =>
        {
            Object.assign(state.gitSettings, newSettings);
        }));
        const updated = get().gitSettings;
        SetValue(DB_GIT_SETTINGS, updated);
    },

    SetIsBrowserWorkspace: (isBrowser) => set({ isBrowserWorkspace: isBrowser }),

    AddBrowserWorkspace: (workspace) =>
    {
        set(produce((state: NotemacGitSlice) =>
        {
            // Deduplicate: update existing workspace or add new
            const existingIdx = state.browserWorkspaces.findIndex(w => w.id === workspace.id);
            if (-1 !== existingIdx)
                state.browserWorkspaces[existingIdx] = workspace;
            else
                state.browserWorkspaces.push(workspace);
        }));
        SetValue(DB_BROWSER_WORKSPACES, get().browserWorkspaces);
    },

    RemoveBrowserWorkspace: (id) =>
    {
        set(produce((state: NotemacGitSlice) =>
        {
            const idx = state.browserWorkspaces.findIndex(w => w.id === id);
            if (-1 !== idx)
                state.browserWorkspaces.splice(idx, 1);
        }));
        SetValue(DB_BROWSER_WORKSPACES, get().browserWorkspaces);
    },

    SetGitOperationInProgress: (inProgress) => set({ isGitOperationInProgress: inProgress }),
    SetCurrentGitOperation: (operation) => set({ currentGitOperation: operation }),
    SetGitOperationProgress: (progress) => set({ gitOperationProgress: progress }),
    SetGitOperationError: (error) => set({ gitOperationError: error }),

    LoadGitState: () =>
    {
        const savedCreds = GetValue<GitCredentials>(DB_GIT_CREDENTIALS);
        const savedAuthor = GetValue<GitAuthor>(DB_GIT_AUTHOR);
        const savedSettings = GetValue<GitSettings>(DB_GIT_SETTINGS);
        const savedWorkspaces = GetValue<BrowserWorkspace[]>(DB_BROWSER_WORKSPACES);

        set({
            gitCredentials: savedCreds || null,
            gitAuthor: savedAuthor || GetDefaultGitAuthor(),
            gitSettings: savedSettings || GetDefaultGitSettings(),
            browserWorkspaces: savedWorkspaces || [],
        });
    },

    SaveGitState: () =>
    {
        const state = get();
        if (null !== state.gitCredentials)
            SetValue(DB_GIT_CREDENTIALS, { type: state.gitCredentials.type, username: state.gitCredentials.username });
        SetValue(DB_GIT_AUTHOR, state.gitAuthor);
        SetValue(DB_GIT_SETTINGS, state.gitSettings);
        SetValue(DB_BROWSER_WORKSPACES, state.browserWorkspaces);
    },

    SetBlameData: (data) => set({ blameData: data }),
    SetBlameVisible: (visible) => set({ blameVisible: visible }),
    SetStashes: (stashes) => set({ stashes }),
    SetConflicts: (conflicts) => set({ conflicts }),

    GetStagedFileCount: () => get().gitStatus?.stagedFiles.length || 0,
    GetChangedFileCount: () =>
    {
        const status = get().gitStatus;
        if (null === status)
            return 0;
        return status.stagedFiles.length + status.unstagedFiles.length + status.untrackedFiles.length;
    },
});
