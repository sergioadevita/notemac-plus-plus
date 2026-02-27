import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction } from '../helpers/electron-app';

/**
 * Split view, zoom, dialogs, sidebar, browser workspaces, and settings tests for Electron.
 */

test.describe('Electron Split View', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('split view defaults to none', async () => {
    const state = await getStoreState(page);
    expect(state.splitView).toBe('none');
  });

  test('split view can be set to horizontal', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSplitView('horizontal');
    });
    const state = await getStoreState(page);
    expect(state.splitView).toBe('horizontal');
  });

  test('split view can be set to vertical', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSplitView('vertical');
    });
    const state = await getStoreState(page);
    expect(state.splitView).toBe('vertical');
  });

  test('split view can be reset to none', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSplitView('none');
    });
    const state = await getStoreState(page);
    expect(state.splitView).toBe('none');
  });
});

test.describe('Electron Zoom Level', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('zoom level defaults to 0', async () => {
    // Reset first
    await triggerMenuAction(electronApp, 'zoom-reset');
    const state = await getStoreState(page);
    expect(typeof state.zoomLevel).toBe('number');
    expect(state.zoomLevel).toBe(0);
  });

  test('zoom-in increases zoom level', async () => {
    const before = await getStoreState(page);
    const beforeZoom = before.zoomLevel;
    await triggerMenuAction(electronApp, 'zoom-in');
    const after = await getStoreState(page);
    expect(after.zoomLevel).toBeGreaterThan(beforeZoom);
  });

  test('zoom-out decreases zoom level', async () => {
    const before = await getStoreState(page);
    const beforeZoom = before.zoomLevel;
    await triggerMenuAction(electronApp, 'zoom-out');
    const after = await getStoreState(page);
    expect(after.zoomLevel).toBeLessThan(beforeZoom);
  });

  test('zoom-reset restores default level', async () => {
    await triggerMenuAction(electronApp, 'zoom-in');
    await triggerMenuAction(electronApp, 'zoom-in');
    await triggerMenuAction(electronApp, 'zoom-reset');
    const state = await getStoreState(page);
    expect(state.zoomLevel).toBe(0);
  });
});

test.describe('Electron Dialog State Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('settings dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSettings(true);
    });
    let state = await getStoreState(page);
    expect(state.showSettings).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSettings(false);
    });
    state = await getStoreState(page);
    expect(state.showSettings).toBe(false);
  });

  test('go-to-line dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowGoToLine(true);
    });
    let state = await getStoreState(page);
    expect(state.showGoToLine).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowGoToLine(false);
    });
    state = await getStoreState(page);
    expect(state.showGoToLine).toBe(false);
  });

  test('about dialog can be toggled', async () => {
    await triggerMenuAction(electronApp, 'about');
    let state = await getStoreState(page);
    expect(state.showAbout).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowAbout(false);
    });
    state = await getStoreState(page);
    expect(state.showAbout).toBe(false);
  });

  test('run-command dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowRunCommand(true);
    });
    let state = await getStoreState(page);
    expect(state.showRunCommand).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowRunCommand(false);
    });
    state = await getStoreState(page);
    expect(state.showRunCommand).toBe(false);
  });

  test('column-editor dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowColumnEditor(true);
    });
    let state = await getStoreState(page);
    expect(state.showColumnEditor).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowColumnEditor(false);
    });
    state = await getStoreState(page);
    expect(state.showColumnEditor).toBe(false);
  });

  test('summary dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSummary(true);
    });
    let state = await getStoreState(page);
    expect(state.showSummary).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSummary(false);
    });
    state = await getStoreState(page);
    expect(state.showSummary).toBe(false);
  });

  test('command-palette dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowCommandPalette(true);
    });
    let state = await getStoreState(page);
    expect(state.showCommandPalette).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowCommandPalette(false);
    });
    state = await getStoreState(page);
    expect(state.showCommandPalette).toBe(false);
  });

  test('diff-viewer dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowDiffViewer(true);
    });
    let state = await getStoreState(page);
    expect(state.showDiffViewer).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowDiffViewer(false);
    });
    state = await getStoreState(page);
    expect(state.showDiffViewer).toBe(false);
  });

  test('snippet-manager dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSnippetManager(true);
    });
    let state = await getStoreState(page);
    expect(state.showSnippetManager).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSnippetManager(false);
    });
    state = await getStoreState(page);
    expect(state.showSnippetManager).toBe(false);
  });

  test('clone-dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowCloneDialog(true);
    });
    let state = await getStoreState(page);
    expect(state.showCloneDialog).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowCloneDialog(false);
    });
    state = await getStoreState(page);
    expect(state.showCloneDialog).toBe(false);
  });

  test('git-settings dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowGitSettings(true);
    });
    let state = await getStoreState(page);
    expect(state.showGitSettings).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowGitSettings(false);
    });
    state = await getStoreState(page);
    expect(state.showGitSettings).toBe(false);
  });
});

test.describe('Electron Sidebar Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('sidebar can be set to explorer', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel('explorer');
    });
    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('explorer');
  });

  test('sidebar can be set to search', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel('search');
    });
    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('search');
  });

  test('sidebar can be set to git', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel('git');
    });
    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBe('git');
  });

  test('toggleSidebar toggles between open and closed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel('explorer');
    });

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.toggleSidebar();
    });
    let state = await getStoreState(page);
    expect(state.sidebarPanel).toBeNull();

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.toggleSidebar();
    });
    state = await getStoreState(page);
    expect(state.sidebarPanel).toBeTruthy();
  });
});

test.describe('Electron Settings Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('settings can be updated', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.updateSettings({ wordWrap: 'on', fontSize: 16 });
    });
    const state = await getStoreState(page);
    expect(state.settings.wordWrap).toBe('on');
    expect(state.settings.fontSize).toBe(16);
  });

  test('individual setting can be changed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.updateSettings({ minimap: false });
    });
    const state = await getStoreState(page);
    expect(state.settings.minimap).toBe(false);
  });
});
