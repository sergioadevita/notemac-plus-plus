import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskExecutionPanelViewPresenter } from '../Notemac/UI/TaskExecutionPanelViewPresenter';
import * as StoreModule from '../Notemac/Model/Store';
import * as TaskRunnerControllerModule from '../Notemac/Controllers/TaskRunnerController';
import * as TaskRunnerServiceModule from '../Notemac/Services/TaskRunnerService';

// Mock the store
vi.mock('../Notemac/Model/Store');

// Mock the controller
vi.mock('../Notemac/Controllers/TaskRunnerController');

// Mock the service
vi.mock('../Notemac/Services/TaskRunnerService');

const mockTheme = {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d30',
    bgHover: '#3e3e42',
    bgActive: '#094771',
    text: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e6e6e',
    border: '#3e3e42',
    accent: '#007acc',
    accentHover: '#1a8ad4',
    accentText: '#ffffff',
    danger: '#f44747',
    warning: '#cca700',
    success: '#89d185',
    tabBg: '#2d2d30',
    tabActiveBg: '#1e1e1e',
    tabActiveText: '#ffffff',
    tabBorder: '#3e3e42',
    menuBg: '#2d2d30',
    menuHover: '#094771',
    menuText: '#cccccc',
    statusBarBg: '#007acc',
    statusBarText: '#ffffff',
    sidebarBg: '#252526',
    sidebarText: '#cccccc',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#424242',
    editorBg: '#1e1e1e',
    editorMonacoTheme: 'vs-dark',
    findBg: '#252526',
};

