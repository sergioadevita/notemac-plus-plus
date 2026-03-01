import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigureTasksDialogViewPresenter } from '../Notemac/UI/ConfigureTasksDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';
import type { TaskDefinition } from '../Notemac/Commons/Types';
import * as TaskRunnerController from '../Notemac/Controllers/TaskRunnerController';
import * as TaskRunnerService from '../Notemac/Services/TaskRunnerService';

// ─── Mock Store ─────────────────────────────────────────────────

const mockTasks: TaskDefinition[] = [
    {
        id: 'task-1',
        label: 'Build Project',
        command: 'npm run build',
        group: 'build',
        isDefault: true,
    },
    {
        id: 'task-2',
        label: 'Run Tests',
        command: 'npm test',
        group: 'test',
        isDefault: false,
    },
];

const mockStoreFunctions = {
    tasks: mockTasks,
};

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => mockStoreFunctions),
}));

// ─── Mock TaskRunnerController ──────────────────────────────────

vi.mock('../Notemac/Controllers/TaskRunnerController', () => ({
    AddNewTask: vi.fn(),
    DeleteTask: vi.fn(),
    LoadTasksFromConfig: vi.fn(),
}));

// ─── Mock TaskRunnerService ────────────────────────────────────

vi.mock('../Notemac/Services/TaskRunnerService', () => ({
    ValidateTaskDefinition: vi.fn(),
}));

// ─── Mock IdHelpers ─────────────────────────────────────────────

vi.mock('../../Shared/Helpers/IdHelpers', () => ({
    generateId: vi.fn(() => 'test-id-123'),
}));

// ─── Mock Constants ─────────────────────────────────────────────

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_ZINDEX_MODAL: 1000,
}));

// ─── Get mock functions ─────────────────────────────────────────
const mockAddNewTask = vi.mocked(TaskRunnerController.AddNewTask);
const mockDeleteTask = vi.mocked(TaskRunnerController.DeleteTask);
const mockLoadTasksFromConfig = vi.mocked(TaskRunnerController.LoadTasksFromConfig);
const mockValidateTaskDefinition = vi.mocked(TaskRunnerService.ValidateTaskDefinition);

// ─── Shared Theme Mock ─────────────────────────────────────────

