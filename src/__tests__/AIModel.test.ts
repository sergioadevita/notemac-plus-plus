import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../../Shared/Persistence/PersistenceService', () => ({
    GetValue: vi.fn(() => null),
    SetValue: vi.fn(),
    RemoveValue: vi.fn(),
}));

vi.mock('../../Shared/Persistence/CredentialStorageService', () => ({
    StoreSecureValue: vi.fn(),
    RetrieveSecureValue: vi.fn(() => Promise.resolve(null)),
    RemoveSecureValue: vi.fn(),
}));

vi.mock('../Controllers/LLMController', () => ({
    FetchModelsForProvider: vi.fn(() => Promise.resolve([
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, supportsStreaming: true, supportsFIM: true },
    ])),
}));

vi.mock('../Configs/AIConfig', () => ({
    GetDefaultAISettings: () => ({
        enableAutoSave: true,
        enableInlineCompletion: true,
    }),
    GetBuiltInProviders: () => [
        {
            id: 'openai',
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com',
            isBuiltIn: true,
            models: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
            ],
        },
    ],
}));

function resetStore(): void {
    useNotemacStore.setState({
        aiEnabled: false,
        activeProviderId: 'openai',
        activeModelId: 'gpt-4o-mini',
        providers: [
            {
                id: 'openai',
                name: 'OpenAI',
                baseUrl: 'https://api.openai.com',
                isBuiltIn: true,
                models: [
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
                ],
            },
        ],
        credentials: [],
        aiSettings: { enableAutoSave: true, enableInlineCompletion: true },
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
        isRefreshingModels: false,
    });
}

describe('AIModel — SetAiEnabled', () => {
    beforeEach(() => resetStore());

    it('enables AI', () => {
        const store = useNotemacStore.getState();
        store.SetAiEnabled(true);
        expect(useNotemacStore.getState().aiEnabled).toBe(true);
    });

    it('disables AI', () => {
        const store = useNotemacStore.getState();
        store.SetAiEnabled(true);
        store.SetAiEnabled(false);
        expect(useNotemacStore.getState().aiEnabled).toBe(false);
    });
});

describe('AIModel — SetActiveProvider', () => {
    beforeEach(() => resetStore());

    it('sets active provider', () => {
        const store = useNotemacStore.getState();
        store.SetActiveProvider('openai');
        expect(useNotemacStore.getState().activeProviderId).toBe('openai');
    });
});

describe('AIModel — SetActiveModel', () => {
    beforeEach(() => resetStore());

    it('sets active model', () => {
        const store = useNotemacStore.getState();
        store.SetActiveModel('gpt-4o-mini');
        expect(useNotemacStore.getState().activeModelId).toBe('gpt-4o-mini');
    });
});

describe('AIModel — SetProviders', () => {
    beforeEach(() => resetStore());

    it('sets providers list', () => {
        const store = useNotemacStore.getState();
        const providers = [
            {
                id: 'custom',
                name: 'Custom Provider',
                baseUrl: 'https://custom.api',
                isBuiltIn: false,
                models: [],
            },
        ];
        store.SetProviders(providers);
        expect(useNotemacStore.getState().providers.length).toBe(1);
    });
});

describe('AIModel — AddProvider', () => {
    beforeEach(() => resetStore());

    it('adds new provider', () => {
        const store = useNotemacStore.getState();
        const provider = {
            id: 'anthropic',
            name: 'Anthropic',
            baseUrl: 'https://api.anthropic.com',
            isBuiltIn: false,
            models: [],
        };
        store.AddProvider(provider);
        const state = useNotemacStore.getState();

        expect(state.providers.length).toBeGreaterThan(1);
        expect(state.providers.find(p => p.id === 'anthropic')).toBeDefined();
    });

    it('updates existing provider with same id', () => {
        const store = useNotemacStore.getState();
        const originalCount = useNotemacStore.getState().providers.length;
        const provider = {
            id: 'openai',
            name: 'OpenAI Updated',
            baseUrl: 'https://api.openai.com',
            isBuiltIn: true,
            models: [
                { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192, supportsStreaming: true, supportsFIM: false },
            ],
        };
        store.AddProvider(provider);
        const state = useNotemacStore.getState();

        expect(state.providers.length).toBe(originalCount);
        expect(state.providers.find(p => p.id === 'openai')?.name).toBe('OpenAI Updated');
    });
});

