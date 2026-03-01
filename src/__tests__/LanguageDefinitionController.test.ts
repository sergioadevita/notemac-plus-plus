import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    RegisterCustomLanguage,
    UnregisterCustomLanguage,
    UpdateCustomLanguage,
    SetFileAssociation,
    RemoveFileAssociation,
    InitializeCustomLanguages,
    SyncPluginLanguagesWithMonaco,
} from '../Notemac/Controllers/LanguageDefinitionController';
import * as LanguageDefinitionService from '../Notemac/Services/LanguageDefinitionService';
import * as EventDispatcher from '../Shared/EventDispatcher/EventDispatcher';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { CustomLanguageDefinition } from '../Notemac/Commons/Types';

vi.mock('../Notemac/Services/LanguageDefinitionService', () =>
({
    ValidateLanguageDefinition: vi.fn((lang) =>
    {
        if (!lang.id || !lang.label || !lang.monarchTokens)
        {
            return {
                valid: false,
                errors: ['Invalid language definition'],
            };
        }
        return { valid: true, errors: [] };
    }),
    RegisterLanguageWithMonaco: vi.fn(),
    UnregisterLanguageFromMonaco: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: {
        LANGUAGE_REGISTERED: 'notemac-language-registered',
        LANGUAGE_UNREGISTERED: 'notemac-language-unregistered',
    },
}));

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// Get mocked functions
const mockRegisterLanguageWithMonaco = vi.mocked(LanguageDefinitionService.RegisterLanguageWithMonaco);
const mockUnregisterLanguageFromMonaco = vi.mocked(LanguageDefinitionService.UnregisterLanguageFromMonaco);
const mockValidateLanguageDefinition = vi.mocked(LanguageDefinitionService.ValidateLanguageDefinition);
const mockDispatch = vi.mocked(EventDispatcher.Dispatch);

// ============================================================
// Test Fixtures
// ============================================================

function createValidLanguage(overrides?: Partial<CustomLanguageDefinition>): CustomLanguageDefinition
{
    return {
        id: 'test-lang',
        label: 'Test Language',
        extensions: ['.test', '.tst'],
        aliases: ['test', 'tst'],
        monarchTokens: {
            tokenizer: {
                root: [
                    [/[a-z]+/, 'identifier'],
                ],
            },
        },
        ...overrides,
    };
}

function createInvalidLanguage(): CustomLanguageDefinition
{
    return {
        id: '',
        label: '',
        extensions: [],
        aliases: [],
        monarchTokens: { tokenizer: {} },
    };
}

// ============================================================
// RegisterCustomLanguage Tests
// ============================================================

describe('LanguageDefinitionController — RegisterCustomLanguage', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            customLanguages: [],
            AddCustomLanguage: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should register a valid custom language successfully', () =>
    {
        const lang = createValidLanguage();
        const result = RegisterCustomLanguage(lang);

        expect(true === result.success).toBe(true);
        expect(0 === result.errors.length).toBe(true);
        expect(mockStore.AddCustomLanguage).toHaveBeenCalledWith(lang);
        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledWith(lang);
        expect(mockDispatch).toHaveBeenCalledWith(
            'notemac-language-registered',
            { languageId: 'test-lang', label: 'Test Language' }
        );
    });

    it('should reject an invalid language definition', () =>
    {
        const invalidLang = createInvalidLanguage();
        const result = RegisterCustomLanguage(invalidLang);

        expect(false === result.success).toBe(true);
        expect(0 < result.errors.length).toBe(true);
        expect(mockStore.AddCustomLanguage).not.toHaveBeenCalled();
    });

    it('should reject a duplicate language ID', () =>
    {
        mockStore.customLanguages = [createValidLanguage()];
        const lang = createValidLanguage();
        const result = RegisterCustomLanguage(lang);

        expect(false === result.success).toBe(true);
        expect(result.errors[0]).toContain('already exists');
        expect(mockStore.AddCustomLanguage).not.toHaveBeenCalled();
    });

    it('should return errors array with validation messages', () =>
    {
        const result = RegisterCustomLanguage(createInvalidLanguage());
        expect(Array.isArray(result.errors)).toBe(true);
        expect(0 < result.errors.length).toBe(true);
    });

    it('should dispatch event with correct payload on success', () =>
    {
        const lang = createValidLanguage({ id: 'custom-id', label: 'Custom Label' });
        RegisterCustomLanguage(lang);

        const calls = mockDispatch.mock.calls;
        expect(0 < calls.length).toBe(true);
        const lastCall = calls[calls.length - 1];
        expect('notemac-language-registered' === lastCall[0]).toBe(true);
        expect(lastCall[1].languageId).toBe('custom-id');
        expect(lastCall[1].label).toBe('Custom Label');
    });

    it('should not dispatch event if validation fails', () =>
    {
        RegisterCustomLanguage(createInvalidLanguage());

        const calls = mockDispatch.mock.calls;
        expect(0 === calls.length).toBe(true);
    });

    it('should not dispatch event if language already exists', () =>
    {
        mockStore.customLanguages = [createValidLanguage()];
        RegisterCustomLanguage(createValidLanguage());

        const calls = mockDispatch.mock.calls;
        expect(0 === calls.length).toBe(true);
    });
});

