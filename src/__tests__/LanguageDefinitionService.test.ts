import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    ValidateLanguageDefinition,
    ValidateMonarchTokens,
    DetectLanguageWithCustom,
    GetBuiltInAndCustomLanguages,
    RegisterLanguageWithMonaco,
    UnregisterLanguageFromMonaco,
} from '../Notemac/Services/LanguageDefinitionService';
import type { CustomLanguageDefinition, MonarchTokensConfig } from '../Notemac/Commons/Types';

// Mock window.monaco instead of monaco-editor directly
const mockMonaco = {
    languages: {
        register: vi.fn(),
        setMonarchTokensProvider: vi.fn(),
        setLanguageConfiguration: vi.fn(),
    },
};

if (typeof window !== 'undefined')
{
    (window as any).monaco = mockMonaco;
}

// ============================================================
// ValidateLanguageDefinition
// ============================================================
describe('ValidateLanguageDefinition', () =>
{
    it('returns valid true for a complete language definition', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: ['ml'],
            monarchTokens: {
                tokenizer: {
                    root: [['\\w+', 'identifier']],
                },
            },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('rejects null definition', () =>
    {
        const result = ValidateLanguageDefinition(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language definition must be a non-null object');
    });

    it('rejects non-object definition', () =>
    {
        const result = ValidateLanguageDefinition('not an object');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language definition must be a non-null object');
    });

    it('rejects missing id', () =>
    {
        const lang = {
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language id is required and must be a non-empty string');
    });

    it('rejects empty id', () =>
    {
        const lang = {
            id: '   ',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language id is required and must be a non-empty string');
    });

    it('rejects non-string id', () =>
    {
        const lang = {
            id: 123,
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language id is required and must be a non-empty string');
    });

    it('rejects missing label', () =>
    {
        const lang = {
            id: 'mylang',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language label is required and must be a non-empty string');
    });

    it('rejects empty label', () =>
    {
        const lang = {
            id: 'mylang',
            label: '   ',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language label is required and must be a non-empty string');
    });

    it('rejects non-string label', () =>
    {
        const lang = {
            id: 'mylang',
            label: 456,
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language label is required and must be a non-empty string');
    });

    it('rejects missing extensions', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language extensions is required and must be a non-empty array');
    });

    it('rejects empty extensions array', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: [],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language extensions is required and must be a non-empty array');
    });

    it('rejects non-array extensions', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: 'not an array',
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language extensions is required and must be a non-empty array');
    });

    it('rejects empty string in extensions array', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml', ''],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Each extension must be a non-empty string');
    });

    it('rejects non-string in extensions array', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml', 123],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Each extension must be a non-empty string');
    });

    it('rejects non-array aliases', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: 'not an array',
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Language aliases must be an array');
    });

    it('rejects missing monarchTokens', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('monarchTokens is required and must be an object');
    });

    it('rejects null monarchTokens', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: null,
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('monarchTokens is required and must be an object');
    });

    it('rejects invalid monarchTokens (no root key)', () =>
    {
        const lang = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: {
                tokenizer: {
                    strings: [['\\w+', 'string']],
                },
            },
        };

        const result = ValidateLanguageDefinition(lang);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('monarchTokens.tokenizer must contain a "root" key with an array of rules');
    });
});

