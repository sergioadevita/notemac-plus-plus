/**
 * PluginDialogViewPresenter — Generic dialog wrapper for plugin-triggered modals.
 *
 * Renders a plugin-provided dialog component with a modal overlay,
 * close on Escape, and error boundary protection.
 */

import React, { useEffect, useCallback } from 'react';
import { useNotemacStore } from '../Model/Store';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import type { ThemeColors } from '../Configs/ThemeConfig';
import { UI_ZINDEX_MODAL } from '../Commons/Constants';

interface PluginDialogProps
{
    theme: ThemeColors;
}

export function PluginDialogViewPresenter({ theme }: PluginDialogProps): React.ReactElement | null
{
    const pluginDialogComponent = useNotemacStore(state => state.pluginDialogComponent);
    const SetPluginDialogComponent = useNotemacStore(state => state.SetPluginDialogComponent);

    const handleClose = useCallback(() =>
    {
        SetPluginDialogComponent(null);
    }, [SetPluginDialogComponent]);

    const handleKeyDown = useCallback((e: KeyboardEvent) =>
    {
        if ('Escape' === e.key)
        {
            handleClose();
        }
    }, [handleClose]);

    useEffect(() =>
    {
        if (pluginDialogComponent)
        {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [pluginDialogComponent, handleKeyDown]);

    if (!pluginDialogComponent)
        return null;

    const PluginComponent = pluginDialogComponent;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: UI_ZINDEX_MODAL,
            }}
            onClick={(e) =>
            {
                if (e.target === e.currentTarget)
                    handleClose();
            }}
        >
            <div style={{
                backgroundColor: theme.bg,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                padding: 24,
                maxWidth: '80vw',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative',
            }}>
                <button
                    onClick={handleClose}
                    aria-label="Close plugin dialog"
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: theme.textMuted,
                        fontSize: 14,
                    }}
                >
                    {'\u2715'}
                </button>
                <PluginErrorBoundary pluginId="plugin-dialog">
                    <PluginComponent />
                </PluginErrorBoundary>
            </div>
        </div>
    );
}
