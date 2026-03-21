import { describe, it, expect, beforeEach } from 'vitest';
import { useNotemacStore } from '../Notemac/Model/Store';
import type { CompileRunExecution } from '../Notemac/Model/CompileRunModel';
import { LIMIT_COMPILE_RUN_HISTORY, LIMIT_COMPILE_RUN_OUTPUT } from '../Notemac/Commons/Constants';

function resetStore(): void
{
    useNotemacStore.setState({
        compileRunStatus: 'idle',
        compileRunExecution: null,
        compileRunHistory: [],
        compileRunPanelVisible: false,
        runtimeCacheStatuses: {},
        runConfigurations: {},
        showRunConfigDialog: false,
    });
}

describe('CompileRunModel — Initial State', () =>
{
    beforeEach(() => resetStore());

    it('initializes with idle status', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.compileRunStatus).toBe('idle');
    });

    it('initializes with null execution', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.compileRunExecution).toBeNull();
    });

    it('initializes with empty history', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.compileRunHistory.length).toBe(0);
    });

    it('initializes with panel hidden', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.compileRunPanelVisible).toBe(false);
    });

    it('initializes with empty cache statuses', () =>
    {
        const state = useNotemacStore.getState();
        expect(Object.keys(state.runtimeCacheStatuses).length).toBe(0);
    });

    it('initializes with empty run configurations', () =>
    {
        const state = useNotemacStore.getState();
        expect(Object.keys(state.runConfigurations).length).toBe(0);
    });

    it('initializes with config dialog hidden', () =>
    {
        const state = useNotemacStore.getState();
        expect(state.showRunConfigDialog).toBe(false);
    });
});

describe('CompileRunModel — StartCompileRun', () =>
{
    beforeEach(() => resetStore());

    it('creates execution with correct languageId', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).not.toBeNull();
        expect(state.compileRunExecution?.languageId).toBe('python');
    });

    it('creates execution with startTime', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartCompileRun('javascript');
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(state.compileRunExecution?.startTime).toBeDefined();
        expect(state.compileRunExecution!.startTime >= beforeTime).toBe(true);
        expect(state.compileRunExecution!.startTime <= afterTime).toBe(true);
    });

    it('creates execution with empty output array', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('typescript');
        const state = useNotemacStore.getState();

        expect(Array.isArray(state.compileRunExecution?.output)).toBe(true);
        expect(state.compileRunExecution?.output.length).toBe(0);
    });

    it('creates execution with empty stderr array', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('rust');
        const state = useNotemacStore.getState();

        expect(Array.isArray(state.compileRunExecution?.stderr)).toBe(true);
        expect(state.compileRunExecution?.stderr.length).toBe(0);
    });

    it('creates execution with running status', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('go');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.status).toBe('running');
    });

    it('sets compileRunStatus to running', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('c');
        const state = useNotemacStore.getState();

        expect(state.compileRunStatus).toBe('running');
    });

    it('makes panel visible when starting execution', () =>
    {
        const store = useNotemacStore.getState();
        store.SetCompileRunPanelVisible(false);
        store.StartCompileRun('cpp');
        const state = useNotemacStore.getState();

        expect(state.compileRunPanelVisible).toBe(true);
    });

    it('replaces previous execution', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.StartCompileRun('javascript');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.languageId).toBe('javascript');
    });
});

describe('CompileRunModel — AppendCompileRunOutput', () =>
{
    beforeEach(() => resetStore());

    it('appends line to output array', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Line 1');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(1);
        expect(state.compileRunExecution?.output[0]).toBe('Line 1');
    });

    it('appends multiple lines in order', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Line 1');
        store.AppendCompileRunOutput('Line 2');
        store.AppendCompileRunOutput('Line 3');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(3);
        expect(state.compileRunExecution?.output[0]).toBe('Line 1');
        expect(state.compileRunExecution?.output[1]).toBe('Line 2');
        expect(state.compileRunExecution?.output[2]).toBe('Line 3');
    });

    it('ignores append when no execution is running', () =>
    {
        const store = useNotemacStore.getState();
        store.AppendCompileRunOutput('Orphan line');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).toBeNull();
    });

    it('respects LIMIT_COMPILE_RUN_OUTPUT', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        for (let i = 0; i < LIMIT_COMPILE_RUN_OUTPUT + 100; i++)
        {
            store.AppendCompileRunOutput(`Line ${i}`);
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(LIMIT_COMPILE_RUN_OUTPUT);
        expect(state.compileRunExecution?.output[0]).toBe('Line 0');
        expect(state.compileRunExecution?.output[LIMIT_COMPILE_RUN_OUTPUT - 1]).toBe(`Line ${LIMIT_COMPILE_RUN_OUTPUT - 1}`);
    });

    it('stops appending after output limit is reached', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        for (let i = 0; i < LIMIT_COMPILE_RUN_OUTPUT; i++)
        {
            store.AppendCompileRunOutput(`Line ${i}`);
        }

        store.AppendCompileRunOutput('Over limit');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(LIMIT_COMPILE_RUN_OUTPUT);
        expect(state.compileRunExecution?.output[LIMIT_COMPILE_RUN_OUTPUT - 1]).toBe(`Line ${LIMIT_COMPILE_RUN_OUTPUT - 1}`);
    });
});

