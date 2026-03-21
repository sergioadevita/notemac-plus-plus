/**
 * RuntimeAdapter — Unified interface for code execution backends.
 *
 * Desktop adapters spawn real OS processes (Electron / Tauri).
 * Web adapters execute code via WASM runtimes or in-browser JS engines.
 */

export type RuntimeMode = 'execute' | 'validate' | 'preview';

export interface ExecutionResult
{
    stdout: string[];
    stderr: string[];
    exitCode: number;
    duration: number;
}

export interface RuntimeInfo
{
    languageId: string;
    displayName: string;
    mode: RuntimeMode;
    isReady: boolean;
}

export interface RuntimeAdapter
{
    /**
     * Initialize the runtime. May trigger lazy-loading of WASM modules.
     */
    Init(): Promise<void>;

    /**
     * Execute or validate the given source code.
     * Returns a promise that resolves when execution completes.
     */
    Execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>;

    /**
     * Cancel any currently running execution.
     */
    Cancel(): void;

    /**
     * Whether the runtime is initialized and ready to execute.
     */
    IsReady(): boolean;

    /**
     * Returns the list of language IDs this adapter handles.
     */
    GetLanguages(): string[];

    /**
     * Get info about the runtime for a specific language.
     */
    GetRuntimeInfo(languageId: string): RuntimeInfo | null;
}

export interface ExecutionOptions
{
    /** Command-line arguments passed to the program. */
    args?: string[];
    /** Standard input content piped to the program. */
    stdin?: string;
    /** Environment variables. Desktop only. */
    env?: Record<string, string>;
    /** Working directory. Desktop only. */
    cwd?: string;
    /** Timeout in milliseconds. Default: 30000 (30s). */
    timeout?: number;
    /** Callback for streaming stdout lines as they arrive. */
    onStdout?: (line: string) => void;
    /** Callback for streaming stderr lines as they arrive. */
    onStderr?: (line: string) => void;
}
