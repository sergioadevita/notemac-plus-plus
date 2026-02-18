import React, { useState, useEffect, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { SavedSnippet } from "../Commons/Types";
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

interface SnippetManagerProps
{
    theme: ThemeColors;
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

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '6px 8px',
        fontSize: 12,
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        outline: 'none',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '4px 12px',
        fontSize: 12,
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        cursor: 'pointer',
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 10000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
            onClick={() => setShowSnippetManager(false)}
        >
            <div
                style={{
                    width: 720,
                    height: 520,
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
                {/* Title bar */}
                <div style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Snippet Manager</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleImport} style={buttonStyle}>Import</button>
                        <button onClick={handleExport} style={buttonStyle}>Export</button>
                        <button onClick={() => setShowSnippetManager(false)} style={buttonStyle}>Close</button>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Snippet list */}
                    <div style={{
                        width: 220,
                        borderRight: `1px solid ${theme.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{ padding: 8 }}>
                            <button onClick={handleNew} style={{ ...buttonStyle, width: '100%' }}>+ New Snippet</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {savedSnippets.map(snippet => (
                                <div
                                    key={snippet.id}
                                    onClick={() => setSelectedId(snippet.id)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: snippet.id === selectedId ? theme.accent + '22' : 'transparent',
                                        borderLeft: snippet.id === selectedId ? `2px solid ${theme.accent}` : '2px solid transparent',
                                    }}
                                >
                                    <div style={{ fontSize: 13, color: theme.text }}>{snippet.name}</div>
                                    <div style={{ fontSize: 11, color: theme.textSecondary }}>{snippet.prefix} \u2022 {snippet.language}</div>
                                </div>
                            ))}
                            {0 === savedSnippets.length && (
                                <div style={{ padding: '16px 12px', fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
                                    No snippets yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor panel */}
                    <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(selectedId || isCreating) ? (
                            <>
                                <div>
                                    <label style={{ fontSize: 11, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Name</label>
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Prefix (trigger)</label>
                                        <input value={editPrefix} onChange={(e) => setEditPrefix(e.target.value)} style={inputStyle} placeholder="e.g. log, fn, cls" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Language</label>
                                        <input value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} style={inputStyle} placeholder="* for all" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Description</label>
                                    <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1, minHeight: 120 }}>
                                    <label style={{ fontSize: 11, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>
                                        Body (use $1, $2 for tab stops, $0 for final cursor)
                                    </label>
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            height: 140,
                                            resize: 'vertical',
                                            fontFamily: "'SF Mono', 'Menlo', monospace",
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    {!isCreating && (
                                        <>
                                            <button onClick={handleInsert} style={{ ...buttonStyle, backgroundColor: theme.accent, color: '#fff' }}>Insert</button>
                                            <button onClick={handleDelete} style={{ ...buttonStyle, color: '#ff4444' }}>Delete</button>
                                        </>
                                    )}
                                    <button onClick={handleSave} style={{ ...buttonStyle, backgroundColor: theme.accent, color: '#fff' }}>
                                        {isCreating ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary, fontSize: 13 }}>
                                Select a snippet or create a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
