import { describe, it, expect } from 'vitest';
import {
    FuzzyMatch,
    FuzzyFilter,
} from '../Shared/Helpers/FuzzySearchHelpers';

// ============================================================
// FuzzySearchHelpers — FuzzyMatch
// ============================================================
describe('FuzzySearchHelpers — FuzzyMatch', () =>
{
    it('empty query matches everything with score 0', () =>
    {
        const result = FuzzyMatch('', 'anything');
        expect(result.match).toBe(true);
        expect(result.score).toBe(0);
        expect(result.indices).toEqual([]);
    });

    it('exact match returns high score', () =>
    {
        const result = FuzzyMatch('hello', 'hello');
        expect(result.match).toBe(true);
        expect(result.score).toBeGreaterThan(0);
    });

    it('prefix match gets bonus score', () =>
    {
        const prefixResult = FuzzyMatch('hel', 'hello');
        const midResult = FuzzyMatch('llo', 'hello');
        expect(prefixResult.match).toBe(true);
        expect(midResult.match).toBe(true);
        // Prefix should score higher due to prefix bonus
        expect(prefixResult.score).toBeGreaterThan(midResult.score);
    });

    it('case-insensitive matching works', () =>
    {
        const result1 = FuzzyMatch('Hello', 'hello');
        const result2 = FuzzyMatch('HELLO', 'hello');
        expect(result1.match).toBe(true);
        expect(result2.match).toBe(true);
    });

    it('query longer than text returns no match', () =>
    {
        const result = FuzzyMatch('longerquery', 'text');
        expect(result.match).toBe(false);
        expect(result.score).toBe(0);
        expect(result.indices).toEqual([]);
    });

    it('consecutive characters score higher', () =>
    {
        const consecutiveResult = FuzzyMatch('ll', 'hello');
        const spreadResult = FuzzyMatch('lo', 'hello');
        expect(consecutiveResult.match).toBe(true);
        expect(spreadResult.match).toBe(true);
        // Consecutive characters (ll) should score higher
        expect(consecutiveResult.score).toBeGreaterThan(spreadResult.score);
    });

    it('word boundary bonus applies (after underscore)', () =>
    {
        const boundaryResult = FuzzyMatch('w', 'hello_world');
        const nonBoundaryResult = FuzzyMatch('w', 'helloworld');
        expect(boundaryResult.match).toBe(true);
        expect(nonBoundaryResult.match).toBe(true);
        // Word boundary should score higher
        expect(boundaryResult.score).toBeGreaterThan(nonBoundaryResult.score);
    });

    it('returns correct indices of matched characters', () =>
    {
        const result = FuzzyMatch('hlo', 'hello');
        expect(result.match).toBe(true);
        expect(result.indices).toEqual([0, 2, 4]);
    });

    it('partial match in middle of text', () =>
    {
        const result = FuzzyMatch('ell', 'hello');
        expect(result.match).toBe(true);
        expect(result.indices.length).toBe(3);
    });

    it('no match when characters not found', () =>
    {
        const result = FuzzyMatch('xyz', 'hello');
        expect(result.match).toBe(false);
    });
});

// ============================================================
// FuzzySearchHelpers — FuzzyFilter
// ============================================================
describe('FuzzySearchHelpers — FuzzyFilter', () =>
{
    const items = [
        { name: 'javascript' },
        { name: 'python' },
        { name: 'rust' },
        { name: 'java' },
        { name: 'golang' },
    ];

    it('returns all items when query is empty', () =>
    {
        const result = FuzzyFilter('', items, item => item.name);
        expect(result.length).toBe(items.length);
        expect(result).toEqual(items);
    });

    it('returns matching items sorted by score', () =>
    {
        const result = FuzzyFilter('java', items, item => item.name);
        expect(result.length).toBe(2);
        // 'java' exact match scores higher than 'javascript' partial match
        expect(result[0].name).toBe('java');
        expect(result[1].name).toBe('javascript');
    });

    it('returns only matching items', () =>
    {
        const result = FuzzyFilter('py', items, item => item.name);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('python');
    });

    it('excludes non-matching items', () =>
    {
        const result = FuzzyFilter('rust', items, item => item.name);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('rust');
    });

    it('handles empty items array', () =>
    {
        const result = FuzzyFilter('query', [], item => item.name);
        expect(result).toEqual([]);
    });

    it('case-insensitive filtering', () =>
    {
        const result1 = FuzzyFilter('JAVA', items, item => item.name);
        const result2 = FuzzyFilter('java', items, item => item.name);
        expect(result1.length).toBe(result2.length);
        expect(result1).toEqual(result2);
    });

    it('prefix matching in filter', () =>
    {
        const result = FuzzyFilter('j', items, item => item.name);
        expect(result.length).toBe(2);
        const names = result.map(r => r.name);
        expect(names).toContain('java');
        expect(names).toContain('javascript');
    });

    it('can filter by partial match', () =>
    {
        const result = FuzzyFilter('st', items, item => item.name);
        // Both 'rust' and 'javascript' match 'st'
        expect(result.length).toBeGreaterThan(0);
        const names = result.map(r => r.name);
        expect(names).toContain('rust');
    });

    it('filters with custom getText function', () =>
    {
        const complexItems = [
            { id: 1, description: 'javascript language' },
            { id: 2, description: 'python language' },
        ];
        const result = FuzzyFilter('script', complexItems, item => item.description);
        expect(result.length).toBe(1);
        expect(result[0].description).toBe('javascript language');
    });

    it('returns empty array when no items match', () =>
    {
        const result = FuzzyFilter('xyz123', items, item => item.name);
        expect(result).toEqual([]);
    });
});
