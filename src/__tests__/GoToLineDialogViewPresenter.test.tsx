import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoToLineDialog } from '../Notemac/UI/GoToLineDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

const mockSetShowGoToLine = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowGoToLine: mockSetShowGoToLine,
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
