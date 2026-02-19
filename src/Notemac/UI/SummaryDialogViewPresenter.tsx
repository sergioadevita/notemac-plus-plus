import React, { useRef } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { countWords, formatFileSize } from '../../Shared/Helpers/TextHelpers';
import { useFocusTrap } from './hooks/useFocusTrap';

interface SummaryDialogProps {
  theme: ThemeColors;
}

export function SummaryDialog({ theme }: SummaryDialogProps) {
  const { setShowSummary, tabs, activeTabId } = useNotemacStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, true, () => setShowSummary(false));

  if (!activeTab) return null;

  const content = activeTab.content;
  const lines = content.split('\n');
  const words = countWords(content);
  const chars = content.length;
  const charsNoSpaces = content.replace(/\s/g, '').length;
  const bytes = new TextEncoder().encode(content).byteLength;
  const emptyLines = lines.filter(l => l.trim() === '').length;
  const nonEmptyLines = lines.length - emptyLines;

  const stats = [
    ['File Name', activeTab.name],
    ['File Path', activeTab.path || '(Unsaved)'],
    ['Language', activeTab.language],
    ['Encoding', activeTab.encoding],
    ['Line Ending', activeTab.lineEnding],
    ['', ''],
    ['Total Lines', lines.length.toLocaleString()],
    ['Non-Empty Lines', nonEmptyLines.toLocaleString()],
    ['Empty Lines', emptyLines.toLocaleString()],
    ['Words', words.toLocaleString()],
    ['Characters', chars.toLocaleString()],
    ['Characters (no spaces)', charsNoSpaces.toLocaleString()],
    ['File Size', formatFileSize(bytes)],
    ['', ''],
    ['Current Line', activeTab.cursorLine.toString()],
    ['Current Column', activeTab.cursorColumn.toString()],
    ['Bookmarks', activeTab.bookmarks.length.toString()],
    ['Modified', activeTab.isModified ? 'Yes' : 'No'],
    ['Read Only', activeTab.isReadOnly ? 'Yes' : 'No'],
  ];

  return (
    <div className="dialog-overlay" onClick={() => setShowSummary(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 24,
          width: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 id="summary-title" style={{ color: theme.text, fontSize: 16, marginBottom: 16, fontWeight: 600 }}>
          Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '6px 16px',
          fontSize: 13,
        }}>
          {stats.map(([label, value], i) => {
            if (!label) return <React.Fragment key={`separator-${i}`}><div style={{ height: 8 }} /><div /></React.Fragment>;
            return (
              <React.Fragment key={`stat-${label}-${value}`}>
                <span style={{ color: theme.textMuted, fontWeight: 500 }}>{label}:</span>
                <span style={{ color: theme.text, fontFamily: 'monospace' }}>{value}</span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={() => setShowSummary(false)}
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
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
