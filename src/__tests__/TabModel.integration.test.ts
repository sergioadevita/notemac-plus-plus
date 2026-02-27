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

describe('TabModel — Edge Cases: closedTabs limit', () =>
{
    beforeEach(() => resetStore());

    it('enforces LIMIT_CLOSED_TABS at 20 when closing 25 tabs', () =>
    {
        const store = useNotemacStore.getState();
        const ids = [];

        for (let i = 0; i < 25; i++)
        {
            ids.push(store.addTab({ name: `tab${i}` }));
        }

        for (const id of ids)
        {
            store.closeTab(id);
        }

        const state = useNotemacStore.getState();
        expect(state.closedTabs.length).toBe(20);
        expect(state.closedTabs[0].name).toBe('tab5');
        expect(state.closedTabs[19].name).toBe('tab24');
    });
});

describe('TabModel — Edge Cases: closeTab activates previous when closing last', () =>
{
    beforeEach(() => resetStore());

    it('activates previous tab when closing last tab', () =>
    {
        const store = useNotemacStore.getState();
        const idA = store.addTab({ name: 'a' });
        const idB = store.addTab({ name: 'b' });
        const idC = store.addTab({ name: 'c' });

        store.setActiveTab(idC);
        expect(useNotemacStore.getState().activeTabId).toBe(idC);

        store.closeTab(idC);
        const state = useNotemacStore.getState();

        expect(state.activeTabId).toBe(idB);
        expect(2 === state.tabs.length).toBe(true);
    });
});

describe('TabModel — Edge Cases: closeTab activates next when closing middle', () =>
{
    beforeEach(() => resetStore());

    it('activates next tab when closing middle tab of three', () =>
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
        expect(state.tabs[0].name).toBe('tab1');
        expect(state.tabs[1].name).toBe('tab3');
    });
});

describe('TabModel — Edge Cases: closeUnchangedTabs and activeTabId', () =>
{
    beforeEach(() => resetStore());

    it('sets activeTabId to null when all tabs unchanged and all closed', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'unchanged1' });
        store.addTab({ name: 'unchanged2' });
        store.addTab({ name: 'unchanged3' });

        store.closeUnchangedTabs();
        const state = useNotemacStore.getState();

        expect(0 === state.tabs.length).toBe(true);
        expect(null === state.activeTabId).toBe(true);
        expect(3 === state.closedTabs.length).toBe(true);
    });
});

describe('TabModel — Edge Cases: closeAllButPinned with active unpinned', () =>
{
    beforeEach(() => resetStore());

    it('switches active to first pinned tab when active is unpinned', () =>
    {
        const store = useNotemacStore.getState();
        const idPinned1 = store.addTab({ name: 'pinned1' });
        const idUnpinned = store.addTab({ name: 'unpinned' });
        const idPinned2 = store.addTab({ name: 'pinned2' });

        store.togglePinTab(idPinned1);
        store.togglePinTab(idPinned2);
        store.setActiveTab(idUnpinned);

        expect(useNotemacStore.getState().activeTabId).toBe(idUnpinned);

        store.closeAllButPinned();
        const state = useNotemacStore.getState();

        expect(2 === state.tabs.length).toBe(true);
        expect(state.activeTabId).toBe(idPinned1);
        expect(state.tabs[0].isPinned).toBe(true);
        expect(state.tabs[1].isPinned).toBe(true);
    });
});

describe('TabModel — Edge Cases: nextTab with single tab', () =>
{
    beforeEach(() => resetStore());

    it('is no-op when only one tab exists', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'only' });

        const stateBefore = useNotemacStore.getState().activeTabId;
        store.nextTab();
        const stateAfter = useNotemacStore.getState().activeTabId;

        expect(stateBefore).toBe(stateAfter);
        expect(stateAfter).toBe(id);
    });
});

describe('TabModel — Edge Cases: prevTab with single tab', () =>
{
    beforeEach(() => resetStore());

    it('is no-op when only one tab exists', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({ name: 'only' });

        const stateBefore = useNotemacStore.getState().activeTabId;
        store.prevTab();
        const stateAfter = useNotemacStore.getState().activeTabId;

        expect(stateBefore).toBe(stateAfter);
        expect(stateAfter).toBe(id);
    });
});

describe('TabModel — Edge Cases: moveTabForward at end', () =>
{
    beforeEach(() => resetStore());

    it('is no-op when active tab is last', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        const idLast = store.addTab({ name: 'b' });

        store.setActiveTab(idLast);
        store.moveTabForward();

        const state = useNotemacStore.getState();
        const names = state.tabs.map(t => t.name);

        expect(names).toEqual(['a', 'b']);
        expect(state.activeTabId).toBe(idLast);
    });
});