describe('CompileRunModel — AppendCompileRunStderr', () =>
{
    beforeEach(() => resetStore());

    it('appends line to stderr array', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunStderr('Error 1');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.stderr.length).toBe(1);
        expect(state.compileRunExecution?.stderr[0]).toBe('Error 1');
    });

    it('adds red ANSI-wrapped line to output', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunStderr('Error message');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(1);
        expect(state.compileRunExecution?.output[0]).toBe('\x1b[31mError message\x1b[0m');
    });

    it('appends multiple stderr lines in order', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunStderr('Error 1');
        store.AppendCompileRunStderr('Error 2');
        store.AppendCompileRunStderr('Error 3');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.stderr.length).toBe(3);
        expect(state.compileRunExecution?.stderr[0]).toBe('Error 1');
        expect(state.compileRunExecution?.stderr[1]).toBe('Error 2');
        expect(state.compileRunExecution?.stderr[2]).toBe('Error 3');
    });

    it('adds all stderr to output with ANSI red wrapping', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunStderr('Err 1');
        store.AppendCompileRunStderr('Err 2');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(2);
        expect(state.compileRunExecution?.output[0]).toBe('\x1b[31mErr 1\x1b[0m');
        expect(state.compileRunExecution?.output[1]).toBe('\x1b[31mErr 2\x1b[0m');
    });

    it('respects LIMIT_COMPILE_RUN_OUTPUT for stderr', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        for (let i = 0; i < LIMIT_COMPILE_RUN_OUTPUT + 100; i++)
        {
            store.AppendCompileRunStderr(`Error ${i}`);
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.stderr.length).toBe(LIMIT_COMPILE_RUN_OUTPUT);
        expect(state.compileRunExecution?.stderr[0]).toBe('Error 0');
    });

    it('respects LIMIT_COMPILE_RUN_OUTPUT for output when appending stderr', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        for (let i = 0; i < LIMIT_COMPILE_RUN_OUTPUT + 100; i++)
        {
            store.AppendCompileRunStderr(`Error ${i}`);
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(LIMIT_COMPILE_RUN_OUTPUT);
    });

    it('ignores append when no execution is running', () =>
    {
        const store = useNotemacStore.getState();
        store.AppendCompileRunStderr('Orphan error');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).toBeNull();
    });
});

describe('CompileRunModel — CompleteCompileRun', () =>
{
    beforeEach(() => resetStore());

    it('sets status to success with exit code 0', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CompleteCompileRun(0);
        const state = useNotemacStore.getState();

        expect(state.compileRunStatus).toBe('success');
        expect(state.compileRunHistory[0].status).toBe('success');
    });

    it('sets status to failed with non-zero exit code', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CompleteCompileRun(1);
        const state = useNotemacStore.getState();

        expect(state.compileRunStatus).toBe('failed');
        expect(state.compileRunHistory[0].status).toBe('failed');
    });

    it('sets exitCode in completed execution', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CompleteCompileRun(42);
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory[0].exitCode).toBe(42);
    });

    it('sets endTime when completing', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartCompileRun('python');
        store.CompleteCompileRun(0);
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(state.compileRunHistory[0].endTime).toBeDefined();
        expect(state.compileRunHistory[0].endTime! >= beforeTime).toBe(true);
        expect(state.compileRunHistory[0].endTime! <= afterTime).toBe(true);
    });

    it('clears current execution', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CompleteCompileRun(0);
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).toBeNull();
    });

    it('moves execution to history with all properties', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Output 1');
        store.AppendCompileRunStderr('Error 1');
        store.CompleteCompileRun(1);
        const state = useNotemacStore.getState();

        const completed = state.compileRunHistory[0];
        expect(completed.languageId).toBe('python');
        expect(completed.output.length).toBe(2);
        expect(completed.stderr.length).toBe(1);
        expect(completed.exitCode).toBe(1);
        expect(completed.status).toBe('failed');
        expect(completed.startTime).toBeDefined();
        expect(completed.endTime).toBeDefined();
    });

    it('is no-op when no execution is running', () =>
    {
        const store = useNotemacStore.getState();
        store.CompleteCompileRun(0);
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(0);
        expect(state.compileRunExecution).toBeNull();
    });

    it('prepends newest execution to history (LIFO)', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.CompleteCompileRun(0);
        store.StartCompileRun('javascript');
        store.CompleteCompileRun(0);

        const state = useNotemacStore.getState();

        expect(state.compileRunHistory[0].languageId).toBe('javascript');
        expect(state.compileRunHistory[1].languageId).toBe('python');
    });
});

