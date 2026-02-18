import React, { useState, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { GitFileStatus } from "../Commons/Types";
import {
    RefreshGitStatus, StageFile, StageAllFiles, UnstageFile,
    DiscardFileChanges, CreateCommit, PushToRemote, PullFromRemote,
    FetchFromRemote, CheckoutBranch, CreateBranch, DeleteBranch,
    InitializeRepository, GetFileAtHead,
} from "../Controllers/GitController";

interface GitPanelProps
{
    theme: ThemeColors;
}

const STATUS_COLORS: Record<string, string> =
{
    modified: '#f9e2af',
    added: '#a6e3a1',
    deleted: '#f38ba8',
    untracked: '#6c7086',
    unmerged: '#cba6f7',
};

const STATUS_LETTERS: Record<string, string> =
{
    modified: 'M',
    added: 'A',
    deleted: 'D',
    untracked: 'U',
    unmerged: '!',
};

function TimeAgo(timestamp: number): string
{
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (60 > diff)
        return 'just now';
    if (3600 > diff)
        return `${Math.floor(diff / 60)}m ago`;
    if (86400 > diff)
        return `${Math.floor(diff / 3600)}h ago`;
    if (604800 > diff)
        return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
}

export function GitPanelViewPresenter({ theme }: GitPanelProps)
{
    const isRepoInitialized = useNotemacStore(s => s.isRepoInitialized);
    const currentBranch = useNotemacStore(s => s.currentBranch);
    const branches = useNotemacStore(s => s.branches);
    const gitStatus = useNotemacStore(s => s.gitStatus);
    const commitLog = useNotemacStore(s => s.commitLog);
    const isGitOperationInProgress = useNotemacStore(s => s.isGitOperationInProgress);
    const currentGitOperation = useNotemacStore(s => s.currentGitOperation);
    const gitOperationProgress = useNotemacStore(s => s.gitOperationProgress);
    const gitOperationError = useNotemacStore(s => s.gitOperationError);
    const isBrowserWorkspace = useNotemacStore(s => s.isBrowserWorkspace);
    const setShowCloneDialog = useNotemacStore(s => s.setShowCloneDialog);

    const [commitMessage, setCommitMessage] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        staged: true,
        changes: true,
        untracked: true,
        commits: false,
        branches: false,
    });
    const [showBranchInput, setShowBranchInput] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [hoveredFile, setHoveredFile] = useState<string | null>(null);

    const toggleSection = useCallback((section: string) =>
    {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const handleCommit = useCallback(async () =>
    {
        if (0 === commitMessage.trim().length)
            return;
        try
        {
            await CreateCommit(commitMessage.trim());
            setCommitMessage('');
        }
        catch {}
    }, [commitMessage]);

    const handleCommitAndPush = useCallback(async () =>
    {
        if (0 === commitMessage.trim().length)
            return;
        try
        {
            await CreateCommit(commitMessage.trim());
            setCommitMessage('');
            await PushToRemote();
        }
        catch {}
    }, [commitMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('Enter' === e.key && (e.metaKey || e.ctrlKey))
        {
            e.preventDefault();
            handleCommit();
        }
    }, [handleCommit]);

    const handleCreateBranch = useCallback(async () =>
    {
        if (0 === newBranchName.trim().length)
            return;
        await CreateBranch(newBranchName.trim());
        setNewBranchName('');
        setShowBranchInput(false);
    }, [newBranchName]);

    // Empty state — not a git repo
    if (!isRepoInitialized)
    {
        return (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 32, opacity: 0.3 }}>🔀</div>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>
                    This folder is not a git repository
                </div>
                <button
                    onClick={() => InitializeRepository()}
                    style={{
                        backgroundColor: theme.accent, color: theme.accentText, border: 'none',
                        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
                    }}
                >
                    Initialize Repository
                </button>
                <button
                    onClick={() => setShowCloneDialog(true)}
                    style={{
                        backgroundColor: theme.bgHover, color: theme.text, border: `1px solid ${theme.border}`,
                        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
                    }}
                >
                    Clone Repository
                </button>
            </div>
        );
    }

    const stagedCount = gitStatus?.stagedFiles.length || 0;
    const unstagedCount = gitStatus?.unstagedFiles.length || 0;
    const untrackedCount = gitStatus?.untrackedFiles.length || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Browser workspace warning */}
            {isBrowserWorkspace && (
                <div style={{
                    padding: '4px 8px', backgroundColor: '#f9e2af22', borderBottom: `1px solid ${theme.border}`,
                    fontSize: 10, color: '#f9e2af', textAlign: 'center',
                }}>
                    ⚠ Browser Workspace — files stored in browser only
                </div>
            )}

            {/* Error banner */}
            {null !== gitOperationError && (
                <div style={{
                    padding: '6px 8px', backgroundColor: '#f38ba822', borderBottom: `1px solid ${theme.border}`,
                    fontSize: 11, color: '#f38ba8', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <span style={{ flex: 1 }}>{gitOperationError}</span>
                    <span
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => useNotemacStore.getState().SetGitOperationError(null)}
                    >✕</span>
                </div>
            )}

            {/* Progress bar */}
            {isGitOperationInProgress && (
                <div style={{ height: 2, backgroundColor: theme.border }}>
                    <div style={{
                        height: '100%', backgroundColor: theme.accent,
                        width: `${0 < gitOperationProgress ? gitOperationProgress : 100}%`,
                        transition: 'width 0.3s',
                        animation: 0 === gitOperationProgress ? 'pulse 1.5s infinite' : 'none',
                    }} />
                </div>
            )}

            <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Branch bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderBottom: `1px solid ${theme.border}`, fontSize: 12,
                }}>
                    <span style={{ color: theme.accent }}>⎇</span>
                    <select
                        value={currentBranch}
                        onChange={(e) => CheckoutBranch(e.target.value)}
                        style={{
                            flex: 1, backgroundColor: 'transparent', color: theme.text,
                            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        {branches.filter(b => !b.isRemote).map(b => (
                            <option key={b.name} value={b.name} style={{ backgroundColor: theme.bg, color: theme.text }}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    {gitStatus && (0 < gitStatus.aheadBy || 0 < gitStatus.behindBy) && (
                        <span style={{ color: theme.textMuted, fontSize: 11 }}>
                            {0 < gitStatus.aheadBy && `↑${gitStatus.aheadBy}`}
                            {0 < gitStatus.behindBy && ` ↓${gitStatus.behindBy}`}
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: `1px solid ${theme.border}` }}>
                    {[
                        { label: '⬇ Pull', action: () => PullFromRemote(), disabled: isGitOperationInProgress },
                        { label: '⬆ Push', action: () => PushToRemote(), disabled: isGitOperationInProgress },
                        { label: '🔄 Fetch', action: () => FetchFromRemote(), disabled: isGitOperationInProgress },
                    ].map(btn => (
                        <button
                            key={btn.label}
                            onClick={btn.action}
                            disabled={btn.disabled}
                            style={{
                                flex: 1, height: 26, backgroundColor: theme.bgHover, color: theme.text,
                                border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 11,
                                cursor: btn.disabled ? 'not-allowed' : 'pointer', opacity: btn.disabled ? 0.5 : 1,
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Commit area */}
                <div style={{ padding: '8px 8px', borderBottom: `1px solid ${theme.border}` }}>
                    <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Commit message (Cmd+Enter to commit)"
                        style={{
                            width: '100%', height: 52, backgroundColor: theme.bg, color: theme.text,
                            border: `1px solid ${theme.border}`, borderRadius: 4, padding: '6px 8px',
                            fontSize: 12, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                            onClick={handleCommit}
                            disabled={0 === commitMessage.trim().length || isGitOperationInProgress || 0 === stagedCount}
                            style={{
                                flex: 1, height: 26, backgroundColor: theme.accent, color: theme.accentText,
                                border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600,
                                cursor: 0 === commitMessage.trim().length || 0 === stagedCount ? 'not-allowed' : 'pointer',
                                opacity: 0 === commitMessage.trim().length || 0 === stagedCount ? 0.5 : 1,
                            }}
                        >
                            ✓ Commit
                        </button>
                        <button
                            onClick={handleCommitAndPush}
                            disabled={0 === commitMessage.trim().length || isGitOperationInProgress || 0 === stagedCount}
                            title="Commit & Push"
                            style={{
                                width: 36, height: 26, backgroundColor: theme.bgHover, color: theme.text,
                                border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 11,
                                cursor: 0 === commitMessage.trim().length || 0 === stagedCount ? 'not-allowed' : 'pointer',
                                opacity: 0 === commitMessage.trim().length || 0 === stagedCount ? 0.5 : 1,
                            }}
                        >
                            ✓⬆
                        </button>
                    </div>
                </div>

                {/* Staged Changes */}
                <FileSection
                    title="Staged Changes"
                    sectionKey="staged"
                    files={gitStatus?.stagedFiles || []}
                    expanded={expandedSections.staged}
                    onToggle={toggleSection}
                    theme={theme}
                    hoveredFile={hoveredFile}
                    onHover={setHoveredFile}
                    actions={(file) => [
                        { label: '−', title: 'Unstage', action: () => UnstageFile(file.path) },
                    ]}
                    headerAction={{ label: '−', title: 'Unstage all', action: () => { /* unstage all */ } }}
                />

                {/* Unstaged Changes */}
                <FileSection
                    title="Changes"
                    sectionKey="changes"
                    files={gitStatus?.unstagedFiles || []}
                    expanded={expandedSections.changes}
                    onToggle={toggleSection}
                    theme={theme}
                    hoveredFile={hoveredFile}
                    onHover={setHoveredFile}
                    actions={(file) => [
                        { label: '+', title: 'Stage', action: () => StageFile(file.path) },
                        { label: '↩', title: 'Discard changes', action: () => DiscardFileChanges(file.path) },
                    ]}
                    headerAction={{ label: '+', title: 'Stage all', action: () => StageAllFiles() }}
                />

                {/* Untracked */}
                <FileSection
                    title="Untracked"
                    sectionKey="untracked"
                    files={gitStatus?.untrackedFiles || []}
                    expanded={expandedSections.untracked}
                    onToggle={toggleSection}
                    theme={theme}
                    hoveredFile={hoveredFile}
                    onHover={setHoveredFile}
                    actions={(file) => [
                        { label: '+', title: 'Stage', action: () => StageFile(file.path) },
                    ]}
                    headerAction={{ label: '+', title: 'Stage all untracked', action: () => StageAllFiles() }}
                />

                {/* Recent Commits */}
                <div style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <div
                        onClick={() => toggleSection('commits')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textSecondary,
                        }}
                    >
                        <span>{expandedSections.commits ? '▼' : '▶'} Recent Commits</span>
                        <span style={{
                            backgroundColor: theme.bgHover, fontSize: 10, borderRadius: 8,
                            padding: '1px 6px',
                        }}>{commitLog.length}</span>
                    </div>
                    {expandedSections.commits && (
                        <div style={{ padding: '0 12px 4px' }}>
                            {commitLog.slice(0, 20).map(commit => (
                                <div key={commit.oid} style={{ fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{ color: '#f9e2af', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>
                                        {commit.oid.slice(0, 7)}
                                    </span>
                                    <span style={{
                                        color: theme.text, flex: 1, overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {commit.message.split('\n')[0]}
                                    </span>
                                    <span style={{ color: theme.textMuted, fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {TimeAgo(commit.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Branches */}
                <div style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <div
                        onClick={() => toggleSection('branches')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textSecondary,
                        }}
                    >
                        <span>{expandedSections.branches ? '▼' : '▶'} Branches</span>
                        <span style={{
                            backgroundColor: theme.bgHover, fontSize: 10, borderRadius: 8,
                            padding: '1px 6px',
                        }}>{branches.length}</span>
                    </div>
                    {expandedSections.branches && (
                        <div style={{ padding: '0 12px 4px' }}>
                            {branches.map(branch => (
                                <div
                                    key={branch.name}
                                    onClick={() => !branch.isRemote && !branch.isCurrentBranch && CheckoutBranch(branch.name)}
                                    style={{
                                        fontSize: 12, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6,
                                        cursor: branch.isRemote || branch.isCurrentBranch ? 'default' : 'pointer',
                                    }}
                                >
                                    <span style={{ color: branch.isCurrentBranch ? theme.accent : branch.isRemote ? theme.textMuted : theme.textSecondary }}>
                                        {branch.isCurrentBranch ? '●' : branch.isRemote ? '◌' : '○'}
                                    </span>
                                    <span style={{
                                        color: branch.isCurrentBranch ? theme.text : branch.isRemote ? theme.textMuted : theme.textSecondary,
                                        fontWeight: branch.isCurrentBranch ? 600 : 400,
                                    }}>
                                        {branch.name}
                                    </span>
                                    {branch.isCurrentBranch && (
                                        <span style={{ color: theme.textMuted, fontSize: 10, marginLeft: 'auto' }}>current</span>
                                    )}
                                    {branch.isRemote && (
                                        <span style={{ color: theme.textMuted, fontSize: 10, marginLeft: 'auto' }}>remote</span>
                                    )}
                                </div>
                            ))}
                            {/* New branch input */}
                            {showBranchInput ? (
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                    <input
                                        autoFocus
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        onKeyDown={(e) =>
                                        {
                                            if ('Enter' === e.key) handleCreateBranch();
                                            if ('Escape' === e.key) setShowBranchInput(false);
                                        }}
                                        placeholder="branch-name"
                                        style={{
                                            flex: 1, height: 22, fontSize: 11, backgroundColor: theme.bg,
                                            color: theme.text, border: `1px solid ${theme.border}`,
                                            borderRadius: 3, padding: '0 6px',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    onClick={() => setShowBranchInput(true)}
                                    style={{
                                        fontSize: 11, color: theme.accent, cursor: 'pointer',
                                        padding: '4px 0', marginTop: 4,
                                    }}
                                >
                                    + New Branch
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── File Section Component ──────────────────────────────────────

interface FileSectionProps
{
    title: string;
    sectionKey: string;
    files: GitFileStatus[];
    expanded: boolean;
    onToggle: (key: string) => void;
    theme: ThemeColors;
    hoveredFile: string | null;
    onHover: (path: string | null) => void;
    actions: (file: GitFileStatus) => { label: string; title: string; action: () => void }[];
    headerAction?: { label: string; title: string; action: () => void };
}

function FileSection({ title, sectionKey, files, expanded, onToggle, theme, hoveredFile, onHover, actions, headerAction }: FileSectionProps)
{
    if (0 === files.length)
        return null;

    return (
        <div style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textSecondary,
                }}
            >
                <span onClick={() => onToggle(sectionKey)}>
                    {expanded ? '▼' : '▶'} {title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {headerAction && (
                        <span
                            onClick={(e) => { e.stopPropagation(); headerAction.action(); }}
                            title={headerAction.title}
                            style={{
                                width: 18, height: 18, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 3, cursor: 'pointer',
                                fontSize: 13, color: theme.textSecondary,
                            }}
                        >
                            {headerAction.label}
                        </span>
                    )}
                    <span style={{
                        backgroundColor: theme.bgHover, fontSize: 10, borderRadius: 8,
                        padding: '1px 6px', color: theme.text,
                    }}>{files.length}</span>
                </div>
            </div>
            {expanded && files.map(file =>
            {
                const isHovered = hoveredFile === `${sectionKey}-${file.path}`;
                const fileName = file.path.split('/').pop() || file.path;
                const filePath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/') + 1) : '';
                const fileActions = actions(file);

                return (
                    <div
                        key={file.path}
                        onMouseEnter={() => onHover(`${sectionKey}-${file.path}`)}
                        onMouseLeave={() => onHover(null)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '3px 12px 3px 20px', fontSize: 12,
                            cursor: 'pointer', backgroundColor: isHovered ? theme.bgHover : 'transparent',
                        }}
                    >
                        <span style={{
                            fontSize: 10, fontWeight: 700, width: 14, textAlign: 'center',
                            color: STATUS_COLORS[file.status] || theme.textMuted, flexShrink: 0,
                        }}>
                            {STATUS_LETTERS[file.status] || '?'}
                        </span>
                        <span style={{
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', color: theme.text,
                        }}>
                            {fileName}
                            {'' !== filePath && (
                                <span style={{ color: theme.textMuted, fontSize: 10, marginLeft: 4 }}>{filePath}</span>
                            )}
                        </span>
                        {isHovered && (
                            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                {fileActions.map((a, i) => (
                                    <span
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); a.action(); }}
                                        title={a.title}
                                        style={{
                                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', borderRadius: 3, cursor: 'pointer',
                                            fontSize: 12, color: theme.textSecondary,
                                        }}
                                    >
                                        {a.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
