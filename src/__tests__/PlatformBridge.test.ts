import { describe, it, expect, afterEach } from 'vitest';
import { DetectPlatform, IsDesktopEnvironment, IsTauriEnvironment, IsElectronEnvironment } from '../Notemac/Services/PlatformBridge';

// ============================================================
// PlatformBridge
// ============================================================
describe('PlatformBridge', () =>
{
    afterEach(() =>
    {
        delete (window as any).__TAURI__;
        delete (window as any).electronAPI;
    });

    // ──── DetectPlatform ────
    describe('DetectPlatform', () =>
    {
        it('returns "web" by default (no __TAURI__ or electronAPI)', () =>
        {
            expect(DetectPlatform()).toBe('web');
        });

        it('returns "tauri" when window.__TAURI__ exists', () =>
        {
            (window as any).__TAURI__ = {};
            expect(DetectPlatform()).toBe('tauri');
        });

        it('returns "electron" when window.electronAPI exists', () =>
        {
            (window as any).electronAPI = {};
            expect(DetectPlatform()).toBe('electron');
        });

        it('prioritizes tauri over electron when both exist', () =>
        {
            (window as any).__TAURI__ = {};
            (window as any).electronAPI = {};
            expect(DetectPlatform()).toBe('tauri');
        });
    });

    // ──── IsDesktopEnvironment ────
    describe('IsDesktopEnvironment', () =>
    {
        it('returns false in web environment', () =>
        {
            expect(IsDesktopEnvironment()).toBe(false);
        });

        it('returns true in tauri environment', () =>
        {
            (window as any).__TAURI__ = {};
            expect(IsDesktopEnvironment()).toBe(true);
        });

        it('returns true in electron environment', () =>
        {
            (window as any).electronAPI = {};
            expect(IsDesktopEnvironment()).toBe(true);
        });
    });

    // ──── IsTauriEnvironment ────
    describe('IsTauriEnvironment', () =>
    {
        it('returns false in web environment', () =>
        {
            expect(IsTauriEnvironment()).toBe(false);
        });

        it('returns true only in tauri environment', () =>
        {
            (window as any).__TAURI__ = {};
            expect(IsTauriEnvironment()).toBe(true);
        });

        it('returns false in electron environment', () =>
        {
            (window as any).electronAPI = {};
            expect(IsTauriEnvironment()).toBe(false);
        });
    });

    // ──── IsElectronEnvironment ────
    describe('IsElectronEnvironment', () =>
    {
        it('returns false in web environment', () =>
        {
            expect(IsElectronEnvironment()).toBe(false);
        });

        it('returns false in tauri environment', () =>
        {
            (window as any).__TAURI__ = {};
            expect(IsElectronEnvironment()).toBe(false);
        });

        it('returns true only in electron environment', () =>
        {
            (window as any).electronAPI = {};
            expect(IsElectronEnvironment()).toBe(true);
        });
    });
});
