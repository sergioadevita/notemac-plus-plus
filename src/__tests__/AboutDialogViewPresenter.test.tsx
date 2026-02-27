import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AboutDialog } from '../Notemac/UI/AboutDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

const mockSetShowAbout = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
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
