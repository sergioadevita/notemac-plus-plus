import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { FileTab } from '../Notemac/Commons/Types';

vi.mock('../../Shared/Helpers/IdHelpers', async (importOriginal) => {
    const actual = await importOriginal();
    let idCounter = 0;
    return {
        ...actual,
        generateId: () => `id-${++idCounter}`,
    };
});

vi.mock('../../Shared/Helpers/FileHelpers', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        detectLanguage: (filename: string) => {
            if (filename.endsWith('.ts')) return 'typescript';
            if (filename.endsWith('.js')) return 'javascript';
            if (filename.endsWith('.py')) return 'python';
            return 'plaintext';
        },
    };
});

function resetStore(): void {
    useNotemacStore.setState({
        tabs: [],
        activeTabId: null,
        closedTabs: [],
        recentFiles: [],
    });
}

describe('TabModel — addTab', () => {
    beforeEach(() => resetStore());

    it('adds a tab with default values', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id);
        expect(state.tabs[0].name).toMatch(/^new \d+$/);
        expect(state.activeTabId).toBe(id);
    });

    it('adds a tab with custom values', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts', path: '/test.ts', content: 'console.log()' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('test.ts');
        expect(state.tabs[0].path).toBe('/test.ts');
        expect(state.tabs[0].content).toBe('console.log()');
        expect(state.tabs[0].language).toBe('typescript');
    });

    it('increments tab count in default name', () => {
        const store = useNotemacStore.getState();
        store.addTab();
        store.addTab();
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('new 1');
        expect(state.tabs[1].name).toBe('new 2');
    });

    it('sets activeTabId to new tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBe(id2);
    });

    it('detects language from filename', () => {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'script.py' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].language).toBe('python');
    });
});

describe('TabModel — closeTab', () => {
    beforeEach(() => resetStore());

    it('closes a tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.closeTab(id);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(0);
        expect(state.closedTabs.length).toBe(1);
    });

    it('moves closed tab to closedTabs', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts', content: 'hello' });
        store.closeTab(id);
        const state = useNotemacStore.getState();

        expect(state.closedTabs[0].content).toBe('hello');
    });

    it('updates activeTabId when closing active tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id1);
        store.closeTab(id1);
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBe(id2);
    });

    it('sets activeTabId to null when closing last tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.closeTab(id);
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBeNull();
    });

    it('does nothing for non-existent tab', () => {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'test.ts' });
        store.closeTab('nonexistent');
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
    });
});

describe('TabModel — closeAllTabs', () => {
    beforeEach(() => resetStore());

    it('closes all tabs', () => {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'first.ts' });
        store.addTab({ name: 'second.ts' });
        store.addTab({ name: 'third.ts' });
        store.closeAllTabs();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(0);
        expect(state.closedTabs.length).toBe(3);
        expect(state.activeTabId).toBeNull();
    });
});

describe('TabModel — closeOtherTabs', () => {
    beforeEach(() => resetStore());

    it('closes all tabs except specified', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const id3 = store.addTab({ name: 'third.ts' });
        store.closeOtherTabs(id2);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id2);
        expect(state.closedTabs.length).toBe(2);
        expect(state.activeTabId).toBe(id2);
    });
});

describe('TabModel — closeTabsToLeft', () => {
    beforeEach(() => resetStore());

    it('closes tabs to the left of specified tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const id3 = store.addTab({ name: 'third.ts' });
        store.closeTabsToLeft(id3);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id3);
        expect(state.closedTabs.length).toBe(2);
    });

    it('does nothing if tab is first', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.closeTabsToLeft(id1);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(2);
    });
});

describe('TabModel — closeTabsToRight', () => {
    beforeEach(() => resetStore());

    it('closes tabs to the right of specified tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const id3 = store.addTab({ name: 'third.ts' });
        store.closeTabsToRight(id1);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id1);
        expect(state.closedTabs.length).toBe(2);
    });

    it('does nothing if tab is last', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.closeTabsToRight(id2);
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(2);
    });
});

describe('TabModel — closeUnchangedTabs', () => {
    beforeEach(() => resetStore());

    it('closes only unchanged tabs', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'modified.ts' });
        const id2 = store.addTab({ name: 'unchanged.ts' });
        store.updateTab(id1, { isModified: true });
        store.closeUnchangedTabs();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id1);
        expect(state.closedTabs.length).toBe(1);
    });

    it('updates activeTabId if active tab is closed', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'modified.ts' });
        const id2 = store.addTab({ name: 'unchanged.ts' });
        store.setActiveTab(id2);
        store.updateTab(id1, { isModified: true });
        store.closeUnchangedTabs();
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBe(id1);
    });
});

describe('TabModel — closeAllButPinned', () => {
    beforeEach(() => resetStore());

    it('closes all unpinned tabs', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'pinned.ts' });
        const id2 = store.addTab({ name: 'unpinned.ts' });
        store.togglePinTab(id1);
        store.closeAllButPinned();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].id).toBe(id1);
        expect(state.closedTabs.length).toBe(1);
    });
});

