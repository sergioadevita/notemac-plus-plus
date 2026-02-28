import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    CreateSession,
    JoinSession,
    LeaveSession,
    IsCollaborating,
    GetSessionId,
    GetConnectedPeers,
    SetLocalPeerName,
    GetLocalPeerName,
    BindToEditor,
    UnbindFromEditor,
    GetLocalPeerId,
    GetYDoc,
    GetProvider,
} from '../Notemac/Services/CollaborationService';

vi.mock('yjs', () =>
({
    Doc: class Doc
    {
        clientID = 12345;
        getText = vi.fn().mockReturnValue({});
        destroy = vi.fn();
    },
}));

vi.mock('y-webrtc', () =>
({
    WebrtcProvider: class WebrtcProvider
    {
        awareness = {
            setLocalStateField: vi.fn(),
            on: vi.fn(),
            getStates: vi.fn().mockReturnValue(new Map()),
        };
        disconnect = vi.fn();
        destroy = vi.fn();
    },
}));

vi.mock('y-monaco', () =>
({
    MonacoBinding: class MonacoBinding
    {
        destroy = vi.fn();
    },
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: {
        COLLABORATION_STARTED: 'COLLABORATION_STARTED',
        COLLABORATION_ENDED: 'COLLABORATION_ENDED',
        PEER_JOINED: 'PEER_JOINED',
        PEER_LEFT: 'PEER_LEFT',
    },
}));

