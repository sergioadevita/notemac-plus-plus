import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { NavigateToBreadcrumb } from '../Controllers/BreadcrumbController';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';
import { UI_BREADCRUMB_HEIGHT, UI_BREADCRUMB_SEPARATOR } from '../Commons/Constants';

interface BreadcrumbViewPresenterProps
{
    theme: any;
}

export const BreadcrumbViewPresenter: React.FC<BreadcrumbViewPresenterProps> = React.memo(({ theme }) =>
{
    const breadcrumbs = useNotemacStore(state => state.breadcrumbs);
    const breadcrumbsEnabled = useNotemacStore(state => state.settings.breadcrumbsEnabled);

    if (!breadcrumbsEnabled || 0 === breadcrumbs.length)
        return null;

    const handleClick = (index: number): void =>
    {
        const position = NavigateToBreadcrumb(index);
        if (null !== position)
        {
            const editor = GetMonacoEditor();
            if (null !== editor)
            {
                editor.setPosition(position);
                editor.revealLineInCenter(position.lineNumber);
                editor.focus();
            }
        }
    };

    const containerStyle: React.CSSProperties =
    {
        height: `${UI_BREADCRUMB_HEIGHT}px`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: '12px',
        color: theme.textSecondary,
        backgroundColor: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    };

    const itemStyle: React.CSSProperties =
    {
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
    };

    const separatorStyle: React.CSSProperties =
    {
        margin: '0 2px',
        color: theme.textMuted,
        userSelect: 'none',
    };

    return (
        <div style={containerStyle} data-testid="breadcrumb-bar" role="navigation" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                    {0 < index && (
                        <span style={separatorStyle}>{UI_BREADCRUMB_SEPARATOR.trim()}</span>
                    )}
                    <span
                        style={{
                            ...itemStyle,
                            color: 'symbol' === item.kind ? theme.accent : theme.textSecondary,
                            fontWeight: 'symbol' === item.kind ? 600 : 400,
                        }}
                        onClick={() => handleClick(index)}
                        data-testid={`breadcrumb-item-${index}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if ('Enter' === e.key) handleClick(index); }}
                    >
                        {item.label}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
});

BreadcrumbViewPresenter.displayName = 'BreadcrumbViewPresenter';
