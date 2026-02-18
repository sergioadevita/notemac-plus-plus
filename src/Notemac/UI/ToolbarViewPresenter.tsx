import React from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";

interface ToolbarProps {
  theme: ThemeColors;
  onAction: (action: string, value?: boolean | string | number) => void;
}

// SVG icon components — crisp on all platforms, no emoji dependency
const Icons = {
  newFile: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" />
      <path d="M9 1v4h4" />
      <path d="M8 8v4M6 10h4" />
    </svg>
  ),
  open: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13V4a1 1 0 011-1h3.5l1.5 1.5H13a1 1 0 011 1V13a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
    </svg>
  ),
  save: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h7l3 3v8a1 1 0 01-1 1z" />
      <path d="M11 14V9H5v5" />
      <path d="M5 2v3h5" />
    </svg>
  ),
  saveAll: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14H4a1 1 0 01-1-1V4a1 1 0 011-1h5.5l2.5 2.5V13a1 1 0 01-1 1z" />
      <path d="M10 14V10H6v4" />
      <path d="M6 3v2h3.5" />
      <path d="M14 5v7.5" opacity="0.5" />
      <path d="M5 2H14.5" opacity="0.5" />
    </svg>
  ),
  undo: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h6a3.5 3.5 0 010 7H7" />
      <path d="M6 4L3 7l3 3" />
    </svg>
  ),
  redo: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7H7a3.5 3.5 0 000 7h2" />
      <path d="M10 4l3 3-3 3" />
    </svg>
  ),
  find: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4" />
      <path d="M14 14l-3.5-3.5" />
    </svg>
  ),
  replace: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="5.5" r="3" />
      <path d="M14 14l-2.8-2.8" />
      <path d="M10 7l2-2 2 2" />
      <path d="M12 5v5.5a1.5 1.5 0 01-3 0" />
    </svg>
  ),
  zoomIn: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4" />
      <path d="M14 14l-3.5-3.5" />
      <path d="M7 5v4M5 7h4" />
    </svg>
  ),
  zoomOut: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4" />
      <path d="M14 14l-3.5-3.5" />
      <path d="M5 7h4" />
    </svg>
  ),
  record: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5" fill={color} />
    </svg>
  ),
  stop: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1" fill={color} />
    </svg>
  ),
  play: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <polygon points="5,3 13,8 5,13" />
    </svg>
  ),
  sidebar: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <path d="M6 2v12" />
    </svg>
  ),
  wordWrap: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M3 8h8a2 2 0 010 4H8" />
      <path d="M10 10l-2 2 2 2" />
    </svg>
  ),
  whitespace: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h10" />
      <circle cx="5" cy="7" r="0.8" fill={color} />
      <circle cx="8" cy="7" r="0.8" fill={color} />
      <circle cx="11" cy="7" r="0.8" fill={color} />
    </svg>
  ),
  settings: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
    </svg>
  ),
};

function ToolbarButton({ icon, title, onClick, theme, active, danger }: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  theme: ThemeColors;
  active?: boolean;
  danger?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? theme.bgHover : active ? theme.bgActive : 'transparent',
        border: 'none',
        color: danger ? theme.danger : active ? theme.accent : theme.textSecondary,
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: 4,
        fontSize: 16,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 28,
      }}
    >
      {icon}
    </button>
  );
}

function ToolbarSeparator({ theme }: { theme: ThemeColors }) {
  return <div style={{ width: 1, height: 20, backgroundColor: theme.border, margin: '0 4px' }} />;
}

export function Toolbar({ theme, onAction }: ToolbarProps) {
  const { isRecordingMacro, settings } = useNotemacStore();
  const iconColor = theme.textSecondary;
  const dangerColor = theme.danger || '#e53e3e';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 36,
      backgroundColor: theme.bgSecondary,
      borderBottom: `1px solid ${theme.border}`,
      padding: '0 8px',
      gap: 2,
      flexShrink: 0,
    }}>
      <ToolbarButton icon={Icons.newFile(iconColor)} title="New (Cmd+N)" onClick={() => onAction('new')} theme={theme} />
      <ToolbarButton icon={Icons.open(iconColor)} title="Open (Cmd+O)" onClick={() => onAction('open')} theme={theme} />
      <ToolbarButton icon={Icons.save(iconColor)} title="Save (Cmd+S)" onClick={() => onAction('save')} theme={theme} />
      <ToolbarButton icon={Icons.saveAll(iconColor)} title="Save All" onClick={() => onAction('save-all')} theme={theme} />

      <ToolbarSeparator theme={theme} />

      <ToolbarButton icon={Icons.undo(iconColor)} title="Undo (Cmd+Z)" onClick={() => onAction('undo')} theme={theme} />
      <ToolbarButton icon={Icons.redo(iconColor)} title="Redo (Cmd+Shift+Z)" onClick={() => onAction('redo')} theme={theme} />

      <ToolbarSeparator theme={theme} />

      <ToolbarButton icon={Icons.find(iconColor)} title="Find (Cmd+F)" onClick={() => onAction('find')} theme={theme} />
      <ToolbarButton icon={Icons.replace(iconColor)} title="Replace (Cmd+H)" onClick={() => onAction('replace')} theme={theme} />

      <ToolbarSeparator theme={theme} />

      <ToolbarButton icon={Icons.zoomIn(iconColor)} title="Zoom In (Cmd++)" onClick={() => onAction('zoom-in')} theme={theme} />
      <ToolbarButton icon={Icons.zoomOut(iconColor)} title="Zoom Out (Cmd+-)" onClick={() => onAction('zoom-out')} theme={theme} />

      <ToolbarSeparator theme={theme} />

      <ToolbarButton
        icon={isRecordingMacro ? Icons.stop(dangerColor) : Icons.record(iconColor)}
        title={isRecordingMacro ? "Stop Recording" : "Start Recording"}
        onClick={() => onAction(isRecordingMacro ? 'macro-stop' : 'macro-start')}
        theme={theme}
        danger={isRecordingMacro}
      />
      <ToolbarButton icon={Icons.play(iconColor)} title="Playback Macro" onClick={() => onAction('macro-playback')} theme={theme} />

      <ToolbarSeparator theme={theme} />

      <ToolbarButton icon={Icons.sidebar(iconColor)} title="Toggle Sidebar (Cmd+B)" onClick={() => onAction('toggle-sidebar')} theme={theme} />
      <ToolbarButton icon={Icons.wordWrap(iconColor)} title="Word Wrap" onClick={() => onAction('word-wrap', !settings.wordWrap)} theme={theme} />
      <ToolbarButton icon={Icons.whitespace(iconColor)} title="Show Whitespace" onClick={() => onAction('show-whitespace', !settings.showWhitespace)} theme={theme} />

      <div style={{ flex: 1 }} />

      <ToolbarButton icon={Icons.settings(iconColor)} title="Settings (Cmd+,)" onClick={() => onAction('preferences')} theme={theme} />
    </div>
  );
}
