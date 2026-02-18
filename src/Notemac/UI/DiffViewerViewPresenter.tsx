import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetFileAtHead } from "../Controllers/GitController";

interface DiffViewerProps
{
    theme: ThemeColors;
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
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    width: '90vw',
                    height: '85vh',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with file selectors */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Compare Files</span>

                    {/* Mode toggle */}
                    {isRepoInitialized && (
                        <div style={{ display: 'flex', gap: 4 }}>
                            {(['files', 'git'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={{
                                        padding: '3px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                                        backgroundColor: mode === m ? theme.accent : theme.bg,
                                        color: mode === m ? theme.accentText : theme.text,
                                        border: `1px solid ${mode === m ? theme.accent : theme.border}`,
                                        fontWeight: mode === m ? 600 : 400,
                                    }}
                                >
                                    {'files' === m ? 'Files' : 'Git HEAD'}
                                </button>
                            ))}
                        </div>
                    )}

                    {'files' === mode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <label style={{ fontSize: 12, color: theme.textSecondary }}>Original:</label>
                            <select
                                value={originalTabId}
                                onChange={(e) => setOriginalTabId(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    backgroundColor: theme.bg,
                                    color: theme.text,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 4,
                                }}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                                ))}
                            </select>

                            <span style={{ color: theme.textSecondary }}>vs</span>

                            <label style={{ fontSize: 12, color: theme.textSecondary }}>Modified:</label>
                            <select
                                value={modifiedTabId}
                                onChange={(e) => setModifiedTabId(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    backgroundColor: theme.bg,
                                    color: theme.text,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 4,
                                }}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, fontSize: 12, color: theme.textSecondary }}>
                            <span>HEAD</span>
                            <span style={{ color: theme.textMuted }}>vs</span>
                            <span style={{ color: theme.text, fontWeight: 600 }}>{activeTab?.name || 'No file'}</span>
                            {gitFilePath && <span style={{ color: theme.textMuted, fontSize: 10 }}>({gitFilePath})</span>}
                        </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textSecondary, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={renderSideBySide}
                            onChange={(e) => setRenderSideBySide(e.target.checked)}
                        />
                        Side by Side
                    </label>

                    <button
                        onClick={handleClose}
                        style={{
                            padding: '4px 12px',
                            fontSize: 12,
                            backgroundColor: theme.bg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                </div>

                {/* Diff Editor */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
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
