/**
 * TaskRunnerPanelViewPresenter — Sidebar panel for task management.
 *
 * Shows available tasks grouped by category (Build, Test, Lint, Custom)
 * with run buttons and status indicators.
 */

import React, { useMemo } from 'react';
import { useNotemacStore } from '../Model/Store';
import type { ThemeColors } from '../Configs/ThemeConfig';
import type { TaskDefinition } from '../Commons/Types';
import { RunTask, CancelCurrentTask } from '../Controllers/TaskRunnerController';
import { GetTasksByGroup } from '../Services/TaskRunnerService';

interface TaskRunnerPanelProps
{
    theme: ThemeColors;
}

const TASK_GROUPS = ['build', 'test', 'lint', 'custom'] as const;

const GROUP_LABELS: Record<string, string> =
{
    build: 'Build',
    test: 'Test',
    lint: 'Lint',
    custom: 'Custom',
};

const GROUP_ICONS: Record<string, string> =
{
    build: '⚙',
    test: '✓',
    lint: '⚡',
    custom: '▶',
};

export function TaskRunnerPanelViewPresenter({ theme }: TaskRunnerPanelProps)
{
    const { tasks, currentExecution, SetTaskPanelVisible } = useNotemacStore();

    const groupedTasks = useMemo(() =>
    {
        const groups: Record<string, TaskDefinition[]> = {};
        for (const group of TASK_GROUPS)
        {
            const groupTasks = GetTasksByGroup(tasks, group);
            if (0 < groupTasks.length)
            {
                groups[group] = groupTasks;
            }
        }
        return groups;
    }, [tasks]);

    const isRunning = null !== currentExecution;

    const handleRunTask = (taskId: string) =>
    {
        if (!isRunning)
        {
            RunTask(taskId);
        }
    };

    const handleCancel = () =>
    {
        CancelCurrentTask();
    };

    const handleShowOutput = () =>
    {
        SetTaskPanelVisible(true);
    };

    return (
        <div style={{ padding: 8, height: '100%', overflow: 'auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: theme.text }}>
                    Tasks
                </span>
                {isRunning && (
                    <button
                        onClick={handleCancel}
                        style={{
                            background: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                        title="Cancel running task"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {isRunning && (
                <div
                    onClick={handleShowOutput}
                    style={{
                        background: theme.editorBg,
                        borderRadius: 4,
                        padding: '6px 8px',
                        marginBottom: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: theme.text,
                    }}
                >
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                    <span>Running: {tasks.find(t => t.id === currentExecution.taskId)?.label || currentExecution.taskId}</span>
                </div>
            )}

            {0 === tasks.length && (
                <div style={{
                    color: theme.text,
                    opacity: 0.5,
                    fontSize: 12,
                    padding: '20px 0',
                    textAlign: 'center',
                }}>
                    No tasks configured.
                    <br />
                    Use the Command Palette to configure tasks.
                </div>
            )}

            {TASK_GROUPS.map(group =>
            {
                const groupTasks = groupedTasks[group];
                if (!groupTasks || 0 === groupTasks.length)
                    return null;

                return (
                    <div key={group} style={{ marginBottom: 12 }}>
                        <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: theme.text,
                            opacity: 0.6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 4,
                            padding: '0 4px',
                        }}>
                            {GROUP_ICONS[group]} {GROUP_LABELS[group]}
                        </div>

                        {groupTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                theme={theme}
                                isRunning={isRunning && currentExecution.taskId === task.id}
                                isDisabled={isRunning}
                                onRun={() => handleRunTask(task.id)}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Task Item ──────────────────────────────────────────────────────

interface TaskItemProps
{
    task: TaskDefinition;
    theme: ThemeColors;
    isRunning: boolean;
    isDisabled: boolean;
    onRun: () => void;
}

const TaskItem = React.memo(function TaskItem({ task, theme, isRunning, isDisabled, onRun }: TaskItemProps)
{
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled && !isRunning ? 0.5 : 1,
                fontSize: 12,
                color: theme.text,
            }}
            onClick={isDisabled ? undefined : onRun}
            title={task.command}
        >
            <span style={{ marginRight: 6, fontSize: 10 }}>
                {isRunning ? '⟳' : '▶'}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.label}
            </span>
            {task.isDefault && (
                <span style={{
                    fontSize: 9,
                    background: theme.editorBg,
                    padding: '1px 4px',
                    borderRadius: 3,
                    opacity: 0.7,
                }}>
                    default
                </span>
            )}
        </div>
    );
});
