import { decodeCloudBackup, encodeCloudBackup, plaintextCloudCodec, type CloudBackupCodec } from '@/data/cloudBackup';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import {
  backupToCloud,
  getCloudBackupStatus,
  isOnboarded,
  restoreFromCloud,
  shouldAutoBackup,
} from '@/storage/cloudBackup/service';
import type { CloudBackupMetadata, CloudBackupProvider } from '@/storage/cloudBackup/provider';

/**
 * P6.3.3.4 — the cloud service's orchestration.
 *
 * ⛔ **The clobber guard is the reason this file exists.** An automatic backup that fires on any store is
 * a data-loss mechanism wearing a data-protection label: it can overwrite a good remote with an empty
 * local one, and the user finds out on the day they needed it. Every refusal below is asserted
 * INDIVIDUALLY, because a guard that happens to be right for the wrong reason passes a combined test.
 *
 * ⚠️ No native anything here — the provider is a fake. That is the point of the seam; these branches are
 * exactly the ones a device pass cannot practically reach (an iCloud write that throws, a file that is
 * present but undownloadable, a foreign blob in the container).
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`cloudBackup service: ${label}`);
  passed += 1;
}
function eq<T>(actual: T, expected: T, label: string) {
  assert(Object.is(actual, expected), `${label} (got ${String(actual)}, expected ${String(expected)})`);
}

const AT = new Date('2026-08-20T15:00:00.000Z');

function onboardedStore(over?: Partial<DebtStore['prefs']>): DebtStore {
  const store = createDefaultStore();
  return { ...store, prefs: { ...store.prefs, onboardingComplete: true, ...over } };
}

/** A provider backed by a plain variable — the whole point of injecting it. */
function fakeProvider(init?: { contents?: string | null; available?: boolean; modifiedAt?: string }) {
  let contents = init?.contents ?? null;
  const state = {
    available: init?.available ?? true,
    writes: 0,
    get contents() {
      return contents;
    },
  };
  const provider: CloudBackupProvider = {
    async isAvailable() {
      return state.available;
    },
    async write(next: string) {
      state.writes += 1;
      contents = next;
    },
    async read() {
      return contents;
    },
    async stat(): Promise<CloudBackupMetadata | null> {
      return contents === null ? null : { modifiedAt: init?.modifiedAt ?? AT.toISOString() };
    },
  };
  return { provider, state };
}

