import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, getStoreState, getTabCount, triggerMenuAction } from '../helpers/tauri-app';

test.describe('Tauri Menu Actions — File Menu', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('new — creates a new tab', async () => {
    const before = await getTabCount(page);
    await triggerMenuAction(page, 'new');
    const after = await getTabCount(page);
    expect(after).toBe(before + 1);
  });

  test('close-tab — closes the active tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    await triggerMenuAction(page, 'close-tab');
    const after = await getTabCount(page);
    expect(after).toBe(before - 1);
  });

  test('close-all — closes all tabs', async () => {
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'close-all');
    await page.waitForTimeout(300);
    const count = await getTabCount(page);
    expect(count).toBeLessThanOrEqual(1);
  });

  test('close-others — closes all except active', async () => {
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const before = await getTabCount(page);
    expect(before).toBeGreaterThanOrEqual(3);

    await triggerMenuAction(page, 'close-others');
    await page.waitForTimeout(300);
    const after = await getTabCount(page);
    expect(after).toBe(1);
  });

  test('pin-tab — toggles pin on active tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);

    const isPinnedBefore = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const s = store.getState();
      const tab = s.tabs.find((t: any) => t.id === s.activeTabId);
      return tab?.isPinned || false;
    });

    await triggerMenuAction(page, 'pin-tab');
    await page.waitForTimeout(200);

    const isPinnedAfter = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const s = store.getState();
      const tab = s.tabs.find((t: any) => t.id === s.activeTabId);
      return tab?.isPinned || false;
    });

    expect(isPinnedAfter).toBe(!isPinnedBefore);
  });

  test('restore-last-closed — restores a closed tab', async () => {
    await triggerMenuAction(page, 'new');
    await page.waitForTimeout(200);
    const countWithNew = await getTabCount(page);
    await triggerMenuAction(page, 'close-tab');
    await page.waitForTimeout(200);
    const countAfterClose = await getTabCount(page);
    expect(countAfterClose).toBe(countWithNew - 1);

    await triggerMenuAction(page, 'restore-last-closed');
    await page.waitForTimeout(300);
    const countAfterRestore = await getTabCount(page);
    expect(countAfterRestore).toBe(countWithNew);
  });

  test('save-all — does not throw with no file paths', async () => {
    await triggerMenuAction(page, 'save-all');
    await page.waitForTimeout(300);
    const appVisible = await page.locator('.notemac-app').isVisible();
    expect(appVisible).toBe(true);
  });
});

