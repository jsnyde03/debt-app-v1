import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  attributeDroppedRows,
  countLegacyKeys,
  decodeItemTable,
  decodeWebKitValue,
  isLocalStorageDatabase,
  pickLegacyStore,
} from '@/data/legacyBridge/webkitLocalStorage';

/**
 * 5.1a — the WebKit localStorage decode.
 *
 * ⛔ **Why this is worth a real SQLite file and not a hand-built row array.** This project has measured
 * ten first-cut instruments that were wrong in a way that PASSED, and the recurring shape is a fixture
 * that never renders the state the assertion is about. A row array is my MODEL of what a driver hands
 * back; if the model is wrong, every assert here is green and the bridge still fails on a device — and
 * a device is the one place this cannot cheaply be re-measured. So the round-trip below writes an
 * actual `ItemTable` with actual UTF-16LE BLOBs through `node:sqlite`, reads it back through a driver,
 * and decodes THAT. The pure cases stay too: they pin the corners a fixture cannot reach.
 *
 * What is NOT proven here, stated so nobody reads green as coverage: that these files exist, are
 * findable, and are readable on a real upgraded device. That is 5.1's device probe and nothing on
 * Windows can answer it.
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

/** UTF-16LE, no BOM — what WebKit writes. The encoder the fixture needs; the decoder is under test. */
function utf16leBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    out[i * 2] = code & 0xff;
    out[i * 2 + 1] = code >> 8;
  }
  return out;
}

function utf8Bytes(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text, 'utf8'));
}

// ── The encoding sniff, on the two things WebKit has actually written. ────────────────────────────
eq(decodeWebKitValue(utf16leBytes('{"balance":1200}')), '{"balance":1200}', 'UTF-16LE JSON decodes');
eq(decodeWebKitValue(utf8Bytes('{"balance":1200}')), '{"balance":1200}', 'UTF-8 JSON decodes');
eq(decodeWebKitValue(utf16leBytes('"Visa"')), '"Visa"', 'a UTF-16LE string value decodes');
eq(decodeWebKitValue(utf8Bytes('"Visa"')), '"Visa"', 'a UTF-8 string value decodes');
eq(decodeWebKitValue(utf16leBytes('2')), '2', 'the schemaVersion number, UTF-16LE');
eq(decodeWebKitValue(utf8Bytes('true')), 'true', 'a boolean, UTF-8 — odd length, so no sniff runs');

// ⚠️ The case the NUL heuristic ALONE gets wrong, which is why JSON is the discriminator: a UTF-16LE
// payload of non-Latin text carries no NUL bytes at all, so byte-sniffing would read it as UTF-8.
eq(
  decodeWebKitValue(utf16leBytes('"债务偿还计划"')),
  '"债务偿还计划"',
  'UTF-16LE CJK — zero NUL bytes, and it still decodes right',
);
// …and the mirror: UTF-8 CJK must not be mistaken for UTF-16.
eq(decodeWebKitValue(utf8Bytes('"债务偿还计划"')), '"债务偿还计划"', 'UTF-8 CJK survives the sniff');

// A name with an emoji exercises the surrogate-pair path in the hand-rolled UTF-8 decoder.
eq(decodeWebKitValue(utf8Bytes('"Car loan 🚗"')), '"Car loan 🚗"', 'UTF-8 astral plane (surrogate pair)');

// ── The rows a bridge must refuse rather than guess at. ───────────────────────────────────────────
eq(decodeWebKitValue(null), null, 'a NULL value decodes to null, not to ""');
eq(decodeWebKitValue(42), null, 'a numeric value is not text and is refused');
eq(decodeWebKitValue(new Uint8Array(0)), '', 'an empty BLOB is an empty string, which is a real value');
eq(decodeWebKitValue('already text'), 'already text', 'a driver returning TEXT is passed through');

// A malformed byte yields U+FFFD rather than throwing — one bad byte must not cost the other keys.
assert(
  typeof decodeWebKitValue(new Uint8Array([0xff, 0x22, 0x61, 0x22])) === 'string',
  'a malformed sequence decodes to a string instead of throwing',
);

// ── The table decode drops what it cannot read, and keeps everything else. ────────────────────────
const table = decodeItemTable([
  { key: 'debtPlanner.debts', value: utf16leBytes('[{"id":"d1"}]') },
  { key: 'debtPlanner.schemaVersion', value: utf16leBytes('2') },
  { key: 'unrelated.key', value: utf16leBytes('"other origin"') },
  { key: 'debtPlanner.broken', value: 42 },
  { key: 42, value: utf16leBytes('"keyless"') },
]);
eq(table['debtPlanner.debts'], '[{"id":"d1"}]', 'a real key survives the table decode');
eq(table['debtPlanner.schemaVersion'], '2', 'the schema version survives');
assert(!('debtPlanner.broken' in table), 'an undecodable value is DROPPED, never defaulted');
assert(Object.keys(table).length === 3, 'a non-string key is dropped too — 3 rows survive of 5');
eq(countLegacyKeys(table), 2, 'countLegacyKeys counts only the debtPlanner.* prefix');

// ── Which file is worth opening — both layouts Apple has shipped. ─────────────────────────────────
assert(
  isLocalStorageDatabase('/Library/WebKit/WebsiteData/LocalStorage/capacitor_localhost_0.localstorage'),
  'the older flat layout is a candidate',
);
assert(
  isLocalStorageDatabase('/Library/WebKit/WebsiteData/Default/AbC/dEf/LocalStorage/localstorage.sqlite3'),
  'the newer salted layout is a candidate',
);
assert(!isLocalStorageDatabase('/Library/WebKit/WebsiteData/Default/AbC/dEf/IndexedDB/x.sqlite3'), 'IndexedDB is not');
assert(!isLocalStorageDatabase('/Library/Caches/notes.txt'), 'an unrelated file is not');

