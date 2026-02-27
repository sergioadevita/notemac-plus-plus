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
import * as GitCommitControllerModule from '../Notemac/Controllers/Git/GitCommitController';

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

describe('GitCommitController', () => {
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

  it('should create a commit with staged changes', async () => {
    mockGit.commit.mockResolvedValue('abc123def456');
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.log.mockResolvedValue([]);

    const oid = await GitCommitControllerModule.CreateCommit('test commit message');

    expect(mockStore.SetGitOperationInProgress).toHaveBeenCalledWith(true);
    expect(mockStore.SetCurrentGitOperation).toHaveBeenCalledWith('commit');
    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith(null);
    expect(mockGit.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        message: 'test commit message',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
        },
      })
    );
    expect(oid).toBe('abc123def456');
  });

  it('should refresh status and log after successful commit', async () => {
    mockGit.commit.mockResolvedValue('abc123');
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.log.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitCommitControllerModule.CreateCommit('test commit');

    expect(Dispatch).toHaveBeenCalledWith(NOTEMAC_EVENTS.GIT_OPERATION_COMPLETE, {
      operation: 'commit',
      oid: 'abc123',
    });
  });

  it('should reset operation in progress in finally block', async () => {
    mockGit.commit.mockResolvedValue('abc123');
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.log.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitCommitControllerModule.CreateCommit('test commit');

    expect(mockStore.SetGitOperationInProgress).toHaveBeenLastCalledWith(false);
    expect(mockStore.SetCurrentGitOperation).toHaveBeenLastCalledWith(null);
  });

  it('should set error on commit failure', async () => {
    const error = new Error('Commit failed');
    mockGit.commit.mockRejectedValue(error);

    await expect(GitCommitControllerModule.CreateCommit('test')).rejects.toThrow('Commit failed');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('Commit failed');
  });

  it('should throw when no filesystem available', async () => {
    vi.spyOn(GitInitControllerModule, 'GetFs').mockReturnValueOnce(null);

    await expect(GitCommitControllerModule.CreateCommit('test')).rejects.toThrow(
      'No filesystem available'
    );
  });

  it('should handle non-Error thrown values', async () => {
    mockGit.commit.mockRejectedValue('unknown error string');

    await expect(GitCommitControllerModule.CreateCommit('test')).rejects.toEqual('unknown error string');

    expect(mockStore.SetGitOperationError).toHaveBeenCalledWith('unknown error string');
  });

  it('should use author from store', async () => {
    mockStore.gitAuthor = { name: 'Custom Author', email: 'custom@example.com' };
    mockGit.commit.mockResolvedValue('abc123');
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.log.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    await GitCommitControllerModule.CreateCommit('test');

    expect(mockGit.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        author: {
          name: 'Custom Author',
          email: 'custom@example.com',
        },
      })
    );
  });

  it('should return commit OID on success', async () => {
    const expectedOid = 'deadbeef1234567890';
    mockGit.commit.mockResolvedValue(expectedOid);
    mockGit.statusMatrix.mockResolvedValue([]);
    mockGit.log.mockResolvedValue([]);
    mockGit.currentBranch.mockResolvedValue('main');

    const result = await GitCommitControllerModule.CreateCommit('test');

    expect(result).toBe(expectedOid);
  });
});
