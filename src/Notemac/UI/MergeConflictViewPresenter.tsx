import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { AcceptCurrent, AcceptIncoming, AcceptBoth } from '../Controllers/Git/GitMergeController';

interface MergeConflictViewPresenterProps
{
    theme: any;
}

export const MergeConflictViewPresenter: React.FC<MergeConflictViewPresenterProps> = React.memo(({ theme }) =>
{
    const conflicts = useNotemacStore(state => state.conflicts);

    if (0 === conflicts.length)
        return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '8px',
                zIndex: 10,
            }}
            data-testid="merge-conflict-controls"
        >
            <div
                style={{
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: theme.text,
                }}
            >
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                    {conflicts.length} merge conflict{1 !== conflicts.length ? 's' : ''} detected
                </div>
                {conflicts.map((conflict, index) => (
                    <div
                        key={`conflict-${conflict.startLine}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 0',
                            borderTop: 0 < index ? `1px solid ${theme.border}` : 'none',
                        }}
                        data-testid={`conflict-${index}`}
                    >
                        <span style={{ color: theme.textMuted, flexShrink: 0 }}>
                            Line {conflict.startLine}:
                        </span>
                        <button
                            onClick={() => AcceptCurrent(conflict)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#51cf66',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                            }}
                            data-testid={`accept-current-${index}`}
                        >
                            Accept Current
                        </button>
                        <button
                            onClick={() => AcceptIncoming(conflict)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#339af0',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                            }}
                            data-testid={`accept-incoming-${index}`}
                        >
                            Accept Incoming
                        </button>
                        <button
                            onClick={() => AcceptBoth(conflict)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: theme.accent,
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                            }}
                            data-testid={`accept-both-${index}`}
                        >
                            Accept Both
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});

MergeConflictViewPresenter.displayName = 'MergeConflictViewPresenter';
