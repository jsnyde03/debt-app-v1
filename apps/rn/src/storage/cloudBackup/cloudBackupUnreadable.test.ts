import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  REMOTE_UNREADABLE,
  SIGN_IN_TO_ICLOUD,
  STATUS_NEVER,
  cloudBackupMessage,
  cloudBackupStatusLine,
} from '@/data/cloudBackupMessages';
import { encodeCloudBackup } from '@/data/cloudBackup';
import { createDefaultStore } from '@/data/defaults';
import { toCloudBackupUiStatus } from '@/hooks/use-cloud-backup';
import { metadataFromMtime } from '@/storage/cloudBackup/provider';
import type { CloudBackupProvider } from '@/storage/cloudBackup/provider';
import { backupToCloudGuarded, getCloudBackupStatus, restoreFromCloud } from '@/storage/cloudBackup/service';

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `B3-3`] — ONE CONDITION, EVERY LAYER THAT CONSUMES IT.**
 *
 * The condition: **iCloud is reachable, the user IS signed in, the backup file exists, and its `mtimeMs`
 * cannot be read.** `provider.ts` makes `metadataFromMtime` *throw* on it, deliberately, so the state
 * would be visible rather than degrade into a silent 1970.
 *
 * ⚡ **This asserts the CLASS, and the class is the layer list.** Pass 5's `B5-11` fixed exactly one
 * consumer — `backupToCloudGuarded`, where the finding pointed — while `getCloudBackupStatus` kept
 * answering `available: false`. So the sheet told a signed-in user to **sign in** and put every control,
 * including the only route back to their data, inside the branch it had just skipped. A test naming
 * `getCloudBackupStatus` would close this finding and leave the next consumer open; `LAYERS` is the
 * population, and adding a consumer without adding it here is the only way past this file.
 *
 * ⛔ **AND THE ANSWER THAT MATTERS IS NOT "does it say the right words" BUT "can the user still get their
 * data back".** `restoreFromCloud` stats with `.catch(() => null)` and works perfectly in this state —
 * the door was never broken, only hidden — so that assertion sits here beside the copy ones.
 */

/** Written this way rather than as an escape: every shell that has touched this file mangled the escape. */
const NEWLINE = String.fromCharCode(10);

let passed = 0;

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/** Signed in, the file is there, and its mtime will not read — exactly `provider.ts`'s designed throw. */
function unreadableMtimeProvider(): CloudBackupProvider {
  return {
    async isAvailable() {
      return true;
    },
    async write() {},
    async read() {
      // ⚠️ Encoded by the real producer, not hand-written. A hand-built envelope failed to decode — with a
      // READABLE mtime too, measured — which would have made the restore assertion below fail for a
      // reason that has nothing to do with the condition under test.
      return encodeCloudBackup(createDefaultStore());
    },
    async stat() {
      // ⚠️ The real shape: the provider reads a null mtime off the container and `metadataFromMtime`
      // raises. Written as the real call rather than a bare `throw`, so a change to that rule reaches here.
      return metadataFromMtime(null);
    },
    async delete() {},
  };
}

function enabledStore() {
  const base = createDefaultStore();
  return { ...base, prefs: { ...base.prefs, cloudBackupEnabled: true, onboardingComplete: true } };
}

const DEAD_END_TEST = "status === 'unavailable' ? (";

/**
 * Source with whole-line comments removed.
 *
 * ⛔ **NOT tidiness — the assertions below would otherwise red on their own documentation.** The docblocks
 * in `CloudBackupSheet.tsx` now QUOTE `status !== 'ready'` while recording why it was wrong, and
 * `stripCode.ts` names this exactly: *"a guard that reds on its own documentation gets deleted rather than
 * obeyed"*.
 *
 * ⚠️ **A line filter, not a lexer, and the difference is stated rather than implied.** It handles the
 * block and line comments that file actually contains; it would miss a trailing `// …` after code on the
 * same line. The real scanner is `scripts/lib/stripCode.ts`, which the app tree cannot import —
 * `lint:amount-collapse` is the gate that uses it.
 */
function codeLinesOnly(source: string): string {
  return source
    .split(NEWLINE)
    .filter((line) => {
      const t = line.trimStart();
      return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
    })
    .join(' ');
}

