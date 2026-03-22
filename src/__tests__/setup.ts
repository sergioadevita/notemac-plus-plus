import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Prevent PluginRegistryService fetch leaks — mock global fetch with
// a safe fallback that returns empty data for registry URLs. Tests that
// need real fetch (like OAuthIntegration) still work because those hit
// different endpoints. This prevents "Closing rpc while fetch was pending".
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
{
    const url = 'string' === typeof input ? input : input.toString();
    if (url.includes('/plugins'))
    {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return originalFetch(input, init);
}) as typeof fetch;

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
