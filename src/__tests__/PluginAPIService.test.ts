import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePluginContext, CleanupPluginContext } from '../Notemac/Services/PluginAPIService';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { PluginContext } from '../Notemac/Commons/PluginTypes';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(() => ({
            UnregisterAllByPluginId: vi.fn(),
        })),
    },
}));

describe('PluginAPIService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('CreatePluginContext', () =>
    {
        it('should create context with correct pluginId', () =>
        {
            const pluginId = 'test-plugin';

            const context = CreatePluginContext(pluginId);

            expect('test-plugin' === context.pluginId).toBe(true);
        });

        it('should create context with all required API objects', () =>
        {
            const context = CreatePluginContext('test-plugin');

            expect(null !== context.editor).toBe(true);
            expect(null !== context.events).toBe(true);
            expect(null !== context.ui).toBe(true);
            expect(null !== context.commands).toBe(true);
            expect(null !== context.themes).toBe(true);
            expect(null !== context.languages).toBe(true);
            expect(null !== context.storage).toBe(true);
        });

        it('should create context with editor API methods', () =>
        {
            const context = CreatePluginContext('test-plugin');

            expect('function' === typeof context.editor.GetContent).toBe(true);
            expect('function' === typeof context.editor.SetContent).toBe(true);
            expect('function' === typeof context.editor.InsertText).toBe(true);
            expect('function' === typeof context.editor.GetLanguage).toBe(true);
            expect('function' === typeof context.editor.GetSelection).toBe(true);
            expect('function' === typeof context.editor.SetSelection).toBe(true);
        });

        it('should create context with events API methods', () =>
        {
            const context = CreatePluginContext('test-plugin');

            expect('function' === typeof context.events.Subscribe).toBe(true);
            expect('function' === typeof context.events.Dispatch).toBe(true);
        });

        it('should create context with storage API methods', () =>
        {
            const context = CreatePluginContext('test-plugin');

            expect('function' === typeof context.storage.Get).toBe(true);
            expect('function' === typeof context.storage.Set).toBe(true);
        });

        it('should create different contexts for different plugin IDs', () =>
        {
            const context1 = CreatePluginContext('plugin-1');
            const context2 = CreatePluginContext('plugin-2');

            expect('plugin-1' === context1.pluginId).toBe(true);
            expect('plugin-2' === context2.pluginId).toBe(true);
        });

        it('should initialize plugin subscriptions tracking', () =>
        {
            const context = CreatePluginContext('test-plugin');

            expect(null !== context).toBe(true);
            expect('string' === typeof context.pluginId).toBe(true);
        });
    });

    describe('CleanupPluginContext', () =>
    {
        it('should cleanup context without errors', () =>
        {
            const pluginId = 'test-plugin';
            CreatePluginContext(pluginId);

            expect(() => CleanupPluginContext(pluginId)).not.toThrow();
        });

        it('should call store UnregisterAllByPluginId', () =>
        {
            const pluginId = 'test-plugin';
            const mockStore = {
                UnregisterAllByPluginId: vi.fn(),
            };

            vi.mocked(useNotemacStore.getState).mockReturnValue(mockStore as any);

            CreatePluginContext(pluginId);
            CleanupPluginContext(pluginId);

            expect(mockStore.UnregisterAllByPluginId).toHaveBeenCalledWith(pluginId);
        });

        it('should handle cleanup of multiple plugins', () =>
        {
            const pluginId1 = 'plugin-1';
            const pluginId2 = 'plugin-2';

            CreatePluginContext(pluginId1);
            CreatePluginContext(pluginId2);

            expect(() => CleanupPluginContext(pluginId1)).not.toThrow();
            expect(() => CleanupPluginContext(pluginId2)).not.toThrow();
        });

        it('should handle cleanup when no subscriptions exist', () =>
        {
            const pluginId = 'test-plugin';

            expect(() => CleanupPluginContext(pluginId)).not.toThrow();
        });

        it('should be idempotent for repeated calls', () =>
        {
            const pluginId = 'test-plugin';
            CreatePluginContext(pluginId);

            expect(() => CleanupPluginContext(pluginId)).not.toThrow();
            expect(() => CleanupPluginContext(pluginId)).not.toThrow();
        });
    });
});
