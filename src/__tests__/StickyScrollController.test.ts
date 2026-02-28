import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    IsStickyScrollEnabled,
    ToggleStickyScroll,
    SetStickyScrollEnabled,
    GetStickyScrollEditorOption,
} from '../Notemac/Controllers/StickyScrollController';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

describe('StickyScrollController', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            settings: { stickyScrollEnabled: false },
            updateSettings: vi.fn(),
        };
        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    describe('ToggleStickyScroll', () =>
    {
        it('should toggle sticky scroll state', () =>
        {
            const result = ToggleStickyScroll();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should return boolean value', () =>
        {
            const result = ToggleStickyScroll();
            expect(true === result || false === result).toBe(true);
        });

        it('should call updateSettings on toggle', () =>
        {
            mockStore = {
                settings: { stickyScrollEnabled: false },
                updateSettings: vi.fn(),
            };
            (useNotemacStore.getState as any).mockReturnValue(mockStore);

            ToggleStickyScroll();
            expect(mockStore.updateSettings).toHaveBeenCalled();
        });
    });

    describe('IsStickyScrollEnabled', () =>
    {
        it('should return boolean indicating enabled state', () =>
        {
            const result = IsStickyScrollEnabled();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should reflect current enabled state', () =>
        {
            mockStore = {
                settings: { stickyScrollEnabled: true },
            };
            (useNotemacStore.getState as any).mockReturnValue(mockStore);
            expect(true === IsStickyScrollEnabled()).toBe(true);
        });

        it('should reflect disabled state', () =>
        {
            mockStore = {
                settings: { stickyScrollEnabled: false },
            };
            (useNotemacStore.getState as any).mockReturnValue(mockStore);
            expect(false === IsStickyScrollEnabled()).toBe(true);
        });
    });

    describe('SetStickyScrollEnabled', () =>
    {
        it('should not throw when setting to true', () =>
        {
            expect(() => SetStickyScrollEnabled(true)).not.toThrow();
        });

        it('should not throw when setting to false', () =>
        {
            expect(() => SetStickyScrollEnabled(false)).not.toThrow();
        });

        it('should call updateSettings with correct value', () =>
        {
            mockStore = {
                settings: { stickyScrollEnabled: false },
                updateSettings: vi.fn(),
            };
            (useNotemacStore.getState as any).mockReturnValue(mockStore);

            SetStickyScrollEnabled(true);
            expect(mockStore.updateSettings).toHaveBeenCalledWith({ stickyScrollEnabled: true });
        });
    });

    describe('GetStickyScrollEditorOption', () =>
    {
        it('should return editor option with stickyScroll enabled', () =>
        {
            const result = GetStickyScrollEditorOption(true);
            expect(true === result.stickyScroll.enabled).toBe(true);
            expect(5 === result.stickyScroll.maxLineCount).toBe(true);
        });

        it('should return editor option with stickyScroll disabled', () =>
        {
            const result = GetStickyScrollEditorOption(false);
            expect(false === result.stickyScroll.enabled).toBe(true);
            expect(5 === result.stickyScroll.maxLineCount).toBe(true);
        });

        it('should have proper structure for Monaco editor', () =>
        {
            const result = GetStickyScrollEditorOption(true);
            expect('stickyScroll' in result).toBe(true);
            expect('enabled' in result.stickyScroll).toBe(true);
            expect('maxLineCount' in result.stickyScroll).toBe(true);
        });

        it('should always have maxLineCount of 5', () =>
        {
            const resultEnabled = GetStickyScrollEditorOption(true);
            const resultDisabled = GetStickyScrollEditorOption(false);
            expect(5 === resultEnabled.stickyScroll.maxLineCount).toBe(true);
            expect(5 === resultDisabled.stickyScroll.maxLineCount).toBe(true);
        });

        it('should respect enabled parameter', () =>
        {
            const resultTrue = GetStickyScrollEditorOption(true);
            const resultFalse = GetStickyScrollEditorOption(false);
            expect(resultTrue.stickyScroll.enabled).not.toBe(resultFalse.stickyScroll.enabled);
        });
    });
});
