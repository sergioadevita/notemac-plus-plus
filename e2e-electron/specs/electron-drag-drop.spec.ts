import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction, getTabCount } from '../helpers/electron-app';

/**
 * Tab reordering, navigation, and context operation tests for Electron.
 */

test.describe('Electron Tab Reordering', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('moveTab reorders tabs in the store', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const tab0Id = state.tabs[0].id;
    const tab1Id = state.tabs[1].id;
    const tab2Id = state.tabs[2].id;

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTab(0, 2);
    });

    state = await getStoreState(page);
    expect(state.tabs[0].id).toBe(tab1Id);
    expect(state.tabs[1].id).toBe(tab2Id);
    expect(state.tabs[2].id).toBe(tab0Id);
  });

  test('moveTabForward moves active tab right', async () => {
    let state = await getStoreState(page);
    const firstTabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, firstTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTabForward();
    });

    state = await getStoreState(page);
    expect(state.tabs[1].id).toBe(firstTabId);
  });

  test('moveTabBackward moves active tab left', async () => {
    let state = await getStoreState(page);
    const lastTabId = state.tabs[state.tabs.length - 1].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, lastTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTabBackward();
    });

    state = await getStoreState(page);
    const idx = state.tabs.findIndex((t: any) => t.id === lastTabId);
    expect(idx).toBe(state.tabs.length - 2);
  });
});

test.describe('Electron Tab Navigation', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('nextTab cycles to next tab', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const firstTabId = state.tabs[0].id;
    const secondTabId = state.tabs[1].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, firstTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.nextTab();
    });

    state = await getStoreState(page);
    expect(state.activeTabId).toBe(secondTabId);
  });

  test('prevTab cycles to previous tab', async () => {
    let state = await getStoreState(page);
    const secondTabId = state.tabs[1].id;
    const firstTabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, secondTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.prevTab();
    });

    state = await getStoreState(page);
    expect(state.activeTabId).toBe(firstTabId);
  });

  test('nextTab wraps around at end', async () => {
    let state = await getStoreState(page);
    const lastTabId = state.tabs[state.tabs.length - 1].id;
    const firstTabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, lastTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.nextTab();
    });

    state = await getStoreState(page);
    expect(state.activeTabId).toBe(firstTabId);
  });

  test('goToTab navigates by index', async () => {
    let state = await getStoreState(page);
    const thirdTabId = state.tabs[2].id;

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.goToTab(2);
    });

    state = await getStoreState(page);
    expect(state.activeTabId).toBe(thirdTabId);
  });
});

test.describe('Electron Tab Context Operations', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('closeOtherTabs keeps only active tab', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const activeId = state.activeTabId;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeOtherTabs(id);
    }, activeId);

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe(activeId);
  });

  test('togglePinTab pins and unpins a tab', async () => {
    let state = await getStoreState(page);
    const tabId = state.tabs[0].id;
    expect(state.tabs[0].isPinned).toBeFalsy();

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.togglePinTab(id);
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].isPinned).toBe(true);

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.togglePinTab(id);
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].isPinned).toBe(false);
  });

  test('setTabColor sets a color on a tab', async () => {
    let state = await getStoreState(page);
    const tabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTabColor(id, 'color1');
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].tabColor).toBe('color1');

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTabColor(id, 'none');
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].tabColor).toBe('none');
  });

  test('restoreLastClosedTab restores a closed tab', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);

    let state = await getStoreState(page);
    const tabToCloseId = state.activeTabId;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeTab(id);
    }, tabToCloseId);

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.restoreLastClosedTab();
    });

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(2);
  });
});
