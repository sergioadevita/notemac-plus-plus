import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FsClient } from 'isomorphic-git';

// Setup test environment
import './setup';

// CRITICAL: All mocks must come BEFORE any imports of mocked modules

// Mock isomorphic-git
vi.mock('isomorphic-git', () => ({
  default: {
    commit: vi.fn(),
    checkout: vi.fn(),
    branch: vi.fn(),
    deleteBranch: vi.fn(),
    listBranches: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    add: vi.fn(),
    resetIndex: vi.fn(),
    statusMatrix: vi.fn(),
    currentBranch: vi.fn(),
    log: vi.fn(),
    resolveRef: vi.fn(),
    readBlob: vi.fn(),
    init: vi.fn(),
    clone: vi.fn(),
    findRoot: vi.fn(),
    listRemotes: vi.fn(),
    addRemote: vi.fn(),
  },
}));

vi.mock('isomorphic-git/http/web', () => ({
  default: vi.fn(),
}));

// Mock the file system adapter modules
vi.mock('../Shared/Git/GitFileSystemAdapter', () => ({
  DetectFsBackend: vi.fn(() => 'webfs'),
  GetFsForGit: vi.fn((path, handle) => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
  })),
  GetDirHandle: vi.fn(() => null),
  RegisterDirHandle: vi.fn(),
  CreateLightningFsAdapter: vi.fn((path) => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
  })),
}));

// Mock Constants module
vi.mock('../Notemac/Commons/Constants', () => {
  const constants = {
    GIT_DEFAULT_CORS_PROXY: 'https://cors.isomorphic-git.org',
    GIT_COMMIT_FETCH_LIMIT: 50,
    GIT_STATUS_POLL_INTERVAL: 3000,
  };
  return constants;
});

// Mock the store
vi.mock('../Notemac/Model/Store', () => {
  const mockStore = {
    gitAuthor: { name: 'Test Author', email: 'test@example.com' },
    currentBranch: 'main',
    isRepoInitialized: true,
    isGitOperationInProgress: false,
    gitOperationProgress: 0,
    gitStatus: null,
    gitSettings: { corsProxy: '', autoFetch: false, autoFetchInterval: 30000 },
    gitCredentials: { username: 'user', token: 'token123' },
    workspacePath: '/workspace',
    tabs: [],
    SetGitOperationInProgress: vi.fn(),
    SetCurrentGitOperation: vi.fn(),
    SetGitOperationError: vi.fn(),
    SetGitOperationProgress: vi.fn(),
    SetCurrentBranch: vi.fn(),
    SetBranches: vi.fn(),
    SetRemotes: vi.fn(),
    SetGitStatus: vi.fn(),
    SetCommitLog: vi.fn(),
    SetRepoInitialized: vi.fn(),
    getState: vi.fn(function () {
      return this;
    }),
  };

  // Expose mockStore globally for tests
  (globalThis as any).__mockStore = mockStore;

  return {
    useNotemacStore: {
      getState: vi.fn(() => mockStore),
    },
  };
});

// Mock EventDispatcher
vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
  Dispatch: vi.fn(),
  NOTEMAC_EVENTS: {
    GIT_OPERATION_COMPLETE: 'GIT_OPERATION_COMPLETE',
    GIT_BRANCH_CHANGED: 'GIT_BRANCH_CHANGED',
    GIT_STATUS_CHANGED: 'GIT_STATUS_CHANGED',
  },
}));

// Now import the modules
import git from 'isomorphic-git';
import { Dispatch, NOTEMAC_EVENTS } from '../Shared/EventDispatcher/EventDispatcher';
import * as GitInitControllerModule from '../Notemac/Controllers/Git/GitInitController';
import * as GitStatusControllerModule from '../Notemac/Controllers/Git/GitStatusController';

const createMockFs = (): FsClient => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
});

const mockGit = git as any;
const mockStore = (globalThis as any).__mockStore;

