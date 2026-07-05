import { track } from "@/lib/analytics/track";

// The single read/write path every persisted debtPlanner.* key routes through.
// It exists to kill one specific, data-destroying bug: the old loadStoredState
// caught a JSON parse error, returned the *default*, and every consumer hook
// then persisted that default in a useEffect — silently overwriting the corrupt
// (but potentially recoverable) original. On a local-only, no-cloud app that
// means a single bad byte could wipe every debt forever.
//
// The fix has three parts, all centralized here:
//   1. readKey distinguishes "absent" (legit first run → default is correct)
//      from "corrupt" (default would be data loss) and reports which.
//   2. On corrupt, the raw bytes are *quarantined* before any default is
//      returned, so the original is recoverable instead of lost.
//   3. A corruption signal is surfaced (registry + analytics seam) so the UI
//      can tell the user instead of failing silently.
// usePersistedState consumes the "corrupt" status to skip the destructive
// write-back; one-shot callers use readKeyValue/writeKey directly.

export type ReadStatus = "ok" | "absent" | "corrupt";

export interface ReadResult<T> {
    value: T;
    status: ReadStatus;
}

const QUARANTINE_PREFIX = "debtPlanner.__corrupt__";

// Storage accessor with a test seam. `undefined` = use the real backend (or
// null under SSR / when localStorage is unavailable, e.g. some privacy modes).
let storageOverride: Storage | null | undefined;

function getStorage(): Storage | null {
    if (storageOverride !== undefined) return storageOverride;
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** TEST ONLY: inject an in-memory Storage (or null to simulate SSR). */
export function __setStorageForTests(storage: Storage | null | undefined): void {
    storageOverride = storage;
}

// --- corruption registry (surfaced, non-destructive signal) ---

const corruptKeys = new Set<string>();
const listeners = new Set<() => void>();
// A stable snapshot reference so useSyncExternalStore doesn't loop — it only
// changes identity when the set actually changes.
let corruptSnapshot: string[] = [];

function notifyCorruption(key: string): void {
    if (corruptKeys.has(key)) return;
    corruptKeys.add(key);
    corruptSnapshot = [...corruptKeys];
    // Event name + key only — never any stored value (privacy rule in track.ts).
    track("storage_corruption", { key });
    for (const listener of listeners) listener();
}

/** Current set of keys that failed to parse this session (stable reference). */
export function getCorruptKeys(): string[] {
    return corruptSnapshot;
}

export function subscribeToCorruption(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** TEST ONLY: clear the in-memory corruption registry between cases. */
export function __resetCorruptionForTests(): void {
    corruptKeys.clear();
    listeners.clear();
    corruptSnapshot = [];
}

// --- quarantine ---

function quarantine(storage: Storage, key: string, raw: string): void {
    try {
        // Dedupe: if a quarantine entry for this key already holds identical
        // bytes, don't write another. A corrupt key is re-read on every app
        // load, so without this the quarantine would grow unbounded.
        const prefix = `${QUARANTINE_PREFIX}.${key}.`;
        for (let i = 0; i < storage.length; i++) {
            const existing = storage.key(i);
            if (existing && existing.startsWith(prefix) && storage.getItem(existing) === raw) {
                return;
            }
        }
        storage.setItem(`${prefix}${new Date().toISOString()}`, raw);
    } catch {
        // A quarantine failure (quota, etc.) must never throw into the read path.
    }
}

// --- public API ---

export function readKey<T>(key: string, fallback: T): ReadResult<T> {
    const storage = getStorage();
    if (!storage) return { value: fallback, status: "absent" };

    const raw = storage.getItem(key);
    if (raw === null) return { value: fallback, status: "absent" };

    try {
        return { value: JSON.parse(raw) as T, status: "ok" };
    } catch {
        // Preserve the original BEFORE handing back a fallback, then signal.
        // Callers must not auto-persist a "corrupt" fallback (usePersistedState
        // enforces this) or the quarantined original would be the only copy left.
        quarantine(storage, key, raw);
        notifyCorruption(key);
        return { value: fallback, status: "corrupt" };
    }
}

/** Read just the value — for one-shot reads that won't be auto-persisted. */
export function readKeyValue<T>(key: string, fallback: T): T {
    return readKey(key, fallback).value;
}

export function writeKey<T>(key: string, value: T): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.setItem(key, JSON.stringify(value));
    } catch {
        // Swallow quota / serialization errors — a failed write must not crash.
    }
}
