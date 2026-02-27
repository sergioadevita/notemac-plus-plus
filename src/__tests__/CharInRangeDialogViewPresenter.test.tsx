import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharInRangeDialog } from '../Notemac/UI/CharInRangeDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowCharInRange = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowCharInRange: mockSetShowCharInRange,
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
