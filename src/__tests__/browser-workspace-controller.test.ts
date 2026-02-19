import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateBrowserWorkspace,
  OpenBrowserWorkspace,
  DeleteBrowserWorkspace,
  GetBrowserWorkspaces,
  GetWorkspaceFs,
  IsBrowserWorkspaceActive,
} from '../Notemac/Controllers/BrowserWorkspaceController';
import { useNotemacStore } from '../Notemac/Model/Store';
import * as GitFileSystemAdapter from '../Shared/Git/GitFileSystemAdapter';
import * as IdHelpers from '../Shared/Helpers/IdHelpers';

// Mock dependencies
vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../Shared/Git/GitFileSystemAdapter', () => ({
  CreateLightningFsAdapter: vi.fn(),
  DeleteLightningFs: vi.fn(),
}));

vi.mock('../Shared/Helpers/IdHelpers', () => ({
  generateId: vi.fn(),
}));

describe('BrowserWorkspaceController', () => {
  let mockStore: any;
  let mockWorkspace: any;

  beforeEach(() => {
    // Setup mock workspace
    mockWorkspace = {
      id: 'ws-123',
      name: 'My Workspace',
      repoUrl: undefined,
      createdAt: 1000000,
      lastOpenedAt: 1000000,
    };

    // Setup mock store
    mockStore = {
      browserWorkspaces: [mockWorkspace],
      isBrowserWorkspace: false,
      AddBrowserWorkspace: vi.fn(),
      RemoveBrowserWorkspace: vi.fn(),
      SetIsBrowserWorkspace: vi.fn(),
      setWorkspacePath: vi.fn(),
    };

    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (IdHelpers.generateId as any).mockReturnValue('ws-456');

    vi.clearAllMocks();
  });

  describe('CreateBrowserWorkspace', () => {
    it('should create a workspace with name only', () => {
      const workspace = CreateBrowserWorkspace('Test Workspace');

      expect(workspace).toBeDefined();
      expect(workspace.id).toBe('ws-456');
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.repoUrl).toBeUndefined();
    });

    it('should create a workspace with name and repoUrl', () => {
      const repoUrl = 'https://github.com/user/repo.git';
      const workspace = CreateBrowserWorkspace('Test Workspace', repoUrl);

      expect(workspace).toBeDefined();
      expect(workspace.id).toBe('ws-456');
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.repoUrl).toBe(repoUrl);
    });

    it('should generate unique workspace ID', () => {
      const workspace = CreateBrowserWorkspace('Test Workspace');

      expect(IdHelpers.generateId).toHaveBeenCalled();
      expect(workspace.id).toBe('ws-456');
    });

    it('should set creation timestamp', () => {
      const beforeCreate = Date.now();
      const workspace = CreateBrowserWorkspace('Test Workspace');
      const afterCreate = Date.now();

      expect(workspace.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(workspace.createdAt).toBeLessThanOrEqual(afterCreate);
    });

    it('should set lastOpenedAt timestamp equal to createdAt', () => {
      const workspace = CreateBrowserWorkspace('Test Workspace');

      expect(workspace.lastOpenedAt).toBe(workspace.createdAt);
    });

    it('should add workspace to store', () => {
      CreateBrowserWorkspace('Test Workspace');

      expect(mockStore.AddBrowserWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ws-456',
          name: 'Test Workspace',
        })
      );
    });

    it('should call AddBrowserWorkspace with correct workspace object', () => {
      const repoUrl = 'https://github.com/user/repo.git';
      CreateBrowserWorkspace('Test Workspace', repoUrl);

      expect(mockStore.AddBrowserWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workspace',
          repoUrl: repoUrl,
          createdAt: expect.any(Number),
          lastOpenedAt: expect.any(Number),
        })
      );
    });
  });

  describe('OpenBrowserWorkspace', () => {
    it('should return true for existing workspace', () => {
      const result = OpenBrowserWorkspace('ws-123');

      expect(result).toBe(true);
    });

    it('should return false for non-existent workspace', () => {
      const result = OpenBrowserWorkspace('ws-nonexistent');

      expect(result).toBe(false);
    });

    it('should update lastOpenedAt timestamp when opening', () => {
      const beforeOpen = Date.now();
      OpenBrowserWorkspace('ws-123');
      const afterOpen = Date.now();

      expect(mockStore.AddBrowserWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ws-123',
          name: 'My Workspace',
          lastOpenedAt: expect.any(Number),
        })
      );

      const callArg = (mockStore.AddBrowserWorkspace as any).mock.calls[0][0];
      expect(callArg.lastOpenedAt).toBeGreaterThanOrEqual(beforeOpen);
      expect(callArg.lastOpenedAt).toBeLessThanOrEqual(afterOpen);
    });

    it('should set isBrowserWorkspace to true', () => {
      OpenBrowserWorkspace('ws-123');

      expect(mockStore.SetIsBrowserWorkspace).toHaveBeenCalledWith(true);
    });

    it('should create LightningFS adapter for workspace', () => {
      OpenBrowserWorkspace('ws-123');

      expect(GitFileSystemAdapter.CreateLightningFsAdapter).toHaveBeenCalledWith('ws-123');
    });

    it('should set workspace path to workspace name', () => {
      OpenBrowserWorkspace('ws-123');

      expect(mockStore.setWorkspacePath).toHaveBeenCalledWith('My Workspace');
    });

    it('should not create LightningFS for non-existent workspace', () => {
      OpenBrowserWorkspace('ws-nonexistent');

      expect(GitFileSystemAdapter.CreateLightningFsAdapter).not.toHaveBeenCalled();
    });

    it('should not update store for non-existent workspace', () => {
      OpenBrowserWorkspace('ws-nonexistent');

      expect(mockStore.AddBrowserWorkspace).not.toHaveBeenCalled();
      expect(mockStore.SetIsBrowserWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('DeleteBrowserWorkspace', () => {
    it('should remove workspace from store', async () => {
      await DeleteBrowserWorkspace('ws-123');

      expect(mockStore.RemoveBrowserWorkspace).toHaveBeenCalledWith('ws-123');
    });

    it('should delete IndexedDB data for workspace', async () => {
      await DeleteBrowserWorkspace('ws-123');

      expect(GitFileSystemAdapter.DeleteLightningFs).toHaveBeenCalledWith('ws-123');
    });

    it('should call both remove and delete operations', async () => {
      await DeleteBrowserWorkspace('ws-123');

      expect(mockStore.RemoveBrowserWorkspace).toHaveBeenCalled();
      expect(GitFileSystemAdapter.DeleteLightningFs).toHaveBeenCalled();
    });

    it('should work for any workspace ID', async () => {
      await DeleteBrowserWorkspace('ws-custom-id');

      expect(mockStore.RemoveBrowserWorkspace).toHaveBeenCalledWith('ws-custom-id');
      expect(GitFileSystemAdapter.DeleteLightningFs).toHaveBeenCalledWith('ws-custom-id');
    });
  });

  describe('GetBrowserWorkspaces', () => {
    it('should return store browserWorkspaces array', () => {
      const workspaces = GetBrowserWorkspaces();

      expect(workspaces).toBe(mockStore.browserWorkspaces);
    });

    it('should return empty array when no workspaces exist', () => {
      mockStore.browserWorkspaces = [];

      const workspaces = GetBrowserWorkspaces();

      expect(workspaces).toEqual([]);
    });

    it('should return all workspaces from store', () => {
      const ws1 = {
        id: 'ws-1',
        name: 'Workspace 1',
        createdAt: 1000,
        lastOpenedAt: 1000,
      };
      const ws2 = {
        id: 'ws-2',
        name: 'Workspace 2',
        createdAt: 2000,
        lastOpenedAt: 2000,
      };
      mockStore.browserWorkspaces = [ws1, ws2];

      const workspaces = GetBrowserWorkspaces();

      expect(workspaces).toHaveLength(2);
      expect(workspaces).toContain(ws1);
      expect(workspaces).toContain(ws2);
    });
  });

  describe('GetWorkspaceFs', () => {
    it('should create and return LightningFS adapter', () => {
      (GitFileSystemAdapter.CreateLightningFsAdapter as any).mockReturnValue({
        fs: 'mock-fs',
      });

      const fs = GetWorkspaceFs('ws-123');

      expect(GitFileSystemAdapter.CreateLightningFsAdapter).toHaveBeenCalledWith('ws-123');
      expect(fs).toBeDefined();
    });

    it('should pass correct workspace ID to adapter factory', () => {
      GetWorkspaceFs('ws-custom');

      expect(GitFileSystemAdapter.CreateLightningFsAdapter).toHaveBeenCalledWith('ws-custom');
    });

    it('should return the created adapter', () => {
      const mockAdapter = { type: 'LightningFS', id: 'ws-123' };
      (GitFileSystemAdapter.CreateLightningFsAdapter as any).mockReturnValue(mockAdapter);

      const result = GetWorkspaceFs('ws-123');

      expect(result).toBe(mockAdapter);
    });
  });

  describe('IsBrowserWorkspaceActive', () => {
    it('should return false when browser workspace is not active', () => {
      mockStore.isBrowserWorkspace = false;

      const active = IsBrowserWorkspaceActive();

      expect(active).toBe(false);
    });

    it('should return true when browser workspace is active', () => {
      mockStore.isBrowserWorkspace = true;

      const active = IsBrowserWorkspaceActive();

      expect(active).toBe(true);
    });

    it('should read from store state', () => {
      IsBrowserWorkspaceActive();

      expect(useNotemacStore.getState).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should create and open workspace in sequence', () => {
      // Create
      const created = CreateBrowserWorkspace('Integration Test', 'https://github.com/test/repo.git');
      expect(mockStore.AddBrowserWorkspace).toHaveBeenCalled();

      // Setup for open
      mockStore.browserWorkspaces = [created];
      vi.clearAllMocks();

      // Open
      const opened = OpenBrowserWorkspace(created.id);
      expect(opened).toBe(true);
      expect(mockStore.SetIsBrowserWorkspace).toHaveBeenCalledWith(true);
      expect(GitFileSystemAdapter.CreateLightningFsAdapter).toHaveBeenCalledWith(created.id);
    });

    it('should create, open, and delete workspace', async () => {
      const workspace = CreateBrowserWorkspace('Full Lifecycle Test');
      mockStore.browserWorkspaces = [workspace];
      vi.clearAllMocks();

      // Open
      OpenBrowserWorkspace(workspace.id);
      expect(mockStore.SetIsBrowserWorkspace).toHaveBeenCalledWith(true);

      vi.clearAllMocks();

      // Delete
      await DeleteBrowserWorkspace(workspace.id);
      expect(mockStore.RemoveBrowserWorkspace).toHaveBeenCalledWith(workspace.id);
      expect(GitFileSystemAdapter.DeleteLightningFs).toHaveBeenCalledWith(workspace.id);
    });
  });
});
