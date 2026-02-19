import { useState, useRef, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetDefaultShortcuts, GetShortcutCategories } from "../Configs/ShortcutConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface ShortcutMapperDialogProps
{
  theme: ThemeColors;
}

function useStyles(theme: ThemeColors) {
  return useMemo(() => ({
    dialogContainer: {
      backgroundColor: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: 24,
      width: 600,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    } as React.CSSProperties,
    dialogTitle: {
      color: theme.text,
      fontSize: 16,
      marginBottom: 16,
      fontWeight: 600,
    } as React.CSSProperties,
    categoryTabsContainer: {
      display: 'flex',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap',
    } as React.CSSProperties,
    categoryTab: (isActive: boolean) => ({
      padding: '3px 10px',
      borderRadius: 4,
      fontSize: 12,
      cursor: 'pointer',
      backgroundColor: isActive ? theme.accent : theme.bgTertiary,
      color: isActive ? theme.accentText : theme.textSecondary,
      fontWeight: isActive ? 600 : 400,
      textTransform: 'capitalize',
    } as React.CSSProperties),
    filterInput: {
      height: 32,
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: '0 12px',
      fontSize: 13,
      marginBottom: 12,
    } as React.CSSProperties,
    tableContainer: {
      flex: 1,
      overflowY: 'auto',
      backgroundColor: theme.bg,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    } as React.CSSProperties,
    tableHeaderRow: {
      backgroundColor: theme.bgTertiary,
    } as React.CSSProperties,
    tableHeaderCell: {
      padding: '8px 12px',
      textAlign: 'left',
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: 600,
    } as React.CSSProperties,
    tableBodyRow: {
      borderTop: `1px solid ${theme.border}`,
    } as React.CSSProperties,
    tableCommandCell: {
      padding: '6px 12px',
      fontSize: 13,
      color: theme.text,
    } as React.CSSProperties,
    tableShortcutCell: {
      padding: '6px 12px',
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.accent,
    } as React.CSSProperties,
    tableCategoryCell: {
      padding: '6px 12px',
      fontSize: 12,
      color: theme.textMuted,
    } as React.CSSProperties,
    shortcutKbd: {
      backgroundColor: theme.bgTertiary,
      padding: '2px 8px',
      borderRadius: 3,
      border: `1px solid ${theme.border}`,
      fontSize: 11,
    } as React.CSSProperties,
    footerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    } as React.CSSProperties,
    shortcutCount: {
      fontSize: 12,
      color: theme.textMuted,
    } as React.CSSProperties,
    closeButton: {
      backgroundColor: theme.accent,
      color: theme.accentText,
      border: 'none',
      borderRadius: 6,
      padding: '6px 24px',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
    } as React.CSSProperties,
  }), [theme]);
}

export function ShortcutMapperDialog({ theme }: ShortcutMapperDialogProps)
{
  const { setShowShortcutMapper } = useNotemacStore();
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const dialogRef = useRef<HTMLDivElement>(null);
  const styles = useStyles(theme);

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

  useFocusTrap(dialogRef, true, () => setShowShortcutMapper(false));

  return (
    <div className="dialog-overlay" onClick={() => setShowShortcutMapper(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-mapper-title"
        onClick={(e) => e.stopPropagation()}
        style={styles.dialogContainer}
      >
        <h3 id="shortcut-mapper-title" style={styles.dialogTitle}>
          Shortcut Mapper
        </h3>

        {/* Category tabs */}
        <div style={styles.categoryTabsContainer}>
          {categories.map(cat => (
            <span
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={styles.categoryTab(activeCategory === cat)}
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
          style={styles.filterInput}
        />

        {/* Shortcuts table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>Command</th>
                <th style={styles.tableHeaderCell}>Shortcut</th>
                <th style={styles.tableHeaderCell}>Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={`${s.name}-${s.shortcut}`} style={styles.tableBodyRow}>
                  <td style={styles.tableCommandCell}>{s.name}</td>
                  <td style={styles.tableShortcutCell}>
                    <kbd style={styles.shortcutKbd}>
                      {s.shortcut}
                    </kbd>
                  </td>
                  <td style={styles.tableCategoryCell}>{s.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.footerContainer}>
          <span style={styles.shortcutCount}>
            {filtered.length} shortcuts
          </span>
          <button
            onClick={() => setShowShortcutMapper(false)}
            style={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
