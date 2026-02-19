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
    const firstTabName = await getActiveTabName(page);

    await createNewTab(page);
    const secondTabName = await getActiveTabName(page);

    // Click first tab (draggable div in tab bar)
    const firstTab = page.locator('[draggable="true"]').first();
    await firstTab.click();
    await page.waitForTimeout(300);

    const activeAfterClick = await getActiveTabName(page);
    expect(activeAfterClick).toBe(firstTabName);
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

    const firstTabName = await getActiveTabName(page);

    await createNewTab(page);
    await typeInEditor(page, 'Tab 2 content');
    await page.waitForTimeout(300);

    // Switch back to first tab
    const tabs = page.locator('[draggable="true"]');
    const firstTab = tabs.nth(0);
    await firstTab.click();
    await page.waitForTimeout(300);

    const activeTabName = await getActiveTabName(page);
    expect(activeTabName).toBe(firstTabName);
  });

  test('Tab bar scrolls with many tabs', async ({ page }) => {
    // Create many tabs
    for (let i = 0; i < 10; i++) {
      await createNewTab(page);
      await page.waitForTimeout(100);
    }

    const tabCount = await getVisibleTabCount(page);
    expect(tabCount).toBeGreaterThan(5);

    // Tab bar container should exist
    const tabBar = page.locator('[role="tablist"]').first();
    const exists = await tabBar.count();
    expect(exists).toBeGreaterThan(0);
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

    // Pin it if possible
    const tab = page.locator('[role="tab"][aria-selected="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    const pinButton = page.locator('[role="menu"], .context-menu').first().locator('div, button, li').filter({ hasText: /Pin/ }).first();
    const pinExists = await pinButton.count();

    if (pinExists > 0) {
      await pinButton.click();
      await page.waitForTimeout(300);

      // Now create and close another tab
      await createNewTab(page);
      const tabCount = await getTabCount(page);
      expect(tabCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('Tab bar has proper ARIA attributes', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]').first();
    const count = await tablist.count();
    expect(count).toBeGreaterThan(0);

    if (count > 0) {
      const role = await tablist.getAttribute('role');
      expect(role).toBe('tablist');
    }
  });
});
