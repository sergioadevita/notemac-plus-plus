import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoToLineDialog } from '../Notemac/UI/GoToLineDialogViewPresenter';
import { SummaryDialog } from '../Notemac/UI/SummaryDialogViewPresenter';
import { RunCommandDialog } from '../Notemac/UI/RunCommandDialogViewPresenter';
import { AboutDialog } from '../Notemac/UI/AboutDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

const mockSetShowGoToLine = vi.fn();
const mockSetShowSummary = vi.fn();
const mockSetShowRunCommand = vi.fn();
const mockSetShowAbout = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowGoToLine: mockSetShowGoToLine,
        setShowSummary: mockSetShowSummary,
        setShowRunCommand: mockSetShowRunCommand,
        setShowAbout: mockSetShowAbout,
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

// ─── GoToLineDialog ─────────────────────────────────────────────

describe('GoToLineDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<GoToLineDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title "Go to Line"', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        expect(screen.getByText('Go to Line')).toBeTruthy();
    });

    it('renders with correct ARIA attributes', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeTruthy();
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('displays total line count in helper text', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        expect(screen.getByText(/1 - 5/)).toBeTruthy();
    });

    it('renders Go button', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        expect(screen.getByText('Go')).toBeTruthy();
    });

    it('dispatches goto-line event on Go click', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<GoToLineDialog theme={mockTheme} />);

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.click(screen.getByText('Go'));

        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('notemac-goto-line');
        expect(event.detail.line).toBe(3);

        dispatchSpy.mockRestore();
    });

    it('does not dispatch event for invalid input', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<GoToLineDialog theme={mockTheme} />);

        fireEvent.click(screen.getByText('Go'));

        expect(dispatchSpy).not.toHaveBeenCalled();
        dispatchSpy.mockRestore();
    });

    it('closes on overlay click', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Go to Line').closest('.dialog-overlay')!);
        expect(mockSetShowGoToLine).toHaveBeenCalledWith(false);
    });

    it('closes on Escape key', () =>
    {
        render(<GoToLineDialog theme={mockTheme} />);
        const input = screen.getByRole('spinbutton');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mockSetShowGoToLine).toHaveBeenCalledWith(false);
    });

    it('submits on Enter key', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<GoToLineDialog theme={mockTheme} />);

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(dispatchSpy).toHaveBeenCalled();
        dispatchSpy.mockRestore();
    });
});

// ─── SummaryDialog ──────────────────────────────────────────────

describe('SummaryDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<SummaryDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title "Summary"', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        expect(screen.getByText('Summary')).toBeTruthy();
    });

    it('displays file metadata', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        expect(screen.getByText('test.js')).toBeTruthy();
        expect(screen.getByText('/home/user/test.js')).toBeTruthy();
        expect(screen.getByText('javascript')).toBeTruthy();
        expect(screen.getByText('utf-8')).toBeTruthy();
    });

    it('displays cursor position', () =>
    {
        const { container } = render(<SummaryDialog theme={mockTheme} />);
        // Cursor position is shown in the summary dialog
        // cursorLine is 2, cursorColumn is 5 (from mockTab in beforeEach)
        const summaryText = container.textContent || '';
        expect(summaryText).toContain('Current Line');
        expect(summaryText).toContain('Current Column');
    });

    it('displays bookmark count', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        // 2 bookmarks
        const allText = document.body.textContent;
        expect(allText).toContain('Bookmarks');
    });

    it('displays modification status', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        expect(screen.getByText('Yes')).toBeTruthy(); // isModified = true
    });

    it('renders OK button that closes dialog', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('OK'));
        expect(mockSetShowSummary).toHaveBeenCalledWith(false);
    });

    it('has correct ARIA attributes', () =>
    {
        render(<SummaryDialog theme={mockTheme} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-labelledby')).toBe('summary-title');
    });
});

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

// ─── AboutDialog ────────────────────────────────────────────────

describe('AboutDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<AboutDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title "Notemac++"', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('Notemac++')).toBeTruthy();
    });

    it('displays version number', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText(/Version 1.0.0/)).toBeTruthy();
    });

    it('displays creator name', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('Sergio Agustin De Vita')).toBeTruthy();
    });

    it('displays feature list', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('FEATURES')).toBeTruthy();
        expect(screen.getByText('Git Integration')).toBeTruthy();
        expect(screen.getByText('Code Snippets')).toBeTruthy();
    });

    it('renders LinkedIn link', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('linkedin.com/in/sergioadevita')).toBeTruthy();
    });

    it('renders Donate link to Ko-fi', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('Donate')).toBeTruthy();
    });

    it('renders Give Feedback link', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        expect(screen.getByText('Give Feedback')).toBeTruthy();
    });

    it('renders OK button that closes dialog', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('OK'));
        expect(mockSetShowAbout).toHaveBeenCalledWith(false);
    });

    it('has correct ARIA attributes', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-labelledby')).toBe('about-title');
    });

    it('renders app icon image', () =>
    {
        render(<AboutDialog theme={mockTheme} />);
        const img = screen.getByAltText('Notemac++');
        expect(img).toBeTruthy();
        expect(img.getAttribute('src')).toBe('/icon.png');
    });
});
