/**
 * CloudRuntimeAdapter — Executes code via the Piston API for languages
 * that don't have native WASM runtimes available in the browser.
 *
 * Piston is a free, open-source code execution engine supporting 50+ languages.
 * https://github.com/engineer-man/piston
 *
 * Used as a fallback when WasmRuntimeAdapter has no built-in loader.
 */

import type { RuntimeAdapter, ExecutionResult, ExecutionOptions, RuntimeInfo } from '../RuntimeAdapter';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../../Commons/Constants';
import { GetRuntimeDisplayName } from './LanguageCommandMap';

// ─── Constants ───────────────────────────────────────────────────

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * Maps Notemac++ language IDs to Piston language identifiers and versions.
 * Only languages that Piston actually supports are listed here.
 */
const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string; filename: string }> =
{
    // ── .NET Languages ───────────────────────────────────────────
    'csharp':        { language: 'csharp',        version: '5.0.201',  filename: 'main.cs'   },
    'fsharp':        { language: 'fsharp.net',    version: '5.0.201',  filename: 'main.fs'   },
    'visual-basic':  { language: 'basic.net',     version: '5.0.201',  filename: 'main.vb'   },
    'powershell':    { language: 'pwsh',          version: '7.1.4',    filename: 'main.ps1'  },

    // ── C/C++ ────────────────────────────────────────────────────
    'c':             { language: 'c',             version: '10.2.0',   filename: 'main.c'    },
    'cpp':           { language: 'c++',           version: '10.2.0',   filename: 'main.cpp'  },
    'objective-c':   { language: 'objective-c',   version: '10.2.0',   filename: 'main.m'    },

    // ── JVM Languages ────────────────────────────────────────────
    'java':          { language: 'java',          version: '15.0.2',   filename: 'Main.java' },
    'kotlin':        { language: 'kotlin',        version: '1.8.20',   filename: 'main.kt'   },
    'scala':         { language: 'scala',         version: '3.2.2',    filename: 'main.scala' },
    'groovy':        { language: 'groovy',        version: '3.0.7',    filename: 'main.groovy' },

    // ── Compiled Languages ───────────────────────────────────────
    'go':            { language: 'go',            version: '1.16.2',   filename: 'main.go'   },
    'rust':          { language: 'rust',          version: '1.68.2',   filename: 'main.rs'   },
    'swift':         { language: 'swift',         version: '5.3.3',    filename: 'main.swift' },
    'dart':          { language: 'dart',          version: '2.19.6',   filename: 'main.dart' },
    'pascal':        { language: 'pascal',        version: '3.2.0',    filename: 'main.pas'  },
    'fortran':       { language: 'fortran',       version: '10.2.0',   filename: 'main.f90'  },
    'cobol':         { language: 'cobol',         version: '3.1.2',    filename: 'main.cbl'  },
    'd':             { language: 'd',             version: '10.2.0',   filename: 'main.d'    },
    'nim':           { language: 'nim',           version: '1.6.2',    filename: 'main.nim'  },
    'haskell':       { language: 'haskell',       version: '9.0.1',    filename: 'main.hs'   },
    'assembly':      { language: 'nasm',          version: '2.15.5',   filename: 'main.asm'  },

    // ── Scripting Languages ──────────────────────────────────────
    'ruby':          { language: 'ruby',          version: '3.0.1',    filename: 'main.rb'   },
    'php':           { language: 'php',           version: '8.2.3',    filename: 'main.php'  },
    'perl':          { language: 'perl',          version: '5.36.0',   filename: 'main.pl'   },
    'r':             { language: 'r',             version: '4.1.1',    filename: 'main.r'    },
    'shell':         { language: 'bash',          version: '5.2.0',    filename: 'main.sh'   },
    'tcl':           { language: 'tcl',           version: '8.6.12',   filename: 'main.tcl'  },
    'raku':          { language: 'raku',          version: '6.100.0',  filename: 'main.raku' },
    'awk':           { language: 'gawk',          version: '5.1.0',    filename: 'main.awk'  },
    'julia':         { language: 'julia',         version: '1.6.1',    filename: 'main.jl'   },

    // ── Lisp Family ──────────────────────────────────────────────
    'lisp':          { language: 'lisp',          version: '2.1.2',    filename: 'main.lisp' },
    'clojure':       { language: 'clojure',       version: '1.10.3',   filename: 'main.clj'  },
    'scheme':        { language: 'chez',          version: '9.5.4',    filename: 'main.scm'  },
    'racket':        { language: 'racket',        version: '8.3.0',    filename: 'main.rkt'  },

    // ── ML Family ────────────────────────────────────────────────
    'ocaml':         { language: 'ocaml',         version: '4.12.0',   filename: 'main.ml'   },
    'erlang':        { language: 'erlang',        version: '23.0.0',   filename: 'main.erl'  },
    'elixir':        { language: 'elixir',        version: '1.11.3',   filename: 'main.exs'  },

    // ── Other ────────────────────────────────────────────────────
    'prolog':        { language: 'prolog',        version: '8.2.4',    filename: 'main.pl'   },
    'ada':           { language: 'ada',           version: '',          filename: 'main.adb'  },
};

