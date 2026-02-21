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
    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('none');
  });

  test('Split view state is tracked in store', async ({ page }) => {
    const state = await getStoreState(page);
    expect(state).toHaveProperty('splitView');
  });

  test('Can activate split horizontal view via store action', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal');
    });
    await page.waitForTimeout(500);

    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('horizontal');
  });

  test('Can activate split vertical view via store action', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('vertical');
    });
    await page.waitForTimeout(500);

    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('vertical');
  });

  test('Split horizontal updates store and renders editor area', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal');
    });
    await page.waitForTimeout(500);

    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('horizontal');

    const editors = page.locator('.monaco-editor');
    const editorCount = await editors.count();
    expect(editorCount).toBeGreaterThanOrEqual(1);
  });

  test('Split vertical updates store and renders editor area', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('vertical');
    });
    await page.waitForTimeout(500);

    const splitState = await getStoreState(page, 'splitView');
    expect(splitState).toBe('vertical');

    const editors = page.locator('.monaco-editor');
    const editorCount = await editors.count();
    expect(editorCount).toBeGreaterThanOrEqual(1);
  });

  test('Close split returns to single view', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal');
    });
    await page.waitForTimeout(500);

    const splitStateBefore = await getStoreState(page, 'splitView');
    expect(splitStateBefore).toBe('horizontal');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('none');
    });
    await page.waitForTimeout(500);

    const splitStateAfter = await getStoreState(page, 'splitView');
    expect(splitStateAfter).toBe('none');
  });

  test('Split mode has at least one Monaco editor pane', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal');
    });
    await page.waitForTimeout(500);

    const monacoEditors = page.locator('.monaco-editor');
    const count = await monacoEditors.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const editor = monacoEditors.first();
    const hasViewLines = await editor.locator('.view-lines').count();
    expect(hasViewLines).toBeGreaterThan(0);
  });

  test('Split view state cycles correctly', async ({ page }) => {
    // Start none -> horizontal -> vertical -> none
    let state = await getStoreState(page, 'splitView');
    expect(state).toBe('none');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal');
    });
    await page.waitForTimeout(300);
    state = await getStoreState(page, 'splitView');
    expect(state).toBe('horizontal');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('vertical');
    });
    await page.waitForTimeout(300);
    state = await getStoreState(page, 'splitView');
    expect(state).toBe('vertical');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('none');
    });
    await page.waitForTimeout(300);
    state = await getStoreState(page, 'splitView');
    expect(state).toBe('none');
  });
});
