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
import * as GitInitControllerModule from '../Notemac/Controllers/Git/GitInitController';
import * as GitLogControllerModule from '../Notemac/Controllers/Git/GitLogController';

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

describe('GitLogController', () => {
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

  it('should fetch commit log', async () => {
    const mockLogs = [
      {
        oid: 'abc123',
        commit: {
          message: 'First commit',
          author: { name: 'Author 1', email: 'author1@example.com', timestamp: 1000, timezoneOffset: 0 },
        },
      },
      {
        oid: 'def456',
        commit: {
          message: 'Second commit',
          author: { name: 'Author 2', email: 'author2@example.com', timestamp: 2000, timezoneOffset: 0 },
        },
      },
    ];
    mockGit.log.mockResolvedValue(mockLogs);

    await GitLogControllerModule.FetchCommitLog();

    expect(mockGit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        depth: 50,
      })
    );
    expect(mockStore.SetCommitLog).toHaveBeenCalled();

    const commits = (mockStore.SetCommitLog as any).mock.calls[0][0];
    expect(commits).toHaveLength(2);
    expect(commits[0].oid).toBe('abc123');
    expect(commits[0].message).toBe('First commit');
  });

  it('should use custom limit for log', async () => {
    mockGit.log.mockResolvedValue([]);

    await GitLogControllerModule.FetchCommitLog(10);

    expect(mockGit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 10,
      })
    );
  });

  it('should handle log fetch error', async () => {
    mockGit.log.mockRejectedValue(new Error('Log failed'));

    await GitLogControllerModule.FetchCommitLog();

    expect(mockStore.SetCommitLog).toHaveBeenCalledWith([]);
  });

  it('should get file at head', async () => {
    const fileContent = 'file content here';
    mockGit.resolveRef.mockResolvedValue('abc123');
    mockGit.readBlob.mockResolvedValue({
      blob: new TextEncoder().encode(fileContent),
    });

    const result = await GitLogControllerModule.GetFileAtHead('src/file.ts');

    expect(mockGit.resolveRef).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        dir: '/',
        ref: 'HEAD',
      })
    );
    expect(mockGit.readBlob).toHaveBeenCalledWith(
      expect.objectContaining({
        oid: 'abc123',
        filepath: 'src/file.ts',
      })
    );
    expect(result).toBe(fileContent);
  });

  it('should return null when get file at head fails', async () => {
    mockGit.resolveRef.mockRejectedValue(new Error('Failed'));

    const result = await GitLogControllerModule.GetFileAtHead('src/file.ts');

    expect(result).toBeNull();
  });

  it('should get staged diff', async () => {
    mockStore.gitStatus = {
      branch: 'main',
      isRepoDirty: true,
      stagedFiles: [{ path: 'src/file.ts', status: 'modified' as const, isStaged: true }],
      unstagedFiles: [],
      untrackedFiles: [],
      aheadBy: 0,
      behindBy: 0,
      mergeInProgress: false,
    };
    mockStore.tabs = [];
    mockGit.resolveRef.mockResolvedValue('abc123');
    mockGit.readBlob.mockResolvedValue({
      blob: new TextEncoder().encode('old content'),
    });

    const diff = await GitLogControllerModule.GetStagedDiff();

    expect(diff).toContain('modified: src/file.ts');
  });

  it('should return empty string when no staged files', async () => {
    mockStore.gitStatus = null;

    const diff = await GitLogControllerModule.GetStagedDiff();

    expect(diff).toBe('');
  });

  it('should handle null filesystem in get file at head', async () => {
    vi.spyOn(GitInitControllerModule, 'GetFs').mockReturnValueOnce(null);

    const result = await GitLogControllerModule.GetFileAtHead('src/file.ts');

    expect(result).toBeNull();
  });

  it('should format commit messages correctly', async () => {
    const mockLogs = [
      {
        oid: 'commit1',
        commit: {
          message: 'Fix: broken link',
          author: { name: 'Alice', email: 'alice@example.com', timestamp: 1609459200, timezoneOffset: 0 },
        },
      },
    ];
    mockGit.log.mockResolvedValue(mockLogs);

    await GitLogControllerModule.FetchCommitLog();

    const commits = (mockStore.SetCommitLog as any).mock.calls[0][0];
    expect(commits[0].message).toBe('Fix: broken link');
    expect(commits[0].author.name).toBe('Alice');
  });
});
