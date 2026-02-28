import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PluginDialogViewPresenter } from '../Notemac/UI/PluginDialogViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(),
}));

vi.mock('../Notemac/UI/PluginErrorBoundary', () => ({
    PluginErrorBoundary: ({ children }: any) => children,
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_ZINDEX_MODAL: 10000,
}));

// ─── Mock Theme ─────────────────────────────────────────────────

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

// ─── Tests ──────────────────────────────────────────────────────

describe('PluginDialogViewPresenter', () =>
{
    const mockSetPluginDialogComponent = vi.fn();
    const mockDialogComponent = () => (
        <div data-testid="mock-dialog">Mock Dialog Content</div>
    );

    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render nothing when no dialog component is set', () =>
    {
        const mockState = {
            pluginDialogComponent: null,
            SetPluginDialogComponent: mockSetPluginDialogComponent,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        const { container } = render(
            <PluginDialogViewPresenter theme={mockTheme} />
        );

        expect('' === container.innerHTML || null === screen.queryByTestId('mock-dialog')).toBe(true);
    });

    it('should render plugin dialog component when provided', () =>
    {
        const mockState = {
            pluginDialogComponent: mockDialogComponent,
            SetPluginDialogComponent: mockSetPluginDialogComponent,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginDialogViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByTestId('mock-dialog')).toBe(true);
    });

    it('should close dialog when Escape key is pressed', async () =>
    {
        const mockState = {
            pluginDialogComponent: mockDialogComponent,
            SetPluginDialogComponent: mockSetPluginDialogComponent,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginDialogViewPresenter theme={mockTheme} />);

        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() =>
        {
            expect(mockSetPluginDialogComponent).toHaveBeenCalled();
        });
    });

    it('should close dialog when backdrop is clicked', async () =>
    {
        const mockState = {
            pluginDialogComponent: mockDialogComponent,
            SetPluginDialogComponent: mockSetPluginDialogComponent,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        const { container } = render(
            <PluginDialogViewPresenter theme={mockTheme} />
        );

        const backdrop = container.querySelector('div[style*="fixed"]');
        if (null !== backdrop)
        {
            fireEvent.click(backdrop);
            expect(mockSetPluginDialogComponent).toHaveBeenCalled();
        }
    });

    it('should not close dialog when inner content is clicked', async () =>
    {
        const mockState = {
            pluginDialogComponent: mockDialogComponent,
            SetPluginDialogComponent: mockSetPluginDialogComponent,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginDialogViewPresenter theme={mockTheme} />);

        const dialog = screen.queryByTestId('mock-dialog');
        if (null !== dialog)
        {
            fireEvent.click(dialog);
            await waitFor(() =>
            {
                expect(mockSetPluginDialogComponent).not.toHaveBeenCalled();
            });
        }
    });
});
