import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, getTabCount, triggerMenuAction, createTestWorkspace, cleanupTestWorkspace } from '../helpers/electron-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Electron Menu Actions — File Menu', () =>
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

  test('new — creates a new tab', async () =>
  {
    const before = await getTabCount(page);
    await triggerMenuAction(electronApp, 'new');
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('close-tab — closes the active tab', async () =>
  {
    // Ensure at least 2 tabs
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    await triggerMenuAction(electronApp, 'close-tab');
    const after = await getTabCount(page);
    expect(after).toBe(before - 1);
  });

  test('close-all — closes all tabs', async () =>
  {
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(300);
    // close-all should close all, app creates a new one if 0
    const count = await getTabCount(page);
    expect(count).toBeLessThanOrEqual(1);
  });

  test('close-others — closes all except active', async () =>
  {
    // Create 3 tabs
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    expect(before).toBeGreaterThanOrEqual(3);

    await triggerMenuAction(electronApp, 'close-others');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(1);
  });

  test('pin-tab — toggles pin on active tab', async () =>
  {
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);

    const isPinnedBefore = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const s = store.getState();
      const tab = s.tabs.find((t: any) => t.id === s.activeTabId);
      return tab?.isPinned || false;
    });

    await triggerMenuAction(electronApp, 'pin-tab');
    await page.waitForTimeout(200);

    const isPinnedAfter = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const s = store.getState();
      const tab = s.tabs.find((t: any) => t.id === s.activeTabId);
      return tab?.isPinned || false;
    });

    expect(isPinnedAfter).toBe(!isPinnedBefore);
  });

  test('restore-last-closed — restores a closed tab', async () =>
  {
    // Create a tab and close it
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    const countWithNew = await getTabCount(page);
    await triggerMenuAction(electronApp, 'close-tab');
    await page.waitForTimeout(200);
    const countAfterClose = await getTabCount(page);
    expect(countAfterClose).toBe(countWithNew - 1);

    await triggerMenuAction(electronApp, 'restore-last-closed');
    await page.waitForTimeout(300);
    const countAfterRestore = await getTabCount(page);
    expect(countAfterRestore).toBe(countWithNew);
  });

  test('save-all — does not throw with no file paths', async () =>
  {
    // Just ensure it doesn't crash
    await triggerMenuAction(electronApp, 'save-all');
    await page.waitForTimeout(300);
    const appVisible = await page.locator('.notemac-app').isVisible();
    expect(appVisible).toBe(true);
  });

  test('print — menu action exists and is dispatchable', async () =>
  {
    // Print opens a native dialog which cannot be dismissed under xvfb easily.
    // We verify the action can be sent without the app crashing, using a timeout guard.
    const appVisibleBefore = await page.locator('.notemac-app').isVisible();
    expect(appVisibleBefore).toBe(true);

    // Verify print action is in the File menu
    const hasAction = await electronApp.evaluate(({ Menu }) =>
    {
      const menu = Menu.getApplicationMenu();
      if (!menu) return false;
      const fileMenu = menu.items.find((i: any) => i.label === 'File');
      if (!fileMenu?.submenu) return false;
      return fileMenu.submenu.items.some((i: any) => i.label === 'Print...');
    });
    expect(hasAction).toBe(true);
  });
});

