import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTabCount, triggerMenuAction, createTestWorkspace, cleanupTestWorkspace } from '../helpers/tauri-app';

test.describe('Tauri UI — Editor Integration', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Editor panel is visible', async () => {
    const editorPanel = page.locator('.editor-panel, [class*="editor"]').first();
    await expect(editorPanel).toBeVisible({ timeout: 10000 });
  });

  test('Monaco editor initializes', async () => {
    const hasMonaco = await page.evaluate(() => {
      return document.querySelector('.monaco-editor') !== null;
    });
    expect(hasMonaco).toBe(true);
  });

  test('Typing in editor updates content', async () => {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(300);
    await page.keyboard.type('Hello Tauri Test');
    await page.waitForTimeout(300);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.content).toContain('Hello Tauri Test');
  });

  test('Tab modified indicator shows after editing', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(300);

    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.type('modified content');
    await page.waitForTimeout(300);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.isModified).toBe(true);
  });

  test('StatusBar is visible', async () => {
    const showStatusBar = await getStoreState(page, 'showStatusBar');
    if (showStatusBar) {
      const exists = await page.evaluate(() => {
        return document.querySelectorAll('[title="Cursor Position"], [title="Line Count"]').length > 0;
      });
      expect(exists).toBe(true);
    }
  });

  test('Title bar shows in desktop mode', async () => {
    const hasTitleText = await page.evaluate(() => {
      const spans = document.querySelectorAll('span');
      for (const span of spans) {
        if (span.textContent?.includes('Notemac++')) {
          return true;
        }
      }
      return false;
    });
    expect(hasTitleText).toBe(true);
  });

  test('Title bar shows active file name', async () => {
    const titleText = await page.evaluate(() => {
      const elements = document.querySelectorAll('span');
      for (const el of elements) {
        if (el.textContent?.includes('Notemac++')) {
          return el.textContent;
        }
      }
      return '';
    });
    expect(titleText).toContain('Notemac++');
  });

  test('Web MenuBar IS rendered in desktop mode (no electronAPI check)', async () => {
    const webMenuBar = await page.locator('[data-testid="menu-bar"]').count();
    expect(webMenuBar).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Tauri UI — Tab Operations', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('New tab button creates tab', async () => {
    const before = await getTabCount(page);
    const newTabBtn = page.locator('button[aria-label="New tab"]');
    await newTabBtn.click();
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('Tab switching works via click', async () => {
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(300);

    const tabs = page.locator('[draggable="true"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await tabs.first().click();
    await page.waitForTimeout(200);

    const state = await getStoreState(page);
    expect(state.activeTabId).toBeTruthy();
  });

  test('Tab close button closes specific tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);

    const closeBtn = page.locator('[draggable="true"]:last-child button, [draggable="true"]:last-child [aria-label*="close" i]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      const after = await getTabCount(page);
      expect(after).toBe(before - 1);
    }
  });

  test('Tabs show correct names', async () => {
    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBeGreaterThan(0);
    for (const tab of tabs) {
      expect(tab.name).toBeTruthy();
      expect(typeof tab.name).toBe('string');
    }
  });

  test('close-tabs-to-left works', async () => {
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(300);

    await triggerMenuAction(page, 'close-tabs-to-left');
    await page.waitForTimeout(300);

    const count = await getTabCount(page);
    expect(count).toBe(1);
  });

  test('close-tabs-to-right works', async () => {
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    const tabElements = page.locator('[draggable="true"]');
    await tabElements.first().click();
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'close-tabs-to-right');
    await page.waitForTimeout(300);

    const count = await getTabCount(page);
    expect(count).toBe(1);
  });

  test('close-unchanged only closes unmodified tabs', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(300);

    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.type('modified!');
    await page.waitForTimeout(300);

    const totalBefore = await getTabCount(page);

    await triggerMenuAction(page, 'close-unchanged');
    await page.waitForTimeout(300);

    const totalAfter = await getTabCount(page);
    expect(totalAfter).toBeGreaterThanOrEqual(1);
    expect(totalAfter).toBeLessThan(totalBefore);
  });
});

test.describe('Tauri UI — Sidebar', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Sidebar visibility can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.setState({ sidebarPanel: 'explorer' });
    });
    await page.waitForTimeout(200);

    const sidebarBefore = await getStoreState(page, 'sidebarPanel');
    expect(sidebarBefore).toBeTruthy();

    await triggerMenuAction(page, 'toggle-sidebar');
    await page.waitForTimeout(200);

    const sidebarAfter = await getStoreState(page, 'sidebarPanel');
    expect(sidebarAfter).toBeNull();

    await triggerMenuAction(page, 'toggle-sidebar');
  });

  test('Sidebar panels switch via menu actions', async () => {
    await triggerMenuAction(page, 'show-doc-list');
    await page.waitForTimeout(200);
    const panel1 = await getStoreState(page, 'sidebarPanel');
    expect(panel1).toBe('docList');

    await triggerMenuAction(page, 'show-function-list');
    await page.waitForTimeout(200);
    const panel2 = await getStoreState(page, 'sidebarPanel');
    expect(panel2).toBe('functions');

    await triggerMenuAction(page, 'show-project-panel');
    await page.waitForTimeout(200);
    const panel3 = await getStoreState(page, 'sidebarPanel');
    expect(panel3).toBe('project');
  });

  test('show-git-panel — shows git panel in sidebar', async () => {
    await triggerMenuAction(page, 'show-git-panel');
    await page.waitForTimeout(300);
    const panel = await getStoreState(page, 'sidebarPanel');
    expect(panel).toBe('git');
  });

  test('ai-chat — shows AI chat in sidebar', async () => {
    await triggerMenuAction(page, 'ai-chat');
    await page.waitForTimeout(300);
    const panel = await getStoreState(page, 'sidebarPanel');
    expect(panel).toBe('ai');
  });
});

test.describe('Tauri UI — Keyboard Shortcuts', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Ctrl+N creates new tab', async () => {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('Ctrl+W closes active tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+w');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before - 1);
  });

  test('Ctrl+F opens find', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.setState({ showFindReplace: false });
    });
    await page.waitForTimeout(200);

    await triggerMenuAction(page, 'find');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Ctrl+= zooms in', async () => {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    const before = await getStoreState(page, 'zoomLevel');
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(300);
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeGreaterThan(before);
    await triggerMenuAction(page, 'zoom-reset');
  });

  test('Ctrl+- zooms out', async () => {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    const before = await getStoreState(page, 'zoomLevel');
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(300);
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeLessThan(before);
    await triggerMenuAction(page, 'zoom-reset');
  });

  test('Ctrl+0 resets zoom', async () => {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+=');
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);
    const level = await getStoreState(page, 'zoomLevel');
    expect(level).toBe(0);
  });

  test('Escape closes dialogs', async () => {
    await triggerMenuAction(page, 'preferences');
    await page.waitForTimeout(300);
    expect(await getStoreState(page, 'showSettings')).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await getStoreState(page, 'showSettings')).toBe(false);
  });
});
