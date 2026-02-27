import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnEditorDialog } from '../Notemac/UI/ColumnEditorDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowColumnEditor = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowColumnEditor: mockSetShowColumnEditor,
        tabs: [{
            id: 'tab-1',
            name: 'test.txt',
            content: 'Hello World\nABC xyz\n123',
        }],
        activeTabId: 'tab-1',
    })),
}));

vi.mock('../Notemac/UI/hooks/useFocusTrap', () => ({
    useFocusTrap: vi.fn(),
}));

const mockTheme = {
    bg: '#1e1e1e', bgSecondary: '#252526', bgTertiary: '#2d2d2d', bgHover: '#2a2d2e',
    border: '#474747', text: '#cccccc', textSecondary: '#969696', textMuted: '#6e7681',
    accent: '#0078d4', accentText: '#ffffff',
} as ThemeColors;

// ─── ColumnEditorDialog ─────────────────────────────────────────

describe('ColumnEditorDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<ColumnEditorDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        expect(screen.getByText('Column Editor')).toBeTruthy();
    });

    it('has correct ARIA attributes', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('renders Text to Insert mode selected by default', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        expect(screen.getByText('Text to Insert')).toBeTruthy();
        const radios = screen.getAllByRole('radio');
        expect((radios[0] as HTMLInputElement).checked).toBe(true);
    });

    it('renders Number to Insert mode option', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        expect(screen.getByText('Number to Insert')).toBeTruthy();
    });

    it('switches to number mode when selected', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Number to Insert'));
        expect(screen.getByText('Initial Number:')).toBeTruthy();
        expect(screen.getByText('Increase by:')).toBeTruthy();
    });

    it('renders Insert and Cancel buttons', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        expect(screen.getByText('Insert')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('dispatches column-edit event on Insert', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<ColumnEditorDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Insert'));

        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('notemac-column-edit');
        expect(event.detail.mode).toBe('text');

        dispatchSpy.mockRestore();
    });

    it('dispatches with number mode when number mode selected', () =>
    {
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        render(<ColumnEditorDialog theme={mockTheme} />);

        fireEvent.click(screen.getByText('Number to Insert'));
        fireEvent.click(screen.getByText('Insert'));

        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.detail.mode).toBe('number');
        expect(event.detail.initial).toBe(0);
        expect(event.detail.increase).toBe(1);

        dispatchSpy.mockRestore();
    });

    it('closes on Cancel click', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockSetShowColumnEditor).toHaveBeenCalledWith(false);
    });

    it('shows format selector in number mode', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Number to Insert'));
        expect(screen.getByText('Format:')).toBeTruthy();
        expect(screen.getByText('Decimal')).toBeTruthy();
    });

    it('shows Leading Zeros checkbox in number mode', () =>
    {
        render(<ColumnEditorDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Number to Insert'));
        expect(screen.getByText('Leading Zeros')).toBeTruthy();
    });
});
