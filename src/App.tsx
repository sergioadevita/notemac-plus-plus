import React, { useEffect, useCallback } from 'react';
import { useEditorStore } from './store/editorStore';
import { getTheme } from './utils/themes';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/TabBar';
import { EditorPanel } from './components/EditorPanel';
import { StatusBar } from './components/StatusBar';
import { Sidebar } from './components/Sidebar';
import { FindReplace } from './components/FindReplace';
import { SettingsDialog } from './components/SettingsDialog';
import { GoToLineDialog } from './components/GoToLineDialog';
import { AboutDialog } from './components/AboutDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RunCommandDialog } from './components/RunCommandDialog';
import { ColumnEditorDialog } from './components/ColumnEditorDialog';
import { SummaryDialog } from './components/SummaryDialog';
import { CharInRangeDialog } from './components/CharInRangeDialog';
import { ShortcutMapperDialog } from './components/ShortcutMapperDialog';
import { FeedbackPopup } from './components/FeedbackPopup';
import { detectLanguage, detectLineEnding } from './utils/helpers';
import { InitGitForWorkspace } from './Notemac/Controllers/GitController';

export default function App() {
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
    closeTab,
    setActiveTab,
    updateTab,
    setShowFindReplace,
    setShowSettings,
    setShowGoToLine,
    setShowAbout,
    setShowRunCommand,
    setShowColumnEditor,
    setShowSummary,
    setShowCharInRange,
    setShowShortcutMapper,
    setSidebarPanel,
    toggleSidebar,
    setFileTree,
    setWorkspacePath,
    updateSettings,
    setZoomLevel,
    zoomLevel,
    setSplitView,
    startRecordingMacro,
    stopRecordingMacro,
    isRecordingMacro,
    addRecentFile,
    restoreLastClosedTab,
    closeTabsToLeft,
    closeTabsToRight,
    closeUnchangedTabs,
    closeAllButPinned,
    togglePinTab,
  } = useEditorStore();

  const theme = getTheme(settings.theme);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === 'n') {
      e.preventDefault();
      addTab();
    } else if (isMod && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    } else if (isMod && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      restoreLastClosedTab();
    } else if (isMod && e.key === 'f') {
      e.preventDefault();
      setShowFindReplace(true, 'find');
    } else if (isMod && e.key === 'h') {
      e.preventDefault();
      setShowFindReplace(true, 'replace');
    } else if (isMod && e.key === 'g') {
      e.preventDefault();
      setShowGoToLine(true);
    } else if (isMod && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    } else if (isMod && e.key === ',') {
      e.preventDefault();
      setShowSettings(true);
    } else if (isMod && e.key === '=') {
      e.preventDefault();
      setZoomLevel(zoomLevel + 1);
    } else if (isMod && e.key === '-') {
      e.preventDefault();
      setZoomLevel(zoomLevel - 1);
    } else if (isMod && e.key === '0') {
      e.preventDefault();
      setZoomLevel(0);
    } else if (isMod && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      setShowFindReplace(true, 'findInFiles');
    } else if (isMod && e.key === 'p') {
      e.preventDefault();
      window.print();
    } else if (e.key === 'Escape') {
      setShowFindReplace(false);
      setShowSettings(false);
      setShowGoToLine(false);
      setShowAbout(false);
      setShowRunCommand(false);
      setShowColumnEditor(false);
      setShowSummary(false);
      setShowCharInRange(false);
      setShowShortcutMapper(false);
    }
  }, [activeTabId, zoomLevel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle file open from web (drag & drop)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.files) {
        for (const file of Array.from(e.dataTransfer.files)) {
          const content = await file.text();
          addTab({
            name: file.name,
            content,
            language: detectLanguage(file.name),
            lineEnding: detectLineEnding(content),
          });
        }
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Handle Electron IPC
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onFileOpened((data: any) => {
        const existing = tabs.find(t => t.path === data.path);
        if (existing) {
          setActiveTab(existing.id);
        } else {
          addTab({
            name: data.name,
            path: data.path,
            content: data.content,
            language: detectLanguage(data.name),
            lineEnding: detectLineEnding(data.content),
          });
          addRecentFile(data.path, data.name);
        }
      });

      window.electronAPI.onFolderOpened((data: any) => {
        setFileTree(data.tree);
        setWorkspacePath(data.path);
        setSidebarPanel('explorer');

        // Detect git repo in the opened folder
        InitGitForWorkspace();
      });

      window.electronAPI.onMenuAction((action: string, value: any) => {
        handleMenuAction(action, value);
      });
    }
  }, []);

  const handleMenuAction = useCallback((action: string, value?: any) => {
    const editorAction = window.__editorAction;

    switch (action) {
      // File actions
      case 'new': addTab(); break;
      case 'close-tab': if (activeTabId) closeTab(activeTabId); break;
      case 'close-all': useEditorStore.getState().closeAllTabs(); break;
      case 'close-others': if (activeTabId) useEditorStore.getState().closeOtherTabs(activeTabId); break;
      case 'close-tabs-to-left': if (activeTabId) closeTabsToLeft(activeTabId); break;
      case 'close-tabs-to-right': if (activeTabId) closeTabsToRight(activeTabId); break;
      case 'close-unchanged': closeUnchangedTabs(); break;
      case 'close-all-but-pinned': closeAllButPinned(); break;
      case 'restore-last-closed': restoreLastClosedTab(); break;
      case 'pin-tab': if (activeTabId) togglePinTab(activeTabId); break;
      case 'print': window.print(); break;

      // Search actions
      case 'find': setShowFindReplace(true, 'find'); break;
      case 'replace': setShowFindReplace(true, 'replace'); break;
      case 'find-in-files': setShowFindReplace(true, 'findInFiles'); break;
      case 'mark': setShowFindReplace(true, 'mark'); break;
      case 'incremental-search': useEditorStore.getState().setShowIncrementalSearch(true); break;
      case 'goto-line': setShowGoToLine(true); break;
      case 'find-char-in-range': setShowCharInRange(true); break;

      // View actions
      case 'word-wrap': updateSettings({ wordWrap: value }); break;
      case 'show-whitespace': updateSettings({ showWhitespace: value, renderWhitespace: value ? 'all' : 'none' }); break;
      case 'show-eol': updateSettings({ showEOL: value }); break;
      case 'show-non-printable': updateSettings({ showNonPrintable: value }); break;
      case 'show-wrap-symbol': updateSettings({ showWrapSymbol: value }); break;
      case 'indent-guide': updateSettings({ showIndentGuides: value }); break;
      case 'show-line-numbers': updateSettings({ showLineNumbers: value }); break;
      case 'toggle-minimap': updateSettings({ showMinimap: value }); break;
      case 'zoom-in': setZoomLevel(zoomLevel + 1); break;
      case 'zoom-out': setZoomLevel(zoomLevel - 1); break;
      case 'zoom-reset': setZoomLevel(0); break;
      case 'toggle-sidebar': toggleSidebar(); break;
      case 'show-doc-list': setSidebarPanel('docList'); break;
      case 'show-function-list': setSidebarPanel('functions'); break;
      case 'show-project-panel': setSidebarPanel('project'); break;
      case 'distraction-free': updateSettings({ distractionFreeMode: value }); break;
      case 'always-on-top': {
        updateSettings({ alwaysOnTop: value });
        if (window.electronAPI) window.electronAPI.setAlwaysOnTop?.(value);
        break;
      }
      case 'sync-scroll-v': updateSettings({ syncScrollVertical: value }); break;
      case 'sync-scroll-h': updateSettings({ syncScrollHorizontal: value }); break;
      case 'split-right': if (activeTabId) setSplitView('vertical', activeTabId); break;
      case 'split-down': if (activeTabId) setSplitView('horizontal', activeTabId); break;
      case 'close-split': setSplitView('none'); break;
      case 'show-summary': setShowSummary(true); break;
      case 'toggle-monitoring': {
        if (activeTabId) {
          const tab = tabs.find(t => t.id === activeTabId);
          if (tab) updateTab(activeTabId, { isMonitoring: !tab.isMonitoring });
        }
        break;
      }

      // Language / Encoding
      case 'language': if (activeTabId) updateTab(activeTabId, { language: value }); break;
      case 'encoding': if (activeTabId) updateTab(activeTabId, { encoding: value }); break;
      case 'line-ending': if (activeTabId) updateTab(activeTabId, { lineEnding: value }); break;

      // Macro
      case 'macro-start': startRecordingMacro(); break;
      case 'macro-stop': stopRecordingMacro(); break;

      // Dialogs
      case 'preferences': setShowSettings(true); break;
      case 'about': setShowAbout(true); break;
      case 'run-command': setShowRunCommand(true); break;
      case 'column-editor': setShowColumnEditor(true); break;
      case 'shortcut-mapper': setShowShortcutMapper(true); break;
      case 'clipboard-history': setSidebarPanel('clipboardHistory'); break;
      case 'char-panel': setSidebarPanel('charPanel'); break;

      // Run menu
      case 'search-google': {
        const sel = window.getSelection()?.toString();
        if (sel) window.open(`https://www.google.com/search?q=${encodeURIComponent(sel)}`, '_blank');
        break;
      }
      case 'search-wikipedia': {
        const sel = window.getSelection()?.toString();
        if (sel) window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(sel)}`, '_blank');
        break;
      }
      case 'open-in-browser': {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab && tab.path) window.open(`file://${tab.path}`, '_blank');
        break;
      }

      // Session management
      case 'save-session': {
        const session = useEditorStore.getState().saveSession();
        const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'session.json'; a.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'load-session': {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const text = await file.text();
            try { useEditorStore.getState().loadSession(JSON.parse(text)); } catch { /* Invalid session JSON — ignore */ }
          }
        };
        input.click();
        break;
      }

      // All editor-handled actions (pass through)
      default:
        if (editorAction) editorAction(action, value);
        break;
    }
  }, [activeTabId, zoomLevel, tabs]);

  // Create initial tab if none exist
  useEffect(() => {
    if (tabs.length === 0) {
      addTab({ name: 'new 1', content: '' });
    }
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

      {!isDistractionFree && (
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
