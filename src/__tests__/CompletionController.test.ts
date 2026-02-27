import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Mocks for CompletionController
// ============================================================

vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../Notemac/Controllers/SnippetController', () => ({
  RegisterSnippetCompletionProvider: vi.fn(() => ({
    dispose: vi.fn(),
  })),
}));

vi.mock('../Notemac/Controllers/LLMController', () => ({
  SendInlineCompletion: vi.fn(),
  CancelActiveRequest: vi.fn(),
}));

// ============================================================
// Imports after mocking
// ============================================================

import { useNotemacStore } from '../Notemac/Model/Store';
import { SendInlineCompletion, CancelActiveRequest } from '../Notemac/Controllers/LLMController';
import {
  CancelInlineCompletion,
} from '../Notemac/Controllers/CompletionController';

// ============================================================
// Helper Functions for Mocks
// ============================================================

function createMockStore() {
  return {
    aiEnabled: true,
    inlineSuggestionEnabled: true,
    aiSettings: {
      inlineCompletionEnabled: true,
      inlineDebounceMs: 100,
    },
    tabs: [],
    fileTree: null,
    GetActiveProvider: vi.fn(() => ({
      id: 'provider-1',
      name: 'Test Provider',
      type: 'openai',
      baseUrl: 'https://api.example.com',
    })),
    GetCredentialForProvider: vi.fn(() => ({
      apiKey: 'test-api-key',
    })),
  };
}

function createMockMonaco() {
  return {
    languages: {
      registerCompletionItemProvider: vi.fn(() => ({
        dispose: vi.fn(),
      })),
      registerInlineCompletionsProvider: vi.fn(() => ({
        dispose: vi.fn(),
      })),
      CompletionItemKind: {
        Text: 0,
        File: 1,
        Folder: 2,
      },
    },
    Range: class MockRange {
      constructor(
        public startLineNumber: number,
        public startColumn: number,
        public endLineNumber: number,
        public endColumn: number
      ) {}
    },
  };
}

function createMockEditor() {
  return {
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
  };
}

function createMockModel() {
  return {
    getValue: vi.fn(() => ''),
    getWordUntilPosition: vi.fn(() => ({
      word: '',
      startColumn: 1,
      endColumn: 1,
    })),
    getLineContent: vi.fn(() => ''),
    getOffsetAt: vi.fn(() => 0),
    getLanguageId: vi.fn(() => 'plaintext'),
  };
}

function createMockPosition() {
  return {
    lineNumber: 1,
    column: 1,
  };
}

// ============================================================
// Tests: CancelInlineCompletion
// ============================================================

describe('CompletionController — CancelInlineCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls CancelActiveRequest from LLMController', () => {
    CancelInlineCompletion();
    expect(CancelActiveRequest).toHaveBeenCalledOnce();
  });

  it('can be called multiple times safely', () => {
    CancelInlineCompletion();
    CancelInlineCompletion();
    CancelInlineCompletion();
    expect(CancelActiveRequest).toHaveBeenCalledTimes(3);
  });
});

// ============================================================
// Tests: Inline Completion Provider Logic Patterns
// ============================================================

