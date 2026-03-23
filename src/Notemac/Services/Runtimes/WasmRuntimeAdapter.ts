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
            case 'c':
            case 'cpp':
                return await LoadJSCPP(languageId);
            case 'ruby':
                return await LoadRubyWasm(languageId);
            case 'csharp':
                return await LoadMonoCSharp(languageId);
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

// ─── C/C++ via JSCPP ────────────────────────────────────────────────

async function LoadJSCPP(languageId: string): Promise<LoadedRuntime>
{
    // JSCPP is a JavaScript-based C/C++ interpreter.
    // Load via script injection from jsdelivr CDN.
    await LoadScript('https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/lib/launcher.js');
    const JSCPP = (globalThis as any).JSCPP;
    if (!JSCPP || 'function' !== typeof JSCPP.run)
    {
        throw new Error('Failed to load JSCPP from CDN');
    }

    return {
        languageId,
        module: JSCPP,
        async execute(code: string, stdin?: string)
        {
            try
            {
                const outputLines: string[] = [];
                const errorLines: string[] = [];

                const config = {
                    stdio: {
                        write: (s: string) => { outputLines.push(s); },
                        drain: () => '',
                    },
                    unsigned_overflow: 'warn',
                    maxTimeout: 5000,
                };

                if (stdin)
                {
                    let stdinBuf = stdin;
                    (config.stdio as any).read = () =>
                    {
                        if (0 < stdinBuf.length)
                        {
                            const ch = stdinBuf[0];
                            stdinBuf = stdinBuf.substring(1);
                            return ch;
                        }
                        return null;
                    };
                }

                const exitCode = JSCPP.run(code, '', config);
                return {
                    stdout: outputLines.join(''),
                    stderr: errorLines.join(''),
                    exitCode: exitCode ?? 0,
                };
            }
            catch (e)
            {
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

// ─── Ruby via ruby-head-wasm-wasi ───────────────────────────────────

async function LoadRubyWasm(languageId: string): Promise<LoadedRuntime>
{
    // Load the Ruby WASM browser script from CDN
    await LoadScript('https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@2.3.0/dist/browser.script.iife.js');

    const rubyModule = (globalThis as any).ruby;
    if (!rubyModule)
    {
        throw new Error('Failed to load Ruby WASM from CDN');
    }

    // Initialize the Ruby VM
    const { DefaultRubyVM } = rubyModule;
    const wasmUrl = 'https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@2.3.0/dist/ruby.wasm';
    const response = await fetch(wasmUrl);
    const wasmBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    const { vm } = await DefaultRubyVM(wasmModule);

    return {
        languageId,
        module: vm,
        async execute(code: string)
        {
            try
            {
                // Redirect $stdout and $stderr to StringIO
                vm.eval(`
                    require 'stringio'
                    $__notemac_stdout = StringIO.new
                    $__notemac_stderr = StringIO.new
                    $stdout = $__notemac_stdout
                    $stderr = $__notemac_stderr
                `);
                vm.eval(code);
                const stdout = vm.eval('$__notemac_stdout.string').toString();
                const stderr = vm.eval('$__notemac_stderr.string').toString();
                // Restore
                vm.eval('$stdout = STDOUT; $stderr = STDERR');
                return { stdout, stderr, exitCode: 0 };
            }
            catch (e)
            {
                try { vm.eval('$stdout = STDOUT; $stderr = STDERR'); } catch { /* ignore */ }
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

// ─── C# via Mono WASM (CSharp-In-Browser approach) ─────────────────

/**
 * Loads the Mono WASM runtime with Roslyn for in-browser C# compilation.
 * Assets are hosted alongside the app in /app/wasm/csharp/.
 * First run downloads ~14MB (dotnet.wasm + Roslyn DLLs + BCL DLLs).
 * Subsequent runs use cached assets.
 */
async function LoadMonoCSharp(languageId: string): Promise<LoadedRuntime>
{
    // The Mono WASM runtime assets must be hosted alongside the app.
    // We load dotnet.js which bootstraps the runtime and loads managed DLLs.
    const baseUrl = GetCSharpWasmBaseUrl();

    await LoadScript(`${baseUrl}/dotnet.js`);

    const monoRuntime = (globalThis as any).Module ?? (globalThis as any).MONO;
    if (!monoRuntime)
    {
        throw new Error(
            'C# WASM runtime is not yet available.\n' +
            'The Mono WASM runtime assets need to be built and deployed.\n' +
            'This will be available in the next release.'
        );
    }

    return {
        languageId,
        module: monoRuntime,
        async execute(code: string)
        {
            try
            {
                // Call the CompileAndRun function exposed by the Mono WASM runtime
                const compileAndRun = (globalThis as any).CompileAndRun
                    ?? (globalThis as any).Module?.CompileAndRun;

                if (!compileAndRun)
                {
                    return {
                        stdout: '',
                        stderr: 'C# runtime loaded but CompileAndRun function not found. ' +
                            'The Mono WASM runtime assets may need to be rebuilt.',
                        exitCode: 1,
                    };
                }

                const result = compileAndRun(code);
                return {
                    stdout: result ?? '',
                    stderr: '',
                    exitCode: 0,
                };
            }
            catch (e)
            {
                return { stdout: '', stderr: String(e), exitCode: 1 };
            }
        },
    };
}

/**
 * Determine the base URL for C# WASM assets.
 * In production, these are hosted at /app/wasm/csharp/ on gh-pages.
 * In development, they're at /wasm/csharp/.
 */
function GetCSharpWasmBaseUrl(): string
{
    const loc = globalThis.location;
    if (loc && loc.pathname.startsWith('/app/'))
    {
        return '/app/wasm/csharp';
    }
    return '/wasm/csharp';
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

            return {
                stdout: '',
                stderr: [
                    `${name} execution is not yet available in the web app.`,
                    `A browser-based WASM runtime for ${name} will be added in a future update.`,
                    `To run ${name} code now, download Notemac++ desktop (Electron or Tauri).`,
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
