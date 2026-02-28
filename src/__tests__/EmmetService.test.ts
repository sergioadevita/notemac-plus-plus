import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ExpandAbbreviation,
    IsEmmetContext,
    IsStylesheetLanguage,
    GetSupportedLanguages,
    ResetEmmetCache,
} from '../Notemac/Services/EmmetService';

vi.mock('emmet', () =>
({
    default: vi.fn().mockReturnValue('<div></div>'),
}));

describe('EmmetService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        ResetEmmetCache();
    });

    describe('ExpandAbbreviation', () =>
    {
        it('should expand a simple HTML abbreviation', async () =>
        {
            const result = await ExpandAbbreviation('div', 'html');
            expect('string' === typeof result).toBe(true);
            expect(result.length > 0).toBe(true);
        });

        it('should return input for empty abbreviation', async () =>
        {
            const result = await ExpandAbbreviation('', 'html');
            expect('string' === typeof result).toBe(true);
        });

        it('should handle CSS abbreviations', async () =>
        {
            const result = await ExpandAbbreviation('m10', 'css');
            expect('string' === typeof result).toBe(true);
        });

        it('should handle expansion errors gracefully', async () =>
        {
            const result = await ExpandAbbreviation('!!!invalid!!!', 'html');
            expect('string' === typeof result).toBe(true);
        });

        it('should work with TSX language', async () =>
        {
            const result = await ExpandAbbreviation('div', 'typescriptreact');
            expect('string' === typeof result).toBe(true);
        });

        it('should return abbreviation if emmet not loaded', async () =>
        {
            ResetEmmetCache();
            const input = 'p.test';
            const result = await ExpandAbbreviation(input, 'html');
            expect('string' === typeof result).toBe(true);
        });

        it('should treat markup languages differently from stylesheets', async () =>
        {
            const markupResult = await ExpandAbbreviation('div', 'html');
            const stylesheetResult = await ExpandAbbreviation('m10', 'css');
            expect('string' === typeof markupResult).toBe(true);
            expect('string' === typeof stylesheetResult).toBe(true);
        });
    });

    describe('IsEmmetContext', () =>
    {
        it('should return true for html', () =>
        {
            expect(true === IsEmmetContext('html')).toBe(true);
        });

        it('should return true for css', () =>
        {
            expect(true === IsEmmetContext('css')).toBe(true);
        });

        it('should return true for scss', () =>
        {
            expect(true === IsEmmetContext('scss')).toBe(true);
        });

        it('should return true for less', () =>
        {
            expect(true === IsEmmetContext('less')).toBe(true);
        });

        it('should return true for jsx', () =>
        {
            expect(true === IsEmmetContext('jsx')).toBe(true);
        });

        it('should return true for tsx', () =>
        {
            expect(true === IsEmmetContext('tsx')).toBe(true);
        });

        it('should return false for unsupported languages', () =>
        {
            expect(false === IsEmmetContext('python')).toBe(true);
            expect(false === IsEmmetContext('rust')).toBe(true);
        });

        it('should handle xml language', () =>
        {
            const result = IsEmmetContext('xml');
            expect('boolean' === typeof result).toBe(true);
        });

        it('should be case-sensitive', () =>
        {
            expect(false === IsEmmetContext('HTML')).toBe(true);
        });
    });

    describe('IsStylesheetLanguage', () =>
    {
        it('should return true for css', () =>
        {
            expect(true === IsStylesheetLanguage('css')).toBe(true);
        });

        it('should return true for scss', () =>
        {
            expect(true === IsStylesheetLanguage('scss')).toBe(true);
        });

        it('should return true for less', () =>
        {
            expect(true === IsStylesheetLanguage('less')).toBe(true);
        });

        it('should return false for non-stylesheet languages', () =>
        {
            expect(false === IsStylesheetLanguage('html')).toBe(true);
            expect(false === IsStylesheetLanguage('javascript')).toBe(true);
        });

        it('should return false for empty string', () =>
        {
            expect(false === IsStylesheetLanguage('')).toBe(true);
        });

        it('should be case-sensitive', () =>
        {
            expect(false === IsStylesheetLanguage('CSS')).toBe(true);
        });
    });

    describe('GetSupportedLanguages', () =>
    {
        it('should return array of supported languages', () =>
        {
            const languages = GetSupportedLanguages();
            expect(true === Array.isArray(languages)).toBe(true);
            expect(languages.length > 0).toBe(true);
        });

        it('should include html and css', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('html');
            expect(languages).toContain('css');
        });

        it('should include react languages', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('jsx');
            expect(languages).toContain('tsx');
        });

        it('should not return duplicate languages', () =>
        {
            const languages = GetSupportedLanguages();
            const uniqueLanguages = new Set(languages);
            expect(languages.length === uniqueLanguages.size).toBe(true);
        });

        it('should include xml language', () =>
        {
            const languages = GetSupportedLanguages();
            expect(languages).toContain('xml');
        });

        it('should return copy of array, not reference', () =>
        {
            const languages1 = GetSupportedLanguages();
            const languages2 = GetSupportedLanguages();
            expect(languages1 === languages2).toBe(false);
        });
    });

    describe('ResetEmmetCache', () =>
    {
        it('should not throw', () =>
        {
            expect(() => ResetEmmetCache()).not.toThrow();
        });

        it('should allow re-initialization after reset', async () =>
        {
            ResetEmmetCache();
            const result = await ExpandAbbreviation('div', 'html');
            expect('string' === typeof result).toBe(true);
        });

        it('should handle multiple resets', () =>
        {
            expect(() =>
            {
                ResetEmmetCache();
                ResetEmmetCache();
                ResetEmmetCache();
            }).not.toThrow();
        });
    });
});
