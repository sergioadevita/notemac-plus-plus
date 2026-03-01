import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { TaskDefinition, TaskExecution } from '../Notemac/Commons/Types';
import { LIMIT_TASK_HISTORY, LIMIT_TASK_OUTPUT_LINES } from '../Notemac/Commons/Constants';

function resetStore(): void
{
    useNotemacStore.setState({
        tasks: [],
        currentExecution: null,
        taskHistory: [],
        isTaskPanelVisible: false,
        selectedTaskId: null,
        showConfigureTasksDialog: false,
    });
}

function createTask(id: string, label: string = 'Test Task', command: string = 'echo test'): TaskDefinition
{
    return {
        id,
        label,
        command,
        group: 'custom',
        isDefault: false,
    };
}

describe('TaskRunnerModel — AddTask', () =>
{
    beforeEach(() => resetStore());

    it('adds a new task', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
        expect(state.tasks[0].id).toBe('task-1');
        expect(state.tasks[0].label).toBe('Test Task');
    });

    it('prevents duplicate task IDs', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        store.AddTask(task);
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
    });

    it('adds multiple tasks with different IDs', () =>
    {
        const store = useNotemacStore.getState();
        const task1 = createTask('task-1', 'Task 1');
        const task2 = createTask('task-2', 'Task 2');
        const task3 = createTask('task-3', 'Task 3');

        store.AddTask(task1);
        store.AddTask(task2);
        store.AddTask(task3);
        const state = useNotemacStore.getState();

        expect(3 === state.tasks.length).toBe(true);
        expect(state.tasks[1].id).toBe('task-2');
    });
});

describe('TaskRunnerModel — UpdateTask', () =>
{
    beforeEach(() => resetStore());

    it('updates an existing task', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1', 'Original Label');

        store.AddTask(task);
        store.UpdateTask('task-1', { label: 'Updated Label' });
        const state = useNotemacStore.getState();

        expect(state.tasks[0].label).toBe('Updated Label');
    });

    it('updates multiple properties of a task', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1', 'Original', 'echo original');

        store.AddTask(task);
        store.UpdateTask('task-1', { label: 'New Label', command: 'echo new' });
        const state = useNotemacStore.getState();

        expect(state.tasks[0].label).toBe('New Label');
        expect(state.tasks[0].command).toBe('echo new');
    });

    it('is no-op for non-existent task ID', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        store.UpdateTask('non-existent', { label: 'Updated' });
        const state = useNotemacStore.getState();

        expect(state.tasks[0].label).toBe('Test Task');
    });

    it('can set task as default', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        store.UpdateTask('task-1', { isDefault: true });
        const state = useNotemacStore.getState();

        expect(state.tasks[0].isDefault).toBe(true);
    });
});

describe('TaskRunnerModel — RemoveTask', () =>
{
    beforeEach(() => resetStore());

    it('removes a task by ID', () =>
    {
        const store = useNotemacStore.getState();
        const task1 = createTask('task-1');
        const task2 = createTask('task-2');

        store.AddTask(task1);
        store.AddTask(task2);
        store.RemoveTask('task-1');
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
        expect(state.tasks[0].id).toBe('task-2');
    });

    it('is no-op for non-existent task ID', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        store.RemoveTask('non-existent');
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
    });

    it('removes multiple tasks', () =>
    {
        const store = useNotemacStore.getState();
        const task1 = createTask('task-1');
        const task2 = createTask('task-2');
        const task3 = createTask('task-3');

        store.AddTask(task1);
        store.AddTask(task2);
        store.AddTask(task3);
        store.RemoveTask('task-2');
        store.RemoveTask('task-1');
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
        expect(state.tasks[0].id).toBe('task-3');
    });
});

describe('TaskRunnerModel — SetTasks', () =>
{
    beforeEach(() => resetStore());

    it('replaces entire task array', () =>
    {
        const store = useNotemacStore.getState();
        const task1 = createTask('task-1');
        const task2 = createTask('task-2');

        store.AddTask(task1);
        store.SetTasks([task2]);
        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
        expect(state.tasks[0].id).toBe('task-2');
    });

    it('clears tasks when given empty array', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1');

        store.AddTask(task);
        store.SetTasks([]);
        const state = useNotemacStore.getState();

        expect(0 === state.tasks.length).toBe(true);
    });

    it('sets multiple tasks at once', () =>
    {
        const store = useNotemacStore.getState();
        const tasks = [
            createTask('task-1', 'Task 1'),
            createTask('task-2', 'Task 2'),
            createTask('task-3', 'Task 3'),
        ];

        store.SetTasks(tasks);
        const state = useNotemacStore.getState();

        expect(3 === state.tasks.length).toBe(true);
        expect(state.tasks[0].id).toBe('task-1');
        expect(state.tasks[2].id).toBe('task-3');
    });
});

