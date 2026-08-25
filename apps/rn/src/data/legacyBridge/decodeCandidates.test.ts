import { decodeCandidates, type OpenedCandidate } from '@/data/legacyBridge/decodeCandidates';

/**
 * [P6.8.9.7.11.13.7 · J1-5] — **the call site, not the helper.**
 *
 * ⛔ `attributeDroppedRows` and `pickLegacyStore` were both pure, both covered, and both invoked from a
 * module the test runner cannot load — `readLegacyStores.ts` imports `expo-file-system` and `expo-sqlite`.
 * So the three lines deciding *which number becomes a user-facing claim* ran nowhere off a device, and
 * reverting them to `report.droppedRows += result.dropped` left every suite green. **A tested helper is
 * not a used helper** (`.11.11`), one layer up.
 *
 * ⚠️ The I/O is injected, so these cases drive the real wiring rather than a re-implementation of it —
 * which is what `realContainer.test.ts` has to do, and why it cannot see this.
 */
let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [decodeCandidates: ${label}]`);
  passed++;
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(actual === expected, `${label} — got ${String(actual)}, expected ${String(expected)}`);
}

/** A fake database. `items` present = it decoded; `dropped` = rows that would not. */
const db = (path: string, over: Partial<OpenedCandidate> = {}): OpenedCandidate => ({
  path,
  rows: 10,
  legacyKeys: 0,
  ...over,
});

const readFrom = (results: OpenedCandidate[]) => async (_uri: string, i: number) => results[i];

/** ⚠️ A default export, not top-level `await` — the runner compiles these to CJS. */
export default async function run() {

// ⛔ THE DEFECT, in the shape a real upgrader meets it: our database decodes cleanly, and a SECOND app's
// WebKit database in the same container drops nine rows. Summing tells them they lost data they never had.
{
  const out = await decodeCandidates(
    ['/ours', '/theirs'],
    readFrom([
      db('/ours', { legacyKeys: 7, items: { 'debtPlanner.debts': '[]' }, dropped: 0 }),
      db('/theirs', { legacyKeys: 0, items: { 'someOtherApp.k': 'v' }, dropped: 9 }),
    ]),
  );
  eq(out.store?.path, '/ours', 'the database holding `debtPlanner.*` keys is the one picked');
  eq(out.droppedRows, 0, "⛔ …and the OTHER app's undecodable rows are not reported as the user's loss");
  eq(out.droppedRowsOtherCandidates, 9, '…they are kept as diagnostics, where they are true');
}

// The mirror: the loss is OURS, and it must reach the user's number.
{
  const out = await decodeCandidates(
    ['/ours', '/theirs'],
    readFrom([
      db('/ours', { legacyKeys: 7, items: { 'debtPlanner.debts': '[]' }, dropped: 4 }),
      db('/theirs', { legacyKeys: 0, items: { 'someOtherApp.k': 'v' }, dropped: 9 }),
    ]),
  );
  eq(out.droppedRows, 4, 'a loss in the PICKED database is the user-facing number');
  eq(out.droppedRowsOtherCandidates, 9, '…and the rest stays separate');
}

/**
 * ⛔ **NO PICK REPORTS EVERYTHING, and this is the half that costs data if it goes wrong.** The no-pick
 * case includes the user's own database opening with every row undecodable — `migrateFromLegacy` then
 * reads that as a fresh install, and this counter is the only evidence anything was there.
 */
{
  const out = await decodeCandidates(
    ['/a', '/b'],
    readFrom([
      db('/a', { legacyKeys: 0, items: {}, dropped: 5 }),
      db('/b', { legacyKeys: 0, items: {}, dropped: 3 }),
    ]),
  );
  eq(out.store, null, 'no candidate held a `debtPlanner.*` key');
  eq(out.droppedRows, 8, '⛔ …so EVERYTHING is reported — a zero here reads as a fresh install');
  eq(out.droppedRowsOtherCandidates, 0, '…and nothing is double-counted into the diagnostic');
}

// A database that failed to open is reported with its error and contributes no counts.
{
  const out = await decodeCandidates(
    ['/ours', '/broken'],
    readFrom([
      db('/ours', { legacyKeys: 7, items: { 'debtPlanner.debts': '[]' }, dropped: 1 }),
      db('/broken', { rows: 0, error: 'source vanished' }),
    ]),
  );
  eq(out.opened.length, 2, 'every candidate opened is reported, including the failure');
  eq(out.opened[1].error, 'source vanished', '…carrying WHY, which is what separates "none" from "could not look"');
  eq(out.droppedRows, 1, '…and a database that never decoded adds nothing to the loss count');
}

// Nothing found at all — the fresh-install answer, which must not look like a failure.
{
  const out = await decodeCandidates([], readFrom([]));
  eq(out.store, null, 'no candidates → no store');
  eq(out.droppedRows, 0, '…and no loss to report');
  eq(out.opened.length, 0, '…and nothing claimed to have been opened');
}

  console.log(`✅ decodeCandidates: ${passed} assertions`);
}
