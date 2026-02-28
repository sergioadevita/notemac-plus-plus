import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PluginSidebarPanelViewPresenter } from '../Notemac/UI/PluginSidebarPanelViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(),
}));

vi.mock('../Notemac/UI/PluginErrorBoundary', () =>
{
    class MockErrorBoundary extends React.Component<any, { hasError: boolean }>
    {
        state = { hasError: false };
        static getDerivedStateFromError() { return { hasError: true }; }
        render() { return this.state.hasError ? null : this.props.children; }
    }
    return { PluginErrorBoundary: MockErrorBoundary };
});

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

describe('PluginSidebarPanelViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render not found message when panel does not exist', () =>
    {
        const mockState = {
            pluginSidebarPanels: [],
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(
            <PluginSidebarPanelViewPresenter
                panelId="nonexistent-panel"
                theme={mockTheme}
            />
        );

        expect(null !== screen.queryByText('Plugin panel not found')).toBe(true);
    });

    it('should render panel component when found', () =>
    {
        const mockPanels = [
            {
                id: 'panel-1',
                component: () => <div data-testid="plugin-panel">Panel Content</div>,
                label: 'Test Panel',
                pluginId: 'plugin-1',
            },
        ];

        const mockState = {
            pluginSidebarPanels: mockPanels,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(
            <PluginSidebarPanelViewPresenter
                panelId="panel-1"
                theme={mockTheme}
            />
        );

        expect(null !== screen.queryByTestId('plugin-panel')).toBe(true);
    });

    it('should render multiple panels and switch between them', () =>
    {
        const mockPanels = [
            {
                id: 'panel-1',
                component: () => <div data-testid="panel-1-content">Panel 1</div>,
                label: 'Panel 1',
                pluginId: 'plugin-1',
            },
            {
                id: 'panel-2',
                component: () => <div data-testid="panel-2-content">Panel 2</div>,
                label: 'Panel 2',
                pluginId: 'plugin-2',
            },
        ];

        const mockState = {
            pluginSidebarPanels: mockPanels,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        const { rerender } = render(
            <PluginSidebarPanelViewPresenter
                panelId="panel-1"
                theme={mockTheme}
            />
        );

        expect(null !== screen.queryByTestId('panel-1-content')).toBe(true);

        rerender(
            <PluginSidebarPanelViewPresenter
                panelId="panel-2"
                theme={mockTheme}
            />
        );

        expect(null !== screen.queryByTestId('panel-2-content')).toBe(true);
    });

    it('should wrap panel component in error boundary', () =>
    {
        const ErrorComponent = () =>
        {
            throw new Error('Panel error');
        };

        const mockPanels = [
            {
                id: 'panel-1',
                component: ErrorComponent,
                label: 'Error Panel',
                pluginId: 'plugin-1',
            },
        ];

        const mockState = {
            pluginSidebarPanels: mockPanels,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        expect(() =>
        {
            render(
                <PluginSidebarPanelViewPresenter
                    panelId="panel-1"
                    theme={mockTheme}
                />
            );
        }).not.toThrow();
    });
});
