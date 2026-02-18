import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Generic error boundary that catches rendering errors in child components.
 * Displays a user-friendly message and a retry button instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState>
{
    constructor(props: ErrorBoundaryProps)
    {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState
    {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void
    {
        // Log to console in dev; in production this could be sent to a monitoring service
        if ('development' === import.meta.env.MODE)
            console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRetry = (): void =>
    {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode
    {
        if (this.state.hasError)
        {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 32,
                    gap: 12,
                    color: '#b0b0b0',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 13,
                    height: '100%',
                }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#e06c75' }}>
                        {this.props.fallbackMessage || 'Something went wrong'}
                    </div>
                    <div style={{ maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
                        {this.state.error?.message || 'An unexpected error occurred in this panel.'}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            marginTop: 8,
                            padding: '6px 16px',
                            backgroundColor: '#3d3d3d',
                            color: '#d4d4d4',
                            border: '1px solid #555',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                        }}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
