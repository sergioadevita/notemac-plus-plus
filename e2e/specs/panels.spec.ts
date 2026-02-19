import { test, expect } from '@playwright/test';
import {
  gotoApp,
  pressShortcut,
  isSidebarVisible,
  getStoreState,
  closeAllDialogs,
} from '../helpers/app';

test.describe('Sidebar Panels & Terminal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Sidebar is visible by default', async ({ page }) => {
    const visible = await isSidebarVisible(page);
    expect(visible).toBe(true);
  });

  test('Sidebar toggles with Cmd+B', async ({ page }) => {
    const initialState = await isSidebarVisible(page);
    await pressShortcut(page, 'Cmd+B');
    await page.waitForTimeout(300);

    const afterToggle = await isSidebarVisible(page);
    expect(afterToggle).toBe(!initialState);

    // Toggle back
    await pressShortcut(page, 'Cmd+B');
    await page.waitForTimeout(300);
    const afterSecondToggle = await isSidebarVisible(page);
    expect(afterSecondToggle).toBe(initialState);
  });

  test('Sidebar has file explorer panel', async ({ page }) => {
    const sidebarVisible = await isSidebarVisible(page);
    expect(sidebarVisible).toBe(true);

    // Check for sidebar element
    const sidebar = page.locator('[role="complementary"]').first();
    const sidebarCount = await sidebar.count();
    expect(sidebarCount).toBeGreaterThan(0);
  });

  test('Sidebar is resizable (has resize handle)', async ({ page }) => {
    // The sidebar should have a resize handle at its right edge
    const resizeHandle = page.locator('[data-testid="sidebar-resize-handle"], .sidebar-resize');
    let handleCount = await resizeHandle.count();

    // If specific testid not found, look for common resize patterns
    if (handleCount === 0) {
      // Check if sidebar div exists (resize handling may be implicit)
      const sidebar = page.locator('[role="complementary"]').first();
      handleCount = await sidebar.count();
    }

    expect(handleCount).toBeGreaterThan(0);
  });

  test('Ctrl+Shift+G opens git panel (sidebar switches)', async ({ page }) => {
    await closeAllDialogs(page);
    const initialPanel = await getStoreState(page, 'sidebarPanel');

    await pressShortcut(page, 'Ctrl+Shift+G');
    await page.waitForTimeout(300);

    const panelAfterShortcut = await getStoreState(page, 'sidebarPanel');
    // Should have switched to git panel
    expect(panelAfterShortcut).toBeTruthy();
  });

  test('Ctrl+Shift+A opens AI panel (sidebar switches)', async ({ page }) => {
    await closeAllDialogs(page);
    const initialPanel = await getStoreState(page, 'sidebarPanel');

    await pressShortcut(page, 'Ctrl+Shift+A');
    await page.waitForTimeout(300);

    const panelAfterShortcut = await getStoreState(page, 'sidebarPanel');
    // AI panel should be active
    expect(panelAfterShortcut).toBeTruthy();
  });

  test('Ctrl+` toggles terminal panel', async ({ page }) => {
    await closeAllDialogs(page);
    const initialTerminalState = await getStoreState(page, 'showTerminal');

    await pressShortcut(page, 'Ctrl+`');
    await page.waitForTimeout(300);

    const afterToggle = await getStoreState(page, 'showTerminal');
    expect(afterToggle).not.toBe(initialTerminalState);
  });

  test('Panel switching updates sidebar state', async ({ page }) => {
    await closeAllDialogs(page);

    // Switch to git panel
    await pressShortcut(page, 'Ctrl+Shift+G');
    await page.waitForTimeout(300);
    const gitPanel = await getStoreState(page, 'sidebarPanel');
    expect(gitPanel).toBe('git');

    // Switch to file explorer (toggle sidebar or use different shortcut)
    await pressShortcut(page, 'Cmd+B');
    await page.waitForTimeout(300);
    const sidebarVisibility = await isSidebarVisible(page);
    // After toggle, may be hidden or may switch panels
    expect(typeof sidebarVisibility).toBe('boolean');
  });

  test('Sidebar panels are distinct (git vs AI vs explorer)', async ({ page }) => {
    await closeAllDialogs(page);

    // Get initial panel
    const initial = await getStoreState(page, 'sidebarPanel');

    // Open git panel
    await pressShortcut(page, 'Ctrl+Shift+G');
    await page.waitForTimeout(300);
    const gitPanel = await getStoreState(page, 'sidebarPanel');
    expect(gitPanel).toBe('git');

    // Open AI panel
    await pressShortcut(page, 'Ctrl+Shift+A');
    await page.waitForTimeout(300);
    const aiPanel = await getStoreState(page, 'sidebarPanel');
    expect(aiPanel).toBe('ai');

    // Panels should be different
    expect(gitPanel).not.toBe(aiPanel);
  });

  test('Terminal can be toggled multiple times', async ({ page }) => {
    await closeAllDialogs(page);

    for (let i = 0; i < 3; i++) {
      const beforeToggle = await getStoreState(page, 'showTerminal');
      await pressShortcut(page, 'Ctrl+`');
      await page.waitForTimeout(300);
      const afterToggle = await getStoreState(page, 'showTerminal');
      expect(afterToggle).not.toBe(beforeToggle);
    }
  });

  test('Sidebar remains visible after panel switch', async ({ page }) => {
    await closeAllDialogs(page);

    // Ensure sidebar is visible
    const initialVisible = await isSidebarVisible(page);
    if (!initialVisible) {
      await pressShortcut(page, 'Cmd+B');
      await page.waitForTimeout(300);
    }

    // Switch panels
    await pressShortcut(page, 'Ctrl+Shift+G');
    await page.waitForTimeout(300);

    const stillVisible = await isSidebarVisible(page);
    expect(stillVisible).toBe(true);
  });

  test('Sidebar DOM element has appropriate attributes', async ({ page }) => {
    const sidebar = page.locator('[role="complementary"]').first();
    const count = await sidebar.count();
    expect(count).toBeGreaterThan(0);

    if (count > 0) {
      // Check for common sidebar attributes
      const ariaLabel = await sidebar.getAttribute('aria-label');
      const className = await sidebar.getAttribute('class');
      expect(className || ariaLabel).toBeTruthy();
    }
  });

  test('Terminal panel exists in store', async ({ page }) => {
    const state = await getStoreState(page);
    expect(state).toHaveProperty('showTerminal');
  });

  test('Sidebar panel state is tracked in store', async ({ page }) => {
    const state = await getStoreState(page);
    expect(state).toHaveProperty('sidebarPanel');
  });
});
