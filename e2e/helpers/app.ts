import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for the app to fully initialize (Monaco editor ready).
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the main app container to render
  await page.waitForSelector('.notemac-app, #root > div', { timeout: 15_000 });
  // Give Monaco editor time to initialize
  await page.waitForTimeout(2000);
}

/**
 * Press a keyboard shortcut, translating Cmd to the platform modifier.
 * Supports formats like 'Cmd+N', 'Cmd+Shift+K', 'Alt+Z', 'Ctrl+Shift+G'.
 * For chord shortcuts like 'Cmd+K Cmd+0', call this twice.
 */
export async function pressShortcut(page: Page, shortcut: string): Promise<void> {
  // In Playwright on Linux/CI, Meta key may not work — use Control
  const mapped = shortcut
    .replace(/Cmd\+/g, 'Control+')
    .replace(/Ctrl\+/g, 'Control+')
    .replace(/Alt\+/g, 'Alt+');

  await page.keyboard.press(mapped);
}

/**
 * Dispatch a keyboard event directly to the app container via JS.
 * This bypasses browser-level shortcut interception (Ctrl+N, Ctrl+W, etc.)
 * and tests the app's HandleKeyDown handler directly.
 * Use this for shortcuts that the browser intercepts before JS can see them.
 */
export async function dispatchShortcut(page: Page, shortcut: string): Promise<void> {
  await page.evaluate((sc) => {
    const parts = sc.split('+');
    const key = parts[parts.length - 1];
    const ctrlKey = parts.some(p => p === 'Cmd' || p === 'Ctrl' || p === 'Control');
    const shiftKey = parts.some(p => p === 'Shift');
    const altKey = parts.some(p => p === 'Alt');
    const target = document.querySelector('.notemac-app') || document.body;
    target.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey: false,
      bubbles: true,
      cancelable: true,
    }));
  }, shortcut);
}

/**
 * Press a chord shortcut like 'Cmd+K Cmd+0' (two sequential key combos).
 */
export async function pressChordShortcut(page: Page, first: string, second: string): Promise<void> {
  await pressShortcut(page, first);
  await page.waitForTimeout(100);
  await pressShortcut(page, second);
}

/**
 * Click inside the Monaco editor to focus it, then type text.
 * Falls back to store-based content update if Monaco editor isn't available.
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  // Try clicking the editor area to focus it
  const editor = page.locator('.monaco-editor .view-lines').first();
  const editorExists = await editor.count();
  if (editorExists > 0) {
    await editor.click();
    await page.waitForTimeout(100);
    await page.keyboard.type(text);
    await page.waitForTimeout(200);
  } else {
    // Fallback: update content directly via the store
    await page.evaluate((t) => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTabContent(state.activeTabId, t);
      }
    }, text);
  }
  await page.waitForTimeout(100); // Extra wait after typing
}

/**
 * Get the text content of the active tab from the Zustand store.
 */
export async function getEditorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) {
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.content || '';
    }
    return '';
  });
}

/**
 * Get the current cursor position from Monaco.
 */
export async function getCursorPosition(page: Page): Promise<{ line: number; column: number }> {
  return page.evaluate(() => {
    const editor = (window as any).__monacoEditor;
    if (editor) {
      const pos = editor.getPosition();
      return { line: pos.lineNumber, column: pos.column };
    }
    return { line: 1, column: 1 };
  });
}

/**
 * Get the number of open tabs from the Zustand store.
 */
export async function getTabCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) return store.getState().tabs.length;
    // Fallback: count tab elements in DOM
    return document.querySelectorAll('[role="tab"]').length;
  });
}

/**
 * Get the Zustand store state (or a specific path within it).
 */
export async function getStoreState(page: Page, path?: string): Promise<any> {
  return page.evaluate((p) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return null;
    const state = store.getState();
    if (!p) return state;
    return p.split('.').reduce((obj: any, key: string) => obj?.[key], state);
  }, path);
}

/**
 * Count tabs visible in the DOM (using draggable divs in tab bar).
 */
export async function getVisibleTabCount(page: Page): Promise<number> {
  return page.locator('[draggable="true"]').count();
}

/**
 * Get the active tab's name/title from the Zustand store.
 */
export async function getActiveTabName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return null;
    const state = store.getState();
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    return tab?.name || null;
  });
}

/**
 * Check if a dialog is currently visible by checking store state.
 * Optionally pass a specific dialog key to check (e.g., 'showSettings').
 */