describe('CompileRunModel — CompleteCompileRun History Limit', () =>
{
    beforeEach(() => resetStore());

    it('respects LIMIT_COMPILE_RUN_HISTORY', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < LIMIT_COMPILE_RUN_HISTORY + 10; i++)
        {
            store.StartCompileRun(`lang-${i}`);
            store.CompleteCompileRun(0);
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(LIMIT_COMPILE_RUN_HISTORY);
    });

    it('keeps most recent executions when limit exceeded', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < LIMIT_COMPILE_RUN_HISTORY + 5; i++)
        {
            store.StartCompileRun(`lang-${i}`);
            store.CompleteCompileRun(0);
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory[0].languageId).toBe(`lang-${LIMIT_COMPILE_RUN_HISTORY + 4}`);
        expect(state.compileRunHistory[LIMIT_COMPILE_RUN_HISTORY - 1].languageId).toBe('lang-5');
    });
});

describe('CompileRunModel — CancelCompileRun', () =>
{
    beforeEach(() => resetStore());

    it('sets status to cancelled', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CancelCompileRun();
        const state = useNotemacStore.getState();

        expect(state.compileRunStatus).toBe('cancelled');
        expect(state.compileRunHistory[0].status).toBe('cancelled');
    });

    it('sets exitCode to -1', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CancelCompileRun();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory[0].exitCode).toBe(-1);
    });

    it('sets endTime when cancelling', () =>
    {
        const store = useNotemacStore.getState();
        const beforeTime = Date.now();

        store.StartCompileRun('python');
        store.CancelCompileRun();
        const state = useNotemacStore.getState();
        const afterTime = Date.now();

        expect(state.compileRunHistory[0].endTime).toBeDefined();
        expect(state.compileRunHistory[0].endTime! >= beforeTime).toBe(true);
        expect(state.compileRunHistory[0].endTime! <= afterTime).toBe(true);
    });

    it('clears current execution', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.CancelCompileRun();
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).toBeNull();
    });

    it('preserves output and stderr when cancelling', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Partial output');
        store.AppendCompileRunStderr('Partial error');
        store.CancelCompileRun();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory[0].output.length).toBeGreaterThan(0);
        expect(state.compileRunHistory[0].stderr.length).toBe(1);
    });

    it('respects LIMIT_COMPILE_RUN_HISTORY when cancelling', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < LIMIT_COMPILE_RUN_HISTORY + 5; i++)
        {
            store.StartCompileRun(`lang-${i}`);
            store.CancelCompileRun();
        }
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(LIMIT_COMPILE_RUN_HISTORY);
    });

    it('is no-op when no execution is running', () =>
    {
        const store = useNotemacStore.getState();
        store.CancelCompileRun();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(0);
        expect(state.compileRunExecution).toBeNull();
    });
});

describe('CompileRunModel — SetCompileRunPanelVisible', () =>
{
    beforeEach(() => resetStore());

    it('sets panel visible to true', () =>
    {
        const store = useNotemacStore.getState();
        store.SetCompileRunPanelVisible(true);
        const state = useNotemacStore.getState();

        expect(state.compileRunPanelVisible).toBe(true);
    });

    it('sets panel visible to false', () =>
    {
        const store = useNotemacStore.getState();
        store.SetCompileRunPanelVisible(true);
        store.SetCompileRunPanelVisible(false);
        const state = useNotemacStore.getState();

        expect(state.compileRunPanelVisible).toBe(false);
    });

    it('toggles panel visibility', () =>
    {
        let state = useNotemacStore.getState();

        expect(state.compileRunPanelVisible).toBe(false);
        state.SetCompileRunPanelVisible(true);
        state = useNotemacStore.getState();
        expect(state.compileRunPanelVisible).toBe(true);

        state.SetCompileRunPanelVisible(false);
        state = useNotemacStore.getState();
        expect(state.compileRunPanelVisible).toBe(false);
    });
});

