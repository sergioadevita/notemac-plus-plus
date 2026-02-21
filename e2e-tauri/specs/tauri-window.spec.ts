import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState } from '../helpers/tauri-app';

test.describe('Tauri Window Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Window starts with app container visible', async () => {
    const appContainer = page.locator('.notemac-app');
    await expect(appContainer).toBeVisible();
  });

  test('set_always_on_top command works', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        await tauri.core.invoke('set_always_on_top', { value: true });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);

    await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__;
      await tauri.core.invoke('set_always_on_top', { value: false });
    });
  });

  test('minimize_window command works', async () => {
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
    await page.waitForTimeout(500);
  });

  test('maximize_window command works', async () => {
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
    await page.waitForTimeout(500);
  });

  test('App is responsive after window operations', async () => {
    const appVisible = await page.locator('.notemac-app').isVisible();
    expect(appVisible).toBe(true);

    const hasStore = await page.evaluate(() => {
      return typeof (window as any).__ZUSTAND_STORE__ !== 'undefined';
    });
    expect(hasStore).toBe(true);
  });

  test('Document is fully loaded', async () => {
    const readyState = await page.evaluate(() => document.readyState);
    expect(readyState).toBe('complete');
  });

  test('WebView content is not crashed', async () => {
    const result = await page.evaluate(() => 1 + 1);
    expect(result).toBe(2);
  });

  test('Window size can be checked', async () => {
    const size = page.viewportSize();
    expect(size).toBeTruthy();
    expect(size!.width).toBeGreaterThan(0);
    expect(size!.height).toBeGreaterThan(0);
  });

  test('Window has accessible DOM', async () => {
    const hasRoot = await page.evaluate(() => {
      return document.querySelector('#root') !== null || document.querySelector('.notemac-app') !== null;
    });
    expect(hasRoot).toBe(true);
  });

  test('getCurrentWindow returns mock window object', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        const windowObj = tauri.window.getCurrentWindow();
        return {
          success: true,
          hasMethods: typeof windowObj.minimize === 'function' && typeof windowObj.maximize === 'function'
        };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
    expect(result.hasMethods).toBe(true);
  });

  test('Window mock methods can be called', async () => {
    const result = await page.evaluate(async () => {
      try {
        const tauri = (window as any).__TAURI__;
        const windowObj = tauri.window.getCurrentWindow();
        await windowObj.setAlwaysOnTop(true);
        await windowObj.setAlwaysOnTop(false);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
  });
});

test.describe('Tauri App Lifecycle', () => {
  test('App launches and closes cleanly', async () => {
    const { context, page } = await launchTauriApp();

    const isRunning = await page.evaluate(() => document.readyState);
    expect(isRunning).toBe('complete');

    await closeTauriApp(context);
  });

  test('App loads HTML content successfully', async () => {
    const { context, page } = await launchTauriApp();

    const hasContent = await page.evaluate(() => {
      return document.querySelector('#root') !== null;
    });
    expect(hasContent).toBe(true);

    await closeTauriApp(context);
  });

  test('Multiple launch/close cycles work', async () => {
    for (let i = 0; i < 2; i++) {
      const { context, page } = await launchTauriApp();

      const hasStore = await page.evaluate(() => {
        return typeof (window as any).__ZUSTAND_STORE__ !== 'undefined';
      });
      expect(hasStore).toBe(true);

      await closeTauriApp(context);
    }
  });

  test('Page URL points to preview server', async () => {
    const { context, page } = await launchTauriApp();

    expect(page.url()).toContain('localhost');
    expect(page.url()).toContain('4173');

    await closeTauriApp(context);
  });
});

test.describe('Tauri Window Properties', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('Window context has viewport', async () => {
    const size = page.viewportSize();
    expect(size).toBeTruthy();
    expect(size!.width).toBe(1200);
    expect(size!.height).toBe(800);
  });

  test('Window can execute JavaScript', async () => {
    const result = await page.evaluate(() => {
      return { x: 10, y: 20 };
    });
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
  });

  test('Window can query DOM', async () => {
    const exists = await page.locator('.notemac-app').count();
    expect(exists).toBeGreaterThanOrEqual(1);
  });

  test('Window can interact with storage APIs', async () => {
    const result = await page.evaluate(() => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const val = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return { success: true, value: val };
      } catch (e) {
        return { success: false };
      }
    });
    expect(result.success).toBe(true);
    expect(result.value).toBe('test-value');
  });

  test('Window preserves store state across interactions', async () => {
    const stateBefore = await getStoreState(page);
    const tabCountBefore = stateBefore.tabs.length;

    await page.locator('button[aria-label="New tab"]').click();
    await page.waitForTimeout(300);

    const stateAfter = await getStoreState(page);
    const tabCountAfter = stateAfter.tabs.length;

    expect(tabCountAfter).toBe(tabCountBefore + 1);
  });
});
