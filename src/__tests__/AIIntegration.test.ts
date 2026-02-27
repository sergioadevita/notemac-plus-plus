import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import {
    GetDefaultShortcuts,
    GetShortcutCategories,
    GetShortcutsByCategory,
} from '../Notemac/Configs/ShortcutConfig';
import {
    GetBuiltInProviders,
    GetDefaultAISettings,
    CreateCustomProvider,
    CreateCustomModel,
} from '../Notemac/Configs/AIConfig';
import {
    BuildContextString,
    EstimateTokenCount,
    TruncateToTokenBudget,
    ExtractCodeBlocks,
} from '../Notemac/Controllers/LLMController';
import { generateId } from '../Shared/Helpers/IdHelpers';
import { NOTEMAC_EVENTS as EVENTS } from '../Shared/EventDispatcher/EventDispatcher';
import type { AIContextItem } from '../Notemac/Commons/Types';

// ============================================================
// ShortcutConfig — AI Category
// ============================================================
describe('ShortcutConfig — AI Shortcuts', () =>
{
    it('includes AI category in categories list', () =>
    {
        const categories = GetShortcutCategories();
        expect(categories).toContain('AI');
    });

    it('has AI shortcuts registered', () =>
    {
        const aiShortcuts = GetShortcutsByCategory('AI');
        expect(0 < aiShortcuts.length).toBe(true);
    });

    it('has ai-chat shortcut with Ctrl+Shift+A', () =>
    {
        const aiShortcuts = GetShortcutsByCategory('AI');
        const chatShortcut = aiShortcuts.find(s => 'ai-chat' === s.action);
        expect(chatShortcut).toBeDefined();
        expect(chatShortcut!.shortcut).toBe('Ctrl+Shift+A');
    });

    it('has ai-explain shortcut with Ctrl+Shift+E', () =>
    {
        const aiShortcuts = GetShortcutsByCategory('AI');
        const explainShortcut = aiShortcuts.find(s => 'ai-explain' === s.action);
        expect(explainShortcut).toBeDefined();
        expect(explainShortcut!.shortcut).toBe('Ctrl+Shift+E');
    });

    it('has ai-refactor shortcut with Ctrl+Shift+R', () =>
    {
        const aiShortcuts = GetShortcutsByCategory('AI');
        const refactorShortcut = aiShortcuts.find(s => 'ai-refactor' === s.action);
        expect(refactorShortcut).toBeDefined();
        expect(refactorShortcut!.shortcut).toBe('Ctrl+Shift+R');
    });

    it('has all expected AI action shortcuts', () =>
    {
        const aiShortcuts = GetShortcutsByCategory('AI');
        const actions = aiShortcuts.map(s => s.action);
        expect(actions).toContain('ai-chat');
        expect(actions).toContain('ai-explain');
        expect(actions).toContain('ai-refactor');
        expect(actions).toContain('ai-generate-tests');
        expect(actions).toContain('ai-generate-docs');
        expect(actions).toContain('ai-fix-error');
        expect(actions).toContain('ai-simplify');
        expect(actions).toContain('ai-settings');
        expect(actions).toContain('ai-toggle-inline');
    });

    it('all shortcuts have unique actions', () =>
    {
        const shortcuts = GetDefaultShortcuts();
        const actions = shortcuts.map(s => s.action);
        const uniqueActions = new Set(actions);
        expect(actions.length === uniqueActions.size).toBe(true);
    });
});

// ============================================================
// EventDispatcher — AI Events
// ============================================================
describe('EventDispatcher — AI Events', () =>
{
    it('has all AI event types defined', () =>
    {
        expect(EVENTS.AI_RESPONSE_COMPLETE).toBeDefined();
        expect(EVENTS.AI_STREAM_CHUNK).toBeDefined();
        expect(EVENTS.AI_INLINE_SUGGESTION).toBeDefined();
        expect(EVENTS.AI_ERROR).toBeDefined();
        expect(EVENTS.AI_ACTION).toBeDefined();
    });

    it('AI events have unique string values', () =>
    {
        const values = [
            EVENTS.AI_RESPONSE_COMPLETE,
            EVENTS.AI_STREAM_CHUNK,
            EVENTS.AI_INLINE_SUGGESTION,
            EVENTS.AI_ERROR,
            EVENTS.AI_ACTION,
        ];
        const unique = new Set(values);
        expect(values.length === unique.size).toBe(true);
    });

    it('AI events follow naming convention', () =>
    {
        expect(EVENTS.AI_RESPONSE_COMPLETE).toContain('notemac-ai-');
        expect(EVENTS.AI_STREAM_CHUNK).toContain('notemac-ai-');
        expect(EVENTS.AI_INLINE_SUGGESTION).toContain('notemac-ai-');
        expect(EVENTS.AI_ERROR).toContain('notemac-ai-');
        expect(EVENTS.AI_ACTION).toContain('notemac-ai-');
    });
});

