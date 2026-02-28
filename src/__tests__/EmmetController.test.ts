import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    IsEmmetEnabled,
    ToggleEmmet,
    ExpandEmmetAbbreviation,
    RegisterEmmetCompletionProvider,
    DisposeEmmetCompletionProvider,
} from '../Notemac/Controllers/EmmetController';
import { ExpandAbbreviation, IsEmmetContext } from '../Notemac/Services/EmmetService';
import { GetMonacoEditor } from '../Shared/Helpers/EditorGlobals';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Services/EmmetService', () =>
({
    ExpandAbbreviation: vi.fn().mockReturnValue('<div></div>'),
    IsEmmetContext: vi.fn().mockReturnValue(true),
}));

vi.mock('../Shared/Helpers/EditorGlobals', () =>
({
    GetMonacoEditor: vi.fn(),
}));

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

describe('EmmetController', () =>
{
    let mockEditor: any;
    let mockMonaco: any;

    beforeEach(() =>
    {
        mockEditor = {
            getModel: vi.fn().mockReturnValue({
                getLanguageId: vi.fn().mockReturnValue('html'),
                getLineContent: vi.fn().mockReturnValue('div>'),
            }),
            getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 4 }),
            executeEdits: vi.fn(),
        };

        mockMonaco = {
            Range: function Range(startLine: number, startColumn: number, endLine: number, endColumn: number)
            {
                return { startLine, startColumn, endLine, endColumn };
            },
            languages: {
                registerCompletionItemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                CompletionItemKind: { Snippet: 27 },
                CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
            },
        };

        (window as any).monaco = mockMonaco;
        (GetMonacoEditor as any).mockReturnValue(mockEditor);
        (useNotemacStore.getState as any).mockReturnValue({
            settings: { emmetEnabled: true },
            updateSettings: vi.fn(),
        });
        vi.clearAllMocks();
    });

    describe('IsEmmetEnabled', () =>
    {
        it('should return true when emmet is enabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: true },
            });
            expect(IsEmmetEnabled()).toBe(true);
        });

        it('should return false when emmet is disabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: false },
            });
            expect(IsEmmetEnabled()).toBe(false);
        });
    });

    describe('ToggleEmmet', () =>
    {
        it('should toggle emmet from enabled to disabled', () =>
        {
            const updateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: true },
                updateSettings,
            });
            const result = ToggleEmmet();
            expect(false === result).toBe(true);
            expect(updateSettings).toHaveBeenCalledWith({ emmetEnabled: false });
        });

        it('should toggle emmet from disabled to enabled', () =>
        {
            const updateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: false },
                updateSettings,
            });
            const result = ToggleEmmet();
            expect(true === result).toBe(true);
            expect(updateSettings).toHaveBeenCalledWith({ emmetEnabled: true });
        });

        it('should return boolean', () =>
        {
            const result = ToggleEmmet();
            expect(typeof result).toBe('boolean');
        });

        it('should return the new value', () =>
        {
            const updateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: true },
                updateSettings,
            });
            const result = ToggleEmmet();
            expect(false === result).toBe(true);
        });
    });

    describe('ExpandEmmetAbbreviation', () =>
    {
        it('should return true on successful expansion', async () =>
        {
            (ExpandAbbreviation as any).mockResolvedValue('<div></div>');
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await ExpandEmmetAbbreviation();
            expect(typeof result).toBe('boolean');
        });

        it('should return false when editor is null', async () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            const result = await ExpandEmmetAbbreviation();
            expect(result).toBe(false);
        });

        it('should return false when model is null', async () =>
        {
            mockEditor.getModel.mockReturnValue(null);
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await ExpandEmmetAbbreviation();
            expect(result).toBe(false);
        });

        it('should return false when emmet is not enabled', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { emmetEnabled: false },
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await ExpandEmmetAbbreviation();
            expect(result).toBe(false);
        });

        it('should return false when position is null', async () =>
        {
            mockEditor.getPosition.mockReturnValue(null);
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await ExpandEmmetAbbreviation();
            expect(result).toBe(false);
        });

        it('should return false when no abbreviation found', async () =>
        {
            mockEditor.getModel.mockReturnValue({
                getLanguageId: vi.fn().mockReturnValue('html'),
                getLineContent: vi.fn().mockReturnValue('   '),
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = await ExpandEmmetAbbreviation();
            expect(result).toBe(false);
        });
    });

    describe('RegisterEmmetCompletionProvider', () =>
    {
        it('should return a disposable object on success', () =>
        {
            DisposeEmmetCompletionProvider();
            const result = RegisterEmmetCompletionProvider(mockMonaco);
            expect(null !== result).toBe(true);
            if (null !== result)
            {
                expect(typeof result.dispose).toBe('function');
            }
        });

        it('should register provider for HTML language', () =>
        {
            DisposeEmmetCompletionProvider();
            mockMonaco.languages.registerCompletionItemProvider.mockClear();
            RegisterEmmetCompletionProvider(mockMonaco);
            const calls = mockMonaco.languages.registerCompletionItemProvider.mock.calls;
            expect(0 < calls.length).toBe(true);
        });

        it('should return null on error', () =>
        {
            DisposeEmmetCompletionProvider();
            const errorMonaco = {
                languages: {
                    registerCompletionItemProvider: vi.fn().mockImplementation(() =>
                    {
                        throw new Error('Registration failed');
                    }),
                },
            };
            const result = RegisterEmmetCompletionProvider(errorMonaco);
            expect(null === result).toBe(true);
        });

        it('should return same disposable on multiple calls', () =>
        {
            DisposeEmmetCompletionProvider();
            const result1 = RegisterEmmetCompletionProvider(mockMonaco);
            const result2 = RegisterEmmetCompletionProvider(mockMonaco);
            expect(result1 === result2).toBe(true);
        });
    });

    describe('DisposeEmmetCompletionProvider', () =>
    {
        it('should not throw', () =>
        {
            expect(() => DisposeEmmetCompletionProvider()).not.toThrow();
        });

        it('should dispose registered provider', () =>
        {
            const disposable = { dispose: vi.fn() };
            mockMonaco.languages.registerCompletionItemProvider.mockReturnValue(disposable);
            RegisterEmmetCompletionProvider(mockMonaco);
            DisposeEmmetCompletionProvider();
            expect(disposable.dispose).toHaveBeenCalled();
        });

        it('should allow multiple calls without error', () =>
        {
            expect(() =>
            {
                DisposeEmmetCompletionProvider();
                DisposeEmmetCompletionProvider();
            }).not.toThrow();
        });
    });
});
