import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction, getTabCount } from '../helpers/electron-app';

/**
 * Session persistence, clipboard history, character panel, and monitoring tests for Electron.
 */

test.describe('Electron Session Persistence', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('saveSession captures current tabs', async () => {
    // Create a couple tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');

    const session = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store?.getState()?.saveSession();
    });
    expect(session).toBeTruthy();
    expect(session.tabs).toBeTruthy();
    expect(session.tabs.length).toBeGreaterThanOrEqual(2);
    expect(session.activeTabIndex).toBeDefined();
  });

  test('loadSession restores tabs', async () => {
    const session = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store?.getState()?.saveSession();
    });
    const savedCount = session.tabs.length;

    // Close all and load session back
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(300);

    await page.evaluate((s: any) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.loadSession(s);
    }, session);

    const count = await getTabCount(page);
    expect(count).toBe(savedCount);
  });

  test('loadSession preserves sidebar panel', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel('search');
    });

    const session = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store?.getState()?.saveSession();
    });

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel(null);
    });

    await page.evaluate((s: any) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.loadSession(s);
    }, session);

    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('search');
  });

  test('loadSession creates new tab IDs', async () => {
    const session = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store?.getState()?.saveSession();
    });
    const oldIds = session.tabs.map((t: any) => t.id);

    await page.evaluate((s: any) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.loadSession(s);
    }, session);

    const state = await getStoreState(page);
    const newIds = state.tabs.map((t: any) => t.id);
    // At least some IDs should be different (new UUIDs generated)
    const allSame = oldIds.every((id: string, i: number) => id === newIds[i]);
    expect(allSame).toBe(false);
  });
});

test.describe('Electron Clipboard History', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('addClipboardEntry adds to history', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.addClipboardEntry('hello clipboard');
    });
    const state = await getStoreState(page);
    expect(state.clipboardHistory.length).toBeGreaterThanOrEqual(1);
    expect(state.clipboardHistory[0].text).toBe('hello clipboard');
  });

  test('clipboard entries have timestamps', async () => {
    const state = await getStoreState(page);
    expect(state.clipboardHistory[0].timestamp).toBeTruthy();
  });

  test('multiple entries are stored in LIFO order', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.addClipboardEntry('first');
      store?.getState()?.addClipboardEntry('second');
      store?.getState()?.addClipboardEntry('third');
    });
    const state = await getStoreState(page);
    expect(state.clipboardHistory[0].text).toBe('third');
    expect(state.clipboardHistory[1].text).toBe('second');
    expect(state.clipboardHistory[2].text).toBe('first');
  });

  test('clipboard-history sidebar panel can be shown', async () => {
    await triggerMenuAction(electronApp, 'clipboard-history');
    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('clipboardHistory');
  });
});

test.describe('Electron Character Panel', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('char-panel opens character panel sidebar', async () => {
    await triggerMenuAction(electronApp, 'char-panel');
    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('charPanel');
  });

  test('sidebar can switch between panels', async () => {
    await triggerMenuAction(electronApp, 'show-explorer');
    let state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('explorer');

    await triggerMenuAction(electronApp, 'char-panel');
    state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('charPanel');
  });
});

test.describe('Electron Print & Monitoring', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('toggle-monitoring sets isMonitoring flag on active tab', async () => {
    // Ensure we have at least one tab
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    await triggerMenuAction(electronApp, 'toggle-monitoring');
    let state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab?.isMonitoring).toBe(true);

    await triggerMenuAction(electronApp, 'toggle-monitoring');
    state = await getStoreState(page);
    const activeTab2 = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab2?.isMonitoring).toBe(false);
  });

  test('toggle-readonly sets isReadOnly flag on active tab', async () => {
    await triggerMenuAction(electronApp, 'toggle-readonly');
    let state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab?.isReadOnly).toBe(true);

    await triggerMenuAction(electronApp, 'toggle-readonly');
    state = await getStoreState(page);
    const activeTab2 = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab2?.isReadOnly).toBe(false);
  });
});
