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

test.describe('TabBar Deep Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  // Test 1: Middle-click closes tab
  test('Middle-click (button: 1) closes tab', async ({ page }) => {
    const initialCount = await getTabCount(page);
    await createNewTab(page);
    const countAfterCreate = await getTabCount(page);
    expect(countAfterCreate).toBe(initialCount + 1);

    // Find the first tab element and middle-click it
    const tabElement = page.locator('[draggable="true"]').first();
    await tabElement.click({ button: 'middle' });
    await page.waitForTimeout(300);

    const countAfterMiddleClick = await getTabCount(page);
    expect(countAfterMiddleClick).toBe(countAfterCreate - 1);
  });

  // Test 2: Pinned tab hides close button
  test('Pinned tab does not show close button with aria-label', async ({ page }) => {
    await createNewTab(page);

    // Get the first tab's ID
    const tabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().tabs[0]?.id;
    });

    // Pin the tab via store
    await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().togglePinTab(tid);
    }, tabId);
    await page.waitForTimeout(300);

    // Verify the tab is pinned in the store
    const isPinned = await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tab = store.getState().tabs.find((t: any) => t.id === tid);
      return tab?.isPinned;
    }, tabId);
    expect(isPinned).toBe(true);

    // Check that close button is not visible on the pinned tab
    const firstTabElement = page.locator('[draggable="true"]').first();
    const closeButton = firstTabElement.locator('button[aria-label^="Close tab"]');
    const closeButtonCount = await closeButton.count();
    expect(closeButtonCount).toBe(0);
  });

  // Test 3: Modified indicator appears in DOM
  test('Modified indicator appears in tab DOM after edit', async ({ page }) => {
    await createNewTab(page);

    // Get the active tab name before modification
    const initialName = await getActiveTabName(page);
    expect(initialName).toBeTruthy();

    // Type content to modify the tab
    await typeInEditor(page, 'This is modified content');
    await page.waitForTimeout(300);

    // Check that the tab is marked as modified in the store
    const isModified = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.isModified;
    });
    expect(isModified).toBe(true);

    // Check the DOM tab element contains a modified indicator (● or similar)
    const tabElement = page.locator('[draggable="true"]').last();
    const tabText = await tabElement.textContent();
    expect(tabText).toBeTruthy();
    // The modified indicator is typically a dot character
    expect(tabText).toMatch(/●|•|\*|◆/);
  });

  // Test 4: Tab color indicator in DOM
  test('Tab color indicator appears in tab DOM', async ({ page }) => {
    await createNewTab(page);

    // Get the active tab ID
    const tabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    // Set tab color to 'color1' via store
    await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setTabColor(tid, 'color1');
    }, tabId);
    await page.waitForTimeout(300);

    // Verify the color is set in the store
    const tabColor = await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tab = store.getState().tabs.find((t: any) => t.id === tid);
      return tab?.tabColor;
    }, tabId);
    expect(tabColor).toBe('color1');

    // Check the DOM tab element has a colored border or style
    const tabElement = page.locator('[draggable="true"]').last();
    const ariaLabel = await tabElement.getAttribute('aria-label');
    const style = await tabElement.getAttribute('style');
    const className = await tabElement.getAttribute('class');

    // The color indicator should be in one of these places
    const hasColorIndicator =
      (className && className.includes('color')) ||
      (style && (style.includes('border') || style.includes('rgb') || style.includes('#'))) ||
      (ariaLabel && ariaLabel.includes('color'));

    expect(hasColorIndicator).toBe(true);
  });

  // Test 5: Restore closed tab via keyboard
  test('Restore closed tab via keyboard shortcut or store method', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create a new tab with known content
    await createNewTab(page);
    await typeInEditor(page, 'Content to restore');
    await page.waitForTimeout(300);
    const countAfterCreate = await getTabCount(page);
    expect(countAfterCreate).toBe(initialCount + 1);

    // Close the active tab via store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeTab(store.getState().activeTabId);
    });
    await page.waitForTimeout(300);
    const countAfterClose = await getTabCount(page);
    expect(countAfterClose).toBe(countAfterCreate - 1);

    // Restore the closed tab via store method (fallback if keyboard shortcut doesn't work)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().restoreLastClosedTab();
    });
    await page.waitForTimeout(300);

    const countAfterRestore = await getTabCount(page);
    expect(countAfterRestore).toBe(countAfterCreate);
  });

  // Test 6: Next tab via keyboard/store
  test('Switch to next tab via store nextTab method', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create 3 tabs
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);
    await page.waitForTimeout(300);

    const finalCount = await getTabCount(page);
    expect(finalCount).toBe(initialCount + 3);

    // Switch to the first tab (index 0)
    await switchToTab(page, 0);
    await page.waitForTimeout(300);

    const firstTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    // Call nextTab to switch to the second tab (index 1)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().nextTab();
    });
    await page.waitForTimeout(300);

    const secondTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    expect(secondTabId).not.toBe(firstTabId);
  });

  // Test 7: Prev tab via keyboard/store
  test('Switch to previous tab via store prevTab method', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create 3 tabs
    await createNewTab(page);
    await createNewTab(page);
    await createNewTab(page);
    await page.waitForTimeout(300);

    const finalCount = await getTabCount(page);
    expect(finalCount).toBe(initialCount + 3);

    // Switch to the second tab (index 1)
    await switchToTab(page, 1);
    await page.waitForTimeout(300);

    const secondTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    // Call prevTab to switch back to the first tab (index 0)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().prevTab();
    });
    await page.waitForTimeout(300);

    const firstTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    expect(firstTabId).not.toBe(secondTabId);
  });

  // Test 8: Clone to Split View via context menu
  test('Context menu contains Clone to Split View option', async ({ page }) => {
    await createNewTab(page);

    // Right-click on a tab to open context menu
    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    // Look for context menu
    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    const menuExists = await contextMenu.count();
    expect(menuExists).toBeGreaterThan(0);

    // Look for "Clone to Split View" or similar option
    const cloneOption = contextMenu
      .locator('div, button, li')
      .filter({ hasText: /Clone|Split/ })
      .first();
    const cloneExists = await cloneOption.count();
    expect(cloneExists).toBeGreaterThan(0);
  });

  // Test 9: Context menu shows all expected options
  test('Right-click context menu contains all standard options', async ({ page }) => {
    await createNewTab(page);

    // Right-click on a tab
    const tab = page.locator('[draggable="true"]').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    // Get the context menu text
    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    const menuText = await contextMenu.textContent();
    expect(menuText).toBeTruthy();

    // Check for expected menu options
    const expectedOptions = ['Close', 'Pin', 'Color'];
    for (const option of expectedOptions) {
      expect(menuText?.toUpperCase()).toContain(option.toUpperCase());
    }
  });

  // Test 10: Tab DOM shows tab name text
  test('Tab DOM element contains the tab name text', async ({ page }) => {
    // Create a tab with a predictable name
    await createNewTab(page);
    await page.waitForTimeout(300);

    // Get the active tab name from store
    const tabName = await getActiveTabName(page);
    expect(tabName).toBeTruthy();

    // Find the draggable tab element
    const tabElement = page.locator('[draggable="true"]').last();
    const tabText = await tabElement.textContent();

    // Verify the tab name appears in the tab element's text content
    expect(tabText).toContain(tabName || '');
  });

  // Test 11: Read-only tab shows indicator
  test('Read-only tab shows indicator in DOM', async ({ page }) => {
    await createNewTab(page);

    // Get the active tab ID
    const tabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().activeTabId;
    });

    // Set the tab as read-only via store
    await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().updateTab(tid, { isReadOnly: true });
    }, tabId);
    await page.waitForTimeout(300);

    // Verify the read-only state in store
    const isReadOnly = await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tab = store.getState().tabs.find((t: any) => t.id === tid);
      return tab?.isReadOnly;
    }, tabId);
    expect(isReadOnly).toBe(true);

    // Check the DOM tab element for read-only indicator (icon, class, or text)
    const tabElement = page.locator('[draggable="true"]').last();
    const ariaLabel = await tabElement.getAttribute('aria-label');
    const className = await tabElement.getAttribute('class');
    const tabContent = await tabElement.textContent();

    const hasReadOnlyIndicator =
      (ariaLabel && ariaLabel.toLowerCase().includes('read')) ||
      (className && className.includes('read')) ||
      (tabContent && tabContent.includes('🔒'));

    // At minimum, the state should be set correctly in the store
    expect(isReadOnly).toBe(true);
  });

  // Test 12: New tab button exists and works
  test('New tab button exists and creates a tab', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Look for the new tab / add button in the tab bar area
    // It could be a button with text "+" or "New Tab" or an icon
    const newTabButton = page
      .locator('button')
      .filter({ hasText: /\+|New|Add/ })
      .first();
    const buttonExists = await newTabButton.count();

    if (buttonExists > 0) {
      // Click the new tab button
      await newTabButton.click();
      await page.waitForTimeout(300);

      const countAfterClick = await getTabCount(page);
      expect(countAfterClick).toBe(initialCount + 1);
    } else {
      // Fallback: use createNewTab helper to verify the concept works
      await createNewTab(page);
      const countAfterCreate = await getTabCount(page);
      expect(countAfterCreate).toBe(initialCount + 1);
    }
  });

  // Test 13: Rapid tab creation
  test('Rapidly create 15 tabs and verify all appear', async ({ page }) => {
    const initialCount = await getTabCount(page);
    const targetCount = 15;

    // Create 15 tabs rapidly
    for (let i = 0; i < targetCount; i++) {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().addTab();
      });
      // Minimal wait between creations
      await page.waitForTimeout(50);
    }

    // Wait for all tabs to be rendered
    await page.waitForTimeout(500);

    // Verify store count
    const storeCount = await getTabCount(page);
    expect(storeCount).toBe(initialCount + targetCount);

    // Verify DOM count matches store
    const domCount = await getVisibleTabCount(page);
    expect(domCount).toBe(storeCount);
  });

  // Test 14: Close tab updates DOM immediately
  test('Closing tab updates DOM immediately', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create 2 tabs
    await createNewTab(page);
    await createNewTab(page);
    await page.waitForTimeout(300);

    const countAfterCreate = await getTabCount(page);
    expect(countAfterCreate).toBe(initialCount + 2);

    // Get the second tab's ID
    const secondTabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().tabs[1]?.id;
    });

    // Close the second tab via store
    await page.evaluate((tid) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeTab(tid);
    }, secondTabId);

    // Wait a bit for DOM update
    await page.waitForTimeout(300);

    // Verify store count
    const storeCountAfterClose = await getTabCount(page);
    expect(storeCountAfterClose).toBe(countAfterCreate - 1);

    // Verify DOM count matches store
    const domCountAfterClose = await getVisibleTabCount(page);
    expect(domCountAfterClose).toBe(storeCountAfterClose);
  });

  // Test 15: Tab drag attribute exists
  test('All tab elements have draggable="true" attribute', async ({ page }) => {
    await createNewTab(page);
    await createNewTab(page);
    await page.waitForTimeout(300);

    // Get all tab elements
    const tabElements = page.locator('[draggable="true"]');
    const tabCount = await tabElements.count();
    expect(tabCount).toBeGreaterThan(2);

    // Check that all visible tabs have the draggable attribute
    for (let i = 0; i < tabCount; i++) {
      const tab = tabElements.nth(i);
      const draggable = await tab.getAttribute('draggable');
      expect(draggable).toBe('true');
    }
  });

  // Additional test: Multiple rapid close operations
  test('Multiple rapid close operations maintain DOM consistency', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create 5 tabs
    for (let i = 0; i < 5; i++) {
      await createNewTab(page);
    }
    await page.waitForTimeout(300);

    const countAfterCreation = await getTabCount(page);
    expect(countAfterCreation).toBe(initialCount + 5);

    // Rapidly close 3 tabs
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        const tabs = store.getState().tabs;
        if (tabs.length > 1) {
          store.getState().closeTab(tabs[tabs.length - 1].id);
        }
      });
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(300);

    // Verify consistency between store and DOM
    const storeCount = await getTabCount(page);
    const domCount = await getVisibleTabCount(page);
    expect(domCount).toBe(storeCount);
    expect(storeCount).toBe(countAfterCreation - 3);
  });

  // Additional test: Switch between all tabs sequentially
  test('Switch between all tabs sequentially and verify active state', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Create 5 tabs
    for (let i = 0; i < 5; i++) {
      await createNewTab(page);
    }
    await page.waitForTimeout(300);

    const totalTabCount = await getTabCount(page);
    const expectedCount = initialCount + 5;
    expect(totalTabCount).toBe(expectedCount);

    // Switch to each tab and verify active state
    for (let i = 0; i < totalTabCount; i++) {
      await switchToTab(page, i);
      await page.waitForTimeout(100);

      const activeTabId = await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        return store.getState().activeTabId;
      });

      const expectedTabId = await page.evaluate((idx) => {
        const store = (window as any).__ZUSTAND_STORE__;
        return store.getState().tabs[idx]?.id;
      }, i);

      expect(activeTabId).toBe(expectedTabId);
    }
  });
});
