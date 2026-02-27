import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMacroPlayback } from '../Notemac/UI/EditorPanel/useMacroPlayback';
import { useNotemacStore } from '../Notemac/Model/Store';

// ─── Mock Store ─────────────────────────────────────────────────

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// ─── Helpers ────────────────────────────────────────────────────

function createMockEditor()
{
    return {
        trigger: vi.fn(),
        getModel: vi.fn(),
        getPosition: vi.fn(),
        getSelection: vi.fn(),
        executeEdits: vi.fn(),
        focus: vi.fn(),
    } as any;
}

function setMacroState(actions: Array<{ type: string; data: string }>, saveMacro = vi.fn())
{
    (useNotemacStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        currentMacroActions: actions,
        saveMacro,
    });
}

// ─── Tests ──────────────────────────────────────────────────────

describe('useMacroPlayback', () =>
{
    let mockEditor: ReturnType<typeof createMockEditor>;
    let originalPrompt: typeof window.prompt;

    beforeEach(() =>
    {
        mockEditor = createMockEditor();
        originalPrompt = window.prompt;
        vi.clearAllMocks();
    });

    afterEach(() =>
    {
        window.prompt = originalPrompt;
    });

    // ── Null editor guard ───────────────────────────────────────

    it('does nothing when editor is null', () =>
    {
        setMacroState([{ type: 'type', data: 'hello' }]);
        const { result } = renderHook(() => useMacroPlayback(null));
        act(() => result.current('macro-playback'));
        expect(mockEditor.trigger).not.toHaveBeenCalled();
    });

    // ── macro-playback ──────────────────────────────────────────

    describe('macro-playback', () =>
    {
        it('executes type actions via editor.trigger', () =>
        {
            setMacroState([
                { type: 'type', data: 'hello' },
                { type: 'type', data: ' world' },
            ]);
            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-playback'));

            expect(mockEditor.trigger).toHaveBeenCalledTimes(2);
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: 'hello' });
            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: ' world' });
        });

        it('executes command actions via editor.trigger', () =>
        {
            setMacroState([
                { type: 'command', data: 'editor.action.deleteLines' },
            ]);
            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-playback'));

            expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'editor.action.deleteLines', null);
        });

        it('executes mixed type and command actions in order', () =>
        {
            setMacroState([
                { type: 'type', data: 'A' },
                { type: 'command', data: 'editor.action.moveLinesDownAction' },
                { type: 'type', data: 'B' },
            ]);
            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-playback'));

            expect(mockEditor.trigger).toHaveBeenCalledTimes(3);
            expect(mockEditor.trigger).toHaveBeenNthCalledWith(1, 'keyboard', 'type', { text: 'A' });
            expect(mockEditor.trigger).toHaveBeenNthCalledWith(2, 'keyboard', 'editor.action.moveLinesDownAction', null);
            expect(mockEditor.trigger).toHaveBeenNthCalledWith(3, 'keyboard', 'type', { text: 'B' });
        });

        it('does nothing when actions array is empty', () =>
        {
            setMacroState([]);
            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-playback'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });

        it('ignores unknown action types', () =>
        {
            setMacroState([
                { type: 'unknown', data: 'foo' },
            ]);
            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-playback'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });
    });

    // ── macro-run-multiple ──────────────────────────────────────

    describe('macro-run-multiple', () =>
    {
        it('runs macro N times when prompt returns a number', () =>
        {
            window.prompt = vi.fn().mockReturnValue('3');
            setMacroState([{ type: 'type', data: 'X' }]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).toHaveBeenCalledTimes(3);
        });

        it('does nothing when prompt is cancelled', () =>
        {
            window.prompt = vi.fn().mockReturnValue(null);
            setMacroState([{ type: 'type', data: 'X' }]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });

        it('does nothing when prompt returns non-numeric string', () =>
        {
            window.prompt = vi.fn().mockReturnValue('abc');
            setMacroState([{ type: 'type', data: 'X' }]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });

        it('does nothing when prompt returns zero', () =>
        {
            window.prompt = vi.fn().mockReturnValue('0');
            setMacroState([{ type: 'type', data: 'X' }]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });

        it('does nothing when prompt returns negative number', () =>
        {
            window.prompt = vi.fn().mockReturnValue('-5');
            setMacroState([{ type: 'type', data: 'X' }]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });

        it('does nothing when macro actions are empty', () =>
        {
            window.prompt = vi.fn().mockReturnValue('5');
            setMacroState([]);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-run-multiple'));

            expect(mockEditor.trigger).not.toHaveBeenCalled();
        });
    });

    // ── macro-save ──────────────────────────────────────────────

    describe('macro-save', () =>
    {
        it('calls saveMacro with the prompted name', () =>
        {
            const saveMacro = vi.fn();
            window.prompt = vi.fn().mockReturnValue('My Test Macro');
            setMacroState([{ type: 'type', data: 'X' }], saveMacro);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-save'));

            expect(saveMacro).toHaveBeenCalledWith('My Test Macro');
        });

        it('does not save when prompt is cancelled', () =>
        {
            const saveMacro = vi.fn();
            window.prompt = vi.fn().mockReturnValue(null);
            setMacroState([{ type: 'type', data: 'X' }], saveMacro);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-save'));

            expect(saveMacro).not.toHaveBeenCalled();
        });

        it('does not save when prompt returns empty string', () =>
        {
            const saveMacro = vi.fn();
            window.prompt = vi.fn().mockReturnValue('');
            setMacroState([{ type: 'type', data: 'X' }], saveMacro);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-save'));

            expect(saveMacro).not.toHaveBeenCalled();
        });

        it('does nothing when macro actions are empty', () =>
        {
            const saveMacro = vi.fn();
            window.prompt = vi.fn().mockReturnValue('My Macro');
            setMacroState([], saveMacro);

            const { result } = renderHook(() => useMacroPlayback(mockEditor));
            act(() => result.current('macro-save'));

            expect(saveMacro).not.toHaveBeenCalled();
        });
    });

    // ── Unknown action ──────────────────────────────────────────

    it('does nothing for unknown action string', () =>
    {
        setMacroState([{ type: 'type', data: 'X' }]);
        const { result } = renderHook(() => useMacroPlayback(mockEditor));
        act(() => result.current('unknown-action'));

        expect(mockEditor.trigger).not.toHaveBeenCalled();
    });
});
