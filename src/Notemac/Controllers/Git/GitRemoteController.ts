import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { useNotemacStore } from "../../Model/Store";
import type { GitCredentials } from "../../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GetFs, GetDir } from './GitInitController';

function GetStore() {
    return useNotemacStore.getState();
}

function GetCorsProxy(): string {
    const store = GetStore();
    const { GIT_DEFAULT_CORS_PROXY } = require("../../Commons/Constants");
    return store.gitSettings.corsProxy || GIT_DEFAULT_CORS_PROXY;
}

function BuildOnAuth(credentials?: GitCredentials | null): (() => { username: string; password: string }) | undefined {
    const creds = credentials || GetStore().gitCredentials;
    if (null === creds || undefined === creds)
        return undefined;

    return () => ({
        username: creds.username || creds.token || '',
        password: creds.token || '',
    });
}

/**
 * Push to remote.
 * Sends local commits to the configured remote repository.
 */
export async function PushToRemote(remote: string = 'origin'): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('push');
        store.SetGitOperationError(null);

        await git.push({
            fs,
            http,
            dir: GetDir(),
            remote,
            ref: store.currentBranch,
            corsProxy: GetCorsProxy(),
            onAuth: BuildOnAuth(),
            onProgress: (progress) => {
                if (progress.total)
                    store.SetGitOperationProgress(Math.round((progress.loaded / progress.total) * 100));
            },
        });

        const { RefreshGitStatus } = await import('./GitStatusController');
        await RefreshGitStatus();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'push' });
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        store.SetGitOperationProgress(0);
    }
}

/**
 * Pull from remote (fetch + fast-forward merge).
 * Retrieves remote changes and merges them into the current branch.
 */
export async function PullFromRemote(_remote: string = 'origin'): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('pull');
        store.SetGitOperationError(null);

        await git.pull({
            fs,
            http,
            dir: GetDir(),
            ref: store.currentBranch,
            singleBranch: true,
            corsProxy: GetCorsProxy(),
            onAuth: BuildOnAuth(),
            author: {
                name: store.gitAuthor.name,
                email: store.gitAuthor.email,
            },
        });

        const { RefreshGitStatus } = await import('./GitStatusController');
        const { FetchCommitLog } = await import('./GitLogController');

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'pull' });
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        store.SetGitOperationProgress(0);
    }
}

/**
 * Fetch from remote.
 * Retrieves remote changes without merging them.
 */
export async function FetchFromRemote(remote: string = 'origin'): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('fetch');
        store.SetGitOperationError(null);

        await git.fetch({
            fs,
            http,
            dir: GetDir(),
            remote,
            corsProxy: GetCorsProxy(),
            onAuth: BuildOnAuth(),
        });

        const { RefreshBranches } = await import('./GitBranchController');
        await RefreshBranches();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'fetch' });
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
    finally {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
    }
}

/**
 * List remotes.
 * (Handled in GitBranchController.RefreshBranches, included here for completeness)
 */
export async function ListRemotes(): Promise<Array<{ name: string; url: string }>> {
    const fs = GetFs();
    if (null === fs)
        return [];

    try {
        const remotes = await git.listRemotes({ fs, dir: GetDir() });
        return remotes.map(r => ({
            name: r.remote,
            url: r.url,
        }));
    }
    catch {
        return [];
    }
}

/**
 * Add a remote.
 */
export async function AddRemote(name: string, _url: string): Promise<void> {
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        await git.addRemote({ fs, dir: GetDir(), remote: name, url: _url });
        const { RefreshBranches } = await import('./GitBranchController');
        await RefreshBranches();
    }
    catch (error: unknown) {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}
