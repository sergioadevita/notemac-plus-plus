import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, createTestWorkspace, cleanupTestWorkspace } from '../helpers/tauri-app';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Tauri IPC Communication', () => {
  let context: BrowserContext;
  let page: Page;
  let testWorkspace: string;

  test.beforeAll(async () => {
    testWorkspace = createTestWorkspace();
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
    cleanupTestWorkspace();
  });

  test('read_file command works', async () => {
    const testFilePath = path.join(testWorkspace, 'test.js');
    const content = await page.evaluate(async (fp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('read_file', { path: fp });
    }, testFilePath);

    expect(content).toBe('const x = 1;\nconsole.log(x);');
  });

  test('write_file command works', async () => {
    const filePath = path.join(testWorkspace, 'ipc-write-test.txt');
    const writeContent = 'Written via Tauri IPC';

    const result = await page.evaluate(async ({ fp, c }) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: writeContent });

    expect(result).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(writeContent);
  });

  test('read_dir command returns tree structure', async () => {
    const listing = await page.evaluate(async (dp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('read_dir', { path: dp });
    }, testWorkspace);

    expect(Array.isArray(listing)).toBe(true);
    const entries = listing as any[];
    const entry = entries.find((e: any) => e.name === 'test.js');
    expect(entry).toBeTruthy();
    expect(entry.isDirectory).toBe(false);
  });

  test('read_dir excludes hidden files and node_modules', async () => {
    // Create hidden file and node_modules
    fs.writeFileSync(path.join(testWorkspace, '.hidden'), 'hidden', 'utf-8');
    fs.mkdirSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(testWorkspace, 'node_modules', 'test.js'), '', 'utf-8');

    const listing = await page.evaluate(async (dp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('read_dir', { path: dp });
    }, testWorkspace);

    const entries = listing as any[];
    const names = entries.map((e: any) => e.name);
    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('node_modules');

    // Cleanup
    fs.unlinkSync(path.join(testWorkspace, '.hidden'));
    fs.rmSync(path.join(testWorkspace, 'node_modules'), { recursive: true });
  });

  test('file_exists command works for existing file', async () => {
    const filePath = path.join(testWorkspace, 'test.js');
    const exists = await page.evaluate(async (fp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('file_exists', { path: fp });
    }, filePath);

    expect(exists).toBe(true);
  });

  test('file_exists command works for non-existent file', async () => {
    const filePath = path.join(testWorkspace, 'nonexistent.txt');
    const exists = await page.evaluate(async (fp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('file_exists', { path: fp });
    }, filePath);

    expect(exists).toBe(false);
  });

  test('Multiple IPC calls in sequence work correctly', async () => {
    const file1 = path.join(testWorkspace, 'seq1.txt');
    const file2 = path.join(testWorkspace, 'seq2.txt');

    await page.evaluate(async ({ f1, f2 }) => {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_file', { path: f1, content: 'first' });
      await invoke('write_file', { path: f2, content: 'second' });
    }, { f1: file1, f2: file2 });

    expect(fs.readFileSync(file1, 'utf-8')).toBe('first');
    expect(fs.readFileSync(file2, 'utf-8')).toBe('second');
  });

  test('Reading non-existent file returns error', async () => {
    const result = await page.evaluate(async (fp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('read_file', { path: fp });
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
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_file', { path: fp, content: '' });
    }, { fp: emptyPath });

    expect(fs.existsSync(emptyPath)).toBe(true);
    expect(fs.readFileSync(emptyPath, 'utf-8')).toBe('');
  });

  test('rename_file command works', async () => {
    const origPath = path.join(testWorkspace, 'rename-test.txt');
    fs.writeFileSync(origPath, 'rename me', 'utf-8');

    await page.evaluate(async ({ op, nn }) => {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('rename_file', { oldPath: op, newName: nn });
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
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_file', { path: fp, content: c });
    }, { fp: filePath, c: content });

    const readBack = await page.evaluate(async (fp) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('read_file', { path: fp });
    }, filePath);

    expect(readBack).toBe(content);
  });
});
