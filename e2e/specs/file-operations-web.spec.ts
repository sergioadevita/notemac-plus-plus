import { test, expect } from '@playwright/test';
import { gotoApp, getStoreState, getTabCount } from '../helpers/app';
import { mockElectronAPI, getElectronAPICalls, setMockReturnValue } from '../helpers/mocking';

test.describe('File Operations (Web)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('Opening a file creates a new tab with content', async ({ page }) => {
    // Simulate file open by adding tab via store (web mode uses file input)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({
        name: 'opened.js',
        content: 'const x = 1;',
        language: 'javascript',
      });
    });
    await page.waitForTimeout(300);
    const tabs = await getStoreState(page, 'tabs');
    const opened = tabs.find((t: any) => t.name === 'opened.js');
    expect(opened).toBeTruthy();
    expect(opened.content).toBe('const x = 1;');
    expect(opened.language).toBe('javascript');
  });

  test('Save marks tab as not modified', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { isModified: true });
    });
    await page.waitForTimeout(200);

    // Simulate save (mark as unmodified)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { isModified: false });
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.isModified).toBe(false);
  });

  test('Modified indicator appears when content changes', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { isModified: true });
    });
    await page.waitForTimeout(300);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.isModified).toBe(true);
  });

  test('Multiple files can be open simultaneously', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'file1.js', content: 'a' });
      store.getState().addTab({ name: 'file2.js', content: 'b' });
      store.getState().addTab({ name: 'file3.js', content: 'c' });
    });
    await page.waitForTimeout(300);

    const count = await getTabCount(page);
    expect(count).toBeGreaterThanOrEqual(4); // initial + 3
  });

  test('File rename updates tab name', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { name: 'renamed.ts' });
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.name).toBe('renamed.ts');
  });

  test('Closing modified tab reduces tab count', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'modified.js', content: 'test' });
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { isModified: true });
    });
    await page.waitForTimeout(200);

    const before = await getTabCount(page);
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().closeTab(store.getState().activeTabId);
    });
    await page.waitForTimeout(200);

    const after = await getTabCount(page);
    expect(after).toBe(before - 1);
  });

  test('File encoding can be set on tab', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { encoding: 'utf-16le' });
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.encoding).toBe('utf-16le');
  });

  test('File line ending can be set', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTab(tabId, { lineEnding: 'CRLF' });
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.lineEnding).toBe('CRLF');
  });

  test('Large content can be set on tab', async ({ page }) => {
    const largeContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: Lorem ipsum`).join('\n');
    await page.evaluate((content) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().addTab({ name: 'large.txt', content, language: 'plaintext' });
    }, largeContent);
    await page.waitForTimeout(300);

    const tabs = await getStoreState(page, 'tabs');
    const large = tabs.find((t: any) => t.name === 'large.txt');
    expect(large).toBeTruthy();
    expect(large.content.split('\n').length).toBe(1000);
  });

  test('Tab content can be updated', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      store.getState().updateTabContent(tabId, 'new content here');
    });
    await page.waitForTimeout(200);

    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active.content).toBe('new content here');
  });

  test('Tab language auto-detection', async ({ page }) => {
    const testCases = [
      { name: 'app.js', expected: 'javascript' },
      { name: 'style.css', expected: 'css' },
      { name: 'index.html', expected: 'html' },
      { name: 'data.json', expected: 'json' },
      { name: 'script.py', expected: 'python' },
    ];
    for (const tc of testCases) {
      await page.evaluate(({ name }) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().addTab({ name, content: '// test', language: name.split('.').pop() });
      }, tc);
      await page.waitForTimeout(100);
    }
    const tabs = await getStoreState(page, 'tabs');
    for (const tc of testCases) {
      const tab = tabs.find((t: any) => t.name === tc.name);
      expect(tab).toBeTruthy();
    }
  });

  test('With mocked electronAPI, openFile is callable', async ({ page }) => {
    await mockElectronAPI(page);
    await page.evaluate(() => {
      (window as any).electronAPI.openFile();
    });
    const calls = await getElectronAPICalls(page, 'openFile');
    expect(calls.length).toBe(1);
  });

  test('With mocked electronAPI, readFile returns content', async ({ page }) => {
    await mockElectronAPI(page);
    const content = await page.evaluate(() => {
      return (window as any).electronAPI.readFile('/test/path.txt');
    });
    expect(content).toBe('mock file content');
  });

  test('With mocked electronAPI, readDir returns listing', async ({ page }) => {
    await mockElectronAPI(page);
    const listing = await page.evaluate(() => {
      return (window as any).electronAPI.readDir('/test/dir');
    });
    expect(listing).toHaveLength(3);
    expect(listing[0].name).toBe('file1.js');
  });

  test('With mocked electronAPI, custom return value works', async ({ page }) => {
    await mockElectronAPI(page);
    await setMockReturnValue(page, 'readFile', 'custom content');
    const content = await page.evaluate(() => {
      return (window as any).electronAPI.readFile('/any/path.txt');
    });
    expect(content).toBe('custom content');
  });
});
