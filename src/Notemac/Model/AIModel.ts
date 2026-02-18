import { StateCreator } from 'zustand';
import { produce } from 'immer';
import type { AIProvider, AICredential, AIConversation, AIMessage, AIInlineSuggestion, AIContextItem } from "../Commons/Types";
import type { AISettings } from "../Configs/AIConfig";
import { GetDefaultAISettings, GetBuiltInProviders } from "../Configs/AIConfig";
import { GetValue, SetValue } from '../../Shared/Persistence/PersistenceService';
import { DB_AI_PROVIDERS, DB_AI_CREDENTIALS, DB_AI_SETTINGS, DB_AI_CONVERSATIONS, AI_MAX_CONVERSATIONS } from '../Commons/Constants';

export interface NotemacAISlice
{
    // State
    aiEnabled: boolean;
    activeProviderId: string;
    activeModelId: string;
    providers: AIProvider[];
    credentials: AICredential[];
    aiSettings: AISettings;

    // Chat
    conversations: AIConversation[];
    activeConversationId: string | null;
    isAiStreaming: boolean;
    aiStreamContent: string;

    // Inline completion
    inlineSuggestionEnabled: boolean;
    currentInlineSuggestion: AIInlineSuggestion | null;

    // Context
    aiContextItems: AIContextItem[];

    // Git commit message
    commitMessageDraft: string;

    // UI
    showAiSettings: boolean;

    // Operation
    aiOperationError: string | null;

    // Setters
    SetAiEnabled: (enabled: boolean) => void;
    SetActiveProvider: (providerId: string) => void;
    SetActiveModel: (modelId: string) => void;
    SetProviders: (providers: AIProvider[]) => void;
    AddProvider: (provider: AIProvider) => void;
    RemoveProvider: (providerId: string) => void;
    SetCredentials: (credentials: AICredential[]) => void;
    SetCredentialForProvider: (providerId: string, apiKey: string, rememberKey: boolean) => void;
    RemoveCredentialForProvider: (providerId: string) => void;
    UpdateAISettings: (settings: Partial<AISettings>) => void;

    // Chat setters
    SetConversations: (conversations: AIConversation[]) => void;
    AddConversation: (conversation: AIConversation) => void;
    RemoveConversation: (conversationId: string) => void;
    SetActiveConversation: (conversationId: string | null) => void;
    AddMessageToConversation: (conversationId: string, message: AIMessage) => void;
    UpdateLastMessage: (conversationId: string, content: string) => void;
    SetIsAiStreaming: (streaming: boolean) => void;
    SetAiStreamContent: (content: string) => void;

    // Inline
    SetInlineSuggestionEnabled: (enabled: boolean) => void;
    SetCurrentInlineSuggestion: (suggestion: AIInlineSuggestion | null) => void;

    // Context
    AddAiContextItem: (item: AIContextItem) => void;
    RemoveAiContextItem: (index: number) => void;
    ClearAiContext: () => void;

    // Git
    SetCommitMessageDraft: (draft: string) => void;

    // UI
    SetShowAiSettings: (show: boolean) => void;

    // Error
    SetAiOperationError: (error: string | null) => void;

    // Persistence
    LoadAIState: () => void;
    SaveAIState: () => void;

    // Convenience
    GetActiveProvider: () => AIProvider | null;
    GetActiveModel: () => { id: string; name: string; providerId: string; contextWindow: number; supportsStreaming: boolean; supportsFIM: boolean } | null;
    GetCredentialForProvider: (providerId: string) => AICredential | null;
    GetActiveConversation: () => AIConversation | null;
}

