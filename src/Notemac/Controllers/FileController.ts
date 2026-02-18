import { useNotemacStore } from "../Model/Store";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';
import { HandleMenuAction } from "./MenuActionController";
import { InitGitForWorkspace } from "./GitController";

/**
 * Handles file-related operations: drag-drop, Electron IPC file/folder events.
 */

interface ElectronFileOpenedData
{
    name: string;
    path: string;
    content: string;
}

interface ElectronFileSavedData
{
    name: string;
    path: string;
}

interface ElectronFolderData
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

export function SetupElectronIPC(): void
{
    if (!window.electronAPI)
        return;

    window.electronAPI.onFileOpened((data: ElectronFileOpenedData) =>
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
    });

    window.electronAPI.onFolderOpened((data: ElectronFolderData) =>
    {
        const store = useNotemacStore.getState();
        store.setFileTree(data.tree);
        store.setWorkspacePath(data.path);
        store.setSidebarPanel('explorer');

        // Detect git repo in the opened folder
        InitGitForWorkspace();
    });

    window.electronAPI.onMenuAction((action: string, value: unknown) =>
    {
        const store = useNotemacStore.getState();
        HandleMenuAction(action, store.activeTabId, store.tabs, store.zoomLevel, value);
    });

    // Handle file-saved events (from Save As dialog in main process)
    window.electronAPI.onFileSaved?.((data: ElectronFileSavedData) =>
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
    });
}
