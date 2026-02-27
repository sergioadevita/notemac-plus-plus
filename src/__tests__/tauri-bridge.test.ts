import { describe, it, expect, vi } from 'vitest';
import { CreateTauriBridge, TauriAPI } from '../Notemac/Services/TauriBridge';

// ============================================================
// TauriBridge
// ============================================================
describe('TauriBridge', () =>
{
    // ──── CreateTauriBridge ────
    describe('CreateTauriBridge', () =>
    {
        it('returns a TauriAPI object when Tauri API is available', async () =>
        {
            const bridge = await CreateTauriBridge();

            // Since @tauri-apps/api is installed in devDependencies,
            // the dynamic import succeeds and we get a valid bridge
            expect(bridge).not.toBeNull();
            expect(bridge).toBeDefined();
        });

        it('TauriAPI has all expected methods when available', async () =>
        {
            const bridge = await CreateTauriBridge();

            if (bridge !== null)
            {
                expect(bridge).toHaveProperty('onMenuAction');
                expect(bridge).toHaveProperty('onFileOpened');
                expect(bridge).toHaveProperty('onFolderOpened');
                expect(bridge).toHaveProperty('onFileSaved');
                expect(bridge).toHaveProperty('openFile');
                expect(bridge).toHaveProperty('openFolder');
                expect(bridge).toHaveProperty('readFile');
                expect(bridge).toHaveProperty('writeFile');
                expect(bridge).toHaveProperty('readDir');
                expect(bridge).toHaveProperty('saveFileAs');
                expect(bridge).toHaveProperty('renameFile');
                expect(bridge).toHaveProperty('setAlwaysOnTop');
                expect(bridge).toHaveProperty('safeStorageEncrypt');
                expect(bridge).toHaveProperty('safeStorageDecrypt');
                expect(bridge).toHaveProperty('isSafeStorageAvailable');
            }
        });

        it('TauriAPI interface has expected methods (compile-time verification)', async () =>
        {
            // This verifies the interface shape at compile time
            const apiMethods: (keyof TauriAPI)[] = [
                'onMenuAction',
                'onFileOpened',
                'onFolderOpened',
                'onFileSaved',
                'openFile',
                'openFolder',
                'readFile',
                'writeFile',
                'readDir',
                'saveFileAs',
                'renameFile',
                'setAlwaysOnTop',
                'safeStorageEncrypt',
                'safeStorageDecrypt',
                'isSafeStorageAvailable',
            ];

            expect(apiMethods.length).toBe(15);
        });

        it('event handlers are callable functions', async () =>
        {
            const bridge = await CreateTauriBridge();

            if (bridge !== null)
            {
                expect(typeof bridge.onMenuAction).toBe('function');
                expect(typeof bridge.onFileOpened).toBe('function');
                expect(typeof bridge.onFolderOpened).toBe('function');
                expect(typeof bridge.onFileSaved).toBe('function');
            }
        });

        it('async methods are callable functions', async () =>
        {
            const bridge = await CreateTauriBridge();

            if (bridge !== null)
            {
                expect(typeof bridge.readFile).toBe('function');
                expect(typeof bridge.writeFile).toBe('function');
                expect(typeof bridge.readDir).toBe('function');
                expect(typeof bridge.safeStorageEncrypt).toBe('function');
                expect(typeof bridge.safeStorageDecrypt).toBe('function');
                expect(typeof bridge.isSafeStorageAvailable).toBe('function');
            }
        });

        it('sync methods are callable functions', async () =>
        {
            const bridge = await CreateTauriBridge();

            if (bridge !== null)
            {
                expect(typeof bridge.openFile).toBe('function');
                expect(typeof bridge.openFolder).toBe('function');
                expect(typeof bridge.saveFileAs).toBe('function');
                expect(typeof bridge.renameFile).toBe('function');
                expect(typeof bridge.setAlwaysOnTop).toBe('function');
            }
        });
    });
});
