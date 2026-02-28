import { useNotemacStore } from '../Model/Store';
import { RunDiagnosticsDebounced, ClearDebounceTimer } from '../Services/DiagnosticService';
import type { DiagnosticItem } from '../Commons/Types';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import { GetMonacoEditor } from '../../Shared/Helpers/EditorGlobals';

/**
 * DiagnosticController — Orchestrates diagnostic runs and manages diagnostic markers.
 */

export function ToggleDiagnostics(): boolean
{
    const store = useNotemacStore.getState();
    const newValue = !store.settings.diagnosticsEnabled;
    store.updateSettings({ diagnosticsEnabled: newValue });

    if (!newValue)
    {
        store.SetDiagnostics([]);
        ClearDebounceTimer();
    }

    return newValue;
}

export function IsDiagnosticsEnabled(): boolean
{
    return useNotemacStore.getState().settings.diagnosticsEnabled;
}

export function RequestDiagnostics(content: string, language: string): void
{
    const store = useNotemacStore.getState();
    if (!store.settings.diagnosticsEnabled)
        return;

    RunDiagnosticsDebounced(content, language, (items: DiagnosticItem[]) =>
    {
        store.SetDiagnostics(items);
        ApplyDiagnosticMarkers(items, language);
        Dispatch(NOTEMAC_EVENTS.DIAGNOSTICS_UPDATED, items);
    });
}

export function ApplyDiagnosticMarkers(items: DiagnosticItem[], _language: string): void
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return;

    const model = editor.getModel();
    if (null === model)
        return;

    // Use Monaco's marker API
    const monaco = (window as any).monaco;
    if (undefined === monaco || null === monaco)
        return;

    const severityMap: Record<string, number> =
    {
        error: 8,
        warning: 4,
        info: 2,
        hint: 1,
    };

    const markers = items.map(item => ({
        severity: severityMap[item.severity] || 2,
        message: item.message,
        startLineNumber: item.startLineNumber,
        startColumn: item.startColumn,
        endLineNumber: item.endLineNumber,
        endColumn: item.endColumn,
        source: item.source,
        code: item.code,
    }));

    monaco.editor.setModelMarkers(model, 'notemac-diagnostics', markers);
}

export function GoToNextError(): void
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return;

    const diagnostics = useNotemacStore.getState().diagnostics;
    const errors = diagnostics.filter(d => 'error' === d.severity || 'warning' === d.severity);

    if (0 === errors.length)
        return;

    const pos = editor.getPosition();
    if (null === pos)
        return;

    // Find next error after current position
    const next = errors.find(e => e.startLineNumber > pos.lineNumber ||
        (e.startLineNumber === pos.lineNumber && e.startColumn > pos.column));

    const target = next || errors[0];
    editor.setPosition({ lineNumber: target.startLineNumber, column: target.startColumn });
    editor.revealLineInCenter(target.startLineNumber);
}

export function GoToPreviousError(): void
{
    const editor = GetMonacoEditor();
    if (null === editor)
        return;

    const diagnostics = useNotemacStore.getState().diagnostics;
    const errors = diagnostics.filter(d => 'error' === d.severity || 'warning' === d.severity);

    if (0 === errors.length)
        return;

    const pos = editor.getPosition();
    if (null === pos)
        return;

    // Find previous error before current position
    const reversed = [...errors].reverse();
    const prev = reversed.find(e => e.startLineNumber < pos.lineNumber ||
        (e.startLineNumber === pos.lineNumber && e.startColumn < pos.column));

    const target = prev || errors[errors.length - 1];
    editor.setPosition({ lineNumber: target.startLineNumber, column: target.startColumn });
    editor.revealLineInCenter(target.startLineNumber);
}

export function ToggleDiagnosticsPanel(): void
{
    const store = useNotemacStore.getState();
    store.SetDiagnosticsPanelVisible(!store.diagnosticsPanelVisible);
}

export function GetErrorCount(): number
{
    return useNotemacStore.getState().diagnostics.filter(d => 'error' === d.severity).length;
}

export function GetWarningCount(): number
{
    return useNotemacStore.getState().diagnostics.filter(d => 'warning' === d.severity).length;
}
