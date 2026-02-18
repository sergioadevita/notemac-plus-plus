import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { AI_MAX_CONVERSATIONS } from '../Notemac/Commons/Constants';
import { generateId } from '../Shared/Helpers/IdHelpers';

// ============================================================
// AI Store Slice — State Initialization
// ============================================================
describe('AI Store Slice — Initialization', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({
            aiEnabled: false,
            isAiStreaming: false,
            activeProviderId: 'openai',
            activeModelId: 'gpt-4o',
            showAiSettings: false,
            conversations: [],
            activeConversationId: null,
            credentials: [],
        });
    });

    it('has AI disabled by default', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.aiEnabled).toBe(false);
    });

    it('has streaming flag off by default', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.isAiStreaming).toBe(false);
    });

    it('has default provider and model set', () =>
    {
        const state = useNotemacStore.getState();
        expect(0 < state.activeProviderId.length).toBe(true);
        expect(0 < state.activeModelId.length).toBe(true);
    });
});

// ============================================================
// AI Store Slice — Provider Management
// ============================================================
describe('AI Store Slice — Provider Management', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({
            activeProviderId: 'openai',
            activeModelId: 'gpt-4o',
        });
    });

    it('SetActiveProvider changes provider', () =>
    {
        useNotemacStore.getState().SetActiveProvider('anthropic');
        expect(useNotemacStore.getState().activeProviderId).toBe('anthropic');
    });

    it('SetActiveModel changes model', () =>
    {
        useNotemacStore.getState().SetActiveModel('gpt-4o-mini');
        expect(useNotemacStore.getState().activeModelId).toBe('gpt-4o-mini');
    });

    it('GetActiveProvider returns provider object', () =>
    {
        useNotemacStore.setState({ activeProviderId: 'openai' });
        const provider = useNotemacStore.getState().GetActiveProvider();
        if (null !== provider)
        {
            expect(provider.id).toBe('openai');
            expect(provider.name).toBe('OpenAI');
        }
    });
});

// ============================================================
// AI Store Slice — Streaming State
// ============================================================
describe('AI Store Slice — Streaming State', () =>
{
    it('SetIsAiStreaming toggles streaming', () =>
    {
        useNotemacStore.getState().SetIsAiStreaming(true);
        expect(useNotemacStore.getState().isAiStreaming).toBe(true);

        useNotemacStore.getState().SetIsAiStreaming(false);
        expect(useNotemacStore.getState().isAiStreaming).toBe(false);
    });
});

// ============================================================
// AI Store Slice — Conversations
// ============================================================
describe('AI Store Slice — Conversations', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({
            conversations: [],
            activeConversationId: null,
        });
    });

    it('AddConversation adds a new conversation', () =>
    {
        const conv = { id: generateId(), title: 'Test Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);
        const state = useNotemacStore.getState();
        expect(1 === state.conversations.length).toBe(true);
        expect(state.conversations[0].title).toBe('Test Chat');
        expect(state.activeConversationId).toBe(conv.id);
    });

    it('AddConversation caps at max conversations', () =>
    {
        for (let i = 0; i < AI_MAX_CONVERSATIONS + 5; i++)
        {
            const conv = { id: generateId(), title: `Chat ${i}`, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
            useNotemacStore.getState().AddConversation(conv);
        }
        const state = useNotemacStore.getState();
        expect(state.conversations.length <= AI_MAX_CONVERSATIONS).toBe(true);
    });

    it('RemoveConversation removes conversation', () =>
    {
        const conv = { id: generateId(), title: 'To Delete', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);

        useNotemacStore.getState().RemoveConversation(conv.id);
        expect(0 === useNotemacStore.getState().conversations.length).toBe(true);
    });

    it('AddMessageToConversation adds message', () =>
    {
        const conv = { id: generateId(), title: 'Msg Test', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);

        useNotemacStore.getState().AddMessageToConversation(conv.id, {
            id: 'msg-1',
            role: 'user',
            content: 'Hello AI',
            timestamp: Date.now(),
        });

        const updated = useNotemacStore.getState().conversations.find(c => c.id === conv.id);
        expect(updated).toBeDefined();
        expect(1 === updated!.messages.length).toBe(true);
        expect(updated!.messages[0].content).toBe('Hello AI');
    });

    it('SetActiveConversation changes active conversation', () =>
    {
        const convA = { id: generateId(), title: 'Chat A', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        const convB = { id: generateId(), title: 'Chat B', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(convA);
        useNotemacStore.getState().AddConversation(convB);

        useNotemacStore.getState().SetActiveConversation(convA.id);
        expect(useNotemacStore.getState().activeConversationId).toBe(convA.id);
    });

    it('GetActiveConversation returns correct conversation', () =>
    {
        const conv = { id: generateId(), title: 'Active', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);
        const active = useNotemacStore.getState().GetActiveConversation();
        expect(active).toBeDefined();
        expect(active!.title).toBe('Active');
    });

    it('GetActiveConversation returns null when no active', () =>
    {
        useNotemacStore.setState({ activeConversationId: null });
        const active = useNotemacStore.getState().GetActiveConversation();
        expect(null === active).toBe(true);
    });
});

// ============================================================
// AI Store Slice — Settings Dialog
// ============================================================
describe('AI Store Slice — AI Settings Dialog', () =>
{
    it('SetShowAiSettings toggles dialog visibility', () =>
    {
        useNotemacStore.getState().SetShowAiSettings(true);
        expect(useNotemacStore.getState().showAiSettings).toBe(true);

        useNotemacStore.getState().SetShowAiSettings(false);
        expect(useNotemacStore.getState().showAiSettings).toBe(false);
    });
});

// ============================================================
// AI Store Slice — Credential Management
// ============================================================
describe('AI Store Slice — Credentials', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({ credentials: [] });
    });

    it('SetCredentialForProvider adds a credential', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-test-123', false);
        const cred = useNotemacStore.getState().GetCredentialForProvider('openai');
        expect(cred).toBeDefined();
        expect(cred!.apiKey).toBe('sk-test-123');
        expect(cred!.providerId).toBe('openai');
    });

    it('SetCredentialForProvider updates existing credential', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-old', false);
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-new', false);
        const cred = useNotemacStore.getState().GetCredentialForProvider('openai');
        expect(cred!.apiKey).toBe('sk-new');
    });

    it('GetCredentialForProvider returns null for unknown provider', () =>
    {
        const cred = useNotemacStore.getState().GetCredentialForProvider('nonexistent');
        expect(null === cred).toBe(true);
    });

    it('RemoveCredentialForProvider removes credential', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('anthropic', 'sk-ant-test', false);
        expect(useNotemacStore.getState().GetCredentialForProvider('anthropic')).not.toBeNull();

        useNotemacStore.getState().RemoveCredentialForProvider('anthropic');
        const cred = useNotemacStore.getState().GetCredentialForProvider('anthropic');
        expect(null === cred).toBe(true);
    });
});
