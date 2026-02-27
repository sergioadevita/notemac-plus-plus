import { test, expect, Page, BrowserContext } from '@playwright/test';
import { launchTauriApp, closeTauriApp, triggerMenuAction, getStoreState } from '../helpers/tauri-app';

/**
 * AI feature functional tests.
 * Tests AI state management, conversation handling, provider config, and inline suggestions.
 * These tests operate on the Zustand store directly since there's no real LLM backend.
 */

test.describe('Tauri AI — State Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('AI is disabled by default', async () => {
    const state = await getStoreState(page);
    expect(state.aiEnabled).toBe(false);
  });

  test('AI can be enabled/disabled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetAiEnabled(true);
    });

    let state = await getStoreState(page);
    expect(state.aiEnabled).toBe(true);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetAiEnabled(false);
    });

    state = await getStoreState(page);
    expect(state.aiEnabled).toBe(false);
  });

  test('built-in providers are available', async () => {
    const state = await getStoreState(page);
    expect(state.providers).toBeTruthy();
    expect(state.providers.length).toBeGreaterThan(0);
    // Should have at least openai and anthropic
    const providerIds = state.providers.map((p: any) => p.id);
    expect(providerIds).toContain('openai');
  });

  test('active provider can be changed', async () => {
    const state = await getStoreState(page);
    const firstProvider = state.providers[0];

    await page.evaluate((id: string) => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetActiveProvider(id);
    }, firstProvider.id);

    const newState = await getStoreState(page);
    expect(newState.activeProviderId).toBe(firstProvider.id);
  });

  test('active model can be changed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetActiveModel('test-model-123');
    });

    const state = await getStoreState(page);
    expect(state.activeModelId).toBe('test-model-123');
  });

  test('ai-settings dialog opens', async () => {
    await triggerMenuAction(page, 'ai-settings');
    await page.waitForTimeout(200);

    const state = await getStoreState(page);
    expect(state.showAiSettings).toBe(true);

    // Close it
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetShowAiSettings(false);
    });
  });
});

test.describe('Tauri AI — Conversations', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('no conversations exist initially', async () => {
    const state = await getStoreState(page);
    expect(state.conversations).toBeTruthy();
    expect(state.conversations.length).toBe(0);
    expect(state.activeConversationId).toBeNull();
  });

  test('conversation can be added', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddConversation({
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        providerId: 'openai',
        modelId: 'gpt-4o-mini',
      });
    });

    const state = await getStoreState(page);
    expect(state.conversations.length).toBe(1);
    expect(state.conversations[0].id).toBe('conv-1');
    expect(state.activeConversationId).toBe('conv-1');
  });

  test('message can be added to conversation', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddMessageToConversation('conv-1', {
        id: 'msg-1',
        role: 'user',
        content: 'Hello AI!',
        timestamp: Date.now(),
      });
    });

    const state = await getStoreState(page);
    const conv = state.conversations.find((c: any) => c.id === 'conv-1');
    expect(conv.messages.length).toBe(1);
    expect(conv.messages[0].content).toBe('Hello AI!');
    expect(conv.messages[0].role).toBe('user');
  });

  test('assistant message can be added', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddMessageToConversation('conv-1', {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello! How can I help?',
        timestamp: Date.now(),
      });
    });

    const state = await getStoreState(page);
    const conv = state.conversations.find((c: any) => c.id === 'conv-1');
    expect(conv.messages.length).toBe(2);
    expect(conv.messages[1].role).toBe('assistant');
  });

  test('last message content can be updated (streaming)', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.UpdateLastMessage('conv-1', 'Updated streaming content...');
    });

    const state = await getStoreState(page);
    const conv = state.conversations.find((c: any) => c.id === 'conv-1');
    expect(conv.messages[conv.messages.length - 1].content).toBe('Updated streaming content...');
  });

  test('streaming state can be toggled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetIsAiStreaming(true);
      store?.getState()?.SetAiStreamContent('partial response...');
    });

    let state = await getStoreState(page);
    expect(state.isAiStreaming).toBe(true);
    expect(state.aiStreamContent).toBe('partial response...');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetIsAiStreaming(false);
      store?.getState()?.SetAiStreamContent('');
    });

    state = await getStoreState(page);
    expect(state.isAiStreaming).toBe(false);
  });

  test('conversation can be removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveConversation('conv-1');
    });

    const state = await getStoreState(page);
    expect(state.conversations.length).toBe(0);
  });

  test('active conversation switches on removal', async () => {
    // Add 2 conversations
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddConversation({
        id: 'conv-a', title: 'A', messages: [], createdAt: Date.now(), updatedAt: Date.now(), providerId: 'openai', modelId: 'gpt-4',
      });
      store?.getState()?.AddConversation({
        id: 'conv-b', title: 'B', messages: [], createdAt: Date.now(), updatedAt: Date.now(), providerId: 'openai', modelId: 'gpt-4',
      });
    });

    let state = await getStoreState(page);
    expect(state.activeConversationId).toBe('conv-b');

    // Remove active one
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveConversation('conv-b');
    });

    state = await getStoreState(page);
    expect(state.activeConversationId).toBe('conv-a');
  });
});

