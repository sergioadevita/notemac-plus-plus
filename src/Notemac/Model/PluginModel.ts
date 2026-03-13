import { StateCreator } from 'zustand';
import type { ComponentType } from 'react';
import type {
    PluginInstance,
    RegisteredSidebarPanel,
    RegisteredStatusBarItem,
    RegisteredMenuItem,
    RegisteredSettingsSection,
    RegisteredCommand,
    RegisteredShortcut,
    RegisteredPreset,
    PluginRegistryEntry,
} from '../Commons/PluginTypes';

export interface NotemacPluginSlice
{
    // Plugin instances
    pluginInstances: PluginInstance[];
    SetPluginInstances: (instances: PluginInstance[]) => void;

    // Plugin sidebar panels
    pluginSidebarPanels: RegisteredSidebarPanel[];
    RegisterPluginSidebarPanel: (panel: RegisteredSidebarPanel) => void;
    UnregisterPluginSidebarPanel: (id: string) => void;

    // Plugin status bar items
    pluginStatusBarItems: RegisteredStatusBarItem[];
    RegisterPluginStatusBarItem: (item: RegisteredStatusBarItem) => void;
    UnregisterPluginStatusBarItem: (id: string) => void;

    // Plugin menu items
    pluginMenuItems: RegisteredMenuItem[];
    RegisterPluginMenuItem: (item: RegisteredMenuItem) => void;
    UnregisterPluginMenuItem: (action: string) => void;

    // Plugin settings sections
    pluginSettingsSections: RegisteredSettingsSection[];
    RegisterPluginSettingsSection: (section: RegisteredSettingsSection) => void;
    UnregisterPluginSettingsSection: (id: string) => void;

    // Plugin commands
    pluginCommands: RegisteredCommand[];
    RegisterPluginCommand: (command: RegisteredCommand) => void;
    UnregisterPluginCommand: (id: string) => void;

    // Plugin shortcuts
    pluginShortcuts: RegisteredShortcut[];
    RegisterPluginShortcut: (shortcut: RegisteredShortcut) => void;
    UnregisterPluginShortcut: (action: string) => void;

    // Plugin presets (shortcut mapping presets)
    pluginPresets: RegisteredPreset[];
    RegisterPluginPreset: (preset: RegisteredPreset) => void;
    UnregisterPluginPreset: (id: string) => void;

    // Plugin themes
    pluginThemes: { id: string; name: string; colors: Record<string, string>; pluginId: string }[];
    RegisterPluginTheme: (theme: { id: string; name: string; colors: Record<string, string>; pluginId: string }) => void;
    UnregisterPluginTheme: (id: string) => void;

    // Plugin languages
    pluginLanguages: { id: string; config: Record<string, unknown>; pluginId: string }[];
    RegisterPluginLanguage: (lang: { id: string; config: Record<string, unknown>; pluginId: string }) => void;
    UnregisterPluginLanguage: (id: string) => void;

    // Plugin Manager dialog
    showPluginManager: boolean;
    SetShowPluginManager: (show: boolean) => void;

    // Plugin dialog (for plugin-triggered modals)
    pluginDialogComponent: ComponentType | null;
    SetPluginDialogComponent: (component: ComponentType | null) => void;

    // Registry
    pluginRegistryEntries: PluginRegistryEntry[];
    pluginRegistryLoading: boolean;
    SetPluginRegistryEntries: (entries: PluginRegistryEntry[]) => void;
    SetPluginRegistryLoading: (loading: boolean) => void;

    // Bulk unregister by plugin ID
    UnregisterAllByPluginId: (pluginId: string) => void;
}

