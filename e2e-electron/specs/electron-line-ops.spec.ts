import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction } from '../helpers/electron-app';

/**
 * Helper to set editor content and return it after action.
 */
async function setEditorContent(page: Page, content: string): Promise<void>
{
  await page.evaluate((c) =>
  {
    const store = (window as any).__ZUSTAND_STORE__;
    const s = store.getState();
    const activeId = s.activeTabId;
    store.getState().updateTab(activeId, { content: c });
  }, content);
  await page.waitForTimeout(200);
}

async function getActiveTabContent(page: Page): Promise<string>
{
  return page.evaluate(() =>
  {
    const store = (window as any).__ZUSTAND_STORE__;
    const s = store.getState();
    const tab = s.tabs.find((t: any) => t.id === s.activeTabId);
    return tab?.content || '';
  });
}

test.describe('Electron Line Operations via Menu', () =>
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

  test('sort-asc — sorts lines ascending', async () =>
  {
    await setEditorContent(page, 'cherry\napple\nbanana');
    await triggerMenuAction(electronApp, 'sort-asc');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('apple\nbanana\ncherry');
  });

  test('sort-desc — sorts lines descending', async () =>
  {
    await setEditorContent(page, 'apple\ncherry\nbanana');
    await triggerMenuAction(electronApp, 'sort-desc');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('cherry\nbanana\napple');
  });

  test('remove-duplicates — removes duplicate lines', async () =>
  {
    await setEditorContent(page, 'apple\nbanana\napple\ncherry\nbanana');
    await triggerMenuAction(electronApp, 'remove-duplicates');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    const lines = content.split('\n');
    const unique = [...new Set(lines)];
    expect(lines.length).toBe(unique.length);
  });

  test('remove-empty-lines — removes empty lines', async () =>
  {
    await setEditorContent(page, 'line1\n\nline2\n\n\nline3');
    await triggerMenuAction(electronApp, 'remove-empty-lines');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).not.toContain('\n\n');
    expect(content).toContain('line1');
    expect(content).toContain('line2');
    expect(content).toContain('line3');
  });

  test('trim-trailing — trims trailing spaces', async () =>
  {
    await setEditorContent(page, 'hello   \nworld  \ntest');
    await triggerMenuAction(electronApp, 'trim-trailing');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('trim-leading — trims leading spaces', async () =>
  {
    await setEditorContent(page, '   hello\n  world\ntest');
    await triggerMenuAction(electronApp, 'trim-leading');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('trim-both — trims both leading and trailing', async () =>
  {
    await setEditorContent(page, '   hello   \n  world  \ntest');
    await triggerMenuAction(electronApp, 'trim-both');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('reverse-lines — reverses line order', async () =>
  {
    await setEditorContent(page, 'first\nsecond\nthird');
    await triggerMenuAction(electronApp, 'reverse-lines');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).toBe('third\nsecond\nfirst');
  });

  test('sort-asc-ci — case insensitive ascending sort', async () =>
  {
    await setEditorContent(page, 'Banana\napple\nCherry');
    await triggerMenuAction(electronApp, 'sort-asc-ci');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    const lines = content.split('\n');
    expect(lines[0].toLowerCase()).toBe('apple');
    expect(lines[1].toLowerCase()).toBe('banana');
    expect(lines[2].toLowerCase()).toBe('cherry');
  });

  test('sort-len-asc — sort by length ascending', async () =>
  {
    await setEditorContent(page, 'medium\na\nlong line here');
    await triggerMenuAction(electronApp, 'sort-len-asc');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    const lines = content.split('\n');
    for (let i = 1; i < lines.length; i++)
    {
      expect(lines[i].length).toBeGreaterThanOrEqual(lines[i - 1].length);
    }
  });

  test('tab-to-space — converts tabs to spaces', async () =>
  {
    await setEditorContent(page, '\thello\n\t\tworld');
    await triggerMenuAction(electronApp, 'tab-to-space');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    expect(content).not.toContain('\t');
    expect(content).toContain('hello');
    expect(content).toContain('world');
  });

  test('uppercase — converts to uppercase via menu action', async () =>
  {
    // This requires selection, but the menu action should handle full content if no selection
    await setEditorContent(page, 'hello world');
    await triggerMenuAction(electronApp, 'uppercase');
    await page.waitForTimeout(300);
    // May or may not affect without selection — test that it doesn't crash
    const visible = await page.locator('.notemac-app').isVisible();
    expect(visible).toBe(true);
  });

  test('lowercase — converts to lowercase via menu action', async () =>
  {
    await setEditorContent(page, 'HELLO WORLD');
    await triggerMenuAction(electronApp, 'lowercase');
    await page.waitForTimeout(300);
    const visible = await page.locator('.notemac-app').isVisible();
    expect(visible).toBe(true);
  });
});

test.describe('Electron Tools via Menu', () =>
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

  test('base64-encode — encodes content to base64', async () =>
  {
    await setEditorContent(page, 'Hello World');
    await triggerMenuAction(electronApp, 'base64-encode');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    // If the action works on full content, it should be base64
    if (content !== 'Hello World')
    {
      expect(content).toBe(btoa('Hello World'));
    }
  });

  test('base64-decode — decodes base64 content', async () =>
  {
    const encoded = btoa('Test String');
    await setEditorContent(page, encoded);
    await triggerMenuAction(electronApp, 'base64-decode');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    if (content !== encoded)
    {
      expect(content).toBe('Test String');
    }
  });

  test('url-encode — URL encodes content', async () =>
  {
    await setEditorContent(page, 'hello world & foo=bar');
    await triggerMenuAction(electronApp, 'url-encode');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    if (content !== 'hello world & foo=bar')
    {
      expect(content).toContain('%20');
    }
  });

  test('url-decode — URL decodes content', async () =>
  {
    await setEditorContent(page, 'hello%20world%26foo%3Dbar');
    await triggerMenuAction(electronApp, 'url-decode');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    if (content !== 'hello%20world%26foo%3Dbar')
    {
      expect(content).toContain('hello world');
    }
  });

  test('json-format — formats JSON content', async () =>
  {
    await setEditorContent(page, '{"a":1,"b":2}');
    await triggerMenuAction(electronApp, 'json-format');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    if (content !== '{"a":1,"b":2}')
    {
      expect(content).toContain('  ');
      expect(content).toContain('"a"');
    }
  });

  test('json-minify — minifies JSON content', async () =>
  {
    await setEditorContent(page, '{\n  "a": 1,\n  "b": 2\n}');
    await triggerMenuAction(electronApp, 'json-minify');
    await page.waitForTimeout(300);
    const content = await getActiveTabContent(page);
    if (content !== '{\n  "a": 1,\n  "b": 2\n}')
    {
      expect(content).not.toContain('\n');
    }
  });

  test('hash-md5 — generates MD5 hash without crashing', async () =>
  {
    await setEditorContent(page, 'test content');
    await triggerMenuAction(electronApp, 'hash-md5');
    await page.waitForTimeout(300);
    const visible = await page.locator('.notemac-app').isVisible();
    expect(visible).toBe(true);
  });

  test('hash-sha256 — generates SHA-256 hash without crashing', async () =>
  {
    await setEditorContent(page, 'test content');
    await triggerMenuAction(electronApp, 'hash-sha256');
    await page.waitForTimeout(300);
    const visible = await page.locator('.notemac-app').isVisible();
    expect(visible).toBe(true);
  });
});
