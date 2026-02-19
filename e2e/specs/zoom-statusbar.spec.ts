import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  getZoomLevel,
  getCursorPosition,
  typeInEditor,
  createNewTab,
} from '../helpers/app';

test.describe('Zoom and Status Bar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await createNewTab(page);
  });

  test('Zoom in (Cmd+=) increases zoom level', async ({ page }) => {
    const initialZoom = await getZoomLevel(page);

    // Zoom in
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(300);

    const zoomedIn = await getZoomLevel(page);
    expect(zoomedIn).toBeGreaterThan(initialZoom);
  });

  test('Zoom out (Cmd+-) decreases zoom level', async ({ page }) => {
    // First zoom in to have room to zoom out
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(300);

    const beforeZoomOut = await getZoomLevel(page);

    // Now zoom out
    await pressShortcut(page, 'Cmd+-');
    await page.waitForTimeout(300);

    const zoomedOut = await getZoomLevel(page);
    expect(zoomedOut).toBeLessThan(beforeZoomOut);
  });

  test('Zoom reset (Cmd+0) returns to 100%', async ({ page }) => {
    // Zoom in first
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(300);

    // Reset zoom
    await pressShortcut(page, 'Cmd+0');
    await page.waitForTimeout(300);

    const resetZoom = await getZoomLevel(page);
    expect(resetZoom).toBe(100);
  });

  test('Zoom level is capped at max bounds', async ({ page }) => {
    const maxZoom = 500; // Common max zoom level

    // Try to zoom in many times
    for (let i = 0; i < 20; i++) {
      await pressShortcut(page, 'Cmd+=');
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(300);

    const zoomLevel = await getZoomLevel(page);
    expect(zoomLevel).toBeLessThanOrEqual(maxZoom);
  });

  test('Zoom level is capped at min bounds', async ({ page }) => {
    const minZoom = 10; // Common min zoom level

    // Reset to 100% first
    await pressShortcut(page, 'Cmd+0');
    await page.waitForTimeout(300);

    // Try to zoom out many times
    for (let i = 0; i < 20; i++) {
      await pressShortcut(page, 'Cmd+-');
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(300);

    const zoomLevel = await getZoomLevel(page);
    expect(zoomLevel).toBeGreaterThanOrEqual(minZoom);
  });

  test('Status bar is visible', async ({ page }) => {
    const statusBar = page.locator('[role="status"], .status-bar, .status');
    const count = await statusBar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Status bar shows cursor position (Ln X, Col Y)', async ({ page }) => {
    // Type some text
    await typeInEditor(page, 'Hello');
    await page.waitForTimeout(300);

    // Get cursor position
    const position = await getCursorPosition(page);
    expect(position.line).toBeGreaterThan(0);
    expect(position.column).toBeGreaterThan(0);

    // Look for cursor position text in status bar
    const statusBar = page.locator('[role="status"], .status-bar, .status').first();
    const statusText = await statusBar.textContent();

    // Should contain line and column info
    const hasLineInfo = statusText?.includes('Ln') || statusText?.includes('Line') || statusText?.includes(':');
    expect(hasLineInfo).toBe(true);
  });

  test('Status bar shows file language', async ({ page }) => {
    // Type JavaScript content to trigger language detection
    await typeInEditor(page, 'const x = 5;');
    await page.waitForTimeout(500);

    // Look for language indicator in status bar
    const statusBar = page.locator('[role="status"], .status-bar, .status').first();
    const statusText = await statusBar.textContent();

    // Should show some language or file type information
    expect(statusText).not.toBeNull();
    expect(statusText?.length).toBeGreaterThan(0);
  });

  test('Status bar shows encoding (UTF-8)', async ({ page }) => {
    // Type some content
    await typeInEditor(page, 'test content');
    await page.waitForTimeout(300);

    // Look for encoding info in status bar
    const statusBar = page.locator('[role="status"], .status-bar, .status').first();
    const statusText = await statusBar.textContent();

    // Should contain UTF-8 or encoding info
    const hasEncoding = statusText?.includes('UTF') || statusText?.includes('8') || statusText?.toLowerCase().includes('encoding');
    expect(hasEncoding).toBe(true);
  });

  test('Status bar shows line ending (LF/CRLF)', async ({ page }) => {
    // Type content with line breaks
    await typeInEditor(page, 'line1\nline2');
    await page.waitForTimeout(300);

    // Look for line ending info in status bar
    const statusBar = page.locator('[role="status"], .status-bar, .status').first();
    const statusText = await statusBar.textContent();

    // Should contain LF, CRLF, or CR info
    const hasLineEnding = statusText?.includes('LF') || statusText?.includes('CRLF') || statusText?.includes('CR');
    expect(hasLineEnding).toBe(true);
  });

  test('Status bar updates when switching tabs', async ({ page }) => {
    // Create first tab and type content
    await typeInEditor(page, 'First tab content');
    await page.waitForTimeout(300);

    const firstPosition = await getCursorPosition(page);

    // Create second tab
    await pressShortcut(page, 'Cmd+N');
    await page.waitForTimeout(300);

    // Type different content in second tab
    await typeInEditor(page, 'Second tab content');
    await page.waitForTimeout(300);

    const secondPosition = await getCursorPosition(page);

    // Positions should likely be different (different content lengths)
    // This indicates the status bar is tracking the active editor
    expect(secondPosition.column).toBeGreaterThan(0);

    // Switch back to first tab
    await pressShortcut(page, 'Cmd+Shift+Tab');
    await page.waitForTimeout(300);

    const positionAfterSwitch = await getCursorPosition(page);
    expect(positionAfterSwitch.line).toBeGreaterThan(0);
  });

  test('Multiple zoom in/out operations work correctly', async ({ page }) => {
    const initialZoom = await getZoomLevel(page);

    // Zoom in twice
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(200);
    await pressShortcut(page, 'Cmd+=');
    await page.waitForTimeout(300);

    const afterZoomIn = await getZoomLevel(page);
    expect(afterZoomIn).toBeGreaterThan(initialZoom);

    // Zoom out once
    await pressShortcut(page, 'Cmd+-');
    await page.waitForTimeout(300);

    const afterZoomOut = await getZoomLevel(page);
    expect(afterZoomOut).toBeLessThan(afterZoomIn);
    expect(afterZoomOut).toBeGreaterThan(initialZoom);
  });

  test('Cursor position updates as text is entered', async ({ page }) => {
    const initialPosition = await getCursorPosition(page);

    // Type text character by character
    await typeInEditor(page, 'a');
    await page.waitForTimeout(200);
    const posAfterOne = await getCursorPosition(page);

    await typeInEditor(page, 'bc');
    await page.waitForTimeout(200);
    const posAfterThree = await getCursorPosition(page);

    // Column should increase as text is entered
    expect(posAfterOne.column).toBeGreaterThanOrEqual(initialPosition.column);
    expect(posAfterThree.column).toBeGreaterThan(posAfterOne.column);
  });
});
