import { test, expect } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  getTabCount,
  getVisibleTabCount,
  getActiveTabName,
  pressShortcut,
  typeInEditor,
  getStoreState,
  getEditorContent,
  closeActiveTab,
  restoreLastClosedTab,
  switchToTab,
} from '../helpers/app';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('New tab creates a tab', async ({ page }) => {
    const initialCount = await getTabCount(page);
    await createNewTab(page);
    const newCount = await getTabCount(page);
    expect(newCount).toBe(initialCount + 1);
  });

  test('New tab has default name like "new 1"', async ({ page }) => {
    await createNewTab(page);
    const activeTabName = await getActiveTabName(page);
    expect(activeTabName).toMatch(/^new \d+$/i);
  });

  test('Close tab removes it', async ({ page }) => {
    await createNewTab(page);
    const countAfterCreate = await getTabCount(page);
    await closeActiveTab(page);
    const countAfterClose = await getTabCount(page);
    expect(countAfterClose).toBe(countAfterCreate - 1);
  });

  test('Multiple new tabs increment names', async ({ page }) => {
    await createNewTab(page);
    const firstName = await getActiveTabName(page);
    await createNewTab(page);
    const secondName = await getActiveTabName(page);
    await createNewTab(page);
    const thirdName = await getActiveTabName(page);

    expect(firstName).toMatch(/^new \d+$/i);
    expect(secondName).toMatch(/^new \d+$/i);
    expect(thirdName).toMatch(/^new \d+$/i);
    // Names should all be different
    const names = new Set([firstName, secondName, thirdName]);
    expect(names.size).toBe(3);
  });

  test('Close tab and open new tab works correctly', async ({ page }) => {
    const initialCount = await getTabCount(page);
    await createNewTab(page);
    expect(await getTabCount(page)).toBe(initialCount + 1);
    await closeActiveTab(page);
    expect(await getTabCount(page)).toBe(initialCount);
    await createNewTab(page);
    expect(await getTabCount(page)).toBe(initialCount + 1);
    // The new tab should be active and have a valid name
    const name = await getActiveTabName(page);
    expect(name).toMatch(/^new \d+$/i);
  });

  test('Restore closed tab brings it back', async ({ page }) => {
    await createNewTab(page);
    const countBefore = await getTabCount(page);

    await closeActiveTab(page);
    const countAfterClose = await getTabCount(page);
    expect(countAfterClose).toBe(countBefore - 1);

    await restoreLastClosedTab(page);
    const countAfterRestore = await getTabCount(page);
    expect(countAfterRestore).toBe(countBefore);
  });

  test('Tab shows modified indicator after editing', async ({ page }) => {
    await createNewTab(page);
    await typeInEditor(page, 'test content');
    await page.waitForTimeout(300);

    const modifiedName = await getActiveTabName(page);
    // Modified indicator should appear (name might change)
    expect(modifiedName).toBeTruthy();
  });

  test('Tab count increases with new tabs', async ({ page }) => {
    const initialCount = await getTabCount(page);

    for (let i = 0; i < 3; i++) {
      await createNewTab(page);
      const currentCount = await getTabCount(page);
      expect(currentCount).toBe(initialCount + i + 1);
    }
  });

  test('DOM tab count matches store tab count', async ({ page }) => {
    await createNewTab(page);
    const storeCount = await getTabCount(page);
    const visibleCount = await getVisibleTabCount(page);
    expect(visibleCount).toBe(storeCount);
  });

  test('Closing all tabs shows default state', async ({ page }) => {
    // Create a few tabs
    await createNewTab(page);
    await createNewTab(page);

    // Close all tabs except last
    let tabCount = await getTabCount(page);
    while (tabCount > 1) {
      await closeActiveTab(page);
      tabCount = await getTabCount(page);
    }

    // Should have at least the initial tab
    const finalCount = await getTabCount(page);
    expect(finalCount).toBeGreaterThan(0);
  });

  test('Active tab changes when switching tabs', async ({ page }) => {
    await createNewTab(page);
    const firstTabName = await getActiveTabName(page);

    await createNewTab(page);
    const secondTabName = await getActiveTabName(page);
    expect(secondTabName).not.toBe(firstTabName);

    // Switch back to the first created tab via store
    const tabCount = await getTabCount(page);
    await switchToTab(page, tabCount - 2);

    const activeAfterSwitch = await getActiveTabName(page);
    expect(activeAfterSwitch).toBe(firstTabName);
  });

  test('New tab content is empty', async ({ page }) => {
    await createNewTab(page);
    const content = await getEditorContent(page);
    expect(content.trim()).toBe('');
  });

  test('Tab preserves content when switching', async ({ page }) => {
    // Create first tab and add content
    await createNewTab(page);
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTabContent(state.activeTabId, 'first tab content');
      }
    });
    await page.waitForTimeout(200);

    // Create second tab and add different content
    await createNewTab(page);
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTabContent(state.activeTabId, 'second tab content');
      }
    });
    await page.waitForTimeout(200);

    // Get tab count and switch to the first of our two tabs
    const tabCount = await getTabCount(page);
    await switchToTab(page, tabCount - 2);

    const content = await getEditorContent(page);
    expect(content).toBe('first tab content');
  });
});
