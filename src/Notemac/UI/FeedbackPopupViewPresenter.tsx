import React, { useEffect, useState, useRef } from 'react';
import type { ThemeColors } from "../Configs/ThemeConfig";
import { UI_ZINDEX_MODAL } from "../Commons/Constants";
import './hover-utilities.css';
import { useFocusTrap } from './hooks/useFocusTrap';

interface FeedbackPopupProps
{
    theme: ThemeColors;
}

const FEEDBACK_TIMER_MS = 20 * 60 * 1000;
const FEEDBACK_STORAGE_KEY = 'notemac_feedback_shown_version';
const APP_VERSION = '2.4.0';

export function FeedbackPopup({ theme }: FeedbackPopupProps)
{
    const [visible, setVisible] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const shownForVersion = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (shownForVersion === APP_VERSION)
            return;

        const timer = setTimeout(() =>
        {
            setVisible(true);
            localStorage.setItem(FEEDBACK_STORAGE_KEY, APP_VERSION);
        }, FEEDBACK_TIMER_MS);

        return () => clearTimeout(timer);
    }, []);

    useFocusTrap(dialogRef, visible, () => setVisible(false));

    if (!visible)
        return null;

    const shareText = "I've been using Notemac++ and it's an awesome text editor for Mac & Web! Check it out:";
    const shareUrl = 'https://sergioadevita.github.io/notemac-plus-plus/';
    const emailSubject = encodeURIComponent('Check out Notemac++!');
    const emailBody = encodeURIComponent(`Hey!\n\n${shareText}\n${shareUrl}\n\nGive it a try!`);

    const actions = [
        {
            id: 'github',
            label: 'Open an issue',
            sublabel: 'Report bugs or request features',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill={theme.text}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
            ),
            href: 'https://github.com/sergioadevita/notemac-plus-plus/issues/new',
            color: theme.bgTertiary,
            textColor: theme.text,
            borderColor: theme.border,
        },
        {
            id: 'twitter',
            label: 'Share on X',
            sublabel: 'Tell the world about it',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            ),
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            color: '#000',
            textColor: '#fff',
            borderColor: '#333',
        },
        {
            id: 'email',
            label: 'Share via email',
            sublabel: 'Send to a friend',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.accent}>
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
            ),
            href: `mailto:?subject=${emailSubject}&body=${emailBody}`,
            color: theme.bgTertiary,
            textColor: theme.text,
            borderColor: theme.border,
        },
        {
            id: 'donate',
            label: 'Buy me a coffee',
            sublabel: 'Support development',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
                </svg>
            ),
            href: 'https://ko-fi.com/sergioadevita',
            color: '#FF5E5B',
            textColor: '#fff',
            borderColor: '#FF5E5B',
        },
    ];

    return (
        <div
            className="dialog-overlay"
            onClick={() => setVisible(false)}
            style={{ zIndex: UI_ZINDEX_MODAL }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    padding: 32,
                    width: 440,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    animation: 'feedbackSlideIn 0.4s ease-out',
                }}
            >
                <style>{`
                    @keyframes feedbackSlideIn {
                        from { opacity: 0; transform: translateY(30px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                <div style={{ fontSize: 48, marginBottom: 8 }}>
                    🐙
                </div>

                <h2 id="feedback-title" style={{
                    color: theme.text,
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 8,
                }}>
                    Hey, you're still here!
                </h2>

                <p style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 8,
                    padding: '0 8px',
                }}>
                    You've been coding for 20 minutes straight — that's either dedication or a really nasty bug.
                    Either way, we're glad you're using <span style={{ color: theme.accent, fontWeight: 600 }}>Notemac++</span>!
                </p>

                <p style={{
                    color: theme.textMuted,
                    fontSize: 13,
                    marginBottom: 24,
                }}>
                    If this octopus has been helpful, here are some ways to spread the love:
                </p>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: 24,
                }}>
                    {actions.map((action) =>
                    {
                        let isHovered = hoveredButton === action.id;
                        return (
                            <a
                                key={action.id}
                                href={action.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    backgroundColor: action.color,
                                    color: action.textColor,
                                    border: `1px solid ${action.borderColor}`,
                                    borderRadius: 10,
                                    padding: '10px 16px',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    transform: isHovered ? 'translateX(4px)' : 'none',
                                    opacity: isHovered ? 0.9 : 1,
                                }}
                                onMouseEnter={() => setHoveredButton(action.id)}
                                onMouseLeave={() => setHoveredButton(null)}
                            >
                                <div style={{ flexShrink: 0 }}>{action.icon}</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{action.label}</div>
                                    <div style={{ fontSize: 11, opacity: 0.7 }}>{action.sublabel}</div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                <button
                    onClick={() => setVisible(false)}
                    className="hover-color"
                    style={{
                        backgroundColor: 'transparent',
                        color: theme.textMuted,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: '6px 16px',
                        transition: 'color 0.2s',
                        '--hover-color': theme.text,
                    } as React.CSSProperties}
                >
                    Maybe later — I'm in the zone
                </button>
            </div>
        </div>
    );
}
