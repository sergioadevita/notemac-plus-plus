import git from 'isomorphic-git';
import { useNotemacStore } from "../../Model/Store";
import type { GitStatus, GitFileStatus } from "../../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GetFs, GetDir } from './GitInitController';

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Parses the git status matrix and converts it to a GitStatus object.
 * Handles various file states: untracked, staged additions/modifications, unstaged changes, deletions.
 */
function ParseStatusMatrix(matrix: [string, number, number, number][]): GitStatus {
    const stagedFiles: GitFileStatus[] = [];
    const unstagedFiles: GitFileStatus[] = [];
    const untrackedFiles: GitFileStatus[] = [];

    const maxCount = matrix.length;
    for (let i = 0; i < maxCount; i++) {
        const [filepath, headStatus, workdirStatus, stageStatus] = matrix[i];

        // Untracked: not in HEAD, not staged, in workdir
        if (0 === headStatus && 2 === workdirStatus && 0 === stageStatus) {
            untrackedFiles.push({ path: filepath, status: 'untracked', isStaged: false });
            continue;
        }

        // Staged additions
        if (0 === headStatus && 2 === workdirStatus && 2 === stageStatus) {
            stagedFiles.push({ path: filepath, status: 'added', isStaged: true });
            continue;
        }
        if (0 === headStatus && 0 === workdirStatus && 2 === stageStatus) {
            stagedFiles.push({ path: filepath, status: 'added', isStaged: true });
            continue;
        }

        // Staged modification
        if (1 === headStatus && 2 === workdirStatus && 2 === stageStatus) {
            // Modified in both index and workdir — but same content
            stagedFiles.push({ path: filepath, status: 'modified', isStaged: true });
            continue;
        }

        // Staged modification with additional workdir changes
        if (1 === headStatus && 2 === workdirStatus && 3 === stageStatus) {
            stagedFiles.push({ path: filepath, status: 'modified', isStaged: true });
            unstagedFiles.push({ path: filepath, status: 'modified', isStaged: false });
            continue;
        }

        // Unstaged modification
        if (1 === headStatus && 2 === workdirStatus && 1 === stageStatus) {
            unstagedFiles.push({ path: filepath, status: 'modified', isStaged: false });
            continue;
        }

        // Staged deletion
        if (1 === headStatus && 0 === workdirStatus && 0 === stageStatus) {
            stagedFiles.push({ path: filepath, status: 'deleted', isStaged: true });
            continue;
        }

        // Unstaged deletion
        if (1 === headStatus && 0 === workdirStatus && 1 === stageStatus) {
            unstagedFiles.push({ path: filepath, status: 'deleted', isStaged: false });
            continue;
        }
    }

    return {
        branch: GetStore().currentBranch,
        isRepoDirty: 0 < stagedFiles.length + unstagedFiles.length + untrackedFiles.length,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
        aheadBy: 0,
        behindBy: 0,
        mergeInProgress: false,
    };
}

/**
 * Refresh git status for the current workspace.
 * Updates the store with current branch, staged/unstaged/untracked files.
 */
export async function RefreshGitStatus(): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs || !store.isRepoInitialized)
        return;

    try {
        const dir = GetDir();

        // Get current branch
        try {
            const branch = await git.currentBranch({ fs, dir, fullname: false }) || 'HEAD';
            store.SetCurrentBranch(branch);
        }
        catch {
            // Detached HEAD or empty repo
        }

        // Get status matrix
        const matrix = await git.statusMatrix({ fs, dir });
        const status = ParseStatusMatrix(matrix);
        status.branch = store.currentBranch;

        store.SetGitStatus(status);
        Dispatch(NOTEMAC_EVENTS.GIT_STATUS_CHANGED);
    }
    catch (error: unknown) {
        store.SetGitStatus(null);
    }
}

/**
 * Stage a file.
 */
export async function StageFile(filepath: string): Promise<void> {
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        await git.add({ fs, dir: GetDir(), filepath });
        await RefreshGitStatus();
    }
    catch (error: unknown) {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Stage all changed files (both unstaged modifications and untracked files).
 */
export async function StageAllFiles(): Promise<void> {
    const store = GetStore();
    const status = store.gitStatus;
    if (null === status)
        return;

    const fs = GetFs();
    if (null === fs)
        return;

    const dir = GetDir();
    const filesToStage = [
        ...status.unstagedFiles.map(f => f.path),
        ...status.untrackedFiles.map(f => f.path),
    ];

    // Batch stage all files concurrently
    await Promise.allSettled(
        filesToStage.map(filepath => git.add({ fs, dir, filepath }))
    );

    await RefreshGitStatus();
}

/**
 * Unstage a file.
 */
export async function UnstageFile(filepath: string): Promise<void> {
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        await git.resetIndex({ fs, dir: GetDir(), filepath });
        await RefreshGitStatus();
    }
    catch (error: unknown) {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Discard changes to a file (restore from HEAD).
 */
export async function DiscardFileChanges(filepath: string): Promise<void> {
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        await git.checkout({ fs, dir: GetDir(), filepaths: [filepath], force: true });
        await RefreshGitStatus();
    }
    catch (error: unknown) {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}
