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
    // Load the Pyodide script which sets globalThis.loadPyodide
    await LoadScript('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
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
    await LoadScript('https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/index.min.js');
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
    await LoadScript('https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js');
    const initSqlJs = (globalThis as any).initSqlJs;
    if (!initSqlJs)
    {
        throw new Error('Failed to load sql.js from CDN');
    }
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`,
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
    // The npm package is CommonJS-only (no browser bundle), so we use
    // the jsdelivr ESM endpoint which auto-bundles it for the browser.
    // @ts-expect-error — dynamic import from CDN
    const mod = await import('https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/+esm');
    const JSCPP = mod.default ?? mod;
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

    // The IIFE sets globalThis.rubyVM (not globalThis.ruby)
    const rubyModule = (globalThis as any).rubyVM;
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
 * First run downloads ~25MB (dotnet.wasm + Roslyn DLLs + BCL DLLs).
 * Subsequent runs use cached assets.
 *
 * Architecture (from CSharp-In-Browser by nbarkhina):
 *   - mono-config.js sets global `config` with DLL manifest
 *   - runtime.js sets global `Module` with onRuntimeInitialized hook
 *   - dotnet.js boots Emscripten+Mono, triggers onRuntimeInitialized
 *   - After DLLs load, runtime calls App.init()
 *   - App.init() calls BINDING.call_static_method to init the C# side
 *
 * The C# CompileAndRun method:
 *   1. Compiles user code with Roslyn into an in-memory assembly
 *   2. Finds the first exported type and calls its Run() method
 *   3. Run() must return Task<string> — the string is the program output
 *
 * Since user code typically uses Console.WriteLine + Main(), we wrap it
 * to redirect Console output into a Run() method that returns the output.
 */
async function LoadMonoCSharp(languageId: string): Promise<LoadedRuntime>
{
    const G = globalThis as any;
    const baseUrl = GetCSharpWasmBaseUrl();

    // ── Promise that resolves when Mono runtime is fully initialised ─
    const runtimeReady = new Promise<void>((resolve, reject) =>
    {
        G.App = {
            // Called by runtime.js after all managed DLLs are loaded
            init()
            {
                try
                {
                    const BINDING = G.BINDING;
                    if (BINDING)
                    {
                        // Init the C# CompileService (loads Roslyn references)
                        BINDING.call_static_method(
                            '[WasmRoslyn]WasmRoslyn.Program:Main',
                            [G.App, null]
                        );
                    }
                    resolve();
                }
                catch (e)
                {
                    reject(e);
                }
            },

            // These may be called during Init or by other C# code
            displayAssemblies() { /* no-op in our headless context */ },
        };
    });

    // ── Load scripts in strict order ─────────────────────────────────
    await LoadScript(`${baseUrl}/mono-config.js`);
    await LoadScript(`${baseUrl}/runtime.js`);
    await LoadScript(`${baseUrl}/dotnet.js`);

    // Wait for the full bootstrap
    await runtimeReady;

    const BINDING = G.BINDING;
    if (!BINDING)
    {
        throw new Error(
            'C# WASM runtime loaded but BINDING global not found.\n' +
            'The Mono WASM runtime may not have initialised correctly.'
        );
    }

    return {
        languageId,
        module: G.Module,
        async execute(code: string)
        {
            try
            {
                // ── Wrap user code ──────────────────────────────────
                // The Mono WASM runtime compiles the code with Roslyn,
                // then finds the first exported type and calls its
                // async Task<string> Run() method. The returned string
                // is the program output.
                //
                // Users write normal C# with Main() and Console.Write*.
                // We wrap it so Console output is captured and returned
                // from a Run() method that the runtime expects.
                const wrappedCode = WrapCSharpCode(code);

                // ── Set up result capture via async callbacks ────────
                // Program.Run fires Task.Run(CompileAndRun) and returns
                // immediately. The C# side calls back via JSObject.Invoke
                // on the callback object when done.
                const result = await new Promise<{ compileLog: string; runLog: string }>((resolve) =>
                {
                    let compileLog = '';
                    let runLog = '';
                    let resolved = false;

                    const callback = {
                        setCompileLog(log: string)
                        {
                            compileLog = log;
                            // setCompileLog is always called (in finally block).
                            // If compilation fails, setRunLog won't be called.
                            // If compilation succeeds, setRunLog is called first.
                            // Either way, resolve after compileLog arrives.
                            if (!resolved)
                            {
                                resolved = true;
                                resolve({ compileLog, runLog });
                            }
                        },
                        setRunLog(log: string)
                        {
                            runLog = log;
                        },
                    };

                    BINDING.call_static_method(
                        '[WasmRoslyn]WasmRoslyn.Program:Run',
                        [callback, wrappedCode]
                    );

                    // Safety timeout — if callbacks never fire (e.g. runtime error)
                    setTimeout(() =>
                    {
                        if (!resolved)
                        {
                            resolved = true;
                            resolve({ compileLog, runLog });
                        }
                    }, 30000);
                });

                // ── Parse results ───────────────────────────────────
                const compileFailed = result.compileLog &&
                    !result.compileLog.includes('Compilation success');

                if (compileFailed)
                {
                    // Strip HTML tags the runtime may have added
                    const cleanLog = result.compileLog.replace(/<[^>]*>/g, '');
                    return {
                        stdout: '',
                        stderr: cleanLog,
                        exitCode: 1,
                    };
                }

                const output = result.runLog.replace(/<[^>]*>/g, '');
                return {
                    stdout: output,
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
 * Wraps user C# code so it works with the CSharp-In-Browser runtime.
 *
 * The Mono WASM CompileAndRun expects the compiled assembly to have
 * an exported type with a public async Task<string> Run() method.
 * But users write normal C# with Console.WriteLine in a Main method.
 *
 * This wrapper:
 *   1. Redirects Console.Out to a StringWriter
 *   2. Calls the user's Main method (handling both void and async variants)
 *   3. Returns the captured console output as the Run() result
 */
function WrapCSharpCode(userCode: string): string
{
    // Check if the user already has a Run() method (advanced usage)
    if (/public\s+(async\s+)?Task<string>\s+Run\s*\(/.test(userCode))
    {
        return userCode;
    }

    // Extract the class containing Main. We need to detect the user's
    // namespace, class name, and Main signature.
    const nsMatch = userCode.match(/namespace\s+([\w.]+)/);
    const classMatch = userCode.match(/class\s+(\w+)/);
    const ns = nsMatch ? nsMatch[1] : 'UserCode';
    const cls = classMatch ? classMatch[1] : 'Program';

    return `
using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

// ─── User code (embedded) ────────────────────────────────────────
${userCode}
// ─── End user code ───────────────────────────────────────────────

namespace WasmRoslyn.Demo
{
    public class RunClass
    {
        public async Task<string> Run()
        {
            var sw = new StringWriter();
            Console.SetOut(sw);
            Console.SetError(sw);
            try
            {
                // Use reflection to call Main — it may be private
                var type = typeof(${ns}.${cls});
                var main = type.GetMethod("Main",
                    BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);
                if (main == null)
                    throw new Exception("Could not find Main method in ${ns}.${cls}");

                var args = main.GetParameters().Length > 0
                    ? new object[] { new string[0] }
                    : new object[0];

                var result = main.Invoke(null, args);
                if (result is Task task)
                    await task;
            }
            catch (TargetInvocationException tie)
            {
                sw.WriteLine(tie.InnerException?.ToString() ?? tie.ToString());
            }
            catch (Exception ex)
            {
                sw.WriteLine(ex.ToString());
            }
            return sw.ToString();
        }
    }
}
`;
}

/**
 * Determine the base URL for C# WASM assets.
 * In production (gh-pages), assets live alongside the app at <base>/app/wasm/csharp/.
 * The base path varies (e.g. /notemac-plus-plus/app/...) so we derive it from
 * the current location rather than hard-coding it.
 * In development, they're served from the Vite public dir at /wasm/csharp/.
 */
function GetCSharpWasmBaseUrl(): string
{
    const loc = globalThis.location;
    if (loc)
    {
        // Match paths like /notemac-plus-plus/app/... or /app/...
        const match = loc.pathname.match(/^(\/.*?)\/app\//);
        if (match)
        {
            const basePath = match[1] === '' ? '' : match[1];
            return `${basePath}/app/wasm/csharp`;
        }
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