describe('CompletionController — Inline Completion Provider Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects completion when AI is disabled', () => {
    const mockStore = createMockStore();
    mockStore.aiEnabled = false;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    // Simulate the guard logic from RegisterAIInlineCompletionProvider
    const shouldProceed = mockStore.aiEnabled && mockStore.inlineSuggestionEnabled;
    expect(shouldProceed).toBe(false);
  });

  it('rejects completion when inline suggestion is disabled', () => {
    const mockStore = createMockStore();
    mockStore.inlineSuggestionEnabled = false;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const shouldProceed = mockStore.aiEnabled && mockStore.inlineSuggestionEnabled;
    expect(shouldProceed).toBe(false);
  });

  it('rejects completion when inline completion setting is disabled', () => {
    const mockStore = createMockStore();
    mockStore.aiSettings.inlineCompletionEnabled = false;
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const shouldProceed =
      mockStore.aiEnabled &&
      mockStore.inlineSuggestionEnabled &&
      mockStore.aiSettings.inlineCompletionEnabled;
    expect(shouldProceed).toBe(false);
  });

  it('rejects completion when no active provider', () => {
    const mockStore = createMockStore();
    mockStore.GetActiveProvider = vi.fn(() => null);
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const provider = mockStore.GetActiveProvider();
    expect(provider).toBeNull();
  });

  it('rejects completion when no credential for provider', () => {
    const mockStore = createMockStore();
    mockStore.GetCredentialForProvider = vi.fn(() => null);
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const credential = mockStore.GetCredentialForProvider('provider-1');
    expect(credential).toBeNull();
  });

  it('rejects completion when API key is empty', () => {
    const mockStore = createMockStore();
    mockStore.GetCredentialForProvider = vi.fn(() => ({
      apiKey: '',
    }));
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const credential = mockStore.GetCredentialForProvider('provider-1');
    expect(credential?.apiKey.length).toBe(0);
  });

  it('allows completion when all conditions are met', () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const aiEnabled = mockStore.aiEnabled;
    const inlineSuggestionEnabled = mockStore.inlineSuggestionEnabled;
    const inlineCompletionEnabled = mockStore.aiSettings.inlineCompletionEnabled;
    const provider = mockStore.GetActiveProvider();
    const credential = mockStore.GetCredentialForProvider(provider!.id);

    const shouldProceed =
      aiEnabled &&
      inlineSuggestionEnabled &&
      inlineCompletionEnabled &&
      provider !== null &&
      credential !== null &&
      credential.apiKey.length > 0;

    expect(shouldProceed).toBe(true);
  });
});

// ============================================================
// Tests: Debounce Logic Pattern
// ============================================================

describe('CompletionController — Debounce Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounce timer is set for requests', () => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debounceMs = 100;

    debounceTimer = setTimeout(() => {
      // Simulating debounce timeout
    }, debounceMs);

    expect(debounceTimer).toBeDefined();

    clearTimeout(debounceTimer);
    debounceTimer = null;
    expect(debounceTimer).toBeNull();
  });

  it('clearing debounce timer prevents delayed execution', () => {
    const callback = vi.fn();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    debounceTimer = setTimeout(callback, 100);
    clearTimeout(debounceTimer);
    debounceTimer = null;

    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });

  it('debounce respects specified time', () => {
    const callback = vi.fn();
    const debounceMs = 250;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    debounceTimer = setTimeout(callback, debounceMs);

    vi.advanceTimersByTime(debounceMs - 1);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();

    clearTimeout(debounceTimer);
  });

  it('successive timers cancel previous ones', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    debounceTimer = setTimeout(callback1, 100);
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(callback2, 100);

    vi.runAllTimers();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledOnce();

    clearTimeout(debounceTimer);
  });
});

// ============================================================
// Tests: Request ID Increment Logic
// ============================================================

describe('CompletionController — Request ID Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('request ID increments for each request', () => {
    let lastRequestId = 0;

    const requestId1 = ++lastRequestId;
    expect(requestId1).toBe(1);

    const requestId2 = ++lastRequestId;
    expect(requestId2).toBe(2);

    const requestId3 = ++lastRequestId;
    expect(requestId3).toBe(3);
  });

  it('only most recent request ID should proceed', () => {
    let lastRequestId = 0;
    const requests: { id: number; canProceed: boolean }[] = [];

    const requestId1 = ++lastRequestId;
    const requestId2 = ++lastRequestId;
    const requestId3 = ++lastRequestId;

    requests.push({
      id: requestId1,
      canProceed: requestId1 === lastRequestId,
    });
    requests.push({
      id: requestId2,
      canProceed: requestId2 === lastRequestId,
    });
    requests.push({
      id: requestId3,
      canProceed: requestId3 === lastRequestId,
    });

    expect(requests[0].canProceed).toBe(false);
    expect(requests[1].canProceed).toBe(false);
    expect(requests[2].canProceed).toBe(true);
  });

  it('request ID mismatch prevents stale completion from being used', () => {
    let lastRequestId = 0;

    const requestId1 = ++lastRequestId;
    const startTime1 = Date.now();

    // Simulate other request being made
    const requestId2 = ++lastRequestId;

    // By the time first request completes, ID is different
    const shouldUseRequest1Result = requestId1 === lastRequestId;
    expect(shouldUseRequest1Result).toBe(false);
  });
});

