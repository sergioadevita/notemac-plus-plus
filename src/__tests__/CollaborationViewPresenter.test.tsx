import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            isCollaborating: true,
            collaborationSession: {
                roomId: 'test-room-abc',
                peers: [
                    { id: '1', name: 'Alice', color: '#ff0000' },
                    { id: '2', name: 'Bob', color: '#00ff00' },
                ],
                isHost: true,
            },
            SetIsCollaborating: vi.fn(),
            SetCollaborationSession: vi.fn(),
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/CollaborationController', () => ({
    Initialize: vi.fn(),
    Dispose: vi.fn(),
    EndSession: vi.fn(),
    SetOnPeersChangedCallback: vi.fn(),
    SetOnSessionStartedCallback: vi.fn(),
    SetOnSessionEndedCallback: vi.fn(),
}));

import CollaborationViewPresenter from '../Notemac/UI/CollaborationViewPresenter';

describe('CollaborationViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render collaboration indicator when active', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByRole('status')).toBeTruthy();
    });

    it('should display room ID', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByText(/test-room-abc/)).toBeTruthy();
    });

    it('should display Copy button', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByText('Copy')).toBeTruthy();
    });

    it('should display Leave button', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByText('Leave')).toBeTruthy();
    });

    it('should have accessible labels for buttons', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByLabelText('Copy room ID')).toBeTruthy();
        expect(screen.getByLabelText('Leave collaboration session')).toBeTruthy();
    });

    it('should have collaboration session status label', () =>
    {
        render(<CollaborationViewPresenter />);
        expect(screen.getByLabelText('Collaboration session active')).toBeTruthy();
    });

    it('should have status indicator element', () =>
    {
        const { container } = render(<CollaborationViewPresenter />);
        const indicator = container.querySelector('div[role="status"]');
        expect(indicator).toBeTruthy();
    });

    it('should have button for copying room ID', () =>
    {
        render(<CollaborationViewPresenter />);
        const copyButton = screen.getByLabelText('Copy room ID');
        expect(copyButton).toHaveTextContent('Copy');
    });

    it('should have button for leaving session', () =>
    {
        render(<CollaborationViewPresenter />);
        const leaveButton = screen.getByLabelText('Leave collaboration session');
        expect(leaveButton).toHaveTextContent('Leave');
    });

    it('should render with correct aria label on status element', () =>
    {
        render(<CollaborationViewPresenter />);
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-label', 'Collaboration session active');
    });

    it('should have green status indicator dot', () =>
    {
        const { container } = render(<CollaborationViewPresenter />);
        const indicator = container.querySelector('span[aria-hidden="true"]');
        expect(indicator).toBeTruthy();
    });

    it('should render room ID with text prefix', () =>
    {
        render(<CollaborationViewPresenter />);
        const roomText = screen.getByText(/Room:/);
        expect(roomText).toBeTruthy();
    });
});