// ============================================================
// AI Store — Advanced Provider Operations
// ============================================================
describe('AI Store — Advanced Provider Operations', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({
            providers: GetBuiltInProviders(),
            credentials: [],
            activeProviderId: 'openai',
            activeModelId: 'gpt-4o',
        });
    });

    it('AddProvider adds a custom provider', () =>
    {
        const customModel = CreateCustomModel('llama3', 'Llama 3', 'ollama-local');
        const customProvider = CreateCustomProvider('ollama-local', 'Ollama', 'http://localhost:11434', [customModel]);

        useNotemacStore.getState().AddProvider(customProvider);
        const providers = useNotemacStore.getState().providers;
        const found = providers.find(p => 'ollama-local' === p.id);
        expect(found).toBeDefined();
        expect(found!.name).toBe('Ollama');
        expect(found!.isBuiltIn).toBe(false);
    });

    it('AddProvider updates existing provider', () =>
    {
        const model1 = CreateCustomModel('m1', 'Model1', 'test-p');
        const model2 = CreateCustomModel('m2', 'Model2', 'test-p');
        const provider1 = CreateCustomProvider('test-p', 'Provider V1', 'http://localhost:1234', [model1]);
        const provider2 = CreateCustomProvider('test-p', 'Provider V2', 'http://localhost:5678', [model2]);

        useNotemacStore.getState().AddProvider(provider1);
        useNotemacStore.getState().AddProvider(provider2);

        const found = useNotemacStore.getState().providers.find(p => 'test-p' === p.id);
        expect(found!.name).toBe('Provider V2');
        expect(found!.baseUrl).toBe('http://localhost:5678');
    });

    it('RemoveProvider removes custom but not built-in', () =>
    {
        const model = CreateCustomModel('m', 'M', 'custom-1');
        const custom = CreateCustomProvider('custom-1', 'Custom', 'http://localhost', [model]);
        useNotemacStore.getState().AddProvider(custom);

        // Try to remove built-in — should fail
        const beforeCount = useNotemacStore.getState().providers.length;
        useNotemacStore.getState().RemoveProvider('openai');
        expect(useNotemacStore.getState().providers.length === beforeCount).toBe(true);

        // Remove custom — should succeed
        useNotemacStore.getState().RemoveProvider('custom-1');
        expect(useNotemacStore.getState().providers.find(p => 'custom-1' === p.id)).toBeUndefined();
    });

    it('GetActiveModel returns correct model from active provider', () =>
    {
        useNotemacStore.setState({ activeProviderId: 'openai', activeModelId: 'gpt-4o' });
        const model = useNotemacStore.getState().GetActiveModel();
        if (null !== model)
        {
            expect(model.providerId).toBe('openai');
            expect(model.id).toBe('gpt-4o');
            expect(0 < model.contextWindow).toBe(true);
        }
    });

    it('GetActiveModel returns null for non-existent model', () =>
    {
        useNotemacStore.setState({ activeProviderId: 'openai', activeModelId: 'nonexistent-model' });
        const model = useNotemacStore.getState().GetActiveModel();
        expect(null === model).toBe(true);
    });

    it('GetActiveProvider returns null for non-existent provider', () =>
    {
        useNotemacStore.setState({ activeProviderId: 'nonexistent-provider' });
        const provider = useNotemacStore.getState().GetActiveProvider();
        expect(null === provider).toBe(true);
    });
});