describe('TabModel — Edge Cases: moveTabBackward at start', () =>
{
    beforeEach(() => resetStore());

    it('is no-op when active tab is first', () =>
    {
        const store = useNotemacStore.getState();
        const idFirst = store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });

        store.setActiveTab(idFirst);
        store.moveTabBackward();

        const state = useNotemacStore.getState();
        const names = state.tabs.map(t => t.name);

        expect(names).toEqual(['a', 'b']);
        expect(state.activeTabId).toBe(idFirst);
    });
});

describe('TabModel — Edge Cases: restoreLastClosedTab generates NEW id', () =>
{
    beforeEach(() => resetStore());

    it('generates new id different from original when restoring', () =>
    {
        const store = useNotemacStore.getState();
        const originalId = store.addTab({ name: 'toRestore.txt', content: 'data' });

        store.closeTab(originalId);
        expect(0 === useNotemacStore.getState().tabs.length).toBe(true);

        store.restoreLastClosedTab();
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].id).not.toBe(originalId);
        expect(state.activeTabId).not.toBe(originalId);
    });
});

describe('TabModel — Edge Cases: restoreLastClosedTab preserves content', () =>
{
    beforeEach(() => resetStore());

    it('preserves all content and metadata after restore', () =>
    {
        const store = useNotemacStore.getState();
        const id = store.addTab({
            name: 'script.py',
            content: 'print("hello")',
            language: 'python',
            encoding: 'utf-8',
        });

        const originalTab = useNotemacStore.getState().tabs[0];
        store.closeTab(id);
        store.restoreLastClosedTab();

        const state = useNotemacStore.getState();
        const restoredTab = state.tabs[0];

        expect(restoredTab.name).toBe(originalTab.name);
        expect(restoredTab.content).toBe(originalTab.content);
        expect(restoredTab.language).toBe(originalTab.language);
        expect(restoredTab.encoding).toBe(originalTab.encoding);
        expect(restoredTab.lineEnding).toBe(originalTab.lineEnding);
    });
});

describe('TabModel — Edge Cases: Multiple restores in LIFO order', () =>
{
    beforeEach(() => resetStore());

    it('restores tabs in LIFO order (last closed, first restored)', () =>
    {
        const store = useNotemacStore.getState();
        const idA = store.addTab({ name: 'a' });
        const idB = store.addTab({ name: 'b' });
        const idC = store.addTab({ name: 'c' });

        store.closeTab(idA);
        store.closeTab(idB);
        store.closeTab(idC);

        expect(0 === useNotemacStore.getState().tabs.length).toBe(true);

        store.restoreLastClosedTab();
        let state = useNotemacStore.getState();
        expect(state.tabs[0].name).toBe('c');

        store.restoreLastClosedTab();
        state = useNotemacStore.getState();
        expect(state.tabs[1].name).toBe('b');

        store.restoreLastClosedTab();
        state = useNotemacStore.getState();
        expect(state.tabs[2].name).toBe('a');
    });
});

describe('TabModel — Edge Cases: addTab auto-increments name', () =>
{
    beforeEach(() => resetStore());

    it('auto-generates sequential names for tabs without names', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab();
        store.addTab();
        store.addTab();

        const state = useNotemacStore.getState();

        expect(state.tabs[0].name).toBe('new 1');
        expect(state.tabs[1].name).toBe('new 2');
        expect(state.tabs[2].name).toBe('new 3');
    });
});

describe('TabModel — Edge Cases: moveTab with same index', () =>
{
    beforeEach(() => resetStore());

    it('is no-op when from and to indices are the same', () =>
    {
        const store = useNotemacStore.getState();
        store.addTab({ name: 'a' });
        store.addTab({ name: 'b' });
        store.addTab({ name: 'c' });

        store.moveTab(1, 1);
        const state = useNotemacStore.getState();
        const names = state.tabs.map(t => t.name);

        expect(names).toEqual(['a', 'b', 'c']);
    });
});

describe('TabModel — Edge Cases: closeOtherTabs adds to closedTabs', () =>
{
    beforeEach(() => resetStore());

    it('adds closed tabs to closedTabs array', () =>
    {
        const store = useNotemacStore.getState();
        const idKeep = store.addTab({ name: 'keep' });
        store.addTab({ name: 'close1' });
        store.addTab({ name: 'close2' });

        store.closeOtherTabs(idKeep);
        const state = useNotemacStore.getState();

        expect(1 === state.tabs.length).toBe(true);
        expect(state.tabs[0].id).toBe(idKeep);
        expect(2 === state.closedTabs.length).toBe(true);
        expect(state.closedTabs.some(t => t.name === 'close1')).toBe(true);
        expect(state.closedTabs.some(t => t.name === 'close2')).toBe(true);
    });
});
