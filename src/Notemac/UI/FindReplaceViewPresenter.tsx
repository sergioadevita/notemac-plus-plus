import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { MARK_COLORS } from '../Commons/Constants';

interface FindReplaceProps {
  theme: ThemeColors;
}

export function FindReplace({ theme }: FindReplaceProps) {
  const {
    findReplaceMode,
    searchOptions,
    updateSearchOptions,
    setShowFindReplace,
  } = useNotemacStore();

  const findInputRef = useRef<HTMLInputElement>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
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
  }) => (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
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
      }}
    >
      {children}
    </button>
  );

  const ActionButton = ({ onClick, title, children, primary }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    primary?: boolean;
  }) => (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
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
      }}
    >
      {children}
    </button>
  );

  const modes: { key: typeof findReplaceMode; label: string }[] = [
    { key: 'find', label: 'Find' },
    { key: 'replace', label: 'Replace' },
    { key: 'findInFiles', label: 'Find in Files' },
    { key: 'mark', label: 'Mark' },
  ];

  return (
    <div style={{
      backgroundColor: theme.findBg,
      borderBottom: `1px solid ${theme.border}`,
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      flexShrink: 0,
    }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {modes.map(mode => (
          <span
            key={mode.key}
            onClick={() => useNotemacStore.getState().setShowFindReplace(true, mode.key)}
            style={{
              fontSize: 12,
              fontWeight: findReplaceMode === mode.key ? 600 : 400,
              color: findReplaceMode === mode.key ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              borderBottom: findReplaceMode === mode.key ? `2px solid ${theme.accent}` : 'none',
              paddingBottom: 2,
            }}
          >
            {mode.label}
          </span>
        ))}

        <div style={{ flex: 1 }} />

        <button
          aria-label="Close find and replace"
          onClick={() => setShowFindReplace(false)}
          style={{
            cursor: 'pointer',
            color: theme.textMuted,
            fontSize: 16,
            padding: '0 4px',
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {'\u00d7'}
        </button>
      </div>

      {/* Find row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          ref={findInputRef}
          type="text"
          placeholder="Find..."
          value={searchOptions.query}
          onChange={(e) => updateSearchOptions({ query: e.target.value })}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            height: 28,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: '0 8px',
            fontSize: 13,
          }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="text"
            placeholder="Replace..."
            value={searchOptions.replaceText}
            onChange={(e) => updateSearchOptions({ replaceText: e.target.value })}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              height: 28,
              backgroundColor: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              padding: '0 8px',
              fontSize: 13,
            }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: theme.textSecondary }}>Style:</span>
          {([1, 2, 3, 4, 5] as const).map(style => (
            <div
              key={style}
              onClick={() => setMarkStyle(style)}
              style={{
                width: 24,
                height: 20,
                borderRadius: 3,
                backgroundColor: MARK_COLORS[style],
                border: markStyle === style ? '2px solid white' : `1px solid ${theme.border}`,
                cursor: 'pointer',
                opacity: markStyle === style ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {style}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <ActionButton onClick={handleMark} title="Mark All" primary>
            Mark All
          </ActionButton>
          <ActionButton onClick={handleClearMarks} title="Clear All Marks">
            Clear Marks
          </ActionButton>
        </div>
      )}

      {/* Search in selection / wrap around */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: theme.textSecondary }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={searchOptions.wrapAround}
            onChange={(e) => updateSearchOptions({ wrapAround: e.target.checked })}
            style={{ accentColor: theme.accent }}
          />
          Wrap around
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={searchOptions.searchInSelection}
            onChange={(e) => updateSearchOptions({ searchInSelection: e.target.checked })}
            style={{ accentColor: theme.accent }}
          />
          In selection
        </label>
      </div>
    </div>
  );
}
