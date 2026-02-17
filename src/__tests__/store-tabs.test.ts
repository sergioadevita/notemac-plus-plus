import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

function resetStore(): void
{
    useNotemacStore.setState({
        tabs: [],
        activeTabId: null,
        closedTabs: [],
        recentFiles: [],
    });
}

describe('TabModel — addTab', () =>
{
    beforeEach(() => resetStore());

    it('adds a default tab with auto-generated name', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab();
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].id).toBe(id);
        expect(state.tabs[0].name).toBe('new 1');
        expect(state.activeTabId).toBe(id);
    });

    it('adds a tab with custom properties', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'test.js', content: 'console.log("hi")', language: 'javascript' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('test.js');
        expect(state.tabs[0].content).toBe('console.log("hi")');
        expect(state.tabs[0].language).toBe('javascript');
        expect(state.tabs[0].isModified).toBe(false);
    });

    it('sets active tab to the newly added tab', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'first.txt' });
        store.addTab({ name: 'second.txt' });
        const state = useNotemacStore.getState();

        expect(2 === state.tabs.length).toBe(true);
        expect(state.tabs[1].name).toBe('second.txt');
        expect(state.activeTabId).toBe(state.tabs[1].id);
    });

    it('auto-detects language from filename', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'style.css' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].language).toBe('css');
    });

    it('defaults to utf-8 encoding and LF line ending', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab();
        const state = useNotemacStore.getState();

        expect(state.tabs[0].encoding).toBe('utf-8');
        expect(state.tabs[0].lineEnding).toBe('LF');
    });

    it('initializes tab with empty bookmarks, marks, and hiddenLines', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab();
        const tab = useNotemacStore.getState().tabs[0];

        expect(tab.bookmarks).toEqual([]);
        expect(tab.marks).toEqual([]);
        expect(tab.hiddenLines).toEqual([]);
    });
});

describe('TabModel — closeTab', () =>
{
    beforeEach(() => resetStore());

    it('closes a tab and moves it to closedTabs', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'toClose.txt' });
        store.closeTab(id);
        const state = useNotemacStore.getState();

        expect(0 === state.tabs.length).toBe(true);
        expect(1 === state.closedTabs.length).toBe(true);
        expect(state.closedTabs[0].name).toBe('toClose.txt');
    });

    it('sets activeTabId to next tab after close', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'tab1' });
        const id2 = store.addTab({ name: 'tab2' });
        const id3 = store.addTab({ name: 'tab3' });

        store.setActiveTab(id2);
        store.closeTab(id2);
        const state = useNotemacStore.getState();

        expect(2 === state.tabs.length).toBe(true);
        expect(state.activeTabId).toBe(id3);
    });

    it('sets activeTabId to null when last tab is closed', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab();
        store.closeTab(id);
        const state = useNotemacStore.getState();

        expect(null === state.activeTabId).toBe(true);
    });

    it('does nothing for non-existent tab id', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'keep.txt' });
        store.closeTab('nonexistent');
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
    });
});

describe('TabModel — closeAllTabs', () =>
{
    beforeEach(() => resetStore());

    it('closes all tabs', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        store.addTab({ name: 'c' });

        store.closeAllTabs();
        const state = useNotemacStore.getState();

        expect(0 === state.tabs.length).toBe(true);
        expect(null === state.activeTabId).toBe(true);
        expect(3 === state.closedTabs.length).toBe(true);
    });
});

describe('TabModel — closeOtherTabs', () =>
{
    beforeEach(() => resetStore());

    it('keeps only the specified tab', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'keep' });
        store.addTab({ name: 'close1' });
        store.addTab({ name: 'close2' });

        store.closeOtherTabs(id1);
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('keep');
        expect(state.activeTabId).toBe(id1);
    });
});

describe('TabModel — closeTabsToLeft/Right', () =>
{
    beforeEach(() => resetStore());

    it('closes tabs to the left', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        const id3 = store.addTab({ name: 'c' });

        store.closeTabsToLeft(id3);
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('c');
    });

    it('closes tabs to the right', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        store.addTab({ name: 'c' });

        store.closeTabsToRight(id1);
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('a');
    });

    it('does nothing when no tabs to left', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'first' });
        store.addTab({ name: 'second' });

        store.closeTabsToLeft(id1);
        const state = useNotemacStore.getState();

        expect(2 === state.tabs.length).toBe(true);
    });

    it('does nothing when no tabs to right', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'first' });
        const id2 = store.addTab({ name: 'last' });

        store.closeTabsToRight(id2);
        const state = useNotemacStore.getState();

        expect(2 === state.tabs.length).toBe(true);
    });
});

describe('TabModel — closeUnchangedTabs', () =>
{
    beforeEach(() => resetStore());

    it('closes only unmodified tabs', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'unchanged' });
        const id2 = store.addTab({ name: 'modified' });
        store.updateTabContent(id2, 'changed content');

        store.closeUnchangedTabs();
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('modified');
    });
});

describe('TabModel — closeAllButPinned', () =>
{
    beforeEach(() => resetStore());

    it('closes only unpinned tabs', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'pinned' });
        store.addTab({ name: 'unpinned' });
        store.togglePinTab(id1);

        store.closeAllButPinned();
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('pinned');
        expect(state.tabs[0].isPinned).toBe(true);
    });
});

describe('TabModel — restoreLastClosedTab', () =>
{
    beforeEach(() => resetStore());

    it('restores the last closed tab', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'restored.txt', content: 'hello' });
        store.closeTab(id);

        expect(0 === useNotemacStore.getState().tabs.length).toBe(true);

        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].name).toBe('restored.txt');
        expect(state.tabs[0].content).toBe('hello');
        expect(null !== state.activeTabId).toBe(true);
    });

    it('does nothing when no closed tabs exist', () =>
    {
        const store = useNotemacStore.getState();
        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(0 === state.tabs.length).toBe(true);
    });
});