test.describe('Tauri AI — Inline Suggestions & Context', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('inline suggestion is enabled by default', async () => {
    const state = await getStoreState(page);
    expect(state.inlineSuggestionEnabled).toBe(true);
  });

  test('inline suggestion can be disabled/enabled', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetInlineSuggestionEnabled(false);
    });

    let state = await getStoreState(page);
    expect(state.inlineSuggestionEnabled).toBe(false);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetInlineSuggestionEnabled(true);
    });

    state = await getStoreState(page);
    expect(state.inlineSuggestionEnabled).toBe(true);
  });

  test('inline suggestion can be set and cleared', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCurrentInlineSuggestion({
        text: 'function hello() {}',
        position: { lineNumber: 1, column: 1 },
        providerId: 'openai',
      });
    });

    let state = await getStoreState(page);
    expect(state.currentInlineSuggestion).toBeTruthy();
    expect(state.currentInlineSuggestion.text).toBe('function hello() {}');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCurrentInlineSuggestion(null);
    });

    state = await getStoreState(page);
    expect(state.currentInlineSuggestion).toBeNull();
  });

  test('AI context items can be added and removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddAiContextItem({ type: 'file', name: 'test.ts', content: 'const x = 1;' });
      store?.getState()?.AddAiContextItem({ type: 'selection', name: 'selected text', content: 'hello' });
    });

    let state = await getStoreState(page);
    expect(state.aiContextItems.length).toBe(2);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveAiContextItem(0);
    });

    state = await getStoreState(page);
    expect(state.aiContextItems.length).toBe(1);
    expect(state.aiContextItems[0].name).toBe('selected text');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.ClearAiContext();
    });

    state = await getStoreState(page);
    expect(state.aiContextItems.length).toBe(0);
  });

  test('commit message draft can be set', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCommitMessageDraft('feat: add new feature');
    });

    const state = await getStoreState(page);
    expect(state.commitMessageDraft).toBe('feat: add new feature');
  });

  test('AI operation error can be set and cleared', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetAiOperationError('API rate limit exceeded');
    });

    let state = await getStoreState(page);
    expect(state.aiOperationError).toBe('API rate limit exceeded');

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetAiOperationError(null);
    });

    state = await getStoreState(page);
    expect(state.aiOperationError).toBeNull();
  });
});

test.describe('Tauri AI — Provider Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    ({ context, page } = await launchTauriApp());
  });

  test.afterAll(async () => {
    await closeTauriApp(context);
  });

  test('custom provider can be added', async () => {
    const before = await getStoreState(page);
    const beforeCount = before.providers.length;

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.AddProvider({
        id: 'custom-provider',
        name: 'Custom LLM',
        baseUrl: 'http://localhost:8080',
        isBuiltIn: false,
        models: [{ id: 'custom-model', name: 'Custom Model', providerId: 'custom-provider', contextWindow: 4096, supportsStreaming: true, supportsFIM: false }],
      });
    });

    const after = await getStoreState(page);
    expect(after.providers.length).toBe(beforeCount + 1);
    expect(after.providers.find((p: any) => p.id === 'custom-provider')).toBeTruthy();
  });

  test('custom provider can be removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveProvider('custom-provider');
    });

    const state = await getStoreState(page);
    expect(state.providers.find((p: any) => p.id === 'custom-provider')).toBeFalsy();
  });

  test('built-in provider cannot be removed', async () => {
    const before = await getStoreState(page);
    const builtInId = before.providers.find((p: any) => p.isBuiltIn)?.id;

    if (builtInId) {
      await page.evaluate((id: string) => {
        const store = (window as any).__ZUSTAND_STORE__;
        store?.getState()?.RemoveProvider(id);
      }, builtInId);

      const after = await getStoreState(page);
      expect(after.providers.find((p: any) => p.id === builtInId)).toBeTruthy();
    }
  });

  test('credential can be set for provider', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.SetCredentialForProvider('openai', 'sk-test-key-123', false);
    });

    const state = await getStoreState(page);
    const cred = state.credentials.find((c: any) => c.providerId === 'openai');
    expect(cred).toBeTruthy();
    expect(cred.apiKey).toBe('sk-test-key-123');
  });

  test('credential can be removed', async () => {
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      store?.getState()?.RemoveCredentialForProvider('openai');
    });

    const state = await getStoreState(page);
    const cred = state.credentials.find((c: any) => c.providerId === 'openai');
    expect(cred).toBeFalsy();
  });
});
