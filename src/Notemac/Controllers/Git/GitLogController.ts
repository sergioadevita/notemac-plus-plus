import git from 'isomorphic-git';
import { useNotemacStore } from "../../Model/Store";
import type { GitCommit } from "../../Commons/Types";
import { GIT_COMMIT_FETCH_LIMIT } from "../../Commons/Constants";
import { GetFs, GetDir } from './GitInitController';

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Fetch commit log.
 * Retrieves the commit history for the current branch.
 */
export async function FetchCommitLog(limit: number = GIT_COMMIT_FETCH_LIMIT): Promise<void> {
    const store = GetStore();
    const fs = GetFs();
    if (null === fs)
        return;

    try {
        const dir = GetDir();
        const logs = await git.log({ fs, dir, depth: limit });

        const commits: GitCommit[] = logs.map(entry => ({
            oid: entry.oid,
            message: entry.commit.message,
            author: {
                name: entry.commit.author.name,
                email: entry.commit.author.email,
            },
            timestamp: entry.commit.author.timestamp,
        }));

        store.SetCommitLog(commits);
    }
    catch {
        store.SetCommitLog([]);
    }
}

/**
 * Get file content at HEAD for diff comparison.
 * Retrieves the version of a file as it exists in the HEAD commit.
 */
export async function GetFileAtHead(filepath: string): Promise<string | null> {
    const fs = GetFs();
    if (null === fs)
        return null;

    try {
        const dir = GetDir();
        const commitOid = await git.resolveRef({ fs, dir, ref: 'HEAD' });
        const { blob } = await git.readBlob({
            fs,
            dir,
            oid: commitOid,
            filepath,
        });

        return new TextDecoder().decode(blob);
    }
    catch {
        return null;
    }
}

/**
 * Build a summary of staged changes suitable for AI commit message generation.
 * Includes file status and basic line count information for modified files.
 */
export async function GetStagedDiff(): Promise<string> {
    const store = GetStore();
    const gitStatus = store.gitStatus;
    if (null === gitStatus || 0 === gitStatus.stagedFiles.length)
        return '';

    const parts: string[] = [];
    const maxFiles = gitStatus.stagedFiles.length;

    for (let i = 0; i < maxFiles; i++) {
        const file = gitStatus.stagedFiles[i];
        parts.push(`${file.status}: ${file.path}`);

        // Try to get a diff for modified files
        if ('modified' === file.status) {
            const headContent = await GetFileAtHead(file.path);
            if (null !== headContent) {
                // Simple line-based diff summary (not full unified diff)
                const headLines = headContent.split('\n');
                const currentLines = (store.tabs.find(t => t.path?.endsWith(file.path))?.content || '').split('\n');

                const added = currentLines.length - headLines.length;
                if (0 !== added)
                    parts.push(`  (${0 < added ? '+' : ''}${added} lines)`);
            }
        }
    }

    return parts.join('\n');
}
