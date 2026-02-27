import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AIMessage, AIConversation } from '../Notemac/Commons/Types';

// ============================================================
// Mocks
// ============================================================

vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../Notemac/Controllers/LLMController', () => ({
  SendChatCompletion: vi.fn(),
  BuildContextString: vi.fn(),
  ExtractCodeBlocks: vi.fn(),
  CancelActiveRequest: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
  Dispatch: vi.fn(),
  NOTEMAC_EVENTS: {
    AI_STREAM_CHUNK: 'ai-stream-chunk',
    AI_RESPONSE_COMPLETE: 'ai-response-complete',
    AI_ERROR: 'ai-error',
  },
}));

vi.mock('../Shared/Helpers/IdHelpers', () => ({
  generateId: vi.fn(() => 'test-id-' + Math.random().toString(36).substring(7)),
}));

// ============================================================
// Imports after mocking
// ============================================================

import { useNotemacStore } from '../Notemac/Model/Store';
import {
  SendChatCompletion,
  BuildContextString,
  ExtractCodeBlocks,
} from '../Notemac/Controllers/LLMController';
import { Dispatch, NOTEMAC_EVENTS } from '../Shared/EventDispatcher/EventDispatcher';
import { generateId } from '../Shared/Helpers/IdHelpers';
import {
  SendChatMessage,
  ExplainCode,
  RefactorCode,
  GenerateTests,
  GenerateDocumentation,
  FixError,
  SimplifyCode,
  ConvertLanguage,
  GenerateCommitMessage,
} from '../Notemac/Controllers/AIActionController';

// ============================================================
// Helper Functions
// ============================================================

function createMockStore() {
  return {
    activeConversationId: null as string | null,
    conversations: [] as AIConversation[],
    activeModelId: 'gpt-4',
    activeProviderId: 'openai',
    aiContextItems: [] as any[],
    aiSettings: {
      chatTemperature: 0.7,
      codeTemperature: 0.5,
      systemPrompt: '',
    },
    AddConversation: vi.fn(),
    AddMessageToConversation: vi.fn(),
    UpdateLastMessage: vi.fn(),
    SetIsAiStreaming: vi.fn(),
    SetAiStreamContent: vi.fn(),
    SetAiOperationError: vi.fn(),
    SetCommitMessageDraft: vi.fn(),
    SaveAIState: vi.fn(),
    setSidebarPanel: vi.fn(),
  };
}

function createMockCodeBlock(code: string, language: string = 'typescript') {
  return { language, code };
}

// ============================================================
// Tests: SendChatMessage
// ============================================================

