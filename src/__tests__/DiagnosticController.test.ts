import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ToggleDiagnostics,
    IsDiagnosticsEnabled,
    RequestDiagnostics,
    ApplyDiagnosticMarkers,
    GoToNextError,
    GoToPreviousError,
    GetErrorCount,
    GetWarningCount,
} from '../Notemac/Controllers/DiagnosticController';
import { RunDiagnosticsDebounced, ClearDebounceTimer } from '../Notemac/Services/DiagnosticService';
import { GetMonacoEditor } from '../Shared/Helpers/EditorGlobals';
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Services/DiagnosticService', () =>
({
    RunDiagnosticsDebounced: vi.fn(),
    ClearDebounceTimer: vi.fn(),
}));

vi.mock('../Shared/Helpers/EditorGlobals', () =>
({
    GetMonacoEditor: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () =>
({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: { DIAGNOSTICS_UPDATED: 'DIAGNOSTICS_UPDATED', GIT_CONFLICT_RESOLVED: 'GIT_CONFLICT_RESOLVED' },
}));

vi.mock('../Notemac/Model/Store', () =>
({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

describe('DiagnosticController', () =>
{
    let mockEditor: any;

    beforeEach(() =>
    {
        mockEditor = {
            getModel: vi.fn().mockReturnValue({
                getLanguageId: vi.fn().mockReturnValue('javascript'),
                getValue: vi.fn().mockReturnValue(''),
            }),
            getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
            setPosition: vi.fn(),
            revealLineInCenter: vi.fn(),
        };
        (GetMonacoEditor as any).mockReturnValue(mockEditor);
        (useNotemacStore.getState as any).mockReturnValue({
            settings: { diagnosticsEnabled: true },
            diagnostics: [],
            SetDiagnostics: vi.fn(),
            SetDiagnosticsPanelVisible: vi.fn(),
            diagnosticsPanelVisible: false,
        });
        vi.clearAllMocks();
    });

    describe('ToggleDiagnostics', () =>
    {
        it('should toggle diagnostics state', () =>
        {
            const stateUpdate = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: true },
                updateSettings: stateUpdate,
                SetDiagnostics: vi.fn(),
                SetDiagnosticsPanelVisible: vi.fn(),
            });
            const result = ToggleDiagnostics();
            expect('boolean' === typeof result).toBe(true);
        });

        it('should return boolean', () =>
        {
            const mockUpdateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: true },
                updateSettings: mockUpdateSettings,
                SetDiagnostics: vi.fn(),
                SetDiagnosticsPanelVisible: vi.fn(),
            });
            const result = ToggleDiagnostics();
            expect(true === result || false === result).toBe(true);
        });

        it('should call updateSettings when toggling', () =>
        {
            const mockUpdateSettings = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: true },
                updateSettings: mockUpdateSettings,
                SetDiagnostics: vi.fn(),
                SetDiagnosticsPanelVisible: vi.fn(),
            });
            ToggleDiagnostics();
            expect(mockUpdateSettings).toHaveBeenCalled();
        });

        it('should clear diagnostics when disabling', () =>
        {
            const mockSetDiagnostics = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: true },
                updateSettings: vi.fn(),
                SetDiagnostics: mockSetDiagnostics,
                SetDiagnosticsPanelVisible: vi.fn(),
            });
            ToggleDiagnostics();
            expect(mockSetDiagnostics).toHaveBeenCalledWith([]);
        });
    });

    describe('IsDiagnosticsEnabled', () =>
    {
        it('should return true when diagnostics are enabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: true },
            });
            expect(true === IsDiagnosticsEnabled()).toBe(true);
        });

        it('should return false when diagnostics are disabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: false },
            });
            expect(false === IsDiagnosticsEnabled()).toBe(true);
        });
    });

    describe('RequestDiagnostics', () =>
    {
        it('should not throw when called', () =>
        {
            expect(() => RequestDiagnostics('test code', 'javascript')).not.toThrow();
        });

        it('should skip when diagnostics disabled', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                settings: { diagnosticsEnabled: false },
            });
            vi.clearAllMocks();
            RequestDiagnostics('test', 'javascript');
            expect(RunDiagnosticsDebounced).not.toHaveBeenCalled();
        });
    });

    describe('ApplyDiagnosticMarkers', () =>
    {
        it('should not throw when editor is null', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            expect(() => ApplyDiagnosticMarkers([], 'javascript')).not.toThrow();
        });

        it('should not throw with empty diagnostics', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            expect(() => ApplyDiagnosticMarkers([], 'javascript')).not.toThrow();
        });
    });

    describe('GoToNextError', () =>
    {
        it('should not throw when editor is null', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            expect(() => GoToNextError()).not.toThrow();
        });

        it('should not throw when no diagnostics exist', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [],
            });
            expect(() => GoToNextError()).not.toThrow();
        });

        it('should navigate to next error', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, message: 'error1' },
                    { severity: 'error', startLineNumber: 10, startColumn: 1, endLineNumber: 10, endColumn: 10, message: 'error2' },
                ],
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            GoToNextError();
            expect(mockEditor.setPosition).toHaveBeenCalled();
        });

        it('should wrap to first error when at end', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, message: 'error1' },
                ],
            });
            mockEditor.getPosition.mockReturnValue({ lineNumber: 10, column: 1 });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            GoToNextError();
            expect(mockEditor.setPosition).toHaveBeenCalled();
        });

        it('should handle errors and warnings', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'warning', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, message: 'warning1' },
                    { severity: 'error', startLineNumber: 10, startColumn: 1, endLineNumber: 10, endColumn: 10, message: 'error1' },
                ],
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            GoToNextError();
            expect(mockEditor.setPosition).toHaveBeenCalled();
        });
    });

    describe('GoToPreviousError', () =>
    {
        it('should not throw when editor is null', () =>
        {
            (GetMonacoEditor as any).mockReturnValue(null);
            expect(() => GoToPreviousError()).not.toThrow();
        });

        it('should not throw when no diagnostics exist', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [],
            });
            expect(() => GoToPreviousError()).not.toThrow();
        });

        it('should navigate to previous error', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, message: 'error1' },
                    { severity: 'error', startLineNumber: 10, startColumn: 1, endLineNumber: 10, endColumn: 10, message: 'error2' },
                ],
            });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            GoToPreviousError();
            expect(mockEditor.setPosition).toHaveBeenCalled();
        });

        it('should wrap to last error when at beginning', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, message: 'error1' },
                ],
            });
            mockEditor.getPosition.mockReturnValue({ lineNumber: 1, column: 1 });
            (GetMonacoEditor as any).mockReturnValue(mockEditor);
            GoToPreviousError();
            expect(mockEditor.setPosition).toHaveBeenCalled();
        });
    });

    describe('GetErrorCount', () =>
    {
        it('should return error count', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, message: 'error' },
                    { severity: 'warning', startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5, message: 'warning' },
                ],
            });
            expect(1 === GetErrorCount()).toBe(true);
        });

        it('should return 0 when no errors', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [],
            });
            expect(0 === GetErrorCount()).toBe(true);
        });

        it('should only count error severity, not warnings', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'warning', startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, message: 'warning1' },
                    { severity: 'warning', startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5, message: 'warning2' },
                    { severity: 'error', startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 5, message: 'error1' },
                ],
            });
            expect(1 === GetErrorCount()).toBe(true);
        });
    });

    describe('GetWarningCount', () =>
    {
        it('should return warning count', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, message: 'error' },
                    { severity: 'warning', startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5, message: 'warning' },
                ],
            });
            expect(1 === GetWarningCount()).toBe(true);
        });

        it('should return 0 when no warnings', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [],
            });
            expect(0 === GetWarningCount()).toBe(true);
        });

        it('should only count warning severity, not errors', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                diagnostics: [
                    { severity: 'error', startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5, message: 'error1' },
                    { severity: 'error', startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5, message: 'error2' },
                    { severity: 'warning', startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 5, message: 'warning1' },
                ],
            });
            expect(1 === GetWarningCount()).toBe(true);
        });
    });
});
