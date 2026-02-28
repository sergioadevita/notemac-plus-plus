/**
 * PluginSidebarPanelViewPresenter — Dynamic sidebar panel renderer for plugins.
 *
 * Receives the active plugin panel ID from the store, looks up the registered
 * React component, wraps it in PluginErrorBoundary, and renders it.
 */

import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import type { ThemeColors } from '../Configs/ThemeConfig';

interface PluginSidebarPanelProps
{
    panelId: string;
    theme: ThemeColors;
}

export function PluginSidebarPanelViewPresenter({ panelId, theme }: PluginSidebarPanelProps): React.ReactElement | null
{
    const pluginSidebarPanels = useNotemacStore(state => state.pluginSidebarPanels);

    const panel = pluginSidebarPanels.find(p => p.id === panelId);

    if (!panel)
    {
        return (
            <div style={{
                padding: 16,
                color: theme.textMuted,
                fontSize: 12,
                textAlign: 'center',
            }}>
                Plugin panel not found
            </div>
        );
    }

    const PluginComponent = panel.component;

    return (
        <PluginErrorBoundary
            pluginId={panel.pluginId}
            pluginName={panel.label}
        >
            <div style={{ flex: 1, overflow: 'auto' }}>
                <PluginComponent />
            </div>
        </PluginErrorBoundary>
    );
}
