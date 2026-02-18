import React, { useState, useRef, useEffect } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface CharInRangeDialogProps {
  theme: ThemeColors;
}

export function CharInRangeDialog({ theme }: CharInRangeDialogProps) {
  const { setShowCharInRange, tabs, activeTabId } = useNotemacStore();
  const [rangeStart, setRangeStart] = useState('0');
  const [rangeEnd, setRangeEnd] = useState('127');
  const [results, setResults] = useState<{ line: number; col: number; char: string; code: number }[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const inputStyle: React.CSSProperties = {
    height: 28,
    backgroundColor: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    padding: '0 8px',
    fontSize: 13,
    width: 80,
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowCharInRange(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="char-range-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          width: 450,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 id="char-range-title" style={{ color: theme.text, fontSize: 16, marginBottom: 12, fontWeight: 600 }}>
          Find Characters in Range
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: theme.textSecondary }}>From:</span>
          <input type="number" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 13, color: theme.textSecondary }}>To:</span>
          <input type="number" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} style={inputStyle} />
          <button
            onClick={handleFind}
            style={{
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 6,
              padding: '0 16px',
              height: 28,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Find
          </button>
        </div>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
          Common ranges: ASCII (0-127), Non-ASCII (128-65535), Control (0-31)
        </div>
        {results.length > 0 && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            maxHeight: 300,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: theme.bgTertiary }}>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: theme.textSecondary }}>Line</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: theme.textSecondary }}>Col</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: theme.textSecondary }}>Char</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: theme.textSecondary }}>Code</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', color: theme.textSecondary }}>Hex</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('notemac-goto-line', { detail: { line: r.line } }));
                    }}
                  >
                    <td style={{ padding: '3px 8px', color: theme.text, cursor: 'pointer' }}>{r.line}</td>
                    <td style={{ padding: '3px 8px', color: theme.text }}>{r.col}</td>
                    <td style={{ padding: '3px 8px', color: theme.accent, fontFamily: 'monospace' }}>{r.code < 32 ? '\u25a1' : r.char}</td>
                    <td style={{ padding: '3px 8px', color: theme.text }}>{r.code}</td>
                    <td style={{ padding: '3px 8px', color: theme.textMuted, fontFamily: 'monospace' }}>0x{r.code.toString(16).toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
          {results.length > 0 ? `${results.length} characters found` : 'Enter a range and click Find'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={() => setShowCharInRange(false)}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
