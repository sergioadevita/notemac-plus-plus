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

function GetOpenAIModels(): AIModelDefinition[]
{
    return [
        { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', providerId: 'openai', contextWindow: 16385, supportsStreaming: true, supportsFIM: false },
        { id: 'o1', name: 'o1', providerId: 'openai', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'o1-mini', name: 'o1-mini', providerId: 'openai', contextWindow: 128000, supportsStreaming: true, supportsFIM: false },
    ];
}

function GetAnthropicModels(): AIModelDefinition[]
{
    return [
        { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
        { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', providerId: 'anthropic', contextWindow: 200000, supportsStreaming: true, supportsFIM: false },
    ];
}

function GetGoogleModels(): AIModelDefinition[]
{
    return [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', providerId: 'google', contextWindow: 1048576, supportsStreaming: true, supportsFIM: false },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', providerId: 'google', contextWindow: 1048576, supportsStreaming: true, supportsFIM: false },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', providerId: 'google', contextWindow: 2097152, supportsStreaming: true, supportsFIM: false },
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
