import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../../Shared/Persistence/PersistenceService', () => ({
    GetValue: vi.fn(() => null),
    SetValue: vi.fn(),
}));

let idCounter = 0;

vi.mock('../../Shared/Helpers/IdHelpers', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateId: () => `id-${++idCounter}`,
    };
});

function resetStore(): void {
    useNotemacStore.setState({
        savedSnippets: [],
    });
}

describe('SnippetModel — addSnippet', () => {
    beforeEach(() => resetStore());

    it('adds a snippet', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({
            name: 'console.log',
            content: 'console.log("${1:message}")',
            language: 'javascript',
            description: 'Log to console',
            tags: ['js'],
        });
        const state = useNotemacStore.getState();

        expect(state.savedSnippets.length).toBe(1);
        expect(state.savedSnippets[0].name).toBe('console.log');
        expect(state.savedSnippets[0].id).toBeDefined();
    });

    it('adds multiple snippets', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet1', content: 'content1', language: 'js', description: '', tags: [] });
        store.addSnippet({ name: 'snippet2', content: 'content2', language: 'py', description: '', tags: [] });
        expect(useNotemacStore.getState().savedSnippets.length).toBe(2);
    });

    it('generates unique id for each snippet', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet1', content: 'content1', language: 'js', description: '', tags: [] });
        store.addSnippet({ name: 'snippet2', content: 'content2', language: 'js', description: '', tags: [] });
        const state = useNotemacStore.getState();

        expect(state.savedSnippets[0].id).not.toBe(state.savedSnippets[1].id);
    });
});

describe('SnippetModel — removeSnippet', () => {
    beforeEach(() => resetStore());

    it('removes a snippet', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet1', content: 'content1', language: 'js', description: '', tags: [] });
        const state = useNotemacStore.getState();
        const id = state.savedSnippets[0].id;

        store.removeSnippet(id);
        expect(useNotemacStore.getState().savedSnippets.length).toBe(0);
    });

    it('does nothing for non-existent snippet', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet1', content: 'content1', language: 'js', description: '', tags: [] });
        store.removeSnippet('nonexistent');
        expect(useNotemacStore.getState().savedSnippets.length).toBe(1);
    });

    it('removes correct snippet when multiple exist', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet1', content: 'content1', language: 'js', description: '', tags: [] });
        store.addSnippet({ name: 'snippet2', content: 'content2', language: 'js', description: '', tags: [] });
        store.addSnippet({ name: 'snippet3', content: 'content3', language: 'js', description: '', tags: [] });

        const state = useNotemacStore.getState();
        const id2 = state.savedSnippets[1].id;
        store.removeSnippet(id2);

        const newState = useNotemacStore.getState();
        expect(newState.savedSnippets.length).toBe(2);
        expect(newState.savedSnippets[0].name).toBe('snippet1');
        expect(newState.savedSnippets[1].name).toBe('snippet3');
    });
});

describe('SnippetModel — updateSnippet', () => {
    beforeEach(() => resetStore());

    it('updates snippet properties', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'original', content: 'content', language: 'js', description: '', tags: [] });
        const state = useNotemacStore.getState();
        const id = state.savedSnippets[0].id;

        store.updateSnippet(id, { name: 'updated', content: 'new content' });

        const newState = useNotemacStore.getState();
        expect(newState.savedSnippets[0].name).toBe('updated');
        expect(newState.savedSnippets[0].content).toBe('new content');
    });

    it('preserves other properties when updating partial', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet', content: 'content', language: 'js', description: 'desc', tags: ['tag1'] });
        const state = useNotemacStore.getState();
        const id = state.savedSnippets[0].id;

        store.updateSnippet(id, { name: 'updated name' });

        const newState = useNotemacStore.getState();
        expect(newState.savedSnippets[0].language).toBe('js');
        expect(newState.savedSnippets[0].description).toBe('desc');
        expect(newState.savedSnippets[0].tags).toEqual(['tag1']);
    });

    it('does nothing for non-existent snippet', () => {
        const store = useNotemacStore.getState();
        store.addSnippet({ name: 'snippet', content: 'content', language: 'js', description: '', tags: [] });
        store.updateSnippet('nonexistent', { name: 'updated' });
        expect(useNotemacStore.getState().savedSnippets[0].name).toBe('snippet');
    });
});

describe('SnippetModel — loadSnippets', () => {
    beforeEach(() => resetStore());

    it('handles loading with mocked persistence', () => {
        // This test verifies the method exists and can be called
        // The actual persistence integration is mocked
        const store = useNotemacStore.getState();
        expect(typeof store.loadSnippets).toBe('function');
        // Just calling it shouldn't error
        store.loadSnippets();
    });
});
