import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { SavedSnippet } from "../Commons/Types";
import { GetValue, SetValue } from '../../Shared/Persistence/PersistenceService';
import { DB_SAVED_SNIPPETS } from '../Commons/Constants';
import { generateId } from '../../Shared/Helpers/IdHelpers';

export interface NotemacSnippetSlice
{
    savedSnippets: SavedSnippet[];
    addSnippet: (snippet: Omit<SavedSnippet, 'id'>) => void;
    removeSnippet: (id: string) => void;
    updateSnippet: (id: string, updates: Partial<SavedSnippet>) => void;
    loadSnippets: () => void;
}

export const createSnippetSlice: StateCreator<NotemacSnippetSlice, [], [], NotemacSnippetSlice> = (set, get) => ({
    savedSnippets: [],

    addSnippet: (snippet) =>
    {
        set(produce((state: NotemacSnippetSlice) =>
        {
            const newSnippet: SavedSnippet = { ...snippet, id: generateId() };
            state.savedSnippets.push(newSnippet);
        }));
        SetValue(DB_SAVED_SNIPPETS, get().savedSnippets);
    },

    removeSnippet: (id) =>
    {
        set(produce((state: NotemacSnippetSlice) =>
        {
            const index = state.savedSnippets.findIndex(s => s.id === id);
            if (-1 !== index)
                state.savedSnippets.splice(index, 1);
        }));
        SetValue(DB_SAVED_SNIPPETS, get().savedSnippets);
    },

    updateSnippet: (id, updates) =>
    {
        set(produce((state: NotemacSnippetSlice) =>
        {
            const snippet = state.savedSnippets.find(s => s.id === id);
            if (snippet)
                Object.assign(snippet, updates);
        }));
        SetValue(DB_SAVED_SNIPPETS, get().savedSnippets);
    },

    loadSnippets: () =>
    {
        const saved = GetValue<SavedSnippet[]>(DB_SAVED_SNIPPETS);
        if (saved)
            set({ savedSnippets: saved });
    },
});
