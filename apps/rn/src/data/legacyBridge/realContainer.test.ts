import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { mapLegacyStore } from '@/data/legacyBridge/mapLegacyStore';
import { walkForLocalStorage, webkitRootFrom, type ListDirectory } from '@/data/legacyBridge/findLegacyStores';
import { countLegacyKeys, decodeItemTable, pickLegacyStore } from '@/data/legacyBridge/webkitLocalStorage';

/**
 * 5.1b/5.2 — the whole read path, against a REAL v1.6 container captured from an iOS 26.2 simulator.
 *
 * ⛔ **This test exists because a synthesised fixture could not have found the defect it pins.** WebKit
 * runs localStorage in WAL mode and had not checkpointed: the main `localstorage.sqlite3` is 4 KB and does
 * not contain `ItemTable` at all, while the `-wal` beside it holds all 22 keys. `readLegacyStores.ts`
 * copied only the main file — which on a real device reads ZERO legacy keys and reports the user as having
 * nothing to migrate. Every synthetic test passed while that was true, because a database written and
 * closed cleanly by `node:sqlite` has no WAL.
 *
 * See `__fixtures__/README.md` for provenance and for what this fixture does NOT prove.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
  );
}

const FIXTURE = join(__dirname, '__fixtures__', 'webkit-ios26');
const norm = (p: string) => p.split('\\').join('/');

const list: ListDirectory = (path) => {
  try {
    return readdirSync(path, { withFileTypes: true }).map((entry) => ({
      path: norm(join(path, entry.name)),
      isDirectory: entry.isDirectory(),
    }));
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => { prepare(sql: string): { all(): unknown[] }; close(): void };
};

// ── The walk finds it, at the depth iOS actually uses. ────────────────────────────────────────────
// `webkitRootFrom` derives `…/WebKit` from the cache dir, exactly as the device adapter does.
eq(webkitRootFrom(`${norm(FIXTURE)}/Caches`), `${norm(FIXTURE)}/WebKit`, 'the WebKit root derives from the cache path');

const walk = walkForLocalStorage(`${norm(FIXTURE)}/WebKit`, list);
eq(walk.candidates.length, 1, 'the walk finds exactly one localStorage database');
assert(!walk.truncated, 'and it did not hit a cap doing so');
assert(walk.visited > 0, `it actually walked (${walk.visited} directories)`);
assert(
  walk.candidates[0].includes('/WebsiteData/Default/') && walk.candidates[0].endsWith('/LocalStorage/localstorage.sqlite3'),
  'at the real iOS layout: WebKit/<bundle-id>/WebsiteData/Default/<salt>/<salt>/LocalStorage/',
);
// ⚡ The path carries the bundle id and TWO salted directories, and names the origin nowhere — which is
// why the database is identified by contents. Pinned so a "simplification" to a fixed path fails here.
assert(walk.candidates[0].includes('/com.jasonsnyder.debtplanner/'), 'the path contains a bundle-id segment');

// ── ⛔ THE WAL. Copy the main file alone and there is no data — that was a live defect. ───────────
const scratch = mkdtempSync(join(tmpdir(), 'real-container-'));
try {
  const source = walk.candidates[0];
  const wal = `${source}-wal`;
  assert(existsSync(wal), 'the captured container HAS a -wal sidecar (WebKit had not checkpointed)');

  // (a) main file only — the original, defective copy behaviour.
  const aloneDir = join(scratch, 'alone');
  const withWalDir = join(scratch, 'with-wal');
  for (const d of [aloneDir, withWalDir]) rmSync(d, { recursive: true, force: true });
  const mk = (dir: string) => {
    const target = join(dir, 'db.sqlite3');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    copyFileSync(source, target);
    return target;
  };
  const alone = mk(aloneDir);
  let aloneThrew = false;
  // ⚠️ The handle is closed in a `finally`, not after the query. On Windows an unclosed SQLite handle
  // keeps an EBUSY lock on the file and the temp-dir cleanup below fails — which reads as a test error
  // rather than as the assertion it is.
  let aloneDb: { prepare(sql: string): { all(): unknown[] }; close(): void } | null = null;
  try {
    aloneDb = new DatabaseSync(alone);
    aloneDb.prepare('SELECT key, value FROM ItemTable').all();
  } catch {
    aloneThrew = true;
  } finally {
    try {
      aloneDb?.close();
    } catch {
      /* already unusable — nothing to release */
    }
  }
  assert(aloneThrew, '⛔ copying ONLY the main file yields no ItemTable — the defect this pins');

  // (b) main + `-wal`, which is what `readLegacyStores` now copies.
  const withWal = mk(withWalDir);
  copyFileSync(wal, `${withWal}-wal`);
  const db = new DatabaseSync(withWal);
  const rows = db.prepare('SELECT key, value FROM ItemTable').all() as { key: unknown; value: unknown }[];
  db.close();
  assert(rows.length > 0, `with the -wal copied alongside, the table reads (${rows.length} rows)`);

  // ── The decode, against bytes WebKit actually wrote. ────────────────────────────────────────────
  const items = decodeItemTable(rows);
  eq(countLegacyKeys(items), 22, 'all 22 debtPlanner.* keys decode from real WebKit bytes');
  const picked = pickLegacyStore([{ path: source, items }]);
  assert(picked !== null, 'and the store is recognised as ours, on contents');

  // ── The mapping, end to end. ────────────────────────────────────────────────────────────────────
  const { partial, report } = mapLegacyStore(items);
  eq(report.unknown, [], '⛔ ZERO unknown keys — nothing in a real container is unaccounted for');
  eq(report.unparseable, [], 'and every value parsed');
  assert(typeof partial.paycheck?.amount === 'string', 'the paycheck amount mapped');
  assert(Array.isArray(partial.debts) && partial.debts.length > 0, 'the debts mapped');
  assert(Array.isArray(partial.requiredExpenses), 'the required expenses mapped');
  eq(partial.prefs?.onboardingComplete, true, 'the renamed onboarding flag mapped');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

console.log(`✅ realContainer tests passed (${passed} asserts).`);
