import React, { useState, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { GitCredentials } from "../Commons/Types";
import { CloneRepository } from "../Controllers/GitController";
import { InitGitForWorkspace } from "../Controllers/GitController";
import { DetectFsBackend, CreateLightningFsAdapter, RegisterDirHandle } from '../../Shared/Git/GitFileSystemAdapter';
import { generateId } from '../../Shared/Helpers/IdHelpers';

interface CloneRepositoryProps
{
    theme: ThemeColors;
}

export function CloneRepositoryViewPresenter({ theme }: CloneRepositoryProps)
{
    const setShowCloneDialog = useNotemacStore(s => s.setShowCloneDialog);
    const gitCredentials = useNotemacStore(s => s.gitCredentials);
    const isGitOperationInProgress = useNotemacStore(s => s.isGitOperationInProgress);
    const gitOperationProgress = useNotemacStore(s => s.gitOperationProgress);
    const gitOperationError = useNotemacStore(s => s.gitOperationError);

    const [repoUrl, setRepoUrl] = useState('');
    const [useCustomAuth, setUseCustomAuth] = useState(false);
    const [username, setUsername] = useState(gitCredentials?.username || '');
    const [token, setToken] = useState(gitCredentials?.token || '');
    const [cloneToBrowser, setCloneToBrowser] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');

    const backend = DetectFsBackend();
    const canUseRealFs = 'webfs' === backend || 'electron' === backend;

    const handleClose = useCallback(() =>
    {
        setShowCloneDialog(false);
    }, [setShowCloneDialog]);

    const handleClone = useCallback(async () =>
    {
        if (0 === repoUrl.trim().length)
            return;

        const store = useNotemacStore.getState();
        const credentials: GitCredentials | null = useCustomAuth
            ? { type: 'token', username, token }
            : gitCredentials;

        try
        {
            if (cloneToBrowser || !canUseRealFs)
            {
                // Clone to browser workspace (lightning-fs)
                const wsId = generateId();
                const wsName = workspaceName || repoUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo';
                const fs = CreateLightningFsAdapter(wsId);

                await CloneRepository(repoUrl.trim(), fs, '/', credentials);

                // Register as browser workspace
                store.AddBrowserWorkspace({
                    id: wsId,
                    name: wsName,
                    repoUrl: repoUrl.trim(),
                    createdAt: Date.now(),
                    lastOpenedAt: Date.now(),
                });

                store.SetIsBrowserWorkspace(true);
                store.setWorkspacePath(wsName);
                store.setSidebarPanel('explorer');
            }
            else if ('webfs' === backend)
            {
                // Clone to real folder via File System Access API
                const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                const { CreateWebFsAdapter } = await import('../../Shared/Git/GitFileSystemAdapter');
                const fs = CreateWebFsAdapter(dirHandle);

                RegisterDirHandle(dirHandle.name, dirHandle);

                await CloneRepository(repoUrl.trim(), fs, '/', credentials);

                store.setWorkspacePath(dirHandle.name);
                store.setSidebarPanel('explorer');
            }

            await InitGitForWorkspace();
            handleClose();
        }
        catch
        {
            // Error is set in store by CloneRepository
        }
    }, [repoUrl, useCustomAuth, username, token, gitCredentials, cloneToBrowser, canUseRealFs, backend, workspaceName, handleClose]);

    return (
        <div
            onClick={handleClose}
            style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 480, backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                    borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '12px 16px', borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Clone Repository</span>
                    <span
                        onClick={handleClose}
                        style={{ cursor: 'pointer', color: theme.textMuted, fontSize: 18 }}
                    >✕</span>
                </div>

                {/* Body */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Error */}
                    {null !== gitOperationError && (
                        <div style={{
                            padding: '8px 12px', backgroundColor: '#f38ba822', borderRadius: 4,
                            fontSize: 12, color: '#f38ba8',
                        }}>
                            {gitOperationError}
                        </div>
                    )}

                    {/* URL */}
                    <div>
                        <label style={{ fontSize: 12, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>
                            Repository URL
                        </label>
                        <input
                            autoFocus
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            style={{
                                width: '100%', height: 32, backgroundColor: theme.bgSecondary, color: theme.text,
                                border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0 10px',
                                fontSize: 13, boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Destination toggle */}
                    {canUseRealFs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="checkbox"
                                checked={cloneToBrowser}
                                onChange={(e) => setCloneToBrowser(e.target.checked)}
                                id="clone-to-browser"
                            />
                            <label htmlFor="clone-to-browser" style={{ fontSize: 12, color: theme.textSecondary }}>
                                Clone to browser workspace (stored in browser only)
                            </label>
                        </div>
                    )}

                    {/* Browser workspace name */}
                    {(cloneToBrowser || !canUseRealFs) && (
                        <div>
                            <label style={{ fontSize: 12, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>
                                Workspace Name
                            </label>
                            <input
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder={repoUrl.split('/').pop()?.replace('.git', '') || 'my-repo'}
                                style={{
                                    width: '100%', height: 32, backgroundColor: theme.bgSecondary, color: theme.text,
                                    border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0 10px',
                                    fontSize: 13, boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    )}

                    {!canUseRealFs && (
                        <div style={{
                            padding: '8px 12px', backgroundColor: '#f9e2af22', borderRadius: 4,
                            fontSize: 11, color: '#f9e2af',
                        }}>
                            ⚠ Your browser doesn't support the File System Access API. The repository will be cloned to browser storage. Files may be lost if you clear browser data.
                        </div>
                    )}

                    {/* Authentication */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <input
                                type="checkbox"
                                checked={useCustomAuth}
                                onChange={(e) => setUseCustomAuth(e.target.checked)}
                                id="custom-auth"
                            />
                            <label htmlFor="custom-auth" style={{ fontSize: 12, color: theme.textSecondary }}>
                                {null !== gitCredentials ? 'Use different credentials' : 'Authenticate'}
                            </label>
                        </div>
                        {useCustomAuth && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    style={{
                                        height: 28, backgroundColor: theme.bgSecondary, color: theme.text,
                                        border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0 8px',
                                        fontSize: 12, boxSizing: 'border-box',
                                    }}
                                />
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Personal Access Token"
                                    style={{
                                        height: 28, backgroundColor: theme.bgSecondary, color: theme.text,
                                        border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0 8px',
                                        fontSize: 12, boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {isGitOperationInProgress && (
                        <div>
                            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                                Cloning... {0 < gitOperationProgress ? `${gitOperationProgress}%` : ''}
                            </div>
                            <div style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', backgroundColor: theme.accent, borderRadius: 2,
                                    width: `${0 < gitOperationProgress ? gitOperationProgress : 30}%`,
                                    transition: 'width 0.3s',
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 16px', borderTop: `1px solid ${theme.border}`,
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            height: 30, padding: '0 16px', backgroundColor: theme.bgHover, color: theme.text,
                            border: `1px solid ${theme.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 12,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={0 === repoUrl.trim().length || isGitOperationInProgress}
                        style={{
                            height: 30, padding: '0 16px', backgroundColor: theme.accent, color: theme.accentText,
                            border: 'none', borderRadius: 4, cursor: 0 === repoUrl.trim().length ? 'not-allowed' : 'pointer',
                            fontSize: 12, fontWeight: 600, opacity: 0 === repoUrl.trim().length ? 0.5 : 1,
                        }}
                    >
                        {canUseRealFs && !cloneToBrowser ? 'Choose Folder & Clone' : 'Clone'}
                    </button>
                </div>
            </div>
        </div>
    );
}
