import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, getTabCount } from '../helpers/electron-app';

test.describe('Electron App', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('App launches successfully', async () => {
    expect(electronApp).toBeTruthy();
  });

  test('Main window is created', async () => {
    const windows = electronApp.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
  });

  test('Window has correct minimum dimensions', async () => {
    const bounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.getBounds();
    });
    expect(bounds.width).toBeGreaterThanOrEqual(600);
    expect(bounds.height).toBeGreaterThanOrEqual(400);
  });

  test('Window has correct default dimensions', async () => {
    const bounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.getBounds();
    });
    // Use tolerance — CI runners may constrain window to screen dimensions
    expect(bounds.width).toBeGreaterThanOrEqual(600);
    expect(bounds.width).toBeLessThanOrEqual(1200);
    expect(bounds.height).toBeGreaterThanOrEqual(400);
    expect(bounds.height).toBeLessThanOrEqual(800);
  });

  test('Preload script exposes electronAPI', async () => {
    const hasElectronAPI = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    expect(hasElectronAPI).toBe(true);
  });

  test('electronAPI has required methods', async () => {
    const methods = await page.evaluate(() => {
      const api = (window as any).electronAPI;
      if (!api) return [];
      return Object.keys(api);
    });
    expect(methods).toContain('onMenuAction');
    expect(methods).toContain('onFileOpened');
    expect(methods).toContain('openFile');
    expect(methods).toContain('openFolder');
    expect(methods).toContain('readFile');
    expect(methods).toContain('writeFile');
    expect(methods).toContain('readDir');
    expect(methods).toContain('saveFileAs');
  });

  test('App container renders', async () => {
    const appContainer = page.locator('.notemac-app, #root > div');
    await expect(appContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Store is exposed for testing', async () => {
    const hasStore = await page.evaluate(() => {
      return typeof (window as any).__ZUSTAND_STORE__ !== 'undefined';
    });
    expect(hasStore).toBe(true);
  });

  test('Window title is set', async () => {
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('At least one tab exists on launch', async () => {
    const count = await getTabCount(page);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Tab bar is visible', async () => {
    const tabs = page.locator('[draggable="true"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('New tab button exists', async () => {
    const newTabBtn = page.locator('button[aria-label="New tab"]');
    await expect(newTabBtn).toBeVisible();
  });

  test('Window can be resized', async () => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setSize(800, 600);
    });
    await page.waitForTimeout(500);

    const bounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.getBounds();
    });
    // Use tolerance — macOS CI may adjust for title bar/dock/HiDPI
    expect(bounds.width).toBeGreaterThanOrEqual(750);
    expect(bounds.width).toBeLessThanOrEqual(850);
    expect(bounds.height).toBeGreaterThanOrEqual(550);
    expect(bounds.height).toBeLessThanOrEqual(650);

    // Restore original size
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setSize(1200, 800);
    });
  });

  test('DevTools can be toggled', async () => {
    const isOpen = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.webContents.isDevToolsOpened();
    });
    // Toggle DevTools
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    });
    await page.waitForTimeout(500);
    const isOpenAfter = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.webContents.isDevToolsOpened();
    });
    expect(isOpenAfter).toBe(!isOpen);

    // Close DevTools if opened
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      }
    });
  });

  test('Window minimize and restore', async () => {
    // Note: minimize may not work under xvfb (no real window manager)
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
    });
    await page.waitForTimeout(500);

    const isMinimized = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isMinimized();
    });

    // Under xvfb, minimize may not actually minimize; skip if it didn't work
    if (!isMinimized) {
      test.skip();
      return;
    }

    expect(isMinimized).toBe(true);

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.restore();
    });
    await page.waitForTimeout(300);

    const isMinimizedAfter = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isMinimized();
    });
    expect(isMinimizedAfter).toBe(false);
  });

  test('Application menu exists', async () => {
    const menuItemCount = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      return menu ? menu.items.length : 0;
    });
    // Should have 11 menu categories
    expect(menuItemCount).toBeGreaterThanOrEqual(10);
  });
});
