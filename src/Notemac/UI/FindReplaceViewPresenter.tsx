import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { MARK_COLORS } from '../Commons/Constants';

interface FindReplaceProps {
  theme: ThemeColors;
}

function useStyles(theme: ThemeColors) {
  return useMemo(() => ({
    container: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', background: theme.bgSecondary, borderBottom: `1px solid ${theme.border}`, fontSize: 13 } as React.CSSProperties,
    modesRow: { display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
    modeTab: (active: boolean) => ({ padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, color: active ? theme.accent : theme.textSecondary, background: active ? theme.bgHover : 'transparent' }) as React.CSSProperties,
    spacer: { flex: 1 } as React.CSSProperties,
    closeButton: { background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 } as React.CSSProperties,
    row: { display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
    findInput: { flex: 1, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none' } as React.CSSProperties,
    replaceInput: { flex: 1, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none' } as React.CSSProperties,
    markRow: { display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
    markLabel: { fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    markColor: (selected: boolean, styleNum: number) => ({ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: '#fff', background: MARK_COLORS[styleNum] || '#888', border: selected ? '2px solid #fff' : '2px solid transparent', boxShadow: selected ? `0 0 0 1px ${MARK_COLORS[styleNum]}` : 'none' }) as React.CSSProperties,
    optionsRow: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' } as React.CSSProperties,
    checkbox: { accentColor: theme.accent } as React.CSSProperties,
  }), [theme]);
}

export function FindReplace({ theme }: FindReplaceProps) {
  const {
    findReplaceMode,
    searchOptions,
    updateSearchOptions,
    setShowFindReplace,
  } = useNotemacStore();

  const styles = useStyles(theme);
  const findInputRef = useRef<HTMLInputElement>(null);
  const [markStyle, setMarkStyle] = useState<1 | 2 | 3 | 4 | 5>(1);

  useEffect(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, [findReplaceMode]);

  const doFind = useCallback((direction: 'next' | 'prev') => {
    triggerEditorFind(searchOptions.query, direction, searchOptions);
  }, [searchOptions]);

  const triggerEditorFind = (query: string, direction: 'next' | 'prev', options: typeof searchOptions) => {
    document.dispatchEvent(new CustomEvent('notemac-find', {
      detail: { query, direction, isCaseSensitive: options.isCaseSensitive, isWholeWord: options.isWholeWord, isRegex: options.isRegex }
    }));
  };

  const handleFindNext = () => doFind('next');
  const handleFindPrev = () => doFind('prev');

  const handleReplace = () => {
    document.dispatchEvent(new CustomEvent('notemac-replace', {
      detail: { find: searchOptions.query, replace: searchOptions.replaceText, all: false, ...searchOptions }
    }));
  };

  const handleReplaceAll = () => {
    document.dispatchEvent(new CustomEvent('notemac-replace', {
      detail: { find: searchOptions.query, replace: searchOptions.replaceText, all: true, ...searchOptions }
    }));
  };

  const handleMark = () => {
    document.dispatchEvent(new CustomEvent('notemac-mark', {
      detail: { ...searchOptions, style: markStyle }
    }));
  };

  const handleClearMarks = () => {
    document.dispatchEvent(new CustomEvent('notemac-clear-marks', {}));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) handleFindPrev();
      else handleFindNext();
    }
    if (e.key === 'Escape') {
      setShowFindReplace(false);
    }
  };

  const ToggleButton = ({ active, onClick, title, children }: {
    active: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    const buttonStyle = useMemo(() => ({
      background: active ? theme.accent : 'transparent',
      color: active ? theme.accentText : theme.textSecondary,
      border: `1px solid ${active ? theme.accent : theme.border}`,
      borderRadius: 4,
      padding: '2px 6px',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      minWidth: 28,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties), [active, theme]);

    return (
      <button
        title={title}
        aria-label={title}
        onClick={onClick}
        style={buttonStyle}
      >
        {children}
      </button>
    );
  };

  const ActionButton = ({ onClick, title, children, primary }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    primary?: boolean;
  }) => {
    const buttonStyle = useMemo(() => ({
      background: primary ? theme.accent : 'transparent',
      color: primary ? theme.accentText : theme.textSecondary,
      border: `1px solid ${primary ? theme.accent : theme.border}`,
      borderRadius: 4,
      padding: '2px 8px',
      cursor: 'pointer',
      fontSize: 12,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties), [primary, theme]);

    return (
      <button
        title={title}
        aria-label={title}
        onClick={onClick}
        style={buttonStyle}
      >
        {children}
      </button>
    );
  };

  const modes: { key: typeof findReplaceMode; label: string }[] = [
    { key: 'find', label: 'Find' },
    { key: 'replace', label: 'Replace' },
    { key: 'findInFiles', label: 'Find in Files' },
    { key: 'mark', label: 'Mark' },
  ];

  return (
    <div style={styles.container}>
      {/* Mode tabs */}
      <div style={styles.modesRow}>
        {modes.map(mode => (
          <span
            key={mode.key}
            onClick={() => useNotemacStore.getState().setShowFindReplace(true, mode.key)}
            style={styles.modeTab(findReplaceMode === mode.key)}
          >
            {mode.label}
          </span>
        ))}

        <div style={styles.spacer} />

        <button
          aria-label="Close find and replace"
          onClick={() => setShowFindReplace(false)}
          style={styles.closeButton}
        >
          {'\u00d7'}
        </button>
      </div>

      {/* Find row */}
      <div style={styles.row}>
        <input
          ref={findInputRef}
          type="text"
          placeholder="Find..."
          value={searchOptions.query}
          onChange={(e) => updateSearchOptions({ query: e.target.value })}
          onKeyDown={handleKeyDown}
          style={styles.findInput}
        />

        <ToggleButton
          active={searchOptions.isCaseSensitive}
          onClick={() => updateSearchOptions({ isCaseSensitive: !searchOptions.isCaseSensitive })}
          title="Match Case"
        >
          Aa
        </ToggleButton>
        <ToggleButton
          active={searchOptions.isWholeWord}
          onClick={() => updateSearchOptions({ isWholeWord: !searchOptions.isWholeWord })}
          title="Whole Word"
        >
          W
        </ToggleButton>
        <ToggleButton
          active={searchOptions.isRegex}
          onClick={() => updateSearchOptions({ isRegex: !searchOptions.isRegex })}
          title="Use Regular Expression"
        >
          .*
        </ToggleButton>

        <ActionButton onClick={handleFindPrev} title="Previous Match (Shift+Enter)">
          {'\u2191'}
        </ActionButton>
        <ActionButton onClick={handleFindNext} title="Next Match (Enter)">
          {'\u2193'}
        </ActionButton>
      </div>

      {/* Replace row */}
      {(findReplaceMode === 'replace' || findReplaceMode === 'findInFiles') && (
        <div style={styles.row}>
          <input
            type="text"
            placeholder="Replace..."
            value={searchOptions.replaceText}
            onChange={(e) => updateSearchOptions({ replaceText: e.target.value })}
            onKeyDown={handleKeyDown}
            style={styles.replaceInput}
          />

          <ActionButton onClick={handleReplace} title="Replace">
            Replace
          </ActionButton>
          <ActionButton onClick={handleReplaceAll} title="Replace All" primary>
            Replace All
          </ActionButton>
        </div>
      )}

      {/* Mark row */}
      {findReplaceMode === 'mark' && (
        <div style={styles.markRow}>
          <span style={styles.markLabel}>Style:</span>
          {([1, 2, 3, 4, 5] as const).map(style => (
            <div
              key={style}
              onClick={() => setMarkStyle(style)}
              style={styles.markColor(markStyle === style, style)}
            >
              {style}
            </div>
          ))}
          <div style={styles.spacer} />
          <ActionButton onClick={handleMark} title="Mark All" primary>
            Mark All
          </ActionButton>
          <ActionButton onClick={handleClearMarks} title="Clear All Marks">
            Clear Marks
          </ActionButton>
        </div>
      )}

      {/* Search in selection / wrap around */}
      <div style={styles.optionsRow}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={searchOptions.wrapAround}
            onChange={(e) => updateSearchOptions({ wrapAround: e.target.checked })}
            style={styles.checkbox}
          />
          Wrap around
        </label>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={searchOptions.searchInSelection}
            onChange={(e) => updateSearchOptions({ searchInSelection: e.target.checked })}
            style={styles.checkbox}
          />
          In selection
        </label>
      </div>
    </div>
  );
}
