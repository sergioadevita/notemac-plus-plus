import { test, expect } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  typeInEditor,
  getEditorContent,
  getStoreState,
  switchToTab,
  changeSetting,
  getSetting,
  closeAllDialogs,
} from '../helpers/app';

test.describe('EditorPanel and Monaco Editor', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
    await createNewTab(page);
  });

  // ============================================================================
  // 1. Editor Rendering & Language
  // ============================================================================

  test('Editor renders Monaco editor in DOM', async ({ page }) => {
    const monacoExists = await page.locator('.monaco-editor').count();
    expect(monacoExists).toBeGreaterThan(0);
  });

  test('Switching tabs updates editor content', async ({ page }) => {
    // Remember which tab index has our content
    const firstTabIndex = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      return state.tabs.findIndex((t: any) => t.id === state.activeTabId);
    });

    await typeInEditor(page, 'First tab content');
    await page.waitForTimeout(300);

    const firstTabContent = await getEditorContent(page);
    expect(firstTabContent).toContain('First tab content');

    await createNewTab(page);
    await typeInEditor(page, 'Second tab content');
    await page.waitForTimeout(300);

    const secondTabContent = await getEditorContent(page);
    expect(secondTabContent).toContain('Second tab content');

    // Switch back to the first tab using its index
    await switchToTab(page, firstTabIndex);
    await page.waitForTimeout(500);

    const switchedBackContent = await getEditorContent(page);
    expect(switchedBackContent).toContain('First tab content');
  });

  test('New tab starts with empty content', async ({ page }) => {
    const content = await getEditorContent(page);
    expect(content).toBe('');
  });

  test('Tab language is stored correctly in state', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTab(state.activeTabId, { language: 'python' });
      }
    });
    await page.waitForTimeout(300);

    const tabLanguage = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
        return tab?.language;
      }
      return null;
    });
    expect(tabLanguage).toBe('python');
  });

  test('Tab name reflects in DOM tab bar', async ({ page }) => {
    const tabExists = await page.locator('[draggable="true"]').count();
    expect(tabExists).toBeGreaterThan(0);
  });

  // ============================================================================
  // 2. Editor Settings
  // ============================================================================

  test('Word wrap setting toggles in store', async ({ page }) => {
    const initial = await getSetting(page, 'wordWrap');
    await changeSetting(page, 'wordWrap', !initial);
    const after = await getSetting(page, 'wordWrap');
    expect(after).toBe(!initial);
  });

  test('Font size setting changes in store', async ({ page }) => {
    await changeSetting(page, 'fontSize', 18);
    const fs = await getSetting(page, 'fontSize');
    expect(fs).toBe(18);
  });

  test('Minimap setting toggles in store', async ({ page }) => {
    await changeSetting(page, 'showMinimap', true);
    expect(await getSetting(page, 'showMinimap')).toBe(true);

    await changeSetting(page, 'showMinimap', false);
    expect(await getSetting(page, 'showMinimap')).toBe(false);
  });

  test('Line numbers setting toggles in store', async ({ page }) => {
    await changeSetting(page, 'showLineNumbers', true);
    expect(await getSetting(page, 'showLineNumbers')).toBe(true);

    await changeSetting(page, 'showLineNumbers', false);
    expect(await getSetting(page, 'showLineNumbers')).toBe(false);
  });

  test('Tab size setting persists', async ({ page }) => {
    await changeSetting(page, 'tabSize', 2);
    expect(await getSetting(page, 'tabSize')).toBe(2);

    await changeSetting(page, 'tabSize', 4);
    expect(await getSetting(page, 'tabSize')).toBe(4);
  });

  test('Read-only mode is stored on tab', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTab(state.activeTabId, { isReadOnly: true });
      }
    });
    await page.waitForTimeout(300);

    const isReadOnly = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
        return tab?.isReadOnly;
      }
      return false;
    });
    expect(isReadOnly).toBe(true);
  });

  test('Whitespace rendering setting toggles', async ({ page }) => {
    await changeSetting(page, 'renderWhitespace', 'all');
    expect(await getSetting(page, 'renderWhitespace')).toBe('all');

    await changeSetting(page, 'renderWhitespace', 'none');
    expect(await getSetting(page, 'renderWhitespace')).toBe('none');
  });

  test('Zoom level stored in state', async ({ page }) => {
    const zoomLevel = await getStoreState(page, 'zoomLevel');
    expect(typeof zoomLevel).toBe('number');
  });

  // ============================================================================
  // 3. Cursor & Position Tracking
  // ============================================================================

  test('Cursor position updates in store when typing', async ({ page }) => {
    await typeInEditor(page, 'hello');
    await page.waitForTimeout(300);

    const cursorCol = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
        return tab?.cursorColumn || 0;
      }
      return 0;
    });
    expect(cursorCol).toBeGreaterThan(1);
  });

  test('Cursor line updates after Enter key', async ({ page }) => {
    await typeInEditor(page, 'line1');
    await page.keyboard.press('Enter');
    await typeInEditor(page, 'line2');
    await page.waitForTimeout(300);

    const cursorLine = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
        return tab?.cursorLine || 0;
      }
      return 0;
    });
    expect(cursorLine).toBeGreaterThanOrEqual(2);
  });

  test('Cursor moves with arrow keys', async ({ page }) => {
    await typeInEditor(page, 'abcdef');
    await page.waitForTimeout(200);

    const colBefore = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.cursorColumn || 0;
    });

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);

    const colAfter = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.cursorColumn || 0;
    });

    expect(colAfter).toBeLessThan(colBefore);
  });

  test('Cursor position on multi-line content', async ({ page }) => {
    await typeInEditor(page, 'line1\nline2\nline3');
    await page.waitForTimeout(300);

    const cursorLine = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.cursorLine || 0;
    });
    expect(cursorLine).toBe(3);
  });

  // ============================================================================
  // 4. Editor Operations
  // ============================================================================

  test('Content change marks tab as modified', async ({ page }) => {
    await typeInEditor(page, 'new content');
    await page.waitForTimeout(300);

    const afterModified = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.isModified;
    });
    expect(afterModified).toBe(true);
  });

  test('Large file handling: 1000+ lines loads in store', async ({ page }) => {
    const largeContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: const x${i} = ${i};`).join('\n');

    await page.evaluate((content) => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.updateTabContent(state.activeTabId, content);
      }
    }, largeContent);
    await page.waitForTimeout(500);

    const content = await getEditorContent(page);
    expect(content.split('\n').length).toBeGreaterThanOrEqual(1000);

    const editorExists = await page.locator('.monaco-editor').count();
    expect(editorExists).toBeGreaterThan(0);
  });

  test('Duplicate line creates copy via Cmd+D', async ({ page }) => {
    await typeInEditor(page, 'original line');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+d');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    const lines = content.split('\n').filter((l: string) => l.includes('original line'));
    expect(lines.length).toBe(2);
  });

  test('Undo reverts changes', async ({ page }) => {
    await typeInEditor(page, 'first change');
    await page.waitForTimeout(300);

    const before = await getEditorContent(page);
    expect(before).toContain('first change');

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    const after = await getEditorContent(page);
    expect(after).not.toContain('first change');
  });

  test('Redo re-applies change', async ({ page }) => {
    await typeInEditor(page, 'test content');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content).toContain('test content');
  });

  test('Backspace deletes character', async ({ page }) => {
    await typeInEditor(page, 'hello');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content).toBe('hell');
  });

  // ============================================================================
  // 5. Split View
  // ============================================================================

  test('Split view horizontal sets state correctly', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setSplitView('horizontal', state.activeTabId);
      }
    });
    await page.waitForTimeout(300);

    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('horizontal');
  });

  test('Split view vertical sets state correctly', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setSplitView('vertical', state.activeTabId);
      }
    });
    await page.waitForTimeout(300);

    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('vertical');
  });

  test('Closing split returns to single view', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setSplitView('horizontal', state.activeTabId);
      }
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView(null);
    });
    await page.waitForTimeout(300);

    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBeNull();
  });

  test('Split view stores the split tab ID', async ({ page }) => {
    const tabId = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store?.getState().activeTabId;
    });

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setSplitView('horizontal', id);
    }, tabId);
    await page.waitForTimeout(300);

    const splitTabId = await getStoreState(page, 'splitTabId');
    expect(splitTabId).toBe(tabId);
  });

  // ============================================================================
  // 6. Monaco Editor DOM checks
  // ============================================================================

  test('Monaco editor view-lines element exists', async ({ page }) => {
    const viewLines = await page.locator('.monaco-editor .view-lines').count();
    expect(viewLines).toBeGreaterThan(0);
  });

  test('Editor has scrollable container', async ({ page }) => {
    const scrollable = await page.locator('.monaco-editor .overflow-guard').count();
    expect(scrollable).toBeGreaterThan(0);
  });

  test('Editor renders glyph margin for bookmarks', async ({ page }) => {
    const glyphMargin = await page.locator('.monaco-editor .glyph-margin').count();
    expect(glyphMargin).toBeGreaterThan(0);
  });
});
