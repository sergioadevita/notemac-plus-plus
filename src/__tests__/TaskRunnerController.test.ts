import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    RunTask,
    RunBuildTask,
    RunTestTask,
    CancelCurrentTask,
    LoadTasksFromConfig,
    AddNewTask,
    DeleteTask,
    GetLastTaskDuration,
} from '../Notemac/Controllers/TaskRunnerController';
import { useNotemacStore } from '../Notemac/Model/Store';
import { Dispatch, NOTEMAC_EVENTS } from '../Shared/EventDispatcher/EventDispatcher';
import type { TaskDefinition } from '../Notemac/Commons/Types';

// Track the mock ExecuteTask so tests can invoke callbacks
let mockExecuteTaskCallbacks: any = null;
let mockCancelFn = vi.fn();

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// Mock EventDispatcher
vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: {
        TASK_STARTED: 'TASK_STARTED',
        TASK_COMPLETED: 'TASK_COMPLETED',
        TASK_TERMINATED: 'TASK_TERMINATED',
    },
}));

// Mock PlatformBridge — default to desktop
vi.mock('../Notemac/Services/PlatformBridge', () => ({
    DetectPlatform: vi.fn(() => 'electron'),
    IsDesktopEnvironment: vi.fn(() => true),
    IsTauriEnvironment: vi.fn(() => false),
    IsElectronEnvironment: vi.fn(() => true),
}));

// Mock ProcessExecutionService
vi.mock('../Notemac/Services/ProcessExecutionService', () => ({
    ExecuteTask: vi.fn((task: any, callbacks: any) =>
    {
        mockExecuteTaskCallbacks = callbacks;
        mockCancelFn = vi.fn();
        return { cancel: mockCancelFn };
    }),
}));

// Mock TaskRunnerService functions
vi.mock('../Notemac/Services/TaskRunnerService', () => {
    const validateTaskDefinition = (task: any) =>
    {
        const errors: string[] = [];
        if (!task || typeof task !== 'object')
        {
            return { valid: false, errors: ['Task must be a non-null object'] };
        }
        const t = task as Record<string, unknown>;
        if (typeof t.id !== 'string' || t.id.trim().length === 0)
        {
            errors.push('Task id is required and must be a non-empty string');
        }
        if (typeof t.label !== 'string' || t.label.trim().length === 0)
        {
            errors.push('Task label is required and must be a non-empty string');
        }
        if (typeof t.command !== 'string' || t.command.trim().length === 0)
        {
            errors.push('Task command is required and must be a non-empty string');
        }
        if (typeof t.group !== 'string' || !['build', 'test', 'lint', 'custom'].includes(t.group as string))
        {
            errors.push('Task group must be one of: build, test, lint, custom');
        }
        if (typeof t.isDefault !== 'boolean')
        {
            errors.push('Task isDefault must be a boolean');
        }
        return { valid: errors.length === 0, errors };
    };

    return ({
        ValidateTaskDefinition: vi.fn(validateTaskDefinition),
        ParseTasksConfig: vi.fn((jsonText: string) =>
        {
            try
            {
                const parsed = JSON.parse(jsonText);
                if (!parsed || !Array.isArray(parsed.tasks))
                {
                    return [];
                }
                const results: TaskDefinition[] = [];
                for (const entry of parsed.tasks)
                {
                    const validation = validateTaskDefinition(entry);
                    if (validation.valid)
                    {
                        results.push(entry as TaskDefinition);
                    }
                }
                return results;
            }
            catch
            {
                return [];
            }
        }),
        GetDefaultTask: vi.fn((tasks, group) =>
        {
            const groupTasks = tasks.filter((t: TaskDefinition) => t.group === group);
            const defaultTask = groupTasks.find((t: TaskDefinition) => t.isDefault);
            if (defaultTask)
            {
                return defaultTask;
            }
            return groupTasks.length > 0 ? groupTasks[0] : null;
        }),
        FormatTaskDuration: vi.fn((startTime, endTime) =>
        {
            const diff = endTime - startTime;
            const seconds = Math.floor(diff / 1000);
            return seconds + 's';
        }),
    });
});

