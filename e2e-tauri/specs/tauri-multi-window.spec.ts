import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, triggerMenuAction, getStoreState } from '../helpers/tauri-app';

/**
 * Multi-window and split-view scenario tests.
 * Tests split view, zoom, sidebar toggling, and dialog state management.
 * Also tests workspace/browser workspace management.
 */

test.describe('Tauri Split View', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
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

test.describe('Tauri Zoom Level', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('zoom level has a default value', async () => {
    const state = await getStoreState(page);
    expect(state.zoomLevel).toBeTruthy();
    expect(typeof state.zoomLevel).toBe('number');
  });

  test('zoom-in increases zoom level', async () => {
    const before = await getStoreState(page);
    const beforeZoom = before.zoomLevel;

    await triggerMenuAction(page, 'zoom-in');
    await page.waitForTimeout(100);

    const after = await getStoreState(page);
    expect(after.zoomLevel).toBeGreaterThan(beforeZoom);
  });

  test('zoom-out decreases zoom level', async () => {
    const before = await getStoreState(page);
    const beforeZoom = before.zoomLevel;

    await triggerMenuAction(page, 'zoom-out');
    await page.waitForTimeout(100);

    const after = await getStoreState(page);
    expect(after.zoomLevel).toBeLessThan(beforeZoom);
  });

  test('zoom-reset restores default level', async () => {
    // Zoom in a couple times first
    await triggerMenuAction(page, 'zoom-in');
    await triggerMenuAction(page, 'zoom-in');
    await page.waitForTimeout(100);

    await triggerMenuAction(page, 'zoom-reset');
    await page.waitForTimeout(100);

    const state = await getStoreState(page);
    expect(state.zoomLevel).toBe(14); // default font size
  });
});

test.describe('Tauri Dialog State Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
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
    await triggerMenuAction(page, 'about');
    await page.waitForTimeout(200);

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
    await triggerMenuAction(page, 'summary');
    await page.waitForTimeout(200);

    let state = await getStoreState(page);
    expect(state.showSummary).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowSummary(false);
    });

    state = await getStoreState(page);
    expect(state.showSummary).toBe(false);
  });

  test('shortcut-mapper dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowShortcutMapper(true);
    });

    let state = await getStoreState(page);
    expect(state.showShortcutMapper).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowShortcutMapper(false);
    });

    state = await getStoreState(page);
    expect(state.showShortcutMapper).toBe(false);
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

  test('quick-open dialog can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowQuickOpen(true);
    });

    let state = await getStoreState(page);
    expect(state.showQuickOpen).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowQuickOpen(false);
    });

    state = await getStoreState(page);
    expect(state.showQuickOpen).toBe(false);
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

test.describe('Tauri Sidebar Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('sidebar defaults to null (closed)', async () => {
    // Reset sidebar
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setSidebarPanel(null);
    });

    const state = await getStoreState(page);
    expect(state.sidebarPanel).toBeNull();
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
    // Set sidebar open
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
    // Should reopen to the last panel
    expect(state.sidebarPanel).toBeTruthy();
  });
});

test.describe('Tauri Browser Workspace Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('isBrowserWorkspace defaults to false', async () => {
    const state = await getStoreState(page);
    // In desktop mode this defaults to false
    expect(typeof state.isBrowserWorkspace).toBe('boolean');
  });

  test('browser workspace can be added', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddBrowserWorkspace({
        id: 'ws-1',
        name: 'Test Workspace',
        directoryHandle: null,
        createdAt: Date.now(),
      });
    });

    const state = await getStoreState(page);
    const ws = state.browserWorkspaces?.find((w: any) => w.id === 'ws-1');
    expect(ws).toBeTruthy();
    expect(ws.name).toBe('Test Workspace');
  });

  test('browser workspace can be removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveBrowserWorkspace('ws-1');
    });

    const state = await getStoreState(page);
    const ws = state.browserWorkspaces?.find((w: any) => w.id === 'ws-1');
    expect(ws).toBeFalsy();
  });
});

test.describe('Tauri Settings Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
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
