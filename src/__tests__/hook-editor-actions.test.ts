import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorActions, registerActionHandler, unregisterActionHandler } from '../Notemac/UI/EditorPanel/useEditorActions';
import type { FileTab, AppSettings } from '../Notemac/Commons/Types';

// ─── Mocks ──────────────────────────────────────────────────────

vi.mock('../Notemac/Controllers/AIActionController', () => ({
    ExplainCode: vi.fn(),
    RefactorCode: vi.fn(),
    GenerateTests: vi.fn(),
    GenerateDocumentation: vi.fn(),
    SimplifyCode: vi.fn(),
}));

vi.mock('../Shared/Helpers/EditorGlobals', () => ({
    SetEditorAction: vi.fn(),
    ClearEditorAction: vi.fn(),
}));

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
    } as any;
}

function createMockModel(content = 'line one\nline two\nline three')
{
    const lines = content.split('\n');
    return {
        getValue: vi.fn().mockReturnValue(content),
        getLineCount: vi.fn().mockReturnValue(lines.length),
        getLineContent: vi.fn((n: number) => lines[n - 1] || ''),
        getLineMaxColumn: vi.fn((n: number) => (lines[n - 1] || '').length + 1),
        getFullModelRange: vi.fn().mockReturnValue({
            startLineNumber: 1, startColumn: 1,
            endLineNumber: lines.length, endColumn: (lines[lines.length - 1] || '').length + 1,
        }),
        getValueInRange: vi.fn().mockImplementation((_range: any) => 'selected text'),
        getLanguageId: vi.fn().mockReturnValue('javascript'),
    };
}

function createMockEditor(model: ReturnType<typeof createMockModel>)
{
    const actionRun = vi.fn();
    return {
        getModel: vi.fn().mockReturnValue(model),
        getPosition: vi.fn().mockReturnValue({ lineNumber: 2, column: 1 }),
        getSelection: vi.fn().mockReturnValue({
            isEmpty: () => false,
            startLineNumber: 1, startColumn: 1,
            endLineNumber: 1, endColumn: 14,
        }),
        setSelection: vi.fn(),
        setPosition: vi.fn(),
        revealLineInCenter: vi.fn(),
        executeEdits: vi.fn(),
        focus: vi.fn(),
        trigger: vi.fn(),
        getAction: vi.fn().mockReturnValue({ run: actionRun }),
        _actionRun: actionRun,
    } as any;
}

function createMockTab(overrides: Partial<FileTab> = {}): FileTab
{
    return {
        id: 'tab-1',
        name: 'test.js',
        path: '/home/user/test.js',
        content: 'line one\nline two\nline three',
        isModified: false,
        bookmarks: [],
        marks: [],
        cursorLine: 1,
        cursorColumn: 1,
        scrollTop: 0,
        language: 'javascript',
        encoding: 'utf-8',
        lineEnding: 'lf',
        isReadOnly: false,
        ...overrides,
    } as FileTab;
}

const defaultSettings: AppSettings = {
    tabSize: 4,
    wordWrap: false,
    showWhitespace: false,
    autoSave: false,
    fontSize: 14,
    fontFamily: 'monospace',
    theme: 'dark',
} as AppSettings;

