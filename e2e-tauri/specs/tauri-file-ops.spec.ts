import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTabCount, triggerMenuAction, createTestWorkspace, cleanupTestWorkspace, injectRealFsMock } from '../helpers/tauri-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Tauri File Operations', () => {
  let context: BrowserContext;
  let page: Page;
  let testWorkspace: string;

  test.beforeAll(async () => {
    testWorkspace = createTestWorkspace();
    ({ context, page } = await launchTauriApp());
    await injectRealFsMock(page);
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
    cleanupTestWorkspace();
  });

  test('read_file returns file content via invoke', async () => {
    const testFilePath = path.join(testWorkspace, 'test.js');
    const content = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, testFilePath);
    expect(content).toBe('const x = 1;\nconsole.log(x);');
  });

  test('write_file creates a new file', async () => {
    const newFilePath = path.join(testWorkspace, 'new-file.txt');
    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: newFilePath, c: 'Hello from Tauri test' });
    await page.waitForTimeout(300);

    expect(fs.existsSync(newFilePath)).toBe(true);
    expect(fs.readFileSync(newFilePath, 'utf-8')).toBe('Hello from Tauri test');
  });

  test('write_file overwrites existing file', async () => {
    const filePath = path.join(testWorkspace, 'test.txt');
    const originalContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: 'Overwritten content' });
    await page.waitForTimeout(300);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('Overwritten content');

    fs.writeFileSync(filePath, originalContent, 'utf-8');
  });

  test('read_dir returns directory listing', async () => {
    const listing = await page.evaluate(async (dp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_dir', { path: dp });
    }, testWorkspace);

    const entries = listing as any[];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    const names = entries.map((e: any) => e.name);
    expect(names).toContain('test.js');
    expect(names).toContain('test.py');
    expect(names).toContain('test.txt');
  });

  test('read_dir includes subdirectories', async () => {
    const listing = await page.evaluate(async (dp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_dir', { path: dp });
    }, testWorkspace);

    const entries = listing as any[];
    const srcDir = entries.find((e: any) => e.name === 'src');
    expect(srcDir).toBeTruthy();
    expect(srcDir.isDirectory).toBe(true);
    expect(srcDir.children).toBeTruthy();
    expect(srcDir.children.length).toBeGreaterThan(0);
  });

  test('read_file with different file types', async () => {
    const jsonContent = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, path.join(testWorkspace, 'test.json'));

    expect(jsonContent).toBe('{"key": "value"}');
  });

  test('read_file for Python file', async () => {
    const pyContent = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, path.join(testWorkspace, 'test.py'));

    expect(pyContent).toBe('x = 1\nprint(x)');
  });

  test('Write and read back preserves content', async () => {
    const filePath = path.join(testWorkspace, 'round-trip.txt');
    const content = 'Line 1\nLine 2\nSpecial chars: àéîöü\n日本語';

    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: content });
    await page.waitForTimeout(200);

    const readBack = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, filePath);

    expect(readBack).toBe(content);
  });

  test('Large file can be read', async () => {
    const largePath = path.join(testWorkspace, 'large.txt');
    const lines = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: content`).join('\n');
    fs.writeFileSync(largePath, lines, 'utf-8');

    const content = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, largePath) as string;

    expect(content.split('\n').length).toBe(1000);
  });

  test('Reading non-existent file throws error', async () => {
    const result = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      try {
        await tauri.core.invoke('read_file', { path: fp });
        return { error: false };
      } catch (e: any) {
        return { error: true, message: String(e) };
      }
    }, path.join(testWorkspace, 'nonexistent.txt'));

    expect(result.error).toBe(true);
  });

  test('Menu action "new" creates a new tab', async () => {
    const countBefore = await getTabCount(page);
    await triggerMenuAction(page, 'new');
    const countAfter = await getTabCount(page);
    expect(countAfter).toBe(countBefore + 1);
  });

  test('Menu action "close-tab" closes active tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const countBefore = await getTabCount(page);
    await triggerMenuAction(page, 'close-tab');
    const countAfter = await getTabCount(page);
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Multiple file operations dont conflict', async () => {
    const file1 = path.join(testWorkspace, 'concurrent1.txt');
    const file2 = path.join(testWorkspace, 'concurrent2.txt');

    await page.evaluate(async ({ f1, f2 }) => {
      const tauri = (window as any).__TAURI__;
      await Promise.all([
        tauri.core.invoke('write_file', { path: f1, content: 'content 1' }),
        tauri.core.invoke('write_file', { path: f2, content: 'content 2' }),
      ]);
    }, { f1: file1, f2: file2 });
    await page.waitForTimeout(300);

    expect(fs.readFileSync(file1, 'utf-8')).toBe('content 1');
    expect(fs.readFileSync(file2, 'utf-8')).toBe('content 2');
  });

  test('write_file with empty content creates empty file', async () => {
    const emptyPath = path.join(testWorkspace, 'empty.txt');

    await page.evaluate(async ({ fp }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: '' });
    }, { fp: emptyPath });
    await page.waitForTimeout(200);

    expect(fs.existsSync(emptyPath)).toBe(true);
    expect(fs.readFileSync(emptyPath, 'utf-8')).toBe('');
  });
});
