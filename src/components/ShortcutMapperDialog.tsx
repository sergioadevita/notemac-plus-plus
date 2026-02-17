import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';

interface ShortcutMapperDialogProps {
  theme: ThemeColors;
}

const DEFAULT_SHORTCUTS = [
  { command: 'New File', shortcut: 'Cmd+N', category: 'File' },
  { command: 'Open File', shortcut: 'Cmd+O', category: 'File' },
  { command: 'Save', shortcut: 'Cmd+S', category: 'File' },
  { command: 'Save As', shortcut: 'Shift+Cmd+S', category: 'File' },
  { command: 'Close Tab', shortcut: 'Cmd+W', category: 'File' },
  { command: 'Restore Last Closed', shortcut: 'Shift+Cmd+T', category: 'File' },
  { command: 'Print', shortcut: 'Cmd+P', category: 'File' },
  { command: 'Undo', shortcut: 'Cmd+Z', category: 'Edit' },
  { command: 'Redo', shortcut: 'Shift+Cmd+Z', category: 'Edit' },
  { command: 'Cut', shortcut: 'Cmd+X', category: 'Edit' },
  { command: 'Copy', shortcut: 'Cmd+C', category: 'Edit' },
  { command: 'Paste', shortcut: 'Cmd+V', category: 'Edit' },
  { command: 'Select All', shortcut: 'Cmd+A', category: 'Edit' },
  { command: 'Duplicate Line', shortcut: 'Cmd+D', category: 'Edit' },
  { command: 'Delete Line', shortcut: 'Shift+Cmd+K', category: 'Edit' },
  { command: 'Move Line Up', shortcut: 'Alt+Up', category: 'Edit' },
  { command: 'Move Line Down', shortcut: 'Alt+Down', category: 'Edit' },
  { command: 'Toggle Comment', shortcut: 'Cmd+/', category: 'Edit' },
  { command: 'Block Comment', shortcut: 'Shift+Alt+A', category: 'Edit' },
  { command: 'UPPERCASE', shortcut: 'Shift+Cmd+U', category: 'Edit' },
  { command: 'lowercase', shortcut: 'Cmd+U', category: 'Edit' },
  { command: 'Column Editor', shortcut: 'Alt+C', category: 'Edit' },
  { command: 'Clipboard History', shortcut: 'Cmd+Shift+V', category: 'Edit' },
  { command: 'Find', shortcut: 'Cmd+F', category: 'Search' },
  { command: 'Replace', shortcut: 'Cmd+H', category: 'Search' },
  { command: 'Find in Files', shortcut: 'Shift+Cmd+F', category: 'Search' },
  { command: 'Incremental Search', shortcut: 'Cmd+Alt+I', category: 'Search' },
  { command: 'Go to Line', shortcut: 'Cmd+G', category: 'Search' },
  { command: 'Go to Matching Bracket', shortcut: 'Shift+Cmd+\\', category: 'Search' },
  { command: 'Toggle Bookmark', shortcut: 'Cmd+F2', category: 'Search' },
  { command: 'Next Bookmark', shortcut: 'F2', category: 'Search' },
  { command: 'Previous Bookmark', shortcut: 'Shift+F2', category: 'Search' },
  { command: 'Zoom In', shortcut: 'Cmd++', category: 'View' },
  { command: 'Zoom Out', shortcut: 'Cmd+-', category: 'View' },
  { command: 'Reset Zoom', shortcut: 'Cmd+0', category: 'View' },
  { command: 'Toggle Sidebar', shortcut: 'Cmd+B', category: 'View' },
  { command: 'Preferences', shortcut: 'Cmd+,', category: 'Settings' },
  { command: 'Start/Stop Recording', shortcut: 'Shift+Cmd+R', category: 'Macro' },
  { command: 'Playback Macro', shortcut: 'Shift+Cmd+P', category: 'Macro' },
];

export function ShortcutMapperDialog({ theme }: ShortcutMapperDialogProps) {
  const { setShowShortcutMapper } = useEditorStore();
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');

  const categories = ['all', ...new Set(DEFAULT_SHORTCUTS.map(s => s.category))];
  const filtered = DEFAULT_SHORTCUTS.filter(s => {
    const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
    const matchesFilter = !filter || s.command.toLowerCase().includes(filter.toLowerCase()) || s.shortcut.toLowerCase().includes(filter.toLowerCase());
    return matchesCategory && matchesFilter;
  });

  return (
    <div className="dialog-overlay" onClick={() => setShowShortcutMapper(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 24,
          width: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 style={{ color: theme.text, fontSize: 16, marginBottom: 16, fontWeight: 600 }}>
          Shortcut Mapper
        </h3>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <span
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
                backgroundColor: activeCategory === cat ? theme.accent : theme.bgTertiary,
                color: activeCategory === cat ? theme.accentText : theme.textSecondary,
                fontWeight: activeCategory === cat ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Filter */}
        <input
          type="text"
          placeholder="Filter shortcuts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            height: 32,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: '0 12px',
            fontSize: 13,
            marginBottom: 12,
          }}
        />

        {/* Shortcuts table */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: theme.bgTertiary }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>Command</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>Shortcut</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '6px 12px', fontSize: 13, color: theme.text }}>{s.command}</td>
                  <td style={{ padding: '6px 12px', fontSize: 12, fontFamily: 'monospace', color: theme.accent }}>
                    <kbd style={{
                      backgroundColor: theme.bgTertiary,
                      padding: '2px 8px',
                      borderRadius: 3,
                      border: `1px solid ${theme.border}`,
                      fontSize: 11,
                    }}>
                      {s.shortcut}
                    </kbd>
                  </td>
                  <td style={{ padding: '6px 12px', fontSize: 12, color: theme.textMuted }}>{s.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: theme.textMuted }}>
            {filtered.length} shortcuts
          </span>
          <button
            onClick={() => setShowShortcutMapper(false)}
            style={{
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 6,
              padding: '6px 24px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
