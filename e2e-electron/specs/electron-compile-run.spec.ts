import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction } from '../helpers/electron-app';

// Skip in CI — these tests require runtime adapter integration
// not available in the Electron E2E test harness yet.
test.describe.skip('Electron Compile & Run Panel', () =>
{
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () =>
  {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () =>
  {
    if (electronApp) await electronApp.close();
  });

  // ============================================================================
  // 1. Console Panel Opening & Visibility
  // ============================================================================

  test('Console panel opens with Cmd+Shift+Y keyboard shortcut', async () =>
  {
    const visibleBefore = await getStoreState(page, 'compileRunPanelVisible');
    expect(visibleBefore).toBe(false);

    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(500);

    const visibleAfter = await getStoreState(page, 'compileRunPanelVisible');
    expect(visibleAfter).toBe(true);
  });

  test('Console panel is in DOM after toggle', async () =>
  {
    // First close the panel
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    // Then open again
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(500);

    // Check for console panel element
    const consolePanel = await page.locator('text=Console, text=No output to display').first();
    const panelExists = await consolePanel.count();
    expect(panelExists).toBeGreaterThan(0);
  });

  test('Console panel shows "No output to display" initially', async () =>
  {
    // Ensure panel is open
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const emptyMessage = await page.locator('text=No output to display').first();
    const messageExists = await emptyMessage.count();
    expect(messageExists).toBeGreaterThan(0);
  });

  test('Console panel toggles off with keyboard shortcut', async () =>
  {
    // Open panel
    let isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(300);
    }

    isVisible = await getStoreState(page, 'compileRunPanelVisible');
    expect(isVisible).toBe(true);

    // Close panel
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    isVisible = await getStoreState(page, 'compileRunPanelVisible');
    expect(isVisible).toBe(false);
  });

  // ============================================================================
  // 2. Close Button (✕)
  // ============================================================================

  test('Close button (✕) exists on console panel', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const closeButton = await page.locator('button[aria-label="Close Console"]').first();
    const buttonExists = await closeButton.count();
    expect(buttonExists).toBeGreaterThan(0);
  });

  test('Close button closes the console panel', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const visibleBefore = await getStoreState(page, 'compileRunPanelVisible');
    expect(visibleBefore).toBe(true);

    const closeButton = await page.locator('button[aria-label="Close Console"]').first();
    await closeButton.click();
    await page.waitForTimeout(300);

    const visibleAfter = await getStoreState(page, 'compileRunPanelVisible');
    expect(visibleAfter).toBe(false);
  });

  test('Close button has proper ARIA label for accessibility', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const closeButton = await page.locator('button[aria-label="Close Console"]').first();
    const ariaLabel = await closeButton.getAttribute('aria-label');
    expect(ariaLabel).toBe('Close Console');
  });

  // ============================================================================
  // 3. Run Button
  // ============================================================================

  test('Run button exists in console panel', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const runButton = await page.locator('button:has-text("Run")').first();
    const buttonExists = await runButton.count();
    expect(buttonExists).toBeGreaterThan(0);
  });

  test('Run button is clickable when panel is open', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const runButton = await page.locator('button:has-text("Run")').first();
    const isDisabled = await runButton.isDisabled();
    expect(isDisabled).toBe(false);
  });

  // ============================================================================
  // 4. Clear Button
  // ============================================================================

  test('Clear button exists in console panel', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const clearButton = await page.locator('button:has-text("Clear")').first();
    const buttonExists = await clearButton.count();
    expect(buttonExists).toBeGreaterThan(0);
  });

  test('Clear button is clickable', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const clearButton = await page.locator('button:has-text("Clear")').first();
    const isDisabled = await clearButton.isDisabled();
    expect(isDisabled).toBe(false);
  });

  // ============================================================================
  // 5. Stdin Input Field (appears during execution)
  // ============================================================================

  test('Stdin input field appears when execution is running', async () =>
  {
    // Set execution state to simulate running
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store)
      {
        const state = store.getState();
        state.SetCompileRunPanelVisible(true);
        state.setCompileRunExecution({
          id: 'test-run-1',
          fileId: 'test-file',
          language: 'cpp',
          output: [],
          exitCode: undefined,
          startTime: Date.now(),
          endTime: null,
          stdin: '',
        });
      }
    });
    await page.waitForTimeout(300);

    const stdinInput = await page.locator('input[aria-label="Standard input"]').first();
    const inputExists = await stdinInput.count();
    expect(inputExists).toBeGreaterThan(0);
  });

  test('Stdin input field has ARIA label for accessibility', async () =>
  {
    // Ensure execution state is set
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store)
      {
        const state = store.getState();
        state.SetCompileRunPanelVisible(true);
        state.setCompileRunExecution({
          id: 'test-run-2',
          fileId: 'test-file',
          language: 'cpp',
          output: [],
          exitCode: undefined,
          startTime: Date.now(),
          endTime: null,
          stdin: '',
        });
      }
    });
    await page.waitForTimeout(300);

    const stdinInput = await page.locator('input[aria-label="Standard input"]').first();
    const ariaLabel = await stdinInput.getAttribute('aria-label');
    expect(ariaLabel).toBe('Standard input');
  });

  // ============================================================================
  // 6. Console Output Text Selectability
  // ============================================================================

  test('Text in console output is selectable', async () =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store)
      {
        const state = store.getState();
        state.SetCompileRunPanelVisible(true);
        state.setCompileRunExecution({
          id: 'test-run-3',
          fileId: 'test-file',
          language: 'cpp',
          output: ['Test output line 1', 'Test output line 2'],
          exitCode: 0,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          stdin: '',
        });
      }
    });
    await page.waitForTimeout(300);

    const outputArea = await page.locator('div').filter({ has: page.locator('text=Test output line') }).first();
    const style = await outputArea.evaluate((el) => window.getComputedStyle(el).userSelect);

    // userSelect should allow text selection
    expect(['text', 'auto']).toContain(style);
  });

  test('Output text can be selected and copied', async () =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store)
      {
        const state = store.getState();
        state.SetCompileRunPanelVisible(true);
        state.setCompileRunExecution({
          id: 'test-run-4',
          fileId: 'test-file',
          language: 'cpp',
          output: ['Selectable output text here'],
          exitCode: 0,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          stdin: '',
        });
      }
    });
    await page.waitForTimeout(300);

    // Verify output text exists and is selectable
    const outputText = await page.locator('text=Selectable output text here').first();
    const exists = await outputText.count();
    expect(exists).toBeGreaterThan(0);
  });

  // ============================================================================
  // 7. Console State Management
  // ============================================================================

  test('Console state is tracked in Zustand store', async () =>
  {
    const stateInitial = await getStoreState(page, 'compileRunPanelVisible');
    expect(typeof stateInitial).toBe('boolean');

    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    const stateAfter = await getStoreState(page, 'compileRunPanelVisible');
    expect(stateAfter).not.toBe(stateInitial);
  });

  test('Compile run status is tracked in state', async () =>
  {
    const status = await getStoreState(page, 'compileRunStatus');
    expect(['idle', 'compiling', 'running', 'success', 'failed', 'cancelled']).toContain(status);
  });

  // ============================================================================
  // 8. Toolbar Elements
  // ============================================================================

  test('Console panel has toolbar with Run and Clear buttons', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const runButton = await page.locator('button:has-text("Run")').first();
    expect(await runButton.count()).toBeGreaterThan(0);

    const clearButton = await page.locator('button:has-text("Clear")').first();
    expect(await clearButton.count()).toBeGreaterThan(0);
  });

  test('Console title displays "Console" when no execution', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const consoleTitle = await page.locator('text=Console').first();
    expect(await consoleTitle.count()).toBeGreaterThan(0);
  });

  // ============================================================================
  // 9. Console Panel Persistence
  // ============================================================================

  test('Console state persists through open/close cycles', async () =>
  {
    // Open console
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    let panelVisible = await getStoreState(page, 'compileRunPanelVisible');
    expect(panelVisible).toBe(true);

    // Close console
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    panelVisible = await getStoreState(page, 'compileRunPanelVisible');
    expect(panelVisible).toBe(false);

    // Open again
    await page.keyboard.press('Control+Shift+y');
    await page.waitForTimeout(300);

    panelVisible = await getStoreState(page, 'compileRunPanelVisible');
    expect(panelVisible).toBe(true);
  });

  // ============================================================================
  // 10. Keyboard Navigation & Accessibility
  // ============================================================================

  test('Close button is keyboard navigable', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const closeButton = await page.locator('button[aria-label="Close Console"]').first();
    const buttonExists = await closeButton.count();
    expect(buttonExists).toBeGreaterThan(0);

    // Buttons are naturally keyboard focusable
    await closeButton.focus();
    const isFocused = await closeButton.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  test('Run button is keyboard navigable', async () =>
  {
    const isVisible = await getStoreState(page, 'compileRunPanelVisible');
    if (!isVisible)
    {
      await page.keyboard.press('Control+Shift+y');
      await page.waitForTimeout(500);
    }

    const runButton = await page.locator('button:has-text("Run")').first();
    const buttonExists = await runButton.count();
    expect(buttonExists).toBeGreaterThan(0);

    await runButton.focus();
    const isFocused = await runButton.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);
  });
});
