import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';
import type { FileTab } from '../types';
import { getLanguageDisplayName, countWords, countLines } from '../utils/helpers';

interface StatusBarProps {
  theme: ThemeColors;
}

export function StatusBar({ theme }: StatusBarProps) {
  const {
    tabs, activeTabId, settings, zoomLevel, isRecordingMacro,
    updateTab, updateSettings,
  } = useEditorStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showEncodingPicker, setShowEncodingPicker] = useState(false);
  const [showEOLPicker, setShowEOLPicker] = useState(false);

  if (!activeTab) return null;

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

  const StatusItem = ({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        title={title}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '0 8px',
          cursor: onClick ? 'pointer' : 'default',
          backgroundColor: hovered && onClick ? 'rgba(255,255,255,0.1)' : 'transparent',
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
  };

  const Picker = ({ items, onSelect, onClose }: { items: { value: string; label: string }[]; onSelect: (value: string) => void; onClose: () => void }) => (
    <>
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
        onClick={onClose}
      />
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        minWidth: 180,
        maxHeight: 300,
        overflowY: 'auto',
        backgroundColor: theme.menuBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        padding: '4px 0',
        zIndex: 9999,
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
  );

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
        {isRecordingMacro && (
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
              onSelect={(val) => updateTab(activeTab.id, { lineEnding: val as FileTab['lineEnding'] })}
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

        {zoomLevel !== 0 && (
          <StatusItem title="Zoom Level">
            {zoomLevel > 0 ? '+' : ''}{zoomLevel}
          </StatusItem>
        )}
      </div>
    </div>
  );
}