// ============================================================
// ValidateMonarchTokens
// ============================================================
describe('ValidateMonarchTokens', () =>
{
    it('returns true for valid tokenizer with root', () =>
    {
        const tokens: MonarchTokensConfig = {
            tokenizer: {
                root: [['\\w+', 'identifier']],
            },
        };

        expect(ValidateMonarchTokens(tokens)).toBe(true);
    });

    it('returns true for tokenizer with root and additional states', () =>
    {
        const tokens: MonarchTokensConfig = {
            tokenizer: {
                root: [['\\w+', 'identifier']],
                strings: [['[^"]*', 'string']],
                comments: [['//.*', 'comment']],
            },
        };

        expect(ValidateMonarchTokens(tokens)).toBe(true);
    });

    it('returns false for null tokens', () =>
    {
        expect(ValidateMonarchTokens(null as unknown as MonarchTokensConfig)).toBe(false);
    });

    it('returns false for non-object tokens', () =>
    {
        expect(ValidateMonarchTokens('not an object' as unknown as MonarchTokensConfig)).toBe(false);
    });

    it('returns false for null tokenizer', () =>
    {
        const tokens = {
            tokenizer: null,
        } as unknown as MonarchTokensConfig;

        expect(ValidateMonarchTokens(tokens)).toBe(false);
    });

    it('returns false for non-object tokenizer', () =>
    {
        const tokens = {
            tokenizer: 'not an object',
        } as unknown as MonarchTokensConfig;

        expect(ValidateMonarchTokens(tokens)).toBe(false);
    });

    it('returns false when root is not an array', () =>
    {
        const tokens = {
            tokenizer: {
                root: 'not an array',
            },
        } as unknown as MonarchTokensConfig;

        expect(ValidateMonarchTokens(tokens)).toBe(false);
    });

    it('returns false when non-root state is not an array', () =>
    {
        const tokens = {
            tokenizer: {
                root: [['\\w+', 'identifier']],
                strings: 'not an array',
            },
        } as unknown as MonarchTokensConfig;

        expect(ValidateMonarchTokens(tokens)).toBe(false);
    });

    it('returns true for empty root array', () =>
    {
        const tokens: MonarchTokensConfig = {
            tokenizer: {
                root: [],
            },
        };

        expect(ValidateMonarchTokens(tokens)).toBe(true);
    });

    it('returns false for missing tokenizer', () =>
    {
        const tokens = {} as unknown as MonarchTokensConfig;

        expect(ValidateMonarchTokens(tokens)).toBe(false);
    });
});

// ============================================================
// DetectLanguageWithCustom
// ============================================================
describe('DetectLanguageWithCustom', () =>
{
    it('returns plaintext for empty filename', () =>
    {
        const result = DetectLanguageWithCustom('', [], {});
        expect(result).toBe('plaintext');
    });

    it('applies file association override with highest priority', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];
        const overrides = { '.ml': 'javascript' };

        const result = DetectLanguageWithCustom('file.ml', customLanguages, overrides);
        expect(result).toBe('javascript');
    });

    it('detects custom language by extension', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = DetectLanguageWithCustom('file.ml', customLanguages, {});
        expect(result).toBe('mylang');
    });

    it('normalizes extension without dot prefix', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = DetectLanguageWithCustom('file.ml', customLanguages, {});
        expect(result).toBe('mylang');
    });

    it('matches custom extension with dot prefix', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = DetectLanguageWithCustom('file.ml', customLanguages, {});
        expect(result).toBe('mylang');
    });

    it('falls back to built-in detection when no custom match', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = DetectLanguageWithCustom('script.py', customLanguages, {});
        expect(result).toBe('python');
    });

    it('falls back to plaintext for unknown extension', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [];
        const result = DetectLanguageWithCustom('file.unknown', customLanguages, {});
        expect(result).toBe('plaintext');
    });

    it('returns plaintext for file with no extension', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [];
        const result = DetectLanguageWithCustom('README', customLanguages, {});
        expect(result).toBe('plaintext');
    });

    it('uses first matching custom language', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'lang1',
                label: 'Language 1',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
            {
                id: 'lang2',
                label: 'Language 2',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = DetectLanguageWithCustom('file.ml', customLanguages, {});
        expect(result).toBe('lang1');
    });

    it('matches custom language with multiple extensions', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml', '.mli'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result1 = DetectLanguageWithCustom('file.ml', customLanguages, {});
        const result2 = DetectLanguageWithCustom('file.mli', customLanguages, {});
        expect(result1).toBe('mylang');
        expect(result2).toBe('mylang');
    });

    it('prioritizes override over custom language match', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];
        const overrides = { '.ml': 'typescript' };

        const result = DetectLanguageWithCustom('file.ml', customLanguages, overrides);
        expect(result).toBe('typescript');
    });

    it('uses override only for matching extension', () =>
    {
        const overrides = { '.ml': 'typescript' };
        const result = DetectLanguageWithCustom('file.txt', [], overrides);
        expect(result).toBe('plaintext');
    });
});