describe('AIActionController — SendChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new conversation when activeConversationId is null', async () => {
    const mockStore = createMockStore();
    mockStore.activeConversationId = null;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Hello AI');

    expect(mockStore.AddConversation).toHaveBeenCalledOnce();
    const call = (mockStore.AddConversation as any).mock.calls[0][0];
    expect(call.title).toBe('Hello AI');
    expect(call.messages).toEqual([]);
    expect(call.modelId).toBe('gpt-4');
    expect(call.providerId).toBe('openai');
  });

  it('uses existing conversation when activeConversationId is set', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-123';
    mockStore.activeConversationId = convId;
    const conversation: AIConversation = {
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    };
    mockStore.conversations = [conversation];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Hello');

    expect(mockStore.AddConversation).not.toHaveBeenCalled();
    expect(mockStore.AddMessageToConversation).toHaveBeenCalledWith(
      convId,
      expect.objectContaining({ role: 'user', content: 'Hello' })
    );
  });

  it('truncates long conversation titles to 50 characters', async () => {
    const mockStore = createMockStore();
    mockStore.activeConversationId = null;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const longMessage = 'a'.repeat(100);
    await SendChatMessage(longMessage);

    const call = (mockStore.AddConversation as any).mock.calls[0][0];
    expect(call.title.length).toBeLessThanOrEqual(53); // 50 chars + '...'
    expect(call.title.endsWith('...')).toBe(true);
  });

  it('adds user message to conversation', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-456';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test message');

    const userMsgCall = (mockStore.AddMessageToConversation as any).mock.calls[0];
    expect(userMsgCall[0]).toBe(convId);
    expect(userMsgCall[1]).toEqual(
      expect.objectContaining({
        role: 'user',
        content: 'Test message',
      })
    );
  });

  it('includes context as system message when non-empty', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-789';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('Important context here');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Hello');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0]).toEqual({
      role: 'system',
      content: expect.stringContaining('Important context here'),
    });
  });

  it('skips system message when context is empty', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-999';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Hello');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0]).not.toEqual(
      expect.objectContaining({ role: 'system' })
    );
  });

  it('adds placeholder assistant message before streaming', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-111';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    const addMsgCalls = (mockStore.AddMessageToConversation as any).mock.calls;
    const assistantMsgCall = addMsgCalls.find(
      call => call[1].role === 'assistant'
    );
    expect(assistantMsgCall).toBeDefined();
    expect(assistantMsgCall[1]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        content: '',
      })
    );
  });

  it('sets streaming state to true before completion', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-222';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(true);
  });

  it('updates stream content on chunk callback', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-333';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');

    let onChunk: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, chunk: any) => {
        onChunk = chunk;
        return Promise.resolve('');
      }
    );
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    if (onChunk) {
      onChunk('Hello ');
      expect(mockStore.SetAiStreamContent).toHaveBeenCalledWith('Hello ');
      expect(mockStore.UpdateLastMessage).toHaveBeenCalledWith(
        convId,
        'Hello '
      );

      onChunk('world');
      expect(mockStore.SetAiStreamContent).toHaveBeenCalledWith('Hello world');
      expect(mockStore.UpdateLastMessage).toHaveBeenCalledWith(
        convId,
        'Hello world'
      );
    }
  });

  it('dispatches AI_STREAM_CHUNK event on chunk', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-444';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');

    let onChunk: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, chunk: any) => {
        onChunk = chunk;
        return Promise.resolve('');
      }
    );
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    if (onChunk) {
      onChunk('chunk');
      expect(Dispatch).toHaveBeenCalledWith(
        NOTEMAC_EVENTS.AI_STREAM_CHUNK,
        expect.objectContaining({ text: 'chunk' })
      );
    }
  });

  it('dispatches AI_RESPONSE_COMPLETE event on completion', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-555';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');

    let onDone: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, _chunk: any, done: any) => {
        onDone = done;
        return Promise.resolve('Final response');
      }
    );
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    if (onDone) {
      onDone('Final response');
      expect(Dispatch).toHaveBeenCalledWith(
        NOTEMAC_EVENTS.AI_RESPONSE_COMPLETE,
        expect.objectContaining({
          conversationId: convId,
          text: 'Final response',
        })
      );
    }
  });

  it('handles errors by setting aiOperationError', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-666';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');

    let onError: ((error: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, _chunk: any, _done: any, error: any) => {
        onError = error;
        return Promise.resolve('');
      }
    );
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    if (onError) {
      onError('API Error');
      expect(mockStore.SetAiOperationError).toHaveBeenCalledWith('API Error');
      expect(Dispatch).toHaveBeenCalledWith(
        NOTEMAC_EVENTS.AI_ERROR,
        expect.objectContaining({ error: 'API Error' })
      );
    }
  });

  it('handles thrown errors gracefully', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-777';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockRejectedValue(new Error('Network error'));
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    expect(mockStore.SetAiOperationError).toHaveBeenCalledWith('Network error');
  });

  it('always resets streaming state in finally block', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-888';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockRejectedValue(new Error('Error'));
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(false);
  });

  it('calls SaveAIState after completion', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-999';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('Response');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    expect(mockStore.SaveAIState).toHaveBeenCalledOnce();
  });

  it('passes correct temperature to SendChatCompletion', async () => {
    const mockStore = createMockStore();
    mockStore.aiSettings.chatTemperature = 0.9;
    const convId = 'conv-aaa';
    mockStore.activeConversationId = convId;
    mockStore.conversations = [{
      id: convId,
      title: 'Test',
      messages: [],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    }];
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('Test');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    expect(sendCall[1]).toEqual(
      expect.objectContaining({ temperature: 0.9 })
    );
  });
});