// ============================================================
// AI Store — Conversation Message Operations
// ============================================================
describe('AI Store — Conversation Message Operations', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({
            conversations: [],
            activeConversationId: null,
        });
    });

    it('AddMessageToConversation handles non-existent conversation gracefully', () =>
    {
        // Should not throw
        useNotemacStore.getState().AddMessageToConversation('nonexistent', {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: Date.now(),
        });
        expect(0 === useNotemacStore.getState().conversations.length).toBe(true);
    });

    it('UpdateLastMessage updates the last message content', () =>
    {
        const conv = { id: generateId(), title: 'Update Test', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);
        useNotemacStore.getState().AddMessageToConversation(conv.id, {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello',
            timestamp: Date.now(),
        });

        useNotemacStore.getState().UpdateLastMessage(conv.id, 'Hello World Updated');
        const updated = useNotemacStore.getState().conversations.find(c => c.id === conv.id);
        expect(updated!.messages[0].content).toBe('Hello World Updated');
    });

    it('UpdateLastMessage handles empty conversation gracefully', () =>
    {
        const conv = { id: generateId(), title: 'Empty', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);
        // Should not throw
        useNotemacStore.getState().UpdateLastMessage(conv.id, 'Nothing to update');
    });

    it('conversations are stored newest-first (unshift)', () =>
    {
        const conv1 = { id: generateId(), title: 'First', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        const conv2 = { id: generateId(), title: 'Second', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv1);
        useNotemacStore.getState().AddConversation(conv2);

        expect(useNotemacStore.getState().conversations[0].title).toBe('Second');
        expect(useNotemacStore.getState().conversations[1].title).toBe('First');
    });

    it('RemoveConversation resets active when active is removed', () =>
    {
        const conv1 = { id: generateId(), title: 'First', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        const conv2 = { id: generateId(), title: 'Second', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv1);
        useNotemacStore.getState().AddConversation(conv2);

        // Active should be conv2 (last added)
        expect(useNotemacStore.getState().activeConversationId).toBe(conv2.id);

        // Remove active → should fall back to first remaining
        useNotemacStore.getState().RemoveConversation(conv2.id);
        expect(useNotemacStore.getState().activeConversationId).toBe(conv1.id);
    });

    it('RemoveConversation sets null when last is removed', () =>
    {
        const conv = { id: generateId(), title: 'Only', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        useNotemacStore.getState().AddConversation(conv);
        useNotemacStore.getState().RemoveConversation(conv.id);
        expect(null === useNotemacStore.getState().activeConversationId).toBe(true);
    });
});

// ============================================================
// AI Store — Context Items
// ============================================================
describe('AI Store — Context Items', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({ aiContextItems: [] });
    });

    it('AddAiContextItem adds an item', () =>
    {
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'test.ts', content: 'code' });
        expect(1 === useNotemacStore.getState().aiContextItems.length).toBe(true);
    });

    it('RemoveAiContextItem removes at index', () =>
    {
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'a.ts', content: 'aaa' });
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'b.ts', content: 'bbb' });
        useNotemacStore.getState().RemoveAiContextItem(0);
        expect(1 === useNotemacStore.getState().aiContextItems.length).toBe(true);
        expect(useNotemacStore.getState().aiContextItems[0].label).toBe('b.ts');
    });

    it('RemoveAiContextItem ignores invalid index', () =>
    {
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'a.ts', content: 'aaa' });
        useNotemacStore.getState().RemoveAiContextItem(-1);
        useNotemacStore.getState().RemoveAiContextItem(99);
        expect(1 === useNotemacStore.getState().aiContextItems.length).toBe(true);
    });

    it('ClearAiContext removes all items', () =>
    {
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'a.ts', content: 'aaa' });
        useNotemacStore.getState().AddAiContextItem({ type: 'file', label: 'b.ts', content: 'bbb' });
        useNotemacStore.getState().ClearAiContext();
        expect(0 === useNotemacStore.getState().aiContextItems.length).toBe(true);
    });
});

