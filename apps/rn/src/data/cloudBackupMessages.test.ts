import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cloudBackupMessage,
  GENERIC_FAILURE,
  NO_BACKUP_YET,
  REMOTE_UNCLAIMED,
  SIGN_IN_TO_ICLOUD,
  toCloudAction,
  restoreConfirmDisabled,
  restoreDisclosure,
  type RestoreDisclosure,
} from '@/data/cloudBackupMessages';

/**
 * P6.8.7d.3 [M3-5] — the iCloud sheet's message mapping.
 *
 * ⛔ **This is the only part of that screen anything can test.** The `ready` branch is unreachable on web
 * (the provider is the unavailable stub by construction), which is how a defect this simple — a computed,
 * carefully carried diagnosis dropped at the last layer — survived thirteen lenses and six refuters.
 *
 * ⚠️ Every assertion below is about ORDER, because every branch here returns a plausible string. A test
 * that only checked "it returns something" would pass against the version that discarded the message.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`cloudBackupMessages: ${label}`);
  passed += 1;
}
function eq<T>(actual: T, expected: T, label: string) {
  assert(Object.is(actual, expected), `${label} (got ${String(actual)}, expected ${String(expected)})`);
}

const SPECIFIC = 'That backup was made by a newer version of Debt Planner. Update the app, then try again.';

export default async function run() {
  eq(cloudBackupMessage({ result: 'ok' }, 'Restored from iCloud.'), 'Restored from iCloud.', 'success is the caller’s word');

  // ⛔ THE FINDING. The specific diagnosis wins over the generic line — this is the assertion that fails
  // against the shipped version, where `restoreNow` returned the reason alone and the message died here.
  eq(
    cloudBackupMessage({ result: 'error', message: SPECIFIC }, 'ok'),
    SPECIFIC,
    '⛔ a computed diagnosis is shown INSTEAD of "That didn’t work"',
  );
  assert(
    cloudBackupMessage({ result: 'error', message: SPECIFIC }, 'ok') !== GENERIC_FAILURE,
    'and it is genuinely not the generic sentence',
  );

  // …and the generic line is still there for the failure that really has nothing more to say.
  eq(cloudBackupMessage({ result: 'error' }, 'ok'), GENERIC_FAILURE, 'an error with no diagnosis falls back');

  // ⚠️ `remote-unclaimed` is checked BEFORE the message, because it is not a failure. If a diagnosis ever
  // rides along with it, the B3 wording must still win — anything error-shaped makes the user retry until
  // the guard gives way, which is the exact outcome that guard exists to prevent.
  eq(
    cloudBackupMessage({ result: 'remote-unclaimed', message: SPECIFIC }, 'ok'),
    REMOTE_UNCLAIMED,
    '⛔ the guard’s wording outranks any message — it is a CHOICE, not an error',
  );

  // The two reasons that legitimately have their own copy, and must not be overwritten by a stray message
  // when they have none.
  eq(cloudBackupMessage({ result: 'no-backup' }, 'ok'), NO_BACKUP_YET, 'the honest empty case keeps its own words');
  eq(cloudBackupMessage({ result: 'unavailable' }, 'ok'), SIGN_IN_TO_ICLOUD, 'so does the signed-out case');

  // ⚠️ An empty-string message must NOT be treated as a diagnosis — it would render a blank line where the
  // fallback belongs, and a blank message reads as the app saying nothing at all.
  eq(
    cloudBackupMessage({ result: 'error', message: '' }, 'ok'),
    GENERIC_FAILURE,
    '⛔ an EMPTY message is not a diagnosis — it falls back rather than rendering nothing',
  );

  // ── `toCloudAction` — the constructor that makes "carry the message" not a thing to remember. ──
  //
  // ⛔ M3-5 WAS one hand-written literal dropping one field. These assertions are what a re-introduction
  // now has to get past: rewriting the hook's line as `{ result: result.reason }` is a visible deviation
  // from a covered helper rather than an omission nobody can see.
  {
    const carried = toCloudAction({ reason: 'error', message: SPECIFIC });
    eq(carried.result, 'error', 'the reason becomes the result');
    eq(carried.message, SPECIFIC, '⛔ and the diagnosis comes WITH it');
    eq(cloudBackupMessage(carried, 'ok'), SPECIFIC, 'so the screen shows the specific thing end to end');

    const bare = toCloudAction({ reason: 'no-backup' });
    eq(bare.message, undefined, 'a reason with nothing to add carries no message');
    eq(cloudBackupMessage(bare, 'ok'), NO_BACKUP_YET, 'and falls back to its own copy');
  }

  /**
   * ⛔ **S1.11.5.2 [pass-4 `C4-6`] — THE DISCLOSURE SLOT AND THE COMMIT GATE, WALKED TOGETHER.**
   *
   * ⚡ `C-7b`'s disclosure was RACEABLE: the confirm renders synchronously and the read starts after it, so
   * its first frame drew **nothing** while the button stayed live — byte-identical to the un-fixed state,
   * for a whole network round-trip, on the one screen where a second tap destroys data.
   * ⛔ **The two are asserted as ONE table** because they are one decision: the slot must never be silent,
   * and the confirm must not be committable while it says *"reading"*.
   */
  {
    const STATES: { label: string; previewing: boolean; preview: string | null; kind: RestoreDisclosure['kind']; disabled: boolean }[] = [
      { label: 'the read is in flight', previewing: true, preview: null, kind: 'reading', disabled: true },
      { label: 'a STALE description with a new read in flight', previewing: true, preview: 'This backup has 2 debts…', kind: 'reading', disabled: true },
      { label: 'the read came back', previewing: false, preview: 'This backup has 2 debts…', kind: 'contents', disabled: false },
      { label: 'the read failed', previewing: false, preview: null, kind: 'unreadable', disabled: false },
    ];
    for (const st of STATES) {
      const slot = restoreDisclosure(st.previewing, st.preview);
      eq(slot.kind, st.kind, `⛔ C4-6 · ${st.label} — the slot says which state it is in`);
      assert(slot.text.length > 0, `⛔ C4-6 · ${st.label} — …and it is NEVER silent, which is what shipped`);
      eq(restoreConfirmDisabled(null, st.previewing), st.disabled, `⛔ C4-6 · ${st.label} — the confirm is committable only when the disclosure is known`);
    }
    // ⭐ THE CONTROL THAT KEEPS THE STANDING DECISION. "A slow or unavailable iCloud never blocks a restore
    // the user has asked for" — so the FAILURE path re-enables, and only the in-flight one holds.
    eq(restoreConfirmDisabled(null, false), false, '⭐ C4-6 control — a failed read does not block the restore');
    // ⛔ …and a real restore in progress still blocks it, or this fix would have deleted the old guard.
    eq(restoreConfirmDisabled('restore', false), true, '⛔ C4-6 — `busy` still blocks, which is the guard that was already there');
    // ⛔ The three texts must be DISTINCT, or "reading" and "unreadable" would be one sentence again.
    const texts = new Set(STATES.map((st) => restoreDisclosure(st.previewing, st.preview).text));
    eq(texts.size, 3, '⛔ C4-6 — three states, three sentences; a shared one is how the slot went silent');

    /**
     * ⛔ **A TESTED HELPER IS NOT A USED HELPER.** This whole module exists because `CloudBackupSheet`'s
     * `ready` branch is unreachable to every automated test in the repo — which means a correct table here
     * and a sheet that never consults it would look exactly like a fix. ⚠️ The sheet must pass the LIVE
     * `previewing`, not a constant: `restoreConfirmDisabled(busy, false)` typechecks, reads plausibly, and
     * restores the defect in full.
     */
    const sheet = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'more', 'CloudBackupSheet.tsx'),
      'utf8',
    );
    assert(sheet.includes('restoreDisclosure(previewing, preview)'), '⛔ C4-6 — the sheet asks for the slot with the LIVE flag');
    assert(sheet.includes('restoreConfirmDisabled(busy, previewing)'), '⛔ C4-6 — …and gates the confirm on it, not on a constant');
  }


  /**
   * ⛔ **S1.12.5.8 [pass-5 `B5-11`] — A SIGNED-IN USER WAS TOLD TO SIGN IN, FOREVER.**
   *
   * ⚡ `backupToCloudGuarded` returned `'unavailable'` when the backup file exists and its `mtimeMs`
   * cannot be read — measured with `provider.isAvailable() === true`, i.e. the user IS signed in — and
   * this mapping rendered that as **"Sign in to iCloud on this device to use backup."** There is no
   * action they can take, and every later automatic backup is refused the same way for as long as the
   * mtime stays unreadable, so the sentence repeats forever.
   *
   * ⭐ **Nothing is destroyed** (`writes = 0`), which is the safe direction the guard intends — the
   * defect was the sentence, not the refusal.
   */
  {
    const unreadable = cloudBackupMessage({ result: 'remote-unreadable' }, 'backed up');
    assert(unreadable !== SIGN_IN_TO_ICLOUD, '⛔ B5-11 — an unreadable remote does not tell a signed-in user to sign in');
    assert(!/sign in/i.test(unreadable), '⛔ B5-11 — …and asks for no action they have already taken');
    assert(/safe|isn’t|not replaced|wasn’t/i.test(unreadable), '⛔ B5-11 — …while still saying their data is intact');
    // ⭐ CONTROLS. A mapping that returned the same string for everything satisfies the rows above.
    assert(
      cloudBackupMessage({ result: 'unavailable' }, 'backed up') === SIGN_IN_TO_ICLOUD,
      '⭐ B5-11 control — a genuinely unavailable provider DOES still say sign in',
    );
    assert(
      cloudBackupMessage({ result: 'ok' }, 'backed up') === 'backed up',
      '⭐ B5-11 control — success is untouched',
    );
  }

  console.log(`✅ cloud backup message mapping (M3-5) tests passed (${passed} asserts).`);
}
