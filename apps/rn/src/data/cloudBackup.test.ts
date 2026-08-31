import {
  CLOUD_BACKUP_FORMAT,
  CLOUD_BACKUP_FORMAT_VERSION,
  decodeCloudBackup,
  encodeCloudBackup,
  plaintextCloudCodec,
  type CloudBackupCodec,
} from '@/data/cloudBackup';
import { BACKUP_FORMAT, serializeBackup } from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';

/**
 * P6.3.3.2 — the cloud envelope + codec.
 *
 * ⛔ **What these assertions defend.** The cloud blob is the ONLY backup channel the user never sees: no
 * file to open, no paste to eyeball, no picker to cancel. Every other door has a human in it who notices
 * when something looks wrong. So the questions here are the ones nobody else will ask — *does a foreign
 * file get refused rather than guessed at, does a future codec get an honest message instead of a crash,
 * and does the round trip actually return the same portfolio.*
 *
 * ⚠️ This layer owns the WRAPPER only. Whether the payload is a valid backup is `readBackup`'s judgement
 * and is asserted in `readBackup.test.ts`; the tests below check that the payload is HANDED to it intact,
 * not that it is re-judged here.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`cloudBackup: ${label}`);
  passed += 1;
}
function eq<T>(actual: T, expected: T, label: string) {
  assert(Object.is(actual, expected), `${label} (got ${String(actual)}, expected ${String(expected)})`);
}

const AT = new Date('2026-08-20T15:00:00.000Z');

/**
 * ⚠️ The debt is built from the FULL `Debt` shape, not spread onto `createDefaultStore().debts[0]` —
 * measured, the default store has **zero** debts, so that spread would have been `{}` plus whatever
 * fields this file happened to name. A fixture assembled that way asserts against an invented shape and
 * can pass while the real one fails (`3bf178e`, three invented cutover shapes). Same fields the
 * `celebrationSelectors` fixture uses.
 */
function storeWithADebt(): DebtStore {
  const store = createDefaultStore();
  return {
    ...store,
    debts: [
      {
        id: 'cloud-test-debt',
        name: 'Cloud Card',
        balance: 1234.56,
        minimumPayment: 40,
        apr: 19.99,
        dueDate: '2026-09-01',  // fixture-date-ok: passenger — PLANTED 2020-01-01 across all 11 sites, `test:app` stayed green, so no assertion here reads this date against the clock
        type: 'debt',
        recurrence: 'monthly',
      },
    ],
  };
}

// ── The round trip returns the portfolio, not merely a parseable object. ────────────────────────
{
  const store = storeWithADebt();
  const result = decodeCloudBackup(encodeCloudBackup(store, plaintextCloudCodec, { now: AT }));
  assert(result.ok, 'a blob this build wrote decodes');
  if (result.ok) {
    eq(result.store.debts.length, 1, 'the debt survives the round trip');
    eq(result.store.debts[0]?.name, 'Cloud Card', 'and it is the SAME debt, not a default');
    eq(result.store.debts[0]?.balance, 1234.56, 'with its balance intact to the cent');
    eq(result.store.storeVersion, CURRENT_STORE_VERSION, 'and it arrives MIGRATED, ready to commit');
    eq(result.kind, 'envelope', 'the inner payload is read as the 5.8.1 envelope');
  }
}

// ── The wrapper is a wrapper: the payload is the EXISTING backup file, byte for byte. ───────────
{
  const store = storeWithADebt();
  const raw = JSON.parse(encodeCloudBackup(store, plaintextCloudCodec, { now: AT })) as Record<string, unknown>;
  eq(raw.cloudFormat, CLOUD_BACKUP_FORMAT, 'the cloud marker is present');
  eq(raw.cloudFormatVersion, CLOUD_BACKUP_FORMAT_VERSION, 'and versioned separately from the payload');
  eq(raw.codec, 'plaintext', 'the codec id is persisted, so a future codec can be dispatched to');
  // ⛔ The point of the whole design: iCloud carries the SAME bytes the file door writes. If these two
  // ever diverge, the cloud channel has quietly become a second format with its own bugs.
  eq(raw.payload, serializeBackup(store, { now: AT }), 'the payload IS `serializeBackup`, unmodified');
  assert(String(raw.payload).includes(BACKUP_FORMAT), "and it still carries the file format's own marker");
}