describe('TaskRunnerModel — StartTaskExecution', () =>
{
    beforeEach(() => resetStore());

    it('creates execution and sets panel visible', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        const state = useNotemacStore.getState();

        expect(null !== state.currentExecution).toBe(true);
        expect(state.currentExecution?.taskId).toBe('task-1');
        expect(state.currentExecution?.status).toBe('running');
        expect(0 === state.currentExecution?.output.length).toBe(true);
        expect(state.isTaskPanelVisible).toBe(true);
    });

    it('initializes execution with startTime', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartTaskExecution('task-1');
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(null !== state.currentExecution?.startTime).toBe(true);
        expect(state.currentExecution!.startTime >= beforeTime).toBe(true);
        expect(state.currentExecution!.startTime <= afterTime).toBe(true);
    });

    it('replaces previous execution', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.StartTaskExecution('task-2');
        const state = useNotemacStore.getState();

        expect(state.currentExecution?.taskId).toBe('task-2');
    });
});

describe('TaskRunnerModel — AppendTaskOutput', () =>
{
    beforeEach(() => resetStore());

    it('appends line to output', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Line 1');
        store.AppendTaskOutput('Line 2');
        const state = useNotemacStore.getState();

        expect(2 === state.currentExecution?.output.length).toBe(true);
        expect(state.currentExecution?.output[0]).toBe('Line 1');
        expect(state.currentExecution?.output[1]).toBe('Line 2');
    });

    it('ignores append when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.AppendTaskOutput('Line 1');
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
    });

    it('respects LIMIT_TASK_OUTPUT_LINES', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');

        for (let i = 0; i < LIMIT_TASK_OUTPUT_LINES + 100; i++)
        {
            store.AppendTaskOutput(`Line ${i}`);
        }
        const state = useNotemacStore.getState();

        expect(LIMIT_TASK_OUTPUT_LINES === state.currentExecution?.output.length).toBe(true);
        expect(state.currentExecution?.output[0]).toBe('Line 0');
        expect(state.currentExecution?.output[LIMIT_TASK_OUTPUT_LINES - 1]).toBe(`Line ${LIMIT_TASK_OUTPUT_LINES - 1}`);
    });

    it('stops appending after output limit is reached', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');

        for (let i = 0; i < LIMIT_TASK_OUTPUT_LINES; i++)
        {
            store.AppendTaskOutput(`Line ${i}`);
        }

        store.AppendTaskOutput('Over limit');
        const state = useNotemacStore.getState();

        expect(LIMIT_TASK_OUTPUT_LINES === state.currentExecution?.output.length).toBe(true);
        expect(state.currentExecution?.output[LIMIT_TASK_OUTPUT_LINES - 1]).toBe(`Line ${LIMIT_TASK_OUTPUT_LINES - 1}`);
    });
});

describe('TaskRunnerModel — CompleteTaskExecution', () =>
{
    beforeEach(() => resetStore());

    it('marks successful execution with exit code 0', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Task completed');
        store.CompleteTaskExecution(0);
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
        expect(1 === state.taskHistory.length).toBe(true);
        expect(state.taskHistory[0].status).toBe('success');
        expect(0 === state.taskHistory[0].exitCode).toBe(true);
    });

    it('marks failed execution with non-zero exit code', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CompleteTaskExecution(1);
        const state = useNotemacStore.getState();

        expect(state.taskHistory[0].status).toBe('failed');
        expect(1 === state.taskHistory[0].exitCode).toBe(true);
    });

    it('sets endTime when completion occurs', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartTaskExecution('task-1');
        store.CompleteTaskExecution(0);
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(null !== state.taskHistory[0].endTime).toBe(true);
        expect(state.taskHistory[0].endTime! >= beforeTime).toBe(true);
        expect(state.taskHistory[0].endTime! <= afterTime).toBe(true);
    });

    it('preserves output when completing execution', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Output 1');
        store.AppendTaskOutput('Output 2');
        store.CompleteTaskExecution(0);
        const state = useNotemacStore.getState();

        expect(2 === state.taskHistory[0].output.length).toBe(true);
        expect(state.taskHistory[0].output[0]).toBe('Output 1');
    });

    it('moves execution to history with all properties', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Test output');
        store.CompleteTaskExecution(2);
        const state = useNotemacStore.getState();

        const completed = state.taskHistory[0];
        expect(completed.taskId).toBe('task-1');
        expect(null !== completed.startTime).toBe(true);
        expect(null !== completed.endTime).toBe(true);
        expect(completed.status).toBe('failed');
        expect(2 === completed.exitCode).toBe(true);
    });

    it('respects LIMIT_TASK_HISTORY', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < LIMIT_TASK_HISTORY + 10; i++)
        {
            store.StartTaskExecution(`task-${i}`);
            store.CompleteTaskExecution(0);
        }
        const state = useNotemacStore.getState();

        expect(LIMIT_TASK_HISTORY === state.taskHistory.length).toBe(true);
    });

    it('prepends newest execution to history', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CompleteTaskExecution(0);
        store.StartTaskExecution('task-2');
        store.CompleteTaskExecution(0);

        const state = useNotemacStore.getState();

        expect(state.taskHistory[0].taskId).toBe('task-2');
        expect(state.taskHistory[1].taskId).toBe('task-1');
    });

    it('is no-op when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.CompleteTaskExecution(0);
        const state = useNotemacStore.getState();

        expect(0 === state.taskHistory.length).toBe(true);
        expect(null === state.currentExecution).toBe(true);
    });
});