describe('AIModel — RemoveProvider', () => {
    beforeEach(() => resetStore());

    it('removes custom provider', () => {
        const store = useNotemacStore.getState();
        store.AddProvider({
            id: 'custom',
            name: 'Custom',
            baseUrl: 'https://custom.api',
            isBuiltIn: false,
            models: [],
        });
        const state = useNotemacStore.getState();
        const customId = state.providers.find(p => !p.isBuiltIn)?.id;

        if (customId) {
            store.RemoveProvider(customId);
            expect(useNotemacStore.getState().providers.find(p => p.id === customId)).toBeUndefined();
        }
    });

    it('does not remove built-in provider', () => {
        const store = useNotemacStore.getState();
        const originalCount = useNotemacStore.getState().providers.length;
        store.RemoveProvider('openai');
        expect(useNotemacStore.getState().providers.length).toBe(originalCount);
    });
});

describe('AIModel — SetCredentialForProvider', () => {
    beforeEach(() => resetStore());

    it('adds credential for provider', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'sk-test123', false);
        const state = useNotemacStore.getState();

        expect(state.credentials.length).toBe(1);
        expect(state.credentials[0].providerId).toBe('openai');
    });

    it('updates existing credential', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'key1', false);
        store.SetCredentialForProvider('openai', 'key2', false);
        expect(useNotemacStore.getState().credentials.length).toBe(1);
    });

    it('sets rememberKey flag', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'sk-test123', true);
        const cred = useNotemacStore.getState().credentials[0];

        expect(cred.rememberKey).toBe(true);
    });
});

describe('AIModel — RemoveCredentialForProvider', () => {
    beforeEach(() => resetStore());

    it('removes credential', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'sk-test123', false);
        store.RemoveCredentialForProvider('openai');
        expect(useNotemacStore.getState().credentials.length).toBe(0);
    });

    it('does nothing for non-existent provider', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'sk-test123', false);
        store.RemoveCredentialForProvider('anthropic');
        expect(useNotemacStore.getState().credentials.length).toBe(1);
    });
});

describe('AIModel — UpdateAISettings', () => {
    beforeEach(() => resetStore());

    it('updates AI settings', () => {
        const store = useNotemacStore.getState();
        store.UpdateAISettings({ enableAutoSave: false });
        expect(useNotemacStore.getState().aiSettings.enableAutoSave).toBe(false);
    });
});

describe('AIModel — AddConversation', () => {
    beforeEach(() => resetStore());

    it('adds conversation', () => {
        const store = useNotemacStore.getState();
        const conv = {
            id: 'conv-1',
            title: 'Test Conversation',
            messages: [],
            createdAt: Date.now(),
        };
        store.AddConversation(conv);
        const state = useNotemacStore.getState();

        expect(state.conversations.length).toBe(1);
        expect(state.activeConversationId).toBe('conv-1');
    });

    it('caps conversations at maximum', () => {
        const store = useNotemacStore.getState();
        for (let i = 0; i < 150; i++) {
            store.AddConversation({
                id: `conv-${i}`,
                title: `Conv ${i}`,
                messages: [],
                createdAt: Date.now(),
            });
        }
        const state = useNotemacStore.getState();
        expect(state.conversations.length).toBeLessThanOrEqual(100);
    });
});

describe('AIModel — RemoveConversation', () => {
    beforeEach(() => resetStore());

    it('removes conversation', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test', messages: [], createdAt: Date.now() });
        store.RemoveConversation('conv-1');
        expect(useNotemacStore.getState().conversations.length).toBe(0);
    });

    it('updates activeConversationId if removed', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test1', messages: [], createdAt: Date.now() });
        store.AddConversation({ id: 'conv-2', title: 'Test2', messages: [], createdAt: Date.now() });
        store.RemoveConversation('conv-2');
        expect(useNotemacStore.getState().activeConversationId).toBe('conv-1');
    });
});

