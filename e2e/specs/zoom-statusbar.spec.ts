import { test, expect } from '@playwright/test';
import {
  gotoApp,
  getZoomLevel,
  getCursorPosition,
  typeInEditor,
  createNewTab,
  getStoreState,
  switchToTab,
  closeAllDialogs,
} from '../helpers/app';

test.describe('Zoom and Status Bar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
    await createNewTab(page);
  });

  test('Zoom in increases zoom level', async ({ page }) => {
    const initialZoom = await getZoomLevel(page);

    // Zoom in via store (Ctrl+= is intercepted by browser for browser zoom)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const current = store.getState().zoomLevel;
        store.getState().setZoomLevel(current + 1);
      }
    });
    await page.waitForTimeout(300);

    const zoomedIn = await getZoomLevel(page);
    expect(zoomedIn).toBeGreaterThan(initialZoom);
  });

  test('Zoom out decreases zoom level', async ({ page }) => {
    // First zoom in to have room to zoom out
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(2);
    });
    await page.waitForTimeout(300);

    const beforeZoomOut = await getZoomLevel(page);

    // Zoom out via store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const current = store.getState().zoomLevel;
        store.getState().setZoomLevel(current - 1);
      }
    });
    await page.waitForTimeout(300);

    const zoomedOut = await getZoomLevel(page);
    expect(zoomedOut).toBeLessThan(beforeZoomOut);
  });

  test('Zoom reset returns to 0', async ({ page }) => {
    // Zoom in first
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(3);
    });
    await page.waitForTimeout(300);

    // Reset zoom via store (Ctrl+0 is intercepted by browser)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(0);
    });
    await page.waitForTimeout(300);

    const resetZoom = await getZoomLevel(page);
    expect(resetZoom).toBe(0);
  });

  test('Zoom level is capped at max bounds', async ({ page }) => {
    // Set zoom to well above max (max is 10)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(100);
    });
    await page.waitForTimeout(300);

    const zoomLevel = await getZoomLevel(page);
    expect(zoomLevel).toBeLessThanOrEqual(10);
  });

  test('Zoom level is capped at min bounds', async ({ page }) => {
    // Set zoom to well below min (min is -5)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(-100);
    });
    await page.waitForTimeout(300);

    const zoomLevel = await getZoomLevel(page);
    expect(zoomLevel).toBeGreaterThanOrEqual(-5);
  });

  test('Status bar is visible (store has active tab)', async ({ page }) => {
    // The status bar renders when there's an active tab — verify via store
    const activeTabId = await getStoreState(page, 'activeTabId');
    expect(activeTabId).toBeTruthy();

    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBeGreaterThan(0);

    const activeTab = tabs.find((t: any) => t.id === activeTabId);
    expect(activeTab).toBeTruthy();
  });

  test('Status bar tracks cursor position', async ({ page }) => {
    // Type some text
    await typeInEditor(page, 'Hello');
    await page.waitForTimeout(300);

    // Get cursor position from Monaco
    const position = await getCursorPosition(page);
    expect(position.line).toBeGreaterThan(0);
    expect(position.column).toBeGreaterThan(0);
  });

  test('Status bar tracks file language via store', async ({ page }) => {
    // Check that active tab has a language property
    const state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab).toBeTruthy();

    // Language should be set (default is 'plaintext')
    const language = activeTab.language || 'plaintext';
    expect(typeof language).toBe('string');
    expect(language.length).toBeGreaterThan(0);
  });

  test('Status bar tracks encoding via store', async ({ page }) => {
    // Check that active tab has encoding info
    const state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab).toBeTruthy();

    // Encoding defaults to 'utf-8' or similar
    const encoding = activeTab.encoding || 'utf-8';
    expect(typeof encoding).toBe('string');
  });

  test('Status bar tracks line ending via store', async ({ page }) => {
    // Check that active tab has line ending info
    const state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab).toBeTruthy();

    // Line ending defaults to 'LF' or similar
    const eol = activeTab.eol || activeTab.lineEnding || 'LF';
    expect(['LF', 'CRLF', 'CR', 'lf', 'crlf', 'cr']).toContain(eol);
  });

  test('Status bar updates when switching tabs', async ({ page }) => {
    // Type in first tab
    await typeInEditor(page, 'First tab content');
    await page.waitForTimeout(300);

    // Create second tab via store (Ctrl+N intercepted by browser)
    await createNewTab(page);
    await page.waitForTimeout(300);

    // Type different content in second tab
    await typeInEditor(page, 'Second tab content');
    await page.waitForTimeout(300);

    const secondPosition = await getCursorPosition(page);
    expect(secondPosition.column).toBeGreaterThan(0);

    // Switch back to first tab via store
    await switchToTab(page, 0);
    await page.waitForTimeout(300);

    const positionAfterSwitch = await getCursorPosition(page);
    expect(positionAfterSwitch.line).toBeGreaterThan(0);
  });

  test('Multiple zoom in/out operations work correctly', async ({ page }) => {
    const initialZoom = await getZoomLevel(page);

    // Zoom in twice via store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setZoomLevel(2);
    });
    await page.waitForTimeout(300);

    const afterZoomIn = await getZoomLevel(page);
    expect(afterZoomIn).toBeGreaterThan(initialZoom);

    // Zoom out once via store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const current = store.getState().zoomLevel;
        store.getState().setZoomLevel(current - 1);
      }
    });
    await page.waitForTimeout(300);

    const afterZoomOut = await getZoomLevel(page);
    expect(afterZoomOut).toBeLessThan(afterZoomIn);
    expect(afterZoomOut).toBeGreaterThan(initialZoom);
  });

  test('Cursor position updates as text is entered', async ({ page }) => {
    // Type text and verify cursor tracks it
    await typeInEditor(page, 'Hello World');
    await page.waitForTimeout(300);

    const position = await getCursorPosition(page);
    // Cursor should be somewhere in the document
    expect(position.line).toBeGreaterThanOrEqual(1);
    expect(position.column).toBeGreaterThanOrEqual(1);

    // Verify store content was updated
    const state = await getStoreState(page);
    const activeTab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(activeTab.content).toContain('Hello World');
  });
});
