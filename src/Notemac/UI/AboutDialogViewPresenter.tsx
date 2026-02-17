import React from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";

interface AboutDialogProps {
  theme: ThemeColors;
}

export function AboutDialog({ theme }: AboutDialogProps) {
  const { setShowAbout } = useNotemacStore();

  return (
    <div className="dialog-overlay" onClick={() => setShowAbout(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 32,
          width: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        <img src="/icon.png" alt="Notemac++" style={{ width: 72, height: 72, marginBottom: 8, borderRadius: 12 }} />
        <h2 style={{ color: theme.text, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Notemac++
        </h2>
        <div style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 20 }}>
          Version 1.0.0
        </div>

        <div style={{
          color: theme.textSecondary,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 20,
          textAlign: 'left',
          padding: '0 8px',
        }}>
          A powerful, feature-rich text and source code editor for Mac and Web,
          inspired by Notepad++.
        </div>

        <div style={{
          backgroundColor: theme.bgTertiary,
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>
            FEATURES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, color: theme.textSecondary }}>
            <span>Syntax Highlighting (70+ langs)</span>
            <span>Multi-cursor Editing</span>
            <span>Find & Replace (Regex)</span>
            <span>Code Folding</span>
            <span>Split View</span>
            <span>Minimap</span>
            <span>Macro Recording</span>
            <span>Bookmarks</span>
            <span>6 Color Themes</span>
            <span>File Explorer</span>
            <span>Function List</span>
            <span>Hash Tools</span>
            <span>Encoding Support</span>
            <span>Line Operations</span>
            <span>Drag & Drop Tabs</span>
            <span>Customizable Settings</span>
          </div>
        </div>

        <div style={{
          fontSize: 12,
          color: theme.textMuted,
          marginBottom: 16,
        }}>
          Built with React, Monaco Editor, TypeScript, and Electron
        </div>

        <div style={{
          fontSize: 13,
          color: theme.textSecondary,
          marginBottom: 6,
        }}>
          Created by <span style={{ color: theme.text, fontWeight: 600 }}>Sergio Agustin De Vita</span>
        </div>
        <a
          href="https://linkedin.com/in/sergioadevita"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            if (window.electronAPI) {
              e.preventDefault();
              const { shell } = (window as any).require?.('electron') || {};
              if (shell) shell.openExternal('https://linkedin.com/in/sergioadevita');
              else window.open('https://linkedin.com/in/sergioadevita', '_blank');
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: theme.accent,
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.accent}>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          linkedin.com/in/sergioadevita
        </a>

        <br />
        <button
          onClick={() => setShowAbout(false)}
          style={{
            backgroundColor: theme.accent,
            color: theme.accentText,
            border: 'none',
            borderRadius: 8,
            padding: '8px 32px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
