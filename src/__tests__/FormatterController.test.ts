import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    FormatCurrentDocument,
    FormatCurrentSelection,
    FormatOnSave,
    IsFormatOnSaveEnabled,
    ToggleFormatOnSave,
} from '../Notemac/Controllers/FormatterController';

vi.mock('../Notemac/Services/FormatterService', () =>
({
    FormatDocument: vi.fn().mockResolvedValue('formatted'),
    FormatSelection: vi.fn().mockResolvedValue('formatted selection'),
    IsLanguageSupported: vi.fn().mockReturnValue(true),
}));

vi.mock('../Shared/Helpers/EditorGlobals', () =>
({
    GetMonacoEditor: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { FORMAT_DOCUMENT: 'FORMAT_DOCUMENT' },
}));

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

import { GetMonacoEditor } from '../Shared/Helpers/EditorGlobals';
import { useNotemacStore } from '../Notemac/Model/Store';

describe('FormatterController', () =>
{
    let mockEditor: any;
    let mockModel: any;

    beforeEach(() =>
    {
        mockModel = {
            getValue: vi.fn().mockReturnValue('const x = 1;'),
            getLanguageId: vi.fn().mockReturnValue('javascript'),
            getFullModelRange: vi.fn().mockReturnValue({ startLineNumber: 1, endLineNumber: 1 }),
            getOffsetAt: vi.fn().mockReturnValue(0),
        };
        mockEditor = {
            getModel: vi.fn().mockReturnValue(mockModel),
            getSelection: vi.fn().mockReturnValue({
                startLineNumber: 1,
                endLineNumber: 1,
                isEmpty: () => false,
                getStartPosition: () => ({ lineNumber: 1, column: 1 }),
                getEndPosition: () => ({ lineNumber: 1, column: 10 }),
            }),
            executeEdits: vi.fn(),
        };
        (GetMonacoEditor as any).mockReturnValue(mockEditor);
        (useNotemacStore.getState as any).mockReturnValue({
            settings: { formatOnSave: true, tabSize: 4, insertSpaces: true },
        });
        vi.clearAllMocks();
    });

    describe('FormatCurrentDocument', () =>
    {
        it('should format the current document', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentDocument();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should return false when editor is null', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            const result = await FormatCurrentDocument();
            expect(false === result).toBe(true);
        });

        it('should return false when model is null', async () =>
        {
            mockEditor.getModel.mockReturnValue(null);
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentDocument();
            expect(false === result).toBe(true);
        });

        it('should execute edits on format', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            await FormatCurrentDocument();
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });

        it('should return true on successful format', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentDocument();
            expect(true === result).toBe(true);
        });
    });

    describe('FormatCurrentSelection', () =>
    {
        it('should format the selected text', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentSelection();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should return false when no selection', async () =>
        {
            mockEditor.getSelection.mockReturnValue(null);
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentSelection();
            expect(false === result).toBe(true);
        });

        it('should return false when selection is empty', async () =>
        {
            mockEditor.getSelection.mockReturnValue({
                isEmpty: () => true,
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentSelection();
            expect(false === result).toBe(true);
        });

        it('should return false when editor is null', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            const result = await FormatCurrentSelection();
            expect(false === result).toBe(true);
        });

        it('should return false when model is null', async () =>
        {
            mockEditor.getModel.mockReturnValue(null);
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await FormatCurrentSelection();
            expect(false === result).toBe(true);
        });

        it('should call executeEdits on valid selection', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            await FormatCurrentSelection();
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });
    });

    describe('FormatOnSave', () =>
    {
        it('should not throw when called', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: true, tabSize: 4, insertSpaces: true },
            });
            await expect(FormatOnSave()).resolves.not.toThrow();
        });

        it('should not throw when formatOnSave is disabled', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: false, tabSize: 4, insertSpaces: true },
            });
            await expect(FormatOnSave()).resolves.not.toThrow();
        });

        it('should call FormatCurrentDocument when enabled', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: true, tabSize: 4, insertSpaces: true },
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            await FormatOnSave();
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });

        it('should skip formatting when disabled', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: false, tabSize: 4, insertSpaces: true },
            });
            vi.clearAllMocks();
            await FormatOnSave();
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });
    });

    describe('IsFormatOnSaveEnabled', () =>
    {
        it('should return true when enabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: true },
            });
            expect(true === IsFormatOnSaveEnabled()).toBe(true);
        });

        it('should return false when disabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: false },
            });
            expect(false === IsFormatOnSaveEnabled()).toBe(true);
        });
    });

    describe('ToggleFormatOnSave', () =>
    {
        it('should return boolean', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: false },
                updateSettings: vi.fn(),
            });
            const result = ToggleFormatOnSave();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should toggle from false to true', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: false },
                updateSettings: vi.fn(),
            });
            const result = ToggleFormatOnSave();
            expect(true === result).toBe(true);
        });

        it('should toggle from true to false', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: true },
                updateSettings: vi.fn(),
            });
            const result = ToggleFormatOnSave();
            expect(false === result).toBe(true);
        });

        it('should call updateSettings', () =>
        {
            const mockUpdateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { formatOnSave: true },
                updateSettings: mockUpdateSettings,
            });
            ToggleFormatOnSave();
            expect(mockUpdateSettings).toHaveBeenCalled();
        });
    });
});
