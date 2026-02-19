import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import { HandleMenuAction } from "../Controllers/MenuActionController";
import { GetAllCommands } from "../Configs/CommandRegistry";
import { FuzzyMatch, FuzzyFilter } from "../../Shared/Helpers/FuzzySearchHelpers";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { CommandDefinition } from "../Commons/Types";
import {
  UI_COMMAND_PALETTE_WIDTH,
  UI_COMMAND_PALETTE_MAX_HEIGHT,
  UI_COMMAND_PALETTE_TOP_OFFSET,
  UI_ZINDEX_MODAL,
} from "../Commons/Constants";

interface CommandPaletteProps
{
    theme: ThemeColors;
}

export function CommandPaletteViewPresenter({ theme }: CommandPaletteProps)
{
    const { setShowCommandPalette, activeTabId, tabs, zoomLevel } = useNotemacStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const allCommands = useMemo(() => GetAllCommands(), []);

    const filteredCommands = useMemo(() =>
    {
        if (0 === query.length)
            return allCommands;
        return FuzzyFilter(query, allCommands, (cmd) => cmd.label);
    }, [query, allCommands]);

    useEffect(() =>
    {
        inputRef.current?.focus();
    }, []);

    useEffect(() =>
    {
        setSelectedIndex(0);
    }, [query]);

    // Scroll selected item into view
    useEffect(() =>
    {
        if (listRef.current)
        {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedEl)
                selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleExecute = useCallback((command: CommandDefinition) =>
    {
        setShowCommandPalette(false);
        HandleMenuAction(command.action, activeTabId, tabs, zoomLevel);
    }, [activeTabId, tabs, zoomLevel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('ArrowDown' === e.key)
        {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        }
        else if ('ArrowUp' === e.key)
        {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        else if ('Enter' === e.key)
        {
            e.preventDefault();
            if (filteredCommands[selectedIndex])
                handleExecute(filteredCommands[selectedIndex]);
        }
        else if ('Escape' === e.key)
        {
            e.preventDefault();
            setShowCommandPalette(false);
        }
    }, [filteredCommands, selectedIndex, handleExecute]);

    const renderHighlightedLabel = (cmd: CommandDefinition) =>
    {
        if (0 === query.length)
            return cmd.label;

        const result = FuzzyMatch(query, cmd.label);
        if (!result.match)
            return cmd.label;

        const chars = cmd.label.split('');
        return chars.map((char, i) =>
        {
            const isHighlighted = result.indices.includes(i);
            return (
                <span key={`char-${i}-${char}`} style={{ fontWeight: isHighlighted ? 700 : 400, color: isHighlighted ? theme.accent : 'inherit' }}>
                    {char}
                </span>
            );
        });
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
                zIndex: UI_ZINDEX_MODAL,
                display: 'flex',
                justifyContent: 'center',
                paddingTop: UI_COMMAND_PALETTE_TOP_OFFSET,
            }}
            onClick={() => setShowCommandPalette(false)}
        >
            <div
                style={{
                    width: UI_COMMAND_PALETTE_WIDTH,
                    maxHeight: UI_COMMAND_PALETTE_MAX_HEIGHT,
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
                {/* Search input */}
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command..."
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

                {/* Command list */}
                <div
                    ref={listRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '4px 0',
                    }}
                >
                    {filteredCommands.map((cmd, index) => (
                        <div
                            key={cmd.id}
                            onClick={() => handleExecute(cmd)}
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
                                <span style={{ fontSize: 10, color: theme.textSecondary, minWidth: 48 }}>
                                    {cmd.category}
                                </span>
                                <span style={{ fontSize: 13, color: theme.text }}>
                                    {renderHighlightedLabel(cmd)}
                                </span>
                            </div>
                            {cmd.keybinding && (
                                <span style={{
                                    fontSize: 11,
                                    color: theme.textSecondary,
                                    backgroundColor: theme.bg,
                                    padding: '2px 6px',
                                    borderRadius: 3,
                                    fontFamily: 'monospace',
                                }}>
                                    {cmd.keybinding}
                                </span>
                            )}
                        </div>
                    ))}
                    {0 === filteredCommands.length && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>
                            No matching commands
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
