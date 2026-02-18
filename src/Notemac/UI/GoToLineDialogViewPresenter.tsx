import React, { useState, useRef, useEffect } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface GoToLineDialogProps {
  theme: ThemeColors;
}

export function GoToLineDialog({ theme }: GoToLineDialogProps) {
  const { setShowGoToLine, tabs, activeTabId } = useNotemacStore();
  const [lineNumber, setLineNumber] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const totalLines = activeTab ? activeTab.content.split('\n').length : 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useFocusTrap(dialogRef, true, () => setShowGoToLine(false));

  const handleGo = () => {
    const line = parseInt(lineNumber);
    if (isNaN(line) || line < 1) return;

    document.dispatchEvent(new CustomEvent('notemac-goto-line', { detail: { line } }));
    setShowGoToLine(false);
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowGoToLine(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goto-line-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          width: 350,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 id="goto-line-title" style={{ color: theme.text, fontSize: 16, marginBottom: 12, fontWeight: 600 }}>
          Go to Line
        </h3>
        <div style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>
          Enter line number (1 - {totalLines})
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            type="number"
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGo();
              if (e.key === 'Escape') setShowGoToLine(false);
            }}
            min={1}
            max={totalLines}
            placeholder={`1 - ${totalLines}`}
            style={{
              flex: 1,
              height: 32,
              backgroundColor: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '0 12px',
              fontSize: 14,
            }}
          />
          <button
            onClick={handleGo}
            style={{
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 6,
              padding: '0 20px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
