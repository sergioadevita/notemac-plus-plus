import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { CustomLanguageDefinition } from '../Notemac/Commons/Types';
import { LIMIT_CUSTOM_LANGUAGES } from '../Notemac/Commons/Constants';

function resetStore(): void
{
    useNotemacStore.setState({
        customLanguages: [],
        fileAssociationOverrides: {},
    });
}

function createTestLanguage(id: string, label: string = 'TestLang'): CustomLanguageDefinition
{
    return {
        id,
        label,
        extensions: ['.test'],
        aliases: ['test'],
        monarchTokens: {
            tokenizer: {
                root: [['\\w+', 'keyword']],
            },
        },
    };
}

describe('LanguageDefinitionModel — AddCustomLanguage', () =>
{
    beforeEach(() => resetStore());

    it('adds a new custom language', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1', 'Language One');
        store.AddCustomLanguage(lang);
        const state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('lang1');
        expect(state.customLanguages[0].label).toBe('Language One');
    });

    it('prevents duplicate language IDs', () =>
    {
        const store = useNotemacStore.getState();
        const lang1 = createTestLanguage('lang1', 'First');
        const lang2 = createTestLanguage('lang1', 'Second');
        store.AddCustomLanguage(lang1);
        store.AddCustomLanguage(lang2);
        const state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].label).toBe('First');
    });

    it('adds multiple languages with different IDs', () =>
    {
        const store = useNotemacStore.getState();
        const lang1 = createTestLanguage('lang1');
        const lang2 = createTestLanguage('lang2');
        const lang3 = createTestLanguage('lang3');
        store.AddCustomLanguage(lang1);
        store.AddCustomLanguage(lang2);
        store.AddCustomLanguage(lang3);
        const state = useNotemacStore.getState();

        expect(3 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('lang1');
        expect(state.customLanguages[1].id).toBe('lang2');
        expect(state.customLanguages[2].id).toBe('lang3');
    });

    it('respects custom language limit', () =>
    {
        const store = useNotemacStore.getState();
        for (let i = 0; i < LIMIT_CUSTOM_LANGUAGES + 5; i++)
        {
            const lang = createTestLanguage(`lang${i}`);
            store.AddCustomLanguage(lang);
        }
        const state = useNotemacStore.getState();

        expect(LIMIT_CUSTOM_LANGUAGES === state.customLanguages.length).toBe(true);
    });

    it('does not add language when limit reached', () =>
    {
        const store = useNotemacStore.getState();
        for (let i = 0; i < LIMIT_CUSTOM_LANGUAGES; i++)
        {
            const lang = createTestLanguage(`lang${i}`);
            store.AddCustomLanguage(lang);
        }
        const beforeState = useNotemacStore.getState();
        const beforeCount = beforeState.customLanguages.length;

        const extraLang = createTestLanguage('extra');
        store.AddCustomLanguage(extraLang);
        const afterState = useNotemacStore.getState();

        expect(beforeCount === afterState.customLanguages.length).toBe(true);
        expect(!afterState.customLanguages.some(l => l.id === 'extra')).toBe(true);
    });

    it('preserves language properties', () =>
    {
        const store = useNotemacStore.getState();
        const lang: CustomLanguageDefinition = {
            id: 'custom',
            label: 'Custom Lang',
            extensions: ['.custom', '.cst'],
            aliases: ['custom', 'cst'],
            monarchTokens: {
                keywords: ['if', 'else'],
                operators: ['+', '-'],
                tokenizer: {
                    root: [['\\w+', 'keyword']],
                },
            },
            brackets: [['(', ')'], ['{', '}']],
            comments: { lineComment: '//' },
        };
        store.AddCustomLanguage(lang);
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].extensions).toEqual(['.custom', '.cst']);
        expect(state.customLanguages[0].aliases).toEqual(['custom', 'cst']);
        expect(state.customLanguages[0].brackets).toEqual([['(', ')'], ['{', '}']]);
    });
});

describe('LanguageDefinitionModel — UpdateCustomLanguage', () =>
{
    beforeEach(() => resetStore());

    it('updates an existing language', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1', 'Original');
        store.AddCustomLanguage(lang);
        store.UpdateCustomLanguage('lang1', { label: 'Updated' });
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].label).toBe('Updated');
    });

    it('updates multiple properties', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        store.AddCustomLanguage(lang);
        store.UpdateCustomLanguage('lang1', {
            label: 'New Label',
            extensions: ['.new', '.updated'],
        });
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].label).toBe('New Label');
        expect(state.customLanguages[0].extensions).toEqual(['.new', '.updated']);
    });

    it('does not modify language when ID does not exist', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        store.AddCustomLanguage(lang);
        const stateAfterAdd = useNotemacStore.getState();
        const beforeContent = stateAfterAdd.customLanguages[0].label;
        store.UpdateCustomLanguage('nonexistent', { label: 'Changed' });
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].label).toBe(beforeContent);
    });

    it('preserves unchanged properties during update', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1', 'Original');
        lang.aliases = ['alias1', 'alias2'];
        store.AddCustomLanguage(lang);
        store.UpdateCustomLanguage('lang1', { label: 'Updated' });
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].aliases).toEqual(['alias1', 'alias2']);
    });

    it('updates partial extensions array', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        lang.extensions = ['.old1', '.old2'];
        store.AddCustomLanguage(lang);
        store.UpdateCustomLanguage('lang1', { extensions: ['.new'] });
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].extensions).toEqual(['.new']);
    });

    it('updates with empty object does nothing', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1', 'Original');
        store.AddCustomLanguage(lang);
        store.UpdateCustomLanguage('lang1', {});
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].label).toBe('Original');
    });
});

