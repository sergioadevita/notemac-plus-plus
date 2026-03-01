/**
 * TaskRunnerController — Orchestrates task execution lifecycle.
 *
 * Bridges the TaskRunnerService (pure logic) with the Zustand store
 * and event dispatcher. Manages task execution, cancellation, and
 * configuration loading.
 */

import { useNotemacStore } from '../Model/Store';
import {
    ValidateTaskDefinition,
    ParseTasksConfig,
    GetDefaultTask,
    GenerateSimulatedOutput,
    FormatTaskDuration,
} from '../Services/TaskRunnerService';
import { Dispatch } from '../../Shared/EventDispatcher/EventDispatcher';
import { NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import type { TaskDefinition } from '../Commons/Types';

// Track the active simulation timer for cancellation
let activeSimulationTimer: ReturnType<typeof setTimeout> | null = null;
let activeOutputTimers: ReturnType<typeof setTimeout>[] = [];

// ─── Task Execution ─────────────────────────────────────────────────

/**
 * Run a task by ID. Looks up the task in the store and simulates execution.
 */
export function RunTask(taskId: string): void
{
    const store = useNotemacStore.getState();

    // Prevent running if a task is already executing
    if (null !== store.currentExecution)
        return;

    const task = store.tasks.find(t => t.id === taskId);
    if (!task)
        return;

    // Start execution in store
    store.StartTaskExecution(taskId);
    Dispatch(NOTEMAC_EVENTS.TASK_STARTED, { taskId, label: task.label });

    // Generate simulated output and stream it line by line
    const outputLines = GenerateSimulatedOutput(task);
    activeOutputTimers = [];

    const lineDelay = 150; // ms between lines

    for (let i = 0; i < outputLines.length; i++)
    {
        const timer = setTimeout(() =>
        {
            const currentStore = useNotemacStore.getState();
            // Only append if still running (not cancelled)
            if (null !== currentStore.currentExecution && 'running' === currentStore.currentExecution.status)
            {
                currentStore.AppendTaskOutput(outputLines[i]);
            }
        }, i * lineDelay);
        activeOutputTimers.push(timer);
    }

    // Complete execution after all output has been streamed
    const totalTime = outputLines.length * lineDelay + 200;
    activeSimulationTimer = setTimeout(() =>
    {
        const currentStore = useNotemacStore.getState();
        if (null !== currentStore.currentExecution && 'running' === currentStore.currentExecution.status)
        {
            currentStore.CompleteTaskExecution(0);
            Dispatch(NOTEMAC_EVENTS.TASK_COMPLETED, {
                taskId,
                label: task.label,
                exitCode: 0,
            });
        }
        activeSimulationTimer = null;
        activeOutputTimers = [];
    }, totalTime);
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

    // Clear all timers
    if (null !== activeSimulationTimer)
    {
        clearTimeout(activeSimulationTimer);
        activeSimulationTimer = null;
    }
    for (const timer of activeOutputTimers)
    {
        clearTimeout(timer);
    }
    activeOutputTimers = [];

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
