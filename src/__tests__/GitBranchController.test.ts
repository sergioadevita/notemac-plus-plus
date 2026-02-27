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
import * as GitBranchControllerModule from '../Notemac/Controllers/Git/GitBranchController';

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

describe('GitBranchController', () => {
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

  it('should checkout a branch', async () => {
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('feature-branch');
    mockGit.log.mockResolvedValue([]);

    await GitBranchControllerModule.CheckoutBranch('feature-branch');

    expect(mockGit.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        ref: 'feature-branch',
      })
    );
    expect(mockStore.SetCurrentBranch).toHaveBeenCalledWith('feature-branch');
  });

  it('should dispatch branch changed event after checkout', async () => {
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('develop');
    mockGit.log.mockResolvedValue([]);

    await GitBranchControllerModule.CheckoutBranch('develop');

    expect(Dispatch).toHaveBeenCalledWith(NOTEMAC_EVENTS.GIT_BRANCH_CHANGED, {
      branch: 'develop',
    });
  });

  it('should handle checkout error gracefully', async () => {
    const error = new Error('Checkout failed');
    mockGit.checkout.mockRejectedValue(error);

    await GitBranchControllerModule.CheckoutBranch('feature');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Checkout failed');
  });

  it('should return early when no filesystem', async () => {
    vi.spyOn(GitInitControllerModule, 'GetFs').mockReturnValueOnce(null);

    await GitBranchControllerModule.CheckoutBranch('feature');

    expect(mockGit.checkout).not.toHaveBeenCalled();
  });

  it('should create a branch without checkout', async () => {
    mockGit.branch.mockResolvedValue(undefined);
    mockGit.listBranches.mockResolvedValue(['main', 'new-feature']);
    mockGit.listRemotes.mockResolvedValue([]);

    await GitBranchControllerModule.CreateBranch('new-feature', false);

    expect(mockGit.branch).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        ref: 'new-feature',
      })
    );
  });

  it('should create and checkout a branch by default', async () => {
    mockGit.branch.mockResolvedValue(undefined);
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('new-feature');
    mockGit.log.mockResolvedValue([]);

    await GitBranchControllerModule.CreateBranch('new-feature');

    expect(mockGit.branch).toHaveBeenCalled();
    expect(mockGit.checkout).toHaveBeenCalled();
  });

  it('should delete a branch', async () => {
    mockGit.deleteBranch.mockResolvedValue(undefined);
    mockGit.listBranches.mockResolvedValue(['main']);
    mockGit.listRemotes.mockResolvedValue([]);

    await GitBranchControllerModule.DeleteBranch('old-branch');

    expect(mockGit.deleteBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        ref: 'old-branch',
      })
    );
  });

  it('should refresh branches list with local branches', async () => {
    mockGit.listBranches.mockResolvedValueOnce(['main', 'develop', 'feature']);
    mockGit.listBranches.mockResolvedValueOnce(['main', 'develop']);
    mockGit.listRemotes.mockResolvedValue([{ remote: 'origin', url: 'https://example.com/repo.git' }]);

    await GitBranchControllerModule.RefreshBranches();

    expect(mockStore.SetBranches).toHaveBeenCalled();
    const branchesCall = (mockStore.SetBranches as any).mock.calls[0][0];
    expect(branchesCall.some((b: any) => b.name === 'main' && !b.isRemote)).toBe(true);
  });

  it('should include remote branches in refresh', async () => {
    mockGit.listBranches.mockResolvedValueOnce(['main']);
    mockGit.listBranches.mockResolvedValueOnce(['main', 'develop']);
    mockGit.listRemotes.mockResolvedValue([{ remote: 'origin', url: 'https://example.com/repo.git' }]);

    await GitBranchControllerModule.RefreshBranches();

    const branchesCall = (mockStore.SetBranches as any).mock.calls[0][0];
    expect(branchesCall.some((b: any) => b.name === 'origin/develop' && b.isRemote)).toBe(true);
  });

  it('should handle missing remote gracefully', async () => {
    mockGit.listBranches.mockResolvedValueOnce(['main']);
    mockGit.listBranches.mockRejectedValueOnce(new Error('No remote'));
    mockGit.listRemotes.mockResolvedValue([]);

    await GitBranchControllerModule.RefreshBranches();

    expect(mockStore.SetBranches).toHaveBeenCalled();
    expect(mockStore.SetRemotes).toHaveBeenCalledWith([]);
  });

  it('should mark current branch correctly', async () => {
    mockStore.currentBranch = 'main';
    mockGit.listBranches.mockResolvedValueOnce(['main', 'develop']);
    mockGit.listBranches.mockRejectedValueOnce(new Error('No remote'));
    mockGit.listRemotes.mockResolvedValue([]);

    await GitBranchControllerModule.RefreshBranches();

    const branchesCall = (mockStore.SetBranches as any).mock.calls[0][0];
    expect(branchesCall.find((b: any) => b.name === 'main')?.isCurrentBranch).toBe(true);
  });

  it('should handle branch creation error', async () => {
    const error = new Error('Branch creation failed');
    mockGit.branch.mockRejectedValue(error);

    await GitBranchControllerModule.CreateBranch('new-branch');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Branch creation failed');
  });

  it('should handle branch deletion error', async () => {
    const error = new Error('Delete failed');
    mockGit.deleteBranch.mockRejectedValue(error);

    await GitBranchControllerModule.DeleteBranch('old-branch');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Delete failed');
  });
});
