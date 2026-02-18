import React, { useState } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import {
  UI_ZINDEX_OVERLAY,
  UI_ZINDEX_DROPDOWN,
  UI_STATUS_PICKER_MAX_HEIGHT,
} from "../Commons/Constants";
import type { LineEnding } from "../Commons/Enums";
import { getLanguageDisplayName, countWords, countLines } from '../../Shared/Helpers/TextHelpers';

interface StatusBarProps {
  theme: ThemeColors;
}

export function StatusBar({ theme }: StatusBarProps) {
  const {
    tabs, activeTabId, settings, zoomLevel, isRecordingMacro,
    updateTab, updateSettings,
    isRepoInitialized, currentBranch, gitStatus, setSidebarPanel,
    aiEnabled, isAiStreaming, activeModelId, inlineSuggestionEnabled,
    SetShowAiSettings,
  } = useNotemacStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showEncodingPicker, setShowEncodingPicker] = useState(false);
  const [showEOLPicker, setShowEOLPicker] = useState(false);

  if (undefined === activeTab) return null;

  const lineCount = countLines(activeTab.content);
  const charCount = activeTab.content.length;
  const wordCount = countWords(activeTab.content);

  const languages = [
    'plaintext', 'javascript', 'typescript', 'python', 'ruby', 'go', 'rust',
    'c', 'cpp', 'csharp', 'java', 'swift', 'kotlin', 'php', 'html', 'css',
    'scss', 'json', 'xml', 'yaml', 'markdown', 'sql', 'shell', 'lua', 'perl',
    'r', 'dart', 'scala', 'haskell',
  ];

  const encodings = ['utf-8', 'utf-8-bom', 'utf-16le', 'utf-16be', 'iso-8859-1', 'windows-1252'];
  const eolOptions: Array<{ value: 'LF' | 'CRLF' | 'CR'; label: string }> = [
    { value: 'LF', label: 'LF (Unix/Mac)' },
    { value: 'CRLF', label: 'CRLF (Windows)' },
    { value: 'CR', label: 'CR (Old Mac)' },
  ];

  const StatusItem = React.memo(({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        title={title}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '0 8px',
          cursor: null !== onClick ? 'pointer' : 'default',
          backgroundColor: hovered && null !== onClick ? 'rgba(255,255,255,0.1)' : 'transparent',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        {children}
      </div>
    );
  });
  StatusItem.displayName = 'StatusItem';

  const Picker = React.memo(({ items, onSelect, onClose }: { items: { value: string; label: string }[]; onSelect: (value: string) => void; onClose: () => void }) => (
    <>
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: UI_ZINDEX_OVERLAY }}
        onClick={onClose}
      />
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        minWidth: 180,
        maxHeight: UI_STATUS_PICKER_MAX_HEIGHT,
        overflowY: 'auto',
        backgroundColor: theme.menuBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        padding: '4px 0',
        zIndex: UI_ZINDEX_DROPDOWN,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
      }}>
        {items.map(item => (
          <div
            key={item.value}
            onClick={() => { onSelect(item.value); onClose(); }}
            style={{
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 13,
              color: theme.menuText,
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = theme.bgHover}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            {item.label}
          </div>
        ))}
      </div>
    </>
  ));
  Picker.displayName = 'Picker';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 24,
      backgroundColor: theme.statusBarBg,
      color: theme.statusBarText,
      fontSize: 12,
      flexShrink: 0,
      padding: '0 4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {true === isRepoInitialized && (
          <StatusItem title={`Branch: ${currentBranch}${null !== gitStatus && undefined !== gitStatus.aheadBy ? ` ↑${gitStatus.aheadBy}` : ''}${null !== gitStatus && undefined !== gitStatus.behindBy ? ` ↓${gitStatus.behindBy}` : ''}`} onClick={() => setSidebarPanel('git')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11 }}>{'\ud83d\udd00'}</span>
              {currentBranch}
              {null !== gitStatus && 0 < gitStatus.aheadBy && <span style={{ fontSize: 10 }}>{'\u2191'}{gitStatus.aheadBy}</span>}
              {null !== gitStatus && 0 < gitStatus.behindBy && <span style={{ fontSize: 10 }}>{'\u2193'}{gitStatus.behindBy}</span>}
              {null !== gitStatus && true === gitStatus.isRepoDirty && <span style={{ fontSize: 10, color: '#f9e2af' }}>{'\u2022'}</span>}
            </span>
          </StatusItem>
        )}
        {true === isRecordingMacro && (
          <StatusItem>
            <span className="recording-indicator" style={{ color: '#ff4444' }}>
              {'\u23fa'} Recording
            </span>
          </StatusItem>
        )}
        <StatusItem title="Cursor Position">
          Ln {activeTab.cursorLine}, Col {activeTab.cursorColumn}
        </StatusItem>
        <StatusItem title="Character Count">
          {charCount} chars
        </StatusItem>
        <StatusItem title="Word Count">
          {wordCount} words
        </StatusItem>
        <StatusItem title="Line Count">
          {lineCount} lines
        </StatusItem>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <StatusItem title="Tab Size" onClick={() => {
          const newSize = settings.tabSize === 4 ? 2 : 4;
          updateSettings({ tabSize: newSize });
        }}>
          {settings.insertSpaces ? 'Spaces' : 'Tabs'}: {settings.tabSize}
        </StatusItem>

        <StatusItem title="Line Ending" onClick={() => setShowEOLPicker(!showEOLPicker)}>
          {activeTab.lineEnding}
          {showEOLPicker && (
            <Picker
              items={eolOptions.map(o => ({ value: o.value, label: o.label }))}
              onSelect={(val) => updateTab(activeTab.id, { lineEnding: val as LineEnding })}
              onClose={() => setShowEOLPicker(false)}
            />
          )}
        </StatusItem>

        <StatusItem title="Encoding" onClick={() => setShowEncodingPicker(!showEncodingPicker)}>
          {activeTab.encoding.toUpperCase()}
          {showEncodingPicker && (
            <Picker
              items={encodings.map(e => ({ value: e, label: e.toUpperCase() }))}
              onSelect={(val) => updateTab(activeTab.id, { encoding: val })}
              onClose={() => setShowEncodingPicker(false)}
            />
          )}
        </StatusItem>

        <StatusItem title="Language" onClick={() => setShowLanguagePicker(!showLanguagePicker)}>
          {getLanguageDisplayName(activeTab.language)}
          {showLanguagePicker && (
            <Picker
              items={languages.map(l => ({ value: l, label: getLanguageDisplayName(l) }))}
              onSelect={(val) => updateTab(activeTab.id, { language: val })}
              onClose={() => setShowLanguagePicker(false)}
            />
          )}
        </StatusItem>

        {true === aiEnabled && (
          <StatusItem
            title={`AI: ${activeModelId}${true === inlineSuggestionEnabled ? ' (Inline On)' : ''}`}
            onClick={() => SetShowAiSettings(true)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {true === isAiStreaming
                ? <span style={{ color: '#a6e3a1', animation: 'pulse 1s infinite' }}>{'\u2728'} Generating...</span>
                : <span style={{ color: theme.statusBarText, opacity: 0.8 }}>{'\u2728'} {activeModelId || 'No Model'}</span>
              }
            </span>
          </StatusItem>
        )}

        {0 !== zoomLevel && (
          <StatusItem title="Zoom Level">
            {0 < zoomLevel ? '+' : ''}{zoomLevel}
          </StatusItem>
        )}
      </div>
    </div>
  );
}
