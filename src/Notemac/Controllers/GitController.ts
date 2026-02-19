/**
 * GitController.ts — Backward-Compatible Re-exports
 *
 * This file maintains backward compatibility by re-exporting all git operations
 * from the focused sub-modules in the Git/ directory. Existing code that imports
 * from GitController will continue to work without modification.
 */

export {
    InvalidateFsCache,
    GetFs,
    GetDir,
    DetectGitRepo,
    InitGitForWorkspace,
    InitializeRepository,
    CloneRepository,
} from './Git/GitInitController';

export {
    RefreshGitStatus,
    StageFile,
    StageAllFiles,
    UnstageFile,
    DiscardFileChanges,
} from './Git/GitStatusController';

export {
    CreateCommit,
} from './Git/GitCommitController';

export {
    CheckoutBranch,
    CreateBranch,
    DeleteBranch,
    RefreshBranches,
} from './Git/GitBranchController';

export {
    PushToRemote,
    PullFromRemote,
    FetchFromRemote,
    ListRemotes,
    AddRemote,
} from './Git/GitRemoteController';

export {
    FetchCommitLog,
    GetFileAtHead,
    GetStagedDiff,
} from './Git/GitLogController';

export {
    StartAutoFetch,
    StopAutoFetch,
} from './Git/GitAutoFetchController';