describe('TaskRunnerModel — CancelTaskExecution', () =>
{
    beforeEach(() => resetStore());

    it('marks execution as cancelled', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
        expect(1 === state.taskHistory.length).toBe(true);
        expect(state.taskHistory[0].status).toBe('cancelled');
    });

    it('sets exit code to -1 when cancelled', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(-1 === state.taskHistory[0].exitCode).toBe(true);
    });

    it('sets endTime when cancelling', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartTaskExecution('task-1');
        store.CancelTaskExecution();
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(null !== state.taskHistory[0].endTime).toBe(true);
        expect(state.taskHistory[0].endTime! >= beforeTime).toBe(true);
        expect(state.taskHistory[0].endTime! <= afterTime).toBe(true);
    });

    it('preserves output when cancelling', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Partial output');
        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(1 === state.taskHistory[0].output.length).toBe(true);
        expect(state.taskHistory[0].output[0]).toBe('Partial output');
    });

    it('respects LIMIT_TASK_HISTORY when cancelling', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < LIMIT_TASK_HISTORY + 10; i++)
        {
            store.StartTaskExecution(`task-${i}`);
            store.CancelTaskExecution();
        }
        const state = useNotemacStore.getState();

        expect(LIMIT_TASK_HISTORY === state.taskHistory.length).toBe(true);
    });

    it('is no-op when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(0 === state.taskHistory.length).toBe(true);
        expect(null === state.currentExecution).toBe(true);
    });

    it('prepends cancelled execution to history', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CancelTaskExecution();
        store.StartTaskExecution('task-2');
        store.CancelTaskExecution();

        const state = useNotemacStore.getState();

        expect(state.taskHistory[0].taskId).toBe('task-2');
        expect(state.taskHistory[1].taskId).toBe('task-1');
    });
});

describe('TaskRunnerModel — SetTaskPanelVisible', () =>
{
    beforeEach(() => resetStore());

    it('sets task panel visible to true', () =>
    {
        const store = useNotemacStore.getState();

        store.SetTaskPanelVisible(true);
        const state = useNotemacStore.getState();

        expect(state.isTaskPanelVisible).toBe(true);
    });

    it('sets task panel visible to false', () =>
    {
        const store = useNotemacStore.getState();

        store.SetTaskPanelVisible(true);
        store.SetTaskPanelVisible(false);
        const state = useNotemacStore.getState();

        expect(state.isTaskPanelVisible).toBe(false);
    });

    it('toggles panel visibility', () =>
    {
        let state = useNotemacStore.getState();

        expect(state.isTaskPanelVisible).toBe(false);
        state.SetTaskPanelVisible(true);
        state = useNotemacStore.getState();
        expect(state.isTaskPanelVisible).toBe(true);

        state.SetTaskPanelVisible(false);
        state = useNotemacStore.getState();
        expect(state.isTaskPanelVisible).toBe(false);
    });

    it('is set automatically when starting execution', () =>
    {
        const store = useNotemacStore.getState();

        store.SetTaskPanelVisible(false);
        store.StartTaskExecution('task-1');
        const state = useNotemacStore.getState();

        expect(state.isTaskPanelVisible).toBe(true);
    });
});

describe('TaskRunnerModel — SetSelectedTask', () =>
{
    beforeEach(() => resetStore());

    it('sets selected task ID', () =>
    {
        const store = useNotemacStore.getState();

        store.SetSelectedTask('task-1');
        const state = useNotemacStore.getState();

        expect(state.selectedTaskId).toBe('task-1');
    });

    it('clears selected task with null', () =>
    {
        const store = useNotemacStore.getState();

        store.SetSelectedTask('task-1');
        store.SetSelectedTask(null);
        const state = useNotemacStore.getState();

        expect(null === state.selectedTaskId).toBe(true);
    });

    it('changes selected task', () =>
    {
        const store = useNotemacStore.getState();

        store.SetSelectedTask('task-1');
        let state = useNotemacStore.getState();
        expect(state.selectedTaskId).toBe('task-1');

        store.SetSelectedTask('task-2');
        state = useNotemacStore.getState();
        expect(state.selectedTaskId).toBe('task-2');
    });

    it('allows selecting non-existent task ID', () =>
    {
        const store = useNotemacStore.getState();

        store.SetSelectedTask('non-existent-task');
        const state = useNotemacStore.getState();

        expect(state.selectedTaskId).toBe('non-existent-task');
    });
});

