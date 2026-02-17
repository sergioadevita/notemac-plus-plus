import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

function resetStore(): void
{
    useNotemacStore.setState({
        isRecordingMacro: false,
        currentMacroActions: [],
        savedMacros: [],
    });
}

describe('MacroModel — recording', () =>
{
    beforeEach(() => resetStore());

    it('starts recording', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        const state = useNotemacStore.getState();

        expect(state.isRecordingMacro).toBe(true);
        expect(0 === state.currentMacroActions.length).toBe(true);
    });

    it('stops recording', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.stopRecordingMacro();
        const state = useNotemacStore.getState();

        expect(state.isRecordingMacro).toBe(false);
    });

    it('clears actions on start recording', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'a', timestamp: 1 });
        store.stopRecordingMacro();

        store.startRecordingMacro();
        const state = useNotemacStore.getState();
        expect(0 === state.currentMacroActions.length).toBe(true);
    });
});

describe('MacroModel — addMacroAction', () =>
{
    beforeEach(() => resetStore());

    it('adds action while recording', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'hello', timestamp: 100 });
        store.addMacroAction({ type: 'delete', data: null, timestamp: 200 });

        const state = useNotemacStore.getState();
        expect(2 === state.currentMacroActions.length).toBe(true);
        expect(state.currentMacroActions[0].type).toBe('type');
        expect(state.currentMacroActions[1].type).toBe('delete');
    });

    it('ignores action when not recording', () =>
    {
        const store = useNotemacStore.getState();
        store.addMacroAction({ type: 'type', data: 'hello', timestamp: 100 });

        const state = useNotemacStore.getState();
        expect(0 === state.currentMacroActions.length).toBe(true);
    });

    it('records different action types', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'x', timestamp: 1 });
        store.addMacroAction({ type: 'move', data: { line: 5 }, timestamp: 2 });
        store.addMacroAction({ type: 'select', data: { start: 0, end: 10 }, timestamp: 3 });
        store.addMacroAction({ type: 'command', data: 'copy', timestamp: 4 });

        const state = useNotemacStore.getState();
        expect(4 === state.currentMacroActions.length).toBe(true);
    });
});

describe('MacroModel — saveMacro', () =>
{
    beforeEach(() => resetStore());

    it('saves a recorded macro', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'hello', timestamp: 100 });
        store.addMacroAction({ type: 'command', data: 'enter', timestamp: 200 });
        store.stopRecordingMacro();

        store.saveMacro('My Macro');
        const state = useNotemacStore.getState();

        expect(1 === state.savedMacros.length).toBe(true);
        expect(state.savedMacros[0].name).toBe('My Macro');
        expect(2 === state.savedMacros[0].actions.length).toBe(true);
    });

    it('does not save empty macro', () =>
    {
        const store = useNotemacStore.getState();
        store.saveMacro('Empty');
        const state = useNotemacStore.getState();

        expect(0 === state.savedMacros.length).toBe(true);
    });

    it('saves multiple macros', () =>
    {
        const store = useNotemacStore.getState();

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'a', timestamp: 1 });
        store.stopRecordingMacro();
        store.saveMacro('Macro 1');

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', data: 'b', timestamp: 2 });
        store.stopRecordingMacro();
        store.saveMacro('Macro 2');

        const state = useNotemacStore.getState();
        expect(2 === state.savedMacros.length).toBe(true);
    });
});
