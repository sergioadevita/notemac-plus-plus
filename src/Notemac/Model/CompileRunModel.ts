/**
 * CompileRunModel — Zustand slice for Compile & Run state management.
 *
 * Tracks execution state, output, history, and runtime cache statuses.
 */

import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { LIMIT_COMPILE_RUN_HISTORY, LIMIT_COMPILE_RUN_OUTPUT } from '../Commons/Constants';

export type CompileRunStatus = 'idle' | 'compiling' | 'running' | 'success' | 'failed' | 'cancelled';
export type RuntimeCacheState = 'cached' | 'downloading' | 'not-cached' | 'error';

export interface CompileRunExecution
{
    languageId: string;
    startTime: number;
    endTime?: number;
    output: string[];
    stderr: string[];
    exitCode?: number;
    status: CompileRunStatus;
}

export interface RunConfiguration
{
    args: string[];
    stdin: string;
    env: Record<string, string>;
    cwd: string;
    timeout: number;
}

export interface NotemacCompileRunSlice
{
    compileRunStatus: CompileRunStatus;
    compileRunExecution: CompileRunExecution | null;
    compileRunHistory: CompileRunExecution[];
    compileRunPanelVisible: boolean;
    runtimeCacheStatuses: Record<string, RuntimeCacheState>;
    runConfigurations: Record<string, Partial<RunConfiguration>>;
    showRunConfigDialog: boolean;

    StartCompileRun: (languageId: string) => void;
    AppendCompileRunOutput: (line: string) => void;
    AppendCompileRunStderr: (line: string) => void;
    CompleteCompileRun: (exitCode: number) => void;
    CancelCompileRun: () => void;
    SetCompileRunPanelVisible: (visible: boolean) => void;
    SetRuntimeCacheStatus: (languageId: string, status: RuntimeCacheState) => void;
    SetRunConfiguration: (languageId: string, config: Partial<RunConfiguration>) => void;
    SetShowRunConfigDialog: (show: boolean) => void;
    ClearCompileRunHistory: () => void;
}

// ─── Zustand Slice Creator ──────────────────────────────────────

export const createCompileRunSlice: StateCreator<NotemacCompileRunSlice, [], [], NotemacCompileRunSlice> = (set, get) =>
({
    compileRunStatus: 'idle',
    compileRunExecution: null,
    compileRunHistory: [],
    compileRunPanelVisible: false,
    runtimeCacheStatuses: {},
    runConfigurations: {},
    showRunConfigDialog: false,

    StartCompileRun: (languageId) =>
    {
        const execution: CompileRunExecution = {
            languageId,
            startTime: Date.now(),
            output: [],
            stderr: [],
            status: 'running',
        };
        set({ compileRunExecution: execution, compileRunStatus: 'running', compileRunPanelVisible: true });
    },

    AppendCompileRunOutput: (line) =>
    {
        set(produce((state: NotemacCompileRunSlice) =>
        {
            if (null !== state.compileRunExecution)
            {
                if (state.compileRunExecution.output.length < LIMIT_COMPILE_RUN_OUTPUT)
                {
                    state.compileRunExecution.output.push(line);
                }
            }
        }));
    },

    AppendCompileRunStderr: (line) =>
    {
        set(produce((state: NotemacCompileRunSlice) =>
        {
            if (null !== state.compileRunExecution)
            {
                if (state.compileRunExecution.stderr.length < LIMIT_COMPILE_RUN_OUTPUT)
                {
                    state.compileRunExecution.stderr.push(line);
                }
                // Also push to output (interleaved) for display
                if (state.compileRunExecution.output.length < LIMIT_COMPILE_RUN_OUTPUT)
                {
                    state.compileRunExecution.output.push(`\x1b[31m${line}\x1b[0m`);
                }
            }
        }));
    },

    CompleteCompileRun: (exitCode) =>
    {
        const current = get().compileRunExecution;
        if (null === current)
            return;

        const completed: CompileRunExecution = {
            ...current,
            endTime: Date.now(),
            exitCode,
            status: 0 === exitCode ? 'success' : 'failed',
        };

        set(produce((state: NotemacCompileRunSlice) =>
        {
            // Keep the completed execution visible in the panel (not null)
            state.compileRunExecution = completed as any;
            state.compileRunStatus = completed.status;
            state.compileRunHistory.unshift(completed);
            if (state.compileRunHistory.length > LIMIT_COMPILE_RUN_HISTORY)
            {
                state.compileRunHistory = state.compileRunHistory.slice(0, LIMIT_COMPILE_RUN_HISTORY);
            }
        }));
    },

    CancelCompileRun: () =>
    {
        const current = get().compileRunExecution;
        if (null === current)
            return;

        const cancelled: CompileRunExecution = {
            ...current,
            endTime: Date.now(),
            exitCode: -1,
            status: 'cancelled',
        };

        set(produce((state: NotemacCompileRunSlice) =>
        {
            // Keep the cancelled execution visible in the panel (not null)
            state.compileRunExecution = cancelled as any;
            state.compileRunStatus = 'cancelled';
            state.compileRunHistory.unshift(cancelled);
            if (state.compileRunHistory.length > LIMIT_COMPILE_RUN_HISTORY)
            {
                state.compileRunHistory = state.compileRunHistory.slice(0, LIMIT_COMPILE_RUN_HISTORY);
            }
        }));
    },

    SetCompileRunPanelVisible: (visible) =>
    {
        set({ compileRunPanelVisible: visible });
    },

    SetRuntimeCacheStatus: (languageId, status) =>
    {
        set(produce((state: NotemacCompileRunSlice) =>
        {
            state.runtimeCacheStatuses[languageId] = status;
        }));
    },

    SetRunConfiguration: (languageId, config) =>
    {
        set(produce((state: NotemacCompileRunSlice) =>
        {
            state.runConfigurations[languageId] = { ...state.runConfigurations[languageId], ...config };
        }));
    },

    SetShowRunConfigDialog: (show) =>
    {
        set({ showRunConfigDialog: show });
    },

    ClearCompileRunHistory: () =>
    {
        const current = get().compileRunExecution;
        const isRunning = null !== current && undefined === current.exitCode;

        if (isRunning)
        {
            // Clear output but keep the active execution alive
            set(produce((state: NotemacCompileRunSlice) =>
            {
                if (null !== state.compileRunExecution)
                {
                    state.compileRunExecution.output = [];
                    state.compileRunExecution.stderr = [];
                }
                state.compileRunHistory = [];
            }));
        }
        else
        {
            // Clear everything including the completed/cancelled execution
            set({ compileRunExecution: null, compileRunHistory: [], compileRunStatus: 'idle' });
        }
    },
});
