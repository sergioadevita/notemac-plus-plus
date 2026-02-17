import React, { useEffect, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import { GetTheme } from "../Configs/ThemeConfig";
import { HandleKeyDown } from "../Controllers/AppController";
import { HandleMenuAction } from "../Controllers/MenuActionController";
import { HandleDragOver, HandleDrop, SetupElectronIPC } from "../Controllers/FileController";
import { MenuBar } from './MenuBarViewPresenter';
import { Toolbar } from './ToolbarViewPresenter';
import { TabBar } from './TabBarViewPresenter';
import { EditorPanel } from './EditorPanelViewPresenter';
import { StatusBar } from './StatusBarViewPresenter';
import { Sidebar } from './SidebarViewPresenter';
import { FindReplace } from './FindReplaceViewPresenter';
import { SettingsDialog } from './SettingsDialogViewPresenter';
import { GoToLineDialog } from './GoToLineDialogViewPresenter';
import { AboutDialog } from './AboutDialogViewPresenter';
import { WelcomeScreen } from './WelcomeScreenViewPresenter';
import { RunCommandDialog } from './RunCommandDialogViewPresenter';
import { ColumnEditorDialog } from './ColumnEditorDialogViewPresenter';
import { SummaryDialog } from './SummaryDialogViewPresenter';
import { CharInRangeDialog } from './CharInRangeDialogViewPresenter';
import { ShortcutMapperDialog } from './ShortcutMapperDialogViewPresenter';
import { FeedbackPopup } from './FeedbackPopupViewPresenter';

export default function App()
{
  const {
    tabs,
    activeTabId,
    sidebarPanel,
    showStatusBar,
    showToolbar,
    settings,
    showFindReplace,
    showSettings,
    showGoToLine,
    showAbout,
    showRunCommand,
    showColumnEditor,
    showSummary,
    showCharInRange,
    showShortcutMapper,
    splitView,
    splitTabId,
    addTab,
    zoomLevel,
  } = useNotemacStore();

  const theme = GetTheme(settings.theme);

  // Keyboard shortcut handler — delegates to NotemacAppController
  const onKeyDown = useCallback((e: KeyboardEvent) =>
  {
    HandleKeyDown(e, activeTabId, zoomLevel);
  }, [activeTabId, zoomLevel]);

  useEffect(() =>
  {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // File drag-drop — delegates to NotemacFileController
  useEffect(() =>
  {
    document.addEventListener('dragover', HandleDragOver);
    document.addEventListener('drop', HandleDrop);
    return () =>
    {
      document.removeEventListener('dragover', HandleDragOver);
      document.removeEventListener('drop', HandleDrop);
    };
  }, []);

  // Electron IPC setup — delegates to NotemacFileController
  useEffect(() =>
  {
    SetupElectronIPC();
  }, []);

  // Menu action handler — delegates to NotemacMenuActionController
  const handleMenuAction = useCallback((action: string, value?: any) =>
  {
    HandleMenuAction(action, activeTabId, tabs, zoomLevel, value);
  }, [activeTabId, zoomLevel, tabs]);

  // Create initial tab if none exist
  useEffect(() =>
  {
    if (0 === tabs.length)
      addTab({ name: 'new 1', content: '' });
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isDistractionFree = settings.distractionFreeMode;

  const isElectron = !!window.electronAPI;

  return (
    <div
      className="notemac-app"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontSize: settings.fontSize + zoomLevel,
      }}
    >
      {/* Electron: draggable title bar region for window controls */}
      {isElectron && !isDistractionFree && (
        <div
          style={{
            height: 38,
            backgroundColor: theme.menuBg,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 78,
            flexShrink: 0,
            WebkitAppRegion: 'drag',
          } as React.CSSProperties}
        >
          <span style={{
            fontWeight: 600,
            fontSize: 13,
            color: theme.text,
            opacity: 0.7,
            WebkitAppRegion: 'no-drag',
            userSelect: 'none',
          } as React.CSSProperties}>
            {activeTab ? activeTab.name + (activeTab.isModified ? ' \u2022' : '') + ' \u2014 ' : ''}Notemac++
          </span>
        </div>
      )}

      {!isDistractionFree && !isElectron && (
        <MenuBar theme={theme} onAction={handleMenuAction} isElectron={isElectron} />
      )}

      {showToolbar && !isDistractionFree && <Toolbar theme={theme} onAction={handleMenuAction} />}

      {!isDistractionFree && <TabBar theme={theme} />}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarPanel && !isDistractionFree && <Sidebar theme={theme} />}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showFindReplace && <FindReplace theme={theme} />}

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: splitView === 'horizontal' ? 'column' : 'row',
            overflow: 'hidden',
          }}>
            {activeTab ? (
              <>
                <EditorPanel
                  key={activeTab.id}
                  tab={activeTab}
                  theme={theme}
                  settings={settings}
                  zoomLevel={zoomLevel}
                />
                {splitView !== 'none' && splitTabId && (
                  <>
                    <div style={{
                      width: splitView === 'vertical' ? 4 : undefined,
                      height: splitView === 'horizontal' ? 4 : undefined,
                      backgroundColor: theme.border,
                      cursor: splitView === 'vertical' ? 'col-resize' : 'row-resize',
                    }} />
                    <EditorPanel
                      key={splitTabId + '-split'}
                      tab={tabs.find(t => t.id === splitTabId) || activeTab}
                      theme={theme}
                      settings={settings}
                      zoomLevel={zoomLevel}
                    />
                  </>
                )}
              </>
            ) : (
              <WelcomeScreen theme={theme} />
            )}
          </div>
        </div>
      </div>

      {showStatusBar && !isDistractionFree && <StatusBar theme={theme} />}

      {showSettings && <SettingsDialog theme={theme} />}
      {showGoToLine && <GoToLineDialog theme={theme} />}
      {showAbout && <AboutDialog theme={theme} />}
      {showRunCommand && <RunCommandDialog theme={theme} />}
      {showColumnEditor && <ColumnEditorDialog theme={theme} />}
      {showSummary && <SummaryDialog theme={theme} />}
      {showCharInRange && <CharInRangeDialog theme={theme} />}
      {showShortcutMapper && <ShortcutMapperDialog theme={theme} />}
      <FeedbackPopup theme={theme} />
    </div>
  );
}
