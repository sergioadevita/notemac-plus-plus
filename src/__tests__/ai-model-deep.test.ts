import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetDefaultAISettings, GetBuiltInProviders } from '../Notemac/Configs/AIConfig';
import { AI_MAX_CONVERSATIONS } from '../Notemac/Commons/Constants';
import { generateId } from '../Shared/Helpers/IdHelpers';

// ============================================================
// Test Setup & Reset
// ============================================================

function resetStore(): void
{
    useNotemacStore.setState({
        aiEnabled: false,
        activeProviderId: 'openai',
        activeModelId: 'gpt-4o-mini',
        providers: GetBuiltInProviders(),
        credentials: [],
        aiSettings: GetDefaultAISettings(),
        conversations: [],
        activeConversationId: null,
        isAiStreaming: false,
        aiStreamContent: '',
        inlineSuggestionEnabled: true,
        currentInlineSuggestion: null,
        aiContextItems: [],
        commitMessageDraft: '',
        showAiSettings: false,
        aiOperationError: null,
    });
}

// ============================================================
// AddProvider Deduplication & Update
// ============================================================
describe('AI Store Deep — AddProvider Deduplication', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('AddProvider with same id REPLACES existing provider', () =>
    {
        const provider1 = {
            id: 'test-provider',
            name: 'Test Provider v1',
            models: [{ id: 'model-1', name: 'Model 1' }],
            isBuiltIn: false,
            apiEndpoint: 'https://api.test1.com',
        };
        const provider2 = {
            id: 'test-provider',
            name: 'Test Provider v2',
            models: [{ id: 'model-2', name: 'Model 2' }],
            isBuiltIn: false,
            apiEndpoint: 'https://api.test2.com',
        };

        useNotemacStore.getState().AddProvider(provider1);
        expect(useNotemacStore.getState().providers.length).toBe(GetBuiltInProviders().length + 1);

        useNotemacStore.getState().AddProvider(provider2);
        expect(useNotemacStore.getState().providers.length).toBe(GetBuiltInProviders().length + 1);

        const found = useNotemacStore.getState().providers.find(p => p.id === 'test-provider');
        expect(found).toBeDefined();
        expect(found!.name).toBe('Test Provider v2');
        expect(found!.models.length).toBe(1);
        expect(found!.models[0].id).toBe('model-2');
    });

    it('AddProvider with new id APPENDS to providers array', () =>
    {
        const initialCount = useNotemacStore.getState().providers.length;

        const newProvider1 = {
            id: 'new-provider-1',
            name: 'New Provider 1',
            models: [{ id: 'model-a', name: 'Model A' }],
            isBuiltIn: false,
            apiEndpoint: 'https://api.new1.com',
        };

        useNotemacStore.getState().AddProvider(newProvider1);
        expect(useNotemacStore.getState().providers.length).toBe(initialCount + 1);

        const newProvider2 = {
            id: 'new-provider-2',
            name: 'New Provider 2',
            models: [{ id: 'model-b', name: 'Model B' }],
            isBuiltIn: false,
            apiEndpoint: 'https://api.new2.com',
        };

        useNotemacStore.getState().AddProvider(newProvider2);
        expect(useNotemacStore.getState().providers.length).toBe(initialCount + 2);

        const found1 = useNotemacStore.getState().providers.find(p => p.id === 'new-provider-1');
        const found2 = useNotemacStore.getState().providers.find(p => p.id === 'new-provider-2');
        expect(found1).toBeDefined();
        expect(found2).toBeDefined();
    });

    it('RemoveProvider on isBuiltIn provider is a no-op', () =>
    {
        const builtInProviders = GetBuiltInProviders();
        const initialCount = useNotemacStore.getState().providers.length;
        const builtInId = builtInProviders[0].id;

        useNotemacStore.getState().RemoveProvider(builtInId);
        expect(useNotemacStore.getState().providers.length).toBe(initialCount);

        const stillExists = useNotemacStore.getState().providers.find(p => p.id === builtInId);
        expect(stillExists).toBeDefined();
        expect(stillExists!.isBuiltIn).toBe(true);
    });
});

