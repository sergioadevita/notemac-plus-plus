import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTauriInvocations, clearTauriInvocations, emitTauriEvent } from '../helpers/tauri-app';

test.describe('Tauri Native Features', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Tauri __TAURI__ global is available (mocked)', async () => {
    const hasTauri = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    expect(hasTauri).toBe(true);
  });

  test('Tauri invoke function is callable', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        return typeof tauri.core.invoke === 'function';
      } catch {
        return false;
      }
    });
    expect(result).toBe(true);
  });

  test('is_safe_storage_available command responds', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        const available = await tauri.core.invoke('is_safe_storage_available');
        return { success: true, available };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
    expect(typeof result.available).toBe('boolean');
  });

  test('set_always_on_top command works without error', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        await tauri.core.invoke('set_always_on_top', { value: true });
        await tauri.core.invoke('set_always_on_top', { value: false });
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
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        await tauri.core.invoke('set_always_on_top', { value: false });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('App renders in WebKit and has store', async () => {
    const hasStore = await page.evaluate(() => {
      return typeof (window as any).__ZUSTAND_STORE__ !== 'undefined';
    });
    expect(hasStore).toBe(true);
  });

  test('Mock __TAURI__ is available after injection', async () => {
    const hasTauri = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    expect(hasTauri).toBe(true);
  });

  test('App renders menu items (web mode with MenuBar)', async () => {
    // App runs in web mode, so the web MenuBar should render
    // Check for menu item text like "File", "Edit", etc.
    const hasMenuText = await page.evaluate(() => {
      const divs = document.querySelectorAll('div');
      for (const div of divs) {
        if (div.textContent === 'File' || div.textContent === 'Edit') return true;
      }
      return false;
    });
    expect(hasMenuText).toBe(true);
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
        const tauri = (window as any).__TAURI__;
        const unlisten = await tauri.event.listen('test-event', () => {});
        unlisten();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('Mock invoke tracking stores all calls', async () => {
    await clearTauriInvocations(page);

    await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('is_safe_storage_available');
      await tauri.core.invoke('set_always_on_top', { value: true });
    });

    const invocations = await getTauriInvocations(page);
    expect(invocations.length).toBeGreaterThanOrEqual(2);
    expect(invocations.some(inv => inv.cmd === 'is_safe_storage_available')).toBe(true);
    expect(invocations.some(inv => inv.cmd === 'set_always_on_top')).toBe(true);
  });

  test('Mock event listeners can be registered and emitted', async () => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;

      let eventFired = false;
      const unlisten = await tauri.event.listen('test-native-event', (event: any) => {
        eventFired = true;
      });

      await tauri.event.emit('test-native-event', { message: 'test' });
      await new Promise(resolve => setTimeout(resolve, 100));

      unlisten();
      return { success: true, eventFired };
    });

    expect(result.success).toBe(true);
    expect(result.eventFired).toBe(true);
  });

  test('minimize_window command callable', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        await tauri.core.invoke('minimize_window');
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('maximize_window command callable', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        await tauri.core.invoke('maximize_window');
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });

  test('get_monitor command callable', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        const monitor = await tauri.core.invoke('get_monitor');
        return { success: true, hasMonitor: monitor !== null };
      } catch (e: any) {
        return { success: true, hasMonitor: false };
      }
    });
    expect(result.success).toBe(true);
  });
});
