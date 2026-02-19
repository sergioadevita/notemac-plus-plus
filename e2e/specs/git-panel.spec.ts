import { test, expect } from '@playwright/test';
import { gotoApp } from '../helpers/app';

test.describe('Git Panel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Git panel opens when sidebar set to git', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
    });
    await page.waitForTimeout(300);

    // Git panel renders as the sidebar content when sidebarPanel is 'git'
    // Look for the branch selector which is the first visible element in the git panel
    const branchSelector = page.locator('select').first();
    await expect(branchSelector).toBeVisible();
  });

  test('Git panel shows branch name when currentBranch is set', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetCurrentBranch('feature/test-branch');
      store.getState().SetBranches([
        { name: 'feature/test-branch', isRemote: false, isCurrentBranch: true }
      ]);
    });
    await page.waitForTimeout(300);

    // The current branch is shown in a select dropdown
    const branchSelector = page.locator('select').first();
    const selectedValue = await branchSelector.evaluate((el: any) => el.value);
    expect(selectedValue).toBe('feature/test-branch');
  });

  test('Git panel shows changed files when gitStatus has changes', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitStatus({
        stagedFiles: [],
        unstagedFiles: [
          { path: 'src/file1.ts', status: 'modified' },
          { path: 'src/file2.ts', status: 'modified' }
        ],
        untrackedFiles: [],
        aheadBy: 0,
        behindBy: 0,
      });
    });
    await page.waitForTimeout(300);

    // Check for 'Changes' section header which appears when there are unstaged files
    const changesHeader = page.locator('text=Changes').first();
    await expect(changesHeader).toBeVisible();
  });

  test('Git panel shows staged files section', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitStatus({
        stagedFiles: [{ path: 'src/staged-file.ts', status: 'added' }],
        unstagedFiles: [],
        untrackedFiles: [],
        aheadBy: 0,
        behindBy: 0,
      });
    });
    await page.waitForTimeout(300);

    // Check for 'Staged Changes' section header
    const stagedSection = page.locator('text=Staged Changes').first();
    await expect(stagedSection).toBeVisible();
  });

  test('Git panel shows commit message textarea', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
    });
    await page.waitForTimeout(300);

    // Look for the textarea with placeholder text
    const textarea = page.locator('textarea[placeholder*="Commit message"]');
    await expect(textarea).toBeVisible();
  });

  test('Staging a file moves it to staged section', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitStatus({
        stagedFiles: [],
        unstagedFiles: [{ path: 'src/file1.ts', status: 'modified' }],
        untrackedFiles: [],
        aheadBy: 0,
        behindBy: 0,
      });
    });
    await page.waitForTimeout(300);

    // Verify Changes section shows the file
    const changesText = page.locator('text=file1.ts');
    await expect(changesText).toBeVisible();

    // Update to staged
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetGitStatus({
        stagedFiles: [{ path: 'src/file1.ts', status: 'modified' }],
        unstagedFiles: [],
        untrackedFiles: [],
        aheadBy: 0,
        behindBy: 0,
      });
    });
    await page.waitForTimeout(300);

    // File should still be visible but under Staged Changes now
    const stagedSection = page.locator('text=Staged Changes');
    await expect(stagedSection).toBeVisible();
  });

  test('Setting git error shows error banner', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitOperationError('Failed to push branch');
    });
    await page.waitForTimeout(300);

    // Check for error message text
    const errorBanner = page.locator('text=Failed to push branch');
    await expect(errorBanner).toBeVisible();
  });

  test('Dismissing error clears the error banner', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitOperationError('Failed to push branch');
    });
    await page.waitForTimeout(300);

    // Find and click the close button (✕)
    const closeButton = page.locator('text=Failed to push branch').locator('..').locator('text=✕');
    await closeButton.click();
    await page.waitForTimeout(200);

    // Error should be gone
    const errorBanner = page.locator('text=Failed to push branch');
    await expect(errorBanner).not.toBeVisible();
  });

  test('Operation in progress shows loading state', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitOperationInProgress(true);
    });
    await page.waitForTimeout(300);

    // Check for animated progress bar (height: 2px div with accent color)
    const progressBar = page.locator('[style*="height: 2px"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('Branch list displays when branches are set', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetBranches([
        { name: 'main', isRemote: false, isCurrentBranch: true },
        { name: 'develop', isRemote: false, isCurrentBranch: false },
        { name: 'origin/main', isRemote: true, isCurrentBranch: false }
      ]);
    });
    await page.waitForTimeout(300);

    // Check for Branches section header
    const branchesSection = page.locator('text=Branches').first();
    await expect(branchesSection).toBeVisible();
  });

  test('Current branch is highlighted in branch list', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetCurrentBranch('develop');
      store.getState().SetBranches([
        { name: 'main', isRemote: false, isCurrentBranch: false },
        { name: 'develop', isRemote: false, isCurrentBranch: true }
      ]);
    });
    await page.waitForTimeout(300);

    // Click on Branches to expand it
    const branchesHeader = page.locator('text=Branches').first();
    await branchesHeader.click();
    await page.waitForTimeout(300);

    // Look for the 'develop' branch with 'current' label
    const currentBranchLabel = page.locator('text=current').first();
    await expect(currentBranchLabel).toBeVisible();
  });

  test('Commit log displays with SHA and message', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetCommitLog([
        { oid: 'abc1234567890', message: 'Initial commit', timestamp: Math.floor(Date.now() / 1000) - 3600 },
        { oid: 'def5678901234', message: 'Add feature', timestamp: Math.floor(Date.now() / 1000) - 7200 }
      ]);
    });
    await page.waitForTimeout(300);

    // Click on Recent Commits to expand it
    const commitsSection = page.locator('text=Recent Commits').first();
    await commitsSection.click();
    await page.waitForTimeout(300);

    // Check for commit messages
    const initialCommit = page.locator('text=Initial commit');
    const featureCommit = page.locator('text=Add feature');
    await expect(initialCommit).toBeVisible();
    await expect(featureCommit).toBeVisible();
  });

  test('Empty state when no git status', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
      store.getState().SetGitStatus({
        stagedFiles: [],
        unstagedFiles: [],
        untrackedFiles: [],
        aheadBy: 0,
        behindBy: 0,
      });
    });
    await page.waitForTimeout(300);

    // When initialized but empty, there should be no file sections visible
    // The panel still shows other controls like branch selector and action buttons
    const branchSelector = page.locator('select').first();
    await expect(branchSelector).toBeVisible();
  });

  test('Panel closes when sidebar panel set to null', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel('git');
      store.getState().SetRepoInitialized(true);
    });
    await page.waitForTimeout(300);

    // Git panel should be visible
    const branchSelector = page.locator('select').first();
    await expect(branchSelector).toBeVisible();

    // Close the panel
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setSidebarPanel(null);
    });
    await page.waitForTimeout(300);

    // Selector should no longer be visible
    await expect(branchSelector).not.toBeVisible();
  });
});
