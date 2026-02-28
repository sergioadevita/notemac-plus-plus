/**
 * PluginAPIService — Constructs the sandboxed PluginContext.
 *
 * Each plugin receives a scoped API object with access to editor, events,
 * UI registration, commands, themes, languages, and scoped storage.
 * Every registration is tracked per plugin for clean teardown.
 */

import type { ComponentType } from 'react';
import type {
    PluginContext,
    PluginEditorAPI,
    PluginEventsAPI,
    PluginUIAPI,
    PluginCommandsAPI,
    PluginThemesAPI,
    PluginLanguagesAPI,
    PluginStorageAPI,
    PluginMenuItemDef,
} from '../Commons/PluginTypes';
import { PLUGIN_STORAGE_PREFIX } from '../Commons/Constants';
import { useNotemacStore } from '../Model/Store';
import {
    Subscribe as EventSubscribe,
    Unsubscribe as EventUnsubscribe,
    Dispatch as EventDispatch,
} from '../../Shared/EventDispatcher/EventDispatcher';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';

// Track subscriptions per plugin for auto-cleanup
const pluginSubscriptions = new Map<string, { eventName: string; callback: (data: unknown) => void }[]>();

/**
 * Create a sandboxed PluginContext for a specific plugin.
 */
export function CreatePluginContext(pluginId: string): PluginContext
{
    // Track event subscriptions for cleanup
    pluginSubscriptions.set(pluginId, []);

    const editor = CreateEditorAPI();
    const events = CreateEventsAPI(pluginId);
    const ui = CreateUIAPI(pluginId);
    const commands = CreateCommandsAPI(pluginId);
    const themes = CreateThemesAPI(pluginId);
    const languages = CreateLanguagesAPI(pluginId);
    const storage = CreateStorageAPI(pluginId);

    return {
        pluginId,
        editor,
        events,
        ui,
        commands,
        themes,
        languages,
        storage,
    };
}

/**
 * Cleanup all registrations for a plugin.
 */
export function CleanupPluginContext(pluginId: string): void
{
    // Unsubscribe all events
    const subs = pluginSubscriptions.get(pluginId);
    if (subs)
    {
        for (const sub of subs)
        {
            EventUnsubscribe(sub.eventName, sub.callback);
        }
        pluginSubscriptions.delete(pluginId);
    }

    // Unregister all UI contributions via store
    const store = useNotemacStore.getState();
    store.UnregisterAllByPluginId(pluginId);
}

// ─── Editor API ────────────────────────────────────────────────────

function CreateEditorAPI(): PluginEditorAPI
{
    return {
        GetContent: () =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
                return editorInstance.getValue();
            return '';
        },

        SetContent: (content: string) =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
                editorInstance.setValue(content);
        },

        InsertText: (text: string) =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
            {
                const position = editorInstance.getPosition();
                if (position)
                {
                    editorInstance.executeEdits('plugin', [{
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                        text,
                    }]);
                }
            }
        },

        GetLanguage: () =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
            {
                const model = editorInstance.getModel();
                if (model)
                    return model.getLanguageId();
            }
            return 'plaintext';
        },

        GetSelection: () =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
            {
                const sel = editorInstance.getSelection();
                const model = editorInstance.getModel();
                if (sel && model && !sel.isEmpty())
                    return model.getValueInRange(sel);
            }
            return '';
        },

        SetSelection: (startLine: number, startCol: number, endLine: number, endCol: number) =>
        {
            const editorInstance = GetMonacoEditor();
            if (editorInstance)
            {
                editorInstance.setSelection({
                    startLineNumber: startLine,
                    startColumn: startCol,
                    endLineNumber: endLine,
                    endColumn: endCol,
                });
            }
        },
    };
}

// ─── Events API ────────────────────────────────────────────────────

function CreateEventsAPI(pluginId: string): PluginEventsAPI
{
    return {
        Subscribe: (eventName: string, callback: (data: unknown) => void) =>
        {
            EventSubscribe(eventName, callback);
            const subs = pluginSubscriptions.get(pluginId);
            if (subs)
            {
                subs.push({ eventName, callback });
            }
        },

        Dispatch: (eventName: string, data?: unknown) =>
        {
            EventDispatch(eventName, data);
        },
    };
}

// ─── UI API ────────────────────────────────────────────────────────

function CreateUIAPI(pluginId: string): PluginUIAPI
{
    return {
        RegisterSidebarPanel: (id: string, component: ComponentType) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginSidebarPanel({
                id,
                label: id,
                icon: 'puzzle',
                pluginId,
                component,
            });
        },

        RegisterStatusBarItem: (id: string, component: ComponentType) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginStatusBarItem({
                id,
                position: 'right',
                priority: 50,
                pluginId,
                component,
            });
        },

        RegisterMenuItem: (menu: string, item: PluginMenuItemDef) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginMenuItem({
                menu,
                label: item.label,
                action: item.action,
                pluginId,
            });
        },

        RegisterSettingsSection: (id: string, component: ComponentType) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginSettingsSection({
                id,
                label: id,
                pluginId,
                component,
            });
        },

        ShowNotification: (message: string, _type?: 'info' | 'success' | 'warning' | 'error') =>
        {
            // Simple notification via alert (can be enhanced later)
            if ('undefined' !== typeof window)
            {
                // Use a toast-style approach if available, fallback to console
                // eslint-disable-next-line no-console
                console.info(`[Plugin ${pluginId}] ${message}`);
            }
        },

        ShowDialog: (component: ComponentType) =>
        {
            const store = useNotemacStore.getState();
            store.SetPluginDialogComponent(component);
        },
    };
}

// ─── Commands API ──────────────────────────────────────────────────

function CreateCommandsAPI(pluginId: string): PluginCommandsAPI
{
    return {
        Register: (id: string, handler: () => void) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginCommand({ id, handler, pluginId });
        },

        Execute: (id: string) =>
        {
            const store = useNotemacStore.getState();
            const command = store.pluginCommands.find(c => c.id === id);
            if (command)
            {
                try
                {
                    command.handler();
                }
                catch
                {
                    // Plugin command execution failed — silently handled
                }
            }
        },
    };
}

// ─── Themes API ────────────────────────────────────────────────────

function CreateThemesAPI(pluginId: string): PluginThemesAPI
{
    return {
        Register: (name: string, colors: Record<string, string>) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginTheme({
                id: `${pluginId}.${name}`,
                name,
                colors,
                pluginId,
            });
        },
    };
}

// ─── Languages API ─────────────────────────────────────────────────

function CreateLanguagesAPI(pluginId: string): PluginLanguagesAPI
{
    return {
        Register: (id: string, config: Record<string, unknown>) =>
        {
            const store = useNotemacStore.getState();
            store.RegisterPluginLanguage({
                id,
                config,
                pluginId,
            });
        },
    };
}

// ─── Storage API ───────────────────────────────────────────────────

function CreateStorageAPI(pluginId: string): PluginStorageAPI
{
    const prefix = `${PLUGIN_STORAGE_PREFIX}${pluginId}:`;

    return {
        Get: (key: string) =>
        {
            try
            {
                const raw = localStorage.getItem(`${prefix}${key}`);
                if (null === raw)
                    return undefined;
                return JSON.parse(raw);
            }
            catch
            {
                return undefined;
            }
        },

        Set: (key: string, value: unknown) =>
        {
            try
            {
                localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
            }
            catch
            {
                // Storage full or unavailable — silently handled
            }
        },
    };
}
