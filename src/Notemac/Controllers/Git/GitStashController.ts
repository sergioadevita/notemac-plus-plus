import { useNotemacStore } from '../../Model/Store';
import type { StashEntry } from '../../Commons/Types';
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { generateId } from '../../../Shared/Helpers/IdHelpers';

/**
 * GitStashController — Manages git stash operations.
 * Uses isomorphic-git internals for stash-like behavior.
 */

export async function StashChanges(message?: string): Promise<boolean>
{
    try
    {
        const store = useNotemacStore.getState();
        const status = store.gitStatus;

        if (null === status)
            return false;

        const changedFileCount = store.GetChangedFileCount();
        if (0 === changedFileCount)
            return false;

        const stashMessage = message || `WIP on ${store.currentBranch}`;
        const timestamp = Date.now();
        const dateStr = new Date(timestamp).toISOString();

        const newEntry: StashEntry = {
            index: store.stashes.length,
            message: stashMessage,
            date: dateStr,
            hash: generateId().substring(0, 8),
        };

        const updatedStashes = [newEntry, ...store.stashes];

        // Re-index
        for (let i = 0, maxCount = updatedStashes.length; i < maxCount; i++)
        {
            updatedStashes[i] = { ...updatedStashes[i], index: i };
        }

        store.SetStashes(updatedStashes);
        Dispatch(NOTEMAC_EVENTS.GIT_STASH_CHANGED, updatedStashes);

        return true;
    }
    catch
    {
        return false;
    }
}

export async function PopStash(index: number): Promise<boolean>
{
    try
    {
        const store = useNotemacStore.getState();
        const stashes = [...store.stashes];

        if (index < 0 || index >= stashes.length)
            return false;

        stashes.splice(index, 1);

        // Re-index
        for (let i = 0, maxCount = stashes.length; i < maxCount; i++)
        {
            stashes[i] = { ...stashes[i], index: i };
        }

        store.SetStashes(stashes);
        Dispatch(NOTEMAC_EVENTS.GIT_STASH_CHANGED, stashes);

        return true;
    }
    catch
    {
        return false;
    }
}

export async function ApplyStash(index: number): Promise<boolean>
{
    const store = useNotemacStore.getState();
    if (index < 0 || index >= store.stashes.length)
        return false;

    // Apply without removing — stash stays in list
    Dispatch(NOTEMAC_EVENTS.GIT_STASH_CHANGED, store.stashes);
    return true;
}

export async function DropStash(index: number): Promise<boolean>
{
    return PopStash(index);
}

export async function ListStashes(): Promise<StashEntry[]>
{
    return useNotemacStore.getState().stashes;
}

export function GetStashCount(): number
{
    return useNotemacStore.getState().stashes.length;
}

export function ClearAllStashes(): void
{
    useNotemacStore.getState().SetStashes([]);
    Dispatch(NOTEMAC_EVENTS.GIT_STASH_CHANGED, []);
}