describe('CompileRunModel — SetRuntimeCacheStatus', () =>
{
    beforeEach(() => resetStore());

    it('sets cache status for a language', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRuntimeCacheStatus('python', 'cached');
        const state = useNotemacStore.getState();

        expect(state.runtimeCacheStatuses['python']).toBe('cached');
    });

    it('handles all cache status types', () =>
    {
        const store = useNotemacStore.getState();
        const statuses: Array<'cached' | 'downloading' | 'not-cached' | 'error'> = ['cached', 'downloading', 'not-cached', 'error'];

        statuses.forEach(status =>
        {
            store.SetRuntimeCacheStatus('test-lang', status);
            const state = useNotemacStore.getState();
            expect(state.runtimeCacheStatuses['test-lang']).toBe(status);
        });
    });

    it('updates cache status for multiple languages independently', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRuntimeCacheStatus('python', 'cached');
        store.SetRuntimeCacheStatus('javascript', 'downloading');
        store.SetRuntimeCacheStatus('rust', 'not-cached');
        const state = useNotemacStore.getState();

        expect(state.runtimeCacheStatuses['python']).toBe('cached');
        expect(state.runtimeCacheStatuses['javascript']).toBe('downloading');
        expect(state.runtimeCacheStatuses['rust']).toBe('not-cached');
    });

    it('allows updating existing cache status', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRuntimeCacheStatus('python', 'not-cached');
        store.SetRuntimeCacheStatus('python', 'cached');
        const state = useNotemacStore.getState();

        expect(state.runtimeCacheStatuses['python']).toBe('cached');
    });
});

describe('CompileRunModel — SetRunConfiguration', () =>
{
    beforeEach(() => resetStore());

    it('sets run configuration for a language', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRunConfiguration('python', { args: ['--verbose'], timeout: 30000 });
        const state = useNotemacStore.getState();

        expect(state.runConfigurations['python']).toBeDefined();
        expect(state.runConfigurations['python'].args).toEqual(['--verbose']);
        expect(state.runConfigurations['python'].timeout).toBe(30000);
    });

    it('merges with existing configuration', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRunConfiguration('python', { args: ['--verbose'] });
        store.SetRunConfiguration('python', { timeout: 60000 });
        const state = useNotemacStore.getState();

        expect(state.runConfigurations['python'].args).toEqual(['--verbose']);
        expect(state.runConfigurations['python'].timeout).toBe(60000);
    });

    it('handles all RunConfiguration properties', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRunConfiguration('python', {
            args: ['arg1', 'arg2'],
            stdin: 'input',
            env: { VAR: 'value' },
            cwd: '/path/to/dir',
            timeout: 5000,
        });
        const state = useNotemacStore.getState();

        const config = state.runConfigurations['python'];
        expect(config.args).toEqual(['arg1', 'arg2']);
        expect(config.stdin).toBe('input');
        expect(config.env).toEqual({ VAR: 'value' });
        expect(config.cwd).toBe('/path/to/dir');
        expect(config.timeout).toBe(5000);
    });

    it('stores configurations for multiple languages independently', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRunConfiguration('python', { args: ['py-arg'] });
        store.SetRunConfiguration('javascript', { args: ['js-arg'] });
        const state = useNotemacStore.getState();

        expect(state.runConfigurations['python'].args).toEqual(['py-arg']);
        expect(state.runConfigurations['javascript'].args).toEqual(['js-arg']);
    });

    it('allows partial updates', () =>
    {
        const store = useNotemacStore.getState();
        store.SetRunConfiguration('python', {
            args: ['arg1'],
            stdin: 'input',
            env: { VAR: 'value' },
            cwd: '/path',
            timeout: 10000,
        });
        store.SetRunConfiguration('python', { timeout: 20000 });
        const state = useNotemacStore.getState();

        expect(state.runConfigurations['python'].args).toEqual(['arg1']);
        expect(state.runConfigurations['python'].timeout).toBe(20000);
    });
});

describe('CompileRunModel — SetShowRunConfigDialog', () =>
{
    beforeEach(() => resetStore());

    it('shows run config dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.SetShowRunConfigDialog(true);
        const state = useNotemacStore.getState();

        expect(state.showRunConfigDialog).toBe(true);
    });

    it('hides run config dialog', () =>
    {
        const store = useNotemacStore.getState();
        store.SetShowRunConfigDialog(true);
        store.SetShowRunConfigDialog(false);
        const state = useNotemacStore.getState();

        expect(state.showRunConfigDialog).toBe(false);
    });

    it('toggles dialog visibility', () =>
    {
        const store = useNotemacStore.getState();

        store.SetShowRunConfigDialog(true);
        let state = useNotemacStore.getState();
        expect(state.showRunConfigDialog).toBe(true);

        store.SetShowRunConfigDialog(false);
        state = useNotemacStore.getState();
        expect(state.showRunConfigDialog).toBe(false);
    });
});

