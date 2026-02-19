import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { SavedSnippet } from "../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import { UI_ZINDEX_MODAL } from "../Commons/Constants";

interface SnippetManagerProps
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: UI_ZINDEX_MODAL,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        } as React.CSSProperties,
        modal: {
            width: 720,
            height: 520,
            backgroundColor: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        } as React.CSSProperties,
        titleBar: {
            padding: '10px 16px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        } as React.CSSProperties,
        titleText: {
            fontSize: 14,
            fontWeight: 600,
            color: theme.text,
        } as React.CSSProperties,
        titleButtonsContainer: {
            display: 'flex',
            gap: 6,
        } as React.CSSProperties,
        contentContainer: {
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
        } as React.CSSProperties,
        listPanel: {
            width: 220,
            borderRight: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
        } as React.CSSProperties,
        listHeader: {
            padding: 8,
        } as React.CSSProperties,
        listNewButton: (baseStyle: React.CSSProperties) => ({
            ...baseStyle,
            width: '100%',
        } as React.CSSProperties),
        listScroll: {
            flex: 1,
            overflowY: 'auto',
        } as React.CSSProperties,
        getListItem: (isSelected: boolean) => ({
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: isSelected ? theme.accent + '22' : 'transparent',
            borderLeft: isSelected ? `2px solid ${theme.accent}` : '2px solid transparent',
        } as React.CSSProperties),
        listItemName: {
            fontSize: 13,
            color: theme.text,
        } as React.CSSProperties,
        listItemMeta: {
            fontSize: 11,
            color: theme.textSecondary,
        } as React.CSSProperties,
        listEmpty: {
            padding: '16px 12px',
            fontSize: 12,
            color: theme.textSecondary,
            textAlign: 'center',
        } as React.CSSProperties,
        editorPanel: {
            flex: 1,
            padding: 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        } as React.CSSProperties,
        editorEmpty: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.textSecondary,
            fontSize: 13,
        } as React.CSSProperties,
        fieldContainer: {
            display: 'block',
        } as React.CSSProperties,
        fieldLabel: {
            fontSize: 11,
            color: theme.textSecondary,
            display: 'block',
            marginBottom: 4,
        } as React.CSSProperties,
        twoColumnContainer: {
            display: 'flex',
            gap: 10,
        } as React.CSSProperties,
        column: {
            flex: 1,
        } as React.CSSProperties,
        textareaContainer: {
            flex: 1,
            minHeight: 120,
        } as React.CSSProperties,
        fieldButtonsContainer: {
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
        } as React.CSSProperties,
        input: {
            width: '100%',
            padding: '6px 8px',
            fontSize: 12,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            outline: 'none',
        } as React.CSSProperties,
        textarea: {
            width: '100%',
            padding: '6px 8px',
            fontSize: 12,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            outline: 'none',
            height: 140,
            resize: 'vertical',
            fontFamily: "'SF Mono', 'Menlo', monospace",
        } as React.CSSProperties,
        button: {
            padding: '4px 12px',
            fontSize: 12,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            cursor: 'pointer',
        } as React.CSSProperties,
        insertButton: {
            padding: '4px 12px',
            fontSize: 12,
            backgroundColor: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
        } as React.CSSProperties,
        deleteButton: {
            padding: '4px 12px',
            fontSize: 12,
            color: '#ff4444',
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            cursor: 'pointer',
        } as React.CSSProperties,
        saveButton: {
            padding: '4px 12px',
            fontSize: 12,
            backgroundColor: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
        } as React.CSSProperties,
    }), [theme]);
}

