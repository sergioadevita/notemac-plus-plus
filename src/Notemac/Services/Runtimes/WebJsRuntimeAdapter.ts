/**
 * WebJsRuntimeAdapter — Executes JavaScript, TypeScript, and CoffeeScript
 * directly in the browser using a sandboxed iframe.
 *
 * Uses a hidden iframe to isolate execution from the main thread,
 * capturing console output and runtime errors.
 */

import type { RuntimeAdapter, ExecutionResult, ExecutionOptions, RuntimeInfo } from '../RuntimeAdapter';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../../Commons/Constants';

// ─── Supported Languages ────────────────────────────────────────────

const JS_LANGUAGES = ['javascript', 'typescript', 'coffeescript'] as const;
type JsLanguage = typeof JS_LANGUAGES[number];

// ─── State ──────────────────────────────────────────────────────────

let sandboxFrame: HTMLIFrameElement | null = null;
let isExecuting = false;

// ─── Adapter ────────────────────────────────────────────────────────

export const WebJsRuntimeAdapter: RuntimeAdapter =
{
    async Init(): Promise<void>
    {
        // Iframe is created on demand per execution
    },

    async Execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>
    {
        if (isExecuting)
        {
            return {
                stdout: [],
                stderr: ['Another execution is already running.'],
                exitCode: 1,
                duration: 0,
            };
        }

        isExecuting = true;
        const startTime = Date.now();
        const timeout = options?.timeout ?? COMPILE_RUN_DEFAULT_TIMEOUT;

        try
        {
            const result = await ExecuteInSandbox(code, timeout, options);
            return {
                ...result,
                duration: Date.now() - startTime,
            };
        }
        finally
        {
            isExecuting = false;
        }
    },

    Cancel(): void
    {
        DestroySandbox();
        isExecuting = false;
    },

    IsReady(): boolean
    {
        return true;
    },

    GetLanguages(): string[]
    {
        return [...JS_LANGUAGES];
    },

    GetRuntimeInfo(languageId: string): RuntimeInfo | null
    {
        if (!JS_LANGUAGES.includes(languageId as JsLanguage))
        {
            return null;
        }

        return {
            languageId,
            displayName: GetJsDisplayName(languageId),
            mode: 'execute',
            isReady: true,
        };
    },
};

// ─── Sandbox Execution ──────────────────────────────────────────────

/**
 * Execute code inside a hidden iframe sandbox.
 * The iframe provides isolation from the main window's scope.
 */
function ExecuteInSandbox(
    code: string,
    timeout: number,
    options?: ExecutionOptions,
): Promise<{ stdout: string[]; stderr: string[]; exitCode: number }>
{
    return new Promise((resolve) =>
    {
        const stdout: string[] = [];
        const stderr: string[] = [];

        // Create sandbox iframe
        sandboxFrame = document.createElement('iframe');
        sandboxFrame.style.display = 'none';
        sandboxFrame.sandbox.add('allow-scripts');
        document.body.appendChild(sandboxFrame);

        // Timeout guard
        const timer = setTimeout(() =>
        {
            DestroySandbox();
            resolve({
                stdout,
                stderr: [...stderr, `[TIMEOUT] Execution exceeded ${timeout}ms`],
                exitCode: -1,
            });
        }, timeout);

        // Listen for messages from the iframe
        const handleMessage = (event: MessageEvent) =>
        {
            if (!sandboxFrame || event.source !== sandboxFrame.contentWindow)
            {
                return;
            }

            const msg = event.data;
            if (!msg || 'notemac-sandbox' !== msg.type)
            {
                return;
            }

            switch (msg.action)
            {
                case 'stdout':
                    stdout.push(msg.text);
                    if (options?.onStdout)
                    {
                        options.onStdout(msg.text);
                    }
                    break;

                case 'stderr':
                    stderr.push(msg.text);
                    if (options?.onStderr)
                    {
                        options.onStderr(msg.text);
                    }
                    break;

                case 'done':
                    clearTimeout(timer);
                    window.removeEventListener('message', handleMessage);
                    DestroySandbox();
                    resolve({ stdout, stderr, exitCode: 0 });
                    break;

                case 'error':
                    clearTimeout(timer);
                    window.removeEventListener('message', handleMessage);
                    stderr.push(msg.text);
                    if (options?.onStderr)
                    {
                        options.onStderr(msg.text);
                    }
                    DestroySandbox();
                    resolve({ stdout, stderr, exitCode: 1 });
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // Inject the execution script into the iframe
        const iframeDoc = sandboxFrame.contentDocument;
        if (!iframeDoc)
        {
            clearTimeout(timer);
            window.removeEventListener('message', handleMessage);
            DestroySandbox();
            resolve({
                stdout,
                stderr: ['Failed to access sandbox iframe.'],
                exitCode: 1,
            });
            return;
        }

        const wrappedCode = BuildSandboxScript(code);
        iframeDoc.open();
        iframeDoc.write(`<html><body><script>${wrappedCode}<\/script></body></html>`);
        iframeDoc.close();
    });
}

/**
 * Build the script that runs inside the sandbox iframe.
 * Overrides console methods and wraps execution in try/catch.
 */
function BuildSandboxScript(userCode: string): string
{
    // Escape backticks and backslashes for template literal safety
    const escaped = userCode
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/<\/script>/gi, '<\\/script>');

    return `
        (function() {
            var _post = function(action, text) {
                parent.postMessage({ type: 'notemac-sandbox', action: action, text: text }, '*');
            };

            var _stringify = function(v) {
                if (typeof v === 'object') {
                    try { return JSON.stringify(v); } catch(e) { return String(v); }
                }
                return String(v);
            };

            console.log = function() {
                var args = Array.prototype.slice.call(arguments);
                _post('stdout', args.map(_stringify).join(' '));
            };
            console.error = function() {
                var args = Array.prototype.slice.call(arguments);
                _post('stderr', args.map(_stringify).join(' '));
            };
            console.warn = function() {
                var args = Array.prototype.slice.call(arguments);
                _post('stdout', '[warn] ' + args.map(_stringify).join(' '));
            };
            console.info = function() {
                var args = Array.prototype.slice.call(arguments);
                _post('stdout', args.map(_stringify).join(' '));
            };

            try {
                (new Function(\`${escaped}\`))();
                _post('done', '');
            } catch(e) {
                _post('error', e.name + ': ' + e.message);
            }
        })();
    `;
}

// ─── Cleanup ────────────────────────────────────────────────────────

function DestroySandbox(): void
{
    if (null !== sandboxFrame)
    {
        sandboxFrame.remove();
        sandboxFrame = null;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────

function GetJsDisplayName(languageId: string): string
{
    switch (languageId)
    {
        case 'javascript':
            return 'JavaScript (Browser)';
        case 'typescript':
            return 'TypeScript (Browser)';
        case 'coffeescript':
            return 'CoffeeScript (Browser)';
        default:
            return languageId;
    }
}
