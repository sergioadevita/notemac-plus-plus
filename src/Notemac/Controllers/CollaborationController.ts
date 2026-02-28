import * as CollaborationService from '../Services/CollaborationService';
import type { PeerInfo } from '../Commons/Types';
import { Subscribe, Unsubscribe, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

let onPeersChangedCallback: ((peers: PeerInfo[]) => void) | null = null;
let onSessionStartedCallback: ((roomId: string) => void) | null = null;
let onSessionEndedCallback: (() => void) | null = null;

export function Initialize(): void
{
    Subscribe(NOTEMAC_EVENTS.PEER_JOINED, HandlePeersChanged);
    Subscribe(NOTEMAC_EVENTS.PEER_LEFT, HandlePeersChanged);
    Subscribe(NOTEMAC_EVENTS.COLLABORATION_STARTED, HandleSessionStarted);
    Subscribe(NOTEMAC_EVENTS.COLLABORATION_ENDED, HandleSessionEnded);
}

export function Dispose(): void
{
    Unsubscribe(NOTEMAC_EVENTS.PEER_JOINED, HandlePeersChanged);
    Unsubscribe(NOTEMAC_EVENTS.PEER_LEFT, HandlePeersChanged);
    Unsubscribe(NOTEMAC_EVENTS.COLLABORATION_STARTED, HandleSessionStarted);
    Unsubscribe(NOTEMAC_EVENTS.COLLABORATION_ENDED, HandleSessionEnded);
}

function HandlePeersChanged(data: { peers: PeerInfo[] }): void
{
    if (null !== onPeersChangedCallback)
    {
        onPeersChangedCallback(data.peers);
    }
}

function HandleSessionStarted(data: { roomId: string }): void
{
    if (null !== onSessionStartedCallback)
    {
        onSessionStartedCallback(data.roomId);
    }
}

function HandleSessionEnded(): void
{
    if (null !== onSessionEndedCallback)
    {
        onSessionEndedCallback();
    }
}

export function SetOnPeersChangedCallback(callback: ((peers: PeerInfo[]) => void) | null): void
{
    onPeersChangedCallback = callback;
}

export function SetOnSessionStartedCallback(callback: ((roomId: string) => void) | null): void
{
    onSessionStartedCallback = callback;
}

export function SetOnSessionEndedCallback(callback: (() => void) | null): void
{
    onSessionEndedCallback = callback;
}

export function StartSession(peerName?: string): string
{
    if (undefined !== peerName)
    {
        CollaborationService.SetLocalPeerName(peerName);
    }

    return CollaborationService.CreateSession();
}

export function JoinSession(roomId: string, peerName?: string): void
{
    if (undefined !== peerName)
    {
        CollaborationService.SetLocalPeerName(peerName);
    }

    CollaborationService.JoinSession(roomId);
}

export function EndSession(): void
{
    CollaborationService.LeaveSession();
}

export function BindEditor(editor: any): void
{
    CollaborationService.BindToEditor(editor);
}

export function UnbindEditor(): void
{
    CollaborationService.UnbindFromEditor();
}

export function GetSessionId(): string | null
{
    return CollaborationService.GetSessionId();
}

export function GetPeers(): PeerInfo[]
{
    return CollaborationService.GetConnectedPeers();
}

export function IsActive(): boolean
{
    return CollaborationService.IsCollaborating();
}
