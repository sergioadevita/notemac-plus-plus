import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTauriInvocations, clearTauriInvocations } from '../helpers/tauri-app';

/**
 * Auth flow tests (mocked OAuth).
 * Tests git credential management, safe storage encryption/decryption,
 * and git operation state tracking.
 * Real GitHub OAuth cannot be tested, but credential flow is fully tested.
 */

test.describe('Tauri Git Credentials', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
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
    expect(state.gitCredentials.token).toBe('ghp_mock_token_12345');
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

test.describe('Tauri Safe Storage (Mocked)', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('is_safe_storage_available returns true (mocked)', async () => {
    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('is_safe_storage_available');
    });

    expect(result).toBe(true);
  });

  test('safe_storage_encrypt returns encrypted string', async () => {
    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('safe_storage_encrypt', {
        plaintext: 'my-secret-token'
      });
    });

    expect(typeof result).toBe('string');
    // Mock returns base64 encoded (btoa)
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('my-secret-token'); // should be different from plaintext
  });

  test('safe_storage_decrypt returns original string', async () => {
    // Mock decrypt does atob(), so pass valid base64
    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('safe_storage_decrypt', {
        encrypted: 'bXktc2VjcmV0LXRva2Vu'
      });
    });

    expect(result).toBe('my-secret-token');
  });

  test('encrypt and decrypt round-trip works', async () => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      const original = 'ghp_testtoken123456';
      const encrypted = await tauri?.core?.invoke('safe_storage_encrypt', { plaintext: original });
      // decrypt expects the raw base64 (what encrypt returns)
      const decrypted = await tauri?.core?.invoke('safe_storage_decrypt', { encrypted: encrypted });
      return { original, encrypted, decrypted };
    });

    expect(result.encrypted).not.toBe(result.original);
    expect(result.decrypted).toBe(result.original);
  });

  test('safe storage invocations are tracked', async () => {
    await clearTauriInvocations(page);

    await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      await tauri?.core?.invoke('safe_storage_encrypt', { plaintext: 'track-me' });
      await tauri?.core?.invoke('safe_storage_decrypt', { encrypted: 'dHJhY2stbWU=' });
    });

    const invocations = await getTauriInvocations(page);
    const encryptCalls = invocations.filter((i: any) => i.cmd === 'safe_storage_encrypt');
    const decryptCalls = invocations.filter((i: any) => i.cmd === 'safe_storage_decrypt');
    expect(encryptCalls.length).toBe(1);
    expect(decryptCalls.length).toBe(1);
  });
});

test.describe('Tauri Git Operation State', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('git operation defaults to not in progress', async () => {
    const state = await getStoreState(page);
    expect(state.gitOperationInProgress).toBe(false);
    expect(state.currentGitOperation).toBeNull();
  });

  test('git operation in progress can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetGitOperationInProgress(true);
      store?.getState()?.SetCurrentGitOperation('clone');
    });

    const state = await getStoreState(page);
    expect(state.gitOperationInProgress).toBe(true);
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
    expect(state.gitOperationInProgress).toBe(false);
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

test.describe('Tauri Git Repository State', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('repo initialized defaults to false', async () => {
    const state = await getStoreState(page);
    expect(state.repoInitialized).toBe(false);
  });

  test('repo initialized can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetRepoInitialized(true);
    });

    const state = await getStoreState(page);
    expect(state.repoInitialized).toBe(true);
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
        { name: 'origin/main', isCurrent: false, isRemote: true },
      ]);
    });

    const state = await getStoreState(page);
    expect(state.branches.length).toBe(3);
    expect(state.branches[0].name).toBe('main');
    expect(state.branches[0].isCurrent).toBe(true);
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
    expect(state.remotes[0].url).toContain('github.com');
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
    expect(state.gitStatus.unstaged.length).toBe(1);
    expect(state.gitStatus.untracked.length).toBe(1);
  });

  test('commit log can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCommitLog([
        { hash: 'abc123', message: 'Initial commit', author: 'User', date: '2025-01-01' },
        { hash: 'def456', message: 'Add feature', author: 'User', date: '2025-01-02' },
      ]);
    });

    const state = await getStoreState(page);
    expect(state.commitLog.length).toBe(2);
    expect(state.commitLog[0].hash).toBe('abc123');
    expect(state.commitLog[1].message).toBe('Add feature');
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

  test('git settings can be updated', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.UpdateGitSettings({ autoFetch: true, fetchInterval: 60 });
    });

    const state = await getStoreState(page);
    expect(state.gitSettings.autoFetch).toBe(true);
    expect(state.gitSettings.fetchInterval).toBe(60);
  });
});
