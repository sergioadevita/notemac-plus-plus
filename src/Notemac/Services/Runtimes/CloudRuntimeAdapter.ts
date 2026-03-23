/**
 * CloudRuntimeAdapter — Executes code via the Judge0 CE API for languages
 * that don't have native WASM runtimes available in the browser.
 *
 * Judge0 CE is a free, open-source online code execution system supporting 60+ languages.
 * https://ce.judge0.com/
 *
 * Used as a fallback when WasmRuntimeAdapter has no built-in loader.
 */

import type { RuntimeAdapter, ExecutionResult, ExecutionOptions, RuntimeInfo } from '../RuntimeAdapter';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../../Commons/Constants';
import { GetRuntimeDisplayName } from './LanguageCommandMap';

// ─── Constants ───────────────────────────────────────────────────

const JUDGE0_API_URL = 'https://ce.judge0.com/submissions';

/**
 * Maps Notemac++ language IDs to Judge0 CE language numeric IDs.
 * Uses the latest available compiler/runtime version for each language.
 * Full list at: https://ce.judge0.com/languages
 */
const JUDGE0_LANGUAGE_MAP: Record<string, { languageId: number; displaySuffix: string }> =
{
    // ── .NET Languages ───────────────────────────────────────────
    'csharp':        { languageId: 51,  displaySuffix: 'Mono 6.6'           },
    'fsharp':        { languageId: 87,  displaySuffix: '.NET Core 3.1'      },
    'visual-basic':  { languageId: 84,  displaySuffix: 'vbnc'               },

    // ── C/C++ ────────────────────────────────────────────────────
    'c':             { languageId: 103, displaySuffix: 'GCC 14.1'           },
    'cpp':           { languageId: 105, displaySuffix: 'GCC 14.1'           },
    'objective-c':   { languageId: 79,  displaySuffix: 'Clang 7.0'          },

    // ── JVM Languages ────────────────────────────────────────────
    'java':          { languageId: 91,  displaySuffix: 'JDK 17'             },
    'kotlin':        { languageId: 111, displaySuffix: '2.1'                },
    'scala':         { languageId: 112, displaySuffix: '3.4'                },
    'groovy':        { languageId: 88,  displaySuffix: '3.0'                },

    // ── Compiled Languages ───────────────────────────────────────
    'go':            { languageId: 107, displaySuffix: '1.23'               },
    'rust':          { languageId: 108, displaySuffix: '1.85'               },
    'swift':         { languageId: 83,  displaySuffix: '5.2'                },
    'dart':          { languageId: 90,  displaySuffix: '2.19'               },
    'pascal':        { languageId: 67,  displaySuffix: 'FPC 3.0'            },
    'fortran':       { languageId: 59,  displaySuffix: 'GFortran 9.2'       },
    'cobol':         { languageId: 77,  displaySuffix: 'GnuCOBOL 2.2'      },
    'd':             { languageId: 56,  displaySuffix: 'DMD 2.089'          },
    'haskell':       { languageId: 61,  displaySuffix: 'GHC 8.8'            },
    'assembly':      { languageId: 45,  displaySuffix: 'NASM 2.14'          },

    // ── Scripting Languages ──────────────────────────────────────
    'ruby':          { languageId: 72,  displaySuffix: '2.7'                },
    'php':           { languageId: 98,  displaySuffix: '8.3'                },
    'perl':          { languageId: 85,  displaySuffix: '5.28'               },
    'r':             { languageId: 99,  displaySuffix: '4.4'                },
    'shell':         { languageId: 46,  displaySuffix: 'Bash 5.0'           },
    'typescript':    { languageId: 101, displaySuffix: '5.6'                },

    // ── Lisp Family ──────────────────────────────────────────────
    'lisp':          { languageId: 55,  displaySuffix: 'SBCL 2.0'           },
    'clojure':       { languageId: 86,  displaySuffix: '1.10'               },

    // ── ML Family ────────────────────────────────────────────────
    'ocaml':         { languageId: 65,  displaySuffix: '4.09'               },
    'erlang':        { languageId: 58,  displaySuffix: 'OTP 22'             },
    'elixir':        { languageId: 57,  displaySuffix: '1.9'                },

    // ── Other ────────────────────────────────────────────────────
    'prolog':        { languageId: 69,  displaySuffix: 'GNU Prolog 1.4'     },
    'octave':        { languageId: 66,  displaySuffix: '5.1'                },
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

        const mapping = JUDGE0_LANGUAGE_MAP[languageId];
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

        // Build the Judge0 CE API request
        const requestBody: Record<string, unknown> = {
            source_code: code,
            language_id: mapping.languageId,
            cpu_time_limit: Math.min(timeout / 1000, 15),   // Judge0 expects seconds, max 15s on CE
            wall_time_limit: Math.min(timeout / 1000, 20),
        };

        if (options?.stdin)
        {
            requestBody.stdin = options.stdin;
        }

        if (options?.args && 0 < options.args.length)
        {
            requestBody.command_line_arguments = options.args.join(' ');
        }

        try
        {
            abortController = new AbortController();

            // Submit with ?wait=true so Judge0 returns the result synchronously
            const response = await fetch(`${JUDGE0_API_URL}?base64_encoded=false&wait=true`, {
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

            // Judge0 status IDs:
            //   1 = In Queue, 2 = Processing, 3 = Accepted,
            //   4 = Wrong Answer, 5 = Time Limit Exceeded,
            //   6 = Compilation Error, 7-12 = Runtime Errors, 13 = Internal Error
            const statusId = result.status?.id ?? 0;

            // Handle compilation errors (status 6)
            if (6 === statusId)
            {
                const compileErr = result.compile_output ?? 'Compilation failed';
                if (options?.onStderr)
                {
                    for (const line of compileErr.split('\n'))
                    {
                        options.onStderr(line);
                    }
                }
                return {
                    stdout: [],
                    stderr: compileErr.split('\n'),
                    exitCode: 1,
                    duration: Date.now() - startTime,
                };
            }

            // Handle time limit exceeded (status 5)
            if (5 === statusId)
            {
                const msg = 'Execution timed out (time limit exceeded)';
                if (options?.onStderr)
                {
                    options.onStderr(msg);
                }
                return {
                    stdout: result.stdout ? result.stdout.split('\n') : [],
                    stderr: [msg],
                    exitCode: 124,
                    duration: Date.now() - startTime,
                };
            }

            // Handle runtime errors (status 7-12)
            if (7 <= statusId && 12 >= statusId)
            {
                const runtimeErr = result.stderr ?? result.compile_output ?? 'Runtime error';
                if (options?.onStderr)
                {
                    for (const line of runtimeErr.split('\n'))
                    {
                        options.onStderr(line);
                    }
                }
                // Still include stdout if any was produced before the error
                if (options?.onStdout && result.stdout && 0 < result.stdout.length)
                {
                    for (const line of result.stdout.split('\n'))
                    {
                        options.onStdout(line);
                    }
                }
                return {
                    stdout: result.stdout ? result.stdout.split('\n') : [],
                    stderr: runtimeErr.split('\n'),
                    exitCode: result.exit_code ?? 1,
                    duration: Date.now() - startTime,
                };
            }

            // Handle internal error (status 13)
            if (13 === statusId)
            {
                const msg = result.message ?? 'Internal Judge0 error';
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

            // Success path (status 3 = Accepted, or status 4 = Wrong Answer which still has output)
            const stdout = result.stdout ?? '';
            const stderr = result.stderr ?? '';

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
                exitCode: result.exit_code ?? 0,
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
        return Object.keys(JUDGE0_LANGUAGE_MAP);
    },

    GetRuntimeInfo(languageId: string): RuntimeInfo | null
    {
        const mapping = JUDGE0_LANGUAGE_MAP[languageId];
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
 * Check if a language has a cloud runtime available via Judge0 CE.
 */
export function IsCloudRuntimeAvailable(languageId: string): boolean
{
    return languageId in JUDGE0_LANGUAGE_MAP;
}
