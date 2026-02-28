import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSetShowCollaborationDialog = vi.fn();
const mockSetIsCollaborating = vi.fn();
const mockSetCollaborationSession = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            showCollaborationDialog: true,
            setShowCollaborationDialog: mockSetShowCollaborationDialog,
            SetIsCollaborating: mockSetIsCollaborating,
            SetCollaborationSession: mockSetCollaborationSession,
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/CollaborationController', () => ({
    StartSession: vi.fn().mockReturnValue('new-room-id'),
    JoinSession: vi.fn(),
    EndSession: vi.fn(),
}));

import CollaborationDialogViewPresenter from '../Notemac/UI/CollaborationDialogViewPresenter';

describe('CollaborationDialogViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render dialog when visible', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('should display Collaborative Editing title', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        expect(screen.getByText('Collaborative Editing')).toBeTruthy();
    });

    it('should show Create Session and Join Session buttons', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        expect(screen.getByText('Create Session')).toBeTruthy();
        expect(screen.getByText('Join Session')).toBeTruthy();
    });

    it('should show Your Name input', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        expect(screen.getByLabelText('Your display name')).toBeTruthy();
    });

    it('should show Cancel and action buttons', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Create')).toBeTruthy();
    });

    it('should show Room ID input when Join mode selected', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        fireEvent.click(screen.getByText('Join Session'));
        expect(screen.getByLabelText('Room ID to join')).toBeTruthy();
    });

    it('should switch action button text in Join mode', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        fireEvent.click(screen.getByText('Join Session'));
        expect(screen.getByText('Join')).toBeTruthy();
    });

    it('should have modal accessibility attributes', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should show error when joining with empty room ID', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        fireEvent.click(screen.getByText('Join Session'));
        fireEvent.click(screen.getByText('Join'));
        expect(screen.getByRole('alert')).toBeTruthy();
    });

    it('should accept name input', () =>
    {
        render(<CollaborationDialogViewPresenter />);
        const input = screen.getByLabelText('Your display name') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'TestUser' } });
        expect(input.value).toBe('TestUser');
    });
});
