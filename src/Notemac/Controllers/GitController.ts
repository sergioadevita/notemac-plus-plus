import git, { type FsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { useNotemacStore } from "../Model/Store";
import type { GitBranch, GitCommit, GitStatus, GitFileStatus, GitRemote, GitCredentials } from "../Commons/Types";
import { GIT_COMMIT_FETCH_LIMIT, GIT_DEFAULT_CORS_PROXY } from "../Commons/Constants";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import { DetectFsBackend, GetFsForGit, GetDirHandle, RegisterDirHandle, CreateLightningFsAdapter } from '../../Shared/Git/GitFileSystemAdapter';

// ─── Helpers ─────────────────────────────────────────────────────

function GetStore()
{
    return useNotemacStore.getState();
}

// Cached filesystem and directory — invalidated when workspace changes
let cachedFs: FsClient | null = null;
let cachedFsInitialized = false;
let cachedDir: string | null = null;
let cachedWorkspacePath: string | null = null;

/**
 * Invalidates the cached fs and dir. Call when workspace changes.
 */
export function InvalidateFsCache(): void
{
    cachedFs = null;
    cachedFsInitialized = false;
    cachedDir = null;
    cachedWorkspacePath = null;
}

function GetFs(): FsClient | null
{
    const store = GetStore();
    const currentPath = store.workspacePath || '';

    // Return cached if workspace hasn't changed
    if (cachedFsInitialized && currentPath === cachedWorkspacePath)
        return cachedFs;

    cachedWorkspacePath = currentPath;
    const backend = DetectFsBackend();

    if ('electron' === backend)
    {
        cachedFs = null;
        cachedFsInitialized = true;
        return null;
    }

    if ('webfs' === backend)
    {
        const handle = GetDirHandle(currentPath);
        if (handle)
        {
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

function GetCorsProxy(): string
{
    return GetStore().gitSettings.corsProxy || GIT_DEFAULT_CORS_PROXY;
}

function BuildOnAuth(credentials?: GitCredentials | null): (() => { username: string; password: string }) | undefined
{
    const creds = credentials || GetStore().gitCredentials;
    if (null === creds || undefined === creds)
        return undefined;

    return () => ({
        username: creds.username || creds.token || '',
        password: creds.token || '',
    });
}

function GetDir(): string
{
    const currentPath = GetStore().workspacePath || '';
    if (null !== cachedDir && currentPath === cachedWorkspacePath)
        return cachedDir;

    const backend = DetectFsBackend();
    // For web fs adapter, the dir is always '/' (relative to the root handle)
    if ('webfs' === backend)
    {
        cachedDir = '/';
        return '/';
    }
    // For lightning-fs, use the workspace path
    cachedDir = currentPath || '/';
    return cachedDir;
}

// ─── Status Matrix Parsing ───────────────────────────────────────

function ParseStatusMatrix(matrix: [string, number, number, number][]): GitStatus
{
    const stagedFiles: GitFileStatus[] = [];
    const unstagedFiles: GitFileStatus[] = [];
    const untrackedFiles: GitFileStatus[] = [];

    const maxCount = matrix.length;
    for (let i = 0; i < maxCount; i++)
    {
        const [filepath, headStatus, workdirStatus, stageStatus] = matrix[i];

        // Untracked: not in HEAD, not staged, in workdir
        if (0 === headStatus && 2 === workdirStatus && 0 === stageStatus)
        {
            untrackedFiles.push({ path: filepath, status: 'untracked', isStaged: false });
            continue;
        }

        // Staged additions
        if (0 === headStatus && 2 === workdirStatus && 2 === stageStatus)
        {
            stagedFiles.push({ path: filepath, status: 'added', isStaged: true });
            continue;
        }
        if (0 === headStatus && 0 === workdirStatus && 2 === stageStatus)
        {
            stagedFiles.push({ path: filepath, status: 'added', isStaged: true });
            continue;
        }

        // Staged modification
        if (1 === headStatus && 2 === workdirStatus && 2 === stageStatus)
        {
            // Modified in both index and workdir — but same content
            stagedFiles.push({ path: filepath, status: 'modified', isStaged: true });
            continue;
        }

        // Staged modification with additional workdir changes
        if (1 === headStatus && 2 === workdirStatus && 3 === stageStatus)
        {
            stagedFiles.push({ path: filepath, status: 'modified', isStaged: true });
            unstagedFiles.push({ path: filepath, status: 'modified', isStaged: false });
            continue;
        }

        // Unstaged modification
        if (1 === headStatus && 2 === workdirStatus && 1 === stageStatus)
        {
            unstagedFiles.push({ path: filepath, status: 'modified', isStaged: false });
            continue;
        }

        // Staged deletion
        if (1 === headStatus && 0 === workdirStatus && 0 === stageStatus)
        {
            stagedFiles.push({ path: filepath, status: 'deleted', isStaged: true });
            continue;
        }

        // Unstaged deletion
        if (1 === headStatus && 0 === workdirStatus && 1 === stageStatus)
        {
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

// ─── Core Git Operations ─────────────────────────────────────────

/**
 * Detects if the current workspace is a git repository.
 */
export async function DetectGitRepo(): Promise<boolean>
{
    const fs = GetFs();
    if (null === fs)
        return false;

    try
    {
        const dir = GetDir();
        await git.findRoot({ fs, filepath: dir });
        return true;
    }
    catch
    {
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
export async function InitGitForWorkspace(dirHandle?: FileSystemDirectoryHandle): Promise<void>
{
    const store = GetStore();

    // Register directory handle for web FS if provided
    if (dirHandle)
    {
        const workspacePath = store.workspacePath || dirHandle.name;
        RegisterDirHandle(workspacePath, dirHandle);
    }

    // Always invalidate cache when (re)initializing
    InvalidateFsCache();

    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        const isRepo = await DetectGitRepo();
        store.SetRepoInitialized(isRepo);

        if (isRepo)
        {
            await RefreshGitStatus();
            await RefreshBranches();
            await FetchCommitLog();
        }
    }
    catch
    {
        store.SetRepoInitialized(false);
    }
}

/**
 * Initialize a new git repository in the workspace.
 */
export async function InitializeRepository(): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        store.SetGitOperationInProgress(true);
        store.SetGitOperationError(null);

        await git.init({ fs, dir: GetDir(), defaultBranch: 'main' });
        store.SetRepoInitialized(true);
        store.SetCurrentBranch('main');

        await RefreshGitStatus();
        Dispatch(NOTEMAC_EVENTS.GIT_STATUS_CHANGED);
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
    finally
    {
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
): Promise<void>
{
    const store = GetStore();

    try
    {
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
            onProgress: (progress) =>
            {
                if (progress.total)
                    store.SetGitOperationProgress(Math.round((progress.loaded / progress.total) * 100));
            },
        });

        store.SetRepoInitialized(true);
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'clone' });
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally
    {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        store.SetGitOperationProgress(0);
    }
}

/**
 * Refresh git status for the current workspace.
 */
export async function RefreshGitStatus(): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs || !store.isRepoInitialized)
        return;

    try
    {
        const dir = GetDir();

        // Get current branch
        try
        {
            const branch = await git.currentBranch({ fs, dir, fullname: false }) || 'HEAD';
            store.SetCurrentBranch(branch);
        }
        catch
        {
            // Detached HEAD or empty repo
        }

        // Get status matrix
        const matrix = await git.statusMatrix({ fs, dir });
        const status = ParseStatusMatrix(matrix);
        status.branch = store.currentBranch;

        store.SetGitStatus(status);
        Dispatch(NOTEMAC_EVENTS.GIT_STATUS_CHANGED);
    }
    catch (error: unknown)
    {
        store.SetGitStatus(null);
    }
}

/**
 * Stage a file.
 */
export async function StageFile(filepath: string): Promise<void>
{
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        await git.add({ fs, dir: GetDir(), filepath });
        await RefreshGitStatus();
    }
    catch (error: unknown)
    {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Stage all changed files.
 */
export async function StageAllFiles(): Promise<void>
{
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
export async function UnstageFile(filepath: string): Promise<void>
{
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        await git.resetIndex({ fs, dir: GetDir(), filepath });
        await RefreshGitStatus();
    }
    catch (error: unknown)
    {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Discard changes to a file (restore from HEAD).
 */
export async function DiscardFileChanges(filepath: string): Promise<void>
{
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        await git.checkout({ fs, dir: GetDir(), filepaths: [filepath], force: true });
        await RefreshGitStatus();
    }
    catch (error: unknown)
    {
        GetStore().SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Create a commit.
 */
export async function CreateCommit(message: string): Promise<string>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        throw new Error('No filesystem available');

    try
    {
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

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'commit', oid });

        return oid;
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally
    {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
    }
}

/**
 * Push to remote.
 */
export async function PushToRemote(remote: string = 'origin'): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
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
            onProgress: (progress) =>
            {
                if (progress.total)
                    store.SetGitOperationProgress(Math.round((progress.loaded / progress.total) * 100));
            },
        });

        await RefreshGitStatus();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'push' });
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally
    {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        store.SetGitOperationProgress(0);
    }
}

