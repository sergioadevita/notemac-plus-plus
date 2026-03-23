import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudRuntimeAdapter, IsCloudRuntimeAvailable } from '../Notemac/Services/Runtimes/CloudRuntimeAdapter';
import type { ExecutionResult } from '../Notemac/Services/RuntimeAdapter';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../Notemac/Commons/Constants';

// ─── Test Fixtures ───────────────────────────────────────────────

const mockFetch = vi.mocked(globalThis.fetch);

function createMockResponse(body: Record<string, unknown>, ok: boolean = true, status: number = 200): Response
{
    return {
        ok,
        status,
        json: vi.fn(async () => body),
        text: vi.fn(async () => JSON.stringify(body)),
        headers: new Headers(),
        clone: vi.fn(() => createMockResponse(body, ok, status)),
    } as unknown as Response;
}

// ─── Supported Languages ───────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
    'assembly', 'c', 'clojure', 'cobol', 'cpp', 'csharp', 'd', 'dart',
    'elixir', 'erlang', 'fortran', 'fsharp', 'go', 'groovy', 'haskell',
    'java', 'kotlin', 'lisp', 'objective-c', 'ocaml', 'octave', 'pascal',
    'perl', 'php', 'prolog', 'r', 'ruby', 'rust', 'scala', 'shell',
    'swift', 'typescript', 'visual-basic',
];

// ─── IsCloudRuntimeAvailable ───────────────────────────────────────

describe('CloudRuntimeAdapter — IsCloudRuntimeAvailable', () =>
{
    it('returns true for supported language (csharp)', () =>
    {
        expect(true === IsCloudRuntimeAvailable('csharp')).toBe(true);
    });

    it('returns true for supported language (go)', () =>
    {
        expect(true === IsCloudRuntimeAvailable('go')).toBe(true);
    });

    it('returns true for supported language (java)', () =>
    {
        expect(true === IsCloudRuntimeAvailable('java')).toBe(true);
    });

    it('returns true for supported language (ruby)', () =>
    {
        expect(true === IsCloudRuntimeAvailable('ruby')).toBe(true);
    });

    it('returns false for unsupported language', () =>
    {
        expect(false === IsCloudRuntimeAvailable('python')).toBe(true);
    });

    it('returns false for unknown language', () =>
    {
        expect(false === IsCloudRuntimeAvailable('unknown-lang')).toBe(true);
    });

    it('returns false for empty string', () =>
    {
        expect(false === IsCloudRuntimeAvailable('')).toBe(true);
    });
});

// ─── GetLanguages ───────────────────────────────────────────────────

describe('CloudRuntimeAdapter — GetLanguages', () =>
{
    it('returns array of language IDs', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(Array.isArray(languages)).toBe(true);
    });

    it('returns exactly 33 supported languages', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(33 === languages.length).toBe(true);
    });

    it('includes csharp language', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(languages.includes('csharp')).toBe(true);
    });

    it('includes go language', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(languages.includes('go')).toBe(true);
    });

    it('includes java language', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(languages.includes('java')).toBe(true);
    });

    it('includes ruby language', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(languages.includes('ruby')).toBe(true);
    });

    it('does not include unsupported languages', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        expect(languages.includes('python')).toBe(false);
    });

    it('returns all expected supported languages', () =>
    {
        const languages = CloudRuntimeAdapter.GetLanguages();
        for (const lang of SUPPORTED_LANGUAGES)
        {
            expect(languages.includes(lang)).toBe(true);
        }
    });
});

// ─── GetRuntimeInfo ──────────────────────────────────────────────

describe('CloudRuntimeAdapter — GetRuntimeInfo', () =>
{
    it('returns RuntimeInfo for supported language (csharp)', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('csharp');
        expect(null !== info).toBe(true);
        expect(info?.languageId).toBe('csharp');
    });

    it('returns RuntimeInfo with displayName for supported language', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('go');
        expect(null !== info).toBe(true);
        expect(typeof info?.displayName === 'string').toBe(true);
        expect(0 < info?.displayName.length!).toBe(true);
    });

    it('returns RuntimeInfo with execute mode', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('java');
        expect(null !== info).toBe(true);
        expect('execute' === info?.mode).toBe(true);
    });

    it('returns RuntimeInfo with isReady true', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('ruby');
        expect(null !== info).toBe(true);
        expect(true === info?.isReady).toBe(true);
    });

    it('returns null for unsupported language', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('python');
        expect(null === info).toBe(true);
    });

    it('returns null for unknown language', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('unknown-lang');
        expect(null === info).toBe(true);
    });

    it('returns null for empty string', () =>
    {
        const info = CloudRuntimeAdapter.GetRuntimeInfo('');
        expect(null === info).toBe(true);
    });
});

