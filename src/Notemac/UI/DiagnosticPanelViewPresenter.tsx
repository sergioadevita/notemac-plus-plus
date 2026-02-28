import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';

interface DiagnosticPanelViewPresenterProps
{
    theme: any;
}

export const DiagnosticPanelViewPresenter: React.FC<DiagnosticPanelViewPresenterProps> = React.memo(({ theme }) =>
{
    const diagnostics = useNotemacStore(state => state.diagnostics);
    const visible = useNotemacStore(state => state.diagnosticsPanelVisible);
    const setVisible = useNotemacStore(state => state.SetDiagnosticsPanelVisible);

    if (!visible)
        return null;

    const handleClick = (lineNumber: number, column: number): void =>
    {
        const editor = GetMonacoEditor();
        if (null !== editor)
        {
            editor.setPosition({ lineNumber, column });
            editor.revealLineInCenter(lineNumber);
            editor.focus();
        }
    };

    const severityIcon: Record<string, string> =
    {
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
        hint: '💡',
    };

    const severityColor: Record<string, string> =
    {
        error: theme.error || '#f38ba8',
        warning: theme.warning || '#f9e2af',
        info: theme.accent || '#89b4fa',
        hint: theme.textMuted || '#6c7086',
    };

    const errorCount = diagnostics.filter(d => 'error' === d.severity).length;
    const warningCount = diagnostics.filter(d => 'warning' === d.severity).length;

    return (
        <div
            style={{
                borderTop: `1px solid ${theme.border}`,
                backgroundColor: theme.bgSecondary,
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '12px',
            }}
            data-testid="diagnostic-panel"
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 12px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontWeight: 600,
                }}
            >
                <span>Problems ({errorCount} errors, {warningCount} warnings)</span>
                <button
                    onClick={() => setVisible(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px' }}
                    data-testid="close-diagnostics"
                    aria-label="Close problems panel"
                >
                    ✕
                </button>
            </div>
            {0 === diagnostics.length ? (
                <div style={{ padding: '12px', color: theme.textMuted, textAlign: 'center' }}>
                    No problems detected
                </div>
            ) : (
                diagnostics.map((item, index) => (
                    <div
                        key={`${item.startLineNumber}-${item.startColumn}-${index}`}
                        onClick={() => handleClick(item.startLineNumber, item.startColumn)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            color: theme.textSecondary,
                        }}
                        data-testid={`diagnostic-item-${index}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if ('Enter' === e.key) handleClick(item.startLineNumber, item.startColumn); }}
                    >
                        <span style={{ color: severityColor[item.severity], flexShrink: 0 }}>
                            {severityIcon[item.severity]}
                        </span>
                        <span style={{ flex: 1 }}>{item.message}</span>
                        <span style={{ color: theme.textMuted, flexShrink: 0 }}>
                            [{item.source}] Ln {item.startLineNumber}, Col {item.startColumn}
                        </span>
                    </div>
                ))
            )}
        </div>
    );
});

DiagnosticPanelViewPresenter.displayName = 'DiagnosticPanelViewPresenter';
