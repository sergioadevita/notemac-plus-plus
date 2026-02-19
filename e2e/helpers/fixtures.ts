import { Page } from '@playwright/test';

/**
 * Create a tab with specific content via the store.
 */
export async function createTestFile(page: Page, name: string, content: string, language?: string): Promise<string> {
  return page.evaluate(({ n, c, l }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return '';
    store.getState().addTab({ name: n, content: c, language: l || 'plaintext' });
    return store.getState().activeTabId;
  }, { n: name, c: content, l: language });
}

/**
 * Create multiple tabs with distinct names and content.
 */
export async function createMultipleTabs(page: Page, count: number): Promise<string[]> {
  return page.evaluate((cnt) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return [];
    const ids: string[] = [];
    for (let i = 0; i < cnt; i++) {
      store.getState().addTab({
        name: `test-file-${i + 1}.txt`,
        content: `// Content of file ${i + 1}\nconsole.log("file ${i + 1}");`,
        language: 'javascript',
      });
      ids.push(store.getState().activeTabId);
    }
    return ids;
  }, count);
}

/**
 * Get the Monaco editor content for the active tab.
 */
export async function getEditorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return '';
    const state = store.getState();
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    return tab?.content || '';
  });
}

/**
 * Set the editor content for the active tab directly.
 */
export async function setEditorContent(page: Page, content: string): Promise<void> {
  await page.evaluate((c) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;
    const state = store.getState();
    state.updateTabContent(state.activeTabId, c);
  }, content);
  await page.waitForTimeout(200);
}

/**
 * Get all tab names from the store.
 */
export async function getTabNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return [];
    return store.getState().tabs.map((t: any) => t.name);
  });
}

/**
 * Get all tab IDs from the store.
 */
export async function getTabIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return [];
    return store.getState().tabs.map((t: any) => t.id);
  });
}

/**
 * Mark a tab as modified via the store.
 */
export async function markTabModified(page: Page, tabIndex: number): Promise<void> {
  await page.evaluate((idx) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;
    const tab = store.getState().tabs[idx];
    if (tab) store.getState().updateTab(tab.id, { isModified: true });
  }, tabIndex);
}

/**
 * Close all tabs to reset state.
 */
export async function closeAllTabs(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().closeAllTabs();
  });
  await page.waitForTimeout(300);
}

/**
 * Trigger a HandleMenuAction via the store.
 */
export async function triggerMenuAction(page: Page, action: string, value?: any): Promise<void> {
  await page.evaluate(({ a, v }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;
    const state = store.getState();
    // Import HandleMenuAction dynamically is not possible in evaluate,
    // so we dispatch directly via store methods based on action
    // This is a lightweight dispatcher for common test actions
    const actions: Record<string, () => void> = {
      'new': () => state.addTab(),
      'close-tab': () => { if (state.activeTabId) state.closeTab(state.activeTabId); },
      'close-all': () => state.closeAllTabs(),
      'close-others': () => { if (state.activeTabId) state.closeOtherTabs(state.activeTabId); },
      'close-tabs-to-left': () => { if (state.activeTabId) state.closeTabsToLeft(state.activeTabId); },
      'close-tabs-to-right': () => { if (state.activeTabId) state.closeTabsToRight(state.activeTabId); },
      'close-unchanged': () => state.closeUnchangedTabs(),
      'close-all-but-pinned': () => state.closeAllButPinned(),
      'restore-last-closed': () => state.restoreLastClosedTab(),
      'pin-tab': () => { if (state.activeTabId) state.togglePinTab(state.activeTabId); },
      'find': () => state.setShowFindReplace(true, 'find'),
      'replace': () => state.setShowFindReplace(true, 'replace'),
      'find-in-files': () => state.setShowFindReplace(true, 'findInFiles'),
      'mark': () => state.setShowFindReplace(true, 'mark'),
      'goto-line': () => state.setShowGoToLine(true),
      'incremental-search': () => state.setShowIncrementalSearch(true),
      'find-char-in-range': () => state.setShowCharInRange(true),
      'word-wrap': () => state.updateSettings({ wordWrap: v as boolean }),
      'show-whitespace': () => state.updateSettings({ showWhitespace: v as boolean, renderWhitespace: v ? 'all' : 'none' }),
      'show-eol': () => state.updateSettings({ showEOL: v as boolean }),
      'show-line-numbers': () => state.updateSettings({ showLineNumbers: v as boolean }),
      'toggle-minimap': () => state.updateSettings({ showMinimap: v as boolean }),
      'zoom-in': () => state.setZoomLevel(state.zoomLevel + 1),
      'zoom-out': () => state.setZoomLevel(state.zoomLevel - 1),
      'zoom-reset': () => state.setZoomLevel(0),
      'toggle-sidebar': () => state.toggleSidebar(),
      'toggle-terminal': () => state.setShowTerminalPanel(!state.showTerminalPanel),
      'split-right': () => { if (state.activeTabId) state.setSplitView('vertical', state.activeTabId); },
      'split-down': () => { if (state.activeTabId) state.setSplitView('horizontal', state.activeTabId); },
      'close-split': () => state.setSplitView('none'),
      'language': () => { if (state.activeTabId) state.updateTab(state.activeTabId, { language: v as string }); },
      'encoding': () => { if (state.activeTabId) state.updateTab(state.activeTabId, { encoding: v as string }); },
      'line-ending': () => { if (state.activeTabId) state.updateTab(state.activeTabId, { lineEnding: v as string }); },
      'macro-start': () => state.startRecordingMacro(),
      'macro-stop': () => state.stopRecordingMacro(),
      'command-palette': () => state.setShowCommandPalette(true),
      'quick-open': () => state.setShowQuickOpen(true),
      'compare-files': () => state.setShowDiffViewer(true),
      'snippet-manager': () => state.setShowSnippetManager(true),
      'clone-repository': () => state.setShowCloneDialog(true),
      'git-settings': () => state.setShowGitSettings(true),
      'show-git-panel': () => state.setSidebarPanel('git'),
      'ai-chat': () => state.setSidebarPanel('ai'),
      'ai-settings': () => state.SetShowAiSettings(true),
      'ai-toggle-inline': () => state.SetInlineSuggestionEnabled(!state.inlineSuggestionEnabled),
      'preferences': () => state.setShowSettings(true),
      'about': () => state.setShowAbout(true),
      'run-command': () => state.setShowRunCommand(true),
      'column-editor': () => state.setShowColumnEditor(true),
      'shortcut-mapper': () => state.setShowShortcutMapper(true),
      'clipboard-history': () => state.setSidebarPanel('clipboardHistory'),
      'char-panel': () => state.setSidebarPanel('charPanel'),
      'show-doc-list': () => state.setSidebarPanel('docList'),
      'show-function-list': () => state.setSidebarPanel('functions'),
      'show-project-panel': () => state.setSidebarPanel('project'),
      'show-summary': () => state.setShowSummary(true),
      'distraction-free': () => state.updateSettings({ distractionFreeMode: v as boolean }),
      'always-on-top': () => state.updateSettings({ alwaysOnTop: v as boolean }),
    };
    if (actions[a]) actions[a]();
  }, { a: action, v: value });
  await page.waitForTimeout(300);
}