// ============================================================
// Tests: ExplainCode
// ============================================================

describe('AIActionController — ExplainCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens AI sidebar panel', async () => {
    const mockStore = createMockStore();
    mockStore.activeConversationId = null;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await ExplainCode('const x = 5;', 'typescript');

    expect(mockStore.setSidebarPanel).toHaveBeenCalledWith('ai');
  });

  it('sends explanation prompt with code', async () => {
    const mockStore = createMockStore();
    mockStore.activeConversationId = null;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const code = 'const x = 5;';
    const language = 'typescript';
    await ExplainCode(code, language);

    const addMsgCall = (mockStore.AddMessageToConversation as any).mock.calls[0];
    expect(addMsgCall[1].content).toContain('Explain the following');
    expect(addMsgCall[1].content).toContain('typescript');
    expect(addMsgCall[1].content).toContain(code);
  });
});

// ============================================================
// Tests: RefactorCode
// ============================================================

describe('AIActionController — RefactorCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends correct system and user prompts', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('refactored code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await RefactorCode('old code', 'typescript', onResult);

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('refactoring');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('old code');
  });

  it('extracts code blocks from result', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const codeBlock = createMockCodeBlock('refactored code', 'typescript');
    (SendChatCompletion as any).mockResolvedValue('```typescript\nrefactored code\n```');
    (ExtractCodeBlocks as any).mockReturnValue([codeBlock]);

    const onResult = vi.fn();
    await RefactorCode('old code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('refactored code');
  });

  it('returns full result when no code blocks found', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('plain text response');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await RefactorCode('code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('plain text response');
  });

  it('sets streaming state true', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('result');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await RefactorCode('code', 'typescript', vi.fn());

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(true);
  });

  it('sets streaming state false after completion', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('result');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await RefactorCode('code', 'typescript', vi.fn());

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(false);
  });

  it('handles errors gracefully', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockRejectedValue(new Error('API error'));
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await RefactorCode('code', 'typescript', onResult);

    expect(mockStore.SetAiOperationError).toHaveBeenCalledWith('API error');
  });

  it('uses codeTemperature setting', async () => {
    const mockStore = createMockStore();
    mockStore.aiSettings.codeTemperature = 0.3;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('result');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await RefactorCode('code', 'typescript', vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    expect(sendCall[1]).toEqual(
      expect.objectContaining({ temperature: 0.3, stream: false })
    );
  });
});

// ============================================================
// Tests: GenerateTests
// ============================================================

describe('AIActionController — GenerateTests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends correct test generation prompts', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('test code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await GenerateTests('function add(a, b) { return a + b; }', 'javascript', vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0].content).toContain('test generation');
    expect(messages[1].content).toContain('javascript');
  });

  it('calls onResult with generated tests', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const testCode = 'test code here';
    (SendChatCompletion as any).mockResolvedValue(testCode);
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await GenerateTests('code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith(testCode);
  });

  it('extracts code blocks from test generation result', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const codeBlock = createMockCodeBlock('test code', 'typescript');
    (SendChatCompletion as any).mockResolvedValue('```typescript\ntest code\n```');
    (ExtractCodeBlocks as any).mockReturnValue([codeBlock]);

    const onResult = vi.fn();
    await GenerateTests('code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('test code');
  });
});

// ============================================================
// Tests: GenerateDocumentation
// ============================================================

describe('AIActionController — GenerateDocumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends correct documentation prompts', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('documented code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await GenerateDocumentation('function test() {}', 'typescript', vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0].content).toContain('documentation');
    expect(messages[1].content).toContain('typescript');
  });

  it('returns documented code to onResult', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const documentedCode = '/** JSDoc */ function test() {}';
    (SendChatCompletion as any).mockResolvedValue(documentedCode);
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await GenerateDocumentation('code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith(documentedCode);
  });
});

