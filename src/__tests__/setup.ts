import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Stub global fetch to prevent "Closing rpc while fetch was pending" errors.
// PluginRegistryService calls fetch() during module import chains and the
// pending promise causes vitest workers to exit with code 1. Tests that need
// real fetch (like OAuthIntegration) restore it via beforeAll/afterAll.
const _realFetch = globalThis.fetch;
(globalThis as any).__realFetch = _realFetch;
vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ([]),
    text: async () => '',
    headers: new Headers(),
    clone: () => ({ ok: true, status: 200, json: async () => ([]), text: async () => '' }),
})));

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