// ── Refusals. Every one of these leaves local data untouched by returning, never throwing. ──────
{
  const refusals: [string, string][] = [
    ['not json at all', 'not a cloud backup'],
    ['"a bare string"', 'a JSON string is not an envelope'],
    ['[]', 'an array is not an envelope'],
    ['null', 'null is not an envelope'],
    ['{}', 'an empty object carries no marker'],
    [JSON.stringify({ cloudFormat: CLOUD_BACKUP_FORMAT, cloudFormatVersion: 1, codec: 'plaintext' }), 'a missing payload is refused'],
    [JSON.stringify({ cloudFormat: CLOUD_BACKUP_FORMAT, cloudFormatVersion: 1, payload: '{}' }), 'a missing codec id is refused'],
  ];
  for (const [raw, label] of refusals) {
    const result = decodeCloudBackup(raw);
    assert(!result.ok, label);
    if (!result.ok) assert(result.message.length > 0, `${label} — and it says something a human can read`);
  }
}

// ── A FOREIGN cloud blob is refused BY THE MARKER, with a payload that would otherwise be valid. ─
//
// ⛔ Found by planting: the first version of this used `payload: '{}'`, so `readBackup` refused it and the
// assertion passed with the marker check DELETED — a fixture whose valid answer equalled the bug's answer,
// the exact trap `CLAUDE.md` records. The payload below is a real, readable Debt backup, so the ONLY thing
// left that can refuse this blob is `cloudFormat`. Freedom's marker is used deliberately: it is the app
// most likely to have written a file into a container on the same device.
{
  const valid = serializeBackup(createDefaultStore(), { now: AT });
  const foreign = decodeCloudBackup(
    JSON.stringify({
      cloudFormat: 'financial-freedom-cloud-backup',
      cloudFormatVersion: 1,
      codec: 'plaintext',
      payload: valid,
    }),
  );
  assert(!foreign.ok, "another app's cloud blob is refused even when its payload IS a valid Debt backup");
}

// ── A blob from a FUTURE build says "update", not "corrupt". Two ways it can be from the future. ─
{
  const store = createDefaultStore();
  const payload = serializeBackup(store, { now: AT });

  const newerWrapper = decodeCloudBackup(
    JSON.stringify({
      cloudFormat: CLOUD_BACKUP_FORMAT,
      cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION + 1,
      codec: 'plaintext',
      payload,
    }),
  );
  assert(!newerWrapper.ok, 'a newer cloud envelope is refused');
  if (!newerWrapper.ok) eq(newerWrapper.reason, 'too-new', 'and the reason is "too-new", not "malformed"');

  const unknownCodec = decodeCloudBackup(
    JSON.stringify({
      cloudFormat: CLOUD_BACKUP_FORMAT,
      cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION,
      codec: 'passphrase-aes-gcm',
      payload,
    }),
  );
  assert(!unknownCodec.ok, 'an unknown codec is refused rather than crashed on');
  if (!unknownCodec.ok) eq(unknownCodec.reason, 'too-new', 'and it too reads as "from a newer build"');

  // ── P6.8.7d.3 [M3-5] — the message must name the FIX, not only the cause. ───────────────────────
  //
  // ⛔ This is the mechanism correction the refutation produced. The slice said the actual fix — update
  // the app — "was computed, carried two layers, and discarded one layer short of the screen." Measured:
  // on the CLOUD path it was never computed. `NO_CODEC` stopped one clause short of `backup.ts`'s
  // `TOO_NEW`, so simply carrying the message would have satisfied the finding's wording and still left
  // the user with an explanation and nothing to do.
  if (!newerWrapper.ok) {
    assert(/update the app/i.test(newerWrapper.message), '⛔ a too-new envelope tells the user to UPDATE');
  }
  if (!unknownCodec.ok) {
    assert(/update the app/i.test(unknownCodec.message), '⛔ so does an unknown codec — same cause, same fix');
  }

  // ⚠️ And a payload we CAN identify but cannot decode is damaged, not new. It shared the "newer version"
  // message, which told a user with a corrupted iCloud file to update an app that was already current.
  const exploding: CloudBackupCodec = {
    id: 'plaintext',
    encodePayload: (s) => s,
    decodePayload() {
      throw new Error('payload is not decodable');
    },
  };
  const damaged = decodeCloudBackup(
    JSON.stringify({
      cloudFormat: CLOUD_BACKUP_FORMAT,
      cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION,
      codec: 'plaintext',
      payload,
    }),
    [exploding],
  );
  assert(!damaged.ok, 'a payload that will not decode is refused');
  if (!damaged.ok) {
    eq(damaged.reason, 'unreadable', 'as "unreadable" — the codec was found, the bytes were not readable');
    assert(/damaged/i.test(damaged.message), 'and the message says DAMAGED');
    assert(
      !/update the app/i.test(damaged.message),
      '⛔ and does NOT tell them to update — they are already current, and the advice would waste the one action they have',
    );
  }
}