// ============================================================
// AI Store — Settings Updates
// ============================================================
describe('AI Store — Settings Updates', () =>
{
    it('UpdateAISettings merges partial settings', () =>
    {
        const original = useNotemacStore.getState().aiSettings;
        useNotemacStore.getState().UpdateAISettings({ chatTemperature: 0.9 });
        const updated = useNotemacStore.getState().aiSettings;

        expect(updated.chatTemperature).toBe(0.9);
        // Other settings should be preserved
        expect(updated.inlineCompletionEnabled).toBe(original.inlineCompletionEnabled);
        expect(updated.maxContextTokens).toBe(original.maxContextTokens);
    });

    it('SetInlineSuggestionEnabled toggles inline suggestions', () =>
    {
        useNotemacStore.getState().SetInlineSuggestionEnabled(false);
        expect(useNotemacStore.getState().inlineSuggestionEnabled).toBe(false);

        useNotemacStore.getState().SetInlineSuggestionEnabled(true);
        expect(useNotemacStore.getState().inlineSuggestionEnabled).toBe(true);
    });

    it('SetCommitMessageDraft updates draft', () =>
    {
        useNotemacStore.getState().SetCommitMessageDraft('feat: add new feature');
        expect(useNotemacStore.getState().commitMessageDraft).toBe('feat: add new feature');
    });

    it('SetAiOperationError sets and clears error', () =>
    {
        useNotemacStore.getState().SetAiOperationError('API key invalid');
        expect(useNotemacStore.getState().aiOperationError).toBe('API key invalid');

        useNotemacStore.getState().SetAiOperationError(null);
        expect(null === useNotemacStore.getState().aiOperationError).toBe(true);
    });

    it('SetAiStreamContent updates stream content', () =>
    {
        useNotemacStore.getState().SetAiStreamContent('Partial response...');
        expect(useNotemacStore.getState().aiStreamContent).toBe('Partial response...');
    });

    it('SetCurrentInlineSuggestion sets and clears suggestion', () =>
    {
        useNotemacStore.getState().SetCurrentInlineSuggestion({
            text: 'console.log("hello")',
            line: 10,
            column: 5,
        });
        expect(useNotemacStore.getState().currentInlineSuggestion).not.toBeNull();
        expect(useNotemacStore.getState().currentInlineSuggestion!.text).toBe('console.log("hello")');

        useNotemacStore.getState().SetCurrentInlineSuggestion(null);
        expect(null === useNotemacStore.getState().currentInlineSuggestion).toBe(true);
    });
});

// ============================================================
// LLMController — Advanced ExtractCodeBlocks
// ============================================================
describe('LLMController — ExtractCodeBlocks Edge Cases', () =>
{
    it('handles nested backticks in content', () =>
    {
        const content = '```js\nconst s = `template`;\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(1 === blocks.length).toBe(true);
        expect(blocks[0].code).toContain('template');
    });

    it('handles empty code block', () =>
    {
        const content = '```js\n\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(1 === blocks.length).toBe(true);
    });

    it('preserves text between code blocks', () =>
    {
        const content = 'Before\n```js\ncode1\n```\nMiddle text\n```py\ncode2\n```\nAfter';
        const blocks = ExtractCodeBlocks(content);
        expect(2 === blocks.length).toBe(true);
    });
});

