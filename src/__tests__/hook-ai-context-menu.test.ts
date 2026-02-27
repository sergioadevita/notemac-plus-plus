import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RegisterAIContextMenuActions } from '../Notemac/UI/EditorPanel/useAIContextMenu';

// ─── Mocks ──────────────────────────────────────────────────────

vi.mock('../Notemac/Controllers/AIActionController', () => ({
    ExplainCode: vi.fn(),
    RefactorCode: vi.fn(),
    GenerateTests: vi.fn(),
    GenerateDocumentation: vi.fn(),
    FixError: vi.fn(),
    SimplifyCode: vi.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────

function createMockModel(content = 'function test() {}')
{
    return {
        getValue: vi.fn().mockReturnValue(content),
        getValueInRange: vi.fn().mockReturnValue('selected code'),
        getLanguageId: vi.fn().mockReturnValue('javascript'),
        getLineCount: vi.fn().mockReturnValue(1),
        getLineMaxColumn: vi.fn().mockReturnValue(content.length + 1),
    };
}

function createMockEditor(model: ReturnType<typeof createMockModel>)
{
    const registeredActions: any[] = [];
    return {
        addAction: vi.fn((action: any) => registeredActions.push(action)),
        getModel: vi.fn().mockReturnValue(model),
        getSelection: vi.fn().mockReturnValue({
            isEmpty: () => false,
            startLineNumber: 1, startColumn: 1,
            endLineNumber: 1, endColumn: 20,
        }),
        executeEdits: vi.fn(),
        _registeredActions: registeredActions,
    } as any;
}

function createMockMonaco()
{
    return {
        Range: class MockRange
        {
            constructor(public a: number, public b: number, public c: number, public d: number) {}
        },
    } as any;
}

function createMockTab()
{
    return {
        id: 'tab-1',
        name: 'test.js',
        content: 'function test() {}',
        language: 'javascript',
    } as any;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('RegisterAIContextMenuActions', () =>
{
    let mockEditor: ReturnType<typeof createMockEditor>;
    let mockModel: ReturnType<typeof createMockModel>;
    let mockMonaco: ReturnType<typeof createMockMonaco>;
    let originalPrompt: typeof window.prompt;

    beforeEach(() =>
    {
        mockModel = createMockModel();
        mockEditor = createMockEditor(mockModel);
        mockMonaco = createMockMonaco();
        originalPrompt = window.prompt;
        vi.clearAllMocks();
    });

    afterEach(() =>
    {
        window.prompt = originalPrompt;
    });

    it('registers 6 AI context menu actions', () =>
    {
        RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
        expect(mockEditor.addAction).toHaveBeenCalledTimes(6);
    });

    it('registers actions with correct IDs', () =>
    {
        RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
        const ids = mockEditor._registeredActions.map((a: any) => a.id);
        expect(ids).toEqual([
            'ai-explain',
            'ai-refactor',
            'ai-generate-tests',
            'ai-generate-docs',
            'ai-fix-error',
            'ai-simplify',
        ]);
    });

    it('registers actions with AI context menu group', () =>
    {
        RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
        for (const action of mockEditor._registeredActions)
        {
            expect(action.contextMenuGroupId).toBe('9_ai');
        }
    });

    it('registers actions with sequential order', () =>
    {
        RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
        const orders = mockEditor._registeredActions.map((a: any) => a.contextMenuOrder);
        expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
    });

    // ── Individual action run tests ─────────────────────────────

    describe('ai-explain action', () =>
    {
        it('calls ExplainCode with selected code', async () =>
        {
            const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-explain');
            action.run(mockEditor);
            expect(ExplainCode).toHaveBeenCalledWith('selected code', 'javascript');
        });

        it('does nothing when selection is empty', async () =>
        {
            const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
            mockEditor.getSelection.mockReturnValue({ isEmpty: () => true });
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-explain');
            action.run(mockEditor);
            expect(ExplainCode).not.toHaveBeenCalled();
        });

        it('does nothing when model is null', async () =>
        {
            const { ExplainCode } = await import('../Notemac/Controllers/AIActionController');
            mockEditor.getModel.mockReturnValue(null);
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-explain');
            action.run(mockEditor);
            expect(ExplainCode).not.toHaveBeenCalled();
        });
    });

    describe('ai-refactor action', () =>
    {
        it('calls RefactorCode with selected code', async () =>
        {
            const { RefactorCode } = await import('../Notemac/Controllers/AIActionController');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-refactor');
            action.run(mockEditor);
            expect(RefactorCode).toHaveBeenCalledWith('selected code', 'javascript', expect.any(Function));
        });
    });

    describe('ai-generate-tests action', () =>
    {
        it('calls GenerateTests with selected code', async () =>
        {
            const { GenerateTests } = await import('../Notemac/Controllers/AIActionController');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-generate-tests');
            action.run(mockEditor);
            expect(GenerateTests).toHaveBeenCalledWith('selected code', 'javascript', expect.any(Function));
        });
    });

    describe('ai-generate-docs action', () =>
    {
        it('calls GenerateDocumentation with selected code', async () =>
        {
            const { GenerateDocumentation } = await import('../Notemac/Controllers/AIActionController');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-generate-docs');
            action.run(mockEditor);
            expect(GenerateDocumentation).toHaveBeenCalledWith('selected code', 'javascript', expect.any(Function));
        });
    });

    describe('ai-fix-error action', () =>
    {
        it('prompts for error description and calls FixError', async () =>
        {
            const { FixError } = await import('../Notemac/Controllers/AIActionController');
            window.prompt = vi.fn().mockReturnValue('TypeError at line 5');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-fix-error');
            action.run(mockEditor);
            expect(FixError).toHaveBeenCalledWith('selected code', 'javascript', 'TypeError at line 5', expect.any(Function));
        });

        it('uses default error message when prompt is cancelled', async () =>
        {
            const { FixError } = await import('../Notemac/Controllers/AIActionController');
            window.prompt = vi.fn().mockReturnValue(null);
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-fix-error');
            action.run(mockEditor);
            expect(FixError).toHaveBeenCalledWith('selected code', 'javascript', 'Fix any issues', expect.any(Function));
        });
    });

    describe('ai-simplify action', () =>
    {
        it('calls SimplifyCode with selected code', async () =>
        {
            const { SimplifyCode } = await import('../Notemac/Controllers/AIActionController');
            RegisterAIContextMenuActions(mockEditor, mockMonaco, createMockTab());
            const action = mockEditor._registeredActions.find((a: any) => a.id === 'ai-simplify');
            action.run(mockEditor);
            expect(SimplifyCode).toHaveBeenCalledWith('selected code', 'javascript', expect.any(Function));
        });
    });
});
