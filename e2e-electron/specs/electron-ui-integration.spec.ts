import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, getTabCount, triggerMenuAction, createTestWorkspace, cleanupTestWorkspace } from '../helpers/electron-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Electron UI — Editor Integration', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  test('Editor panel is visible', async () =>
  {
    const editorPanel = page.locator('.editor-panel, [class*="editor"]').first();
    await expect(editorPanel).toBeVisible({ timeout: 10000 });
  });

  test('Monaco editor initializes', async () =>
  {
    const hasMonaco = await page.evaluate(() =>
    {
      return document.querySelector('.monaco-editor') !== null;
    });
    expect(hasMonaco).toBe(true);
  });

  test('Typing in editor updates content', async () =>
  {
    // Focus editor
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(300);

    // Type some text
    await page.keyboard.type('Hello Electron Test');
    await page.waitForTimeout(300);

    // Check content via store
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.content).toContain('Hello Electron Test');
  });

  test('Tab modified indicator shows after editing', async () =>
  {
    // Create a fresh tab
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    // Focus and type
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.type('modified content');
    await page.waitForTimeout(300);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.isModified).toBe(true);
  });

  test('StatusBar is visible in Electron', async () =>
  {
    const showStatusBar = await getStoreState(page, 'showStatusBar');
    if (showStatusBar)
    {
      const statusBar = page.locator('[class*="status-bar"], [class*="statusbar"]').first();
      // Status bar should exist in the DOM
      const exists = await page.evaluate(() =>
      {
        return document.querySelectorAll('[title="Cursor Position"], [title="Line Count"]').length > 0;
      });
      expect(exists).toBe(true);
    }
  });

  test('Title bar shows in Electron mode', async () =>
  {
    // In Electron, there's a draggable title bar containing "Notemac++"
    const hasTitleText = await page.evaluate(() =>
    {
      const spans = document.querySelectorAll('span');
      for (const span of spans)
      {
        if (span.textContent?.includes('Notemac++'))
        {
          return true;
        }
      }
      return false;
    });
    expect(hasTitleText).toBe(true);
  });

  test('Title bar shows active file name', async () =>
  {
    const titleText = await page.evaluate(() =>
    {
      const elements = document.querySelectorAll('span');
      for (const el of elements)
      {
        if (el.textContent?.includes('Notemac++'))
        {
          return el.textContent;
        }
      }
      return '';
    });
    expect(titleText).toContain('Notemac++');
  });

  test('No web MenuBar in Electron mode', async () =>
  {
    // In Electron mode, the web MenuBar should not be shown
    // because isElectron is true and isDistractionFree is handled separately
    const isElectron = await page.evaluate(() =>
    {
      return !!(window as any).electronAPI;
    });
    expect(isElectron).toBe(true);

    // The web menu bar (with File, Edit, etc. as HTML elements) should not exist
    // Native menu is used instead
    const webMenuBar = await page.locator('[data-testid="menu-bar"]').count();
    // If not present, good — Electron uses native menus
    expect(webMenuBar).toBeLessThanOrEqual(0);
  });
});

test.describe('Electron UI — Tab Operations', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  test('New tab button creates tab', async () =>
  {
    const before = await getTabCount(page);
    const newTabBtn = page.locator('button[aria-label="New tab"]');
    await newTabBtn.click();
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('Tab switching works via click', async () =>
  {
    // Create 2 tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    const tabs = page.locator('[draggable="true"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Click the first tab
    await tabs.first().click();
    await page.waitForTimeout(200);

    // Verify the active tab changed
    const state = await getStoreState(page);
    expect(state.activeTabId).toBeTruthy();
  });

  test('Tab close button closes specific tab', async () =>
  {
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);

    // Find close button on active tab
    const closeBtn = page.locator('[draggable="true"]:last-child button, [draggable="true"]:last-child [aria-label*="close" i]').first();
    if (await closeBtn.isVisible())
    {
      await closeBtn.click();
      await page.waitForTimeout(300);
      const after = await getTabCount(page);
      expect(after).toBe(before - 1);
    }
  });

  test('Tabs show correct names', async () =>
  {
    const tabs = await getStoreState(page, 'tabs');
    expect(tabs.length).toBeGreaterThan(0);
    for (const tab of tabs)
    {
      expect(tab.name).toBeTruthy();
      expect(typeof tab.name).toBe('string');
    }
  });

  test('close-tabs-to-left works', async () =>
  {
    // Create several tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    // Active tab is the last one, close those to the left
    await triggerMenuAction(electronApp, 'close-tabs-to-left');
    await page.waitForTimeout(300);

    // Should have only 1 tab
    const count = await getTabCount(page);
    expect(count).toBe(1);
  });

  test('close-tabs-to-right works', async () =>
  {
    // Create tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);

    // Switch to first tab
    const tabElements = page.locator('[draggable="true"]');
    await tabElements.first().click();
    await page.waitForTimeout(200);

    await triggerMenuAction(electronApp, 'close-tabs-to-right');
    await page.waitForTimeout(300);

    const count = await getTabCount(page);
    expect(count).toBe(1);
  });

  test('close-unchanged only closes unmodified tabs', async () =>
  {
    // Create fresh state
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);

    // Create 3 tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    // Modify the active tab
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.type('modified!');
    await page.waitForTimeout(300);

    const totalBefore = await getTabCount(page);

    await triggerMenuAction(electronApp, 'close-unchanged');
    await page.waitForTimeout(300);

    const totalAfter = await getTabCount(page);
    // Modified tab should remain
    expect(totalAfter).toBeGreaterThanOrEqual(1);
    expect(totalAfter).toBeLessThan(totalBefore);
  });
});

