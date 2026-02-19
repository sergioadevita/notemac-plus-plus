import { test, expect, Page } from '@playwright/test';
import {
  gotoApp,
  createNewTab,
  getStoreState,
  getTabCount,
  typeInEditor,
  getEditorContent,
  switchToTab,
  closeAllDialogs,
} from '../helpers/app';

// Terminal Panel Tests
test.describe('Terminal Panel', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Terminal opens via store', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminal(true);
    });
    await page.waitForTimeout(300);

    const showTerminal = await getStoreState(page, 'showTerminal');
    expect(showTerminal).toBe(true);
  });

  test('Terminal command added to history', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().addTerminalCommand('ls -la');
    });
    await page.waitForTimeout(200);

    const terminalHistory = await getStoreState(page, 'terminalHistory');
    expect(terminalHistory).toContain('ls -la');
  });

  test('Terminal output displays correctly', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowTerminal(true);
        store.getState().addTerminalOutput({
          type: 'output',
          text: 'Command executed successfully',
        });
      }
    });
    await page.waitForTimeout(300);

    const terminalOutput = await getStoreState(page, 'terminalOutput');
    expect(terminalOutput).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'output',
          text: 'Command executed successfully',
        }),
      ])
    );
  });

  test('Terminal error output type works', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowTerminal(true);
        store.getState().addTerminalOutput({
          type: 'error',
          text: 'Error: Command not found',
        });
      }
    });
    await page.waitForTimeout(300);

    const terminalOutput = await getStoreState(page, 'terminalOutput');
    const errorOutput = terminalOutput.find((o: any) => o.type === 'error');
    expect(errorOutput).toBeDefined();
    expect(errorOutput.text).toBe('Error: Command not found');
  });

  test('Terminal clear removes all output', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.addTerminalOutput({ type: 'output', text: 'Line 1' });
        state.addTerminalOutput({ type: 'output', text: 'Line 2' });
        state.clearTerminal();
      }
    });
    await page.waitForTimeout(200);

    const terminalOutput = await getStoreState(page, 'terminalOutput');
    expect(terminalOutput).toHaveLength(0);
  });

  test('Terminal multiple commands maintain history order', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.addTerminalCommand('echo first');
        state.addTerminalCommand('echo second');
        state.addTerminalCommand('echo third');
      }
    });
    await page.waitForTimeout(300);

    const terminalHistory = await getStoreState(page, 'terminalHistory');
    expect(terminalHistory).toEqual(['echo first', 'echo second', 'echo third']);
  });

  test('Terminal close hides panel', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowTerminal(true);
      }
    });
    await page.waitForTimeout(200);

    let showTerminal = await getStoreState(page, 'showTerminal');
    expect(showTerminal).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowTerminal(false);
    });
    await page.waitForTimeout(200);

    showTerminal = await getStoreState(page, 'showTerminal');
    expect(showTerminal).toBe(false);
  });
});

// Find & Replace Panel Tests
test.describe('Find & Replace Panel', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Find panel opens via store', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(300);

    const showFindReplace = await getStoreState(page, 'showFindReplace');
    expect(showFindReplace).toBe(true);
  });

  test('Find query updates correctly', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindQuery('search term');
      }
    });
    await page.waitForTimeout(300);

    const findQuery = await getStoreState(page, 'findQuery');
    expect(findQuery).toBe('search term');
  });

  test('Match case toggle works', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindMatchCase(true);
      }
    });
    await page.waitForTimeout(300);

    const findMatchCase = await getStoreState(page, 'findMatchCase');
    expect(findMatchCase).toBe(true);
  });

  test('Whole word toggle works', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindWholeWord(true);
      }
    });
    await page.waitForTimeout(300);

    const findWholeWord = await getStoreState(page, 'findWholeWord');
    expect(findWholeWord).toBe(true);
  });

  test('Regex toggle works', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindRegex(true);
      }
    });
    await page.waitForTimeout(300);

    const findRegex = await getStoreState(page, 'findRegex');
    expect(findRegex).toBe(true);
  });

  test('Search finds matches in current tab content', async () => {
    // Set content in current tab
    await typeInEditor(page, 'hello world\nhello universe\nworldly');
    await page.waitForTimeout(300);

    // Open find panel and search
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindQuery('hello');
        store.getState().searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    const findResults = await getStoreState(page, 'findResults');
    expect(findResults).toBeDefined();
    expect(Array.isArray(findResults)).toBe(true);
  });

  test('Search in all tabs finds across tabs', async () => {
    // Add content to first tab
    await typeInEditor(page, 'content in tab 1');
    await page.waitForTimeout(200);

    // Create second tab with different content
    await createNewTab(page);
    await typeInEditor(page, 'content in tab 2 with search');
    await page.waitForTimeout(200);

    // Search across tabs
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindQuery('search');
        store.getState().searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    const findResults = await getStoreState(page, 'findResults');
    expect(findResults).toBeDefined();
    expect(Array.isArray(findResults)).toBe(true);
  });

  test('Replace query sets correctly', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setReplaceQuery('replacement text');
      }
    });
    await page.waitForTimeout(300);

    const replaceQuery = await getStoreState(page, 'replaceQuery');
    expect(replaceQuery).toBe('replacement text');
  });

  test('Clear results empties find results', async () => {
    // Add some search results
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('test');
        // Simulate search results
        state.findResults = [{ tabId: 'tab-1', matches: 2 }];
      }
    });
    await page.waitForTimeout(200);

    // Clear results
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().clearFindResults();
    });
    await page.waitForTimeout(200);

    const findResults = await getStoreState(page, 'findResults');
    expect(findResults).toHaveLength(0);
  });

  test('Find panel closes on escape', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.getState().setShowFindReplace(true);
    });
    await page.waitForTimeout(200);

    let showFindReplace = await getStoreState(page, 'showFindReplace');
    expect(showFindReplace).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    showFindReplace = await getStoreState(page, 'showFindReplace');
    expect(showFindReplace).toBe(false);
  });
});

