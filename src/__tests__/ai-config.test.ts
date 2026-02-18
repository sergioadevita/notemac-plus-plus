import { describe, it, expect } from 'vitest';
import {
    GetDefaultAISettings,
    GetBuiltInProviders,
    CreateCustomProvider,
    CreateCustomModel,
} from '../Notemac/Configs/AIConfig';
import {
    AI_DEFAULT_DEBOUNCE_MS,
    AI_DEFAULT_TEMPERATURE,
    AI_CHAT_TEMPERATURE,
    AI_MAX_CONTEXT_TOKENS,
    AI_MAX_INLINE_TOKENS,
    AI_MAX_CONVERSATIONS,
    DB_AI_PROVIDERS,
    DB_AI_CREDENTIALS,
    DB_AI_SETTINGS,
    DB_AI_CONVERSATIONS,
} from '../Notemac/Commons/Constants';

// ============================================================
// AIConfig — GetDefaultAISettings
// ============================================================
describe('AIConfig — GetDefaultAISettings', () =>
{
    it('returns a complete settings object', () =>
    {
        const settings = GetDefaultAISettings();
        expect(settings).toBeDefined();
        expect(settings.inlineCompletionEnabled).toBe(true);
        expect(AI_DEFAULT_DEBOUNCE_MS === settings.inlineDebounceMs).toBe(true);
        expect(AI_MAX_INLINE_TOKENS === settings.inlineMaxTokens).toBe(true);
        expect(AI_CHAT_TEMPERATURE === settings.chatTemperature).toBe(true);
        expect(AI_DEFAULT_TEMPERATURE === settings.codeTemperature).toBe(true);
        expect(AI_MAX_CONTEXT_TOKENS === settings.maxContextTokens).toBe(true);
        expect(settings.systemPrompt).toBe('');
        expect(settings.showAiStatusIndicator).toBe(true);
    });

    it('returns a fresh object each call', () =>
    {
        const a = GetDefaultAISettings();
        const b = GetDefaultAISettings();
        expect(a).not.toBe(b);
        expect(a).toEqual(b);
    });
});

// ============================================================
// AIConfig — GetBuiltInProviders
// ============================================================
describe('AIConfig — GetBuiltInProviders', () =>
{
    it('returns three built-in providers', () =>
    {
        const providers = GetBuiltInProviders();
        expect(3 === providers.length).toBe(true);
    });

    it('includes OpenAI provider with correct structure', () =>
    {
        const providers = GetBuiltInProviders();
        const openai = providers.find(p => 'openai' === p.id);
        expect(openai).toBeDefined();
        expect(openai!.name).toBe('OpenAI');
        expect(openai!.type).toBe('openai');
        expect(openai!.isBuiltIn).toBe(true);
        expect(openai!.baseUrl).toBe('https://api.openai.com');
        expect(0 < openai!.models.length).toBe(true);
    });

    it('includes Anthropic provider with correct structure', () =>
    {
        const providers = GetBuiltInProviders();
        const anthropic = providers.find(p => 'anthropic' === p.id);
        expect(anthropic).toBeDefined();
        expect(anthropic!.name).toBe('Anthropic');
        expect(anthropic!.type).toBe('anthropic');
        expect(anthropic!.isBuiltIn).toBe(true);
        expect(anthropic!.baseUrl).toBe('https://api.anthropic.com');
        expect(0 < anthropic!.models.length).toBe(true);
    });

    it('includes Google AI provider with correct structure', () =>
    {
        const providers = GetBuiltInProviders();
        const google = providers.find(p => 'google' === p.id);
        expect(google).toBeDefined();
        expect(google!.name).toBe('Google AI');
        expect(google!.type).toBe('google');
        expect(google!.isBuiltIn).toBe(true);
        expect(0 < google!.models.length).toBe(true);
    });

    it('all models have required fields', () =>
    {
        const providers = GetBuiltInProviders();
        for (const provider of providers)
        {
            for (const model of provider.models)
            {
                expect(0 < model.id.length).toBe(true);
                expect(0 < model.name.length).toBe(true);
                expect(model.providerId).toBe(provider.id);
                expect(0 < model.contextWindow).toBe(true);
                expect(typeof model.supportsStreaming).toBe('boolean');
                expect(typeof model.supportsFIM).toBe('boolean');
            }
        }
    });

    it('returns a fresh array each call', () =>
    {
        const a = GetBuiltInProviders();
        const b = GetBuiltInProviders();
        expect(a).not.toBe(b);
    });
});

// ============================================================
// AIConfig — CreateCustomProvider
// ============================================================
describe('AIConfig — CreateCustomProvider', () =>
{
    it('creates a custom provider with correct fields', () =>
    {
        const models = [CreateCustomModel('m1', 'Model 1', 'test-provider')];
        const provider = CreateCustomProvider('test-provider', 'Test Provider', 'http://localhost:1234', models);
        expect(provider.id).toBe('test-provider');
        expect(provider.name).toBe('Test Provider');
        expect(provider.type).toBe('custom');
        expect(provider.baseUrl).toBe('http://localhost:1234');
        expect(provider.isBuiltIn).toBe(false);
        expect(1 === provider.models.length).toBe(true);
    });
});

// ============================================================
// AIConfig — CreateCustomModel
// ============================================================
describe('AIConfig — CreateCustomModel', () =>
{
    it('creates a model with defaults', () =>
    {
        const model = CreateCustomModel('my-model', 'My Model', 'provider-1');
        expect(model.id).toBe('my-model');
        expect(model.name).toBe('My Model');
        expect(model.providerId).toBe('provider-1');
        expect(8192 === model.contextWindow).toBe(true);
        expect(model.supportsStreaming).toBe(true);
        expect(model.supportsFIM).toBe(false);
    });

    it('allows custom context window', () =>
    {
        const model = CreateCustomModel('m', 'M', 'p', 32000);
        expect(32000 === model.contextWindow).toBe(true);
    });
});

// ============================================================
// AI Constants
// ============================================================
describe('AI Constants', () =>
{
    it('has valid numeric defaults', () =>
    {
        expect(0 < AI_DEFAULT_DEBOUNCE_MS).toBe(true);
        expect(0 < AI_MAX_CONTEXT_TOKENS).toBe(true);
        expect(0 <= AI_DEFAULT_TEMPERATURE && AI_DEFAULT_TEMPERATURE <= 2).toBe(true);
        expect(0 <= AI_CHAT_TEMPERATURE && AI_CHAT_TEMPERATURE <= 2).toBe(true);
        expect(0 < AI_MAX_CONVERSATIONS).toBe(true);
        expect(0 < AI_MAX_INLINE_TOKENS).toBe(true);
    });

    it('has valid persistence key strings', () =>
    {
        expect(0 < DB_AI_PROVIDERS.length).toBe(true);
        expect(0 < DB_AI_CREDENTIALS.length).toBe(true);
        expect(0 < DB_AI_SETTINGS.length).toBe(true);
        expect(0 < DB_AI_CONVERSATIONS.length).toBe(true);
    });
});
