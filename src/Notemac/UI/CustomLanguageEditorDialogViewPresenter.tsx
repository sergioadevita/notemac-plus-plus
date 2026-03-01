/**
 * CustomLanguageEditorDialogViewPresenter — Modal for editing custom language definitions.
 *
 * Provides form fields for language ID, label, extensions, aliases,
 * monarch tokenizer keywords/operators, brackets, comments, and auto-closing pairs.
 */

import React, { useState, useCallback } from 'react';
import type { ThemeColors } from '../Configs/ThemeConfig';
import type { CustomLanguageDefinition, MonarchTokensConfig } from '../Commons/Types';
import { RegisterCustomLanguage, UpdateCustomLanguage } from '../Controllers/LanguageDefinitionController';
import { ValidateLanguageDefinition } from '../Services/LanguageDefinitionService';
import { UI_ZINDEX_MODAL } from '../Commons/Constants';

interface CustomLanguageEditorDialogProps
{
    theme: ThemeColors;
    existingLanguage?: CustomLanguageDefinition;
    onClose: () => void;
}

export function CustomLanguageEditorDialogViewPresenter({ theme, existingLanguage, onClose }: CustomLanguageEditorDialogProps)
{
    const isEditing = undefined !== existingLanguage;

    const [id, setId] = useState(existingLanguage?.id || '');
    const [label, setLabel] = useState(existingLanguage?.label || '');
    const [extensionsText, setExtensionsText] = useState(existingLanguage?.extensions.join(', ') || '');
    const [aliasesText, setAliasesText] = useState(existingLanguage?.aliases.join(', ') || '');
    const [keywordsText, setKeywordsText] = useState(existingLanguage?.monarchTokens.keywords?.join(', ') || '');
    const [operatorsText, setOperatorsText] = useState(existingLanguage?.monarchTokens.operators?.join(', ') || '');
    const [lineComment, setLineComment] = useState(existingLanguage?.comments?.lineComment || '');
    const [blockCommentStart, setBlockCommentStart] = useState(existingLanguage?.comments?.blockComment?.[0] || '');
    const [blockCommentEnd, setBlockCommentEnd] = useState(existingLanguage?.comments?.blockComment?.[1] || '');
    const [bracketsText, setBracketsText] = useState(
        existingLanguage?.brackets?.map(b => `${b[0]}${b[1]}`).join(', ') || '[], {}, ()'
    );
    const [errors, setErrors] = useState<string[]>([]);

    const parseCommaSeparated = (text: string): string[] =>
    {
        return text.split(',').map(s => s.trim()).filter(s => 0 < s.length);
    };

    const parseBrackets = (text: string): [string, string][] =>
    {
        const pairs: [string, string][] = [];
        const items = parseCommaSeparated(text);
        for (const item of items)
        {
            const trimmed = item.trim();
            if (2 <= trimmed.length)
            {
                const mid = Math.floor(trimmed.length / 2);
                pairs.push([trimmed.slice(0, mid), trimmed.slice(mid)]);
            }
        }
        return pairs;
    };

    const buildLanguageDefinition = useCallback((): CustomLanguageDefinition =>
    {
        const keywords = parseCommaSeparated(keywordsText);
        const operators = parseCommaSeparated(operatorsText);

        // Build tokenizer rules — uses regex patterns as strings for type safety
        const rootRules: unknown[] = [];

        if (0 < keywords.length)
        {
            rootRules.push({ regex: '[a-zA-Z_]\\w*', action: { cases: { '@keywords': 'keyword', '@default': 'identifier' } } });
        }

        if (0 < operators.length)
        {
            rootRules.push(['[{}()\\[\\]]', '@brackets']);
        }

        // String rules
        rootRules.push(['"([^"\\\\]|\\\\.)*$', 'string.invalid']);
        rootRules.push(['"', 'string', '@string']);

        // Comment rules
        if (0 < lineComment.length)
        {
            const escaped = lineComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            rootRules.push([escaped + '.*$', 'comment']);
        }

        // Number and whitespace
        rootRules.push(['\\d+', 'number']);
        rootRules.push(['\\s+', 'white']);

        const monarchTokens: MonarchTokensConfig = {
            keywords,
            operators,
            tokenizer: {
                root: rootRules as MonarchTokensConfig['tokenizer']['root'],
                string: [
                    ['[^\\\\"]+', 'string'],
                    ['\\\\.', 'string.escape'],
                    ['"', 'string', '@pop'],
                ],
            },
        };

        const extensions = parseCommaSeparated(extensionsText).map(e =>
            e.startsWith('.') ? e : `.${e}`
        );

        const lang: CustomLanguageDefinition = {
            id: id.trim(),
            label: label.trim(),
            extensions,
            aliases: parseCommaSeparated(aliasesText),
            monarchTokens,
        };

        const brackets = parseBrackets(bracketsText);
        if (0 < brackets.length)
            lang.brackets = brackets;

        if (0 < lineComment.length || (0 < blockCommentStart.length && 0 < blockCommentEnd.length))
        {
            lang.comments = {};
            if (0 < lineComment.length)
                lang.comments.lineComment = lineComment;
            if (0 < blockCommentStart.length && 0 < blockCommentEnd.length)
                lang.comments.blockComment = [blockCommentStart, blockCommentEnd];
        }

        return lang;
    }, [id, label, extensionsText, aliasesText, keywordsText, operatorsText, lineComment, blockCommentStart, blockCommentEnd, bracketsText]);

    const handleSave = () =>
    {
        const lang = buildLanguageDefinition();

        const validation = ValidateLanguageDefinition(lang);
        if (!validation.valid)
        {
            setErrors(validation.errors);
            return;
        }

        if (isEditing)
        {
            const result = UpdateCustomLanguage(lang.id, lang);
            if (!result.success)
            {
                setErrors(result.errors);
                return;
            }
        }
        else
        {
            const result = RegisterCustomLanguage(lang);
            if (!result.success)
            {
                setErrors(result.errors);
                return;
            }
        }

        onClose();
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '4px 8px',
        background: theme.editorBg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        fontSize: 12,
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11,
        display: 'block',
        marginBottom: 2,
        opacity: 0.7,
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: UI_ZINDEX_MODAL,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: theme.sidebarBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    width: 480,
                    maxHeight: '80vh',
                    overflow: 'auto',
                    padding: 20,
                    color: theme.text,
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                        {isEditing ? 'Edit Language' : 'New Custom Language'}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: theme.text, fontSize: 18, cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* Basic Info */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Language ID</label>
                    <input
                        value={id}
                        onChange={e => setId(e.target.value)}
                        style={inputStyle}
                        placeholder="my-language"
                        disabled={isEditing}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Display Label</label>
                    <input
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        style={inputStyle}
                        placeholder="My Language"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>File Extensions (comma-separated)</label>
                    <input
                        value={extensionsText}
                        onChange={e => setExtensionsText(e.target.value)}
                        style={inputStyle}
                        placeholder=".ml, .myl"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Aliases (comma-separated)</label>
                    <input
                        value={aliasesText}
                        onChange={e => setAliasesText(e.target.value)}
                        style={inputStyle}
                        placeholder="MyLang, ml"
                    />
                </div>

                {/* Tokenizer */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Keywords (comma-separated)</label>
                    <input
                        value={keywordsText}
                        onChange={e => setKeywordsText(e.target.value)}
                        style={inputStyle}
                        placeholder="if, else, while, for, return, function"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Operators (comma-separated)</label>
                    <input
                        value={operatorsText}
                        onChange={e => setOperatorsText(e.target.value)}
                        style={inputStyle}
                        placeholder="+, -, *, /, =, ==, !="
                    />
                </div>

                {/* Comments */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Line Comment Prefix</label>
                    <input
                        value={lineComment}
                        onChange={e => setLineComment(e.target.value)}
                        style={inputStyle}
                        placeholder="//"
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Block Comment Start</label>
                        <input
                            value={blockCommentStart}
                            onChange={e => setBlockCommentStart(e.target.value)}
                            style={inputStyle}
                            placeholder="/*"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Block Comment End</label>
                        <input
                            value={blockCommentEnd}
                            onChange={e => setBlockCommentEnd(e.target.value)}
                            style={inputStyle}
                            placeholder="*/"
                        />
                    </div>
                </div>

                {/* Brackets */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Bracket Pairs (comma-separated, e.g., [], {'{}'}, ())</label>
                    <input
                        value={bracketsText}
                        onChange={e => setBracketsText(e.target.value)}
                        style={inputStyle}
                        placeholder="[], {}, ()"
                    />
                </div>

                {/* Errors */}
                {0 < errors.length && (
                    <div style={{ color: '#ff4444', fontSize: 11, marginBottom: 12 }}>
                        {errors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            padding: '6px 16px',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            background: theme.accent,
                            color: theme.accentText,
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 16px',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        {isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
