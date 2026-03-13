import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import { StringToHexLines, ByteToHex, FormatOffset } from '../../Shared/Helpers/HexHelpers';

import { EditByte, SetBytesPerRow } from '../Controllers/HexEditorController';

interface HexEditorProps
{
    tabId: string;
    theme: ThemeColors;
}

interface Styles
{
    container: React.CSSProperties;
    toolbar: React.CSSProperties;
    toolbarButton: React.CSSProperties;
    toolbarButtonActive: React.CSSProperties;
    hexContent: React.CSSProperties;
    hexRow: React.CSSProperties;
    hexRowSelected: React.CSSProperties;
    offsetCell: React.CSSProperties;
    hexCell: React.CSSProperties;
    hexCellSelected: React.CSSProperties;
    hexCellEditing: React.CSSProperties;
    asciiCell: React.CSSProperties;
    asciiCellSelected: React.CSSProperties;
    hexArea: React.CSSProperties;
    asciiArea: React.CSSProperties;
    hexSeparator: React.CSSProperties;
    statusInfo: React.CSSProperties;
}

function useStyles(theme: ThemeColors): Styles
{
    return useMemo(() => ({
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            backgroundColor: theme.bg,
            color: theme.text,
        },
        toolbar: {
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            padding: '4px 12px',
            borderBottom: `1px solid ${theme.border}`,
            backgroundColor: theme.bgSecondary,
            alignItems: 'center',
            flexShrink: 0,
        },
        toolbarButton: {
            padding: '4px 12px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bgSecondary,
            color: theme.text,
            cursor: 'pointer',
            fontSize: 12,
            borderRadius: 2,
            transition: 'all 0.2s ease',
            ':hover': {
                backgroundColor: theme.accent,
                color: theme.bg,
            },
        },
        toolbarButtonActive: {
            padding: '4px 12px',
            border: `1px solid ${theme.accent}`,
            backgroundColor: theme.accent,
            color: theme.bg,
            cursor: 'pointer',
            fontSize: 12,
            borderRadius: 2,
            fontWeight: 'bold',
        },
        hexContent: {
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: theme.bg,
        },
        hexRow: {
            display: 'flex',
            flexDirection: 'row',
            borderBottom: `1px solid ${theme.border}`,
            alignItems: 'center',
            userSelect: 'none',
        },
        hexRowSelected: {
            backgroundColor: `${theme.accent}20`,
        },
        offsetCell: {
            display: 'flex',
            alignItems: 'center',
            width: 80,
            minWidth: 80,
            color: theme.textMuted,
            padding: '4px 8px',
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: 11,
        },
        hexCell: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            minWidth: 24,
            height: 20,
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            color: theme.text,
            transition: 'background-color 0.1s ease',
            ':hover': {
                backgroundColor: `${theme.accent}30`,
            },
        },
        hexCellSelected: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            minWidth: 24,
            height: 20,
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            color: theme.bg,
            backgroundColor: theme.accent,
            borderRadius: 2,
        },
        hexCellEditing: {
            padding: '2px 4px',
            border: `2px solid ${theme.accent}`,
            backgroundColor: theme.bg,
            color: theme.text,
            borderRadius: 2,
            outline: 'none',
            fontSize: 12,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        },
        asciiCell: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 10,
            minWidth: 10,
            height: 20,
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: 500,
            transition: 'background-color 0.1s ease',
            ':hover': {
                backgroundColor: `${theme.accent}30`,
            },
        },
        asciiCellSelected: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 10,
            minWidth: 10,
            height: 20,
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 12,
            color: theme.bg,
            backgroundColor: theme.accent,
            fontWeight: 'bold',
            borderRadius: 2,
        },
        hexArea: {
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            padding: '4px 0',
            alignItems: 'center',
            gap: 0,
        },
        asciiArea: {
            display: 'flex',
            flexDirection: 'row',
            padding: '4px 8px',
            borderLeft: `1px solid ${theme.border}`,
            color: theme.textSecondary,
            alignItems: 'center',
            gap: 0,
            minWidth: 200,
            backgroundColor: `${theme.bgSecondary}40`,
        },
        hexSeparator: {
            borderLeft: `1px solid ${theme.border}`,
            margin: '0 4px',
            height: '100%',
            opacity: 0.5,
        },
        statusInfo: {
            padding: '4px 12px',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.bgSecondary,
            fontSize: 12,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            color: theme.textMuted,
            flexShrink: 0,
        },
    }), [theme]);
}

