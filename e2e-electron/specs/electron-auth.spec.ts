import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState } from '../helpers/electron-app';

/**
 * Auth/Git credential and git operation state tests for Electron.
 */

test.describe('Electron Git Credentials', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('git credentials default to null', async () => {
    const state = await getStoreState(page);
    expect(state.gitCredentials).toBeNull();
  });

  test('git credentials can be set (OAuth token)', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitCredentials({
        type: 'oauth',
        username: 'testuser',
        token: 'ghp_mock_token_12345',
      });
    });
    const state = await getStoreState(page);
    expect(state.gitCredentials).toBeTruthy();
    expect(state.gitCredentials.type).toBe('oauth');
    expect(state.gitCredentials.username).toBe('testuser');
  });

  test('git credentials can be set (PAT)', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitCredentials({
        type: 'pat',
        username: 'patuser',
        token: 'ghp_pat_token_67890',
      });
    });
    const state = await getStoreState(page);
    expect(state.gitCredentials.type).toBe('pat');
    expect(state.gitCredentials.username).toBe('patuser');
  });

  test('git credentials can be cleared', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitCredentials(null);
    });
    const state = await getStoreState(page);
    expect(state.gitCredentials).toBeNull();
  });
});

test.describe('Electron Git Operation State', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('git operation defaults to not in progress', async () => {
    const state = await getStoreState(page);
    expect(state.isGitOperationInProgress).toBe(false);
    expect(state.currentGitOperation).toBeNull();
  });

  test('git operation in progress can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationInProgress(true);
      store?.getState()?.SetCurrentGitOperation('clone');
    });
    const state = await getStoreState(page);
    expect(state.isGitOperationInProgress).toBe(true);
    expect(state.currentGitOperation).toBe('clone');
  });

  test('git operation progress can be tracked', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationProgress(50);
    });
    const state = await getStoreState(page);
    expect(state.gitOperationProgress).toBe(50);
  });

  test('git operation can complete', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationInProgress(false);
      store?.getState()?.SetCurrentGitOperation(null);
      store?.getState()?.SetGitOperationProgress(0);
    });
    const state = await getStoreState(page);
    expect(state.isGitOperationInProgress).toBe(false);
    expect(state.currentGitOperation).toBeNull();
  });

  test('git operation error can be set and cleared', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationError('Authentication failed');
    });
    let state = await getStoreState(page);
    expect(state.gitOperationError).toBe('Authentication failed');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationError(null);
    });
    state = await getStoreState(page);
    expect(state.gitOperationError).toBeNull();
  });

  test('different git operations can be tracked', async () => {
    const operations = ['clone', 'push', 'pull', 'fetch', 'commit'];
    for (const op of operations) {
      await page.evaluate((operation: string) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store?.getState()?.SetCurrentGitOperation(operation);
      }, op);
      const state = await getStoreState(page);
      expect(state.currentGitOperation).toBe(op);
    }
  });
});

test.describe('Electron Git Repository State', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('repo initialized defaults to false', async () => {
    const state = await getStoreState(page);
    expect(state.isRepoInitialized).toBe(false);
  });

  test('repo initialized can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetRepoInitialized(true);
    });
    const state = await getStoreState(page);
    expect(state.isRepoInitialized).toBe(true);
  });

  test('current branch can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCurrentBranch('main');
    });
    const state = await getStoreState(page);
    expect(state.currentBranch).toBe('main');
  });

  test('branches can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetBranches([
        { name: 'main', isCurrent: true, isRemote: false },
        { name: 'develop', isCurrent: false, isRemote: false },
      ]);
    });
    const state = await getStoreState(page);
    expect(state.branches.length).toBe(2);
    expect(state.branches[0].name).toBe('main');
  });

  test('remotes can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetRemotes([
        { name: 'origin', url: 'https://github.com/user/repo.git' },
      ]);
    });
    const state = await getStoreState(page);
    expect(state.remotes.length).toBe(1);
    expect(state.remotes[0].name).toBe('origin');
  });

  test('git status can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitStatus({
        staged: ['src/index.ts'],
        unstaged: ['README.md'],
        untracked: ['new-file.ts'],
      });
    });
    const state = await getStoreState(page);
    expect(state.gitStatus).toBeTruthy();
    expect(state.gitStatus.staged.length).toBe(1);
  });

  test('commit log can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCommitLog([
        { hash: 'abc123', message: 'Initial commit', author: 'User', date: '2025-01-01' },
      ]);
    });
    const state = await getStoreState(page);
    expect(state.commitLog.length).toBe(1);
    expect(state.commitLog[0].hash).toBe('abc123');
  });

  test('git author can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitAuthor({ name: 'Test User', email: 'test@example.com' });
    });
    const state = await getStoreState(page);
    expect(state.gitAuthor.name).toBe('Test User');
    expect(state.gitAuthor.email).toBe('test@example.com');
  });
});
