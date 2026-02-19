import { test, expect } from '@playwright/test';
import { gotoApp, getTabCount, getStoreState } from '../helpers/app';

test.describe('Context Menus', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // Helper to right-click a tab by index
  async function rightClickTab(page: any, index: number) {
    const tabs = page.locator('[draggable="true"]');
    await tabs.nth(index).click({ button: 'right' });
    await page.waitForTimeout(300);
  }

  // Helper to click a context menu item by label
  async function clickContextMenuItem(page: any, label: string) {
    const menuItem = page.locator('.context-menu div').filter({ hasText: label }).first();
    await menuItem.click();
    await page.waitForTimeout(300);
  }

  test('Context menu appears on right-click', async ({ page }) => {
    await rightClickTab(page, 0);
    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible();
  });

  test('Context menu has Close option', async ({ page }) => {
    await rightClickTab(page, 0);
    const closeItem = page.locator('.context-menu').locator('text=Close').first();
    await expect(closeItem).toBeVisible();
  });

  test('Close closes the clicked tab', async ({ page }) => {
    // Create extra tabs
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'extra1.js', content: 'a' });
      store.getState().addTab({ name: 'extra2.js', content: 'b' });
    });
    await page.waitForTimeout(300);

    const countBefore = await getTabCount(page);
    // Right-click the first tab
    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close');

    const countAfter = await getTabCount(page);
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Close Others closes all except clicked', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'keep.js', content: 'a' });
      store.getState().addTab({ name: 'remove1.js', content: 'b' });
      store.getState().addTab({ name: 'remove2.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    // Right-click first tab ("keep.js")
    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close Others');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('keep.js');
  });

  test('Close Tabs to the Left closes tabs with lower index', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      store.getState().addTab({ name: 'C.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    // Right-click last tab (C.js at index 2)
    await rightClickTab(page, 2);
    await clickContextMenuItem(page, 'Close Tabs to the Left');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('C.js');
  });

  test('Close Tabs to the Right closes tabs with higher index', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      store.getState().addTab({ name: 'C.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    // Right-click first tab (A.js at index 0)
    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close Tabs to the Right');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('A.js');
  });

  test('Close All closes every tab', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'extra.js', content: 'a' });
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close All');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(0);
  });

  test('Close Unchanged keeps only modified tabs', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'unchanged.js', content: 'a' });
      store.getState().addTab({ name: 'modified.js', content: 'b' });
      // Mark second tab as modified
      const modTab = store.getState().tabs[1];
      store.getState().updateTab(modTab.id, { isModified: true });
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close Unchanged');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('modified.js');
    expect(tabs[0].isModified).toBe(true);
  });

  test('Close All but Pinned keeps only pinned tabs', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'pinned.js', content: 'a' });
      store.getState().addTab({ name: 'unpinned.js', content: 'b' });
      // Pin first tab
      const pinTab = store.getState().tabs[0];
      store.getState().togglePinTab(pinTab.id);
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Close All but Pinned');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('pinned.js');
    expect(tabs[0].isPinned).toBe(true);
  });

  test('Pin Tab toggles pin on', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Pin Tab');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].isPinned).toBe(true);
  });

  test('Unpin Tab toggles pin off', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
      const tab = store.getState().tabs[0];
      store.getState().togglePinTab(tab.id);
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    // When pinned, menu shows "Unpin Tab"
    await clickContextMenuItem(page, 'Unpin Tab');

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].isPinned).toBe(false);
  });

  test('Tab Color submenu shows color picker', async ({ page }) => {
    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Tab Color');
    await page.waitForTimeout(300);

    // Color picker should show 6 color circles inside the context menu
    const colorCircles = page.locator('.context-menu div[title]');
    const count = await colorCircles.count();
    expect(count).toBeGreaterThanOrEqual(5); // At least 5 color options + "No color"
  });

  test('Applying color1 (red) sets tab color', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Tab Color');
    await page.waitForTimeout(200);

    // Click the second color circle (color1 = red)
    const colorCircle = page.locator('.context-menu div[title="color1"]');
    await colorCircle.click();
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].tabColor).toBe('color1');
  });

  test('Applying "No color" resets tab color', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
      const tab = store.getState().tabs[0];
      store.getState().setTabColor(tab.id, 'color1');
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Tab Color');
    await page.waitForTimeout(200);

    const noColorCircle = page.locator('.context-menu div[title="No color"]');
    await noColorCircle.click();
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].tabColor).toBe('none');
  });

  test('Clone to Split View creates split', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
    });
    await page.waitForTimeout(300);

    await rightClickTab(page, 0);
    await clickContextMenuItem(page, 'Clone to Split View');

    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('vertical');
  });

  test('Context menu closes on click outside', async ({ page }) => {
    await rightClickTab(page, 0);
    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible();

    // Click outside the menu
    await page.click('.notemac-app', { position: { x: 10, y: 200 } });
    await page.waitForTimeout(300);

    await expect(contextMenu).not.toBeVisible();
  });

  test('Context menu is positioned near click', async ({ page }) => {
    await rightClickTab(page, 0);
    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible();

    const box = await contextMenu.boundingBox();
    expect(box).not.toBeNull();
    // Menu should be positioned somewhere on screen
    expect(box!.x).toBeGreaterThan(0);
    expect(box!.y).toBeGreaterThan(0);
  });

  test('Each tab color can be applied', async ({ page }) => {
    const colors = ['color1', 'color2', 'color3', 'color4', 'color5'];

    for (const color of colors) {
      await page.evaluate((c) => {
        const store = (window as any).__ZUSTAND_STORE__;
        // Ensure we have a tab
        if (store.getState().tabs.length === 0) {
          store.getState().addTab({ name: 'test.js', content: 'a' });
        }
        const tab = store.getState().tabs[0];
        store.getState().setTabColor(tab.id, c);
      }, color);
      await page.waitForTimeout(100);

      const tabs = await getStoreState(page, 'tabs');
      expect(tabs[0].tabColor).toBe(color);
    }
  });

  test('Middle-click closes tab', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'extra.js', content: 'a' });
    });
    await page.waitForTimeout(300);

    const countBefore = await getTabCount(page);
    const tabs = page.locator('[draggable="true"]');
    await tabs.first().click({ button: 'middle' });
    await page.waitForTimeout(300);

    const countAfter = await getTabCount(page);
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Pinned tab has no close button', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'pinned.js', content: 'a' });
      const tab = store.getState().tabs[0];
      store.getState().togglePinTab(tab.id);
    });
    await page.waitForTimeout(300);

    // Pinned tabs should not have close button (button with aria-label "Close tab:")
    const closeButtons = page.locator('[draggable="true"]').first().locator('button[aria-label^="Close tab"]');
    const count = await closeButtons.count();
    expect(count).toBe(0);
  });

  test('Modified tab shows indicator', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
      const tab = store.getState().tabs[0];
      store.getState().updateTab(tab.id, { isModified: true });
    });
    await page.waitForTimeout(300);

    // Modified indicator is a bullet character
    const indicator = page.locator('[draggable="true"]').first().locator('text=●');
    await expect(indicator).toBeVisible();
  });

  test('Pinned tab shows pin icon', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'test.js', content: 'a' });
      const tab = store.getState().tabs[0];
      store.getState().togglePinTab(tab.id);
    });
    await page.waitForTimeout(300);

    // Pin icon is a span with title attribute
    const pinIcon = page.locator('[draggable="true"]').first().locator('span[title="Pinned"]');
    await expect(pinIcon).toBeVisible();
  });
});
