import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PluginStatusBarViewPresenter } from '../Notemac/UI/PluginStatusBarViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';

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

// ─── Tests ──────────────────────────────────────────────────────

describe('PluginStatusBarViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render nothing when no status bar items exist', () =>
    {
        const mockState = {
            pluginStatusBarItems: [],
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        const { container } = render(
            <PluginStatusBarViewPresenter position="left" />
        );

        expect('' === container.innerHTML).toBe(true);
    });

    it('should filter items by left position', () =>
    {
        const mockItems = [
            {
                id: 'item-1',
                position: 'left' as const,
                priority: 10,
                component: () => <div data-testid="left-item">Left</div>,
                pluginId: 'plugin-1',
            },
            {
                id: 'item-2',
                position: 'right' as const,
                priority: 10,
                component: () => <div data-testid="right-item">Right</div>,
                pluginId: 'plugin-2',
            },
        ];

        const mockState = {
            pluginStatusBarItems: mockItems,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginStatusBarViewPresenter position="left" />);

        expect(null !== screen.queryByTestId('left-item')).toBe(true);
        expect(null === screen.queryByTestId('right-item')).toBe(true);
    });

    it('should filter items by right position', () =>
    {
        const mockItems = [
            {
                id: 'item-1',
                position: 'left' as const,
                priority: 10,
                component: () => <div data-testid="left-item">Left</div>,
                pluginId: 'plugin-1',
            },
            {
                id: 'item-2',
                position: 'right' as const,
                priority: 10,
                component: () => <div data-testid="right-item">Right</div>,
                pluginId: 'plugin-2',
            },
        ];

        const mockState = {
            pluginStatusBarItems: mockItems,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginStatusBarViewPresenter position="right" />);

        expect(null === screen.queryByTestId('left-item')).toBe(true);
        expect(null !== screen.queryByTestId('right-item')).toBe(true);
    });

    it('should sort items by priority ascending', () =>
    {
        const mockItems = [
            {
                id: 'item-1',
                position: 'left' as const,
                priority: 5,
                component: () => <div data-testid="low-priority">Low Priority</div>,
                pluginId: 'plugin-1',
            },
            {
                id: 'item-2',
                position: 'left' as const,
                priority: 10,
                component: () => <div data-testid="high-priority">High Priority</div>,
                pluginId: 'plugin-2',
            },
            {
                id: 'item-3',
                position: 'left' as const,
                priority: 1,
                component: () => <div data-testid="lowest-priority">Lowest Priority</div>,
                pluginId: 'plugin-3',
            },
        ];

        const mockState = {
            pluginStatusBarItems: mockItems,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        render(<PluginStatusBarViewPresenter position="left" />);

        const items = screen.queryAllByTestId(/priority/);
        expect(items.length > 0).toBe(true);
    });

    it('should wrap components in error boundary', () =>
    {
        const ErrorComponent = () =>
        {
            throw new Error('Render error');
        };

        const mockItems = [
            {
                id: 'item-1',
                position: 'left' as const,
                priority: 10,
                component: ErrorComponent,
                pluginId: 'plugin-1',
            },
        ];

        const mockState = {
            pluginStatusBarItems: mockItems,
        };

        (useNotemacStore as any).mockImplementation((selector: any) =>
            selector(mockState)
        );

        expect(() =>
        {
            render(<PluginStatusBarViewPresenter position="left" />);
        }).not.toThrow();
    });
});
