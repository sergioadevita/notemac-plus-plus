import { describe, it, expect } from 'vitest';
import {
    GetEncodings,
    GetEncodingGroups,
    GetEncodingByValue,
} from '../Notemac/Configs/EncodingConfig';

// ============================================================
// EncodingConfig — GetEncodings, GetEncodingGroups, GetEncodingByValue
// ============================================================
describe('EncodingConfig — GetEncodings', () =>
{
    it('returns an array of encoding groups', () =>
    {
        const encodings = GetEncodings();
        expect(Array.isArray(encodings)).toBe(true);
        expect(encodings.length).toBeGreaterThan(0);
    });

    it('each group has a group string and items array', () =>
    {
        const encodings = GetEncodings();
        for (const group of encodings)
        {
            expect(typeof group.group).toBe('string');
            expect(Array.isArray(group.items)).toBe(true);
            expect(group.items.length).toBeGreaterThan(0);
        }
    });

    it('all items have value and label strings', () =>
    {
        const encodings = GetEncodings();
        for (const group of encodings)
        {
            for (const item of group.items)
            {
                expect(typeof item.value).toBe('string');
                expect(typeof item.label).toBe('string');
                expect(item.value.length).toBeGreaterThan(0);
                expect(item.label.length).toBeGreaterThan(0);
            }
        }
    });
});

describe('EncodingConfig — GetEncodingGroups', () =>
{
    it('returns an array of group name strings', () =>
    {
        const groups = GetEncodingGroups();
        expect(Array.isArray(groups)).toBe(true);
        expect(groups.length).toBeGreaterThan(0);
        for (const group of groups)
        {
            expect(typeof group).toBe('string');
        }
    });

    it('contains expected encoding groups', () =>
    {
        const groups = GetEncodingGroups();
        expect(groups).toContain('Unicode');
        expect(groups).toContain('Western European');
        expect(groups).toContain('East Asian');
        expect(groups).toContain('DOS');
    });
});

describe('EncodingConfig — GetEncodingByValue', () =>
{
    it('returns encoding item for valid utf-8', () =>
    {
        const encoding = GetEncodingByValue('utf-8');
        expect(encoding).toBeDefined();
        expect(encoding?.value).toBe('utf-8');
        expect(encoding?.label).toBe('UTF-8');
    });

    it('returns encoding item for valid windows-1252', () =>
    {
        const encoding = GetEncodingByValue('windows-1252');
        expect(encoding).toBeDefined();
        expect(encoding?.value).toBe('windows-1252');
        expect(encoding?.label).toBe('Windows-1252 (ANSI)');
    });

    it('returns undefined for unknown encoding', () =>
    {
        const encoding = GetEncodingByValue('unknown');
        expect(encoding).toBeUndefined();
    });

    it('returns undefined for empty string', () =>
    {
        const encoding = GetEncodingByValue('');
        expect(encoding).toBeUndefined();
    });

    it('returns encoding for shift_jis (East Asian)', () =>
    {
        const encoding = GetEncodingByValue('shift_jis');
        expect(encoding).toBeDefined();
        expect(encoding?.label).toContain('Japanese');
    });

    it('finds encoding from any group', () =>
    {
        // Test a few encodings from different groups
        const utf16 = GetEncodingByValue('utf-16le');
        expect(utf16).toBeDefined();
        expect(utf16?.value).toBe('utf-16le');

        const cyrillic = GetEncodingByValue('cp866');
        expect(cyrillic).toBeDefined();
        expect(cyrillic?.label).toContain('Cyrillic');
    });
});
