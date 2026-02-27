import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { FileTreeNode } from '../Notemac/Commons/Types';

function resetStore(): void
{
    useNotemacStore.setState({
        fileTree: [],
        workspacePath: null,
    });
}

describe('FileTreeModel — setFileTree', () =>
{
    beforeEach(() => resetStore());

    it('sets file tree', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true, children: [
                { name: 'index.ts', path: '/src/index.ts', isDirectory: false },
            ]},
            { name: 'package.json', path: '/package.json', isDirectory: false },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);
        const state = useNotemacStore.getState();

        expect(2 === state.fileTree.length).toBe(true);
        expect(state.fileTree[0].name).toBe('src');
        expect(state.fileTree[0].isDirectory).toBe(true);
        expect(1 === state.fileTree[0].children!.length).toBe(true);
    });

    it('replaces existing tree', () =>
    {
        const store = useNotemacStore.getState();
        store.setFileTree([{ name: 'old', path: '/old', isDirectory: false }]);
        store.setFileTree([{ name: 'new', path: '/new', isDirectory: false }]);
        const state = useNotemacStore.getState();

        expect(1 === state.fileTree.length).toBe(true);
        expect(state.fileTree[0].name).toBe('new');
    });
});

describe('FileTreeModel — setWorkspacePath', () =>
{
    beforeEach(() => resetStore());

    it('sets workspace path', () =>
    {
        const store = useNotemacStore.getState();
        store.setWorkspacePath('/home/user/project');
        expect(useNotemacStore.getState().workspacePath).toBe('/home/user/project');
    });

    it('clears workspace path', () =>
    {
        const store = useNotemacStore.getState();
        store.setWorkspacePath('/some/path');
        store.setWorkspacePath(null);
        expect(null === useNotemacStore.getState().workspacePath).toBe(true);
    });
});

describe('FileTreeModel — toggleTreeNode', () =>
{
    beforeEach(() => resetStore());

    it('toggles directory expansion', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true, isExpanded: false, children: [
                { name: 'index.ts', path: '/src/index.ts', isDirectory: false },
            ]},
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        store.toggleTreeNode('/src');
        expect(useNotemacStore.getState().fileTree[0].isExpanded).toBe(true);

        store.toggleTreeNode('/src');
        expect(useNotemacStore.getState().fileTree[0].isExpanded).toBe(false);
    });

    it('toggles nested directory', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true, isExpanded: true, children: [
                { name: 'components', path: '/src/components', isDirectory: true, isExpanded: false, children: [
                    { name: 'App.tsx', path: '/src/components/App.tsx', isDirectory: false },
                ]},
            ]},
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        store.toggleTreeNode('/src/components');
        expect(useNotemacStore.getState().fileTree[0].children![0].isExpanded).toBe(true);
    });

    it('does nothing for non-existent path', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true, isExpanded: false },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);
        store.toggleTreeNode('/nonexistent');

        expect(useNotemacStore.getState().fileTree[0].isExpanded).toBe(false);
    });
});
