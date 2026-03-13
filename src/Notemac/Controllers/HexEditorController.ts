import { useNotemacStore } from "../Model/Store";
import { EditByteInString, ParseHexByte, SearchHexPattern, IsBinaryContent, IsBinaryExtension } from "../../Shared/Helpers/HexHelpers";

/**
 * Toggles the active tab between text and hex view modes.
 * If no tabId given, uses the active tab.
 */
export function ToggleViewMode(tabId?: string): void
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return;

    const tab = store.tabs.find(t => t.id === id);
    if (!tab) return;

    const newMode = 'hex' === tab.viewMode ? 'text' : 'hex';
    store.updateTabViewMode(id, newMode);
}

/**
 * Sets the view mode explicitly for a tab.
 */
export function SetViewMode(viewMode: 'text' | 'hex', tabId?: string): void
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return;
    store.updateTabViewMode(id, viewMode);
}

/**
 * Navigates to a specific byte offset in the hex editor.
 * Accepts a string that can be decimal or hex (prefixed with "0x").
 * Returns { success, error? }
 */
export function GoToOffset(offsetStr: string, tabId?: string): { success: boolean; error?: string }
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return { success: false, error: 'No active tab' };

    const tab = store.tabs.find(t => t.id === id);
    if (!tab) return { success: false, error: 'Tab not found' };

    // Parse the offset
    let offset: number;
    const trimmed = offsetStr.trim();
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X'))
    {
        offset = parseInt(trimmed, 16);
    }
    else
    {
        offset = parseInt(trimmed, 10);
    }

    if (isNaN(offset) || offset < 0)
    {
        return { success: false, error: 'Invalid offset value' };
    }

    if (offset >= tab.content.length)
    {
        return { success: false, error: `Offset ${offset} exceeds file size (${tab.content.length} bytes)` };
    }

    store.updateTab(id, { hexByteOffset: offset });
    return { success: true };
}

/**
 * Edits a single byte at the given offset in the active tab's content.
 * hexValue is a 2-character hex string like "4A".
 * Returns { success, error? }
 */
export function EditByte(offset: number, hexValue: string, tabId?: string): { success: boolean; error?: string }
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return { success: false, error: 'No active tab' };

    const tab = store.tabs.find(t => t.id === id);
    if (!tab) return { success: false, error: 'Tab not found' };
    if (tab.isReadOnly) return { success: false, error: 'File is read-only' };

    const byteVal = ParseHexByte(hexValue);
    if (null === byteVal)
    {
        return { success: false, error: 'Invalid hex value' };
    }

    if (offset < 0 || offset >= tab.content.length)
    {
        return { success: false, error: 'Offset out of range' };
    }

    const newContent = EditByteInString(tab.content, offset, byteVal);
    store.updateTabContent(id, newContent);
    return { success: true };
}

/**
 * Searches hex pattern in the active tab's content.
 * Pattern is space-separated hex bytes e.g. "48 65 6C 6C 6F".
 * Returns array of offsets.
 */
export function SearchHex(pattern: string, tabId?: string): { success: boolean; offsets: number[]; error?: string }
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return { success: false, offsets: [], error: 'No active tab' };

    const tab = store.tabs.find(t => t.id === id);
    if (!tab) return { success: false, offsets: [], error: 'Tab not found' };

    if ('' === pattern.trim())
    {
        return { success: false, offsets: [], error: 'Empty search pattern' };
    }

    const offsets = SearchHexPattern(tab.content, pattern);
    return { success: true, offsets };
}

/**
 * Sets the bytes-per-row for hex display (8 or 16).
 */
export function SetBytesPerRow(bytesPerRow: 8 | 16, tabId?: string): void
{
    const store = useNotemacStore.getState();
    const id = tabId ?? store.activeTabId;
    if (null === id) return;

    store.updateTab(id, { hexBytesPerRow: bytesPerRow });
}

/**
 * Checks whether a tab's content or filename suggests it should auto-open in hex mode.
 */
export function ShouldAutoHex(filename: string, content: string): boolean
{
    return IsBinaryExtension(filename) || IsBinaryContent(content);
}
