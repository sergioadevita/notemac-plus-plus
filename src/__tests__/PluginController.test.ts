import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    InitializePluginSystem,
    DeactivatePlugin,
    GetPluginStatus,
    ExecutePluginCommand,
    SetPluginDirectoryHandle,
    GetPluginDirectoryHandle,
} from '../Notemac/Controllers/PluginController';
import { useNotemacStore } from '../Notemac/Model/Store';

// ─── Mock Dependencies ─────────────────────────────────────

const mockSetPluginInstances = vi.fn();
const mockSetPluginRegistryEntries = vi.fn();
const mockSetPluginRegistryLoading = vi.fn();
const mockUnregisterAllByPluginId = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(() => ({
            settings: { pluginsEnabled: true, pluginRegistryUrl: 'https://registry.notemac.dev' },
            pluginInstances: [],
            pluginCommands: [],
            SetPluginInstances: mockSetPluginInstances,
            SetPluginRegistryEntries: mockSetPluginRegistryEntries,
            SetPluginRegistryLoading: mockSetPluginRegistryLoading,
            UnregisterAllByPluginId: mockUnregisterAllByPluginId,
            RegisterPluginShortcut: vi.fn(),
        })),
    },
}));

vi.mock('../Notemac/Services/PluginLoaderService', () => ({
    ScanPluginDirectory: vi.fn(() => Promise.resolve([])),
    LoadPluginFromDirectory: vi.fn(),
}));

vi.mock('../Notemac/Services/PluginAPIService', () => ({
    CreatePluginContext: vi.fn(() => ({ pluginId: 'test' })),
    CleanupPluginContext: vi.fn(),
}));

const mockGetDemoRegistryEntries = vi.fn(() => [
    { id: 'demo-1', name: 'Demo Plugin', version: '1.0.0', description: 'Demo', author: 'Demo Author', downloadUrl: 'https://example.com' },
]);

vi.mock('../Notemac/Services/PluginRegistryService', () => ({
    FetchRegistryIndex: vi.fn(() => Promise.resolve([])),
    GetDemoRegistryEntries: () => mockGetDemoRegistryEntries(),
}));

vi.mock('../../Shared/EventDispatcher/EventDispatcher', () => ({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: {
        PLUGIN_ACTIVATED: 'plugin:activated',
        PLUGIN_DEACTIVATED: 'plugin:deactivated',
        PLUGIN_ERROR: 'plugin:error',
        PLUGIN_INSTALLED: 'plugin:installed',
        PLUGIN_UNINSTALLED: 'plugin:uninstalled',
    },
}));

// ─── Tests ──────────────────────────────────────────────────

describe('PluginController', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('InitializePluginSystem', () =>
    {
        it('should load demo registry entries when fetch returns empty', async () =>
        {
            await InitializePluginSystem();

            expect(mockSetPluginRegistryLoading).toHaveBeenCalledWith(true);
            expect(mockSetPluginRegistryEntries).toHaveBeenCalled();
            expect(mockSetPluginRegistryLoading).toHaveBeenCalledWith(false);
        });

        it('should skip when plugins are disabled', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValueOnce({
                settings: { pluginsEnabled: false, pluginRegistryUrl: '' },
                pluginInstances: [],
                pluginCommands: [],
                SetPluginInstances: mockSetPluginInstances,
                SetPluginRegistryEntries: mockSetPluginRegistryEntries,
                SetPluginRegistryLoading: mockSetPluginRegistryLoading,
                UnregisterAllByPluginId: mockUnregisterAllByPluginId,
            });

            await InitializePluginSystem();

            expect(mockSetPluginRegistryLoading).not.toHaveBeenCalled();
        });

        it('should complete without throwing on error', async () =>
        {
            await expect(InitializePluginSystem()).resolves.toBeUndefined();
        });
    });

    describe('DeactivatePlugin', () =>
    {
        it('should do nothing when plugin is not found', async () =>
        {
            await DeactivatePlugin('non-existent');

            expect(mockSetPluginInstances).not.toHaveBeenCalled();
        });

        it('should cleanup plugin context on deactivation', async () =>
        {
            const { CleanupPluginContext } = await import('../Notemac/Services/PluginAPIService');

            (useNotemacStore.getState as any).mockReturnValue({
                settings: { pluginsEnabled: true, pluginRegistryUrl: '' },
                pluginInstances: [
                    { id: 'test-plugin', manifest: { id: 'test-plugin' }, status: 'active', context: {}, module: { deactivate: vi.fn() } },
                ],
                pluginCommands: [],
                SetPluginInstances: mockSetPluginInstances,
                SetPluginRegistryEntries: mockSetPluginRegistryEntries,
                SetPluginRegistryLoading: mockSetPluginRegistryLoading,
                UnregisterAllByPluginId: mockUnregisterAllByPluginId,
            });

            await DeactivatePlugin('test-plugin');

            expect(CleanupPluginContext).toHaveBeenCalledWith('test-plugin');
            expect(mockSetPluginInstances).toHaveBeenCalled();
        });
    });

    describe('GetPluginStatus', () =>
    {
        it('should return inactive for unknown plugin', () =>
        {
            expect('inactive' === GetPluginStatus('unknown')).toBe(true);
        });
    });

    describe('SetPluginDirectoryHandle / GetPluginDirectoryHandle', () =>
    {
        it('should store and retrieve directory handle', () =>
        {
            const mockHandle = {} as FileSystemDirectoryHandle;
            SetPluginDirectoryHandle(mockHandle);
            expect(mockHandle === GetPluginDirectoryHandle()).toBe(true);

            SetPluginDirectoryHandle(null);
            expect(null === GetPluginDirectoryHandle()).toBe(true);
        });
    });
});
