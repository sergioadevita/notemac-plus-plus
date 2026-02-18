import React, { useState, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { SaveCredentialsWithToken, ClearCredentials, TestAuthentication, StartGitHubOAuth, PollGitHubOAuthToken } from "../Controllers/AuthController";
import type { OAuthState } from "../Controllers/AuthController";
import { GIT_DEFAULT_CORS_PROXY, CRED_DEFAULT_GIT_EXPIRY_HOURS } from "../Commons/Constants";

interface GitSettingsProps
{
    theme: ThemeColors;
}

export function GitSettingsViewPresenter({ theme }: GitSettingsProps)
{
    const setShowGitSettings = useNotemacStore(s => s.setShowGitSettings);
    const gitCredentials = useNotemacStore(s => s.gitCredentials);
    const gitAuthor = useNotemacStore(s => s.gitAuthor);
    const gitSettings = useNotemacStore(s => s.gitSettings);
    const browserWorkspaces = useNotemacStore(s => s.browserWorkspaces);

    const [activeTab, setActiveTab] = useState<'credentials' | 'author' | 'behavior' | 'workspaces'>('credentials');
    const [authType, setAuthType] = useState(gitCredentials?.type || 'token');
    const [username, setUsername] = useState(gitCredentials?.username || '');
    const [token, setToken] = useState(gitCredentials?.token || '');
    const [authorName, setAuthorName] = useState(gitAuthor.name);
    const [authorEmail, setAuthorEmail] = useState(gitAuthor.email);
    const [autoFetch, setAutoFetch] = useState(gitSettings.autoFetch);
    const [corsProxy, setCorsProxy] = useState(gitSettings.corsProxy);
    const [showUntracked, setShowUntracked] = useState(gitSettings.showUntracked);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [testUrl, setTestUrl] = useState('');
    const [rememberCredentials, setRememberCredentials] = useState(false);
    const [oauthState, setOauthState] = useState<OAuthState | null>(null);
    const [oauthStatus, setOauthStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
    const [oauthError, setOauthError] = useState('');

    const handleClose = useCallback(() => setShowGitSettings(false), [setShowGitSettings]);

    const handleSaveCredentials = useCallback(async () =>
    {
        await SaveCredentialsWithToken({ type: authType as any, username, token }, rememberCredentials);
    }, [authType, username, token, rememberCredentials]);

    const handleStartOAuth = useCallback(async () =>
    {
        setOauthStatus('waiting');
        setOauthError('');
        const state = await StartGitHubOAuth();
        if (null === state)
        {
            setOauthStatus('error');
            setOauthError('OAuth not configured. Set VITE_GITHUB_OAUTH_CLIENT_ID or use a Personal Access Token instead.');
            return;
        }
        setOauthState(state);

        // Poll for token
        const pollInterval = (state.interval || 5) * 1000;
        const maxAttempts = Math.ceil(state.expiresIn / (state.interval || 5));
        let attempts = 0;

        const poll = async () =>
        {
            if (attempts >= maxAttempts)
            {
                setOauthStatus('error');
                setOauthError('Authorization timed out. Please try again.');
                return;
            }
            attempts++;
            const tokenResult = await PollGitHubOAuthToken(state.deviceCode);
            if (null !== tokenResult)
            {
                setOauthStatus('success');
                setToken(tokenResult);
                setAuthType('oauth');
                setUsername('oauth');
            }
            else if ('waiting' === oauthStatus)
            {
                setTimeout(poll, pollInterval);
            }
        };
        setTimeout(poll, pollInterval);
    }, [oauthStatus]);

    const handleSaveAuthor = useCallback(() =>
    {
        useNotemacStore.getState().SetGitAuthor({ name: authorName, email: authorEmail });
    }, [authorName, authorEmail]);

    const handleSaveBehavior = useCallback(() =>
    {
        useNotemacStore.getState().UpdateGitSettings({
            autoFetch,
            corsProxy,
            showUntracked,
        });
    }, [autoFetch, corsProxy, showUntracked]);

    const handleTestAuth = useCallback(async () =>
    {
        if (0 === testUrl.trim().length || 0 === token.trim().length)
            return;
        setTestResult(null);
        const result = await TestAuthentication(testUrl.trim(), { type: 'token', username, token });
        setTestResult(result);
    }, [testUrl, username, token]);

    const inputStyle = {
        width: '100%', height: 30, backgroundColor: theme.bgSecondary, color: theme.text,
        border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0 10px',
        fontSize: 12, boxSizing: 'border-box' as const,
    };

    const labelStyle = { fontSize: 12, color: theme.textSecondary, display: 'block' as const, marginBottom: 4 };

    const tabs = [
        { id: 'credentials' as const, label: 'Credentials' },
        { id: 'author' as const, label: 'Author' },
        { id: 'behavior' as const, label: 'Behavior' },
        { id: 'workspaces' as const, label: 'Workspaces' },
    ];

    return (
        <div
            onClick={handleClose}
            style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 500, maxHeight: '80vh', backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`, borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '12px 16px', borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Git Settings</span>
                    <span onClick={handleClose} style={{ cursor: 'pointer', color: theme.textMuted, fontSize: 18 }}>✕</span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}` }}>
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '8px 16px', fontSize: 12, cursor: 'pointer',
                                color: activeTab === tab.id ? theme.accent : theme.textSecondary,
                                borderBottom: activeTab === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                            }}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ padding: 16, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {'credentials' === activeTab && (
                        <>
                            <div>
                                <label style={labelStyle}>Authentication Type</label>
                                <select
                                    value={authType}
                                    onChange={(e) => setAuthType(e.target.value as any)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="token">Personal Access Token (PAT)</option>
                                    <option value="oauth">OAuth (GitHub)</option>
                                    <option value="ssh">SSH Key (Electron only)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="github-username" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>{'token' === authType ? 'Personal Access Token' : 'oauth' === authType ? 'OAuth Token' : 'SSH Private Key Path'}</label>
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder={'ssh' === authType ? '~/.ssh/id_rsa' : 'ghp_xxxx...'}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={rememberCredentials}
                                        onChange={(e) => setRememberCredentials(e.target.checked)}
                                    />
                                    Remember credentials (encrypted)
                                </label>
                                {rememberCredentials && (
                                    <div style={{
                                        marginTop: 4, padding: '4px 8px', borderRadius: 4, fontSize: 10,
                                        backgroundColor: '#f9e2af22', color: '#f9e2af',
                                    }}>
                                        Token will be encrypted and stored locally. Expires after {CRED_DEFAULT_GIT_EXPIRY_HOURS} hours.
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleSaveCredentials} style={{
                                    height: 28, padding: '0 12px', backgroundColor: theme.accent, color: theme.accentText,
                                    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Save Credentials
                                </button>
                                <button onClick={() => ClearCredentials()} style={{
                                    height: 28, padding: '0 12px', backgroundColor: theme.bgHover, color: theme.text,
                                    border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
                                }}>
                                    Clear
                                </button>
                            </div>
                            {/* OAuth section */}
                            {'oauth' === authType && (
                                <div style={{ marginTop: 8, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                                    <label style={labelStyle}>GitHub OAuth (Device Flow)</label>
                                    {'idle' === oauthStatus && (
                                        <button onClick={handleStartOAuth} style={{
                                            height: 28, padding: '0 12px', backgroundColor: theme.bgHover, color: theme.text,
                                            border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
                                        }}>
                                            Connect with GitHub
                                        </button>
                                    )}
                                    {'waiting' === oauthStatus && null !== oauthState && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: 12, color: theme.text }}>
                                                Enter this code on GitHub:
                                            </div>
                                            <div style={{
                                                fontSize: 20, fontWeight: 700, fontFamily: 'monospace',
                                                color: theme.accent, letterSpacing: 4, textAlign: 'center',
                                                padding: '8px 0', backgroundColor: theme.bgSecondary, borderRadius: 6,
                                            }}>
                                                {oauthState.userCode}
                                            </div>
                                            <a
                                                href={oauthState.verificationUri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: theme.accent, fontSize: 12, textDecoration: 'underline' }}
                                            >
                                                Open GitHub verification page
                                            </a>
                                            <div style={{ fontSize: 11, color: theme.textMuted }}>
                                                Waiting for authorization...
                                            </div>
                                            <button onClick={() => { setOauthStatus('idle'); setOauthState(null); }} style={{
                                                height: 24, padding: '0 8px', backgroundColor: theme.bgHover, color: theme.text,
                                                border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer',
                                                alignSelf: 'flex-start',
                                            }}>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    {'success' === oauthStatus && (
                                        <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, backgroundColor: '#a6e3a122', color: '#a6e3a1' }}>
                                            Connected successfully via GitHub OAuth
                                        </div>
                                    )}
                                    {'error' === oauthStatus && (
                                        <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, backgroundColor: '#f38ba822', color: '#f38ba8' }}>
                                            {oauthError}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Test auth */}
                            <div style={{ marginTop: 8, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                                <label style={labelStyle}>Test Authentication</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                        value={testUrl}
                                        onChange={(e) => setTestUrl(e.target.value)}
                                        placeholder="https://github.com/user/repo.git"
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button onClick={handleTestAuth} style={{
                                        height: 30, padding: '0 12px', backgroundColor: theme.bgHover, color: theme.text,
                                        border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        Test
                                    </button>
                                </div>
                                {null !== testResult && (
                                    <div style={{
                                        marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11,
                                        backgroundColor: testResult.success ? '#a6e3a122' : '#f38ba822',
                                        color: testResult.success ? '#a6e3a1' : '#f38ba8',
                                    }}>
                                        {testResult.success ? '✓ Authentication successful' : `✕ ${testResult.error}`}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {'author' === activeTab && (
                        <>
                            <div>
                                <label style={labelStyle}>Author Name</label>
                                <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your Name" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Author Email</label>
                                <input value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                            </div>
                            <button onClick={handleSaveAuthor} style={{
                                height: 28, padding: '0 12px', backgroundColor: theme.accent, color: theme.accentText,
                                border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                alignSelf: 'flex-start',
                            }}>
                                Save Author Info
                            </button>
                        </>
                    )}

                    {'behavior' === activeTab && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={autoFetch} onChange={(e) => setAutoFetch(e.target.checked)} id="auto-fetch" />
                                <label htmlFor="auto-fetch" style={{ fontSize: 12, color: theme.text }}>Auto-fetch from remote (every 5 minutes)</label>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={showUntracked} onChange={(e) => setShowUntracked(e.target.checked)} id="show-untracked" />
                                <label htmlFor="show-untracked" style={{ fontSize: 12, color: theme.text }}>Show untracked files</label>
                            </div>
                            <div>
                                <label style={labelStyle}>CORS Proxy URL</label>
                                <input value={corsProxy} onChange={(e) => setCorsProxy(e.target.value)} placeholder={GIT_DEFAULT_CORS_PROXY} style={inputStyle} />
                                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                                    Required for web-based git operations. Default: {GIT_DEFAULT_CORS_PROXY}
                                </div>
                            </div>
                            <button onClick={handleSaveBehavior} style={{
                                height: 28, padding: '0 12px', backgroundColor: theme.accent, color: theme.accentText,
                                border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                alignSelf: 'flex-start',
                            }}>
                                Save Settings
                            </button>
                        </>
                    )}

                    {'workspaces' === activeTab && (
                        <>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                                Browser workspaces are stored in IndexedDB. They are only available in this browser.
                            </div>
                            {0 === browserWorkspaces.length ? (
                                <div style={{ color: theme.textMuted, fontSize: 12, padding: 8, textAlign: 'center' }}>
                                    No browser workspaces
                                </div>
                            ) : (
                                browserWorkspaces.map(ws => (
                                    <div key={ws.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                                        borderRadius: 4, border: `1px solid ${theme.border}`,
                                    }}>
                                        <span style={{ fontSize: 14 }}>📁</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{ws.name}</div>
                                            {ws.repoUrl && (
                                                <div style={{ fontSize: 10, color: theme.textMuted }}>{ws.repoUrl}</div>
                                            )}
                                            <div style={{ fontSize: 10, color: theme.textMuted }}>
                                                Last opened: {new Date(ws.lastOpenedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => useNotemacStore.getState().RemoveBrowserWorkspace(ws.id)}
                                            style={{
                                                height: 22, padding: '0 8px', backgroundColor: '#f38ba822', color: '#f38ba8',
                                                border: 'none', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