// ── The codec seam actually dispatches — proved with a codec that is NOT the identity. ──────────
//
// ⛔ A `plaintext`-only test cannot tell dispatch from doing nothing: encode and decode are both the
// identity, so a `decodeCloudBackup` that ignored the codec entirely would pass every assertion above.
// This is the assertion that would fail if the seam were decorative.
{
  const reverse = (s: string) => [...s].reverse().join('');
  const reverseCodec: CloudBackupCodec = {
    id: 'test-reverse',
    encodePayload: reverse,
    decodePayload: reverse,
  };
  const store = storeWithADebt();
  const blob = encodeCloudBackup(store, reverseCodec, { now: AT });

  const wire = JSON.parse(blob) as Record<string, unknown>;
  eq(wire.codec, 'test-reverse', 'the id written is the codec that encoded it');
  assert(!String(wire.payload).includes(BACKUP_FORMAT), 'the payload really was transformed, not passed through');

  // The build does not know this codec — so by default it must refuse rather than return garbage.
  const withoutIt = decodeCloudBackup(blob);
  assert(!withoutIt.ok, 'a codec this build does not register is refused');

  const withIt = decodeCloudBackup(blob, [plaintextCloudCodec, reverseCodec]);
  assert(withIt.ok, 'and it decodes once the codec is registered');
  if (withIt.ok) eq(withIt.store.debts[0]?.name, 'Cloud Card', 'through the codec, the portfolio is intact');
}

// ── A codec that THROWS is a refusal, not a crash. ──────────────────────────────────────────────
//
// ⚠️ This is the shape a real passphrase codec fails in: wrong key → the decrypt throws. The user has one
// bad blob; they must not have a dead app.
{
  const exploding: CloudBackupCodec = {
    id: 'test-explodes',
    encodePayload: (s) => s,
    decodePayload: () => {
      throw new Error('bad key');
    },
  };
  const blob = JSON.stringify({
    cloudFormat: CLOUD_BACKUP_FORMAT,
    cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION,
    codec: 'test-explodes',
    payload: 'whatever',
  });
  const result = decodeCloudBackup(blob, [exploding]);
  assert(!result.ok, 'a throwing codec yields a refusal');
}

// ── A cloud blob whose PAYLOAD is junk fails on the payload's own terms. ────────────────────────
//
// ⚠️ The wrapper is valid here, so this proves the payload reaches `readBackup` rather than being
// second-guessed by this layer — the failure must be `readBackup`'s verdict, not a cloud-shaped one.
{
  const result = decodeCloudBackup(
    JSON.stringify({
      cloudFormat: CLOUD_BACKUP_FORMAT,
      cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION,
      codec: 'plaintext',
      payload: JSON.stringify({ hello: 'world' }),
    }),
  );
  assert(!result.ok, 'a valid wrapper around a non-backup is refused');
  if (!result.ok) eq(result.reason, 'unrecognised', "and the verdict is readBackup's, not this layer's");
}

console.log(`✅ cloud backup envelope + codec tests passed (${passed} asserts).`);
