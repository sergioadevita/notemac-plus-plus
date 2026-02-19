import { test, expect } from '@playwright/test';
import { gotoApp } from '../helpers/app';

test.describe('Snippet Manager', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Snippet manager opens via store', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
    });
    await page.waitForTimeout(300);

    // Check for the title "Snippet Manager"
    const title = page.locator('text=Snippet Manager');
    await expect(title).toBeVisible();
  });

  test('Snippet manager shows empty state when no snippets', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
    });
    await page.waitForTimeout(300);

    // Look for "No snippets yet" text which appears when empty
    const emptyState = page.locator('text=No snippets yet');
    await expect(emptyState).toBeVisible();
  });

  test('Adding a snippet via store shows it in the list', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
      store.getState().addSnippet({
        name: 'React Hook',
        prefix: 'rh',
        scope: 'javascript',
        body: 'const [state, setState] = useState(null);',
        language: 'javascript'
      });
    });
    await page.waitForTimeout(300);

    // Check that the snippet name appears in the list
    const snippetName = page.locator('text=React Hook');
    await expect(snippetName).toBeVisible();
  });

  test('Adding multiple snippets shows all in list', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
      store.getState().addSnippet({
        name: 'Hook One',
        prefix: 'h1',
        scope: 'javascript',
        body: 'const [a, setA] = useState(null);',
        language: 'javascript'
      });
      store.getState().addSnippet({
        name: 'Hook Two',
        prefix: 'h2',
        scope: 'typescript',
        body: 'const [b, setB] = useState<string>("");',
        language: 'typescript'
      });
    });
    await page.waitForTimeout(300);

    // Check both snippet names appear
    const hookOne = page.locator('text=Hook One');
    const hookTwo = page.locator('text=Hook Two');
    await expect(hookOne).toBeVisible();
    await expect(hookTwo).toBeVisible();
  });

  test('Snippet details panel shows when snippet selected', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
      store.getState().addSnippet({
        name: 'My Snippet',
        prefix: 'ms',
        scope: 'javascript',
        body: 'console.log("test");',
        language: 'javascript'
      });
    });
    await page.waitForTimeout(300);

    // Click on the snippet to select it
    const snippetItem = page.locator('text=My Snippet');
    await snippetItem.click();
    await page.waitForTimeout(300);

    // Check that the details are shown (in the right panel)
    // The panel should show the name and prefix
    const detailsName = page.locator('text=My Snippet');
    const detailsPrefix = page.locator('text=ms');
    await expect(detailsName).toBeVisible();
    await expect(detailsPrefix).toBeVisible();
  });

  test('Removing a snippet removes it from list', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
      store.getState().addSnippet({
        name: 'Removable Snippet',
        prefix: 'rs',
        scope: 'javascript',
        body: 'const x = 1;',
        language: 'javascript'
      });
    });
    await page.waitForTimeout(300);

    // Verify snippet is in the list
    const snippetList = page.locator('text=Removable Snippet');
    await expect(snippetList).toBeVisible();

    // Click to select it
    await snippetList.click();
    await page.waitForTimeout(300);

    // Click the Delete button
    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();
    await page.waitForTimeout(300);

    // Snippet should no longer be visible
    const removedSnippet = page.locator('text=Removable Snippet');
    await expect(removedSnippet).not.toBeVisible();

    // Empty state should appear
    const emptyState = page.locator('text=No snippets yet');
    await expect(emptyState).toBeVisible();
  });

  test('Snippet manager closes with Escape', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
    });
    await page.waitForTimeout(300);

    // Title should be visible
    const title = page.locator('text=Snippet Manager');
    await expect(title).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Title should no longer be visible
    await expect(title).not.toBeVisible();
  });

  test('Snippet manager closes via store', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(true);
    });
    await page.waitForTimeout(300);

    // Title should be visible
    const title = page.locator('text=Snippet Manager');
    await expect(title).toBeVisible();

    // Close via store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().setShowSnippetManager(false);
    });
    await page.waitForTimeout(300);

    // Title should no longer be visible
    await expect(title).not.toBeVisible();
  });
});
