import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockConflicts = [
    {
        startLine: 5,
        separatorLine: 8,
        endLine: 11,
        currentContent: 'const x = 1;',
        incomingContent: 'const x = 2;',
        currentLabel: 'HEAD',
        incomingLabel: 'feature-branch',
    },
];

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            conflicts: mockConflicts,
            SetConflicts: vi.fn(),
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/Git/GitMergeController', () => ({
    AcceptCurrent: vi.fn().mockReturnValue('resolved'),
    AcceptIncoming: vi.fn().mockReturnValue('resolved'),
    AcceptBoth: vi.fn().mockReturnValue('resolved'),
}));

import { MergeConflictViewPresenter } from '../Notemac/UI/MergeConflictViewPresenter';

describe('MergeConflictViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render conflict resolution controls', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('merge-conflict-controls')).toBeTruthy();
    });

    it('should display conflict count', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByText(/1 merge conflict detected/)).toBeTruthy();
    });

    it('should show Accept Current button', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('accept-current-0')).toBeTruthy();
        expect(screen.getByText('Accept Current')).toBeTruthy();
    });

    it('should show Accept Incoming button', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('accept-incoming-0')).toBeTruthy();
        expect(screen.getByText('Accept Incoming')).toBeTruthy();
    });

    it('should show Accept Both button', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('accept-both-0')).toBeTruthy();
        expect(screen.getByText('Accept Both')).toBeTruthy();
    });

    it('should display conflict line numbers', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByText(/Line 5:/)).toBeTruthy();
    });

    it('should have proper action buttons for each conflict', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should have data test ids for conflict resolution buttons', () =>
    {
        render(<MergeConflictViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('conflict-0')).toBeTruthy();
    });
});
