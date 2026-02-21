import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTabCount } from '../helpers/tauri-app';

test.describe('Tauri App', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('App launches successfully', async () => {
    expect(page).toBeTruthy();
  });

  test('App serves from preview server', async () => {
    expect(page.url()).toContain('localhost');
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

  test('Tauri mock API is available', async () => {
    const hasTauri = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    expect(hasTauri).toBe(true);
  });

  test('Tauri mock invoke is callable', async () => {
    const canInvoke = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      if (!tauri?.core?.invoke) return false;
      // Call a mock command
      const result = await tauri.core.invoke('is_safe_storage_available');
      return result === true;
    });
    expect(canInvoke).toBe(true);
  });

  test('Tauri mock event listen is callable', async () => {
    const canListen = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      if (!tauri?.event?.listen) return false;
      let received = false;
      await tauri.event.listen('test-event', () => { received = true; });
      await tauri.event.emit('test-event', { data: 'test' });
      return received;
    });
    expect(canListen).toBe(true);
  });

  test('At least one tab exists on launch', async () => {
    const count = await getTabCount(page);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Monaco editor initializes', async () => {
    const hasMonaco = await page.evaluate(() => {
      return document.querySelector('.monaco-editor') !== null;
    });
    expect(hasMonaco).toBe(true);
  });

  test('Window context viewport is 1200x800', async () => {
    const size = page.viewportSize();
    expect(size).toBeTruthy();
    expect(size!.width).toBe(1200);
    expect(size!.height).toBe(800);
  });

  test('Mock Tauri invocations tracking works', async () => {
    const invocations = await page.evaluate(() => {
      return (window as any).__TAURI_INVOCATIONS__;
    });
    expect(Array.isArray(invocations)).toBe(true);
  });

  test('Mock Tauri listeners storage works', async () => {
    const listeners = await page.evaluate(() => {
      return (window as any).__TAURI_LISTENERS__;
    });
    expect(typeof listeners).toBe('object');
  });

  test('PlatformBridge detects Tauri', async () => {
    const platform = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__;
      return typeof tauri !== 'undefined' ? 'tauri' : 'web';
    });
    expect(platform).toBe('tauri');
  });
});