describe('TabModel — restoreLastClosedTab', () => {
    beforeEach(() => resetStore());

    it('restores last closed tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts', content: 'hello' });
        store.closeTab(id1);
        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(1);
        expect(state.tabs[0].content).toBe('hello');
        expect(state.closedTabs.length).toBe(0);
    });

    it('generates new id on restore', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'test.ts' });
        store.closeTab(id1);
        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(state.tabs[0].id).not.toBe(id1);
    });

    it('does nothing if no closed tabs', () => {
        const store = useNotemacStore.getState();
        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(state.tabs.length).toBe(0);
    });
});

describe('TabModel — setActiveTab', () => {
    beforeEach(() => resetStore());

    it('sets active tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.setActiveTab(id);
        expect(useNotemacStore.getState().activeTabId).toBe(id);
    });
});

describe('TabModel — updateTab', () => {
    beforeEach(() => resetStore());

    it('updates tab properties', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.updateTab(id, { name: 'renamed.ts', isReadOnly: true });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('renamed.ts');
        expect(state.tabs[0].isReadOnly).toBe(true);
    });

    it('does nothing for non-existent tab', () => {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'test.ts' });
        store.updateTab('nonexistent', { name: 'renamed.ts' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('test.ts');
    });
});

describe('TabModel — updateTabContent', () => {
    beforeEach(() => resetStore());

    it('updates content and marks as modified', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts', content: 'original' });
        store.updateTabContent(id, 'modified content');
        const state = useNotemacStore.getState();

        expect(state.tabs[0].content).toBe('modified content');
        expect(state.tabs[0].isModified).toBe(true);
    });

    it('marks as unmodified when reverted to original', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts', content: 'original' });
        store.updateTabContent(id, 'changed');
        store.updateTabContent(id, 'original');
        const state = useNotemacStore.getState();

        expect(state.tabs[0].isModified).toBe(false);
    });
});

describe('TabModel — togglePinTab', () => {
    beforeEach(() => resetStore());

    it('pins unpinned tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.togglePinTab(id);
        expect(useNotemacStore.getState().tabs[0].isPinned).toBe(true);
    });

    it('unpins pinned tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.togglePinTab(id);
        store.togglePinTab(id);
        expect(useNotemacStore.getState().tabs[0].isPinned).toBe(false);
    });
});

describe('TabModel — setTabColor', () => {
    beforeEach(() => resetStore());

    it('sets tab color', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.setTabColor(id, 'red');
        expect(useNotemacStore.getState().tabs[0].tabColor).toBe('red');
    });
});

describe('TabModel — moveTab', () => {
    beforeEach(() => resetStore());

    it('moves tab from one position to another', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const id3 = store.addTab({ name: 'third.ts' });
        store.moveTab(0, 2);
        const state = useNotemacStore.getState();

        expect(state.tabs[0].id).toBe(id2);
        expect(state.tabs[2].id).toBe(id1);
    });
});

describe('TabModel — nextTab and prevTab', () => {
    beforeEach(() => resetStore());

    it('cycles to next tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id1);
        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id2);
    });

    it('wraps around to first on nextTab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id2);
        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id1);
    });

    it('cycles to previous tab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id2);
        store.prevTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id1);
    });

    it('wraps around to last on prevTab', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id1);
        store.prevTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id2);
    });

    it('does nothing with single tab', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id);
    });
});

describe('TabModel — goToTab', () => {
    beforeEach(() => resetStore());

    it('switches to tab at index', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        const id3 = store.addTab({ name: 'third.ts' });
        store.goToTab(1);
        expect(useNotemacStore.getState().activeTabId).toBe(id2);
    });

    it('ignores invalid index', () => {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.ts' });
        store.goToTab(5);
        expect(useNotemacStore.getState().activeTabId).toBe(id);
    });
});

describe('TabModel — moveTabForward and moveTabBackward', () => {
    beforeEach(() => resetStore());

    it('moves tab forward', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id1);
        store.moveTabForward();
        const state = useNotemacStore.getState();

        expect(state.tabs[1].id).toBe(id1);
    });

    it('does nothing if tab is last', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id2);
        store.moveTabForward();
        const state = useNotemacStore.getState();

        expect(state.tabs[1].id).toBe(id2);
    });

    it('moves tab backward', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id2);
        store.moveTabBackward();
        const state = useNotemacStore.getState();

        expect(state.tabs[0].id).toBe(id2);
    });

    it('does nothing if tab is first', () => {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first.ts' });
        const id2 = store.addTab({ name: 'second.ts' });
        store.setActiveTab(id1);
        store.moveTabBackward();
        const state = useNotemacStore.getState();

        expect(state.tabs[0].id).toBe(id1);
    });
});

describe('TabModel — addRecentFile', () => {
    beforeEach(() => resetStore());

    it('adds recent file', () => {
        const store = useNotemacStore.getState();
        store.addRecentFile('/path/to/file.ts', 'file.ts');
        const state = useNotemacStore.getState();

        expect(state.recentFiles.length).toBe(1);
        expect(state.recentFiles[0].path).toBe('/path/to/file.ts');
    });

    it('moves duplicate to front', () => {
        const store = useNotemacStore.getState();
        store.addRecentFile('/path/file1.ts', 'file1.ts');
        store.addRecentFile('/path/file2.ts', 'file2.ts');
        store.addRecentFile('/path/file1.ts', 'file1.ts');
        const state = useNotemacStore.getState();

        expect(state.recentFiles[0].path).toBe('/path/file1.ts');
        expect(state.recentFiles.length).toBe(2);
    });
});