describe('TaskRunnerController — RunTask', () =>
{
    let mockStore: any;
    let mockDispatch: any;

    beforeEach(() =>
    {
        mockExecuteTaskCallbacks = null;
        mockCancelFn = vi.fn();
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        mockDispatch = Dispatch as any;
        mockDispatch.mockClear();
        vi.clearAllMocks();
    });

    // ─── RunTask: Happy Path ───────────────────────────────────────────

    it('starts task execution and dispatches TASK_STARTED event', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];

        RunTask('task-1');

        expect(mockStore.StartTaskExecution).toHaveBeenCalledWith('task-1');
        expect(mockDispatch).toHaveBeenCalledWith(
            NOTEMAC_EVENTS.TASK_STARTED,
            expect.objectContaining({
                taskId: 'task-1',
                label: 'Build',
            })
        );
    });

    it('echoes command info before executing', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];

        RunTask('task-1');

        expect(mockStore.AppendTaskOutput).toHaveBeenCalledWith(expect.stringContaining('Executing task: Build'));
        expect(mockStore.AppendTaskOutput).toHaveBeenCalledWith(expect.stringContaining('Command: npm run build'));
    });

    it('streams output lines via onLine callback', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];
        mockStore.StartTaskExecution.mockImplementation((taskId: string) => {
            mockStore.currentExecution = {
                taskId,
                startTime: Date.now(),
                output: [],
                status: 'running',
            };
        });

        RunTask('task-1');

        // Simulate process output
        expect(mockExecuteTaskCallbacks).not.toBeNull();
        mockExecuteTaskCallbacks.onLine('Compiling sources...');
        mockExecuteTaskCallbacks.onLine('Build complete.');

        // AppendTaskOutput called for echoed lines + process lines
        const calls = mockStore.AppendTaskOutput.mock.calls.map((c: any[]) => c[0]);
        expect(calls).toContain('Compiling sources...');
        expect(calls).toContain('Build complete.');
    });

    it('completes task when onExit callback fires', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];
        mockStore.StartTaskExecution.mockImplementation((taskId: string) => {
            mockStore.currentExecution = {
                taskId,
                startTime: Date.now(),
                output: [],
                status: 'running',
            };
        });

        RunTask('task-1');
        mockExecuteTaskCallbacks.onExit(0);

        expect(mockStore.CompleteTaskExecution).toHaveBeenCalledWith(0);
        expect(mockDispatch).toHaveBeenCalledWith(
            NOTEMAC_EVENTS.TASK_COMPLETED,
            expect.objectContaining({
                taskId: 'task-1',
                exitCode: 0,
            })
        );
    });

    it('reports non-zero exit code', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];
        mockStore.StartTaskExecution.mockImplementation((taskId: string) => {
            mockStore.currentExecution = {
                taskId,
                startTime: Date.now(),
                output: [],
                status: 'running',
            };
        });

        RunTask('task-1');
        mockExecuteTaskCallbacks.onExit(1);

        expect(mockStore.CompleteTaskExecution).toHaveBeenCalledWith(1);
    });

    it('appends error message via onError callback', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];
        mockStore.StartTaskExecution.mockImplementation((taskId: string) => {
            mockStore.currentExecution = {
                taskId,
                startTime: Date.now(),
                output: [],
                status: 'running',
            };
        });

        RunTask('task-1');
        mockExecuteTaskCallbacks.onError('spawn ENOENT');

        const calls = mockStore.AppendTaskOutput.mock.calls.map((c: any[]) => c[0]);
        expect(calls.some((line: string) => line.includes('ERROR') && line.includes('spawn ENOENT'))).toBe(true);
    });

    // ─── RunTask: Task Not Found ────────────────────────────────────────

    it('does nothing when task ID not found', () =>
    {
        mockStore.tasks = [];

        RunTask('nonexistent-task');

        expect(mockStore.StartTaskExecution).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    // ─── RunTask: Already Running ──────────────────────────────────────

    it('prevents running task when another is already executing', () =>
    {
        const task1: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        const task2: TaskDefinition = {
            id: 'task-2',
            label: 'Test',
            command: 'npm test',
            group: 'test',
            isDefault: true,
        };
        mockStore.tasks = [task1, task2];
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: [],
            status: 'running',
        };

        RunTask('task-2');

        expect(mockStore.StartTaskExecution).not.toHaveBeenCalled();
    });

    // ─── RunTask: Web Platform ─────────────────────────────────────────

    it('does nothing on web platform', async () =>
    {
        const { IsDesktopEnvironment } = await import('../Notemac/Services/PlatformBridge');
        (IsDesktopEnvironment as any).mockReturnValueOnce(false);

        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];

        RunTask('task-1');

        expect(mockStore.StartTaskExecution).not.toHaveBeenCalled();
    });
});

