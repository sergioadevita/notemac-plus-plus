import { test, expect } from '@playwright/test';
import { gotoApp } from '../helpers/app';

test.describe('Diff Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Diff viewer opens via store', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowDiffViewer(true);
    });
    await page.waitForTimeout(300);

    // The diff viewer is a modal overlay with a title "Compare Files"
    const title = page.locator('text=Compare Files');
    await expect(title).toBeVisible();
  });

  test('Diff viewer has mode toggle (Files vs Git HEAD)', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowDiffViewer(true);
      // Initialize repo to show Git HEAD mode option
      store.getState().SetRepoInitialized(true);
    });
    await page.waitForTimeout(300);

    // Look for the mode toggle buttons - should have 'Files' and 'Git HEAD' buttons
    const filesMode = page.locator('text=Files').first();
    const gitMode = page.locator('text=Git HEAD');
    await expect(filesMode).toBeVisible();
    await expect(gitMode).toBeVisible();
  });

  test('Diff viewer has close button that works', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowDiffViewer(true);
    });
    await page.waitForTimeout(300);

    // Title should be visible before closing
    const title = page.locator('text=Compare Files');
    await expect(title).toBeVisible();

    // Find and click the close button
    const closeButton = page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(300);

    // Title should no longer be visible
    await expect(title).not.toBeVisible();
  });

  test('Diff viewer has side-by-side toggle checkbox', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowDiffViewer(true);
    });
    await page.waitForTimeout(300);

    // Look for checkbox with "Side by Side" label
    const sideByLabel = page.locator('text=Side by Side');
    await expect(sideByLabel).toBeVisible();

    // Check that it has an input checkbox nearby
    const checkbox = sideByLabel.locator('..').locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('Escape closes diff viewer', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowDiffViewer(true);
    });
    await page.waitForTimeout(300);

    // Title should be visible before closing
    const title = page.locator('text=Compare Files');
    await expect(title).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Title should no longer be visible
    await expect(title).not.toBeVisible();
  });
});
