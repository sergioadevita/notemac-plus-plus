import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, getMainWindow, getStoreState, triggerMenuAction } from '../helpers/electron-app';

/**
 * AI feature tests for Electron.
 * Tests AI state management, conversations, inline suggestions, and provider management.
 */

test.describe('Electron AI — State Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('AI is disabled by default', async () => {
    const state = await getStoreState(page);
    expect(state.aiEnabled).toBe(false);
  });

  test('AI can be enabled/disabled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setAIEnabled(true);
    });
    let state = await getStoreState(page);
    expect(state.aiEnabled).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setAIEnabled(false);
    });
    state = await getStoreState(page);
    expect(state.aiEnabled).toBe(false);
  });

  test('built-in providers are available', async () => {
    const state = await getStoreState(page);
    expect(state.aiProviders).toBeTruthy();
    expect(Array.isArray(state.aiProviders)).toBe(true);
    expect(state.aiProviders.length).toBeGreaterThan(0);
    const providerNames = state.aiProviders.map((p: any) => p.name);
    expect(providerNames).toContain('OpenAI');
  });

  test('active provider can be changed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const providers = store?.getState()?.aiProviders;
      if (providers?.length > 0) {
        store?.getState()?.setActiveProvider(providers[0].id);
      }
    });
    const state = await getStoreState(page);
    expect(state.activeProviderId).toBeTruthy();
  });

  test('active model can be changed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setActiveModel('gpt-4');
    });
    const state = await getStoreState(page);
    expect(state.activeModel).toBe('gpt-4');
  });

  test('ai-settings dialog opens', async () => {
    await triggerMenuAction(electronApp, 'ai-settings');
    const state = await getStoreState(page);
    expect(state.showAISettings).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setShowAISettings(false);
    });
  });
});

test.describe('Electron AI — Conversations', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('no conversations exist initially', async () => {
    const state = await getStoreState(page);
    expect(state.aiConversations).toEqual([]);
  });

  test('add conversation creates a new one', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.addConversation('Test Conversation');
    });
    const state = await getStoreState(page);
    expect(state.aiConversations.length).toBe(1);
    expect(state.aiConversations[0].title).toBe('Test Conversation');
    expect(state.aiConversations[0].messages).toEqual([]);
  });

  test('add user message to conversation', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const convId = store?.getState()?.aiConversations[0]?.id;
      if (convId) {
        store?.getState()?.addMessage(convId, { role: 'user', content: 'Hello AI' });
      }
    });
    const state = await getStoreState(page);
    expect(state.aiConversations[0].messages.length).toBe(1);
    expect(state.aiConversations[0].messages[0].role).toBe('user');
    expect(state.aiConversations[0].messages[0].content).toBe('Hello AI');
  });

  test('add assistant message to conversation', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const convId = store?.getState()?.aiConversations[0]?.id;
      if (convId) {
        store?.getState()?.addMessage(convId, { role: 'assistant', content: 'Hello human!' });
      }
    });
    const state = await getStoreState(page);
    expect(state.aiConversations[0].messages.length).toBe(2);
    expect(state.aiConversations[0].messages[1].role).toBe('assistant');
  });

  test('update last message simulates streaming', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const convId = store?.getState()?.aiConversations[0]?.id;
      if (convId) {
        store?.getState()?.updateLastMessage(convId, 'Hello human! How can I help?');
      }
    });
    const state = await getStoreState(page);
    const lastMsg = state.aiConversations[0].messages[state.aiConversations[0].messages.length - 1];
    expect(lastMsg.content).toBe('Hello human! How can I help?');
  });

  test('streaming state can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setIsStreaming(true);
    });
    let state = await getStoreState(page);
    expect(state.isStreaming).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setIsStreaming(false);
    });
    state = await getStoreState(page);
    expect(state.isStreaming).toBe(false);
  });

  test('remove conversation', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const convId = store?.getState()?.aiConversations[0]?.id;
      if (convId) store?.getState()?.removeConversation(convId);
    });
    const state = await getStoreState(page);
    expect(state.aiConversations.length).toBe(0);
  });
});

test.describe('Electron AI — Inline Suggestions & Context', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('inline suggestion is enabled by default', async () => {
    const state = await getStoreState(page);
    expect(state.inlineSuggestionsEnabled).toBe(true);
  });

  test('inline suggestion can be disabled and re-enabled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setInlineSuggestionsEnabled(false);
    });
    let state = await getStoreState(page);
    expect(state.inlineSuggestionsEnabled).toBe(false);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setInlineSuggestionsEnabled(true);
    });
    state = await getStoreState(page);
    expect(state.inlineSuggestionsEnabled).toBe(true);
  });

  test('set and clear inline suggestion', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setCurrentSuggestion('console.log("hello")');
    });
    let state = await getStoreState(page);
    expect(state.currentSuggestion).toBe('console.log("hello")');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setCurrentSuggestion(null);
    });
    state = await getStoreState(page);
    expect(state.currentSuggestion).toBeNull();
  });

  test('add and remove context items', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.addContextItem({ type: 'file', path: '/test.ts', content: 'const x = 1;' });
    });
    let state = await getStoreState(page);
    expect(state.contextItems.length).toBe(1);
    expect(state.contextItems[0].type).toBe('file');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const itemId = store?.getState()?.contextItems[0]?.id;
      if (itemId) store?.getState()?.removeContextItem(itemId);
    });
    state = await getStoreState(page);
    expect(state.contextItems.length).toBe(0);
  });

  test('operation error can be set and cleared', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setAIError('API rate limit exceeded');
    });
    let state = await getStoreState(page);
    expect(state.aiError).toBe('API rate limit exceeded');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.setAIError(null);
    });
    state = await getStoreState(page);
    expect(state.aiError).toBeNull();
  });
});

test.describe('Electron AI — Provider Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchElectronApp();
    page = await getMainWindow(electronApp);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('custom provider can be added', async () => {
    const before = await getStoreState(page);
    const countBefore = before.aiProviders.length;

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.addCustomProvider({
        name: 'Local LLM',
        baseUrl: 'http://localhost:11434',
        models: ['llama3'],
        isBuiltIn: false,
      });
    });

    const state = await getStoreState(page);
    expect(state.aiProviders.length).toBe(countBefore + 1);
    const custom = state.aiProviders.find((p: any) => p.name === 'Local LLM');
    expect(custom).toBeTruthy();
  });

  test('custom provider can be removed', async () => {
    const before = await getStoreState(page);
    const custom = before.aiProviders.find((p: any) => p.name === 'Local LLM');

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.removeProvider(id);
    }, custom.id);

    const state = await getStoreState(page);
    const found = state.aiProviders.find((p: any) => p.name === 'Local LLM');
    expect(found).toBeFalsy();
  });

  test('credential can be set and removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const providers = store?.getState()?.aiProviders;
      if (providers?.length > 0) {
        store?.getState()?.setProviderCredential(providers[0].id, 'sk-test-key-123');
      }
    });

    let state = await getStoreState(page);
    const cred = state.aiCredentials?.[state.aiProviders[0].id];
    expect(cred).toBeTruthy();

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      const providers = store?.getState()?.aiProviders;
      if (providers?.length > 0) {
        store?.getState()?.removeProviderCredential(providers[0].id);
      }
    });

    state = await getStoreState(page);
    const credAfter = state.aiCredentials?.[state.aiProviders[0].id];
    expect(credAfter).toBeFalsy();
  });
});
