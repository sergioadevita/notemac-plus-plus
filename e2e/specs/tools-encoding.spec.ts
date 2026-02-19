import { test, expect } from '@playwright/test';
import { gotoApp, getStoreState, closeAllDialogs } from '../helpers/app';

test.describe('Tools and Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // ─── ENCODING ─────────────────────────────────────────────
  test.describe('Encoding', () => {
    test('Tab encoding defaults to utf-8', async ({ page }) => {
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      // Default encoding is typically utf-8 or undefined
      expect(active.encoding === 'utf-8' || active.encoding === undefined).toBeTruthy();
    });

    test('Can set encoding to utf-16le', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { encoding: 'utf-16le' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.encoding).toBe('utf-16le');
    });

    test('Can set encoding to ascii', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { encoding: 'ascii' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.encoding).toBe('ascii');
    });

    test('Can set encoding to iso-8859-1', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { encoding: 'iso-8859-1' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.encoding).toBe('iso-8859-1');
    });
  });

  // ─── LINE ENDINGS ─────────────────────────────────────────
  test.describe('Line Endings', () => {
    test('Can set line ending to LF', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { lineEnding: 'LF' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.lineEnding).toBe('LF');
    });

    test('Can set line ending to CRLF', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { lineEnding: 'CRLF' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.lineEnding).toBe('CRLF');
    });

    test('Can set line ending to CR', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().updateTab(store.getState().activeTabId, { lineEnding: 'CR' });
      });
      await page.waitForTimeout(200);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active.lineEnding).toBe('CR');
    });
  });

  // ─── SIDEBAR PANELS (TOOLS) ───────────────────────────────
  test.describe('Sidebar Panels', () => {
    test('Character panel opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setSidebarPanel('charPanel');
      });
      await page.waitForTimeout(300);
      const panel = await getStoreState(page, 'sidebarPanel');
      expect(panel).toBe('charPanel');
    });

    test('Clipboard history panel opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setSidebarPanel('clipboardHistory');
      });
      await page.waitForTimeout(300);
      const panel = await getStoreState(page, 'sidebarPanel');
      expect(panel).toBe('clipboardHistory');
    });

    test('Document list panel opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setSidebarPanel('docList');
      });
      await page.waitForTimeout(300);
      const panel = await getStoreState(page, 'sidebarPanel');
      expect(panel).toBe('docList');
    });

    test('Terminal panel toggles', async ({ page }) => {
      const before = await getStoreState(page, 'showTerminalPanel');
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowTerminalPanel(!store.getState().showTerminalPanel);
      });
      await page.waitForTimeout(300);
      const after = await getStoreState(page, 'showTerminalPanel');
      expect(after).toBe(!before);
    });
  });

  // ─── HASH / TOOLS DIALOGS ────────────────────────────────
  test.describe('Tool Dialogs', () => {
    test('Column editor dialog opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowColumnEditor(true);
      });
      await page.waitForTimeout(300);
      const visible = await getStoreState(page, 'showColumnEditor');
      expect(visible).toBe(true);
      await closeAllDialogs(page);
    });

    test('Run command dialog opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowRunCommand(true);
      });
      await page.waitForTimeout(300);
      const visible = await getStoreState(page, 'showRunCommand');
      expect(visible).toBe(true);
      await closeAllDialogs(page);
    });

    test('Summary dialog opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowSummary(true);
      });
      await page.waitForTimeout(300);
      const visible = await getStoreState(page, 'showSummary');
      expect(visible).toBe(true);
      await closeAllDialogs(page);
    });

    test('Shortcut mapper dialog opens', async ({ page }) => {
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().setShowShortcutMapper(true);
      });
      await page.waitForTimeout(300);
      const visible = await getStoreState(page, 'showShortcutMapper');
      expect(visible).toBe(true);
      await closeAllDialogs(page);
    });
  });

  // ─── SESSION MANAGEMENT ───────────────────────────────────
  test.describe('Session Management', () => {
    test('Save session captures current state', async ({ page }) => {
      // Add some tabs first
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().addTab({ name: 'session1.js', content: 'session test 1' });
        store.getState().addTab({ name: 'session2.js', content: 'session test 2' });
      });
      await page.waitForTimeout(200);

      const session = await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        return store.getState().saveSession();
      });

      expect(session).toBeTruthy();
      expect(session.tabs).toBeTruthy();
      expect(session.tabs.length).toBeGreaterThanOrEqual(2);
    });

    test('Load session restores state', async ({ page }) => {
      // Save current session
      const session = await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().addTab({ name: 'restore-me.js', content: 'restore content' });
        return store.getState().saveSession();
      });
      await page.waitForTimeout(200);

      // Close all tabs
      await page.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().closeAllTabs();
      });
      await page.waitForTimeout(200);
      expect(await getStoreState(page, 'tabs')).toHaveLength(0);

      // Load session back
      await page.evaluate((s) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store.getState().loadSession(s);
      }, session);
      await page.waitForTimeout(300);

      const tabs = await getStoreState(page, 'tabs');
      expect(tabs.length).toBeGreaterThan(0);
      const restored = tabs.find((t: any) => t.name === 'restore-me.js');
      expect(restored).toBeTruthy();
    });
  });
});
