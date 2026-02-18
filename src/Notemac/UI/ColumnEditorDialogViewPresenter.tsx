import React, { useState, useRef, useEffect } from 'react';
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

  const inputStyle: React.CSSProperties = {
    height: 28,
    backgroundColor: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    padding: '0 8px',
    fontSize: 13,
    width: '100%',
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowColumnEditor(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-editor-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          width: 380,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 id="column-editor-title" style={{ color: theme.text, fontSize: 16, marginBottom: 16, fontWeight: 600 }}>
          Column Editor
        </h3>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.textSecondary, cursor: 'pointer', fontSize: 13 }}>
            <input type="radio" checked={mode === 'text'} onChange={() => setMode('text')} style={{ accentColor: theme.accent }} />
            Text to Insert
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.textSecondary, cursor: 'pointer', fontSize: 13 }}>
            <input type="radio" checked={mode === 'number'} onChange={() => setMode('number')} style={{ accentColor: theme.accent }} />
            Number to Insert
          </label>
        </div>

        {mode === 'text' ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: 'block' }}>Text:</label>
            <input
              ref={inputRef}
              value={textToInsert}
              onChange={(e) => setTextToInsert(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); if (e.key === 'Escape') setShowColumnEditor(false); }}
              style={inputStyle}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: 'block' }}>Initial Number:</label>
                <input type="number" value={initialNum} onChange={(e) => setInitialNum(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: 'block' }}>Increase by:</label>
                <input type="number" value={increase} onChange={(e) => setIncrease(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: 'block' }}>Repeat:</label>
                <input type="number" value={repeat} onChange={(e) => setRepeat(e.target.value)} style={inputStyle} min="1" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, display: 'block' }}>Format:</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as 'dec' | 'hex' | 'oct' | 'bin')} style={{ ...inputStyle, height: 30 }}>
                  <option value="dec">Decimal</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="oct">Octal</option>
                  <option value="bin">Binary</option>
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textSecondary, cursor: 'pointer' }}>
              <input type="checkbox" checked={leadingZeros} onChange={(e) => setLeadingZeros(e.target.checked)} style={{ accentColor: theme.accent }} />
              Leading Zeros
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => setShowColumnEditor(false)}
            style={{
              backgroundColor: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            style={{
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 6,
              padding: '6px 20px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
