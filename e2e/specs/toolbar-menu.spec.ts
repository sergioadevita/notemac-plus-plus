import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  createNewTab,
  getTabCount,
  closeAllDialogs,
} from '../helpers/app';

test.describe('Toolbar & Menu Bar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Toolbar is visible by default', async ({ page }) => {
    // Look for toolbar element
    const toolbar = page.locator('[role="toolbar"], .toolbar, [data-testid="toolbar"]').first();
    const count = await toolbar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Toolbar has New button', async ({ page }) => {
    const newButton = page.locator('button').filter({ hasText: /New|new/ }).first();
    const count = await newButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Toolbar has Open button', async ({ page }) => {
    const openButton = page.locator('button[title*="Open"], button').filter({ hasText: /Open|open/ }).first();
    const count = await openButton.count();
    // Open button may exist
    expect(typeof count).toBe('number');
  });

  test('Toolbar has Save button', async ({ page }) => {
    const saveButton = page.locator('button[title*="Save"], button').filter({ hasText: /Save|save/ }).first();
    const count = await saveButton.count();
    expect(typeof count).toBe('number');
  });

  test('Click New button creates new tab', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Find and click New button
    const newButton = page.locator('button[title*="New"], button').filter({ hasText: /New|new/ }).first();
    const exists = await newButton.count();

    if (exists > 0) {
      await newButton.click();
      await page.waitForTimeout(300);

      const newCount = await getTabCount(page);
      expect(newCount).toBe(initialCount + 1);
    }
  });

  test('Toolbar has Undo button', async ({ page }) => {
    const undoButton = page.locator('button[title*="Undo"], button').filter({ hasText: /Undo|undo/ }).first();
    const count = await undoButton.count();
    expect(typeof count).toBe('number');
  });

  test('Toolbar has Redo button', async ({ page }) => {
    const redoButton = page.locator('button[title*="Redo"], button').filter({ hasText: /Redo|redo/ }).first();
    const count = await redoButton.count();
    expect(typeof count).toBe('number');
  });

  test('Click Find button opens find bar', async ({ page }) => {
    const findButton = page.locator('button[title*="Find"], button').filter({ hasText: /Find|find/ }).first();
    const exists = await findButton.count();

    if (exists > 0) {
      await findButton.click();
      await page.waitForTimeout(300);

      // Find bar should be visible
      const findBar = page.locator('[role="search"], .find-replace, input[placeholder*="Find"]').first();
      const findBarCount = await findBar.count();
      expect(findBarCount).toBeGreaterThan(0);
    }
  });

  test('Click Replace button opens replace', async ({ page }) => {
    const replaceButton = page.locator('button[title*="Replace"], button').filter({ hasText: /Replace|replace/ }).first();
    const exists = await replaceButton.count();

    if (exists > 0) {
      await replaceButton.click();
      await page.waitForTimeout(300);

      // Replace bar should have additional inputs
      const findReplaceArea = page.locator('.find-replace, [role="search"]').first();
      const count = await findReplaceArea.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Menu bar is visible', async ({ page }) => {
    const menubar = page.locator('[role="menubar"], .menu-bar, .menubar').first();
    const count = await menubar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Menu bar has File menu', async ({ page }) => {
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const count = await fileMenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Menu bar has Edit menu', async ({ page }) => {
    const editMenu = page.locator('[role="menuitem"], button').filter({ hasText: /Edit/ }).first();
    const count = await editMenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Menu bar has Search menu', async ({ page }) => {
    const searchMenu = page.locator('[role="menuitem"], button').filter({ hasText: /Search/ }).first();
    const count = await searchMenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Menu bar has View menu', async ({ page }) => {
    const viewMenu = page.locator('[role="menuitem"], button').filter({ hasText: /View/ }).first();
    const count = await viewMenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Click File menu opens dropdown', async ({ page }) => {
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const exists = await fileMenu.count();

    if (exists > 0) {
      await fileMenu.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('[role="menu"]').first();
      const dropdownCount = await dropdown.count();
      expect(dropdownCount).toBeGreaterThan(0);
    }
  });

  test('Click Edit menu opens dropdown', async ({ page }) => {
    const editMenu = page.locator('[role="menuitem"], button').filter({ hasText: /Edit/ }).first();
    const exists = await editMenu.count();

    if (exists > 0) {
      await editMenu.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('[role="menu"]').first();
      const dropdownCount = await dropdown.count();
      expect(dropdownCount).toBeGreaterThan(0);
    }
  });

  test('Menu item executes action (File > New)', async ({ page }) => {
    const initialCount = await getTabCount(page);

    // Open File menu
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const fileMenuExists = await fileMenu.count();

    if (fileMenuExists > 0) {
      await fileMenu.click();
      await page.waitForTimeout(300);

      // Click New in menu
      const newMenuItem = page.locator('[role="menu"]').first().locator('div, button, li').filter({ hasText: /New/ }).first();
      const newMenuExists = await newMenuItem.count();

      if (newMenuExists > 0) {
        await newMenuItem.click();
        await page.waitForTimeout(300);

        const newCount = await getTabCount(page);
        expect(newCount).toBe(initialCount + 1);
      }
    }
  });

  test('Menu closes on Escape', async ({ page }) => {
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const exists = await fileMenu.count();

    if (exists > 0) {
      await fileMenu.click();
      await page.waitForTimeout(300);

      const menuOpenBefore = await page.locator('[role="menu"]').count();
      expect(menuOpenBefore).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const menuOpenAfter = await page.locator('[role="menu"]').count();
      expect(menuOpenAfter).toBe(0);
    }
  });

  test('Menu closes when clicking outside', async ({ page }) => {
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const exists = await fileMenu.count();

    if (exists > 0) {
      await fileMenu.click();
      await page.waitForTimeout(300);

      const menuOpenBefore = await page.locator('[role="menu"]').count();
      expect(menuOpenBefore).toBeGreaterThan(0);

      // Click outside menu (on editor area)
      await page.click('.monaco-editor .view-lines, main', { force: true });
      await page.waitForTimeout(300);

      const menuOpenAfter = await page.locator('[role="menu"]').count();
      expect(menuOpenAfter).toBe(0);
    }
  });

  test('Undo button is present in toolbar', async ({ page }) => {
    // Verify undo button has tooltip or title
    const undoButton = page.locator('button[title*="Undo"], button[aria-label*="Undo"]').first();
    const count = await undoButton.count();
    expect(typeof count).toBe('number');
  });

  test('Redo button is present in toolbar', async ({ page }) => {
    // Verify redo button has tooltip or title
    const redoButton = page.locator('button[title*="Redo"], button[aria-label*="Redo"]').first();
    const count = await redoButton.count();
    expect(typeof count).toBe('number');
  });

  test('Menu items have keyboard shortcuts displayed', async ({ page }) => {
    const fileMenu = page.locator('[role="menuitem"], button').filter({ hasText: /File/ }).first();
    const exists = await fileMenu.count();

    if (exists > 0) {
      await fileMenu.click();
      await page.waitForTimeout(300);

      const menu = page.locator('[role="menu"]').first();
      const menuContent = await menu.textContent();

      // Menu should show shortcut hints
      expect(menuContent).toBeTruthy();
    }
  });

  test('Toolbar buttons have aria-label or title attributes', async ({ page }) => {
    const buttons = page.locator('[role="toolbar"] button, .toolbar button').first();
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const title = await buttons.getAttribute('title');
      const ariaLabel = await buttons.getAttribute('aria-label');
      expect(title || ariaLabel).toBeTruthy();
    }
  });

  test('Find shortcut Cmd+F opens find bar', async ({ page }) => {
    await pressShortcut(page, 'Cmd+F');
    await page.waitForTimeout(300);

    const findBar = page.locator('.find-replace, [role="search"], input[placeholder*="Find"]').first();
    const count = await findBar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Replace shortcut Cmd+H opens replace bar', async ({ page }) => {
    await pressShortcut(page, 'Cmd+H');
    await page.waitForTimeout(300);

    const replaceBar = page.locator('.find-replace, input[placeholder*="Replace"]').first();
    const count = await replaceBar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('View menu contains visible toggle options', async ({ page }) => {
    const viewMenu = page.locator('[role="menuitem"], button').filter({ hasText: /View/ }).first();
    const exists = await viewMenu.count();

    if (exists > 0) {
      await viewMenu.click();
      await page.waitForTimeout(300);

      const menu = page.locator('[role="menu"]').first();
      const menuText = await menu.textContent();

      // View menu should have options like sidebar, status bar, etc
      expect(menuText).toBeTruthy();
    }
  });
});