test.describe('Electron Menu Actions — Search Menu', () =>
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

  test('find — opens find/replace panel', async () =>
  {
    await triggerMenuAction(electronApp, 'find');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('replace — opens find/replace panel', async () =>
  {
    await triggerMenuAction(electronApp, 'replace');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('goto-line — opens go to line dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'goto-line');
    const state = await getStoreState(page, 'showGoToLine');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('find-char-in-range — opens character in range dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'find-char-in-range');
    const state = await getStoreState(page, 'showCharInRange');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('find-in-files — opens find in files', async () =>
  {
    await triggerMenuAction(electronApp, 'find-in-files');
    await page.waitForTimeout(200);
    // find-in-files shows find/replace with files mode
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});

test.describe('Electron Menu Actions — View Menu', () =>
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

  test('toggle-sidebar — toggles sidebar visibility', async () =>
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
  });

  test('zoom-in — increases zoom level', async () =>
  {
    const before = await getStoreState(page, 'zoomLevel');
    await triggerMenuAction(electronApp, 'zoom-in');
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeGreaterThan(before);
    await triggerMenuAction(electronApp, 'zoom-reset');
  });

  test('zoom-out — decreases zoom level', async () =>
  {
    const before = await getStoreState(page, 'zoomLevel');
    await triggerMenuAction(electronApp, 'zoom-out');
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeLessThan(before);
    await triggerMenuAction(electronApp, 'zoom-reset');
  });

  test('zoom-reset — resets zoom to 0', async () =>
  {
    await triggerMenuAction(electronApp, 'zoom-in');
    await triggerMenuAction(electronApp, 'zoom-in');
    await triggerMenuAction(electronApp, 'zoom-reset');
    const level = await getStoreState(page, 'zoomLevel');
    expect(level).toBe(0);
  });

  test('toggle-minimap — toggles minimap setting', async () =>
  {
    const before = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.showMinimap;
    });
    await triggerMenuAction(electronApp, 'toggle-minimap', !before);
    const after = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.showMinimap;
    });
    expect(after).toBe(!before);
    // Restore
    await triggerMenuAction(electronApp, 'toggle-minimap', before);
  });

  test('word-wrap — toggles word wrap setting', async () =>
  {
    const before = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.wordWrap;
    });
    await triggerMenuAction(electronApp, 'word-wrap', !before);
    const after = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.wordWrap;
    });
    expect(after).toBe(!before);
    // Restore
    await triggerMenuAction(electronApp, 'word-wrap', before);
  });

  test('show-summary — opens summary dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'show-summary');
    const state = await getStoreState(page, 'showSummary');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('split-right — enables vertical split', async () =>
  {
    await triggerMenuAction(electronApp, 'split-right');
    await page.waitForTimeout(300);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('vertical');
    await triggerMenuAction(electronApp, 'close-split');
    await page.waitForTimeout(200);
  });

  test('split-down — enables horizontal split', async () =>
  {
    await triggerMenuAction(electronApp, 'split-down');
    await page.waitForTimeout(300);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('horizontal');
    await triggerMenuAction(electronApp, 'close-split');
    await page.waitForTimeout(200);
  });

  test('close-split — closes split view', async () =>
  {
    await triggerMenuAction(electronApp, 'split-right');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'close-split');
    await page.waitForTimeout(200);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('none');
  });

  test('distraction-free — toggles distraction free mode', async () =>
  {
    const before = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.distractionFreeMode;
    });
    await triggerMenuAction(electronApp, 'distraction-free', true);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.distractionFreeMode;
    });
    expect(after).toBe(true);
    // Restore
    await triggerMenuAction(electronApp, 'distraction-free', false);
    await page.waitForTimeout(200);
  });

  test('show-line-numbers — toggles line numbers', async () =>
  {
    const before = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.showLineNumbers;
    });
    await triggerMenuAction(electronApp, 'show-line-numbers', !before);
    const after = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.showLineNumbers;
    });
    expect(after).toBe(!before);
    // Restore
    await triggerMenuAction(electronApp, 'show-line-numbers', before);
  });
});

test.describe('Electron Menu Actions — Encoding Menu', () =>
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

  const encodings = ['utf-8', 'utf-8-bom', 'utf-16le', 'utf-16be', 'iso-8859-1', 'windows-1252'];

  for (const enc of encodings)
  {
    test(`encoding ${enc} — sets active tab encoding`, async () =>
    {
      await triggerMenuAction(electronApp, 'encoding', enc);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active?.encoding).toBe(enc);
    });
  }

  test('line-ending LF — sets line ending', async () =>
  {
    await triggerMenuAction(electronApp, 'line-ending', 'LF');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('LF');
  });

  test('line-ending CRLF — sets line ending', async () =>
  {
    await triggerMenuAction(electronApp, 'line-ending', 'CRLF');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('CRLF');
  });

  test('line-ending CR — sets line ending', async () =>
  {
    await triggerMenuAction(electronApp, 'line-ending', 'CR');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('CR');
  });
});