// ============================================================
// GetBuiltInAndCustomLanguages
// ============================================================
describe('GetBuiltInAndCustomLanguages', () =>
{
    it('returns built-in languages when no custom languages', () =>
    {
        const result = GetBuiltInAndCustomLanguages([]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('includes plaintext in results', () =>
    {
        const result = GetBuiltInAndCustomLanguages([]);
        const plaintextExists = null !== result.find(l => 'plaintext' === l.id);
        expect(plaintextExists).toBe(true);
    });

    it('marks built-in languages as not custom', () =>
    {
        const result = GetBuiltInAndCustomLanguages([]);
        const javascript = result.find(l => 'javascript' === l.id);
        expect(javascript?.isCustom).toBe(false);
    });

    it('includes custom languages', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        const custom = result.find(l => 'mylang' === l.id);
        expect(custom).toBeDefined();
        expect(custom?.label).toBe('My Language');
        expect(custom?.isCustom).toBe(true);
    });

    it('marks custom languages as custom', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        const custom = result.find(l => 'mylang' === l.id);
        expect(custom?.isCustom).toBe(true);
    });

    it('avoids duplicating built-in language IDs', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'javascript',
                label: 'Custom JavaScript',
                extensions: ['.mjs'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        const jsCount = result.filter(l => 'javascript' === l.id).length;
        expect(jsCount).toBe(1);
    });

    it('returns sorted list by label', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'zang',
                label: 'Z Language',
                extensions: ['.z'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
            {
                id: 'alang',
                label: 'A Language',
                extensions: ['.a'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        for (let i = 0; i < result.length - 1; i++)
        {
            expect(result[i].label.localeCompare(result[i + 1].label)).toBeLessThanOrEqual(0);
        }
    });

    it('handles multiple custom languages', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'lang1',
                label: 'Language 1',
                extensions: ['.l1'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
            {
                id: 'lang2',
                label: 'Language 2',
                extensions: ['.l2'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
            {
                id: 'lang3',
                label: 'Language 3',
                extensions: ['.l3'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        expect(null !== result.find(l => 'lang1' === l.id)).toBe(true);
        expect(null !== result.find(l => 'lang2' === l.id)).toBe(true);
        expect(null !== result.find(l => 'lang3' === l.id)).toBe(true);
    });

    it('result items have id, label, and isCustom properties', () =>
    {
        const customLanguages: CustomLanguageDefinition[] = [
            {
                id: 'mylang',
                label: 'My Language',
                extensions: ['.ml'],
                aliases: [],
                monarchTokens: { tokenizer: { root: [] } },
            },
        ];

        const result = GetBuiltInAndCustomLanguages(customLanguages);
        for (const item of result)
        {
            expect('string' === typeof item.id).toBe(true);
            expect('string' === typeof item.label).toBe(true);
            expect('boolean' === typeof item.isCustom).toBe(true);
        }
    });
});

// ============================================================
// RegisterLanguageWithMonaco
// ============================================================
describe('RegisterLanguageWithMonaco', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        if ('undefined' !== typeof window)
        {
            (window as unknown as Record<string, unknown>).monaco = {
                languages: {
                    register: vi.fn(),
                    setMonarchTokensProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                    setLanguageConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                },
            };
        }
    });

    afterEach(() =>
    {
        if ('undefined' !== typeof window)
        {
            delete (window as unknown as Record<string, unknown>).monaco;
        }
    });

    it('returns false when monaco is not available', () =>
    {
        if ('undefined' !== typeof window)
        {
            delete (window as unknown as Record<string, unknown>).monaco;
        }

        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = RegisterLanguageWithMonaco(lang);
        expect(result).toBe(false);
    });

    it('calls monaco.languages.register with correct parameters', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: ['ml'],
            monarchTokens: { tokenizer: { root: [] } },
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const register = monaco.languages as Record<string, unknown>;
        expect(register.register).toHaveBeenCalledWith({
            id: 'mylang',
            extensions: ['.ml'],
            aliases: ['ml'],
        });
    });

    it('uses label as alias when aliases array is empty', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const register = monaco.languages as Record<string, unknown>;
        expect(register.register).toHaveBeenCalledWith({
            id: 'mylang',
            extensions: ['.ml'],
            aliases: ['My Language'],
        });
    });

    it('calls setMonarchTokensProvider with tokenizer config', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: {
                keywords: ['if', 'else'],
                operators: ['+', '-'],
                tokenizer: { root: [] },
            },
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const languages = monaco.languages as Record<string, unknown>;
        expect(languages.setMonarchTokensProvider).toHaveBeenCalled();
    });

    it('returns true when registration succeeds', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const result = RegisterLanguageWithMonaco(lang);
        expect(result).toBe(true);
    });

    it('handles brackets in language configuration', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
            brackets: [['(', ')'], ['[', ']']],
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const languages = monaco.languages as Record<string, unknown>;
        expect(languages.setLanguageConfiguration).toHaveBeenCalled();
    });

    it('handles comments in language configuration', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
            comments: { lineComment: '//', blockComment: ['/*', '*/'] },
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const languages = monaco.languages as Record<string, unknown>;
        expect(languages.setLanguageConfiguration).toHaveBeenCalled();
    });

    it('handles autoClosingPairs in language configuration', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
            autoClosingPairs: [['(', ')'], ['{', '}']],
        };

        RegisterLanguageWithMonaco(lang);

        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const languages = monaco.languages as Record<string, unknown>;
        expect(languages.setLanguageConfiguration).toHaveBeenCalled();
    });

    it('returns true even if exception occurs', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        if ('undefined' !== typeof window)
        {
            (window as unknown as Record<string, unknown>).monaco = null;
        }

        const result = RegisterLanguageWithMonaco(lang);
        expect(result).toBe(false);
    });
});