function setupHook(tabOverrides: Partial<FileTab> = {}, content = 'line one\nline two\nline three')
{
    const mockMonaco = createMockMonaco();
    const mockModel = createMockModel(content);
    const mockEditor = createMockEditor(mockModel);
    const tab = createMockTab(tabOverrides);
    const updateTab = vi.fn();
    const updateTabContent = vi.fn();
    const macroHandler = vi.fn();

    const { result } = renderHook(() =>
        useEditorActions(mockEditor, mockMonaco, tab, defaultSettings, updateTab, updateTabContent, true, macroHandler)
    );

    return { result, mockEditor, mockModel, mockMonaco, tab, updateTab, macroHandler };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('useEditorActions', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                readText: vi.fn().mockResolvedValue('clipboard text'),
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    // ── Null editor guard ───────────────────────────────────────

    it('does nothing when editor is null', () =>
    {
        const mockMonaco = createMockMonaco();
        const tab = createMockTab();
        const updateTab = vi.fn();
        const { result } = renderHook(() =>
            useEditorActions(null, mockMonaco, tab, defaultSettings, updateTab, vi.fn(), true, vi.fn())
        );
        result.current('cut');
        expect(updateTab).not.toHaveBeenCalled();
    });

    it('does nothing when model is null', () =>
    {
        const mockMonaco = createMockMonaco();
        const mockModel = createMockModel();
        const mockEditor = createMockEditor(mockModel);
        mockEditor.getModel.mockReturnValue(null);
        const tab = createMockTab();
        const updateTab = vi.fn();
        const { result } = renderHook(() =>
            useEditorActions(mockEditor, mockMonaco, tab, defaultSettings, updateTab, vi.fn(), true, vi.fn())
        );
        result.current('cut');
        expect(mockEditor.trigger).not.toHaveBeenCalled();
    });

    // ── Clipboard operations ────────────────────────────────────

    describe('clipboard', () =>
    {
        it('cut triggers editor.action.clipboardCutAction', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('cut');
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'editor.action.clipboardCutAction', null);
        });

        it('copy triggers editor.action.clipboardCopyAction', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('copy');
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'editor.action.clipboardCopyAction', null);
        });
    });

    // ── Undo / Redo ─────────────────────────────────────────────

    describe('undo/redo', () =>
    {
        it('undo triggers undo', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('undo');
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'undo', null);
        });

        it('redo triggers redo', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('redo');
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'redo', null);
        });
    });

    // ── Line operations ─────────────────────────────────────────

    describe('line operations', () =>
    {
        it('select-all sets selection to full model range', () =>
        {
            const { result, mockEditor, mockModel } = setupHook();
            result.current('select-all');
            expect(mockEditor.setSelection).toHaveBeenCalledWith(mockModel.getFullModelRange());
        });

        it('duplicate-line runs copyLinesDownAction', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('duplicate-line');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.copyLinesDownAction');
        });

        it('delete-line runs deleteLines', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('delete-line');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.deleteLines');
        });

        it('move-line-up runs moveLinesUpAction', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('move-line-up');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.moveLinesUpAction');
        });

        it('move-line-down runs moveLinesDownAction', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('move-line-down');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.moveLinesDownAction');
        });

        it('toggle-comment runs commentLine', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('toggle-comment');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.commentLine');
        });

        it('block-comment runs blockComment', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('block-comment');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.blockComment');
        });

        it('transpose-line swaps current and previous line', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('transpose-line');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('transpose', expect.any(Array));
        });

        it('transpose-line does nothing on first line', () =>
        {
            const { result, mockEditor } = setupHook();
            mockEditor.getPosition.mockReturnValue({ lineNumber: 1, column: 1 });
            result.current('transpose-line');
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });
    });

    // ── Text transformations ────────────────────────────────────

    describe('text transformations', () =>
    {
        it('split-lines splits selection characters into separate lines', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('split-lines');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('split', expect.any(Array));
        });

        it('join-lines joins selection into single line', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('join-lines');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('join', expect.any(Array));
        });

        it('uppercase transforms selection to uppercase', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('uppercase');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('uppercase', expect.any(Array));
        });

        it('lowercase transforms selection to lowercase', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('lowercase');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('lowercase', expect.any(Array));
        });

        it('proper-case capitalizes first letter of each word', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('proper-case');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('proper', expect.any(Array));
        });

        it('sentence-case capitalizes first letter of sentences', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('sentence-case');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('sentence', expect.any(Array));
        });

        it('invert-case inverts the case of each character', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('invert-case');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('invert', expect.any(Array));
        });

        it('random-case randomly changes case', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('random-case');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('random', expect.any(Array));
        });

        it('insert-datetime inserts ISO datetime at cursor', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('insert-datetime');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('datetime', expect.any(Array));
        });
    });

    // ── Sort operations ─────────────────────────────────────────

    describe('sort operations', () =>
    {
        const sortActions = ['sort-asc', 'sort-desc', 'sort-asc-ci', 'sort-desc-ci', 'sort-len-asc', 'sort-len-desc'];
        for (const action of sortActions)
        {
            it(`${action} sorts content and applies via executeEdits`, () =>
            {
                const { result, mockEditor } = setupHook();
                result.current(action);
                expect(mockEditor.executeEdits).toHaveBeenCalledWith('sort', expect.any(Array));
            });
        }
    });

    // ── Dedup & removal operations ──────────────────────────────

    describe('deduplication & removal', () =>
    {
        it('remove-duplicates removes duplicate lines', () =>
        {
            const { result, mockEditor } = setupHook({}, 'a\nb\na\nc');
            result.current('remove-duplicates');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('remove-dup', expect.any(Array));
        });

        it('remove-consecutive-duplicates removes consecutive duplicates only', () =>
        {
            const { result, mockEditor } = setupHook({}, 'a\na\nb\nb\na');
            result.current('remove-consecutive-duplicates');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('remove-consec-dup', expect.any(Array));
        });

        it('remove-empty-lines removes lines that are whitespace-only', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('remove-empty-lines');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('remove-empty', expect.any(Array));
        });

        it('remove-blank-lines removes completely blank lines', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('remove-blank-lines');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('remove-blank', expect.any(Array));
        });
    });

    // ── Trim operations ─────────────────────────────────────────

    describe('trim operations', () =>
    {
        it('trim-trailing trims end of each line', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('trim-trailing');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('trim', expect.any(Array));
        });

        it('trim-leading trims start of each line', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('trim-leading');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('trim-lead', expect.any(Array));
        });

        it('trim-both trims both ends of each line', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('trim-both');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('trim-both', expect.any(Array));
        });
    });

    // ── Whitespace conversion ───────────────────────────────────

    describe('whitespace conversion', () =>
    {
        it('eol-to-space replaces newlines with spaces', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('eol-to-space');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('eol-space', expect.any(Array));
        });

        it('tab-to-space replaces tabs with spaces using tabSize setting', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('tab-to-space');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('tab-space', expect.any(Array));
        });

        it('space-to-tab-leading converts leading spaces to tabs', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('space-to-tab-leading');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('space-tab', expect.any(Array));
        });

        it('space-to-tab-all converts all space groups to tabs', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('space-to-tab-all');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('space-tab-all', expect.any(Array));
        });
    });

    // ── Insert blank lines ──────────────────────────────────────

    describe('insert blank lines', () =>
    {
        it('insert-blank-above inserts blank line above cursor', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('insert-blank-above');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('blank-above', expect.any(Array));
        });

        it('insert-blank-below inserts blank line below cursor', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('insert-blank-below');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('blank-below', expect.any(Array));
        });
    });

    // ── Reverse lines ───────────────────────────────────────────

    it('reverse-lines reverses line order', () =>
    {
        const { result, mockEditor } = setupHook();
        result.current('reverse-lines');
        expect(mockEditor.executeEdits).toHaveBeenCalledWith('reverse', expect.any(Array));
    });

    // ── Folding ─────────────────────────────────────────────────

    describe('folding', () =>
    {
        it('fold-all runs editor.foldAll', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('fold-all');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.foldAll');
        });

        it('unfold-all runs editor.unfoldAll', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('unfold-all');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.unfoldAll');
        });

        it('fold-level runs foldLevel with specified level', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('fold-level', 3);
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.foldLevel3');
        });
    });

    // ── Bracket navigation ──────────────────────────────────────

    describe('bracket navigation', () =>
    {
        it('select-to-bracket runs selectToBracket', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('select-to-bracket');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.selectToBracket');
        });

        it('goto-bracket runs jumpToBracket', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('goto-bracket');
            expect(mockEditor.getAction).toHaveBeenCalledWith('editor.action.jumpToBracket');
        });
    });

    // ── Bookmarks ───────────────────────────────────────────────

    describe('bookmarks', () =>
    {
        it('toggle-bookmark adds bookmark when not present', () =>
        {
            const { result, updateTab } = setupHook({ bookmarks: [] });
            result.current('toggle-bookmark');
            expect(updateTab).toHaveBeenCalledWith('tab-1', { bookmarks: [2] });
        });

        it('toggle-bookmark removes bookmark when present', () =>
        {
            const { result, updateTab } = setupHook({ bookmarks: [2, 5] });
            result.current('toggle-bookmark');
            expect(updateTab).toHaveBeenCalledWith('tab-1', { bookmarks: [5] });
        });

        it('toggle-bookmark keeps bookmarks sorted', () =>
        {
            const { result, updateTab } = setupHook({ bookmarks: [5, 10] });
            result.current('toggle-bookmark');
            expect(updateTab).toHaveBeenCalledWith('tab-1', { bookmarks: expect.arrayContaining([2, 5, 10]) });
        });

        it('next-bookmark navigates to next bookmark after cursor', () =>
        {
            const { result, mockEditor } = setupHook({ bookmarks: [1, 5, 10] });
            result.current('next-bookmark');
            expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 5, column: 1 });
        });

        it('next-bookmark wraps to first bookmark', () =>
        {
            const { result, mockEditor } = setupHook({ bookmarks: [1] });
            mockEditor.getPosition.mockReturnValue({ lineNumber: 5, column: 1 });
            result.current('next-bookmark');
            expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 1, column: 1 });
        });

        it('prev-bookmark navigates to previous bookmark', () =>
        {
            const { result, mockEditor } = setupHook({ bookmarks: [1, 5, 10] });
            mockEditor.getPosition.mockReturnValue({ lineNumber: 7, column: 1 });
            result.current('prev-bookmark');
            expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 5, column: 1 });
        });

        it('clear-bookmarks clears all bookmarks', () =>
        {
            const { result, updateTab } = setupHook({ bookmarks: [1, 5, 10] });
            result.current('clear-bookmarks');
            expect(updateTab).toHaveBeenCalledWith('tab-1', { bookmarks: [] });
        });
    });

    // ── Marks ───────────────────────────────────────────────────

    describe('marks', () =>
    {
        it('mark-style adds mark for selection', () =>
        {
            const { result, updateTab } = setupHook({ marks: [] });
            result.current('mark-style', 2);
            expect(updateTab).toHaveBeenCalledWith('tab-1', expect.objectContaining({
                marks: expect.arrayContaining([expect.objectContaining({ style: 2 })]),
            }));
        });

        it('clear-marks clears all marks', () =>
        {
            const { result, updateTab } = setupHook({ marks: [{ line: 1, column: 1, length: 5, style: 1 as const }] });
            result.current('clear-marks');
            expect(updateTab).toHaveBeenCalledWith('tab-1', { marks: [] });
        });
    });

    // ── Macro delegation ────────────────────────────────────────

    describe('macro delegation', () =>
    {
        it('macro-playback delegates to macro handler', () =>
        {
            const { result, macroHandler } = setupHook();
            result.current('macro-playback');
            expect(macroHandler).toHaveBeenCalledWith('macro-playback', undefined);
        });

        it('macro-run-multiple delegates to macro handler', () =>
        {
            const { result, macroHandler } = setupHook();
            result.current('macro-run-multiple');
            expect(macroHandler).toHaveBeenCalledWith('macro-run-multiple', undefined);
        });

        it('macro-save delegates to macro handler', () =>
        {
            const { result, macroHandler } = setupHook();
            result.current('macro-save');
            expect(macroHandler).toHaveBeenCalledWith('macro-save', undefined);
        });
    });

    // ── JSON operations ─────────────────────────────────────────

    describe('JSON operations', () =>
    {
        it('json-format formats valid JSON', () =>
        {
            const { result, mockEditor, mockModel } = setupHook({}, '{"a":1}');
            mockModel.getValue.mockReturnValue('{"a":1}');
            result.current('json-format');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('json-fmt', expect.any(Array));
        });

        it('json-format does nothing for invalid JSON', () =>
        {
            const { result, mockEditor, mockModel } = setupHook({}, 'not json');
            mockModel.getValue.mockReturnValue('not json');
            result.current('json-format');
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });

        it('json-minify minifies valid JSON', () =>
        {
            const { result, mockEditor, mockModel } = setupHook({}, '{"a": 1}');
            mockModel.getValue.mockReturnValue('{"a": 1}');
            result.current('json-minify');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('json-min', expect.any(Array));
        });

        it('json-minify does nothing for invalid JSON', () =>
        {
            const { result, mockEditor, mockModel } = setupHook({}, '{bad}');
            mockModel.getValue.mockReturnValue('{bad}');
            result.current('json-minify');
            expect(mockEditor.executeEdits).not.toHaveBeenCalled();
        });
    });

    // ── Encoding operations ─────────────────────────────────────

    describe('encoding operations', () =>
    {
        it('base64-encode encodes selection to base64', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('base64-encode');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('b64enc', expect.any(Array));
        });

        it('base64-decode decodes base64 selection', () =>
        {
            const { result, mockEditor, mockModel } = setupHook();
            mockModel.getValueInRange.mockReturnValue('aGVsbG8=');
            result.current('base64-decode');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('b64dec', expect.any(Array));
        });

        it('url-encode encodes selection', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('url-encode');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('urlenc', expect.any(Array));
        });

        it('url-decode decodes selection', () =>
        {
            const { result, mockEditor } = setupHook();
            result.current('url-decode');
            expect(mockEditor.executeEdits).toHaveBeenCalledWith('urldec', expect.any(Array));
        });
    });

    // ── Copy path operations ────────────────────────────────────

    describe('copy path operations', () =>
    {
        it('copy-file-path writes tab path to clipboard', () =>
        {
            const { result } = setupHook({ path: '/home/user/test.js' });
            result.current('copy-file-path');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/home/user/test.js');
        });

        it('copy-file-name writes tab name to clipboard', () =>
        {
            const { result } = setupHook({ name: 'test.js' });
            result.current('copy-file-name');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test.js');
        });

        it('copy-file-dir writes directory path to clipboard', () =>
        {
            const { result } = setupHook({ path: '/home/user/test.js' });
            result.current('copy-file-dir');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/home/user');
        });
    });

    // ── Toggle readonly ─────────────────────────────────────────

    it('toggle-readonly toggles read-only state', () =>
    {
        const { result, updateTab } = setupHook({ isReadOnly: false });
        result.current('toggle-readonly');
        expect(updateTab).toHaveBeenCalledWith('tab-1', { isReadOnly: true });
    });

    // ── AI actions ──────────────────────────────────────────────

    describe('AI actions', () =>
    {
        it('ai-explain calls ExplainCode with selection', async () =>
        {
            const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
            const { result } = setupHook();
            result.current('ai-explain');
            expect(ExplainCode).toHaveBeenCalledWith('selected text', 'javascript');
        });

        it('ai-refactor calls RefactorCode with selection', async () =>
        {
            const { RefactorCode } = await import('../Notemac/Controllers/AIActionController');
            const { result } = setupHook();
            result.current('ai-refactor');
            expect(RefactorCode).toHaveBeenCalledWith('selected text', 'javascript', expect.any(Function));
        });

        it('ai-generate-tests calls GenerateTests with selection', async () =>
        {
            const { GenerateTests } = await import('../Notemac/Controllers/AIActionController');
            const { result } = setupHook();
            result.current('ai-generate-tests');
            expect(GenerateTests).toHaveBeenCalledWith('selected text', 'javascript', expect.any(Function));
        });

        it('ai-generate-docs calls GenerateDocumentation with selection', async () =>
        {
            const { GenerateDocumentation } = await import('../Notemac/Controllers/AIActionController');
            const { result } = setupHook();
            result.current('ai-generate-docs');
            expect(GenerateDocumentation).toHaveBeenCalledWith('selected text', 'javascript', expect.any(Function));
        });

        it('ai-simplify calls SimplifyCode with selection', async () =>
        {
            const { SimplifyCode } = await import('../Notemac/Controllers/AIActionController');
            const { result } = setupHook();
            result.current('ai-simplify');
            expect(SimplifyCode).toHaveBeenCalledWith('selected text', 'javascript', expect.any(Function));
        });

        it('ai-explain does nothing with empty selection', async () =>
        {
            const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
            const { result, mockEditor } = setupHook();
            mockEditor.getSelection.mockReturnValue({ isEmpty: () => true });
            result.current('ai-explain');
            expect(ExplainCode).not.toHaveBeenCalled();
        });
    });
});

// ─── registerActionHandler / unregisterActionHandler ────────────

describe('registerActionHandler', () =>
{
    it('calls SetEditorAction', async () =>
    {
        const { SetEditorAction } = await import('../Shared/Helpers/EditorGlobals');
        const handler = vi.fn();
        registerActionHandler(handler);
        expect(SetEditorAction).toHaveBeenCalledWith(handler);
    });
});

describe('unregisterActionHandler', () =>
{
    it('calls ClearEditorAction', async () =>
    {
        const { ClearEditorAction } = await import('../Shared/Helpers/EditorGlobals');
        unregisterActionHandler();
        expect(ClearEditorAction).toHaveBeenCalled();
    });
});
