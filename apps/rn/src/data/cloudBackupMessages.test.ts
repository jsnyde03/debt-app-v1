import {
  cloudBackupMessage,
  GENERIC_FAILURE,
  NO_BACKUP_YET,
  REMOTE_UNCLAIMED,
  SIGN_IN_TO_ICLOUD,
  toCloudAction,
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

  console.log(`✅ cloud backup message mapping (M3-5) tests passed (${passed} asserts).`);
}
