import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction } from '../helpers/electron-app';

/**
 * Terminal panel tests for Electron.
 */

test.describe('Electron Terminal Panel', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('terminal panel is hidden by default', async () => {
    const state = await getStoreState(page);
    expect(state.showTerminalPanel).toBe(false);
  });

  test('toggle-terminal shows terminal panel', async () => {
    await triggerMenuAction(electronApp, 'toggle-terminal');
    const state = await getStoreState(page);
    expect(state.showTerminalPanel).toBe(true);
  });

  test('toggle-terminal hides terminal panel when visible', async () => {
    // Ensure shown
    let state = await getStoreState(page);
    if (!state.showTerminalPanel) {
      await triggerMenuAction(electronApp, 'toggle-terminal');
    }
    // Toggle off
    await triggerMenuAction(electronApp, 'toggle-terminal');
    state = await getStoreState(page);
    expect(state.showTerminalPanel).toBe(false);
  });

  test('terminal has default height', async () => {
    const state = await getStoreState(page);
    expect(typeof state.terminalHeight).toBe('number');
    expect(state.terminalHeight).toBeGreaterThan(0);
  });

  test('terminal height can be resized within bounds', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTerminalHeight(300);
    });
    let state = await getStoreState(page);
    expect(state.terminalHeight).toBe(300);

    // Test minimum clamping
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTerminalHeight(10);
    });
    state = await getStoreState(page);
    // Should be clamped to minimum
    expect(state.terminalHeight).toBeGreaterThanOrEqual(50);

    // Test maximum clamping
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setTerminalHeight(99999);
    });
    state = await getStoreState(page);
    expect(state.terminalHeight).toBeLessThanOrEqual(10000);
  });

  test('terminal panel renders when shown', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowTerminalPanel(true);
    });
    await page.waitForTimeout(500);
    const state = await getStoreState(page);
    expect(state.showTerminalPanel).toBe(true);

    // Clean up
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowTerminalPanel(false);
    });
  });
});
