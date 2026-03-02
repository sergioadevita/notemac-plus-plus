import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecuteTask } from '../Notemac/Services/ProcessExecutionService';
import type { TaskDefinition } from '../Notemac/Commons/Types';

// ─── Mocks ──────────────────────────────────────────────────────────

let mockPlatform = 'web';
let mockIsDesktop = false;

vi.mock('../Notemac/Services/PlatformBridge', () => ({
    DetectPlatform: vi.fn(() => mockPlatform),
    IsDesktopEnvironment: vi.fn(() => mockIsDesktop),
    IsTauriEnvironment: vi.fn(() => mockPlatform === 'tauri'),
    IsElectronEnvironment: vi.fn(() => mockPlatform === 'electron'),
}));

vi.mock('../Notemac/Services/TauriBridge', () => ({
    CreateTauriBridge: vi.fn(async () => null),
}));

const sampleTask: TaskDefinition = {
    id: 'task-1',
    label: 'Build',
    command: 'npm run build',
    group: 'build',
    isDefault: true,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('ProcessExecutionService — ExecuteTask', () =>
{
    beforeEach(() =>
    {
        mockPlatform = 'web';
        mockIsDesktop = false;
        vi.clearAllMocks();
        // Clean up any window.electronAPI
        delete (window as any).electronAPI;
    });

    // ─── Web Platform (Not Available) ───────────────────────────────

    it('calls onError and onExit(1) on web platform', () =>
    {
        const onLine = vi.fn();
        const onExit = vi.fn();
        const onError = vi.fn();

        const handle = ExecuteTask(sampleTask, { onLine, onExit, onError });

        expect(onError).toHaveBeenCalledWith('Process execution is not available in the browser.');
        expect(onExit).toHaveBeenCalledWith(1);
        expect(onLine).not.toHaveBeenCalled();
        expect(handle.cancel).toBeDefined();
    });

    it('returns a handle with cancel that is a no-op on web', () =>
    {
        const handle = ExecuteTask(sampleTask, {
            onLine: vi.fn(),
            onExit: vi.fn(),
            onError: vi.fn(),
        });

        expect(() => handle.cancel()).not.toThrow();
    });

    // ─── Electron Platform ──────────────────────────────────────────

    it('calls onError when Electron API is missing executeCommand', () =>
    {
        mockPlatform = 'electron';
        mockIsDesktop = true;
        (window as any).electronAPI = {};

        const onLine = vi.fn();
        const onExit = vi.fn();
        const onError = vi.fn();

        ExecuteTask(sampleTask, { onLine, onExit, onError });

        expect(onError).toHaveBeenCalledWith('Electron executeCommand API is not available.');
        expect(onExit).toHaveBeenCalledWith(1);
    });

    it('calls executeCommand on Electron and sets up listeners', () =>
    {
        mockPlatform = 'electron';
        mockIsDesktop = true;

        const mockRemoveOutput = vi.fn();
        const mockRemoveExit = vi.fn();
        let outputCallback: any = null;
        let exitCallback: any = null;

        (window as any).electronAPI = {
            executeCommand: vi.fn().mockResolvedValue({ pid: 12345 }),
            killProcess: vi.fn(),
            onTaskOutputLine: vi.fn((cb: any) => {
                outputCallback = cb;
                return mockRemoveOutput;
            }),
            onTaskExit: vi.fn((cb: any) => {
                exitCallback = cb;
                return mockRemoveExit;
            }),
        };

        const onLine = vi.fn();
        const onExit = vi.fn();
        const onError = vi.fn();

        const handle = ExecuteTask(sampleTask, { onLine, onExit, onError });

        expect((window as any).electronAPI.executeCommand).toHaveBeenCalledWith(
            'npm run build', null, null
        );
        expect((window as any).electronAPI.onTaskOutputLine).toHaveBeenCalled();
        expect((window as any).electronAPI.onTaskExit).toHaveBeenCalled();

        // Simulate output
        outputCallback({ line: 'Compiling...', stream: 'stdout' });
        expect(onLine).toHaveBeenCalledWith('Compiling...');

        // Simulate exit
        exitCallback({ exitCode: 0, signal: null });
        expect(onExit).toHaveBeenCalledWith(0);

        // Verify cleanup happened
        expect(mockRemoveOutput).toHaveBeenCalled();
        expect(mockRemoveExit).toHaveBeenCalled();
    });

    it('cancel kills the Electron process', async () =>
    {
        mockPlatform = 'electron';
        mockIsDesktop = true;

        const mockRemoveOutput = vi.fn();
        const mockRemoveExit = vi.fn();

        (window as any).electronAPI = {
            executeCommand: vi.fn().mockResolvedValue({ pid: 12345 }),
            killProcess: vi.fn(),
            onTaskOutputLine: vi.fn(() => mockRemoveOutput),
            onTaskExit: vi.fn(() => mockRemoveExit),
        };

        const handle = ExecuteTask(sampleTask, {
            onLine: vi.fn(),
            onExit: vi.fn(),
            onError: vi.fn(),
        });

        // Wait for the executeCommand promise to resolve so pid is set
        await new Promise(r => setTimeout(r, 0));

        handle.cancel();

        expect((window as any).electronAPI.killProcess).toHaveBeenCalledWith(12345);
        expect(mockRemoveOutput).toHaveBeenCalled();
        expect(mockRemoveExit).toHaveBeenCalled();
    });

    it('passes cwd and env to Electron executeCommand', () =>
    {
        mockPlatform = 'electron';
        mockIsDesktop = true;

        (window as any).electronAPI = {
            executeCommand: vi.fn().mockResolvedValue({ pid: 100 }),
            killProcess: vi.fn(),
            onTaskOutputLine: vi.fn(() => vi.fn()),
            onTaskExit: vi.fn(() => vi.fn()),
        };

        const taskWithCwd: TaskDefinition = {
            ...sampleTask,
            cwd: '/projects/myapp',
            env: { NODE_ENV: 'production' },
        };

        ExecuteTask(taskWithCwd, {
            onLine: vi.fn(),
            onExit: vi.fn(),
            onError: vi.fn(),
        });

        expect((window as any).electronAPI.executeCommand).toHaveBeenCalledWith(
            'npm run build',
            '/projects/myapp',
            { NODE_ENV: 'production' }
        );
    });

    // ─── Tauri Platform ─────────────────────────────────────────────

    it('calls onError when Tauri bridge is null', async () =>
    {
        mockPlatform = 'tauri';
        mockIsDesktop = true;

        const onLine = vi.fn();
        const onExit = vi.fn();
        const onError = vi.fn();

        ExecuteTask(sampleTask, { onLine, onExit, onError });

        // Wait for async setup
        await new Promise(r => setTimeout(r, 50));

        expect(onError).toHaveBeenCalledWith('Tauri executeCommand API is not available.');
        expect(onExit).toHaveBeenCalledWith(1);
    });

    // ─── Unknown Platform ───────────────────────────────────────────

    it('calls onError for unknown desktop platform', () =>
    {
        mockPlatform = 'unknown' as any;
        mockIsDesktop = true;

        const onError = vi.fn();
        const onExit = vi.fn();

        ExecuteTask(sampleTask, { onLine: vi.fn(), onExit, onError });

        expect(onError).toHaveBeenCalledWith('Unknown desktop platform.');
        expect(onExit).toHaveBeenCalledWith(1);
    });

    // ─── Output suppression after cancel ────────────────────────────

    it('suppresses output after cancel on Electron', async () =>
    {
        mockPlatform = 'electron';
        mockIsDesktop = true;

        let outputCallback: any = null;

        (window as any).electronAPI = {
            executeCommand: vi.fn().mockResolvedValue({ pid: 99 }),
            killProcess: vi.fn(),
            onTaskOutputLine: vi.fn((cb: any) => {
                outputCallback = cb;
                return vi.fn();
            }),
            onTaskExit: vi.fn(() => vi.fn()),
        };

        const onLine = vi.fn();
        const handle = ExecuteTask(sampleTask, {
            onLine,
            onExit: vi.fn(),
            onError: vi.fn(),
        });

        // Wait for pid
        await new Promise(r => setTimeout(r, 0));

        // Cancel first
        handle.cancel();

        // Output after cancel should be suppressed
        outputCallback({ line: 'late output', stream: 'stdout' });
        expect(onLine).not.toHaveBeenCalledWith('late output');
    });
});
