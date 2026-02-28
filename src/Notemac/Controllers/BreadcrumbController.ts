import { useNotemacStore } from '../Model/Store';
import type { BreadcrumbItem } from '../Commons/Types';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import { UI_BREADCRUMB_MAX_ITEMS } from '../Commons/Constants';

/**
 * BreadcrumbController — Builds breadcrumb path from file path + Monaco document symbols.
 */

let cachedBreadcrumbs: BreadcrumbItem[] = [];

export function GetBreadcrumbs(): BreadcrumbItem[]
{
    return cachedBreadcrumbs;
}

export function BuildBreadcrumbsFromPath(filePath: string | null): BreadcrumbItem[]
{
    if (null === filePath || '' === filePath)
        return [];

    const segments = filePath.split('/').filter(s => '' !== s);
    const items: BreadcrumbItem[] = [];

    for (let i = 0, maxCount = segments.length; i < maxCount; i++)
    {
        const isLast = i === maxCount - 1;
        items.push({
            label: segments[i],
            kind: isLast ? 'file' : 'folder',
        });
    }

    // Trim to max items (keep last N)
    if (items.length > UI_BREADCRUMB_MAX_ITEMS)
        return items.slice(items.length - UI_BREADCRUMB_MAX_ITEMS);

    return items;
}

export function BuildBreadcrumbsWithSymbols(
    filePath: string | null,
    symbols: Array<{ name: string; kind: number; range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }>,
    cursorLine: number,
): BreadcrumbItem[]
{
    const pathItems = BuildBreadcrumbsFromPath(filePath);

    // Find the deepest symbol containing the cursor
    const containingSymbols = symbols.filter(s =>
        s.range.startLineNumber <= cursorLine && cursorLine <= s.range.endLineNumber
    );

    // Sort by range size (smallest = deepest)
    containingSymbols.sort((a, b) =>
    {
        const sizeA = a.range.endLineNumber - a.range.startLineNumber;
        const sizeB = b.range.endLineNumber - b.range.startLineNumber;
        return sizeA - sizeB;
    });

    for (let i = 0, maxCount = containingSymbols.length; i < maxCount; i++)
    {
        const sym = containingSymbols[i];
        pathItems.push({
            label: sym.name,
            kind: 'symbol',
            range: sym.range,
            symbolKind: sym.kind,
        });
    }

    return pathItems;
}

export function UpdateBreadcrumbs(items: BreadcrumbItem[]): void
{
    cachedBreadcrumbs = items;
    const store = useNotemacStore.getState();
    store.SetBreadcrumbs(items);
    Dispatch(NOTEMAC_EVENTS.BREADCRUMB_UPDATED, items);
}

export function NavigateToBreadcrumb(index: number): { lineNumber: number; column: number } | null
{
    if (index < 0 || index >= cachedBreadcrumbs.length)
        return null;

    const item = cachedBreadcrumbs[index];
    if (null === item.range || undefined === item.range)
        return null;

    return { lineNumber: item.range.startLineNumber, column: item.range.startColumn };
}

export function ClearBreadcrumbs(): void
{
    cachedBreadcrumbs = [];
    const store = useNotemacStore.getState();
    store.SetBreadcrumbs([]);
}
