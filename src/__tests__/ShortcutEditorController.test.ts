import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    EditShortcut,
    CaptureShortcut,
    ResetShortcutToDefault,
    ResetAllToDefaults,
    ImportShortcuts,
    GetOverrideCount
} from '../Notemac/Controllers/ShortcutEditorController';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn()
    }
}));

import { useNotemacStore } from '../Notemac/Model/Store';

// ─── EditShortcut ──────────────────────────────────────────────

describe('EditShortcut', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('returns success for valid non-conflicting shortcut', () =>
    {
        const mockStore = {
            customShortcutOverrides: {},
            UpdateShortcut: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditShortcut('new', 'Cmd+Alt+N');

        expect(true === result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockStore.UpdateShortcut).toHaveBeenCalledWith('new', 'Cmd+Alt+N');
    });

    it('returns error for invalid shortcut (empty)', () =>
    {
        const mockStore = {
            customShortcutOverrides: {}
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditShortcut('new', '');

        expect(false === result.success).toBe(true);
        expect('Invalid shortcut format' === result.error).toBe(true);
    });

    it('returns conflict error when shortcut is in use', () =>
    {
        const mockStore = {
            customShortcutOverrides: {},
            UpdateShortcut: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = EditShortcut('save', 'Cmd+N');

        expect(false === result.success).toBe(true);
        expect(null !== result.error).toBe(true);
        expect(result.error!.includes('already used')).toBe(true);
        expect('new' === result.conflictAction).toBe(true);
        expect(mockStore.UpdateShortcut).not.toHaveBeenCalled();
    });

    it('calls UpdateShortcut on success', () =>
    {
        const mockStore = {
            customShortcutOverrides: {},
            UpdateShortcut: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        EditShortcut('save', 'Cmd+Alt+K');

        expect(mockStore.UpdateShortcut).toHaveBeenCalledWith('save', 'Cmd+Alt+K');
    });
});

// ─── CaptureShortcut ───────────────────────────────────────────

describe('CaptureShortcut', () =>
{
    it('delegates to NormalizeKeyboardEvent', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'f',
            metaKey: true
        });

        const result = CaptureShortcut(event);

        expect('Cmd+F' === result).toBe(true);
    });

    it('captures Cmd+Shift+P', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'p',
            metaKey: true,
            shiftKey: true
        });

        const result = CaptureShortcut(event);

        expect('Cmd+Shift+P' === result).toBe(true);
    });

    it('captures Alt+ArrowUp and normalizes to Alt+Up', () =>
    {
        const event = new KeyboardEvent('keydown', {
            key: 'ArrowUp',
            altKey: true
        });

        const result = CaptureShortcut(event);

        expect('Alt+Up' === result).toBe(true);
    });
});

// ─── ResetShortcutToDefault ────────────────────────────────────

describe('ResetShortcutToDefault', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('calls store.ResetShortcut', () =>
    {
        const mockStore = {
            ResetShortcut: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ResetShortcutToDefault('new');

        expect(mockStore.ResetShortcut).toHaveBeenCalledWith('new');
    });

    it('calls ResetShortcut with correct action', () =>
    {
        const mockStore = {
            ResetShortcut: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ResetShortcutToDefault('save');

        expect(mockStore.ResetShortcut).toHaveBeenCalledWith('save');
    });
});

// ─── ResetAllToDefaults ────────────────────────────────────────

describe('ResetAllToDefaults', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('calls store.ResetAllShortcuts', () =>
    {
        const mockStore = {
            ResetAllShortcuts: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        ResetAllToDefaults();

        expect(mockStore.ResetAllShortcuts).toHaveBeenCalled();
    });
});

// ─── ImportShortcuts ────────────────────────────────────────────

describe('ImportShortcuts', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('imports valid JSON', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const json = JSON.stringify({ 'new': 'Cmd+Alt+N', 'save': 'Cmd+Alt+S' });
        const result = ImportShortcuts(json);

        expect(true === result.success).toBe(true);
        expect(2 === result.count).toBe(true);
        expect(mockStore.ImportShortcutsFromJSON).toHaveBeenCalledWith(json);
    });

    it('rejects invalid JSON', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = ImportShortcuts('invalid json {');

        expect(false === result.success).toBe(true);
        expect(null !== result.error).toBe(true);
        expect(mockStore.ImportShortcutsFromJSON).not.toHaveBeenCalled();
    });

    it('rejects array JSON', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const json = JSON.stringify(['new', 'save']);
        const result = ImportShortcuts(json);

        expect(false === result.success).toBe(true);
        expect('Invalid JSON format: expected object' === result.error).toBe(true);
        expect(mockStore.ImportShortcutsFromJSON).not.toHaveBeenCalled();
    });

    it('rejects non-string values', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const json = JSON.stringify({ 'new': 123, 'save': 'Cmd+S' });
        const result = ImportShortcuts(json);

        expect(false === result.success).toBe(true);
        expect(null !== result.error).toBe(true);
        expect(mockStore.ImportShortcutsFromJSON).not.toHaveBeenCalled();
    });

    it('rejects null JSON', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const result = ImportShortcuts('null');

        expect(false === result.success).toBe(true);
        expect('Invalid JSON format: expected object' === result.error).toBe(true);
    });

    it('handles empty object', () =>
    {
        const mockStore = {
            ImportShortcutsFromJSON: vi.fn()
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const json = JSON.stringify({});
        const result = ImportShortcuts(json);

        expect(true === result.success).toBe(true);
        expect(0 === result.count).toBe(true);
    });
});

// ─── GetOverrideCount ──────────────────────────────────────────

describe('GetOverrideCount', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('returns count of overrides', () =>
    {
        const mockStore = {
            customShortcutOverrides: {
                'new': 'Cmd+Alt+N',
                'save': 'Cmd+Alt+S',
                'find': 'Cmd+Alt+F'
            }
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const count = GetOverrideCount();

        expect(3 === count).toBe(true);
    });

    it('returns zero when no overrides exist', () =>
    {
        const mockStore = {
            customShortcutOverrides: {}
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const count = GetOverrideCount();

        expect(0 === count).toBe(true);
    });

    it('returns correct count after single override', () =>
    {
        const mockStore = {
            customShortcutOverrides: {
                'new': 'Cmd+Alt+N'
            }
        };

        vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

        const count = GetOverrideCount();

        expect(1 === count).toBe(true);
    });
});