describe('GitStatusController', () => {
  let mockFs: FsClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset store state
    mockStore.gitAuthor = { name: 'Test Author', email: 'test@example.com' };
    mockStore.currentBranch = 'main';
    mockStore.isRepoInitialized = true;
    mockStore.isGitOperationInProgress = false;
    mockStore.gitOperationProgress = 0;
    mockStore.gitStatus = null;
    mockStore.gitSettings = { corsProxy: '', autoFetch: false, autoFetchInterval: 30000 };
    mockStore.gitCredentials = { username: 'user', token: 'token123' };
    mockStore.workspacePath = '/workspace';
    mockStore.tabs = [];

    // Create fresh mock fs for this test
    mockFs = createMockFs();

    // Mock GetFs to return our mock filesystem
    vi.spyOn(GitInitControllerModule, 'GetFs').mockReturnValue(mockFs);
    vi.spyOn(GitInitControllerModule, 'GetDir').mockReturnValue('/');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh git status', async () => {
    mockGit.currentBranch.mockResolvedValue('develop');
    mockGit.statusMatrix.mockResolvedValue([
      ['file1.txt', 1, 2, 1],
      ['file2.txt', 0, 2, 0],
    ]);

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockGit.statusMatrix).toHaveBeenCalled();
    expect(mockStore.SetGitStatus).toHaveBeenCalled();
  });

  it('should update current branch during refresh', async () => {
    mockGit.currentBranch.mockResolvedValue('feature-branch');
    mockGit.statusMatrix.mockResolvedValue([]);

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockStore.SetCurrentBranch).toHaveBeenCalledWith('feature-branch');
  });

  it('should handle detached HEAD during refresh', async () => {
    mockGit.currentBranch.mockResolvedValue(null);
    mockGit.statusMatrix.mockResolvedValue([]);

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockStore.SetGitStatus).toHaveBeenCalled();
  });

  it('should dispatch status changed event', async () => {
    mockGit.currentBranch.mockResolvedValue('main');
    mockGit.statusMatrix.mockResolvedValue([]);

    await GitStatusControllerModule.RefreshGitStatus();

    expect(Dispatch).toHaveBeenCalledWith(NOTEMAC_EVENTS.GIT_STATUS_CHANGED);
  });

  it('should stage a file', async () => {
    mockGit.add.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitStatusControllerModule.StageFile('src/file.ts');

    expect(mockGit.add).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        filepath: 'src/file.ts',
      })
    );
  });

  it('should refresh status after staging', async () => {
    mockGit.add.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitStatusControllerModule.StageFile('src/file.ts');

    expect(mockGit.statusMatrix).toHaveBeenCalled();
  });

  it('should stage all files', async () => {
    mockStore.gitStatus = {
      branch: 'main',
      isRepoDirty: true,
      stagedFiles: [],
      unstagedFiles: [{ path: 'file1.ts', status: 'modified' as const, isStaged: false }],
      untrackedFiles: [{ path: 'file2.ts', status: 'untracked' as const, isStaged: false }],
      aheadBy: 0,
      behindBy: 0,
      mergeInProgress: false,
    };
    mockGit.add.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitStatusControllerModule.StageAllFiles();

    expect(mockGit.add).toHaveBeenCalledTimes(2);
  });

  it('should unstage a file', async () => {
    mockGit.resetIndex.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitStatusControllerModule.UnstageFile('src/file.ts');

    expect(mockGit.resetIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        filepath: 'src/file.ts',
      })
    );
  });

  it('should discard file changes', async () => {
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitStatusControllerModule.DiscardFileChanges('src/file.ts');

    expect(mockGit.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        filepaths: ['src/file.ts'],
        force: true,
      })
    );
  });

  it('should handle stage file error', async () => {
    const error = new Error('Stage failed');
    mockGit.add.mockRejectedValue(error);

    await GitStatusControllerModule.StageFile('src/file.ts');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Stage failed');
  });

  it('should return early when no filesystem', async () => {
    vi.spyOn(GitInitControllerModule, 'GetFs').mockReturnValueOnce(null);

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockGit.statusMatrix).not.toHaveBeenCalled();
  });

  it('should return early when repo not initialized', async () => {
    mockStore.isRepoInitialized = false;

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockGit.statusMatrix).not.toHaveBeenCalled();
  });

  it('should handle unstage error', async () => {
    const error = new Error('Unstage failed');
    mockGit.resetIndex.mockRejectedValue(error);

    await GitStatusControllerModule.UnstageFile('src/file.ts');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Unstage failed');
  });

  it('should handle discard changes error', async () => {
    const error = new Error('Discard failed');
    mockGit.checkout.mockRejectedValue(error);

    await GitStatusControllerModule.DiscardFileChanges('src/file.ts');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Discard failed');
  });

  it('should handle status matrix error', async () => {
    mockGit.statusMatrix.mockRejectedValue(new Error('Status failed'));

    await GitStatusControllerModule.RefreshGitStatus();

    expect(mockStore.SetGitStatus).toHaveBeenCalledWith(null);
  });
});
