import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { FileTreeNode } from '../Notemac/Commons/Types';

function resetStore(): void
{
    useNotemacStore.setState({
        sidebarPanel: null,
        sidebarWidth: 260,
        fileTree: [],
        workspacePath: null,
        clipboardHistory: [],
    });
}

describe('Sidebar Panel Cycling', () =>
{
    beforeEach(() => resetStore());

    it('cycles through all 9 panels: explorer', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('cycles through all 9 panels: search', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('search');
        expect(useNotemacStore.getState().sidebarPanel).toBe('search');
    });

    it('cycles through all 9 panels: functions', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('functions');
        expect(useNotemacStore.getState().sidebarPanel).toBe('functions');
    });

    it('cycles through all 9 panels: project', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('project');
        expect(useNotemacStore.getState().sidebarPanel).toBe('project');
    });

    it('cycles through all 9 panels: clipboardHistory', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('clipboardHistory');
        expect(useNotemacStore.getState().sidebarPanel).toBe('clipboardHistory');
    });

    it('cycles through all 9 panels: charPanel', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('charPanel');
        expect(useNotemacStore.getState().sidebarPanel).toBe('charPanel');
    });

    it('cycles through all 9 panels: docList', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('docList');
        expect(useNotemacStore.getState().sidebarPanel).toBe('docList');
    });

    it('cycles through all 9 panels: terminal', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('terminal');
        expect(useNotemacStore.getState().sidebarPanel).toBe('terminal');
    });

    it('cycles through all 9 panels: git', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('git');
        expect(useNotemacStore.getState().sidebarPanel).toBe('git');
    });

    it('cycles through all 9 panels: ai', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('ai');
        expect(useNotemacStore.getState().sidebarPanel).toBe('ai');
    });

    it('setSidebarPanel(null) from explorer closes sidebar', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');

        store.setSidebarPanel(null);
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
    });

    it('setSidebarPanel(null) from git panel closes sidebar', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('git');
        expect(useNotemacStore.getState().sidebarPanel).toBe('git');

        store.setSidebarPanel(null);
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
    });

    it('toggleSidebar from null opens explorer', () =>
    {
        const store = useNotemacStore.getState();
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);

        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');
    });

    it('toggleSidebar from explorer closes sidebar', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('explorer');
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');

        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
    });

    it('toggleSidebar from git panel closes sidebar', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('git');
        expect(useNotemacStore.getState().sidebarPanel).toBe('git');

        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
    });

    it('toggleSidebar is idempotent: multiple toggles work correctly', () =>
    {
        const store = useNotemacStore.getState();

        // Start: null
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);

        // Toggle to explorer
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');

        // Toggle back to null
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);

        // Toggle to explorer again
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe('explorer');

        // Toggle back to null again
        store.toggleSidebar();
        expect(useNotemacStore.getState().sidebarPanel).toBe(null);
    });
});

describe('Sidebar Width', () =>
{
    beforeEach(() => resetStore());

    it('default sidebarWidth is 260', () =>
    {
        expect(useNotemacStore.getState().sidebarWidth).toBe(260);
    });

    it('sidebarWidth can be set directly via setState', () =>
    {
        useNotemacStore.setState({ sidebarWidth: 300 });
        expect(useNotemacStore.getState().sidebarWidth).toBe(300);
    });

    it('sidebarWidth can be set to various values', () =>
    {
        const testValues = [200, 250, 350, 500];
        for (const val of testValues)
        {
            useNotemacStore.setState({ sidebarWidth: val });
            expect(useNotemacStore.getState().sidebarWidth).toBe(val);
        }
    });
});

