import React from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';

interface WelcomeScreenProps {
  theme: ThemeColors;
}

export function WelcomeScreen({ theme }: WelcomeScreenProps) {
  const { addTab, recentFiles, setActiveTab } = useNotemacStore();

  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? '\u2318' : 'Ctrl';

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.editorBg,
      gap: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 64,
          fontWeight: 200,
          color: theme.textMuted,
          letterSpacing: -2,
          marginBottom: 8,
        }}>
          N++
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 300,
          color: theme.textSecondary,
          marginBottom: 4,
        }}>
          Notemac++
        </h1>
        <p style={{ color: theme.textMuted, fontSize: 14 }}>
          A powerful text editor for Mac & Web
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 8,
      }}>
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
                const dirHandle = await (window as any).showDirectoryPicker();
                // This would be handled by the sidebar
                useNotemacStore.getState().setSidebarPanel('explorer');
              } catch { /* cancelled */ }
            }
          }}
        />
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div style={{
        marginTop: 24,
        padding: 24,
        backgroundColor: theme.bgSecondary,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        width: 400,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: theme.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        }}>
          Keyboard Shortcuts
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '8px 16px',
          fontSize: 13,
        }}>
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
          ].map(([key, desc], i) => (
            <React.Fragment key={i}>
              <kbd style={{
                backgroundColor: theme.bgTertiary,
                color: theme.textSecondary,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: '-apple-system, system-ui, sans-serif',
                border: `1px solid ${theme.border}`,
                textAlign: 'center',
                minWidth: 60,
              }}>
                {key}
              </kbd>
              <span style={{ color: theme.textSecondary }}>{desc}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}>
            Recent Files
          </div>
          {recentFiles.slice(0, 5).map((file, i) => (
            <div
              key={i}
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
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                color: theme.accent,
                fontSize: 13,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = theme.bgHover}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              {file.name}
              <span style={{ color: theme.textMuted, fontSize: 11, marginLeft: 8 }}>
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

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 11, color: theme.textMuted }}>{shortcut}</span>
      )}
    </button>
  );
}

async function openFileWeb(): Promise<{ name: string; content: string } | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
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
