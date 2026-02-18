import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    GetSnippetsForLanguage,
    InsertSnippet,
    RegisterSnippetCompletionProvider,
} from '../Notemac/Controllers/SnippetController';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { SavedSnippet } from '../Notemac/Commons/Types';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

describe('SnippetController — GetSnippetsForLanguage', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            savedSnippets: [],
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('returns empty array when no snippets exist', () =>
    {
        const result = GetSnippetsForLanguage('typescript');
        expect(0 === result.length).toBe(true);
    });

    it('returns snippets for specific language', () =>
    {
        const snippet: SavedSnippet = {
            id: '1',
            name: 'console.log',
            prefix: 'log',
            body: 'console.log($1);',
            language: 'javascript',
        };

        mockStore.savedSnippets = [snippet];

        const result = GetSnippetsForLanguage('javascript');
        expect(1 === result.length).toBe(true);
        expect(result[0].name).toBe('console.log');
    });

    it('returns universal snippets with language *', () =>
    {
        const universalSnippet: SavedSnippet = {
            id: '1',
            name: 'universal',
            prefix: 'uni',
            body: 'universal',
            language: '*',
        };

        mockStore.savedSnippets = [universalSnippet];

        const result = GetSnippetsForLanguage('any-language');
        expect(1 === result.length).toBe(true);
        expect(result[0].name).toBe('universal');
    });

    it('returns both language-specific and universal snippets', () =>
    {
        const langSnippet: SavedSnippet = {
            id: '1',
            name: 'lang-specific',
            prefix: 'lang',
            body: 'language specific',
            language: 'python',
        };

        const universalSnippet: SavedSnippet = {
            id: '2',
            name: 'universal',
            prefix: 'uni',
            body: 'universal',
            language: '*',
        };

        mockStore.savedSnippets = [langSnippet, universalSnippet];

        const result = GetSnippetsForLanguage('python');
        expect(2 === result.length).toBe(true);
    });

    it('filters snippets by exact language match', () =>
    {
        const jsSnippet: SavedSnippet = {
            id: '1',
            name: 'js-only',
            prefix: 'js',
            body: 'js code',
            language: 'javascript',
        };

        const tsSnippet: SavedSnippet = {
            id: '2',
            name: 'ts-only',
            prefix: 'ts',
            body: 'ts code',
            language: 'typescript',
        };

        mockStore.savedSnippets = [jsSnippet, tsSnippet];

        const result = GetSnippetsForLanguage('typescript');
        expect(1 === result.length).toBe(true);
        expect(result[0].language).toBe('typescript');
    });

    it('returns empty array when no matching snippets', () =>
    {
        const snippet: SavedSnippet = {
            id: '1',
            name: 'python-snippet',
            prefix: 'py',
            body: 'python code',
            language: 'python',
        };

        mockStore.savedSnippets = [snippet];

        const result = GetSnippetsForLanguage('go');
        expect(0 === result.length).toBe(true);
    });
});

describe('SnippetController — InsertSnippet', () =>
{
    it('returns early when editor is not provided', () =>
    {
        expect(() =>
        {
            InsertSnippet(null, 'snippet body');
        }).not.toThrow();
    });

    it('uses snippet controller when available', () =>
    {
        const mockContribution = {
            insert: vi.fn(),
        };

        const mockEditor = {
            getContribution: vi.fn(() => mockContribution),
        };

        InsertSnippet(mockEditor, 'console.log($1);');

        expect(mockEditor.getContribution).toHaveBeenCalledWith('snippetController2');
        expect(mockContribution.insert).toHaveBeenCalledWith('console.log($1);');
    });

    it('falls back to plain text insertion when snippet controller not available', () =>
    {
        const mockEditor = {
            getContribution: vi.fn(() => null),
            getSelection: vi.fn(() => ({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
            })),
            executeEdits: vi.fn(),
        };

        InsertSnippet(mockEditor, 'hello ${1:default} world $0');

        expect(mockEditor.executeEdits).toHaveBeenCalled();

        // Check that tab stops are removed
        const call = mockEditor.executeEdits.mock.calls[0];
        const insertedText = call[1][0].text;
        expect(insertedText).toContain('hello default world');
        expect(insertedText).not.toContain('$1');
        expect(insertedText).not.toContain('$0');
    });

    it('strips tab-stop markers in fallback mode', () =>
    {
        const mockEditor = {
            getContribution: vi.fn(() => null),
            getSelection: vi.fn(() => ({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
            })),
            executeEdits: vi.fn(),
        };

        InsertSnippet(mockEditor, 'for (let $1 = 0; $1 < $2; $1++) { $0 }');

        const call = mockEditor.executeEdits.mock.calls[0];
        const insertedText = call[1][0].text;

        // Should have placeholders removed but keep the text
        expect(insertedText).toContain('for (let');
        expect(insertedText).not.toContain('$1');
        expect(insertedText).not.toContain('$2');
    });

    it('handles snippet with named placeholders', () =>
    {
        const mockEditor = {
            getContribution: vi.fn(() => null),
            getSelection: vi.fn(() => ({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
            })),
            executeEdits: vi.fn(),
        };

        InsertSnippet(mockEditor, 'function ${1:name}() { $0 }');

        const call = mockEditor.executeEdits.mock.calls[0];
        const insertedText = call[1][0].text;

        expect(insertedText).toContain('function name()');
    });
});

