import type { StorageAdapter } from '@/storage/adapter';
import { runMigrations } from '@/data/migrations';
import { reportError } from '@/utils/reportError';

import { mapLegacyStore, type LegacyMapReport } from './mapLegacyStore';
import type { LegacyReadReport } from './report';

/**
 * 5.3 — the bridge. Turns a v1.6 WKWebView `localStorage` into the v1.7 store, once.
 *
 * ⭐ **IDEMPOTENCE IS STRUCTURAL, NOT A FLAG.** The bridge runs only when RN storage is EMPTY, and that
 * single condition gives every guarantee the step asked for:
 *   - **one-shot** — after a successful migration the blob exists, so it never runs again;
 *   - **interruption-safe** — if the app dies between reading and writing, the blob still does not exist,
 *     so the next launch retries from the untouched source;
 *   - **never overwrites** — a user who has already used v1.7 cannot have their store replaced by a stale
 *     v1.6 one, because the bridge does not run at all.
 * A persisted "hasMigrated" boolean would give none of those for free, and would itself be a thing that
 * can be lost, corrupted, or restored out of sync with the data it describes.
 *
 * ⛔ **NON-DESTRUCTIVE BY CONSTRUCTION.** Nothing here writes to, deletes, or opens the WebKit store —
 * `readLegacyStores` copies each database aside and opens the copy. So the v1.6 data survives the
 * migration unconditionally, and survives a FAILED migration too. There is no step at which the source
 * is cleaned up, and there should never be one while a rollback to v1.6 is physically possible.
 *
 * ⚠️ **A failure here must never block launch.** The worst outcome is a user who cannot open the app;
 * the second-worst is one whose data did not come across. So every failure path lands on "carry on with
 * an empty store", records why, and leaves the source intact for the next launch to retry.
 */

export interface LegacyMigrationOutcome {
  /** Did a v1.6 store come across? */
  migrated: boolean;
  /** Why not, when `migrated` is false — the field that makes a silent no-op diagnosable. */
  reason: string;
  read: LegacyReadReport | null;
  map: LegacyMapReport | null;
  /** v1.6 quarantine entries carried into RN's quarantine. */
  quarantined: number;
  /**
   * ⛔ 5.10.4 — quarantine writes that FAILED. Without it, a failed write and "there was nothing to
   * quarantine" both reported `quarantined: 0` — the same number, opposite findings, which is precisely
   * the ambiguity 5.1b.3 drew out one layer up (`keys=0 truncated=yes` vs `no`). Losing the quarantine
   * is still not fatal; being unable to SAY it was lost is what needed fixing.
   */
  quarantineFailed: number;
}

const skipped = (reason: string, read: LegacyReadReport | null = null): LegacyMigrationOutcome => ({
  migrated: false,
  reason,
  read,
  map: null,
  quarantined: 0,
  quarantineFailed: 0,
});

/**
 * Migrate, if there is anything to migrate. Returns the migrated store for the caller to persist and
 * import — this function does not touch the store singleton, so a test can drive it in isolation.
 *
 * `read` is injected so the whole bridge is testable without a device: the native reader needs
 * `expo-file-system` and `expo-sqlite`, and every decision worth pinning is above that line.
 */
export async function migrateFromLegacy(
  adapter: StorageAdapter,
  read?: () => Promise<LegacyReadReport>,
): Promise<{ outcome: LegacyMigrationOutcome; store: ReturnType<typeof runMigrations> | null }> {
  // ⛔ The native reader is imported LAZILY, and that is not a style choice. `readLegacyStores` pulls in
  // `expo-file-system` and `expo-sqlite`, which pull in `react-native` — and a static import here drags
  // all of it into the app-layer test runner (plain Node + tsx), where it fails to transform at all. The
  // dynamic import keeps the native modules on the one path that actually needs them: a real device.
  const readLegacy = read ?? (async () => (await import('./readLegacyStores')).readLegacyStores());
  let report: LegacyReadReport;
  try {
    report = await readLegacy();
  } catch (error) {
    // The native reader is written not to throw; this is the backstop. A bridge that throws at launch
    // is strictly worse than one that finds nothing.
    reportError(error, { seam: 'legacy-bridge' });
    return { outcome: skipped(`read threw: ${String(error)}`), store: null };
  }

  if (!report.supported) return { outcome: skipped('no container to read (web)', report), store: null };

  if (report.store === null) {
    // ⛔ The distinction that decides whether this is a fresh install or a failed migration. `truncated`
    // means a cap or an unrecognised container shape stopped the search — the result is a FLOOR, not an
    // answer, and the next launch should try again rather than conclude the user had nothing.
    return {
      outcome: skipped(
        report.truncated
          ? 'the search was cut short — treating as UNKNOWN, not as "no legacy data"'
          : 'no v1.6 store in this container (a fresh install)',
        report,
      ),
      store: null,
    };
  }

  const { partial, quarantine, report: map } = mapLegacyStore(report.store.items);

  // ⚠️ Carried BEFORE the store is written. If v1.6 quarantined bytes for this user, they are the only
  // surviving copy of that data (5.1a's after-scan) — and a crash after the store write but before this
  // would leave the bridge permanently skipped, taking those bytes with it.
  let quarantined = 0;
  let quarantineFailed = 0;
  for (const [key, raw] of Object.entries(quarantine)) {
    try {
      await adapter.quarantine?.(raw, `v1.6-${key}`);
      quarantined++;
    } catch (error) {
      // Not fatal: losing the quarantine is bad, losing the migration is worse.
      quarantineFailed++;
      reportError(error, { seam: 'legacy-bridge' });
    }
  }

  // ⛔ WRAPPED (5.10 finding 1). `runMigrations` was called bare here while `readBackup` routed every
  // path through a guard, so the two doors onto the same data behaved differently under hostile input:
  // the import door refused, this one THREW. The caller catches it, which is worse than a crash — the
  // migration is skipped silently, `hydrate` writes a fresh empty store, and because idempotence is
  // structural (this runs only when RN storage is empty) it never runs again. One corrupt v1.6 key would
  // strand a real portfolio permanently, with the source sitting untouched and unreachable.
  //
  // ⚠️ `runMigrations` is now total for the shapes that caused this, so reaching the catch should be
  // impossible. It stays because "should be impossible" is what the bare call was, too.
  let store: ReturnType<typeof runMigrations>;
  try {
    store = runMigrations(partial);
  } catch (error) {
    reportError(error, { seam: 'legacy-bridge', operation: 'migrate' });
    return {
      outcome: skipped('the v1.6 data could not be MIGRATED — deliberately not reported as "no legacy data"', report),
      store: null,
    };
  }
  return {
    outcome: { migrated: true, reason: 'migrated', read: report, map, quarantined, quarantineFailed },
    store,
  };
}
