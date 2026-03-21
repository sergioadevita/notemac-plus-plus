/**
 * WasmRuntimeAdapter — Loads and executes WASM-based language runtimes.
 *
 * Each WASM runtime is lazy-loaded from a CDN on first use.
 * Loaded runtimes are cached in memory and in IndexedDB (via RuntimeCacheService).
 *
 * Supports Category B (existing WASM ports), C (Emscripten builds),
 * and D (self-hosted compilers) languages.
 */

import type { RuntimeAdapter, ExecutionResult, ExecutionOptions, RuntimeInfo } from '../RuntimeAdapter';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../../Commons/Constants';
import { LANGUAGE_RUNTIME_MAP, GetRuntimeDisplayName } from './LanguageCommandMap';

// ─── Types ──────────────────────────────────────────────────────────

interface LoadedRuntime
{
    languageId: string;
    module: any;
    execute: (code: string, stdin?: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

// ─── State ──────────────────────────────────────────────────────────

const loadedRuntimes = new Map<string, LoadedRuntime>();
const loadingPromises = new Map<string, Promise<LoadedRuntime | null>>();

// ─── Adapter ────────────────────────────────────────────────────────

export const WasmRuntimeAdapter: RuntimeAdapter =
{
    async Init(): Promise<void>
    {
        // Runtimes are lazy-loaded on first Execute() call
    },

    async Execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>
    {
        const languageId = (options as any)?.languageId ?? '';
        const startTime = Date.now();
        const timeout = options?.timeout ?? COMPILE_RUN_DEFAULT_TIMEOUT;

        // Check if this language uses a WASM runtime
        const config = LANGUAGE_RUNTIME_MAP[languageId];
        if (!config || 'wasm' !== config.webType)
        {
            return {
                stdout: [],
                stderr: [`No WASM runtime configured for language: ${languageId}`],
                exitCode: 1,
                duration: 0,
            };
        }

        // Load the runtime if not already loaded
        const runtime = await LoadRuntime(languageId, options);
        if (null === runtime)
        {
            return {
                stdout: [],
                stderr: [`Failed to load WASM runtime for ${GetRuntimeDisplayName(languageId)}.`],
                exitCode: 1,
                duration: Date.now() - startTime,
            };
        }

        // Execute with timeout
        try
        {
            const result = await Promise.race([
                runtime.execute(code, options?.stdin),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Execution timeout (${timeout}ms)`)), timeout)
                ),
            ]);

            // Stream output via callbacks
            if (options?.onStdout && result.stdout)
            {
                for (const line of result.stdout.split('\n'))
                {
                    options.onStdout(line);
                }
            }
            if (options?.onStderr && result.stderr)
            {
                for (const line of result.stderr.split('\n'))
                {
                    options.onStderr(line);
                }
            }

            return {
                stdout: result.stdout ? result.stdout.split('\n') : [],
                stderr: result.stderr ? result.stderr.split('\n') : [],
                exitCode: result.exitCode,
                duration: Date.now() - startTime,
            };
        }
        catch (error)
        {
            const msg = error instanceof Error ? error.message : String(error);
            if (options?.onStderr)
            {
                options.onStderr(msg);
            }
            return {
                stdout: [],
                stderr: [msg],
                exitCode: 1,
                duration: Date.now() - startTime,
            };
        }
    },

    Cancel(): void
    {
        // WASM execution in the main thread cannot be cancelled mid-execution.
        // Future improvement: run in a Web Worker for true cancellation.
    },

    IsReady(): boolean
    {
        return true;
    },

    GetLanguages(): string[]
    {
        return Object.entries(LANGUAGE_RUNTIME_MAP)
            .filter(([_, config]) => 'wasm' === config.webType)
            .map(([id]) => id);
    },

    GetRuntimeInfo(languageId: string): RuntimeInfo | null
    {
        const config = LANGUAGE_RUNTIME_MAP[languageId];
        if (!config || 'wasm' !== config.webType)
        {
            return null;
        }

        return {
            languageId,
            displayName: GetRuntimeDisplayName(languageId),
            mode: config.mode,
            isReady: loadedRuntimes.has(languageId),
        };
    },
};

// ─── Runtime Loading ────────────────────────────────────────────────

/**
 * Load a WASM runtime for the given language.
 * Returns a cached instance if already loaded. Deduplicates concurrent loads.
 */
async function LoadRuntime(
    languageId: string,
    options?: ExecutionOptions,
): Promise<LoadedRuntime | null>
{
    // Return cached runtime
    if (loadedRuntimes.has(languageId))
    {
        return loadedRuntimes.get(languageId)!;
    }

    // Deduplicate concurrent loading
    if (loadingPromises.has(languageId))
    {
        return loadingPromises.get(languageId)!;
    }

    const loadPromise = DoLoadRuntime(languageId, options);
    loadingPromises.set(languageId, loadPromise);

    try
    {
        const runtime = await loadPromise;
        if (null !== runtime)
        {
            loadedRuntimes.set(languageId, runtime);
        }
        return runtime;
    }
    finally
    {
        loadingPromises.delete(languageId);
    }
}

/**
 * Actually load the WASM runtime for a specific language.
 * Each language has its own loader that knows how to initialize the runtime.
 */
async function DoLoadRuntime(
    languageId: string,
    options?: ExecutionOptions,
): Promise<LoadedRuntime | null>
{
    if (options?.onStdout)
    {
        options.onStdout(`Loading ${GetRuntimeDisplayName(languageId)} runtime...`);
    }

    try
    {
        switch (languageId)
        {
            case 'python':
                return await LoadPyodide(languageId);
            case 'lua':
                return await LoadWasmoon(languageId);
            case 'sql':
                return await LoadSqlJs(languageId);
            default:
                // For languages whose WASM runtimes are not yet integrated,
                // return a stub that reports the status
                return CreateStubRuntime(languageId);
        }
    }
    catch (error)
    {
        const msg = error instanceof Error ? error.message : String(error);
        if (options?.onStderr)
        {
            options.onStderr(`Failed to load runtime: ${msg}`);
        }
        return null;
    }
}

// ─── Language-Specific Loaders ──────────────────────────────────────

async function LoadPyodide(languageId: string): Promise<LoadedRuntime>
{
    // @ts-expect-error — Pyodide is loaded from CDN
    const pyodide = await globalThis.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
    });

    return {
        languageId,
        module: pyodide,
        async execute(code: string)
        {
            try
            {
                // Capture stdout/stderr
                pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
                pyodide.runPython(code);
                const stdout = pyodide.runPython('sys.stdout.getvalue()');
                const stderr = pyodide.runPython('sys.stderr.getvalue()');
                return { stdout, stderr, exitCode: 0 };
            }
            catch (e)
            {
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

async function LoadWasmoon(languageId: string): Promise<LoadedRuntime>
{
    await LoadScript('https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/glue.js');
    const LuaFactory = (globalThis as any).wasmoon?.LuaFactory;
    if (!LuaFactory)
    {
        throw new Error('Failed to load wasmoon from CDN');
    }
    const factory = new LuaFactory();
    const lua = await factory.createEngine();

    return {
        languageId,
        module: lua,
        async execute(code: string)
        {
            try
            {
                const outputLines: string[] = [];
                lua.global.set('print', (...args: any[]) =>
                {
                    outputLines.push(args.map(String).join('\t'));
                });
                await lua.doString(code);
                return { stdout: outputLines.join('\n'), stderr: '', exitCode: 0 };
            }
            catch (e)
            {
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

async function LoadSqlJs(languageId: string): Promise<LoadedRuntime>
{
    await LoadScript('https://cdn.jsdelivr.net/npm/sql.js@1.10.0/dist/sql-wasm.js');
    const initSqlJs = (globalThis as any).initSqlJs;
    if (!initSqlJs)
    {
        throw new Error('Failed to load sql.js from CDN');
    }
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.0/dist/${file}`,
    });

    return {
        languageId,
        module: SQL,
        async execute(code: string)
        {
            try
            {
                const db = new SQL.Database();
                const results = db.exec(code);
                const output: string[] = [];
                for (const result of results)
                {
                    output.push(result.columns.join('\t'));
                    for (const row of result.values)
                    {
                        output.push(row.map(String).join('\t'));
                    }
                }
                db.close();
                return { stdout: output.join('\n'), stderr: '', exitCode: 0 };
            }
            catch (e)
            {
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

// ─── Stub Runtime ───────────────────────────────────────────────────

/**
 * Creates a stub runtime for WASM languages not yet fully integrated.
 * Reports that the runtime needs to be downloaded and provides guidance.
 */
function CreateStubRuntime(languageId: string): LoadedRuntime
{
    return {
        languageId,
        module: null,
        async execute(_code: string)
        {
            const name = GetRuntimeDisplayName(languageId);
            const config = LANGUAGE_RUNTIME_MAP[languageId];
            const pkg = config?.webRuntimePackage ?? 'unknown';

            return {
                stdout: '',
                stderr: [
                    `WASM runtime "${name}" (${pkg}) is not yet available.`,
                    `This runtime will be added in a future update.`,
                    `For now, please use the desktop version to run ${name} code.`,
                ].join('\n'),
                exitCode: 1,
            };
        },
    };
}

// ─── Script Loading ─────────────────────────────────────────────────

const loadedScripts = new Set<string>();

/**
 * Load an external script from a CDN URL.
 * Deduplicates loads — a script URL is only loaded once.
 */
function LoadScript(url: string): Promise<void>
{
    if (loadedScripts.has(url))
    {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) =>
    {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () =>
        {
            loadedScripts.add(url);
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

// ─── Public Helpers ─────────────────────────────────────────────────

/**
 * Check if a specific WASM runtime is already loaded in memory.
 */
export function IsRuntimeLoaded(languageId: string): boolean
{
    return loadedRuntimes.has(languageId);
}

/**
 * Preload a runtime in the background (called by RuntimeCacheService).
 */
export async function PreloadRuntime(languageId: string): Promise<boolean>
{
    const runtime = await LoadRuntime(languageId);
    return null !== runtime;
}
