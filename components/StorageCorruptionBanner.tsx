"use client";

import { useState } from "react";
import { useStorageCorruption } from "@/lib/storage/useStorageCorruption";

// Non-blocking, dismissible notice shown when a saved value failed to parse.
// The original bytes were quarantined (not lost), so this reassures rather than
// alarms — and deliberately shows NO figures. Replaces the old silent
// console.warn so a corruption event is at least visible to the user.
export function StorageCorruptionBanner() {
    const corruptKeys = useStorageCorruption();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || corruptKeys.length === 0) return null;

    return (
        <div className="storage-corruption-banner" role="alert">
            <span>
                We couldn&rsquo;t read some saved data, so we protected the original copy.
                Your other information is safe &mdash; if anything looks off, you can restore
                from a backup.
            </span>
            <button
                type="button"
                className="storage-corruption-dismiss"
                onClick={() => setDismissed(true)}
            >
                Dismiss
            </button>
        </div>
    );
}