export async function isDialogVisible(page: Page, dialogKey?: string): Promise<boolean> {
  return page.evaluate((key) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return false;
    const state = store.getState();
    if (key) return !!state[key];
    // Check any dialog
    return state.showSettings || state.showGoToLine || state.showAbout ||
           state.showRunCommand || state.showColumnEditor || state.showSummary ||
           state.showCharInRange || state.showShortcutMapper || state.showCommandPalette ||
           state.showQuickOpen || state.showDiffViewer || state.showSnippetManager ||
           state.showCloneDialog || state.showGitSettings || state.showAiSettings || false;
  }, dialogKey);
}

/**
 * Close any open dialog by pressing Escape.
 */
export async function closeAllDialogs(page: Page): Promise<void> {
  // Press Escape a few times to close any open dialogs/menus
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }
}

/**
 * Create a new tab via the store.
 * Note: Ctrl+N is intercepted by the browser in many contexts,
 * so we use the store for reliability. The keyboard path is tested
 * explicitly in keyboard-shortcuts.spec.ts.
 */
export async function createNewTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().addTab();
  });
  await page.waitForTimeout(300);
}

/**
 * Close the active tab via the store.
 * Note: Ctrl+W closes the browser tab, so we use the store.
 */
export async function closeActiveTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) {
      const state = store.getState();
      state.closeTab(state.activeTabId);
    }
  });
  await page.waitForTimeout(300);
}

/**
 * Restore the last closed tab via the store.
 */
export async function restoreLastClosedTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().restoreLastClosedTab();
  });
  await page.waitForTimeout(300);
}

/**
 * Switch to a tab by index (0-based) via the store.
 */
export async function switchToTab(page: Page, index: number): Promise<void> {
  await page.evaluate((idx) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) {
      const state = store.getState();
      if (state.tabs[idx]) {
        state.setActiveTab(state.tabs[idx].id);
      }
    }
  }, index);
  await page.waitForTimeout(300);
}

/**
 * Navigate to the app and wait for it to be ready.
 */
export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await waitForAppReady(page);
}

/**
 * Check if the sidebar is visible.
 */
export async function isSidebarVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) return store.getState().sidebarPanel !== null;
    return false;
  });
}

/**
 * Get the current zoom level.
 */
export async function getZoomLevel(page: Page): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) return store.getState().zoomLevel;
    return 100;
  });
}

/**
 * Check if macro recording is active.
 */
export async function isRecordingMacro(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) return store.getState().isRecordingMacro;
    return false;
  });
}

/**
 * Open a dialog via the store (for features that might not respond to keyboard shortcuts).
 */
export async function openDialog(page: Page, dialogKey: string): Promise<void> {
  await page.evaluate((key) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;
    const state = store.getState();
    // Map dialog names to store methods
    const setters: { [key: string]: () => void } = {
      'showGoToLine': () => state.setShowGoToLine(true),
      'showSettings': () => state.setShowSettings(true),
      'showCommandPalette': () => state.setShowCommandPalette(true),
      'showAbout': () => state.setShowAbout(true),
      'showFindReplace': () => state.setShowFindReplace(true, 'find'),
    };
    if (setters[key]) {
      setters[key]();
    }
  }, dialogKey);
  await page.waitForTimeout(300);
}

/**
 * Focus the app container before shortcuts.
 */
export async function focusApp(page: Page): Promise<void> {
  await page.click('.notemac-app');
  await page.waitForTimeout(100);
}

/**
 * Git panel helpers
 */
export async function openGitPanel(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().setSidebarPanel('git');
  });
  await page.waitForTimeout(300);
}

/**
 * AI panel helper
 */
export async function openAIPanel(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().setSidebarPanel('ai');
  });
  await page.waitForTimeout(300);
}

/**
 * Open diff viewer
 */
export async function openDiffViewer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().setShowDiffViewer(true);
  });
  await page.waitForTimeout(300);
}

/**
 * Open snippet manager
 */
export async function openSnippetManager(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().setShowSnippetManager(true);
  });
  await page.waitForTimeout(300);
}

/**
 * Get the count of pinned tabs.
 */
export async function getPinnedTabCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return 0;
    return store.getState().tabs.filter((t: any) => t.pinned).length;
  });
}

/**
 * Get the color of a tab by index.
 */
export async function getTabColor(page: Page, index: number): Promise<string> {
  return page.evaluate((idx) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return 'none';
    const tab = store.getState().tabs[idx];
    return tab?.color || 'none';
  }, index);
}

/**
 * Change a setting in the store.
 */
export async function changeSetting(page: Page, key: string, value: any): Promise<void> {
  await page.evaluate(({ k, v }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().updateSettings({ [k]: v });
  }, { k: key, v: value });
  await page.waitForTimeout(200);
}

/**
 * Get a setting from the store.
 */
export async function getSetting(page: Page, key: string): Promise<any> {
  return page.evaluate((k) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return null;
    return store.getState().settings?.[k];
  }, key);
}
