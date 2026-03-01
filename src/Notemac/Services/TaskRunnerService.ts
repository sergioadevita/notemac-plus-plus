/**
 * TaskRunnerService — Pure utility functions for task validation,
 * parsing, execution simulation, and output formatting.
 *
 * No store access — all data is passed as arguments.
 */

import type { TaskDefinition, TaskExecution, TaskPresentation } from '../Commons/Types';

const VALID_GROUPS = ['build', 'test', 'lint', 'custom'] as const;
type TaskGroup = typeof VALID_GROUPS[number];

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Validate a task definition has all required fields and correct types.
 */
export function ValidateTaskDefinition(task: unknown): { valid: boolean; errors: string[] }
{
    const errors: string[] = [];

    if (null === task || 'object' !== typeof task)
    {
        return { valid: false, errors: ['Task must be a non-null object'] };
    }

    const t = task as Record<string, unknown>;

    if ('string' !== typeof t.id || 0 === t.id.trim().length)
        errors.push('Task id is required and must be a non-empty string');

    if ('string' !== typeof t.label || 0 === t.label.trim().length)
        errors.push('Task label is required and must be a non-empty string');

    if ('string' !== typeof t.command || 0 === t.command.trim().length)
        errors.push('Task command is required and must be a non-empty string');

    if ('string' !== typeof t.group || !VALID_GROUPS.includes(t.group as TaskGroup))
        errors.push(`Task group must be one of: ${VALID_GROUPS.join(', ')}`);

    if ('boolean' !== typeof t.isDefault)
        errors.push('Task isDefault must be a boolean');

    if (undefined !== t.presentation && null !== t.presentation)
    {
        if ('object' !== typeof t.presentation)
            errors.push('Task presentation must be an object');
    }

    return { valid: 0 === errors.length, errors };
}

// ─── Parsing ────────────────────────────────────────────────────────

/**
 * Parse a tasks.json config string into an array of validated TaskDefinitions.
 */
export function ParseTasksConfig(jsonText: string): TaskDefinition[]
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
            const validation = ValidateTaskDefinition(entry);
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
}

// ─── Querying ───────────────────────────────────────────────────────

/**
 * Filter tasks by group.
 */
export function GetTasksByGroup(tasks: TaskDefinition[], group: string): TaskDefinition[]
{
    return tasks.filter(t => t.group === group);
}

/**
 * Find the default task for a given group.
 */
export function GetDefaultTask(tasks: TaskDefinition[], group: string): TaskDefinition | null
{
    const groupTasks = GetTasksByGroup(tasks, group);
    const defaultTask = groupTasks.find(t => t.isDefault);
    if (defaultTask)
        return defaultTask;

    // Fallback to first task in group
    return 0 < groupTasks.length ? groupTasks[0] : null;
}

// ─── Execution Simulation ───────────────────────────────────────────

/**
 * Generate simulated output lines for a task based on its group.
 * Since Notemac++ runs in the browser, real shell execution isn't available.
 */
export function GenerateSimulatedOutput(task: TaskDefinition): string[]
{
    const lines: string[] = [];
    const timestamp = new Date().toISOString();

    lines.push(`> Executing task: ${task.label}`);
    lines.push(`> Command: ${task.command}`);
    lines.push(`> Started at: ${timestamp}`);
    lines.push('');

    switch (task.group)
    {
        case 'build':
            lines.push('Compiling sources...');
            lines.push('  src/main.ts → dist/main.js');
            lines.push('  src/index.ts → dist/index.js');
            lines.push('  src/utils.ts → dist/utils.js');
            lines.push('Bundle size: 142.3 KB (gzipped: 48.1 KB)');
            lines.push('');
            lines.push('Build completed successfully.');
            break;
        case 'test':
            lines.push('Running test suites...');
            lines.push('');
            lines.push('  PASS  src/__tests__/utils.test.ts');
            lines.push('  PASS  src/__tests__/main.test.ts');
            lines.push('  PASS  src/__tests__/index.test.ts');
            lines.push('');
            lines.push('Test Suites: 3 passed, 3 total');
            lines.push('Tests:       12 passed, 12 total');
            lines.push('Time:        1.842s');
            break;
        case 'lint':
            lines.push('Linting sources...');
            lines.push('');
            lines.push('  src/main.ts — no issues');
            lines.push('  src/index.ts — no issues');
            lines.push('  src/utils.ts — no issues');
            lines.push('');
            lines.push('0 errors, 0 warnings');
            break;
        default:
            lines.push(`Running: ${task.command}`);
            lines.push('Task completed.');
            break;
    }

    lines.push('');
    lines.push(`> Task "${task.label}" finished with exit code 0`);
    return lines;
}