export const createAISlice: StateCreator<NotemacAISlice> = (set, get) => ({
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

    // Setters
    SetAiEnabled: (enabled) => set({ aiEnabled: enabled }),
    SetActiveProvider: (providerId) => set({ activeProviderId: providerId }),
    SetActiveModel: (modelId) => set({ activeModelId: modelId }),
    SetProviders: (providers) => set({ providers }),

    AddProvider: (provider) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const existingIdx = state.providers.findIndex(p => p.id === provider.id);
            if (-1 !== existingIdx)
                state.providers[existingIdx] = provider;
            else
                state.providers.push(provider);
        }));
        get().SaveAIState();
    },

    RemoveProvider: (providerId) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const idx = state.providers.findIndex(p => p.id === providerId);
            if (-1 !== idx && !state.providers[idx].isBuiltIn)
                state.providers.splice(idx, 1);
        }));
        get().SaveAIState();
    },

    SetCredentials: (credentials) => set({ credentials }),

    SetCredentialForProvider: (providerId, apiKey, rememberKey) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const existingIdx = state.credentials.findIndex(c => c.providerId === providerId);
            const cred: AICredential = { providerId, apiKey, rememberKey };
            if (-1 !== existingIdx)
                state.credentials[existingIdx] = cred;
            else
                state.credentials.push(cred);
        }));

        // Persist only remembered keys
        const creds = get().credentials;
        const rememberedCreds = creds
            .filter(c => c.rememberKey)
            .map(c => ({ providerId: c.providerId, apiKey: c.apiKey, rememberKey: true }));
        SetValue(DB_AI_CREDENTIALS, rememberedCreds);
    },

    RemoveCredentialForProvider: (providerId) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const idx = state.credentials.findIndex(c => c.providerId === providerId);
            if (-1 !== idx)
                state.credentials.splice(idx, 1);
        }));

        const creds = get().credentials;
        const rememberedCreds = creds.filter(c => c.rememberKey);
        SetValue(DB_AI_CREDENTIALS, rememberedCreds);
    },

    UpdateAISettings: (newSettings) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            Object.assign(state.aiSettings, newSettings);
        }));
        SetValue(DB_AI_SETTINGS, get().aiSettings);
    },

    // Chat
    SetConversations: (conversations) => set({ conversations }),

    AddConversation: (conversation) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            state.conversations.unshift(conversation);
            // Cap at max conversations
            if (AI_MAX_CONVERSATIONS < state.conversations.length)
                state.conversations.length = AI_MAX_CONVERSATIONS;
        }));
        set({ activeConversationId: conversation.id });
    },

    RemoveConversation: (conversationId) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const idx = state.conversations.findIndex(c => c.id === conversationId);
            if (-1 !== idx)
                state.conversations.splice(idx, 1);
            if (conversationId === state.activeConversationId)
                state.activeConversationId = 0 < state.conversations.length ? state.conversations[0].id : null;
        }));
    },

    SetActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

    AddMessageToConversation: (conversationId, message) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const conv = state.conversations.find(c => c.id === conversationId);
            if (conv)
                conv.messages.push(message);
        }));
    },

    UpdateLastMessage: (conversationId, content) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            const conv = state.conversations.find(c => c.id === conversationId);
            if (conv && 0 < conv.messages.length)
            {
                const lastMsg = conv.messages[conv.messages.length - 1];
                lastMsg.content = content;
            }
        }));
    },

    SetIsAiStreaming: (streaming) => set({ isAiStreaming: streaming }),
    SetAiStreamContent: (content) => set({ aiStreamContent: content }),

    // Inline
    SetInlineSuggestionEnabled: (enabled) => set({ inlineSuggestionEnabled: enabled }),
    SetCurrentInlineSuggestion: (suggestion) => set({ currentInlineSuggestion: suggestion }),

    // Context
    AddAiContextItem: (item) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            state.aiContextItems.push(item);
        }));
    },

    RemoveAiContextItem: (index) =>
    {
        set(produce((state: NotemacAISlice) =>
        {
            if (0 <= index && index < state.aiContextItems.length)
                state.aiContextItems.splice(index, 1);
        }));
    },

    ClearAiContext: () => set({ aiContextItems: [] }),

    // Git
    SetCommitMessageDraft: (draft) => set({ commitMessageDraft: draft }),

    // UI
    SetShowAiSettings: (show) => set({ showAiSettings: show }),

    // Error
    SetAiOperationError: (error) => set({ aiOperationError: error }),

    // Persistence
    LoadAIState: () =>
    {
        const savedSettings = GetValue<AISettings>(DB_AI_SETTINGS);
        const savedCredentials = GetValue<AICredential[]>(DB_AI_CREDENTIALS);
        const savedProviders = GetValue<AIProvider[]>(DB_AI_PROVIDERS);
        const savedConversations = GetValue<AIConversation[]>(DB_AI_CONVERSATIONS);

        const builtIn = GetBuiltInProviders();
        let providers = builtIn;

        // Merge saved custom providers with built-in
        if (null !== savedProviders && undefined !== savedProviders)
        {
            const customProviders = savedProviders.filter(p => !p.isBuiltIn);
            providers = [...builtIn, ...customProviders];
        }

        set({
            aiSettings: savedSettings || GetDefaultAISettings(),
            credentials: savedCredentials || [],
            providers,
            conversations: savedConversations || [],
            aiEnabled: null !== savedCredentials && 0 < savedCredentials.length,
        });
    },

    SaveAIState: () =>
    {
        const state = get();
        SetValue(DB_AI_SETTINGS, state.aiSettings);

        // Only persist custom providers
        const customProviders = state.providers.filter(p => !p.isBuiltIn);
        if (0 < customProviders.length)
            SetValue(DB_AI_PROVIDERS, customProviders);

        // Only persist remembered credentials
        const rememberedCreds = state.credentials.filter(c => c.rememberKey);
        SetValue(DB_AI_CREDENTIALS, rememberedCreds);

        // Persist conversations
        SetValue(DB_AI_CONVERSATIONS, state.conversations);
    },

    // Convenience
    GetActiveProvider: () =>
    {
        const state = get();
        return state.providers.find(p => p.id === state.activeProviderId) || null;
    },

    GetActiveModel: () =>
    {
        const state = get();
        const provider = state.providers.find(p => p.id === state.activeProviderId);
        if (null === provider || undefined === provider)
            return null;
        return provider.models.find(m => m.id === state.activeModelId) || null;
    },

    GetCredentialForProvider: (providerId) =>
    {
        return get().credentials.find(c => c.providerId === providerId) || null;
    },

    GetActiveConversation: () =>
    {
        const state = get();
        if (null === state.activeConversationId)
            return null;
        return state.conversations.find(c => c.id === state.activeConversationId) || null;
    },
});
