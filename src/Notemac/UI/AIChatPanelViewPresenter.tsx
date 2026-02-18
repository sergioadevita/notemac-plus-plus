import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { AIMessage, AIConversation } from "../Commons/Types";
import { UI_COPY_FEEDBACK_MS } from "../Commons/Constants";
import { SendChatMessage } from "../Controllers/AIActionController";
import { CancelActiveRequest } from "../Controllers/LLMController";
import { GetEditorAction, GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';

interface AIChatPanelProps
{
    theme: ThemeColors;
}

export function AIChatPanelViewPresenter({ theme }: AIChatPanelProps)
{
    const {
        aiEnabled,
        conversations,
        activeConversationId,
        isAiStreaming,
        aiStreamContent,
        aiOperationError,
        activeProviderId,
        activeModelId,
        providers,
        credentials,
        SetActiveConversation,
        AddConversation,
        RemoveConversation,
        SetAiOperationError,
        SetShowAiSettings,
        GetActiveProvider,
        GetCredentialForProvider,
    } = useNotemacStore();

    const [inputValue, setInputValue] = useState('');
    const [showConversationList, setShowConversationList] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
    const activeProvider = GetActiveProvider();
    const hasCredential = null !== activeProvider && null !== GetCredentialForProvider(activeProvider.id);
    const trimmedInput = inputValue.trim();
    const hasInput = 0 < trimmedInput.length;

    // Auto-scroll to bottom on new messages
    useEffect(() =>
    {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages?.length, aiStreamContent]);

    const handleSend = useCallback(async () =>
    {
        if (!hasInput || true === isAiStreaming)
            return;

        setInputValue('');
        SetAiOperationError(null);

        try
        {
            await SendChatMessage(trimmedInput);
        }
        catch
        {
            // Error is handled in AIActionController
        }
    }, [trimmedInput, hasInput, isAiStreaming]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if ('Enter' === e.key && !e.shiftKey)
        {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleCancel = useCallback(() =>
    {
        CancelActiveRequest();
    }, []);

    const handleNewConversation = useCallback(() =>
    {
        SetActiveConversation(null);
        setShowConversationList(false);
        inputRef.current?.focus();
    }, []);

    // ─── No Credential View ──────────────────────────────────────

    if (false === hasCredential)
    {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                gap: 12,
                height: '100%',
            }}>
                <div style={{ fontSize: 24 }}>{'\u2728'}</div>
                <div style={{ color: theme.text, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    AI Assistant
                </div>
                <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                    Configure an API key to start using AI features.
                </div>
                <button
                    onClick={() => SetShowAiSettings(true)}
                    style={{
                        backgroundColor: theme.accent,
                        color: theme.accentText,
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    Open AI Settings
                </button>
            </div>
        );
    }

    // ─── Conversation List View ──────────────────────────────────

    if (true === showConversationList)
    {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.border}`,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>Conversations</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={handleNewConversation}
                            title="New Conversation"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: theme.accent,
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: '2px 6px',
                            }}
                        >+</button>
                        <button
                            onClick={() => setShowConversationList(false)}
                            title="Back to Chat"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: theme.textMuted,
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: '2px 6px',
                            }}
                        >{'\u2715'}</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {0 === conversations.length ? (
                        <div style={{ padding: 16, color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() =>
                                {
                                    SetActiveConversation(conv.id);
                                    setShowConversationList(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: `1px solid ${theme.border}`,
                                    backgroundColor: conv.id === activeConversationId ? theme.bgActive : 'transparent',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{
                                        fontSize: 12,
                                        color: theme.text,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {conv.title}
                                    </div>
                                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                                        {conv.messages.length} messages {'\u00b7'} {new Date(conv.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) =>
                                    {
                                        e.stopPropagation();
                                        RemoveConversation(conv.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: theme.textMuted,
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        padding: '2px 4px',
                                        flexShrink: 0,
                                    }}
                                >{'\u2715'}</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // ─── Main Chat View ──────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.border}`,
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                        {activeConversation ? activeConversation.title : 'New Chat'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={() => setShowConversationList(true)}
                        title="Conversation History"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: 13,
                            padding: '2px 6px',
                        }}
                    >{'\ud83d\udccb'}</button>
                    <button
                        onClick={handleNewConversation}
                        title="New Conversation"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: theme.accent,
                            cursor: 'pointer',
                            fontSize: 13,
                            padding: '2px 6px',
                        }}
                    >+</button>
                    <button
                        onClick={() => SetShowAiSettings(true)}
                        title="AI Settings"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: 13,
                            padding: '2px 6px',
                        }}
                    >{'\u2699'}</button>
                </div>
            </div>

            {/* Model indicator */}
            <div style={{
                padding: '4px 12px',
                fontSize: 10,
                color: theme.textMuted,
                borderBottom: `1px solid ${theme.border}`,
                flexShrink: 0,
            }}>
                {activeProvider?.name || 'No provider'} {'\u00b7'} {activeModelId}
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '8px 0',
            }}>
                {null === activeConversation || 0 === activeConversation.messages.length ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        padding: 24,
                        gap: 8,
                    }}>
                        <div style={{ fontSize: 20 }}>{'\u2728'}</div>
                        <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                            Ask me anything about your code, or use the context menu on selected code for AI actions.
                        </div>
                    </div>
                ) : (
                    activeConversation.messages.map((msg, idx) => (
                        <MessageBubbleMemo
                            key={msg.id}
                            message={msg}
                            theme={theme}
                            isStreaming={true === isAiStreaming && idx === activeConversation.messages.length - 1 && 'assistant' === msg.role}
                            streamContent={true === isAiStreaming && idx === activeConversation.messages.length - 1 ? aiStreamContent : undefined}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error display */}
            {null !== aiOperationError && (
                <div style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    color: '#ff6b6b',
                    backgroundColor: 'rgba(255,107,107,0.1)',
                    borderTop: '1px solid rgba(255,107,107,0.2)',
                    flexShrink: 0,
                }}>
                    {'\u26a0'} {aiOperationError}
                </div>
            )}

            {/* Input area */}
            <div style={{
                borderTop: `1px solid ${theme.border}`,
                padding: 8,
                flexShrink: 0,
            }}>
                <div style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'flex-end',
                }}>
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your code..."
                        rows={2}
                        style={{
                            flex: 1,
                            backgroundColor: theme.bg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            resize: 'none',
                            outline: 'none',
                            lineHeight: 1.4,
                        }}
                    />
                    {true === isAiStreaming ? (
                        <button
                            onClick={handleCancel}
                            title="Cancel"
                            style={{
                                backgroundColor: '#ff6b6b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                flexShrink: 0,
                                height: 32,
                            }}
                        >{'\u25a0'}</button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={false === hasInput}
                            title="Send (Enter)"
                            style={{
                                backgroundColor: true === hasInput ? theme.accent : theme.bgHover,
                                color: true === hasInput ? theme.accentText : theme.textMuted,
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 12px',
                                cursor: true === hasInput ? 'pointer' : 'default',
                                fontSize: 12,
                                fontWeight: 600,
                                flexShrink: 0,
                                height: 32,
                            }}
                        >{'\u2191'}</button>
                    )}
                </div>
                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: 'center' }}>
                    Enter to send {'\u00b7'} Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}

