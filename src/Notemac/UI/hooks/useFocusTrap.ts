import { useEffect, useRef, type RefObject } from 'react';

/**
 * Traps focus within a container element when visible.
 * On mount, focuses the first focusable element.
 * On Tab/Shift+Tab, wraps focus within the container.
 * On Escape, calls the onClose callback.
 */
export function useFocusTrap(
    containerRef: RefObject<HTMLElement | null>,
    isOpen: boolean,
    onClose?: () => void,
): void
{
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() =>
    {
        if (!isOpen || !containerRef.current) return;

        // Save the previously focused element to restore on close
        previousFocusRef.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        // Focus first focusable element
        const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
        firstFocusable?.focus();

        const handleKeyDown = (e: KeyboardEvent): void =>
        {
            if ('Escape' === e.key)
            {
                e.preventDefault();
                onClose?.();
                return;
            }

            if ('Tab' !== e.key) return;

            const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
            if (0 === focusableElements.length) return;

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (e.shiftKey)
            {
                if (document.activeElement === first)
                {
                    e.preventDefault();
                    last.focus();
                }
            }
            else
            {
                if (document.activeElement === last)
                {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () =>
        {
            container.removeEventListener('keydown', handleKeyDown);
            // Restore focus to previously focused element
            previousFocusRef.current?.focus();
        };
    }, [isOpen, containerRef, onClose]);
}