describe('LanguageDefinitionModel — RemoveCustomLanguage', () =>
{
    beforeEach(() => resetStore());

    it('removes a language by ID', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        store.AddCustomLanguage(lang);
        store.RemoveCustomLanguage('lang1');
        const state = useNotemacStore.getState();

        expect(0 === state.customLanguages.length).toBe(true);
    });

    it('removes one language from multiple', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.AddCustomLanguage(createTestLanguage('lang2'));
        store.AddCustomLanguage(createTestLanguage('lang3'));
        store.RemoveCustomLanguage('lang2');
        const state = useNotemacStore.getState();

        expect(2 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('lang1');
        expect(state.customLanguages[1].id).toBe('lang3');
    });

    it('does not fail when removing nonexistent language', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.RemoveCustomLanguage('nonexistent');
        const state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
    });

    it('removes first language from list', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.AddCustomLanguage(createTestLanguage('lang2'));
        store.RemoveCustomLanguage('lang1');
        const state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('lang2');
    });

    it('removes last language from list', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.AddCustomLanguage(createTestLanguage('lang2'));
        store.RemoveCustomLanguage('lang2');
        const state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('lang1');
    });
});

describe('LanguageDefinitionModel — SetCustomLanguages', () =>
{
    beforeEach(() => resetStore());

    it('replaces entire custom languages array', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.AddCustomLanguage(createTestLanguage('lang2'));
        const newLanguages = [
            createTestLanguage('new1'),
            createTestLanguage('new2'),
            createTestLanguage('new3'),
        ];
        store.SetCustomLanguages(newLanguages);
        const state = useNotemacStore.getState();

        expect(3 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].id).toBe('new1');
        expect(state.customLanguages[2].id).toBe('new3');
    });

    it('sets empty array', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.SetCustomLanguages([]);
        const state = useNotemacStore.getState();

        expect(0 === state.customLanguages.length).toBe(true);
    });

    it('can exceed limit with direct set', () =>
    {
        const store = useNotemacStore.getState();
        const languages: CustomLanguageDefinition[] = [];
        for (let i = 0; i < LIMIT_CUSTOM_LANGUAGES + 10; i++)
        {
            languages.push(createTestLanguage(`lang${i}`));
        }
        store.SetCustomLanguages(languages);
        const state = useNotemacStore.getState();

        expect(state.customLanguages.length > LIMIT_CUSTOM_LANGUAGES).toBe(true);
    });

    it('preserves all properties in new array', () =>
    {
        const store = useNotemacStore.getState();
        const lang: CustomLanguageDefinition = {
            id: 'complex',
            label: 'Complex Lang',
            extensions: ['.cx'],
            aliases: ['cx'],
            monarchTokens: {
                keywords: ['key1'],
                operators: ['+'],
                tokenizer: { root: [['\\d+', 'number']] },
            },
        };
        store.SetCustomLanguages([lang]);
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].label).toBe('Complex Lang');
        expect(state.customLanguages[0].monarchTokens.keywords).toEqual(['key1']);
    });
});

describe('LanguageDefinitionModel — SetFileAssociationOverride', () =>
{
    beforeEach(() => resetStore());

    it('adds file association override with leading dot', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
    });

    it('adds file association override without leading dot', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('txt', 'plaintext');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
    });

    it('updates existing override', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'oldtype');
        store.SetFileAssociationOverride('.txt', 'newtype');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBe('newtype');
        expect(1 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });

    it('adds multiple file association overrides', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.SetFileAssociationOverride('.md', 'markdown');
        store.SetFileAssociationOverride('.json', 'json');
        const state = useNotemacStore.getState();

        expect(3 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
        expect(state.fileAssociationOverrides['.md']).toBe('markdown');
        expect(state.fileAssociationOverrides['.json']).toBe('json');
    });

    it('normalizes extension with uppercase letters', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('TXT', 'plaintext');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.TXT']).toBe('plaintext');
    });
});

