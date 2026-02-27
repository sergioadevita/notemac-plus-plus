import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickOpenViewPresenter } from '../Notemac/UI/QuickOpenViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowQuickOpen = vi.fn();
const mockSetActiveTab = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowQuickOpen: mockSetShowQuickOpen,
        setActiveTab: mockSetActiveTab,
        tabs: [
            { id: 'tab-1', name: 'index.ts', path: '/src/index.ts', isModified: false },
            { id: 'tab-2', name: 'App.tsx', path: '/src/App.tsx', isModified: true },
        ],
        recentFiles: [
            { name: 'old-file.js', path: '/src/old-file.js' },
        ],
    })),
}));

vi.mock('../Shared/Helpers/FuzzySearchHelpers', () => ({
    FuzzyMatch: vi.fn(() => ({ match: true, score: 1, indices: [0] })),
    FuzzyFilter: vi.fn((query: string, items: any[], accessor: (item: any) => string) =>
        items.filter(item => accessor(item).toLowerCase().includes(query.toLowerCase()))
    ),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_ZINDEX_MODAL: 1000,
    UI_COMMAND_PALETTE_TOP_OFFSET: 100,
    UI_COMMAND_PALETTE_WIDTH: 500,
    UI_COMMAND_PALETTE_MAX_HEIGHT: 400,
}));

const mockTheme = {
    bg: '#1e1e1e', bgSecondary: '#252526', border: '#474747', text: '#cccccc',
    textSecondary: '#969696', textMuted: '#6e7681', accent: '#0078d4', accentText: '#ffffff',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

Element.prototype.scrollIntoView = vi.fn();
describe('QuickOpenViewPresenter', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders search input with placeholder', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(screen.getByPlaceholderText('Search files by name...')).toBeTruthy();
    });

    it('displays open tabs', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(screen.getByText('index.ts')).toBeTruthy();
        expect(screen.getByText('App.tsx')).toBeTruthy();
    });

    it('displays recent files', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(screen.getByText('old-file.js')).toBeTruthy();
    });

    it('shows "open" badge for open tabs', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(screen.getAllByText('open').length).toBe(2);
    });

    it('shows modified indicator for modified tabs', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        // Modified tabs show a bullet point
        const allText = document.body.textContent;
        expect(allText).toContain('\u2022'); // bullet character
    });

    it('filters files when typing', () =>
    {
        const { container } = render(<QuickOpenViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Search files by name...');
        fireEvent.change(input, { target: { value: 'index' } });
        // When filtering, the filename text is broken into multiple spans for highlighting
        // so we check that file list items are present
        const listItems = container.querySelectorAll('[style*="justify-content: space-between"]');
        expect(listItems.length).toBeGreaterThan(0);
    });

    it('shows "No matching files" when no results', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Search files by name...');
        fireEvent.change(input, { target: { value: 'zzzzzzzzz' } });
        expect(screen.getByText('No matching files')).toBeTruthy();
    });

    it('closes on Escape key', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Search files by name...');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mockSetShowQuickOpen).toHaveBeenCalledWith(false);
    });

    it('selects tab on Enter key', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Search files by name...');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(mockSetActiveTab).toHaveBeenCalledWith('tab-1');
    });

    it('selects tab on click', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        fireEvent.click(screen.getByText('App.tsx'));
        expect(mockSetActiveTab).toHaveBeenCalledWith('tab-2');
    });

    it('displays file paths', () =>
    {
        render(<QuickOpenViewPresenter theme={mockTheme} />);
        expect(screen.getByText('/src/index.ts')).toBeTruthy();
        expect(screen.getByText('/src/App.tsx')).toBeTruthy();
    });
});
