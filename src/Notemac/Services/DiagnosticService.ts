import type { DiagnosticItem, QuickFix } from '../Commons/Types';
import { UI_DIAGNOSTICS_DEBOUNCE_MS } from '../Commons/Constants';

/**
 * DiagnosticService — Manages diagnostic providers and runs diagnostics on editor content.
 */

type DiagnosticProvider = (content: string, language: string) => DiagnosticItem[];

const providers = new Map<string, DiagnosticProvider[]>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function RegisterProvider(language: string, provider: DiagnosticProvider): void
{
    if (!providers.has(language))
        providers.set(language, []);
    providers.get(language)!.push(provider);
}

export function UnregisterProviders(language: string): void
{
    providers.delete(language);
}

export function RunDiagnostics(content: string, language: string): DiagnosticItem[]
{
    const languageProviders = providers.get(language) || [];
    const universalProviders = providers.get('*') || [];
    const allProviders = [...languageProviders, ...universalProviders];

    if (0 === allProviders.length)
        return [];

    const results: DiagnosticItem[] = [];
    for (let i = 0, maxCount = allProviders.length; i < maxCount; i++)
    {
        try
        {
            const items = allProviders[i](content, language);
            results.push(...items);
        }
        catch
        {
            // Provider threw an error — skip it
        }
    }

    // Sort by line number, then column
    results.sort((a, b) =>
    {
        if (a.startLineNumber !== b.startLineNumber)
            return a.startLineNumber - b.startLineNumber;
        return a.startColumn - b.startColumn;
    });

    return results;
}

export function RunDiagnosticsDebounced(
    content: string,
    language: string,
    callback: (items: DiagnosticItem[]) => void,
): void
{
    if (null !== debounceTimer)
        clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() =>
    {
        const results = RunDiagnostics(content, language);
        callback(results);
        debounceTimer = null;
    }, UI_DIAGNOSTICS_DEBOUNCE_MS);
}

export function GetQuickFixes(diagnostic: DiagnosticItem): QuickFix[]
{
    // Basic quick fixes based on diagnostic patterns
    const fixes: QuickFix[] = [];

    if (diagnostic.message.includes('unused variable') || diagnostic.message.includes('is declared but'))
    {
        fixes.push({
            title: 'Remove unused variable',
            edit: {
                range: {
                    startLineNumber: diagnostic.startLineNumber,
                    startColumn: 1,
                    endLineNumber: diagnostic.endLineNumber + 1,
                    endColumn: 1,
                },
                text: '',
            },
        });
    }

    if (diagnostic.message.includes('missing semicolon'))
    {
        fixes.push({
            title: 'Add semicolon',
            edit: {
                range: {
                    startLineNumber: diagnostic.endLineNumber,
                    startColumn: diagnostic.endColumn,
                    endLineNumber: diagnostic.endLineNumber,
                    endColumn: diagnostic.endColumn,
                },
                text: ';',
            },
        });
    }

    return fixes;
}

export function ClearDebounceTimer(): void
{
    if (null !== debounceTimer)
    {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
}

export function ClearAllProviders(): void
{
    providers.clear();
}

export function GetRegisteredLanguages(): string[]
{
    return Array.from(providers.keys());
}
