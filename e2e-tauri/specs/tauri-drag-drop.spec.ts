import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, triggerMenuAction, getStoreState, getTabCount } from '../helpers/tauri-app';

/**
 * Drag-and-drop / tab reordering tests.
 * Tests store-level tab movement and tab navigation operations.
 */

test.describe('Tauri Tab Reordering — Store Operations', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('moveTab reorders tabs in the store', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    // Create 3 tabs
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    // Get initial order
    let state = await getStoreState(page);
    expect(state.tabs.length).toBe(3);
    const tab0Id = state.tabs[0].id;
    const tab1Id = state.tabs[1].id;
    const tab2Id = state.tabs[2].id;

    // Move tab 0 to position 2
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTab(0, 2);
    });

    state = await getStoreState(page);
    expect(state.tabs[0].id).toBe(tab1Id);
    expect(state.tabs[1].id).toBe(tab2Id);
    expect(state.tabs[2].id).toBe(tab0Id);
  });

  test('moveTab swaps adjacent tabs', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const firstId = state.tabs[0].id;
    const secondId = state.tabs[1].id;

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTab(0, 1);
    });

    state = await getStoreState(page);
    expect(state.tabs[0].id).toBe(secondId);
    expect(state.tabs[1].id).toBe(firstId);
  });

  test('moveTab with same from/to does nothing', async () => {
    let state = await getStoreState(page);
    const tabsBefore = state.tabs.map((t: any) => t.id);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.moveTab(0, 0);
    });

    state = await getStoreState(page);
    const tabsAfter = state.tabs.map((t: any) => t.id);
    expect(tabsAfter).toEqual(tabsBefore);
  });

  test('moveTabForward moves active tab right', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    // Set active to first tab
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
    // The first tab should now be at index 1
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
    // The last tab should now be second-to-last
    const idx = state.tabs.findIndex((t: any) => t.id === lastTabId);
    expect(idx).toBe(state.tabs.length - 2);
  });
});

test.describe('Tauri Tab Navigation', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('nextTab cycles to next tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    // Set to first tab
    let state = await getStoreState(page);
    const firstTabId = state.tabs[0].id;
    const secondTabId = state.tabs[1].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, firstTabId);

    // Navigate next
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

  test('prevTab wraps around at start', async () => {
    let state = await getStoreState(page);
    const firstTabId = state.tabs[0].id;
    const lastTabId = state.tabs[state.tabs.length - 1].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveTab(id);
    }, firstTabId);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.prevTab();
    });

    state = await getStoreState(page);
    expect(state.activeTabId).toBe(lastTabId);
  });
});

test.describe('Tauri Tab Context Operations', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('closeOtherTabs keeps only active tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
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

  test('closeTabsToRight closes tabs after given tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const firstTabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeTabsToRight(id);
    }, firstTabId);

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe(firstTabId);
  });

  test('closeTabsToLeft closes tabs before given tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const lastTabId = state.tabs[state.tabs.length - 1].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeTabsToLeft(id);
    }, lastTabId);

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe(lastTabId);
  });

  test('togglePinTab pins and unpins a tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

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

  test('closeAllButPinned keeps only pinned tabs', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);

    let state = await getStoreState(page);
    const pinnedTabId = state.tabs[0].id;

    // Pin the first tab
    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.togglePinTab(id);
    }, pinnedTabId);

    // Close all but pinned
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeAllButPinned();
    });

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe(pinnedTabId);
    expect(state.tabs[0].isPinned).toBe(true);
  });

  test('setTabColor sets a color on a tab', async () => {
    let state = await getStoreState(page);
    const tabId = state.tabs[0].id;

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTabColor(id, 'color1');
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].color).toBe('color1');

    // Clear color
    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTabColor(id, 'none');
    }, tabId);

    state = await getStoreState(page);
    expect(state.tabs[0].color).toBe('none');
  });

  test('restoreLastClosedTab restores a closed tab', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(150);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    let state = await getStoreState(page);
    const tabToCloseId = state.activeTabId;
    expect(state.tabs.length).toBe(2);

    // Close the active tab
    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.closeTab(id);
    }, tabToCloseId);

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(1);

    // Restore
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.restoreLastClosedTab();
    });

    state = await getStoreState(page);
    expect(state.tabs.length).toBe(2);
  });
});