describe('TaskRunnerModel — ClearTaskHistory', () =>
{
    beforeEach(() => resetStore());

    it('empties task history array', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CompleteTaskExecution(0);
        store.StartTaskExecution('task-2');
        store.CompleteTaskExecution(0);

        store.ClearTaskHistory();
        const state = useNotemacStore.getState();

        expect(0 === state.taskHistory.length).toBe(true);
    });

    it('is no-op on empty history', () =>
    {
        const store = useNotemacStore.getState();

        store.ClearTaskHistory();
        const state = useNotemacStore.getState();

        expect(0 === state.taskHistory.length).toBe(true);
    });

    it('does not affect current execution', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.ClearTaskHistory();
        const state = useNotemacStore.getState();

        expect(null !== state.currentExecution).toBe(true);
        expect(state.currentExecution?.taskId).toBe('task-1');
    });
});

describe('TaskRunnerModel — SetShowConfigureTasksDialog', () =>
{
    beforeEach(() => resetStore());

    it('shows configure tasks dialog', () =>
    {
        const store = useNotemacStore.getState();

        store.SetShowConfigureTasksDialog(true);
        const state = useNotemacStore.getState();

        expect(state.showConfigureTasksDialog).toBe(true);
    });

    it('hides configure tasks dialog', () =>
    {
        const store = useNotemacStore.getState();

        store.SetShowConfigureTasksDialog(true);
        store.SetShowConfigureTasksDialog(false);
        const state = useNotemacStore.getState();

        expect(state.showConfigureTasksDialog).toBe(false);
    });

    it('toggles dialog visibility', () =>
    {
        const store = useNotemacStore.getState();

        store.SetShowConfigureTasksDialog(true);
        let state = useNotemacStore.getState();
        expect(state.showConfigureTasksDialog).toBe(true);

        store.SetShowConfigureTasksDialog(false);
        state = useNotemacStore.getState();
        expect(state.showConfigureTasksDialog).toBe(false);
    });
});

describe('TaskRunnerModel — edge cases', () =>
{
    beforeEach(() => resetStore());

    it('handles cancel when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
        expect(0 === state.taskHistory.length).toBe(true);
    });

    it('handles complete when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.CompleteTaskExecution(0);
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
        expect(0 === state.taskHistory.length).toBe(true);
    });

    it('handles append when no execution is running', () =>
    {
        const store = useNotemacStore.getState();

        store.AppendTaskOutput('Orphan output');
        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
    });

    it('respects output limit with exactly LIMIT_TASK_OUTPUT_LINES', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');

        for (let i = 0; i < LIMIT_TASK_OUTPUT_LINES; i++)
        {
            store.AppendTaskOutput(`Line ${i}`);
        }

        const state = useNotemacStore.getState();
        expect(LIMIT_TASK_OUTPUT_LINES === state.currentExecution?.output.length).toBe(true);
    });

    it('handles multiple consecutive cancellations gracefully', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.CancelTaskExecution();
        store.CancelTaskExecution();
        store.CancelTaskExecution();
        const state = useNotemacStore.getState();

        expect(1 === state.taskHistory.length).toBe(true);
        expect(null === state.currentExecution).toBe(true);
    });

    it('handles interleaved operations correctly', () =>
    {
        const store = useNotemacStore.getState();

        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Line 1');
        store.SetTaskPanelVisible(true);
        store.SetSelectedTask('task-1');
        store.AppendTaskOutput('Line 2');
        store.CompleteTaskExecution(0);

        const state = useNotemacStore.getState();

        expect(null === state.currentExecution).toBe(true);
        expect(2 === state.taskHistory[0].output.length).toBe(true);
        expect(state.selectedTaskId).toBe('task-1');
        expect(state.isTaskPanelVisible).toBe(true);
    });

    it('preserves task definition data across execution', () =>
    {
        const store = useNotemacStore.getState();
        const task = createTask('task-1', 'Build Task', 'npm run build');

        store.AddTask(task);
        store.StartTaskExecution('task-1');
        store.AppendTaskOutput('Building...');
        store.CompleteTaskExecution(0);

        const state = useNotemacStore.getState();

        expect(1 === state.tasks.length).toBe(true);
        expect(state.tasks[0].command).toBe('npm run build');
        expect(1 === state.taskHistory.length).toBe(true);
    });
});
