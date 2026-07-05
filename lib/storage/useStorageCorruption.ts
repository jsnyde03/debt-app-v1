"use client";

import { useSyncExternalStore } from "react";
import { getCorruptKeys, subscribeToCorruption } from "@/lib/storage/safeStorage";

// Subscribes to the safeStorage corruption registry. Returns the keys that
// failed to parse this session (stable reference between changes). SSR snapshot
// is always empty — corruption can only be detected client-side.
export function useStorageCorruption(): string[] {
    return useSyncExternalStore(subscribeToCorruption, getCorruptKeys, () => EMPTY);
}

const EMPTY: string[] = [];
