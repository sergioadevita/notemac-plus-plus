import React, { useState, useCallback } from 'react';
import { useNotemacStore } from '../Model/Store';
import * as CollaborationController from '../Controllers/CollaborationController';

const CollaborationDialogViewPresenter: React.FC = () =>
{
    const showCollaborationDialog = useNotemacStore((s) => s.showCollaborationDialog);
    const setShowCollaborationDialog = useNotemacStore((s) => s.setShowCollaborationDialog);
    const SetIsCollaborating = useNotemacStore((s) => s.SetIsCollaborating);
    const SetCollaborationSession = useNotemacStore((s) => s.SetCollaborationSession);

    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [peerName, setPeerName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = useCallback(() =>
    {
        const name = peerName.trim() || 'Anonymous';
        const roomId = CollaborationController.StartSession(name);
        SetIsCollaborating(true);
        SetCollaborationSession({ roomId, peers: [], isHost: true });
        setShowCollaborationDialog(false);
        setError('');
    }, [peerName, SetIsCollaborating, SetCollaborationSession, setShowCollaborationDialog]);

    const handleJoin = useCallback(() =>
    {
        const trimmedId = roomIdInput.trim();
        if (0 === trimmedId.length)
        {
            setError('Please enter a room ID');
            return;
        }

        const name = peerName.trim() || 'Anonymous';
        CollaborationController.JoinSession(trimmedId, name);
        SetIsCollaborating(true);
        SetCollaborationSession({ roomId: trimmedId, peers: [], isHost: false });
        setShowCollaborationDialog(false);
        setError('');
    }, [roomIdInput, peerName, SetIsCollaborating, SetCollaborationSession, setShowCollaborationDialog]);

    const handleClose = useCallback(() =>
    {
        setShowCollaborationDialog(false);
        setError('');
        setRoomIdInput('');
    }, [setShowCollaborationDialog]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('Escape' === e.key)
        {
            handleClose();
        }
        else if ('Enter' === e.key)
        {
            if ('create' === mode)
            {
                handleCreate();
            }
            else
            {
                handleJoin();
            }
        }
    }, [handleClose, handleCreate, handleJoin, mode]);

    if (!showCollaborationDialog)
    {
        return null;
    }

    return (
        <div
            className="dialog-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Collaboration session"
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-primary, #1e1e1e)',
                    color: 'var(--text-primary, #cccccc)',
                    borderRadius: '8px',
                    padding: '24px',
                    width: '400px',
                    maxWidth: '90vw',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                    Collaborative Editing
                </h2>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        onClick={() => setMode('create')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid',
                            borderColor: 'create' === mode ? '#007acc' : '#555',
                            backgroundColor: 'create' === mode ? '#007acc' : 'transparent',
                            color: 'inherit',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        aria-pressed={'create' === mode}
                    >
                        Create Session
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid',
                            borderColor: 'join' === mode ? '#007acc' : '#555',
                            backgroundColor: 'join' === mode ? '#007acc' : 'transparent',
                            color: 'inherit',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        aria-pressed={'join' === mode}
                    >
                        Join Session
                    </button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={peerName}
                        onChange={(e) => setPeerName(e.target.value)}
                        placeholder="Anonymous"
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-secondary, #2d2d2d)',
                            color: 'inherit',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                        }}
                        aria-label="Your display name"
                    />
                </div>

                {'join' === mode && (
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                            Room ID
                        </label>
                        <input
                            type="text"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value)}
                            placeholder="Enter room ID"
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-secondary, #2d2d2d)',
                                color: 'inherit',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                            }}
                            aria-label="Room ID to join"
                            autoFocus
                        />
                    </div>
                )}

                {'' !== error && (
                    <div style={{ color: '#f44336', fontSize: '12px', marginBottom: '12px' }} role="alert">
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '6px 16px',
                            border: '1px solid #555',
                            backgroundColor: 'transparent',
                            color: 'inherit',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={'create' === mode ? handleCreate : handleJoin}
                        style={{
                            padding: '6px 16px',
                            border: 'none',
                            backgroundColor: '#007acc',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        {'create' === mode ? 'Create' : 'Join'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CollaborationDialogViewPresenter);
