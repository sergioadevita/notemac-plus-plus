import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ToggleViewMode,
    SetViewMode,
    GoToOffset,
    EditByte,
    SearchHex,
    SetBytesPerRow,
    ShouldAutoHex
} from '../Notemac/Controllers/HexEditorController';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn()
    }
}));

vi.mock('../../Shared/Helpers/HexHelpers', () => ({
    EditByteInString: vi.fn((content: string, offset: number, byteVal: number) => {
        const chars = content.split('');
        chars[offset] = String.fromCharCode(byteVal);
        return chars.join('');
    }),
    ParseHexByte: vi.fn((hex: string) => {
        if (!/^[0-9A-Fa-f]{2}$/.test(hex)) return null;
        return parseInt(hex, 16);
    }),
    SearchHexPattern: vi.fn((content: string, pattern: string) => {
        // Mock implementation: search for pattern as hex bytes
        const bytes = pattern.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 16)));
        const searchStr = bytes.join('');
        const results: number[] = [];
        let idx = content.indexOf(searchStr);
        while (idx !== -1) {
            results.push(idx);
            idx = content.indexOf(searchStr, idx + 1);
        }
        return results;
    }),
    IsBinaryContent: vi.fn((content: string) => {
        // Mock: check for null bytes
        return content.includes('\0');
    }),
    IsBinaryExtension: vi.fn((filename: string) => {
        // Mock: check common binary extensions
        const binaryExts = ['.bin', '.exe', '.dll', '.so', '.dylib', '.o', '.obj'];
        return binaryExts.some(ext => filename.toLowerCase().endsWith(ext));
    })
}));

import { useNotemacStore } from '../Notemac/Model/Store';

// ─── ToggleViewMode ────────────────────────────────────────────────

describe('ToggleViewMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('toggles text to hex', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'text' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ToggleViewMode();

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab1', 'hex');
    });

    it('toggles hex to text', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'hex' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ToggleViewMode();

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab1', 'text');
    });

    it('does nothing with no active tab', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [],
            activeTabId: null,
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ToggleViewMode();

        expect(mockUpdateTabViewMode).not.toHaveBeenCalled();
    });

    it('toggles with explicit tabId', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'text' },
                { id: 'tab2', viewMode: 'hex' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ToggleViewMode('tab2');

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab2', 'text');
    });
});

// ─── SetViewMode ──────────────────────────────────────────────────

describe('SetViewMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets mode to hex', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'text' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetViewMode('hex');

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab1', 'hex');
    });

    it('sets mode to text', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'hex' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetViewMode('text');

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab1', 'text');
    });

    it('does nothing with no active tab', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [],
            activeTabId: null,
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetViewMode('hex');

        expect(mockUpdateTabViewMode).not.toHaveBeenCalled();
    });

    it('sets mode with explicit tabId', () => {
        const mockUpdateTabViewMode = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', viewMode: 'text' },
                { id: 'tab2', viewMode: 'text' }
            ],
            activeTabId: 'tab1',
            updateTabViewMode: mockUpdateTabViewMode
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetViewMode('hex', 'tab2');

        expect(mockUpdateTabViewMode).toHaveBeenCalledWith('tab2', 'hex');
    });
});

// ─── GoToOffset ────────────────────────────────────────────────────

describe('GoToOffset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('accepts valid decimal offset', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('5');

        expect(true === result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexByteOffset: 5 });
    });

    it('accepts valid hex offset with 0x prefix', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('0x0A');

        expect(true === result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexByteOffset: 10 });
    });

    it('accepts valid hex offset with uppercase 0X prefix', () => {
        const mockUpdateTab = vi.fn();
        const longContent = 'A'.repeat(300);
        const mockStore = {
            tabs: [
                { id: 'tab1', content: longContent, hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('0xFF');

        expect(true === result.success).toBe(true);
        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexByteOffset: 255 });
    });

    it('returns error for offset out of range', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('10');

        expect(false === result.success).toBe(true);
        expect(null !== result.error).toBe(true);
        expect(result.error!.includes('exceeds file size')).toBe(true);
        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('returns error for invalid string', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('notanumber');

        expect(false === result.success).toBe(true);
        expect('Invalid offset value' === result.error).toBe(true);
        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('returns error for negative offset', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('-5');

        expect(false === result.success).toBe(true);
        expect('Invalid offset value' === result.error).toBe(true);
        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('returns error with no active tab', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [],
            activeTabId: null,
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('5');

        expect(false === result.success).toBe(true);
        expect('No active tab' === result.error).toBe(true);
        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('returns error when tab not found', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab2',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('5');

        expect(false === result.success).toBe(true);
        expect('Tab not found' === result.error).toBe(true);
        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('trims whitespace from offset string', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello World', hexByteOffset: 0 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = GoToOffset('  5  ');

        expect(true === result.success).toBe(true);
        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexByteOffset: 5 });
    });
});

// ─── EditByte ──────────────────────────────────────────────────────

describe('EditByte', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('edits byte at valid offset', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, '41');

        expect(true === result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockUpdateTabContent).toHaveBeenCalled();
    });

    it('returns error for read-only tab', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: true }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, '41');

        expect(false === result.success).toBe(true);
        expect('File is read-only' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('returns error for invalid hex value', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, 'ZZ');

        expect(false === result.success).toBe(true);
        expect('Invalid hex value' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('returns error for offset out of range (negative)', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(-1, '41');

        expect(false === result.success).toBe(true);
        expect('Offset out of range' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('returns error for offset out of range (too large)', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(10, '41');

        expect(false === result.success).toBe(true);
        expect('Offset out of range' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('returns error with no active tab', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [],
            activeTabId: null,
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, '41');

        expect(false === result.success).toBe(true);
        expect('No active tab' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('returns error when tab not found', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false }
            ],
            activeTabId: 'tab2',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, '41');

        expect(false === result.success).toBe(true);
        expect('Tab not found' === result.error).toBe(true);
        expect(mockUpdateTabContent).not.toHaveBeenCalled();
    });

    it('edits byte with explicit tabId', () => {
        const mockUpdateTabContent = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello', isReadOnly: false },
                { id: 'tab2', content: 'World', isReadOnly: false }
            ],
            activeTabId: 'tab1',
            updateTabContent: mockUpdateTabContent
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditByte(0, '42', 'tab2');

        expect(true === result.success).toBe(true);
        expect(mockUpdateTabContent).toHaveBeenCalledWith('tab2', expect.any(String));
    });
});

