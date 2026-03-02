/**
 * TaskRunnerController — Orchestrates task execution lifecycle.
 *
 * Bridges the TaskRunnerService (pure logic) with the Zustand store
 * and event dispatcher. On desktop platforms, spawns real OS processes
 * via ProcessExecutionService. Task runner is unavailable on web.
 */

import { useNotemacStore } from '../Model/Store';
import {
    ValidateTaskDefinition,
    ParseTasksConfig,
    GetDefaultTask,
    FormatTaskDuration,
} from '../Services/TaskRunnerService';
import { ExecuteTask as ExecuteProcess } from '../Services/ProcessExecutionService';
import type { ProcessHandle } from '../Services/ProcessExecutionService';
import { IsDesktopEnvironment } from '../Services/PlatformBridge';
import { Dispatch } from '../../Shared/EventDispatcher/EventDispatcher';
import { NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import type { TaskDefinition } from '../Commons/Types';

// Track the active process handle for cancellation
let activeProcessHandle: ProcessHandle | null = null;

// ─── Task Execution ─────────────────────────────────────────────────

/**
 * Run a task by ID. Spawns a real OS process on desktop platforms.
 */
export function RunTask(taskId: string): void
{
    const store = useNotemacStore.getState();

    // Task runner is only available on desktop
    if (!IsDesktopEnvironment())
        return;

    // Prevent running if a task is already executing
    if (null !== store.currentExecution)
        return;

    const task = store.tasks.find(t => t.id === taskId);
    if (!task)
        return;

    // Start execution in store
    store.StartTaskExecution(taskId);
    Dispatch(NOTEMAC_EVENTS.TASK_STARTED, { taskId, label: task.label });

    // Echo the command being run
    store.AppendTaskOutput(`> Executing task: ${task.label}`);
    store.AppendTaskOutput(`> Command: ${task.command}`);
    if (task.cwd)
    {
        store.AppendTaskOutput(`> Working directory: ${task.cwd}`);
    }
    store.AppendTaskOutput('');

    // Execute real process
    activeProcessHandle = ExecuteProcess(task, {
        onLine(line: string)
        {
            const currentStore = useNotemacStore.getState();
            if (null !== currentStore.currentExecution && 'running' === currentStore.currentExecution.status)
            {
                currentStore.AppendTaskOutput(line);
            }
        },

        onExit(exitCode: number)
        {
            const currentStore = useNotemacStore.getState();
            if (null !== currentStore.currentExecution && 'running' === currentStore.currentExecution.status)
            {
                currentStore.AppendTaskOutput('');
                currentStore.AppendTaskOutput(`> Task "${task.label}" finished with exit code ${exitCode}`);
                currentStore.CompleteTaskExecution(exitCode);
                Dispatch(NOTEMAC_EVENTS.TASK_COMPLETED, {
                    taskId,
                    label: task.label,
                    exitCode,
                });
            }
            activeProcessHandle = null;
        },

        onError(message: string)
        {
            const currentStore = useNotemacStore.getState();
            if (null !== currentStore.currentExecution && 'running' === currentStore.currentExecution.status)
            {
                currentStore.AppendTaskOutput(`[ERROR] ${message}`);
            }
        },
    });
}

/**
 * Run the default build task.
 */
export function RunBuildTask(): void
{
    const store = useNotemacStore.getState();
    const task = GetDefaultTask(store.tasks, 'build');
    if (task)
    {
        RunTask(task.id);
    }
}

/**
 * Run the default test task.
 */
export function RunTestTask(): void
{
    const store = useNotemacStore.getState();
    const task = GetDefaultTask(store.tasks, 'test');
    if (task)
    {
        RunTask(task.id);
    }
}

/**
 * Cancel the currently running task.
 */
export function CancelCurrentTask(): void
{
    const store = useNotemacStore.getState();
    if (null === store.currentExecution)
        return;

    const taskId = store.currentExecution.taskId;

    // Kill the active process
    if (null !== activeProcessHandle)
    {
        activeProcessHandle.cancel();
        activeProcessHandle = null;
    }

    store.CancelTaskExecution();
    Dispatch(NOTEMAC_EVENTS.TASK_TERMINATED, { taskId });
}

// ─── Task Configuration ─────────────────────────────────────────────

/**
 * Load tasks from a JSON config string.
 */
export function LoadTasksFromConfig(configText: string): number
{
    const tasks = ParseTasksConfig(configText);
    if (0 < tasks.length)
    {
        useNotemacStore.getState().SetTasks(tasks);
    }
    return tasks.length;
}

/**
 * Add a new task after validation.
 */
export function AddNewTask(task: TaskDefinition): { success: boolean; errors: string[] }
{
    const validation = ValidateTaskDefinition(task);
    if (!validation.valid)
    {
        return { success: false, errors: validation.errors };
    }

    useNotemacStore.getState().AddTask(task);
    return { success: true, errors: [] };
}

/**
 * Delete a task by ID.
 */
export function DeleteTask(taskId: string): void
{
    useNotemacStore.getState().RemoveTask(taskId);
}

/**
 * Get a formatted duration string for the last completed task.
 */
export function GetLastTaskDuration(): string
{
    const store = useNotemacStore.getState();
    if (0 === store.taskHistory.length)
        return '';

    const last = store.taskHistory[0];
    if (last.endTime && last.startTime)
    {
        return FormatTaskDuration(last.startTime, last.endTime);
    }
    return '';
}
