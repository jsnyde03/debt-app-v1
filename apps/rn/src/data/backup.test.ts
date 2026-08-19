import {
  BACKUP_APP_NAME,
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  isBackupEnvelope,
  parseBackup,
  serializeBackup,
} from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';

/**
 * 5.8.1 — the backup FILE envelope.
 *
 * ⛔ **What these assertions are actually defending.** Before 5.8 the importer accepted ANY JSON object —
 * measured: `{}`, a `package.json` and another app's export were all accepted, migrated onto defaults and
 * written over the user's real portfolio. Nothing threw, nothing rendered wrong, and 39 RN e2e specs
 * never noticed because **not one of them imports anything**. The envelope's entire job is to turn that
 * silent guess into a refusal, so every test below is really asking one question: *does this refuse?*
 *
 * ⚠️ Detection of the two OTHER shapes (a raw v1.7 store, a v1.6 backup file) is 5.8.2 and is asserted
 * there. Here, ONLY the envelope is valid — a raw store must be rejected by this layer, because it is
 * 5.8.2's job to route it, not this one's to accept it.
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

const AT = new Date('2026-08-19T12:00:00.000Z');

function storeWithDebt(): DebtStore {
  const store = createDefaultStore();
  return {
    ...store,
    debts: [
      ...store.debts,
      {
        ...(store.debts[0] ?? ({} as DebtStore['debts'][number])),
        id: 'b1',
        name: 'Visa',
        balance: 1200,
        minimumPayment: 35,
      } as DebtStore['debts'][number],
    ],
  };
}

// ── Round trip: what goes in comes back out, unchanged. ───────────────────────────────────────────
{
  const store = storeWithDebt();
  const text = serializeBackup(store, { now: AT });
  const result = parseBackup(text);

  assert(result.ok, 'a serialized store parses back');
  if (result.ok) {
    eq(result.envelope.store, store, 'the store round-trips byte-identically');
    eq(result.envelope.format, BACKUP_FORMAT, 'the format marker is carried');
    eq(result.envelope.formatVersion, BACKUP_FORMAT_VERSION, 'the envelope version is carried');
    eq(result.envelope.app, BACKUP_APP_NAME, 'the app name is carried');
    eq(result.envelope.exportedAt, AT.toISOString(), 'the export timestamp is the injected one');
    eq(result.envelope.storeVersion, CURRENT_STORE_VERSION, 'the store version is lifted onto the envelope');
  }
}

// ── The store is NESTED, never spread. ────────────────────────────────────────────────────────────
// A future store field named `format`/`app`/`storeVersion` would collide with an envelope field if these
// were spread, and the envelope would win — silently, over real user data.
{
  const raw = JSON.parse(serializeBackup(createDefaultStore(), { now: AT })) as Record<string, unknown>;
  assert(typeof raw.store === 'object' && raw.store !== null, 'the store sits under `store`');
  assert(!('debts' in raw), 'store fields do NOT appear at the envelope level');
  assert(!('paycheck' in raw), 'nor does `paycheck` — nothing is spread');
}

// ── ⛔ THE DEFECT THIS EXISTS FOR: foreign JSON objects are REFUSED. ──────────────────────────────
// Each of these was measured as ACCEPTED by the pre-5.8 path, then written over the user's portfolio.
{
  const foreign: [string, unknown][] = [
    ['an empty object', {}],
    ['a package.json', { name: 'some-pkg', version: '1.0.0', dependencies: { react: '^19' } }],
    ["another app's export", { userProfile: { onboardingComplete: true }, assets: [], freedomDate: '2030-01-01' }],
    ['a settings blob', { theme: 'dark', locale: 'en-US' }],
  ];
  for (const [label, value] of foreign) {
    const result = parseBackup(JSON.stringify(value));
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-a-backup', `  …as not-a-backup: ${label}`);
  }
}

// ── A RAW v1.7 store is refused HERE (5.8.2 routes it, this layer must not guess). ────────────────
{
  const result = parseBackup(JSON.stringify(createDefaultStore()));
  assert(!result.ok, 'a bare store carries no marker → refused by the envelope layer');
  if (!result.ok) eq(result.reason, 'not-a-backup', '  …as not-a-backup, for 5.8.2 to route');
}

// ── Non-JSON and non-objects. ────────────────────────────────────────────────────────────────────
{
  for (const [label, text] of [
    ['empty string', ''],
    ['prose', 'here is my backup'],
    ['truncated json', '{"format":"debt-planner-backup"'],
  ] as [string, string][]) {
    const result = parseBackup(text);
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-json', `  …as not-json: ${label}`);
  }
  for (const [label, value] of [
    ['an array', [1, 2, 3]],
    ['a bare string', 'hello'],
    ['a number', 42],
    ['null', null],
  ] as [string, unknown][]) {
    const result = parseBackup(JSON.stringify(value));
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-a-backup', `  …as not-a-backup: ${label}`);
  }
}

// ── ⛔ Forward-incompatibility is REFUSED, not silently downgraded. ───────────────────────────────
// `runMigrations` only moves forward — it merges onto CURRENT defaults, so a future store would be
// stripped of everything this build doesn't know, and the restore would LOOK like it worked.
{
  const newerEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION + 1,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: CURRENT_STORE_VERSION,
    store: createDefaultStore(),
  };
  const result = parseBackup(JSON.stringify(newerEnvelope));
  assert(!result.ok, 'a NEWER envelope version is refused');
  if (!result.ok) {
    eq(result.reason, 'too-new', '  …as too-new');
    assert(result.message.includes('newer version'), '  …and the message says to update the app');
  }
}
{
  const newerStore = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: CURRENT_STORE_VERSION + 1,
    store: { ...createDefaultStore(), storeVersion: CURRENT_STORE_VERSION + 1 },
  };
  const result = parseBackup(JSON.stringify(newerStore));
  assert(!result.ok, 'a current envelope carrying a NEWER store is refused');
  if (!result.ok) eq(result.reason, 'too-new', '  …as too-new');
}
// …and the version cannot be smuggled past by deleting the envelope's copy of it.
{
  const smuggled = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    store: { ...createDefaultStore(), storeVersion: CURRENT_STORE_VERSION + 1 },
  };
  const result = parseBackup(JSON.stringify(smuggled));
  assert(!result.ok, 'deleting the envelope storeVersion does NOT hide a future store');
  if (!result.ok) eq(result.reason, 'too-new', '  …the payload is read as the fallback');
}

// ── Malformed: our format, our version, no usable payload. ────────────────────────────────────────
{
  for (const [label, store] of [
    ['a missing store', undefined],
    ['a null store', null],
    ['an array store', []],
    ['a string store', 'nope'],
  ] as [string, unknown][]) {
    const result = parseBackup(
      JSON.stringify({
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        app: BACKUP_APP_NAME,
        exportedAt: AT.toISOString(),
        storeVersion: CURRENT_STORE_VERSION,
        store,
      }),
    );
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'malformed', `  …as malformed: ${label}`);
  }
}

// ── An OLDER store is accepted — that is what `runMigrations` is for at the import boundary. ──────
{
  const older = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: 1,
    store: { ...createDefaultStore(), storeVersion: 1 },
  };
  const result = parseBackup(JSON.stringify(older));
  assert(result.ok, 'an OLDER store is accepted, not refused');
  if (result.ok) eq(result.envelope.storeVersion, 1, '  …and its version is reported unmigrated');
}

// ── A missing/typeless formatVersion is treated as too-new, not as valid. ────────────────────────
// A file with our marker but no version is not something this build can reason about; guessing "1" would
// be the same accept-anything instinct the whole item exists to remove.
{
  const result = parseBackup(
    JSON.stringify({ format: BACKUP_FORMAT, app: BACKUP_APP_NAME, store: createDefaultStore() }),
  );
  assert(!result.ok, 'no formatVersion → refused');
  if (!result.ok) eq(result.reason, 'too-new', '  …as too-new rather than assumed to be v1');
}

// ── `isBackupEnvelope` is the detection primitive 5.8.2 dispatches on. ───────────────────────────
{
  assert(isBackupEnvelope(JSON.parse(serializeBackup(createDefaultStore(), { now: AT }))), 'detects our own output');
  assert(!isBackupEnvelope(createDefaultStore()), 'a bare store is not an envelope');
  assert(!isBackupEnvelope({}), 'an empty object is not an envelope');
  assert(!isBackupEnvelope(null), 'null is not an envelope');
  assert(!isBackupEnvelope([{ format: BACKUP_FORMAT }]), 'an array is not an envelope');
  assert(!isBackupEnvelope({ format: 'financial-freedom-cloud-backup' }), "another app's marker is not ours");
}

// ── The serialized file is human-inspectable (it is a thing users save and look at). ─────────────
{
  const text = serializeBackup(createDefaultStore(), { now: AT });
  assert(text.includes('\n'), 'pretty-printed, not one line');
  assert(text.indexOf(BACKUP_FORMAT) < 100, 'the marker is near the top, visible on opening the file');
}

console.log(`✅ backup envelope tests passed (${passed} asserts).`);