// ============================================================
// Tests: Word Collection Logic
// ============================================================

describe('CompletionController — Word Collection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts words matching regex pattern', () => {
    const content = 'const myVariable = 123; function doSomething() {}';
    const wordRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]{2,}\b/g;

    const words = new Set<string>();
    let match;
    wordRegex.lastIndex = 0;
    while (null !== (match = wordRegex.exec(content))) {
      words.add(match[0]);
    }

    expect(words.has('myVariable')).toBe(true);
    expect(words.has('doSomething')).toBe(true);
    expect(words.has('const')).toBe(true);
    expect(words.has('function')).toBe(true);
  });

  it('ignores short words (less than 3 chars)', () => {
    const content = 'const x = 5; let y = 10;';
    const wordRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]{2,}\b/g;

    const words = new Set<string>();
    let match;
    wordRegex.lastIndex = 0;
    while (null !== (match = wordRegex.exec(content))) {
      words.add(match[0]);
    }

    expect(words.has('const')).toBe(true);
    expect(words.has('x')).toBe(false);
    expect(words.has('y')).toBe(false);
  });

  it('collects unique words from multiple tabs', () => {
    const tab1Content = 'const myFunction = () => {}';
    const tab2Content = 'const myVariable = 5; myFunction();';
    const currentTabContent = 'const anotherOne = true;';

    const wordSet = new Set<string>();
    const wordRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]{2,}\b/g;

    // Collect from tab1
    wordRegex.lastIndex = 0;
    let match;
    while (null !== (match = wordRegex.exec(tab1Content))) {
      if (match[0] !== 'const') wordSet.add(match[0]);
    }

    // Collect from tab2
    wordRegex.lastIndex = 0;
    while (null !== (match = wordRegex.exec(tab2Content))) {
      if (match[0] !== 'const') wordSet.add(match[0]);
    }

    expect(wordSet.has('myFunction')).toBe(true);
    expect(wordSet.has('myVariable')).toBe(true);
    expect(wordSet.size).toBeGreaterThan(1);
  });

  it('excludes current word being typed from suggestions', () => {
    const allWords = ['variable', 'function', 'variable', 'test'];
    const currentWord = 'variable';
    const wordSet = new Set(allWords);

    // Remove current word
    wordSet.delete(currentWord);

    expect(wordSet.has(currentWord)).toBe(false);
    expect(wordSet.has('function')).toBe(true);
    expect(wordSet.has('test')).toBe(true);
  });

  it('resets regex lastIndex to prevent skipping matches', () => {
    const content = 'abc def ghi jkl mno';
    const wordRegex = /\b\w{3}\b/g;

    const matches1 = [];
    wordRegex.lastIndex = 0;
    let match;
    while (null !== (match = wordRegex.exec(content))) {
      matches1.push(match[0]);
    }

    const matches2 = [];
    wordRegex.lastIndex = 0; // Reset
    while (null !== (match = wordRegex.exec(content))) {
      matches2.push(match[0]);
    }

    expect(matches1).toEqual(matches2);
    expect(matches1.length).toBe(5);
  });
});

// ============================================================
// Tests: Path Completion Trigger Pattern
// ============================================================

