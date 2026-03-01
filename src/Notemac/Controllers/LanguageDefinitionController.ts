/**
 * LanguageDefinitionController — Orchestrates custom language lifecycle.
 *
 * Bridges LanguageDefinitionService (Monaco registration) with the
 * Zustand store and event dispatcher. Handles registration, updates,
 * deletion, and startup initialization of custom languages.
 */

import { useNotemacStore } from '../Model/Store';
import {
    ValidateLanguageDefinition,
    RegisterLanguageWithMonaco,
    UnregisterLanguageFromMonaco,
} from '../Services/LanguageDefinitionService';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import type { CustomLanguageDefinition } from '../Commons/Types';

// ─── Registration ───────────────────────────────────────────────────

/**
 * Register a new custom language: validates, stores, and registers with Monaco.
 */
export function RegisterCustomLanguage(lang: CustomLanguageDefinition): { success: boolean; errors: string[] }
{
    const validation = ValidateLanguageDefinition(lang);
    if (!validation.valid)
    {
        return { success: false, errors: validation.errors };
    }

    const store = useNotemacStore.getState();

    // Check for duplicate
    const exists = store.customLanguages.some(l => l.id === lang.id);
    if (exists)
    {
        return { success: false, errors: [`Language "${lang.id}" already exists`] };
    }

    // Add to store
    store.AddCustomLanguage(lang);

    // Register with Monaco
    RegisterLanguageWithMonaco(lang);

    Dispatch(NOTEMAC_EVENTS.LANGUAGE_REGISTERED, { languageId: lang.id, label: lang.label });

    return { success: true, errors: [] };
}

/**
 * Unregister a custom language: removes from store and Monaco.
 */
export function UnregisterCustomLanguage(langId: string): void
{
    const store = useNotemacStore.getState();
    const lang = store.customLanguages.find(l => l.id === langId);
    if (!lang)
        return;

    // Remove from store
    store.RemoveCustomLanguage(langId);

    // Unregister from Monaco
    UnregisterLanguageFromMonaco(langId);

    Dispatch(NOTEMAC_EVENTS.LANGUAGE_UNREGISTERED, { languageId: langId });
}

/**
 * Update an existing custom language: updates store and re-registers with Monaco.
 */
export function UpdateCustomLanguage(id: string, updates: Partial<CustomLanguageDefinition>): { success: boolean; errors: string[] }
{
    const store = useNotemacStore.getState();
    const existing = store.customLanguages.find(l => l.id === id);
    if (!existing)
    {
        return { success: false, errors: [`Language "${id}" not found`] };
    }

    const merged = { ...existing, ...updates };
    const validation = ValidateLanguageDefinition(merged);
    if (!validation.valid)
    {
        return { success: false, errors: validation.errors };
    }

    // Update store
    store.UpdateCustomLanguage(id, updates);

    // Re-register with Monaco (unregister old, register new)
    UnregisterLanguageFromMonaco(id);
    RegisterLanguageWithMonaco(merged);

    return { success: true, errors: [] };
}

// ─── File Associations ──────────────────────────────────────────────

/**
 * Set a file extension to language association override.
 */
export function SetFileAssociation(extension: string, languageId: string): void
{
    useNotemacStore.getState().SetFileAssociationOverride(extension, languageId);
}

/**
 * Remove a file extension override.
 */
export function RemoveFileAssociation(extension: string): void
{
    useNotemacStore.getState().RemoveFileAssociationOverride(extension);
}

// ─── Initialization ─────────────────────────────────────────────────

/**
 * Initialize all custom languages on startup.
 * Reads from store and registers each with Monaco.
 */
export function InitializeCustomLanguages(): void
{
    const store = useNotemacStore.getState();

    for (const lang of store.customLanguages)
    {
        RegisterLanguageWithMonaco(lang);
    }
}

/**
 * Sync plugin-registered languages with Monaco.
 * Fixes the gap where pluginLanguages are stored but never applied.
 */
export function SyncPluginLanguagesWithMonaco(): void
{
    const store = useNotemacStore.getState();

    for (const pluginLang of store.pluginLanguages)
    {
        const config = pluginLang.config as Record<string, unknown>;

        if (config.monarchTokens && 'object' === typeof config.monarchTokens)
        {
            const langDef: CustomLanguageDefinition = {
                id: pluginLang.id,
                label: ('string' === typeof config.label) ? config.label : pluginLang.id,
                extensions: Array.isArray(config.extensions) ? config.extensions as string[] : [],
                aliases: Array.isArray(config.aliases) ? config.aliases as string[] : [],
                monarchTokens: config.monarchTokens as CustomLanguageDefinition['monarchTokens'],
                brackets: Array.isArray(config.brackets) ? config.brackets as [string, string][] : undefined,
                comments: ('object' === typeof config.comments) ? config.comments as CustomLanguageDefinition['comments'] : undefined,
                autoClosingPairs: Array.isArray(config.autoClosingPairs) ? config.autoClosingPairs as [string, string][] : undefined,
            };

            RegisterLanguageWithMonaco(langDef);
        }
    }
}
