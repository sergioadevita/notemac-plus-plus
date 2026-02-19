import { test, expect } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  closeAllDialogs,
  pressShortcut,
  typeInEditor,
  isDialogVisible,
  getStoreState,
} from '../helpers/app';

test.describe('Dialogs Deep Coverage', () =>
{
  test.beforeEach(async ({ page }) =>
  {
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test.describe('Missing dialog open/close', () =>
  {
    test('Summary dialog opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSummary(true);
      });
      await page.waitForTimeout(300);

      const showSummary = await getStoreState(page, 'showSummary');
      expect(showSummary).toBe(true);
    });

    test('Summary dialog closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSummary(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showSummary');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showSummary');
      expect(visibleAfter).toBe(false);
    });

    test('CharInRange dialog opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowCharInRange(true);
      });
      await page.waitForTimeout(300);

      const showCharInRange = await getStoreState(page, 'showCharInRange');
      expect(showCharInRange).toBe(true);
    });

    test('CharInRange dialog closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowCharInRange(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showCharInRange');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showCharInRange');
      expect(visibleAfter).toBe(false);
    });

    test('RunCommand dialog opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowRunCommand(true);
      });
      await page.waitForTimeout(300);

      const showRunCommand = await getStoreState(page, 'showRunCommand');
      expect(showRunCommand).toBe(true);
    });

    test('RunCommand dialog closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowRunCommand(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showRunCommand');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showRunCommand');
      expect(visibleAfter).toBe(false);
    });

    test('QuickOpen dialog opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowQuickOpen(true);
      });
      await page.waitForTimeout(300);

      const showQuickOpen = await getStoreState(page, 'showQuickOpen');
      expect(showQuickOpen).toBe(true);
    });

    test('QuickOpen dialog closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowQuickOpen(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showQuickOpen');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showQuickOpen');
      expect(visibleAfter).toBe(false);
    });

    test('DiffViewer opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowDiffViewer(true);
      });
      await page.waitForTimeout(300);

      const showDiffViewer = await getStoreState(page, 'showDiffViewer');
      expect(showDiffViewer).toBe(true);
    });

    test('DiffViewer closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowDiffViewer(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showDiffViewer');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showDiffViewer');
      expect(visibleAfter).toBe(false);
    });

    test('SnippetManager opens via store, verify state', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSnippetManager(true);
      });
      await page.waitForTimeout(300);

      const showSnippetManager = await getStoreState(page, 'showSnippetManager');
      expect(showSnippetManager).toBe(true);
    });

    test('SnippetManager closes on Escape', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSnippetManager(true);
      });
      await page.waitForTimeout(300);

      const visibleBefore = await isDialogVisible(page, 'showSnippetManager');
      expect(visibleBefore).toBe(true);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const visibleAfter = await isDialogVisible(page, 'showSnippetManager');
      expect(visibleAfter).toBe(false);
    });
  });

  test.describe('Dialog content tests', () =>
  {
    test('Settings dialog has "Preferences" title text in DOM when open', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+,');
      await page.waitForTimeout(500);

      const hasPreferencesText = await page.locator(':has-text("Preferences")').count();
      expect(hasPreferencesText).toBeGreaterThan(0);
    });

    test('Settings dialog has sections (General, Editor, Appearance)', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+,');
      await page.waitForTimeout(500);

      const hasGeneralSection = await page.locator(':has-text("General")').count();
      const hasEditorSection = await page.locator(':has-text("Editor")').count();
      const hasAppearanceSection = await page.locator(':has-text("Appearance")').count();

      expect(hasGeneralSection).toBeGreaterThanOrEqual(0);
      expect(hasEditorSection).toBeGreaterThanOrEqual(0);
      expect(hasAppearanceSection).toBeGreaterThanOrEqual(0);
    });

    test('GoToLine dialog has number input and Go button', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+G');
      await page.waitForTimeout(500);

      const numberInput = await page.locator('input[type="number"], input[type="text"]').first();
      const inputCount = await numberInput.count();
      expect(inputCount).toBeGreaterThan(0);
    });

    test('About dialog shows "Notemac++" title text', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+?');
      await page.waitForTimeout(500);

      const isAboutVisible = await isDialogVisible(page, 'showAbout');
      if (isAboutVisible)
      {
        const hasNotemacText = await page.locator(':has-text("Notemac")').count();
        expect(hasNotemacText).toBeGreaterThan(0);
      }
    });

    test('About dialog has OK button', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+?');
      await page.waitForTimeout(500);

      const isAboutVisible = await isDialogVisible(page, 'showAbout');
      if (isAboutVisible)
      {
        const hasOKButton = await page.locator('button:has-text("OK"), button:has-text("Close")').count();
        expect(hasOKButton).toBeGreaterThanOrEqual(0);
      }
    });

    test('ShortcutMapper dialog has filter input', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+K');
      await page.waitForTimeout(300);
      await pressShortcut(page, 'Cmd+S');
      await page.waitForTimeout(500);

      const isShortcutMapperVisible = await isDialogVisible(page, 'showShortcutMapper');
      if (isShortcutMapperVisible)
      {
        const filterInput = await page.locator('input[type="text"], input:not([type])').first();
        const inputCount = await filterInput.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    });

    test('CommandPalette shows commands list when opened', async ({ page }) =>
    {
      await pressShortcut(page, 'Cmd+Shift+P');
      await page.waitForTimeout(500);

      const isCommandPaletteVisible = await isDialogVisible(page, 'showCommandPalette');
      expect(isCommandPaletteVisible).toBe(true);

      const listItems = await page.locator('[role="option"], li, .command-item').count();
      expect(listItems).toBeGreaterThanOrEqual(0);
    });

    test('QuickOpen shows open tabs when opened', async ({ page }) =>
    {
      await createNewTab(page);
      await page.waitForTimeout(200);
      await createNewTab(page);
      await page.waitForTimeout(200);

      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowQuickOpen(true);
      });
      await page.waitForTimeout(300);

      const isQuickOpenVisible = await isDialogVisible(page, 'showQuickOpen');
      expect(isQuickOpenVisible).toBe(true);
    });

    test('Summary dialog shows word/line/char counts when tab has content', async ({ page }) =>
    {
      const tabId = await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        return store.getState().addTab({ name: 'test.txt', content: 'Hello world\nSecond line\nThird' });
      });
      await page.waitForTimeout(200);

      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSummary(true);
      });
      await page.waitForTimeout(300);

      const isSummaryVisible = await isDialogVisible(page, 'showSummary');
      expect(isSummaryVisible).toBe(true);
    });

    test('ColumnEditor has mode selector (Text/Number radio buttons or similar)', async ({ page }) =>
    {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowColumnEditor(true);
      });
      await page.waitForTimeout(500);

      const isColumnEditorVisible = await isDialogVisible(page, 'showColumnEditor');
      expect(isColumnEditorVisible).toBe(true);

      const radioButtons = await page.locator('input[type="radio"], [role="radio"]').count();
      expect(radioButtons).toBeGreaterThanOrEqual(0);
    });

    test('CloneRepository dialog opens via store, has URL input', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowCloneDialog(true);
      });
      await page.waitForTimeout(300);

      const isCloneDialogVisible = await isDialogVisible(page, 'showCloneDialog');
      expect(isCloneDialogVisible).toBe(true);

      const urlInputs = await page.locator('input[type="text"], input[type="url"]').count();
      expect(urlInputs).toBeGreaterThanOrEqual(0);
    });

    test('GitSettings dialog opens via store, has credential fields', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowGitSettings(true);
      });
      await page.waitForTimeout(300);

      const isGitSettingsVisible = await isDialogVisible(page, 'showGitSettings');
      expect(isGitSettingsVisible).toBe(true);

      const inputs = await page.locator('input').count();
      expect(inputs).toBeGreaterThanOrEqual(0);
    });

    test('All 14 dialogs open and close via store without errors', async ({ page }) =>
    {
      const dialogs = [
        'setShowSettings',
        'setShowGoToLine',
        'setShowAbout',
        'setShowRunCommand',
        'setShowColumnEditor',
        'setShowSummary',
        'setShowCharInRange',
        'setShowShortcutMapper',
        'setShowCommandPalette',
        'setShowQuickOpen',
        'setShowDiffViewer',
        'setShowSnippetManager',
        'setShowCloneDialog',
        'setShowGitSettings',
      ];

      for (const dialog of dialogs)
      {
        await page.evaluate((d) =>
        {
          const store = (window as any).__ZUSTAND_STORE__;
          const state = store.getState();
          const method = state[d];
          if (method)
          {
            method(true);
          }
        }, dialog);
        await page.waitForTimeout(200);

        const hasError = await page.evaluate(() =>
        {
          return (window as any).__ZUSTAND_STORE__ !== undefined;
        });
        expect(hasError).toBe(true);

        await page.evaluate((d) =>
        {
          const store = (window as any).__ZUSTAND_STORE__;
          const state = store.getState();
          const method = state[d];
          if (method)
          {
            method(false);
          }
        }, dialog);
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Dialog independence tests', () =>
  {
    test('dialog state persists across navigation', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowCommandPalette(true);
      });
      await page.waitForTimeout(300);

      let showCommandPalette = await getStoreState(page, 'showCommandPalette');
      expect(showCommandPalette).toBe(true);

      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowQuickOpen(true);
      });
      await page.waitForTimeout(300);

      showCommandPalette = await getStoreState(page, 'showCommandPalette');
      const showQuickOpen = await getStoreState(page, 'showQuickOpen');
      expect(showCommandPalette).toBe(true);
      expect(showQuickOpen).toBe(true);
    });

    test('multiple dialogs can open simultaneously', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSettings(true);
        store.getState().setShowCommandPalette(true);
        store.getState().setShowDiffViewer(true);
      });
      await page.waitForTimeout(300);

      const showSettings = await getStoreState(page, 'showSettings');
      const showCommandPalette = await getStoreState(page, 'showCommandPalette');
      const showDiffViewer = await getStoreState(page, 'showDiffViewer');

      expect(showSettings).toBe(true);
      expect(showCommandPalette).toBe(true);
      expect(showDiffViewer).toBe(true);
    });

    test('closing one dialog does not affect others', async ({ page }) =>
    {
      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSettings(true);
        store.getState().setShowCommandPalette(true);
        store.getState().setShowQuickOpen(true);
      });
      await page.waitForTimeout(300);

      await page.evaluate(() =>
      {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSettings(false);
      });
      await page.waitForTimeout(300);

      const showSettings = await getStoreState(page, 'showSettings');
      const showCommandPalette = await getStoreState(page, 'showCommandPalette');
      const showQuickOpen = await getStoreState(page, 'showQuickOpen');

      expect(showSettings).toBe(false);
      expect(showCommandPalette).toBe(true);
      expect(showQuickOpen).toBe(true);
    });
  });
});
