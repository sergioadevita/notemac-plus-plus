import git, { type FsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { useNotemacStore } from "../../Model/Store";
import type { GitCredentials } from "../../Commons/Types";
import { GIT_DEFAULT_CORS_PROXY } from "../../Commons/Constants";
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { DetectFsBackend, GetFsForGit, GetDirHandle, RegisterDirHandle, CreateLightningFsAdapter } from '../../../Shared/Git/GitFileSystemAdapter';

// Cached filesystem and directory — invalidated when workspace changes
let cachedFs: FsClient | null = null;
let cachedFsInitialized = false;
let cachedDir: string | null = null;
let cachedWorkspacePath: string | null = null;

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Invalidates the cached fs and dir. Call when workspace changes.
 */
export function InvalidateFsCache(): void {
    cachedFs = null;
    cachedFsInitialized = false;
    cachedDir = null;
    cachedWorkspacePath = null;
}

export function GetFs(): FsClient | null {
    const store = GetStore();
    const currentPath = store.workspacePath || '';

    // Return cached if workspace hasn't changed
    if (cachedFsInitialized && currentPath === cachedWorkspacePath)
        return cachedFs;

    cachedWorkspacePath = currentPath;
    const backend = DetectFsBackend();

    if ('electron' === backend) {
        cachedFs = null;
        cachedFsInitialized = true;
        return null;
    }

    if ('webfs' === backend) {
        const handle = GetDirHandle(currentPath);
        if (handle) {
            cachedFs = GetFsForGit(currentPath, handle);
            cachedFsInitialized = true;
            return cachedFs;
        }
    }

    // Fallback: lightning-fs
    cachedFs = CreateLightningFsAdapter(currentPath || 'notemac-default');
    cachedFsInitialized = true;
    return cachedFs;
}

export function GetDir(): string {
    const currentPath = GetStore().workspacePath || '';
    if (null !== cachedDir && currentPath === cachedWorkspacePath)
        return cachedDir;

    const backend = DetectFsBackend();
    // For web fs adapter, the dir is always '/' (relative to the root handle)
    if ('webfs' === backend) {
        cachedDir = '/';
        return '/';
    }
    // For lightning-fs, use the workspace path
    cachedDir = currentPath || '/';
    return cachedDir;
}

function GetCorsProxy(): string {
    return GetStore().gitSettings.corsProxy || GIT_DEFAULT_CORS_PROXY;
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
 * Detects if the current workspace is a git repository.
 */
export async function DetectGitRepo(): Promise<boolean> {
    const fs = GetFs();
    if (null === fs)
        return false;

    try {
        const dir = GetDir();
        await git.findRoot({ fs, filepath: dir });
        return true;
    }
    catch {
        return false;
    }
}

/**
 * Initializes the git integration for the current workspace.
 * Detects repo, loads branches, status, and commit log.
 *
 * @param dirHandle - Optional FileSystemDirectoryHandle for web File System Access API.
 *                    When provided, registers the handle so the git fs adapter can access real files.
 */
export async function InitGitForWorkspace(dirHandle?: FileSystemDirectoryHandle): Promise<void> {
    const store = GetStore();

    // Register directory handle for web FS if provided
    if (dirHandle) {
        const workspacePath = store.workspacePath || dirHandle.name;
        RegisterDirHandle(workspacePath, dirHandle);
    }

    // Always invalidate cache when (re)initializing
    InvalidateFsCache();

    const fs = GetFs();
    if (null === fs)
        return;

    try {
        const isRepo = await DetectGitRepo();
        store.SetRepoInitialized(isRepo);

        if (isRepo) {
            const { RefreshGitStatus } = await import('./GitStatusController');
            const { RefreshBranches } = await import('./GitBranchController');
            const { FetchCommitLog } = await import('./GitLogController');

            await RefreshGitStatus();
            await RefreshBranches();
            await FetchCommitLog();
        }
    }
    catch {
        store.SetRepoInitialized(false);
    }
}

/**
 * Initialize a new git repository in the workspace.
 */
export async function InitializeRepository(): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        store.SetGitOperationInProgress(true);
        store.SetGitOperationError(null);

        await git.init({ fs, dir: GetDir(), defaultBranch: 'main' });
        store.SetRepoInitialized(true);
        store.SetCurrentBranch('main');

        const { RefreshGitStatus } = await import('./GitStatusController');
        await RefreshGitStatus();
        Dispatch(NOTEMAC_EVENTS.GIT_STATUS_CHANGED);
    }
    catch (error: unknown) {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
    finally {
        store.SetGitOperationInProgress(false);
    }
}

/**
 * Clone a repository.
 */
export async function CloneRepository(
    repoUrl: string,
    fs: FsClient,
    dir: string,
    credentials?: GitCredentials | null,
): Promise<void> {
    const store = GetStore();

    try {
        store.SetGitOperationInProgress(true);
        store.SetCurrentGitOperation('clone');
        store.SetGitOperationProgress(0);
        store.SetGitOperationError(null);

        await git.clone({
            fs,
            http,
            dir,
            url: repoUrl,
            corsProxy: GetCorsProxy(),
            singleBranch: true,
            depth: 1,
            onAuth: BuildOnAuth(credentials),
            onProgress: (progress) => {
                if (progress.total)
                    store.SetGitOperationProgress(Math.round((progress.loaded / progress.total) * 100));
            },
        });

        store.SetRepoInitialized(true);
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'clone' });
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
