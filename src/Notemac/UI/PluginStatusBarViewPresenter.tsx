/**
 * PluginStatusBarViewPresenter — Renders plugin-registered status bar items.
 *
 * Maps over pluginStatusBarItems from the store, renders each item's component
 * wrapped in an error boundary, supporting left/right positioning via priority.
 */

import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { PluginErrorBoundary } from './PluginErrorBoundary';

interface PluginStatusBarProps
{
    position: 'left' | 'right';
}

export function PluginStatusBarViewPresenter({ position }: PluginStatusBarProps): React.ReactElement | null
{
    const pluginStatusBarItems = useNotemacStore(state => state.pluginStatusBarItems);

    const items = pluginStatusBarItems
        .filter(item => item.position === position)
        .sort((a, b) => a.priority - b.priority);

    if (0 === items.length)
        return null;

    return (
        <>
            {items.map(item =>
            {
                const PluginComponent = item.component;
                return (
                    <PluginErrorBoundary
                        key={item.id}
                        pluginId={item.pluginId}
                        fallbackStyle={{ padding: '0 4px', fontSize: 10 }}
                    >
                        <PluginComponent />
                    </PluginErrorBoundary>
                );
            })}
        </>
    );
}