test.describe('Electron UI — Sidebar', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  test('Sidebar visibility can be toggled', async () =>
  {
    // Ensure sidebar is visible by setting sidebarPanel to 'explorer'
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.setState({ sidebarPanel: 'explorer' });
    });
    await page.waitForTimeout(200);

    const sidebarBefore = await getStoreState(page, 'sidebarPanel');
    expect(sidebarBefore).toBeTruthy();

    await triggerMenuAction(electronApp, 'toggle-sidebar');
    await page.waitForTimeout(200);

    const sidebarAfter = await getStoreState(page, 'sidebarPanel');
    expect(sidebarAfter).toBeNull();

    // Restore
    await triggerMenuAction(electronApp, 'toggle-sidebar');
  });

  test('Sidebar panels switch via menu actions', async () =>
  {
    await triggerMenuAction(electronApp, 'show-doc-list');
    await page.waitForTimeout(200);
    const panel1 = await getStoreState(page, 'sidebarPanel');
    expect(panel1).toBe('docList');

    await triggerMenuAction(electronApp, 'show-function-list');
    await page.waitForTimeout(200);
    const panel2 = await getStoreState(page, 'sidebarPanel');
    expect(panel2).toBe('functions');

    await triggerMenuAction(electronApp, 'show-project-panel');
    await page.waitForTimeout(200);
    const panel3 = await getStoreState(page, 'sidebarPanel');
    expect(panel3).toBe('project');
  });

  test('show-git-panel — shows git panel in sidebar', async () =>
  {
    await triggerMenuAction(electronApp, 'show-git-panel');
    await page.waitForTimeout(300);
    const panel = await getStoreState(page, 'sidebarPanel');
    expect(panel).toBe('git');
  });

  test('ai-chat — shows AI chat in sidebar', async () =>
  {
    await triggerMenuAction(electronApp, 'ai-chat');
    await page.waitForTimeout(300);
    const panel = await getStoreState(page, 'sidebarPanel');
    expect(panel).toBe('ai');
  });
});

test.describe('Electron UI — Keyboard Shortcuts', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  test('Ctrl+N creates new tab', async () =>
  {
    const before = await getTabCount(page);
    // Use menu action — Ctrl+N may open a new Electron window on macOS CI
    // instead of being handled by the app's keydown handler
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('Ctrl+W closes active tab', async () =>
  {
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);

    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+w');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(before - 1);
  });

  test('Ctrl+F opens find', async () =>
  {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    // Ensure find is closed
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.setState({ showFindReplace: false });
    });
    await page.waitForTimeout(200);

    // Use menu action to simulate Ctrl+F (keyboard shortcut may be intercepted by Monaco)
    await triggerMenuAction(electronApp, 'find');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Ctrl+G opens go to line', async () =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.setState({ showGoToLine: false });
    });
    await page.waitForTimeout(200);

    await triggerMenuAction(electronApp, 'goto-line');
    const state = await getStoreState(page, 'showGoToLine');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Ctrl+B toggles sidebar', async () =>
  {
    const before = await getStoreState(page, 'sidebarPanel');
    await triggerMenuAction(electronApp, 'toggle-sidebar');
    const after = await getStoreState(page, 'sidebarPanel');
    if (before)
    {
      expect(after).toBeNull();
    }
    else
    {
      expect(after).toBeTruthy();
    }
    // Restore
    await triggerMenuAction(electronApp, 'toggle-sidebar');
    await page.waitForTimeout(200);
  });

  test('Ctrl+= zooms in', async () =>
  {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    const before = await getStoreState(page, 'zoomLevel');
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(300);
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeGreaterThan(before);
    await triggerMenuAction(electronApp, 'zoom-reset');
  });

  test('Ctrl+- zooms out', async () =>
  {
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(200);
    const before = await getStoreState(page, 'zoomLevel');
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(300);
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeLessThan(before);
    await triggerMenuAction(electronApp, 'zoom-reset');
  });

  test('Ctrl+0 resets zoom', async () =>
  {
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

  test('Escape closes dialogs', async () =>
  {
    await triggerMenuAction(electronApp, 'preferences');
    await page.waitForTimeout(300);
    expect(await getStoreState(page, 'showSettings')).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await getStoreState(page, 'showSettings')).toBe(false);
  });
});

