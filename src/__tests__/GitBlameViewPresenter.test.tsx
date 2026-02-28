import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockBlameData = [
    { line: 1, author: 'John Doe', date: '2025-01-15', commitHash: 'abc1234', commitMessage: 'Initial commit' },
    { line: 2, author: 'Jane Smith', date: '2025-02-20', commitHash: 'def5678', commitMessage: 'Add feature X' },
    { line: 3, author: 'John Doe', date: '2025-03-10', commitHash: 'ghi9012', commitMessage: 'Fix bug in module Y' },
];

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            blameVisible: true,
            blameData: mockBlameData,
        };
        return selector(state);
    }),
}));

import { GitBlameViewPresenter } from '../Notemac/UI/GitBlameViewPresenter';

describe('GitBlameViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render blame annotations', () =>
    {
        render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        const johnDoeElements = screen.getAllByText(/John Doe/);
        expect(johnDoeElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/Jane Smith/)).toBeTruthy();
    });

    it('should display commit hashes', () =>
    {
        render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        expect(screen.getByText(/abc1234/)).toBeTruthy();
    });

    it('should display dates', () =>
    {
        render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        expect(screen.getByText(/2025-01-15/)).toBeTruthy();
    });

    it('should render correct number of blame lines', () =>
    {
        const { container } = render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        const lines = container.querySelectorAll('[data-testid^="blame-line"]');
        expect(lines.length).toBe(3);
    });

    it('should have proper gutter structure', () =>
    {
        const { container } = render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        const gutter = container.querySelector('[data-testid="git-blame-gutter"]');
        expect(gutter).toBeTruthy();
    });

    it('should render all blame data entries', () =>
    {
        render(<GitBlameViewPresenter theme={{ textMuted: '#999' }} />);
        expect(screen.getByText(/def5678/)).toBeTruthy();
        expect(screen.getByText(/ghi9012/)).toBeTruthy();
        expect(screen.getByText(/2025-02-20/)).toBeTruthy();
        expect(screen.getByText(/2025-03-10/)).toBeTruthy();
    });
});
