import type { LegacyReadReport } from './report';

/**
 * 5.1b.3, web — there is no app container to read, and nothing on web was ever a Capacitor install that
 * this app replaces in place. Metro resolves this file for web, which is what keeps `expo-sqlite` and
 * `expo-file-system`'s native module out of the web bundle entirely (the `createAdapter` precedent).
 *
 * ⛔ `supported: false` rather than an empty successful report. An empty success would mean *"I looked
 * and there was nothing"*, and a caller acting on that would conclude a web user has no legacy data to
 * migrate — true by accident, for the wrong reason, and the same wrong reason would hold on a native
 * build where the read had genuinely failed.
 */
export async function readLegacyStores(): Promise<LegacyReadReport> {
  return {
    supported: false,
    webkitRoot: null,
    visited: 0,
    truncated: false,
    candidates: [],
    opened: [],
    store: null,
    droppedRows: 0,
  };
}
