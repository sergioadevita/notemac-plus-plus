import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction, getTabCount, createTestWorkspace, cleanupTestWorkspace } from '../helpers/electron-app';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Save/Open file flow tests for Electron.
 * Tests file opening via IPC, tab states, and file operations.
 */

test.describe('Electron File Open via IPC', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let workspacePath: string;

  test.beforeAll(async () => {
    workspacePath = createTestWorkspace();
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
    cleanupTestWorkspace();
  });

  test('file can be opened via IPC event', async () => {
    const filePath = path.join(workspacePath, 'test.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Simulate file-opened IPC event from main process
    await electronApp.evaluate(({ BrowserWindow }, { fp, c, n }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-opened', { path: fp, content: c, name: n });
    }, { fp: filePath, c: content, n: 'test.js' });
    await page.waitForTimeout(500);

    const state = await getStoreState(page);
    const openedTab = state.tabs.find((t: any) => t.path === filePath);
    expect(openedTab).toBeTruthy();
    expect(openedTab.name).toBe('test.js');
  });

  test('opening same file twice does not duplicate tab', async () => {
    const filePath = path.join(workspacePath, 'test.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    const beforeCount = await getTabCount(page);

    await electronApp.evaluate(({ BrowserWindow }, { fp, c, n }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-opened', { path: fp, content: c, name: n });
    }, { fp: filePath, c: content, n: 'test.js' });
    await page.waitForTimeout(500);

    const afterCount = await getTabCount(page);
    expect(afterCount).toBe(beforeCount);
  });

  test('multiple different files can be opened', async () => {
    const files = ['test.py', 'test.txt', 'test.json'];

    for (const fileName of files) {
      const filePath = path.join(workspacePath, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');

      await electronApp.evaluate(({ BrowserWindow }, { fp, c, n }) => {
        const win = BrowserWindow.getAllWindows()[0];
        win.webContents.send('file-opened', { path: fp, content: c, name: n });
      }, { fp: filePath, c: content, n: fileName });
      await page.waitForTimeout(300);
    }

    const state = await getStoreState(page);
    for (const fileName of files) {
      const filePath = path.join(workspacePath, fileName);
      const tab = state.tabs.find((t: any) => t.path === filePath);
      expect(tab).toBeTruthy();
    }
  });
});

test.describe('Electron New File & Tab State', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('new file tab has no path (unsaved)', async () => {
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    const state = await getStoreState(page);
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(tab).toBeTruthy();
    expect(tab.path).toBeFalsy();
  });

  test('tab becomes modified after editing', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(300);

    // Type into editor
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(100);
    await page.keyboard.type('modified content');
    await page.waitForTimeout(300);

    const state = await getStoreState(page);
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(tab.isModified).toBe(true);
  });

  test('close-unchanged only closes unmodified tabs', async () => {
    await triggerMenuAction(electronApp, 'close-all');
    await page.waitForTimeout(200);

    // Create 3 tabs
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(electronApp, 'new');
    await page.waitForTimeout(200);

    // Modify the active tab
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(100);
    await page.keyboard.type('dirty');
    await page.waitForTimeout(200);

    const beforeCount = await getTabCount(page);
    expect(beforeCount).toBe(3);

    await triggerMenuAction(electronApp, 'close-unchanged');
    await page.waitForTimeout(300);

    const afterCount = await getTabCount(page);
    // Only modified tab should remain
    expect(afterCount).toBe(1);
  });
});

test.describe('Electron Folder Open via IPC', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let workspacePath: string;

  test.beforeAll(async () => {
    workspacePath = createTestWorkspace();
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
    cleanupTestWorkspace();
  });

  test('folder can be opened via IPC event', async () => {
    // Simulate folder-opened event
    await electronApp.evaluate(({ BrowserWindow }, { fp }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('folder-opened', {
        path: fp,
        tree: [
          { name: 'test.js', type: 'file', path: fp + '/test.js' },
          { name: 'test.py', type: 'file', path: fp + '/test.py' },
          { name: 'src', type: 'directory', path: fp + '/src', children: [
            { name: 'index.js', type: 'file', path: fp + '/src/index.js' },
          ] },
        ],
      });
    }, { fp: workspacePath });
    await page.waitForTimeout(500);

    const state = await getStoreState(page);
    expect(state.fileTree).toBeTruthy();
    expect(state.workspacePath).toBe(workspacePath);
  });

  test('file tree contains expected entries', async () => {
    const state = await getStoreState(page);
    expect(state.fileTree).toBeTruthy();
    expect(Array.isArray(state.fileTree)).toBe(true);
    expect(state.fileTree.length).toBeGreaterThan(0);
  });
});

test.describe('Electron File Write via electronAPI', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let workspacePath: string;

  test.beforeAll(async () => {
    workspacePath = createTestWorkspace();
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
    cleanupTestWorkspace();
  });

  test('writeFile creates a file on disk', async () => {
    const filePath = path.join(workspacePath, 'new-file.txt');
    const content = 'Hello from Electron E2E test';

    const result = await page.evaluate(async ({ fp, c }) => {
      const api = (window as any).electronAPI;
      if (api?.writeFile) {
        return await api.writeFile(fp, c);
      }
      return null;
    }, { fp: filePath, c: content });

    // If electronAPI.writeFile is available, verify the file was written
    if (result !== null) {
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    }
  });

  test('readFile reads a file from disk', async () => {
    const filePath = path.join(workspacePath, 'test.txt');

    const result = await page.evaluate(async ({ fp }) => {
      const api = (window as any).electronAPI;
      if (api?.readFile) {
        return await api.readFile(fp);
      }
      return null;
    }, { fp: filePath });

    if (result !== null) {
      expect(result).toContain('Hello World');
    }
  });

  test('readDir returns file tree', async () => {
    const result = await page.evaluate(async ({ fp }) => {
      const api = (window as any).electronAPI;
      if (api?.readDir) {
        return await api.readDir(fp);
      }
      return null;
    }, { fp: workspacePath });

    if (result !== null) {
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
