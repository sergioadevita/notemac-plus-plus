import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { LoadCustomShortcuts, SaveCustomShortcuts } from '../Configs/ShortcutConfig';

export interface NotemacShortcutSlice
{
    customShortcutOverrides: Record<string, string>;
    shortcutConflictWarning: string | null;
    UpdateShortcut: (action: string, newShortcut: string) => void;
    ResetShortcut: (action: string) => void;
    ResetAllShortcuts: () => void;
    LoadShortcutsFromStorage: () => void;
    SetShortcutConflictWarning: (msg: string | null) => void;
    ExportShortcutsAsJSON: () => string;
    ImportShortcutsFromJSON: (json: string) => boolean;
}

export const createShortcutSlice: StateCreator<NotemacShortcutSlice, [], [], NotemacShortcutSlice> = (set, get) =>
(
    {
        customShortcutOverrides: {},
        shortcutConflictWarning: null,

        UpdateShortcut: (action: string, newShortcut: string) =>
        {
            set(
                produce((state: NotemacShortcutSlice) =>
                {
                    state.customShortcutOverrides[action] = newShortcut;
                })
            );
            SaveCustomShortcuts(get().customShortcutOverrides);
        },

        ResetShortcut: (action: string) =>
        {
            set(
                produce((state: NotemacShortcutSlice) =>
                {
                    delete state.customShortcutOverrides[action];
                })
            );
            SaveCustomShortcuts(get().customShortcutOverrides);
        },

        ResetAllShortcuts: () =>
        {
            set(
                produce((state: NotemacShortcutSlice) =>
                {
                    state.customShortcutOverrides = {};
                })
            );
            SaveCustomShortcuts({});
        },

        LoadShortcutsFromStorage: () =>
        {
            const loaded = LoadCustomShortcuts();
            set(
                produce((state: NotemacShortcutSlice) =>
                {
                    state.customShortcutOverrides = loaded;
                })
            );
        },

        SetShortcutConflictWarning: (msg: string | null) =>
        {
            set(
                produce((state: NotemacShortcutSlice) =>
                {
                    state.shortcutConflictWarning = msg;
                })
            );
        },

        ExportShortcutsAsJSON: () =>
        {
            return JSON.stringify(get().customShortcutOverrides, null, 2);
        },

        ImportShortcutsFromJSON: (json: string) =>
        {
            try
            {
                const parsed = JSON.parse(json);
                if (typeof parsed !== 'object' || null === parsed || Array.isArray(parsed))
                {
                    return false;
                }
                for (const key in parsed)
                {
                    if (typeof parsed[key] !== 'string')
                    {
                        return false;
                    }
                }
                set(
                    produce((state: NotemacShortcutSlice) =>
                    {
                        state.customShortcutOverrides = parsed as Record<string, string>;
                    })
                );
                SaveCustomShortcuts(parsed as Record<string, string>);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
);
