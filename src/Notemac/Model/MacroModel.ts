import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { MacroAction, SavedMacro } from "../Commons/Types";
import { generateId } from '../../Shared/Helpers/IdHelpers';

export interface NotemacMacroSlice
{
    isRecordingMacro: boolean;
    currentMacroActions: MacroAction[];
    savedMacros: SavedMacro[];

    startRecordingMacro: () => void;
    stopRecordingMacro: () => void;
    addMacroAction: (action: MacroAction) => void;
    saveMacro: (name: string) => void;
}

export const createMacroSlice: StateCreator<NotemacMacroSlice, [], [], NotemacMacroSlice> = (set, get) => ({
    isRecordingMacro: false,
    currentMacroActions: [],
    savedMacros: [],

    startRecordingMacro: () => set({ isRecordingMacro: true, currentMacroActions: [] }),

    stopRecordingMacro: () => set({ isRecordingMacro: false }),

    addMacroAction: (action) =>
    {
        if (!get().isRecordingMacro)
            return;
        set(produce((state: NotemacMacroSlice) =>
        {
            state.currentMacroActions.push(action);
        }));
    },

    saveMacro: (name) =>
    {
        const actions = get().currentMacroActions;
        if (0 === actions.length)
            return;
        set(produce((state: NotemacMacroSlice) =>
        {
            state.savedMacros.push({ id: generateId(), name, actions: [...actions] });
        }));
    },
});
