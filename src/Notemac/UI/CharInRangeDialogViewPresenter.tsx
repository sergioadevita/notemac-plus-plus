import React, { useState, useRef, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface CharInRangeDialogProps {
  theme: ThemeColors;
}

function useStyles(theme: ThemeColors) {
  return useMemo(() => ({
    inputField: {
      height: 28,
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      padding: '0 8px',
      fontSize: 13,
      width: 80,
    } as React.CSSProperties,
    dialogContainer: {
      backgroundColor: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: 20,
      width: 450,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    } as React.CSSProperties,
    dialogTitle: {
      color: theme.text,
      fontSize: 16,
      marginBottom: 12,
      fontWeight: 600,
    } as React.CSSProperties,
    rangeInputContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    } as React.CSSProperties,
    rangeLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    } as React.CSSProperties,
    findButton: {
      backgroundColor: theme.accent,
      color: theme.accentText,
      border: 'none',
      borderRadius: 6,
      padding: '0 16px',
      height: 28,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
    } as React.CSSProperties,
    helperText: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 8,
    } as React.CSSProperties,
    resultsContainer: {
      flex: 1,
      overflowY: 'auto',
      backgroundColor: theme.bg,
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      maxHeight: 300,
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12,
    } as React.CSSProperties,
    tableHeaderRow: {
      backgroundColor: theme.bgTertiary,
    } as React.CSSProperties,
    tableHeaderCell: {
      padding: '4px 8px',
      textAlign: 'left',
      color: theme.textSecondary,
    } as React.CSSProperties,
    tableBodyRow: (isClickable: boolean) => ({
      borderTop: `1px solid ${theme.border}`,
      cursor: isClickable ? 'pointer' : 'default',
    } as React.CSSProperties),
    tableCell: {
      padding: '3px 8px',
      color: theme.text,
    } as React.CSSProperties,
    tableCellAccent: {
      padding: '3px 8px',
      color: theme.accent,
      fontFamily: 'monospace',
    } as React.CSSProperties,
    tableCellMuted: {
      padding: '3px 8px',
      color: theme.textMuted,
      fontFamily: 'monospace',
    } as React.CSSProperties,
    resultsSummary: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 8,
    } as React.CSSProperties,
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 12,
    } as React.CSSProperties,
    closeButton: {
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: '6px 16px',
      cursor: 'pointer',
      fontSize: 13,
    } as React.CSSProperties,
  }), [theme]);
}

export function CharInRangeDialog({ theme }: CharInRangeDialogProps) {
  const { setShowCharInRange, tabs, activeTabId } = useNotemacStore();
  const [rangeStart, setRangeStart] = useState('0');
  const [rangeEnd, setRangeEnd] = useState('127');
  const [results, setResults] = useState<{ line: number; col: number; char: string; code: number }[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const styles = useStyles(theme);

  useFocusTrap(dialogRef, true, () => setShowCharInRange(false));

  const handleFind = () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end)) return;

    const found: typeof results = [];
    const lines = activeTab.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines[i].length; j++) {
        const code = lines[i].charCodeAt(j);
        if (code >= start && code <= end) {
          found.push({ line: i + 1, col: j + 1, char: lines[i][j], code });
        }
      }
    }
    setResults(found.slice(0, 500)); // limit results
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowCharInRange(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="char-range-title"
        onClick={(e) => e.stopPropagation()}
        style={styles.dialogContainer}
      >
        <h3 id="char-range-title" style={styles.dialogTitle}>
          Find Characters in Range
        </h3>
        <div style={styles.rangeInputContainer}>
          <span style={styles.rangeLabel}>From:</span>
          <input type="number" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} style={styles.inputField} />
          <span style={styles.rangeLabel}>To:</span>
          <input type="number" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} style={styles.inputField} />
          <button
            onClick={handleFind}
            style={styles.findButton}
          >
            Find
          </button>
        </div>
        <div style={styles.helperText}>
          Common ranges: ASCII (0-127), Non-ASCII (128-65535), Control (0-31)
        </div>
        {results.length > 0 && (
          <div style={styles.resultsContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeaderCell}>Line</th>
                  <th style={styles.tableHeaderCell}>Col</th>
                  <th style={styles.tableHeaderCell}>Char</th>
                  <th style={styles.tableHeaderCell}>Code</th>
                  <th style={styles.tableHeaderCell}>Hex</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`char-${r.line}-${r.col}-${r.char}`} style={styles.tableBodyRow(true)}
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('notemac-goto-line', { detail: { line: r.line } }));
                    }}
                  >
                    <td style={{...styles.tableCell, cursor: 'pointer'}}>{r.line}</td>
                    <td style={styles.tableCell}>{r.col}</td>
                    <td style={styles.tableCellAccent}>{r.code < 32 ? '\u25a1' : r.char}</td>
                    <td style={styles.tableCell}>{r.code}</td>
                    <td style={styles.tableCellMuted}>0x{r.code.toString(16).toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={styles.resultsSummary}>
          {results.length > 0 ? `${results.length} characters found` : 'Enter a range and click Find'}
        </div>
        <div style={styles.buttonContainer}>
          <button
            onClick={() => setShowCharInRange(false)}
            style={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
