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

describe('MacroModel — Recording Lifecycle: default state', () =>
{
    beforeEach(() => resetStore());

    it('isRecordingMacro defaults to false', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.isRecordingMacro).toBe(false);
    });
});

describe('MacroModel — Recording Lifecycle: start recording', () =>
{
    beforeEach(() => resetStore());

    it('startRecordingMacro sets isRecordingMacro to true', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        const state = useNotemacStore.getState();

        expect(state.isRecordingMacro).toBe(true);
    });
});

describe('MacroModel — Recording Lifecycle: stop recording', () =>
{
    beforeEach(() => resetStore());

    it('stopRecordingMacro sets isRecordingMacro to false', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.stopRecordingMacro();
        const state = useNotemacStore.getState();

        expect(state.isRecordingMacro).toBe(false);
    });
});

describe('MacroModel — Recording Lifecycle: start clears actions', () =>
{
    beforeEach(() => resetStore());

    it('startRecordingMacro clears previous actions from prior recording', () =>
    {
        const store = useNotemacStore.getState();

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'old' });
        store.stopRecordingMacro();

        store.startRecordingMacro();
        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(0);
    });
});

describe('MacroModel — addMacroAction: ignored when not recording', () =>
{
    beforeEach(() => resetStore());

    it('addMacroAction does nothing when isRecordingMacro is false', () =>
    {
        const store = useNotemacStore.getState();
        store.addMacroAction({ type: 'type', payload: 'test' });
        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(0);
    });
});

describe('MacroModel — addMacroAction: adds when recording', () =>
{
    beforeEach(() => resetStore());

    it('addMacroAction adds action when isRecordingMacro is true', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'hello' });
        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(1);
        expect(state.currentMacroActions[0].type).toBe('type');
        expect(state.currentMacroActions[0].payload).toBe('hello');
    });
});

describe('MacroModel — addMacroAction: multiple actions accumulate', () =>
{
    beforeEach(() => resetStore());

    it('addMacroAction accumulates multiple actions in order', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'a' });
        store.addMacroAction({ type: 'delete', payload: 1 });
        store.addMacroAction({ type: 'move', payload: { line: 5, col: 10 } });

        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(3);
        expect(state.currentMacroActions[0].type).toBe('type');
        expect(state.currentMacroActions[1].type).toBe('delete');
        expect(state.currentMacroActions[2].type).toBe('move');
        expect(state.currentMacroActions[2].payload.line).toBe(5);
    });
});

describe('MacroModel — addMacroAction: complex payload preserved', () =>
{
    beforeEach(() => resetStore());

    it('addMacroAction preserves complex object payloads unchanged', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();

        const complexPayload =
        {
            type: 'selection',
            start: { line: 1, col: 0 },
            end: { line: 5, col: 20 },
            metadata: { source: 'keyboard', timestamp: 1234567890 }
        };

        store.addMacroAction({ type: 'select', payload: complexPayload });
        const state = useNotemacStore.getState();

        expect(state.currentMacroActions[0].payload).toEqual(complexPayload);
        expect(state.currentMacroActions[0].payload.metadata.timestamp).toBe(1234567890);
    });
});

describe('MacroModel — saveMacro: saves with correct name', () =>
{
    beforeEach(() => resetStore());

    it('saveMacro creates SavedMacro with provided name', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'test' });
        store.stopRecordingMacro();

        store.saveMacro('My Test Macro');
        const state = useNotemacStore.getState();

        expect(state.savedMacros.length).toBe(1);
        expect(state.savedMacros[0].name).toBe('My Test Macro');
    });
});

describe('MacroModel — saveMacro: generates unique id', () =>
{
    beforeEach(() => resetStore());

    it('saveMacro generates unique id for each SavedMacro', () =>
    {
        const store = useNotemacStore.getState();

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'a' });
        store.stopRecordingMacro();
        store.saveMacro('Macro 1');

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'b' });
        store.stopRecordingMacro();
        store.saveMacro('Macro 2');

        const state = useNotemacStore.getState();

        expect(state.savedMacros.length).toBe(2);
        expect(state.savedMacros[0].id).toBeDefined();
        expect(state.savedMacros[1].id).toBeDefined();
        expect(state.savedMacros[0].id).not.toBe(state.savedMacros[1].id);
    });
});