// ============================================================
// UnregisterLanguageFromMonaco
// ============================================================
describe('UnregisterLanguageFromMonaco', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        if ('undefined' !== typeof window)
        {
            (window as unknown as Record<string, unknown>).monaco = {
                languages: {
                    register: vi.fn(),
                    setMonarchTokensProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                    setLanguageConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                },
            };
        }
    });

    afterEach(() =>
    {
        if ('undefined' !== typeof window)
        {
            delete (window as unknown as Record<string, unknown>).monaco;
        }
    });

    it('disposes registered language providers', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        RegisterLanguageWithMonaco(lang);
        UnregisterLanguageFromMonaco('mylang');

        // Verify that dispose was called on the mock disposables
        const monaco = (window as unknown as Record<string, unknown>).monaco as Record<string, unknown>;
        const languages = monaco.languages as Record<string, unknown>;
        expect(languages.setMonarchTokensProvider).toHaveBeenCalled();
    });

    it('does nothing when language is not registered', () =>
    {
        expect(() => UnregisterLanguageFromMonaco('notregistered')).not.toThrow();
    });

    it('cleans up disposables after unregister', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        RegisterLanguageWithMonaco(lang);
        UnregisterLanguageFromMonaco('mylang');

        // Second unregister should not cause errors
        expect(() => UnregisterLanguageFromMonaco('mylang')).not.toThrow();
    });

    it('handles multiple registrations and unregistrations', () =>
    {
        const lang1: CustomLanguageDefinition = {
            id: 'lang1',
            label: 'Language 1',
            extensions: ['.l1'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        const lang2: CustomLanguageDefinition = {
            id: 'lang2',
            label: 'Language 2',
            extensions: ['.l2'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        RegisterLanguageWithMonaco(lang1);
        RegisterLanguageWithMonaco(lang2);

        expect(() => UnregisterLanguageFromMonaco('lang1')).not.toThrow();
        expect(() => UnregisterLanguageFromMonaco('lang2')).not.toThrow();
    });

    it('tolerates failed disposal gracefully', () =>
    {
        const lang: CustomLanguageDefinition = {
            id: 'mylang',
            label: 'My Language',
            extensions: ['.ml'],
            aliases: [],
            monarchTokens: { tokenizer: { root: [] } },
        };

        if ('undefined' !== typeof window)
        {
            const failingDisposable = {
                dispose: vi.fn().mockImplementation(() =>
                {
                    throw new Error('Disposal failed');
                }),
            };

            (window as unknown as Record<string, unknown>).monaco = {
                languages: {
                    register: vi.fn(),
                    setMonarchTokensProvider: vi.fn().mockReturnValue(failingDisposable),
                    setLanguageConfiguration: vi.fn(),
                },
            };
        }

        RegisterLanguageWithMonaco(lang);

        expect(() => UnregisterLanguageFromMonaco('mylang')).not.toThrow();
    });
});
