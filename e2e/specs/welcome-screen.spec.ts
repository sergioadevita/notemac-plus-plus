import { test, expect } from '@playwright/test';
import { gotoApp, createNewTab } from '../helpers/app';

test.describe('Welcome Screen', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    // Close all tabs to show the welcome screen
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeAllTabs();
    });
    await page.waitForTimeout(500);
  });

  test('App shows welcome content when no tabs are open', async ({ page }) => {
    // The welcome screen shows "Notemac++" title in an h1
    const welcomeTitle = page.locator('h1:has-text("Notemac++")');
    await expect(welcomeTitle).toBeVisible();
  });

  test('Creating a new tab hides welcome screen', async ({ page }) => {
    // Verify welcome is shown first
    const welcomeTitle = page.locator('h1:has-text("Notemac++")');
    await expect(welcomeTitle).toBeVisible();

    // Create a new tab via store
    await createNewTab(page);
    await page.waitForTimeout(500);

    // Welcome screen should disappear
    await expect(welcomeTitle).not.toBeVisible();
  });

  test('Welcome screen has New File button', async ({ page }) => {
    // Look for the "New File" text (rendered as a WelcomeButton)
    const newFileButton = page.locator('text=New File').first();
    await expect(newFileButton).toBeVisible();
  });
});