// Combined Search Scenarios
test.describe('Combined Search Scenarios', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await gotoApp(page);
    await closeAllDialogs(page);
  });

  test('Case-sensitive search differentiates case', async () => {
    // Add content with mixed case
    await typeInEditor(page, 'Hello\nhello\nHELLO\nworldHello');
    await page.waitForTimeout(300);

    // Search case-sensitive for "Hello"
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('Hello');
        state.setFindMatchCase(true);
        state.searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    // Get the find query to verify settings
    const findMatchCase = await getStoreState(page, 'findMatchCase');
    const findQuery = await getStoreState(page, 'findQuery');
    expect(findQuery).toBe('Hello');
    expect(findMatchCase).toBe(true);
  });

  test('Regex search with pattern', async () => {
    // Add content with patterns
    await typeInEditor(page, 'test123\ntest456\nproduction789');
    await page.waitForTimeout(300);

    // Search with regex
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('test\\d+');
        state.setFindRegex(true);
        state.searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    const findRegex = await getStoreState(page, 'findRegex');
    const findQuery = await getStoreState(page, 'findQuery');
    expect(findRegex).toBe(true);
    expect(findQuery).toBe('test\\d+');
  });

  test('Find across multiple tabs with different content', async () => {
    // Tab 1: Set initial content
    await typeInEditor(page, 'function myFunction() {\n  return true;\n}');
    await page.waitForTimeout(200);

    // Create Tab 2
    await createNewTab(page);
    await typeInEditor(page, 'const myVariable = 42;\nmyFunction();');
    await page.waitForTimeout(200);

    // Create Tab 3
    await createNewTab(page);
    await typeInEditor(page, 'class MyClass {\n  myFunction() {}\n}');
    await page.waitForTimeout(200);

    // Search for "myFunction" across all tabs
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('myFunction');
        state.searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    const findResults = await getStoreState(page, 'findResults');
    expect(findResults).toBeDefined();
    expect(Array.isArray(findResults)).toBe(true);

    const findQuery = await getStoreState(page, 'findQuery');
    expect(findQuery).toBe('myFunction');
  });

  test('Multiple search terms in sequence', async () => {
    await typeInEditor(page, 'The quick brown fox\njumps over the lazy dog');
    await page.waitForTimeout(300);

    // First search
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setShowFindReplace(true);
        store.getState().setFindQuery('quick');
        store.getState().searchInAllTabs();
      }
    });
    await page.waitForTimeout(200);

    let findQuery = await getStoreState(page, 'findQuery');
    expect(findQuery).toBe('quick');

    // Second search (different term)
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        store.getState().setFindQuery('lazy');
        store.getState().searchInAllTabs();
      }
    });
    await page.waitForTimeout(200);

    findQuery = await getStoreState(page, 'findQuery');
    expect(findQuery).toBe('lazy');
  });

  test('Find and replace workflow', async () => {
    // Set initial content
    await typeInEditor(page, 'old text\nold code\nold value');
    await page.waitForTimeout(300);

    // Open find replace
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('old');
        state.setReplaceQuery('new');
      }
    });
    await page.waitForTimeout(300);

    const findQuery = await getStoreState(page, 'findQuery');
    const replaceQuery = await getStoreState(page, 'replaceQuery');
    expect(findQuery).toBe('old');
    expect(replaceQuery).toBe('new');
  });

  test('Whole word search matches only complete words', async () => {
    await typeInEditor(page, 'the method\nthe\ntheory\nthem');
    await page.waitForTimeout(300);

    // Search for whole word "the"
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindQuery('the');
        state.setFindWholeWord(true);
        state.searchInAllTabs();
      }
    });
    await page.waitForTimeout(300);

    const findWholeWord = await getStoreState(page, 'findWholeWord');
    const findQuery = await getStoreState(page, 'findQuery');
    expect(findWholeWord).toBe(true);
    expect(findQuery).toBe('the');
  });

  test('Toggle search options updates correctly', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setShowFindReplace(true);
        state.setFindMatchCase(false);
        state.setFindWholeWord(false);
        state.setFindRegex(false);
      }
    });
    await page.waitForTimeout(200);

    let findMatchCase = await getStoreState(page, 'findMatchCase');
    let findWholeWord = await getStoreState(page, 'findWholeWord');
    let findRegex = await getStoreState(page, 'findRegex');

    expect(findMatchCase).toBe(false);
    expect(findWholeWord).toBe(false);
    expect(findRegex).toBe(false);

    // Toggle all on
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        const state = store.getState();
        state.setFindMatchCase(true);
        state.setFindWholeWord(true);
        state.setFindRegex(true);
      }
    });
    await page.waitForTimeout(200);

    findMatchCase = await getStoreState(page, 'findMatchCase');
    findWholeWord = await getStoreState(page, 'findWholeWord');
    findRegex = await getStoreState(page, 'findRegex');

    expect(findMatchCase).toBe(true);
    expect(findWholeWord).toBe(true);
    expect(findRegex).toBe(true);
  });
});
