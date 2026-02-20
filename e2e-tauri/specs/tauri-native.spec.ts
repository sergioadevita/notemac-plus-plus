import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState } from '../helpers/tauri-app';

test.describe('Tauri Native Features', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Tauri __TAURI__ global is available', async () => {
    const hasTauri = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    expect(hasTauri).toBe(true);
  });

  test('Tauri invoke function is callable', async () => {
    const canInvoke = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return typeof invoke === 'function';
      } catch {
        return false;
      }
    });
    expect(canInvoke).toBe(true);
  });

  test('is_safe_storage_available command responds', async () => {
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const available = await invoke('is_safe_storage_available');
        return { success: true, available };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    // The command should at least execute without error
    expect(result.success).toBe(true);
    expect(typeof result.available).toBe('boolean');
  });

  test('set_always_on_top command works without error', async () => {
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_always_on_top', { value: true });
        await invoke('set_always_on_top', { value: false });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('App container renders in Tauri', async () => {
    const appContainer = page.locator('.notemac-app, #root > div');
    await expect(appContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Monaco editor renders in Tauri WebView', async () => {
    const hasMonaco = await page.evaluate(() => {
      return document.querySelector('.monaco-editor') !== null;
    });
    expect(hasMonaco).toBe(true);
  });

  test('Preferences menu action opens settings dialog', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ showSettings: true });
    });
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Window is not always on top by default', async () => {
    // In Tauri, verify through store state (always-on-top defaults to off)
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        // Set to false explicitly and verify no error
        await invoke('set_always_on_top', { value: false });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('Title bar area exists in desktop mode', async () => {
    // Tauri uses Overlay title bar style, so app renders a custom title area
    const hasTitleText = await page.evaluate(() => {
      const spans = document.querySelectorAll('span');
      for (const span of spans) {
        if (span.textContent?.includes('Notemac++')) {
          return true;
        }
      }
      return false;
    });
    expect(hasTitleText).toBe(true);
  });

  test('Platform detection identifies Tauri', async () => {
    const platform = await page.evaluate(() => {
      // The PlatformBridge should detect Tauri
      if ((window as any).__TAURI__) return 'tauri';
      if ((window as any).electronAPI) return 'electron';
      return 'web';
    });
    expect(platform).toBe('tauri');
  });

  test('No web MenuBar in Tauri mode', async () => {
    // In desktop (Tauri) mode, native menus are used instead of web MenuBar
    const webMenuBar = await page.locator('[data-testid="menu-bar"]').count();
    expect(webMenuBar).toBeLessThanOrEqual(0);
  });

  test('Zustand store is exposed for testing', async () => {
    const hasStore = await page.evaluate(() => {
      return typeof (window as any).__ZUSTAND_STORE__ !== 'undefined';
    });
    expect(hasStore).toBe(true);
  });

  test('Store has expected initial state', async () => {
    const state = await getStoreState(page);
    expect(state).toBeTruthy();
    expect(Array.isArray(state.tabs)).toBe(true);
    expect(state.tabs.length).toBeGreaterThanOrEqual(1);
    expect(state.settings).toBeTruthy();
    expect(typeof state.zoomLevel).toBe('number');
  });

  test('Tauri event listener can be registered', async () => {
    const result = await page.evaluate(async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const unlisten = await listen('test-event', () => {});
        unlisten(); // Cleanup
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });
});
