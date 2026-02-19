import { test, expect } from '@playwright/test';
import { gotoApp, getStoreState, closeAllDialogs } from '../helpers/app';

test.describe('Line Operations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // Helper to set editor content and get it back
  async function setContent(page: any, content: string) {
    await page.evaluate((c: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      const tabId = store.getState().activeTabId;
      if (tabId) store.getState().updateTabContent(tabId, c);
    }, content);
    await page.waitForTimeout(200);
  }

  async function getContent(page: any): Promise<string> {
    return page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      return tab?.content || '';
    });
  }

  test('Content can be set and retrieved', async ({ page }) => {
    await setContent(page, 'line 1\nline 2\nline 3');
    const content = await getContent(page);
    expect(content).toBe('line 1\nline 2\nline 3');
  });

  test('Content with multiple lines preserves line count', async ({ page }) => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');
    await setContent(page, lines);
    const content = await getContent(page);
    expect(content.split('\n').length).toBe(50);
  });

  test('Empty content is handled', async ({ page }) => {
    await setContent(page, '');
    const content = await getContent(page);
    expect(content).toBe('');
  });

  test('Content with special characters is preserved', async ({ page }) => {
    const special = 'tabs\there\nnewlines\nand "quotes" and \'apostrophes\'';
    await setContent(page, special);
    const content = await getContent(page);
    expect(content).toBe(special);
  });

  test('Content with unicode is preserved', async ({ page }) => {
    const unicode = '日本語テスト\n中文测试\némojis 🎉🚀';
    await setContent(page, unicode);
    const content = await getContent(page);
    expect(content).toBe(unicode);
  });

  test('Sort lines ascending via store manipulation', async ({ page }) => {
    await setContent(page, 'cherry\napple\nbanana');
    // Simulate sort ascending
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const sorted = tab.content.split('\n').sort().join('\n');
        store.getState().updateTabContent(state.activeTabId, sorted);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('apple\nbanana\ncherry');
  });

  test('Sort lines descending via store manipulation', async ({ page }) => {
    await setContent(page, 'apple\ncherry\nbanana');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const sorted = tab.content.split('\n').sort().reverse().join('\n');
        store.getState().updateTabContent(state.activeTabId, sorted);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('cherry\nbanana\napple');
  });

  test('Remove duplicate lines via store manipulation', async ({ page }) => {
    await setContent(page, 'apple\nbanana\napple\ncherry\nbanana');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const unique = [...new Set(tab.content.split('\n'))].join('\n');
        store.getState().updateTabContent(state.activeTabId, unique);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('apple\nbanana\ncherry');
  });

  test('Remove empty lines via store manipulation', async ({ page }) => {
    await setContent(page, 'line1\n\nline2\n\n\nline3');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const noEmpty = tab.content.split('\n').filter((l: string) => l.trim() !== '').join('\n');
        store.getState().updateTabContent(state.activeTabId, noEmpty);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('line1\nline2\nline3');
  });

  test('Trim trailing whitespace via store manipulation', async ({ page }) => {
    await setContent(page, 'hello   \nworld  \nfoo');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const trimmed = tab.content.split('\n').map((l: string) => l.trimEnd()).join('\n');
        store.getState().updateTabContent(state.activeTabId, trimmed);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('hello\nworld\nfoo');
  });

  test('Trim leading whitespace via store manipulation', async ({ page }) => {
    await setContent(page, '  hello\n   world\nfoo');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const trimmed = tab.content.split('\n').map((l: string) => l.trimStart()).join('\n');
        store.getState().updateTabContent(state.activeTabId, trimmed);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('hello\nworld\nfoo');
  });

  test('Convert to uppercase via store manipulation', async ({ page }) => {
    await setContent(page, 'hello world');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        store.getState().updateTabContent(state.activeTabId, tab.content.toUpperCase());
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('HELLO WORLD');
  });

  test('Convert to lowercase via store manipulation', async ({ page }) => {
    await setContent(page, 'HELLO WORLD');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        store.getState().updateTabContent(state.activeTabId, tab.content.toLowerCase());
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('hello world');
  });

  test('Join lines via store manipulation', async ({ page }) => {
    await setContent(page, 'hello\nworld\nfoo');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        store.getState().updateTabContent(state.activeTabId, tab.content.split('\n').join(' '));
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('hello world foo');
  });

  test('Reverse line order via store manipulation', async ({ page }) => {
    await setContent(page, 'first\nsecond\nthird');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const reversed = tab.content.split('\n').reverse().join('\n');
        store.getState().updateTabContent(state.activeTabId, reversed);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('third\nsecond\nfirst');
  });

  test('Insert line numbers via store manipulation', async ({ page }) => {
    await setContent(page, 'alpha\nbeta\ngamma');
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      const tab = state.tabs.find((t: any) => t.id === state.activeTabId);
      if (tab) {
        const numbered = tab.content.split('\n').map((l: string, i: number) => `${i + 1}: ${l}`).join('\n');
        store.getState().updateTabContent(state.activeTabId, numbered);
      }
    });
    await page.waitForTimeout(200);
    const content = await getContent(page);
    expect(content).toBe('1: alpha\n2: beta\n3: gamma');
  });
});
