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
 * Create a new tab via the store (keyboard shortcut Ctrl+N is intercepted by browser).
 */
export async function createNewTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().addTab();
  });
  await page.waitForTimeout(300);
}

/**
 * Close the active tab via the store (Ctrl+W is intercepted by browser).
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
