import { migrateFromLegacy } from '@/data/legacyBridge/migrateFromLegacy';
import type { LegacyReadReport } from '@/data/legacyBridge/report';
import { LEGACY_KEY_PREFIX } from '@/data/legacyBridge/webkitLocalStorage';
import { healthyV16File } from '@/data/migrationAudit/corpus';
import { MemoryStorageAdapter } from '@/storage/adapter';

/**
 * 5.10.4 — interruption, and the quarantine's last copy.
 *
 * ⛔ **The bridge's headline guarantee is that idempotence is STRUCTURAL** — it runs only when RN storage
 * is empty, which is claimed to give one-shot, interruption-safety and never-overwrites for free. That is
 * a strong claim and it had never been tested against an interruption; 5.10 found that the same structure
 * turns a FAILED migration into a permanent skip, so the claim deserves the adversarial pass rather than
 * a re-reading of its own docstring.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

const items = (() => {
  const file = healthyV16File();
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(file)) {
    if (k === 'version' || k === 'exportedAt') continue;
    out[`${LEGACY_KEY_PREFIX}${k}`] = JSON.stringify(val);
  }
  // v1.6's own quarantine — for anyone who ever hit corruption these bytes are the only surviving copy.
  out[`${LEGACY_KEY_PREFIX}__corrupt__.debts.2026-01-01T00:00:00.000Z`] = '"{bad json"';
  return out;
})();

const report = (): LegacyReadReport => ({
  supported: true,
  webkitRoot: '/x/Library/WebKit',
  visited: 7,
  truncated: false,
  candidates: ['/x/db.sqlite3'],
  opened: [{ path: '/x/db.sqlite3', rows: Object.keys(items).length, legacyKeys: Object.keys(items).length }],
  store: { path: '/x/db.sqlite3', items },
  droppedRows: 0,
});

/** An adapter whose quarantine ALWAYS fails — a full disk, a revoked container, an OS-level denial. */
class QuarantineFailsAdapter extends MemoryStorageAdapter {
  override async quarantine(): Promise<void> {
    throw new Error('quarantine write refused');
  }
}

