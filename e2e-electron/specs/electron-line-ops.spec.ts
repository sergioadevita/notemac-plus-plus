import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, triggerMenuAction } from '../helpers/electron-app';

/**
 * Set editor content via Monaco model directly (not the Zustand store).
 * This ensures the Monaco editor model has the right content for line operations.
 */
async function setMonacoContent(page: Page, content: string): Promise<void>
{
  await page.locator('.monaco-editor').first().click();
  await page.waitForTimeout(200);
  // Use Monaco API to set value directly on the model
  await page.evaluate((c) =>
  {
    const editors = (window as any).monaco?.editor?.getEditors?.();
    if (editors && editors.length > 0)
    {
      editors[0].getModel()?.setValue(c);
    }
  }, content);
  await page.waitForTimeout(200);
}

/**
 * Get editor content from Monaco model (not the Zustand store).
 */
async function getMonacoContent(page: Page): Promise<string>
{
  return page.evaluate(() =>
  {
    const editors = (window as any).monaco?.editor?.getEditors?.();
    if (editors && editors.length > 0)
    {
      return editors[0].getModel()?.getValue() || '';
    }
    return '';
  });
}

/**
 * Select all text in Monaco editor via its API.
 */
async function selectAllInMonaco(page: Page): Promise<void>
{
  await page.locator('.monaco-editor').first().click();
  await page.waitForTimeout(100);
  await page.evaluate(() =>
  {
    const editors = (window as any).monaco?.editor?.getEditors?.();
    if (editors && editors.length > 0)
    {
      const editor = editors[0];
      const model = editor.getModel();
      if (model)
      {
        const fullRange = model.getFullModelRange();
        editor.setSelection(fullRange);
      }
    }
  });
  await page.waitForTimeout(100);
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
    await setMonacoContent(page, 'cherry\napple\nbanana');
    await triggerMenuAction(electronApp, 'sort-asc');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('apple\nbanana\ncherry');
  });

  test('sort-desc — sorts lines descending', async () =>
  {
    await setMonacoContent(page, 'apple\ncherry\nbanana');
    await triggerMenuAction(electronApp, 'sort-desc');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('cherry\nbanana\napple');
  });

  test('remove-duplicates — removes duplicate lines', async () =>
  {
    await setMonacoContent(page, 'apple\nbanana\napple\ncherry\nbanana');
    await triggerMenuAction(electronApp, 'remove-duplicates');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('apple\nbanana\ncherry');
  });

  test('remove-empty-lines — removes empty lines', async () =>
  {
    await setMonacoContent(page, 'line1\n\nline2\n\n\nline3');
    await triggerMenuAction(electronApp, 'remove-empty-lines');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('line1\nline2\nline3');
  });

  test('trim-trailing — trims trailing spaces', async () =>
  {
    await setMonacoContent(page, 'hello   \nworld  \ntest');
    await triggerMenuAction(electronApp, 'trim-trailing');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('trim-leading — trims leading spaces', async () =>
  {
    await setMonacoContent(page, '   hello\n  world\ntest');
    await triggerMenuAction(electronApp, 'trim-leading');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('trim-both — trims both leading and trailing', async () =>
  {
    await setMonacoContent(page, '   hello   \n  world  \ntest');
    await triggerMenuAction(electronApp, 'trim-both');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello\nworld\ntest');
  });

  test('reverse-lines — reverses line order', async () =>
  {
    await setMonacoContent(page, 'first\nsecond\nthird');
    await triggerMenuAction(electronApp, 'reverse-lines');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('third\nsecond\nfirst');
  });

  test('sort-asc-ci — case insensitive ascending sort', async () =>
  {
    await setMonacoContent(page, 'Banana\napple\nCherry');
    await triggerMenuAction(electronApp, 'sort-asc-ci');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    const lines = content.split('\n');
    expect(lines[0].toLowerCase()).toBe('apple');
    expect(lines[1].toLowerCase()).toBe('banana');
    expect(lines[2].toLowerCase()).toBe('cherry');
  });

  test('sort-desc-ci — case insensitive descending sort', async () =>
  {
    await setMonacoContent(page, 'apple\nCherry\nBanana');
    await triggerMenuAction(electronApp, 'sort-desc-ci');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    const lines = content.split('\n');
    expect(lines[0].toLowerCase()).toBe('cherry');
    expect(lines[1].toLowerCase()).toBe('banana');
    expect(lines[2].toLowerCase()).toBe('apple');
  });

  test('sort-len-asc — sort by length ascending', async () =>
  {
    await setMonacoContent(page, 'medium\na\nlong line here');
    await triggerMenuAction(electronApp, 'sort-len-asc');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    const lines = content.split('\n');
    for (let i = 1; i < lines.length; i++)
    {
      expect(lines[i].length).toBeGreaterThanOrEqual(lines[i - 1].length);
    }
  });

  test('sort-len-desc — sort by length descending', async () =>
  {
    await setMonacoContent(page, 'a\nmedium\nlong line here');
    await triggerMenuAction(electronApp, 'sort-len-desc');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    const lines = content.split('\n');
    for (let i = 1; i < lines.length; i++)
    {
      expect(lines[i].length).toBeLessThanOrEqual(lines[i - 1].length);
    }
  });

  test('remove-consecutive-duplicates — removes only consecutive duplicates', async () =>
  {
    await setMonacoContent(page, 'a\na\nb\nb\na');
    await triggerMenuAction(electronApp, 'remove-consecutive-duplicates');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('a\nb\na');
  });

  test('tab-to-space — converts tabs to spaces', async () =>
  {
    await setMonacoContent(page, '\thello\n\t\tworld');
    await triggerMenuAction(electronApp, 'tab-to-space');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).not.toContain('\t');
    expect(content).toContain('hello');
    expect(content).toContain('world');
  });

  test('eol-to-space — replaces line endings with spaces', async () =>
  {
    await setMonacoContent(page, 'hello\nworld\nfoo');
    await triggerMenuAction(electronApp, 'eol-to-space');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello world foo');
  });
});

test.describe('Electron Tools via Menu — With Selection', () =>
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

  test('base64-encode — encodes selected text to base64', async () =>
  {
    await setMonacoContent(page, 'Hello World');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'base64-encode');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('SGVsbG8gV29ybGQ=');
  });

  test('base64-decode — decodes selected base64 to text', async () =>
  {
    await setMonacoContent(page, 'SGVsbG8gV29ybGQ=');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'base64-decode');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('Hello World');
  });

  test('url-encode — URL encodes selected text', async () =>
  {
    await setMonacoContent(page, 'hello world&foo=bar');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'url-encode');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe(encodeURIComponent('hello world&foo=bar'));
  });

  test('url-decode — URL decodes selected text', async () =>
  {
    const encoded = encodeURIComponent('hello world&foo=bar');
    await setMonacoContent(page, encoded);
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'url-decode');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello world&foo=bar');
  });

  test('json-format — formats selected JSON', async () =>
  {
    await setMonacoContent(page, '{"a":1,"b":2}');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'json-format');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toContain('"a"');
    expect(content).toContain('\n');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('json-minify — minifies selected JSON', async () =>
  {
    await setMonacoContent(page, '{\n  "a": 1,\n  "b": 2\n}');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'json-minify');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).not.toContain('\n');
    expect(content).not.toContain('  ');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('uppercase — converts selected text to uppercase', async () =>
  {
    await setMonacoContent(page, 'hello world');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'uppercase');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('HELLO WORLD');
  });

  test('lowercase — converts selected text to lowercase', async () =>
  {
    await setMonacoContent(page, 'HELLO WORLD');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'lowercase');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hello world');
  });

  test('proper-case — converts to proper case', async () =>
  {
    await setMonacoContent(page, 'hello world foo');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'proper-case');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('Hello World Foo');
  });

  test('invert-case — inverts case', async () =>
  {
    await setMonacoContent(page, 'Hello World');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'invert-case');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    expect(content).toBe('hELLO wORLD');
  });

  test('without selection — tools leave content unchanged', async () =>
  {
    await setMonacoContent(page, 'original text');
    // Clear selection by setting cursor to position 1,1
    await page.evaluate(() =>
    {
      const editors = (window as any).monaco?.editor?.getEditors?.();
      if (editors?.[0])
      {
        editors[0].setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
      }
    });
    await page.waitForTimeout(100);

    await triggerMenuAction(electronApp, 'base64-encode');
    await page.waitForTimeout(300);
    const content = await getMonacoContent(page);
    expect(content).toBe('original text');
  });

  test('hash-md5 — appends hash comment from selection', async () =>
  {
    await setMonacoContent(page, 'test');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'hash-md5');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    // Hash action appends a comment like: \n// MD5: <hex>\n
    expect(content).toContain('// MD5:');
    const match = content.match(/\/\/ MD5:\s*([a-f0-9]+)/i);
    expect(match).toBeTruthy();
  });

  test('hash-sha256 — appends hash comment from selection', async () =>
  {
    await setMonacoContent(page, 'test');
    await selectAllInMonaco(page);
    await triggerMenuAction(electronApp, 'hash-sha256');
    await page.waitForTimeout(500);
    const content = await getMonacoContent(page);
    // Hash action appends a comment like: \n// SHA256: <hex>\n
    expect(content).toContain('// SHA256:');
    const match = content.match(/\/\/ SHA256:\s*([a-f0-9]+)/i);
    expect(match).toBeTruthy();
  });
});
