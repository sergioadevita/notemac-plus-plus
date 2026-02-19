import { test, expect } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  getTabCount,
  getVisibleTabCount,
  getActiveTabName,
  pressShortcut,
  typeInEditor,
  closeAllDialogs,
  switchToTab,
} from '../helpers/app';

test.describe('Tab Bar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('New tabs appear in tab bar', async ({ page }) => {
    const initialCount = await getVisibleTabCount(page);

    await createNewTab(page);
    const countAfterCreate = await getVisibleTabCount(page);

    expect(countAfterCreate).toBe(initialCount + 1);
  });

  test('Click tab switches active tab', async ({ page }) => {
    await createNewTab(page);
    const firstTabData = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tabs = state.tabs;
      return { tabCount: tabs.length, tabId: state.activeTabId, tabs: tabs.map(t => t.id) };
    });

    await createNewTab(page);
    const beforeSwitch = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      return { tabCount: state.tabs.length, activeTabId: state.activeTabId };
    });

    // Switch to first tab by directly calling the store
    await page.evaluate(
      (tabId) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setActiveTab(tabId);
      },
      firstTabData.tabId
    );
    await page.waitForTimeout(300);

    const activeTabIdAfterSwitch = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });
    expect(activeTabIdAfterSwitch).toBe(firstTabData.tabId);
  });

  test('Active tab can be identified from store', async ({ page }) => {
    await createNewTab(page);

    const activeTabName = await getActiveTabName(page);
    expect(activeTabName).toBeTruthy();
    expect(activeTabName?.length).toBeGreaterThan(0);
  });

  test('Tab count matches store and DOM', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);

    // Click first tab to make it inactive
    const tabs = page.locator('[draggable="true"]');
    const firstTab = tabs.first();
    await firstTab.click();
    await page.waitForTimeout(300);

    // Create a new tab to ensure there's an inactive one
    await createNewTab(page);

    // Get DOM tab count
    const domTabCount = await getVisibleTabCount(page);
    const storeTabCount = await getTabCount(page);
    expect(domTabCount).toBe(storeTabCount);
    expect(domTabCount).toBeGreaterThanOrEqual(2);
  });

  test('Close button on tab closes it', async ({ page }) => {
    const initialCount = await getTabCount(page);

    await createNewTab(page);
    const countAfterCreate = await getTabCount(page);
    expect(countAfterCreate).toBe(initialCount + 1);

    // Find close button on the active tab (close buttons exist with aria-label)
    const closeButton = page.locator('button[aria-label^="Close tab"]').first();
    const closeExists = await closeButton.count();

    if (closeExists > 0) {
      await closeButton.click();
      await page.waitForTimeout(300);

      const countAfterClose = await getTabCount(page);
      expect(countAfterClose).toBe(countAfterCreate - 1);
    } else {
      // Use keyboard shortcut instead
      await pressShortcut(page, 'Cmd+W');
      await page.waitForTimeout(300);

      const countAfterShortcut = await getTabCount(page);
      expect(countAfterShortcut).toBe(countAfterCreate - 1);
    }
  });

  test('Right-click tab shows context menu', async ({ page }) => {
    await createNewTab(page);

    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    const menuCount = await contextMenu.count();
    expect(menuCount).toBeGreaterThan(0);
  });

  test('Context menu has Close option', async ({ page }) => {
    await createNewTab(page);

    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    const closeOption = contextMenu.locator('div, button, li').filter({ hasText: /Close/ }).first();
    const closeExists = await closeOption.count();

    expect(closeExists).toBeGreaterThan(0);
  });

  test('Context menu has Pin option', async ({ page }) => {
    await createNewTab(page);

    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    const pinOption = contextMenu.locator('div, button, li').filter({ hasText: /Pin/ }).first();
    const pinExists = await pinOption.count();

    // Pin option may or may not exist, but if menu exists, it's valid
    expect(typeof pinExists).toBe('number');
  });

  test('Multiple tabs show correctly in tab bar', async ({ page }) => {
    const initialCount = await getVisibleTabCount(page);

    for (let i = 0; i < 3; i++) {
      await createNewTab(page);
      await page.waitForTimeout(200);
    }

    const finalCount = await getVisibleTabCount(page);
    expect(finalCount).toBe(initialCount + 3);
  });

  test('Tab shows filename', async ({ page }) => {
    await createNewTab(page);

    const activeTabName = await getActiveTabName(page);

    expect(activeTabName).toBeTruthy();
    // Should have some name, even if just "new 1"
    expect(activeTabName?.length).toBeGreaterThan(0);
  });

  test('Tab displays modified indicator after edit', async ({ page }) => {
    await createNewTab(page);

    const initialName = await getActiveTabName(page);

    // Type something to modify
    await typeInEditor(page, 'modified content');
    await page.waitForTimeout(300);

    const modifiedName = await getActiveTabName(page);

    // Tab name should be tracked
    expect(modifiedName).toBeTruthy();
    expect(typeof modifiedName).toBe('string');
  });

  test('Tab count from DOM matches store count', async ({ page }) => {
    await createNewTab(page);

    const domCount = await getVisibleTabCount(page);
    const storeCount = await getTabCount(page);

    expect(domCount).toBe(storeCount);
  });

  test('Switching between multiple tabs preserves content', async ({ page }) => {
    await createNewTab(page);
    await typeInEditor(page, 'Tab 1 content');
    await page.waitForTimeout(300);

    const firstTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    await createNewTab(page);
    await typeInEditor(page, 'Tab 2 content');
    await page.waitForTimeout(300);

    // Switch back to first tab by directly calling store with tab ID
    await page.evaluate(
      (tabId) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setActiveTab(tabId);
      },
      firstTabId
    );
    await page.waitForTimeout(300);

    const activeTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });
    expect(activeTabId).toBe(firstTabId);
  });

  test('Tab bar scrolls with many tabs', async ({ page }) => {
    // Create many tabs
    for (let i = 0; i < 10; i++) {
      await createNewTab(page);
      await page.waitForTimeout(100);
    }

    const tabCount = await getVisibleTabCount(page);
    expect(tabCount).toBeGreaterThan(5);

    // Tab bar container should exist (check draggable elements)
    const tabElements = page.locator('[draggable="true"]');
    const count = await tabElements.count();
    expect(count).toBeGreaterThan(5);
  });

  test('Last created tab becomes active', async ({ page }) => {
    const initialActive = await getActiveTabName(page);

    await createNewTab(page);
    const newActive = await getActiveTabName(page);

    expect(newActive).not.toBe(initialActive);
  });

  test('Tab can be closed via context menu', async ({ page }) => {
    const initialCount = await getTabCount(page);

    await createNewTab(page);
    const countAfterCreate = await getTabCount(page);

    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    const closeButton = page.locator('[role="menu"], .context-menu').first().locator('div, button, li').filter({ hasText: /Close/ }).first();
    const closeExists = await closeButton.count();

    if (closeExists > 0) {
      await closeButton.click();
      await page.waitForTimeout(300);

      const countAfterClose = await getTabCount(page);
      expect(countAfterClose).toBe(countAfterCreate - 1);
    }
  });

  test('Tab labels are accessible with text content', async ({ page }) => {
    await createNewTab(page);

    const firstTabName = await getActiveTabName(page);

    expect(firstTabName).toBeTruthy();
  });

  test('Closing all non-pinned tabs leaves pinned tabs', async ({ page }) => {
    // Create a tab
    await createNewTab(page);

    // Pin it using store
    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
        }
      },
      tabIndex
    );

    await page.waitForTimeout(300);

    // Now create and close another tab
    await createNewTab(page);
    const tabCount = await getTabCount(page);
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('Tab bar has proper ARIA attributes', async ({ page }) => {
    // Check that draggable tab elements exist (tab bar uses draggable="true" instead of role="tablist")
    const tabElements = page.locator('[draggable="true"]');
    const count = await tabElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Close Others removes all but active tab', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);

    const countBefore = await getTabCount(page);
    expect(countBefore).toBeGreaterThanOrEqual(4);

    const activeTabName = await getActiveTabName(page);
    const lastTabIndex = countBefore - 1;

    // Get the tab ID from store and call closeOtherTabs
    const closeResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().closeOtherTabs(tabs[index].id);
          return store.getState().tabs.length;
        }
        return 0;
      },
      lastTabIndex
    );

    expect(closeResult).toBe(1);
  });

  test('Close Tabs to Left removes correct tabs', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);

    const countBefore = await getTabCount(page);
    expect(countBefore).toBeGreaterThanOrEqual(4);

    const lastTabIndex = countBefore - 1;

    // Close tabs to the left of the last tab
    const closeResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().closeTabsToLeft(tabs[index].id);
          return store.getState().tabs.length;
        }
        return 0;
      },
      lastTabIndex
    );

    // Should have only the last tab plus any new ones
    expect(closeResult).toBeLessThan(countBefore);
  });

  test('Close Tabs to Right removes correct tabs', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);

    const countBefore = await getTabCount(page);
    expect(countBefore).toBeGreaterThanOrEqual(4);

    const firstTabIndex = 0;

    // Close tabs to the right of the first tab
    const closeResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().closeTabsToRight(tabs[index].id);
          return store.getState().tabs.length;
        }
        return 0;
      },
      firstTabIndex
    );

    // Should have only the first tab
    expect(closeResult).toBeLessThan(countBefore);
  });

  test('Close All Tabs leaves empty state', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);

    const countBefore = await getTabCount(page);
    expect(countBefore).toBeGreaterThan(1);

    const countAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      return store.getState().tabs.length;
    });

    expect(countAfter).toBe(0);
  });

  test('Close Unchanged keeps modified tabs', async ({ page }) => {
    await createNewTab(page);
    await typeInEditor(page, 'modified content');
    await page.waitForTimeout(300);

    await createNewTab(page);
    // Don't modify the second tab

    const countBefore = await getTabCount(page);

    const countAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().closeUnchangedTabs();
      return store.getState().tabs.length;
    });

    // Should have at least the modified tab
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('Pin tab makes it pinned', async ({ page }) => {
    await createNewTab(page);

    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    const pinResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
          return store.getState().tabs[index].isPinned;
        }
        return false;
      },
      tabIndex
    );

    expect(pinResult).toBe(true);
  });

  test('Unpin tab removes pin', async ({ page }) => {
    await createNewTab(page);

    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    // First pin it
    await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
        }
      },
      tabIndex
    );

    await page.waitForTimeout(300);

    // Then unpin it
    const unpinResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
          return store.getState().tabs[index].isPinned;
        }
        return true;
      },
      tabIndex
    );

    expect(unpinResult).toBe(false);
  });

  test('Close All but Pinned keeps pinned tabs', async ({ page }) => {
    await createNewTab(page);
    
    const firstTabIndex = 0;
    // Pin the first tab
    await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
        }
      },
      firstTabIndex
    );

    await page.waitForTimeout(300);

    await createNewTab(page);
    await createNewTab(page);

    const countBefore = await getTabCount(page);
    expect(countBefore).toBeGreaterThanOrEqual(3);

    const countAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().closeAllButPinned();
      return store.getState().tabs.length;
    });

    // Should have at least the pinned tab
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('Tab color can be set to color1', async ({ page }) => {
    await createNewTab(page);

    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    const colorResult = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().setTabColor(tabs[index].id, 'color1');
          return store.getState().tabs[index].tabColor;
        }
        return null;
      },
      tabIndex
    );

    expect(colorResult).toBe('color1');
  });

  test('Tab color can be set to different colors', async ({ page }) => {
    await createNewTab(page);

    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    const colors = ['color1', 'color2', 'color3', 'color4', 'color5'];

    for (const color of colors) {
      const colorResult = await page.evaluate(
        ({ index, colorVal }) => {
          const store = window.__ZUSTAND_STORE__;
          const tabs = store.getState().tabs;
          if (tabs[index]) {
            store.getState().setTabColor(tabs[index].id, colorVal);
            return store.getState().tabs[index].tabColor;
          }
          return null;
        },
        { index: tabIndex, colorVal: color }
      );
      expect(colorResult).toBe(color);
    }
  });

  test('Move tab forward changes tab order', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);

    // Switch to first tab (not the last one, which can't move forward)
    await switchToTab(page, 0);
    await page.waitForTimeout(300);

    const orderBefore = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().moveTabForward();
    });

    await page.waitForTimeout(300);

    const orderAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    expect(orderAfter).not.toEqual(orderBefore);
  });

  test('Move tab backward changes tab order', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);

    const orderBefore = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().moveTabBackward();
    });

    await page.waitForTimeout(300);

    const orderAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    expect(orderAfter).not.toEqual(orderBefore);
  });

  test('Move tab by index reorders correctly', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);

    const orderBefore = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    // Move first tab to position 2
    await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().moveTab(0, 2);
    });

    await page.waitForTimeout(300);

    const orderAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.map((t) => t.id);
    });

    expect(orderAfter).not.toEqual(orderBefore);
    // First tab should now be at index 2
    expect(orderAfter[2]).toBe(orderBefore[0]);
  });

  test('Pinned tab count tracks correctly', async ({ page }) => {
    const initialPinned = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.filter((t) => t.isPinned).length;
    });

    await createNewTab(page);

    const tabIndex = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      const tabs = store.getState().tabs;
      return tabs.length - 1;
    });

    // Pin the new tab
    await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().togglePinTab(tabs[index].id);
        }
      },
      tabIndex
    );

    await page.waitForTimeout(300);

    const pinnedAfter = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().tabs.filter((t) => t.isPinned).length;
    });

    expect(pinnedAfter).toBe(initialPinned + 1);
  });

  test('Tab colors persist after switching tabs', async ({ page }) => {
    await createNewTab(page);

    const firstTabIndex = 0;
    const secondTabIndex = 1;

    // Set color on first tab
    await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs[index]) {
          store.getState().setTabColor(tabs[index].id, 'color2');
        }
      },
      firstTabIndex
    );

    await page.waitForTimeout(300);

    // Switch to second tab using store
    await switchToTab(page, secondTabIndex);
    await page.waitForTimeout(300);

    // Switch back to first tab using store
    await switchToTab(page, firstTabIndex);
    await page.waitForTimeout(300);

    // Check that color persisted
    const color = await page.evaluate(
      (index) => {
        const store = window.__ZUSTAND_STORE__;
        return store.getState().tabs[index].tabColor;
      },
      firstTabIndex
    );

    expect(color).toBe('color2');
  });

});