// ============================================================
// UnregisterCustomLanguage Tests
// ============================================================

describe('LanguageDefinitionController — UnregisterCustomLanguage', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            customLanguages: [createValidLanguage()],
            RemoveCustomLanguage: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should unregister an existing custom language', () =>
    {
        UnregisterCustomLanguage('test-lang');

        expect(mockStore.RemoveCustomLanguage).toHaveBeenCalledWith('test-lang');
        expect(mockUnregisterLanguageFromMonaco).toHaveBeenCalledWith('test-lang');
    });

    it('should dispatch unregistered event', () =>
    {
        UnregisterCustomLanguage('test-lang');

        expect(mockDispatch).toHaveBeenCalledWith(
            'notemac-language-unregistered',
            { languageId: 'test-lang' }
        );
    });

    it('should not throw when unregistering non-existent language', () =>
    {
        mockStore.customLanguages = [];

        expect(() => UnregisterCustomLanguage('non-existent')).not.toThrow();
    });

    it('should not remove from store if language not found', () =>
    {
        mockStore.customLanguages = [];

        UnregisterCustomLanguage('non-existent');

        expect(mockStore.RemoveCustomLanguage).not.toHaveBeenCalled();
    });

    it('should not dispatch event if language not found', () =>
    {
        mockStore.customLanguages = [];

        UnregisterCustomLanguage('non-existent');

        const calls = mockDispatch.mock.calls;
        expect(0 === calls.length).toBe(true);
    });
});

// ============================================================
// UpdateCustomLanguage Tests
// ============================================================

describe('LanguageDefinitionController — UpdateCustomLanguage', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            customLanguages: [createValidLanguage()],
            UpdateCustomLanguage: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should update an existing custom language successfully', () =>
    {
        const updates = { label: 'Updated Label' };

        const result = UpdateCustomLanguage('test-lang', updates);

        expect(true === result.success).toBe(true);
        expect(0 === result.errors.length).toBe(true);
        expect(mockStore.UpdateCustomLanguage).toHaveBeenCalledWith('test-lang', updates);
        expect(mockUnregisterLanguageFromMonaco).toHaveBeenCalledWith('test-lang');
        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalled();
    });

    it('should fail if language not found', () =>
    {
        mockStore.customLanguages = [];

        const result = UpdateCustomLanguage('non-existent', { label: 'New' });

        expect(false === result.success).toBe(true);
        expect(result.errors[0]).toContain('not found');
    });

    it('should validate merged definition', () =>
    {
        const result = UpdateCustomLanguage('test-lang', { id: '', label: '' });

        expect(false === result.success).toBe(true);
        expect(0 < result.errors.length).toBe(true);
    });

    it('should unregister old definition before registering new one', () =>
    {
        UpdateCustomLanguage('test-lang', { label: 'New Label' });

        const unregCalls = mockUnregisterLanguageFromMonaco.mock.calls;
        const regCalls = mockRegisterLanguageWithMonaco.mock.calls;
        expect(0 < unregCalls.length).toBe(true);
        expect(0 < regCalls.length).toBe(true);
    });

    it('should return success when updating valid extensions', () =>
    {
        const result = UpdateCustomLanguage('test-lang', { extensions: ['.newext'] });

        expect(true === result.success).toBe(true);
    });

    it('should not call UpdateCustomLanguage on validation failure', () =>
    {
        UpdateCustomLanguage('test-lang', { id: '', label: '' });

        expect(mockStore.UpdateCustomLanguage).not.toHaveBeenCalled();
    });
});

