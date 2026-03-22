import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock PluginRegistryService globally — FetchRegistryIndex calls fetch()
// which leaks pending promises and causes "Closing rpc while fetch was
// pending" errors when vitest workers terminate. We must NOT use
// importOriginal() here because loading the real module triggers the leak.
vi.mock('../Notemac/Services/PluginRegistryService', () => ({
    FetchRegistryIndex: vi.fn().mockResolvedValue([]),
    GetDemoRegistryEntries: vi.fn().mockReturnValue([]),
    SearchRegistry: vi.fn().mockReturnValue([]),
    InstallPlugin: vi.fn().mockResolvedValue(null),
    UninstallPlugin: vi.fn().mockResolvedValue(undefined),
    CheckForUpdates: vi.fn().mockReturnValue([]),
    ValidateRegistryEntry: vi.fn().mockReturnValue(true),
}));

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
