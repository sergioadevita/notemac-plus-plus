type EventCallback<T = any> = (data: T) => void;

const listeners = new Map<string, Set<EventCallback>>();

export function Subscribe<T = any>(eventName: string, callback: EventCallback<T>): void
{
    if (!listeners.has(eventName))
        listeners.set(eventName, new Set());
    listeners.get(eventName)!.add(callback as EventCallback);
}

export function Unsubscribe<T = any>(eventName: string, callback: EventCallback<T>): void
{
    const set = listeners.get(eventName);
    if (set)
    {
        set.delete(callback as EventCallback);
        if (0 === set.size)
            listeners.delete(eventName);
    }
}

export function Dispatch<T = any>(eventName: string, data?: T): void
{
    const set = listeners.get(eventName);
    if (set)
    {
        set.forEach(callback => callback(data));
    }
}

export function UnsubscribeAll(eventName?: string): void
{
    if (eventName)
        listeners.delete(eventName);
    else
        listeners.clear();
}

// Typed event names for Notemac
export const NOTEMAC_EVENTS =
{
    FIND: 'notemac-find',
    REPLACE: 'notemac-replace',
    MARK: 'notemac-mark',
    GOTO_LINE: 'notemac-goto-line',
    COLUMN_EDIT: 'notemac-column-edit',
    CLEAR_MARKS: 'notemac-clear-marks',
    EDITOR_ACTION: 'notemac-editor-action',
} as const;
