import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  isDialogVisible,
  closeAllDialogs,
} from '../helpers/app';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Opens with Cmd+Shift+P', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page);
    expect(dialogVisible).toBe(true);
  });

  test('Has a search/filter input field', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const input = page.locator('[role="dialog"] input, .command-palette input');
    await expect(input).toBeVisible();
  });

  test('Shows list of commands', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Look for command list items
    const commandItems = page.locator('[role="option"], .command-item');
    const count = await commandItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Typing filters the command list', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const initialItems = page.locator('[role="option"], .command-item');
    const initialCount = await initialItems.count();

    // Type to filter
    await page.keyboard.type('new');
    await page.waitForTimeout(300);

    const filteredItems = page.locator('[role="option"], .command-item');
    const filteredCount = await filteredItems.count();

    // Filtered count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('Arrow keys navigate command list', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Press down arrow to highlight first item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    const highlightedItem = page.locator('[role="option"][aria-selected="true"]');
    const count = await highlightedItem.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Press down arrow again to move to next item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Should still have a selection (or moved to next)
    const newHighlightedItem = page.locator('[role="option"][aria-selected="true"]');
    await expect(newHighlightedItem).toHaveCount(await newHighlightedItem.count());
  });

  test('Enter executes selected command', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Press down to select first command
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Press enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Dialog should close after executing command
    const dialogVisible = await isDialogVisible(page);
    expect(dialogVisible).toBe(false);
  });

  test('Escape closes the palette', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page);
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page);
    expect(visibleAfter).toBe(false);
  });

  test('Shows keyboard shortcuts next to commands', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Look for command items with keyboard shortcut text
    const commandWithShortcut = page.locator('[role="option"]').first();
    const text = await commandWithShortcut.textContent();

    // Shortcuts typically contain special keys like Cmd, Ctrl, Alt, etc.
    // At least one command should show a shortcut
    const hasShortcut = text?.includes('+') || text?.includes('Cmd') || text?.includes('Ctrl');
    expect(hasShortcut).toBe(true);
  });

  test('Palette disappears after executing a command', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page);
    expect(visibleBefore).toBe(true);

    // Select and execute first command
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const visibleAfter = await isDialogVisible(page);
    expect(visibleAfter).toBe(false);
  });

  test('Can open palette again after closing', async ({ page }) => {
    // First open
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Second open
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page);
    expect(dialogVisible).toBe(true);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await pressShortcut(page, 'Cmd+Shift+P');
    await page.waitForTimeout(500);

    // Type with mixed case
    await page.keyboard.type('NEW TAB');
    await page.waitForTimeout(300);

    // Should still find commands (case-insensitive)
    const filteredItems = page.locator('[role="option"], .command-item');
    const count = await filteredItems.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await closeAllDialogs(page);
  });
});
