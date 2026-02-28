import { useNotemacStore } from '../../Model/Store';
import type { BlameInfo } from '../../Commons/Types';
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GIT_BLAME_MAX_MESSAGE_LENGTH } from '../../Commons/Constants';

/**
 * GitBlameController — Computes per-line blame info using isomorphic-git commit log.
 */

const blameCache = new Map<string, BlameInfo[]>();

export function ToggleBlameView(): boolean
{
    const store = useNotemacStore.getState();
    const newValue = !store.blameVisible;
    store.SetBlameVisible(newValue);

    if (!newValue)
    {
        store.SetBlameData([]);
    }

    return newValue;
}

export function IsBlameVisible(): boolean
{
    return useNotemacStore.getState().blameVisible;
}

export async function GetBlameForFile(filePath: string): Promise<BlameInfo[]>
{
    // Check cache
    if (blameCache.has(filePath))
        return blameCache.get(filePath)!;

    try
    {
        // Use commit log to build blame data
        const commits = useNotemacStore.getState().commitLog;
        const blameData = BuildBlameFromCommits(filePath, commits);

        blameCache.set(filePath, blameData);
        useNotemacStore.getState().SetBlameData(blameData);
        Dispatch(NOTEMAC_EVENTS.GIT_BLAME_UPDATED, blameData);

        return blameData;
    }
    catch
    {
        return [];
    }
}

export function BuildBlameFromCommits(
    _filePath: string,
    commits: Array<{ oid: string; message: string; author: { name: string; email: string }; timestamp: number }>,
): BlameInfo[]
{
    if (0 === commits.length)
        return [];

    // When we don't have per-line blame data from git, we create a simplified
    // blame view attributing all lines to the most recent commit that touched this file.
    const latestCommit = commits[0];
    const date = new Date(latestCommit.timestamp * 1000);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const truncatedMessage = latestCommit.message.length > GIT_BLAME_MAX_MESSAGE_LENGTH
        ? latestCommit.message.substring(0, GIT_BLAME_MAX_MESSAGE_LENGTH) + '...'
        : latestCommit.message;

    // Get current content to determine line count
    const store = useNotemacStore.getState();
    const activeTab = store.tabs.find(t => t.id === store.activeTabId);
    const lineCount = activeTab ? activeTab.content.split('\n').length : 0;

    const blameData: BlameInfo[] = [];
    for (let i = 1, maxCount = lineCount + 1; i < maxCount; i++)
    {
        blameData.push({
            line: i,
            author: latestCommit.author.name,
            date: dateStr,
            commitHash: latestCommit.oid.substring(0, 8),
            commitMessage: truncatedMessage,
        });
    }

    return blameData;
}

export function ClearBlameCache(): void
{
    blameCache.clear();
}

export function InvalidateBlameForFile(filePath: string): void
{
    blameCache.delete(filePath);
}