// ─── IsReady ─────────────────────────────────────────────────────

describe('CloudRuntimeAdapter — IsReady', () =>
{
    it('always returns true', () =>
    {
        expect(true === CloudRuntimeAdapter.IsReady()).toBe(true);
    });

    it('returns true on multiple calls', () =>
    {
        expect(true === CloudRuntimeAdapter.IsReady()).toBe(true);
        expect(true === CloudRuntimeAdapter.IsReady()).toBe(true);
        expect(true === CloudRuntimeAdapter.IsReady()).toBe(true);
    });
});

// ─── Init ────────────────────────────────────────────────────────

describe('CloudRuntimeAdapter — Init', () =>
{
    it('resolves successfully', async () =>
    {
        const result = CloudRuntimeAdapter.Init();
        expect(result instanceof Promise).toBe(true);
        await expect(result).resolves.toBeUndefined();
    });

    it('can be called multiple times', async () =>
    {
        await CloudRuntimeAdapter.Init();
        await CloudRuntimeAdapter.Init();
        await expect(CloudRuntimeAdapter.Init()).resolves.toBeUndefined();
    });
});

// ─── Execute Success ─────────────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Success', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('executes code successfully with Judge0 API response', async () =>
    {
        const mockResponse = {
            stdout: 'Hello, World!\n',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
            compile_output: null,
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('console.log("Hello, World!")', {
            languageId: 'go',
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout.length).toBeGreaterThan(0);
        expect(result.stdout[0]).toBe('Hello, World!');
    });

    it('calls fetch with correct Judge0 CE URL', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('ce.judge0.com/submissions'),
            expect.any(Object)
        );
    });

    it('sends POST request to API', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.method).toBe('POST');
    });

    it('sets Content-Type header to application/json', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('includes language_id in request body', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(107 === body.language_id).toBe(true);
    });

    it('includes source_code in request body', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('my code here', { languageId: 'go' });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect('my code here' === body.source_code).toBe(true);
    });

    it('handles empty stdout', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(result.exitCode).toBe(0);
        expect(result.stdout.length).toBe(0);
    });

    it('splits stdout by newlines', async () =>
    {
        const mockResponse = {
            stdout: 'Line 1\nLine 2\nLine 3',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(result.stdout.length).toBe(3);
        expect('Line 1' === result.stdout[0]).toBe(true);
        expect('Line 2' === result.stdout[1]).toBe(true);
        expect('Line 3' === result.stdout[2]).toBe(true);
    });
});

// ─── Execute Compilation Errors ──────────────────────────────────