// ============================================================
// SetFileAssociation Tests
// ============================================================

describe('LanguageDefinitionController — SetFileAssociation', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            fileAssociationOverrides: {},
            SetFileAssociationOverride: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should set a file extension to language override', () =>
    {
        SetFileAssociation('.txt', 'test-lang');

        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledWith('.txt', 'test-lang');
    });

    it('should call store method with provided extension', () =>
    {
        SetFileAssociation('custom', 'my-lang');

        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledWith('custom', 'my-lang');
    });

    it('should handle multiple associations', () =>
    {
        SetFileAssociation('.txt', 'lang1');
        SetFileAssociation('.md', 'lang2');

        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledTimes(2);
        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledWith('.txt', 'lang1');
        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledWith('.md', 'lang2');
    });

    it('should override existing association', () =>
    {
        SetFileAssociation('.txt', 'lang1');
        SetFileAssociation('.txt', 'lang2');

        expect(mockStore.SetFileAssociationOverride).toHaveBeenCalledTimes(2);
        expect(mockStore.SetFileAssociationOverride).toHaveBeenLastCalledWith('.txt', 'lang2');
    });
});

// ============================================================
// RemoveFileAssociation Tests
// ============================================================

describe('LanguageDefinitionController — RemoveFileAssociation', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            fileAssociationOverrides: { '.txt': 'test-lang' },
            RemoveFileAssociationOverride: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should remove a file association override', () =>
    {
        RemoveFileAssociation('.txt');

        expect(mockStore.RemoveFileAssociationOverride).toHaveBeenCalledWith('.txt');
    });

    it('should handle extension with or without dot', () =>
    {
        RemoveFileAssociation('txt');

        expect(mockStore.RemoveFileAssociationOverride).toHaveBeenCalledWith('txt');
    });

    it('should not throw when removing non-existent association', () =>
    {
        expect(() => RemoveFileAssociation('.nonexistent')).not.toThrow();
    });

    it('should allow removing multiple associations', () =>
    {
        RemoveFileAssociation('.txt');
        RemoveFileAssociation('.md');

        expect(mockStore.RemoveFileAssociationOverride).toHaveBeenCalledTimes(2);
    });
});

// ============================================================
// InitializeCustomLanguages Tests
// ============================================================

describe('LanguageDefinitionController — InitializeCustomLanguages', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            customLanguages: [],
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should register all custom languages from store', () =>
    {
        const lang1 = createValidLanguage({ id: 'lang1' });
        const lang2 = createValidLanguage({ id: 'lang2' });
        mockStore.customLanguages = [lang1, lang2];

        InitializeCustomLanguages();

        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledTimes(2);
        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledWith(lang1);
        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledWith(lang2);
    });

    it('should not throw when no custom languages exist', () =>
    {
        mockStore.customLanguages = [];

        expect(() => InitializeCustomLanguages()).not.toThrow();
    });

    it('should handle empty custom languages array', () =>
    {
        mockStore.customLanguages = [];

        InitializeCustomLanguages();

        expect(mockRegisterLanguageWithMonaco).not.toHaveBeenCalled();
    });

    it('should register languages in order', () =>
    {
        const lang1 = createValidLanguage({ id: 'lang1' });
        const lang2 = createValidLanguage({ id: 'lang2' });
        const lang3 = createValidLanguage({ id: 'lang3' });
        mockStore.customLanguages = [lang1, lang2, lang3];

        InitializeCustomLanguages();

        const calls = mockRegisterLanguageWithMonaco.mock.calls;
        expect(3 === calls.length).toBe(true);
        expect(calls[0][0].id).toBe('lang1');
        expect(calls[1][0].id).toBe('lang2');
        expect(calls[2][0].id).toBe('lang3');
    });
});

