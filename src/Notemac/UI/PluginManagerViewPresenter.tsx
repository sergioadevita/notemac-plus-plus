/**
 * PluginManagerViewPresenter — Full plugin manager dialog.
 *
 * Features:
 * - Installed tab: List of installed plugins with enable/disable, reload, uninstall
 * - Browse tab: Search + grid of available plugins from the registry
 * - Styled with existing dialog patterns (overlay, glass bg, close button)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import type { PluginRegistryEntry } from '../Commons/PluginTypes';
import {
    ActivatePlugin,
    DeactivatePlugin,
    ReloadPlugin,
    GetPluginDirectoryHandle,
} from '../Controllers/PluginController';
import {
    InstallPlugin,
    UninstallPlugin,
    SearchRegistry,
} from '../Services/PluginRegistryService';
import { UI_ZINDEX_MODAL } from '../Commons/Constants';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

interface PluginManagerProps
{
    theme: ThemeColors;
}

type ManagerTab = 'installed' | 'browse';

export function PluginManagerViewPresenter({ theme }: PluginManagerProps): React.ReactElement
{
    const {
        pluginInstances,
        pluginRegistryEntries,
        pluginRegistryLoading,
        SetShowPluginManager,
        SetPluginInstances,
    } = useNotemacStore();

    const [activeTab, setActiveTab] = useState<ManagerTab>('installed');
    const [searchQuery, setSearchQuery] = useState('');
    const [installingId, setInstallingId] = useState<string | null>(null);

    const handleClose = useCallback(() =>
    {
        SetShowPluginManager(false);
    }, [SetShowPluginManager]);

    useEffect(() =>
    {
        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if ('Escape' === e.key)
                handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    const handleTogglePlugin = async (pluginId: string, isActive: boolean) =>
    {
        if (isActive)
        {
            await DeactivatePlugin(pluginId);
        }
        else
        {
            await ActivatePlugin(pluginId);
        }
    };

    const handleReload = async (pluginId: string) =>
    {
        await ReloadPlugin(pluginId);
    };

    const handleUninstall = async (pluginId: string) =>
    {
        const dirHandle = GetPluginDirectoryHandle();
        if (!dirHandle)
            return;

        await DeactivatePlugin(pluginId);
        const success = await UninstallPlugin(pluginId, dirHandle);

        if (success)
        {
            const updated = pluginInstances.filter(p => p.id !== pluginId);
            SetPluginInstances(updated);
            Dispatch(NOTEMAC_EVENTS.PLUGIN_UNINSTALLED, { pluginId });
        }
    };

    const handleInstall = async (entry: PluginRegistryEntry) =>
    {
        const dirHandle = GetPluginDirectoryHandle();
        if (!dirHandle)
            return;

        setInstallingId(entry.id);

        try
        {
            const manifest = await InstallPlugin(entry, dirHandle);
            if (manifest)
            {
                const newInstance = {
                    id: manifest.id,
                    manifest,
                    status: 'inactive' as const,
                    context: null,
                    module: null,
                };

                SetPluginInstances([...pluginInstances, newInstance]);
                Dispatch(NOTEMAC_EVENTS.PLUGIN_INSTALLED, { pluginId: manifest.id });
            }
        }
        catch
        {
            // Install failed
        }
        finally
        {
            setInstallingId(null);
        }
    };

    const filteredRegistry = SearchRegistry(searchQuery, pluginRegistryEntries);
    const installedIds = new Set(pluginInstances.map(p => p.id));

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
                width: 640,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${theme.border}`,
                }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                        Plugin Manager
                    </div>
                    <button
                        onClick={handleClose}
                        aria-label="Close plugin manager"
                        style={{
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: theme.textMuted,
                            fontSize: 16,
                        }}
                    >
                        {'\u2715'}
                    </button>
                </div>

                {/* Tab bar */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${theme.border}`,
                    padding: '0 20px',
                }}>
                    {(['installed', 'browse'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: activeTab === tab ? theme.accent : theme.textSecondary,
                                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
                                fontSize: 13,
                                fontWeight: activeTab === tab ? 600 : 400,
                            }}
                        >
                            {'installed' === tab ? `Installed (${pluginInstances.length})` : 'Browse'}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                    {'installed' === activeTab && (
                        <InstalledTab
                            theme={theme}
                            instances={pluginInstances}
                            onToggle={handleTogglePlugin}
                            onReload={handleReload}
                            onUninstall={handleUninstall}
                        />
                    )}

                    {'browse' === activeTab && (
                        <BrowseTab
                            theme={theme}
                            entries={filteredRegistry}
                            loading={pluginRegistryLoading}
                            installedIds={installedIds}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onInstall={handleInstall}
                            installingId={installingId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Installed Tab ─────────────────────────────────────────────────

function InstalledTab({ theme, instances, onToggle, onReload, onUninstall }: {
    theme: ThemeColors;
    instances: { id: string; manifest: { name: string; version: string; author: string; description: string }; status: string; error?: string }[];
    onToggle: (id: string, isActive: boolean) => void;
    onReload: (id: string) => void;
    onUninstall: (id: string) => void;
}): React.ReactElement
{
    if (0 === instances.length)
    {
        return (
            <div style={{
                textAlign: 'center',
                padding: 40,
                color: theme.textMuted,
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{'\ud83e\udde9'}</div>
                <div style={{ fontSize: 14 }}>No plugins installed</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Browse the registry to find and install plugins.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {instances.map(instance => (
                <div
                    key={instance.id}
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.bgSecondary,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
                                    {instance.manifest.name}
                                </span>
                                <span style={{ fontSize: 11, color: theme.textMuted }}>
                                    v{instance.manifest.version}
                                </span>
                                <span style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    borderRadius: 8,
                                    backgroundColor:
                                        'active' === instance.status ? 'rgba(68, 255, 68, 0.2)' :
                                        'error' === instance.status ? 'rgba(255, 68, 68, 0.2)' :
                                        'rgba(128, 128, 128, 0.2)',
                                    color:
                                        'active' === instance.status ? '#44ff44' :
                                        'error' === instance.status ? '#ff4444' :
                                        theme.textMuted,
                                }}>
                                    {instance.status}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                                by {instance.manifest.author}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                                {instance.manifest.description}
                            </div>
                            {instance.error && (
                                <div style={{ fontSize: 11, color: '#ff4444', marginTop: 4 }}>
                                    Error: {instance.error}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                                onClick={() => onToggle(instance.id, 'active' === instance.status)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: 'transparent',
                                    color: theme.text,
                                    cursor: 'pointer',
                                }}
                            >
                                {'active' === instance.status ? 'Disable' : 'Enable'}
                            </button>
                            <button
                                onClick={() => onReload(instance.id)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: 'transparent',
                                    color: theme.text,
                                    cursor: 'pointer',
                                }}
                            >
                                Reload
                            </button>
                            <button
                                onClick={() => onUninstall(instance.id)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: '1px solid rgba(255, 68, 68, 0.3)',
                                    backgroundColor: 'transparent',
                                    color: '#ff4444',
                                    cursor: 'pointer',
                                }}
                            >
                                Uninstall
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Browse Tab ────────────────────────────────────────────────────

function BrowseTab({ theme, entries, loading, installedIds, searchQuery, onSearchChange, onInstall, installingId }: {
    theme: ThemeColors;
    entries: PluginRegistryEntry[];
    loading: boolean;
    installedIds: Set<string>;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onInstall: (entry: PluginRegistryEntry) => void;
    installingId: string | null;
}): React.ReactElement
{
    return (
        <div>
            {/* Search bar */}
            <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                    width: '100%',
                    height: 32,
                    backgroundColor: theme.bgSecondary,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    padding: '0 12px',
                    fontSize: 13,
                    marginBottom: 16,
                    boxSizing: 'border-box',
                }}
            />

            {loading && (
                <div style={{ textAlign: 'center', padding: 20, color: theme.textMuted, fontSize: 13 }}>
                    Loading registry...
                </div>
            )}

            {!loading && 0 === entries.length && (
                <div style={{ textAlign: 'center', padding: 20, color: theme.textMuted, fontSize: 13 }}>
                    No plugins found
                </div>
            )}

            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {entries.map(entry =>
                    {
                        const isInstalled = installedIds.has(entry.id);
                        const isInstalling = installingId === entry.id;

                        return (
                            <div
                                key={entry.id}
                                style={{
                                    padding: 12,
                                    borderRadius: 8,
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: theme.bgSecondary,
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 2 }}>
                                    {entry.name}
                                </div>
                                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                                    by {entry.author} &middot; v{entry.version}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: theme.textSecondary,
                                    marginBottom: 8,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {entry.description}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                                        {'\u2b50'} {entry.stars} &middot; {'\u2b07'} {entry.downloads.toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => !isInstalled && !isInstalling && onInstall(entry)}
                                        disabled={isInstalled || isInstalling}
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: 11,
                                            borderRadius: 4,
                                            border: 'none',
                                            backgroundColor: isInstalled ? theme.bgHover : theme.accent,
                                            color: isInstalled ? theme.textMuted : theme.accentText,
                                            cursor: isInstalled || isInstalling ? 'default' : 'pointer',
                                            opacity: isInstalling ? 0.6 : 1,
                                        }}
                                    >
                                        {isInstalled ? 'Installed' : isInstalling ? 'Installing...' : 'Install'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