const mockTheme: ThemeColors = {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgHover: '#2a2d2e',
    bgSelected: '#094771',
    border: '#474747',
    fg: '#cccccc',
    fgSecondary: '#969696',
    fgInactive: '#6e7681',
    text: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e7681',
    accent: '#0078d4',
    accentHover: '#1c8cf9',
    accentFg: '#ffffff',
    accentText: '#ffffff',
    scrollbar: '#424242',
    scrollbarHover: '#4f4f4f',
    findHighlight: '#623315',
    selectionBg: '#264f78',
    lineHighlight: '#2a2d2e',
    errorFg: '#f14c4c',
    warningFg: '#cca700',
    successFg: '#89d185',
    infoFg: '#3794ff',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabHoverBg: '#2a2d2e',
    sidebarBg: '#252526',
    sidebarFg: '#cccccc',
    editorBg: '#1e1e1e',
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

describe('ConfigureTasksDialogViewPresenter', () =>
{
    const mockOnClose = vi.fn();

    beforeEach(() =>
    {
        vi.clearAllMocks();
        mockStoreFunctions.tasks = [...mockTasks];
    });

    // Test 1: Renders dialog with title
    it('renders dialog with title "Configure Tasks"', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        expect(screen.getByText('Configure Tasks')).toBeTruthy();
    });

    // Test 2: Shows task list when tasks exist
    it('shows task list when tasks exist', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        expect(screen.getByText('Build Project')).toBeTruthy();
        expect(screen.getByText('Run Tests')).toBeTruthy();
        expect(screen.getByText('npm run build')).toBeTruthy();
        expect(screen.getByText('npm test')).toBeTruthy();
    });

    // Test 3: Shows empty state when no tasks
    it('shows empty state when no tasks', () =>
    {
        mockStoreFunctions.tasks = [];
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        expect(screen.getByText('No tasks configured yet.')).toBeTruthy();
    });

    // Test 4: Add task button works
    it('shows add task form when add button is clicked', () =>
    {
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);
        // After clicking, form should be visible (check for Save button)
        expect(screen.queryByText('Save')).toBeTruthy();
    });

    // Test 5: Edit task form shows fields (label, command, group, isDefault)
    it('displays all form fields when editing a task', () =>
    {
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const editButton = screen.getAllByText('Edit')[0];
        fireEvent.click(editButton);

        // Check if form shows with task data or input fields
        expect(screen.queryByText('Save')).toBeTruthy();
        expect(container.querySelector('input')).toBeTruthy();
    });

    // Test 6: Delete task button works
    it('calls DeleteTask when delete button is clicked', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
        expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
    });

    // Test 7: Close button calls onClose
    it('calls onClose when close button (×) is clicked', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    // Test 8: Overlay click closes dialog
    it('calls onClose when overlay is clicked', () =>
    {
        const { container } = render(
            <ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />
        );
        const overlay = container.querySelector('div[style*="inset: 0"]') as HTMLElement;
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
    });

    // Test 9: Group dropdown has all options
    it('displays all group options in dropdown', () =>
    {
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        // Find the group select by looking for select element
        const groupSelect = container.querySelector('select') as HTMLSelectElement;
        expect(groupSelect).toBeTruthy();
        const options = Array.from(groupSelect?.options || []).map(opt => opt.value);
        expect(options).toContain('build');
        expect(options).toContain('test');
        expect(options).toContain('lint');
        expect(options).toContain('custom');
    });

    // Test 10: Save task adds to store
    it('calls AddNewTask with form data when save is clicked', () =>
    {
        mockAddNewTask.mockReturnValue({ success: true, errors: [] });
        mockValidateTaskDefinition.mockReturnValue({ valid: true, errors: [] });
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const inputs = container.querySelectorAll('input[type="text"]');
        if (inputs.length >= 2) {
            const labelInput = inputs[0] as HTMLInputElement;
            const commandInput = inputs[1] as HTMLInputElement;
            fireEvent.change(labelInput, { target: { value: 'New Task' } });
            fireEvent.change(commandInput, { target: { value: 'npm run dev' } });
        }

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(mockAddNewTask).toHaveBeenCalled();
    });

    // Additional tests for better coverage

    // Test 11: Cancel button clears form
    it('hides edit form when cancel button is clicked', () =>
    {
        mockStoreFunctions.tasks = [];
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(screen.getByText('No tasks configured yet.')).toBeTruthy();
    });

    // Test 12: Form validation errors are displayed
    it('displays validation errors when task is invalid', () =>
    {
        mockAddNewTask.mockReturnValue({ success: false, errors: ['Label is required'] });
        mockValidateTaskDefinition.mockReturnValue({
            valid: false,
            errors: ['Label is required'],
        });
        mockStoreFunctions.tasks = [];
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(screen.getByText('Label is required')).toBeTruthy();
    });

    // Test 13: Task list mode is shown by default
    it('shows task list mode by default', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        expect(screen.getByText('Build Project')).toBeTruthy();
        expect(screen.queryByText('Import Tasks')).not.toBeTruthy();
    });

    // Test 14: Can switch to JSON import mode
    it('switches to JSON import mode when import JSON button is clicked', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const importJsonButton = screen.getByText('Import JSON');
        fireEvent.click(importJsonButton);

        const textarea = screen.getByPlaceholderText(/{\s*"tasks"/);
        expect(textarea).toBeTruthy();
    });

    // Test 15: JSON import calls LoadTasksFromConfig
    it('calls LoadTasksFromConfig when importing JSON', () =>
    {
        mockLoadTasksFromConfig.mockReturnValue(1);
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const importJsonButton = screen.getByText('Import JSON');
        fireEvent.click(importJsonButton);

        const textarea = screen.getByPlaceholderText(/{\s*"tasks"/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: '{"tasks": []}' } });

        const importButton = screen.getByText('Import Tasks');
        fireEvent.click(importButton);

        expect(mockLoadTasksFromConfig).toHaveBeenCalledWith('{"tasks": []}');
    });

    // Test 16: Field changes update form state
    it('updates form when field values change', () =>
    {
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const inputs = container.querySelectorAll('input[type="text"]');
        if (inputs.length > 0) {
            const labelInput = inputs[0] as HTMLInputElement;
            fireEvent.change(labelInput, { target: { value: 'My Custom Task' } });
            expect(labelInput.value).toBe('My Custom Task');
        }
    });

    // Test 17: Checkbox for isDefault works
    it('updates isDefault checkbox state when clicked', () =>
    {
        mockStoreFunctions.tasks = [];
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const defaultCheckbox = screen.getByLabelText(
            'Default task for this group'
        ) as HTMLInputElement;
        expect(defaultCheckbox.checked).toBe(false);

        fireEvent.click(defaultCheckbox);
        expect(defaultCheckbox.checked).toBe(true);
    });

    // Test 18: Edit preserves original task data
    it('populates form with existing task data when editing', () =>
    {
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        const editButton = screen.getAllByText('Edit')[0];
        fireEvent.click(editButton);

        const inputs = container.querySelectorAll('input[type="text"]');
        const selects = container.querySelectorAll('select');

        if (inputs.length >= 2 && selects.length > 0) {
            const labelInput = inputs[0] as HTMLInputElement;
            const commandInput = inputs[1] as HTMLInputElement;
            const groupSelect = selects[0] as HTMLSelectElement;

            expect(labelInput.value).toBe('Build Project');
            expect(commandInput.value).toBe('npm run build');
            expect(groupSelect.value).toBe('build');
        }
    });

    // Test 19: Overlay click does not propagate to close
    it('prevents overlay click from propagating when clicking dialog content', () =>
    {
        const { container } = render(
            <ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />
        );

        const dialogContent = screen.getByText('Configure Tasks').closest('div') as HTMLElement;
        fireEvent.click(dialogContent);

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    // Test 20: Group dropdown displays proper labels
    it('displays capitalized group labels in dropdown', () =>
    {
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const groupSelect = container.querySelector('select') as HTMLSelectElement;
        if (groupSelect) {
            const optionLabels = Array.from(groupSelect.options).map(opt => opt.textContent);
            expect(optionLabels).toContain('Build');
            expect(optionLabels).toContain('Test');
            expect(optionLabels).toContain('Lint');
            expect(optionLabels).toContain('Custom');
        }
    });

    // Test 21: Task groups are displayed with bracket notation
    it('displays task groups with bracket notation in task list', () =>
    {
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);
        expect(screen.getByText('[build]')).toBeTruthy();
        expect(screen.getByText('[test]')).toBeTruthy();
    });

    // Test 22: Save clears form on success
    it('clears edit form after successful save', () =>
    {
        mockAddNewTask.mockReturnValue({ success: true, errors: [] });
        mockValidateTaskDefinition.mockReturnValue({ valid: true, errors: [] });
        mockStoreFunctions.tasks = [];
        const { container } = render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const inputs = container.querySelectorAll('input[type="text"]');
        if (inputs.length >= 2) {
            const labelInput = inputs[0] as HTMLInputElement;
            const commandInput = inputs[1] as HTMLInputElement;
            fireEvent.change(labelInput, { target: { value: 'Test Task' } });
            fireEvent.change(commandInput, { target: { value: 'npm test' } });
        }

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(screen.getByText('+ Add Task')).toBeTruthy();
    });

    // Test 23: Invalid JSON import shows error
    it('displays error when JSON import fails', () =>
    {
        mockLoadTasksFromConfig.mockReturnValue(0);
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const importJsonButton = screen.getByText('Import JSON');
        fireEvent.click(importJsonButton);

        const textarea = screen.getByPlaceholderText(/{\s*"tasks"/) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'invalid json' } });

        const importButton = screen.getByText('Import Tasks');
        fireEvent.click(importButton);

        expect(screen.getByText('Invalid JSON or no valid tasks found')).toBeTruthy();
    });

    // Test 24: Multiple validation errors are all displayed
    it('displays multiple validation errors', () =>
    {
        const errors = ['Label is required', 'Command is required'];
        mockValidateTaskDefinition.mockReturnValue({
            valid: false,
            errors,
        });
        mockStoreFunctions.tasks = [];
        render(<ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />);

        const addButton = screen.getByText('+ Add Task');
        fireEvent.click(addButton);

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        errors.forEach(error =>
        {
            expect(screen.getByText(error)).toBeTruthy();
        });
    });

    // Test 25: Dialog has proper styling with theme
    it('applies theme colors to dialog elements', () =>
    {
        const { container } = render(
            <ConfigureTasksDialogViewPresenter theme={mockTheme} onClose={mockOnClose} />
        );

        const dialogContent = container.querySelector(
            'div[style*="background: rgb"]'
        ) as HTMLElement;
        expect(dialogContent).toBeTruthy();
        const style = window.getComputedStyle(dialogContent);
        expect(style.backgroundColor || dialogContent.style.background).toBeTruthy();
    });
});