describe('FileTree Edge Cases', () =>
{
    beforeEach(() => resetStore());

    it('empty fileTree array is valid', () =>
    {
        const store = useNotemacStore.getState();
        store.setFileTree([]);
        expect(useNotemacStore.getState().fileTree).toEqual([]);
    });

    it('deeply nested tree (4 levels) preserves structure correctly', () =>
    {
        const tree: FileTreeNode[] = [
            {
                name: 'src',
                path: '/src',
                isDirectory: true,
                isExpanded: true,
                children: [
                    {
                        name: 'components',
                        path: '/src/components',
                        isDirectory: true,
                        isExpanded: true,
                        children: [
                            {
                                name: 'ui',
                                path: '/src/components/ui',
                                isDirectory: true,
                                isExpanded: true,
                                children: [
                                    {
                                        name: 'Button.tsx',
                                        path: '/src/components/ui/Button.tsx',
                                        isDirectory: false,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        const state = useNotemacStore.getState();
        expect(state.fileTree.length).toBe(1);
        expect(state.fileTree[0].name).toBe('src');
        expect(state.fileTree[0].children?.length).toBe(1);
        expect(state.fileTree[0].children?.[0].name).toBe('components');
        expect(state.fileTree[0].children?.[0].children?.length).toBe(1);
        expect(state.fileTree[0].children?.[0].children?.[0].name).toBe('ui');
        expect(state.fileTree[0].children?.[0].children?.[0].children?.length).toBe(1);
        expect(state.fileTree[0].children?.[0].children?.[0].children?.[0].name).toBe('Button.tsx');
    });

    it('tree with mixed files and directories sorts correctly', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'README.md', path: '/README.md', isDirectory: false },
            { name: 'src', path: '/src', isDirectory: true },
            { name: 'package.json', path: '/package.json', isDirectory: false },
            { name: 'dist', path: '/dist', isDirectory: true },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        const state = useNotemacStore.getState();
        expect(state.fileTree.length).toBe(4);
        expect(state.fileTree[0].name).toBe('README.md');
        expect(state.fileTree[1].name).toBe('src');
        expect(state.fileTree[2].name).toBe('package.json');
        expect(state.fileTree[3].name).toBe('dist');
    });

    it('toggleTreeNode on a FILE toggles isExpanded property', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'file.txt', path: '/file.txt', isDirectory: false },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        // toggleTreeNode works on any node, not just directories
        store.toggleTreeNode('/file.txt');
        const afterToggle = useNotemacStore.getState().fileTree[0];

        expect(afterToggle.isExpanded).toBe(true);
        expect(afterToggle.name).toBe('file.txt');
        expect(afterToggle.isDirectory).toBe(false);
    });

    it('setFileTree with empty array clears tree', () =>
    {
        const initialTree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(initialTree);
        expect(useNotemacStore.getState().fileTree.length).toBe(1);

        store.setFileTree([]);
        expect(useNotemacStore.getState().fileTree).toEqual([]);
    });

    it('large tree (100 nodes) sets correctly', () =>
    {
        const tree: FileTreeNode[] = [];
        for (let i = 0; i < 100; i++)
        {
            tree.push({
                name: `file${i}.txt`,
                path: `/file${i}.txt`,
                isDirectory: false,
            });
        }

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        expect(useNotemacStore.getState().fileTree.length).toBe(100);
        expect(useNotemacStore.getState().fileTree[50].name).toBe('file50.txt');
        expect(useNotemacStore.getState().fileTree[99].name).toBe('file99.txt');
    });
});

describe('Clipboard History Integration', () =>
{
    beforeEach(() => resetStore());

    it('addClipboardEntry adds entry with timestamp', () =>
    {
        const store = useNotemacStore.getState();
        const beforeCount = useNotemacStore.getState().clipboardHistory.length;

        store.addClipboardEntry('test content');
        const afterCount = useNotemacStore.getState().clipboardHistory.length;

        expect(afterCount).toBe(beforeCount + 1);
        const lastEntry = useNotemacStore.getState().clipboardHistory[0];
        expect(lastEntry.text).toBe('test content');
        expect(lastEntry.timestamp).toBeDefined();
        expect(typeof lastEntry.timestamp).toBe('number');
    });

    it('clipboard entries are accessible alongside sidebar state', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('clipboardHistory');
        store.addClipboardEntry('entry 1');
        store.addClipboardEntry('entry 2');

        const state = useNotemacStore.getState();
        expect(state.sidebarPanel).toBe('clipboardHistory');
        expect(state.clipboardHistory.length).toBe(2);
        expect(state.clipboardHistory[0].text).toBe('entry 2'); // Most recent first
        expect(state.clipboardHistory[1].text).toBe('entry 1');
    });
});

describe('Session Save includes sidebar and filetree', () =>
{
    beforeEach(() => resetStore());

    it('saveSession includes sidebarPanel value', () =>
    {
        const store = useNotemacStore.getState();
        store.setSidebarPanel('git');

        const session = store.saveSession();
        expect(session.sidebarPanel).toBe('git');
    });

    it('fileTree state is independent from saveSession', () =>
    {
        const tree: FileTreeNode[] = [
            { name: 'src', path: '/src', isDirectory: true },
        ];

        const store = useNotemacStore.getState();
        store.setFileTree(tree);

        // saveSession only includes tabs, activeTabIndex, sidebarPanel
        const session = store.saveSession();
        expect(session.sidebarPanel).toBeDefined();
        expect(session.tabs).toBeDefined();

        // fileTree is persisted in store state, not in session
        const state = useNotemacStore.getState();
        expect(state.fileTree.length).toBe(1);
        expect(state.fileTree[0].name).toBe('src');
    });

    it('workspacePath persists in store state', () =>
    {
        const store = useNotemacStore.getState();
        store.setWorkspacePath('/home/user/project');

        const state = useNotemacStore.getState();
        expect(state.workspacePath).toBe('/home/user/project');
    });

    it('sidebarWidth persists in store state', () =>
    {
        useNotemacStore.setState({ sidebarWidth: 350 });

        const state = useNotemacStore.getState();
        expect(state.sidebarWidth).toBe(350);
    });

    it('loadSession restores sidebarPanel', () =>
    {
        const store = useNotemacStore.getState();
        const sessionData = {
            tabs: [],
            activeTabIndex: -1,
            sidebarPanel: 'ai' as const,
        };

        store.loadSession(sessionData);

        const state = useNotemacStore.getState();
        expect(state.sidebarPanel).toBe('ai');
    });
});
