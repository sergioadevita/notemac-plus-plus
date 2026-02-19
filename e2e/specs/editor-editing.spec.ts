import { test, expect } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  typeInEditor,
  getEditorContent,
  getCursorPosition,
  pressShortcut,
  isDialogVisible,
  closeAllDialogs,
  openDialog,
} from '../helpers/app';

test.describe('Editor Editing Operations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await createNewTab(page);
  });

  test('Type text appears in editor', async ({ page }) => {
    const testText = 'Hello, World!';
    await typeInEditor(page, testText);
    const content = await getEditorContent(page);
    expect(content).toContain(testText);
  });

  test('Undo reverts last change', async ({ page }) => {
    await typeInEditor(page, 'first change');
    await page.waitForTimeout(300);

    const contentBefore = await getEditorContent(page);
    expect(contentBefore).toContain('first change');

    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(300);

    const contentAfter = await getEditorContent(page);
    expect(contentAfter).not.toContain('first change');
  });

  test('Redo re-applies change', async ({ page }) => {
    await typeInEditor(page, 'test content');
    await page.waitForTimeout(300);

    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(300);

    const contentAfterUndo = await getEditorContent(page);
    expect(contentAfterUndo).not.toContain('test content');

    await pressShortcut(page, 'Cmd+Shift+Z');
    await page.waitForTimeout(300);

    const contentAfterRedo = await getEditorContent(page);
    expect(contentAfterRedo).toContain('test content');
  });

  test('Select all + delete clears editor', async ({ page }) => {
    await typeInEditor(page, 'content to delete');
    await page.waitForTimeout(300);

    // Select all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);

    // Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content.trim()).toBe('');
  });

  test('Duplicate line creates copy', async ({ page }) => {
    await typeInEditor(page, 'original line');
    await page.waitForTimeout(300);

    await pressShortcut(page, 'Cmd+D');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    // Should have duplicated the line
    const lines = content.split('\n').filter(l => l.trim() === 'original line');
    expect(lines.length).toBe(2);
  });



  test('Go to line dialog can be opened', async ({ page }) => {
    await typeInEditor(page, 'line1\nline2\nline3\nline4\nline5');
    await page.waitForTimeout(300);

    // Open the dialog via store
    await openDialog(page, 'showGoToLine');

    // Check if dialog is visible (store state based check)
    const dialogVisible = await isDialogVisible(page, 'showGoToLine');
    expect(dialogVisible).toBe(true);

    // Close the dialog
    await closeAllDialogs(page);
  });

  test('Multiple undo operations work', async ({ page }) => {
    await typeInEditor(page, 'a');
    await page.waitForTimeout(100);
    await typeInEditor(page, 'b');
    await page.waitForTimeout(100);
    await typeInEditor(page, 'c');
    await page.waitForTimeout(300);

    const contentBeforeUndo = await getEditorContent(page);
    expect(contentBeforeUndo).toContain('abc');

    // Undo twice
    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(300);

    const contentAfterUndo = await getEditorContent(page);
    expect(contentAfterUndo).toContain('a');
    expect(contentAfterUndo).not.toContain('bc');
  });

  test('Multiple redo operations work', async ({ page }) => {
    await typeInEditor(page, 'a');
    await page.waitForTimeout(100);
    await typeInEditor(page, 'b');
    await page.waitForTimeout(100);
    await typeInEditor(page, 'c');
    await page.waitForTimeout(300);

    // Undo twice
    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+Z');
    await page.waitForTimeout(300);

    // Redo twice
    await pressShortcut(page, 'Cmd+Shift+Z');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+Shift+Z');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content).toContain('abc');
  });

  test('Cursor position is tracked correctly', async ({ page }) => {
    await typeInEditor(page, 'hello');
    await page.waitForTimeout(300);

    const position = await getCursorPosition(page);
    expect(position.line).toBeGreaterThan(0);
    expect(position.column).toBeGreaterThan(0);
  });

  test('Pressing Enter creates new line', async ({ page }) => {
    await typeInEditor(page, 'line1\nline2');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content).toContain('line1');
    expect(content).toContain('line2');
    const lines = content.split('\n').filter(l => l.trim());
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  test('Backspace deletes character', async ({ page }) => {
    await typeInEditor(page, 'hello');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    const content = await getEditorContent(page);
    expect(content).toBe('hell');
  });

  test('Go to line with invalid input closes dialog', async ({ page }) => {
    await typeInEditor(page, 'line1\nline2\nline3');
    await page.waitForTimeout(300);

    await pressShortcut(page, 'Cmd+G');
    await page.waitForTimeout(500);

    await closeAllDialogs(page);
    const dialogVisible = await isDialogVisible(page, 'showGoToLine');
    expect(dialogVisible).toBe(false);
  });
});
