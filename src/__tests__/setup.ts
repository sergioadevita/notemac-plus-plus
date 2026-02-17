import '@testing-library/jest-dom';

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
