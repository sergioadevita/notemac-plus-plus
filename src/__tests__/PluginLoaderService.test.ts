import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ValidateManifest,
    CheckVersionCompatibility,
    CompareVersions,
} from '../Notemac/Services/PluginLoaderService';
import type { PluginManifest } from '../Notemac/Commons/PluginTypes';

describe('PluginLoaderService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('ValidateManifest', () =>
    {
        it('should validate a correct manifest', () =>
        {
            const manifest: PluginManifest = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
                main: 'dist/index.js',
            };

            const result = ValidateManifest(manifest);

            expect(true === result).toBe(true);
        });

        it('should reject manifest without id', () =>
        {
            const manifest = {
                name: 'Test Plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
                main: 'dist/index.js',
            } as any;

            const result = ValidateManifest(manifest);

            expect(false === result).toBe(true);
        });

        it('should reject manifest without name', () =>
        {
            const manifest = {
                id: 'test-plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
                main: 'dist/index.js',
            } as any;

            const result = ValidateManifest(manifest);

            expect(false === result).toBe(true);
        });

        it('should reject manifest without main entry point', () =>
        {
            const manifest = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
            } as any;

            const result = ValidateManifest(manifest);

            expect(false === result).toBe(true);
        });

        it('should accept manifest with optional engine', () =>
        {
            const manifest: PluginManifest = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
                main: 'dist/index.js',
                engines: { notemac: '>=1.0.0' },
            };

            const result = ValidateManifest(manifest);

            expect(true === result).toBe(true);
        });

        it('should reject manifest with incompatible engine', () =>
        {
            const manifest = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                author: 'test-author',
                description: 'A test plugin',
                main: 'dist/index.js',
                engines: { notemac: '>=999.0.0' },
            } as any;

            const result = ValidateManifest(manifest);

            expect(false === result).toBe(true);
        });
    });

    describe('CheckVersionCompatibility', () =>
    {
        it('should accept compatible exact version', () =>
        {
            const result = CheckVersionCompatibility('1.0.0', '1.0.0');

            expect(true === result).toBe(true);
        });

        it('should accept newer version with >= operator', () =>
        {
            const result = CheckVersionCompatibility('>=1.0.0', '2.0.0');

            expect(true === result).toBe(true);
        });

        it('should reject older version with >= operator', () =>
        {
            const result = CheckVersionCompatibility('>=2.0.0', '1.0.0');

            expect(false === result).toBe(true);
        });

        it('should handle caret operator for compatible versions', () =>
        {
            const result = CheckVersionCompatibility('^1.2.0', '1.5.0');

            expect(true === result).toBe(true);
        });

        it('should reject different major versions with caret', () =>
        {
            const result = CheckVersionCompatibility('^1.0.0', '2.0.0');

            expect(false === result).toBe(true);
        });

        it('should trim whitespace in requirements', () =>
        {
            const result = CheckVersionCompatibility('  >= 1.0.0  ', '1.0.0');

            expect(true === result).toBe(true);
        });

        it('should handle patch version comparison', () =>
        {
            const result = CheckVersionCompatibility('>=1.0.5', '1.0.10');

            expect(true === result).toBe(true);
        });
    });

    describe('CompareVersions', () =>
    {
        it('should return 0 for equal versions', () =>
        {
            const result = CompareVersions('1.0.0', '1.0.0');

            expect(0 === result).toBe(true);
        });

        it('should return negative for older first version', () =>
        {
            const result = CompareVersions('1.0.0', '2.0.0');

            expect(0 > result).toBe(true);
        });

        it('should return positive for newer first version', () =>
        {
            const result = CompareVersions('2.0.0', '1.0.0');

            expect(0 < result).toBe(true);
        });

        it('should compare major versions first', () =>
        {
            const result = CompareVersions('2.0.0', '1.99.99');

            expect(0 < result).toBe(true);
        });

        it('should compare minor versions when major equal', () =>
        {
            const result = CompareVersions('1.5.0', '1.2.0');

            expect(0 < result).toBe(true);
        });

        it('should compare patch versions when major and minor equal', () =>
        {
            const result = CompareVersions('1.0.5', '1.0.10');

            expect(0 > result).toBe(true);
        });

        it('should handle versions with different segment counts', () =>
        {
            const result = CompareVersions('1.0', '1.0.0');

            expect(0 === result).toBe(true);
        });

        it('should handle very long version strings', () =>
        {
            const result = CompareVersions('1.2.3.4.5', '1.2.3.4.5');

            expect(0 === result).toBe(true);
        });
    });
});