// ── Which candidate IS ours — decided on contents, never on path. ─────────────────────────────────
const chosen = pickLegacyStore([
  { path: '/some/other.localstorage', items: { 'sdk.token': 'x', 'sdk.id': 'y' } },
  { path: '/ours/localstorage.sqlite3', items: { 'debtPlanner.debts': '[]', 'debtPlanner.goals': '[]' } },
]);
eq(chosen?.path, '/ours/localstorage.sqlite3', 'the database with debtPlanner keys wins, whatever its path');

const partial = pickLegacyStore([
  { path: '/partial', items: { 'debtPlanner.debts': '[]' } },
  { path: '/complete', items: { 'debtPlanner.debts': '[]', 'debtPlanner.goals': '[]', 'debtPlanner.amount': '0' } },
]);
eq(partial?.path, '/complete', 'a half-written database loses to a complete one');

// ⛔ A fresh install has no legacy store, and that is NOT a read failure. Returning a candidate here
// would make the bridge migrate an empty store over a brand-new user's defaults.
eq(pickLegacyStore([{ path: '/x', items: { 'sdk.token': 'x' } }]), null, 'no debtPlanner keys → null, not a guess');
eq(pickLegacyStore([]), null, 'nothing found → null');

// ── ⭐ THE ROUND-TRIP: a real SQLite file, WebKit's real table shape, through a real driver. ───────
// `node:sqlite` has no @types/node v20 typings, so it is required through a hand-written shape rather
// than a cast to `any` — a wrong shape then fails at the type level instead of at runtime.
interface SqliteStatement {
  all(): unknown[];
  run(...params: unknown[]): unknown;
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => SqliteDatabase };

const dir = mkdtempSync(join(tmpdir(), 'webkit-ls-'));
try {
  const db = new DatabaseSync(join(dir, 'localstorage.sqlite3'));
  // WebKit's schema, as it ships it: key TEXT, value BLOB.
  db.exec('CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB NOT NULL ON CONFLICT FAIL)');
  const insert = db.prepare('INSERT INTO ItemTable (key, value) VALUES (?, ?)');
  const seeded: Record<string, string> = {
    'debtPlanner.schemaVersion': '2',
    'debtPlanner.debts': '[{"id":"d1","name":"Visa","balance":1200}]',
    'debtPlanner.goals': '[]',
    'debtPlanner.darkMode': 'true',
    'debtPlanner.amount': '2400.5',
  };
  for (const [key, value] of Object.entries(seeded)) {
    insert.run(key, utf16leBytes(value));
  }
  // A row from some other origin's SDK, so the pick has something to reject.
  insert.run('sdk.session', utf16leBytes('"abc"'));

  const rows = db.prepare('SELECT key, value FROM ItemTable').all() as { key: unknown; value: unknown }[];
  db.close();

  assert(rows.length === 6, `the driver returned all 6 rows (got ${rows.length})`);
  const decoded = decodeItemTable(rows);
  for (const [key, value] of Object.entries(seeded)) {
    eq(decoded[key], value, `round-trip: ${key}`);
  }
  eq(countLegacyKeys(decoded), 5, 'the round-trip found 5 legacy keys and left the SDK row out of the count');
  eq(
    pickLegacyStore([{ path: 'roundtrip', items: decoded }])?.path,
    'roundtrip',
    'a real WebKit-shaped database is recognised as ours',
  );
  // The parsed value is what the v1.6 app would have read back — the actual contract the bridge owes.
  const debts = JSON.parse(decoded['debtPlanner.debts']) as { name: string }[];
  eq(debts[0].name, 'Visa', 'the decoded blob JSON.parses back to the v1.6 value');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// ── [C-1 · P6.8.9.7.11.4] DROPPED ROWS BELONG TO THE DATABASE THEY WERE DROPPED FROM ──
//
// ⛔ `droppedRows` feeds a USER-FACING line — "N row(s) of your old data could not be read and were not
// carried over" — and it was summed across every candidate database BEFORE `pickLegacyStore` decided
// which one was the user's. The decode counts any undecodable row with no `debtPlanner.*` filter, so an
// upgrader whose WebKit container holds a second app's database was told they had lost data they never
// had. ⚡ Untestable where it lived (`readLegacyStores()` takes no arguments and reads the native
// container), which is why it shipped: every report fixture in the repo hard-codes `droppedRows: 0`.
{
  const decoded = [
    { path: '/ours', dropped: 2 },
    { path: '/someone-else', dropped: 7 },
  ];
  const ours = attributeDroppedRows(decoded, '/ours');
  eq(ours.droppedRows, 2, 'only the PICKED database contributes to the number the user is shown');
  eq(ours.droppedRowsOtherCandidates, 7, "…and another app's undecodable rows are kept as diagnostics");

  // ⚠️ The case that produced the false claim: nothing of ours was found, so nothing of ours was lost.
  const none = attributeDroppedRows(decoded, undefined);
  eq(none.droppedRows, 0, 'no database judged ours → the user is told of NO loss, not of nine rows');
  eq(none.droppedRowsOtherCandidates, 9, '…and all nine are attributed elsewhere');

  // The preserved property: an ordinary single-database container still reports its own real losses.
  eq(
    attributeDroppedRows([{ path: '/only', dropped: 3 }], '/only').droppedRows,
    3,
    'the ordinary one-database upgrade still reports its real losses',
  );
}

console.log(`✅ webkitLocalStorage tests passed (${passed} asserts).`);
