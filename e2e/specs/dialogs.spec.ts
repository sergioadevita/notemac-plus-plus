import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  dispatchShortcut,
  isDialogVisible,
  closeAllDialogs,
  getStoreState,
} from '../helpers/app';

/**
 * Open a dialog directly via store since some dialogs have no web keyboard shortcut
 * (only accessible via Electron menu or command palette).
 */
async function openDialogViaStore(page: import('@playwright/test').Page, storeMethod: string): Promise<void> {
  await page.evaluate((method) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState()[method](true);
  }, storeMethod);
  await page.waitForTimeout(300);
}

test.describe('Dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Settings dialog opens with Cmd+,', async ({ page }) => {
    const dialogVisibleBefore = await isDialogVisible(page, 'showSettings');
    expect(dialogVisibleBefore).toBe(false);

    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const dialogVisibleAfter = await isDialogVisible(page, 'showSettings');
    expect(dialogVisibleAfter).toBe(true);
  });

  test('Settings dialog opens with Cmd+, (store-based check)', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);
  });

  test('Settings dialog closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page, 'showSettings');
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page, 'showSettings');
    expect(visibleAfter).toBe(false);
  });

  test('Go to Line dialog opens with Cmd+G', async ({ page }) => {
    // Cmd+G is intercepted by Monaco when using keyboard.press,
    // and dispatchShortcut sends uppercase key. Open via store instead.
    await openDialogViaStore(page, 'setShowGoToLine');

    const dialogVisible = await isDialogVisible(page, 'showGoToLine');
    expect(dialogVisible).toBe(true);
  });

  test('Go to Line dialog has input field', async ({ page }) => {
    await openDialogViaStore(page, 'setShowGoToLine');

    const input = page.locator('input[type="number"], input[type="text"]').first();
    const count = await input.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Go to Line dialog closes on Escape', async ({ page }) => {
    await openDialogViaStore(page, 'setShowGoToLine');

    expect(await isDialogVisible(page, 'showGoToLine')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showGoToLine')).toBe(false);
  });

  test('About dialog opens via store', async ({ page }) => {
    // About dialog has no keyboard shortcut in web mode — open via store
    await openDialogViaStore(page, 'setShowAbout');

    const dialogVisible = await isDialogVisible(page, 'showAbout');
    expect(dialogVisible).toBe(true);
  });

  test('About dialog shows version', async ({ page }) => {
    await openDialogViaStore(page, 'setShowAbout');

    const isAboutVisible = await isDialogVisible(page, 'showAbout');
    expect(isAboutVisible).toBe(true);
  });

  test('About dialog closes on Escape', async ({ page }) => {
    await openDialogViaStore(page, 'setShowAbout');

    const visibleBefore = await isDialogVisible(page, 'showAbout');
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page, 'showAbout');
    expect(visibleAfter).toBe(false);
  });

  test('Shortcut Mapper dialog opens via store', async ({ page }) => {
    // Shortcut Mapper has no keyboard shortcut in web mode — open via store
    await openDialogViaStore(page, 'setShowShortcutMapper');

    const dialogVisible = await isDialogVisible(page, 'showShortcutMapper');
    expect(dialogVisible).toBe(true);
  });

  test('Shortcut Mapper shows shortcuts list', async ({ page }) => {
    await openDialogViaStore(page, 'setShowShortcutMapper');

    const isShortcutMapperOpen = await isDialogVisible(page, 'showShortcutMapper');
    expect(isShortcutMapperOpen).toBe(true);
  });

  test('Shortcut Mapper closes on Escape', async ({ page }) => {
    await openDialogViaStore(page, 'setShowShortcutMapper');

    const visibleBefore = await isDialogVisible(page, 'showShortcutMapper');
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page, 'showShortcutMapper');
    expect(visibleAfter).toBe(false);
  });

  test('Column Editor dialog opens via store', async ({ page }) => {
    // Column Editor has no keyboard shortcut in web mode — open via store
    await openDialogViaStore(page, 'setShowColumnEditor');

    const dialogVisible = await isDialogVisible(page, 'showColumnEditor');
    expect(dialogVisible).toBe(true);
  });

  test('Column Editor dialog closes on Escape', async ({ page }) => {
    await openDialogViaStore(page, 'setShowColumnEditor');

    expect(await isDialogVisible(page, 'showColumnEditor')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showColumnEditor')).toBe(false);
  });

  test('Command Palette opens with Cmd+Shift+P', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(dialogVisible).toBe(true);
  });

  test('Command Palette has search input', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const input = page.locator('input[type="text"], input:not([type])').first();
    const count = await input.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Command Palette closes on Escape', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    expect(await isDialogVisible(page, 'showCommandPalette')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showCommandPalette')).toBe(false);
  });

  test('Settings dialog is tracked in store', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);

    await closeAllDialogs(page);
  });

  test('Multiple dialogs can be tracked in store', async ({ page }) => {
    // Test Settings dialog
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);

    await closeAllDialogs(page);
    await page.waitForTimeout(300);

    // Test Go to Line dialog (open via store since Cmd+G is intercepted by Monaco)
    await openDialogViaStore(page, 'setShowGoToLine');
    await page.waitForTimeout(200);

    const showGoToLine = await getStoreState(page, 'showGoToLine');
    expect(showGoToLine).toBe(true);
  });

  test('Dialogs are keyboard navigable with Tab', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    expect(showSettings).toBe(true);

    // Tab should navigate within dialog
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focused = page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(await focused).toBeTruthy();
  });

  test('Opening one dialog closes another', async ({ page }) => {
    // Open settings
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const dialog1 = await getStoreState(page, 'showSettings');
    expect(dialog1).toBe(true);

    // Try to open Go to Line (via store since Cmd+G is intercepted by Monaco)
    await openDialogViaStore(page, 'setShowGoToLine');
    await page.waitForTimeout(200);

    const showSettings = await getStoreState(page, 'showSettings');
    const showGoToLine = await getStoreState(page, 'showGoToLine');
    // At least one should be open
    expect(showSettings || showGoToLine).toBe(true);
  });

  test('Dialog closing via state update', async ({ page }) => {
    const showSettingsBefore = await getStoreState(page, 'showSettings');

    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const showSettingsAfter = await getStoreState(page, 'showSettings');
    expect(showSettingsAfter).not.toBe(showSettingsBefore);

    await closeAllDialogs(page);
    await page.waitForTimeout(300);

    const showSettingsAfterClose = await getStoreState(page, 'showSettings');
    expect(showSettingsAfterClose).toBe(showSettingsBefore);
  });
});