// ============================================================
// SyncPluginLanguagesWithMonaco Tests
// ============================================================

describe('LanguageDefinitionController — SyncPluginLanguagesWithMonaco', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            pluginLanguages: [],
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('should sync plugin languages with Monaco', () =>
    {
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledTimes(1);
        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect('plugin-lang' === call.id).toBe(true);
    });

    it('should extract monarchTokens from plugin config', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [[/test/, 'identifier']] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(call.monarchTokens).toBeDefined();
        expect(call.monarchTokens.tokenizer).toBeDefined();
    });

    it('should skip languages without monarchTokens', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    // No monarchTokens
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        expect(mockRegisterLanguageWithMonaco).not.toHaveBeenCalled();
    });

    it('should handle multiple plugin languages', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang-1',
                pluginId: 'test-plugin-1',
                config: {
                    label: 'Plugin Language 1',
                    extensions: ['.plg1'],
                    aliases: ['plg1'],
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
            {
                id: 'plugin-lang-2',
                pluginId: 'test-plugin-2',
                config: {
                    label: 'Plugin Language 2',
                    extensions: ['.plg2'],
                    aliases: ['plg2'],
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        expect(mockRegisterLanguageWithMonaco).toHaveBeenCalledTimes(2);
    });

    it('should use plugin id as fallback for label', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    // No label
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect('plugin-lang' === call.label).toBe(true);
    });

    it('should extract optional brackets from config', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        const brackets: [string, string][] = [['[', ']'], ['(', ')']];
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                    brackets,
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(call.brackets).toEqual(brackets);
    });

    it('should extract optional comments from config', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        const comments = { lineComment: '//', blockComment: ['/*', '*/'] };
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                    comments,
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(call.comments).toEqual(comments);
    });

    it('should extract optional autoClosingPairs from config', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        const autoClosingPairs: [string, string][] = [['(', ')'], ['{', '}']];
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                    autoClosingPairs,
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(call.autoClosingPairs).toEqual(autoClosingPairs);
    });

    it('should handle empty pluginLanguages array', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [];

        SyncPluginLanguagesWithMonaco();

        expect(mockRegisterLanguageWithMonaco).not.toHaveBeenCalled();
    });

    it('should not throw on invalid config', () =>
    {
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    monarchTokens: 'not-an-object',
                },
            },
        ];

        expect(() => SyncPluginLanguagesWithMonaco()).not.toThrow();
    });

    it('should handle non-array extensions gracefully', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: 'not-an-array',
                    aliases: ['plg'],
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(0 === call.extensions.length).toBe(true);
    });

    it('should handle non-array aliases gracefully', () =>
    {
        // Use mockRegisterLanguageWithMonaco from top-level scope
        mockStore.pluginLanguages = [
            {
                id: 'plugin-lang',
                pluginId: 'test-plugin',
                config: {
                    label: 'Plugin Language',
                    extensions: ['.plg'],
                    aliases: 'not-an-array',
                    monarchTokens: { tokenizer: { root: [] } },
                },
            },
        ];

        SyncPluginLanguagesWithMonaco();

        const call = mockRegisterLanguageWithMonaco.mock.calls[0][0];
        expect(0 === call.aliases.length).toBe(true);
    });
});