// ─── SearchHex ────────────────────────────────────────────────────

describe('SearchHex', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('finds pattern and returns offsets', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello\x48ello' }
            ],
            activeTabId: 'tab1'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('48');

        expect(true === result.success).toBe(true);
        expect(Array.isArray(result.offsets)).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('returns empty offsets when no match found', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello' }
            ],
            activeTabId: 'tab1'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('FF');

        expect(true === result.success).toBe(true);
        expect(0 === result.offsets.length).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('returns error for empty pattern', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello' }
            ],
            activeTabId: 'tab1'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('');

        expect(false === result.success).toBe(true);
        expect('Empty search pattern' === result.error).toBe(true);
        expect(0 === result.offsets.length).toBe(true);
    });

    it('returns error for whitespace-only pattern', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello' }
            ],
            activeTabId: 'tab1'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('   ');

        expect(false === result.success).toBe(true);
        expect('Empty search pattern' === result.error).toBe(true);
        expect(0 === result.offsets.length).toBe(true);
    });

    it('returns error with no active tab', () => {
        const mockStore = {
            tabs: [],
            activeTabId: null
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('48');

        expect(false === result.success).toBe(true);
        expect('No active tab' === result.error).toBe(true);
        expect(0 === result.offsets.length).toBe(true);
    });

    it('returns error when tab not found', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello' }
            ],
            activeTabId: 'tab2'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('48');

        expect(false === result.success).toBe(true);
        expect('Tab not found' === result.error).toBe(true);
        expect(0 === result.offsets.length).toBe(true);
    });

    it('searches with explicit tabId', () => {
        const mockStore = {
            tabs: [
                { id: 'tab1', content: 'Hello' },
                { id: 'tab2', content: 'World' }
            ],
            activeTabId: 'tab1'
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = SearchHex('48', 'tab2');

        expect(true === result.success).toBe(true);
        expect(Array.isArray(result.offsets)).toBe(true);
    });
});

// ─── SetBytesPerRow ────────────────────────────────────────────────

describe('SetBytesPerRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets bytes per row to 8', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', hexBytesPerRow: 16 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetBytesPerRow(8);

        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexBytesPerRow: 8 });
    });

    it('sets bytes per row to 16', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', hexBytesPerRow: 8 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetBytesPerRow(16);

        expect(mockUpdateTab).toHaveBeenCalledWith('tab1', { hexBytesPerRow: 16 });
    });

    it('does nothing with no active tab', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [],
            activeTabId: null,
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetBytesPerRow(16);

        expect(mockUpdateTab).not.toHaveBeenCalled();
    });

    it('sets bytes per row with explicit tabId', () => {
        const mockUpdateTab = vi.fn();
        const mockStore = {
            tabs: [
                { id: 'tab1', hexBytesPerRow: 8 },
                { id: 'tab2', hexBytesPerRow: 8 }
            ],
            activeTabId: 'tab1',
            updateTab: mockUpdateTab
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        SetBytesPerRow(16, 'tab2');

        expect(mockUpdateTab).toHaveBeenCalledWith('tab2', { hexBytesPerRow: 16 });
    });
});

// ─── ShouldAutoHex ────────────────────────────────────────────────

describe('ShouldAutoHex', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns true for binary extension', () => {
        const result = ShouldAutoHex('file.bin', 'text content');

        expect(true === result).toBe(true);
    });

    it('returns true for .exe extension', () => {
        const result = ShouldAutoHex('program.exe', 'text content');

        expect(true === result).toBe(true);
    });

    it('returns true for .dll extension', () => {
        const result = ShouldAutoHex('library.dll', 'text content');

        expect(true === result).toBe(true);
    });

    it('returns true for binary content (null bytes)', () => {
        const result = ShouldAutoHex('file.txt', 'Hello\0World');

        expect(true === result).toBe(true);
    });

    it('returns false for text file', () => {
        const result = ShouldAutoHex('file.txt', 'Hello World');

        expect(false === result).toBe(true);
    });

    it('returns false for markdown file with text content', () => {
        const result = ShouldAutoHex('README.md', 'This is a readme');

        expect(false === result).toBe(true);
    });

    it('returns true when both extension and content are binary', () => {
        const result = ShouldAutoHex('data.bin', 'Hello\0World');

        expect(true === result).toBe(true);
    });

    it('returns true for .so extension', () => {
        const result = ShouldAutoHex('library.so', 'text content');

        expect(true === result).toBe(true);
    });

    it('returns true for .dylib extension', () => {
        const result = ShouldAutoHex('library.dylib', 'text content');

        expect(true === result).toBe(true);
    });

    it('is case-insensitive for extensions', () => {
        const result = ShouldAutoHex('FILE.BIN', 'text content');

        expect(true === result).toBe(true);
    });
});
