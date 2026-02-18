import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { LIMIT_TERMINAL_HISTORY } from '../Commons/Constants';

interface TerminalPanelProps
{
    theme: ThemeColors;
}

interface TerminalLine
{
    type: 'input' | 'output' | 'error' | 'info';
    text: string;
}

export function TerminalPanelViewPresenter({ theme }: TerminalPanelProps)
{
    const { tabs, setShowTerminalPanel, terminalHeight, setTerminalHeight } = useNotemacStore();
    const [lines, setLines] = useState<TerminalLine[]>([
        { type: 'info', text: 'Notemac++ Terminal v1.0 \u2014 Type "help" for available commands.' },
    ]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isDragging, setIsDragging] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

    // Scroll to bottom on new output
    useEffect(() =>
    {
        if (outputRef.current)
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [lines]);

    // Focus input on mount
    useEffect(() =>
    {
        inputRef.current?.focus();
    }, []);

    const executeCommand = useCallback((cmd: string) =>
    {
        const trimmed = cmd.trim();
        if (0 === trimmed.length)
            return;

        const newLines: TerminalLine[] = [{ type: 'input', text: `$ ${trimmed}` }];
        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command)
        {
            case 'help':
                newLines.push({ type: 'output', text: 'Available commands:' });
                newLines.push({ type: 'output', text: '  help          Show this help message' });
                newLines.push({ type: 'output', text: '  clear         Clear terminal output' });
                newLines.push({ type: 'output', text: '  echo <text>   Print text to terminal' });
                newLines.push({ type: 'output', text: '  date          Show current date and time' });
                newLines.push({ type: 'output', text: '  pwd           Show current workspace path' });
                newLines.push({ type: 'output', text: '  ls            List open files/tabs' });
                newLines.push({ type: 'output', text: '  wc            Word count for active file' });
                newLines.push({ type: 'output', text: '  env           Show environment info' });
                newLines.push({ type: 'output', text: '  whoami        Show current user context' });
                newLines.push({ type: 'output', text: '  history       Show command history' });
                newLines.push({ type: 'output', text: '  exit          Close terminal' });
                break;

            case 'clear':
                setLines([]);
                setInput('');
                setHistory(prev => [...prev, trimmed].slice(-LIMIT_TERMINAL_HISTORY));
                setHistoryIndex(-1);
                return;

            case 'echo':
                newLines.push({ type: 'output', text: args.join(' ') });
                break;

            case 'date':
                newLines.push({ type: 'output', text: new Date().toString() });
                break;

            case 'pwd':
            {
                const { workspacePath } = useNotemacStore.getState();
                newLines.push({ type: 'output', text: workspacePath || '/notemac++' });
                break;
            }

            case 'ls':
            {
                const currentTabs = useNotemacStore.getState().tabs;
                if (0 === currentTabs.length)
                {
                    newLines.push({ type: 'output', text: '(no open files)' });
                }
                else
                {
                    for (const tab of currentTabs)
                    {
                        const modified = tab.isModified ? ' *' : '';
                        const pinned = tab.isPinned ? ' [pinned]' : '';
                        newLines.push({ type: 'output', text: `  ${tab.name}${modified}${pinned}  (${tab.language})` });
                    }
                }
                break;
            }

            case 'wc':
            {
                const state = useNotemacStore.getState();
                const activeTab = state.tabs.find(t => t.id === state.activeTabId);
                if (activeTab)
                {
                    const content = activeTab.content;
                    const lineCount = content.split('\n').length;
                    const wordCount = content.split(/\s+/).filter(w => 0 < w.length).length;
                    const charCount = content.length;
                    newLines.push({ type: 'output', text: `  ${lineCount} lines, ${wordCount} words, ${charCount} characters` });
                    newLines.push({ type: 'output', text: `  File: ${activeTab.name}` });
                }
                else
                {
                    newLines.push({ type: 'error', text: 'No active file' });
                }
                break;
            }

            case 'env':
                newLines.push({ type: 'output', text: `  Platform: ${navigator.platform}` });
                newLines.push({ type: 'output', text: `  Electron: ${window.electronAPI ? 'yes' : 'no (web mode)'}` });
                newLines.push({ type: 'output', text: `  Tabs open: ${tabs.length}` });
                newLines.push({ type: 'output', text: `  User Agent: ${navigator.userAgent.substring(0, 80)}...` });
                break;

            case 'whoami':
                newLines.push({ type: 'output', text: 'notemac-user' });
                break;

            case 'history':
                if (0 === history.length)
                {
                    newLines.push({ type: 'output', text: '(no history)' });
                }
                else
                {
                    for (let i = 0, maxCount = history.length; i < maxCount; i++)
                    {
                        newLines.push({ type: 'output', text: `  ${i + 1}  ${history[i]}` });
                    }
                }
                break;

            case 'exit':
                setShowTerminalPanel(false);
                return;

            default:
                newLines.push({ type: 'error', text: `Command not found: ${command}. Type "help" for available commands.` });
                break;
        }

        setLines(prev => [...prev, ...newLines]);
        setHistory(prev => [...prev, trimmed].slice(-LIMIT_TERMINAL_HISTORY));
        setHistoryIndex(-1);
        setInput('');
    }, [tabs, history]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('Enter' === e.key)
        {
            e.preventDefault();
            executeCommand(input);
        }
        else if ('ArrowUp' === e.key)
        {
            e.preventDefault();
            if (0 < history.length)
            {
                const newIndex = -1 === historyIndex ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex]);
            }
        }
        else if ('ArrowDown' === e.key)
        {
            e.preventDefault();
            if (-1 !== historyIndex)
            {
                const newIndex = historyIndex + 1;
                if (newIndex >= history.length)
                {
                    setHistoryIndex(-1);
                    setInput('');
                }
                else
                {
                    setHistoryIndex(newIndex);
                    setInput(history[newIndex]);
                }
            }
        }
        else if ('c' === e.key && e.ctrlKey)
        {
            e.preventDefault();
            setLines(prev => [...prev, { type: 'input', text: `$ ${input}^C` }]);
            setInput('');
        }
        else if ('l' === e.key && e.ctrlKey)
        {
            e.preventDefault();
            setLines([]);
        }
    }, [input, history, historyIndex, executeCommand]);

    // Drag resize handlers
    const handleDragStart = useCallback((e: React.MouseEvent) =>
    {
        e.preventDefault();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = terminalHeight;
    }, [terminalHeight]);

    useEffect(() =>
    {
        if (!isDragging)
            return;

        const handleMouseMove = (e: MouseEvent) =>
        {
            const delta = dragStartY.current - e.clientY;
            setTerminalHeight(dragStartHeight.current + delta);
        };

        const handleMouseUp = () =>
        {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () =>
        {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const getLineColor = (type: TerminalLine['type']) =>
    {
        switch (type)
        {
            case 'input': return theme.accent;
            case 'error': return '#ff6b6b';
            case 'info': return theme.textSecondary;
            default: return theme.text;
        }
    };

    return (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Resize handle */}
            <div
                onMouseDown={handleDragStart}
                style={{
                    height: 4,
                    backgroundColor: theme.border,
                    cursor: 'ns-resize',
                    flexShrink: 0,
                }}
            />

            {/* Terminal container */}
            <div
                style={{
                    height: terminalHeight,
                    backgroundColor: theme.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                    fontSize: 12,
                }}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Terminal header */}
                <div style={{
                    padding: '4px 12px',
                    backgroundColor: theme.bgSecondary,
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600 }}>TERMINAL</span>
                    <button
                        onClick={() => setShowTerminalPanel(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: theme.textSecondary,
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: '0 4px',
                        }}
                    >
                        {'\u00d7'}
                    </button>
                </div>

                {/* Output area */}
                <div
                    ref={outputRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px 12px',
                    }}
                >
                    {lines.map((line, i) => (
                        <div key={i} style={{ color: getLineColor(line.type), lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {line.text}
                        </div>
                    ))}
                </div>

                {/* Input line */}
                <div style={{
                    padding: '6px 12px',
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                }}>
                    <span style={{ color: theme.accent, fontWeight: 600 }}>$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: theme.text,
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                        }}
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
