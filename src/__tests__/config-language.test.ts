import { describe, it, expect } from 'vitest';
import {
    GetLanguages,
    GetLanguageById,
    GetLanguageLabel,
} from '../Notemac/Configs/LanguageConfig';

// ============================================================
// LanguageConfig — GetLanguages, GetLanguageById, GetLanguageLabel
// ============================================================
describe('LanguageConfig — GetLanguages', () =>
{
    it('returns an array of language items', () =>
    {
        const languages = GetLanguages();
        expect(Array.isArray(languages)).toBe(true);
        expect(languages.length).toBeGreaterThan(0);
    });

    it('first language is plaintext', () =>
    {
        const languages = GetLanguages();
        expect(languages[0].value).toBe('plaintext');
        expect(languages[0].label).toBe('Normal Text');
    });

    it('all items have value and label strings', () =>
    {
        const languages = GetLanguages();
        for (const lang of languages)
        {
            expect(typeof lang.value).toBe('string');
            expect(typeof lang.label).toBe('string');
            expect(lang.value.length).toBeGreaterThan(0);
            expect(lang.label.length).toBeGreaterThan(0);
        }
    });

    it('contains common programming languages', () =>
    {
        const languages = GetLanguages();
        const values = languages.map(l => l.value);
        expect(values).toContain('javascript');
        expect(values).toContain('python');
        expect(values).toContain('rust');
        expect(values).toContain('typescript');
        expect(values).toContain('java');
        expect(values).toContain('cpp');
        expect(values).toContain('go');
    });
});

describe('LanguageConfig — GetLanguageById', () =>
{
    it('returns language item for javascript', () =>
    {
        const lang = GetLanguageById('javascript');
        expect(lang).toBeDefined();
        expect(lang?.value).toBe('javascript');
        expect(lang?.label).toBe('JavaScript');
    });

    it('returns language item for python', () =>
    {
        const lang = GetLanguageById('python');
        expect(lang).toBeDefined();
        expect(lang?.value).toBe('python');
        expect(lang?.label).toBe('Python');
    });

    it('returns language item for rust', () =>
    {
        const lang = GetLanguageById('rust');
        expect(lang).toBeDefined();
        expect(lang?.value).toBe('rust');
        expect(lang?.label).toBe('Rust');
    });

    it('returns undefined for nonexistent language', () =>
    {
        const lang = GetLanguageById('nonexistent');
        expect(lang).toBeUndefined();
    });

    it('returns undefined for empty string', () =>
    {
        const lang = GetLanguageById('');
        expect(lang).toBeUndefined();
    });

    it('returns plaintext language', () =>
    {
        const lang = GetLanguageById('plaintext');
        expect(lang).toBeDefined();
        expect(lang?.label).toBe('Normal Text');
    });
});

describe('LanguageConfig — GetLanguageLabel', () =>
{
    it('returns label for python', () =>
    {
        const label = GetLanguageLabel('python');
        expect(label).toBe('Python');
    });

    it('returns label for javascript', () =>
    {
        const label = GetLanguageLabel('javascript');
        expect(label).toBe('JavaScript');
    });

    it('returns label for cpp', () =>
    {
        const label = GetLanguageLabel('cpp');
        expect(label).toBe('C++');
    });

    it('returns the value itself as fallback for unknown language', () =>
    {
        const label = GetLanguageLabel('unknown');
        expect(label).toBe('unknown');
    });

    it('returns the value itself as fallback for empty string', () =>
    {
        const label = GetLanguageLabel('');
        expect(label).toBe('');
    });

    it('returns label for plaintext', () =>
    {
        const label = GetLanguageLabel('plaintext');
        expect(label).toBe('Normal Text');
    });

    it('returns label for csharp', () =>
    {
        const label = GetLanguageLabel('csharp');
        expect(label).toBe('C#');
    });
});
