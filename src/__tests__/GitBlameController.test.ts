import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetBlameForFile, ToggleBlameView, IsBlameVisible, ClearBlameCache } from '../Notemac/Controllers/Git/GitBlameController';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

vi.mock('../../Shared/EventDispatcher/EventDispatcher', () => ({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { GIT_BLAME_UPDATED: 'GIT_BLAME_UPDATED' },
}));

import { useNotemacStore } from '../Notemac/Model/Store';

describe('GitBlameController', () =>
{
    beforeEach(() =>
    {
        (useNotemacStore.getState as any).mockReturnValue({
            blameVisible: false,
            blameData: [],
            SetBlameVisible: vi.fn(),
            SetBlameData: vi.fn(),
            commitLog: [
                { oid: 'abc123', message: 'initial commit', author: { name: 'John', email: 'john@test.com' }, timestamp: 1700000000 },
                { oid: 'def456', message: 'second commit', author: { name: 'Jane', email: 'jane@test.com' }, timestamp: 1700100000 },
            ],
        });
        ClearBlameCache();
        vi.clearAllMocks();
    });

    describe('GetBlameForFile', () =>
    {
        it('should return an array of blame info', async () =>
        {
            const result = await GetBlameForFile('/test.ts');
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return empty array for null path', async () =>
        {
            const result = await GetBlameForFile(null as any);
            expect(result).toEqual([]);
        });

        it('should return empty array for empty path', async () =>
        {
            const result = await GetBlameForFile('');
            expect(result).toEqual([]);
        });
    });

    describe('ToggleBlameView', () =>
    {
        it('should toggle blame visibility from false to true', () =>
        {
            const mockSetVisible = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                blameVisible: false,
                SetBlameVisible: mockSetVisible,
                SetBlameData: vi.fn(),
            });
            ToggleBlameView();
            expect(mockSetVisible).toHaveBeenCalledWith(true);
        });

        it('should toggle blame visibility from true to false', () =>
        {
            const mockSetVisible = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                blameVisible: true,
                SetBlameVisible: mockSetVisible,
                SetBlameData: vi.fn(),
            });
            ToggleBlameView();
            expect(mockSetVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('IsBlameVisible', () =>
    {
        it('should return current blame visibility', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                blameVisible: true,
            });
            expect(IsBlameVisible()).toBe(true);
        });

        it('should return false when blame is hidden', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                blameVisible: false,
            });
            expect(IsBlameVisible()).toBe(false);
        });
    });

    describe('ClearBlameCache', () =>
    {
        it('should not throw', () =>
        {
            expect(() => ClearBlameCache()).not.toThrow();
        });
    });
});
