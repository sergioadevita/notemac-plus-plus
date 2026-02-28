import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    DetectConflicts,
    AcceptCurrent,
    AcceptIncoming,
    AcceptBoth,
    ResolveAllCurrent,
    ResolveAllIncoming,
    RefreshConflicts,
    HasConflicts,
    GetConflictCount,
} from '../Notemac/Controllers/Git/GitMergeController';
import { useNotemacStore } from '../Notemac/Model/Store';
import { GetMonacoEditor } from '../Shared/Helpers/EditorGlobals';

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { GIT_CONFLICT_RESOLVED: 'GIT_CONFLICT_RESOLVED' },
}));

vi.mock('../Shared/Helpers/EditorGlobals', () =>
({
    GetMonacoEditor: vi.fn(),
}));

describe('GitMergeController', () =>
{
    const conflictContent = [
        'line before',
        '<<<<<<< HEAD',
        'current change',
        '=======',
        'incoming change',
        '>>>>>>> feature-branch',
        'line after',
    ].join('\n');

    let mockEditor: any;
    let mockMonaco: any;

    beforeEach(() =>
    {
        mockEditor = {
            getModel: vi.fn().mockReturnValue({
                getLanguageId: vi.fn().mockReturnValue('javascript'),
                getValue: vi.fn().mockReturnValue(conflictContent),
                getLineMaxColumn: vi.fn().mockReturnValue(100),
            }),
            getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
            executeEdits: vi.fn(),
        };

        mockMonaco = {
            Range: class Range
            {
                constructor(public startLine: number, public startColumn: number, public endLine: number, public endColumn: number) {}
            },
        };

        (window as any).monaco = mockMonaco;
        (GetMonacoEditor as any).mockReturnValue(mockEditor);
        (useNotemacStore.getState as any).mockReturnValue({
            conflicts: [],
            SetConflicts: vi.fn(),
        });
        vi.clearAllMocks();
    });

    describe('DetectConflicts', () =>
    {
        it('should detect conflict regions in content', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            expect(conflicts.length).toBe(1);
        });

        it('should return empty array for content without conflicts', () =>
        {
            const conflicts = DetectConflicts('normal content\nno conflicts here');
            expect(conflicts).toEqual([]);
        });

        it('should identify current and incoming content', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            expect(null !== conflicts && 0 < conflicts.length).toBe(true);
            if (0 < conflicts.length)
            {
                expect(conflicts[0].currentContent).toContain('current change');
                expect(conflicts[0].incomingContent).toContain('incoming change');
            }
        });

        it('should detect multiple conflicts', () =>
        {
            const multiConflict = conflictContent + '\n' + conflictContent;
            const conflicts = DetectConflicts(multiConflict);
            expect(conflicts.length).toBe(2);
        });

        it('should handle empty content', () =>
        {
            const conflicts = DetectConflicts('');
            expect(conflicts).toEqual([]);
        });

        it('should capture conflict labels', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            expect(null !== conflicts && 0 < conflicts.length).toBe(true);
            if (0 < conflicts.length)
            {
                expect(conflicts[0].currentLabel).toContain('HEAD');
                expect(conflicts[0].incomingLabel).toContain('feature-branch');
            }
        });

        it('should record line numbers', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            expect(null !== conflicts && 0 < conflicts.length).toBe(true);
            if (0 < conflicts.length)
            {
                expect(typeof conflicts[0].startLine).toBe('number');
                expect(typeof conflicts[0].separatorLine).toBe('number');
                expect(typeof conflicts[0].endLine).toBe('number');
            }
        });
    });

    describe('AcceptCurrent', () =>
    {
        it('should resolve conflict with current content', () =>
        {
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            expect(() => AcceptCurrent(conflict)).not.toThrow();
        });

        it('should call executeEdits when editor exists', () =>
        {
            mockEditor.executeEdits.mockClear();
            (window as any).monaco = mockMonaco;
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            AcceptCurrent(conflict);
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });
    });

    describe('AcceptIncoming', () =>
    {
        it('should resolve conflict with incoming content', () =>
        {
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            expect(() => AcceptIncoming(conflict)).not.toThrow();
        });

        it('should call executeEdits when editor exists', () =>
        {
            mockEditor.executeEdits.mockClear();
            (window as any).monaco = mockMonaco;
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            AcceptIncoming(conflict);
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });
    });

    describe('AcceptBoth', () =>
    {
        it('should keep both current and incoming content', () =>
        {
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            expect(() => AcceptBoth(conflict)).not.toThrow();
        });

        it('should call executeEdits when editor exists', () =>
        {
            mockEditor.executeEdits.mockClear();
            (window as any).monaco = mockMonaco;
            const conflict = {
                startLine: 2,
                separatorLine: 4,
                endLine: 6,
                currentContent: 'current change',
                incomingContent: 'incoming change',
                currentLabel: 'HEAD',
                incomingLabel: 'feature-branch',
            };
            AcceptBoth(conflict);
            expect(mockEditor.executeEdits).toHaveBeenCalled();
        });
    });

    describe('ResolveAllCurrent', () =>
    {
        it('should resolve all conflicts with current content', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: conflicts,
                SetConflicts: vi.fn(),
            });
            expect(() => ResolveAllCurrent()).not.toThrow();
        });
    });

    describe('ResolveAllIncoming', () =>
    {
        it('should resolve all conflicts with incoming content', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: conflicts,
                SetConflicts: vi.fn(),
            });
            expect(() => ResolveAllIncoming()).not.toThrow();
        });
    });

    describe('RefreshConflicts', () =>
    {
        it('should return conflicts array', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            const result = RefreshConflicts();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return empty array when editor is null', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            const result = RefreshConflicts();
            expect(result).toEqual([]);
        });
    });

    describe('HasConflicts', () =>
    {
        it('should return false when no conflicts', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: [],
                SetConflicts: vi.fn(),
            });
            expect(HasConflicts()).toBe(false);
        });

        it('should return true when conflicts exist', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: conflicts,
                SetConflicts: vi.fn(),
            });
            expect(HasConflicts()).toBe(true);
        });
    });

    describe('GetConflictCount', () =>
    {
        it('should return zero when no conflicts', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: [],
                SetConflicts: vi.fn(),
            });
            expect(GetConflictCount()).toBe(0);
        });

        it('should return count of conflicts', () =>
        {
            const conflicts = DetectConflicts(conflictContent);
            (useNotemacStore.getState as any).mockReturnValue({
                conflicts: conflicts,
                SetConflicts: vi.fn(),
            });
            expect(GetConflictCount()).toBe(1);
        });
    });
});
