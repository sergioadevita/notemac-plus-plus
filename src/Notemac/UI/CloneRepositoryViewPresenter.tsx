import { useState, useCallback, useMemo } from 'react';
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

function useStyles(theme: ThemeColors)
{
    return useMemo(() => ({
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        } as React.CSSProperties,
        modal: {
            width: 480,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            overflow: 'hidden',
        } as React.CSSProperties,
        header: {
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        } as React.CSSProperties,
        headerTitle: {
            fontSize: 14,
            fontWeight: 600,
            color: theme.text,
        } as React.CSSProperties,
        closeIcon: {
            cursor: 'pointer',
            color: theme.textMuted,
            fontSize: 18,
        } as React.CSSProperties,
        body: {
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
        } as React.CSSProperties,
        errorBox: {
            padding: '8px 12px',
            backgroundColor: '#f38ba822',
            borderRadius: 4,
            fontSize: 12,
            color: '#f38ba8',
        } as React.CSSProperties,
        warningBox: {
            padding: '8px 12px',
            backgroundColor: '#f9e2af22',
            borderRadius: 4,
            fontSize: 11,
            color: '#f9e2af',
        } as React.CSSProperties,
        fieldContainer: {
            display: 'block',
        } as React.CSSProperties,
        label: {
            fontSize: 12,
            color: theme.textSecondary,
            display: 'block',
            marginBottom: 4,
        } as React.CSSProperties,
        input: {
            width: '100%',
            height: 32,
            backgroundColor: theme.bgSecondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: '0 10px',
            fontSize: 13,
            boxSizing: 'border-box',
        } as React.CSSProperties,
        checkboxContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        } as React.CSSProperties,
        checkboxLabel: {
            fontSize: 12,
            color: theme.textSecondary,
        } as React.CSSProperties,
        authInputsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingLeft: 24,
        } as React.CSSProperties,
        authInput: {
            height: 28,
            backgroundColor: theme.bgSecondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: '0 8px',
            fontSize: 12,
            boxSizing: 'border-box',
        } as React.CSSProperties,
        progressContainer: {
            display: 'block',
        } as React.CSSProperties,
        progressText: {
            fontSize: 11,
            color: theme.textMuted,
            marginBottom: 4,
        } as React.CSSProperties,
        progressBarOuter: {
            height: 4,
            backgroundColor: theme.border,
            borderRadius: 2,
            overflow: 'hidden',
        } as React.CSSProperties,
        getProgressBarInner: (progress: number) => ({
            height: '100%',
            backgroundColor: theme.accent,
            borderRadius: 2,
            width: `${0 < progress ? progress : 30}%`,
            transition: 'width 0.3s',
        } as React.CSSProperties),
        footer: {
            padding: '12px 16px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
        } as React.CSSProperties,
        cancelButton: {
            height: 30,
            padding: '0 16px',
            backgroundColor: theme.bgHover,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
        } as React.CSSProperties,
        getCloneButton: (isDisabled: boolean) => ({
            height: 30,
            padding: '0 16px',
            backgroundColor: theme.accent,
            color: theme.accentText,
            border: 'none',
            borderRadius: 4,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            opacity: isDisabled ? 0.5 : 1,
        } as React.CSSProperties),
    }), [theme]);
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
                const dirHandle = await window.showDirectoryPicker!({ mode: 'readwrite' });
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
            // CloneRepository sets its own error state in the store via SetRepoInitialized(false)
        }
    }, [repoUrl, useCustomAuth, username, token, gitCredentials, cloneToBrowser, canUseRealFs, backend, workspaceName, handleClose]);

    const styles = useStyles(theme);

    return (
        <div
            onClick={handleClose}
            style={styles.overlay}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={styles.modal}
            >
                {/* Header */}
                <div style={styles.header}>
                    <span style={styles.headerTitle}>Clone Repository</span>
                    <span
                        onClick={handleClose}
                        style={styles.closeIcon}
                    >✕</span>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {/* Error */}
                    {null !== gitOperationError && (
                        <div style={styles.errorBox}>
                            {gitOperationError}
                        </div>
                    )}

                    {/* URL */}
                    <div style={styles.fieldContainer}>
                        <label style={styles.label}>
                            Repository URL
                        </label>
                        <input
                            autoFocus
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            style={styles.input}
                        />
                    </div>

                    {/* Destination toggle */}
                    {canUseRealFs && (
                        <div style={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                checked={cloneToBrowser}
                                onChange={(e) => setCloneToBrowser(e.target.checked)}
                                id="clone-to-browser"
                            />
                            <label htmlFor="clone-to-browser" style={styles.checkboxLabel}>
                                Clone to browser workspace (stored in browser only)
                            </label>
                        </div>
                    )}

                    {/* Browser workspace name */}
                    {(cloneToBrowser || !canUseRealFs) && (
                        <div style={styles.fieldContainer}>
                            <label style={styles.label}>
                                Workspace Name
                            </label>
                            <input
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder={repoUrl.split('/').pop()?.replace('.git', '') || 'my-repo'}
                                style={styles.input}
                            />
                        </div>
                    )}

                    {!canUseRealFs && (
                        <div style={styles.warningBox}>
                            ⚠ Your browser doesn't support the File System Access API. The repository will be cloned to browser storage. Files may be lost if you clear browser data.
                        </div>
                    )}

                    {/* Authentication */}
                    <div style={styles.fieldContainer}>
                        <div style={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                checked={useCustomAuth}
                                onChange={(e) => setUseCustomAuth(e.target.checked)}
                                id="custom-auth"
                            />
                            <label htmlFor="custom-auth" style={styles.checkboxLabel}>
                                {null !== gitCredentials ? 'Use different credentials' : 'Authenticate'}
                            </label>
                        </div>
                        {useCustomAuth && (
                            <div style={styles.authInputsContainer}>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    style={styles.authInput}
                                />
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Personal Access Token"
                                    style={styles.authInput}
                                />
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {isGitOperationInProgress && (
                        <div style={styles.progressContainer}>
                            <div style={styles.progressText}>
                                Cloning... {0 < gitOperationProgress ? `${gitOperationProgress}%` : ''}
                            </div>
                            <div style={styles.progressBarOuter}>
                                <div style={styles.getProgressBarInner(gitOperationProgress)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button
                        onClick={handleClose}
                        style={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={0 === repoUrl.trim().length || isGitOperationInProgress}
                        style={styles.getCloneButton(0 === repoUrl.trim().length || isGitOperationInProgress)}
                    >
                        {canUseRealFs && !cloneToBrowser ? 'Choose Folder & Clone' : 'Clone'}
                    </button>
                </div>
            </div>
        </div>
    );
}
