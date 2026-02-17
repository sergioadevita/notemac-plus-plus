import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

function resetStore(): void
{
    useNotemacStore.setState({
        showFindReplace: false,
        findReplaceMode: 'find',
        searchOptions: {
            query: '',
            replaceText: '',
            isRegex: false,
            isCaseSensitive: false,
            isWholeWord: false,
            searchInSelection: false,
            wrapAround: true,
        },
        searchResults: [],
        showIncrementalSearch: false,
    });
}

describe('SearchModel — setShowFindReplace', () =>
{
    beforeEach(() => resetStore());

    it('opens find panel in find mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'find');
        const state = useNotemacStore.getState();

        expect(state.showFindReplace).toBe(true);
        expect(state.findReplaceMode).toBe('find');
    });

    it('opens find panel in replace mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'replace');
        const state = useNotemacStore.getState();

        expect(state.showFindReplace).toBe(true);
        expect(state.findReplaceMode).toBe('replace');
    });

    it('opens find panel in mark mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'mark');
        const state = useNotemacStore.getState();

        expect(state.findReplaceMode).toBe('mark');
    });

    it('opens find panel in findInFiles mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'findInFiles');
        const state = useNotemacStore.getState();

        expect(state.findReplaceMode).toBe('findInFiles');
    });

    it('closes find panel', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'find');
        store.setShowFindReplace(false);
        const state = useNotemacStore.getState();

        expect(state.showFindReplace).toBe(false);
    });

    it('preserves mode when closing', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'replace');
        store.setShowFindReplace(false);
        const state = useNotemacStore.getState();

        expect(state.findReplaceMode).toBe('replace');
    });
});

describe('SearchModel — updateSearchOptions', () =>
{
    beforeEach(() => resetStore());

    it('updates query', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ query: 'hello' });
        const state = useNotemacStore.getState();

        expect(state.searchOptions.query).toBe('hello');
    });

    it('updates multiple options at once', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ isRegex: true, isCaseSensitive: true, query: 'test' });
        const state = useNotemacStore.getState();

        expect(state.searchOptions.isRegex).toBe(true);
        expect(state.searchOptions.isCaseSensitive).toBe(true);
        expect(state.searchOptions.query).toBe('test');
    });

    it('preserves existing options when updating partial', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ query: 'first' });
        store.updateSearchOptions({ isRegex: true });
        const state = useNotemacStore.getState();

        expect(state.searchOptions.query).toBe('first');
        expect(state.searchOptions.isRegex).toBe(true);
    });

    it('updates replaceText', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ replaceText: 'replacement' });
        const state = useNotemacStore.getState();

        expect(state.searchOptions.replaceText).toBe('replacement');
    });

    it('updates wrapAround toggle', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ wrapAround: false });
        const state = useNotemacStore.getState();

        expect(state.searchOptions.wrapAround).toBe(false);
    });
});

describe('SearchModel — setShowIncrementalSearch', () =>
{
    beforeEach(() => resetStore());

    it('shows incremental search', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowIncrementalSearch(true);
        expect(useNotemacStore.getState().showIncrementalSearch).toBe(true);
    });

    it('hides incremental search', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowIncrementalSearch(true);
        store.setShowIncrementalSearch(false);
        expect(useNotemacStore.getState().showIncrementalSearch).toBe(false);
    });
});
