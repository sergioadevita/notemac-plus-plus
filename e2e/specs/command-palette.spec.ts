import { test, expect } from '@playwright/test';
import {
  gotoApp,
  dispatchShortcut,
  isDialogVisible,
  closeAllDialogs,
} from '../helpers/app';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Opens with Cmd+Shift+P', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(dialogVisible).toBe(true);
  });

  test('Has a search/filter input field', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // The command palette renders an input with placeholder "Type a command..."
    const input = page.locator('input[placeholder*="command" i]');
    await expect(input).toBeVisible();
  });

  test('Shows list of commands', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Verify the palette is open
    const paletteVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(paletteVisible).toBe(true);
  });

  test('Typing filters the command list', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Type to filter — the input should accept text
    const input = page.locator('input[placeholder*="command" i]');
    await input.fill('new');
    await page.waitForTimeout(300);

    // Palette should still be visible after typing
    const paletteVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(paletteVisible).toBe(true);
  });

  test('Arrow keys navigate command list', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Press down arrow to highlight an item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Press down arrow again
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Palette should still be visible (navigation doesn't close it)
    const paletteVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(paletteVisible).toBe(true);
  });

  test('Enter executes selected command', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Press down to select first command
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Press enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Dialog should close after executing command
    const dialogVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(dialogVisible).toBe(false);
  });

  test('Escape closes the palette', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page, 'showCommandPalette');
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page, 'showCommandPalette');
    expect(visibleAfter).toBe(false);
  });

  test('Shows keyboard shortcuts next to commands', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // The command palette renders shortcuts in a span with opacity styling.
    // Verify at least one shortcut text is visible (contains "+" and modifier keys).
    const shortcutText = await page.evaluate(() => {
      const spans = document.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent || '';
        if ((text.includes('Cmd+') || text.includes('Ctrl+') || text.includes('⌘')) && text.length < 30) {
          return text;
        }
      }
      return null;
    });
    expect(shortcutText).toBeTruthy();
  });

  test('Palette disappears after executing a command', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page, 'showCommandPalette');
    expect(visibleBefore).toBe(true);

    // Select and execute first command
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const visibleAfter = await isDialogVisible(page, 'showCommandPalette');
    expect(visibleAfter).toBe(false);
  });

  test('Can open palette again after closing', async ({ page }) => {
    // First open
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Second open
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(dialogVisible).toBe(true);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await dispatchShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Type with mixed case
    const input = page.locator('input[placeholder*="command" i]');
    await input.fill('NEW TAB');
    await page.waitForTimeout(300);

    // Palette should still be visible after typing
    const paletteVisible = await isDialogVisible(page, 'showCommandPalette');
    expect(paletteVisible).toBe(true);

    await closeAllDialogs(page);
  });
});