describe('TaskRunnerController — RunBuildTask', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockExecuteTaskCallbacks = null;
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('delegates to RunTask with default build task', () =>
    {
        const buildTask: TaskDefinition = {
            id: 'build-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [buildTask];

        RunBuildTask();

        expect(mockStore.StartTaskExecution).toHaveBeenCalledWith('build-1');
    });

    it('does nothing when no build task is available', () =>
    {
        mockStore.tasks = [];

        RunBuildTask();

        expect(mockStore.StartTaskExecution).not.toHaveBeenCalled();
    });

    it('uses isDefault build task when multiple build tasks exist', () =>
    {
        const buildTask1: TaskDefinition = {
            id: 'build-1',
            label: 'Build Dev',
            command: 'npm run build:dev',
            group: 'build',
            isDefault: false,
        };
        const buildTask2: TaskDefinition = {
            id: 'build-2',
            label: 'Build Prod',
            command: 'npm run build:prod',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [buildTask1, buildTask2];

        RunBuildTask();

        expect(mockStore.StartTaskExecution).toHaveBeenCalledWith('build-2');
    });
});

describe('TaskRunnerController — RunTestTask', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockExecuteTaskCallbacks = null;
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('delegates to RunTask with default test task', () =>
    {
        const testTask: TaskDefinition = {
            id: 'test-1',
            label: 'Test',
            command: 'npm test',
            group: 'test',
            isDefault: true,
        };
        mockStore.tasks = [testTask];

        RunTestTask();

        expect(mockStore.StartTaskExecution).toHaveBeenCalledWith('test-1');
    });

    it('does nothing when no test task is available', () =>
    {
        mockStore.tasks = [];

        RunTestTask();

        expect(mockStore.StartTaskExecution).not.toHaveBeenCalled();
    });

    it('uses isDefault test task when multiple test tasks exist', () =>
    {
        const testTask1: TaskDefinition = {
            id: 'test-1',
            label: 'Test Unit',
            command: 'npm run test:unit',
            group: 'test',
            isDefault: false,
        };
        const testTask2: TaskDefinition = {
            id: 'test-2',
            label: 'Test All',
            command: 'npm run test',
            group: 'test',
            isDefault: true,
        };
        mockStore.tasks = [testTask1, testTask2];

        RunTestTask();

        expect(mockStore.StartTaskExecution).toHaveBeenCalledWith('test-2');
    });
});

describe('TaskRunnerController — CancelCurrentTask', () =>
{
    let mockStore: any;
    let mockDispatch: any;

    beforeEach(() =>
    {
        vi.clearAllMocks();
        mockExecuteTaskCallbacks = null;
        mockCancelFn = vi.fn();
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        mockDispatch = Dispatch as any;
    });

    it('cancels running task and dispatches TASK_TERMINATED event', () =>
    {
        const task: TaskDefinition = {
            id: 'task-1',
            label: 'Build',
            command: 'npm run build',
            group: 'build',
            isDefault: true,
        };
        mockStore.tasks = [task];
        mockStore.StartTaskExecution.mockImplementation((taskId: string) => {
            mockStore.currentExecution = {
                taskId,
                startTime: Date.now(),
                output: [],
                status: 'running',
            };
        });

        RunTask('task-1');
        const cancelFn = mockCancelFn;

        mockDispatch.mockClear();
        CancelCurrentTask();

        expect(cancelFn).toHaveBeenCalled();
        expect(mockStore.CancelTaskExecution).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            NOTEMAC_EVENTS.TASK_TERMINATED,
            expect.objectContaining({
                taskId: 'task-1',
            })
        );
    });

    it('does nothing when no task is running', () =>
    {
        mockStore.currentExecution = null;

        CancelCurrentTask();

        expect(mockStore.CancelTaskExecution).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith(NOTEMAC_EVENTS.TASK_TERMINATED);
    });
});

describe('TaskRunnerController — LoadTasksFromConfig', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('loads valid tasks from JSON config string', () =>
    {
        const configText = JSON.stringify({
            tasks: [
                {
                    id: 'build',
                    label: 'Build',
                    command: 'npm run build',
                    group: 'build',
                    isDefault: true,
                },
                {
                    id: 'test',
                    label: 'Test',
                    command: 'npm test',
                    group: 'test',
                    isDefault: true,
                },
            ],
        });

        const count = LoadTasksFromConfig(configText);

        expect(count).toBe(2);
        expect(mockStore.SetTasks).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'build' }),
            expect.objectContaining({ id: 'test' }),
        ]));
    });

    it('returns 0 for invalid JSON config', () =>
    {
        const configText = 'not valid json {]';

        const count = LoadTasksFromConfig(configText);

        expect(count).toBe(0);
        expect(mockStore.SetTasks).not.toHaveBeenCalled();
    });

    it('skips invalid tasks and loads only valid ones', () =>
    {
        const configText = JSON.stringify({
            tasks: [
                {
                    id: 'build',
                    label: 'Build',
                    command: 'npm run build',
                    group: 'build',
                    isDefault: true,
                },
                {
                    id: '',
                    label: 'Invalid',
                    command: 'cmd',
                    group: 'custom',
                    isDefault: false,
                },
            ],
        });

        const count = LoadTasksFromConfig(configText);

        expect(count).toBe(1);
    });

    it('returns 0 when config has no tasks array', () =>
    {
        const configText = JSON.stringify({ notasks: [] });

        const count = LoadTasksFromConfig(configText);

        expect(count).toBe(0);
    });

    it('does not update store when no valid tasks found', () =>
    {
        const configText = JSON.stringify({
            tasks: [
                {
                    id: '',
                    label: 'Invalid',
                    command: '',
                    group: 'invalid',
                    isDefault: 'not-bool',
                },
            ],
        });

        LoadTasksFromConfig(configText);

        expect(mockStore.SetTasks).not.toHaveBeenCalled();
    });
});

