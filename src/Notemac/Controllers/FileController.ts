import { useNotemacStore } from "../Model/Store";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';
import { HandleMenuAction } from "./MenuActionController";
import { InitGitForWorkspace } from "./GitController";
import { IsTauriEnvironment } from "../Services/PlatformBridge";
import { CreateTauriBridge } from "../Services/TauriBridge";

/**
 * Handles file-related operations: drag-drop, desktop IPC file/folder events.
 * Supports both Electron (window.electronAPI) and Tauri (TauriBridge).
 */

interface FileOpenedData
{
    name: string;
    path: string;
    content: string;
}

interface FileSavedData
{
    name: string;
    path: string;
}

interface FolderData
{
    path: string;
    tree: import('../Commons/Types').FileTreeNode[];
}

export function HandleDragOver(e: DragEvent): void
{
    e.preventDefault();
    e.stopPropagation();
}

export async function HandleDrop(e: DragEvent): Promise<void>
{
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.files)
    {
        const files = Array.from(e.dataTransfer.files);
        const store = useNotemacStore.getState();

        for (const file of files)
        {
            const content = await file.text();
            store.addTab({
                name: file.name,
                content,
                language: detectLanguage(file.name),
                lineEnding: detectLineEnding(content),
            });
        }
    }
}

// ─── Shared IPC Callbacks ───────────────────────────────────────

function OnFileOpened(data: FileOpenedData): void
{
    const store = useNotemacStore.getState();
    const existing = store.tabs.find(t => t.path === data.path);

    if (existing)
    {
        store.setActiveTab(existing.id);
    }
    else
    {
        store.addTab({
            name: data.name,
            path: data.path,
            content: data.content,
            language: detectLanguage(data.name),
            lineEnding: detectLineEnding(data.content),
        });
        store.addRecentFile(data.path, data.name);
    }
}

function OnFolderOpened(data: FolderData): void
{
    const store = useNotemacStore.getState();
    store.setFileTree(data.tree);
    store.setWorkspacePath(data.path);
    store.setSidebarPanel('explorer');

    // Detect git repo in the opened folder
    InitGitForWorkspace();
}

function OnMenuAction(action: string, value: boolean | string | number | undefined): void
{
    const store = useNotemacStore.getState();
    HandleMenuAction(action, store.activeTabId, store.tabs, store.zoomLevel, value);
}

function OnFileSaved(data: FileSavedData): void
{
    const store = useNotemacStore.getState();
    if (null !== store.activeTabId)
    {
        store.updateTab(store.activeTabId, {
            name: data.name,
            path: data.path,
            isModified: false,
            language: detectLanguage(data.name),
        });
    }
}

// ─── Desktop IPC Setup ──────────────────────────────────────────

/**
 * Sets up desktop IPC listeners (Electron or Tauri).
 * Kept as `SetupElectronIPC` for backward compatibility with AppViewPresenter imports.
 */
export function SetupElectronIPC(): void
{
    if (IsTauriEnvironment())
    {
        SetupTauriIPC();
        return;
    }

    if (!window.electronAPI)
        return;

    window.electronAPI.onFileOpened(OnFileOpened);
    window.electronAPI.onFolderOpened(OnFolderOpened);
    window.electronAPI.onMenuAction(OnMenuAction);
    window.electronAPI.onFileSaved?.(OnFileSaved);
}

async function SetupTauriIPC(): Promise<void>
{
    const bridge = await CreateTauriBridge();
    if (null === bridge)
        return;

    bridge.onFileOpened(OnFileOpened);
    bridge.onFolderOpened(OnFolderOpened);
    bridge.onMenuAction(OnMenuAction);
    bridge.onFileSaved(OnFileSaved);
}
