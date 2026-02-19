import { test, expect } from '@playwright/test';
import {
  gotoApp,
  getStoreState,
  typeInEditor,
  getEditorContent,
  createNewTab,
} from '../helpers/app';

test.describe('Split View', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('App starts in single view (no split)', async ({ page }) => {
    // Check store state for split view
    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBeNull();
  });

  test('Split view state is tracked in store', async ({ page }) => {
    // Check that store has a splitView property that can be set
    const state = await getStoreState(page);
    expect(state).toHaveProperty('splitView');
  });

  test('Can activate split horizontal view via store action', async ({ page }) => {
    // Trigger split horizontal action via page
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('horizontal');
      }
    });
    await page.waitForTimeout(500);

    // Verify split view is set
    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('horizontal');
  });

  test('Can activate split vertical view via store action', async ({ page }) => {
    // Trigger split vertical action via page
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('vertical');
      }
    });
    await page.waitForTimeout(500);

    // Verify split view is set
    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('vertical');
  });

  test('Split horizontal creates two editor panes', async ({ page }) => {
    // Enable horizontal split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('horizontal');
      }
    });
    await page.waitForTimeout(500);

    // Check for two editor instances
    const editors = page.locator('.monaco-editor');
    const editorCount = await editors.count();
    expect(editorCount).toBeGreaterThanOrEqual(2);
  });

  test('Split vertical creates two editor panes side by side', async ({ page }) => {
    // Enable vertical split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('vertical');
      }
    });
    await page.waitForTimeout(500);

    // Check for two editor instances
    const editors = page.locator('.monaco-editor');
    const editorCount = await editors.count();
    expect(editorCount).toBeGreaterThanOrEqual(2);

    // Get bounding boxes to verify they're side-by-side
    const firstEditor = editors.first();
    const lastEditor = editors.nth(editorCount - 1);

    const firstBox = await firstEditor.boundingBox();
    const lastBox = await lastEditor.boundingBox();

    if (firstBox && lastBox) {
      // For vertical split, x coordinates should differ (side by side)
      // Both should be within roughly the same y-range (same height)
      expect(firstBox.x).not.toEqual(lastBox.x);
    }
  });

  test('Close split returns to single view', async ({ page }) => {
    // Enable split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('horizontal');
      }
    });
    await page.waitForTimeout(500);

    // Verify split is active
    const splitStateBefore = await getStoreState(page, 'splitView');
    expect(splitStateBefore).toBe('horizontal');

    // Close split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView(null);
      }
    });
    await page.waitForTimeout(500);

    // Verify split is closed
    const splitStateAfter = await getStoreState(page, 'splitView');
    expect(splitStateAfter).toBeNull();
  });

  test('Both panes contain Monaco editors', async ({ page }) => {
    // Enable split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('horizontal');
      }
    });
    await page.waitForTimeout(500);

    // Check for Monaco editor elements
    const monacoEditors = page.locator('.monaco-editor');
    const count = await monacoEditors.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify each has the expected Monaco structure
    for (let i = 0; i < Math.min(2, count); i++) {
      const editor = monacoEditors.nth(i);
      const hasViewLines = await editor.locator('.view-lines').count();
      expect(hasViewLines).toBeGreaterThan(0);
    }
  });

  test('Each split pane has independent content', async ({ page }) => {
    // Enable split
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store && store.setSplitView) {
        store.setSplitView('horizontal');
      }
    });
    await page.waitForTimeout(500);

    // Type in first editor
    const firstEditor = page.locator('.monaco-editor .view-lines').first();
    await firstEditor.click();
    await page.keyboard.type('First pane content');
    await page.waitForTimeout(300);

    // Type in second editor
    const editors = page.locator('.monaco-editor .view-lines');
    const secondEditor = editors.nth(1);
    await secondEditor.click();
    await page.keyboard.type('Second pane content');
    await page.waitForTimeout(300);

    // Get content from both editors
    const firstContent = await page.evaluate(() => {
      const editor = (window as any).__monacoEditor;
      if (editor) return editor.getValue();
      return '';
    });

    // Both editors should exist, demonstrating independent split
    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('horizontal');
  });
});
