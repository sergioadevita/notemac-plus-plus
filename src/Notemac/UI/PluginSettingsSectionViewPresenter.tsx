/**
 * PluginSettingsSectionViewPresenter — Renders plugin-registered settings sections.
 *
 * Renders plugin-provided settings sections as additional areas in the
 * Settings dialog. Each section is wrapped in an error boundary.
 */

import React from 'react';
import { useNotemacStore } from '../Model/Store';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import type { ThemeColors } from '../Configs/ThemeConfig';

interface PluginSettingsSectionProps
{
    theme: ThemeColors;
}

export function PluginSettingsSectionViewPresenter({ theme }: PluginSettingsSectionProps): React.ReactElement | null
{
    const pluginSettingsSections = useNotemacStore(state => state.pluginSettingsSections);

    if (0 === pluginSettingsSections.length)
        return null;

    return (
        <div>
            {pluginSettingsSections.map(section =>
            {
                const PluginComponent = section.component;
                return (
                    <div key={section.id} style={{ marginBottom: 16 }}>
                        <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.text,
                            marginBottom: 8,
                            paddingBottom: 4,
                            borderBottom: `1px solid ${theme.border}`,
                        }}>
                            {section.label}
                        </div>
                        <PluginErrorBoundary
                            pluginId={section.pluginId}
                            pluginName={section.label}
                        >
                            <PluginComponent />
                        </PluginErrorBoundary>
                    </div>
                );
            })}
        </div>
    );
}
