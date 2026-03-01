/**
 * LanguageDefinitionSettingsViewPresenter — Settings section for custom languages.
 *
 * Shows list of custom languages, file association overrides,
 * and provides add/edit/delete functionality.
 */

import React, { useState } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import type { CustomLanguageDefinition } from '../Commons/Types';
import {
    UnregisterCustomLanguage,
    SetFileAssociation,
    RemoveFileAssociation,
} from '../Controllers/LanguageDefinitionController';

interface LanguageDefinitionSettingsProps
{
    theme: ThemeColors;
}

export function LanguageDefinitionSettingsViewPresenter({ theme }: LanguageDefinitionSettingsProps)
{
    const { customLanguages, fileAssociationOverrides } = useNotemacStore();
    const [_showEditor, setShowEditor] = useState(false);
    const [_editingId, setEditingId] = useState<string | null>(null);
    const [newExtension, setNewExtension] = useState('');
    const [newLangId, setNewLangId] = useState('');

    const handleDelete = (langId: string) =>
    {
        UnregisterCustomLanguage(langId);
    };

    const handleEdit = (lang: CustomLanguageDefinition) =>
    {
        setEditingId(lang.id);
        setShowEditor(true);
    };

    const handleAddOverride = () =>
    {
        if (0 < newExtension.trim().length && 0 < newLangId.trim().length)
        {
            SetFileAssociation(newExtension.trim(), newLangId.trim());
            setNewExtension('');
            setNewLangId('');
        }
    };

    const handleRemoveOverride = (ext: string) =>
    {
        RemoveFileAssociation(ext);
    };

    const inputStyle: React.CSSProperties = {
        padding: '3px 6px',
        background: theme.editorBg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 3,
        fontSize: 12,
    };

    return (
        <div>
            {/* Custom Languages Section */}
            <div style={{ marginBottom: 16 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Custom Languages</span>
                    <button
                        onClick={() => { setEditingId(null); setShowEditor(true); }}
                        style={{
                            background: theme.accent,
                            color: theme.accentText,
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 10px',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        + Add
                    </button>
                </div>

                {0 === customLanguages.length && (
                    <div style={{ opacity: 0.5, fontSize: 12, padding: '8px 0' }}>
                        No custom languages defined.
                    </div>
                )}

                {customLanguages.map(lang => (
                    <div
                        key={lang.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: 4,
                            marginBottom: 4,
                            background: theme.editorBg,
                            gap: 8,
                            fontSize: 12,
                        }}
                    >
                        <span style={{ fontWeight: 500, flex: 1 }}>{lang.label}</span>
                        <span style={{ opacity: 0.5, fontSize: 11 }}>{lang.extensions.join(', ')}</span>
                        <button
                            onClick={() => handleEdit(lang)}
                            style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: 11 }}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(lang.id)}
                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 11 }}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            {/* File Association Overrides Section */}
            <div>
                <span style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 8 }}>
                    File Association Overrides
                </span>

                {0 === Object.keys(fileAssociationOverrides).length && (
                    <div style={{ opacity: 0.5, fontSize: 12, padding: '4px 0', marginBottom: 8 }}>
                        No file association overrides.
                    </div>
                )}

                {Object.entries(fileAssociationOverrides).map(([ext, langId]) => (
                    <div
                        key={ext}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            borderRadius: 4,
                            marginBottom: 4,
                            background: theme.editorBg,
                            gap: 8,
                            fontSize: 12,
                        }}
                    >
                        <span style={{ fontFamily: 'monospace' }}>{ext}</span>
                        <span style={{ opacity: 0.5 }}>→</span>
                        <span style={{ flex: 1 }}>{langId}</span>
                        <button
                            onClick={() => handleRemoveOverride(ext)}
                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 11 }}
                        >
                            Remove
                        </button>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
                    <input
                        value={newExtension}
                        onChange={e => setNewExtension(e.target.value)}
                        placeholder=".ext"
                        style={{ ...inputStyle, width: 80 }}
                    />
                    <span style={{ opacity: 0.5 }}>→</span>
                    <input
                        value={newLangId}
                        onChange={e => setNewLangId(e.target.value)}
                        placeholder="language-id"
                        style={{ ...inputStyle, width: 120 }}
                    />
                    <button
                        onClick={handleAddOverride}
                        style={{
                            background: theme.accent,
                            color: theme.accentText,
                            border: 'none',
                            borderRadius: 3,
                            padding: '3px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