describe('AIModel — SetActiveConversation', () => {
    beforeEach(() => resetStore());

    it('sets active conversation', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test', messages: [], createdAt: Date.now() });
        store.SetActiveConversation('conv-1');
        expect(useNotemacStore.getState().activeConversationId).toBe('conv-1');
    });
});

describe('AIModel — AddMessageToConversation', () => {
    beforeEach(() => resetStore());

    it('adds message to conversation', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test', messages: [], createdAt: Date.now() });
        store.AddMessageToConversation('conv-1', {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: Date.now(),
        });
        const conv = useNotemacStore.getState().conversations[0];

        expect(conv.messages.length).toBe(1);
        expect(conv.messages[0].content).toBe('Hello');
    });

    it('does nothing for non-existent conversation', () => {
        const store = useNotemacStore.getState();
        store.AddMessageToConversation('nonexistent', {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: Date.now(),
        });
        expect(useNotemacStore.getState().conversations.length).toBe(0);
    });
});

describe('AIModel — UpdateLastMessage', () => {
    beforeEach(() => resetStore());

    it('updates last message content', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test', messages: [], createdAt: Date.now() });
        store.AddMessageToConversation('conv-1', {
            id: 'msg-1',
            role: 'assistant',
            content: 'Original',
            timestamp: Date.now(),
        });
        store.UpdateLastMessage('conv-1', 'Updated');
        const conv = useNotemacStore.getState().conversations[0];

        expect(conv.messages[0].content).toBe('Updated');
    });
});

describe('AIModel — SetIsAiStreaming', () => {
    beforeEach(() => resetStore());

    it('sets streaming flag', () => {
        const store = useNotemacStore.getState();
        store.SetIsAiStreaming(true);
        expect(useNotemacStore.getState().isAiStreaming).toBe(true);
    });
});

describe('AIModel — SetInlineSuggestionEnabled', () => {
    beforeEach(() => resetStore());

    it('enables inline suggestions', () => {
        const store = useNotemacStore.getState();
        store.SetInlineSuggestionEnabled(false);
        expect(useNotemacStore.getState().inlineSuggestionEnabled).toBe(false);
    });
});

describe('AIModel — AddAiContextItem', () => {
    beforeEach(() => resetStore());

    it('adds context item', () => {
        const store = useNotemacStore.getState();
        store.AddAiContextItem({
            id: 'ctx-1',
            type: 'file',
            path: '/file.ts',
            language: 'typescript',
            content: 'code here',
            timestamp: Date.now(),
        });
        expect(useNotemacStore.getState().aiContextItems.length).toBe(1);
    });
});

describe('AIModel — RemoveAiContextItem', () => {
    beforeEach(() => resetStore());

    it('removes context item by index', () => {
        const store = useNotemacStore.getState();
        store.AddAiContextItem({
            id: 'ctx-1',
            type: 'file',
            path: '/file.ts',
            language: 'typescript',
            content: 'code',
            timestamp: Date.now(),
        });
        store.RemoveAiContextItem(0);
        expect(useNotemacStore.getState().aiContextItems.length).toBe(0);
    });

    it('does nothing for invalid index', () => {
        const store = useNotemacStore.getState();
        store.AddAiContextItem({
            id: 'ctx-1',
            type: 'file',
            path: '/file.ts',
            language: 'typescript',
            content: 'code',
            timestamp: Date.now(),
        });
        store.RemoveAiContextItem(10);
        expect(useNotemacStore.getState().aiContextItems.length).toBe(1);
    });
});

describe('AIModel — ClearAiContext', () => {
    beforeEach(() => resetStore());

    it('clears all context items', () => {
        const store = useNotemacStore.getState();
        store.AddAiContextItem({
            id: 'ctx-1',
            type: 'file',
            path: '/file.ts',
            language: 'typescript',
            content: 'code',
            timestamp: Date.now(),
        });
        store.AddAiContextItem({
            id: 'ctx-2',
            type: 'selection',
            path: '/file.ts',
            language: 'typescript',
            content: 'selected',
            timestamp: Date.now(),
        });
        store.ClearAiContext();
        expect(useNotemacStore.getState().aiContextItems.length).toBe(0);
    });
});