// ============================================================
// Tests: FixError
// ============================================================

describe('AIActionController — FixError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes error message in prompt', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('fixed code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const errorMsg = 'Cannot read property x of undefined';
    await FixError('buggy code', 'typescript', errorMsg, vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const userMsg = sendCall[0][1];
    expect(userMsg.content).toContain(errorMsg);
    expect(userMsg.content).toContain('buggy code');
  });

  it('sends fixed code to onResult', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('fixed code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await FixError('code', 'typescript', 'error', onResult);

    expect(onResult).toHaveBeenCalledWith('fixed code');
  });
});

// ============================================================
// Tests: SimplifyCode
// ============================================================

describe('AIActionController — SimplifyCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends simplification prompt', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('simple code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SimplifyCode('complex code', 'typescript', vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const systemMsg = sendCall[0][0];
    expect(systemMsg.content).toContain('simplif');
  });

  it('returns simplified code to onResult', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('simplified');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await SimplifyCode('code', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('simplified');
  });
});

// ============================================================
// Tests: ConvertLanguage
// ============================================================

describe('AIActionController — ConvertLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes both fromLanguage and toLanguage in prompts', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('converted code');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await ConvertLanguage('py_code', 'python', 'typescript', vi.fn());

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0].content).toContain('python');
    expect(messages[0].content).toContain('typescript');
    expect(messages[1].content).toContain('python');
    expect(messages[1].content).toContain('typescript');
  });

  it('returns converted code to onResult', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('converted');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    const onResult = vi.fn();
    await ConvertLanguage('code', 'python', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('converted');
  });

  it('extracts code blocks from converted result', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const codeBlock = createMockCodeBlock('const x = 5;', 'typescript');
    (SendChatCompletion as any).mockResolvedValue('```typescript\nconst x = 5;\n```');
    (ExtractCodeBlocks as any).mockReturnValue([codeBlock]);

    const onResult = vi.fn();
    await ConvertLanguage('x = 5', 'python', 'typescript', onResult);

    expect(onResult).toHaveBeenCalledWith('const x = 5;');
  });
});

// ============================================================
// Tests: GenerateCommitMessage
// ============================================================

describe('AIActionController — GenerateCommitMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets streaming state true', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('commit message');

    await GenerateCommitMessage('diff content');

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(true);
  });

  it('clears error state', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('message');

    await GenerateCommitMessage('diff');

    expect(mockStore.SetAiOperationError).toHaveBeenCalledWith(null);
  });

  it('calls SendChatCompletion with system prompt', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('message');

    await GenerateCommitMessage('diff');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('commit message');
    expect(messages[0].content).toContain('conventional commits');
  });

  it('includes diff content in user message', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const diffContent = '+added line\n-removed line';
    (SendChatCompletion as any).mockResolvedValue('message');

    await GenerateCommitMessage(diffContent);

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];
    expect(messages[1].content).toContain(diffContent);
  });

  it('passes correct temperature for commit messages', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('message');

    await GenerateCommitMessage('diff');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    expect(sendCall[1]).toEqual(
      expect.objectContaining({ temperature: 0.3 })
    );
  });

  it('calls onChunk callback with streaming text', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    let onChunk: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, chunk: any) => {
        onChunk = chunk;
        return Promise.resolve('Final message');
      }
    );

    const onChunkCallback = vi.fn();
    await GenerateCommitMessage('diff', onChunkCallback);

    if (onChunk) {
      onChunk('part1');
      expect(onChunkCallback).toHaveBeenCalledWith('part1');
      onChunk('part2');
      expect(onChunkCallback).toHaveBeenCalledWith('part2');
    }
  });

  it('updates commitMessageDraft during streaming', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    let fullMessage = '';
    let onChunk: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, chunk: any) => {
        onChunk = chunk;
        return Promise.resolve('final message');
      }
    );

    await GenerateCommitMessage('diff');

    // Verify the behavior: onChunk should accumulate and call SetCommitMessageDraft
    if (onChunk) {
      onChunk('Hello ');
      onChunk('World');
      // The implementation accumulates chunks in fullMessage variable within the function
    }

    // Verify SetCommitMessageDraft was called at least once
    expect(mockStore.SetCommitMessageDraft).toHaveBeenCalled();
  });

  it('calls onDone callback with final message', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    let onDone: ((text: string) => void) | undefined;
    (SendChatCompletion as any).mockImplementation(
      (_messages: any, _options: any, _chunk: any, done: any) => {
        onDone = done;
        return Promise.resolve('Final message');
      }
    );

    const onDoneCallback = vi.fn();
    await GenerateCommitMessage('diff', undefined, onDoneCallback);

    if (onDone) {
      onDone('Final message');
      expect(onDoneCallback).toHaveBeenCalledWith('Final message');
    }
  });

  it('returns full message on success', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const finalMsg = 'feat: add new feature';
    (SendChatCompletion as any).mockResolvedValue(finalMsg);

    const result = await GenerateCommitMessage('diff');

    expect(result).toBe(finalMsg);
  });

  it('returns empty string on error', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockRejectedValue(new Error('API error'));

    const result = await GenerateCommitMessage('diff');

    expect(result).toBe('');
    expect(mockStore.SetAiOperationError).toHaveBeenCalledWith('API error');
  });

  it('always resets streaming state in finally', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockRejectedValue(new Error('Error'));

    await GenerateCommitMessage('diff');

    expect(mockStore.SetIsAiStreaming).toHaveBeenCalledWith(false);
  });

  it('supports optional onChunk and onDone callbacks', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    (SendChatCompletion as any).mockResolvedValue('message');

    const result = await GenerateCommitMessage('diff');

    expect(result).toBe('message');
    expect((SendChatCompletion as any)).toHaveBeenCalled();
  });
});

