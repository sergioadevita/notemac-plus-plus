import React, { useState } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetDefaultShortcuts, GetShortcutCategories } from "../Configs/ShortcutConfig";

interface ShortcutMapperDialogProps
{
  theme: ThemeColors;
}

export function ShortcutMapperDialog({ theme }: ShortcutMapperDialogProps)
{
  const { setShowShortcutMapper } = useNotemacStore();
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');

  const shortcuts = GetDefaultShortcuts();
  const categories = ['all', ...GetShortcutCategories()];
  const filtered = shortcuts.filter(s =>
  {
    const matchesCategory = 'all' === activeCategory || s.category === activeCategory;
    const matchesFilter = !filter
      || s.name.toLowerCase().includes(filter.toLowerCase())
      || s.shortcut.toLowerCase().includes(filter.toLowerCase());
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
                  <td style={{ padding: '6px 12px', fontSize: 13, color: theme.text }}>{s.name}</td>
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
