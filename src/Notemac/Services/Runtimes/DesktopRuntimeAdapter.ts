/**
 * DesktopRuntimeAdapter — Executes code on desktop by writing to a temp file
 * and spawning an OS process via ProcessExecutionService.
 *
 * Only used on Electron / Tauri — callers should gate on IsDesktopEnvironment().
 */

import type { RuntimeAdapter, ExecutionResult, ExecutionOptions, RuntimeInfo, RuntimeMode } from '../RuntimeAdapter';
import { ExecuteTask } from '../ProcessExecutionService';
import type { ProcessHandle } from '../ProcessExecutionService';
import type { TaskDefinition } from '../../Commons/Types';
import { COMPILE_RUN_DEFAULT_TIMEOUT } from '../../Commons/Constants';
import {
    GetDesktopCommand,
    GetRuntimeDisplayName,
    GetRuntimeMode,
    GetAllSupportedLanguages,
    IsLanguageExecutable,
} from './LanguageCommandMap';

// ─── State ──────────────────────────────────────────────────────────

let activeHandle: ProcessHandle | null = null;

// ─── Adapter ────────────────────────────────────────────────────────

export const DesktopRuntimeAdapter: RuntimeAdapter =
{
    async Init(): Promise<void>
    {
        // No initialisation needed for desktop — processes are spawned on demand
    },

    async Execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>
    {
        const languageId = (options as any)?.languageId ?? 'plaintext';
        const filename   = (options as any)?.filename   ?? 'untitled.txt';

        const command = GetDesktopCommand(languageId);
        if ('' === command)
        {
            return { stdout: [], stderr: ['No desktop command configured for this language.'], exitCode: 1, duration: 0 };
        }

        // Write source code to a temp file via Electron/Tauri API
        const tempPath = await WriteTempFile(code, filename);
        if (null === tempPath)
        {
            return { stdout: [], stderr: ['Failed to write temporary file.'], exitCode: 1, duration: 0 };
        }

        // Expand placeholders
        const fileStem = filename.replace(/\.[^/.]+$/, '');
        const expandedCommand = command
            .replace(/{file}/g, tempPath)
            .replace(/{file_stem}/g, fileStem);

        return new Promise<ExecutionResult>((resolve) =>
        {
            const stdout: string[] = [];
            const stderr: string[] = [];
            const startTime = Date.now();
            const timeout = options?.timeout ?? COMPILE_RUN_DEFAULT_TIMEOUT;

            // Timeout guard
            const timer = setTimeout(() =>
            {
                if (null !== activeHandle)
                {
                    activeHandle.cancel();
                    activeHandle = null;
                }
                resolve({
                    stdout,
                    stderr: [...stderr, `[TIMEOUT] Execution exceeded ${timeout}ms`],
                    exitCode: -1,
                    duration: Date.now() - startTime,
                });
            }, timeout);

            const task: TaskDefinition = {
                id: `compile-run-${Date.now()}`,
                label: `Run ${GetRuntimeDisplayName(languageId)}`,
                command: expandedCommand,
                group: 'custom',
                isDefault: false,
            };

            activeHandle = ExecuteTask(task, {
                onLine(line: string)
                {
                    stdout.push(line);
                    if (options?.onStdout)
                    {
                        options.onStdout(line);
                    }
                },

                onExit(exitCode: number)
                {
                    clearTimeout(timer);
                    activeHandle = null;
                    resolve({
                        stdout,
                        stderr,
                        exitCode,
                        duration: Date.now() - startTime,
                    });
                },

                onError(message: string)
                {
                    stderr.push(message);
                    if (options?.onStderr)
                    {
                        options.onStderr(message);
                    }
                },
            });
        });
    },

    Cancel(): void
    {
        if (null !== activeHandle)
        {
            activeHandle.cancel();
            activeHandle = null;
        }
    },

    IsReady(): boolean
    {
        return true;
    },

    GetLanguages(): string[]
    {
        return GetAllSupportedLanguages().filter(IsLanguageExecutable);
    },

    GetRuntimeInfo(languageId: string): RuntimeInfo | null
    {
        const command = GetDesktopCommand(languageId);
        if ('' === command)
        {
            return null;
        }

        return {
            languageId,
            displayName: GetRuntimeDisplayName(languageId),
            mode: GetRuntimeMode(languageId) as RuntimeMode,
            isReady: true,
        };
    },
};

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Write source code to a temporary file on the desktop filesystem.
 * Returns the temp file path, or null on failure.
 */
async function WriteTempFile(content: string, filename: string): Promise<string | null>
{
    const tempPath = `/tmp/notemac_${Date.now()}_${filename}`;

    try
    {
        // Electron path
        if (window.electronAPI?.writeFile)
        {
            await window.electronAPI.writeFile(tempPath, content);
            return tempPath;
        }

        // Tauri path
        if ((window as any).__TAURI__)
        {
            const tauriFs = await (window as any).__TAURI__.fs;
            if (tauriFs?.writeTextFile)
            {
                await tauriFs.writeTextFile(tempPath, content);
                return tempPath;
            }
        }

        return null;
    }
    catch
    {
        return null;
    }
}
