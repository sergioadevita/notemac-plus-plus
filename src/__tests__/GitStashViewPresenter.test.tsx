import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockStashes = [
    { index: 0, message: 'WIP on main: work in progress', date: '2025-12-01', hash: 'abc1234' },
    { index: 1, message: 'Saved for later', date: '2025-11-28', hash: 'def5678' },
];

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            stashes: mockStashes,
            SetStashes: vi.fn(),
            isRepoInitialized: true,
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/Git/GitStashController', () => ({
    StashChanges: vi.fn(),
    PopStash: vi.fn(),
    ApplyStash: vi.fn(),
    DropStash: vi.fn(),
    ListStashes: vi.fn().mockResolvedValue([]),
}));

import { GitStashViewPresenter } from '../Notemac/UI/GitStashViewPresenter';

describe('GitStashViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render stash section', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        expect(screen.getByTestId('git-stash-section')).toBeTruthy();
    });

    it('should display stash header', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        expect(screen.getByTestId('stash-header')).toBeTruthy();
    });

    it('should show stash count in header', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        expect(screen.getByText(/Stashes \(2\)/)).toBeTruthy();
    });

    it('should expand section when header is clicked', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        expect(screen.getByTestId('stash-message-input')).toBeTruthy();
    });

    it('should display stash entries when expanded', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        expect(screen.getByText(/WIP on main/)).toBeTruthy();
        expect(screen.getByText(/Saved for later/)).toBeTruthy();
    });

    it('should have stash action buttons when expanded', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        expect(screen.getByTestId('apply-stash-0')).toBeTruthy();
        expect(screen.getByTestId('pop-stash-0')).toBeTruthy();
        expect(screen.getByTestId('drop-stash-0')).toBeTruthy();
    });

    it('should render stash message input when expanded', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        const input = screen.getByTestId('stash-message-input');
        expect(input).toBeTruthy();
        expect(input).toHaveAttribute('placeholder', 'Stash message (optional)');
    });

    it('should have stash button when expanded', () =>
    {
        render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        expect(screen.getByTestId('stash-button')).toBeTruthy();
    });

    it('should toggle expanded state on header click', () =>
    {
        const { container } = render(<GitStashViewPresenter theme={{ text: '#ccc', border: '#333', bgTertiary: '#2a2a2a', accent: '#89b4fa', accentText: '#fff', textMuted: '#999', textSecondary: '#bbb', error: '#f38ba8' }} />);
        const header = screen.getByTestId('stash-header');
        fireEvent.click(header);
        expect(screen.getByTestId('stash-message-input')).toBeTruthy();
        fireEvent.click(header);
        expect(null === container.querySelector('[data-testid="stash-message-input"]')).toBe(true);
    });
});
