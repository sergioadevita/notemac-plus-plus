/**
 * PluginTypes.ts — All plugin-related TypeScript interfaces
 *
 * Defines the complete type system for the Notemac++ plugin architecture:
 * manifest schema, runtime instances, API context, and registry entries.
 */

import type { ComponentType } from 'react';

// ─── Manifest Types ────────────────────────────────────────────────

export interface PluginCommandDef
{
    id: string;
    label: string;
    category: string;
}

export interface PluginShortcutDef
{
    shortcut: string;
    action: string;
    category: string;
}

export interface PluginSidebarPanelDef
{
    id: string;
    label: string;
    icon: string;
}

export interface PluginStatusBarItemDef
{
    id: string;
    position: 'left' | 'right';
    priority: number;
}

export interface PluginMenuItemDef
{
    menu: string;
    label: string;
    action: string;
}

export interface PluginSettingsSectionDef
{
    id: string;
    label: string;
}

export interface PluginThemeDef
{
    id: string;
    name: string;
    colors: Record<string, string>;
}

export interface PluginLanguageDef
{
    id: string;
    extensions: string[];
    config: Record<string, unknown>;
}

export interface PluginContributions
{
    commands?: PluginCommandDef[];
    shortcuts?: PluginShortcutDef[];
    sidebarPanels?: PluginSidebarPanelDef[];
    statusBarItems?: PluginStatusBarItemDef[];
    menuItems?: PluginMenuItemDef[];
    settingsSections?: PluginSettingsSectionDef[];
    themes?: PluginThemeDef[];
    languages?: PluginLanguageDef[];
}

export interface PluginManifest
{
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    icon?: string;
    main: string;
    engines?: { notemac?: string };
    contributes?: PluginContributions;
}

// ─── Runtime Types ─────────────────────────────────────────────────

export type PluginStatus = 'active' | 'inactive' | 'error';

export interface PluginInstance
{
    id: string;
    manifest: PluginManifest;
    status: PluginStatus;
    context: PluginContext | null;
    module: PluginModule | null;
    error?: string;
}

export interface PluginModule
{
    activate: (context: PluginContext) => void | Promise<void>;
    deactivate?: () => void | Promise<void>;
}

// ─── Plugin API Context ────────────────────────────────────────────

export interface PluginEditorAPI
{
    GetContent: () => string;
    SetContent: (content: string) => void;
    InsertText: (text: string) => void;
    GetLanguage: () => string;
    GetSelection: () => string;
    SetSelection: (startLine: number, startCol: number, endLine: number, endCol: number) => void;
}

export interface PluginEventsAPI
{
    Subscribe: (eventName: string, callback: (data: unknown) => void) => void;
    Dispatch: (eventName: string, data?: unknown) => void;
}

export interface PluginUIAPI
{
    RegisterSidebarPanel: (id: string, component: ComponentType) => void;
    RegisterStatusBarItem: (id: string, component: ComponentType) => void;
    RegisterMenuItem: (menu: string, item: PluginMenuItemDef) => void;
    RegisterSettingsSection: (id: string, component: ComponentType) => void;
    ShowNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    ShowDialog: (component: ComponentType) => void;
}

export interface PluginCommandsAPI
{
    Register: (id: string, handler: () => void) => void;
    Execute: (id: string) => void;
}

export interface PluginThemesAPI
{
    Register: (name: string, colors: Record<string, string>) => void;
}

export interface PluginLanguagesAPI
{
    Register: (id: string, config: Record<string, unknown>) => void;
}

export interface PluginStorageAPI
{
    Get: (key: string) => unknown;
    Set: (key: string, value: unknown) => void;
}

export interface PluginContext
{
    pluginId: string;
    editor: PluginEditorAPI;
    events: PluginEventsAPI;
    ui: PluginUIAPI;
    commands: PluginCommandsAPI;
    themes: PluginThemesAPI;
    languages: PluginLanguagesAPI;
    storage: PluginStorageAPI;
}

// ─── Registry Types ────────────────────────────────────────────────

export interface PluginRegistryEntry
{
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    downloadUrl: string;
    icon?: string;
    stars: number;
    downloads: number;
    /** Inline JS code for bundled/demo plugins (skips download). */
    bundledCode?: string;
}

// ─── UI Registration Types ─────────────────────────────────────────

export interface RegisteredSidebarPanel
{
    id: string;
    label: string;
    icon: string;
    pluginId: string;
    component: ComponentType;
}

export interface RegisteredStatusBarItem
{
    id: string;
    position: 'left' | 'right';
    priority: number;
    pluginId: string;
    component: ComponentType;
}

export interface RegisteredMenuItem
{
    menu: string;
    label: string;
    action: string;
    pluginId: string;
}

export interface RegisteredSettingsSection
{
    id: string;
    label: string;
    pluginId: string;
    component: ComponentType;
}

export interface RegisteredCommand
{
    id: string;
    handler: () => void;
    pluginId: string;
}

export interface RegisteredShortcut
{
    shortcut: string;
    action: string;
    category: string;
    pluginId: string;
}
