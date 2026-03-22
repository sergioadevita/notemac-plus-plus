import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock PluginRegistryService globally — its FetchRegistryIndex calls
// fetch() which leaks pending promises and causes "Closing rpc while
// fetch was pending" errors when vitest workers terminate.
vi.mock('../Notemac/Services/PluginRegistryService', async (importOriginal) =>
{
    const actual = await importOriginal() as Record<string, unknown>;
    return {
        ...actual,
        FetchRegistryIndex: vi.fn().mockResolvedValue([]),
    };
});

// Mock Monaco Editor — not available in jsdom
vi.mock('@monaco-editor/react', () => ({
    default: vi.fn(() => null),
    Editor: vi.fn(() => null),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
