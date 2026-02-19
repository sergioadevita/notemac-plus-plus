import { useState, useMemo, useCallback, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetFileAtHead } from "../Controllers/GitController";
import { UI_ZINDEX_MODAL } from "../Commons/Constants";

interface DiffViewerProps
{
    theme: ThemeColors;
}

function useStyles(theme: ThemeColors)
{
    return useMemo(() => ({
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: UI_ZINDEX_MODAL,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        } as React.CSSProperties,
        modal: {
            width: '90vw',
            height: '85vh',
            backgroundColor: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        } as React.CSSProperties,
        header: {
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
        } as React.CSSProperties,
        headerTitle: {
            fontSize: 14,
            fontWeight: 600,
            color: theme.text,
        } as React.CSSProperties,
        modeToggleContainer: {
            display: 'flex',
            gap: 4,
        } as React.CSSProperties,
        getModeButton: (isActive: boolean) => ({
            padding: '3px 10px',
            fontSize: 11,
            borderRadius: 4,
            cursor: 'pointer',
            backgroundColor: isActive ? theme.accent : theme.bg,
            color: isActive ? theme.accentText : theme.text,
            border: `1px solid ${isActive ? theme.accent : theme.border}`,
            fontWeight: isActive ? 600 : 400,
        } as React.CSSProperties),
        filesSelectContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
        } as React.CSSProperties,
        selectLabel: {
            fontSize: 12,
            color: theme.textSecondary,
        } as React.CSSProperties,
        select: {
            flex: 1,
            padding: '4px 8px',
            fontSize: 12,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
        } as React.CSSProperties,
        vsSeparator: {
            color: theme.textSecondary,
        } as React.CSSProperties,
        gitModeContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            fontSize: 12,
            color: theme.textSecondary,
        } as React.CSSProperties,
        gitModeLabel: {
            color: theme.textMuted,
        } as React.CSSProperties,
        gitModeFileName: {
            color: theme.text,
            fontWeight: 600,
        } as React.CSSProperties,
        gitModeFilePath: {
            color: theme.textMuted,
            fontSize: 10,
        } as React.CSSProperties,
        sideByCheckboxLabel: {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: theme.textSecondary,
            cursor: 'pointer',
        } as React.CSSProperties,
        closeButton: {
            padding: '4px 12px',
            fontSize: 12,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            cursor: 'pointer',
        } as React.CSSProperties,
        editorContainer: {
            flex: 1,
            overflow: 'hidden',
        } as React.CSSProperties,
    }), [theme]);
}

export function DiffViewerViewPresenter({ theme }: DiffViewerProps)
{
    const { setShowDiffViewer, tabs, settings, activeTabId, isRepoInitialized } = useNotemacStore();
    const [mode, setMode] = useState<'files' | 'git'>(isRepoInitialized ? 'git' : 'files');
    const [originalTabId, setOriginalTabId] = useState<string>(tabs[0]?.id || '');
    const [modifiedTabId, setModifiedTabId] = useState<string>(tabs[1]?.id || tabs[0]?.id || '');
    const [renderSideBySide, setRenderSideBySide] = useState(true);
    const [gitHeadContent, setGitHeadContent] = useState<string>('');
    const [gitFilePath, setGitFilePath] = useState<string>('');

    const originalTab = useMemo(() => tabs.find(t => t.id === originalTabId), [tabs, originalTabId]);
    const modifiedTab = useMemo(() => tabs.find(t => t.id === modifiedTabId), [tabs, modifiedTabId]);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    // Load HEAD version for git diff mode
    useEffect(() =>
    {
        if ('git' !== mode || !activeTab?.path)
            return;

        const filePath = activeTab.path;
        setGitFilePath(filePath);
        GetFileAtHead(filePath).then(content =>
        {
            setGitHeadContent(content || '');
        }).catch(() =>
        {
            setGitHeadContent('');
        });
    }, [mode, activeTab?.path]);

    const originalContent = 'git' === mode ? gitHeadContent : (originalTab?.content || '');
    const modifiedContent = 'git' === mode ? (activeTab?.content || '') : (modifiedTab?.content || '');
    const diffLanguage = 'git' === mode ? (activeTab?.language || 'plaintext') : (originalTab?.language || 'plaintext');

    const handleClose = useCallback(() =>
    {
        setShowDiffViewer(false);
    }, [setShowDiffViewer]);

    const styles = useStyles(theme);

    return (
        <div
            style={styles.overlay}
            onClick={handleClose}
        >
            <div
                style={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with file selectors */}
                <div style={styles.header}>
                    <span style={styles.headerTitle}>Compare Files</span>

                    {/* Mode toggle */}
                    {isRepoInitialized && (
                        <div style={styles.modeToggleContainer}>
                            {(['files', 'git'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={styles.getModeButton(mode === m)}
                                >
                                    {'files' === m ? 'Files' : 'Git HEAD'}
                                </button>
                            ))}
                        </div>
                    )}

                    {'files' === mode ? (
                        <div style={styles.filesSelectContainer}>
                            <label style={styles.selectLabel}>Original:</label>
                            <select
                                value={originalTabId}
                                onChange={(e) => setOriginalTabId(e.target.value)}
                                style={styles.select}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                                ))}
                            </select>

                            <span style={styles.vsSeparator}>vs</span>

                            <label style={styles.selectLabel}>Modified:</label>
                            <select
                                value={modifiedTabId}
                                onChange={(e) => setModifiedTabId(e.target.value)}
                                style={styles.select}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div style={styles.gitModeContainer}>
                            <span>HEAD</span>
                            <span style={styles.gitModeLabel}>vs</span>
                            <span style={styles.gitModeFileName}>{activeTab?.name || 'No file'}</span>
                            {gitFilePath && <span style={styles.gitModeFilePath}>({gitFilePath})</span>}
                        </div>
                    )}

                    <label style={styles.sideByCheckboxLabel}>
                        <input
                            type="checkbox"
                            checked={renderSideBySide}
                            onChange={(e) => setRenderSideBySide(e.target.checked)}
                        />
                        Side by Side
                    </label>

                    <button
                        onClick={handleClose}
                        style={styles.closeButton}
                    >
                        Close
                    </button>
                </div>

                {/* Diff Editor */}
                <div style={styles.editorContainer}>
                    <DiffEditor
                        original={originalContent}
                        modified={modifiedContent}
                        language={diffLanguage}
                        theme={theme.editorMonacoTheme}
                        options={{
                            readOnly: true,
                            renderSideBySide,
                            fontSize: settings.fontSize,
                            fontFamily: settings.fontFamily,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            renderOverviewRuler: true,
                            diffWordWrap: settings.wordWrap ? 'on' : 'off',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