describe('TaskRunnerController — AddNewTask', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('validates and adds valid task to store', () =>
    {
        const task: TaskDefinition = {
            id: 'custom-task',
            label: 'Custom Task',
            command: 'echo hello',
            group: 'custom',
            isDefault: false,
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(true);
        expect(result.errors).toEqual([]);
        expect(mockStore.AddTask).toHaveBeenCalledWith(task);
    });

    it('rejects task with missing id', () =>
    {
        const task: any = {
            id: '',
            label: 'Task',
            command: 'cmd',
            group: 'custom',
            isDefault: false,
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task id is required and must be a non-empty string');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });

    it('rejects task with missing label', () =>
    {
        const task: any = {
            id: 'task-1',
            label: '',
            command: 'cmd',
            group: 'custom',
            isDefault: false,
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task label is required and must be a non-empty string');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });

    it('rejects task with missing command', () =>
    {
        const task: any = {
            id: 'task-1',
            label: 'Task',
            command: '',
            group: 'custom',
            isDefault: false,
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task command is required and must be a non-empty string');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });

    it('rejects task with invalid group', () =>
    {
        const task: any = {
            id: 'task-1',
            label: 'Task',
            command: 'cmd',
            group: 'invalid-group',
            isDefault: false,
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task group must be one of: build, test, lint, custom');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });

    it('rejects task with non-boolean isDefault', () =>
    {
        const task: any = {
            id: 'task-1',
            label: 'Task',
            command: 'cmd',
            group: 'custom',
            isDefault: 'not-a-bool',
        };

        const result = AddNewTask(task);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task isDefault must be a boolean');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });

    it('rejects null or non-object task', () =>
    {
        const result = AddNewTask(null as any);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Task must be a non-null object');
        expect(mockStore.AddTask).not.toHaveBeenCalled();
    });
});

describe('TaskRunnerController — DeleteTask', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            currentExecution: null,
            tasks: [
                {
                    id: 'task-1',
                    label: 'Task 1',
                    command: 'cmd1',
                    group: 'custom',
                    isDefault: false,
                },
            ],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('removes task from store by ID', () =>
    {
        DeleteTask('task-1');

        expect(mockStore.RemoveTask).toHaveBeenCalledWith('task-1');
    });

    it('handles deletion of non-existent task gracefully', () =>
    {
        expect(() =>
        {
            DeleteTask('nonexistent-task');
        }).not.toThrow();

        expect(mockStore.RemoveTask).toHaveBeenCalledWith('nonexistent-task');
    });
});

describe('TaskRunnerController — GetLastTaskDuration', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            currentExecution: null,
            tasks: [],
            taskHistory: [],
            StartTaskExecution: vi.fn(),
            AppendTaskOutput: vi.fn(),
            CompleteTaskExecution: vi.fn(),
            CancelTaskExecution: vi.fn(),
            AddTask: vi.fn(),
            RemoveTask: vi.fn(),
            SetTasks: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('returns empty string when task history is empty', () =>
    {
        mockStore.taskHistory = [];

        const duration = GetLastTaskDuration();

        expect(duration).toBe('');
    });

    it('returns formatted duration of last task', () =>
    {
        const startTime = 1000;
        const endTime = 5000;
        mockStore.taskHistory = [
            {
                taskId: 'task-1',
                startTime,
                endTime,
                output: [],
                exitCode: 0,
                status: 'success',
            },
        ];

        const duration = GetLastTaskDuration();

        expect(duration).toBe('4s');
    });

    it('returns empty string when last task has no endTime', () =>
    {
        mockStore.taskHistory = [
            {
                taskId: 'task-1',
                startTime: 1000,
                endTime: undefined,
                output: [],
                status: 'running',
            },
        ];

        const duration = GetLastTaskDuration();

        expect(duration).toBe('');
    });

    it('returns empty string when last task has no startTime', () =>
    {
        mockStore.taskHistory = [
            {
                taskId: 'task-1',
                startTime: undefined,
                endTime: 5000,
                output: [],
                status: 'success',
            },
        ];

        const duration = GetLastTaskDuration();

        expect(duration).toBe('');
    });
});
