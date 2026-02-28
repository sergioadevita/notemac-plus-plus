import { useNotemacStore } from '../Model/Store';

/**
 * StickyScrollController — Toggles Monaco's built-in sticky scroll feature.
 */

export function IsStickyScrollEnabled(): boolean
{
    const settings = useNotemacStore.getState().settings;
    return settings.stickyScrollEnabled;
}

export function ToggleStickyScroll(): boolean
{
    const store = useNotemacStore.getState();
    const newValue = !store.settings.stickyScrollEnabled;
    store.updateSettings({ stickyScrollEnabled: newValue });
    return newValue;
}

export function SetStickyScrollEnabled(enabled: boolean): void
{
    const store = useNotemacStore.getState();
    store.updateSettings({ stickyScrollEnabled: enabled });
}

export function GetStickyScrollEditorOption(enabled: boolean): { stickyScroll: { enabled: boolean; maxLineCount: number } }
{
    return {
        stickyScroll: {
            enabled,
            maxLineCount: 5,
        },
    };
}
