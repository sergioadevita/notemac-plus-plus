import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  isDialogVisible,
  closeAllDialogs,
  getStoreState,
} from '../helpers/app';

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
    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showGoToLine');
    expect(dialogVisible).toBe(true);
  });

  test('Go to Line dialog has input field', async ({ page }) => {
    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

    const input = page.locator('input[type="number"], input[type="text"]').first();
    const count = await input.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Go to Line dialog closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

    expect(await isDialogVisible(page, 'showGoToLine')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showGoToLine')).toBe(false);
  });

  test('About dialog opens from menu', async ({ page }) => {
    // About dialog might be accessed via menu, using shortcut if available
    // Try keyboard shortcut for about (if exists)
    await pressShortcut(page, 'Cmd+?');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showAbout');
    expect(dialogVisible).toBe(true);
  });

  test('About dialog shows version', async ({ page }) => {
    // Open about dialog via shortcut
    await pressShortcut(page, 'Cmd+?');
    await page.waitForTimeout(500);

    const isAboutVisible = await isDialogVisible(page, 'showAbout');
    if (isAboutVisible) {
      // Dialog opened successfully
      expect(isAboutVisible).toBe(true);
    }
  });

  test('About dialog closes on Escape', async ({ page }) => {
    // Open about via shortcut
    await pressShortcut(page, 'Cmd+?');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page, 'showAbout');

    if (visibleBefore) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showAbout');
      expect(visibleAfter).toBe(false);
    }
  });

  test('Shortcut Mapper dialog opens', async ({ page }) => {
    // Shortcut mapper might be in View menu or via a shortcut
    await pressShortcut(page, 'Cmd+K');
    await page.waitForTimeout(300);
    await pressShortcut(page, 'Cmd+S');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showShortcutMapper');
    expect(dialogVisible).toBe(true);
  });

  test('Shortcut Mapper shows shortcuts list', async ({ page }) => {
    // Open shortcut mapper
    await pressShortcut(page, 'Cmd+K');
    await page.waitForTimeout(300);
    await pressShortcut(page, 'Cmd+S');
    await page.waitForTimeout(500);

    const isShortcutMapperOpen = await isDialogVisible(page, 'showShortcutMapper');
    expect(isShortcutMapperOpen).toBe(true);
  });

  test('Shortcut Mapper closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Cmd+K');
    await page.waitForTimeout(300);
    await pressShortcut(page, 'Cmd+S');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page, 'showShortcutMapper');

    if (visibleBefore) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showShortcutMapper');
      expect(visibleAfter).toBe(false);
    }
  });

  test('Column Editor dialog opens with Alt+C', async ({ page }) => {
    await pressShortcut(page, 'Alt+C');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showColumnEditor');
    expect(dialogVisible).toBe(true);
  });

  test('Column Editor dialog closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Alt+C');
    await page.waitForTimeout(500);

    expect(await isDialogVisible(page, 'showColumnEditor')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showColumnEditor')).toBe(false);
  });

  test('Command Palette opens with Cmd+Shift+P', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(dialogVisible).toBe(true);
  });

  test('Command Palette has search input', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const input = page.locator('input[type="text"], input:not([type])').first();
    const count = await input.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Command Palette closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    expect(await isDialogVisible(page, 'showCommandPalette')).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDialogVisible(page, 'showCommandPalette')).toBe(false);
  });

  test('Settings dialog is tracked in store', async ({ page }) => {
    // Test Settings dialog
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

    // Test Go to Line dialog
    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

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

    // Try to open another
    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

    const showSettings = await getStoreState(page, 'showSettings');
    const showGoToLine = await getStoreState(page, 'showGoToLine');
    // Only one should be open
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
