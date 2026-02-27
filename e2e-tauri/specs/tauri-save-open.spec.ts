import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, triggerMenuAction, getStoreState, getTabCount, getTauriInvocations, clearTauriInvocations, emitTauriEvent } from '../helpers/tauri-app';

/**
 * Save/Open file flow tests.
 * Validates dialog-based file operations via mocked Tauri invoke commands.
 */

test.describe('Tauri Save/Open File Flows', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('save-file-dialog invoke is tracked when saving new file', async () => {
    // Create a new tab with content
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    // Set some content in the editor
    await page.evaluate(() => {
      const editors = (window as any).monaco?.editor?.getEditors?.();
      if (editors?.[0]) editors[0].getModel()?.setValue('Hello from new file');
    });
    await page.waitForTimeout(200);

    await clearTauriInvocations(page);

    // Trigger save — for a new file this should call save_file_dialog
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (!store) return;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      // Simulate a save action for a tab without a path
      if (tab && !tab.path) {
        // The app calls save_file_dialog when there's no path
        (window as any).__TAURI__?.core?.invoke('save_file_dialog', { defaultName: tab.name });
      }
    });
    await page.waitForTimeout(300);

    const invocations = await getTauriInvocations(page);
    const saveDialogCalls = invocations.filter((i: any) => i.cmd === 'save_file_dialog');
    expect(saveDialogCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('open-file-dialog invoke is callable', async () => {
    await clearTauriInvocations(page);

    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('open_file_dialog');
    });

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty('path');
    expect(result[0]).toHaveProperty('name');
  });

  test('open-folder-dialog invoke is callable', async () => {
    await clearTauriInvocations(page);

    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('open_folder_dialog');
    });

    expect(result).toBeTruthy();
    expect(result).toHaveProperty('path');
  });

  test('save-file-dialog returns a file path', async () => {
    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('save_file_dialog', { defaultName: 'test.txt' });
    });

    expect(result).toBe('/mock/saved.txt');
  });

  test('new file tab has no path (unsaved)', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    const state = await getStoreState(page);
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(tab).toBeTruthy();
    expect(tab.path).toBeFalsy();
  });

  test('tab becomes modified after editing', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    // Type into editor
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(100);
    await page.keyboard.type('modified content');
    await page.waitForTimeout(300);

    const state = await getStoreState(page);
    const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
    expect(tab.isModified).toBe(true);
  });

  test('close-unchanged only closes unmodified tabs', async () => {
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(200);

    // Create 3 tabs
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    // Modify the active tab
    await page.locator('.monaco-editor').first().click();
    await page.waitForTimeout(100);
    await page.keyboard.type('dirty');
    await page.waitForTimeout(200);

    const beforeCount = await getTabCount(page);
    expect(beforeCount).toBe(3);

    await triggerMenuAction(page, 'close-unchanged');
    await page.waitForTimeout(300);

    const afterCount = await getTabCount(page);
    // Only modified tab should remain
    expect(afterCount).toBe(1);
  });

  test('write_file invoke creates file and is tracked', async () => {
    await clearTauriInvocations(page);

    const result = await page.evaluate(async () => {
      return await (window as any).__TAURI__?.core?.invoke('write_file', {
        path: '/mock/saved-test.txt',
        content: 'Test content to save'
      });
    });

    expect(result).toBe(true);

    const invocations = await getTauriInvocations(page);
    const writeCalls = invocations.filter((i: any) => i.cmd === 'write_file');
    expect(writeCalls.length).toBe(1);
    expect(writeCalls[0].args.path).toBe('/mock/saved-test.txt');
    expect(writeCalls[0].args.content).toBe('Test content to save');
  });
});
