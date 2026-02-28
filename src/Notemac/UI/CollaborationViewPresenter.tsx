import React, { useEffect, useState, useCallback } from 'react';
import { useNotemacStore } from '../Model/Store';
import * as CollaborationController from '../Controllers/CollaborationController';
import type { PeerInfo } from '../Commons/Types';

const CollaborationViewPresenter: React.FC = () =>
{
    const isCollaborating = useNotemacStore((s) => s.isCollaborating);
    const collaborationSession = useNotemacStore((s) => s.collaborationSession);
    const SetIsCollaborating = useNotemacStore((s) => s.SetIsCollaborating);
    const SetCollaborationSession = useNotemacStore((s) => s.SetCollaborationSession);

    const [peers, setPeers] = useState<PeerInfo[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() =>
    {
        CollaborationController.Initialize();

        CollaborationController.SetOnPeersChangedCallback((newPeers: PeerInfo[]) =>
        {
            setPeers(newPeers);
            if (null !== collaborationSession)
            {
                SetCollaborationSession({ ...collaborationSession, peers: newPeers });
            }
        });

        CollaborationController.SetOnSessionStartedCallback((roomId: string) =>
        {
            SetIsCollaborating(true);
            SetCollaborationSession({ roomId, peers: [], isHost: true });
        });

        CollaborationController.SetOnSessionEndedCallback(() =>
        {
            SetIsCollaborating(false);
            SetCollaborationSession(null);
            setPeers([]);
        });

        return () =>
        {
            CollaborationController.Dispose();
            CollaborationController.SetOnPeersChangedCallback(null);
            CollaborationController.SetOnSessionStartedCallback(null);
            CollaborationController.SetOnSessionEndedCallback(null);
        };
    }, []);

    const handleCopyRoomId = useCallback(() =>
    {
        if (null !== collaborationSession)
        {
            navigator.clipboard.writeText(collaborationSession.roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [collaborationSession]);

    const handleLeave = useCallback(() =>
    {
        CollaborationController.EndSession();
    }, []);

    if (!isCollaborating || null === collaborationSession)
    {
        return null;
    }

    return (
        <div
            className="collaboration-indicator"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 8px',
                fontSize: '12px',
            }}
            role="status"
            aria-label="Collaboration session active"
        >
            <span
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    display: 'inline-block',
                }}
                aria-hidden="true"
            />
            <span>Room: {collaborationSession.roomId}</span>
            <button
                onClick={handleCopyRoomId}
                style={{
                    background: 'none',
                    border: '1px solid currentColor',
                    color: 'inherit',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                }}
                aria-label="Copy room ID"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <span aria-label={`${peers.length} peers connected`}>
                {peers.length} peer{1 !== peers.length ? 's' : ''}
            </span>
            {peers.map((peer) => (
                <span
                    key={peer.id}
                    style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: peer.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#fff',
                        fontWeight: 'bold',
                    }}
                    title={peer.name}
                    aria-label={`Peer: ${peer.name}`}
                >
                    {peer.name.charAt(0).toUpperCase()}
                </span>
            ))}
            <button
                onClick={handleLeave}
                style={{
                    background: 'none',
                    border: '1px solid #f44336',
                    color: '#f44336',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                }}
                aria-label="Leave collaboration session"
            >
                Leave
            </button>
        </div>
    );
};

export default React.memo(CollaborationViewPresenter);
