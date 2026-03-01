import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { CustomLanguageDefinition } from '../Commons/Types';
import { LIMIT_CUSTOM_LANGUAGES } from '../Commons/Constants';

export interface NotemacLanguageDefinitionSlice
{
    customLanguages: CustomLanguageDefinition[];
    fileAssociationOverrides: Record<string, string>;

    AddCustomLanguage: (lang: CustomLanguageDefinition) => void;
    UpdateCustomLanguage: (id: string, updates: Partial<CustomLanguageDefinition>) => void;
    RemoveCustomLanguage: (id: string) => void;
    SetCustomLanguages: (languages: CustomLanguageDefinition[]) => void;

    SetFileAssociationOverride: (extension: string, languageId: string) => void;
    RemoveFileAssociationOverride: (extension: string) => void;
    SetFileAssociationOverrides: (overrides: Record<string, string>) => void;
}

export const createLanguageDefinitionSlice: StateCreator<NotemacLanguageDefinitionSlice, [], [], NotemacLanguageDefinitionSlice> = (set) => ({
    customLanguages: [],
    fileAssociationOverrides: {},

    AddCustomLanguage: (lang) =>
    {
        set(produce((state: NotemacLanguageDefinitionSlice) =>
        {
            // Prevent duplicate IDs
            const exists = state.customLanguages.some(l => l.id === lang.id);
            if (!exists && state.customLanguages.length < LIMIT_CUSTOM_LANGUAGES)
            {
                state.customLanguages.push(lang);
            }
        }));
    },

    UpdateCustomLanguage: (id, updates) =>
    {
        set(produce((state: NotemacLanguageDefinitionSlice) =>
        {
            const index = state.customLanguages.findIndex(l => l.id === id);
            if (-1 !== index)
            {
                state.customLanguages[index] = { ...state.customLanguages[index], ...updates };
            }
        }));
    },

    RemoveCustomLanguage: (id) =>
    {
        set(produce((state: NotemacLanguageDefinitionSlice) =>
        {
            state.customLanguages = state.customLanguages.filter(l => l.id !== id);
        }));
    },

    SetCustomLanguages: (languages) =>
    {
        set({ customLanguages: languages });
    },

    SetFileAssociationOverride: (extension, languageId) =>
    {
        set(produce((state: NotemacLanguageDefinitionSlice) =>
        {
            const ext = extension.startsWith('.') ? extension : `.${extension}`;
            state.fileAssociationOverrides[ext] = languageId;
        }));
    },

    RemoveFileAssociationOverride: (extension) =>
    {
        set(produce((state: NotemacLanguageDefinitionSlice) =>
        {
            const ext = extension.startsWith('.') ? extension : `.${extension}`;
            delete state.fileAssociationOverrides[ext];
        }));
    },

    SetFileAssociationOverrides: (overrides) =>
    {
        set({ fileAssociationOverrides: overrides });
    },
});
