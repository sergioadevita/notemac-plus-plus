import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunOutputPanel } from '../Notemac/UI/RunOutputPanelViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock dependencies ──────────────────────────────────────────────

const mockSetCompileRunPanelVisible = vi.fn();

let mockStoreState: Record<string, any> = {};

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: () => mockStoreState,
}));

vi.mock('../Notemac/Controllers/CompileRunController', () => ({
    RunCurrentFile: vi.fn(),
    StopExecution: vi.fn(),
    ClearOutput: vi.fn(),
    SendStdinLine: vi.fn(),
}));

vi.mock('../Notemac/Services/TaskRunnerService', () => ({
    FormatTaskDuration: vi.fn(() => '1.23s'),
    ParseANSIColors: vi.fn((text: string) => [{ text, color: undefined, bold: false }]),
}));

// ─── Theme fixture ──────────────────────────────────────────────────

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

// ─── Test helpers ───────────────────────────────────────────────────

function makeExecution(overrides: Record<string, any> = {})
{
    return {
        languageId: 'javascript',
        startTime: Date.now() - 1000,
        endTime: null,
        output: ['> Running: JavaScript', '', 'Hello World'],
        stderr: [],
        exitCode: undefined,
        status: 'running' as const,
        ...overrides,
    };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('RunOutputPanel', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        mockStoreState = {
            compileRunExecution: null,
            compileRunStatus: 'idle',
            compileRunPanelVisible: false,
            SetCompileRunPanelVisible: mockSetCompileRunPanelVisible,
        };
    });

    // ─── Visibility ─────────────────────────────────────────────

    it('renders nothing when no execution and panel not visible', () =>
    {
        const { container } = render(<RunOutputPanel theme={mockTheme} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders empty state when panel visible but no execution', () =>
    {
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('No output to display.')).toBeTruthy();
    });

    it('shows "Console" label in empty state toolbar', () =>
    {
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('Console')).toBeTruthy();
    });

    // ─── Close Button ───────────────────────────────────────────

    it('has a close button in the empty state', () =>
    {
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const closeBtn = screen.getByLabelText('Close Console');
        expect(closeBtn).toBeTruthy();
    });

    it('calls SetCompileRunPanelVisible(false) when close is clicked in empty state', () =>
    {
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        fireEvent.click(screen.getByLabelText('Close Console'));
        expect(mockSetCompileRunPanelVisible).toHaveBeenCalledWith(false);
    });

    it('has a close button when execution exists', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const closeButtons = screen.getAllByLabelText('Close Console');
        expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls SetCompileRunPanelVisible(false) when close is clicked during execution', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const closeButtons = screen.getAllByLabelText('Close Console');
        fireEvent.click(closeButtons[0]);
        expect(mockSetCompileRunPanelVisible).toHaveBeenCalledWith(false);
    });

    // ─── Output Display ─────────────────────────────────────────

    it('renders output lines from execution', () =>
    {
        mockStoreState.compileRunExecution = makeExecution({
            output: ['line 1', 'line 2', 'line 3'],
        });
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('line 1')).toBeTruthy();
        expect(screen.getByText('line 2')).toBeTruthy();
        expect(screen.getByText('line 3')).toBeTruthy();
    });

    // ─── Status Labels ──────────────────────────────────────────

    it('shows "Running..." status when execution is active', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunStatus = 'running';
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('Running...')).toBeTruthy();
    });

    it('shows "Console" status when idle', () =>
    {
        mockStoreState.compileRunExecution = makeExecution({
            endTime: Date.now(),
            exitCode: 0,
            status: 'success',
        });
        mockStoreState.compileRunStatus = 'idle';
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('Console')).toBeTruthy();
    });

    // ─── Stdin Input ────────────────────────────────────────────

    it('shows stdin input field when running', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const input = screen.getByLabelText('Standard input');
        expect(input).toBeTruthy();
        expect(input.getAttribute('placeholder')).toBe('Type input here and press Enter...');
    });

    it('shows Send button when running', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText('Send')).toBeTruthy();
    });

    it('does not show stdin input when not running', () =>
    {
        mockStoreState.compileRunExecution = makeExecution({
            endTime: Date.now(),
            exitCode: 0,
            status: 'success',
        });
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.queryByLabelText('Standard input')).toBeNull();
    });

    it('calls SendStdinLine when form is submitted', async () =>
    {
        const { SendStdinLine } = await import('../Notemac/Controllers/CompileRunController');

        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const input = screen.getByLabelText('Standard input');

        fireEvent.change(input, { target: { value: 'hello world' } });
        fireEvent.submit(input.closest('form')!);

        expect(SendStdinLine).toHaveBeenCalledWith('hello world');
    });

    // ─── Toolbar Buttons ────────────────────────────────────────

    it('renders Run, Clear buttons', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByTitle('Run current file')).toBeTruthy();
        expect(screen.getByTitle('Clear console')).toBeTruthy();
    });

    it('renders Stop button when running', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByTitle('Stop execution')).toBeTruthy();
    });

    it('disables Run button when running', () =>
    {
        mockStoreState.compileRunExecution = makeExecution();
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        const runBtn = screen.getByTitle('Run current file');
        expect(runBtn.hasAttribute('disabled')).toBe(true);
    });

    // ─── Exit Code ──────────────────────────────────────────────

    it('shows success exit code indicator', () =>
    {
        mockStoreState.compileRunExecution = makeExecution({
            endTime: Date.now(),
            exitCode: 0,
            status: 'success',
        });
        mockStoreState.compileRunStatus = 'success';
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText(/Code: 0/)).toBeTruthy();
    });

    it('shows failure exit code indicator', () =>
    {
        mockStoreState.compileRunExecution = makeExecution({
            endTime: Date.now(),
            exitCode: 1,
            status: 'failed',
        });
        mockStoreState.compileRunStatus = 'failed';
        mockStoreState.compileRunPanelVisible = true;

        render(<RunOutputPanel theme={mockTheme} />);
        expect(screen.getByText(/Code: 1/)).toBeTruthy();
    });
});
