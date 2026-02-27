import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindReplace } from '../Notemac/UI/FindReplaceViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockUpdateSearchOptions = vi.fn();
const mockSetShowFindReplace = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: Object.assign(
        vi.fn(() => ({
            findReplaceMode: 'find' as const,
            searchOptions: {
                query: '',
                replaceText: '',
                isCaseSensitive: false,
                isWholeWord: false,
                isRegex: false,
                wrapAround: true,
                searchInSelection: false,
            },
            updateSearchOptions: mockUpdateSearchOptions,
            setShowFindReplace: mockSetShowFindReplace,
        })),
        { getState: vi.fn(() => ({ setShowFindReplace: mockSetShowFindReplace })) }
    ),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    MARK_COLORS: { 1: '#ff0000', 2: '#00ff00', 3: '#0000ff', 4: '#ffff00', 5: '#ff00ff' },
}));

const mockTheme = {
    bg: '#1e1e1e', bgSecondary: '#252526', bgHover: '#2a2d2e', border: '#474747',
    text: '#cccccc', textSecondary: '#969696', textMuted: '#6e7681',
    accent: '#0078d4', accentText: '#ffffff',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

describe('FindReplace', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<FindReplace theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders find input with placeholder', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByPlaceholderText('Find...')).toBeTruthy();
    });

    it('renders mode tabs', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByText('Find')).toBeTruthy();
        expect(screen.getByText('Replace')).toBeTruthy();
        expect(screen.getByText('Find in Files')).toBeTruthy();
        expect(screen.getByText('Mark')).toBeTruthy();
    });

    it('renders toggle buttons for search options', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByLabelText('Match Case')).toBeTruthy();
        expect(screen.getByLabelText('Whole Word')).toBeTruthy();
        expect(screen.getByLabelText('Use Regular Expression')).toBeTruthy();
    });

    it('renders navigation buttons', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByLabelText('Previous Match (Shift+Enter)')).toBeTruthy();
        expect(screen.getByLabelText('Next Match (Enter)')).toBeTruthy();
    });

    it('renders close button', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByLabelText('Close find and replace')).toBeTruthy();
    });

    it('closes on close button click', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        fireEvent.click(screen.getByLabelText('Close find and replace'));
        expect(mockSetShowFindReplace).toHaveBeenCalledWith(false);
    });

    it('closes on Escape key', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Find...');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mockSetShowFindReplace).toHaveBeenCalledWith(false);
    });

    it('dispatches find event on Enter key', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<FindReplace theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Find...');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(dispatchSpy).toHaveBeenCalled();
        dispatchSpy.mockRestore();
    });

    it('dispatches find prev on Shift+Enter', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<FindReplace theme={mockTheme} />);
        const input = screen.getByPlaceholderText('Find...');
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        const event = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
        expect(event?.detail?.direction).toBe('prev');
        dispatchSpy.mockRestore();
    });

    it('toggles case sensitivity on button click', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        fireEvent.click(screen.getByLabelText('Match Case'));
        expect(mockUpdateSearchOptions).toHaveBeenCalledWith({ isCaseSensitive: true });
    });

    it('toggles whole word on button click', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        fireEvent.click(screen.getByLabelText('Whole Word'));
        expect(mockUpdateSearchOptions).toHaveBeenCalledWith({ isWholeWord: true });
    });

    it('toggles regex on button click', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        fireEvent.click(screen.getByLabelText('Use Regular Expression'));
        expect(mockUpdateSearchOptions).toHaveBeenCalledWith({ isRegex: true });
    });

    it('renders wrap around checkbox', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByText('Wrap around')).toBeTruthy();
    });

    it('renders in selection checkbox', () =>
    {
        render(<FindReplace theme={mockTheme} />);
        expect(screen.getByText('In selection')).toBeTruthy();
    });
});
