import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunCommandDialog } from '../Notemac/UI/RunCommandDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

const mockSetShowRunCommand = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowRunCommand: mockSetShowRunCommand,
        tabs: [
            {
                id: 'tab-1',
                name: 'test.js',
                path: '/home/user/test.js',
                content: 'line one\nline two\nline three\n\nfive words on this line',
                language: 'javascript',
                encoding: 'utf-8',
                lineEnding: 'lf',
                cursorLine: 2,
                cursorColumn: 5,
                bookmarks: [1, 3],
                marks: [],
                isModified: true,
                isReadOnly: false,
            },
        ],
        activeTabId: 'tab-1',
    })),
}));

vi.mock('../Notemac/UI/hooks/useFocusTrap', () => ({
    useFocusTrap: vi.fn(),
}));

vi.mock('../Shared/Helpers/TextHelpers', () => ({
    countWords: vi.fn().mockReturnValue(9),
    formatFileSize: vi.fn().mockReturnValue('48 B'),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    APP_VERSION: '1.0.0',
}));

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
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── RunCommandDialog ───────────────────────────────────────────

describe('RunCommandDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<RunCommandDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title "Run Command"', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        expect(screen.getByText('Run Command')).toBeTruthy();
    });

    it('renders input with placeholder', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        expect(screen.getByPlaceholderText('Enter command to run...')).toBeTruthy();
    });

    it('renders Run button', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        expect(screen.getByText('Run')).toBeTruthy();
    });

    it('renders Close button', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        expect(screen.getByText('Close')).toBeTruthy();
    });

    it('shows web-only message when electronAPI is not available', async () =>
    {
        const originalElectronAPI = (window as any).electronAPI;
        (window as any).electronAPI = undefined;

        render(<RunCommandDialog theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Enter command to run...');
        fireEvent.change(input, { target: { value: 'ls -la' } });
        fireEvent.click(screen.getByText('Run'));

        // Wait for async state update
        await vi.waitFor(() =>
        {
            expect(screen.getByText(/only available in the desktop version/)).toBeTruthy();
        });

        (window as any).electronAPI = originalElectronAPI;
    });

    it('closes on Close button click', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Close'));
        expect(mockSetShowRunCommand).toHaveBeenCalledWith(false);
    });

    it('closes on Escape key', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Enter command to run...');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mockSetShowRunCommand).toHaveBeenCalledWith(false);
    });

    it('does not run empty command', () =>
    {
        render(<RunCommandDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Run'));
        // No output should appear
        expect(screen.queryByRole('code')).toBeFalsy();
    });
});