// ─── State ───────────────────────────────────────────────────────

let abortController: AbortController | null = null;

// ─── Adapter ─────────────────────────────────────────────────────

export const CloudRuntimeAdapter: RuntimeAdapter =
{
    async Init(): Promise<void>
    {
        // No initialization needed — API is stateless
    },

    async Execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>
    {
        const languageId = (options as any)?.languageId ?? '';
        const startTime = Date.now();
        const timeout = options?.timeout ?? COMPILE_RUN_DEFAULT_TIMEOUT;

        const mapping = PISTON_LANGUAGE_MAP[languageId];
        if (!mapping)
        {
            return {
                stdout: [],
                stderr: [`No cloud runtime available for language: ${languageId}`],
                exitCode: 1,
                duration: 0,
            };
        }

        if (options?.onStdout)
        {
            options.onStdout(`Executing via cloud runtime...`);
        }

        // Build the Piston API request
        const requestBody: Record<string, unknown> = {
            language: mapping.language,
            version: '*',
            files: [
                {
                    name: mapping.filename,
                    content: code,
                },
            ],
            run_timeout: timeout,
            compile_timeout: timeout,
        };

        if (options?.stdin)
        {
            requestBody.stdin = options.stdin;
        }

        if (options?.args && 0 < options.args.length)
        {
            requestBody.args = options.args;
        }

        try
        {
            abortController = new AbortController();
            const response = await fetch(PISTON_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: abortController.signal,
            });

            abortController = null;

            if (!response.ok)
            {
                const errorText = await response.text();
                if (options?.onStderr)
                {
                    options.onStderr(`Cloud execution failed: ${response.status} ${errorText}`);
                }
                return {
                    stdout: [],
                    stderr: [`Cloud execution failed: HTTP ${response.status}`, errorText],
                    exitCode: 1,
                    duration: Date.now() - startTime,
                };
            }

            const result = await response.json();

            // Handle compilation errors
            if (result.compile && result.compile.stderr && 0 < result.compile.stderr.length)
            {
                if (options?.onStderr)
                {
                    for (const line of result.compile.stderr.split('\n'))
                    {
                        options.onStderr(line);
                    }
                }
            }

            if (result.compile && 0 !== result.compile.code)
            {
                return {
                    stdout: result.compile.stdout ? result.compile.stdout.split('\n') : [],
                    stderr: result.compile.stderr ? result.compile.stderr.split('\n') : [],
                    exitCode: result.compile.code ?? 1,
                    duration: Date.now() - startTime,
                };
            }

            // Stream stdout via callback
            const stdout = result.run?.stdout ?? '';
            const stderr = result.run?.stderr ?? '';

            if (options?.onStdout && 0 < stdout.length)
            {
                for (const line of stdout.split('\n'))
                {
                    options.onStdout(line);
                }
            }

            if (options?.onStderr && 0 < stderr.length)
            {
                for (const line of stderr.split('\n'))
                {
                    options.onStderr(line);
                }
            }

            return {
                stdout: stdout ? stdout.split('\n') : [],
                stderr: stderr ? stderr.split('\n') : [],
                exitCode: result.run?.code ?? 0,
                duration: Date.now() - startTime,
            };
        }
        catch (error)
        {
            abortController = null;

            if (error instanceof DOMException && 'AbortError' === error.name)
            {
                return {
                    stdout: [],
                    stderr: ['Execution cancelled.'],
                    exitCode: -1,
                    duration: Date.now() - startTime,
                };
            }

            const msg = error instanceof Error ? error.message : String(error);
            if (options?.onStderr)
            {
                options.onStderr(`Cloud execution error: ${msg}`);
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
        if (null !== abortController)
        {
            abortController.abort();
            abortController = null;
        }
    },

    IsReady(): boolean
    {
        return true;
    },

    GetLanguages(): string[]
    {
        return Object.keys(PISTON_LANGUAGE_MAP);
    },

    GetRuntimeInfo(languageId: string): RuntimeInfo | null
    {
        const mapping = PISTON_LANGUAGE_MAP[languageId];
        if (!mapping)
        {
            return null;
        }

        return {
            languageId,
            displayName: GetRuntimeDisplayName(languageId),
            mode: 'execute',
            isReady: true,
        };
    },
};

// ─── Public Helpers ──────────────────────────────────────────────

/**
 * Check if a language has a cloud runtime available via Piston.
 */
export function IsCloudRuntimeAvailable(languageId: string): boolean
{
    return languageId in PISTON_LANGUAGE_MAP;
}