describe('TabModel — navigation', () =>
{
    beforeEach(() => resetStore());

    it('nextTab cycles through tabs', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'tab1' });
        const id2 = store.addTab({ name: 'tab2' });
        const id3 = store.addTab({ name: 'tab3' });

        store.setActiveTab(id1);
        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id2);

        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id3);

        store.nextTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id1);
    });

    it('prevTab cycles through tabs backwards', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'tab1' });
        const id2 = store.addTab({ name: 'tab2' });
        const id3 = store.addTab({ name: 'tab3' });

        store.setActiveTab(id1);
        store.prevTab();
        expect(useNotemacStore.getState().activeTabId).toBe(id3);
    });

    it('goToTab sets correct tab', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'tab1' });
        const id2 = store.addTab({ name: 'tab2' });
        const id3 = store.addTab({ name: 'tab3' });

        store.goToTab(0);
        expect(useNotemacStore.getState().activeTabId).toBe(id1);

        store.goToTab(2);
        expect(useNotemacStore.getState().activeTabId).toBe(id3);
    });

    it('goToTab ignores invalid index', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'tab1' });

        store.goToTab(5);
        expect(useNotemacStore.getState().activeTabId).toBe(id1);

        store.goToTab(-1);
        expect(useNotemacStore.getState().activeTabId).toBe(id1);
    });
});

describe('TabModel — updateTab', () =>
{
    beforeEach(() => resetStore());

    it('updates tab properties', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'old.txt' });
        store.updateTab(id, { name: 'new.txt', language: 'python' });
        const tab = useNotemacStore.getState().tabs[0];

        expect(tab.name).toBe('new.txt');
        expect(tab.language).toBe('python');
    });

    it('does nothing for non-existent tab', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'only.txt' });
        store.updateTab('nonexistent', { name: 'changed' });
        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('only.txt');
    });
});

describe('TabModel — updateTabContent', () =>
{
    beforeEach(() => resetStore());

    it('marks tab as modified when content differs from original', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.txt', content: 'original' });
        store.updateTabContent(id, 'changed');
        const tab = useNotemacStore.getState().tabs[0];

        expect(tab.content).toBe('changed');
        expect(tab.isModified).toBe(true);
    });

    it('marks tab as unmodified when content matches original', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'test.txt', content: 'original' });
        store.updateTabContent(id, 'changed');
        store.updateTabContent(id, 'original');
        const tab = useNotemacStore.getState().tabs[0];

        expect(tab.isModified).toBe(false);
    });
});

describe('TabModel — togglePinTab', () =>
{
    beforeEach(() => resetStore());

    it('toggles pin state', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'tab' });

        expect(useNotemacStore.getState().tabs[0].isPinned).toBe(false);

        store.togglePinTab(id);
        expect(useNotemacStore.getState().tabs[0].isPinned).toBe(true);

        store.togglePinTab(id);
        expect(useNotemacStore.getState().tabs[0].isPinned).toBe(false);
    });
});

describe('TabModel — setTabColor', () =>
{
    beforeEach(() => resetStore());

    it('sets tab color', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab();

        store.setTabColor(id, 'color1');
        expect(useNotemacStore.getState().tabs[0].tabColor).toBe('color1');

        store.setTabColor(id, 'color3');
        expect(useNotemacStore.getState().tabs[0].tabColor).toBe('color3');

        store.setTabColor(id, 'none');
        expect(useNotemacStore.getState().tabs[0].tabColor).toBe('none');
    });
});

describe('TabModel — moveTab', () =>
{
    beforeEach(() => resetStore());

    it('moves tab from one index to another', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        store.addTab({ name: 'c' });

        store.moveTab(0, 2);
        const names = useNotemacStore.getState().tabs.map(t => t.name);
        expect(names).toEqual(['b', 'c', 'a']);
    });

    it('moveTabForward moves active tab one position right', () =>
    {
        const store = useNotemacStore.getState();
        const id1 = store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        store.setActiveTab(id1);

        store.moveTabForward();
        const names = useNotemacStore.getState().tabs.map(t => t.name);
        expect(names).toEqual(['b', 'a']);
    });

    it('moveTabBackward moves active tab one position left', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        const id2 = store.addTab({ name: 'b' });
        store.setActiveTab(id2);

        store.moveTabBackward();
        const names = useNotemacStore.getState().tabs.map(t => t.name);
        expect(names).toEqual(['b', 'a']);
    });
});

describe('TabModel — addRecentFile', () =>
{
    beforeEach(() => resetStore());

    it('adds a recent file entry', () =>
    {
        const store = useNotemacStore.getState();
        store.addRecentFile('/path/to/file.txt', 'file.txt');
        const state = useNotemacStore.getState();

        expect(1 === state.recentFiles.length).toBe(true);
        expect(state.recentFiles[0].path).toBe('/path/to/file.txt');
        expect(state.recentFiles[0].name).toBe('file.txt');
    });

    it('moves duplicate path to front', () =>
    {
        const store = useNotemacStore.getState();
        store.addRecentFile('/a', 'a');
        store.addRecentFile('/b', 'b');
        store.addRecentFile('/a', 'a');
        const state = useNotemacStore.getState();

        expect(2 === state.recentFiles.length).toBe(true);
        expect(state.recentFiles[0].path).toBe('/a');
    });

    it('limits recent files list', () =>
    {
        const store = useNotemacStore.getState();
        for (let i = 0, maxCount = 25; i < maxCount; i++)
        {
            store.addRecentFile(`/path/${i}`, `file${i}`);
        }
        const state = useNotemacStore.getState();
        expect(20 === state.recentFiles.length).toBe(true);
    });
});