export default async function run() {
  // ── Round trip through the service, not just the codec. ─────────────────────────────────────────
  {
    const { provider, state } = fakeProvider();
    const store = onboardedStore();
    const result = await backupToCloud(store, provider, plaintextCloudCodec, { now: AT });
    assert(result.ok, 'a backup to an available provider succeeds');
    if (result.ok) eq(result.at, AT.toISOString(), 'and reports the time it was taken');
    eq(state.writes, 1, 'exactly one write');

    const restored = await restoreFromCloud(provider);
    assert(restored.ok, 'and it reads back');
    if (restored.ok) eq(restored.store.prefs.onboardingComplete, true, 'as the same store');
  }

  // ── Unavailable iCloud is NOT an error — it is the normal state of a signed-out device. ─────────
  {
    const { provider, state } = fakeProvider({ available: false });
    const backup = await backupToCloud(onboardedStore(), provider, plaintextCloudCodec, { now: AT });
    assert(!backup.ok, 'a backup with iCloud unavailable does not succeed');
    if (!backup.ok) eq(backup.reason, 'unavailable', 'and says so, rather than reporting an error');
    eq(state.writes, 0, '⛔ and it does NOT write — an unavailable check that still wrote would be useless');

    const restore = await restoreFromCloud(provider);
    assert(!restore.ok, 'a restore with iCloud unavailable does not succeed');
    if (!restore.ok) eq(restore.reason, 'unavailable', 'and says so');

    const status = await getCloudBackupStatus(provider);
    eq(status.available, false, 'status reports unavailable');
    eq(status.lastBackupAt, null, 'with no last-backup time');
  }

  // ── An EMPTY container is "no-backup", never an error. Every user starts here. ──────────────────
  {
    const { provider } = fakeProvider({ contents: null });
    const restore = await restoreFromCloud(provider);
    assert(!restore.ok, 'restoring from an empty container does not succeed');
    if (!restore.ok) eq(restore.reason, 'no-backup', '⛔ and it is "no-backup", not "error" — the honest empty case');

    const status = await getCloudBackupStatus(provider);
    eq(status.available, true, 'iCloud is still available');
    eq(status.lastBackupAt, null, 'there is simply nothing in it yet');
  }

  // ── A provider that THROWS is contained. None of these may propagate. ───────────────────────────
  {
    const exploding: CloudBackupProvider = {
      async isAvailable() {
        return true;
      },
      async write() {
        throw new Error('iCloud write failed');
      },
      async read() {
        throw new Error('iCloud read failed');
      },
      async stat() {
        throw new Error('iCloud stat failed');
      },
    };
    const backup = await backupToCloud(onboardedStore(), exploding, plaintextCloudCodec, { now: AT });
    assert(!backup.ok, 'a throwing write is caught');
    if (!backup.ok) eq(backup.reason, 'error', 'and reported as an error');

    const restore = await restoreFromCloud(exploding);
    assert(!restore.ok, 'a throwing read is caught');
    if (!restore.ok) eq(restore.reason, 'error', 'and reported as an error');

    const status = await getCloudBackupStatus(exploding);
    eq(status.available, false, 'a throwing stat degrades to unavailable rather than crashing the row');
  }

  // ── A FOREIGN blob in the container is refused, and the local store is never handed a fake one. ─
  {
    const { provider } = fakeProvider({ contents: JSON.stringify({ hello: 'world' }) });
    const restore = await restoreFromCloud(provider);
    assert(!restore.ok, 'a foreign file in the container is refused');
    if (!restore.ok) {
      eq(restore.reason, 'error', 'as an error (it is OUR container — something is wrong)');
      assert((restore.message ?? '').length > 0, 'with a message a human can read');
    }
  }

  // ── THE CLOBBER GUARD. Each refusal asserted on its own. ────────────────────────────────────────
  {
    const enabled = { cloudBackupEnabled: true };

    assert(
      shouldAutoBackup(onboardedStore(enabled), { declinedRestore: false }),
      'an onboarded user who turned it on is backed up automatically',
    );

    // 1. Not onboarded — also the post-"Delete all data" state, exactly when iCloud is the last copy.
    const fresh = createDefaultStore();
    assert(
      !shouldAutoBackup({ ...fresh, prefs: { ...fresh.prefs, ...enabled } }, { declinedRestore: false }),
      '⛔ a store that has not onboarded is NOT auto-backed-up — it would overwrite a good remote with nothing',
    );

    // 2. Declined the restore offer this session.
    assert(
      !shouldAutoBackup(onboardedStore(enabled), { declinedRestore: true }),
      '⛔ declining the restore suppresses auto-backup — otherwise "restore later" becomes impossible',
    );

    // 3. [D47] default OFF, and an OLD store has no key at all.
    assert(!shouldAutoBackup(onboardedStore(), { declinedRestore: false }), 'default OFF: an absent key means off');
    assert(
      !shouldAutoBackup(onboardedStore({ cloudBackupEnabled: false }), { declinedRestore: false }),
      'an explicit false means off',
    );
    // ⚠️ Written against the exact failure a truthiness check would let through.
    assert(
      !shouldAutoBackup(
        onboardedStore({ cloudBackupEnabled: 'yes' as unknown as boolean }),
        { declinedRestore: false },
      ),
      '⛔ a non-boolean truthy value is OFF — the check is `=== true`, not truthiness',
    );
  }

  // ── `isOnboarded` reads the FLAG, not the portfolio. ────────────────────────────────────────────
  //
  // ⚠️ A user with zero debts who has onboarded is a real, common state (they finished setup, or paid
  // everything off). Inferring freshness from an empty `debts` array would suppress their backups AND
  // re-offer a restore they already declined, every launch.
  {
    const store = onboardedStore();
    eq(store.debts.length, 0, 'the fixture genuinely has no debts');
    assert(isOnboarded(store), 'and is still onboarded');
    assert(!isOnboarded(createDefaultStore()), 'a default store is not');
  }

  // ── The service passes the CODEC through — it does not quietly re-encode as plaintext. ──────────
  {
    const reverse = (s: string) => [...s].reverse().join('');
    const reverseCodec: CloudBackupCodec = { id: 'test-reverse', encodePayload: reverse, decodePayload: reverse };
    const { provider, state } = fakeProvider();
    await backupToCloud(onboardedStore(), provider, reverseCodec, { now: AT });
    const wire = JSON.parse(state.contents ?? '{}') as Record<string, unknown>;
    eq(wire.codec, 'test-reverse', 'the codec the caller passed is the one recorded');

    const withDefault = await restoreFromCloud(provider);
    assert(!withDefault.ok, 'and a build without that codec refuses the blob');
    const withIt = await restoreFromCloud(provider, [plaintextCloudCodec, reverseCodec]);
    assert(withIt.ok, 'while a build with it restores');
  }

  // ── Status surfaces the file's modification time, which is what "Last backed up" means. ─────────
  {
    const store = onboardedStore();
    const { provider } = fakeProvider({
      contents: encodeCloudBackup(store, plaintextCloudCodec, { now: AT }),
      modifiedAt: '2026-08-19T09:30:00.000Z',
    });
    const status = await getCloudBackupStatus(provider);
    eq(status.available, true, 'available');
    eq(status.lastBackupAt, '2026-08-19T09:30:00.000Z', 'and the time comes from the FILE, not from a local guess');
    // ⚠️ Deliberately not the store's `exportedAt`: a local timestamp would keep reading "backed up" after a
    // write that never landed. The file's own mtime is the only claim iCloud can actually back.
    assert(decodeCloudBackup(encodeCloudBackup(store, plaintextCloudCodec, { now: AT })).ok, 'sanity: the fixture is a real blob');
  }

  console.log(`✅ cloud backup service tests passed (${passed} asserts).`);
}
