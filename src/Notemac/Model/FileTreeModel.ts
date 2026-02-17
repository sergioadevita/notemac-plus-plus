import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { FileTreeNode } from "../Commons/Types";

export interface NotemacFileTreeSlice
{
    fileTree: FileTreeNode[];
    workspacePath: string | null;

    setFileTree: (tree: FileTreeNode[]) => void;
    setWorkspacePath: (path: string | null) => void;
    toggleTreeNode: (path: string) => void;
}

export const createFileTreeSlice: StateCreator<NotemacFileTreeSlice, [], [], NotemacFileTreeSlice> = (set) => ({
    fileTree: [],
    workspacePath: null,

    setFileTree: (tree) => set({ fileTree: tree }),

    setWorkspacePath: (path) => set({ workspacePath: path }),

    toggleTreeNode: (path) =>
    {
        set(produce((state: NotemacFileTreeSlice) =>
        {
            const toggleNode = (nodes: FileTreeNode[]): boolean =>
            {
                for (const node of nodes)
                {
                    if (node.path === path)
                    {
                        node.isExpanded = !node.isExpanded;
                        return true;
                    }
                    if (node.children && toggleNode(node.children))
                        return true;
                }
                return false;
            };
            toggleNode(state.fileTree);
        }));
    },
});
