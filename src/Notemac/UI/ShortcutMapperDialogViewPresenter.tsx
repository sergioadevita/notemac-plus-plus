import { useState, useRef, useMemo, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetEffectiveShortcuts, GetShortcutCategories } from "../Configs/ShortcutConfig";
import type { ShortcutItem } from "../Configs/ShortcutConfig";
import {
  EditShortcut,
  CaptureShortcut,
  ResetShortcutToDefault,
  ResetAllToDefaults,
  ExportShortcuts,
  ImportShortcuts,
  SetActivePreset,
  GetAvailablePresets,
  GetActivePresetShortcuts
} from "../Controllers/ShortcutEditorController";
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
    editInput: {
      backgroundColor: theme.bg,
      color: theme.text,
      border: `2px solid ${theme.accent}`,
      borderRadius: 3,
      padding: '2px 8px',
      fontSize: 11,
      fontFamily: 'monospace',
      fontWeight: 600,
    } as React.CSSProperties,
    editActions: {
      display: 'flex',
      gap: 8,
      marginLeft: 8,
    } as React.CSSProperties,
    resetButton: {
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 3,
      padding: '2px 6px',
      cursor: 'pointer',
      fontSize: 11,
      lineHeight: '1',
      transition: 'color 0.2s, border-color 0.2s',
    } as React.CSSProperties,
    toolbarButton: {
      backgroundColor: theme.bgTertiary,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: '6px 16px',
      cursor: 'pointer',
      fontSize: 13,
      marginRight: 8,
      transition: 'background-color 0.2s',
    } as React.CSSProperties,
    errorText: {
      color: '#ef4444',
      fontSize: 11,
      marginTop: 4,
      marginLeft: 12,
    } as React.CSSProperties,
    confirmOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    } as React.CSSProperties,
    confirmDialog: {
      backgroundColor: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 400,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    } as React.CSSProperties,
    confirmTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 8,
    } as React.CSSProperties,
    confirmMessage: {
      color: theme.textSecondary,
      fontSize: 13,
      marginBottom: 16,
    } as React.CSSProperties,
    confirmActions: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
    } as React.CSSProperties,
    customizedRow: {
      backgroundColor: theme.bg + '80',
    } as React.CSSProperties,
    iconButton: {
      backgroundColor: 'transparent',
      color: theme.text,
      border: 'none',
      cursor: 'pointer',
      padding: '2px 6px',
      fontSize: 12,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s',
    } as React.CSSProperties,
    presetRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    } as React.CSSProperties,
    presetLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    } as React.CSSProperties,
    presetSelect: {
      flex: 1,
      height: 32,
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: '0 10px',
      fontSize: 13,
      cursor: 'pointer',
      outline: 'none',
    } as React.CSSProperties,
  }), [theme]);
}

