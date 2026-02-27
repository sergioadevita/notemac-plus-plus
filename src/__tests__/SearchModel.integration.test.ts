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

describe('SearchModel — setShowFindReplace edge cases', () =>
{
    beforeEach(() => resetStore());

    it('setShowFindReplace(true) without mode keeps current mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'replace');
        store.setShowFindReplace(true); // Call without mode
        const state = useNotemacStore.getState();

        expect(state.showFindReplace).toBe(true);
        expect(state.findReplaceMode).toBe('replace');
    });

    it('setShowFindReplace(true, "mark") then setShowFindReplace(true) preserves "mark" mode', () =>
    {
        const store = useNotemacStore.getState();
        store.setShowFindReplace(true, 'mark');
        store.setShowFindReplace(true);
        const state = useNotemacStore.getState();

        expect(state.findReplaceMode).toBe('mark');
        expect(state.showFindReplace).toBe(true);
    });

    it('rapid mode switching: find -> replace -> mark -> findInFiles all update correctly', () =>
    {
        const store = useNotemacStore.getState();

        store.setShowFindReplace(true, 'find');
        expect(useNotemacStore.getState().findReplaceMode).toBe('find');

        store.setShowFindReplace(true, 'replace');
        expect(useNotemacStore.getState().findReplaceMode).toBe('replace');

        store.setShowFindReplace(true, 'mark');
        expect(useNotemacStore.getState().findReplaceMode).toBe('mark');

        store.setShowFindReplace(true, 'findInFiles');
        expect(useNotemacStore.getState().findReplaceMode).toBe('findInFiles');
    });
});

describe('SearchModel — updateSearchOptions edge cases', () =>
{
    beforeEach(() => resetStore());

    it('updateSearchOptions with empty object does not change any options', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({ query: 'test' });
        const stateBefore = useNotemacStore.getState().searchOptions;

        store.updateSearchOptions({});
        const stateAfter = useNotemacStore.getState().searchOptions;

        expect(stateAfter.query).toBe(stateBefore.query);
        expect(stateAfter.replaceText).toBe(stateBefore.replaceText);
        expect(stateAfter.isRegex).toBe(stateBefore.isRegex);
        expect(stateAfter.isCaseSensitive).toBe(stateBefore.isCaseSensitive);
        expect(stateAfter.isWholeWord).toBe(stateBefore.isWholeWord);
        expect(stateAfter.searchInSelection).toBe(stateBefore.searchInSelection);
        expect(stateAfter.wrapAround).toBe(stateBefore.wrapAround);
    });

    it('updateSearchOptions can toggle searchInSelection', () =>
    {
        const store = useNotemacStore.getState();
        const initialValue = useNotemacStore.getState().searchOptions.searchInSelection;
        expect(initialValue).toBe(false);

        store.updateSearchOptions({ searchInSelection: true });
        expect(useNotemacStore.getState().searchOptions.searchInSelection).toBe(true);

        store.updateSearchOptions({ searchInSelection: false });
        expect(useNotemacStore.getState().searchOptions.searchInSelection).toBe(false);
    });

    it('all search options have correct default values', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.searchOptions.query).toBe('');
        expect(state.searchOptions.replaceText).toBe('');
        expect(state.searchOptions.isRegex).toBe(false);
        expect(state.searchOptions.isCaseSensitive).toBe(false);
        expect(state.searchOptions.isWholeWord).toBe(false);
        expect(state.searchOptions.searchInSelection).toBe(false);
        expect(state.searchOptions.wrapAround).toBe(true);
    });

    it('updateSearchOptions with all flags true sets all true', () =>
    {
        const store = useNotemacStore.getState();
        store.updateSearchOptions({
            query: 'pattern',
            replaceText: 'replacement',
            isRegex: true,
            isCaseSensitive: true,
            isWholeWord: true,
            searchInSelection: true,
            wrapAround: false,
        });

        const state = useNotemacStore.getState().searchOptions;
        expect(state.query).toBe('pattern');
        expect(state.replaceText).toBe('replacement');
        expect(state.isRegex).toBe(true);
        expect(state.isCaseSensitive).toBe(true);
        expect(state.isWholeWord).toBe(true);
        expect(state.searchInSelection).toBe(true);
        expect(state.wrapAround).toBe(false);
    });
});

describe('SearchModel — searchResults state', () =>
{
    beforeEach(() => resetStore());

    it('searchResults defaults to empty array', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.searchResults).toEqual([]);
        expect(Array.isArray(state.searchResults)).toBe(true);
    });

    it('setting searchResults directly via setState works', () =>
    {
        const mockResults = [
            { line: 1, column: 0, text: 'match' },
            { line: 2, column: 5, text: 'match' },
        ];

        useNotemacStore.setState({ searchResults: mockResults });
        const state = useNotemacStore.getState();

        expect(state.searchResults).toEqual(mockResults);
        expect(state.searchResults.length).toBe(2);
    });
});

describe('SearchModel — independence of flags', () =>
{
    beforeEach(() => resetStore());

    it('showIncrementalSearch and showFindReplace are independent', () =>
    {
        const store = useNotemacStore.getState();

        store.setShowFindReplace(true, 'find');
        store.setShowIncrementalSearch(true);
        expect(useNotemacStore.getState().showFindReplace).toBe(true);
        expect(useNotemacStore.getState().showIncrementalSearch).toBe(true);

        store.setShowIncrementalSearch(false);
        expect(useNotemacStore.getState().showFindReplace).toBe(true);
        expect(useNotemacStore.getState().showIncrementalSearch).toBe(false);

        store.setShowFindReplace(false);
        expect(useNotemacStore.getState().showFindReplace).toBe(false);
        expect(useNotemacStore.getState().showIncrementalSearch).toBe(false);
    });
});