// ─── Message Bubble ──────────────────────────────────────────────

interface MessageBubbleProps
{
    message: AIMessage;
    theme: ThemeColors;
    isStreaming?: boolean;
    streamContent?: string;
}

const MessageBubbleMemo = memo(function MessageBubble({ message, theme, isStreaming, streamContent }: MessageBubbleProps)
{
    const isUser = 'user' === message.role;
    const displayContent = true === isStreaming && undefined !== streamContent ? streamContent : message.content;

    // Parse code blocks for rendering — memoize to avoid re-parsing on unrelated re-renders
    const parts = useMemo(() => parseMessageContent(displayContent), [displayContent]);

    return (
        <div style={{
            padding: '8px 12px',
            marginBottom: 4,
        }}>
            {/* Role label */}
            <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: true === isUser ? theme.accent : theme.textSecondary,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
            }}>
                {true === isUser ? 'You' : 'AI'}
                {true === isStreaming && (
                    <span style={{ fontWeight: 400, marginLeft: 6, color: theme.textMuted }}>
                        typing...
                    </span>
                )}
            </div>

            {/* Message content */}
            <div style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: theme.text,
                wordBreak: 'break-word',
            }}>
                {parts.map((part, idx) =>
                {
                    if ('code' === part.type)
                    {
                        return (
                            <CodeBlockDisplayMemo
                                key={idx}
                                code={part.content}
                                language={part.language || ''}
                                theme={theme}
                            />
                        );
                    }
                    return (
                        <span
                            key={idx}
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            {part.content}
                        </span>
                    );
                })}
            </div>
        </div>
    );
});

