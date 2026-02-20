import type { AIProvider, AIModelDefinition } from "../Commons/Types";
import { AI_DEFAULT_DEBOUNCE_MS, AI_DEFAULT_TEMPERATURE, AI_CHAT_TEMPERATURE, AI_MAX_CONTEXT_TOKENS, AI_MAX_INLINE_TOKENS } from "../Commons/Constants";

export interface AISettings
{
    inlineCompletionEnabled: boolean;
    inlineDebounceMs: number;
    inlineMaxTokens: number;
    chatTemperature: number;
    codeTemperature: number;
    maxContextTokens: number;
    systemPrompt: string;
    showAiStatusIndicator: boolean;
}

export function GetDefaultAISettings(): AISettings
{
    return {
        inlineCompletionEnabled: true,
        inlineDebounceMs: AI_DEFAULT_DEBOUNCE_MS,
        inlineMaxTokens: AI_MAX_INLINE_TOKENS,
        chatTemperature: AI_CHAT_TEMPERATURE,
        codeTemperature: AI_DEFAULT_TEMPERATURE,
        maxContextTokens: AI_MAX_CONTEXT_TOKENS,
        systemPrompt: '',
        showAiStatusIndicator: true,
    };
}

export function GetBuiltInProviders(): AIProvider[]
{
    return [
        {
            id: 'openai',
            name: 'OpenAI',
            type: 'openai',
            baseUrl: 'https://api.openai.com',
            isBuiltIn: true,
            models: GetOpenAIModels(),
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            type: 'anthropic',
            baseUrl: 'https://api.anthropic.com',
            isBuiltIn: true,
            models: GetAnthropicModels(),
        },
        {
            id: 'google',
            name: 'Google AI',
            type: 'google',
            baseUrl: 'https://generativelanguage.googleapis.com',
            isBuiltIn: true,
            models: GetGoogleModels(),
        },
    ];
}

// ─── Fallback Model Lists ────────────────────────────────────────
// These are used when no API key is configured or when the dynamic
// fetch fails. Once a key is saved, use FetchModelsForProvider()
// in LLMController to get the real-time list from the API.

function GetOpenAIModels(): AIModelDefinition[]
{
    return [
        // GPT-5 series (latest flagship)
        { id: 'gpt-5.2', name: 'GPT-5.2', providerId: 'openai', contextWindow: 1047576, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', providerId: 'openai', contextWindow: 1047576, supportsStreaming: true, supportsFIM: false },
        // GPT-4.1 series (1M context)
        { id: 'gpt-4.1', name: 'GPT-4.1', providerId: 'openai', contextWindow: 1047576, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', providerId: 'openai', contextWindow: 1047576, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', providerId: 'openai', contextWindow: 1047576, supportsStreaming: true, supportsFIM: false },
        // GPT-4o series (widely available, 128K context)
        { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
        // O-series reasoning models
        { id: 'o3', name: 'o3', providerId: 'openai', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'o4-mini', name: 'o4-mini', providerId: 'openai', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
    ];
}

function GetAnthropicModels(): AIModelDefinition[]
{
    return [
        // Latest generation (4.6)
        { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        // 4.5 generation
        { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
    ];
}

function GetGoogleModels(): AIModelDefinition[]
{
    return [
        // Gemini 2.5 series (stable, recommended)
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', providerId: 'google', contextWindow: 1048576, supportsStreaming: true, supportsFIM: false },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', providerId: 'google', contextWindow: 1048576, supportsStreaming: true, supportsFIM: false },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', providerId: 'google', contextWindow: 1048576, supportsStreaming: true, supportsFIM: false },
    ];
}

export function CreateCustomProvider(id: string, name: string, baseUrl: string, models: AIModelDefinition[]): AIProvider
{
    return {
        id,
        name,
        type: 'custom',
        baseUrl,
        isBuiltIn: false,
        models,
    };
}

export function CreateCustomModel(id: string, name: string, providerId: string, contextWindow: number = 8192): AIModelDefinition
{
    return {
        id,
        name,
        providerId,
        contextWindow,
        supportsStreaming: true,
        supportsFIM: false,
    };
}