/**
 * Create a completed TaskExecution from simulated output.
 */
export function SimulateTaskExecution(task: TaskDefinition): TaskExecution
{
    const startTime = Date.now();
    const output = GenerateSimulatedOutput(task);

    return {
        taskId: task.id,
        startTime,
        endTime: startTime + 1500 + Math.floor(Math.random() * 2000),
        output,
        exitCode: 0,
        status: 'success',
    };
}

// ─── Formatting ─────────────────────────────────────────────────────

/**
 * Format task duration in human-readable form.
 */
export function FormatTaskDuration(startTime: number, endTime: number): string
{
    const ms = endTime - startTime;

    if (ms < 0)
        return '0ms';

    if (ms < 1000)
        return `${ms}ms`;

    const seconds = Math.floor(ms / 1000);

    if (seconds < 60)
        return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60)
        return `${minutes}m ${remainingSeconds}s`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

// ─── ANSI Color Parsing ─────────────────────────────────────────────

export interface ANSISegment
{
    text: string;
    color?: string;
    bold?: boolean;
}

const ANSI_COLOR_MAP: Record<string, string> =
{
    '30': '#000000', '31': '#ff4444', '32': '#44cc44',
    '33': '#ffaa00', '34': '#4488ff', '35': '#cc44cc',
    '36': '#44cccc', '37': '#cccccc',
    '90': '#666666', '91': '#ff6666', '92': '#66ff66',
    '93': '#ffcc44', '94': '#6699ff', '95': '#ff66ff',
    '96': '#66ffff', '97': '#ffffff',
};

/**
 * Parse ANSI escape codes in text and return colored segments.
 */
export function ParseANSIColors(text: string): ANSISegment[]
{
    const segments: ANSISegment[] = [];
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /\x1b\[([0-9;]*)m/g;
    let lastIndex = 0;
    let currentColor: string | undefined;
    let currentBold = false;
    let match: RegExpExecArray | null;

    while (null !== (match = ansiRegex.exec(text)))
    {
        // Add text before this escape sequence
        if (match.index > lastIndex)
        {
            const segment: ANSISegment = { text: text.slice(lastIndex, match.index) };
            if (currentColor)
                segment.color = currentColor;
            if (currentBold)
                segment.bold = true;
            segments.push(segment);
        }

        // Process the escape codes
        const codes = match[1].split(';');
        for (const code of codes)
        {
            if ('0' === code || '' === code)
            {
                currentColor = undefined;
                currentBold = false;
            }
            else if ('1' === code)
            {
                currentBold = true;
            }
            else if (ANSI_COLOR_MAP[code])
            {
                currentColor = ANSI_COLOR_MAP[code];
            }
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length)
    {
        const segment: ANSISegment = { text: text.slice(lastIndex) };
        if (currentColor)
            segment.color = currentColor;
        if (currentBold)
            segment.bold = true;
        segments.push(segment);
    }

    // If no ANSI codes found, return single segment
    if (0 === segments.length && 0 < text.length)
    {
        segments.push({ text });
    }

    return segments;
}

// ─── Default Presentation ───────────────────────────────────────────

/**
 * Get default task presentation settings.
 */
export function GetDefaultPresentation(): TaskPresentation
{
    return {
        echo: true,
        reveal: 'always',
        focus: false,
        clear: false,
    };
}
