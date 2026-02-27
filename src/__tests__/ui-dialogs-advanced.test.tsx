import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharInRangeDialog } from '../Notemac/UI/CharInRangeDialogViewPresenter';
import { ColumnEditorDialog } from '../Notemac/UI/ColumnEditorDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowCharInRange = vi.fn();
const mockSetShowColumnEditor = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowCharInRange: mockSetShowCharInRange,
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

// ─── CharInRangeDialog ──────────────────────────────────────────

describe('CharInRangeDialog', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<CharInRangeDialog theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders dialog with title', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        expect(screen.getByText('Find Characters in Range')).toBeTruthy();
    });

    it('has correct ARIA attributes', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('renders range inputs with default values', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        const inputs = screen.getAllByRole('spinbutton');
        expect(inputs.length).toBe(2);
    });

    it('renders Find button', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        expect(screen.getByText('Find')).toBeTruthy();
    });

    it('renders Close button', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        expect(screen.getByText('Close')).toBeTruthy();
    });

    it('shows helper text about common ranges', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        expect(screen.getByText(/Common ranges/)).toBeTruthy();
    });

    it('shows initial status text', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        expect(screen.getByText('Enter a range and click Find')).toBeTruthy();
    });

    it('finds characters in ASCII range', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Find'));
        // Should find characters in range 0-127 (all ASCII chars in content)
        expect(screen.getByText(/characters found/)).toBeTruthy();
    });

    it('closes on Close button click', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Close'));
        expect(mockSetShowCharInRange).toHaveBeenCalledWith(false);
    });

    it('closes on overlay click', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        const overlay = screen.getByText('Find Characters in Range').closest('.dialog-overlay')!;
        fireEvent.click(overlay);
        expect(mockSetShowCharInRange).toHaveBeenCalledWith(false);
    });

    it('renders table headers when results exist', () =>
    {
        render(<CharInRangeDialog theme={mockTheme} />);
        fireEvent.click(screen.getByText('Find'));
        expect(screen.getByText('Line')).toBeTruthy();
        expect(screen.getByText('Col')).toBeTruthy();
        expect(screen.getByText('Char')).toBeTruthy();
        expect(screen.getByText('Code')).toBeTruthy();
        expect(screen.getByText('Hex')).toBeTruthy();
    });
});

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
