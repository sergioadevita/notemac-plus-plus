import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import type { PeerInfo } from '../Commons/Types';
import { UI_COLLABORATION_COLORS, UI_COLLABORATION_SIGNALING_SERVERS } from '../Commons/Constants';
import { Dispatch } from '../../Shared/EventDispatcher/EventDispatcher';
import { NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';

let ydoc: Y.Doc | null = null;
let provider: WebrtcProvider | null = null;
let binding: MonacoBinding | null = null;
let currentRoomId: string | null = null;
let localPeerId: string | null = null;
let localPeerName: string = 'Anonymous';
let localPeerColor: string = UI_COLLABORATION_COLORS[0];

function GenerateRoomId(): string
{
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++)
    {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function GetPeerColor(index: number): string
{
    return UI_COLLABORATION_COLORS[index % UI_COLLABORATION_COLORS.length];
}

export function SetLocalPeerName(name: string): void
{
    localPeerName = name;
}

export function GetLocalPeerName(): string
{
    return localPeerName;
}

export function CreateSession(): string
{
    if (null !== provider)
    {
        LeaveSession();
    }

    const roomId = GenerateRoomId();
    InitializeSession(roomId);
    return roomId;
}

export function JoinSession(roomId: string): void
{
    if (null !== provider)
    {
        LeaveSession();
    }

    InitializeSession(roomId);
}

function InitializeSession(roomId: string): void
{
    ydoc = new Y.Doc();
    currentRoomId = roomId;
    localPeerId = ydoc.clientID.toString();

    provider = new WebrtcProvider(roomId, ydoc, {
        signaling: UI_COLLABORATION_SIGNALING_SERVERS,
    });

    provider.awareness.setLocalStateField('user', {
        name: localPeerName,
        color: localPeerColor,
    });

    provider.awareness.on('change', () =>
    {
        Dispatch(NOTEMAC_EVENTS.PEER_JOINED, { peers: GetConnectedPeers() });
    });

    Dispatch(NOTEMAC_EVENTS.COLLABORATION_STARTED, { roomId });
}

export function BindToEditor(editor: any): void
{
    if (null === ydoc || null === provider)
    {
        return;
    }

    if (null !== binding)
    {
        binding.destroy();
        binding = null;
    }

    const ytext = ydoc.getText('monaco');
    binding = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
    );
}

export function UnbindFromEditor(): void
{
    if (null !== binding)
    {
        binding.destroy();
        binding = null;
    }
}

export function LeaveSession(): void
{
    const roomId = currentRoomId;

    UnbindFromEditor();

    if (null !== provider)
    {
        provider.disconnect();
        provider.destroy();
        provider = null;
    }

    if (null !== ydoc)
    {
        ydoc.destroy();
        ydoc = null;
    }

    currentRoomId = null;
    localPeerId = null;

    Dispatch(NOTEMAC_EVENTS.COLLABORATION_ENDED, { roomId });
}

export function GetConnectedPeers(): PeerInfo[]
{
    if (null === provider)
    {
        return [];
    }

    const peers: PeerInfo[] = [];
    const states = provider.awareness.getStates();
    let colorIndex = 0;

    states.forEach((state, clientId) =>
    {
        if (null !== state.user)
        {
            peers.push({
                id: clientId.toString(),
                name: state.user.name || 'Anonymous',
                color: state.user.color || GetPeerColor(colorIndex),
                cursor: state.cursor || undefined,
            });
            colorIndex++;
        }
    });

    return peers;
}

export function IsCollaborating(): boolean
{
    return null !== provider && null !== currentRoomId;
}

export function GetSessionId(): string | null
{
    return currentRoomId;
}

export function GetLocalPeerId(): string | null
{
    return localPeerId;
}

export function GetYDoc(): Y.Doc | null
{
    return ydoc;
}

export function GetProvider(): WebrtcProvider | null
{
    return provider;
}