test.describe('Tauri Menu Actions — Search Menu', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('find — opens find/replace panel', async () => {
    await triggerMenuAction(page, 'find');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('replace — opens find/replace panel', async () => {
    await triggerMenuAction(page, 'replace');
    const state = await getStoreState(page, 'showFindReplace');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('goto-line — opens go to line dialog', async () => {
    await triggerMenuAction(page, 'goto-line');
    const state = await getStoreState(page, 'showGoToLine');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('find-char-in-range — opens character in range dialog', async () => {
    await triggerMenuAction(page, 'find-char-in-range');
    const state = await getStoreState(page, 'showCharInRange');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});

test.describe('Tauri Menu Actions — View Menu', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('toggle-sidebar — toggles sidebar visibility', async () => {
    const before = await getStoreState(page, 'sidebarPanel');
    await triggerMenuAction(page, 'toggle-sidebar');
    const after = await getStoreState(page, 'sidebarPanel');
    if (before) {
      expect(after).toBeNull();
    } else {
      expect(after).toBeTruthy();
    }
    await triggerMenuAction(page, 'toggle-sidebar');
  });

  test('zoom-in — increases zoom level', async () => {
    const before = await getStoreState(page, 'zoomLevel');
    await triggerMenuAction(page, 'zoom-in');
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeGreaterThan(before);
    await triggerMenuAction(page, 'zoom-reset');
  });

  test('zoom-out — decreases zoom level', async () => {
    const before = await getStoreState(page, 'zoomLevel');
    await triggerMenuAction(page, 'zoom-out');
    const after = await getStoreState(page, 'zoomLevel');
    expect(after).toBeLessThan(before);
    await triggerMenuAction(page, 'zoom-reset');
  });

  test('zoom-reset — resets zoom to 0', async () => {
    await triggerMenuAction(page, 'zoom-in');
    await triggerMenuAction(page, 'zoom-in');
    await triggerMenuAction(page, 'zoom-reset');
    const level = await getStoreState(page, 'zoomLevel');
    expect(level).toBe(0);
  });

  test('show-summary — opens summary dialog', async () => {
    await triggerMenuAction(page, 'show-summary');
    const state = await getStoreState(page, 'showSummary');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('split-right — enables vertical split', async () => {
    await triggerMenuAction(page, 'split-right');
    await page.waitForTimeout(300);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('vertical');
    await triggerMenuAction(page, 'close-split');
    await page.waitForTimeout(200);
  });

  test('split-down — enables horizontal split', async () => {
    await triggerMenuAction(page, 'split-down');
    await page.waitForTimeout(300);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('horizontal');
    await triggerMenuAction(page, 'close-split');
    await page.waitForTimeout(200);
  });

  test('close-split — closes split view', async () => {
    await triggerMenuAction(page, 'split-right');
    await page.waitForTimeout(200);
    await triggerMenuAction(page, 'close-split');
    await page.waitForTimeout(200);
    const splitView = await getStoreState(page, 'splitView');
    expect(splitView).toBe('none');
  });

  test('distraction-free — toggles distraction free mode', async () => {
    await triggerMenuAction(page, 'distraction-free', true);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().settings.distractionFreeMode;
    });
    expect(after).toBe(true);
    await triggerMenuAction(page, 'distraction-free', false);
    await page.waitForTimeout(200);
  });
});

test.describe('Tauri Menu Actions — Encoding Menu', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  const encodings = ['utf-8', 'utf-8-bom', 'utf-16le', 'utf-16be', 'iso-8859-1', 'windows-1252'];

  for (const enc of encodings) {
    test(`encoding ${enc} — sets active tab encoding`, async () => {
      await triggerMenuAction(page, 'encoding', enc);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active?.encoding).toBe(enc);
    });
  }

  test('line-ending LF — sets line ending', async () => {
    await triggerMenuAction(page, 'line-ending', 'LF');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('LF');
  });

  test('line-ending CRLF — sets line ending', async () => {
    await triggerMenuAction(page, 'line-ending', 'CRLF');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('CRLF');
  });

  test('line-ending CR — sets line ending', async () => {
    await triggerMenuAction(page, 'line-ending', 'CR');
    const tabs = await getStoreState(page, 'tabs');
    const activeId = await getStoreState(page, 'activeTabId');
    const active = tabs.find((t: any) => t.id === activeId);
    expect(active?.lineEnding).toBe('CR');
  });
});

test.describe('Tauri Menu Actions — Language Menu', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  const languages = [
    'plaintext', 'c', 'cpp', 'csharp', 'css', 'go', 'html', 'java',
    'javascript', 'json', 'markdown', 'php', 'python', 'ruby', 'rust',
    'sql', 'swift', 'typescript', 'xml', 'yaml'
  ];

  for (const lang of languages) {
    test(`language ${lang} — sets active tab language`, async () => {
      await triggerMenuAction(page, 'language', lang);
      const tabs = await getStoreState(page, 'tabs');
      const activeId = await getStoreState(page, 'activeTabId');
      const active = tabs.find((t: any) => t.id === activeId);
      expect(active?.language).toBe(lang);
    });
  }
});

test.describe('Tauri Menu Actions — Dialogs', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('preferences — opens settings dialog', async () => {
    await triggerMenuAction(page, 'preferences');
    const state = await getStoreState(page, 'showSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('about — opens about dialog', async () => {
    await triggerMenuAction(page, 'about');
    const state = await getStoreState(page, 'showAbout');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('run-command — opens run command dialog', async () => {
    await triggerMenuAction(page, 'run-command');
    const state = await getStoreState(page, 'showRunCommand');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('column-editor — opens column editor dialog', async () => {
    await triggerMenuAction(page, 'column-editor');
    const state = await getStoreState(page, 'showColumnEditor');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('shortcut-mapper — opens shortcut mapper', async () => {
    await triggerMenuAction(page, 'shortcut-mapper');
    const state = await getStoreState(page, 'showShortcutMapper');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('command-palette — opens command palette', async () => {
    await triggerMenuAction(page, 'command-palette');
    const state = await getStoreState(page, 'showCommandPalette');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('quick-open — opens quick open', async () => {
    await triggerMenuAction(page, 'quick-open');
    const state = await getStoreState(page, 'showQuickOpen');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('compare-files — opens diff viewer', async () => {
    await triggerMenuAction(page, 'compare-files');
    const state = await getStoreState(page, 'showDiffViewer');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('snippet-manager — opens snippet manager', async () => {
    await triggerMenuAction(page, 'snippet-manager');
    const state = await getStoreState(page, 'showSnippetManager');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('toggle-terminal — toggles terminal panel', async () => {
    const before = await getStoreState(page, 'showTerminalPanel');
    await triggerMenuAction(page, 'toggle-terminal');
    const after = await getStoreState(page, 'showTerminalPanel');
    expect(after).toBe(!before);
    if (after) await triggerMenuAction(page, 'toggle-terminal');
  });

  test('clone-repository — opens clone dialog', async () => {
    await triggerMenuAction(page, 'clone-repository');
    const state = await getStoreState(page, 'showCloneDialog');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('git-settings — opens git settings', async () => {
    await triggerMenuAction(page, 'git-settings');
    const state = await getStoreState(page, 'showGitSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('ai-settings — opens AI settings', async () => {
    await triggerMenuAction(page, 'ai-settings');
    const state = await getStoreState(page, 'showAiSettings');
    expect(state).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});

test.describe('Tauri Menu Actions — Macro', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('macro-start — starts macro recording', async () => {
    await triggerMenuAction(page, 'macro-start');
    const isRecording = await getStoreState(page, 'isRecordingMacro');
    expect(isRecording).toBe(true);
    await triggerMenuAction(page, 'macro-stop');
  });

  test('macro-stop — stops macro recording', async () => {
    await triggerMenuAction(page, 'macro-start');
    await page.waitForTimeout(100);
    await triggerMenuAction(page, 'macro-stop');
    const isRecording = await getStoreState(page, 'isRecordingMacro');
    expect(isRecording).toBe(false);
  });

  test('macro-playback — plays back recorded macro', async () => {
    await triggerMenuAction(page, 'macro-start');
    await page.waitForTimeout(100);
    await triggerMenuAction(page, 'macro-stop');
    await page.waitForTimeout(100);
    await triggerMenuAction(page, 'macro-playback');
    await page.waitForTimeout(300);
    const appVisible = await page.locator('.notemac-app').isVisible();
    expect(appVisible).toBe(true);
  });
});