describe('MacroModel — saveMacro: copies actions not reference', () =>
{
    beforeEach(() => resetStore());

    it('saveMacro creates independent copy of actions array', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'original' });
        store.stopRecordingMacro();

        store.saveMacro('Test Copy');

        const stateBefore = useNotemacStore.getState();
        const savedActionsBefore = [...stateBefore.savedMacros[0].actions];

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'new' });
        store.stopRecordingMacro();

        const stateAfter = useNotemacStore.getState();

        expect(stateAfter.savedMacros[0].actions.length).toBe(1);
        expect(savedActionsBefore.length).toBe(1);
        expect(stateAfter.savedMacros[0].actions).not.toBe(stateAfter.currentMacroActions);
    });
});

describe('MacroModel — saveMacro: does nothing when actions empty', () =>
{
    beforeEach(() => resetStore());

    it('saveMacro does not save when currentMacroActions is empty', () =>
    {
        const store = useNotemacStore.getState();
        store.saveMacro('Empty Macro');

        const state = useNotemacStore.getState();

        expect(state.savedMacros.length).toBe(0);
    });
});

describe('MacroModel — Edge Cases: start/stop/start cycle', () =>
{
    beforeEach(() => resetStore());

    it('start/stop/start cycle resets currentMacroActions', () =>
    {
        const store = useNotemacStore.getState();

        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'first' });
        store.stopRecordingMacro();

        let state = useNotemacStore.getState();
        expect(state.currentMacroActions.length).toBe(1);

        store.startRecordingMacro();
        state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(0);
    });
});

describe('MacroModel — Edge Cases: multiple saves', () =>
{
    beforeEach(() => resetStore());

    it('multiple saves create multiple independent entries', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < 5; i++)
        {
            store.startRecordingMacro();
            store.addMacroAction({ type: 'type', payload: `action${i}` });
            store.stopRecordingMacro();
            store.saveMacro(`Macro ${i}`);
        }

        const state = useNotemacStore.getState();

        expect(state.savedMacros.length).toBe(5);
        for (let i = 0; i < 5; i++)
        {
            expect(state.savedMacros[i].name).toBe(`Macro ${i}`);
            expect(state.savedMacros[i].actions[0].payload).toBe(`action${i}`);
        }
    });
});

describe('MacroModel — Edge Cases: save does not clear currentMacroActions', () =>
{
    beforeEach(() => resetStore());

    it('saveMacro does not clear currentMacroActions after saving', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'test' });
        store.stopRecordingMacro();

        store.saveMacro('Saved Macro');

        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(1);
        expect(state.currentMacroActions[0].payload).toBe('test');
    });
});

describe('MacroModel — Edge Cases: rapid action addition', () =>
{
    beforeEach(() => resetStore());

    it('handles rapid addition of 100 actions without data loss', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();

        for (let i = 0; i < 100; i++)
        {
            store.addMacroAction({ type: 'type', payload: `action${i}` });
        }

        const state = useNotemacStore.getState();

        expect(state.currentMacroActions.length).toBe(100);
        expect(state.currentMacroActions[0].payload).toBe('action0');
        expect(state.currentMacroActions[49].payload).toBe('action49');
        expect(state.currentMacroActions[99].payload).toBe('action99');
    });
});

describe('MacroModel — Edge Cases: stop does not clear actions', () =>
{
    beforeEach(() => resetStore());

    it('stopRecordingMacro does not clear currentMacroActions', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'persistent' });
        store.stopRecordingMacro();

        const state = useNotemacStore.getState();

        expect(state.isRecordingMacro).toBe(false);
        expect(state.currentMacroActions.length).toBe(1);
        expect(state.currentMacroActions[0].payload).toBe('persistent');
    });
});

describe('MacroModel — Edge Cases: saved macro independence', () =>
{
    beforeEach(() => resetStore());

    it('mutating currentMacroActions after save does not affect saved macro', () =>
    {
        const store = useNotemacStore.getState();
        store.startRecordingMacro();
        store.addMacroAction({ type: 'type', payload: 'original' });
        store.stopRecordingMacro();

        store.saveMacro('Snapshot');

        const stateAfterSave = useNotemacStore.getState();
        const savedMacroId = stateAfterSave.savedMacros[0].id;
        const savedActionPayloadBefore = stateAfterSave.savedMacros[0].actions[0].payload;

        store.startRecordingMacro();
        store.addMacroAction({ type: 'delete', payload: 'modified' });

        const stateAfterModify = useNotemacStore.getState();
        const savedMacro = stateAfterModify.savedMacros.find(m => m.id === savedMacroId);

        expect(savedMacro.actions.length).toBe(1);
        expect(savedMacro.actions[0].payload).toBe(savedActionPayloadBefore);
        expect(stateAfterModify.currentMacroActions.length).toBe(1);
    });
});
