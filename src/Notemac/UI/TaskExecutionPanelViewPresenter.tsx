/**
 * TaskExecutionPanelViewPresenter — Bottom panel showing task output.
 *
 * Displays streaming output from task execution with ANSI color support,
 * cancel button, and exit code indicator.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import { CancelCurrentTask } from '../Controllers/TaskRunnerController';
import { FormatTaskDuration, ParseANSIColors } from '../Services/TaskRunnerService';

interface TaskExecutionPanelProps
{
    theme: ThemeColors;
}

export function TaskExecutionPanelViewPresenter({ theme }: TaskExecutionPanelProps)
{
    const {
        currentExecution,
        taskHistory,
        tasks,
        SetTaskPanelVisible,
        ClearTaskHistory,
    } = useNotemacStore();

    const outputRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output changes
    useEffect(() =>
    {
        if (outputRef.current)
        {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [currentExecution?.output?.length]);

    // Get the last completed execution for display when not running
    const lastExecution = 0 < taskHistory.length ? taskHistory[0] : null;
    const displayExecution = currentExecution || lastExecution;

    const taskLabel = useMemo(() =>
    {
        if (!displayExecution)
            return '';
        const task = tasks.find(t => t.id === displayExecution.taskId);
        return task ? task.label : displayExecution.taskId;
    }, [displayExecution, tasks]);

    const duration = useMemo(() =>
    {
        if (!displayExecution || !displayExecution.endTime)
            return '';
        return FormatTaskDuration(displayExecution.startTime, displayExecution.endTime);
    }, [displayExecution]);

    const isRunning = null !== currentExecution;

    const handleClose = () =>
    {
        SetTaskPanelVisible(false);
    };

    const handleCancel = () =>
    {
        CancelCurrentTask();
    };

    const handleClear = () =>
    {
        ClearTaskHistory();
    };

    if (!displayExecution)
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
                No task output to display.
            </div>
        );
    }

    return (
        <div style={{
            height: 200,
            background: theme.editorBg,
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderBottom: `1px solid ${theme.border}`,
                gap: 8,
                flexShrink: 0,
            }}>
                <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.text,
                    flex: 1,
                }}>
                    Task: {taskLabel}
                    {isRunning && <span style={{ marginLeft: 6, opacity: 0.6 }}>⟳ Running...</span>}
                    {!isRunning && displayExecution.exitCode !== undefined && (
                        <span style={{
                            marginLeft: 6,
                            color: 0 === displayExecution.exitCode ? '#44cc44' : '#ff4444',
                        }}>
                            {0 === displayExecution.exitCode ? '✓' : '✗'} Exit code: {displayExecution.exitCode}
                        </span>
                    )}
                    {duration && <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 11 }}>({duration})</span>}
                </span>

                {isRunning && (
                    <button
                        onClick={handleCancel}
                        style={{
                            background: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '2px 6px',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleClear}
                    style={{
                        background: 'transparent',
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 3,
                        padding: '2px 6px',
                        fontSize: 11,
                        cursor: 'pointer',
                        opacity: 0.7,
                    }}
                >
                    Clear
                </button>
                <button
                    onClick={handleClose}
                    style={{
                        background: 'transparent',
                        color: theme.text,
                        border: 'none',
                        padding: '2px 4px',
                        fontSize: 14,
                        cursor: 'pointer',
                        opacity: 0.7,
                    }}
                    title="Close panel"
                >
                    ×
                </button>
            </div>

            {/* Output */}
            <div
                ref={outputRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '4px 8px',
                    fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                    fontSize: 12,
                    lineHeight: '18px',
                    color: theme.text,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {displayExecution.output.map((line, index) => (
                    <OutputLine key={index} text={line} />
                ))}
            </div>
        </div>
    );
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
