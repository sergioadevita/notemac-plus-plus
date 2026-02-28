import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    StashChanges,
    PopStash,
    ApplyStash,
    DropStash,
    ListStashes,
    GetStashCount,
    ClearAllStashes,
} from '../Notemac/Controllers/Git/GitStashController';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { GIT_STASH_CHANGED: 'GIT_STASH_CHANGED' },
}));

vi.mock('../Shared/Helpers/IdHelpers', () => ({
    generateId: vi.fn(() => 'abc123def456'),
}));

import { useNotemacStore } from '../Notemac/Model/Store';
import { Dispatch } from '../Shared/EventDispatcher/EventDispatcher';

describe('GitStashController', () =>
{
    const mockStashes = [
        { index: 0, message: 'WIP on main', date: '2025-12-01', hash: 'abc123' },
        { index: 1, message: 'Save progress', date: '2025-11-28', hash: 'def456' },
    ];

    beforeEach(() =>
    {
        (useNotemacStore.getState as any).mockReturnValue({
            stashes: mockStashes,
            SetStashes: vi.fn(),
            gitStatus: { stagedFiles: [], unstagedFiles: [{ path: 'test.ts', status: 'modified' }], untrackedFiles: [] },
            currentBranch: 'main',
            GetChangedFileCount: vi.fn(() => 1),
        });
        vi.clearAllMocks();
    });

    describe('StashChanges', () =>
    {
        it('should create a new stash entry', async () =>
        {
            const mockSetStashes = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: mockSetStashes,
                gitStatus: { stagedFiles: [], unstagedFiles: [{ path: 'test.ts', status: 'modified' }], untrackedFiles: [] },
                currentBranch: 'main',
                GetChangedFileCount: vi.fn(() => 1),
            });
            const result = await StashChanges('test stash');
            expect(null !== result).toBe(true);
            expect(mockSetStashes).toHaveBeenCalled();
        });

        it('should return false when no changes to stash', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: vi.fn(),
                gitStatus: { stagedFiles: [], unstagedFiles: [], untrackedFiles: [] },
                currentBranch: 'main',
                GetChangedFileCount: vi.fn(() => 0),
            });
            const result = await StashChanges('test stash');
            expect(result).toBe(false);
        });

        it('should dispatch stash changed event', async () =>
        {
            await StashChanges('test');
            expect(Dispatch).toHaveBeenCalled();
        });

        it('should accept optional message parameter', async () =>
        {
            const result = await StashChanges();
            expect(typeof result).toBe('boolean');
        });

        it('should return false when gitStatus is null', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: vi.fn(),
                gitStatus: null,
                currentBranch: 'main',
                GetChangedFileCount: vi.fn(() => 0),
            });
            const result = await StashChanges('test');
            expect(result).toBe(false);
        });
    });

    describe('PopStash', () =>
    {
        it('should remove stash at specified index', async () =>
        {
            const mockSetStashes = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: mockSetStashes,
            });
            const result = await PopStash(0);
            expect(true === result).toBe(true);
            expect(mockSetStashes).toHaveBeenCalled();
        });

        it('should return false for out of range index', async () =>
        {
            const result = await PopStash(99);
            expect(result).toBe(false);
        });

        it('should dispatch stash changed event', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: vi.fn(),
            });
            await PopStash(0);
            expect(Dispatch).toHaveBeenCalled();
        });

        it('should re-index remaining stashes', async () =>
        {
            const mockSetStashes = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: mockSetStashes,
            });
            await PopStash(0);
            const newStashes = mockSetStashes.mock.calls[0]?.[0];
            if (null !== newStashes && 0 < newStashes.length)
            {
                expect(newStashes[0].index).toBe(0);
            }
        });
    });

    describe('ApplyStash', () =>
    {
        it('should apply stash without removing it', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: vi.fn(),
            });
            const result = await ApplyStash(0);
            expect(true === result).toBe(true);
        });

        it('should return false for invalid index', async () =>
        {
            const result = await ApplyStash(-1);
            expect(result).toBe(false);
        });

        it('should return false for out of bounds index', async () =>
        {
            const result = await ApplyStash(99);
            expect(result).toBe(false);
        });
    });

    describe('DropStash', () =>
    {
        it('should remove stash entry', async () =>
        {
            const mockSetStashes = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: mockSetStashes,
            });
            const result = await DropStash(0);
            expect(true === result).toBe(true);
            expect(mockSetStashes).toHaveBeenCalled();
        });

        it('should return false for invalid index', async () =>
        {
            const result = await DropStash(99);
            expect(result).toBe(false);
        });
    });

    describe('ListStashes', () =>
    {
        it('should return current stash list', async () =>
        {
            const result = await ListStashes();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return stashes from store', async () =>
        {
            const result = await ListStashes();
            expect(result.length).toBe(2);
        });

        it('should return empty array when no stashes', async () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: vi.fn(),
            });
            const result = await ListStashes();
            expect(result.length).toBe(0);
        });
    });

    describe('GetStashCount', () =>
    {
        it('should return count of stashes', () =>
        {
            const count = GetStashCount();
            expect(count).toBe(2);
        });

        it('should return zero when no stashes', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: vi.fn(),
            });
            const count = GetStashCount();
            expect(count).toBe(0);
        });
    });

    describe('ClearAllStashes', () =>
    {
        it('should clear all stashes', () =>
        {
            const mockSetStashes = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [...mockStashes],
                SetStashes: mockSetStashes,
            });
            ClearAllStashes();
            expect(mockSetStashes).toHaveBeenCalledWith([]);
        });

        it('should dispatch stash changed event', () =>
        {
            ClearAllStashes();
            expect(Dispatch).toHaveBeenCalled();
        });

        it('should not throw when already empty', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                stashes: [],
                SetStashes: vi.fn(),
            });
            expect(() => ClearAllStashes()).not.toThrow();
        });
    });
});