// ─── Code Block Display ─────────────────────────────────────────

interface CodeBlockDisplayProps
{
    code: string;
    language: string;
    theme: ThemeColors;
}

const CodeBlockDisplayMemo = memo(function CodeBlockDisplay({ code, language, theme }: CodeBlockDisplayProps)
{
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() =>
    {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), UI_COPY_FEEDBACK_MS);
    }, [code]);

    const handleInsert = useCallback(() =>
    {
        const editorAction = GetEditorAction();
        if (null !== editorAction)
        {
            // Use a temporary approach: paste at cursor
            const editor = GetMonacoEditor();
            if (null !== editor)
            {
                const selection = editor.getSelection();
                if (null !== selection)
                {
                    editor.executeEdits('ai-insert', [{
                        range: selection,
                        text: code,
                    }]);
                }
            }
        }
    }, [code]);

    return (
        <div style={{
            margin: '8px 0',
            borderRadius: 6,
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
        }}>
            {/* Code header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                backgroundColor: theme.bgSecondary,
                borderBottom: `1px solid ${theme.border}`,
            }}>
                <span style={{ fontSize: 10, color: theme.textMuted, textTransform: 'uppercase' }}>
                    {language || 'code'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={handleInsert}
                        title="Insert at cursor"
                        style={{
                            background: 'none',
                            border: `1px solid ${theme.border}`,
                            borderRadius: 3,
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: 10,
                            padding: '2px 6px',
                        }}
                    >Insert</button>
                    <button
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        style={{
                            background: 'none',
                            border: `1px solid ${theme.border}`,
                            borderRadius: 3,
                            color: true === copied ? theme.accent : theme.textMuted,
                            cursor: 'pointer',
                            fontSize: 10,
                            padding: '2px 6px',
                        }}
                    >{true === copied ? 'Copied!' : 'Copy'}</button>
                </div>
            </div>

            {/* Code content */}
            <pre style={{
                margin: 0,
                padding: 8,
                backgroundColor: theme.bg,
                fontSize: 11,
                fontFamily: "'SF Mono', 'Menlo', monospace",
                color: theme.text,
                overflow: 'auto',
                lineHeight: 1.4,
                maxHeight: 300,
            }}>
                <code>{code}</code>
            </pre>
        </div>
    );
});

// ─── Content Parsing ─────────────────────────────────────────────

interface ContentPart
{
    type: 'text' | 'code';
    content: string;
    language?: string;
}

function parseMessageContent(content: string): ContentPart[]
{
    const parts: ContentPart[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while (null !== (match = codeBlockRegex.exec(content)))
    {
        // Text before code block
        if (match.index > lastIndex)
        {
            const text = content.substring(lastIndex, match.index);
            if (0 < text.length)
                parts.push({ type: 'text', content: text });
        }

        // Code block
        parts.push({
            type: 'code',
            content: match[2].trim(),
            language: match[1] || undefined,
        });

        lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < content.length)
    {
        const remaining = content.substring(lastIndex);
        if (0 < remaining.length)
            parts.push({ type: 'text', content: remaining });
    }

    // If no parts at all, return the whole content as text
    if (0 === parts.length && 0 < content.length)
        parts.push({ type: 'text', content });

    return parts;
}