describe('SnippetController — RegisterSnippetCompletionProvider', () =>
{
    it('registers completion provider for all languages', () =>
    {
        const mockMonaco = {
            languages: {
                registerCompletionItemProvider: vi.fn(),
                CompletionItemKind: {
                    Snippet: 15,
                },
                CompletionItemInsertTextRule: {
                    InsertAsSnippet: 4,
                },
            },
        };

        RegisterSnippetCompletionProvider(mockMonaco);

        expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith('*', expect.any(Object));
    });

    it('returns disposable object', () =>
    {
        const mockDisposable = { dispose: vi.fn() };
        const mockMonaco = {
            languages: {
                registerCompletionItemProvider: vi.fn(() => mockDisposable),
                CompletionItemKind: {
                    Snippet: 15,
                },
                CompletionItemInsertTextRule: {
                    InsertAsSnippet: 4,
                },
            },
        };

        const result = RegisterSnippetCompletionProvider(mockMonaco);
        expect(result).toBe(mockDisposable);
    });

    it('completion provider returns empty suggestions when no snippets', () =>
    {
        let completionProvider: any;
        const mockMonaco = {
            languages: {
                registerCompletionItemProvider: vi.fn((lang, provider) => {
                    completionProvider = provider;
                }),
                CompletionItemKind: {
                    Snippet: 15,
                },
                CompletionItemInsertTextRule: {
                    InsertAsSnippet: 4,
                },
            },
        };

        // Mock store with no snippets
        const mockStore = {
            savedSnippets: [],
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);

        RegisterSnippetCompletionProvider(mockMonaco);

        const result = completionProvider.provideCompletionItems(
            { getLanguageId: () => 'javascript', getWordUntilPosition: () => ({ startColumn: 1, endColumn: 1 }) },
            { lineNumber: 1, column: 1 },
        );

        expect(0 === result.suggestions.length).toBe(true);
    });

    it('completion provider includes snippet suggestions', () =>
    {
        let completionProvider: any;
        const mockMonaco = {
            languages: {
                registerCompletionItemProvider: vi.fn((lang, provider) => {
                    completionProvider = provider;
                }),
                CompletionItemKind: {
                    Snippet: 15,
                },
                CompletionItemInsertTextRule: {
                    InsertAsSnippet: 4,
                },
            },
        };

        const snippet: SavedSnippet = {
            id: '1',
            name: 'console.log',
            prefix: 'log',
            body: 'console.log($1);',
            language: 'javascript',
            description: 'Log to console',
        };

        const mockStore = {
            savedSnippets: [snippet],
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);

        RegisterSnippetCompletionProvider(mockMonaco);

        const result = completionProvider.provideCompletionItems(
            { getLanguageId: () => 'javascript', getWordUntilPosition: () => ({ startColumn: 1, endColumn: 1 }) },
            { lineNumber: 1, column: 1 },
        );

        expect(1 === result.suggestions.length).toBe(true);
        expect(result.suggestions[0].label).toBe('log');
        expect(result.suggestions[0].insertText).toBe('console.log($1);');
        expect(result.suggestions[0].kind).toBe(15);
    });
});
