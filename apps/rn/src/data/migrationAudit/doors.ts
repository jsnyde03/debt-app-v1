import { migrateFromLegacy } from '../legacyBridge/migrateFromLegacy';
import type { LegacyReadReport } from '../legacyBridge/report';
import { LEGACY_KEY_PREFIX } from '../legacyBridge/webkitLocalStorage';
import { runMigrations } from '../migrations';
import type { DebtStore } from '../models';
import { readBackup } from '../readBackup';
import { MemoryStorageAdapter } from '@/storage/adapter';

import type { DoorOutcome } from './invariants';

/**
 * 5.10 — the doors, driven as they actually run.
 *
 * ⛔ **Run 1 of this audit called `mapLegacyStore` + `runMigrations` by hand instead of calling
 * `migrateFromLegacy`, and it changed what the finding MEANT.** The reconstruction surfaced a throw;
 * the real path catches that throw and skips the migration silently, which is a different — and worse —
 * defect than a crash. A harness that rebuilds the thing it audits is measuring its own reconstruction,
 * and this repo has paid for that twice already (the WAL that only a real container had, the fixture that
 * decided what `route-smoke` could see). So every door below is the real exported function.
 */

/** The v1.6 quarantine prefix — carried, never mapped. Kept here so the harness never invents key shapes. */
function itemsFrom(file: Record<string, unknown>): Record<string, string> {
  const items: Record<string, string> = {};
  for (const [key, value] of Object.entries(file)) {
    if (key === 'version' || key === 'exportedAt') continue;
    items[`${LEGACY_KEY_PREFIX}${key}`] = JSON.stringify(value);
  }
  return items;
}

function reportWith(items: Record<string, string>): LegacyReadReport {
  return {
    supported: true,
    webkitRoot: '/x/Library/WebKit',
    visited: 7,
    truncated: false,
    candidates: ['/x/db.sqlite3'],
    opened: [{ path: '/x/db.sqlite3', rows: Object.keys(items).length, legacyKeys: Object.keys(items).length }],
    store: { path: '/x/db.sqlite3', items },
    droppedRows: 0,
  };
}

/** Door A — the IMPORT door, through the real `readBackup`. */
export function importDoor(file: Record<string, unknown>): DoorOutcome {
  const text = JSON.stringify(file);
  let store: DebtStore | null = null;
  let refused = false;
  let threw: Error | null = null;
  let second: DebtStore | null | undefined;
  try {
    const result = readBackup(text);
    if (result.ok) {
      store = result.store;
      second = runMigrations(JSON.parse(JSON.stringify(store)));
    } else {
      refused = true;
    }
  } catch (e) {
    threw = e as Error;
  }
  return { door: 'import', input: file, inputBefore: text, inputAfter: JSON.stringify(file), store, refused, threw, second };
}

/**
 * Door B — the WEBKIT door, through the real `migrateFromLegacy` with its injected reader.
 *
 * ⚠️ `migrated: false` is reported as a REFUSAL, not as a success with no store. The distinction is the
 * whole point of this door: a bridge that declines to migrate and a bridge that migrates nothing look
 * identical in the resulting app, and only one of them is correct.
 */
export async function webkitDoor(file: Record<string, unknown>): Promise<DoorOutcome> {
  const items = itemsFrom(file);
  const before = JSON.stringify(items);
  let store: DebtStore | null = null;
  let refused = false;
  let threw: Error | null = null;
  let accounting: DoorOutcome['accounting'];
  let second: DebtStore | null | undefined;
  try {
    const { outcome, store: migrated } = await migrateFromLegacy(new MemoryStorageAdapter(), async () => reportWith(items));
    if (outcome.migrated && migrated) {
      store = migrated;
      second = runMigrations(JSON.parse(JSON.stringify(migrated)));
    } else {
      refused = true;
    }
    if (outcome.map) {
      accounting = {
        mapped: outcome.map.mapped,
        dropped: outcome.map.dropped.map((d) => d.key),
        unknown: outcome.map.unknown,
        unparseable: outcome.map.unparseable,
        total: Object.keys(items).length,
      };
    }
  } catch (e) {
    threw = e as Error;
  }
  return { door: 'webkit', input: items, inputBefore: before, inputAfter: JSON.stringify(items), store, refused, threw, accounting, second };
}
