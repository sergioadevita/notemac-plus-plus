import git from 'isomorphic-git';
import { useNotemacStore } from "../../Model/Store";
import type { GitBranch, GitRemote } from "../../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GetFs, GetDir } from './GitInitController';

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Checkout a branch.
 * Updates the current branch and refreshes status and commit log.
 */
export async function CheckoutBranch(branchName: string): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationError(null);

        await git.checkout({ fs, dir: GetDir(), ref: branchName });
        store.SetCurrentBranch(branchName);

        const { RefreshGitStatus } = await import('./GitStatusController');
        const { FetchCommitLog } = await import('./GitLogController');

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_BRANCH_CHANGED, { branch: branchName });
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Create a new branch.
 * Optionally checks out the branch after creation.
 */
export async function CreateBranch(branchName: string, checkout: boolean = true): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationError(null);

        await git.branch({ fs, dir: GetDir(), ref: branchName });

        if (checkout)
            await CheckoutBranch(branchName);
        else
            await RefreshBranches();
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Delete a branch.
 */
export async function DeleteBranch(branchName: string): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationError(null);

        await git.deleteBranch({ fs, dir: GetDir(), ref: branchName });
        await RefreshBranches();
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Refresh branch list and remotes.
 * Loads both local and remote branches, and updates the list of configured remotes.
 */
export async function RefreshBranches(): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        const dir = GetDir();
        const localBranches = await git.listBranches({ fs, dir });
        const currentBranch = store.currentBranch;

        const branches: GitBranch[] = localBranches.map(name => ({
            name,
            isRemote: false,
            isCurrentBranch: name === currentBranch,
            lastCommitOid: '',
        }));

        // Try remote branches
        try {
            const remoteBranches = await git.listBranches({ fs, dir, remote: 'origin' });
            for (const name of remoteBranches) {
                branches.push({
                    name: `origin/${name}`,
                    isRemote: true,
                    isCurrentBranch: false,
                    lastCommitOid: '',
                });
            }
        }
        catch {
            // No remote configured
        }

        store.SetBranches(branches);

        // List remotes
        try {
            const remoteNames = await git.listRemotes({ fs, dir });
            const remotes: GitRemote[] = remoteNames.map(r => ({
                name: r.remote,
                url: r.url,
            }));
            store.SetRemotes(remotes);
        }
        catch {
            store.SetRemotes([]);
        }
    }
    catch {
        // Silently fail
    }
}
