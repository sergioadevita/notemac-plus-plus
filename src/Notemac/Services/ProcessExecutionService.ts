/**
 * ProcessExecutionService — Abstracts real process execution on desktop
 * platforms (Electron / Tauri) via the PlatformBridge IPC layer.
 *
 * On desktop: spawns a real child process and streams stdout/stderr.
 * On web: returns an error — task execution is not available.
 */

import { DetectPlatform, IsDesktopEnvironment } from './PlatformBridge';
import { CreateTauriBridge } from './TauriBridge';
import type { TaskDefinition } from '../Commons/Types';

export interface ProcessHandle
{
    /** Cancels/kills the running process. */
    cancel: () => void;
}

export interface ProcessCallbacks
{
    onLine: (line: string) => void;
    onExit: (exitCode: number) => void;
    onError: (message: string) => void;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Execute a task's command as a real OS process.
 * Returns a ProcessHandle with a cancel() method.
 *
 * Throws if called on web (callers should gate on IsDesktopEnvironment()).
 */
export function ExecuteTask(task: TaskDefinition, callbacks: ProcessCallbacks): ProcessHandle
{
    if (!IsDesktopEnvironment())
    {
        callbacks.onError('Process execution is not available in the browser.');
        callbacks.onExit(1);
        return { cancel: () => {} };
    }

    const platform = DetectPlatform();

    if ('electron' === platform)
    {
        return ExecuteViaElectron(task, callbacks);
    }

    if ('tauri' === platform)
    {
        return ExecuteViaTauri(task, callbacks);
    }

    // Should never reach here if IsDesktopEnvironment() was true
    callbacks.onError('Unknown desktop platform.');
    callbacks.onExit(1);
    return { cancel: () => {} };
}

// ─── Electron Path ──────────────────────────────────────────────────

function ExecuteViaElectron(task: TaskDefinition, callbacks: ProcessCallbacks): ProcessHandle
{
    const api = (window as any).electronAPI;
    if (!api || !api.executeCommand)
    {
        callbacks.onError('Electron executeCommand API is not available.');
        callbacks.onExit(1);
        return { cancel: () => {} };
    }

    let cancelled = false;
    let pid: number | null = null;

    // Register listeners for streaming output
    const removeOutputListener = api.onTaskOutputLine((data: { line: string; stream: string }) =>
    {
        if (!cancelled)
        {
            callbacks.onLine(data.line);
        }
    });

    const removeExitListener = api.onTaskExit((data: { exitCode: number; signal: string | null }) =>
    {
        if (!cancelled)
        {
            callbacks.onExit(data.exitCode);
        }
        // Clean up listeners
        if (removeOutputListener) removeOutputListener();
        if (removeExitListener) removeExitListener();
    });

    // Start the process
    api.executeCommand(task.command, task.cwd || null, task.env || null)
        .then((result: { pid: number }) =>
        {
            pid = result.pid;
        })
        .catch((err: Error) =>
        {
            if (!cancelled)
            {
                callbacks.onError(`Failed to start process: ${err.message}`);
                callbacks.onExit(1);
            }
            if (removeOutputListener) removeOutputListener();
            if (removeExitListener) removeExitListener();
        });

    return {
        cancel()
        {
            cancelled = true;
            if (null !== pid && api.killProcess)
            {
                api.killProcess(pid);
            }
            if (removeOutputListener) removeOutputListener();
            if (removeExitListener) removeExitListener();
        },
    };
}

// ─── Tauri Path ─────────────────────────────────────────────────────

function ExecuteViaTauri(task: TaskDefinition, callbacks: ProcessCallbacks): ProcessHandle
{
    let cancelled = false;
    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

    // Async setup — bridge creation and event listeners
    (async () =>
    {
        const bridge = await CreateTauriBridge();
        if (!bridge || !bridge.executeCommand)
        {
            callbacks.onError('Tauri executeCommand API is not available.');
            callbacks.onExit(1);
            return;
        }

        // Set up event listeners
        unlistenOutput = await bridge.onTaskOutputLine((data: { line: string; stream: string }) =>
        {
            if (!cancelled)
            {
                callbacks.onLine(data.line);
            }
        });

        unlistenExit = await bridge.onTaskExit((data: { exitCode: number; signal: string | null }) =>
        {
            if (!cancelled)
            {
                callbacks.onExit(data.exitCode);
            }
            // Clean up
            if (unlistenOutput) unlistenOutput();
            if (unlistenExit) unlistenExit();
        });

        // Start the process
        try
        {
            await bridge.executeCommand(task.command, task.cwd || null, task.env || null);
        }
        catch (err)
        {
            if (!cancelled)
            {
                callbacks.onError(`Failed to start process: ${(err as Error).message}`);
                callbacks.onExit(1);
            }
            if (unlistenOutput) unlistenOutput();
            if (unlistenExit) unlistenExit();
        }
    })();

    return {
        cancel()
        {
            cancelled = true;
            // Tauri kill is async but we fire-and-forget
            (async () =>
            {
                const bridge = await CreateTauriBridge();
                if (bridge && bridge.killProcess)
                {
                    bridge.killProcess();
                }
            })();
            if (unlistenOutput) unlistenOutput();
            if (unlistenExit) unlistenExit();
        },
    };
}
