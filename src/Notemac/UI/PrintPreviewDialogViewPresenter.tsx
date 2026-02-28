import React, { useMemo } from 'react';
import { useNotemacStore } from '../Model/Store';
import { GetPrintPreviewHTML, PrintCurrentDocument } from '../Controllers/PrintController';

interface PrintPreviewDialogViewPresenterProps
{
    theme: any;
}

export const PrintPreviewDialogViewPresenter: React.FC<PrintPreviewDialogViewPresenterProps> = React.memo(({ theme }) =>
{
    const show = useNotemacStore(state => state.showPrintPreview);
    const setShow = useNotemacStore(state => state.setShowPrintPreview);

    const previewHTML = useMemo(() =>
    {
        if (!show) return '';
        return GetPrintPreviewHTML();
    }, [show]);

    if (!show)
        return null;

    const handlePrint = (): void =>
    {
        PrintCurrentDocument();
        setShow(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
            }}
            onClick={() => setShow(false)}
            data-testid="print-preview-overlay"
        >
            <div
                style={{
                    width: '700px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.bg,
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.text,
                    }}
                >
                    <span style={{ fontWeight: 600 }}>Print Preview</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handlePrint}
                            style={{
                                padding: '4px 16px',
                                backgroundColor: theme.accent,
                                color: theme.accentText,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                            data-testid="print-button"
                        >
                            Print
                        </button>
                        <button
                            onClick={() => setShow(false)}
                            style={{
                                padding: '4px 16px',
                                backgroundColor: theme.bgTertiary,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                            data-testid="cancel-print-button"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '16px',
                        backgroundColor: '#fff',
                    }}
                >
                    <iframe
                        srcDoc={previewHTML}
                        style={{
                            width: '100%',
                            minHeight: '400px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }}
                        title="Print Preview"
                        data-testid="print-preview-iframe"
                    />
                </div>
            </div>
        </div>
    );
});

PrintPreviewDialogViewPresenter.displayName = 'PrintPreviewDialogViewPresenter';
