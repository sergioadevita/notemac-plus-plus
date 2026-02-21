import { test, expect, Page } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  getStoreState,
  getTabCount,
  typeInEditor,
  getEditorContent,
  switchToTab,
  closeAllDialogs,
} from '../helpers/app';

// Terminal Panel Tests
test.describe('Terminal Panel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Terminal opens via store', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(true);
    });
    await page.waitForTimeout(300);

    const showTerminal = await getStoreState(page, 'showTerminalPanel');
    expect(showTerminal).toBe(true);
  });

  test('Terminal panel toggles on and off', async ({ page }) => {
    // Open
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(true);
    });
    await page.waitForTimeout(200);

    let show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(true);

    // Close
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(false);
    });
    await page.waitForTimeout(200);

    show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(false);
  });

  test('Terminal panel starts closed by default', async ({ page }) => {
    const show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(false);
  });

  test('Terminal panel can be toggled multiple times', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        if (store) store.getState().setShowTerminalPanel(true);
      });
      await page.waitForTimeout(100);
      let show = await getStoreState(page, 'showTerminalPanel');
      expect(show).toBe(true);

      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        if (store) store.getState().setShowTerminalPanel(false);
      });
      await page.waitForTimeout(100);
      show = await getStoreState(page, 'showTerminalPanel');
      expect(show).toBe(false);
    }
  });

  test('Terminal panel state is independent of sidebar', async ({ page }) => {
    // Open terminal
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(true);
    });
    await page.waitForTimeout(200);

    // Toggle sidebar
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const panel = store.getState().sidebarPanel;
        store.getState().setSidebarPanel(panel ? null : 'files');
      }
    });
    await page.waitForTimeout(200);

    // Terminal should still be open
    const show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(true);
  });

  test('Terminal close hides panel', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(true);
    });
    await page.waitForTimeout(200);

    let show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminalPanel(false);
    });
    await page.waitForTimeout(200);

    show = await getStoreState(page, 'showTerminalPanel');
    expect(show).toBe(false);
  });
});

// Find & Replace Panel Tests
test.describe('Find & Replace Panel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Find panel opens via store', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(300);

    const showFindReplace = await getStoreState(page, 'showFindReplace');
    expect(showFindReplace).toBe(true);
  });

  test('Find panel closes on escape', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(200);

    let show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(false);
  });

  test('Find panel toggles correctly', async ({ page }) => {
    // Open
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(200);

    let show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);

    // Close
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(false);
    });
    await page.waitForTimeout(200);

    show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(false);
  });

  test('Find panel mode can be set to find', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'find');
    });
    await page.waitForTimeout(200);

    const show = await getStoreState(page, 'showFindReplace');
    const mode = await getStoreState(page, 'findReplaceMode');
    expect(show).toBe(true);
    expect(mode).toBe('find');
  });

  test('Find panel mode can be set to replace', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'replace');
    });
    await page.waitForTimeout(200);

    const show = await getStoreState(page, 'showFindReplace');
    const mode = await getStoreState(page, 'findReplaceMode');
    expect(show).toBe(true);
    expect(mode).toBe('replace');
  });

  test('Find panel starts closed by default', async ({ page }) => {
    const show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(false);
  });
});

// Combined Search Scenarios
test.describe('Combined Search Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Find opens via store action (Cmd+F equivalent)', async ({ page }) => {
    // Ctrl+F is intercepted by the browser; test via store action instead
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'find');
    });
    await page.waitForTimeout(300);

    const show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);
    const mode = await getStoreState(page, 'findReplaceMode');
    expect(mode).toBe('find');
  });

  test('Replace opens via store action (Cmd+H equivalent)', async ({ page }) => {
    // Ctrl+H is intercepted by the browser; test via store action instead
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'replace');
    });
    await page.waitForTimeout(300);

    const show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);
    const mode = await getStoreState(page, 'findReplaceMode');
    expect(mode).toBe('replace');
  });

  test('Find and replace panels share visibility state', async ({ page }) => {
    // Open via find
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'find');
    });
    await page.waitForTimeout(200);

    let show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);

    // Switch to replace mode
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'replace');
    });
    await page.waitForTimeout(200);

    show = await getStoreState(page, 'showFindReplace');
    const mode = await getStoreState(page, 'findReplaceMode');
    expect(show).toBe(true);
    expect(mode).toBe('replace');
  });

  test('Escape closes find panel from any mode', async ({ page }) => {
    // Open in replace mode
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true, 'replace');
    });
    await page.waitForTimeout(200);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(false);
  });

  test('Multiple open/close cycles work correctly', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        if (store) store.getState().setShowFindReplace(true);
      });
      await page.waitForTimeout(100);
      let show = await getStoreState(page, 'showFindReplace');
      expect(show).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      show = await getStoreState(page, 'showFindReplace');
      expect(show).toBe(false);
    }
  });

  test('Terminal and find panel are independent', async ({ page }) => {
    // Open both
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowTerminalPanel(true);
        store.getState().setShowFindReplace(true);
      }
    });
    await page.waitForTimeout(200);

    const terminal = await getStoreState(page, 'showTerminalPanel');
    const find = await getStoreState(page, 'showFindReplace');
    expect(terminal).toBe(true);
    expect(find).toBe(true);

    // Close find
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(false);
    });
    await page.waitForTimeout(200);

    // Terminal should still be open
    const terminalAfter = await getStoreState(page, 'showTerminalPanel');
    expect(terminalAfter).toBe(true);
  });

  test('Find panel visibility persists across tab switches', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(200);

    // Create and switch to new tab
    await createNewTab(page);
    await page.waitForTimeout(200);

    const show = await getStoreState(page, 'showFindReplace');
    expect(show).toBe(true);
  });
});
