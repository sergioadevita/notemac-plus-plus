import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            showPrintPreview: true,
            setShowPrintPreview: vi.fn(),
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/PrintController', () => ({
    GetPrintPreviewHTML: vi.fn().mockReturnValue('<html><body><p>Preview Content</p></body></html>'),
    PrintCurrentDocument: vi.fn(),
}));

import { PrintPreviewDialogViewPresenter } from '../Notemac/UI/PrintPreviewDialogViewPresenter';

describe('PrintPreviewDialogViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render dialog when visible', () =>
    {
        render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        const overlay = screen.getByTestId('print-preview-overlay');
        expect(overlay).toBeTruthy();
    });

    it('should display Print button', () =>
    {
        render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        expect(screen.getByTestId('print-button')).toBeTruthy();
    });

    it('should display Cancel button', () =>
    {
        render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        expect(screen.getByTestId('cancel-print-button')).toBeTruthy();
    });

    it('should render an iframe for preview', () =>
    {
        const { container } = render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeTruthy();
    });

    it('should have proper dialog structure', () =>
    {
        const { container } = render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        const overlay = screen.getByTestId('print-preview-overlay');
        expect(overlay).toBeTruthy();
    });

    it('should display Print Preview title', () =>
    {
        render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        expect(screen.getByText('Print Preview')).toBeTruthy();
    });

    it('should have iframe with correct title attribute', () =>
    {
        const { container } = render(<PrintPreviewDialogViewPresenter theme={{ bg: '#1e1e1e', border: '#333', accent: '#89b4fa', accentText: '#fff', bgTertiary: '#2a2a2a', text: '#ccc' }} />);
        const iframe = container.querySelector('iframe');
        expect(iframe).toHaveAttribute('title', 'Print Preview');
    });
});