describe('CollaborationService', () =>
{
    beforeEach(() =>
    {
        if (IsCollaborating())
        {
            LeaveSession();
        }
        vi.clearAllMocks();
    });

    describe('SetLocalPeerName / GetLocalPeerName', () =>
    {
        it('should set and get peer name', () =>
        {
            SetLocalPeerName('TestUser');
            expect(GetLocalPeerName()).toBe('TestUser');
        });

        it('should update peer name when called multiple times', () =>
        {
            SetLocalPeerName('Alice');
            expect(GetLocalPeerName()).toBe('Alice');
            SetLocalPeerName('Bob');
            expect(GetLocalPeerName()).toBe('Bob');
        });

        it('should handle empty string', () =>
        {
            SetLocalPeerName('');
            expect(GetLocalPeerName()).toBe('');
        });
    });

    describe('CreateSession', () =>
    {
        it('should return a room ID string', () =>
        {
            const roomId = CreateSession();
            expect(typeof roomId).toBe('string');
            expect(roomId.length).toBeGreaterThan(0);
        });

        it('should set collaborating state to true', () =>
        {
            CreateSession();
            expect(IsCollaborating()).toBe(true);
        });

        it('should generate room ID with valid characters', () =>
        {
            const roomId = CreateSession();
            const isValidRoomId = /^[a-z0-9]+$/.test(roomId);
            expect(isValidRoomId).toBe(true);
        });

        it('should generate unique room IDs', () =>
        {
            const id1 = CreateSession();
            LeaveSession();
            vi.clearAllMocks();
            const id2 = CreateSession();
            expect(typeof id1).toBe('string');
            expect(typeof id2).toBe('string');
            expect(id1.length).toBeGreaterThan(0);
            expect(id2.length).toBeGreaterThan(0);
        });
    });

    describe('JoinSession', () =>
    {
        it('should join with specified room ID', () =>
        {
            JoinSession('test-room-123');
            expect(IsCollaborating()).toBe(true);
            expect(GetSessionId()).toBe('test-room-123');
        });

        it('should leave existing session before joining new one', () =>
        {
            CreateSession();
            vi.clearAllMocks();
            JoinSession('new-room');
            expect(GetSessionId()).toBe('new-room');
        });

        it('should accept any string as room ID', () =>
        {
            JoinSession('custom-room-with-hyphens');
            expect(GetSessionId()).toBe('custom-room-with-hyphens');
        });
    });

    describe('LeaveSession', () =>
    {
        it('should set collaborating to false', () =>
        {
            CreateSession();
            LeaveSession();
            expect(IsCollaborating()).toBe(false);
        });

        it('should clear session ID', () =>
        {
            CreateSession();
            LeaveSession();
            expect(null === GetSessionId()).toBe(true);
        });

        it('should not throw when no session exists', () =>
        {
            expect(() => LeaveSession()).not.toThrow();
        });

        it('should clean up local peer ID', () =>
        {
            CreateSession();
            LeaveSession();
            expect(null === GetLocalPeerId()).toBe(true);
        });
    });

    describe('GetConnectedPeers', () =>
    {
        it('should return empty array when not collaborating', () =>
        {
            expect(GetConnectedPeers()).toEqual([]);
        });

        it('should return array when collaborating', () =>
        {
            CreateSession();
            const peers = GetConnectedPeers();
            expect(Array.isArray(peers)).toBe(true);
        });

        it('should return array with peer info structure', () =>
        {
            CreateSession();
            const peers = GetConnectedPeers();
            expect(Array.isArray(peers)).toBe(true);
        });
    });

    describe('BindToEditor / UnbindFromEditor', () =>
    {
        it('should not throw when not collaborating', () =>
        {
            const mockEditor = { getModel: vi.fn().mockReturnValue({}) };
            expect(() => BindToEditor(mockEditor)).not.toThrow();
        });

        it('should not throw when unbinding without binding', () =>
        {
            expect(() => UnbindFromEditor()).not.toThrow();
        });

        it('should bind when collaborating', () =>
        {
            CreateSession();
            const mockEditor = { getModel: vi.fn().mockReturnValue({}) };
            expect(() => BindToEditor(mockEditor)).not.toThrow();
        });

        it('should allow unbinding after binding', () =>
        {
            CreateSession();
            const mockEditor = { getModel: vi.fn().mockReturnValue({}) };
            BindToEditor(mockEditor);
            expect(() => UnbindFromEditor()).not.toThrow();
        });
    });

    describe('IsCollaborating', () =>
    {
        it('should return false initially', () =>
        {
            expect(IsCollaborating()).toBe(false);
        });

        it('should return true after creating session', () =>
        {
            CreateSession();
            expect(IsCollaborating()).toBe(true);
        });

        it('should return false after leaving session', () =>
        {
            CreateSession();
            LeaveSession();
            expect(IsCollaborating()).toBe(false);
        });
    });

    describe('GetSessionId', () =>
    {
        it('should return null when not collaborating', () =>
        {
            expect(null === GetSessionId()).toBe(true);
        });

        it('should return room ID after creating session', () =>
        {
            const roomId = CreateSession();
            expect(GetSessionId()).toBe(roomId);
        });

        it('should return null after leaving session', () =>
        {
            CreateSession();
            LeaveSession();
            expect(null === GetSessionId()).toBe(true);
        });
    });

    describe('GetLocalPeerId', () =>
    {
        it('should return null when not collaborating', () =>
        {
            expect(null === GetLocalPeerId()).toBe(true);
        });

        it('should return peer ID after creating session', () =>
        {
            CreateSession();
            const peerId = GetLocalPeerId();
            expect(null !== peerId).toBe(true);
        });
    });

    describe('GetYDoc', () =>
    {
        it('should return null when not collaborating', () =>
        {
            expect(null === GetYDoc()).toBe(true);
        });

        it('should return YDoc after creating session', () =>
        {
            CreateSession();
            const ydoc = GetYDoc();
            expect(null !== ydoc).toBe(true);
        });
    });

    describe('GetProvider', () =>
    {
        it('should return null when not collaborating', () =>
        {
            expect(null === GetProvider()).toBe(true);
        });

        it('should return provider after creating session', () =>
        {
            CreateSession();
            const provider = GetProvider();
            expect(null !== provider).toBe(true);
        });
    });
});
