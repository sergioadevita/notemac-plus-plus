import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';
import { APP_VERSION } from '../Notemac/Commons/Constants';

interface AboutDialogProps {
  theme: ThemeColors;
}

export function AboutDialog({ theme }: AboutDialogProps) {
  const { setShowAbout } = useEditorStore();

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
          Version {APP_VERSION}
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
            <span>Git Integration</span>
            <span>AI Assistant (Multi-provider)</span>
            <span>Integrated Terminal</span>
            <span>Code Snippets</span>
            <span>Multi-cursor Editing</span>
            <span>Find & Replace (Regex)</span>
            <span>Code Folding</span>
            <span>Split View</span>
            <span>Minimap</span>
            <span>Macro Recording</span>
            <span>Bookmarks</span>
            <span>6 Color Themes</span>
            <span>File Explorer</span>
            <span>Clipboard History</span>
            <span>Encrypted Credentials</span>
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
          Built with React, Monaco Editor, TypeScript, Electron, isomorphic-git, and Xterm.js
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: theme.accent,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.accent}>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          linkedin.com/in/sergioadevita
        </a>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          <a
            href="https://ko-fi.com/sergioadevita"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FF5E5B',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
            </svg>
            Donate
          </a>
          <a
            href="https://github.com/sergioadevita/notemac-plus-plus/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.bgTertiary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.textSecondary}>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            Give Feedback
          </a>
        </div>

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
