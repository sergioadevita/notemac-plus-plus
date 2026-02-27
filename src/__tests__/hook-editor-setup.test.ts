import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorSetup, cleanupCompletionDisposables } from '../Notemac/UI/EditorPanel/useEditorSetup';
import type { FileTab } from '../Notemac/Commons/Types';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

vi.mock('../Notemac/Configs/ThemeConfig', () => ({
    defineMonacoThemes: vi.fn(),
}));

vi.mock('../Notemac/Controllers/CompletionController', () => ({
    RegisterCompletionProviders: vi.fn().mockReturnValue([{ dispose: vi.fn() }]),
}));

vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
    SetMonacoEditor: vi.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────

const mockTheme: ThemeColors = {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgHover: '#2a2d2e',
    bgSelected: '#094771',
    border: '#474747',
    fg: '#cccccc',
    fgSecondary: '#969696',
    fgInactive: '#6e7681',
    accent: '#0078d4',
    accentHover: '#1c8cf9',
    accentFg: '#ffffff',
    scrollbar: '#424242',
    scrollbarHover: '#4f4f4f',
    findHighlight: '#623315',
    selectionBg: '#264f78',
    lineHighlight: '#2a2d2e',
    errorFg: '#f14c4c',
    warningFg: '#cca700',
    successFg: '#89d185',
    infoFg: '#3794ff',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabHoverBg: '#2a2d2e',
    sidebarBg: '#252526',
    sidebarFg: '#cccccc',
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

function createMockTab(overrides: Partial<FileTab> = {}): FileTab
{
    return {
        id: 'tab-1',
        name: 'test.txt',
        content: 'hello',
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

function createMockEditor()
{
    return {
        onDidChangeCursorPosition: vi.fn(),
        onDidScrollChange: vi.fn(),
        addCommand: vi.fn(),
        setScrollTop: vi.fn(),
        focus: vi.fn(),
        getAction: vi.fn().mockReturnValue({ run: vi.fn() }),
    } as any;
}

function createMockMonaco()
{
    return {
        editor: { setTheme: vi.fn() },
        KeyMod: { CtrlCmd: 2048, Shift: 1024, Alt: 512 },
        KeyCode: { KeyD: 32, KeyK: 41, UpArrow: 16, DownArrow: 18, Slash: 85 },
        Range: class { constructor(public a: number, public b: number, public c: number, public d: number) {} },
    } as any;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('useEditorSetup', () =>
{
    let updateTab: ReturnType<typeof vi.fn>;
    let setMonacoReady: ReturnType<typeof vi.fn>;

    beforeEach(() =>
    {
        updateTab = vi.fn();
        setMonacoReady = vi.fn();
        vi.clearAllMocks();
    });

    it('returns a mount handler function', () =>
    {
        const tab = createMockTab();
        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        expect(typeof result.current).toBe('function');
    });

    it('calls defineMonacoThemes on mount', async () =>
    {
        const { defineMonacoThemes } = await import('../Notemac/Configs/ThemeConfig');
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(defineMonacoThemes).toHaveBeenCalledWith(mockMonaco);
    });

    it('sets theme on mount', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('notemac-dark');
    });

    it('sets monacoReady to true on mount', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(setMonacoReady).toHaveBeenCalledWith(true);
    });

    it('registers cursor position tracking', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockEditor.onDidChangeCursorPosition).toHaveBeenCalledWith(expect.any(Function));

        // Simulate cursor change
        const cursorHandler = mockEditor.onDidChangeCursorPosition.mock.calls[0][0];
        cursorHandler({ position: { lineNumber: 5, column: 10 } });

        expect(updateTab).toHaveBeenCalledWith('tab-1', { cursorLine: 5, cursorColumn: 10 });
    });

    it('registers scroll position tracking', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockEditor.onDidScrollChange).toHaveBeenCalledWith(expect.any(Function));

        // Simulate scroll change
        const scrollHandler = mockEditor.onDidScrollChange.mock.calls[0][0];
        scrollHandler({ scrollTop: 250 });

        expect(updateTab).toHaveBeenCalledWith('tab-1', { scrollTop: 250 });
    });

    it('registers 5 keyboard shortcuts', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        // Ctrl+D, Ctrl+Shift+K, Alt+Up, Alt+Down, Ctrl+/
        expect(mockEditor.addCommand).toHaveBeenCalledTimes(5);
    });

    it('restores scroll position when tab.scrollTop is set', () =>
    {
        const tab = createMockTab({ scrollTop: 500 });
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockEditor.setScrollTop).toHaveBeenCalledWith(500);
    });

    it('does not restore scroll when scrollTop is 0', () =>
    {
        const tab = createMockTab({ scrollTop: 0 });
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockEditor.setScrollTop).not.toHaveBeenCalled();
    });

    it('focuses the editor on mount', () =>
    {
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('registers completion providers on mount', async () =>
    {
        const { RegisterCompletionProviders } = await import('../Notemac/Controllers/CompletionController');
        const tab = createMockTab();
        const mockEditor = createMockEditor();
        const mockMonaco = createMockMonaco();

        const { result } = renderHook(() => useEditorSetup(tab, mockTheme, updateTab, setMonacoReady));
        result.current(mockEditor, mockMonaco);

        expect(RegisterCompletionProviders).toHaveBeenCalledWith(mockMonaco, mockEditor);
    });
});

// ─── cleanupCompletionDisposables ───────────────────────────────

describe('cleanupCompletionDisposables', () =>
{
    it('does nothing when editor is null', () =>
    {
        expect(() => cleanupCompletionDisposables(null)).not.toThrow();
    });

    it('does nothing when editor has no tracked disposables', () =>
    {
        const mockEditor = { } as any;
        expect(() => cleanupCompletionDisposables(mockEditor)).not.toThrow();
    });
});
