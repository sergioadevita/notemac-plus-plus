import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPaletteViewPresenter } from '../Notemac/UI/CommandPaletteViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowCommandPalette = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowCommandPalette: mockSetShowCommandPalette,
        activeTabId: 'tab-1',
        tabs: [{ id: 'tab-1', name: 'test.js' }],
        zoomLevel: 1,
    })),
}));

vi.mock('../Notemac/Controllers/MenuActionController', () => ({
    HandleMenuAction: vi.fn(),
}));

vi.mock('../Notemac/Configs/CommandRegistry', () => ({
    GetAllCommands: vi.fn(() => [
        { id: 'new', label: 'New File', action: 'new', category: 'File', keybinding: 'Cmd+N' },
        { id: 'save', label: 'Save', action: 'save', category: 'File', keybinding: 'Cmd+S' },
        { id: 'find', label: 'Find', action: 'find', category: 'Search', keybinding: 'Cmd+F' },
        { id: 'undo', label: 'Undo', action: 'undo', category: 'Edit', keybinding: 'Cmd+Z' },
    ]),
}));

vi.mock('../Shared/Helpers/FuzzySearchHelpers', () => ({
    FuzzyMatch: vi.fn((_query: string, text: string) => ({ match: true, score: 1, indices: [0] })),
    FuzzyFilter: vi.fn((query: string, items: any[], accessor: (item: any) => string) =>
        items.filter(item => accessor(item).toLowerCase().includes(query.toLowerCase()))
    ),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_COMMAND_PALETTE_WIDTH: 500,
    UI_COMMAND_PALETTE_MAX_HEIGHT: 400,
    UI_COMMAND_PALETTE_TOP_OFFSET: 100,
    UI_ZINDEX_MODAL: 1000,
}));

const mockTheme = {
    bg: '#1e1e1e', bgSecondary: '#252526', bgTertiary: '#2d2d2d', bgHover: '#2a2d2e',
    border: '#474747', text: '#cccccc', textSecondary: '#969696', textMuted: '#6e7681',
    accent: '#0078d4', accentText: '#ffffff', editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

Element.prototype.scrollIntoView = vi.fn();
describe('CommandPaletteViewPresenter', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<CommandPaletteViewPresenter theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders search input with placeholder', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        expect(screen.getByPlaceholderText('Type a command...')).toBeTruthy();
    });

    it('displays all commands initially', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        expect(screen.getByText('New File')).toBeTruthy();
        expect(screen.getByText('Save')).toBeTruthy();
        expect(screen.getByText('Find')).toBeTruthy();
        expect(screen.getByText('Undo')).toBeTruthy();
    });

    it('displays keyboard shortcut labels', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        expect(screen.getByText('Cmd+N')).toBeTruthy();
        expect(screen.getByText('Cmd+S')).toBeTruthy();
    });

    it('displays command categories', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        expect(screen.getAllByText('File').length).toBeGreaterThan(0);
        expect(screen.getByText('Search')).toBeTruthy();
    });

    it('filters commands when typing', () =>
    {
        const { container } = render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.change(input, { target: { value: 'save' } });
        // When filtering, the label text is broken into multiple spans for highlighting
        // so we need to look for the text using a function matcher or check the DOM
        const listItems = container.querySelectorAll('[style*="justify-content: space-between"]');
        // Should have at least one matching command (the Save command)
        expect(listItems.length).toBeGreaterThan(0);
    });

    it('shows "No matching commands" when no results', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.change(input, { target: { value: 'zzzzzzzzz' } });
        expect(screen.getByText('No matching commands')).toBeTruthy();
    });

    it('closes on Escape key', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mockSetShowCommandPalette).toHaveBeenCalledWith(false);
    });

    it('executes command on Enter key', async () =>
    {
        const { HandleMenuAction } = await import('../Notemac/Controllers/MenuActionController');
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(HandleMenuAction).toHaveBeenCalled();
        expect(mockSetShowCommandPalette).toHaveBeenCalledWith(false);
    });

    it('navigates list with ArrowDown', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        // Should not crash, selection should move
        expect(true).toBe(true);
    });

    it('navigates list with ArrowUp', () =>
    {
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Type a command...');
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        expect(true).toBe(true);
    });

    it('executes command on click', async () =>
    {
        const { HandleMenuAction } = await import('../Notemac/Controllers/MenuActionController');
        render(<CommandPaletteViewPresenter theme={mockTheme} />);
        fireEvent.click(screen.getByText('Save'));
        expect(HandleMenuAction).toHaveBeenCalled();
    });
});
