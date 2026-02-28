import React, { useState } from 'react';
import { useNotemacStore } from '../Model/Store';
import { StashChanges, PopStash, ApplyStash, DropStash } from '../Controllers/Git/GitStashController';

interface GitStashViewPresenterProps
{
    theme: any;
}

export const GitStashViewPresenter: React.FC<GitStashViewPresenterProps> = React.memo(({ theme }) =>
{
    const stashes = useNotemacStore(state => state.stashes);
    const [isExpanded, setIsExpanded] = useState(false);
    const [stashMessage, setStashMessage] = useState('');

    const handleStash = async (): Promise<void> =>
    {
        await StashChanges('' !== stashMessage ? stashMessage : undefined);
        setStashMessage('');
    };

    return (
        <div
            style={{
                borderTop: `1px solid ${theme.border}`,
                fontSize: '12px',
            }}
            data-testid="git-stash-section"
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: theme.text,
                    fontWeight: 600,
                }}
                data-testid="stash-header"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ('Enter' === e.key) setIsExpanded(!isExpanded); }}
            >
                <span>{isExpanded ? '▾' : '▸'} Stashes ({stashes.length})</span>
            </div>

            {isExpanded && (
                <div style={{ padding: '4px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <input
                            type="text"
                            placeholder="Stash message (optional)"
                            value={stashMessage}
                            onChange={(e) => setStashMessage(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: theme.bgTertiary,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '3px',
                                outline: 'none',
                            }}
                            data-testid="stash-message-input"
                        />
                        <button
                            onClick={handleStash}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: theme.accent,
                                color: theme.accentText,
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                            }}
                            data-testid="stash-button"
                        >
                            Stash
                        </button>
                    </div>

                    {0 === stashes.length ? (
                        <div style={{ color: theme.textMuted, padding: '8px 0', textAlign: 'center' }}>
                            No stashes
                        </div>
                    ) : (
                        stashes.map((entry) => (
                            <div
                                key={entry.hash}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 0',
                                    color: theme.textSecondary,
                                }}
                                data-testid={`stash-entry-${entry.index}`}
                            >
                                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: theme.accent }}>stash@&#123;{entry.index}&#125;</span>
                                    {' '}{entry.message}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => ApplyStash(entry.index)}
                                        style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '11px' }}
                                        title="Apply"
                                        data-testid={`apply-stash-${entry.index}`}
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={() => PopStash(entry.index)}
                                        style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '11px' }}
                                        title="Pop"
                                        data-testid={`pop-stash-${entry.index}`}
                                    >
                                        Pop
                                    </button>
                                    <button
                                        onClick={() => DropStash(entry.index)}
                                        style={{ background: 'none', border: 'none', color: theme.error || '#f38ba8', cursor: 'pointer', fontSize: '11px' }}
                                        title="Drop"
                                        data-testid={`drop-stash-${entry.index}`}
                                    >
                                        Drop
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

GitStashViewPresenter.displayName = 'GitStashViewPresenter';