export const createPluginSlice: StateCreator<NotemacPluginSlice, [], [], NotemacPluginSlice> = (set) => ({
    // Plugin instances
    pluginInstances: [],
    SetPluginInstances: (instances) => set({ pluginInstances: instances }),

    // Sidebar panels
    pluginSidebarPanels: [],
    RegisterPluginSidebarPanel: (panel) => set((state) =>
    {
        const filtered = state.pluginSidebarPanels.filter(p => p.id !== panel.id);
        return { pluginSidebarPanels: [...filtered, panel] };
    }),
    UnregisterPluginSidebarPanel: (id) => set((state) => ({
        pluginSidebarPanels: state.pluginSidebarPanels.filter(p => p.id !== id),
    })),

    // Status bar items
    pluginStatusBarItems: [],
    RegisterPluginStatusBarItem: (item) => set((state) =>
    {
        const filtered = state.pluginStatusBarItems.filter(i => i.id !== item.id);
        return { pluginStatusBarItems: [...filtered, item] };
    }),
    UnregisterPluginStatusBarItem: (id) => set((state) => ({
        pluginStatusBarItems: state.pluginStatusBarItems.filter(i => i.id !== id),
    })),

    // Menu items
    pluginMenuItems: [],
    RegisterPluginMenuItem: (item) => set((state) => ({
        pluginMenuItems: [...state.pluginMenuItems, item],
    })),
    UnregisterPluginMenuItem: (action) => set((state) => ({
        pluginMenuItems: state.pluginMenuItems.filter(i => i.action !== action),
    })),

    // Settings sections
    pluginSettingsSections: [],
    RegisterPluginSettingsSection: (section) => set((state) =>
    {
        const filtered = state.pluginSettingsSections.filter(s => s.id !== section.id);
        return { pluginSettingsSections: [...filtered, section] };
    }),
    UnregisterPluginSettingsSection: (id) => set((state) => ({
        pluginSettingsSections: state.pluginSettingsSections.filter(s => s.id !== id),
    })),

    // Commands
    pluginCommands: [],
    RegisterPluginCommand: (command) => set((state) =>
    {
        const filtered = state.pluginCommands.filter(c => c.id !== command.id);
        return { pluginCommands: [...filtered, command] };
    }),
    UnregisterPluginCommand: (id) => set((state) => ({
        pluginCommands: state.pluginCommands.filter(c => c.id !== id),
    })),

    // Shortcuts
    pluginShortcuts: [],
    RegisterPluginShortcut: (shortcut) => set((state) => ({
        pluginShortcuts: [...state.pluginShortcuts, shortcut],
    })),
    UnregisterPluginShortcut: (action) => set((state) => ({
        pluginShortcuts: state.pluginShortcuts.filter(s => s.action !== action),
    })),

    // Presets
    pluginPresets: [],
    RegisterPluginPreset: (preset) => set((state) =>
    {
        const filtered = state.pluginPresets.filter(p => p.id !== preset.id);
        return { pluginPresets: [...filtered, preset] };
    }),
    UnregisterPluginPreset: (id) => set((state) => ({
        pluginPresets: state.pluginPresets.filter(p => p.id !== id),
    })),

    // Themes
    pluginThemes: [],
    RegisterPluginTheme: (theme) => set((state) =>
    {
        const filtered = state.pluginThemes.filter(t => t.id !== theme.id);
        return { pluginThemes: [...filtered, theme] };
    }),
    UnregisterPluginTheme: (id) => set((state) => ({
        pluginThemes: state.pluginThemes.filter(t => t.id !== id),
    })),

    // Languages
    pluginLanguages: [],
    RegisterPluginLanguage: (lang) => set((state) =>
    {
        const filtered = state.pluginLanguages.filter(l => l.id !== lang.id);
        return { pluginLanguages: [...filtered, lang] };
    }),
    UnregisterPluginLanguage: (id) => set((state) => ({
        pluginLanguages: state.pluginLanguages.filter(l => l.id !== id),
    })),

    // Plugin Manager dialog
    showPluginManager: false,
    SetShowPluginManager: (show) => set({ showPluginManager: show }),

    // Plugin dialog
    pluginDialogComponent: null,
    SetPluginDialogComponent: (component) => set({ pluginDialogComponent: component }),

    // Registry
    pluginRegistryEntries: [],
    pluginRegistryLoading: false,
    SetPluginRegistryEntries: (entries) => set({ pluginRegistryEntries: entries }),
    SetPluginRegistryLoading: (loading) => set({ pluginRegistryLoading: loading }),

    // Bulk unregister
    UnregisterAllByPluginId: (pluginId) => set((state) => ({
        pluginSidebarPanels: state.pluginSidebarPanels.filter(p => p.pluginId !== pluginId),
        pluginStatusBarItems: state.pluginStatusBarItems.filter(i => i.pluginId !== pluginId),
        pluginMenuItems: state.pluginMenuItems.filter(i => i.pluginId !== pluginId),
        pluginSettingsSections: state.pluginSettingsSections.filter(s => s.pluginId !== pluginId),
        pluginCommands: state.pluginCommands.filter(c => c.pluginId !== pluginId),
        pluginShortcuts: state.pluginShortcuts.filter(s => s.pluginId !== pluginId),
        pluginPresets: state.pluginPresets.filter(p => p.pluginId !== pluginId),
        pluginThemes: state.pluginThemes.filter(t => t.pluginId !== pluginId),
        pluginLanguages: state.pluginLanguages.filter(l => l.pluginId !== pluginId),
    })),
});