describe('CloudRuntimeAdapter — Execute Compilation Errors', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('returns compilation error when Judge0 status is 6', async () =>
    {
        const mockResponse = {
            stdout: null,
            stderr: null,
            exit_code: null,
            compile_output: 'error: unexpected token',
            status: { id: 6, description: 'Compilation Error' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('bad code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr.length).toBeGreaterThan(0);
    });

    it('includes compilation error in result stderr', async () =>
    {
        const mockResponse = {
            stdout: null,
            stderr: null,
            exit_code: null,
            compile_output: 'error: unexpected token',
            status: { id: 6, description: 'Compilation Error' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('bad code', { languageId: 'go' });

        expect(result.stderr.includes('error: unexpected token')).toBe(true);
    });

    it('calls onStderr callback for compilation errors', async () =>
    {
        const mockResponse = {
            stdout: null,
            stderr: null,
            exit_code: null,
            compile_output: 'error: unexpected token',
            status: { id: 6, description: 'Compilation Error' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStderr = vi.fn();

        await CloudRuntimeAdapter.Execute('bad code', {
            languageId: 'go',
            onStderr,
        });

        expect(onStderr).toHaveBeenCalled();
        expect(onStderr).toHaveBeenCalledWith('error: unexpected token');
    });

    it('returns exitCode 1 when compilation fails', async () =>
    {
        const mockResponse = {
            stdout: null,
            stderr: null,
            exit_code: null,
            compile_output: 'error: unexpected token',
            status: { id: 6, description: 'Compilation Error' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('bad code', { languageId: 'go' });

        expect(result.exitCode).toBe(1);
    });
});

// ─── Execute Runtime Errors ──────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Runtime Errors', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('returns runtime error with non-zero exit code', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: 'runtime error',
            exit_code: 1,
            status: { id: 11, description: 'Runtime Error (Other)' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
    });

    it('includes runtime stderr in result', async () =>
    {
        const mockResponse = {
            stdout: 'partial output',
            stderr: 'runtime error',
            exit_code: 127,
            status: { id: 11, description: 'Runtime Error (Other)' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(result.stderr.includes('runtime error')).toBe(true);
    });

    it('includes partial stdout even when runtime error occurs', async () =>
    {
        const mockResponse = {
            stdout: 'partial output',
            stderr: 'error occurred',
            exit_code: 1,
            status: { id: 11, description: 'Runtime Error (Other)' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(result.stdout.includes('partial output')).toBe(true);
        expect(result.stderr.includes('error occurred')).toBe(true);
    });

    it('handles time limit exceeded (status 5)', async () =>
    {
        const mockResponse = {
            stdout: 'some output',
            stderr: null,
            exit_code: null,
            status: { id: 5, description: 'Time Limit Exceeded' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('while(true){}', { languageId: 'go' });

        expect(124 === result.exitCode).toBe(true);
        expect(result.stderr[0]).toContain('timed out');
    });

    it('handles internal error (status 13)', async () =>
    {
        const mockResponse = {
            stdout: null,
            stderr: null,
            exit_code: null,
            message: 'Server overloaded',
            status: { id: 13, description: 'Internal Error' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr[0]).toContain('Server overloaded');
    });

    it('splits runtime stderr by newlines', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: 'Error 1\nError 2\nError 3',
            exit_code: 1,
            status: { id: 11, description: 'Runtime Error (Other)' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(result.stderr.length).toBe(3);
        expect('Error 1' === result.stderr[0]).toBe(true);
        expect('Error 2' === result.stderr[1]).toBe(true);
        expect('Error 3' === result.stderr[2]).toBe(true);
    });
});

// ─── Execute Callbacks ───────────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Callbacks', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('calls onStdout callback with execution start message', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStdout = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStdout,
        });

        expect(onStdout).toHaveBeenCalledWith('Executing via cloud runtime...');
    });

    it('calls onStdout for each stdout line', async () =>
    {
        const mockResponse = {
            stdout: 'Line 1\nLine 2\nLine 3',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStdout = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStdout,
        });

        expect(onStdout).toHaveBeenCalledWith('Line 1');
        expect(onStdout).toHaveBeenCalledWith('Line 2');
        expect(onStdout).toHaveBeenCalledWith('Line 3');
    });

    it('does not call onStdout when stdout is empty', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStdout = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStdout,
        });

        // Only called for the initial message, not for empty stdout
        const callCount = onStdout.mock.calls.filter(
            (call) => 'Executing via cloud runtime...' === call[0]
        ).length;
        expect(1 === callCount).toBe(true);
    });

    it('calls onStderr for each stderr line', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: 'Error 1\nError 2',
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStderr = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStderr,
        });

        expect(onStderr).toHaveBeenCalledWith('Error 1');
        expect(onStderr).toHaveBeenCalledWith('Error 2');
    });

    it('does not call onStderr when stderr is empty', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStderr = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStderr,
        });

        expect(onStderr).not.toHaveBeenCalled();
    });

    it('interleaves onStdout and onStderr callbacks', async () =>
    {
        const mockResponse = {
            stdout: 'Out 1\nOut 2',
            stderr: 'Err 1\nErr 2',
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));
        const onStdout = vi.fn();
        const onStderr = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStdout,
            onStderr,
        });

        expect(onStdout).toHaveBeenCalledWith('Out 1');
        expect(onStdout).toHaveBeenCalledWith('Out 2');
        expect(onStderr).toHaveBeenCalledWith('Err 1');
        expect(onStderr).toHaveBeenCalledWith('Err 2');
    });
});

// ─── Execute Unsupported Language ───────────────────────────────

describe('CloudRuntimeAdapter — Execute Unsupported Language', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('returns error for unsupported language (python)', async () =>
    {
        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'python' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr.length).toBeGreaterThan(0);
        expect(result.stderr[0]).toContain('No cloud runtime available');
    });

    it('returns error for unknown language', async () =>
    {
        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'unknown' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr.length).toBeGreaterThan(0);
    });

    it('does not call fetch for unsupported language', async () =>
    {
        await CloudRuntimeAdapter.Execute('code', { languageId: 'python' });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns empty stdout for unsupported language', async () =>
    {
        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'python' });

        expect(result.stdout.length).toBe(0);
    });
});

// ─── Execute Network Errors ──────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Network Errors', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('handles fetch network error', async () =>
    {
        mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr.length).toBeGreaterThan(0);
        expect(result.stderr[0]).toContain('Network error');
    });

    it('handles HTTP error response (500)', async () =>
    {
        const mockResponse = createMockResponse({}, false, 500);
        mockFetch.mockResolvedValueOnce(mockResponse);

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr[0]).toContain('HTTP 500');
    });

    it('calls onStderr callback on HTTP error', async () =>
    {
        const mockResponse = createMockResponse({}, false, 502);
        mockFetch.mockResolvedValueOnce(mockResponse);
        const onStderr = vi.fn();

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            onStderr,
        });

        expect(onStderr).toHaveBeenCalled();
        expect(onStderr).toHaveBeenCalledWith(expect.stringContaining('502'));
    });

    it('handles 404 error', async () =>
    {
        const mockResponse = createMockResponse({}, false, 404);
        mockFetch.mockResolvedValueOnce(mockResponse);

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(1 === result.exitCode).toBe(true);
        expect(result.stderr[0]).toContain('404');
    });
});

