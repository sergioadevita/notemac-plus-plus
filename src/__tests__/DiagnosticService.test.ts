import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    RegisterProvider,
    UnregisterProviders,
    RunDiagnostics,
    GetQuickFixes,
    ClearAllProviders,
    GetRegisteredLanguages,
} from '../Notemac/Services/DiagnosticService';

describe('DiagnosticService', () =>
{
    beforeEach(() =>
    {
        ClearAllProviders();
        vi.clearAllMocks();
    });

    describe('RegisterProvider', () =>
    {
        it('should register a diagnostic provider for a language', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            const languages = GetRegisteredLanguages();
            expect(languages).toContain('javascript');
        });

        it('should allow registering multiple providers for different languages', () =>
        {
            const provider1 = vi.fn().mockReturnValue([]);
            const provider2 = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider1);
            RegisterProvider('typescript', provider2);
            const languages = GetRegisteredLanguages();
            expect(languages).toContain('javascript');
            expect(languages).toContain('typescript');
        });

        it('should allow multiple providers for the same language', () =>
        {
            const provider1 = vi.fn().mockReturnValue([]);
            const provider2 = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider1);
            RegisterProvider('javascript', provider2);
            const languages = GetRegisteredLanguages();
            expect(languages.filter((l: string) => 'javascript' === l).length).toBeGreaterThan(0);
        });

        it('should successfully store providers', () =>
        {
            const provider = vi.fn().mockReturnValue([
                { message: 'test', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'test' },
            ]);
            RegisterProvider('python', provider);
            const result = RunDiagnostics('test', 'python');
            expect(result.length > 0).toBe(true);
        });
    });

    describe('RunDiagnostics', () =>
    {
        it('should return diagnostics from registered provider', () =>
        {
            const diagnostics = [
                { message: 'error found', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10, source: 'test' },
            ];
            const provider = vi.fn().mockReturnValue(diagnostics);
            RegisterProvider('javascript', provider);
            const result = RunDiagnostics('const x = ;', 'javascript');
            expect(result).toEqual(diagnostics);
        });

        it('should return empty array for unregistered language', () =>
        {
            const result = RunDiagnostics('hello', 'unknown');
            expect(result).toEqual([]);
        });

        it('should handle provider errors gracefully', () =>
        {
            const provider = vi.fn().mockImplementation(() =>
            {
                throw new Error('fail');
            });
            RegisterProvider('javascript', provider);
            const result = RunDiagnostics('test', 'javascript');
            expect(true === Array.isArray(result)).toBe(true);
        });

        it('should support universal providers with asterisk', () =>
        {
            const universalProvider = vi.fn().mockReturnValue([
                { message: 'universal error', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'universal' },
            ]);
            RegisterProvider('*', universalProvider);
            const result = RunDiagnostics('test', 'any-language');
            expect(result.length > 0).toBe(true);
        });

        it('should combine language and universal providers', () =>
        {
            const langProvider = vi.fn().mockReturnValue([
                { message: 'lang error', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'lang' },
            ]);
            const universalProvider = vi.fn().mockReturnValue([
                { message: 'universal error', severity: 'error' as const, startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5, source: 'universal' },
            ]);
            RegisterProvider('javascript', langProvider);
            RegisterProvider('*', universalProvider);
            const result = RunDiagnostics('test', 'javascript');
            expect(result.length >= 2).toBe(true);
        });

        it('should sort diagnostics by line and column', () =>
        {
            const provider = vi.fn().mockReturnValue([
                { message: 'error2', severity: 'error' as const, startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 5, source: 'test' },
                { message: 'error1', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'test' },
            ]);
            RegisterProvider('javascript', provider);
            const result = RunDiagnostics('test', 'javascript');
            expect(1 === result[0].startLineNumber).toBe(true);
            expect(5 === result[1].startLineNumber).toBe(true);
        });
    });

    describe('UnregisterProviders', () =>
    {
        it('should remove providers for a language', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            UnregisterProviders('javascript');
            const result = RunDiagnostics('test', 'javascript');
            expect(result).toEqual([]);
        });

        it('should not affect other languages', () =>
        {
            const provider1 = vi.fn().mockReturnValue([
                { message: 'error1', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'test' },
            ]);
            const provider2 = vi.fn().mockReturnValue([
                { message: 'error2', severity: 'error' as const, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, source: 'test' },
            ]);
            RegisterProvider('javascript', provider1);
            RegisterProvider('typescript', provider2);
            UnregisterProviders('javascript');
            const result = RunDiagnostics('test', 'typescript');
            expect(result.length > 0).toBe(true);
        });
    });

    describe('GetQuickFixes', () =>
    {
        it('should return quick fixes for a diagnostic with unused variable message', () =>
        {
            const diagnostic = {
                message: 'unused variable x is declared but',
                severity: 'warning' as const,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5,
                source: 'test',
            };
            const fixes = GetQuickFixes(diagnostic);
            expect(true === Array.isArray(fixes)).toBe(true);
            expect(fixes.length > 0).toBe(true);
        });

        it('should return quick fixes for a diagnostic with missing semicolon message', () =>
        {
            const diagnostic = {
                message: 'missing semicolon',
                severity: 'warning' as const,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5,
                source: 'test',
            };
            const fixes = GetQuickFixes(diagnostic);
            expect(true === Array.isArray(fixes)).toBe(true);
            expect(fixes.length > 0).toBe(true);
        });

        it('should return empty array for diagnostics without known fixes', () =>
        {
            const diagnostic = {
                message: 'some other error',
                severity: 'error' as const,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5,
                source: 'test',
            };
            const fixes = GetQuickFixes(diagnostic);
            expect(true === Array.isArray(fixes)).toBe(true);
            expect(0 === fixes.length).toBe(true);
        });

        it('should have correct fix structure for unused variable', () =>
        {
            const diagnostic = {
                message: 'unused variable test',
                severity: 'warning' as const,
                startLineNumber: 5,
                startColumn: 1,
                endLineNumber: 5,
                endColumn: 10,
                source: 'test',
            };
            const fixes = GetQuickFixes(diagnostic);
            if (fixes.length > 0)
            {
                expect(null !== fixes[0].title).toBe(true);
                expect(null !== fixes[0].edit).toBe(true);
                expect(null !== fixes[0].edit.range).toBe(true);
            }
        });
    });

    describe('ClearAllProviders', () =>
    {
        it('should remove all registered providers', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            RegisterProvider('typescript', provider);
            ClearAllProviders();
            expect(GetRegisteredLanguages()).toEqual([]);
        });

        it('should allow registering new providers after clear', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            ClearAllProviders();
            RegisterProvider('typescript', provider);
            const languages = GetRegisteredLanguages();
            expect(languages).toContain('typescript');
            expect(false === languages.includes('javascript')).toBe(true);
        });
    });

    describe('GetRegisteredLanguages', () =>
    {
        it('should return empty array initially', () =>
        {
            ClearAllProviders();
            expect(GetRegisteredLanguages()).toEqual([]);
        });

        it('should return registered languages', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            RegisterProvider('typescript', provider);
            const languages = GetRegisteredLanguages();
            expect(languages).toContain('javascript');
            expect(languages).toContain('typescript');
        });

        it('should return unique languages', () =>
        {
            const provider = vi.fn().mockReturnValue([]);
            RegisterProvider('javascript', provider);
            RegisterProvider('javascript', provider);
            const languages = GetRegisteredLanguages();
            const jsCount = languages.filter(l => 'javascript' === l).length;
            expect(1 === jsCount).toBe(true);
        });
    });
});