/**
 * Pull from remote (fetch + fast-forward merge).
 */
export async function PullFromRemote(remote: string = 'origin'): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
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

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'pull' });
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally
    {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
        store.SetGitOperationProgress(0);
    }
}

/**
 * Fetch from remote.
 */
export async function FetchFromRemote(remote: string = 'origin'): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
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

        await RefreshBranches();
        Dispatch(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, { operation: 'fetch' });
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
    finally
    {
        store.SetGitOperationInProgress(false);
        store.SetCurrentGitOperation(null);
    }
}

/**
 * Checkout a branch.
 */
export async function CheckoutBranch(branchName: string): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        store.SetGitOperationError(null);

        await git.checkout({ fs, dir: GetDir(), ref: branchName });
        store.SetCurrentBranch(branchName);

        await RefreshGitStatus();
        await FetchCommitLog();
        Dispatch(NOTEMAC_EVENTS.GIT_BRANCH_CHANGED, { branch: branchName });
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Create a new branch.
 */
export async function CreateBranch(branchName: string, checkout: boolean = true): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        store.SetGitOperationError(null);

        await git.branch({ fs, dir: GetDir(), ref: branchName });

        if (checkout)
            await CheckoutBranch(branchName);
        else
            await RefreshBranches();
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Delete a branch.
 */