export async function runCloudBackupUnreadableTests() {
  console.log('\n☁️ the backup whose timestamp will not read: every layer, one condition\n');

  const provider = unreadableMtimeProvider();

  {
    // The premise, asserted rather than assumed: this really is the designed throw, and the user really
    // is signed in. If either stops being true, every assertion below is measuring something else.
    eq(await provider.isAvailable(), true, 'the fixture is SIGNED IN — that is the whole point of it');
    let threw = '';
    try {
      await provider.stat();
    } catch (e) {
      threw = String(e);
    }
    assert(/mtimeMs is unusable/.test(threw), '…and `stat` raises the throw `provider.ts` was written to raise');
  }

  const status = await getCloudBackupStatus(provider);

  /**
   * Each layer answers the same question about the same condition: *does this tell a signed-in user they
   * are signed out, or hide the way back to their data?*
   */
  const LAYERS: { name: string; check: () => Promise<void> | void }[] = [
    {
      name: 'getCloudBackupStatus',
      check: () => {
        assert(status.available, 'the account is available — the user is signed in and this must say so');
        assert(status.unreadable, '…and the timestamp is named unreadable rather than folded into "unavailable"');
      },
    },
    {
      name: 'the hook’s UI mapping',
      check: () => {
        eq(toCloudBackupUiStatus(status), 'ready-unreadable', 'maps to its own state, not to `unavailable`');
        eq(
          toCloudBackupUiStatus({ available: false, unreadable: false, lastBackupAt: null }),
          'unavailable',
          '…while a genuinely signed-out account still does',
        );
        eq(
          toCloudBackupUiStatus({ available: true, unreadable: false, lastBackupAt: null }),
          'ready',
          '…and an ordinary reachable container is plain `ready`',
        );
      },
    },
    {
      name: 'backupToCloudGuarded',
      check: async () => {
        const out = await backupToCloudGuarded(enabledStore(), provider);
        assert(!out.ok, 'refuses — an unidentifiable remote is never overwritten');
        if (!out.ok) eq(out.reason, 'remote-unreadable', '…naming the real reason (pass-5 `B5-11`, still holding)');
      },
    },
    {
      name: 'cloudBackupMessage',
      check: () => {
        const text = cloudBackupMessage({ result: 'remote-unreadable' }, 'Backed up.');
        eq(text, REMOTE_UNREADABLE, 'says the timestamp is missing and the data is safe');
        assert(text !== SIGN_IN_TO_ICLOUD, '…and does NOT name an action the user has already taken');
      },
    },
    {
      name: 'cloudBackupStatusLine',
      check: () => {
        const line = cloudBackupStatusLine({
          status: 'ready-unreadable',
          unclaimedRemoteAt: null,
          lastBackupAt: null,
          formatTime: () => 'x',
        });
        eq(line.kind, 'unreadable', 'names the state');
        assert(line.text !== STATUS_NEVER, '⛔ …and does NOT read "Not backed up yet" over a container that HAS one');
        assert(/restore/i.test(line.text), '…and it tells the user the way back is still open');
        const claimed = cloudBackupStatusLine({
          status: 'ready-unreadable',
          unclaimedRemoteAt: '2026-08-01T00:00:00.000Z',
          lastBackupAt: null,
          formatTime: () => 'x',
        });
        eq(claimed.kind, 'unclaimed', '⚠️ …while [B3] still outranks it: an unclaimed copy is never presented as ours');
      },
    },
    {
      /**
       * ⛔ **S1.13.7.11 [pass-6 blocker `B3-2`] — the SAME state through a different door.** `B3-3`'s
       * `'ready-unreadable'` is *"the provider will not report a timestamp"*. `B3-2` is *"the timestamp is
       * PRESENT and cannot be read"* — an `exportedAt` from a file the user found somewhere. Both must
       * produce a line that claims no date; neither may fall through to `STATUS_NEVER` over a container
       * that holds a backup. `formatTime` returns `null` for the unreadable case, which is what the real
       * `formatBackupTime` now does.
       */
      name: 'cloudBackupStatusLine — a PRESENT but unreadable stamp',
      check: () => {
        const unreadable = cloudBackupStatusLine({
          status: 'ready',
          unclaimedRemoteAt: null,
          lastBackupAt: 'banana',
          formatTime: () => null,
        });
        eq(unreadable.kind, 'unreadable', 'an unreadable stamp lands on the honest line, not on "last backed up"');
        assert(unreadable.text !== STATUS_NEVER, '⛔ …and NOT "Not backed up yet" over a container that HAS one');
        assert(!/recently/i.test(unreadable.text), '⛔ …and never the word "recently"');

        const unclaimed = cloudBackupStatusLine({
          status: 'ready',
          unclaimedRemoteAt: 'banana',
          lastBackupAt: null,
          formatTime: () => null,
        });
        eq(unclaimed.kind, 'unclaimed', '⚠️ [B3] still outranks it — an unaccounted copy stays unaccounted');
        assert(
          /another device/i.test(unclaimed.text),
          '…and the "not from this device" half SURVIVES the missing date, because the next tap deletes it',
        );
        assert(!/recently|undefined|null/i.test(unclaimed.text), '⛔ …with no invented date and no leaked placeholder');

        const good = cloudBackupStatusLine({
          status: 'ready',
          unclaimedRemoteAt: null,
          lastBackupAt: '2019-03-04T10:00:00.000Z',
          formatTime: () => '3/4/2019 at 5:00 AM',
        });
        eq(good.kind, 'last-backup', 'control: a readable stamp still reads "Last backed up"');
        assert(good.text.includes('2019'), '  …carrying the date it was given');
      },
    },
    {
      name: 'restoreFromCloud — the door itself',
      check: async () => {
        const out = await restoreFromCloud(provider);
        assert(
          out.ok,
          '⛔ the restore WORKS in this state: `stat` here is `.catch(() => null)`, so the door was only ever HIDDEN',
        );
      },
    },
    {
      name: 'CloudBackupSheet — where the controls live',
      check: () => {
        /**
         * ⚠️ Source-level, and named as such: this branch is unreachable to every automated test in the
         * repo (on web the provider is the unavailable stub by construction), which is the reason the
         * copy decisions were moved into pure modules in the first place. What can still be asserted is
         * the SHAPE — the dead end is gated on `'unavailable'` alone, and Restore is not inside it.
         */
        const sheet = readFileSync(join(__dirname, '..', '..', 'components', 'more', 'CloudBackupSheet.tsx'), 'utf8');
        assert(sheet.includes(DEAD_END_TEST), 'the dead-end branch tests `status === unavailable` exactly');
        /**
         * ⚠️ **COMMENT LINES ARE DROPPED FIRST, and that is not tidiness.** The docblocks in that file now
         * QUOTE `status !== 'ready'` while recording why it was wrong, so a raw `includes` reds on the
         * documentation of its own fix — `stripCode.ts` names this exactly: *"a guard that reds on its own
         * documentation gets deleted rather than obeyed"*. ⛔ This is a line-prefix filter, not a lexer:
         * it handles the block and line comments this file actually contains and would miss a trailing
         * `// …` after code. The full scanner lives in `scripts/lib/stripCode.ts` and is out of reach from
         * the app tree; `lint:amount-collapse` is the gate that uses it.
         */
        const code = codeLinesOnly(sheet);
        assert(
          !code.includes("status !== 'ready'"),
          '…and nothing disables a control by asking `status !== ready`, which excluded this state',
        );
        const deadEnd = sheet.slice(sheet.indexOf(DEAD_END_TEST), sheet.indexOf(') : ('));
        assert(
          !/cloud-backup-restore|RESTORE_FROM_CLOUD_ACTION|cloud-backup-now/.test(deadEnd),
          '⛔ …and neither the restore door nor Back up now is inside the dead end',
        );
      },
    },
  ];

  for (const layer of LAYERS) {
    console.log(`  · ${layer.name}`);
    await layer.check();
  }

  eq(LAYERS.length, 8, 'every layer that consumes this condition is walked — adding one means adding it here');

  console.log(`\n✅ cloud backup, unreadable timestamp: ${passed} assertions passed\n`);
}

void runCloudBackupUnreadableTests();