export function ShortcutMapperDialog({ theme }: ShortcutMapperDialogProps)
{
  const { setShowShortcutMapper, customShortcutOverrides, activePresetId } = useNotemacStore();
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [capturedShortcut, setCapturedShortcut] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styles = useStyles(theme);

  const availablePresets = GetAvailablePresets();
  const baseShortcuts = GetActivePresetShortcuts();
  const shortcuts = GetEffectiveShortcuts(customShortcutOverrides, baseShortcuts);
  const categories = ['all', ...GetShortcutCategories(baseShortcuts)];
  const activePresetName = availablePresets.find(p => p.id === activePresetId)?.name ?? 'Default';

  const HandlePresetChange = useCallback((presetId: string) =>
  {
    SetActivePreset(presetId);
    setEditingAction(null);
    setCapturedShortcut('');
    setEditError(null);
  }, []);
  const filtered = shortcuts.filter(s =>
  {
    const matchesCategory = 'all' === activeCategory || s.category === activeCategory;
    const matchesFilter = !filter
      || s.name.toLowerCase().includes(filter.toLowerCase())
      || s.shortcut.toLowerCase().includes(filter.toLowerCase());
    return matchesCategory && matchesFilter;
  });

  useFocusTrap(dialogRef, true, () => setShowShortcutMapper(false));

  const HandleShortcutCellClick = useCallback((item: ShortcutItem) =>
  {
    if (null === editingAction)
    {
      setEditingAction(item.action);
      setCapturedShortcut('');
      setEditError(null);
    }
  }, [editingAction]);

  const HandleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) =>
  {
    if (null === editingAction)
    {
      return;
    }

    if ('Escape' === e.key)
    {
      setEditingAction(null);
      setCapturedShortcut('');
      setEditError(null);
      return;
    }

    const CapturedCombo = CaptureShortcut(e as unknown as KeyboardEvent);
    if ('' !== CapturedCombo)
    {
      setCapturedShortcut(CapturedCombo);
    }
  }, [editingAction]);

  const HandleConfirmEdit = useCallback(() =>
  {
    if (null === editingAction || '' === capturedShortcut)
    {
      setEditError('No shortcut captured');
      return;
    }

    const result = EditShortcut(editingAction, capturedShortcut);
    if (!result.success)
    {
      setEditError(result.error ?? 'Unknown error');
    }
    else
    {
      setEditingAction(null);
      setCapturedShortcut('');
      setEditError(null);
    }
  }, [editingAction, capturedShortcut]);

  const HandleCancelEdit = useCallback(() =>
  {
    setEditingAction(null);
    setCapturedShortcut('');
    setEditError(null);
  }, []);

  const HandleResetSingle = useCallback((action: string) =>
  {
    ResetShortcutToDefault(action);
  }, []);

  const HandleResetAll = useCallback(() =>
  {
    ResetAllToDefaults();
    setShowResetConfirm(false);
  }, []);

  const HandleExport = useCallback(() =>
  {
    const ExportedContent = ExportShortcuts();
    const blob = new window.Blob([ExportedContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shortcuts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const HandleImportClick = useCallback(() =>
  {
    if (null !== fileInputRef.current)
    {
      fileInputRef.current.click();
    }
  }, []);

  const HandleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const File = e.target.files?.[0];
    if (!File)
    {
      return;
    }

    const Reader = new FileReader();
    Reader.onload = (event) =>
    {
      const Content = event.target?.result;
      if ('string' === typeof Content)
      {
        try
        {
          ImportShortcuts(Content);
        }
        catch (Err)
        {
          setEditError(`Import failed: ${null !== Err && 'object' === typeof Err && 'message' in Err ? (Err as Error).message : 'Unknown error'}`);
        }
      }
    };
    Reader.readAsText(File);
    e.target.value = '';
  }, []);

  return (
    <>
      <div className="dialog-overlay" onClick={() => setShowShortcutMapper(false)}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-mapper-title"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={HandleKeyDown}
          style={styles.dialogContainer}
        >
          <h3 id="shortcut-mapper-title" style={styles.dialogTitle}>
            Shortcut Mapper
          </h3>

          {/* Preset dropdown */}
          <div style={styles.presetRow}>
            <span style={styles.presetLabel}>Mapping:</span>
            <select
              value={activePresetId}
              onChange={(e) => HandlePresetChange(e.target.value)}
              style={styles.presetSelect}
              aria-label="Shortcut mapping preset"
            >
              {availablePresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

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
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={`${s.action}-${s.shortcut}`}
                    style={{
                      ...styles.tableBodyRow,
                      ...(null !== customShortcutOverrides[s.action] ? styles.customizedRow : {})
                    }}
                  >
                    <td style={styles.tableCommandCell}>{s.name}</td>
                    <td style={styles.tableShortcutCell}>
                      {editingAction === s.action ? (
                        <div style={styles.editActions}>
                          <div style={styles.editInput}>
                            {'' !== capturedShortcut ? capturedShortcut : 'Press keys...'}
                          </div>
                          <button
                            onClick={HandleConfirmEdit}
                            style={styles.iconButton}
                            title="Confirm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={HandleCancelEdit}
                            style={styles.iconButton}
                            title="Cancel"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <kbd
                          style={{ ...styles.shortcutKbd, cursor: 'pointer' }}
                          onClick={() => HandleShortcutCellClick(s)}
                        >
                          {s.shortcut}
                        </kbd>
                      )}
                    </td>
                    <td style={styles.tableCategoryCell}>{s.category}</td>
                    <td style={styles.tableShortcutCell}>
                      {null !== customShortcutOverrides[s.action] && editingAction !== s.action && (
                        <button
                          onClick={() => HandleResetSingle(s.action)}
                          style={styles.resetButton}
                          title="Reset to default"
                        >
                          ↺
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {null !== editError && (
            <div style={styles.errorText}>
              {editError}
            </div>
          )}

          <div style={styles.footerContainer}>
            <span style={styles.shortcutCount}>
              {filtered.length} shortcuts
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowResetConfirm(true)}
                style={styles.toolbarButton}
              >
                Reset All
              </button>
              <button
                onClick={HandleExport}
                style={styles.toolbarButton}
              >
                Export
              </button>
              <button
                onClick={HandleImportClick}
                style={styles.toolbarButton}
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={HandleImportFile}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => setShowShortcutMapper(false)}
                style={styles.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div
          style={styles.confirmOverlay}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            style={styles.confirmDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.confirmTitle}>Reset All Shortcuts?</div>
            <div style={styles.confirmMessage}>
              This will reset all custom shortcuts to the {activePresetName} defaults. This action cannot be undone.
            </div>
            <div style={styles.confirmActions}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={styles.toolbarButton}
              >
                Cancel
              </button>
              <button
                onClick={HandleResetAll}
                style={{
                  ...styles.closeButton,
                  backgroundColor: '#ef4444',
                }}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
