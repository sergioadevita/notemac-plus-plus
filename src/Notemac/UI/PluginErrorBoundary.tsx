/**
 * PluginErrorBoundary — React error boundary for plugin-provided components.
 *
 * Catches render errors from plugin components and shows a fallback UI
 * with the plugin name, error message, and a "Disable Plugin" button.
 */

import React from 'react';
import { DisablePlugin } from '../Controllers/PluginController';

interface PluginErrorBoundaryProps
{
    pluginId: string;
    pluginName?: string;
    children: React.ReactNode;
    fallbackStyle?: React.CSSProperties;
}

interface PluginErrorBoundaryState
{
    hasError: boolean;
    error: Error | null;
}

export class PluginErrorBoundary extends React.Component<PluginErrorBoundaryProps, PluginErrorBoundaryState>
{
    constructor(props: PluginErrorBoundaryProps)
    {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): PluginErrorBoundaryState
    {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
    {
        // Log in dev mode
        if ('development' === (import.meta as unknown as { env: { MODE: string } }).env?.MODE)
        {
            // eslint-disable-next-line no-console
            console.error(`[Plugin Error: ${this.props.pluginId}]`, error, errorInfo);
        }
    }

    handleDisablePlugin = (): void =>
    {
        DisablePlugin(this.props.pluginId);
        this.setState({ hasError: false, error: null });
    };

    render(): React.ReactNode
    {
        if (this.state.hasError)
        {
            return (
                <div style={{
                    padding: 12,
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: 6,
                    fontSize: 12,
                    ...this.props.fallbackStyle,
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#ff4444' }}>
                        Plugin Error: {this.props.pluginName || this.props.pluginId}
                    </div>
                    <div style={{ color: '#ccc', marginBottom: 8, wordBreak: 'break-word' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </div>
                    <button
                        onClick={this.handleDisablePlugin}
                        style={{
                            backgroundColor: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        Disable Plugin
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
