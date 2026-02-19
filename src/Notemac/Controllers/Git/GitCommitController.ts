import git from 'isomorphic-git';
import { useNotemacStore } from "../../Model/Store";
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GetFs, GetDir } from './GitInitController';

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Create a commit with the staged changes.
 * Updates the store with operation progress and status.
 */
export async function CreateCommit(message: string): Promise<string> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        throw new Error('No filesystem available');

    try {
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('commit');
        store.SetGitOperationError(null);

        const author = store.gitAuthor;
        const oid = await git.commit({
            fs,
            dir: GetDir(),
            message,
            author: {
                name: author.name,
                email: author.email,
            },
        });

        const { RefreshGitStatus } = await import('./GitStatusController');
        const { FetchCommitLog } = await import('./GitLogController');

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'commit', oid });

        return oid;
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
    }
}
