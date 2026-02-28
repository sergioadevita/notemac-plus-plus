import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    Initialize,
    Dispose,
    StartSession,
    JoinSession,
    EndSession,
    GetSessionId,
    GetPeers,
    IsActive,
    BindEditor,
    UnbindEditor,
    SetOnPeersChangedCallback,
    SetOnSessionStartedCallback,
    SetOnSessionEndedCallback,
} from '../Notemac/Controllers/CollaborationController';

vi.mock('../Notemac/Services/CollaborationService', () => ({
    CreateSession: vi.fn().mockReturnValue('mock-room-id'),
    JoinSession: vi.fn(),
    LeaveSession: vi.fn(),
    IsCollaborating: vi.fn().mockReturnValue(false),
    GetSessionId: vi.fn().mockReturnValue(null),
    GetConnectedPeers: vi.fn().mockReturnValue([]),
    SetLocalPeerName: vi.fn(),
    BindToEditor: vi.fn(),
    UnbindFromEditor: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
    Subscribe: vi.fn(),
    Unsubscribe: vi.fn(),
    NOTEMAC_EVENTS: {
        PEER_JOINED: 'PEER_JOINED',
        PEER_LEFT: 'PEER_LEFT',
        COLLABORATION_STARTED: 'COLLABORATION_STARTED',
        COLLABORATION_ENDED: 'COLLABORATION_ENDED',
    },
}));

import * as CollaborationService from '../Notemac/Services/CollaborationService';
import { Subscribe, Unsubscribe } from '../Shared/EventDispatcher/EventDispatcher';