describe('AIModel — GetActiveProvider', () => {
    beforeEach(() => resetStore());

    it('returns active provider', () => {
        const store = useNotemacStore.getState();
        const provider = store.GetActiveProvider();
        expect(provider?.id).toBe('openai');
    });

    it('returns null for non-existent provider', () => {
        const store = useNotemacStore.getState();
        store.SetActiveProvider('nonexistent');
        expect(store.GetActiveProvider()).toBeNull();
    });
});

describe('AIModel — GetActiveModel', () => {
    beforeEach(() => resetStore());

    it('returns active model', () => {
        const store = useNotemacStore.getState();
        const model = store.GetActiveModel();
        expect(model?.id).toBe('gpt-4o-mini');
    });

    it('returns null if no active provider', () => {
        const store = useNotemacStore.getState();
        store.SetActiveProvider('nonexistent');
        expect(store.GetActiveModel()).toBeNull();
    });
});

describe('AIModel — GetCredentialForProvider', () => {
    beforeEach(() => resetStore());

    it('returns credential for provider', () => {
        const store = useNotemacStore.getState();
        store.SetCredentialForProvider('openai', 'sk-test123', false);
        const cred = store.GetCredentialForProvider('openai');
        expect(cred?.providerId).toBe('openai');
    });

    it('returns null for non-existent credential', () => {
        const store = useNotemacStore.getState();
        expect(store.GetCredentialForProvider('anthropic')).toBeNull();
    });
});

describe('AIModel — GetActiveConversation', () => {
    beforeEach(() => resetStore());

    it('returns active conversation', () => {
        const store = useNotemacStore.getState();
        store.AddConversation({ id: 'conv-1', title: 'Test', messages: [], createdAt: Date.now() });
        const conv = store.GetActiveConversation();
        expect(conv?.id).toBe('conv-1');
    });

    it('returns null when no active conversation', () => {
        const store = useNotemacStore.getState();
        expect(store.GetActiveConversation()).toBeNull();
    });
});

describe('AIModel — SetCommitMessageDraft', () => {
    beforeEach(() => resetStore());

    it('sets commit message draft', () => {
        const store = useNotemacStore.getState();
        store.SetCommitMessageDraft('Fix bug in login');
        expect(useNotemacStore.getState().commitMessageDraft).toBe('Fix bug in login');
    });
});

describe('AIModel — SetShowAiSettings', () => {
    beforeEach(() => resetStore());

    it('shows AI settings', () => {
        const store = useNotemacStore.getState();
        store.SetShowAiSettings(true);
        expect(useNotemacStore.getState().showAiSettings).toBe(true);
    });
});

describe('AIModel — SetAiOperationError', () => {
    beforeEach(() => resetStore());

    it('sets operation error', () => {
        const store = useNotemacStore.getState();
        store.SetAiOperationError('Connection timeout');
        expect(useNotemacStore.getState().aiOperationError).toBe('Connection timeout');
    });

    it('clears error', () => {
        const store = useNotemacStore.getState();
        store.SetAiOperationError('Error');
        store.SetAiOperationError(null);
        expect(useNotemacStore.getState().aiOperationError).toBeNull();
    });
});

describe('AIModel — LoadAIState', () => {
    beforeEach(() => resetStore());

    it('loads AI state from persistence', () => {
        const store = useNotemacStore.getState();
        store.LoadAIState();
        const state = useNotemacStore.getState();

        expect(state.aiSettings).toBeDefined();
        expect(state.providers.length).toBeGreaterThan(0);
    });
});

describe('AIModel — SaveAIState', () => {
    beforeEach(() => resetStore());

    it('saves AI state to persistence', () => {
        const store = useNotemacStore.getState();
        store.UpdateAISettings({ enableAutoSave: false });
        store.SaveAIState();
        const state = useNotemacStore.getState();

        expect(state.aiSettings.enableAutoSave).toBe(false);
    });
});