describe('LanguageDefinitionModel — RemoveFileAssociationOverride', () =>
{
    beforeEach(() => resetStore());

    it('removes override with leading dot', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.RemoveFileAssociationOverride('.txt');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBeUndefined();
    });

    it('removes override without leading dot', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.RemoveFileAssociationOverride('txt');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBeUndefined();
    });

    it('does not fail when removing nonexistent override', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.RemoveFileAssociationOverride('.nonexistent');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
        expect(1 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });

    it('removes one override from multiple', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.SetFileAssociationOverride('.md', 'markdown');
        store.SetFileAssociationOverride('.json', 'json');
        store.RemoveFileAssociationOverride('.md');
        const state = useNotemacStore.getState();

        expect(2 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
        expect(state.fileAssociationOverrides['.md']).toBeUndefined();
        expect(state.fileAssociationOverrides['.json']).toBe('json');
    });

    it('can remove all overrides individually', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.a', 'lang1');
        store.SetFileAssociationOverride('.b', 'lang2');
        store.RemoveFileAssociationOverride('.a');
        store.RemoveFileAssociationOverride('.b');
        const state = useNotemacStore.getState();

        expect(0 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });
});

describe('LanguageDefinitionModel — SetFileAssociationOverrides', () =>
{
    beforeEach(() => resetStore());

    it('replaces entire overrides map', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.old', 'oldlang');
        const newOverrides = {
            '.txt': 'plaintext',
            '.md': 'markdown',
            '.json': 'json',
        };
        store.SetFileAssociationOverrides(newOverrides);
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.old']).toBeUndefined();
        expect(state.fileAssociationOverrides['.txt']).toBe('plaintext');
        expect(state.fileAssociationOverrides['.md']).toBe('markdown');
        expect(state.fileAssociationOverrides['.json']).toBe('json');
    });

    it('sets empty overrides map', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'plaintext');
        store.SetFileAssociationOverrides({});
        const state = useNotemacStore.getState();

        expect(0 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });

    it('can set large overrides map', () =>
    {
        const store = useNotemacStore.getState();
        const overrides: Record<string, string> = {};
        for (let i = 0; i < 100; i++)
        {
            overrides[`.ext${i}`] = `lang${i}`;
        }
        store.SetFileAssociationOverrides(overrides);
        const state = useNotemacStore.getState();

        expect(100 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
        expect(state.fileAssociationOverrides['.ext50']).toBe('lang50');
    });

    it('preserves exact keys provided', () =>
    {
        const store = useNotemacStore.getState();
        const overrides = {
            '.TXT': 'text',
            '.MD': 'markdown',
        };
        store.SetFileAssociationOverrides(overrides);
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.TXT']).toBe('text');
        expect(state.fileAssociationOverrides['.MD']).toBe('markdown');
    });
});

describe('LanguageDefinitionModel — edge cases', () =>
{
    beforeEach(() => resetStore());

    it('handles empty custom languages state', () =>
    {
        const state = useNotemacStore.getState();
        expect(0 === state.customLanguages.length).toBe(true);
        expect(Object.keys(state.fileAssociationOverrides).length === 0).toBe(true);
    });

    it('handles languages with empty extensions array', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        lang.extensions = [];
        store.AddCustomLanguage(lang);
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].extensions).toEqual([]);
    });

    it('handles languages with empty aliases array', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang1');
        lang.aliases = [];
        store.AddCustomLanguage(lang);
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].aliases).toEqual([]);
    });

    it('handles duplicate extensions across languages', () =>
    {
        const store = useNotemacStore.getState();
        const lang1 = createTestLanguage('lang1');
        lang1.extensions = ['.custom'];
        const lang2 = createTestLanguage('lang2');
        lang2.extensions = ['.custom'];
        store.AddCustomLanguage(lang1);
        store.AddCustomLanguage(lang2);
        const state = useNotemacStore.getState();

        expect(2 === state.customLanguages.length).toBe(true);
        expect(state.customLanguages[0].extensions).toEqual(['.custom']);
        expect(state.customLanguages[1].extensions).toEqual(['.custom']);
    });

    it('handles file extension override for same extension multiple times', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.txt', 'lang1');
        store.SetFileAssociationOverride('.txt', 'lang2');
        store.SetFileAssociationOverride('.txt', 'lang3');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.txt']).toBe('lang3');
        expect(1 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });

    it('maintains separate state for languages and overrides', () =>
    {
        const store = useNotemacStore.getState();
        store.AddCustomLanguage(createTestLanguage('lang1'));
        store.SetFileAssociationOverride('.test', 'lang1');
        let state = useNotemacStore.getState();

        expect(1 === state.customLanguages.length).toBe(true);
        expect(1 === Object.keys(state.fileAssociationOverrides).length).toBe(true);

        store.RemoveCustomLanguage('lang1');
        state = useNotemacStore.getState();

        expect(0 === state.customLanguages.length).toBe(true);
        expect(1 === Object.keys(state.fileAssociationOverrides).length).toBe(true);
    });

    it('handles language ID with special characters', () =>
    {
        const store = useNotemacStore.getState();
        const lang = createTestLanguage('lang-with-dashes_and_underscores.v1');
        store.AddCustomLanguage(lang);
        const state = useNotemacStore.getState();

        expect(state.customLanguages[0].id).toBe('lang-with-dashes_and_underscores.v1');
    });

    it('handles extension with multiple dots', () =>
    {
        const store = useNotemacStore.getState();
        store.SetFileAssociationOverride('.tar.gz', 'archive');
        const state = useNotemacStore.getState();

        expect(state.fileAssociationOverrides['.tar.gz']).toBe('archive');
    });
});
