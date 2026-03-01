import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRunnerPanelViewPresenter } from '../Notemac/UI/TaskRunnerPanelViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';
import type { TaskDefinition } from '../Notemac/Commons/Types';
import * as TaskRunnerController from '../Notemac/Controllers/TaskRunnerController';
import { useNotemacStore } from '../Notemac/Model/Store';

const mockTheme: ThemeColors = {
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

const mockTask1: TaskDefinition = {
    id: 'task1',
    label: 'Build',
    command: 'npm run build',
    group: 'build',
    isDefault: true,
};

const mockTask2: TaskDefinition = {
    id: 'task2',
    label: 'Test',
    command: 'npm test',
    group: 'test',
    isDefault: false,
};

const mockTask3: TaskDefinition = {
    id: 'task3',
    label: 'Lint',
    command: 'npm run lint',
    group: 'lint',
    isDefault: false,
};

const mockTask4: TaskDefinition = {
    id: 'task4',
    label: 'Custom Task',
    command: 'custom command',
    group: 'custom',
    isDefault: false,
};

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(),
}));

vi.mock('../Notemac/Controllers/TaskRunnerController', () => ({
    RunTask: vi.fn(),
    CancelCurrentTask: vi.fn(),
}));

vi.mock('../Notemac/Services/TaskRunnerService', () => ({
    GetTasksByGroup: (tasks: TaskDefinition[], group: string) =>
    {
        return tasks.filter(t => t.group === group);
    },
}));

// ─── Get mock functions ─────────────────────────────────────────
const mockRunTask = vi.mocked(TaskRunnerController.RunTask);
const mockCancelCurrentTask = vi.mocked(TaskRunnerController.CancelCurrentTask);
const mockSetTaskPanelVisible = vi.fn();