export function SnippetManagerViewPresenter({ theme }: SnippetManagerProps)
{
    const { setShowSnippetManager, savedSnippets, addSnippet, removeSnippet, updateSnippet, loadSnippets } = useNotemacStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrefix, setEditPrefix] = useState('');
    const [editBody, setEditBody] = useState('');
    const [editLanguage, setEditLanguage] = useState('*');
    const [editDescription, setEditDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() =>
    {
        loadSnippets();
    }, []);

    const selectedSnippet = savedSnippets.find(s => s.id === selectedId);

    useEffect(() =>
    {
        if (selectedSnippet)
        {
            setEditName(selectedSnippet.name);
            setEditPrefix(selectedSnippet.prefix);
            setEditBody(selectedSnippet.body);
            setEditLanguage(selectedSnippet.language);
            setEditDescription(selectedSnippet.description || '');
            setIsCreating(false);
        }
    }, [selectedId]);

    const handleNew = useCallback(() =>
    {
        setIsCreating(true);
        setSelectedId(null);
        setEditName('');
        setEditPrefix('');
        setEditBody('');
        setEditLanguage('*');
        setEditDescription('');
    }, []);

    const handleSave = useCallback(() =>
    {
        if (0 === editName.trim().length || 0 === editPrefix.trim().length)
            return;

        if (isCreating)
        {
            addSnippet({
                name: editName.trim(),
                prefix: editPrefix.trim(),
                body: editBody,
                language: editLanguage,
                description: editDescription.trim() || undefined,
            });
            setIsCreating(false);
        }
        else if (selectedId)
        {
            updateSnippet(selectedId, {
                name: editName.trim(),
                prefix: editPrefix.trim(),
                body: editBody,
                language: editLanguage,
                description: editDescription.trim() || undefined,
            });
        }
    }, [isCreating, selectedId, editName, editPrefix, editBody, editLanguage, editDescription]);

    const handleDelete = useCallback(() =>
    {
        if (selectedId)
        {
            removeSnippet(selectedId);
            setSelectedId(null);
            setIsCreating(false);
        }
    }, [selectedId]);

    const handleInsert = useCallback(() =>
    {
        if (selectedSnippet)
        {
            Dispatch(NOTEMAC_EVENTS.INSERT_SNIPPET, { body: selectedSnippet.body });
            setShowSnippetManager(false);
        }
    }, [selectedSnippet]);

    const handleExport = useCallback(() =>
    {
        const blob = new Blob([JSON.stringify(savedSnippets, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notemac-snippets.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [savedSnippets]);

    const handleImport = useCallback(() =>
    {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async () =>
        {
            const file = input.files?.[0];
            if (file)
            {
                try
                {
                    const text = await file.text();
                    const imported = JSON.parse(text) as SavedSnippet[];
                    for (const snippet of imported)
                    {
                        addSnippet({
                            name: snippet.name,
                            prefix: snippet.prefix,
                            body: snippet.body,
                            language: snippet.language || '*',
                            description: snippet.description,
                        });
                    }
                }
                catch { /* Invalid JSON in snippet file — silently ignore */ }
            }
        };
        input.click();
    }, []);

    const styles = useStyles(theme);

    return (
        <div
            style={styles.overlay}
            onClick={() => setShowSnippetManager(false)}
        >
            <div
                style={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title bar */}
                <div style={styles.titleBar}>
                    <span style={styles.titleText}>Snippet Manager</span>
                    <div style={styles.titleButtonsContainer}>
                        <button onClick={handleImport} style={styles.button}>Import</button>
                        <button onClick={handleExport} style={styles.button}>Export</button>
                        <button onClick={() => setShowSnippetManager(false)} style={styles.button}>Close</button>
                    </div>
                </div>

                <div style={styles.contentContainer}>
                    {/* Snippet list */}
                    <div style={styles.listPanel}>
                        <div style={styles.listHeader}>
                            <button onClick={handleNew} style={styles.listNewButton(styles.button)}>+ New Snippet</button>
                        </div>
                        <div style={styles.listScroll}>
                            {savedSnippets.map(snippet => (
                                <div
                                    key={snippet.id}
                                    onClick={() => setSelectedId(snippet.id)}
                                    style={styles.getListItem(snippet.id === selectedId)}
                                >
                                    <div style={styles.listItemName}>{snippet.name}</div>
                                    <div style={styles.listItemMeta}>{snippet.prefix} \u2022 {snippet.language}</div>
                                </div>
                            ))}
                            {0 === savedSnippets.length && (
                                <div style={styles.listEmpty}>
                                    No snippets yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor panel */}
                    <div style={styles.editorPanel}>
                        {(selectedId || isCreating) ? (
                            <>
                                <div style={styles.fieldContainer}>
                                    <label style={styles.fieldLabel}>Name</label>
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} style={styles.input} />
                                </div>
                                <div style={styles.twoColumnContainer}>
                                    <div style={styles.column}>
                                        <label style={styles.fieldLabel}>Prefix (trigger)</label>
                                        <input value={editPrefix} onChange={(e) => setEditPrefix(e.target.value)} style={styles.input} placeholder="e.g. log, fn, cls" />
                                    </div>
                                    <div style={styles.column}>
                                        <label style={styles.fieldLabel}>Language</label>
                                        <input value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} style={styles.input} placeholder="* for all" />
                                    </div>
                                </div>
                                <div style={styles.fieldContainer}>
                                    <label style={styles.fieldLabel}>Description</label>
                                    <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={styles.input} />
                                </div>
                                <div style={styles.textareaContainer}>
                                    <label style={styles.fieldLabel}>
                                        Body (use $1, $2 for tab stops, $0 for final cursor)
                                    </label>
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        style={styles.textarea}
                                    />
                                </div>
                                <div style={styles.fieldButtonsContainer}>
                                    {!isCreating && (
                                        <>
                                            <button onClick={handleInsert} style={styles.insertButton}>Insert</button>
                                            <button onClick={handleDelete} style={styles.deleteButton}>Delete</button>
                                        </>
                                    )}
                                    <button onClick={handleSave} style={styles.saveButton}>
                                        {isCreating ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={styles.editorEmpty}>
                                Select a snippet or create a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
