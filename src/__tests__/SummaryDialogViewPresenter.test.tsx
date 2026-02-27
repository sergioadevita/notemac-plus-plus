import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryDialog } from '../Notemac/UI/SummaryDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

const mockSetShowSummary = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowSummary: mockSetShowSummary,
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