describe('CollaborationController', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('Initialize / Dispose', () =>
    {
        it('should subscribe to collaboration events on initialize', () =>
        {
            Initialize();
            expect(Subscribe).toHaveBeenCalledTimes(4);
        });

        it('should unsubscribe from collaboration events on dispose', () =>
        {
            Initialize();
            vi.clearAllMocks();
            Dispose();
            expect(Unsubscribe).toHaveBeenCalledTimes(4);
        });

        it('should subscribe to PEER_JOINED event', () =>
        {
            Initialize();
            const calls = (Subscribe as any).mock.calls;
            const hasEvent = calls.some((call: any[]) => 'PEER_JOINED' === call[0]);
            expect(hasEvent).toBe(true);
        });

        it('should subscribe to COLLABORATION_STARTED event', () =>
        {
            Initialize();
            const calls = (Subscribe as any).mock.calls;
            const hasEvent = calls.some((call: any[]) => 'COLLABORATION_STARTED' === call[0]);
            expect(hasEvent).toBe(true);
        });
    });

    describe('StartSession', () =>
    {
        it('should call service CreateSession and return room ID', () =>
        {
            const roomId = StartSession();
            expect(roomId).toBe('mock-room-id');
            expect(CollaborationService.CreateSession).toHaveBeenCalled();
        });

        it('should set peer name if provided', () =>
        {
            StartSession('TestUser');
            expect(CollaborationService.SetLocalPeerName).toHaveBeenCalledWith('TestUser');
        });

        it('should not set peer name if not provided', () =>
        {
            StartSession();
            expect(CollaborationService.SetLocalPeerName).not.toHaveBeenCalled();
        });

        it('should return string room ID', () =>
        {
            const roomId = StartSession();
            expect(typeof roomId).toBe('string');
        });
    });

    describe('JoinSession', () =>
    {
        it('should call service JoinSession with room ID', () =>
        {
            JoinSession('room-123');
            expect(CollaborationService.JoinSession).toHaveBeenCalledWith('room-123');
        });

        it('should set peer name if provided', () =>
        {
            JoinSession('room-123', 'Alice');
            expect(CollaborationService.SetLocalPeerName).toHaveBeenCalledWith('Alice');
        });

        it('should not set peer name if not provided', () =>
        {
            JoinSession('room-123');
            const callsWithName = (CollaborationService.SetLocalPeerName as any).mock.calls.length;
            expect(callsWithName).toBe(0);
        });

        it('should accept room ID without peer name', () =>
        {
            expect(() => JoinSession('test-room')).not.toThrow();
        });
    });

    describe('EndSession', () =>
    {
        it('should call service LeaveSession', () =>
        {
            EndSession();
            expect(CollaborationService.LeaveSession).toHaveBeenCalled();
        });

        it('should not throw', () =>
        {
            expect(() => EndSession()).not.toThrow();
        });
    });

    describe('BindEditor / UnbindEditor', () =>
    {
        it('should call service BindToEditor', () =>
        {
            const mockEditor = {};
            BindEditor(mockEditor);
            expect(CollaborationService.BindToEditor).toHaveBeenCalledWith(mockEditor);
        });

        it('should call service UnbindFromEditor', () =>
        {
            UnbindEditor();
            expect(CollaborationService.UnbindFromEditor).toHaveBeenCalled();
        });

        it('should handle null editor', () =>
        {
            expect(() => BindEditor(null)).not.toThrow();
        });

        it('should allow multiple binds and unbinds', () =>
        {
            const mockEditor = {};
            BindEditor(mockEditor);
            UnbindEditor();
            BindEditor(mockEditor);
            expect(CollaborationService.BindToEditor).toHaveBeenCalledTimes(2);
        });
    });

    describe('GetSessionId', () =>
    {
        it('should return session ID from service', () =>
        {
            (CollaborationService.GetSessionId as any).mockReturnValue('room-abc');
            expect(GetSessionId()).toBe('room-abc');
        });

        it('should return null when no session', () =>
        {
            (CollaborationService.GetSessionId as any).mockReturnValue(null);
            expect(null === GetSessionId()).toBe(true);
        });

        it('should return what service returns', () =>
        {
            const expected = 'test-room-xyz';
            (CollaborationService.GetSessionId as any).mockReturnValue(expected);
            const result = GetSessionId();
            expect(result).toBe(expected);
        });
    });

    describe('GetPeers', () =>
    {
        it('should return peers from service', () =>
        {
            const mockPeers = [{ id: '1', name: 'Alice', color: '#ff0000' }];
            (CollaborationService.GetConnectedPeers as any).mockReturnValue(mockPeers);
            expect(GetPeers()).toEqual(mockPeers);
        });

        it('should return empty array when no peers', () =>
        {
            (CollaborationService.GetConnectedPeers as any).mockReturnValue([]);
            expect(GetPeers()).toEqual([]);
        });

        it('should return array', () =>
        {
            (CollaborationService.GetConnectedPeers as any).mockReturnValue([]);
            const result = GetPeers();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('IsActive', () =>
    {
        it('should return collaborating state from service', () =>
        {
            (CollaborationService.IsCollaborating as any).mockReturnValue(true);
            expect(IsActive()).toBe(true);
        });

        it('should return false when not collaborating', () =>
        {
            (CollaborationService.IsCollaborating as any).mockReturnValue(false);
            expect(IsActive()).toBe(false);
        });

        it('should reflect service state changes', () =>
        {
            (CollaborationService.IsCollaborating as any).mockReturnValue(true);
            expect(IsActive()).toBe(true);
            (CollaborationService.IsCollaborating as any).mockReturnValue(false);
            expect(IsActive()).toBe(false);
        });
    });

    describe('Callback setters', () =>
    {
        it('should accept peer change callback', () =>
        {
            const callback = vi.fn();
            expect(() => SetOnPeersChangedCallback(callback)).not.toThrow();
        });

        it('should accept session started callback', () =>
        {
            const callback = vi.fn();
            expect(() => SetOnSessionStartedCallback(callback)).not.toThrow();
        });

        it('should accept session ended callback', () =>
        {
            const callback = vi.fn();
            expect(() => SetOnSessionEndedCallback(callback)).not.toThrow();
        });

        it('should accept null peer callback', () =>
        {
            expect(() => SetOnPeersChangedCallback(null)).not.toThrow();
        });

        it('should accept null session started callback', () =>
        {
            expect(() => SetOnSessionStartedCallback(null)).not.toThrow();
        });

        it('should accept null session ended callback', () =>
        {
            expect(() => SetOnSessionEndedCallback(null)).not.toThrow();
        });

        it('should allow setting multiple callbacks in sequence', () =>
        {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            expect(() => {
                SetOnPeersChangedCallback(cb1);
                SetOnPeersChangedCallback(cb2);
            }).not.toThrow();
        });
    });
});
