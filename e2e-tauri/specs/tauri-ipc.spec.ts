import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getTauriInvocations, clearTauriInvocations, createTestWorkspace, cleanupTestWorkspace, injectRealFsMock } from '../helpers/tauri-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Tauri IPC Communication', () => {
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

  test('read_file command works', async () => {
    const testFilePath = path.join(testWorkspace, 'test.js');
    const content = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, testFilePath);

    expect(content).toBe('const x = 1;\nconsole.log(x);');
  });

  test('write_file command is tracked in invocations', async () => {
    const filePath = path.join(testWorkspace, 'ipc-write-test.txt');
    const writeContent = 'Written via Tauri IPC';

    await clearTauriInvocations(page);
    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: writeContent });

    const invocations = await getTauriInvocations(page);
    const writeCall = invocations.find(inv => inv.cmd === 'write_file');
    expect(writeCall).toBeTruthy();
    expect(writeCall?.args).toEqual({ path: filePath, content: writeContent });
  });

  test('write_file creates actual file', async () => {
    const filePath = path.join(testWorkspace, 'ipc-write-test2.txt');
    const writeContent = 'Written via Tauri IPC';

    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: writeContent });

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(writeContent);
  });

  test('read_dir command returns tree structure', async () => {
    const listing = await page.evaluate(async (dp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_dir', { path: dp });
    }, testWorkspace);

    expect(Array.isArray(listing)).toBe(true);
    const entries = listing as any[];
    const entry = entries.find((e: any) => e.name === 'test.js');
    expect(entry).toBeTruthy();
    expect(entry.isDirectory).toBe(false);
  });

  test('read_dir excludes hidden files and node_modules', async () => {
    fs.writeFileSync(path.join(testWorkspace, '.hidden'), 'hidden', 'utf-8');
    fs.mkdirSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(testWorkspace, 'node_modules', 'test.js'), '', 'utf-8');

    const listing = await page.evaluate(async (dp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_dir', { path: dp });
    }, testWorkspace);

    const entries = listing as any[];
    const names = entries.map((e: any) => e.name);
    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('node_modules');

    fs.unlinkSync(path.join(testWorkspace, '.hidden'));
    fs.rmSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
  });

  test('file_exists command works for existing file', async () => {
    const filePath = path.join(testWorkspace, 'test.js');
    const exists = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('file_exists', { path: fp });
    }, filePath);

    expect(exists).toBe(true);
  });

  test('file_exists command works for non-existent file', async () => {
    const filePath = path.join(testWorkspace, 'nonexistent.txt');
    const exists = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('file_exists', { path: fp });
    }, filePath);

    expect(exists).toBe(false);
  });

  test('Multiple IPC calls in sequence work correctly', async () => {
    const file1 = path.join(testWorkspace, 'seq1.txt');
    const file2 = path.join(testWorkspace, 'seq2.txt');

    await page.evaluate(async ({ f1, f2 }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: f1, content: 'first' });
      await tauri.core.invoke('write_file', { path: f2, content: 'second' });
    }, { f1: file1, f2: file2 });

    expect(fs.readFileSync(file1, 'utf-8')).toBe('first');
    expect(fs.readFileSync(file2, 'utf-8')).toBe('second');
  });

  test('Reading non-existent file returns error', async () => {
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

  test('write_file creates file with empty content', async () => {
    const emptyPath = path.join(testWorkspace, 'empty.txt');

    await page.evaluate(async ({ fp }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: '' });
    }, { fp: emptyPath });

    expect(fs.existsSync(emptyPath)).toBe(true);
    expect(fs.readFileSync(emptyPath, 'utf-8')).toBe('');
  });

  test('rename_file command works', async () => {
    const origPath = path.join(testWorkspace, 'rename-test.txt');
    fs.writeFileSync(origPath, 'rename me', 'utf-8');

    await page.evaluate(async ({ op, nn }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('rename_file', { oldPath: op, newName: nn });
    }, { op: origPath, nn: 'renamed.txt' });
    await page.waitForTimeout(200);

    const newPath = path.join(testWorkspace, 'renamed.txt');
    expect(fs.existsSync(newPath)).toBe(true);
    expect(fs.readFileSync(newPath, 'utf-8')).toBe('rename me');
    expect(fs.existsSync(origPath)).toBe(false);
  });

  test('Write and read back preserves content with unicode', async () => {
    const filePath = path.join(testWorkspace, 'round-trip.txt');
    const content = 'Line 1\nLine 2\nSpecial chars: àéîöü\n日本語';

    await page.evaluate(async ({ fp, c }) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: content });

    const readBack = await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      return await tauri.core.invoke('read_file', { path: fp });
    }, filePath);

    expect(readBack).toBe(content);
  });

  test('invoke calls are tracked in __TAURI_INVOCATIONS__', async () => {
    await clearTauriInvocations(page);

    const testFilePath = path.join(testWorkspace, 'test.js');
    await page.evaluate(async (fp) => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('read_file', { path: fp });
    }, testFilePath);

    const invocations = await getTauriInvocations(page);
    const readCall = invocations.find(inv => inv.cmd === 'read_file');
    expect(readCall).toBeTruthy();
    expect(readCall?.args).toEqual({ path: testFilePath });
  });
});
