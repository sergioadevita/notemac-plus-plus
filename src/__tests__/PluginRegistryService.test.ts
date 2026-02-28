import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ValidateRegistryEntry,
    SearchRegistry,
    GetDemoRegistryEntries,
} from '../Notemac/Services/PluginRegistryService';
import type { PluginRegistryEntry } from '../Notemac/Commons/PluginTypes';

vi.stubGlobal('fetch', vi.fn());

describe('PluginRegistryService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('ValidateRegistryEntry', () =>
    {
        it('should validate correct registry entry', () =>
        {
            const entry: PluginRegistryEntry = {
                id: 'plugin-1',
                name: 'Plugin 1',
                version: '1.0.0',
                description: 'Test plugin',
                author: 'test-pub',
                downloadUrl: 'https://example.com/plugin.zip',
                stars: 10,
                downloads: 100,
            };

            const result = ValidateRegistryEntry(entry);

            expect(true === result).toBe(true);
        });

        it('should reject entry without id', () =>
        {
            const entry = {
                name: 'Plugin 1',
                version: '1.0.0',
                description: 'Test',
                author: 'pub',
                downloadUrl: 'https://example.com/plugin.zip',
                stars: 5,
                downloads: 50,
            } as any;

            const result = ValidateRegistryEntry(entry);

            expect(false === result).toBe(true);
        });

        it('should reject entry without downloadUrl', () =>
        {
            const entry = {
                id: 'plugin-1',
                name: 'Plugin 1',
                version: '1.0.0',
                description: 'Test',
                author: 'pub',
                stars: 5,
                downloads: 50,
            } as any;

            const result = ValidateRegistryEntry(entry);

            expect(false === result).toBe(true);
        });

        it('should validate entry with optional fields', () =>
        {
            const entry: PluginRegistryEntry = {
                id: 'plugin-1',
                name: 'Plugin 1',
                version: '1.0.0',
                description: 'Test plugin',
                author: 'test-pub',
                downloadUrl: 'https://example.com/plugin.zip',
                stars: 10,
                downloads: 100,
                icon: 'icon.svg',
            };

            const result = ValidateRegistryEntry(entry);

            expect(true === result).toBe(true);
        });

        it('should reject null entry', () =>
        {
            const result = ValidateRegistryEntry(null);

            expect(false === result).toBe(true);
        });

        it('should reject non-object entry', () =>
        {
            const result = ValidateRegistryEntry('not-an-object');

            expect(false === result).toBe(true);
        });
    });

    describe('SearchRegistry', () =>
    {
        it('should return all entries for empty query', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Test Plugin',
                    version: '1.0.0',
                    description: 'A test plugin',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
                {
                    id: 'plugin-2',
                    name: 'Other Plugin',
                    version: '1.0.0',
                    description: 'Another plugin',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin2.zip',
                    stars: 4,
                    downloads: 40,
                },
            ];

            const results = SearchRegistry('', registry);

            expect(2 === results.length).toBe(true);
        });

        it('should search by plugin name', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Test Plugin',
                    version: '1.0.0',
                    description: 'A test plugin',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
                {
                    id: 'plugin-2',
                    name: 'Other Plugin',
                    version: '1.0.0',
                    description: 'Another plugin',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin2.zip',
                    stars: 4,
                    downloads: 40,
                },
            ];

            const results = SearchRegistry('Test', registry);

            expect(1 === results.length).toBe(true);
            expect('plugin-1' === results[0].id).toBe(true);
        });

        it('should search by description', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Plugin 1',
                    version: '1.0.0',
                    description: 'Markdown editor',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
                {
                    id: 'plugin-2',
                    name: 'Plugin 2',
                    version: '1.0.0',
                    description: 'JSON formatter',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin2.zip',
                    stars: 4,
                    downloads: 40,
                },
            ];

            const results = SearchRegistry('markdown', registry);

            expect(1 === results.length).toBe(true);
        });

        it('should search by author', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Plugin 1',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'Alice',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
                {
                    id: 'plugin-2',
                    name: 'Plugin 2',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'Bob',
                    downloadUrl: 'https://example.com/plugin2.zip',
                    stars: 4,
                    downloads: 40,
                },
            ];

            const results = SearchRegistry('Alice', registry);

            expect(1 === results.length).toBe(true);
        });

        it('should be case-insensitive', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Test Plugin',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
            ];

            const results = SearchRegistry('TEST', registry);

            expect(1 === results.length).toBe(true);
        });

        it('should return empty results for no matches', () =>
        {
            const registry: PluginRegistryEntry[] = [
                {
                    id: 'plugin-1',
                    name: 'Plugin 1',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'pub',
                    downloadUrl: 'https://example.com/plugin.zip',
                    stars: 5,
                    downloads: 50,
                },
            ];

            const results = SearchRegistry('nonexistent', registry);

            expect(0 === results.length).toBe(true);
        });
    });

    describe('GetDemoRegistryEntries', () =>
    {
        it('should return demo entries', () =>
        {
            const entries = GetDemoRegistryEntries();

            expect(0 < entries.length).toBe(true);
        });

        it('should return entries with all required fields', () =>
        {
            const entries = GetDemoRegistryEntries();

            entries.forEach((entry) =>
            {
                expect(null !== entry.id).toBe(true);
                expect(null !== entry.name).toBe(true);
                expect(null !== entry.version).toBe(true);
                expect(null !== entry.author).toBe(true);
                expect(null !== entry.downloadUrl).toBe(true);
            });
        });

        it('should return valid entries', () =>
        {
            const entries = GetDemoRegistryEntries();

            entries.forEach((entry) =>
            {
                const result = ValidateRegistryEntry(entry);
                expect(true === result).toBe(true);
            });
        });

        it('should return consistent entries on multiple calls', () =>
        {
            const entries1 = GetDemoRegistryEntries();
            const entries2 = GetDemoRegistryEntries();

            expect(entries1.length === entries2.length).toBe(true);
        });

        it('should return entries with proper structure', () =>
        {
            const entries = GetDemoRegistryEntries();

            entries.forEach((entry) =>
            {
                expect('string' === typeof entry.id).toBe(true);
                expect('string' === typeof entry.name).toBe(true);
                expect('string' === typeof entry.version).toBe(true);
                expect('string' === typeof entry.author).toBe(true);
                expect('string' === typeof entry.downloadUrl).toBe(true);
            });
        });

        it('should return at least 3 demo entries', () =>
        {
            const entries = GetDemoRegistryEntries();

            expect(2 < entries.length).toBe(true);
        });
    });
});
