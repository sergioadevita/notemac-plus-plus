import React, { useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
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
import { WelcomeScreen } from './WelcomeScreenViewPresenter';
import { FeedbackPopup } from './FeedbackPopupViewPresenter';

// Lazy-loaded dialogs (rarely shown — improves initial load time)
const SettingsDialog = lazy(() => import('./SettingsDialogViewPresenter').then(m => ({ default: m.SettingsDialog })));
const GoToLineDialog = lazy(() => import('./GoToLineDialogViewPresenter').then(m => ({ default: m.GoToLineDialog })));
const AboutDialog = lazy(() => import('./AboutDialogViewPresenter').then(m => ({ default: m.AboutDialog })));
const RunCommandDialog = lazy(() => import('./RunCommandDialogViewPresenter').then(m => ({ default: m.RunCommandDialog })));
const ColumnEditorDialog = lazy(() => import('./ColumnEditorDialogViewPresenter').then(m => ({ default: m.ColumnEditorDialog })));
const SummaryDialog = lazy(() => import('./SummaryDialogViewPresenter').then(m => ({ default: m.SummaryDialog })));
const CharInRangeDialog = lazy(() => import('./CharInRangeDialogViewPresenter').then(m => ({ default: m.CharInRangeDialog })));
const ShortcutMapperDialog = lazy(() => import('./ShortcutMapperDialogViewPresenter').then(m => ({ default: m.ShortcutMapperDialog })));
const CommandPaletteViewPresenter = lazy(() => import('./CommandPaletteViewPresenter').then(m => ({ default: m.CommandPaletteViewPresenter })));
const QuickOpenViewPresenter = lazy(() => import('./QuickOpenViewPresenter').then(m => ({ default: m.QuickOpenViewPresenter })));
const DiffViewerViewPresenter = lazy(() => import('./DiffViewerViewPresenter').then(m => ({ default: m.DiffViewerViewPresenter })));
const SnippetManagerViewPresenter = lazy(() => import('./SnippetManagerViewPresenter').then(m => ({ default: m.SnippetManagerViewPresenter })));
const TerminalPanelViewPresenter = lazy(() => import('./TerminalPanelViewPresenter').then(m => ({ default: m.TerminalPanelViewPresenter })));
const CloneRepositoryViewPresenter = lazy(() => import('./CloneRepositoryViewPresenter').then(m => ({ default: m.CloneRepositoryViewPresenter })));
const GitSettingsViewPresenter = lazy(() => import('./GitSettingsViewPresenter').then(m => ({ default: m.GitSettingsViewPresenter })));

export default function App()
{
  const tabs = useNotemacStore(s => s.tabs);
  const activeTabId = useNotemacStore(s => s.activeTabId);
  const sidebarPanel = useNotemacStore(s => s.sidebarPanel);
  const showStatusBar = useNotemacStore(s => s.showStatusBar);
  const showToolbar = useNotemacStore(s => s.showToolbar);
  const settings = useNotemacStore(s => s.settings);
  const showFindReplace = useNotemacStore(s => s.showFindReplace);
  const showSettings = useNotemacStore(s => s.showSettings);
  const showGoToLine = useNotemacStore(s => s.showGoToLine);
  const showAbout = useNotemacStore(s => s.showAbout);
  const showRunCommand = useNotemacStore(s => s.showRunCommand);
  const showColumnEditor = useNotemacStore(s => s.showColumnEditor);
  const showSummary = useNotemacStore(s => s.showSummary);
  const showCharInRange = useNotemacStore(s => s.showCharInRange);
  const showShortcutMapper = useNotemacStore(s => s.showShortcutMapper);
  const showCommandPalette = useNotemacStore(s => s.showCommandPalette);
  const showQuickOpen = useNotemacStore(s => s.showQuickOpen);
  const showDiffViewer = useNotemacStore(s => s.showDiffViewer);
  const showSnippetManager = useNotemacStore(s => s.showSnippetManager);
  const showTerminalPanel = useNotemacStore(s => s.showTerminalPanel);
  const showCloneDialog = useNotemacStore(s => s.showCloneDialog);
  const showGitSettings = useNotemacStore(s => s.showGitSettings);
  const splitView = useNotemacStore(s => s.splitView);
  const splitTabId = useNotemacStore(s => s.splitTabId);
  const addTab = useNotemacStore(s => s.addTab);
  const zoomLevel = useNotemacStore(s => s.zoomLevel);

  const theme = useMemo(() => GetTheme(settings.theme), [settings.theme]);

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

          {/* Terminal panel — between editor and status bar */}
          {showTerminalPanel && (
            <Suspense fallback={null}>
              <TerminalPanelViewPresenter theme={theme} />
            </Suspense>
          )}
        </div>
      </div>

      {showStatusBar && !isDistractionFree && <StatusBar theme={theme} />}

      {/* Lazy-loaded dialogs */}
      <Suspense fallback={null}>
        {showSettings && <SettingsDialog theme={theme} />}
        {showGoToLine && <GoToLineDialog theme={theme} />}
        {showAbout && <AboutDialog theme={theme} />}
        {showRunCommand && <RunCommandDialog theme={theme} />}
        {showColumnEditor && <ColumnEditorDialog theme={theme} />}
        {showSummary && <SummaryDialog theme={theme} />}
        {showCharInRange && <CharInRangeDialog theme={theme} />}
        {showShortcutMapper && <ShortcutMapperDialog theme={theme} />}
        {showCommandPalette && <CommandPaletteViewPresenter theme={theme} />}
        {showQuickOpen && <QuickOpenViewPresenter theme={theme} />}
        {showDiffViewer && <DiffViewerViewPresenter theme={theme} />}
        {showSnippetManager && <SnippetManagerViewPresenter theme={theme} />}
        {showCloneDialog && <CloneRepositoryViewPresenter theme={theme} />}
        {showGitSettings && <GitSettingsViewPresenter theme={theme} />}
      </Suspense>
      <FeedbackPopup theme={theme} />
    </div>
  );
}
