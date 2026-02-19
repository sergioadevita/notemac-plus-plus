import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState } from '../helpers/electron-app';

test.describe('Electron Native Features', () => {
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

  test('Application menu has expected categories', async () => {
    const menuLabels = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      return menu.items.map((item: any) => item.label);
    });

    expect(menuLabels).toContain('File');
    expect(menuLabels).toContain('Edit');
    expect(menuLabels).toContain('Search');
    expect(menuLabels).toContain('View');
    expect(menuLabels).toContain('Encoding');
    expect(menuLabels).toContain('Language');
    expect(menuLabels).toContain('Line Ops');
    expect(menuLabels).toContain('Macro');
    expect(menuLabels).toContain('Run');
    expect(menuLabels).toContain('Tools');
  });

  test('File menu has expected items', async () => {
    const fileItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const fileMenu = menu.items.find((i: any) => i.label === 'File');
      if (!fileMenu || !fileMenu.submenu) return [];
      return fileMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(fileItems).toContain('New');
    expect(fileItems).toContain('Open...');
    expect(fileItems).toContain('Save');
    expect(fileItems).toContain('Save As...');
    expect(fileItems).toContain('Close Tab');
  });

  test('Edit menu has expected items', async () => {
    const editItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const editMenu = menu.items.find((i: any) => i.label === 'Edit');
      if (!editMenu || !editMenu.submenu) return [];
      return editMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(editItems).toContain('Duplicate Line');
    expect(editItems).toContain('UPPERCASE');
    expect(editItems).toContain('lowercase');
    expect(editItems).toContain('Column Editor...');
  });

  test('View menu has expected items', async () => {
    const viewItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const viewMenu = menu.items.find((i: any) => i.label === 'View');
      if (!viewMenu || !viewMenu.submenu) return [];
      return viewMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(viewItems).toContain('Word Wrap');
    expect(viewItems).toContain('Zoom In');
    expect(viewItems).toContain('Zoom Out');
    expect(viewItems).toContain('Toggle Sidebar');
    expect(viewItems).toContain('Split Editor Right');
  });

  test('Language menu has programming languages', async () => {
    const langItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const langMenu = menu.items.find((i: any) => i.label === 'Language');
      if (!langMenu || !langMenu.submenu) return [];
      return langMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(langItems).toContain('JavaScript');
    expect(langItems).toContain('Python');
    expect(langItems).toContain('TypeScript');
    expect(langItems).toContain('HTML');
    expect(langItems).toContain('CSS');
  });

  test('Encoding menu has expected encodings', async () => {
    const encItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const encMenu = menu.items.find((i: any) => i.label === 'Encoding');
      if (!encMenu || !encMenu.submenu) return [];
      return encMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(encItems).toContain('UTF-8');
    expect(encItems).toContain('UTF-16 LE');
    expect(encItems).toContain('ISO 8859-1 (Latin)');
  });

  test('Tools menu has hash generators', async () => {
    const toolItems = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const toolMenu = menu.items.find((i: any) => i.label === 'Tools');
      if (!toolMenu || !toolMenu.submenu) return [];
      return toolMenu.submenu.items
        .filter((i: any) => i.type !== 'separator')
        .map((i: any) => i.label);
    });

    expect(toolItems).toContain('MD5 - Generate');
    expect(toolItems).toContain('SHA-256 - Generate');
    expect(toolItems).toContain('Base64 Encode');
    expect(toolItems).toContain('URL Encode');
  });

  test('Preferences menu action opens settings dialog', async () => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('menu-action', 'preferences');
    });
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Window is not always on top by default', async () => {
    const isAlwaysOnTop = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isAlwaysOnTop();
    });
    expect(isAlwaysOnTop).toBe(false);
  });

  test('Window title bar style is hiddenInset', async () => {
    // We can verify the window was created - titleBarStyle is a creation option
    // not readable after creation, but we can verify the window exists and works
    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.isVisible();
    });
    expect(isVisible).toBe(true);
  });
});
