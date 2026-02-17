import { StateCreator } from 'zustand';
import type { SearchOptions } from "../Commons/Types";
import type { FindReplaceMode } from "../Commons/Enums";

const defaultSearchOptions: SearchOptions =
{
    query: '',
    replaceText: '',
    isRegex: false,
    isCaseSensitive: false,
    isWholeWord: false,
    searchInSelection: false,
    wrapAround: true,
};

export interface NotemacSearchSlice
{
    showFindReplace: boolean;
    findReplaceMode: FindReplaceMode;
    searchOptions: SearchOptions;
    searchResults: any[];
    showIncrementalSearch: boolean;

    setShowFindReplace: (show: boolean, mode?: FindReplaceMode) => void;
    updateSearchOptions: (options: Partial<SearchOptions>) => void;
    setShowIncrementalSearch: (show: boolean) => void;
}

export const createSearchSlice: StateCreator<NotemacSearchSlice, [], [], NotemacSearchSlice> = (set, get) => ({
    showFindReplace: false,
    findReplaceMode: 'find',
    searchOptions: { ...defaultSearchOptions },
    searchResults: [],
    showIncrementalSearch: false,

    setShowFindReplace: (show, mode) => set({
        showFindReplace: show,
        findReplaceMode: mode || get().findReplaceMode,
    }),

    updateSearchOptions: (options) =>
    {
        set((state) => ({
            searchOptions: { ...state.searchOptions, ...options },
        }));
    },

    setShowIncrementalSearch: (show) => set({ showIncrementalSearch: show }),
});
