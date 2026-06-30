"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { readKey, writeKey } from "@/lib/storage/safeStorage";

// Drop-in replacement for the repeated pattern:
//   const [x, setX] = useState(() => loadStoredState(key, fallback));
//   useEffect(() => { localStorage.setItem(key, JSON.stringify(x)); }, [x]);
// Routes both halves through safeStorage so every key inherits quarantine +
// corruption signalling. The ONE behavioral change vs. the old pattern: when
// the value loaded at mount came from a CORRUPT read, the first persist is
// skipped, so mounting never writes the fallback back over the (now
// quarantined) original. That single guard is the fix for the headline
// data-loss bug. Persistence resumes the instant the user changes the value —
// an intentional write is safe because the original is already preserved.
export function usePersistedState<T>(
    key: string,
    fallback: T
): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => readKey<T>(key, fallback).value);
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            // First effect after mount: if what's stored is corrupt, do NOT
            // persist the fallback over it. The parse status is independent of
            // the fallback value, so a throwaway fallback keeps this off the dep
            // list. The re-read is cheap and side-effect safe — quarantine is
            // deduped, so re-reading a corrupt key won't pile up entries.
            if (readKey<unknown>(key, null).status === "corrupt") return;
        }
        writeKey(key, value);
    }, [key, value]);

    return [value, setValue];
}
