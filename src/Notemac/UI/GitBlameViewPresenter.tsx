import React from 'react';
import { useNotemacStore } from '../Model/Store';

interface GitBlameViewPresenterProps
{
    theme: any;
}

export const GitBlameViewPresenter: React.FC<GitBlameViewPresenterProps> = React.memo(({ theme }) =>
{
    const blameData = useNotemacStore(state => state.blameData);
    const blameVisible = useNotemacStore(state => state.blameVisible);

    if (!blameVisible || 0 === blameData.length)
        return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '280px',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 5,
                fontSize: '11px',
                fontFamily: "'SF Mono', 'Menlo', monospace",
            }}
            data-testid="git-blame-gutter"
        >
            {blameData.map((info) => (
                <div
                    key={info.line}
                    style={{
                        height: '19px',
                        lineHeight: '19px',
                        padding: '0 8px',
                        color: theme.textMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    data-testid={`blame-line-${info.line}`}
                    title={`${info.author} • ${info.date} • ${info.commitHash}\n${info.commitMessage}`}
                >
                    {info.commitHash} {info.author} {info.date}
                </div>
            ))}
        </div>
    );
});

GitBlameViewPresenter.displayName = 'GitBlameViewPresenter';
