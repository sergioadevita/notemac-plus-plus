import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';
import { TAB_COLORS, type TabColor } from '../types';

interface TabBarProps {
  theme: ThemeColors;
}

export function TabBar({ theme }: TabBarProps) {
  const {
    tabs, activeTabId, setActiveTab, closeTab, addTab,
    closeOtherTabs, closeAllTabs, moveTab, setSplitView,
    closeTabsToLeft, closeTabsToRight, closeUnchangedTabs,
    closeAllButPinned, togglePinTab, setTabColor,
  } = useEditorStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      moveTab(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    setShowColorPicker(false);
  };

  const handleTabMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  React.useEffect(() => {
    const handleClick = () => { setContextMenu(null); setShowColorPicker(false); };
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const contextTab = contextMenu ? tabs.find(t => t.id === contextMenu.tabId) : null;

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        backgroundColor: theme.tabBg,
        borderBottom: `1px solid ${theme.border}`,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        flexShrink: 0,
        height: 36,
      }}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const tabColorValue = TAB_COLORS[tab.tabColor];
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => handleTabMiddleClick(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                backgroundColor: isActive ? theme.tabActiveBg : theme.tabBg,
                color: isActive ? theme.tabActiveText : theme.textSecondary,
                borderRight: `1px solid ${theme.tabBorder}`,
                borderTop: tab.tabColor !== 'none'
                  ? `3px solid ${tabColorValue}`
                  : isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
                borderBottom: isActive ? 'none' : `1px solid ${theme.border}`,
                minWidth: 100,
                maxWidth: 200,
                height: 36,
                position: 'relative',
                opacity: dragIndex === index ? 0.5 : 1,
                borderLeft: dragOverIndex === index ? `2px solid ${theme.accent}` : 'none',
                fontSize: 13,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {tab.isPinned && (
                  <span style={{ fontSize: 10, opacity: 0.7 }} title="Pinned">{'\ud83d\udccc'}</span>
                )}
                {tab.isModified && (
                  <span style={{ color: theme.warning }}>{'\u25cf'}</span>
                )}
                {tab.isReadOnly && (
                  <span style={{ fontSize: 10, opacity: 0.7 }} title="Read Only">{'\ud83d\udd12'}</span>
                )}
                {tab.name}
              </span>
              {!tab.isPinned && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontSize: 14,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.opacity = '1';
                    (e.target as HTMLElement).style.backgroundColor = theme.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.5';
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {'\u00d7'}
                </span>
              )}
            </div>
          );
        })}

        {/* New tab button */}
        <div
          onClick={() => addTab()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 36,
            cursor: 'pointer',
            color: theme.textMuted,
            fontSize: 18,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.color = theme.text;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.color = theme.textMuted;
          }}
        >
          +
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: theme.menuBg,
            border: `1px solid ${theme.border}`,
            position: 'fixed',
            zIndex: 20000,
            borderRadius: 6,
            padding: '4px 0',
            minWidth: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {[
            { label: 'Close', action: () => closeTab(contextMenu.tabId) },
            { label: 'Close Others', action: () => closeOtherTabs(contextMenu.tabId) },
            { label: 'Close Tabs to the Left', action: () => closeTabsToLeft(contextMenu.tabId) },
            { label: 'Close Tabs to the Right', action: () => closeTabsToRight(contextMenu.tabId) },
            { label: 'Close All', action: () => closeAllTabs() },
            { label: 'Close Unchanged', action: () => closeUnchangedTabs() },
            { label: 'Close All but Pinned', action: () => closeAllButPinned() },
            { label: 'separator' },
            { label: contextTab?.isPinned ? 'Unpin Tab' : 'Pin Tab', action: () => togglePinTab(contextMenu.tabId) },
            { label: 'separator' },
            { label: 'Tab Color', action: () => setShowColorPicker(!showColorPicker) },
            { label: 'separator' },
            { label: 'Clone to Split View', action: () => setSplitView('vertical', contextMenu.tabId) },
          ].map((item, i) => {
            if (item.label === 'separator') {
              return <div key={i} style={{ height: 1, backgroundColor: theme.border, margin: '4px 0' }} />;
            }
            return (
              <div
                key={i}
                style={{
                  padding: '5px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: theme.menuText,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  item.action!();
                  if (item.label !== 'Tab Color') setContextMenu(null);
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = theme.bgHover;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {item.label}
              </div>
            );
          })}

          {/* Color picker sub-menu */}
          {showColorPicker && (
            <div style={{
              display: 'flex',
              gap: 4,
              padding: '4px 16px 8px',
            }}>
              {(['none', 'color1', 'color2', 'color3', 'color4', 'color5'] as TabColor[]).map(color => (
                <div
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTabColor(contextMenu.tabId, color);
                    setContextMenu(null);
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: color === 'none' ? theme.bgTertiary : TAB_COLORS[color],
                    border: contextTab?.tabColor === color ? '2px solid white' : `1px solid ${theme.border}`,
                    cursor: 'pointer',
                  }}
                  title={color === 'none' ? 'No color' : color}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
