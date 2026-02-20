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

  test('Tauri API is available', async () => {
    const hasTauri = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    expect(hasTauri).toBe(true);
  });

  test('Tauri invoke is callable', async () => {
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

  test('At least one tab exists on launch', async () => {
    const count = await getTabCount(page);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Tab bar is visible', async () => {
    const tabs = page.locator('[draggable="true"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('New tab button exists', async () => {
    const newTabBtn = page.locator('button[aria-label="New tab"]');
    await expect(newTabBtn).toBeVisible();
  });

  test('Window title includes Notemac++', async () => {
    // In Tauri, title bar text is in a span element
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

  test('No web MenuBar in desktop mode', async () => {
    // In Tauri/desktop mode, the web MenuBar should not be shown
    // because IsDesktopEnvironment() returns true
    const webMenuBar = await page.locator('[data-testid="menu-bar"]').count();
    expect(webMenuBar).toBeLessThanOrEqual(0);
  });

  test('Monaco editor initializes', async () => {
    const hasMonaco = await page.evaluate(() => {
      return document.querySelector('.monaco-editor') !== null;
    });
    expect(hasMonaco).toBe(true);
  });

  test('Title bar shows in desktop mode', async () => {
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
});