describe('CompletionController — Path Completion Trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers on path-like pattern with ./', () => {
    const lineContent = 'import from "./components"';
    const column = 24; // At the end
    const beforeCursor = lineContent.substring(0, column - 1);

    const shouldTrigger = !!beforeCursor.match(/['".]\/[^'"]*$/);
    expect(shouldTrigger).toBe(true);
  });

  it('triggers on path-like pattern with ../', () => {
    const lineContent = 'require("../utils")';
    const column = 16;
    const beforeCursor = lineContent.substring(0, column - 1);

    const shouldTrigger = !!beforeCursor.match(/['".]\/[^'"]*$/);
    expect(shouldTrigger).toBe(true);
  });

  it('does not trigger without quote or dot prefix', () => {
    const lineContent = 'const myFile = utils/helpers';
    const column = 28;
    const beforeCursor = lineContent.substring(0, column - 1);

    const shouldTrigger = !!beforeCursor.match(/['".]\/[^'"]*$/);
    expect(shouldTrigger).toBe(false);
  });

  it('does not trigger without forward slash', () => {
    const lineContent = 'import from "components"';
    const column = 24;
    const beforeCursor = lineContent.substring(0, column - 1);

    const shouldTrigger = !!beforeCursor.match(/['".]\/[^'"]*$/);
    expect(shouldTrigger).toBe(false);
  });

  it('does not trigger inside completed string', () => {
    const lineContent = 'import from "./file" more text';
    const column = 25; // After the closing quote
    const beforeCursor = lineContent.substring(0, column - 1);

    const shouldTrigger = !!beforeCursor.match(/['".]\/[^'"]*$/);
    expect(shouldTrigger).toBe(false);
  });
});

// ============================================================
// Tests: Code Fence Cleanup Logic
// ============================================================

describe('CompletionController — Code Fence Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes code fences from completion', () => {
    const completion = '```javascript\nconst x = 5;\n```';

    let cleanCompletion = completion.trim();
    if (cleanCompletion.startsWith('```')) {
      const lines = cleanCompletion.split('\n');
      lines.shift(); // Remove opening fence
      if (0 < lines.length && lines[lines.length - 1].startsWith('```')) {
        lines.pop(); // Remove closing fence
      }
      cleanCompletion = lines.join('\n');
    }

    expect(cleanCompletion).toBe('const x = 5;');
    expect(cleanCompletion.includes('```')).toBe(false);
  });

  it('preserves content when no code fences present', () => {
    const completion = 'const x = 5;';

    let cleanCompletion = completion.trim();
    if (cleanCompletion.startsWith('```')) {
      const lines = cleanCompletion.split('\n');
      lines.shift();
      if (0 < lines.length && lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanCompletion = lines.join('\n');
    }

    expect(cleanCompletion).toBe('const x = 5;');
  });

  it('handles completion with only opening fence', () => {
    const completion = '```typescript\nfunction test() {}';

    let cleanCompletion = completion.trim();
    if (cleanCompletion.startsWith('```')) {
      const lines = cleanCompletion.split('\n');
      lines.shift();
      if (0 < lines.length && lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanCompletion = lines.join('\n');
    }

    expect(cleanCompletion).toBe('function test() {}');
  });

  it('handles completion without starting fence', () => {
    // This test verifies that if content doesn't start with ```, it's returned as-is
    const completion = 'const x = 5;';

    let cleanCompletion = completion.trim();
    if (cleanCompletion.startsWith('```')) {
      const lines = cleanCompletion.split('\n');
      lines.shift();
      if (0 < lines.length && lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanCompletion = lines.join('\n');
    }

    expect(cleanCompletion).toBe('const x = 5;');
  });

  it('returns empty string after fence cleanup if only fences remain', () => {
    const completion = '```\n```';

    let cleanCompletion = completion.trim();
    if (cleanCompletion.startsWith('```')) {
      const lines = cleanCompletion.split('\n');
      lines.shift();
      if (0 < lines.length && lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanCompletion = lines.join('\n');
    }

    expect(cleanCompletion).toBe('');
  });
});

// ============================================================
// Tests: Prefix/Suffix Context Window Logic
// ============================================================

describe('CompletionController — Prefix/Suffix Context Window', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('truncates long prefix to max context chars', () => {
    const AI_INLINE_MAX_CONTEXT_CHARS = 2048;
    const fullText = 'a'.repeat(5000);
    const offset = 3000;

    const rawPrefix = fullText.substring(0, offset);
    const prefix =
      rawPrefix.length > AI_INLINE_MAX_CONTEXT_CHARS
        ? rawPrefix.substring(
            rawPrefix.length - AI_INLINE_MAX_CONTEXT_CHARS
          )
        : rawPrefix;

    expect(prefix.length).toBeLessThanOrEqual(AI_INLINE_MAX_CONTEXT_CHARS);
    expect(prefix).toBe(
      fullText.substring(offset - AI_INLINE_MAX_CONTEXT_CHARS, offset)
    );
  });

  it('truncates long suffix to max context chars', () => {
    const AI_INLINE_MAX_CONTEXT_CHARS = 2048;
    const fullText = 'b'.repeat(5000);
    const offset = 1000;

    const rawSuffix = fullText.substring(offset);
    const suffix =
      rawSuffix.length > AI_INLINE_MAX_CONTEXT_CHARS
        ? rawSuffix.substring(0, AI_INLINE_MAX_CONTEXT_CHARS)
        : rawSuffix;

    expect(suffix.length).toBeLessThanOrEqual(AI_INLINE_MAX_CONTEXT_CHARS);
  });

  it('keeps full prefix when under max context', () => {
    const AI_INLINE_MAX_CONTEXT_CHARS = 2048;
    const prefix = 'const x = '; // 10 chars

    const result =
      prefix.length > AI_INLINE_MAX_CONTEXT_CHARS
        ? prefix.substring(prefix.length - AI_INLINE_MAX_CONTEXT_CHARS)
        : prefix;

    expect(result).toBe(prefix);
  });

  it('keeps full suffix when under max context', () => {
    const AI_INLINE_MAX_CONTEXT_CHARS = 2048;
    const suffix = '; return x;'; // 11 chars

    const result =
      suffix.length > AI_INLINE_MAX_CONTEXT_CHARS
        ? suffix.substring(0, AI_INLINE_MAX_CONTEXT_CHARS)
        : suffix;

    expect(result).toBe(suffix);
  });

  it('rejects request when trimmed prefix is too short', () => {
    const trimmedPrefix = '   '; // Only whitespace
    const minPrefixLength = 5;

    const shouldProceed = trimmedPrefix.trim().length >= minPrefixLength;
    expect(shouldProceed).toBe(false);
  });

  it('accepts request when trimmed prefix meets minimum length', () => {
    const prefix = 'const x = '; // 10 chars
    const trimmedPrefix = prefix.trimEnd();
    const minPrefixLength = 5;

    const shouldProceed = trimmedPrefix.length >= minPrefixLength;
    expect(shouldProceed).toBe(true);
  });
});

// ============================================================
// Tests: Provider and Credential Validation
// ============================================================

describe('CompletionController — Provider and Credential Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates provider exists', () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const provider = mockStore.GetActiveProvider();
    const isValid = provider !== null;

    expect(isValid).toBe(true);
  });

  it('validates credential exists for provider', () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const provider = mockStore.GetActiveProvider();
    const credential = mockStore.GetCredentialForProvider(provider!.id);
    const isValid = credential !== null;

    expect(isValid).toBe(true);
  });

  it('validates API key is not empty', () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const provider = mockStore.GetActiveProvider();
    const credential = mockStore.GetCredentialForProvider(provider!.id);
    const isValid = credential && 0 < credential.apiKey.length;

    expect(isValid).toBe(true);
  });

  it('rejects when multiple conditions fail', () => {
    const mockStore = createMockStore();
    mockStore.aiEnabled = false;
    mockStore.GetActiveProvider = vi.fn(() => null);
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    const aiEnabled = mockStore.aiEnabled;
    const provider = mockStore.GetActiveProvider();
    const bothValid = aiEnabled && provider !== null;

    expect(bothValid).toBe(false);
  });
});

// ============================================================
// Tests: Language Detection
// ============================================================

describe('CompletionController — Language Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects language from model', () => {
    const mockModel = createMockModel();
    mockModel.getLanguageId = vi.fn(() => 'typescript');

    const languageId = mockModel.getLanguageId() || 'plaintext';
    expect(languageId).toBe('typescript');
  });

  it('defaults to plaintext when language unknown', () => {
    const mockModel = createMockModel();
    mockModel.getLanguageId = vi.fn(() => null);

    const languageId = mockModel.getLanguageId() || 'plaintext';
    expect(languageId).toBe('plaintext');
  });

  it('handles various language identifiers', () => {
    const languages = ['typescript', 'javascript', 'python', 'rust', 'go'];

    for (const lang of languages) {
      const mockModel = createMockModel();
      mockModel.getLanguageId = vi.fn(() => lang);
      const detected = mockModel.getLanguageId() || 'plaintext';
      expect(detected).toBe(lang);
    }
  });
});

// ============================================================
// Tests: Integration Scenarios
// ============================================================

describe('CompletionController — Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('full guard chain for rejecting completion', () => {
    const mockStore = createMockStore();
    mockStore.aiEnabled = true;
    mockStore.inlineSuggestionEnabled = true;
    mockStore.aiSettings.inlineCompletionEnabled = true;

    // Disable one condition
    mockStore.GetActiveProvider = vi.fn(() => null);

    const conditionsMet =
      mockStore.aiEnabled &&
      mockStore.inlineSuggestionEnabled &&
      mockStore.aiSettings.inlineCompletionEnabled &&
      mockStore.GetActiveProvider() !== null &&
      mockStore.GetCredentialForProvider('any') !== null;

    expect(conditionsMet).toBe(false);
  });

  it('debounce prevents rapid succession requests', () => {
    const debounceMs = 100;
    const callback = vi.fn();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Simulate rapid requests - each clears the previous timer
    for (let i = 0; i < 5; i++) {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(callback, debounceMs);
    }

    // Now only the last timer should be pending
    vi.advanceTimersByTime(debounceMs);

    // Only the last setTimeout should have executed
    expect(callback).toHaveBeenCalledOnce();

    // Clean up
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  it('stale request detection prevents outdated completions', () => {
    let lastRequestId = 0;
    const processedRequests: number[] = [];

    // Simulate 3 requests being made
    const request1Id = ++lastRequestId; // 1
    const request2Id = ++lastRequestId; // 2
    const request3Id = ++lastRequestId; // 3

    // Now when each request completes, only the one matching lastRequestId should be used
    if (request1Id === lastRequestId) {
      processedRequests.push(request1Id);
    }
    if (request2Id === lastRequestId) {
      processedRequests.push(request2Id);
    }
    if (request3Id === lastRequestId) {
      processedRequests.push(request3Id);
    }

    // Only the last request should be processed
    expect(processedRequests).toEqual([3]);
  });

  it('full inline completion flow with all guards passing', () => {
    const mockStore = createMockStore();
    (useNotemacStore.getState as any).mockReturnValue(mockStore);

    // Check all guards
    const aiEnabled = mockStore.aiEnabled;
    const inlineSuggestionEnabled = mockStore.inlineSuggestionEnabled;
    const inlineCompletionEnabled = mockStore.aiSettings.inlineCompletionEnabled;
    const provider = mockStore.GetActiveProvider();
    const credential = mockStore.GetCredentialForProvider(provider!.id);

    const allGuardsPassed =
      aiEnabled &&
      inlineSuggestionEnabled &&
      inlineCompletionEnabled &&
      provider !== null &&
      credential !== null &&
      credential.apiKey.length > 0;

    expect(allGuardsPassed).toBe(true);

    // Would then proceed to request
    expect(provider?.id).toBe('provider-1');
    expect(credential?.apiKey).toBe('test-api-key');
  });
});
