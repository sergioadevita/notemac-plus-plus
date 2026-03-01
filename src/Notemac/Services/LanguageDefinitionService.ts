/**
 * LanguageDefinitionService — Custom language validation, Monaco registration,
 * and file association detection.
 *
 * Manages the lifecycle of custom languages: validation, registration with
 * Monaco editor, and dynamic file-to-language mapping.
 */

import type { CustomLanguageDefinition, MonarchTokensConfig } from '../Commons/Types';
import { detectLanguage } from '../../Shared/Helpers/FileHelpers';

// Track disposables per language for cleanup
const languageDisposables = new Map<string, Array<{ dispose: () => void }>>();

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Validate a custom language definition has all required fields.
 */
export function ValidateLanguageDefinition(lang: unknown): { valid: boolean; errors: string[] }
{
    const errors: string[] = [];

    if (null === lang || 'object' !== typeof lang)
    {
        return { valid: false, errors: ['Language definition must be a non-null object'] };
    }

    const l = lang as Record<string, unknown>;

    if ('string' !== typeof l.id || 0 === l.id.trim().length)
        errors.push('Language id is required and must be a non-empty string');

    if ('string' !== typeof l.label || 0 === l.label.trim().length)
        errors.push('Language label is required and must be a non-empty string');

    if (!Array.isArray(l.extensions) || 0 === l.extensions.length)
        errors.push('Language extensions is required and must be a non-empty array');
    else
    {
        for (const ext of l.extensions)
        {
            if ('string' !== typeof ext || 0 === ext.length)
            {
                errors.push('Each extension must be a non-empty string');
                break;
            }
        }
    }

    if (!Array.isArray(l.aliases))
        errors.push('Language aliases must be an array');

    if (undefined === l.monarchTokens || null === l.monarchTokens || 'object' !== typeof l.monarchTokens)
        errors.push('monarchTokens is required and must be an object');
    else
    {
        const tokenValidation = ValidateMonarchTokens(l.monarchTokens as MonarchTokensConfig);
        if (!tokenValidation)
            errors.push('monarchTokens.tokenizer must contain a "root" key with an array of rules');
    }

    return { valid: 0 === errors.length, errors };
}

/**
 * Validate Monarch tokenizer configuration.
 */
export function ValidateMonarchTokens(tokens: MonarchTokensConfig): boolean
{
    if (null === tokens || 'object' !== typeof tokens)
        return false;

    if (null === tokens.tokenizer || 'object' !== typeof tokens.tokenizer)
        return false;

    if (!Array.isArray(tokens.tokenizer.root))
        return false;

    // Each state must be an array of rules
    for (const [, rules] of Object.entries(tokens.tokenizer))
    {
        if (!Array.isArray(rules))
            return false;
    }

    return true;
}

// ─── Monaco Registration ────────────────────────────────────────────

/**
 * Register a custom language with Monaco editor.
 * Requires monaco to be available globally.
 */
export function RegisterLanguageWithMonaco(lang: CustomLanguageDefinition): boolean
{
    try
    {
        const monaco = GetMonacoInstance();
        if (null === monaco)
            return false;

        const disposables: Array<{ dispose: () => void }> = [];

        // Register the language ID
        monaco.languages.register({
            id: lang.id,
            extensions: lang.extensions,
            aliases: lang.aliases.length > 0 ? lang.aliases : [lang.label],
        });

        // Set Monarch tokenizer for syntax highlighting
        // Cast to unknown first to satisfy Monaco's IMonarchLanguage vs our MonarchTokensConfig
        const tokenProviderDisposable = monaco.languages.setMonarchTokensProvider(lang.id, {
            keywords: lang.monarchTokens.keywords || [],
            operators: lang.monarchTokens.operators || [],
            tokenizer: lang.monarchTokens.tokenizer as unknown as Record<string, unknown[]>,
        } as unknown as import('monaco-editor').languages.IMonarchLanguage);
        if (tokenProviderDisposable)
            disposables.push(tokenProviderDisposable);

        // Set language configuration (brackets, comments, auto-closing)
        if (lang.brackets || lang.comments || lang.autoClosingPairs)
        {
            const config: Record<string, unknown> = {};

            if (lang.brackets)
            {
                config.brackets = lang.brackets;
            }

            if (lang.comments)
            {
                config.comments = lang.comments;
            }

            if (lang.autoClosingPairs)
            {
                config.autoClosingPairs = lang.autoClosingPairs.map(([open, close]) => ({
                    open,
                    close,
                }));
            }

            const configDisposable = monaco.languages.setLanguageConfiguration(lang.id, config);
            if (configDisposable)
                disposables.push(configDisposable);
        }

        languageDisposables.set(lang.id, disposables);
        return true;
    }
    catch
    {
        return false;
    }
}

