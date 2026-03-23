/**
 * CompileRunController — Orchestrates the compile & run flow.
 *
 * Thin controller that routes execution to the correct runtime adapter
 * based on platform (desktop vs web) and language type.
 * All heavy lifting lives in the adapters under Services/Runtimes/.
 */

import { useNotemacStore } from '../Model/Store';
import { IsDesktopEnvironment } from '../Services/PlatformBridge';
import { GetRuntimeDisplayName, IsLanguageExecutable, GetWebRuntimeConfig } from '../Services/Runtimes/LanguageCommandMap';
import { DesktopRuntimeAdapter } from '../Services/Runtimes/DesktopRuntimeAdapter';
import { WebJsRuntimeAdapter } from '../Services/Runtimes/WebJsRuntimeAdapter';
import { WebValidationAdapter } from '../Services/Runtimes/WebValidationAdapter';
import { WasmRuntimeAdapter, IsRuntimeLoaded } from '../Services/Runtimes/WasmRuntimeAdapter';
import { CloudRuntimeAdapter, IsCloudRuntimeAvailable } from '../Services/Runtimes/CloudRuntimeAdapter';
import { Dispatch, NOTEMAC_EVENTS } from '../../Shared/EventDispatcher/EventDispatcher';
import { FormatTaskDuration } from '../Services/TaskRunnerService';
import type { RuntimeAdapter } from '../Services/RuntimeAdapter';

// ─── State ──────────────────────────────────────────────────────────

let isExecuting = false;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Run the currently active tab's code.
 */
export async function RunCurrentFile(): Promise<void>
{
    const store = useNotemacStore.getState();

    // Get active tab
    const activeTab = store.tabs.find(t => t.id === store.activeTabId);
    if (!activeTab)
    {
        return;
    }

    // Check if language is executable
    if (!IsLanguageExecutable(activeTab.language))
    {
        return;
    }

    // Prevent concurrent executions
    if (isExecuting)
    {
        return;
    }

    await ExecuteCode(activeTab.content, activeTab.language, activeTab.name);
}

/**
 * Run with arguments (opens config dialog, then executes).
 */
export function RunWithArguments(): void
{
    const store = useNotemacStore.getState();
    store.SetShowRunConfigDialog(true);
}

/**
 * Stop the currently running execution.
 */
export function StopExecution(): void
{
    const adapter = GetActiveAdapter();
    if (null !== adapter)
    {
        adapter.Cancel();
    }
    isExecuting = false;

    const store = useNotemacStore.getState();
    store.CancelCompileRun();
}

/**
 * Clear the console output.
 */
export function ClearOutput(): void
{
    useNotemacStore.getState().ClearCompileRunHistory();
}

/**
 * Send a line of stdin input to the currently running process.
 * The input is echoed to the console output and forwarded to the adapter.
 */
export function SendStdinLine(line: string): void
{
    const store = useNotemacStore.getState();

    // Echo the input to the console output
    store.AppendCompileRunOutput(`\x1b[36m> ${line}\x1b[0m`);

    // Forward to the active adapter if it supports stdin writing
    const adapter = GetActiveAdapter();
    if (null !== adapter && 'WriteStdin' in adapter)
    {
        (adapter as any).WriteStdin(line + '\n');
    }
}

// ─── Execution Core ─────────────────────────────────────────────────

async function ExecuteCode(content: string, languageId: string, filename: string): Promise<void>
{
    const store = useNotemacStore.getState();
    isExecuting = true;

    // Start tracking
    store.StartCompileRun(languageId);
    Dispatch(NOTEMAC_EVENTS.COMPILE_RUN_STARTED, { language: languageId });

    const displayName = GetRuntimeDisplayName(languageId);
    store.AppendCompileRunOutput(`> Running: ${displayName}`);
    store.AppendCompileRunOutput('');

    const startTime = Date.now();

    try
    {
        // Select the correct adapter
        const adapter = SelectAdapter(languageId);

        // Execute via adapter
        const result = await adapter.Execute(content, {
            languageId,
            filename,
            onStdout(line: string)
            {
                useNotemacStore.getState().AppendCompileRunOutput(line);
            },
            onStderr(line: string)
            {
                useNotemacStore.getState().AppendCompileRunStderr(line);
            },
        } as any);

        // Completion
        const duration = Date.now() - startTime;
        const currentStore = useNotemacStore.getState();
        currentStore.AppendCompileRunOutput('');
        currentStore.AppendCompileRunOutput(`> Execution completed in ${FormatTaskDuration(startTime, startTime + duration)}`);
        currentStore.CompleteCompileRun(result.exitCode);

        Dispatch(NOTEMAC_EVENTS.COMPILE_RUN_COMPLETED, {
            language: languageId,
            exitCode: result.exitCode,
            duration,
        });
    }
    catch (error)
    {
        const msg = error instanceof Error ? error.message : String(error);
        const currentStore = useNotemacStore.getState();
        currentStore.AppendCompileRunStderr(`[ERROR] ${msg}`);

        const duration = Date.now() - startTime;
        currentStore.AppendCompileRunOutput('');
        currentStore.AppendCompileRunOutput(`> Execution failed (${FormatTaskDuration(startTime, startTime + duration)})`);
        currentStore.CompleteCompileRun(1);

        Dispatch(NOTEMAC_EVENTS.COMPILE_RUN_COMPLETED, {
            language: languageId,
            exitCode: 1,
            duration,
        });
    }
    finally
    {
        isExecuting = false;
    }
}

// ─── Adapter Selection ──────────────────────────────────────────────

let lastAdapter: RuntimeAdapter | null = null;

function SelectAdapter(languageId: string): RuntimeAdapter
{
    let adapter: RuntimeAdapter;

    if (IsDesktopEnvironment())
    {
        adapter = DesktopRuntimeAdapter;
    }
    else
    {
        adapter = SelectWebAdapter(languageId);
    }

    lastAdapter = adapter;
    return adapter;
}

/** Languages that have actual native WASM loaders (not stubs). */
const NATIVE_WASM_LANGUAGES = new Set(['python', 'lua', 'sql']);

function SelectWebAdapter(languageId: string): RuntimeAdapter
{
    // JS/TS/CoffeeScript → sandboxed iframe execution
    if (WebJsRuntimeAdapter.GetLanguages().includes(languageId))
    {
        return WebJsRuntimeAdapter;
    }

    // Validation/preview languages → pure JS validation
    if (WebValidationAdapter.GetLanguages().includes(languageId))
    {
        return WebValidationAdapter;
    }

    // Languages with native WASM loaders → use WASM adapter
    if (NATIVE_WASM_LANGUAGES.has(languageId) || IsRuntimeLoaded(languageId))
    {
        return WasmRuntimeAdapter;
    }

    // Languages supported by the cloud execution API → use cloud adapter
    if (IsCloudRuntimeAvailable(languageId))
    {
        return CloudRuntimeAdapter;
    }

    // Check if this is a WASM language (future loaders / stubs)
    const config = GetWebRuntimeConfig(languageId);
    if (null !== config && 'wasm' === config.webType)
    {
        return WasmRuntimeAdapter;
    }

    // Interpreter languages also go through WASM adapter (for built-in TS interpreters)
    if (null !== config && 'interpreter' === config.webType)
    {
        return WasmRuntimeAdapter;
    }

    // Fallback to validation
    return WebValidationAdapter;
}

function GetActiveAdapter(): RuntimeAdapter | null
{
    return lastAdapter;
}