describe('CompileRunModel — ClearCompileRunHistory', () =>
{
    beforeEach(() => resetStore());

    it('clears history array', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.CompleteCompileRun(0);
        store.StartCompileRun('javascript');
        store.CompleteCompileRun(0);

        store.ClearCompileRunHistory();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(0);
    });

    it('is no-op on empty history', () =>
    {
        const store = useNotemacStore.getState();
        store.ClearCompileRunHistory();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(0);
    });

    it('does not affect current execution', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.ClearCompileRunHistory();
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).not.toBeNull();
        expect(state.compileRunExecution?.languageId).toBe('python');
    });

    it('clears all history regardless of size', () =>
    {
        const store = useNotemacStore.getState();

        for (let i = 0; i < 10; i++)
        {
            store.StartCompileRun(`lang-${i}`);
            store.CompleteCompileRun(0);
        }

        store.ClearCompileRunHistory();
        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(0);
    });
});

describe('CompileRunModel — Output Limit Enforcement', () =>
{
    beforeEach(() => resetStore());

    it('enforces output limit across stdout and stderr combined', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        const halfLimit = Math.floor(LIMIT_COMPILE_RUN_OUTPUT / 2);

        for (let i = 0; i < halfLimit; i++)
        {
            store.AppendCompileRunOutput(`Out ${i}`);
        }

        for (let i = 0; i < halfLimit + 100; i++)
        {
            store.AppendCompileRunStderr(`Err ${i}`);
        }

        const state = useNotemacStore.getState();
        expect(state.compileRunExecution?.output.length).toBeLessThanOrEqual(LIMIT_COMPILE_RUN_OUTPUT);
    });

    it('stops appending when exactly at limit', () =>
    {
        const store = useNotemacStore.getState();
        store.StartCompileRun('python');

        for (let i = 0; i < LIMIT_COMPILE_RUN_OUTPUT; i++)
        {
            store.AppendCompileRunOutput(`Line ${i}`);
        }

        store.AppendCompileRunOutput('Should not appear');
        const state = useNotemacStore.getState();

        expect(state.compileRunExecution?.output.length).toBe(LIMIT_COMPILE_RUN_OUTPUT);
    });
});

describe('CompileRunModel — Integration Scenarios', () =>
{
    beforeEach(() => resetStore());

    it('handles complete execution lifecycle', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Starting...');
        store.AppendCompileRunOutput('Processing...');
        store.AppendCompileRunOutput('Done!');
        store.CompleteCompileRun(0);

        const state = useNotemacStore.getState();

        expect(state.compileRunExecution).toBeNull();
        expect(state.compileRunStatus).toBe('success');
        expect(state.compileRunHistory[0].output.length).toBe(3);
        expect(state.compileRunHistory[0].exitCode).toBe(0);
    });

    it('interleaves stdout and stderr correctly', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Line 1');
        store.AppendCompileRunStderr('Error 1');
        store.AppendCompileRunOutput('Line 2');
        store.AppendCompileRunStderr('Error 2');
        store.CompleteCompileRun(0);

        const state = useNotemacStore.getState();
        const output = state.compileRunHistory[0].output;

        expect(output[0]).toBe('Line 1');
        expect(output[1]).toContain('Error 1');
        expect(output[2]).toBe('Line 2');
        expect(output[3]).toContain('Error 2');
    });

    it('maintains separate stderr array alongside output interleaving', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.AppendCompileRunStderr('Error 1');
        store.AppendCompileRunStderr('Error 2');
        store.CompleteCompileRun(1);

        const state = useNotemacStore.getState();
        const execution = state.compileRunHistory[0];

        expect(execution.stderr).toEqual(['Error 1', 'Error 2']);
        expect(execution.output.length).toBe(2);
    });

    it('handles rapid successive operations', () =>
    {
        const store = useNotemacStore.getState();

        store.StartCompileRun('python');
        store.AppendCompileRunOutput('Out 1');
        store.AppendCompileRunStderr('Err 1');
        store.AppendCompileRunOutput('Out 2');
        store.CompleteCompileRun(0);
        store.StartCompileRun('javascript');
        store.AppendCompileRunOutput('JS Out');
        store.CompleteCompileRun(1);

        const state = useNotemacStore.getState();

        expect(state.compileRunHistory.length).toBe(2);
        expect(state.compileRunHistory[0].languageId).toBe('javascript');
        expect(state.compileRunHistory[1].languageId).toBe('python');
    });
});
