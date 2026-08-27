import { decodeCloudBackup, encodeCloudBackup, plaintextCloudCodec, type CloudBackupCodec } from '@/data/cloudBackup';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import {
  backupToCloud,
  backupToCloudGuarded,
  deleteCloudBackup,
  getCloudBackupStatus,
  inspectRemote,
  isOnboarded,
  restoreFromCloud,
  shouldAutoBackup,
} from '@/storage/cloudBackup/service';
import { metadataFromMtime, type CloudBackupMetadata, type CloudBackupProvider } from '@/storage/cloudBackup/provider';

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
    deletes: 0,
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
    async delete() {
      state.deletes += 1;
      contents = null;
    },
  };
  return { provider, state };
}

/**
 * P6.8.7d.1 — a provider whose mtime MOVES when it is written, the way a filesystem's does.
 *
 * ⚠️ `fakeProvider` above returns a fixed `modifiedAt`, which is fine for the round-trip tests and useless
 * for the clobber guard: the whole guard turns on "did this file change since I last saw it", and a
 * provider that cannot answer differently before and after a write can only ever confirm the guard.
 */
function clockedProvider(init?: { contents?: string | null; modifiedAt?: string | null }) {
  let contents = init?.contents ?? null;
  let modifiedAt = init?.modifiedAt ?? (contents === null ? null : '2026-01-01T00:00:00.000Z');
  let tick = 0;
  const state = {
    writes: 0,
    /** Set on a REMOTE write — someone else's device putting a file in the container while we run. */
    foreignWrite(at: string) {
      contents = '{}';
      modifiedAt = at;
    },
    get modifiedAt() {
      return modifiedAt;
    },
    get writeCount() {
      return state.writes;
    },
  };
  const provider: CloudBackupProvider = {
    async isAvailable() {
      return true;
    },
    async write(next: string) {
      state.writes += 1;
      contents = next;
      tick += 1;
      // A distinct, monotonic instant per write — never the caller's `now`, which is exactly the value
      // `backupToCloud` must NOT be allowed to get away with reporting.
      modifiedAt = new Date(Date.UTC(2026, 5, 1, 0, 0, tick)).toISOString();
    },
    async read() {
      return contents;
    },
    async stat(): Promise<CloudBackupMetadata | null> {
      return modifiedAt === null ? null : { modifiedAt };
    },
    async delete() {
      contents = null;
      modifiedAt = null;
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
      async delete() {
        throw new Error('iCloud unlink failed');
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
      // ⛔ P6.8.7d.3 [M3-5] — SPECIFIC, not generic. This exact string was computed here and then thrown
      // away one layer short of the screen, which rendered "That didn't work." for every failure alike.
      assert(
        /isn’t a Debt Planner backup/.test(restore.message ?? ''),
        '⛔ and it is the SPECIFIC diagnosis, which is what the screen now shows',
      );
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

  // ── THE REMOTE HALF OF THE GUARD (P6.8.7d.1, finding B3 / M3-3). ───────────────────────────────
  //
  // ⛔ The defect this closes: flipping "Back up to iCloud" ON immediately overwrote whatever was in the
  // container, including the backup the user had DECLINED at first launch — while the sheet displayed it
  // as "Last backed up …". ⚠️ R1 measured the fix both lenses proposed (route it through
  // `shouldAutoBackup`) and it returns TRUE at that moment, permitting the clobber anyway. Nothing in the
  // app reasoned about the remote at all, so every assertion below is about a question that had no asker.
  {
    // 1. The four states, each on its own. `unknown` and `none` are the pair that must never merge:
    //    "iCloud is unreachable" would license a write if it read as "there is nothing there".
    const empty = clockedProvider();
    eq((await inspectRemote(empty.provider, undefined)).state, 'none', 'an empty container is `none`');

    const held = clockedProvider({ contents: '{}', modifiedAt: '2026-03-01T00:00:00.000Z' });
    eq(
      (await inspectRemote(held.provider, undefined)).state,
      'unclaimed',
      '⛔ a remote this install has NEVER accounted for is `unclaimed` — this is the B3 state',
    );
    eq(
      (await inspectRemote(held.provider, '2026-03-01T00:00:00.000Z')).state,
      'ours',
      'the exact file we recorded is `ours`',
    );
    eq(
      (await inspectRemote(held.provider, '2026-02-01T00:00:00.000Z')).state,
      'unclaimed',
      '⛔ a DIFFERENT mtime is unclaimed even though ours is older — "newer wins" is how sync loses data',
    );
    eq(
      (await inspectRemote(held.provider, '2026-04-01T00:00:00.000Z')).state,
      'unclaimed',
      '⛔ and even though ours is NEWER — the question is identity, not recency',
    );

    const unavailable: CloudBackupProvider = { ...held.provider, async isAvailable() { return false; } };
    eq(
      (await inspectRemote(unavailable, undefined)).state,
      'unknown',
      '⛔ an unreachable iCloud is `unknown`, NOT `none` — conflating them licenses the overwrite',
    );
    const throwing: CloudBackupProvider = {
      ...held.provider,
      async stat() {
        throw new Error('iCloud stat failed');
      },
    };
    eq((await inspectRemote(throwing, undefined)).state, 'unknown', 'a throwing stat is contained as `unknown`');

    /**
     * ⛔ **S1.10.6.4 [pass-3 blocker B3] — THE ASSERTION THAT STOPPED AT `inspectRemote`.**
     *
     * ⚡ The line above is the whole of this file's coverage of a throwing `stat`, and it stops one layer
     * short: **no assertion anywhere called `backupToCloudGuarded` with one, and neither `writeCount`
     * assertion in this file is on an `unknown` claim** — both are on the `unclaimed` provider. Measured
     * against the real module: `writes=1`, the other device's file **gone**, the sheet reporting *"Backed
     * up"*, and this suite green.
     *
     * ⚠️ `isAvailable()` stays **true** here, and that is the fixture's whole point. `unknown` is produced
     * two ways; the `isAvailable() === false` one really is refused downstream, which is what the guard's
     * docblock used to claim of both. This is the other one.
     */
    const guardedOverUnknown = await backupToCloudGuarded(
      onboardedStore({ cloudBackupEnabled: true }),
      { ...held.provider, async stat() { throw new Error('iCloud stat failed'); } },
    );
    assert(!guardedOverUnknown.ok, '⛔ B3 — a guarded backup over an UNKNOWN remote does not succeed');
    if (!guardedOverUnknown.ok) {
      eq(guardedOverUnknown.reason, 'unavailable', '…and says the question was unanswered, not that it wrote');
    }
    eq(held.state.writeCount, 0, '⛔ B3 — ZERO writes: the other device’s copy is still in the container');

    /**
     * ⛔ **B3's SECOND HALF — the file that exists and cannot be identified.** `metadataFromMtime` is the
     * rule, extracted into the pure module because the iOS provider imports a TurboModule that no test
     * runner can load — which is exactly why this rule had neither an owner nor a test.
     *
     * ⚠️ **`null` and `0` are the members that mattered and the ones nobody pictured**: measured, they do
     * NOT throw from `new Date(...)`, they become `1970-01-01T00:00:00.000Z`, and `inspectRemote` compares
     * that epoch stamp as a real identity. The throwing pair at least reached a guard.
     */
    for (const bad of [undefined, null, NaN, 0, -1, '123', {}]) {
      let threw = false;
      try {
        metadataFromMtime(bad);
      } catch {
        threw = true;
      }
      assert(threw, `⛔ B3 — an unusable mtimeMs (${String(bad)}) throws rather than inventing a file identity`);
    }
    // ⭐ CONTROL — a real mtime still produces the identity the whole guard compares on.
    eq(metadataFromMtime(1772150400000).modifiedAt, new Date(1772150400000).toISOString(), '⭐ control — a usable mtime still becomes the file’s identity');

    /**
     * ⛔ **AND THE DIRECTION THAT MAKES THE THROW CORRECT.** Returning `null` was the finding's own stated
     * remedy and it is the clobber: `inspectRemote` reads `null` as **`none`**, which the guard PERMITS.
     */
    const unidentifiable: CloudBackupProvider = {
      ...held.provider,
      async stat() {
        return metadataFromMtime(undefined);
      },
    };
    eq(
      (await inspectRemote(unidentifiable, undefined)).state,
      'unknown',
      '⛔ B3 — a file with no usable mtime is `unknown` (which is refused), never `none` (which is permitted)',
    );
  }

  {
    // 2. The guard REFUSES, and — the assertion that matters — it refuses BEFORE writing. A guard that
    //    reports a clobber it has already performed is the shape `check-destructive-writes` exists for.
    const { provider, state } = clockedProvider({ contents: '{}', modifiedAt: '2026-03-01T00:00:00.000Z' });
    const declined = await backupToCloudGuarded(onboardedStore({ cloudBackupEnabled: true }), provider);
    assert(!declined.ok, 'a guarded backup over an unclaimed remote does not succeed');
    if (!declined.ok) {
      eq(declined.reason, 'remote-unclaimed', 'and the reason names the remote, not a failure');
      if (declined.reason === 'remote-unclaimed') {
        eq(declined.remoteAt, '2026-03-01T00:00:00.000Z', 'carrying the other copy’s date, so the UI can show it');
      }
    }
    eq(state.writeCount, 0, '⛔ ZERO writes — the declined backup is still in the container');

    // 3. The informed override still works. `backupToCloud` is the "the user read the date and chose to
    //    lose it" path; taking the guard away entirely would have been a fix that broke the feature.
    const replaced = await backupToCloud(onboardedStore({ cloudBackupEnabled: true }), provider);
    assert(replaced.ok, 'the UNGUARDED path still overwrites — that is the user’s informed choice');
    eq(state.writeCount, 1, 'and it wrote exactly once');
  }

  {
    // 4. ⛔ THE REGRESSION THAT WOULD MAKE THE GUARD BLOCK EVERYTHING. `backupToCloud` must report the
    //    file's OBSERVED mtime, not the clock it was handed — otherwise the claim it records never
    //    matches the next `stat()`, every later backup is refused as a foreign clobber, and the feature
    //    silently stops working for the users who turned it on.
    const { provider, state } = clockedProvider();
    const first = await backupToCloudGuarded(onboardedStore({ cloudBackupEnabled: true }), provider, undefined, {
      now: AT,
    });
    assert(first.ok, 'the first backup into an empty container is permitted');
    if (!first.ok) return passed;
    assert(first.at !== AT.toISOString(), '⛔ `at` is NOT the clock it was given');
    eq(first.at, state.modifiedAt, 'it is the mtime the file actually has');

    // Claiming it is what a caller does with `at`; the next guarded backup must then go through.
    const claimed = onboardedStore({ cloudBackupEnabled: true, cloudBackupRemoteAt: first.at });
    eq((await inspectRemote(provider, claimed.prefs.cloudBackupRemoteAt)).state, 'ours', 'our own file reads as ours');
    const second = await backupToCloudGuarded(claimed, provider);
    assert(second.ok, '⛔ a second backup by the SAME install succeeds — the guard is not a one-shot');
    eq(state.writeCount, 2, 'two writes, both ours');

    // 5. And the moment another device writes, the same install is refused again.
    state.foreignWrite('2026-09-09T09:09:09.000Z');
    const afterForeign = await backupToCloudGuarded(claimed, provider);
    assert(!afterForeign.ok, '⛔ a foreign write mid-session makes the very next backup refuse');
    eq(state.writeCount, 2, 'and nothing was written over it');
  }

  {
    // 6. `restoreFromCloud` carries the mtime it read AT, and reads it BEFORE the contents. If the file
    //    moves underneath us the caller must end up claiming the OLDER instant — which makes the next
    //    check say `unclaimed` and ask, rather than say `ours` and overwrite a copy nobody ever read.
    const { provider } = clockedProvider();
    await backupToCloud(onboardedStore(), provider, plaintextCloudCodec, { now: AT });
    const beforeAt = (await provider.stat())?.modifiedAt ?? null;
    const shifting: CloudBackupProvider = {
      ...provider,
      async read() {
        const raw = await provider.read();
        // Someone else's device lands a write in the window between our stat and our read.
        await provider.write(raw ?? '');
        return raw;
      },
    };
    const restored = await restoreFromCloud(shifting);
    assert(restored.ok, 'the restore still succeeds');
    if (restored.ok) {
      eq(restored.at, beforeAt, '⛔ and reports the mtime from BEFORE the read, not the one it ended with');
      assert(restored.at !== (await provider.stat())?.modifiedAt, 'which is deliberately the stale one');
    }
  }

  // ── "DELETE ALL DATA" REACHES THE REMOTE (P6.8.7d.2, finding C9). ──────────────────────────────
  //
  // ⛔ The container used to survive the wipe, so the next launch's restore offer handed the previous
  // owner's whole plan to whoever was holding the phone — while the confirm said "permanently erased…
  // cannot be undone". The assertions below are about the two ways this can go on lying: reporting a
  // success nobody performed, and reporting a failure for the state it was trying to reach.
  {
    const { provider, state } = fakeProvider({ contents: '{"v":1}' });
    const result = await deleteCloudBackup(provider);
    assert(result.ok, 'deleting an existing backup succeeds');
    eq(state.deletes, 1, 'and it actually went to the provider');
    eq(state.contents, null, 'the container is empty afterwards');

    // "Already gone" is the state this call exists to REACH. Reporting it as failure would tell a user
    // whose backup is genuinely erased that it survived.
    const again = await deleteCloudBackup(provider);
    assert(again.ok, '⛔ deleting again is a SUCCESS, not an error — the goal state is already true');
  }

  {
    // ⛔ THE LIE THIS GUARDS. The unavailable provider's `delete()` resolves happily — it is a no-op —
    // so a caller that only watched for a throw would report "your iCloud backup is gone" to a user on a
    // signed-out iPhone whose backup is untouched. The availability check is the whole difference.
    const { provider, state } = fakeProvider({ available: false, contents: '{"v":1}' });
    const result = await deleteCloudBackup(provider);
    assert(!result.ok, 'a delete with iCloud unavailable does NOT report success');
    if (!result.ok) eq(result.reason, 'unavailable', 'and says which');
    eq(state.deletes, 0, 'and never reached the provider at all');
    assert(state.contents !== null, '⛔ the backup is still there — which is exactly why it must not say ok');
  }

  {
    // A throwing unlink means the file is STILL THERE. Contained, but never as a success.
    const exploding: CloudBackupProvider = {
      async isAvailable() {
        return true;
      },
      async write() {},
      async read() {
        return null;
      },
      async stat() {
        return null;
      },
      async delete() {
        throw new Error('iCloud unlink failed');
      },
    };
    const result = await deleteCloudBackup(exploding);
    assert(!result.ok, 'a throwing delete is caught');
    if (!result.ok) eq(result.reason, 'error', 'and reported as an error, so the caller can say so');
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
