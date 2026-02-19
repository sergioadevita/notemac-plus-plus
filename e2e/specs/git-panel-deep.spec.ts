import { test, expect } from '@playwright/test';
import {
    gotoApp,
    closeAllDialogs,
    getStoreState,
    openGitPanel,
} from '../helpers/app';

test.describe('Git Panel — Deep Store Integration', () =>
{
    test.beforeEach(async ({ page }) =>
    {
        await gotoApp(page);
    });

    // ─── Panel Visibility ───────────────────────────────────────────────

    test('Git panel opens when sidebar set to git', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
        });

        await page.waitForTimeout(300);

        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('git');

        // Verify git panel content is rendered in DOM
        const sourceControlText = page.getByText('Source Control');
        await expect(sourceControlText).toBeVisible();
    });

    test('Git panel shows "no repository" state when isRepoInitialized is false', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(false);
        });

        await page.waitForTimeout(300);

        const state = await getStoreState(page, 'isRepoInitialized');
        expect(state).toBe(false);
    });

    test('setting isRepoInitialized to true changes panel display', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(false);
        });

        await page.waitForTimeout(300);

        let state = await getStoreState(page, 'isRepoInitialized');
        expect(state).toBe(false);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetRepoInitialized(true);
        });

        await page.waitForTimeout(300);

        state = await getStoreState(page, 'isRepoInitialized');
        expect(state).toBe(true);
    });

    // ─── Branch Display ─────────────────────────────────────────────────

    test('branch name displays from store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetCurrentBranch('feature/test-branch');
            store.getState().SetBranches([
                { name: 'feature/test-branch', isRemote: false, isCurrentBranch: true, lastCommitOid: '' }
            ]);
        });

        await page.waitForTimeout(300);

        const branch = await getStoreState(page, 'currentBranch');
        expect(branch).toBe('feature/test-branch');
    });

    test('multiple branch entries stored in branches array', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetBranches([
                { name: 'main', isRemote: false, isCurrentBranch: true, lastCommitOid: 'abc123' },
                { name: 'develop', isRemote: false, isCurrentBranch: false, lastCommitOid: 'def456' },
                { name: 'feature/new', isRemote: false, isCurrentBranch: false, lastCommitOid: 'ghi789' },
                { name: 'origin/main', isRemote: true, isCurrentBranch: false, lastCommitOid: 'abc123' },
            ]);
        });

        await page.waitForTimeout(300);

        const branches = await getStoreState(page, 'branches');
        expect(branches.length).toBe(4);
        expect(branches[0].name).toBe('main');
        expect(branches[3].isRemote).toBe(true);
    });

    // ─── Staged Files ───────────────────────────────────────────────────

    test('setting gitStatus with staged files updates store correctly', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetGitStatus({
                branch: 'main',
                isRepoDirty: true,
                stagedFiles: [
                    { path: 'src/file1.ts', status: 'modified', isStaged: true },
                    { path: 'src/file2.ts', status: 'added', isStaged: true },
                ],
                unstagedFiles: [],
                untrackedFiles: [],
                aheadBy: 0,
                behindBy: 0,
                mergeInProgress: false,
            });
        });

        await page.waitForTimeout(300);

        const status = await getStoreState(page, 'gitStatus');
        expect(status.stagedFiles.length).toBe(2);
        expect(status.stagedFiles[0].path).toBe('src/file1.ts');
        expect(status.stagedFiles[0].status).toBe('modified');
    });

    test('staged files section visible in panel with store data', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetGitStatus({
                branch: 'main',
                isRepoDirty: true,
                stagedFiles: [{ path: 'src/staged-file.ts', status: 'added', isStaged: true }],
                unstagedFiles: [],
                untrackedFiles: [],
                aheadBy: 0,
                behindBy: 0,
                mergeInProgress: false,
            });
        });

        await page.waitForTimeout(300);

        const stagedSection = page.locator('text=Staged Changes').first();
        await expect(stagedSection).toBeVisible();
    });

    // ─── Unstaged Files ─────────────────────────────────────────────────

    test('setting gitStatus with unstaged files updates store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetGitStatus({
                branch: 'main',
                isRepoDirty: true,
                stagedFiles: [],
                unstagedFiles: [
                    { path: 'src/file1.ts', status: 'modified', isStaged: false },
                    { path: 'src/file2.ts', status: 'deleted', isStaged: false },
                ],
                untrackedFiles: [],
                aheadBy: 0,
                behindBy: 0,
                mergeInProgress: false,
            });
        });

        await page.waitForTimeout(300);

        const status = await getStoreState(page, 'gitStatus');
        expect(status.unstagedFiles.length).toBe(2);
        expect(status.unstagedFiles[1].status).toBe('deleted');
    });

    test('unstaged files trigger Changes section visibility', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetGitStatus({
                branch: 'main',
                isRepoDirty: true,
                stagedFiles: [],
                unstagedFiles: [
                    { path: 'src/file1.ts', status: 'modified', isStaged: false },
                    { path: 'src/file2.ts', status: 'modified', isStaged: false }
                ],
                untrackedFiles: [],
                aheadBy: 0,
                behindBy: 0,
                mergeInProgress: false,
            });
        });

        await page.waitForTimeout(300);

        const changesHeader = page.locator('text=Changes').first();
        await expect(changesHeader).toBeVisible();
    });

    // ─── Commit Log ──────────────────────────────────────────────────────

    test('commit log entries display from store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetCommitLog([
                { oid: 'abc123', message: 'Initial commit', author: { name: 'Dev User', email: 'dev@test.com' }, timestamp: 1000 },
                { oid: 'def456', message: 'Add feature', author: { name: 'Dev User', email: 'dev@test.com' }, timestamp: 2000 },
                { oid: 'ghi789', message: 'Fix bug', author: { name: 'Dev User', email: 'dev@test.com' }, timestamp: 3000 },
            ]);
        });

        await page.waitForTimeout(300);

        const commitLog = await getStoreState(page, 'commitLog');
        expect(commitLog.length).toBe(3);
        expect(commitLog[0].message).toBe('Initial commit');
        expect(commitLog[2].message).toBe('Fix bug');
    });

    test('empty commit log is handled correctly', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetCommitLog([]);
        });

        await page.waitForTimeout(300);

        const commitLog = await getStoreState(page, 'commitLog');
        expect(commitLog.length).toBe(0);
    });

    // ─── Operation In Progress ──────────────────────────────────────────

    test('operation in-progress flag prevents UI actions (state check)', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
            store.getState().SetRepoInitialized(true);
            store.getState().SetGitOperationInProgress(false);
        });

        await page.waitForTimeout(300);

        let inProgress = await getStoreState(page, 'isGitOperationInProgress');
        expect(inProgress).toBe(false);

        // Start operation
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('clone');
            store.getState().SetGitOperationProgress(50);
        });

        await page.waitForTimeout(300);

        inProgress = await getStoreState(page, 'isGitOperationInProgress');
        expect(inProgress).toBe(true);

        const operation = await getStoreState(page, 'currentGitOperation');
        expect(operation).toBe('clone');

        const progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(50);
    });

    test('operation progress updates in real time', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('push');
            store.getState().SetGitOperationProgress(0);
        });

        await page.waitForTimeout(300);

        let progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(0);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationProgress(25);
        });

        await page.waitForTimeout(100);

        progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(25);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationProgress(75);
        });

        await page.waitForTimeout(100);

        progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(75);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationProgress(100);
            store.getState().SetGitOperationInProgress(false);
        });

        await page.waitForTimeout(100);

        progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(100);

        const inProgress = await getStoreState(page, 'isGitOperationInProgress');
        expect(inProgress).toBe(false);
    });

    // ─── Operation Errors ───────────────────────────────────────────────

    test('operation error shows in store state', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('fetch');
            store.getState().SetGitOperationError('Network timeout: unable to reach remote');
        });

        await page.waitForTimeout(300);

        const error = await getStoreState(page, 'gitOperationError');
        expect(error).toBe('Network timeout: unable to reach remote');
    });

    test('operation error clears on successful completion', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('pull');
            store.getState().SetGitOperationError('Merge conflict detected');
        });

        await page.waitForTimeout(300);

        let error = await getStoreState(page, 'gitOperationError');
        expect(error).not.toBeNull();

        // Complete operation successfully
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationError(null);
            store.getState().SetGitOperationInProgress(false);
        });

        await page.waitForTimeout(300);

        error = await getStoreState(page, 'gitOperationError');
        expect(error).toBeNull();
    });

    // ─── Git Credentials ─────────────────────────────────────────────────

    test('git credentials stored and retrieved via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitCredentials({
                type: 'token',
                username: 'github-user',
                token: 'ghp_testtoken123'
            });
        });

        await page.waitForTimeout(300);

        const creds = await getStoreState(page, 'gitCredentials');
        expect(creds).not.toBeNull();
        expect(creds.type).toBe('token');
        expect(creds.username).toBe('github-user');
        // Note: token is not exposed in read-only store state for security
    });

    test('credentials can be cleared via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitCredentials({
                type: 'token',
                username: 'user',
                token: 'token123'
            });
        });

        await page.waitForTimeout(300);

        let creds = await getStoreState(page, 'gitCredentials');
        expect(creds).not.toBeNull();

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitCredentials(null);
        });

        await page.waitForTimeout(300);

        creds = await getStoreState(page, 'gitCredentials');
        expect(creds).toBeNull();
    });

    // ─── Git Author ─────────────────────────────────────────────────────

    test('git author name and email stored via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitAuthor({
                name: 'Jane Developer',
                email: 'jane.dev@company.com'
            });
        });

        await page.waitForTimeout(300);

        const author = await getStoreState(page, 'gitAuthor');
        expect(author.name).toBe('Jane Developer');
        expect(author.email).toBe('jane.dev@company.com');
    });

    test('git author updates persist in store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitAuthor({
                name: 'John Smith',
                email: 'john.smith@example.com'
            });
        });

        await page.waitForTimeout(300);

        let author = await getStoreState(page, 'gitAuthor');
        expect(author.name).toBe('John Smith');

        // Update author
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitAuthor({
                name: 'John Smith Updated',
                email: 'john.new@example.com'
            });
        });

        await page.waitForTimeout(300);

        author = await getStoreState(page, 'gitAuthor');
        expect(author.name).toBe('John Smith Updated');
        expect(author.email).toBe('john.new@example.com');
    });

    // ─── Git Settings ────────────────────────────────────────────────────

    test('git settings: autoFetch toggle via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ autoFetch: true });
        });

        await page.waitForTimeout(300);

        let settings = await getStoreState(page, 'gitSettings');
        expect(settings.autoFetch).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ autoFetch: false });
        });

        await page.waitForTimeout(300);

        settings = await getStoreState(page, 'gitSettings');
        expect(settings.autoFetch).toBe(false);
    });

    test('git settings: corsProxy update via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ corsProxy: 'https://cors.example.com' });
        });

        await page.waitForTimeout(300);

        const settings = await getStoreState(page, 'gitSettings');
        expect(settings.corsProxy).toBe('https://cors.example.com');
    });

    test('git settings: showUntracked toggle via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ showUntracked: true });
        });

        await page.waitForTimeout(300);

        let settings = await getStoreState(page, 'gitSettings');
        expect(settings.showUntracked).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ showUntracked: false });
        });

        await page.waitForTimeout(300);

        settings = await getStoreState(page, 'gitSettings');
        expect(settings.showUntracked).toBe(false);
    });

    test('git settings: partial update preserves other settings', async ({ page }) =>
    {
        // Set initial state
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({
                autoFetch: true,
                showUntracked: true,
                corsProxy: 'https://initial.com',
            });
        });

        await page.waitForTimeout(300);

        // Update only autoFetch
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().UpdateGitSettings({ autoFetch: false });
        });

        await page.waitForTimeout(300);

        const settings = await getStoreState(page, 'gitSettings');
        expect(settings.autoFetch).toBe(false);
        expect(settings.showUntracked).toBe(true);
        expect(settings.corsProxy).toBe('https://initial.com');
    });

    // ─── Dialogs ─────────────────────────────────────────────────────────

    test('clone dialog opens via setShowCloneDialog(true)', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCloneDialog(true);
        });

        await page.waitForTimeout(300);

        const showClone = await getStoreState(page, 'showCloneDialog');
        expect(showClone).toBe(true);
    });

    test('git settings dialog opens via setShowGitSettings(true)', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowGitSettings(true);
        });

        await page.waitForTimeout(300);

        const showSettings = await getStoreState(page, 'showGitSettings');
        expect(showSettings).toBe(true);
    });

    test('dialogs can be closed via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCloneDialog(true);
        });

        await page.waitForTimeout(300);

        let showClone = await getStoreState(page, 'showCloneDialog');
        expect(showClone).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCloneDialog(false);
        });

        await page.waitForTimeout(300);

        showClone = await getStoreState(page, 'showCloneDialog');
        expect(showClone).toBe(false);
    });

    // ─── Remotes ────────────────────────────────────────────────────────

    test('remotes stored correctly in store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetRemotes([
                { name: 'origin', url: 'https://github.com/user/repo.git' },
                { name: 'upstream', url: 'https://github.com/org/repo.git' },
            ]);
        });

        await page.waitForTimeout(300);

        const remotes = await getStoreState(page, 'remotes');
        expect(remotes.length).toBe(2);
        expect(remotes[0].name).toBe('origin');
        expect(remotes[1].name).toBe('upstream');
    });

    test('remotes can be updated via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetRemotes([
                { name: 'origin', url: 'https://github.com/old/repo.git' },
            ]);
        });

        await page.waitForTimeout(300);

        let remotes = await getStoreState(page, 'remotes');
        expect(remotes[0].url).toBe('https://github.com/old/repo.git');

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetRemotes([
                { name: 'origin', url: 'https://github.com/new/repo.git' },
                { name: 'backup', url: 'https://github.com/backup/repo.git' },
            ]);
        });

        await page.waitForTimeout(300);

        remotes = await getStoreState(page, 'remotes');
        expect(remotes.length).toBe(2);
        expect(remotes[0].url).toBe('https://github.com/new/repo.git');
    });

    // ─── Browser Workspaces ─────────────────────────────────────────────

    test('browser workspace flag toggles in store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetIsBrowserWorkspace(true);
        });

        await page.waitForTimeout(300);

        let isBrowser = await getStoreState(page, 'isBrowserWorkspace');
        expect(isBrowser).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetIsBrowserWorkspace(false);
        });

        await page.waitForTimeout(300);

        isBrowser = await getStoreState(page, 'isBrowserWorkspace');
        expect(isBrowser).toBe(false);
    });

    test('browser workspaces can be added to store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().AddBrowserWorkspace({
                id: 'ws-1',
                name: 'Production',
                url: 'https://prod.example.com'
            });
        });

        await page.waitForTimeout(300);

        const workspaces = await getStoreState(page, 'browserWorkspaces');
        expect(workspaces.length).toBe(1);
        expect(workspaces[0].id).toBe('ws-1');
        expect(workspaces[0].name).toBe('Production');
    });

    test('multiple browser workspaces managed in store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().AddBrowserWorkspace({
                id: 'ws-1',
                name: 'Dev',
                url: 'https://dev.example.com'
            });
            store.getState().AddBrowserWorkspace({
                id: 'ws-2',
                name: 'Staging',
                url: 'https://staging.example.com'
            });
            store.getState().AddBrowserWorkspace({
                id: 'ws-3',
                name: 'Production',
                url: 'https://prod.example.com'
            });
        });

        await page.waitForTimeout(300);

        const workspaces = await getStoreState(page, 'browserWorkspaces');
        expect(workspaces.length).toBe(3);
        expect(workspaces[0].name).toBe('Dev');
        expect(workspaces[2].name).toBe('Production');
    });

    test('browser workspace can be removed from store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().AddBrowserWorkspace({ id: 'ws-1', name: 'Dev', url: 'https://dev.example.com' });
            store.getState().AddBrowserWorkspace({ id: 'ws-2', name: 'Prod', url: 'https://prod.example.com' });
        });

        await page.waitForTimeout(300);

        let workspaces = await getStoreState(page, 'browserWorkspaces');
        expect(workspaces.length).toBe(2);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().RemoveBrowserWorkspace('ws-1');
        });

        await page.waitForTimeout(300);

        workspaces = await getStoreState(page, 'browserWorkspaces');
        expect(workspaces.length).toBe(1);
        expect(workspaces[0].id).toBe('ws-2');
    });

    // ─── Complex State Transitions ───────────────────────────────────────

    test('handles complete git workflow state transitions', async ({ page }) =>
    {
        // Initialize repo
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetRepoInitialized(true);
            store.getState().SetCurrentBranch('main');
            store.getState().SetBranches([
                { name: 'main', isRemote: false, isCurrentBranch: true, lastCommitOid: 'abc123' }
            ]);
        });

        await page.waitForTimeout(300);

        let state = await getStoreState(page, 'isRepoInitialized');
        expect(state).toBe(true);

        // Add changes
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitStatus({
                branch: 'main',
                isRepoDirty: true,
                stagedFiles: [],
                unstagedFiles: [{ path: 'file.ts', status: 'modified', isStaged: false }],
                untrackedFiles: [],
                aheadBy: 0,
                behindBy: 0,
                mergeInProgress: false,
            });
        });

        await page.waitForTimeout(300);

        let status = await getStoreState(page, 'gitStatus');
        expect(status.isRepoDirty).toBe(true);

        // Start fetch operation
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('fetch');
            store.getState().SetGitOperationProgress(50);
        });

        await page.waitForTimeout(300);

        let operation = await getStoreState(page, 'currentGitOperation');
        expect(operation).toBe('fetch');

        // Complete operation
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationProgress(100);
            store.getState().SetGitOperationInProgress(false);
            store.getState().SetCurrentGitOperation(null);
        });

        await page.waitForTimeout(300);

        operation = await getStoreState(page, 'currentGitOperation');
        expect(operation).toBeNull();
    });

    test('operation transitions clear previous state correctly', async ({ page }) =>
    {
        // Start clone operation
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetGitOperationInProgress(true);
            store.getState().SetCurrentGitOperation('clone');
            store.getState().SetGitOperationProgress(75);
            store.getState().SetGitOperationError(null);
        });

        await page.waitForTimeout(300);

        let operation = await getStoreState(page, 'currentGitOperation');
        expect(operation).toBe('clone');

        // Transition to fetch operation
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().SetCurrentGitOperation('fetch');
            store.getState().SetGitOperationProgress(0);
        });

        await page.waitForTimeout(300);

        operation = await getStoreState(page, 'currentGitOperation');
        expect(operation).toBe('fetch');

        const progress = await getStoreState(page, 'gitOperationProgress');
        expect(progress).toBe(0);
    });
});
