import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import { FuzzyMatch, FuzzyFilter } from "../../Shared/Helpers/FuzzySearchHelpers";
import type { ThemeColors } from "../Configs/ThemeConfig";

interface QuickOpenProps
{
    theme: ThemeColors;
}

interface FileEntry
{
    id: string;
    name: string;
    path: string | null;
    isOpen: boolean;
    isModified: boolean;
}

export function QuickOpenViewPresenter({ theme }: QuickOpenProps)
{
    const { setShowQuickOpen, tabs, recentFiles, setActiveTab } = useNotemacStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Build file entries from open tabs and recent files
    const fileEntries = useMemo(() =>
    {
        const entries: FileEntry[] = [];
        const seen = new Set<string>();

        // Open tabs first
        for (const tab of tabs)
        {
            const key = tab.path || tab.name;
            if (!seen.has(key))
            {
                seen.add(key);
                entries.push({
                    id: tab.id,
                    name: tab.name,
                    path: tab.path,
                    isOpen: true,
                    isModified: tab.isModified,
                });
            }
        }

        // Recent files (if available)
        if (recentFiles)
        {
            for (const recent of recentFiles)
            {
                const key = recent.path || recent.name;
                if (!seen.has(key))
                {
                    seen.add(key);
                    entries.push({
                        id: key,
                        name: recent.name,
                        path: recent.path,
                        isOpen: false,
                        isModified: false,
                    });
                }
            }
        }

        return entries;
    }, [tabs, recentFiles]);

    const filteredFiles = useMemo(() =>
    {
        if (0 === query.length)
            return fileEntries;
        return FuzzyFilter(query, fileEntries, (f) => f.name + (f.path ? ' ' + f.path : ''));
    }, [query, fileEntries]);

    useEffect(() =>
    {
        inputRef.current?.focus();
    }, []);

    useEffect(() =>
    {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() =>
    {
        if (listRef.current)
        {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedEl)
                selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleSelect = useCallback((entry: FileEntry) =>
    {
        setShowQuickOpen(false);
        if (entry.isOpen)
            setActiveTab(entry.id);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('ArrowDown' === e.key)
        {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1));
        }
        else if ('ArrowUp' === e.key)
        {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        else if ('Enter' === e.key)
        {
            e.preventDefault();
            if (filteredFiles[selectedIndex])
                handleSelect(filteredFiles[selectedIndex]);
        }
        else if ('Escape' === e.key)
        {
            e.preventDefault();
            setShowQuickOpen(false);
        }
    }, [filteredFiles, selectedIndex, handleSelect]);

    const renderHighlightedName = (entry: FileEntry) =>
    {
        if (0 === query.length)
            return entry.name;

        const result = FuzzyMatch(query, entry.name);
        if (!result.match)
            return entry.name;

        const chars = entry.name.split('');
        return chars.map((char, i) =>
        {
            const isHighlighted = result.indices.includes(i);
            return (
                <span key={i} style={{ fontWeight: isHighlighted ? 700 : 400, color: isHighlighted ? theme.accent : 'inherit' }}>
                    {char}
                </span>
            );
        });
    };

    const getFileIcon = (name: string) =>
    {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const iconMap: Record<string, string> = {
            ts: '📘', tsx: '📘', js: '📒', jsx: '📒',
            py: '🐍', rs: '🦀', go: '🔵', html: '🌐',
            css: '🎨', json: '📋', md: '📝', txt: '📄',
        };
        return iconMap[ext] || '📄';
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 10000,
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 80,
            }}
            onClick={() => setShowQuickOpen(false)}
        >
            <div
                style={{
                    width: 560,
                    maxHeight: 420,
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    alignSelf: 'flex-start',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search files by name..."
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 14,
                            backgroundColor: theme.bg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>

                <div
                    ref={listRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '4px 0',
                    }}
                >
                    {filteredFiles.map((entry, index) => (
                        <div
                            key={entry.id}
                            onClick={() => handleSelect(entry)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                backgroundColor: index === selectedIndex ? theme.accent + '22' : 'transparent',
                                borderLeft: index === selectedIndex ? `2px solid ${theme.accent}` : '2px solid transparent',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14 }}>{getFileIcon(entry.name)}</span>
                                <span style={{ fontSize: 13, color: theme.text }}>
                                    {renderHighlightedName(entry)}
                                    {entry.isModified && <span style={{ color: theme.accent, marginLeft: 4 }}>{'\u2022'}</span>}
                                </span>
                                {entry.path && (
                                    <span style={{ fontSize: 11, color: theme.textSecondary, marginLeft: 4 }}>
                                        {entry.path}
                                    </span>
                                )}
                            </div>
                            {entry.isOpen && (
                                <span style={{
                                    fontSize: 10,
                                    color: theme.textSecondary,
                                    backgroundColor: theme.bg,
                                    padding: '2px 6px',
                                    borderRadius: 3,
                                }}>
                                    open
                                </span>
                            )}
                        </div>
                    ))}
                    {0 === filteredFiles.length && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>
                            No matching files
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
