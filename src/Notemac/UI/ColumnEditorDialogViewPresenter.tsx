import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface ColumnEditDetail {
  mode: string;
  text?: string;
  initial?: number;
  increase?: number;
  repeat?: number;
  leadingZeros?: boolean;
  format?: string;
}

interface ColumnEditorDialogProps {
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
      width: '100%',
    } as React.CSSProperties,
    selectField: {
      height: 30,
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      padding: '0 8px',
      fontSize: 13,
      width: '100%',
    } as React.CSSProperties,
    dialogContainer: {
      backgroundColor: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: 20,
      width: 380,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    } as React.CSSProperties,
    dialogTitle: {
      color: theme.text,
      fontSize: 16,
      marginBottom: 16,
      fontWeight: 600,
    } as React.CSSProperties,
    modeSelector: {
      display: 'flex',
      gap: 12,
      marginBottom: 16,
    } as React.CSSProperties,
    modeLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      color: theme.textSecondary,
      cursor: 'pointer',
      fontSize: 13,
    } as React.CSSProperties,
    modeRadio: {
      accentColor: theme.accent,
    } as React.CSSProperties,
    fieldSection: {
      marginBottom: 16,
    } as React.CSSProperties,
    fieldLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
      display: 'block',
    } as React.CSSProperties,
    gridContainer: (columns: number) => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 8,
    } as React.CSSProperties),
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      color: theme.textSecondary,
      cursor: 'pointer',
    } as React.CSSProperties,
    checkboxInput: {
      accentColor: theme.accent,
    } as React.CSSProperties,
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
    } as React.CSSProperties,
    cancelButton: {
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: '6px 16px',
      cursor: 'pointer',
      fontSize: 13,
    } as React.CSSProperties,
    submitButton: {
      backgroundColor: theme.accent,
      color: theme.accentText,
      border: 'none',
      borderRadius: 6,
      padding: '6px 20px',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
    } as React.CSSProperties,
  }), [theme]);
}

export function ColumnEditorDialog({ theme }: ColumnEditorDialogProps) {
  const { setShowColumnEditor } = useNotemacStore();
  const [mode, setMode] = useState<'text' | 'number'>('text');
  const [textToInsert, setTextToInsert] = useState('');
  const [initialNum, setInitialNum] = useState('0');
  const [increase, setIncrease] = useState('1');
  const [repeat, setRepeat] = useState('1');
  const [leadingZeros, setLeadingZeros] = useState(false);
  const [format, setFormat] = useState<'dec' | 'hex' | 'oct' | 'bin'>('dec');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const styles = useStyles(theme);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useFocusTrap(dialogRef, true, () => setShowColumnEditor(false));

  const handleInsert = () => {
    const detail: ColumnEditDetail = { mode };
    if (mode === 'text') {
      detail.text = textToInsert;
    } else {
      detail.initial = parseInt(initialNum) || 0;
      detail.increase = parseInt(increase) || 1;
      detail.repeat = parseInt(repeat) || 1;
      detail.leadingZeros = leadingZeros;
      detail.format = format;
    }
    document.dispatchEvent(new CustomEvent('notemac-column-edit', { detail }));
    setShowColumnEditor(false);
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowColumnEditor(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-editor-title"
        onClick={(e) => e.stopPropagation()}
        style={styles.dialogContainer}
      >
        <h3 id="column-editor-title" style={styles.dialogTitle}>
          Column Editor
        </h3>

        {/* Mode selector */}
        <div style={styles.modeSelector}>
          <label style={styles.modeLabel}>
            <input type="radio" checked={mode === 'text'} onChange={() => setMode('text')} style={styles.modeRadio} />
            Text to Insert
          </label>
          <label style={styles.modeLabel}>
            <input type="radio" checked={mode === 'number'} onChange={() => setMode('number')} style={styles.modeRadio} />
            Number to Insert
          </label>
        </div>

        {mode === 'text' ? (
          <div style={styles.fieldSection}>
            <label style={styles.fieldLabel}>Text:</label>
            <input
              ref={inputRef}
              value={textToInsert}
              onChange={(e) => setTextToInsert(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); if (e.key === 'Escape') setShowColumnEditor(false); }}
              style={styles.inputField}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={styles.gridContainer(2)}>
              <div>
                <label style={styles.fieldLabel}>Initial Number:</label>
                <input type="number" value={initialNum} onChange={(e) => setInitialNum(e.target.value)} style={styles.inputField} />
              </div>
              <div>
                <label style={styles.fieldLabel}>Increase by:</label>
                <input type="number" value={increase} onChange={(e) => setIncrease(e.target.value)} style={styles.inputField} />
              </div>
            </div>
            <div style={styles.gridContainer(2)}>
              <div>
                <label style={styles.fieldLabel}>Repeat:</label>
                <input type="number" value={repeat} onChange={(e) => setRepeat(e.target.value)} style={styles.inputField} min="1" />
              </div>
              <div>
                <label style={styles.fieldLabel}>Format:</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as 'dec' | 'hex' | 'oct' | 'bin')} style={styles.selectField}>
                  <option value="dec">Decimal</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="oct">Octal</option>
                  <option value="bin">Binary</option>
                </select>
              </div>
            </div>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={leadingZeros} onChange={(e) => setLeadingZeros(e.target.checked)} style={styles.checkboxInput} />
              Leading Zeros
            </label>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button
            onClick={() => setShowColumnEditor(false)}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            style={styles.submitButton}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
