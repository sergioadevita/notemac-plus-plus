import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorEvents } from '../Notemac/UI/EditorPanel/useEditorEvents';
import type { FileTab } from '../Notemac/Commons/Types';

// ─── Helpers ────────────────────────────────────────────────────

function createMockMonaco()
{
    return {
        Range: class MockRange
        {
            constructor(
                public startLineNumber: number,
                public startColumn: number,
                public endLineNumber: number,
                public endColumn: number,
            ) {}
        },
        editor: { setTheme: vi.fn() },
    } as any;
}

function createMockModel(content = '')
{
    const lines = content.split('\n');
    return {
        getValue: vi.fn().mockReturnValue(content),
        getLineCount: vi.fn().mockReturnValue(lines.length),
        getLineContent: vi.fn((line: number) => lines[line - 1] || ''),
        getLineMaxColumn: vi.fn((line: number) => (lines[line - 1] || '').length + 1),
        getFullModelRange: vi.fn().mockReturnValue({ startLineNumber: 1, startColumn: 1, endLineNumber: lines.length, endColumn: (lines[lines.length - 1] || '').length + 1 }),
        getOffsetAt: vi.fn().mockReturnValue(0),
        getPositionAt: vi.fn().mockImplementation((offset: number) =>
        {
            let remaining = offset;
            for (let i = 0; i < lines.length; i++)
            {
                if (remaining <= lines[i].length)
                {
                    return { lineNumber: i + 1, column: remaining + 1 };
                }
                remaining -= lines[i].length + 1;
            }
            return { lineNumber: lines.length, column: (lines[lines.length - 1] || '').length + 1 };
        }),
        getValueInRange: vi.fn().mockReturnValue(''),
    };
}

