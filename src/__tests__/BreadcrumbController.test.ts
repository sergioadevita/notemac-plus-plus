import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    GetBreadcrumbs,
    BuildBreadcrumbsFromPath,
    BuildBreadcrumbsWithSymbols,
    UpdateBreadcrumbs,
    NavigateToBreadcrumb,
    ClearBreadcrumbs,
} from '../Notemac/Controllers/BreadcrumbController';

vi.mock('../../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { BREADCRUMB_UPDATED: 'BREADCRUMB_UPDATED' },
}));

vi.mock('../Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(() =>
        ({
            SetBreadcrumbs: vi.fn(),
        })),
    },
}));

describe('BreadcrumbController', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        ClearBreadcrumbs();
    });

    describe('BuildBreadcrumbsFromPath', () =>
    {
        it('should split a file path into breadcrumb items', () =>
        {
            const result = BuildBreadcrumbsFromPath('/src/Notemac/Controllers/FileController.ts');
            expect(result.length).toBeGreaterThan(0);
            expect('FileController.ts' === result[result.length - 1].label).toBe(true);
            expect('file' === result[result.length - 1].kind).toBe(true);
        });

        it('should return empty array for null path', () =>
        {
            const result = BuildBreadcrumbsFromPath(null);
            expect(result).toEqual([]);
        });

        it('should return empty array for empty string', () =>
        {
            const result = BuildBreadcrumbsFromPath('');
            expect(result).toEqual([]);
        });

        it('should mark intermediate segments as folders', () =>
        {
            const result = BuildBreadcrumbsFromPath('/src/Notemac/test.ts');
            const folders = result.filter(b => 'folder' === b.kind);
            expect(folders.length).toBeGreaterThan(0);
        });

        it('should handle single file name without path', () =>
        {
            const result = BuildBreadcrumbsFromPath('test.ts');
            expect(1 === result.length).toBe(true);
            expect('file' === result[0].kind).toBe(true);
        });

        it('should respect breadcrumb max items limit', () =>
        {
            const longPath = Array(20).fill('folder').join('/') + '/file.ts';
            const result = BuildBreadcrumbsFromPath(longPath);
            expect(result.length).toBeLessThanOrEqual(10);
        });

        it('should keep last N items when trimming', () =>
        {
            const longPath = 'a/b/c/d/e/f/g/h/i/j/k/file.ts';
            const result = BuildBreadcrumbsFromPath(longPath);
            expect('file.ts' === result[result.length - 1].label).toBe(true);
        });
    });

    describe('BuildBreadcrumbsWithSymbols', () =>
    {
        it('should create breadcrumb items from file path and symbols', () =>
        {
            const symbols = [
                { name: 'MyClass', kind: 5, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 50, endColumn: 1 } },
                { name: 'myMethod', kind: 6, range: { startLineNumber: 10, startColumn: 5, endLineNumber: 20, endColumn: 5 } },
            ];
            const result = BuildBreadcrumbsWithSymbols('/path/test.ts', symbols, 15);
            expect(result.length).toBeGreaterThan(0);
            expect(result.some(r => 'symbol' === r.kind)).toBe(true);
        });

        it('should return empty array for null file path with no symbols', () =>
        {
            const result = BuildBreadcrumbsWithSymbols(null, [], 1);
            expect(result).toEqual([]);
        });

        it('should filter symbols by cursor line', () =>
        {
            const symbols = [
                { name: 'FuncA', kind: 12, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 10, endColumn: 1 } },
                { name: 'FuncB', kind: 12, range: { startLineNumber: 20, startColumn: 1, endLineNumber: 30, endColumn: 1 } },
            ];
            const result = BuildBreadcrumbsWithSymbols('/path/test.ts', symbols, 5);
            const labels = result.map(r => r.label);
            expect(labels).toContain('FuncA');
            expect(labels).not.toContain('FuncB');
        });

        it('should include deepest containing symbol for cursor position', () =>
        {
            const symbols = [
                { name: 'OuterClass', kind: 5, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 100, endColumn: 1 } },
                { name: 'innerMethod', kind: 6, range: { startLineNumber: 30, startColumn: 5, endLineNumber: 40, endColumn: 5 } },
            ];
            const result = BuildBreadcrumbsWithSymbols('/path/test.ts', symbols, 35);
            const labels = result.map(r => r.label);
            expect(labels).toContain('OuterClass');
            expect(labels).toContain('innerMethod');
        });
    });

    describe('UpdateBreadcrumbs / GetBreadcrumbs', () =>
    {
        it('should store and retrieve breadcrumbs', () =>
        {
            const items = [
                { label: 'src', kind: 'folder' as const },
                { label: 'test.ts', kind: 'file' as const },
            ];
            UpdateBreadcrumbs(items);
            const result = GetBreadcrumbs();
            expect(result).toEqual(items);
        });

        it('should return empty array initially', () =>
        {
            ClearBreadcrumbs();
            const result = GetBreadcrumbs();
            expect(result).toEqual([]);
        });

        it('should replace previous breadcrumbs on update', () =>
        {
            const items1 = [{ label: 'first', kind: 'file' as const }];
            const items2 = [{ label: 'second', kind: 'file' as const }];
            UpdateBreadcrumbs(items1);
            UpdateBreadcrumbs(items2);
            const result = GetBreadcrumbs();
            expect(result).toEqual(items2);
        });
    });

    describe('NavigateToBreadcrumb', () =>
    {
        it('should return position for a breadcrumb with range', () =>
        {
            const items = [
                { label: 'file.ts', kind: 'file' as const },
                { label: 'MyClass', kind: 'symbol' as const, range: { startLineNumber: 10, startColumn: 1, endLineNumber: 20, endColumn: 1 } },
            ];
            UpdateBreadcrumbs(items);
            const result = NavigateToBreadcrumb(1);
            expect(null !== result).toBe(true);
            expect(10 === result?.lineNumber).toBe(true);
            expect(1 === result?.column).toBe(true);
        });

        it('should return null for breadcrumb without range', () =>
        {
            const items = [
                { label: 'src', kind: 'folder' as const },
            ];
            UpdateBreadcrumbs(items);
            const result = NavigateToBreadcrumb(0);
            expect(null === result).toBe(true);
        });

        it('should return null for out-of-bounds index', () =>
        {
            const items = [{ label: 'test.ts', kind: 'file' as const }];
            UpdateBreadcrumbs(items);
            const result = NavigateToBreadcrumb(99);
            expect(null === result).toBe(true);
        });

        it('should return null for negative index', () =>
        {
            const items = [{ label: 'test.ts', kind: 'file' as const }];
            UpdateBreadcrumbs(items);
            const result = NavigateToBreadcrumb(-1);
            expect(null === result).toBe(true);
        });

        it('should handle undefined range gracefully', () =>
        {
            const items = [
                { label: 'file.ts', kind: 'symbol' as const, range: undefined },
            ];
            UpdateBreadcrumbs(items);
            const result = NavigateToBreadcrumb(0);
            expect(null === result).toBe(true);
        });
    });

    describe('ClearBreadcrumbs', () =>
    {
        it('should clear all breadcrumbs', () =>
        {
            const items = [{ label: 'test.ts', kind: 'file' as const }];
            UpdateBreadcrumbs(items);
            ClearBreadcrumbs();
            expect(GetBreadcrumbs()).toEqual([]);
        });

        it('should return empty array after clear', () =>
        {
            UpdateBreadcrumbs([
                { label: 'a', kind: 'folder' as const },
                { label: 'b', kind: 'file' as const },
            ]);
            ClearBreadcrumbs();
            const result = GetBreadcrumbs();
            expect(0 === result.length).toBe(true);
        });
    });
});
