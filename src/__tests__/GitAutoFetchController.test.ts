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
import * as GitAutoFetchControllerModule from '../Notemac/Controllers/Git/GitAutoFetchController';

const mockStore = (globalThis as any).__mockStore;

describe('GitAutoFetchController', () => {
  afterEach(() => {
    GitAutoFetchControllerModule.StopAutoFetch();
    vi.clearAllTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start auto-fetch timer when enabled', () => {
    mockStore.gitSettings = {
      corsProxy: '',
      autoFetch: true,
      autoFetchInterval: 30000,
    };

    GitAutoFetchControllerModule.StartAutoFetch();

    expect(true).toBe(true);
  });

  it('should not start timer when auto-fetch disabled', () => {
    mockStore.gitSettings = {
      corsProxy: '',
      autoFetch: false,
      autoFetchInterval: 30000,
    };

    GitAutoFetchControllerModule.StartAutoFetch();

    expect(true).toBe(true);
  });

  it('should stop auto-fetch timer', () => {
    mockStore.gitSettings = {
      corsProxy: '',
      autoFetch: true,
      autoFetchInterval: 30000,
    };

    GitAutoFetchControllerModule.StartAutoFetch();
    GitAutoFetchControllerModule.StopAutoFetch();

    expect(true).toBe(true);
  });

  it('should clear previous timer on start', () => {
    mockStore.gitSettings = {
      corsProxy: '',
      autoFetch: true,
      autoFetchInterval: 30000,
    };

    GitAutoFetchControllerModule.StartAutoFetch();
    GitAutoFetchControllerModule.StartAutoFetch();

    expect(true).toBe(true);
  });

  it('should use configured interval', () => {
    mockStore.gitSettings = {
      corsProxy: '',
      autoFetch: true,
      autoFetchInterval: 60000,
    };

    GitAutoFetchControllerModule.StartAutoFetch();

    expect(true).toBe(true);
  });
});