// ============================================================
// Tests: Integration Scenarios
// ============================================================

describe('AIActionController — Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles code actions with extraction and streaming disabled', async () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);
    const codeBlock = createMockCodeBlock('result', 'typescript');
    (SendChatCompletion as any).mockResolvedValue('```typescript\nresult\n```');
    (ExtractCodeBlocks as any).mockReturnValue([codeBlock]);

    const onResult = vi.fn();
    await RefactorCode('input', 'typescript', onResult);

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    expect(sendCall[1].stream).toBe(false);
    expect(onResult).toHaveBeenCalledWith('result');
  });

  it('chat message with history accumulates correctly', async () => {
    const mockStore = createMockStore();
    const convId = 'conv-full';
    const previousMessage: AIMessage = {
      id: 'msg-1',
      role: 'user',
      content: 'first message',
      timestamp: Date.now(),
      codeBlocks: [],
    };
    mockStore.activeConversationId = convId;
    const conversation = {
      id: convId,
      title: 'Test',
      messages: [previousMessage],
      modelId: 'gpt-4',
      providerId: 'openai',
      createdAt: Date.now(),
    };
    mockStore.conversations = [conversation];

    // Mock getState to return mockStore, but update conversation messages when AddMessageToConversation is called
    let currentConversation = { ...conversation };
    mockStore.AddMessageToConversation = vi.fn((convId: string, msg: AIMessage) => {
      currentConversation.messages.push(msg);
    });

    (useNotemacStore.getState as any).mockImplementation(() => {
      return {
        ...mockStore,
        conversations: [currentConversation],
      };
    });

    (BuildContextString as any).mockReturnValue('');
    (SendChatCompletion as any).mockResolvedValue('');
    (ExtractCodeBlocks as any).mockReturnValue([]);

    await SendChatMessage('second message');

    const sendCall = (SendChatCompletion as any).mock.calls[0];
    const messages = sendCall[0];

    // Should include both user messages in the history passed to SendChatCompletion
    const userMessages = messages.filter((m: any) => m.role === 'user');
    expect(userMessages.length).toBeGreaterThanOrEqual(1);
    expect(userMessages.some((m: any) => m.content === 'first message')).toBe(true);
    expect(userMessages.some((m: any) => m.content === 'second message')).toBe(true);
  });
});
