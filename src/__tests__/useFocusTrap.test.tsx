import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '../Notemac/UI/hooks/useFocusTrap';
import React from 'react';

describe('useFocusTrap', () => {
  let containerRef: React.RefObject<HTMLElement>;
  let container: HTMLElement;
  let focusableButtons: HTMLButtonElement[];

  beforeEach(() => {
    // Create a test container with focusable elements
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create three buttons for focus testing
    focusableButtons = [];
    for (let i = 0; i < 3; i++) {
      const button = document.createElement('button');
      button.textContent = `Button ${i + 1}`;
      container.appendChild(button);
      focusableButtons.push(button);
    }

    containerRef = React.createRef<HTMLElement>();
    containerRef.current = container;

    // Clear any existing focus
    document.body.focus();
  });

  afterEach(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('does nothing when isOpen is false', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: false,
          onClose,
        },
      }
    );

    // Should not focus anything
    expect(document.activeElement).not.toBe(focusableButtons[0]);
  });

  it('focuses the first focusable element on mount when isOpen is true', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // First button should be focused
    expect(document.activeElement).toBe(focusableButtons[0]);
  });

  it('handles focus when containerRef is null', () => {
    const onClose = vi.fn();
    const nullRef = React.createRef<HTMLElement>();

    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(nullRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // Should not crash, and first button should not be focused
    expect(document.activeElement).not.toBe(focusableButtons[0]);
  });

  it('wraps focus from last to first element on Tab', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // First button should be focused
    expect(document.activeElement).toBe(focusableButtons[0]);

    // Focus the last button
    act(() => {
      focusableButtons[2].focus();
    });

    expect(document.activeElement).toBe(focusableButtons[2]);

    // Simulate Tab key on last button
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(tabEvent);
    });

    // Focus should wrap to first button
    expect(document.activeElement).toBe(focusableButtons[0]);
  });

  it('wraps focus from first to last element on Shift+Tab', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // First button should be focused
    expect(document.activeElement).toBe(focusableButtons[0]);

    // Simulate Shift+Tab on first button
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(shiftTabEvent);
    });

    // Focus should wrap to last button
    expect(document.activeElement).toBe(focusableButtons[2]);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(escapeEvent);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('prevents default when Tab wraps focus', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // Focus the last button
    act(() => {
      focusableButtons[2].focus();
    });

    // Simulate Tab key with preventDefault
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

    act(() => {
      container.dispatchEvent(tabEvent);
    });

    // preventDefault should be called to prevent browser's default Tab behavior
    // Note: In jsdom, we can check the call was made
    expect(preventDefaultSpy.mock.calls.length > 0).toBe(true);
  });

  it('prevents default when Escape is pressed', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault');

    act(() => {
      container.dispatchEvent(escapeEvent);
    });

    expect(preventDefaultSpy.mock.calls.length > 0).toBe(true);
  });

  it('ignores non-Tab and non-Escape keys', () => {
    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    const firstButtonBefore = document.activeElement;

    // Simulate Enter key
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(enterEvent);
    });

    // Focus should not change
    expect(document.activeElement).toBe(firstButtonBefore);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles container with no focusable elements', () => {
    // Create a new container without focusable elements
    const emptyContainer = document.createElement('div');
    emptyContainer.textContent = 'No focusable elements';
    document.body.appendChild(emptyContainer);

    const emptyRef = React.createRef<HTMLElement>();
    emptyRef.current = emptyContainer;

    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(emptyRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // Should not crash
    expect(onClose).not.toHaveBeenCalled();

    document.body.removeChild(emptyContainer);
  });

  it('restores focus to previous element on unmount', () => {
    const previousElement = document.createElement('button');
    previousElement.textContent = 'Previous focus';
    document.body.appendChild(previousElement);

    act(() => {
      previousElement.focus();
    });

    expect(document.activeElement).toBe(previousElement);

    const onClose = vi.fn();
    const { unmount } = renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // Focus should move to first button in container
    expect(document.activeElement).toBe(focusableButtons[0]);

    // Unmount the hook
    unmount();

    // Focus should be restored to previous element
    expect(document.activeElement).toBe(previousElement);

    document.body.removeChild(previousElement);
  });

  it('removes event listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    unmount();

    // Simulate Escape key after unmount
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(escapeEvent);
    });

    // onClose should not be called after unmount
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates when isOpen changes from false to true', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: false,
          onClose,
        },
      }
    );

    // First button should not be focused
    expect(document.activeElement).not.toBe(focusableButtons[0]);

    // Re-render with isOpen=true
    rerender({
      isOpen: true,
      onClose,
    });

    // First button should now be focused
    expect(document.activeElement).toBe(focusableButtons[0]);
  });

  it('updates when isOpen changes from true to false', () => {
    const previousElement = document.createElement('button');
    previousElement.textContent = 'Previous';
    document.body.appendChild(previousElement);

    act(() => {
      previousElement.focus();
    });

    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    expect(document.activeElement).toBe(focusableButtons[0]);

    // Re-render with isOpen=false
    rerender({
      isOpen: false,
      onClose,
    });

    // Focus should be restored to previous element
    expect(document.activeElement).toBe(previousElement);

    document.body.removeChild(previousElement);
  });

  it('handles input elements as focusable', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Test input';
    container.appendChild(input);

    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // First button should be focused (it comes first in DOM)
    expect(document.activeElement).toBe(focusableButtons[0]);
  });

  it('handles select elements as focusable', () => {
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.textContent = 'Option';
    select.appendChild(option);
    container.appendChild(select);

    const onClose = vi.fn();
    renderHook(
      ({ isOpen, onClose: onCloseProp }) =>
        useFocusTrap(containerRef, isOpen, onCloseProp),
      {
        initialProps: {
          isOpen: true,
          onClose,
        },
      }
    );

    // First button should still be focused
    expect(document.activeElement).toBe(focusableButtons[0]);
  });
});