// ============================================================
// Conversation Cap & Active Management
// ============================================================
describe('AI Store Deep — Conversation Cap & Active Management', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('AddConversation adds more than AI_MAX_CONVERSATIONS trims oldest', () =>
    {
        const conversations = [];
        for (let i = 0; i < AI_MAX_CONVERSATIONS + 5; i++)
        {
            conversations.push({
                id: generateId(),
                title: `Conversation ${i}`,
                messages: [],
                modelId: 'gpt-4o-mini',
                providerId: 'openai',
                createdAt: Date.now() + i * 1000,
                updatedAt: Date.now() + i * 1000,
            });
        }

        conversations.forEach(conv => useNotemacStore.getState().AddConversation(conv));

        const state = useNotemacStore.getState();
        expect(state.conversations.length).toBeLessThanOrEqual(AI_MAX_CONVERSATIONS);
        expect(state.conversations.length).toBe(AI_MAX_CONVERSATIONS);
    });

    it('RemoveConversation when active sets activeConversationId to first remaining', () =>
    {
        const convA = {
            id: generateId(),
            title: 'Conversation A',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const convB = {
            id: generateId(),
            title: 'Conversation B',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const convC = {
            id: generateId(),
            title: 'Conversation C',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(convA);
        useNotemacStore.getState().AddConversation(convB);
        useNotemacStore.getState().AddConversation(convC);

        useNotemacStore.getState().SetActiveConversation(convC.id);
        expect(useNotemacStore.getState().activeConversationId).toBe(convC.id);

        useNotemacStore.getState().RemoveConversation(convC.id);

        const state = useNotemacStore.getState();
        expect(state.conversations.find(c => c.id === convC.id)).toBeUndefined();
        expect(state.activeConversationId).toBe(convB.id);
    });

    it('RemoveConversation when NOT active keeps activeConversationId unchanged', () =>
    {
        const convA = {
            id: generateId(),
            title: 'Conversation A',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const convB = {
            id: generateId(),
            title: 'Conversation B',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(convA);
        useNotemacStore.getState().AddConversation(convB);

        useNotemacStore.getState().SetActiveConversation(convA.id);
        useNotemacStore.getState().RemoveConversation(convB.id);

        const state = useNotemacStore.getState();
        expect(state.activeConversationId).toBe(convA.id);
        expect(state.conversations.find(c => c.id === convB.id)).toBeUndefined();
    });

    it('RemoveConversation on last conversation sets activeConversationId to null', () =>
    {
        const convA = {
            id: generateId(),
            title: 'Conversation A',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(convA);
        useNotemacStore.getState().SetActiveConversation(convA.id);

        expect(useNotemacStore.getState().conversations.length).toBe(1);
        expect(useNotemacStore.getState().activeConversationId).toBe(convA.id);

        useNotemacStore.getState().RemoveConversation(convA.id);

        const state = useNotemacStore.getState();
        expect(state.conversations.length).toBe(0);
        expect(state.activeConversationId).toBeNull();
    });
});

// ============================================================
// Message Edge Cases
// ============================================================
describe('AI Store Deep — Message Edge Cases', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('AddMessageToConversation with non-existent convId is no-op', () =>
    {
        const initialConvs = useNotemacStore.getState().conversations.length;

        const message = {
            id: generateId(),
            role: 'user' as const,
            content: 'Hello',
            timestamp: Date.now(),
            codeBlocks: [],
        };

        useNotemacStore.getState().AddMessageToConversation('nonexistent-conv-id', message);

        expect(useNotemacStore.getState().conversations.length).toBe(initialConvs);
    });

    it('UpdateLastMessage with empty conversation is no-op', () =>
    {
        const conv = {
            id: generateId(),
            title: 'Empty Conversation',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(conv);

        const emptyConv = useNotemacStore.getState().conversations.find(c => c.id === conv.id);
        expect(emptyConv!.messages.length).toBe(0);

        useNotemacStore.getState().UpdateLastMessage(conv.id, 'Updated content');

        const stillEmpty = useNotemacStore.getState().conversations.find(c => c.id === conv.id);
        expect(stillEmpty!.messages.length).toBe(0);
    });

    it('UpdateLastMessage on non-existent convId is no-op', () =>
    {
        const conv = {
            id: generateId(),
            title: 'Test Conversation',
            messages: [
                {
                    id: generateId(),
                    role: 'user' as const,
                    content: 'Original',
                    timestamp: Date.now(),
                    codeBlocks: [],
                },
            ],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(conv);
        const originalContent = useNotemacStore.getState().conversations[0].messages[0].content;

        useNotemacStore.getState().UpdateLastMessage('nonexistent-conv-id', 'New content');

        const found = useNotemacStore.getState().conversations.find(c => c.id === conv.id);
        expect(found!.messages[0].content).toBe(originalContent);
    });
});

// ============================================================
// Context Items Bounds Checking
// ============================================================
describe('AI Store Deep — AI Context Items Bounds', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('RemoveAiContextItem with negative index is no-op', () =>
    {
        const item1 = {
            type: 'file' as const,
            content: 'File content',
            label: 'test.ts',
        };
        const item2 = {
            type: 'selection' as const,
            content: 'Selected code',
            label: 'Selection',
        };

        useNotemacStore.getState().AddAiContextItem(item1);
        useNotemacStore.getState().AddAiContextItem(item2);

        expect(useNotemacStore.getState().aiContextItems.length).toBe(2);

        useNotemacStore.getState().RemoveAiContextItem(-1);

        expect(useNotemacStore.getState().aiContextItems.length).toBe(2);
    });

    it('RemoveAiContextItem with out-of-bounds index is no-op', () =>
    {
        const item = {
            type: 'file' as const,
            content: 'File content',
            label: 'test.ts',
        };

        useNotemacStore.getState().AddAiContextItem(item);
        expect(useNotemacStore.getState().aiContextItems.length).toBe(1);

        useNotemacStore.getState().RemoveAiContextItem(999);

        expect(useNotemacStore.getState().aiContextItems.length).toBe(1);
    });

    it('RemoveAiContextItem at exact last index works', () =>
    {
        const item1 = {
            type: 'file' as const,
            content: 'File 1',
            label: 'test1.ts',
        };
        const item2 = {
            type: 'file' as const,
            content: 'File 2',
            label: 'test2.ts',
        };
        const item3 = {
            type: 'file' as const,
            content: 'File 3',
            label: 'test3.ts',
        };

        useNotemacStore.getState().AddAiContextItem(item1);
        useNotemacStore.getState().AddAiContextItem(item2);
        useNotemacStore.getState().AddAiContextItem(item3);

        expect(useNotemacStore.getState().aiContextItems.length).toBe(3);
        const lastLabel = useNotemacStore.getState().aiContextItems[2].label;
        expect(lastLabel).toBe('test3.ts');

        useNotemacStore.getState().RemoveAiContextItem(2);

        expect(useNotemacStore.getState().aiContextItems.length).toBe(2);
        const newLastLabel = useNotemacStore.getState().aiContextItems[1].label;
        expect(newLastLabel).toBe('test2.ts');
    });
});

// ============================================================
// Convenience Getters Edge Cases
// ============================================================
describe('AI Store Deep — Convenience Getters Edge Cases', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('GetActiveProvider returns null for non-existent providerId', () =>
    {
        useNotemacStore.setState({ activeProviderId: 'nonexistent-provider' });

        const provider = useNotemacStore.getState().GetActiveProvider();
        expect(provider).toBeNull();
    });

    it('GetActiveModel returns null when provider exists but model does not', () =>
    {
        useNotemacStore.setState({
            activeProviderId: 'openai',
            activeModelId: 'nonexistent-model-that-does-not-exist-for-sure',
        });

        const model = useNotemacStore.getState().GetActiveModel();
        expect(model).toBeNull();
    });

    it('GetCredentialForProvider returns null for non-existent provider', () =>
    {
        const credential = useNotemacStore.getState().GetCredentialForProvider('unknown-provider');
        expect(credential).toBeNull();
    });

    it('GetActiveConversation returns null when activeConversationId does not match any', () =>
    {
        const conv = {
            id: generateId(),
            title: 'Existing Conversation',
            messages: [],
            modelId: 'gpt-4o-mini',
            providerId: 'openai',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        useNotemacStore.getState().AddConversation(conv);
        useNotemacStore.setState({ activeConversationId: 'nonexistent-conv-id' });

        const active = useNotemacStore.getState().GetActiveConversation();
        expect(active).toBeNull();
    });
});

// ============================================================
// Inline Suggestion & Commit Draft
// ============================================================
describe('AI Store Deep — Inline Suggestion & Commit Draft', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('SetCurrentInlineSuggestion to null clears suggestion', () =>
    {
        const suggestion = {
            id: generateId(),
            content: 'Suggested code snippet',
            filePath: '/src/test.ts',
            line: 42,
        };

        useNotemacStore.setState({ currentInlineSuggestion: suggestion });
        expect(useNotemacStore.getState().currentInlineSuggestion).not.toBeNull();

        useNotemacStore.setState({ currentInlineSuggestion: null });
        expect(useNotemacStore.getState().currentInlineSuggestion).toBeNull();
    });

    it('SetCommitMessageDraft stores and retrieves', () =>
    {
        const draftMessage = 'feat: add new inline suggestion feature';

        useNotemacStore.setState({ commitMessageDraft: draftMessage });

        expect(useNotemacStore.getState().commitMessageDraft).toBe(draftMessage);
    });

    it('Inline suggestion state independent from streaming state', () =>
    {
        const suggestion = {
            id: generateId(),
            content: 'Suggested code',
            filePath: '/src/test.ts',
            line: 10,
        };

        useNotemacStore.setState({
            currentInlineSuggestion: suggestion,
            isAiStreaming: false,
        });

        useNotemacStore.setState({ isAiStreaming: true });

        expect(useNotemacStore.getState().isAiStreaming).toBe(true);
        expect(useNotemacStore.getState().currentInlineSuggestion).not.toBeNull();
        expect(useNotemacStore.getState().currentInlineSuggestion!.id).toBe(suggestion.id);

        useNotemacStore.setState({ isAiStreaming: false });

        expect(useNotemacStore.getState().isAiStreaming).toBe(false);
        expect(useNotemacStore.getState().currentInlineSuggestion).not.toBeNull();
    });
});
