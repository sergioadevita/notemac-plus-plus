import { Page } from '@playwright/test';

/**
 * Inject a mock window.electronAPI with recording spies.
 * Call this in beforeEach for tests that need file operation mocking.
 */
export async function mockElectronAPI(page: Page): Promise<void> {
  await page.evaluate(() => {
    const calls: Record<string, any[][]> = {};
    const record = (method: string) => (...args: any[]) => {
      if (!calls[method]) calls[method] = [];
      calls[method].push(args);
      // Return sensible defaults
      if (method === 'readFile') return Promise.resolve('mock file content');
      if (method === 'readDir') return Promise.resolve([
        { name: 'file1.js', isDirectory: false },
        { name: 'file2.ts', isDirectory: false },
        { name: 'src', isDirectory: true },
      ]);
      if (method === 'saveFileAs') return Promise.resolve('/mock/path/saved-file.txt');
      if (method === 'writeFile') return Promise.resolve(true);
      if (method === 'runCommand') return Promise.resolve({ stdout: 'mock output', stderr: '', exitCode: 0 });
      if (method === 'safeStorageEncrypt') return Promise.resolve('encrypted-data');
      if (method === 'safeStorageDecrypt') return Promise.resolve('decrypted-data');
      return Promise.resolve();
    };

    (window as any).electronAPI = {
      openFile: record('openFile'),
      openFolder: record('openFolder'),
      saveFile: record('saveFile'),
      saveFileAs: record('saveFileAs'),
      readFile: record('readFile'),
      writeFile: record('writeFile'),
      readDir: record('readDir'),
      runCommand: record('runCommand'),
      onMenuAction: record('onMenuAction'),
      onFileOpened: record('onFileOpened'),
      onFolderOpened: record('onFolderOpened'),
      safeStorageEncrypt: record('safeStorageEncrypt'),
      safeStorageDecrypt: record('safeStorageDecrypt'),
      renameFile: record('renameFile'),
      setAlwaysOnTop: record('setAlwaysOnTop'),
    };
    (window as any).__electronAPICalls__ = calls;
  });
}

/**
 * Get recorded calls to a specific mock electronAPI method.
 */
export async function getElectronAPICalls(page: Page, method: string): Promise<any[][]> {
  return page.evaluate((m) => {
    return (window as any).__electronAPICalls__?.[m] || [];
  }, method);
}

/**
 * Clear recorded calls for all or a specific method.
 */
export async function clearElectronAPICalls(page: Page, method?: string): Promise<void> {
  await page.evaluate((m) => {
    const calls = (window as any).__electronAPICalls__;
    if (!calls) return;
    if (m) { calls[m] = []; }
    else { Object.keys(calls).forEach(k => calls[k] = []); }
  }, method);
}

/**
 * Set a custom return value for a mock electronAPI method.
 */
export async function setMockReturnValue(page: Page, method: string, value: any): Promise<void> {
  await page.evaluate(({ m, v }) => {
    const api = (window as any).electronAPI;
    if (!api) return;
    const calls = (window as any).__electronAPICalls__;
    api[m] = (...args: any[]) => {
      if (!calls[m]) calls[m] = [];
      calls[m].push(args);
      return Promise.resolve(v);
    };
  }, { m: method, v: value });
}
