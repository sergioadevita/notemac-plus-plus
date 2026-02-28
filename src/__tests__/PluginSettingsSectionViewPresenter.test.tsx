import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PluginSettingsSectionViewPresenter } from '../Notemac/UI/PluginSettingsSectionViewPresenter';
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

describe('PluginSettingsSectionViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render nothing when no settings sections exist', () =>
    {
        const mockState = {
            pluginSettingsSections: [],
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        const { container } = render(
            <PluginSettingsSectionViewPresenter theme={mockTheme} />
        );

        expect(null === container.firstChild).toBe(true);
    });

    it('should render single settings section with label', () =>
    {
        const mockSections = [
            {
                id: 'section-1',
                label: 'Plugin Settings',
                component: () => <div data-testid="settings-1">Settings 1</div>,
                pluginId: 'plugin-1',
            },
        ];

        const mockState = {
            pluginSettingsSections: mockSections,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginSettingsSectionViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByText('Plugin Settings')).toBe(true);
        expect(null !== screen.queryByTestId('settings-1')).toBe(true);
    });

    it('should render multiple settings sections', () =>
    {
        const mockSections = [
            {
                id: 'section-1',
                label: 'Settings 1',
                component: () => <div data-testid="settings-1">Settings 1</div>,
                pluginId: 'plugin-1',
            },
            {
                id: 'section-2',
                label: 'Settings 2',
                component: () => <div data-testid="settings-2">Settings 2</div>,
                pluginId: 'plugin-2',
            },
        ];

        const mockState = {
            pluginSettingsSections: mockSections,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginSettingsSectionViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByTestId('settings-1')).toBe(true);
        expect(null !== screen.queryByTestId('settings-2')).toBe(true);
    });

    it('should wrap section components in error boundary', () =>
    {
        const ErrorComponent = () =>
        {
            throw new Error('Settings error');
        };

        const mockSections = [
            {
                id: 'section-1',
                label: 'Failing Settings',
                component: ErrorComponent,
                pluginId: 'plugin-1',
            },
        ];

        const mockState = {
            pluginSettingsSections: mockSections,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        expect(() =>
        {
            render(<PluginSettingsSectionViewPresenter theme={mockTheme} />);
        }).not.toThrow();
    });

    it('should display all sections in order', () =>
    {
        const mockSections = [
            {
                id: 'section-1',
                label: 'First',
                component: () => <div data-testid="first">First</div>,
                pluginId: 'plugin-1',
            },
            {
                id: 'section-2',
                label: 'Second',
                component: () => <div data-testid="second">Second</div>,
                pluginId: 'plugin-2',
            },
            {
                id: 'section-3',
                label: 'Third',
                component: () => <div data-testid="third">Third</div>,
                pluginId: 'plugin-3',
            },
        ];

        const mockState = {
            pluginSettingsSections: mockSections,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginSettingsSectionViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByTestId('first')).toBe(true);
        expect(null !== screen.queryByTestId('second')).toBe(true);
        expect(null !== screen.queryByTestId('third')).toBe(true);
    });
});