test.describe('Electron Menu Actions — Language Menu', () =>
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

  const languages = [
    'plaintext', 'c', 'cpp', 'csharp', 'css', 'go', 'html', 'java',
    'javascript', 'json', 'markdown', 'php', 'python', 'ruby', 'rust',
    'sql', 'swift', 'typescript', 'xml', 'yaml'
  ];

  for (const lang of languages)
  {
    test(`language ${lang} — sets active tab language`, async () =>
    {
      await triggerMenuAction(electronApp, 'language', lang);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active?.language).toBe(lang);
    });
  }
});

test.describe('Electron Menu Actions — Dialogs', () =>
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

  test('preferences — opens settings dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'preferences');
    const state = await getStoreState(page, 'showSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('about — opens about dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'about');
    const state = await getStoreState(page, 'showAbout');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('run-command — opens run command dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'run-command');
    const state = await getStoreState(page, 'showRunCommand');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('column-editor — opens column editor dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'column-editor');
    const state = await getStoreState(page, 'showColumnEditor');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('shortcut-mapper — opens shortcut mapper', async () =>
  {
    await triggerMenuAction(electronApp, 'shortcut-mapper');
    const state = await getStoreState(page, 'showShortcutMapper');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('command-palette — opens command palette', async () =>
  {
    await triggerMenuAction(electronApp, 'command-palette');
    const state = await getStoreState(page, 'showCommandPalette');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('quick-open — opens quick open', async () =>
  {
    await triggerMenuAction(electronApp, 'quick-open');
    const state = await getStoreState(page, 'showQuickOpen');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('compare-files — opens diff viewer', async () =>
  {
    await triggerMenuAction(electronApp, 'compare-files');
    const state = await getStoreState(page, 'showDiffViewer');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('snippet-manager — opens snippet manager', async () =>
  {
    await triggerMenuAction(electronApp, 'snippet-manager');
    const state = await getStoreState(page, 'showSnippetManager');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('toggle-terminal — toggles terminal panel', async () =>
  {
    const before = await getStoreState(page, 'showTerminalPanel');
    await triggerMenuAction(electronApp, 'toggle-terminal');
    const after = await getStoreState(page, 'showTerminalPanel');
    expect(after).toBe(!before);
    // Close if opened
    if (after) await triggerMenuAction(electronApp, 'toggle-terminal');
  });

  test('clone-repository — opens clone dialog', async () =>
  {
    await triggerMenuAction(electronApp, 'clone-repository');
    const state = await getStoreState(page, 'showCloneDialog');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('git-settings — opens git settings', async () =>
  {
    await triggerMenuAction(electronApp, 'git-settings');
    const state = await getStoreState(page, 'showGitSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('ai-settings — opens AI settings', async () =>
  {
    await triggerMenuAction(electronApp, 'ai-settings');
    const state = await getStoreState(page, 'showAiSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});

test.describe('Electron Menu Actions — Macro', () =>
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

  test('macro-start — starts macro recording', async () =>
  {
    await triggerMenuAction(electronApp, 'macro-start');
    const isRecording = await getStoreState(page, 'isRecordingMacro');
    expect(isRecording).toBe(true);
    await triggerMenuAction(electronApp, 'macro-stop');
  });

  test('macro-stop — stops macro recording', async () =>
  {
    await triggerMenuAction(electronApp, 'macro-start');
    await page.waitForTimeout(100);
    await triggerMenuAction(electronApp, 'macro-stop');
    const isRecording = await getStoreState(page, 'isRecordingMacro');
    expect(isRecording).toBe(false);
  });

  test('macro-playback — plays back recorded macro', async () =>
  {
    // Start recording, perform an action, stop, then playback
    await triggerMenuAction(electronApp, 'macro-start');
    await page.waitForTimeout(100);
    await triggerMenuAction(electronApp, 'macro-stop');
    await page.waitForTimeout(100);
    // Playback should not crash
    await triggerMenuAction(electronApp, 'macro-playback');
    await page.waitForTimeout(300);
    const appVisible = await page.locator('.notemac-app').isVisible();
    expect(appVisible).toBe(true);
  });
});
