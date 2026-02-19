import React, { useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';
import './hover-utilities.css';

interface WelcomeScreenProps {
  theme: ThemeColors;
}

export function WelcomeScreen({ theme }: WelcomeScreenProps) {
  const { addTab, recentFiles } = useNotemacStore();
  const styles = useStyles(theme);

  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? '\u2318' : 'Ctrl';

  return (
    <div style={styles.container}>
      <div style={styles.headerWrapper}>
        <div style={styles.logo}>
          N++
        </div>
        <h1 style={styles.title}>
          Notemac++
        </h1>
        <p style={styles.subtitle}>
          A powerful text editor for Mac & Web
        </p>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActionsSection}>
        <WelcomeButton
          theme={theme}
          label="New File"
          shortcut={`${mod}N`}
          onClick={() => addTab()}
        />
        <WelcomeButton
          theme={theme}
          label="Open File"
          shortcut={`${mod}O`}
          onClick={() => {
            // Trigger file open
            if (window.electronAPI) {
              // Electron will handle via menu
            } else {
              openFileWeb().then(file => {
                if (file) {
                  addTab({
                    name: file.name,
                    content: file.content,
                    language: detectLanguage(file.name),
                    lineEnding: detectLineEnding(file.content),
                  });
                }
              });
            }
          }}
        />
        <WelcomeButton
          theme={theme}
          label="Open Folder"
          onClick={async () => {
            if ('showDirectoryPicker' in window) {
              try {
                await window.showDirectoryPicker!();
                // This would be handled by the sidebar
                useNotemacStore.getState().setSidebarPanel('explorer');
              } catch { /* cancelled */ }
            }
          }}
        />
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div style={styles.shortcutsContainer}>
        <div style={styles.shortcutsTitle}>
          Keyboard Shortcuts
        </div>
        <div style={styles.shortcutsGrid}>
          {[
            [`${mod}N`, 'New file'],
            [`${mod}O`, 'Open file'],
            [`${mod}S`, 'Save'],
            [`${mod}F`, 'Find'],
            [`${mod}H`, 'Find & Replace'],
            [`${mod}G`, 'Go to line'],
            [`${mod}D`, 'Duplicate line'],
            [`${mod}B`, 'Toggle sidebar'],
            [`${mod},`, 'Preferences'],
          ].map(([key, desc]) => (
            <React.Fragment key={`shortcut-${key}`}>
              <kbd style={styles.shortcutKey}>
                {key}
              </kbd>
              <span style={styles.shortcutDesc}>{desc}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div style={styles.recentFilesWrapper}>
          <div style={styles.recentFilesTitle}>
            Recent Files
          </div>
          {recentFiles.slice(0, 5).map((file) => (
            <div
              key={`recent-${file.path || file.name}`}
              onClick={async () => {
                if (window.electronAPI) {
                  const content = await window.electronAPI.readFile(file.path);
                  addTab({
                    name: file.name,
                    path: file.path,
                    content,
                    language: detectLanguage(file.name),
                    lineEnding: detectLineEnding(content),
                  });
                }
              }}
              className="hover-bg hover-bg-reset"
              style={styles.recentFileItem}
            >
              {file.name}
              <span style={styles.recentFilePath}>
                {file.path}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WelcomeButton({ theme, label, shortcut, onClick }: {
  theme: ThemeColors;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const buttonStyles = useMemo(() => ({
    button: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center' as const,
      gap: 6,
      padding: '12px 20px',
      backgroundColor: hovered ? theme.bgHover : theme.bgSecondary,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 13,
      transition: 'background-color 0.15s ease',
      minWidth: 110,
    } as React.CSSProperties,
    shortcutLabel: {
      fontSize: 11,
      color: theme.textMuted,
    } as React.CSSProperties,
  }), [hovered, theme]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyles.button}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={buttonStyles.shortcutLabel}>{shortcut}</span>
      )}
    </button>
  );
}

function useStyles(theme: ThemeColors) {
  return useMemo(() => ({
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.editorBg,
      gap: 24,
    } as React.CSSProperties,
    headerWrapper: {
      textAlign: 'center' as const,
    } as React.CSSProperties,
    logo: {
      fontSize: 64,
      fontWeight: 200,
      color: theme.textMuted,
      letterSpacing: -2,
      marginBottom: 8,
    } as React.CSSProperties,
    title: {
      fontSize: 28,
      fontWeight: 300,
      color: theme.textSecondary,
      marginBottom: 4,
    } as React.CSSProperties,
    subtitle: {
      color: theme.textMuted,
      fontSize: 14,
    } as React.CSSProperties,
    quickActionsSection: {
      display: 'flex',
      gap: 12,
      marginTop: 8,
    } as React.CSSProperties,
    shortcutsContainer: {
      marginTop: 24,
      padding: 24,
      backgroundColor: theme.bgSecondary,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      width: 400,
    } as React.CSSProperties,
    shortcutsTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: theme.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: 12,
    } as React.CSSProperties,
    shortcutsGrid: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: '8px 16px',
      fontSize: 13,
    } as React.CSSProperties,
    shortcutKey: {
      backgroundColor: theme.bgTertiary,
      color: theme.textSecondary,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 12,
      fontFamily: '-apple-system, system-ui, sans-serif',
      border: `1px solid ${theme.border}`,
      textAlign: 'center' as const,
      minWidth: 60,
    } as React.CSSProperties,
    shortcutDesc: {
      color: theme.textSecondary,
    } as React.CSSProperties,
    recentFilesWrapper: {
      marginTop: 8,
    } as React.CSSProperties,
    recentFilesTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: theme.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: 8,
    } as React.CSSProperties,
    recentFileItem: {
      padding: '6px 12px',
      cursor: 'pointer',
      color: theme.accent,
      fontSize: 13,
      borderRadius: 4,
      '--hover-bg': theme.bgHover,
    } as React.CSSProperties,
    recentFilePath: {
      color: theme.textMuted,
      fontSize: 11,
      marginLeft: 8,
    } as React.CSSProperties,
  }), [theme]);
}

async function openFileWeb(): Promise<{ name: string; content: string } | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const [fileHandle] = await window.showOpenFilePicker!({
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const content = await file.text();
      return { name: file.name, content };
    } catch {
      return null;
    }
  }

  // Fallback: use a hidden file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { resolve(null); return; }
      const content = await file.text();
      resolve({ name: file.name, content });
    };
    input.click();
  });
}