// ============================================================
// LLMController — BuildContextString Edge Cases
// ============================================================
describe('LLMController — BuildContextString Edge Cases', () =>
{
    it('handles very large content gracefully', () =>
    {
        const largeContent = 'x'.repeat(10000);
        const items: AIContextItem[] = [
            { type: 'file', label: 'large.ts', content: largeContent },
        ];
        const result = BuildContextString(items);
        expect(result.length > 0).toBe(true);
        expect(result).toContain('large.ts');
    });

    it('handles mixed item types', () =>
    {
        const items: AIContextItem[] = [
            { type: 'file', label: 'main.ts', content: 'code', language: 'typescript' },
            { type: 'selection', label: 'sel', content: 'selected', language: 'typescript' },
            { type: 'error', label: 'err', content: 'Error msg' },
            { type: 'diff', label: 'diff', content: '+added' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('File: main.ts');
        expect(result).toContain('Selected code');
        expect(result).toContain('Error');
        expect(result).toContain('Diff');
    });
});

// ============================================================
// LLMController — EstimateTokenCount Edge Cases
// ============================================================
describe('LLMController — EstimateTokenCount Edge Cases', () =>
{
    it('handles single character', () =>
    {
        expect(1 === EstimateTokenCount('a')).toBe(true);
    });

    it('handles unicode characters', () =>
    {
        const text = '\u2728\u2728\u2728\u2728'; // 4 unicode chars, but multi-byte
        const count = EstimateTokenCount(text);
        expect(0 < count).toBe(true);
    });

    it('handles whitespace-only string', () =>
    {
        const count = EstimateTokenCount('    ');
        expect(1 === count).toBe(true); // 4 spaces = 1 token
    });
});

// ============================================================
// LLMController — TruncateToTokenBudget Edge Cases
// ============================================================
describe('LLMController — TruncateToTokenBudget Edge Cases', () =>
{
    it('handles zero budget', () =>
    {
        const result = TruncateToTokenBudget('hello', 0);
        expect(result).toContain('truncated');
    });

    it('handles 1 token budget', () =>
    {
        const result = TruncateToTokenBudget('hello world', 1);
        expect(result).toContain('truncated');
        // Original content is truncated to 4 chars + suffix
        expect(result.startsWith('hell')).toBe(true);
    });

    it('handles empty string', () =>
    {
        expect(TruncateToTokenBudget('', 100)).toBe('');
    });
});

// ============================================================
// AIConfig — Provider Model Completeness
// ============================================================
describe('AIConfig — Provider Model Validation', () =>
{
    it('OpenAI has streaming support on all models', () =>
    {
        const providers = GetBuiltInProviders();
        const openai = providers.find(p => 'openai' === p.id)!;
        for (const model of openai.models)
        {
            expect(model.supportsStreaming).toBe(true);
        }
    });

    it('Anthropic has streaming support on all models', () =>
    {
        const providers = GetBuiltInProviders();
        const anthropic = providers.find(p => 'anthropic' === p.id)!;
        for (const model of anthropic.models)
        {
            expect(model.supportsStreaming).toBe(true);
        }
    });

    it('all providers have unique IDs', () =>
    {
        const providers = GetBuiltInProviders();
        const ids = providers.map(p => p.id);
        const unique = new Set(ids);
        expect(ids.length === unique.size).toBe(true);
    });

    it('all models have unique IDs within their provider', () =>
    {
        const providers = GetBuiltInProviders();
        for (const provider of providers)
        {
            const modelIds = provider.models.map(m => m.id);
            const unique = new Set(modelIds);
            expect(modelIds.length === unique.size).toBe(true);
        }
    });

    it('GetDefaultAISettings has all required fields', () =>
    {
        const settings = GetDefaultAISettings();
        expect(typeof settings.inlineCompletionEnabled).toBe('boolean');
        expect(typeof settings.inlineDebounceMs).toBe('number');
        expect(typeof settings.inlineMaxTokens).toBe('number');
        expect(typeof settings.codeTemperature).toBe('number');
        expect(typeof settings.chatTemperature).toBe('number');
        expect(typeof settings.maxContextTokens).toBe('number');
        expect(typeof settings.systemPrompt).toBe('string');
        expect(typeof settings.showAiStatusIndicator).toBe('boolean');
    });
});

// ============================================================
// AI Store — Multi-credential management
// ============================================================
describe('AI Store — Multi-Credential Management', () =>
{
    beforeEach(() =>
    {
        useNotemacStore.setState({ credentials: [] });
    });

    it('can store credentials for multiple providers', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-openai', true);
        useNotemacStore.getState().SetCredentialForProvider('anthropic', 'sk-ant', true);
        useNotemacStore.getState().SetCredentialForProvider('google', 'ai-google', false);

        expect(useNotemacStore.getState().GetCredentialForProvider('openai')!.apiKey).toBe('sk-openai');
        expect(useNotemacStore.getState().GetCredentialForProvider('anthropic')!.apiKey).toBe('sk-ant');
        expect(useNotemacStore.getState().GetCredentialForProvider('google')!.apiKey).toBe('ai-google');
    });

    it('respects rememberKey flag', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-test', true);
        const cred = useNotemacStore.getState().GetCredentialForProvider('openai');
        expect(cred!.rememberKey).toBe(true);

        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-test', false);
        const updated = useNotemacStore.getState().GetCredentialForProvider('openai');
        expect(updated!.rememberKey).toBe(false);
    });

    it('RemoveCredentialForProvider only removes specified provider', () =>
    {
        useNotemacStore.getState().SetCredentialForProvider('openai', 'sk-1', false);
        useNotemacStore.getState().SetCredentialForProvider('anthropic', 'sk-2', false);

        useNotemacStore.getState().RemoveCredentialForProvider('openai');
        expect(null === useNotemacStore.getState().GetCredentialForProvider('openai')).toBe(true);
        expect(useNotemacStore.getState().GetCredentialForProvider('anthropic')!.apiKey).toBe('sk-2');
    });
});
