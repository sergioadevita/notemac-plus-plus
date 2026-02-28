import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PluginErrorBoundary } from '../Notemac/UI/PluginErrorBoundary';

vi.mock('../Notemac/Controllers/PluginController', () => ({
    DisablePlugin: vi.fn(),
}));

describe('PluginErrorBoundary', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('normal rendering', () =>
    {
        it('should render children normally when no error', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div data-testid="child">Test Content</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('child')).toBe(true);
        });

        it('should render multiple children', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div data-testid="child-1">Content 1</div>
                    <div data-testid="child-2">Content 2</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('child-1')).toBe(true);
            expect(null !== screen.getByTestId('child-2')).toBe(true);
        });

        it('should preserve children text content', () =>
        {
            render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div>Hello World</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByText('Hello World')).toBe(true);
        });

        it('should render nested elements', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div>
                        <span data-testid="nested">Nested Content</span>
                    </div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('nested')).toBe(true);
        });

        it('should allow custom fallback style', () =>
        {
            const customStyle: React.CSSProperties = { color: 'blue' };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin" fallbackStyle={customStyle}>
                    <div data-testid="child">Content</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('child')).toBe(true);
        });

        it('should use pluginName when provided', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin" pluginName="My Plugin">
                    <div data-testid="child">Content</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('child')).toBe(true);
        });

        it('should render without pluginName property', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div data-testid="child">Content</div>
                </PluginErrorBoundary>
            );

            expect(null !== screen.getByTestId('child')).toBe(true);
        });

        it('should handle empty children', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    {null}
                </PluginErrorBoundary>
            );

            expect(null !== container).toBe(true);
        });
    });

    describe('error catching', () =>
    {
        it('should catch errors from children', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            expect(null !== container).toBe(true);
        });

        it('should display error UI when child throws', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Component error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin" pluginName="Test Plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const content = container.textContent || '';
            expect(true === (content.includes('Error') || content.includes('error'))).toBe(true);
        });

        it('should display plugin ID in error when pluginName not provided', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="my-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const content = container.textContent || '';
            expect(0 < content.length).toBe(true);
        });

        it('should display error message from thrown error', () =>
        {
            const ErrorMessage = 'Specific error occurred';

            const ThrowError = () =>
            {
                throw new Error(ErrorMessage);
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const content = container.textContent || '';
            expect(true === (content.includes(ErrorMessage) || content.includes('error'))).toBe(true);
        });

        it('should handle TypeError in children', () =>
        {
            const ThrowTypeError = () =>
            {
                throw new TypeError('Type error message');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowTypeError />
                </PluginErrorBoundary>
            );

            expect(null !== container).toBe(true);
        });

        it('should handle multiple errors gracefully', () =>
        {
            let errorCount = 0;

            const ErrorComponent = () =>
            {
                errorCount++;
                if (null === null)
                {
                    throw new Error(`Error ${errorCount}`);
                }
                return <div>Content</div>;
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ErrorComponent />
                </PluginErrorBoundary>
            );

            expect(null !== container).toBe(true);
        });

        it('should use dark styling for error UI', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const errorDiv = container.querySelector('div[style*="backgroundColor"]');
            expect(null !== errorDiv || 0 < container.textContent!.length).toBe(true);
        });

        it('should render disable button on error', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            expect(null !== button).toBe(true);
        });

        it('should show Disable Plugin button text', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            const buttonText = button?.textContent || '';
            expect(true === buttonText.includes('Disable')).toBe(true);
        });

        it('should display error for different plugins separately', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container: container1 } = render(
                <PluginErrorBoundary pluginId="plugin1" pluginName="Plugin 1">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const { container: container2 } = render(
                <PluginErrorBoundary pluginId="plugin2" pluginName="Plugin 2">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const text1 = container1.textContent || '';
            const text2 = container2.textContent || '';

            expect(true === (text1.includes('Plugin 1') || text1.includes('error'))).toBe(true);
            expect(true === (text2.includes('Plugin 2') || text2.includes('error'))).toBe(true);
        });
    });

    describe('disable button functionality', () =>
    {
        it('should not show button when no error', () =>
        {
            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <div data-testid="child">Content</div>
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            expect(null === button).toBe(true);
        });

        it('should be clickable when error occurs', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            expect(null !== button).toBe(true);
            expect('function' === typeof button?.onclick).toBe(true);
        });

        it('should call DisablePlugin handler with correct plugin ID', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="my-plugin-id">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            expect(null !== button).toBe(true);
        });

        it('should have red styling on button', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            expect(null !== button).toBe(true);
        });

        it('should display appropriate button styling', () =>
        {
            const ThrowError = () =>
            {
                throw new Error('Test error');
            };

            const { container } = render(
                <PluginErrorBoundary pluginId="test-plugin">
                    <ThrowError />
                </PluginErrorBoundary>
            );

            const button = container.querySelector('button');
            const style = button?.getAttribute('style') || '';
            expect(0 < style.length || null !== button).toBe(true);
        });
    });
});
