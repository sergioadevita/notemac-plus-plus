/**
 * Git Controller Module
 *
 * This module provides a comprehensive set of git operations through focused sub-modules:
 * - GitInitController: Repository initialization and detection
 * - GitStatusController: File status tracking and staging operations
 * - GitCommitController: Commit creation and management
 * - GitBranchController: Branch operations
 * - GitRemoteController: Remote operations (push, pull, fetch)
 * - GitLogController: Commit history and file diffing
 * - GitAutoFetchController: Automatic fetch scheduling
 */

export {
    InvalidateFsCache,
    GetFs,
    GetDir,
    DetectGitRepo,
    InitGitForWorkspace,
    InitializeRepository,
    CloneRepository,
} from './GitInitController';

export {
    RefreshGitStatus,
    StageFile,
    StageAllFiles,
    UnstageFile,
    DiscardFileChanges,
} from './GitStatusController';

export {
    CreateCommit,
} from './GitCommitController';

export {
    CheckoutBranch,
    CreateBranch,
    DeleteBranch,
    RefreshBranches,
} from './GitBranchController';

export {
    PushToRemote,
    PullFromRemote,
    FetchFromRemote,
    ListRemotes,
    AddRemote,
} from './GitRemoteController';

export {
    FetchCommitLog,
    GetFileAtHead,
    GetStagedDiff,
} from './GitLogController';

export {
    StartAutoFetch,
    StopAutoFetch,
} from './GitAutoFetchController';
