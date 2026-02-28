type EventCallback<T = unknown> = (data: T) => void;

const listeners = new Map<string, Set<EventCallback>>();

export function Subscribe<T = unknown>(eventName: string, callback: EventCallback<T>): void
{
    if (!listeners.has(eventName))
        listeners.set(eventName, new Set());
    listeners.get(eventName)!.add(callback as EventCallback);
}

export function Unsubscribe<T = unknown>(eventName: string, callback: EventCallback<T>): void
{
    const set = listeners.get(eventName);
    if (set)
    {
        set.delete(callback as EventCallback);
        if (0 === set.size)
            listeners.delete(eventName);
    }
}

export function Dispatch<T = unknown>(eventName: string, data?: T): void
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
    INSERT_SNIPPET: 'notemac-insert-snippet',
    EXECUTE_COMMAND: 'notemac-execute-command',
    GIT_STATUS_CHANGED: 'notemac-git-status-changed',
    GIT_BRANCH_CHANGED: 'notemac-git-branch-changed',
    GIT_OPERATION_COMPLETE: 'notemac-git-operation-complete',
    AI_RESPONSE_COMPLETE: 'notemac-ai-response-complete',
    AI_STREAM_CHUNK: 'notemac-ai-stream-chunk',
    AI_INLINE_SUGGESTION: 'notemac-ai-inline-suggestion',
    AI_ERROR: 'notemac-ai-error',
    AI_ACTION: 'notemac-ai-action',
    GIT_BLAME_UPDATED: 'notemac-git-blame-updated',
    GIT_STASH_CHANGED: 'notemac-git-stash-changed',
    GIT_CONFLICT_RESOLVED: 'notemac-git-conflict-resolved',
    COLLABORATION_STARTED: 'notemac-collaboration-started',
    COLLABORATION_ENDED: 'notemac-collaboration-ended',
    PEER_JOINED: 'notemac-peer-joined',
    PEER_LEFT: 'notemac-peer-left',
    BREADCRUMB_UPDATED: 'notemac-breadcrumb-updated',
    DIAGNOSTICS_UPDATED: 'notemac-diagnostics-updated',
    FORMAT_DOCUMENT: 'notemac-format-document',
} as const;
