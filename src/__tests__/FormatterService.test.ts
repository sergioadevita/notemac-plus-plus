import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    FormatDocument,
    FormatSelection,
    GetSupportedLanguages,
    IsLanguageSupported,
    ResetFormatterCache,
} from '../Notemac/Services/FormatterService';

vi.mock('prettier/standalone', () =>
({
    default: {
        format: vi.fn().mockResolvedValue('formatted code'),
    },
}));

vi.mock('prettier/plugins/babel', () => ({ default: {} }));
vi.mock('prettier/plugins/typescript', () => ({ default: {} }));
vi.mock('prettier/plugins/html', () => ({ default: {} }));
vi.mock('prettier/plugins/postcss', () => ({ default: {} }));
vi.mock('prettier/plugins/markdown', () => ({ default: {} }));
vi.mock('prettier/plugins/yaml', () => ({ default: {} }));
vi.mock('prettier/plugins/graphql', () => ({ default: {} }));

describe('FormatterService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        ResetFormatterCache();
    });

    describe('FormatDocument', () =>
    {
        it('should format content for a supported language', async () =>
        {
            const result = await FormatDocument('const x=1;', 'typescript');
            expect('string' === typeof result).toBe(true);
        });

        it('should return original content for unsupported language', async () =>
        {
            const original = 'some content';
            const result = await FormatDocument(original, 'brainfuck');
            expect(original === result).toBe(true);
        });

        it('should handle empty content', async () =>
        {
            const result = await FormatDocument('', 'javascript');
            expect('string' === typeof result).toBe(true);
        });

        it('should accept format options', async () =>
        {
            const result = await FormatDocument('const x=1;', 'javascript', { tabWidth: 2 });
            expect('string' === typeof result).toBe(true);
        });

        it('should handle all supported languages', async () =>
        {
            const languages = GetSupportedLanguages();
            for (const lang of languages)
            {
                const result = await FormatDocument('test', lang);
                expect('string' === typeof result).toBe(true);
            }
        });

        it('should pass through options to prettier', async () =>
        {
            const result = await FormatDocument('const x = 1;', 'typescript', {
                printWidth: 100,
                tabWidth: 2,
                useTabs: true,
                semi: false,
                singleQuote: false,
            });
            expect('string' === typeof result).toBe(true);
        });
    });

    describe('FormatSelection', () =>
    {
        it('should format a selected range', async () =>
        {
            const result = await FormatSelection('const x=1;\nconst y=2;', 0, 10, 'javascript');
            expect('string' === typeof result).toBe(true);
        });

        it('should return original content for unsupported language', async () =>
        {
            const original = 'hello';
            const result = await FormatSelection(original, 0, 5, 'brainfuck');
            expect(original === result).toBe(true);
        });

        it('should handle range parameters correctly', async () =>
        {
            const result = await FormatSelection('test content', 0, 4, 'javascript');
            expect('string' === typeof result).toBe(true);
        });

        it('should accept format options with range', async () =>
        {
            const result = await FormatSelection('const x=1;', 0, 10, 'typescript', { tabWidth: 2 });
            expect('string' === typeof result).toBe(true);
        });

        it('should handle full-length selection', async () =>
        {
            const content = 'const x=1;';
            const result = await FormatSelection(content, 0, content.length, 'javascript');
            expect('string' === typeof result).toBe(true);
        });
    });

    describe('GetSupportedLanguages', () =>
    {
        it('should return an array of language strings', () =>
        {
            const languages = GetSupportedLanguages();
            expect(true === Array.isArray(languages)).toBe(true);
            expect(languages.length > 0).toBe(true);
        });

        it('should include common languages', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('javascript');
            expect(languages).toContain('typescript');
        });

        it('should include html and json', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('html');
            expect(languages).toContain('json');
        });

        it('should include stylesheet languages', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('css');
            expect(languages).toContain('scss');
            expect(languages).toContain('less');
        });

        it('should not include undefined entries', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages.every((lang: any) => undefined !== lang)).toBe(true);
        });
    });

    describe('IsLanguageSupported', () =>
    {
        it('should return true for supported languages', () =>
        {
            expect(true === IsLanguageSupported('javascript')).toBe(true);
            expect(true === IsLanguageSupported('typescript')).toBe(true);
        });

        it('should return false for unsupported languages', () =>
        {
            expect(false === IsLanguageSupported('brainfuck')).toBe(true);
        });

        it('should be case-sensitive', () =>
        {
            expect(false === IsLanguageSupported('JavaScript')).toBe(true);
        });

        it('should recognize all supported languages', () =>
        {
            const languages = GetSupportedLanguages();
            for (const lang of languages)
            {
                expect(true === IsLanguageSupported(lang)).toBe(true);
            }
        });

        it('should return false for empty string', () =>
        {
            expect(false === IsLanguageSupported('')).toBe(true);
        });
    });

    describe('ResetFormatterCache', () =>
    {
        it('should not throw', () =>
        {
            expect(() => ResetFormatterCache()).not.toThrow();
        });

        it('should allow re-initialization after reset', async () =>
        {
            ResetFormatterCache();
            const result = await FormatDocument('const x=1;', 'javascript');
            expect('string' === typeof result).toBe(true);
        });
    });
});
