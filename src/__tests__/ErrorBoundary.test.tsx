import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ErrorBoundary } from '../Notemac/UI/ErrorBoundary';
import React from 'react';

// Suppress console.error during tests
const originalError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error is thrown', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('renders fallback UI when child component throws an error', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error message');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error message')).toBeTruthy();
  });

  it('displays custom fallback message when provided', () => {
    const ThrowingComponent = () => {
      throw new Error('Custom error');
    };

    render(
      <ErrorBoundary fallbackMessage="Custom Fallback Message">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Fallback Message')).toBeTruthy();
  });

  it('displays default fallback message when none provided', () => {
    const ThrowingComponent = () => {
      throw new Error('Some error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('renders Retry button in error state', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeTruthy();
  });

  it('Retry button resets the error boundary', () => {
    
    const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Content after retry</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Re-render with shouldThrow=false so the component doesn't throw
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    // After retry, the component should render normally
    expect(screen.getByText('Content after retry')).toBeTruthy();
  });

  it('displays error message from thrown error', () => {
    const ThrowingComponent = () => {
      throw new Error('Specific error occurred');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Specific error occurred')).toBeTruthy();
  });

  it('renders error container with correct styling', () => {
    const ThrowingComponent = () => {
      throw new Error('Error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const errorContainer = container.querySelector('div') as HTMLElement;
    expect(errorContainer).toBeTruthy();
    expect(errorContainer.style.display).toBe('flex');
    expect(errorContainer.style.flexDirection).toBe('column');
  });

  it('renders retry button with correct styling', () => {
    const ThrowingComponent = () => {
      throw new Error('Error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    const computedStyle = window.getComputedStyle(retryButton);
    expect(retryButton).toBeTruthy();
    expect(computedStyle.cursor).toBe('pointer');
  });

  it('handles multiple children without errors', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeTruthy();
    expect(screen.getByText('Child 2')).toBeTruthy();
    expect(screen.getByText('Child 3')).toBeTruthy();
  });

  it('catches errors from deeply nested components', () => {
    const DeepComponent = () => {
      throw new Error('Deep error');
    };

    const MiddleComponent = () => <DeepComponent />;
    const TopComponent = () => <MiddleComponent />;

    render(
      <ErrorBoundary>
        <TopComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Deep error')).toBeTruthy();
  });

  it('displays error details section with correct layout', () => {
    const ThrowingComponent = () => {
      throw new Error('Layout test error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const errorContainer = container.firstChild as HTMLElement;
    expect(errorContainer).toBeTruthy();
    // Check that it's a flex container
    expect(errorContainer.style.display).toBe('flex');
  });

  it('retry button is interactive after error', () => {
    
    const ToggleComponent = ({ hasError }: { hasError: boolean }) => {
      if (hasError) {
        throw new Error('Toggle error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleComponent hasError={true} />
      </ErrorBoundary>
    );

    let retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeTruthy();

    rerender(
      <ErrorBoundary>
        <ToggleComponent hasError={false} />
      </ErrorBoundary>
    );

    retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    // After clicking retry, it should work
    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('error boundary preserves children structure on recovery', () => {
    
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Temp error');
      }
      return <div>Recovered content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    expect(screen.getByText('Recovered content')).toBeTruthy();
  });
});