// ─── Execute Cancellation ───────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Cancellation', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('handles AbortError when execution is cancelled', async () =>
    {
        const abortError = new DOMException('Aborted', 'AbortError');
        mockFetch.mockRejectedValueOnce(abortError);

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(-1 === result.exitCode).toBe(true);
        expect(result.stderr[0]).toBe('Execution cancelled.');
    });

    it('returns cancelled status on abort', async () =>
    {
        const abortError = new DOMException('Aborted', 'AbortError');
        mockFetch.mockRejectedValueOnce(abortError);

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect('Execution cancelled.' === result.stderr[0]).toBe(true);
    });
});

// ─── Cancel ──────────────────────────────────────────────────────

describe('CloudRuntimeAdapter — Cancel', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('aborts the fetch when called during execution', async () =>
    {
        let abortSignal: AbortSignal | undefined;

        mockFetch.mockImplementationOnce(async (url, options) =>
        {
            abortSignal = options?.signal;

            // Simulate cancellation
            return new Promise(() =>
            {
                // Will never resolve, but we can cancel it
            });
        });

        const executionPromise = CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        // Give fetch time to be called
        await new Promise(resolve => setTimeout(resolve, 10));

        CloudRuntimeAdapter.Cancel();

        // The signal should have been aborted
        expect(abortSignal?.aborted).toBe(true);
    });

    it('can be called when no execution is running', () =>
    {
        expect(() => CloudRuntimeAdapter.Cancel()).not.toThrow();
    });

    it('cancels the AbortController', async () =>
    {
        let signalAborted = false;

        mockFetch.mockImplementationOnce(async (url, options) =>
        {
            const signal = options?.signal;
            if (null !== signal)
            {
                // Wait for abort
                await new Promise<void>((resolve) =>
                {
                    signal.addEventListener('abort', () =>
                    {
                        signalAborted = true;
                        resolve();
                    });
                    // Timeout fallback
                    setTimeout(() => resolve(), 500);
                });
            }

            // Return a response only if not aborted
            if (!signalAborted)
            {
                return createMockResponse({
                    stdout: '',
                    stderr: null,
                    exit_code: 0,
                    status: { id: 3, description: 'Accepted' },
                });
            }

            // Throw abort error if we detected abort
            throw new DOMException('Aborted', 'AbortError');
        });

        const executionPromise = CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        // Cancel after a tiny delay to ensure fetch is called
        await new Promise(resolve => setTimeout(resolve, 5));
        CloudRuntimeAdapter.Cancel();

        const result = await executionPromise;

        // Should get aborted result
        expect(-1 === result.exitCode).toBe(true);
    });
});

// ─── Execute Options ─────────────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Options', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('includes stdin in request when provided', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            stdin: 'input data',
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect('input data' === body.stdin).toBe(true);
    });

    it('includes args as command_line_arguments in request when provided', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            args: ['arg1', 'arg2'],
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect('arg1 arg2' === body.command_line_arguments).toBe(true);
    });

    it('does not include args when empty array', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            args: [],
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.command_line_arguments).toBeUndefined();
    });

    it('includes cpu_time_limit in request', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            timeout: 10000,
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(10 === body.cpu_time_limit).toBe(true);
    });

    it('caps cpu_time_limit at 15 seconds for Judge0 CE', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', {
            languageId: 'go',
            timeout: 60000,
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(15 === body.cpu_time_limit).toBe(true);
    });

    it('uses default timeout when not provided', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.cpu_time_limit).toBeDefined();
    });
});

// ─── Execute Duration ───────────────────────────────────────────

describe('CloudRuntimeAdapter — Execute Duration', () =>
{
    beforeEach(() =>
    {
        mockFetch.mockClear();
    });

    afterEach(() =>
    {
        mockFetch.mockClear();
    });

    it('measures execution duration', async () =>
    {
        const mockResponse = {
            stdout: '',
            stderr: null,
            exit_code: 0,
            status: { id: 3, description: 'Accepted' },
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(0 <= result.duration).toBe(true);
    });

    it('includes duration in error responses', async () =>
    {
        mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

        const result = await CloudRuntimeAdapter.Execute('code', { languageId: 'go' });

        expect(0 <= result.duration).toBe(true);
    });
});
