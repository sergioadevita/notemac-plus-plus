import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock LightningFS to avoid IndexedDB dependency in jsdom
vi.mock('@isomorphic-git/lightning-fs', () =>
{
    let instanceCounter = 0;
    return {
        default: class MockLightningFS
        {
            id: number;
            promises: any;
            constructor(namespace: string)
            {
                this.id = ++instanceCounter;
                this.promises = {
                    readFile: vi.fn(),
                    writeFile: vi.fn(),
                    unlink: vi.fn(),
                    readdir: vi.fn(),
                    mkdir: vi.fn(),
                    rmdir: vi.fn(),
                    stat: vi.fn(),
                    lstat: vi.fn(),
                };
            }
        },
    };
});

import {
    DetectFsBackend,
    IsElectronEnvironment,
    IsWebFsEnvironment,
    IsBrowserWorkspaceEnvironment,
    GetLightningFs,
    DeleteLightningFs,
    CreateLightningFsAdapter,
    RegisterDirHandle,
    GetDirHandle,
} from '../Shared/Git/GitFileSystemAdapter';

// ─── Environment Detection ──────────────────────────────────────

describe('GitFileSystemAdapter — DetectFsBackend', () =>
{
    beforeEach(() =>
    {
        delete (window as any).electronAPI;
    });

    it('returns a valid backend type', () =>
    {
        const backend = DetectFsBackend();
        expect(['electron', 'webfs', 'lightningfs']).toContain(backend);
    });

    it('returns electron when electronAPI is present', () =>
    {
        (window as any).electronAPI = { openFile: vi.fn() };
        expect(DetectFsBackend()).toBe('electron');
        delete (window as any).electronAPI;
    });

    it('returns lightningfs when no special APIs are present', () =>
    {
        delete (window as any).electronAPI;
        const saved = (window as any).showDirectoryPicker;
        delete (window as any).showDirectoryPicker;
        expect(DetectFsBackend()).toBe('lightningfs');
        if (undefined !== saved)
            (window as any).showDirectoryPicker = saved;
    });
});

describe('GitFileSystemAdapter — environment helpers', () =>
{
    beforeEach(() =>
    {
        delete (window as any).electronAPI;
    });

    it('IsElectronEnvironment returns boolean', () =>
    {
        expect(typeof IsElectronEnvironment()).toBe('boolean');
    });

    it('IsWebFsEnvironment returns boolean', () =>
    {
        expect(typeof IsWebFsEnvironment()).toBe('boolean');
    });

    it('IsBrowserWorkspaceEnvironment returns boolean', () =>
    {
        expect(typeof IsBrowserWorkspaceEnvironment()).toBe('boolean');
    });

    it('exactly one environment is true', () =>
    {
        const results = [
            IsElectronEnvironment(),
            IsWebFsEnvironment(),
            IsBrowserWorkspaceEnvironment(),
        ];
        const trueCount = results.filter(r => true === r).length;
        expect(1 === trueCount).toBe(true);
    });
});

// ─── Lightning FS Instances ─────────────────────────────────────

describe('GitFileSystemAdapter — LightningFS management', () =>
{
    it('GetLightningFs returns the same instance for same namespace', () =>
    {
        const fs1 = GetLightningFs('test-ns');
        const fs2 = GetLightningFs('test-ns');
        expect(fs1).toBe(fs2);
        DeleteLightningFs('test-ns');
    });

    it('GetLightningFs returns different instances for different namespaces', () =>
    {
        const fs1 = GetLightningFs('ns-a');
        const fs2 = GetLightningFs('ns-b');
        expect(fs1).not.toBe(fs2);
        DeleteLightningFs('ns-a');
        DeleteLightningFs('ns-b');
    });

    it('DeleteLightningFs removes the cached instance', () =>
    {
        const fs1 = GetLightningFs('del-test');
        DeleteLightningFs('del-test');
        const fs2 = GetLightningFs('del-test');
        expect(fs1).not.toBe(fs2);
        DeleteLightningFs('del-test');
    });
});

// ─── CreateLightningFsAdapter ───────────────────────────────────

describe('GitFileSystemAdapter — CreateLightningFsAdapter', () =>
{
    it('returns an object with promises API', () =>
    {
        const adapter = CreateLightningFsAdapter('adapter-test');
        expect(adapter).toBeDefined();
        expect(adapter.readFile).toBeDefined();
        expect(adapter.writeFile).toBeDefined();
        expect(adapter.readdir).toBeDefined();
        expect(adapter.stat).toBeDefined();
        DeleteLightningFs('adapter-test');
    });

    it('returns same adapter for same namespace (cached lfs)', () =>
    {
        const a1 = CreateLightningFsAdapter('cached-test');
        const a2 = CreateLightningFsAdapter('cached-test');
        // Both should be the .promises of the same LightningFS instance
        expect(a1).toBe(a2);
        DeleteLightningFs('cached-test');
    });
});

// ─── Dir Handle Registry ────────────────────────────────────────

describe('GitFileSystemAdapter — dir handle registry', () =>
{
    it('returns undefined for unregistered path', () =>
    {
        expect(undefined === GetDirHandle('nonexistent-path-xyz')).toBe(true);
    });

    it('registers and retrieves dir handle', () =>
    {
        const mockHandle = { kind: 'directory' } as any;
        RegisterDirHandle('test-workspace-reg', mockHandle);
        expect(GetDirHandle('test-workspace-reg')).toBe(mockHandle);
    });

    it('overwrites existing handle for same path', () =>
    {
        const handle1 = { kind: 'directory', name: 'first' } as any;
        const handle2 = { kind: 'directory', name: 'second' } as any;
        RegisterDirHandle('ws-path-overwrite', handle1);
        RegisterDirHandle('ws-path-overwrite', handle2);
        expect(GetDirHandle('ws-path-overwrite')).toBe(handle2);
    });
});
