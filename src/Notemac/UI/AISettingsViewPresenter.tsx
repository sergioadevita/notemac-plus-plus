import React, { useState, useCallback, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetBuiltInProviders, CreateCustomProvider, CreateCustomModel } from "../Configs/AIConfig";
import { generateId } from "../../Shared/Helpers/IdHelpers";
import { TestProviderConnection } from "../Controllers/LLMController";
import { CRED_DEFAULT_AI_EXPIRY_HOURS } from "../Commons/Constants";

interface AISettingsProps
{
    theme: ThemeColors;
}

export function AISettingsViewPresenter({ theme }: AISettingsProps)
{
    const {
        providers,
        credentials,
        activeProviderId,
        activeModelId,
        aiSettings,
        inlineSuggestionEnabled,
        SetActiveProvider,
        SetActiveModel,
        SetCredentialForProvider,
        RemoveCredentialForProvider,
        UpdateAISettings,
        SetInlineSuggestionEnabled,
        AddProvider,
        RemoveProvider,
        SetShowAiSettings,
        SetAiEnabled,
    } = useNotemacStore();

    const [activeTab, setActiveTab] = useState<'providers' | 'completion' | 'chat' | 'custom'>('providers');
    const [testStatus, setTestStatus] = useState<Record<string, { testing: boolean; result?: string }>>({});

    // Local state for API key inputs
    const [keyInputs, setKeyInputs] = useState<Record<string, string>>(() =>
    {
        const inputs: Record<string, string> = {};
        for (const cred of credentials)
        {
            inputs[cred.providerId] = cred.apiKey;
        }
        return inputs;
    });

    const [rememberFlags, setRememberFlags] = useState<Record<string, boolean>>(() =>
    {
        const flags: Record<string, boolean> = {};
        for (const cred of credentials)
        {
            flags[cred.providerId] = cred.rememberKey;
        }
        return flags;
    });

    // Memoize custom providers to avoid re-filtering on every render
    const customProviders = useMemo(() => providers.filter(p => !p.isBuiltIn), [providers]);

    // Custom provider form
    const [customName, setCustomName] = useState('');
    const [customUrl, setCustomUrl] = useState('');

    const handleSaveKey = useCallback((providerId: string) =>
    {
        const key = keyInputs[providerId] || '';
        const remember = rememberFlags[providerId] ?? true;
        if (0 < key.length)
        {
            SetCredentialForProvider(providerId, key, remember);
            SetAiEnabled(true);
        }
        else
        {
            RemoveCredentialForProvider(providerId);
        }
    }, [keyInputs, rememberFlags]);

    const handleTestConnection = useCallback(async (providerId: string) =>
    {
        const provider = providers.find(p => p.id === providerId);
        const key = keyInputs[providerId];
        if (!provider || !key)
            return;

        setTestStatus(prev => ({ ...prev, [providerId]: { testing: true } }));

        const result = await TestProviderConnection(provider, {
            providerId,
            apiKey: key,
            rememberKey: rememberFlags[providerId] ?? true,
        });

        setTestStatus(prev => ({
            ...prev,
            [providerId]: {
                testing: false,
                result: result.success ? 'Connected!' : `Error: ${result.error}`,
            },
        }));
    }, [providers, keyInputs, rememberFlags]);

    const handleAddCustomProvider = useCallback(() =>
    {
        if (0 === customName.trim().length || 0 === customUrl.trim().length)
            return;

        const providerId = 'custom-' + generateId();
        const defaultModel = CreateCustomModel('default', 'Default Model', providerId);
        const provider = CreateCustomProvider(providerId, customName.trim(), customUrl.trim(), [defaultModel]);
        AddProvider(provider);
        setCustomName('');
        setCustomUrl('');
    }, [customName, customUrl]);

    const inputStyle = {
        width: '100%',
        height: 28,
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        padding: '0 8px',
        fontSize: 12,
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        fontSize: 11,
        color: theme.textSecondary,
        marginBottom: 4,
        display: 'block' as const,
    };

    const sectionStyle = {
        marginBottom: 16,
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}
            onClick={(e) => { if (e.target === e.currentTarget) SetShowAiSettings(false); }}
        >
            <div style={{
                width: 520,
                maxHeight: '80vh',
                backgroundColor: theme.sidebarBg,
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${theme.border}`,
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>AI Settings</span>
                    <button
                        onClick={() => SetShowAiSettings(false)}
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 16 }}
                    >{'\u2715'}</button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${theme.border}`,
                    padding: '0 16px',
                }}>
                    {(['providers', 'completion', 'chat', 'custom'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 12px',
                                fontSize: 12,
                                color: activeTab === tab ? theme.accent : theme.textMuted,
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === tab ? theme.accent : 'transparent'}`,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

                    {/* Providers Tab */}
                    {'providers' === activeTab && (
                        <div>
                            {/* Active provider/model selection */}
                            <div style={sectionStyle}>
                                <label style={labelStyle}>Active Provider</label>
                                <select
                                    value={activeProviderId}
                                    onChange={(e) => SetActiveProvider(e.target.value)}
                                    style={inputStyle}
                                >
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Active Model</label>
                                <select
                                    value={activeModelId}
                                    onChange={(e) => SetActiveModel(e.target.value)}
                                    style={inputStyle}
                                >
                                    {providers
                                        .find(p => p.id === activeProviderId)
                                        ?.models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                </select>
                            </div>

                            {/* API Keys */}
                            <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 8, marginTop: 16 }}>
                                API Keys
                            </div>

                            {providers.map(provider => (
                                <div key={provider.id} style={{
                                    marginBottom: 12,
                                    padding: 10,
                                    backgroundColor: theme.bg,
                                    borderRadius: 6,
                                    border: `1px solid ${theme.border}`,
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 6 }}>
                                        {provider.name}
                                    </div>
                                    <input
                                        type="password"
                                        placeholder={`Enter ${provider.name} API key...`}
                                        value={keyInputs[provider.id] || ''}
                                        onChange={(e) => setKeyInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                        style={{ ...inputStyle, marginBottom: 6 }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div>
                                            <label style={{ fontSize: 11, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={rememberFlags[provider.id] ?? false}
                                                    onChange={(e) => setRememberFlags(prev => ({ ...prev, [provider.id]: e.target.checked }))}
                                                />
                                                Remember key (encrypted)
                                            </label>
                                            {rememberFlags[provider.id] && (
                                                <div style={{
                                                    marginTop: 2, fontSize: 10, color: '#f9e2af',
                                                    backgroundColor: '#f9e2af15', padding: '2px 6px', borderRadius: 3,
                                                }}>
                                                    Key will be encrypted and stored locally. Expires after {CRED_DEFAULT_AI_EXPIRY_HOURS}h.
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }} />
                                        <button
                                            onClick={() => handleTestConnection(provider.id)}
                                            disabled={!(keyInputs[provider.id]?.length)}
                                            style={{
                                                height: 24, padding: '0 8px',
                                                fontSize: 11, border: `1px solid ${theme.border}`,
                                                borderRadius: 4, cursor: 'pointer',
                                                backgroundColor: theme.bgHover, color: theme.text,
                                            }}
                                        >
                                            {testStatus[provider.id]?.testing ? 'Testing...' : 'Test'}
                                        </button>
                                        <button
                                            onClick={() => handleSaveKey(provider.id)}
                                            style={{
                                                height: 24, padding: '0 8px',
                                                fontSize: 11, border: 'none',
                                                borderRadius: 4, cursor: 'pointer',
                                                backgroundColor: theme.accent, color: theme.accentText,
                                            }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                    {testStatus[provider.id]?.result && (
                                        <div style={{
                                            marginTop: 4, fontSize: 11,
                                            color: testStatus[provider.id]?.result?.startsWith('Connected') ? '#4caf50' : '#ff6b6b',
                                        }}>
                                            {testStatus[provider.id]?.result}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Completion Tab */}
                    {'completion' === activeTab && (
                        <div>
                            <div style={sectionStyle}>
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.inlineCompletionEnabled}
                                        onChange={(e) => UpdateAISettings({ inlineCompletionEnabled: e.target.checked })}
                                    />
                                    Enable inline code completions (ghost text)
                                </label>
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Debounce delay (ms)</label>
                                <input
                                    type="number"
                                    value={aiSettings.inlineDebounceMs}
                                    onChange={(e) => UpdateAISettings({ inlineDebounceMs: parseInt(e.target.value) || 500 })}
                                    min={100}
                                    max={3000}
                                    step={100}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Max inline tokens</label>
                                <input
                                    type="number"
                                    value={aiSettings.inlineMaxTokens}
                                    onChange={(e) => UpdateAISettings({ inlineMaxTokens: parseInt(e.target.value) || 256 })}
                                    min={32}
                                    max={1024}
                                    step={32}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Code temperature ({aiSettings.codeTemperature})</label>
                                <input
                                    type="range"
                                    value={aiSettings.codeTemperature}
                                    onChange={(e) => UpdateAISettings({ codeTemperature: parseFloat(e.target.value) })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Chat Tab */}
                    {'chat' === activeTab && (
                        <div>
                            <div style={sectionStyle}>
                                <label style={labelStyle}>Chat temperature ({aiSettings.chatTemperature})</label>
                                <input
                                    type="range"
                                    value={aiSettings.chatTemperature}
                                    onChange={(e) => UpdateAISettings({ chatTemperature: parseFloat(e.target.value) })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Max context tokens</label>
                                <input
                                    type="number"
                                    value={aiSettings.maxContextTokens}
                                    onChange={(e) => UpdateAISettings({ maxContextTokens: parseInt(e.target.value) || 8000 })}
                                    min={1000}
                                    max={128000}
                                    step={1000}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Custom system prompt (optional)</label>
                                <textarea
                                    value={aiSettings.systemPrompt}
                                    onChange={(e) => UpdateAISettings({ systemPrompt: e.target.value })}
                                    placeholder="Leave empty for default"
                                    rows={4}
                                    style={{
                                        ...inputStyle,
                                        height: 'auto',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        padding: '6px 8px',
                                    }}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.showAiStatusIndicator}
                                        onChange={(e) => UpdateAISettings({ showAiStatusIndicator: e.target.checked })}
                                    />
                                    Show AI status indicator in status bar
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Custom Providers Tab */}
                    {'custom' === activeTab && (
                        <div>
                            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>
                                Add custom OpenAI-compatible providers (e.g., Ollama, LM Studio, vLLM).
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Provider Name</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="e.g., Ollama Local"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Base URL</label>
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="e.g., http://localhost:11434"
                                    style={inputStyle}
                                />
                            </div>

                            <button
                                onClick={handleAddCustomProvider}
                                disabled={0 === customName.trim().length || 0 === customUrl.trim().length}
                                style={{
                                    height: 30, padding: '0 16px',
                                    fontSize: 12, border: 'none',
                                    borderRadius: 4, cursor: 'pointer',
                                    backgroundColor: theme.accent, color: theme.accentText,
                                    marginBottom: 16,
                                }}
                            >
                                Add Provider
                            </button>

                            {/* List custom providers */}
                            {0 < customProviders.length && (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 8 }}>
                                        Custom Providers
                                    </div>
                                    {customProviders.map(p => (
                                        <div key={p.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '6px 8px',
                                            backgroundColor: theme.bg,
                                            borderRadius: 4,
                                            marginBottom: 4,
                                            border: `1px solid ${theme.border}`,
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: theme.text }}>{p.name}</div>
                                                <div style={{ fontSize: 10, color: theme.textMuted }}>{p.baseUrl}</div>
                                            </div>
                                            <button
                                                onClick={() => RemoveProvider(p.id)}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    color: '#ff6b6b', cursor: 'pointer',
                                                    fontSize: 12,
                                                }}
                                            >{'\u2715'}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
