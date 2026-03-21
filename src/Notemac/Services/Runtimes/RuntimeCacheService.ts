/**
 * RuntimeCacheService — Background pre-fetching and caching of WASM runtimes
 * using IndexedDB and predictive loading based on open file types.
 *
 * When a user opens a file, the service predicts which runtime they might need
 * and starts downloading it in the background via a Service Worker.
 *
 * Cache states are tracked in the Zustand store so the UI can show progress.
 */

import { useNotemacStore } from '../../Model/Store';
import { LANGUAGE_RUNTIME_MAP } from './LanguageCommandMap';
import { PreloadRuntime, IsRuntimeLoaded } from './WasmRuntimeAdapter';
import type { RuntimeCacheState } from '../../Model/CompileRunModel';

// ─── IndexedDB Cache ────────────────────────────────────────────────

const DB_NAME = 'notemac-wasm-cache';
const DB_VERSION = 1;
const STORE_NAME = 'runtimes';

let dbPromise: Promise<IDBDatabase> | null = null;

function GetDB(): Promise<IDBDatabase>
{
    if (null !== dbPromise)
    {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) =>
    {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () =>
        {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME))
            {
                db.createObjectStore(STORE_NAME, { keyPath: 'languageId' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

// ─── Cache State Tracking ───────────────────────────────────────────

function UpdateCacheStatus(languageId: string, status: RuntimeCacheState): void
{
    useNotemacStore.getState().SetRuntimeCacheStatus(languageId, status);
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Check if a runtime is cached in IndexedDB.
 */
export async function IsRuntimeCached(languageId: string): Promise<boolean>
{
    try
    {
        const db = await GetDB();
        return new Promise((resolve) =>
        {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(languageId);
            request.onsuccess = () => resolve(null !== request.result && undefined !== request.result);
            request.onerror = () => resolve(false);
        });
    }
    catch
    {
        return false;
    }
}

/**
 * Mark a runtime as cached in IndexedDB.
 */
export async function MarkRuntimeCached(languageId: string): Promise<void>
{
    try
    {
        const db = await GetDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ languageId, cachedAt: Date.now() });
        UpdateCacheStatus(languageId, 'cached');
    }
    catch
    {
        // Silently fail — caching is optional
    }
}

/**
 * Predictively preload a WASM runtime for a language.
 * Called when a user opens a file of a given language.
 */
export async function PredictivePreload(languageId: string): Promise<void>
{
    const config = LANGUAGE_RUNTIME_MAP[languageId];
    if (!config || 'wasm' !== config.webType)
    {
        return;
    }

    // Skip if already loaded in memory
    if (IsRuntimeLoaded(languageId))
    {
        UpdateCacheStatus(languageId, 'cached');
        return;
    }

    // Check IndexedDB cache
    const isCached = await IsRuntimeCached(languageId);
    if (isCached)
    {
        UpdateCacheStatus(languageId, 'cached');
        return;
    }

    // Start background download
    UpdateCacheStatus(languageId, 'downloading');

    try
    {
        const success = await PreloadRuntime(languageId);
        if (success)
        {
            await MarkRuntimeCached(languageId);
            UpdateCacheStatus(languageId, 'cached');
        }
        else
        {
            UpdateCacheStatus(languageId, 'error');
        }
    }
    catch
    {
        UpdateCacheStatus(languageId, 'error');
    }
}

/**
 * Get the cache status for all WASM languages.
 */
export function GetAllCacheStatuses(): Record<string, RuntimeCacheState>
{
    return useNotemacStore.getState().runtimeCacheStatuses;
}

/**
 * Clear the entire WASM runtime cache.
 */
export async function ClearRuntimeCache(): Promise<void>
{
    try
    {
        const db = await GetDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
    }
    catch
    {
        // Silently fail
    }
}

// ─── Service Worker Registration ────────────────────────────────────

/**
 * Register the WASM caching service worker if supported.
 * The SW intercepts fetch requests for WASM files and serves from cache.
 */
export async function RegisterCacheServiceWorker(): Promise<void>
{
    if (!('serviceWorker' in navigator))
    {
        return;
    }

    try
    {
        const registration = await navigator.serviceWorker.register('/wasm-cache-sw.js', {
            scope: '/',
        });

        registration.addEventListener('updatefound', () =>
        {
            const newWorker = registration.installing;
            if (null !== newWorker)
            {
                newWorker.addEventListener('statechange', () =>
                {
                    if ('activated' === newWorker.state)
                    {
                        // Service worker is now active and will cache WASM files
                    }
                });
            }
        });
    }
    catch
    {
        // Service Worker registration failed — fall back to direct loading
    }
}