function createMockEditor(model: ReturnType<typeof createMockModel>)
{
    return {
        getModel: vi.fn().mockReturnValue(model),
        getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
        getSelection: vi.fn().mockReturnValue({ isEmpty: () => true, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
        setSelection: vi.fn(),
        setPosition: vi.fn(),
        revealLineInCenter: vi.fn(),
        executeEdits: vi.fn(),
        focus: vi.fn(),
        trigger: vi.fn(),
    } as any;
}

function createMockTab(overrides: Partial<FileTab> = {}): FileTab
{
    return {
        id: 'tab-1',
        name: 'test.txt',
        content: '',
        isModified: false,
        bookmarks: [],
        marks: [],
        cursorLine: 1,
        cursorColumn: 1,
        scrollTop: 0,
        language: 'plaintext',
        encoding: 'utf-8',
        lineEnding: 'lf',
        isReadOnly: false,
        ...overrides,
    } as FileTab;
}

function fireCustomEvent(type: string, detail: any)
{
    document.dispatchEvent(new CustomEvent(type, { detail }));
}

// ─── Tests ──────────────────────────────────────────────────────

describe('useEditorEvents', () =>
{
    let mockModel: ReturnType<typeof createMockModel>;
    let mockEditor: ReturnType<typeof createMockEditor>;
    let mockMonaco: ReturnType<typeof createMockMonaco>;
    let updateTab: ReturnType<typeof vi.fn>;
    let tab: FileTab;

    beforeEach(() =>
    {
        mockModel = createMockModel('hello world\nfoo bar\nbaz');
        mockEditor = createMockEditor(mockModel);
        mockMonaco = createMockMonaco();
        updateTab = vi.fn();
        tab = createMockTab();
    });

    afterEach(() =>
    {
        vi.clearAllMocks();
    });

    // ── Event listener registration ─────────────────────────────

    it('registers and removes event listeners on mount/unmount', () =>
    {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));

        const expectedEvents = [
            'notemac-find',
            'notemac-replace',
            'notemac-mark',
            'notemac-clear-marks',
            'notemac-goto-line',
            'notemac-column-edit',
        ];

        for (const evt of expectedEvents)
        {
            expect(addSpy).toHaveBeenCalledWith(evt, expect.any(Function));
        }

        unmount();

        for (const evt of expectedEvents)
        {
            expect(removeSpy).toHaveBeenCalledWith(evt, expect.any(Function));
        }

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    // ── Find ────────────────────────────────────────────────────

    describe('notemac-find', () =>
    {
        it('does nothing when editor is null', () =>
        {
            renderHook(() => useEditorEvents(null, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: 'hello', direction: 'next' }));
            expect(mockEditor.setSelection).not.toHaveBeenCalled();
        });

        it('does nothing when query is empty', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: '', direction: 'next' }));
            expect(mockEditor.setSelection).not.toHaveBeenCalled();
        });

        it('finds next occurrence and sets selection', () =>
        {
            mockModel.getValue.mockReturnValue('hello world hello');
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: 'hello', direction: 'next', isCaseSensitive: false, isWholeWord: false, isRegex: false }));

            expect(mockEditor.setSelection).toHaveBeenCalled();
            expect(mockEditor.revealLineInCenter).toHaveBeenCalled();
        });

        it('does nothing when model is null', () =>
        {
            mockEditor.getModel.mockReturnValue(null);
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: 'hello', direction: 'next' }));
            expect(mockEditor.setSelection).not.toHaveBeenCalled();
        });

        it('handles no matches gracefully', () =>
        {
            mockModel.getValue.mockReturnValue('hello world');
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: 'zzz_no_match', direction: 'next', isCaseSensitive: false, isWholeWord: false, isRegex: false }));
            expect(mockEditor.setSelection).not.toHaveBeenCalled();
        });

        it('handles invalid regex gracefully', () =>
        {
            mockModel.getValue.mockReturnValue('hello world');
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-find', { query: '[invalid', direction: 'next', isCaseSensitive: false, isWholeWord: false, isRegex: true }));
            expect(mockEditor.setSelection).not.toHaveBeenCalled();
        });
    });

    // ── Replace ─────────────────────────────────────────────────

    describe('notemac-replace', () =>
    {
        it('does nothing when editor is null', () =>
        {
            renderHook(() => useEditorEvents(null, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-replace', { find: 'hello', replace: 'bye', all: true }));
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });

        it('does nothing when query is empty', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-replace', { find: '', replace: 'bye', all: true }));
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });

        it('replaces all occurrences when all is true', () =>
        {
            mockModel.getValue.mockReturnValue('hello world hello');
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-replace', {
                find: 'hello',
                replace: 'bye',
                all: true,
                isCaseSensitive: false,
                isWholeWord: false,
                isRegex: false,
            }));

            expect(mockEditor.executeEdits).toHaveBeenCalledWith('replace-all', expect.any(Array));
        });

        it('handles invalid regex in replace gracefully', () =>
        {
            mockModel.getValue.mockReturnValue('hello world');
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-replace', {
                find: '[invalid',
                replace: 'bye',
                all: true,
                isCaseSensitive: false,
                isWholeWord: false,
                isRegex: true,
            }));
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });
    });

    // ── Mark ────────────────────────────────────────────────────

    describe('notemac-mark', () =>
    {
        it('adds marks for matching text', () =>
        {
            mockModel.getValue.mockReturnValue('hello world hello');
            mockModel.getPositionAt.mockImplementation((offset: number) => ({ lineNumber: 1, column: offset + 1 }));
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-mark', {
                query: 'hello',
                isCaseSensitive: false,
                isWholeWord: false,
                isRegex: false,
                style: 1,
            }));

            expect(updateTab).toHaveBeenCalledWith('tab-1', expect.objectContaining({
                marks: expect.any(Array),
            }));
        });

        it('does nothing when query is empty', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-mark', { query: '', style: 1 }));
            expect(updateTab).not.toHaveBeenCalled();
        });

        it('does nothing when editor is null', () =>
        {
            renderHook(() => useEditorEvents(null, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-mark', { query: 'hello', style: 1 }));
            expect(updateTab).not.toHaveBeenCalled();
        });
    });

    // ── Clear marks ─────────────────────────────────────────────

    describe('notemac-clear-marks', () =>
    {
        it('clears all marks via updateTab', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-clear-marks', {}));

            expect(updateTab).toHaveBeenCalledWith('tab-1', { marks: [] });
        });
    });

    // ── Go to line ──────────────────────────────────────────────

    describe('notemac-goto-line', () =>
    {
        it('sets position and reveals line', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-goto-line', { line: 42 }));

            expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 42, column: 1 });
            expect(mockEditor.revealLineInCenter).toHaveBeenCalledWith(42);
            expect(mockEditor.focus).toHaveBeenCalled();
        });

        it('does nothing when line is falsy', () =>
        {
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-goto-line', { line: 0 }));
            expect(mockEditor.setPosition).not.toHaveBeenCalled();
        });

        it('does nothing when editor is null', () =>
        {
            renderHook(() => useEditorEvents(null, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-goto-line', { line: 42 }));
            expect(mockEditor.setPosition).not.toHaveBeenCalled();
        });
    });

    // ── Column edit ─────────────────────────────────────────────

    describe('notemac-column-edit', () =>
    {
        it('inserts text at specified column for each line in range', () =>
        {
            mockModel.getLineCount.mockReturnValue(5);
            mockModel.getLineMaxColumn.mockReturnValue(10);

            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-column-edit', {
                text: '// ',
                startLine: 1,
                endLine: 3,
                column: 1,
            }));

            expect(mockEditor.executeEdits).toHaveBeenCalledWith('column-edit', expect.any(Array));
            const edits = mockEditor.executeEdits.mock.calls[0][1];
            expect(edits).toHaveLength(3);
        });

        it('does nothing when editor is null', () =>
        {
            renderHook(() => useEditorEvents(null, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-column-edit', { text: 'X', startLine: 1, endLine: 3, column: 1 }));
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });

        it('does nothing when model is null', () =>
        {
            mockEditor.getModel.mockReturnValue(null);
            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-column-edit', { text: 'X', startLine: 1, endLine: 3, column: 1 }));
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });

        it('clamps endLine to model line count', () =>
        {
            mockModel.getLineCount.mockReturnValue(3);
            mockModel.getLineMaxColumn.mockReturnValue(5);

            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-column-edit', {
                text: 'X',
                startLine: 1,
                endLine: 100,
                column: 1,
            }));

            const edits = mockEditor.executeEdits.mock.calls[0][1];
            expect(edits).toHaveLength(3);
        });

        it('uses defaults for missing startLine and column', () =>
        {
            mockModel.getLineCount.mockReturnValue(2);
            mockModel.getLineMaxColumn.mockReturnValue(5);

            renderHook(() => useEditorEvents(mockEditor, mockMonaco, tab, updateTab));
            act(() => fireCustomEvent('notemac-column-edit', {
                text: 'X',
                endLine: 2,
            }));

            const edits = mockEditor.executeEdits.mock.calls[0][1];
            expect(edits).toHaveLength(2);
        });
    });
});
