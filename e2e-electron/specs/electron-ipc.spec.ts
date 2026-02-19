import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, createTestWorkspace, cleanupTestWorkspace } from '../helpers/electron-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Electron IPC Communication', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let testWorkspace: string;

  test.beforeAll(async () => {
    testWorkspace = createTestWorkspace();
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
    cleanupTestWorkspace();
  });

  test('onMenuAction receives menu clicks', async () => {
    // Set up listener tracking in the renderer
    await page.evaluate(() => {
      (window as any).__menuActions__ = [];
      (window as any).electronAPI.onMenuAction((action: string, value: any) => {
        (window as any).__menuActions__.push({ action, value });
      });
    });

    // Send menu action from main process
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('menu-action', 'test-action');
    });
    await page.waitForTimeout(300);

    const actions = await page.evaluate(() => (window as any).__menuActions__);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[actions.length - 1].action).toBe('test-action');
  });

  test('onMenuAction receives value parameter', async () => {
    await page.evaluate(() => {
      (window as any).__menuActionsWithValue__ = [];
      (window as any).electronAPI.onMenuAction((action: string, value: any) => {
        (window as any).__menuActionsWithValue__.push({ action, value });
      });
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('menu-action', 'encoding', 'utf-8');
    });
    await page.waitForTimeout(300);

    const actions = await page.evaluate(() => (window as any).__menuActionsWithValue__);
    const encAction = actions.find((a: any) => a.action === 'encoding');
    expect(encAction).toBeTruthy();
    expect(encAction.value).toBe('utf-8');
  });

  test('onFileOpened receives file data', async () => {
    await page.evaluate(() => {
      (window as any).__fileOpenedData__ = null;
      (window as any).electronAPI.onFileOpened((data: any) => {
        (window as any).__fileOpenedData__ = data;
      });
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-opened', { path: '/test/file.js', content: 'test content', name: 'file.js' });
    });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => (window as any).__fileOpenedData__);
    expect(data).toBeTruthy();
    expect(data.path).toBe('/test/file.js');
    expect(data.content).toBe('test content');
    expect(data.name).toBe('file.js');
  });

  test('onFolderOpened receives folder data', async () => {
    await page.evaluate(() => {
      (window as any).__folderOpenedData__ = null;
      (window as any).electronAPI.onFolderOpened((data: any) => {
        (window as any).__folderOpenedData__ = data;
      });
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('folder-opened', { path: '/test/folder', tree: [{ name: 'file.js', isDirectory: false }] });
    });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => (window as any).__folderOpenedData__);
    expect(data).toBeTruthy();
    expect(data.path).toBe('/test/folder');
    expect(data.tree).toHaveLength(1);
  });

  test('readFile IPC handle works correctly', async () => {
    const filePath = path.join(testWorkspace, 'test.js');
    const content = await page.evaluate(async (fp) => {
      return await (window as any).electronAPI.readFile(fp);
    }, filePath);

    expect(content).toBe('const x = 1;\nconsole.log(x);');
  });

  test('writeFile IPC handle works correctly', async () => {
    const filePath = path.join(testWorkspace, 'ipc-write-test.txt');
    const writeContent = 'Written via IPC';

    const result = await page.evaluate(async ({ fp, c }) => {
      return await (window as any).electronAPI.writeFile(fp, c);
    }, { fp: filePath, c: writeContent });

    expect(result).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(writeContent);
  });

  test('readDir IPC handle returns tree structure', async () => {
    const listing = await page.evaluate(async (dp) => {
      return await (window as any).electronAPI.readDir(dp);
    }, testWorkspace);

    expect(Array.isArray(listing)).toBe(true);
    const entry = listing.find((e: any) => e.name === 'test.js');
    expect(entry).toBeTruthy();
    expect(entry.isDirectory).toBe(false);
    expect(entry.path).toBeTruthy();
  });

  test('readDir excludes hidden files and node_modules', async () => {
    // Create hidden file and node_modules
    fs.writeFileSync(path.join(testWorkspace, '.hidden'), 'hidden', 'utf-8');
    fs.mkdirSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(testWorkspace, 'node_modules', 'test.js'), '', 'utf-8');

    const listing = await page.evaluate(async (dp) => {
      return await (window as any).electronAPI.readDir(dp);
    }, testWorkspace);

    const names = listing.map((e: any) => e.name);
    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('node_modules');

    // Cleanup
    fs.unlinkSync(path.join(testWorkspace, '.hidden'));
    fs.rmSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
  });

  test('saveFile via IPC writes to disk', async () => {
    const filePath = path.join(testWorkspace, 'save-test.txt');
    const content = 'Saved via saveFile';

    await page.evaluate(async ({ fp, c }) => {
      return await (window as any).electronAPI.saveFile(c, fp);
    }, { fp: filePath, c: content });
    await page.waitForTimeout(200);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
  });

  test('Multiple IPC calls in sequence work correctly', async () => {
    const file1 = path.join(testWorkspace, 'seq1.txt');
    const file2 = path.join(testWorkspace, 'seq2.txt');

    await page.evaluate(async ({ f1, f2 }) => {
      const api = (window as any).electronAPI;
      await api.writeFile(f1, 'first');
      await api.writeFile(f2, 'second');
      const c1 = await api.readFile(f1);
      const c2 = await api.readFile(f2);
      return { c1, c2 };
    }, { f1: file1, f2: file2 });

    expect(fs.readFileSync(file1, 'utf-8')).toBe('first');
    expect(fs.readFileSync(file2, 'utf-8')).toBe('second');
  });

  test('onFileSaved receives save confirmation', async () => {
    await page.evaluate(() => {
      (window as any).__fileSavedData__ = null;
      (window as any).electronAPI.onFileSaved((data: any) => {
        (window as any).__fileSavedData__ = data;
      });
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send('file-saved', { path: '/saved/file.txt', name: 'file.txt' });
    });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => (window as any).__fileSavedData__);
    expect(data).toBeTruthy();
    expect(data.path).toBe('/saved/file.txt');
    expect(data.name).toBe('file.txt');
  });
});
