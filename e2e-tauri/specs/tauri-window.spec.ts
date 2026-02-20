import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, triggerMenuAction } from '../helpers/tauri-app';

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
    // Verify the command can be invoked without error
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_always_on_top', { value: true });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);

    // Disable it
    await page.evaluate(async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_always_on_top', { value: false });
    });
  });

  test('minimize_window command works', async () => {
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('minimize_window');
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    // minimize may not work under headless/xvfb but shouldn't throw
    expect(result.success).toBe(true);

    // Restore by waiting
    await page.waitForTimeout(500);
  });

  test('maximize_window command works', async () => {
    const result = await page.evaluate(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('maximize_window');
        return { success: true };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    });
    expect(result.success).toBe(true);
    await page.waitForTimeout(500);
  });

  test('App is responsive after window operations', async () => {
    // Verify app still works after window ops
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
    // Verify JavaScript execution still works
    const result = await page.evaluate(() => 1 + 1);
    expect(result).toBe(2);
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

    // Tauri loads the frontend from its embedded dist
    const hasContent = await page.evaluate(() => {
      return document.querySelector('#root') !== null;
    });
    expect(hasContent).toBe(true);

    await closeTauriApp(context);
  });
});