/**
 * Unregister a custom language from Monaco.
 * Disposes all registered providers for that language.
 */
export function UnregisterLanguageFromMonaco(langId: string): void
{
    const disposables = languageDisposables.get(langId);
    if (disposables)
    {
        for (const d of disposables)
        {
            try
            {
                d.dispose();
            }
            catch
            {
                // Disposal failed — ignore
            }
        }
        languageDisposables.delete(langId);
    }
}

// ─── File Detection ─────────────────────────────────────────────────

/**
 * Detect the language for a filename, checking custom languages
 * and overrides before falling back to built-in detection.
 */
export function DetectLanguageWithCustom(
    filename: string,
    customLanguages: CustomLanguageDefinition[],
    overrides: Record<string, string>,
): string
{
    if (0 === filename.length)
        return 'plaintext';

    // Extract extension
    const dotIndex = filename.lastIndexOf('.');
    const extension = -1 !== dotIndex ? filename.slice(dotIndex) : '';

    // 1. Check file association overrides first (highest priority)
    if (0 < extension.length && overrides[extension])
    {
        return overrides[extension];
    }

    // 2. Check custom language extensions
    for (const lang of customLanguages)
    {
        for (const ext of lang.extensions)
        {
            const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
            if (normalizedExt === extension)
            {
                return lang.id;
            }
        }
    }

    // 3. Fall back to built-in detection
    return detectLanguage(filename);
}

// ─── Merged Language List ───────────────────────────────────────────

/**
 * Get a merged list of built-in and custom languages for display.
 */
export function GetBuiltInAndCustomLanguages(
    customLanguages: CustomLanguageDefinition[],
): { id: string; label: string; isCustom: boolean }[]
{
    // Import built-in languages from LanguageConfig
    const builtIn = GetBuiltInLanguageIds();

    const result: { id: string; label: string; isCustom: boolean }[] = builtIn.map(lang => ({
        id: lang.id,
        label: lang.label,
        isCustom: false,
    }));

    // Add custom languages, avoiding duplicates
    const existingIds = new Set(result.map(r => r.id));
    for (const lang of customLanguages)
    {
        if (!existingIds.has(lang.id))
        {
            result.push({
                id: lang.id,
                label: lang.label,
                isCustom: true,
            });
        }
    }

    return result.sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Internal Helpers ───────────────────────────────────────────────

/**
 * Get Monaco instance from global scope.
 */
function GetMonacoInstance(): typeof import('monaco-editor') | null
{
    if ('undefined' !== typeof window && (window as unknown as Record<string, unknown>).monaco)
    {
        return (window as unknown as Record<string, unknown>).monaco as typeof import('monaco-editor');
    }
    return null;
}

/**
 * Get built-in language IDs. This is a lightweight summary
 * without importing the full LanguageConfig module.
 */
function GetBuiltInLanguageIds(): { id: string; label: string }[]
{
    // Common built-in languages that Monaco supports
    return [
        { id: 'plaintext', label: 'Plain Text' },
        { id: 'javascript', label: 'JavaScript' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'html', label: 'HTML' },
        { id: 'css', label: 'CSS' },
        { id: 'json', label: 'JSON' },
        { id: 'markdown', label: 'Markdown' },
        { id: 'python', label: 'Python' },
        { id: 'java', label: 'Java' },
        { id: 'csharp', label: 'C#' },
        { id: 'cpp', label: 'C++' },
        { id: 'c', label: 'C' },
        { id: 'go', label: 'Go' },
        { id: 'rust', label: 'Rust' },
        { id: 'ruby', label: 'Ruby' },
        { id: 'php', label: 'PHP' },
        { id: 'swift', label: 'Swift' },
        { id: 'kotlin', label: 'Kotlin' },
        { id: 'sql', label: 'SQL' },
        { id: 'xml', label: 'XML' },
        { id: 'yaml', label: 'YAML' },
        { id: 'shell', label: 'Shell Script' },
        { id: 'powershell', label: 'PowerShell' },
        { id: 'dockerfile', label: 'Dockerfile' },
        { id: 'graphql', label: 'GraphQL' },
        { id: 'scss', label: 'SCSS' },
        { id: 'less', label: 'Less' },
        { id: 'lua', label: 'Lua' },
        { id: 'r', label: 'R' },
        { id: 'perl', label: 'Perl' },
    ];
}