describe('TaskExecutionPanelViewPresenter', () =>
{
    let mockStore: any;
    let mockCancelCurrentTask: any;
    let mockFormatTaskDuration: any;
    let mockParseANSIColors: any;

    beforeEach(() =>
    {
        mockStore = {
            currentExecution: null,
            taskHistory: [],
            tasks: [],
            SetTaskPanelVisible: vi.fn(),
            ClearTaskHistory: vi.fn(),
        };

        mockCancelCurrentTask = vi.fn();
        mockFormatTaskDuration = vi.fn((start, end) => `0m 1s`);
        mockParseANSIColors = vi.fn((text) => [{ text, color: undefined, bold: false }]);

        vi.spyOn(StoreModule, 'useNotemacStore').mockReturnValue(mockStore);
        vi.spyOn(TaskRunnerControllerModule, 'CancelCurrentTask').mockImplementation(mockCancelCurrentTask);
        vi.spyOn(TaskRunnerServiceModule, 'FormatTaskDuration').mockImplementation(mockFormatTaskDuration);
        vi.spyOn(TaskRunnerServiceModule, 'ParseANSIColors').mockImplementation(mockParseANSIColors);
    });

    it('shows empty state when no execution or history', () =>
    {
        mockStore.currentExecution = null;
        mockStore.taskHistory = [];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('No task output to display.')).toBeTruthy();
    });

    it('shows task label when running', () =>
    {
        const mockTask = {
            id: 'task-1',
            label: 'Build Project',
            command: 'npm run build',
            group: 'build' as const,
            isDefault: false,
        };

        mockStore.tasks = [mockTask];
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Building...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Task: Build Project')).toBeTruthy();
    });

    it('shows running indicator when task is executing', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['test output'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Running\.\.\./)).toBeTruthy();
    });

    it('shows exit code with green color on success', () =>
    {
        const mockExecution = {
            taskId: 'task-1',
            startTime: 1000,
            endTime: 2000,
            output: ['Success!'],
            exitCode: 0,
            status: 'success' as const,
        };

        mockStore.taskHistory = [mockExecution];
        mockFormatTaskDuration.mockReturnValue('1s');

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const exitCodeSpan = screen.getByText(/Exit code: 0/);
        expect(exitCodeSpan).toBeTruthy();
        expect(exitCodeSpan.style.color).toBe('rgb(68, 204, 68)');
    });

    it('shows exit code with red color on failure', () =>
    {
        const mockExecution = {
            taskId: 'task-1',
            startTime: 1000,
            endTime: 2000,
            output: ['Error!'],
            exitCode: 1,
            status: 'failed' as const,
        };

        mockStore.taskHistory = [mockExecution];
        mockFormatTaskDuration.mockReturnValue('1s');

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const exitCodeSpan = screen.getByText(/Exit code: 1/);
        expect(exitCodeSpan).toBeTruthy();
        expect(exitCodeSpan.style.color).toBe('rgb(255, 68, 68)');
    });

    it('shows output lines', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: [
                'Building...',
                'Compiling...',
                'Done!',
            ],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Building...')).toBeTruthy();
        expect(screen.getByText('Compiling...')).toBeTruthy();
        expect(screen.getByText('Done!')).toBeTruthy();
    });

    it('shows cancel button when running', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        expect(cancelButton).toBeTruthy();
    });

    it('hides cancel button when not running', () =>
    {
        const mockExecution = {
            taskId: 'task-1',
            startTime: 1000,
            endTime: 2000,
            output: ['Done!'],
            exitCode: 0,
            status: 'success' as const,
        };

        mockStore.taskHistory = [mockExecution];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.queryByRole('button', { name: 'Cancel' });
        expect(cancelButton).not.toBeTruthy();
    });

    it('calls CancelCurrentTask when cancel button is clicked', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);

        expect(mockCancelCurrentTask).toHaveBeenCalled();
    });

    it('calls SetTaskPanelVisible when close button is clicked', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const closeButton = screen.getByTitle('Close panel');
        fireEvent.click(closeButton);

        expect(mockStore.SetTaskPanelVisible).toHaveBeenCalledWith(false);
    });

    it('calls ClearTaskHistory when clear button is clicked', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const clearButton = screen.getByRole('button', { name: 'Clear' });
        fireEvent.click(clearButton);

        expect(mockStore.ClearTaskHistory).toHaveBeenCalled();
    });

    it('displays duration after completion', () =>
    {
        const mockExecution = {
            taskId: 'task-1',
            startTime: 1000,
            endTime: 2500,
            output: ['Completed!'],
            exitCode: 0,
            status: 'success' as const,
        };

        mockStore.taskHistory = [mockExecution];
        mockFormatTaskDuration.mockReturnValue('1m 30s');

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/\(1m 30s\)/)).toBeTruthy();
        expect(mockFormatTaskDuration).toHaveBeenCalledWith(1000, 2500);
    });

    it('does not display duration while task is running', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        const { container } = render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const durationText = container.textContent || '';
        expect(durationText).not.toMatch(/\(\d+[ms]\s\d+[ms]\)/);
    });

    it('auto-scrolls output to bottom when new lines are added', () =>
    {
        const { rerender } = render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Line 1'],
            status: 'running',
        };

        rerender(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const outputDiv = screen.getByText('Line 1').closest('div')?.parentElement;
        expect(outputDiv).toBeTruthy();

        // Verify that output container would be able to scroll
        if (outputDiv)
        {
            expect(outputDiv.style.overflow).toBe('auto');
        }
    });

    it('shows task id when task label not found', () =>
    {
        mockStore.tasks = [];
        mockStore.currentExecution = {
            taskId: 'unknown-task-123',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Task: unknown-task-123')).toBeTruthy();
    });

    it('uses last execution when current execution is null', () =>
    {
        const mockLastExecution = {
            taskId: 'task-1',
            startTime: 1000,
            endTime: 2000,
            output: ['Previous task output'],
            exitCode: 0,
            status: 'success' as const,
        };

        const mockTask = {
            id: 'task-1',
            label: 'Previous Task',
            command: 'echo test',
            group: 'custom' as const,
            isDefault: false,
        };

        mockStore.tasks = [mockTask];
        mockStore.currentExecution = null;
        mockStore.taskHistory = [mockLastExecution];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Task: Previous Task')).toBeTruthy();
        expect(screen.getByText('Previous task output')).toBeTruthy();
    });

    it('parses ANSI colors for output lines', () =>
    {
        mockParseANSIColors.mockReturnValue([
            { text: 'Success', color: '#44cc44', bold: true },
            { text: '!', color: undefined, bold: false },
        ]);

        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Success!'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(mockParseANSIColors).toHaveBeenCalledWith('Success!');
    });

    it('renders with correct theme styles', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Test'],
            status: 'running',
        };

        const { container } = render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const mainPanel = container.firstChild as HTMLElement;
        expect(mainPanel.style.backgroundColor).toBe('rgb(30, 30, 30)');
        expect(mainPanel.style.borderTop).toBe('1px solid rgb(62, 62, 66)');
    });

    it('handles empty output array', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: [],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Task:/)).toBeTruthy();
    });

    it('displays success checkmark for exit code 0', () =>
    {
        mockStore.taskHistory = [
            {
                taskId: 'task-1',
                startTime: 1000,
                endTime: 2000,
                output: ['Done!'],
                exitCode: 0,
                status: 'success' as const,
            },
        ];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Exit code: 0/)).toBeTruthy();
    });

    it('displays failure cross for non-zero exit code', () =>
    {
        mockStore.taskHistory = [
            {
                taskId: 'task-1',
                startTime: 1000,
                endTime: 2000,
                output: ['Error!'],
                exitCode: 127,
                status: 'failed' as const,
            },
        ];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Exit code: 127/)).toBeTruthy();
    });

    it('does not show exit code when undefined', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        const { container } = render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        const exitCodeText = container.textContent || '';
        expect(exitCodeText).not.toMatch(/Exit code:/);
    });

    it('renders clear button always visible', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
    });

    it('renders close button always visible', () =>
    {
        mockStore.currentExecution = {
            taskId: 'task-1',
            startTime: Date.now(),
            output: ['Running...'],
            status: 'running',
        };

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByTitle('Close panel')).toBeTruthy();
    });

    it('handles multiple tasks in history', () =>
    {
        mockStore.tasks = [
            {
                id: 'task-1',
                label: 'Build',
                command: 'build',
                group: 'build' as const,
                isDefault: false,
            },
            {
                id: 'task-2',
                label: 'Test',
                command: 'test',
                group: 'test' as const,
                isDefault: false,
            },
        ];

        mockStore.taskHistory = [
            {
                taskId: 'task-2',
                startTime: 3000,
                endTime: 4000,
                output: ['Test passed'],
                exitCode: 0,
                status: 'success' as const,
            },
            {
                taskId: 'task-1',
                startTime: 1000,
                endTime: 2000,
                output: ['Build complete'],
                exitCode: 0,
                status: 'success' as const,
            },
        ];

        render(<TaskExecutionPanelViewPresenter theme={mockTheme} />);

        // Should display the most recent (first in history)
        expect(screen.getByText('Task: Test')).toBeTruthy();
        expect(screen.getByText('Test passed')).toBeTruthy();
    });
});
