import { useNotemacStore } from "../Model/Store";
import { CreateLightningFsAdapter, DeleteLightningFs } from "../../Shared/Git/GitFileSystemAdapter";
import { generateId } from "../../Shared/Helpers/IdHelpers";
import type { BrowserWorkspace } from "../Commons/Types";

/**
 * Manages browser-based workspaces using IndexedDB + LightningFS.
 * This provides git workspace capability for Firefox/Safari where
 * File System Access API is not available.
 */

// ─── Create Workspace ───────────────────────────────────────

export function CreateBrowserWorkspace(name: string, repoUrl?: string): BrowserWorkspace
{
    const workspace: BrowserWorkspace = {
        id: generateId(),
        name,
        repoUrl,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
    };

    const store = useNotemacStore.getState();
    store.AddBrowserWorkspace(workspace);

    return workspace;
}

// ─── Open Workspace ─────────────────────────────────────────

export function OpenBrowserWorkspace(workspaceId: string): boolean
{
    const store = useNotemacStore.getState();
    const workspace = store.browserWorkspaces.find(w => w.id === workspaceId);

    if (!workspace)
        return false;

    // Update last opened
    store.AddBrowserWorkspace({ ...workspace, lastOpenedAt: Date.now() });
    store.SetIsBrowserWorkspace(true);

    // Initialize the LightningFS for this workspace
    const _fs = CreateLightningFsAdapter(workspace.id);

    // Set workspace path to the workspace name
    store.setWorkspacePath(workspace.name);

    return true;
}

// ─── Delete Workspace ───────────────────────────────────────

export async function DeleteBrowserWorkspace(workspaceId: string): Promise<void>
{
    const store = useNotemacStore.getState();

    // Remove from store
    store.RemoveBrowserWorkspace(workspaceId);

    // Delete the IndexedDB data
    DeleteLightningFs(workspaceId);
}

// ─── List Workspaces ────────────────────────────────────────

export function GetBrowserWorkspaces(): BrowserWorkspace[]
{
    return useNotemacStore.getState().browserWorkspaces;
}

// ─── Get FS for Workspace ───────────────────────────────────

export function GetWorkspaceFs(workspaceId: string)
{
    return CreateLightningFsAdapter(workspaceId);
}

// ─── Check if browser workspace is active ───────────────────

export function IsBrowserWorkspaceActive(): boolean
{
    return useNotemacStore.getState().isBrowserWorkspace;
}
