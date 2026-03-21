/**
 * RunOutputPanelViewPresenter — Bottom panel showing compile/run output.
 *
 * Displays streaming output from file execution with ANSI color support,
 * run/stop buttons, and exit code indicator. Auto-scrolls and supports
 * resizing via drag handle.
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import { RunCurrentFile, StopExecution, ClearOutput } from '../Controllers/CompileRunController';
import { FormatTaskDuration, ParseANSIColors } from '../Services/TaskRunnerService';

interface RunOutputPanelProps
{
    theme: ThemeColors;
}

export function RunOutputPanel({ theme }: RunOutputPanelProps)
{
    const {
        compileRunExecution,
        compileRunStatus,
        compileRunPanelVisible,
    } = useNotemacStore();

    const outputRef = useRef<HTMLDivElement>(null);
    const [elapsedTime, setElapsedTime] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [dragHandleHovered, setDragHandleHovered] = useState(false);

    // Auto-scroll to bottom when output changes
    useEffect(() =>
    {
        if (outputRef.current)
        {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [compileRunExecution?.output?.length]);

    // Update elapsed time while running
    useEffect(() =>
    {
        if (null === compileRunExecution || !compileRunExecution.startTime)
        {
            setElapsedTime('');
            return;
        }

        const isRunning = null === compileRunExecution.endTime;
        if (!isRunning)
        {
            // Execution is complete, use the recorded duration
            if (compileRunExecution.endTime)
            {
                setElapsedTime(
                    FormatTaskDuration(compileRunExecution.startTime, compileRunExecution.endTime)
                );
            }
            return;
        }

        // Update timer every 100ms while running
        const interval = setInterval(() =>
        {
            const current = useNotemacStore.getState().compileRunExecution;
            if (current && current.startTime && null === current.endTime)
            {
                setElapsedTime(FormatTaskDuration(current.startTime, Date.now()));
            }
        }, 100);

        return () => clearInterval(interval);
    }, [compileRunExecution, compileRunExecution?.startTime, compileRunExecution?.endTime]);

    const isRunning = null !== compileRunExecution && null === compileRunExecution.endTime;

    const handleRun = () =>
    {
        RunCurrentFile();
    };

    const handleStop = () =>
    {
        StopExecution();
    };

    const handleClear = () =>
    {
        ClearOutput();
    };

    const handleMouseDown = () =>
    {
        setIsDragging(true);
    };

    const handleMouseUp = () =>
    {
        setIsDragging(false);
    };

    useEffect(() =>
    {
        if (!isDragging)
            return;

        const handleMouseMove = (_e: MouseEvent) =>
        {
            // Panel resize logic would go here if needed
            // For now, just track the drag state
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () =>
        {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!compileRunExecution && !compileRunPanelVisible)
    {
        return null;
    }

    if (!compileRunExecution)
    {
        return (
            <div style={{
                height: 200,
                background: theme.editorBg,
                borderTop: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.text,
                opacity: 0.5,
                fontSize: 12,
            }}>
                No output to display.
            </div>
        );
    }

    const panelStyles = useMemo(() => ({
        container: {
            height: 200,
            background: theme.editorBg,
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column' as const,
            userSelect: isDragging ? 'none' as const : undefined,
        },
        dragHandle: {
            height: 4,
            background: theme.border,
            cursor: 'row-resize',
            opacity: dragHandleHovered ? 1 : 0.5,
            transition: 'opacity 0.2s',
            flexShrink: 0,
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderBottom: `1px solid ${theme.border}`,
            gap: 8,
            flexShrink: 0,
        },
        button: {
            background: 'transparent',
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 11,
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'opacity 0.2s',
        },
        buttonActive: {
            background: '#44cc44',
            color: '#fff',
            border: 'none',
            opacity: 1,
        },
        buttonStop: {
            background: '#ff4444',
            color: '#fff',
            border: 'none',
            opacity: 1,
        },
        statusText: {
            fontSize: 12,
            fontWeight: 600 as const,
            color: theme.text,
            flex: 1,
        },
        timerText: {
            fontSize: 11,
            color: theme.text,
            opacity: 0.6,
            minWidth: 60,
        },
        exitCodeSuccess: {
            fontSize: 11,
            color: '#44cc44',
            fontWeight: 600 as const,
        },
        exitCodeError: {
            fontSize: 11,
            color: '#ff4444',
            fontWeight: 600 as const,
        },
        outputArea: {
            flex: 1,
            overflow: 'auto' as const,
            padding: '4px 8px',
            fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: 12,
            lineHeight: '18px',
            color: theme.text,
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
        },
    }), [theme, isDragging, dragHandleHovered]);

    return (
        <div style={panelStyles.container as React.CSSProperties}>
            {/* Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setDragHandleHovered(true)}
                onMouseLeave={() => setDragHandleHovered(false)}
                style={panelStyles.dragHandle as React.CSSProperties}
                title="Drag to resize panel"
            />

            {/* Toolbar */}
            <div style={panelStyles.toolbar as React.CSSProperties}>
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    style={{
                        ...panelStyles.button,
                        ...(isRunning ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                    } as React.CSSProperties}
                    title="Run current file"
                >
                    ▶ Run
                </button>

                {isRunning && (
                    <button
                        onClick={handleStop}
                        style={panelStyles.buttonStop as React.CSSProperties}
                        title="Stop execution"
                    >
                        ■ Stop
                    </button>
                )}

                <button
                    onClick={handleClear}
                    style={panelStyles.button as React.CSSProperties}
                    title="Clear output"
                >
                    ✕ Clear
                </button>

                <span style={panelStyles.statusText as React.CSSProperties}>
                    {FormatStatusLabel(compileRunStatus)}
                </span>

                {isRunning && (
                    <span style={panelStyles.timerText as React.CSSProperties}>
                        {elapsedTime}
                    </span>
                )}

                {!isRunning && compileRunExecution.exitCode !== undefined && (
                    <span
                        style={
                            0 === compileRunExecution.exitCode
                                ? (panelStyles.exitCodeSuccess as React.CSSProperties)
                                : (panelStyles.exitCodeError as React.CSSProperties)
                        }
                    >
                        {0 === compileRunExecution.exitCode ? '✓' : '✗'} Code: {compileRunExecution.exitCode}
                        {elapsedTime && (
                            <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 4 }}>
                                ({elapsedTime})
                            </span>
                        )}
                    </span>
                )}
            </div>

            {/* Output Area */}
            <div
                ref={outputRef}
                style={panelStyles.outputArea as React.CSSProperties}
            >
                {compileRunExecution.output.map((line, index) => (
                    <OutputLine key={index} text={line} />
                ))}
            </div>
        </div>
    );
}

// ─── Status Label Formatting ─────────────────────────────────────────

function FormatStatusLabel(status: string): string
{
    switch (status)
    {
        case 'idle':      return 'Ready';
        case 'compiling': return 'Compiling...';
        case 'running':   return 'Running...';
        case 'success':   return 'Completed';
        case 'failed':    return 'Failed';
        case 'cancelled': return 'Cancelled';
        default:          return 'Ready';
    }
}

// ─── Output Line with ANSI Color Support ────────────────────────────

const OutputLine = React.memo(function OutputLine({ text }: { text: string })
{
    const segments = ParseANSIColors(text);

    if (1 === segments.length && !segments[0].color && !segments[0].bold)
    {
        return <div>{text}</div>;
    }

    return (
        <div>
            {segments.map((seg, i) => (
                <span
                    key={i}
                    style={{
                        color: seg.color,
                        fontWeight: seg.bold ? 'bold' : undefined,
                    }}
                >
                    {seg.text}
                </span>
            ))}
        </div>
    );
});
