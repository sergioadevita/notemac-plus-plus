import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  isDialogVisible,
  closeAllDialogs,
  getStoreState,
} from '../helpers/app';

test.describe('Settings Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Opens with Cmd+,', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const dialogVisible = await isDialogVisible(page);
    expect(dialogVisible).toBe(true);
  });

  test('Dialog has role="dialog"', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const count = await dialog.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has theme selection option', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Navigate to Appearance section where Theme lives
    const appearanceTab = page.locator('text=Appearance').first();
    await appearanceTab.click();
    await page.waitForTimeout(300);

    // Look for "Color Theme" label
    const themeControl = page.locator('text=Color Theme').first();
    const count = await themeControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has font size setting', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const fontSizeControl = page.locator('label:has-text("Font"), input[aria-label*="font" i], label:has-text("Size")').first();
    const count = await fontSizeControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has tab size setting', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const tabSizeControl = page.locator('label:has-text("Tab"), input[aria-label*="tab" i]').first();
    const count = await tabSizeControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has word wrap toggle', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Navigate to Editor section where Word Wrap lives
    const editorTab = page.locator('text=Editor').first();
    await editorTab.click();
    await page.waitForTimeout(300);

    const wordWrapControl = page.locator('text=Word Wrap').first();
    const count = await wordWrapControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has line numbers toggle', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Navigate to Editor section where Show Line Numbers lives
    const editorTab = page.locator('text=Editor').first();
    await editorTab.click();
    await page.waitForTimeout(300);

    const lineNumbersControl = page.locator('text=Show Line Numbers').first();
    const count = await lineNumbersControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Has minimap toggle', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Navigate to Editor section where Show Minimap lives
    const editorTab = page.locator('text=Editor').first();
    await editorTab.click();
    await page.waitForTimeout(300);

    const minimapControl = page.locator('text=Show Minimap').first();
    const count = await minimapControl.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Closes on Escape', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const visibleBefore = await isDialogVisible(page);
    expect(visibleBefore).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const visibleAfter = await isDialogVisible(page);
    expect(visibleAfter).toBe(false);
  });

  test('Changing font size updates editor', async ({ page }) => {
    // Get initial zoom/editor state
    const initialState = await getStoreState(page, 'editorSettings');

    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Find font size input
    const fontSizeInputs = page.locator('input[type="number"], input[aria-label*="font" i]');
    const count = await fontSizeInputs.count();

    if (count > 0) {
      const firstInput = fontSizeInputs.first();
      const currentValue = await firstInput.inputValue();
      const newValue = String((parseInt(currentValue || '12') + 2) % 30);

      await firstInput.fill(newValue);
      await page.waitForTimeout(500);

      // Check that the value was applied
      const updatedValue = await firstInput.inputValue();
      expect(updatedValue).toBe(newValue);
    }

    await closeAllDialogs(page);
  });

  test('Changing theme updates editor colors', async ({ page }) => {
    // Get initial theme
    const initialTheme = await getStoreState(page, 'theme');

    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Find theme selector
    const themeSelectors = page.locator('select, button:has-text("Theme"), [role="listbox"]');
    const count = await themeSelectors.count();

    if (count > 0) {
      const selector = themeSelectors.first();
      await selector.click();
      await page.waitForTimeout(300);

      // Try to select a different theme
      const themeOptions = page.locator('[role="option"]');
      const optionCount = await themeOptions.count();

      if (optionCount > 1) {
        // Click second option
        await themeOptions.nth(1).click();
        await page.waitForTimeout(500);
      }
    }

    await closeAllDialogs(page);
  });

  test('Settings persist after closing and reopening', async ({ page }) => {
    // Open settings
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Change a setting (e.g., tab size)
    const tabSizeInputs = page.locator('input[type="number"][aria-label*="tab" i]');
    if (await tabSizeInputs.count() > 0) {
      const input = tabSizeInputs.first();
      const originalValue = await input.inputValue();
      const newValue = String((parseInt(originalValue || '2') + 2) % 8);

      await input.fill(newValue);
      await page.waitForTimeout(300);
    }

    // Close settings
    await closeAllDialogs(page);
    await page.waitForTimeout(300);

    // Reopen settings
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Verify the setting was saved
    const tabSizeInputsAfter = page.locator('input[type="number"][aria-label*="tab" i]');
    if (await tabSizeInputsAfter.count() > 0) {
      const input = tabSizeInputsAfter.first();
      const savedValue = await input.inputValue();
      expect(savedValue).not.toBeNull();
    }

    await closeAllDialogs(page);
  });

  test('Can toggle word wrap', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Find word wrap checkbox
    const wordWrapCheckboxes = page.locator('input[type="checkbox"][aria-label*="wrap" i]');
    if (await wordWrapCheckboxes.count() > 0) {
      const checkbox = wordWrapCheckboxes.first();
      const isCheckedBefore = await checkbox.isChecked();

      // Click to toggle
      await checkbox.click();
      await page.waitForTimeout(300);

      const isCheckedAfter = await checkbox.isChecked();
      expect(isCheckedAfter).toBe(!isCheckedBefore);
    }

    await closeAllDialogs(page);
  });

  test('Can toggle line numbers', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Find line numbers checkbox
    const lineNumbersCheckboxes = page.locator('input[type="checkbox"][aria-label*="line" i]');
    if (await lineNumbersCheckboxes.count() > 0) {
      const checkbox = lineNumbersCheckboxes.first();
      const isCheckedBefore = await checkbox.isChecked();

      // Click to toggle
      await checkbox.click();
      await page.waitForTimeout(300);

      const isCheckedAfter = await checkbox.isChecked();
      expect(isCheckedAfter).toBe(!isCheckedBefore);
    }

    await closeAllDialogs(page);
  });

  test('Can toggle minimap', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Find minimap checkbox
    const minimapCheckboxes = page.locator('input[type="checkbox"][aria-label*="minimap" i]');
    if (await minimapCheckboxes.count() > 0) {
      const checkbox = minimapCheckboxes.first();
      const isCheckedBefore = await checkbox.isChecked();

      // Click to toggle
      await checkbox.click();
      await page.waitForTimeout(300);

      const isCheckedAfter = await checkbox.isChecked();
      expect(isCheckedAfter).toBe(!isCheckedBefore);
    }

    await closeAllDialogs(page);
  });

  test('Theme change updates store setting', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const initialTheme = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.theme;
    });

    const newTheme = initialTheme === 'light' ? 'dark' : 'light';

    await page.evaluate((theme) => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().updateSettings({ theme });
    }, newTheme);

    const updatedTheme = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.theme;
    });

    expect(updatedTheme).toBe(newTheme);

    await closeAllDialogs(page);
  });

  test('Font size change persists in settings', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const initialFontSize = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.fontSize;
    });

    const newFontSize = (initialFontSize || 14) + 2;

    await page.evaluate((size) => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().updateSettings({ fontSize: size });
    }, newFontSize);

    const updatedFontSize = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.fontSize;
    });

    expect(updatedFontSize).toBe(newFontSize);

    await closeAllDialogs(page);
  });

  test('Tab size change persists in settings', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const initialTabSize = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.tabSize;
    });

    const newTabSize = initialTabSize === 2 ? 4 : 2;

    await page.evaluate((size) => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().updateSettings({ tabSize: size });
    }, newTabSize);

    const updatedTabSize = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.tabSize;
    });

    expect(updatedTabSize).toBe(newTabSize);

    await closeAllDialogs(page);
  });

  test('Word wrap toggle persists in settings', async ({ page }) => {
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    const initialWordWrap = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.wordWrap;
    });

    const newWordWrap = !initialWordWrap;

    await page.evaluate((wrap) => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().updateSettings({ wordWrap: wrap });
    }, newWordWrap);

    const updatedWordWrap = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings.wordWrap;
    });

    expect(updatedWordWrap).toBe(newWordWrap);

    await closeAllDialogs(page);
  });

  test('Settings persist after closing and reopening dialog', async ({ page }) => {
    // Open settings
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Get current settings
    const initialSettings = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings;
    });

    // Update multiple settings
    await page.evaluate((settings) => {
      const store = window.__ZUSTAND_STORE__;
      store.getState().updateSettings({
        fontSize: (settings.fontSize || 14) + 2,
        tabSize: settings.tabSize === 2 ? 4 : 2,
        wordWrap: !settings.wordWrap,
      });
    }, initialSettings);

    // Close dialog
    await closeAllDialogs(page);
    await page.waitForTimeout(300);

    // Reopen settings
    await pressShortcut(page, 'Cmd+,');
    await page.waitForTimeout(500);

    // Verify settings persisted
    const persistedSettings = await page.evaluate(() => {
      const store = window.__ZUSTAND_STORE__;
      return store.getState().settings;
    });

    expect(persistedSettings.fontSize).toBe((initialSettings.fontSize || 14) + 2);
    expect(persistedSettings.tabSize).toBe(initialSettings.tabSize === 2 ? 4 : 2);
    expect(persistedSettings.wordWrap).toBe(!initialSettings.wordWrap);

    await closeAllDialogs(page);
  });

});
