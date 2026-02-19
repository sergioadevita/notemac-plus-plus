import { useNotemacStore } from "../../Model/Store";
import { FetchFromRemote } from './GitRemoteController';

function GetStore() {
    return useNotemacStore.getState();
}

/**
 * Auto-fetch timer management.
 * Periodically fetches from remote if enabled in settings.
 */
let autoFetchTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start auto-fetch timer.
 * Periodically fetches from remote according to the interval configured in git settings.
 */
export function StartAutoFetch(): void {
    StopAutoFetch();
    const settings = GetStore().gitSettings;

    if (!settings.autoFetch)
        return;

    autoFetchTimer = setInterval(() => {
        const store = GetStore();
        if (store.isRepoInitialized && !store.isGitOperationInProgress)
            FetchFromRemote().catch(() => {});
    }, settings.autoFetchInterval);
}

/**
 * Stop auto-fetch timer.
 * Clears the interval and cancels any pending auto-fetch operations.
 */
export function StopAutoFetch(): void {
    if (null !== autoFetchTimer) {
        clearInterval(autoFetchTimer);
        autoFetchTimer = null;
    }
}
