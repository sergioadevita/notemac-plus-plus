/**
 * PlatformBridge — Detects whether the app is running in Tauri, Electron, or a plain browser.
 *
 * Usage:
 *   import { DetectPlatform, IsDesktopEnvironment } from './PlatformBridge';
 *   if (IsDesktopEnvironment()) { ... }
 */

export type PlatformType = 'tauri' | 'electron' | 'web';

export function DetectPlatform(): PlatformType
{
    if ('undefined' !== typeof window && (window as any).__TAURI__)
        return 'tauri';
    if ('undefined' !== typeof window && window.electronAPI)
        return 'electron';
    return 'web';
}

export function IsDesktopEnvironment(): boolean
{
    return 'web' !== DetectPlatform();
}

export function IsTauriEnvironment(): boolean
{
    return 'tauri' === DetectPlatform();
}

export function IsElectronEnvironment(): boolean
{
    return 'electron' === DetectPlatform();
}