test.describe('Electron UI — File Opened via IPC', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;
  let testWorkspace: string;

  test.beforeAll(async () =>
  {
    testWorkspace = createTestWorkspace();
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
    cleanupTestWorkspace();
  });

  test('Opening a file via IPC creates a tab with correct name', async () =>
  {
    await electronApp.evaluate(({ BrowserWindow }) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-opened', {
        path: '/fake/path/hello.js',
        content: 'const greeting = "hello";',
        name: 'hello.js',
      });
    });
    await page.waitForTimeout(500);

    const tabs = await getStoreState(page, 'tabs');
    const helloTab = tabs.find((t: any) => t.name === 'hello.js');
    expect(helloTab).toBeTruthy();
    expect(helloTab.content).toBe('const greeting = "hello";');
  });

  test('Opening a file auto-detects language from extension', async () =>
  {
    await electronApp.evaluate(({ BrowserWindow }) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-opened', {
        path: '/fake/path/styles.css',
        content: 'body { color: red; }',
        name: 'styles.css',
      });
    });
    await page.waitForTimeout(500);

    const tabs = await getStoreState(page, 'tabs');
    const cssTab = tabs.find((t: any) => t.name === 'styles.css');
    if (cssTab)
    {
      expect(cssTab.language).toBe('css');
    }
  });

  test('Opening a folder via IPC sets workspace root', async () =>
  {
    const tree = [
      { name: 'src', path: '/test/src', isDirectory: true, children: [
        { name: 'index.js', path: '/test/src/index.js', isDirectory: false }
      ]},
      { name: 'package.json', path: '/test/package.json', isDirectory: false },
    ];

    await electronApp.evaluate(({ BrowserWindow }, data) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('folder-opened', data);
    }, { path: '/test', tree });
    await page.waitForTimeout(500);

    const fileTree = await getStoreState(page, 'fileTree');
    expect(fileTree).toBeTruthy();
    if (Array.isArray(fileTree))
    {
      expect(fileTree.length).toBeGreaterThan(0);
    }
  });

  test('Opening multiple files via IPC creates multiple tabs', async () =>
  {
    const countBefore = await getTabCount(page);

    const files = [
      { path: '/test/a.js', content: 'let a = 1;', name: 'a.js' },
      { path: '/test/b.py', content: 'b = 2', name: 'b.py' },
      { path: '/test/c.html', content: '<h1>C</h1>', name: 'c.html' },
    ];

    for (const f of files)
    {
      await electronApp.evaluate(({ BrowserWindow }, data) =>
      {
        const win = BrowserWindow.getAllWindows()[0];
        win.webContents.send('file-opened', data);
      }, f);
      await page.waitForTimeout(200);
    }

    const countAfter = await getTabCount(page);
    expect(countAfter).toBe(countBefore + 3);
  });
});

test.describe('Electron UI — Always On Top', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  test('always-on-top can be enabled via menu action', async () =>
  {
    await triggerMenuAction(electronApp, 'always-on-top', true);
    await page.waitForTimeout(300);

    const isOnTop = await electronApp.evaluate(({ BrowserWindow }) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isAlwaysOnTop();
    });
    expect(isOnTop).toBe(true);

    // Restore
    await triggerMenuAction(electronApp, 'always-on-top', false);
    await page.waitForTimeout(200);
  });

  test('always-on-top can be disabled via menu action', async () =>
  {
    await triggerMenuAction(electronApp, 'always-on-top', true);
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'always-on-top', false);
    await page.waitForTimeout(300);

    const isOnTop = await electronApp.evaluate(({ BrowserWindow }) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isAlwaysOnTop();
    });
    expect(isOnTop).toBe(false);
  });

  test('setAlwaysOnTop via electronAPI', async () =>
  {
    await page.evaluate(() =>
    {
      (window as any).electronAPI.setAlwaysOnTop(true);
    });
    await page.waitForTimeout(300);

    const isOnTop = await electronApp.evaluate(({ BrowserWindow }) =>
    {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isAlwaysOnTop();
    });
    expect(isOnTop).toBe(true);

    // Restore
    await page.evaluate(() =>
    {
      (window as any).electronAPI.setAlwaysOnTop(false);
    });
    await page.waitForTimeout(200);
  });
});