export async function DeleteBranch(branchName: string): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        store.SetGitOperationError(null);

        await git.deleteBranch({ fs, dir: GetDir(), ref: branchName });
        await RefreshBranches();
    }
    catch (error: unknown)
    {
        store.SetGitOperationError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * List all branches.
 */
export async function RefreshBranches(): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
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
        try
        {
            const remoteBranches = await git.listBranches({ fs, dir, remote: 'origin' });
            for (const name of remoteBranches)
            {
                branches.push({
                    name: `origin/${name}`,
                    isRemote: true,
                    isCurrentBranch: false,
                    lastCommitOid: '',
                });
            }
        }
        catch
        {
            // No remote configured
        }

        store.SetBranches(branches);

        // List remotes
        try
        {
            const remoteNames = await git.listRemotes({ fs, dir });
            const remotes: GitRemote[] = remoteNames.map(r => ({
                name: r.remote,
                url: r.url,
            }));
            store.SetRemotes(remotes);
        }
        catch
        {
            store.SetRemotes([]);
        }
    }
    catch
    {
        // Silently fail
    }
}

/**
 * Fetch commit log.
 */
export async function FetchCommitLog(limit: number = GIT_COMMIT_FETCH_LIMIT): Promise<void>
{
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try
    {
        const dir = GetDir();
        const logs = await git.log({ fs, dir, depth: limit });

        const commits: GitCommit[] = logs.map(entry => ({
            oid: entry.oid,
            message: entry.commit.message,
            author: {
                name: entry.commit.author.name,
                email: entry.commit.author.email,
            },
            timestamp: entry.commit.author.timestamp,
        }));

        store.SetCommitLog(commits);
    }
    catch
    {
        store.SetCommitLog([]);
    }
}

/**
 * Get file content at HEAD for diff comparison.
 */
export async function GetFileAtHead(filepath: string): Promise<string | null>
{
    const fs = GetFs();
    if (null === fs)
        return null;

    try
    {
        const dir = GetDir();
        const commitOid = await git.resolveRef({ fs, dir, ref: 'HEAD' });
        const { blob } = await git.readBlob({
            fs,
            dir,
            oid: commitOid,
            filepath,
        });

        return new TextDecoder().decode(blob);
    }
    catch
    {
        return null;
    }
}

/**
 * Build a summary of staged changes suitable for AI commit message generation.
 */
export async function GetStagedDiff(): Promise<string>
{
    const store = GetStore();
    const gitStatus = store.gitStatus;
    if (null === gitStatus || 0 === gitStatus.stagedFiles.length)
        return '';

    const parts: string[] = [];
    const maxFiles = gitStatus.stagedFiles.length;

    for (let i = 0; i < maxFiles; i++)
    {
        const file = gitStatus.stagedFiles[i];
        parts.push(`${file.status}: ${file.path}`);

        // Try to get a diff for modified files
        if ('modified' === file.status)
        {
            const headContent = await GetFileAtHead(file.path);
            if (null !== headContent)
            {
                // Simple line-based diff summary (not full unified diff)
                const headLines = headContent.split('\n');
                const currentLines = (store.tabs.find(t => t.path?.endsWith(file.path))?.content || '').split('\n');

                const added = currentLines.length - headLines.length;
                if (0 !== added)
                    parts.push(`  (${0 < added ? '+' : ''}${added} lines)`);
            }
        }
    }

    return parts.join('\n');
}

// ─── Auto-fetch Timer ────────────────────────────────────────────

let autoFetchTimer: ReturnType<typeof setInterval> | null = null;

export function StartAutoFetch(): void
{
    StopAutoFetch();
    const settings = GetStore().gitSettings;

    if (!settings.autoFetch)
        return;

    autoFetchTimer = setInterval(() =>
    {
        const store = GetStore();
        if (store.isRepoInitialized && !store.isGitOperationInProgress)
            FetchFromRemote().catch(() => {});
    }, settings.autoFetchInterval);
}

export function StopAutoFetch(): void
{
    if (null !== autoFetchTimer)
    {
        clearInterval(autoFetchTimer);
        autoFetchTimer = null;
    }
}
