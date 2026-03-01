import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ValidateTaskDefinition,
    ParseTasksConfig,
    GetTasksByGroup,
    GetDefaultTask,
    SimulateTaskExecution,
    GenerateSimulatedOutput,
    FormatTaskDuration,
    ParseANSIColors,
    GetDefaultPresentation,
} from '../Notemac/Services/TaskRunnerService';
import type { TaskDefinition, TaskExecution } from '../Notemac/Commons/Types';

describe('TaskRunnerService', () =>
{
    // ─────────────────────────────────────────────────────────────
    // ValidateTaskDefinition Tests
    // ─────────────────────────────────────────────────────────────

    describe('ValidateTaskDefinition', () =>
    {
        it('should validate a complete valid task', () =>
        {
            const task: TaskDefinition = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
                presentation: {
                    echo: true,
                    reveal: 'always',
                    focus: false,
                    clear: false,
                },
            };

            const result = ValidateTaskDefinition(task);
            expect(true === result.valid).toBe(true);
            expect(0 === result.errors.length).toBe(true);
        });

        it('should reject null task', () =>
        {
            const result = ValidateTaskDefinition(null);
            expect(false === result.valid).toBe(true);
            expect(result.errors.length > 0).toBe(true);
            expect('Task must be a non-null object' === result.errors[0]).toBe(true);
        });

        it('should reject non-object task', () =>
        {
            const result = ValidateTaskDefinition('not an object');
            expect(false === result.valid).toBe(true);
            expect(result.errors.length > 0).toBe(true);
        });

        it('should reject task with missing id', () =>
        {
            const task = {
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('id'))).toBe(true);
        });

        it('should reject task with empty id', () =>
        {
            const task = {
                id: '   ',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('id'))).toBe(true);
        });

        it('should reject task with missing label', () =>
        {
            const task = {
                id: 'build-task',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('label'))).toBe(true);
        });

        it('should reject task with empty label', () =>
        {
            const task = {
                id: 'build-task',
                label: '',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('label'))).toBe(true);
        });

        it('should reject task with missing command', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('command'))).toBe(true);
        });

        it('should reject task with empty command', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: '',
                group: 'build',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('command'))).toBe(true);
        });

        it('should reject task with invalid group', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'invalid-group',
                isDefault: false,
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('group'))).toBe(true);
        });

        it('should accept all valid groups', () =>
        {
            const groups = ['build', 'test', 'lint', 'custom'];

            for (const group of groups)
            {
                const task = {
                    id: `task-${group}`,
                    label: `Task ${group}`,
                    command: 'npm run command',
                    group: group as any,
                    isDefault: false,
                };

                const result = ValidateTaskDefinition(task);
                expect(true === result.valid).toBe(true);
            }
        });

        it('should reject task with non-boolean isDefault', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: 'yes',
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('isDefault'))).toBe(true);
        });

        it('should allow undefined presentation', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
                presentation: undefined,
            };

            const result = ValidateTaskDefinition(task);
            expect(true === result.valid).toBe(true);
        });

        it('should allow null presentation', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
                presentation: null,
            };

            const result = ValidateTaskDefinition(task);
            expect(true === result.valid).toBe(true);
        });

        it('should reject non-object presentation', () =>
        {
            const task = {
                id: 'build-task',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: false,
                presentation: 'not-an-object',
            };

            const result = ValidateTaskDefinition(task);
            expect(false === result.valid).toBe(true);
            expect(result.errors.some(e => e.includes('presentation'))).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // ParseTasksConfig Tests
    // ─────────────────────────────────────────────────────────────

    describe('ParseTasksConfig', () =>
    {
        it('should parse valid JSON with tasks', () =>
        {
            const json = JSON.stringify({
                tasks: [
                    {
                        id: 'build',
                        label: 'Build',
                        command: 'npm run build',
                        group: 'build',
                        isDefault: true,
                    },
                ],
            });

            const result = ParseTasksConfig(json);
            expect(true === Array.isArray(result)).toBe(true);
            expect(1 === result.length).toBe(true);
            expect('build' === result[0].id).toBe(true);
        });

        it('should return empty array for invalid JSON', () =>
        {
            const result = ParseTasksConfig('not valid json {');
            expect(true === Array.isArray(result)).toBe(true);
            expect(0 === result.length).toBe(true);
        });

        it('should return empty array for empty tasks array', () =>
        {
            const json = JSON.stringify({ tasks: [] });
            const result = ParseTasksConfig(json);
            expect(true === Array.isArray(result)).toBe(true);
            expect(0 === result.length).toBe(true);
        });

        it('should return empty array when tasks field is missing', () =>
        {
            const json = JSON.stringify({ other: 'field' });
            const result = ParseTasksConfig(json);
            expect(true === Array.isArray(result)).toBe(true);
            expect(0 === result.length).toBe(true);
        });

        it('should skip invalid entries and keep valid ones', () =>
        {
            const json = JSON.stringify({
                tasks: [
                    {
                        id: 'valid-task',
                        label: 'Valid',
                        command: 'npm run build',
                        group: 'build',
                        isDefault: false,
                    },
                    {
                        id: 'invalid-task',
                        // missing label
                        command: 'npm run test',
                        group: 'test',
                        isDefault: false,
                    },
                    {
                        id: 'another-valid',
                        label: 'Another',
                        command: 'npm run lint',
                        group: 'lint',
                        isDefault: true,
                    },
                ],
            });

            const result = ParseTasksConfig(json);
            expect(2 === result.length).toBe(true);
            expect('valid-task' === result[0].id).toBe(true);
            expect('another-valid' === result[1].id).toBe(true);
        });

        it('should parse multiple valid tasks', () =>
        {
            const json = JSON.stringify({
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
                    {
                        id: 'lint',
                        label: 'Lint',
                        command: 'eslint .',
                        group: 'lint',
                        isDefault: false,
                    },
                ],
            });

            const result = ParseTasksConfig(json);
            expect(3 === result.length).toBe(true);
            expect('build' === result[0].id).toBe(true);
            expect('test' === result[1].id).toBe(true);
            expect('lint' === result[2].id).toBe(true);
        });

        it('should handle malformed JSON gracefully', () =>
        {
            const result = ParseTasksConfig('{}}{}{');
            expect(true === Array.isArray(result)).toBe(true);
            expect(0 === result.length).toBe(true);
        });

        it('should reject tasks with missing fields', () =>
        {
            const json = JSON.stringify({
                tasks: [
                    {
                        // missing id
                        label: 'Task',
                        command: 'npm run',
                        group: 'custom',
                        isDefault: false,
                    },
                ],
            });

            const result = ParseTasksConfig(json);
            expect(0 === result.length).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // GetTasksByGroup Tests
    // ─────────────────────────────────────────────────────────────

    describe('GetTasksByGroup', () =>
    {
        const tasks: TaskDefinition[] = [
            {
                id: 'build-1',
                label: 'Build 1',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            },
            {
                id: 'build-2',
                label: 'Build 2',
                command: 'npm run build:prod',
                group: 'build',
                isDefault: false,
            },
            {
                id: 'test-1',
                label: 'Test 1',
                command: 'npm test',
                group: 'test',
                isDefault: true,
            },
            {
                id: 'lint-1',
                label: 'Lint 1',
                command: 'eslint .',
                group: 'lint',
                isDefault: false,
            },
        ];

        it('should filter tasks by group build', () =>
        {
            const result = GetTasksByGroup(tasks, 'build');
            expect(2 === result.length).toBe(true);
            expect(result.every(t => 'build' === t.group)).toBe(true);
        });

        it('should filter tasks by group test', () =>
        {
            const result = GetTasksByGroup(tasks, 'test');
            expect(1 === result.length).toBe(true);
            expect('test' === result[0].group).toBe(true);
        });

        it('should filter tasks by group lint', () =>
        {
            const result = GetTasksByGroup(tasks, 'lint');
            expect(1 === result.length).toBe(true);
            expect('lint' === result[0].group).toBe(true);
        });

        it('should return empty array for non-matching group', () =>
        {
            const result = GetTasksByGroup(tasks, 'custom');
            expect(0 === result.length).toBe(true);
            expect(true === Array.isArray(result)).toBe(true);
        });

        it('should return empty array for empty tasks list', () =>
        {
            const result = GetTasksByGroup([], 'build');
            expect(0 === result.length).toBe(true);
        });

        it('should return tasks in original order', () =>
        {
            const result = GetTasksByGroup(tasks, 'build');
            expect('build-1' === result[0].id).toBe(true);
            expect('build-2' === result[1].id).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // GetDefaultTask Tests
    // ─────────────────────────────────────────────────────────────

    describe('GetDefaultTask', () =>
    {
        const tasks: TaskDefinition[] = [
            {
                id: 'build-default',
                label: 'Build Default',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            },
            {
                id: 'build-alt',
                label: 'Build Alt',
                command: 'npm run build:alt',
                group: 'build',
                isDefault: false,
            },
            {
                id: 'test-1',
                label: 'Test 1',
                command: 'npm test',
                group: 'test',
                isDefault: false,
            },
            {
                id: 'test-default',
                label: 'Test Default',
                command: 'npm test:full',
                group: 'test',
                isDefault: true,
            },
        ];

        it('should find default task for build group', () =>
        {
            const result = GetDefaultTask(tasks, 'build');
            expect(null !== result).toBe(true);
            expect('build-default' === result?.id).toBe(true);
            expect(true === result?.isDefault).toBe(true);
        });

        it('should find default task for test group', () =>
        {
            const result = GetDefaultTask(tasks, 'test');
            expect(null !== result).toBe(true);
            expect('test-default' === result?.id).toBe(true);
        });

        it('should return null when no tasks in group', () =>
        {
            const result = GetDefaultTask(tasks, 'lint');
            expect(null === result).toBe(true);
        });

        it('should fallback to first task when no default marked', () =>
        {
            const customTasks: TaskDefinition[] = [
                {
                    id: 'custom-1',
                    label: 'Custom 1',
                    command: 'npm run custom',
                    group: 'custom',
                    isDefault: false,
                },
                {
                    id: 'custom-2',
                    label: 'Custom 2',
                    command: 'npm run custom:alt',
                    group: 'custom',
                    isDefault: false,
                },
            ];

            const result = GetDefaultTask(customTasks, 'custom');
            expect(null !== result).toBe(true);
            expect('custom-1' === result?.id).toBe(true);
        });

        it('should return null for empty task list', () =>
        {
            const result = GetDefaultTask([], 'build');
            expect(null === result).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // GenerateSimulatedOutput Tests
    // ─────────────────────────────────────────────────────────────

    describe('GenerateSimulatedOutput', () =>
    {
        it('should generate output for build group', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'Build Project',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(true === Array.isArray(output)).toBe(true);
            expect(output.length > 0).toBe(true);
            expect(output.some(line => line.includes('Compiling'))).toBe(true);
            expect(output.some(line => line.includes('Build completed'))).toBe(true);
        });

        it('should generate output for test group', () =>
        {
            const task: TaskDefinition = {
                id: 'test',
                label: 'Run Tests',
                command: 'npm test',
                group: 'test',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(true === Array.isArray(output)).toBe(true);
            expect(output.some(line => line.includes('Running test'))).toBe(true);
            expect(output.some(line => line.includes('PASS'))).toBe(true);
        });

        it('should generate output for lint group', () =>
        {
            const task: TaskDefinition = {
                id: 'lint',
                label: 'Lint Code',
                command: 'eslint .',
                group: 'lint',
                isDefault: false,
            };

            const output = GenerateSimulatedOutput(task);
            expect(true === Array.isArray(output)).toBe(true);
            expect(output.some(line => line.includes('Linting'))).toBe(true);
            expect(output.some(line => line.includes('0 errors'))).toBe(true);
        });

        it('should generate output for custom group', () =>
        {
            const task: TaskDefinition = {
                id: 'custom',
                label: 'Custom Task',
                command: 'echo hello',
                group: 'custom',
                isDefault: false,
            };

            const output = GenerateSimulatedOutput(task);
            expect(true === Array.isArray(output)).toBe(true);
            expect(output.some(line => line.includes('echo hello'))).toBe(true);
        });

        it('should include task label in output', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'My Build',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(output.some(line => line.includes('My Build'))).toBe(true);
        });

        it('should include task command in output', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'Build',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(output.some(line => line.includes('npm run build'))).toBe(true);
        });

        it('should include timestamp in output', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'Build',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(output.some(line => line.includes('Started at:'))).toBe(true);
        });

        it('should include exit code in output', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'Build',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const output = GenerateSimulatedOutput(task);
            expect(output.some(line => line.includes('exit code 0'))).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // SimulateTaskExecution Tests
    // ─────────────────────────────────────────────────────────────

    describe('SimulateTaskExecution', () =>
    {
        it('should create execution with correct task id', () =>
        {
            const task: TaskDefinition = {
                id: 'my-task',
                label: 'My Task',
                command: 'npm run command',
                group: 'custom',
                isDefault: false,
            };

            const execution = SimulateTaskExecution(task);
            expect('my-task' === execution.taskId).toBe(true);
        });

        it('should set success status', () =>
        {
            const task: TaskDefinition = {
                id: 'task',
                label: 'Task',
                command: 'npm run',
                group: 'custom',
                isDefault: false,
            };

            const execution = SimulateTaskExecution(task);
            expect('success' === execution.status).toBe(true);
        });

        it('should set exit code to 0', () =>
        {
            const task: TaskDefinition = {
                id: 'task',
                label: 'Task',
                command: 'npm run',
                group: 'custom',
                isDefault: false,
            };

            const execution = SimulateTaskExecution(task);
            expect(0 === execution.exitCode).toBe(true);
        });

        it('should set start and end times', () =>
        {
            const task: TaskDefinition = {
                id: 'task',
                label: 'Task',
                command: 'npm run',
                group: 'custom',
                isDefault: false,
            };

            const execution = SimulateTaskExecution(task);
            expect('number' === typeof execution.startTime).toBe(true);
            expect('number' === typeof execution.endTime).toBe(true);
            expect(execution.endTime >= execution.startTime).toBe(true);
        });

        it('should have duration between 1.5 and 3.5 seconds', () =>
        {
            const task: TaskDefinition = {
                id: 'task',
                label: 'Task',
                command: 'npm run',
                group: 'custom',
                isDefault: false,
            };

            const execution = SimulateTaskExecution(task);
            const duration = execution.endTime - execution.startTime;
            expect(duration >= 1500).toBe(true);
            expect(duration <= 3500).toBe(true);
        });

        it('should generate output array', () =>
        {
            const task: TaskDefinition = {
                id: 'build',
                label: 'Build',
                command: 'npm run build',
                group: 'build',
                isDefault: true,
            };

            const execution = SimulateTaskExecution(task);
            expect(true === Array.isArray(execution.output)).toBe(true);
            expect(execution.output.length > 0).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // FormatTaskDuration Tests
    // ─────────────────────────────────────────────────────────────

    describe('FormatTaskDuration', () =>
    {
        it('should format milliseconds only', () =>
        {
            const result = FormatTaskDuration(1000, 1500);
            expect('500ms' === result).toBe(true);
        });

        it('should format less than 1 second', () =>
        {
            const result = FormatTaskDuration(1000, 1999);
            expect(result.includes('ms')).toBe(true);
        });

        it('should format seconds only', () =>
        {
            const result = FormatTaskDuration(1000, 6000);
            expect('5s' === result).toBe(true);
        });

        it('should format exactly 1 minute', () =>
        {
            const result = FormatTaskDuration(0, 60000);
            expect('1m 0s' === result).toBe(true);
        });

        it('should format minutes and seconds', () =>
        {
            const result = FormatTaskDuration(0, 125000);
            expect('2m 5s' === result).toBe(true);
        });

        it('should format exactly 1 hour', () =>
        {
            const result = FormatTaskDuration(0, 3600000);
            expect('1h 0m' === result).toBe(true);
        });

        it('should format hours and minutes', () =>
        {
            const result = FormatTaskDuration(0, 3900000);
            expect('1h 5m' === result).toBe(true);
        });

        it('should format 2 hours 30 minutes', () =>
        {
            const result = FormatTaskDuration(0, 9000000);
            expect('2h 30m' === result).toBe(true);
        });

        it('should handle negative duration', () =>
        {
            const result = FormatTaskDuration(1000, 500);
            expect('0ms' === result).toBe(true);
        });

        it('should handle zero duration', () =>
        {
            const result = FormatTaskDuration(1000, 1000);
            expect('0ms' === result).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // ParseANSIColors Tests
    // ─────────────────────────────────────────────────────────────

    describe('ParseANSIColors', () =>
    {
        it('should handle plain text without ANSI codes', () =>
        {
            const result = ParseANSIColors('hello world');
            expect(1 === result.length).toBe(true);
            expect('hello world' === result[0].text).toBe(true);
            expect(undefined === result[0].color).toBe(true);
            expect(undefined === result[0].bold).toBe(true);
        });

        it('should handle empty string', () =>
        {
            const result = ParseANSIColors('');
            expect(0 === result.length).toBe(true);
        });

        it('should parse red color code', () =>
        {
            const result = ParseANSIColors('\x1b[31mred text\x1b[0m');
            expect(result.length > 0).toBe(true);
            expect(result.some(seg => '#ff4444' === seg.color && 'red text' === seg.text)).toBe(true);
        });

        it('should parse green color code', () =>
        {
            const result = ParseANSIColors('\x1b[32mgreen text\x1b[0m');
            expect(result.some(seg => '#44cc44' === seg.color && 'green text' === seg.text)).toBe(true);
        });

        it('should parse bold code', () =>
        {
            const result = ParseANSIColors('\x1b[1mbold text\x1b[0m');
            expect(result.some(seg => true === seg.bold && 'bold text' === seg.text)).toBe(true);
        });

        it('should parse combined bold and color', () =>
        {
            const result = ParseANSIColors('\x1b[1;31mbold red\x1b[0m');
            expect(result.some(seg => true === seg.bold && '#ff4444' === seg.color)).toBe(true);
        });

        it('should handle reset sequence', () =>
        {
            const result = ParseANSIColors('\x1b[31mred\x1b[0mnormal');
            expect(result.length >= 2).toBe(true);
            expect(result.some(seg => '#ff4444' === seg.color)).toBe(true);
            expect(result.some(seg => undefined === seg.color && 'normal' === seg.text)).toBe(true);
        });

        it('should parse bright colors', () =>
        {
            const result = ParseANSIColors('\x1b[91mbright red\x1b[0m');
            expect(result.some(seg => '#ff6666' === seg.color)).toBe(true);
        });

        it('should handle multiple color changes', () =>
        {
            const result = ParseANSIColors('\x1b[31mred\x1b[0m\x1b[32mgreen\x1b[0m');
            expect(result.length > 0).toBe(true);
            expect(result.some(seg => '#ff4444' === seg.color && 'red' === seg.text)).toBe(true);
            expect(result.some(seg => '#44cc44' === seg.color && 'green' === seg.text)).toBe(true);
        });

        it('should handle empty escape codes', () =>
        {
            const result = ParseANSIColors('\x1b[mtext');
            expect(true === Array.isArray(result)).toBe(true);
            expect(result.length > 0).toBe(true);
        });

        it('should parse blue color', () =>
        {
            const result = ParseANSIColors('\x1b[34mblue text\x1b[0m');
            expect(result.some(seg => '#4488ff' === seg.color)).toBe(true);
        });

        it('should handle text before first ANSI code', () =>
        {
            const result = ParseANSIColors('start\x1b[31mred');
            expect(result.some(seg => 'start' === seg.text && undefined === seg.color)).toBe(true);
            expect(result.some(seg => 'red' === seg.text && '#ff4444' === seg.color)).toBe(true);
        });

        it('should parse cyan color', () =>
        {
            const result = ParseANSIColors('\x1b[36mcyan\x1b[0m');
            expect(result.some(seg => '#44cccc' === seg.color && 'cyan' === seg.text)).toBe(true);
        });

        it('should preserve bold state across segments', () =>
        {
            const result = ParseANSIColors('\x1b[1m\x1b[31mbold red\x1b[0m');
            expect(result.some(seg => true === seg.bold && '#ff4444' === seg.color)).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // GetDefaultPresentation Tests
    // ─────────────────────────────────────────────────────────────

    describe('GetDefaultPresentation', () =>
    {
        it('should return default presentation object', () =>
        {
            const result = GetDefaultPresentation();
            expect('object' === typeof result).toBe(true);
        });

        it('should set echo to true', () =>
        {
            const result = GetDefaultPresentation();
            expect(true === result.echo).toBe(true);
        });

        it('should set reveal to always', () =>
        {
            const result = GetDefaultPresentation();
            expect('always' === result.reveal).toBe(true);
        });

        it('should set focus to false', () =>
        {
            const result = GetDefaultPresentation();
            expect(false === result.focus).toBe(true);
        });

        it('should set clear to false', () =>
        {
            const result = GetDefaultPresentation();
            expect(false === result.clear).toBe(true);
        });

        it('should have all required properties', () =>
        {
            const result = GetDefaultPresentation();
            expect(undefined !== result.echo).toBe(true);
            expect(undefined !== result.reveal).toBe(true);
            expect(undefined !== result.focus).toBe(true);
            expect(undefined !== result.clear).toBe(true);
        });
    });
});
