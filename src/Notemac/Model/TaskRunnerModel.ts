import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { TaskDefinition, TaskExecution } from '../Commons/Types';
import { LIMIT_TASK_HISTORY, LIMIT_TASK_OUTPUT_LINES } from '../Commons/Constants';

export interface NotemacTaskRunnerSlice
{
    tasks: TaskDefinition[];
    currentExecution: TaskExecution | null;
    taskHistory: TaskExecution[];
    isTaskPanelVisible: boolean;
    selectedTaskId: string | null;

    AddTask: (task: TaskDefinition) => void;
    UpdateTask: (id: string, updates: Partial<TaskDefinition>) => void;
    RemoveTask: (id: string) => void;
    SetTasks: (tasks: TaskDefinition[]) => void;

    StartTaskExecution: (taskId: string) => void;
    AppendTaskOutput: (line: string) => void;
    CompleteTaskExecution: (exitCode: number) => void;
    CancelTaskExecution: () => void;

    SetTaskPanelVisible: (visible: boolean) => void;
    SetSelectedTask: (taskId: string | null) => void;
    ClearTaskHistory: () => void;

    showConfigureTasksDialog: boolean;
    SetShowConfigureTasksDialog: (show: boolean) => void;
}

export const createTaskRunnerSlice: StateCreator<NotemacTaskRunnerSlice, [], [], NotemacTaskRunnerSlice> = (set, get) => ({
    tasks: [],
    currentExecution: null,
    taskHistory: [],
    isTaskPanelVisible: false,
    selectedTaskId: null,

    AddTask: (task) =>
    {
        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            // Prevent duplicate IDs
            const exists = state.tasks.some(t => t.id === task.id);
            if (!exists)
            {
                state.tasks.push(task);
            }
        }));
    },

    UpdateTask: (id, updates) =>
    {
        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            const index = state.tasks.findIndex(t => t.id === id);
            if (-1 !== index)
            {
                state.tasks[index] = { ...state.tasks[index], ...updates };
            }
        }));
    },

    RemoveTask: (id) =>
    {
        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            state.tasks = state.tasks.filter(t => t.id !== id);
        }));
    },

    SetTasks: (tasks) =>
    {
        set({ tasks });
    },

    StartTaskExecution: (taskId) =>
    {
        const execution: TaskExecution = {
            taskId,
            startTime: Date.now(),
            output: [],
            status: 'running',
        };
        set({ currentExecution: execution, isTaskPanelVisible: true });
    },

    AppendTaskOutput: (line) =>
    {
        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            if (null !== state.currentExecution)
            {
                if (state.currentExecution.output.length < LIMIT_TASK_OUTPUT_LINES)
                {
                    state.currentExecution.output.push(line);
                }
            }
        }));
    },

    CompleteTaskExecution: (exitCode) =>
    {
        const current = get().currentExecution;
        if (null === current)
            return;

        const completed: TaskExecution = {
            ...current,
            endTime: Date.now(),
            exitCode,
            status: 0 === exitCode ? 'success' : 'failed',
        };

        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            state.currentExecution = null;
            state.taskHistory.unshift(completed);
            if (state.taskHistory.length > LIMIT_TASK_HISTORY)
            {
                state.taskHistory = state.taskHistory.slice(0, LIMIT_TASK_HISTORY);
            }
        }));
    },

    CancelTaskExecution: () =>
    {
        const current = get().currentExecution;
        if (null === current)
            return;

        const cancelled: TaskExecution = {
            ...current,
            endTime: Date.now(),
            exitCode: -1,
            status: 'cancelled',
        };

        set(produce((state: NotemacTaskRunnerSlice) =>
        {
            state.currentExecution = null;
            state.taskHistory.unshift(cancelled);
            if (state.taskHistory.length > LIMIT_TASK_HISTORY)
            {
                state.taskHistory = state.taskHistory.slice(0, LIMIT_TASK_HISTORY);
            }
        }));
    },

    SetTaskPanelVisible: (visible) =>
    {
        set({ isTaskPanelVisible: visible });
    },

    SetSelectedTask: (taskId) =>
    {
        set({ selectedTaskId: taskId });
    },

    ClearTaskHistory: () =>
    {
        set({ taskHistory: [] });
    },

    showConfigureTasksDialog: false,
    SetShowConfigureTasksDialog: (show) =>
    {
        set({ showConfigureTasksDialog: show });
    },
});
