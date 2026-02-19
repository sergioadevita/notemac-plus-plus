import { test, expect } from '@playwright/test';
import { gotoApp, getTabCount, getStoreState, switchToTab } from '../helpers/app';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Tab elements have draggable attribute', async ({ page }) => {
    // Create multiple tabs
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'file1.js', content: 'a' });
      store.getState().addTab({ name: 'file2.js', content: 'b' });
    });
    await page.waitForTimeout(300);

    const draggables = page.locator('[draggable="true"]');
    const count = await draggables.count();
    // Should have at least 3 tabs (initial + 2 created)
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('moveTab reorders tabs correctly (first to last)', async ({ page }) => {
    // Close all and create fresh tabs
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      store.getState().addTab({ name: 'C.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    // Move first tab to last position
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 2);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].name).toBe('B.js');
    expect(tabs[1].name).toBe('C.js');
    expect(tabs[2].name).toBe('A.js');
  });

  test('moveTab reorders tabs correctly (last to first)', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      store.getState().addTab({ name: 'C.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(2, 0);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].name).toBe('C.js');
    expect(tabs[1].name).toBe('A.js');
    expect(tabs[2].name).toBe('B.js');
  });

  test('moveTab same position is no-op', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 0);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].name).toBe('A.js');
    expect(tabs[1].name).toBe('B.js');
  });

  test('Tab preserves content after move', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'First.js', content: 'first content' });
      store.getState().addTab({ name: 'Second.js', content: 'second content' });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 1);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs[0].content).toBe('second content');
    expect(tabs[1].content).toBe('first content');
  });

  test('Modified tab retains isModified after move', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      // Mark first tab as modified
      const firstTab = store.getState().tabs[0];
      store.getState().updateTab(firstTab.id, { isModified: true });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 1);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    // A.js moved to index 1, should still be modified
    const movedTab = tabs.find((t: any) => t.name === 'A.js');
    expect(movedTab.isModified).toBe(true);
  });

  test('Pinned tab retains isPinned after move', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      const firstTab = store.getState().tabs[0];
      store.getState().togglePinTab(firstTab.id);
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 1);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const pinnedTab = tabs.find((t: any) => t.name === 'A.js');
    expect(pinnedTab.isPinned).toBe(true);
  });

  test('Tab color preserved after move', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'A.js', content: 'a' });
      store.getState().addTab({ name: 'B.js', content: 'b' });
      const firstTab = store.getState().tabs[0];
      store.getState().setTabColor(firstTab.id, 'color1');
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 1);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const coloredTab = tabs.find((t: any) => t.name === 'A.js');
    expect(coloredTab.tabColor).toBe('color1');
  });

  test('Single tab drag is no-op', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'Only.js', content: 'only' });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 0);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBe(1);
    expect(tabs[0].name).toBe('Only.js');
  });

  test('Tab language preserved after move', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
      store.getState().addTab({ name: 'script.py', content: 'print("hi")', language: 'python' });
      store.getState().addTab({ name: 'app.js', content: 'console.log("hi")', language: 'javascript' });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().moveTab(0, 1);
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const pyTab = tabs.find((t: any) => t.name === 'script.py');
    expect(pyTab.language).toBe('python');
  });
});