export default async function run() {
  // ── The source is never touched, so an interruption anywhere leaves it intact. ──────────────────
  {
    const before = JSON.stringify(items);
    await migrateFromLegacy(new MemoryStorageAdapter(), async () => report());
    assert(JSON.stringify(items) === before, 'the v1.6 source is byte-identical after a migration');
  }

  // ── Interruption BEFORE the store write: storage stays empty, so the next launch retries. ───────
  // This is the structural claim's whole basis — nothing marks the bridge done except the data landing.
  {
    const adapter = new MemoryStorageAdapter();
    const { store } = await migrateFromLegacy(adapter, async () => report());
    assert(store !== null, 'the migration produced a store');
    // The caller writes; simulating death before that means simply not writing.
    assert((await adapter.read()) === null, 'nothing is persisted by the bridge itself — the CALLER writes');
    const retry = await migrateFromLegacy(adapter, async () => report());
    assert(retry.store !== null, '…so a next launch retries from the untouched source and succeeds');
  }

  // ── Interruption AFTER the store write: the data is safe and the bridge correctly declines to re-run.
  {
    const adapter = new MemoryStorageAdapter();
    const { store } = await migrateFromLegacy(adapter, async () => report());
    await adapter.write(store!);
    const persisted = await adapter.read();
    assert(persisted !== null, 'the written store survives the interruption');
    assert((persisted as { debts: unknown[] }).debts.length === 1, '…with the debt intact');
  }

  // ── ⛔ THE QUARANTINE'S LAST COPY, and the ambiguity 5.10 found. ────────────────────────────────
  // `migrateFromLegacy` deliberately swallows a failed quarantine write — losing the quarantine is bad,
  // losing the migration is worse — and that trade is right. But the OUTCOME could not tell the two
  // apart: a failed write and "there was nothing to quarantine" both reported `quarantined: 0`. That is
  // exactly the distinction 5.1b.3 drew one layer up (`keys=0 truncated=yes` vs `no` — same number,
  // opposite findings), and it was missing here.
  {
    const ok = await migrateFromLegacy(new MemoryStorageAdapter(), async () => report());
    assert(ok.outcome.migrated, 'a healthy migration succeeds');
    assert(ok.outcome.quarantined === 1, '…carrying the one v1.6 quarantine entry');
    assert(ok.outcome.quarantineFailed === 0, '…with nothing failed');

    const failed = await migrateFromLegacy(new QuarantineFailsAdapter(), async () => report());
    assert(failed.outcome.migrated, '⭐ the migration still SUCCEEDS when quarantine fails (the right trade)');
    assert(failed.outcome.quarantined === 0, '…nothing was carried');
    assert(
      failed.outcome.quarantineFailed === 1,
      '⛔ …and the FAILURE is reported — distinguishable from "there was nothing to carry"',
    );
  }

  // ── And the bytes are not actually lost, because the source is never cleaned up. ────────────────
  {
    assert(
      items[`${LEGACY_KEY_PREFIX}__corrupt__.debts.2026-01-01T00:00:00.000Z`] === '"{bad json"',
      "the v1.6 quarantine bytes remain in the source even when carrying them failed",
    );
  }

  // ── W1-6 (P6.8.7c.3): "found and refused" is NOT "a fresh install" ──────────────────────────────
  // ⛔ The audit's highest-harm finding, and it turned on a single field nobody read. A v1.6 database
  // that is found and then will not open leaves `truncated` FALSE — the walk succeeded — so the old test
  // reported it as a fresh install, which is terminal, which lets the caller seed an empty store, which
  // consumes the one condition the retry depends on. The user lands in a setup wizard with their whole
  // portfolio intact on disk and permanently unreachable.
  {
    const refused = (): LegacyReadReport => ({
      supported: true,
      webkitRoot: '/x/Library/WebKit',
      visited: 7,
      truncated: false, // ⚠️ the walk itself was fine — this is why `truncated` alone could never catch it
      candidates: ['/x/db.sqlite3'],
      opened: [{ path: '/x/db.sqlite3', rows: 0, legacyKeys: 0, error: 'database is locked' }],
      store: null,
      droppedRows: 0,
    });
    const out = await migrateFromLegacy(new MemoryStorageAdapter(), async () => refused());
    assert(!out.outcome.migrated, 'a refused database still means nothing migrated');
    assert(
      out.outcome.terminal === false,
      '⛔ …but it is NOT terminal — the caller must not seed over it',
    );
    assert(
      /would not open/.test(out.outcome.reason),
      `…and the reason names the refusal rather than claiming a fresh install (got: ${out.outcome.reason})`,
    );

    // The genuine fresh install still reads as one — the fix must not make every launch retry forever.
    const clean = (): LegacyReadReport => ({
      supported: true,
      webkitRoot: '/x/Library/WebKit',
      visited: 7,
      truncated: false,
      candidates: [],
      opened: [],
      store: null,
      droppedRows: 0,
    });
    const fresh = await migrateFromLegacy(new MemoryStorageAdapter(), async () => clean());
    assert(fresh.outcome.terminal === true, '⭐ a CONFIRMED fresh install is still terminal');

    // A walk that never ran cannot conclude anything, even with no candidates.
    const unwalked = (): LegacyReadReport => ({ ...clean(), visited: 0 });
    const none = await migrateFromLegacy(new MemoryStorageAdapter(), async () => unwalked());
    assert(none.outcome.terminal === false, 'a walk that never ran is UNKNOWN, not "nothing here"');

    // A cap that stopped the search was already handled — it must stay handled.
    const cut = (): LegacyReadReport => ({ ...clean(), truncated: true });
    const short = await migrateFromLegacy(new MemoryStorageAdapter(), async () => cut());
    assert(short.outcome.terminal === false, 'a truncated search is UNKNOWN (unchanged)');

    // A successful migration is terminal — otherwise the caller would decline to seed after a WIN.
    const ok2 = await migrateFromLegacy(new MemoryStorageAdapter(), async () => report());
    assert(ok2.outcome.terminal === true, 'a successful migration is terminal');
  }

  console.log(`✅ 5.10.4 interruption + quarantine tests passed (${passed} asserts).`);
}
