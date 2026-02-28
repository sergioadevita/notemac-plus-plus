import { describe, it, expect, vi } from 'vitest';
import { createPluginSlice } from '../Notemac/Model/PluginModel';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(),
}));

describe('PluginIntegration', () =>
{
    it('should import createPluginSlice successfully', () =>
    {
        expect(typeof createPluginSlice).toBe('function');
    });

    it('should initialize plugin slice with empty state arrays', () =>
    {
        const mockSet = vi.fn();
        const slice = createPluginSlice(mockSet as any);

        expect(Array.isArray(slice.pluginInstances)).toBe(true);
        expect(slice.pluginInstances.length === 0).toBe(true);
        expect(Array.isArray(slice.pluginSidebarPanels)).toBe(true);
    });

    it('should have all required plugin registration methods', () =>
    {
        const mockSet = vi.fn();
        const slice = createPluginSlice(mockSet as any);

        expect(typeof slice.RegisterPluginCommand).toBe('function');
        expect(typeof slice.RegisterPluginSidebarPanel).toBe('function');
        expect(typeof slice.UnregisterPluginCommand).toBe('function');
        expect(null !== slice.SetPluginInstances).toBe(true);
    });

    it('should have UnregisterAllByPluginId bulk operation method', () =>
    {
        const mockSet = vi.fn();
        const slice = createPluginSlice(mockSet as any);

        expect(typeof slice.UnregisterAllByPluginId).toBe('function');
    });
})