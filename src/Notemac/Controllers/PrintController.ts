import { useNotemacStore } from '../Model/Store';
import { Print, GeneratePrintHTML } from '../Services/PrintService';

/**
 * PrintController — Orchestrates print operations.
 */

export function PrintCurrentDocument(): void
{
    const store = useNotemacStore.getState();
    const activeTabId = store.activeTabId;
    if (null === activeTabId)
        return;

    const tab = store.tabs.find(t => t.id === activeTabId);
    if (undefined === tab)
        return;

    Print(tab.content, tab.language, {
        headerText: tab.name,
        fontSize: store.settings.fontSize,
        fontFamily: store.settings.fontFamily,
        showLineNumbers: store.settings.showLineNumbers,
    });
}

export function PrintSelection(): void
{
    const store = useNotemacStore.getState();
    const activeTabId = store.activeTabId;
    if (null === activeTabId)
        return;

    const tab = store.tabs.find(t => t.id === activeTabId);
    if (undefined === tab)
        return;

    // For selection printing, we'd need editor access
    // Fall back to printing full document
    Print(tab.content, tab.language, {
        headerText: `${tab.name} (Selection)`,
        fontSize: store.settings.fontSize,
        fontFamily: store.settings.fontFamily,
    });
}

export function ShowPrintPreview(): void
{
    const store = useNotemacStore.getState();
    store.setShowPrintPreview(true);
}

export function GetPrintPreviewHTML(): string
{
    const store = useNotemacStore.getState();
    const activeTabId = store.activeTabId;
    if (null === activeTabId)
        return '';

    const tab = store.tabs.find(t => t.id === activeTabId);
    if (undefined === tab)
        return '';

    return GeneratePrintHTML(tab.content, tab.language, {
        headerText: tab.name,
        fontSize: store.settings.fontSize,
        fontFamily: store.settings.fontFamily,
        showLineNumbers: store.settings.showLineNumbers,
    });
}
