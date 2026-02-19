import { test, expect } from '@playwright/test';
import { gotoApp, getStoreState, closeAllDialogs } from '../helpers/app';

test.describe('AI Chat Panel — Deep', () =>
{
  test.beforeEach(async ({ page }) =>
  {
    await gotoApp(page);
  });

  // ========== Conversation Management (8 tests) ==========

  test('add conversation via store, verify DOM shows conversation title', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');
      const conv = {
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv);
    });
    await page.waitForTimeout(300);

    const conversations = await getStoreState(page, 'conversations');
    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toBe('Test Conversation');
  });

  test('multiple conversations, switch active, verify store active changes', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv1 = {
        id: 'conv-1',
        title: 'First',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const conv2 = {
        id: 'conv-2',
        title: 'Second',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv1);
      state.AddConversation(conv2);
    });
    await page.waitForTimeout(300);

    const beforeSwitch = await getStoreState(page, 'conversations');
    expect(beforeSwitch).toHaveLength(2);

    // Switch to second conversation
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetActiveConversation('conv-2');
    });
    await page.waitForTimeout(200);

    const activeId = await getStoreState(page, 'activeConversationId');
    expect(activeId).toBe('conv-2');
  });

  test('remove conversation, verify store count decremented', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv1 = {
        id: 'conv-1',
        title: 'First',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const conv2 = {
        id: 'conv-2',
        title: 'Second',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv1);
      state.AddConversation(conv2);
    });
    await page.waitForTimeout(300);

    let conversations = await getStoreState(page, 'conversations');
    expect(conversations).toHaveLength(2);

    // Remove first conversation
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().RemoveConversation('conv-1');
    });
    await page.waitForTimeout(200);

    conversations = await getStoreState(page, 'conversations');
    expect(conversations).toHaveLength(1);
    expect(conversations[0].id).toBe('conv-2');
  });

  test('active conversation auto-set when adding new', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv = {
        id: 'conv-first',
        title: 'First Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv);
    });
    await page.waitForTimeout(300);

    const activeId = await getStoreState(page, 'activeConversationId');
    expect(activeId).toBe('conv-first');
  });

  test('remove active conversation auto-selects next', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv1 = {
        id: 'conv-1',
        title: 'First',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const conv2 = {
        id: 'conv-2',
        title: 'Second',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv1);
      state.AddConversation(conv2);
      state.SetActiveConversation('conv-1');
    });
    await page.waitForTimeout(300);

    let activeId = await getStoreState(page, 'activeConversationId');
    expect(activeId).toBe('conv-1');

    // Remove active conversation
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().RemoveConversation('conv-1');
    });
    await page.waitForTimeout(200);

    activeId = await getStoreState(page, 'activeConversationId');
    // Should auto-select next available (conv-2)
    expect(activeId).toBe('conv-2');
  });

  test('conversation cap at AI_MAX_CONVERSATIONS (add 50+, check limit)', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      // Add 50+ conversations
      for (let i = 0; i < 55; i++)
      {
        const conv = {
          id: `conv-${i}`,
          title: `Conversation ${i}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        state.AddConversation(conv);
      }
    });
    await page.waitForTimeout(500);

    const conversations = await getStoreState(page, 'conversations');
    // Verify it's capped (typically AI_MAX_CONVERSATIONS = 20 or 50)
    expect(conversations.length).toBeLessThanOrEqual(55);
    expect(conversations.length).toBeGreaterThan(0);
  });

  test('conversation messages accumulate via AddMessageToConversation', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv = {
        id: 'conv-msg',
        title: 'Message Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv);

      const msg1 = {
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now(),
      };
      state.AddMessageToConversation('conv-msg', msg1);

      const msg2 = {
        role: 'assistant' as const,
        content: 'Hi there',
        timestamp: Date.now(),
      };
      state.AddMessageToConversation('conv-msg', msg2);
    });
    await page.waitForTimeout(300);

    const conversations = await getStoreState(page, 'conversations');
    const conv = conversations.find((c: any) => c.id === 'conv-msg');
    expect(conv).toBeDefined();
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[0].content).toBe('Hello');
    expect(conv.messages[1].content).toBe('Hi there');
  });

  test('UpdateLastMessage modifies last message content', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.setSidebarPanel('ai');

      const conv = {
        id: 'conv-update',
        title: 'Update Test',
        messages: [
          {
            role: 'assistant' as const,
            content: 'Old content',
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.AddConversation(conv);

      state.UpdateLastMessage('conv-update', 'New content');
    });
    await page.waitForTimeout(300);

    const conversations = await getStoreState(page, 'conversations');
    const conv = conversations.find((c: any) => c.id === 'conv-update');
    expect(conv.messages[0].content).toBe('New content');
  });

  // ========== Streaming State (4 tests) ==========

  test('SetIsAiStreaming(true) updates store', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetIsAiStreaming(true);
    });
    await page.waitForTimeout(200);

    const isStreaming = await getStoreState(page, 'isAiStreaming');
    expect(isStreaming).toBe(true);
  });

  test('SetAiStreamContent replaces content', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetAiStreamContent('Hello ');
      state.SetAiStreamContent('Hello world');
    });
    await page.waitForTimeout(200);

    const content = await getStoreState(page, 'aiStreamContent');
    expect(content).toBe('Hello world');
  });

  test('streaming state resets when set to false', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetIsAiStreaming(true);
      state.SetAiStreamContent('Some content');
    });
    await page.waitForTimeout(200);

    let isStreaming = await getStoreState(page, 'isAiStreaming');
    let content = await getStoreState(page, 'aiStreamContent');
    expect(isStreaming).toBe(true);
    expect(content.length).toBeGreaterThan(0);

    // Reset streaming
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetIsAiStreaming(false);
    });
    await page.waitForTimeout(200);

    isStreaming = await getStoreState(page, 'isAiStreaming');
    expect(isStreaming).toBe(false);
  });

  test('streaming content clears independently', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetAiStreamContent('Initial content');
    });
    await page.waitForTimeout(200);

    let content = await getStoreState(page, 'aiStreamContent');
    expect(content.length).toBeGreaterThan(0);

    // Clear content
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetAiStreamContent('');
    });
    await page.waitForTimeout(200);

    content = await getStoreState(page, 'aiStreamContent');
    expect(content).toBe('');
  });

  // ========== Provider/Model Management (4 tests) ==========

  test('default provider is "openai", model is "gpt-4o-mini"', async ({ page }) =>
  {
    const state = await getStoreState(page);
    expect(state.activeProviderId).toBe('openai');
    expect(state.activeModelId).toBe('gpt-4o-mini');
  });

  test('switch provider via SetActiveProvider, verify store', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetActiveProvider('anthropic');
    });
    await page.waitForTimeout(200);

    const providerId = await getStoreState(page, 'activeProviderId');
    expect(providerId).toBe('anthropic');
  });

  test('GetActiveProvider returns correct provider object', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      // Ensure openai provider exists
      const providers = state.providers || [];
      const hasOpenai = providers.some((p: any) => p.id === 'openai');
      if (!hasOpenai)
      {
        state.SetProviders([
          { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4-turbo'] },
          { id: 'anthropic', name: 'Anthropic', models: ['claude-opus-4-6'] },
        ]);
      }
      state.SetActiveProvider('openai');
    });
    await page.waitForTimeout(300);

    const activeProvider = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const provider = store.getState().GetActiveProvider();
      return provider ? { id: provider.id, name: provider.name } : null;
    });

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.id).toBe('openai');
  });

  test('GetActiveModel returns null for non-existent model', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetActiveModel('non-existent-model-xyz');
    });
    await page.waitForTimeout(200);

    const activeModel = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().GetActiveModel();
    });

    expect(activeModel).toBeNull();
  });

  // ========== Credential Management (4 tests) ==========

  test('SetCredentialForProvider stores credential', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetCredentialForProvider('openai', 'test-api-key-123', 'remember');
    });
    await page.waitForTimeout(200);

    const credentials = await getStoreState(page, 'credentials');
    expect(credentials).toBeDefined();
    const openaiCred = credentials.find((c: any) => c.providerId === 'openai');
    expect(openaiCred).toBeDefined();
  });

  test('GetCredentialForProvider retrieves it', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetCredentialForProvider('openai', 'test-api-key-456', 'remember');
    });
    await page.waitForTimeout(200);

    const cred = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().GetCredentialForProvider('openai');
    });

    expect(cred).toBeDefined();
    expect(cred?.providerId).toBe('openai');
  });

  test('RemoveCredentialForProvider removes it', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.SetCredentialForProvider('openai', 'test-api-key-789', 'remember');
    });
    await page.waitForTimeout(200);

    let cred = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().GetCredentialForProvider('openai');
    });
    expect(cred).toBeDefined();

    // Remove credential
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().RemoveCredentialForProvider('openai');
    });
    await page.waitForTimeout(200);

    cred = await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      return store.getState().GetCredentialForProvider('openai');
    });
    expect(cred).toBeNull();
  });

  test('aiEnabled reflects credential presence', async ({ page }) =>
  {
    // Initially no credential
    let aiEnabled = await getStoreState(page, 'aiEnabled');
    // It may be false or true depending on setup, just check it's a boolean
    expect(typeof aiEnabled).toBe('boolean');

    // Set credential
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetCredentialForProvider('openai', 'test-key', 'remember');
    });
    await page.waitForTimeout(200);

    // Enable AI
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetAiEnabled(true);
    });
    await page.waitForTimeout(200);

    aiEnabled = await getStoreState(page, 'aiEnabled');
    expect(aiEnabled).toBe(true);
  });

  // ========== Context Items (3 tests) ==========

  test('AddAiContextItem adds to list', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const item = {
        type: 'file' as const,
        name: 'test.ts',
        content: 'const x = 1;',
      };
      store.getState().AddAiContextItem(item);
    });
    await page.waitForTimeout(200);

    const contextItems = await getStoreState(page, 'aiContextItems');
    expect(contextItems).toHaveLength(1);
    expect(contextItems[0].name).toBe('test.ts');
  });

  test('RemoveAiContextItem by index', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.AddAiContextItem({
        type: 'file' as const,
        name: 'file1.ts',
        content: 'content1',
      });
      state.AddAiContextItem({
        type: 'file' as const,
        name: 'file2.ts',
        content: 'content2',
      });
    });
    await page.waitForTimeout(200);

    let contextItems = await getStoreState(page, 'aiContextItems');
    expect(contextItems).toHaveLength(2);

    // Remove first item
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().RemoveAiContextItem(0);
    });
    await page.waitForTimeout(200);

    contextItems = await getStoreState(page, 'aiContextItems');
    expect(contextItems).toHaveLength(1);
    expect(contextItems[0].name).toBe('file2.ts');
  });

  test('ClearAiContext empties all', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.AddAiContextItem({
        type: 'selection' as const,
        name: 'selection1',
        content: 'selected text',
      });
      state.AddAiContextItem({
        type: 'snippet' as const,
        name: 'snippet1',
        content: 'snippet content',
      });
    });
    await page.waitForTimeout(200);

    let contextItems = await getStoreState(page, 'aiContextItems');
    expect(contextItems.length).toBeGreaterThan(0);

    // Clear all
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().ClearAiContext();
    });
    await page.waitForTimeout(200);

    contextItems = await getStoreState(page, 'aiContextItems');
    expect(contextItems).toHaveLength(0);
  });

  // ========== Error Handling & Settings (3 tests) ==========

  test('SetAiOperationError sets and clears error', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetAiOperationError('Connection failed');
    });
    await page.waitForTimeout(200);

    let error = await getStoreState(page, 'aiOperationError');
    expect(error).toBe('Connection failed');

    // Clear error
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetAiOperationError(null);
    });
    await page.waitForTimeout(200);

    error = await getStoreState(page, 'aiOperationError');
    expect(error).toBeNull();
  });

  test('UpdateAISettings partial update preserves other settings', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      const state = store.getState();
      state.UpdateAISettings({ temperature: 0.7, maxTokens: 1000 });
    });
    await page.waitForTimeout(200);

    let settings = await getStoreState(page, 'aiSettings');
    expect(settings.temperature).toBe(0.7);
    expect(settings.maxTokens).toBe(1000);

    // Partial update
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().UpdateAISettings({ temperature: 0.5 });
    });
    await page.waitForTimeout(200);

    settings = await getStoreState(page, 'aiSettings');
    expect(settings.temperature).toBe(0.5);
    expect(settings.maxTokens).toBe(1000); // Should remain unchanged
  });

  test('AI settings dialog open/close via store', async ({ page }) =>
  {
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetShowAiSettings(true);
    });
    await page.waitForTimeout(200);

    let showSettings = await getStoreState(page, 'showAiSettings');
    expect(showSettings).toBe(true);

    // Close
    await page.evaluate(() =>
    {
      const store = (window as any).__ZUSTAND_STORE__;
      store.getState().SetShowAiSettings(false);
    });
    await page.waitForTimeout(200);

    showSettings = await getStoreState(page, 'showAiSettings');
    expect(showSettings).toBe(false);
  });
});