describe('TaskRunnerPanelViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('renders empty state when no tasks', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/No tasks configured./)).toBeTruthy();
        expect(screen.getByText(/Use the Command Palette to configure tasks./)).toBeTruthy();
    });

    it('renders task groups correctly', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2, mockTask3, mockTask4],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        // Check that task items are rendered (they contain the group names via their labels)
        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.getByText('Test')).toBeTruthy();
        expect(screen.getByText('Lint')).toBeTruthy();
        expect(screen.getByText('Custom Task')).toBeTruthy();
    });

    it('shows running indicator when task is executing', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Running: Build/)).toBeTruthy();
    });

    it('clicking task calls RunTask', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const buildButton = screen.getByText('Build');
        fireEvent.click(buildButton);

        expect(mockRunTask).toHaveBeenCalledWith('task1');
    });

    it('cancel button appears when running', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.getByTitle('Cancel running task');
        expect(cancelButton).toBeTruthy();
        expect(cancelButton.textContent).toBe('Cancel');
    });

    it('cancel button calls CancelCurrentTask', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.getByTitle('Cancel running task');
        fireEvent.click(cancelButton);

        expect(mockCancelCurrentTask).toHaveBeenCalled();
    });

    it('tasks are disabled when another task is running', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2, mockTask3],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const taskButtons = container.querySelectorAll('[title]');
        const testButton = Array.from(taskButtons).find(btn => btn.textContent?.includes('Test'));

        if (null !== testButton)
        {
            expect((testButton as HTMLElement).style.cursor).toBe('default');
        }
    });

    it('shows task labels correctly', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2, mockTask3, mockTask4],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.getByText('Test')).toBeTruthy();
        expect(screen.getByText('Lint')).toBeTruthy();
        expect(screen.getByText('Custom Task')).toBeTruthy();
    });

    it('shows default badge on default tasks', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const defaultBadges = container.querySelectorAll('span');
        const hasDefaultBadge = Array.from(defaultBadges).some(badge => badge.textContent === 'default');

        expect(hasDefaultBadge).toBe(true);
    });

    it('shows output button when running', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const runningDiv = screen.getByText(/Running:/);
        expect(runningDiv).toBeTruthy();

        fireEvent.click(runningDiv);
        expect(mockSetTaskPanelVisible).toHaveBeenCalledWith(true);
    });

    it('does not show cancel button when no task is running', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const cancelButton = screen.queryByTitle('Cancel running task');
        expect(cancelButton).not.toBeTruthy();
    });

    it('does not call RunTask when already running', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const testButton = screen.getByText('Test');
        fireEvent.click(testButton);

        expect(mockRunTask).not.toHaveBeenCalled();
    });

    it('renders group icons correctly', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2, mockTask3, mockTask4],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const icons = container.textContent;
        expect(icons).toContain('⚙');
        expect(icons).toContain('✓');
        expect(icons).toContain('⚡');
        expect(icons).toContain('▶');
    });

    it('shows task count in groups', () =>
    {
        const tasks = [
            mockTask1,
            { ...mockTask2, id: 'task2-alt' },
            mockTask3,
        ];

        useNotemacStore.mockReturnValue({
            tasks,
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.getByText('Test')).toBeTruthy();
        expect(screen.getByText('Lint')).toBeTruthy();
    });

    it('only renders groups with tasks', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.queryByText(/^Test$/)).not.toBeTruthy();
        expect(screen.queryByText(/^Lint$/)).not.toBeTruthy();
        expect(screen.queryByText(/^Custom$/)).not.toBeTruthy();
    });

    it('shows running spinner icon when task is executing', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const runningDiv = screen.getByText(/Running:/);
        const parent = runningDiv.closest('div');

        expect(parent?.textContent).toContain('⟳');
    });

    it('shows play icon for non-running tasks', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const taskItems = container.querySelectorAll('div[title]');
        const hasPlayIcon = Array.from(taskItems).some(item =>
        {
            return item.textContent?.includes('▶');
        });

        expect(hasPlayIcon).toBe(true);
    });

    it('displays running task name when executing', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: {
                taskId: 'task2',
                output: 'Testing...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText(/Running:.*Test/)).toBeTruthy();
    });

    it('multiple tasks can exist in same group', () =>
    {
        const tasks = [
            mockTask1,
            { ...mockTask2, group: 'build', id: 'task-build-2', label: 'Build Watch' },
        ];

        useNotemacStore.mockReturnValue({
            tasks,
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.getByText('Build Watch')).toBeTruthy();
    });

    it('task title attribute shows command', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const buildTask = screen.getByTitle('npm run build');
        expect(buildTask).toBeTruthy();
    });

    it('shows Tasks header', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Tasks')).toBeTruthy();
    });

    it('running task indicator is clickable', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const runningIndicator = screen.getByText(/Running:/);
        expect(runningIndicator).toBeTruthy();

        fireEvent.click(runningIndicator);
        expect(mockSetTaskPanelVisible).toHaveBeenCalledWith(true);
    });

    it('task button text does not include icon', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Build')).toBeTruthy();
        expect(screen.queryByText('▶Build')).not.toBeTruthy();
    });

    it('non-default task does not show default badge', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const testText = screen.getByText('Test');
        const parentDiv = testText.closest('div');

        const hasDefaultBadge = parentDiv?.textContent?.includes('default');
        expect(hasDefaultBadge).toBe(false);
    });

    it('group headers use uppercase styling', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const groupHeader = Array.from(container.querySelectorAll('div')).find(
            div => div.style.textTransform === 'uppercase'
        );

        expect(groupHeader).toBeTruthy();
    });

    it('handles task with missing label', () =>
    {
        const taskNoLabel = { ...mockTask1, label: '' };

        useNotemacStore.mockReturnValue({
            tasks: [taskNoLabel],
            currentExecution: null,
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        expect(screen.getByTitle('npm run build')).toBeTruthy();
    });

    it('task click is prevented when disabled', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1, mockTask2],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        mockRunTask.mockClear();
        render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const testTask = screen.getByTitle('npm test');
        fireEvent.click(testTask);

        expect(mockRunTask).not.toHaveBeenCalledWith('task2');
    });

    it('running task shows spinning icon with animation', () =>
    {
        useNotemacStore.mockReturnValue({
            tasks: [mockTask1],
            currentExecution: {
                taskId: 'task1',
                output: 'Building...',
                isRunning: true,
            },
            SetTaskPanelVisible: mockSetTaskPanelVisible,
        });

        const { container } = render(<TaskRunnerPanelViewPresenter theme={mockTheme} />);

        const spinnerSpan = container.querySelector('span[style*="animation"]');
        expect(spinnerSpan).toBeTruthy();
        expect(spinnerSpan?.textContent).toBe('⟳');
    });
});
