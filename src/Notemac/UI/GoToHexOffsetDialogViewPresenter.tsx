import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import { GoToOffset } from '../Controllers/HexEditorController';
import { useFocusTrap } from './hooks/useFocusTrap';

interface GoToHexOffsetDialogProps
{
    theme: ThemeColors;
}

export function GoToHexOffsetDialog({ theme }: GoToHexOffsetDialogProps)
{
    const { tabs, activeTabId } = useNotemacStore();
    const [offsetInput, setOffsetInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const activeTab = tabs.find(t => t.id === activeTabId);
    const fileSize = activeTab ? activeTab.content.length : 0;
    const fileSizeHex = fileSize.toString(16).toUpperCase();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const setShowGoToHexOffset = useNotemacStore(s => s.setShowGoToHexOffset);

    const closeDialog = useCallback(() =>
    {
        setShowGoToHexOffset(false);
    }, [setShowGoToHexOffset]);

    useFocusTrap(dialogRef, true, closeDialog);

    const handleGo = useCallback(() => {
        setErrorMessage('');

        if ('' === offsetInput.trim())
        {
            setErrorMessage('Please enter an offset value');
            return;
        }

        const result = GoToOffset(offsetInput);
        if (!result.success)
        {
            setErrorMessage(result.error || 'Failed to navigate to offset');
            return;
        }

        closeDialog();
    }, [offsetInput, closeDialog]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if ('Enter' === e.key)
        {
            handleGo();
        }
        if ('Escape' === e.key)
        {
            closeDialog();
        }
    }, [handleGo, closeDialog]);

    const styles = useMemo(() => ({
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            zIndex: 1000,
        },
        dialog: {
            backgroundColor: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 20,
            width: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        title: {
            color: theme.text,
            fontSize: 16,
            marginBottom: 12,
            fontWeight: 600,
        },
        helpText: {
            color: theme.textSecondary,
            fontSize: 12,
            marginBottom: 12,
        },
        inputContainer: {
            display: 'flex' as const,
            gap: 8,
            marginBottom: 12,
        },
        input: {
            flex: 1,
            height: 32,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: '0 12px',
            fontSize: 14,
            fontFamily: 'monospace',
        },
        button: {
            backgroundColor: theme.accent,
            color: theme.accentText,
            border: 'none',
            borderRadius: 6,
            padding: '0 20px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
        },
        fileInfo: {
            color: theme.textSecondary,
            fontSize: 12,
            marginBottom: 12,
            fontFamily: 'monospace',
        },
        errorText: {
            color: '#ff6b6b',
            fontSize: 12,
            marginBottom: 12,
        },
        buttonContainer: {
            display: 'flex' as const,
            gap: 8,
            justifyContent: 'flex-end' as const,
        },
        cancelButton: {
            backgroundColor: theme.bgSecondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: '0 20px',
            height: 32,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
        },
    }), [theme]);

    return (
        <div
            style={styles.overlay as React.CSSProperties}
            onClick={closeDialog}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="goto-hex-offset-title"
                onClick={(e) => e.stopPropagation()}
                style={styles.dialog as React.CSSProperties}
            >
                <h3 id="goto-hex-offset-title" style={styles.title as React.CSSProperties}>
                    Go to Hex Offset
                </h3>
                <div style={styles.helpText as React.CSSProperties}>
                    Enter offset in decimal or hex (0x prefix)
                </div>
                <div style={styles.inputContainer as React.CSSProperties}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={offsetInput}
                        onChange={(e) => setOffsetInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="0 or 0x0"
                        style={styles.input as React.CSSProperties}
                    />
                    <button
                        onClick={handleGo}
                        style={styles.button as React.CSSProperties}
                    >
                        Go
                    </button>
                </div>
                <div style={styles.fileInfo as React.CSSProperties}>
                    File size: {fileSize} bytes (0x{fileSizeHex})
                </div>
                {'' !== errorMessage && (
                    <div style={styles.errorText as React.CSSProperties}>
                        {errorMessage}
                    </div>
                )}
                <div style={styles.buttonContainer as React.CSSProperties}>
                    <button
                        onClick={closeDialog}
                        style={styles.cancelButton as React.CSSProperties}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