export function HexEditorPanel({ tabId, theme }: HexEditorProps)
{
    const tab = useNotemacStore(s => s.tabs.find(t => t.id === tabId));
    const updateTab = useNotemacStore(s => s.updateTab);

    const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
    const [editingOffset, setEditingOffset] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);
    const styles = useStyles(theme);

    if (!tab)
    {
        return null;
    }

    const bytesPerRow = tab.hexBytesPerRow || 16;
    const hexLines = useMemo(() => StringToHexLines(tab.content, bytesPerRow), [tab.content, bytesPerRow]);

    const ROW_HEIGHT = 22;
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() =>
    {
        if (null !== contentRef.current)
        {
            const ResizeObserver = window.ResizeObserver;
            const observer = new ResizeObserver((entries) =>
            {
                for (const entry of entries)
                {
                    setContainerHeight(entry.contentRect.height);
                }
            });
            observer.observe(contentRef.current);
            return () => observer.disconnect();
        }
    }, []);

    const visibleStartIndex = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + 2;
    const visibleEndIndex = Math.min(visibleStartIndex + visibleCount, hexLines.length);
    const totalHeight = hexLines.length * ROW_HEIGHT;

    const HandleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) =>
    {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const HandleByteClick = useCallback((offset: number) =>
    {
        setSelectedOffset(offset);
        updateTab(tabId, { hexByteOffset: offset });
    }, [tabId, updateTab]);

    const HandleByteDoubleClick = useCallback((offset: number) =>
    {
        if (tab.isReadOnly)
        {
            return;
        }
        setEditingOffset(offset);
        setEditValue(ByteToHex(tab.content.charCodeAt(offset)));
    }, [tab.isReadOnly, tab.content]);

    const HandleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if ('Enter' === e.key)
        {
            if (null !== editingOffset && '' !== editValue)
            {
                EditByte(editingOffset, editValue, tabId);
            }
            setEditingOffset(null);
            setEditValue('');
        }
        else if ('Escape' === e.key)
        {
            setEditingOffset(null);
            setEditValue('');
        }
    }, [editingOffset, editValue, tabId]);

    const HandleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 2);
        setEditValue(val);
    }, []);

    useEffect(() =>
    {
        if (0 < tab.hexByteOffset)
        {
            const rowIndex = Math.floor(tab.hexByteOffset / bytesPerRow);
            const targetScroll = rowIndex * ROW_HEIGHT;
            if (null !== contentRef.current)
            {
                contentRef.current.scrollTop = targetScroll;
            }
            setSelectedOffset(tab.hexByteOffset);
        }
    }, [tab.hexByteOffset, bytesPerRow]);

    return (
        <div style={styles.container}>
            {/* Toolbar */}
            <div style={styles.toolbar}>
                <button
                    style={16 === bytesPerRow ? styles.toolbarButtonActive : styles.toolbarButton}
                    onClick={() => SetBytesPerRow(16, tabId)}
                >
                    16 bytes/row
                </button>
                <button
                    style={8 === bytesPerRow ? styles.toolbarButtonActive : styles.toolbarButton}
                    onClick={() => SetBytesPerRow(8, tabId)}
                >
                    8 bytes/row
                </button>
                <span style={{ color: theme.textMuted, fontSize: 12, marginLeft: 'auto' }}>
                    {tab.content.length} bytes
                </span>
            </div>

            {/* Hex content with virtual scrolling */}
            <div
                ref={contentRef}
                style={styles.hexContent}
                onScroll={HandleScroll}
            >
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {hexLines.slice(visibleStartIndex, visibleEndIndex).map((line, i) =>
                    {
                        const lineIndex = visibleStartIndex + i;
                        return (
                            <div
                                key={line.offset}
                                style={{
                                    ...styles.hexRow,
                                    position: 'absolute',
                                    top: lineIndex * ROW_HEIGHT,
                                    left: 0,
                                    right: 0,
                                    height: ROW_HEIGHT,
                                }}
                            >
                                {/* Offset column */}
                                <span style={styles.offsetCell}>
                                    {FormatOffset(line.offset)}
                                </span>

                                {/* Hex bytes column */}
                                <span style={styles.hexArea}>
                                    {line.bytes.map((byte, j) =>
                                    {
                                        const byteOffset = line.offset + j;
                                        const isSelected = selectedOffset === byteOffset;
                                        const isEditing = editingOffset === byteOffset;

                                        if (isEditing)
                                        {
                                            return (
                                                <input
                                                    key={j}
                                                    type="text"
                                                    value={editValue}
                                                    onChange={HandleEditChange}
                                                    onKeyDown={HandleEditKeyDown}
                                                    autoFocus
                                                    style={{
                                                        ...styles.hexCellEditing,
                                                        width: 28,
                                                        textAlign: 'center',
                                                        fontSize: 'inherit',
                                                        fontFamily: 'inherit',
                                                    }}
                                                />
                                            );
                                        }

                                        return (
                                            <span
                                                key={j}
                                                style={isSelected ? styles.hexCellSelected : styles.hexCell}
                                                onClick={() => HandleByteClick(byteOffset)}
                                                onDoubleClick={() => HandleByteDoubleClick(byteOffset)}
                                            >
                                                {ByteToHex(byte)}
                                            </span>
                                        );
                                    })}
                                    {line.bytes.length < bytesPerRow && Array.from({ length: bytesPerRow - line.bytes.length }).map((_, j) => (
                                        <span key={`pad-${j}`} style={styles.hexCell}>{'  '}</span>
                                    ))}
                                </span>

                                {/* Separator */}
                                <span style={styles.hexSeparator} />

                                {/* ASCII column */}
                                <span style={styles.asciiArea}>
                                    {line.ascii.split('').map((char, j) =>
                                    {
                                        const charOffset = line.offset + j;
                                        const isSelected = selectedOffset === charOffset;
                                        return (
                                            <span
                                                key={j}
                                                style={isSelected ? styles.asciiCellSelected : styles.asciiCell}
                                                onClick={() => HandleByteClick(charOffset)}
                                            >
                                                {char}
                                            </span>
                                        );
                                    })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status bar */}
            <div style={styles.statusInfo}>
                <span>Offset: {null !== selectedOffset ? `${selectedOffset} (0x${FormatOffset(selectedOffset)})` : '—'}</span>
                <span>Size: {tab.content.length} bytes</span>
                <span>{bytesPerRow} bytes/row</span>
                {tab.isReadOnly && <span style={{ color: '#ef4444' }}>Read Only</span>}
            </div>
        </div>
    );
}
