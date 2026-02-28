import { useNotemacStore } from '../../Model/Store';
import type { ConflictRegion } from '../../Commons/Types';
import { Dispatch, NOTEMAC_EVENTS } from '../../../Shared/EventDispatcher/EventDispatcher';
import { GetMonacoEditor } from '../../../Shared/Helpers/EditorGlobals';

/**
 * GitMergeController — Parses and resolves merge conflicts in editor content.
 */

export function DetectConflicts(content: string): ConflictRegion[]
{
    const lines = content.split('\n');
    const conflicts: ConflictRegion[] = [];

    let i = 0;
    const maxCount = lines.length;
    while (i < maxCount)
    {
        if (lines[i].startsWith('<<<<<<<'))
        {
            const startLine = i + 1;
            const currentLabel = lines[i].substring(8).trim();

            // Find separator
            let separatorLine = -1;
            let j = i + 1;
            while (j < maxCount)
            {
                if (lines[j].startsWith('======='))
                {
                    separatorLine = j + 1;
                    break;
                }
                j++;
            }

            if (-1 === separatorLine)
            {
                i++;
                continue;
            }

            // Find end marker
            let endLine = -1;
            let incomingLabel = '';
            let k = j + 1;
            while (k < maxCount)
            {
                if (lines[k].startsWith('>>>>>>>'))
                {
                    endLine = k + 1;
                    incomingLabel = lines[k].substring(8).trim();
                    break;
                }
                k++;
            }

            if (-1 === endLine)
            {
                i++;
                continue;
            }

            const currentContent = lines.slice(i + 1, j).join('\n');
            const incomingContent = lines.slice(j + 1, k).join('\n');

            conflicts.push({
                startLine,
                separatorLine,
                endLine,
                currentContent,
                incomingContent,
                currentLabel,
                incomingLabel,
            });

            i = k + 1;
        }
        else
        {
            i++;
        }
    }

    return conflicts;
}

export function AcceptCurrent(region: ConflictRegion): void
{
    ReplaceConflictRegion(region, region.currentContent);
}

export function AcceptIncoming(region: ConflictRegion): void
{
    ReplaceConflictRegion(region, region.incomingContent);
}

export function AcceptBoth(region: ConflictRegion): void
{
    ReplaceConflictRegion(region, region.currentContent + '\n' + region.incomingContent);
}

function ReplaceConflictRegion(region: ConflictRegion, replacement: string): void
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return;

    const model = editor.getModel();
    if (null === model)
        return;

    const monaco = (window as any).monaco;
    if (undefined === monaco || null === monaco)
        return;

    const range = new monaco.Range(
        region.startLine,
        1,
        region.endLine,
        model.getLineMaxColumn(region.endLine),
    );

    editor.executeEdits('merge-resolve', [{
        range,
        text: replacement,
    }]);

    // Re-detect remaining conflicts
    const updatedContent = model.getValue();
    const remaining = DetectConflicts(updatedContent);
    useNotemacStore.getState().SetConflicts(remaining);

    Dispatch(NOTEMAC_EVENTS.GIT_CONFLICT_RESOLVED, { resolved: region, remaining });
}

export function ResolveAllCurrent(): void
{
    const conflicts = useNotemacStore.getState().conflicts;
    // Resolve from bottom to top to preserve line numbers
    const sorted = [...conflicts].sort((a, b) => b.startLine - a.startLine);
    for (let i = 0, maxCount = sorted.length; i < maxCount; i++)
    {
        AcceptCurrent(sorted[i]);
    }
}

export function ResolveAllIncoming(): void
{
    const conflicts = useNotemacStore.getState().conflicts;
    const sorted = [...conflicts].sort((a, b) => b.startLine - a.startLine);
    for (let i = 0, maxCount = sorted.length; i < maxCount; i++)
    {
        AcceptIncoming(sorted[i]);
    }
}

export function RefreshConflicts(): ConflictRegion[]
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return [];

    const model = editor.getModel();
    if (null === model)
        return [];

    const conflicts = DetectConflicts(model.getValue());
    useNotemacStore.getState().SetConflicts(conflicts);
    return conflicts;
}

export function HasConflicts(): boolean
{
    return 0 < useNotemacStore.getState().conflicts.length;
}

export function GetConflictCount(): number
{
    return useNotemacStore.getState().conflicts.length;
}
