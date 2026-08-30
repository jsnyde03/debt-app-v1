import { readFileSync } from 'node:fs';
import { generateV16Cases, type Case } from '@/data/migrationAudit/corpus';
import { importDoor, webkitDoor } from '@/data/migrationAudit/doors';
import { REPAIRABLE_MONEY_FIELDS } from '@/data/migrations';
import { GOAL_MONEY_FIELDS, INVARIANTS, MONEY_FIELDS, checkAll, priorityGoalIsCapped, type DoorOutcome } from '@/data/migrationAudit/invariants';
import { createDefaultStore } from '@/data/defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';

/**
 * 5.10 — the adversarial migration audit.
 *
 * ⛔ **NARROWED (🎯 2026-08-19) to one question: can the migration lose or corrupt data?** Boundary money
 * values, leap-year/timezone arithmetic and huge portfolios are Phase 6's money lens; the broad gap sweep
 * is Phase 6's FINISH sweep — *gaps get caught at the freeze, when the thing being audited is the thing
 * that ships.*
 *
 * ⚡ **Invariants over a GENERATED corpus.** Authoring an expected output per case costs tokens linear in
 * the corpus and is wrong about as often as the code, since both come from the same understanding. Seven
 * properties × N cases keeps the cost fixed while the coverage stops depending on what anyone thought to
 * write down.
 *
 * Findings are grouped by ROOT CAUSE — invariant × damaged field — not merely by invariant. Run 1 reported
 * "128 × money-keeps-its-type", which is a number, not a finding: it could be one cause or forty, and
 * there is no way to tell from a count. Grouping by cause is what makes the report actionable without
 * reading every case.
 */

let checked = 0;
type Row = { invariant: string; cause: string; example: string };
const rows: Row[] = [];

function record(caseId: string, target: string, outcome: DoorOutcome) {
  checked++;
  for (const violation of checkAll(outcome)) {
    rows.push({ invariant: violation.invariant, cause: `${outcome.door} · ${target}`, example: `${caseId} → ${violation.detail}` });
  }
}

const cases: Case[] = generateV16Cases();
if (cases.length < 100) throw new Error(`FAIL [the generator produced only ${cases.length} cases — it is not generating]`);

/**
 * ⛔ **AND THAT `run()` STILL CALLS `selfCheck()` — MODULE SCOPE, BECAUSE THE CHECK CANNOT LIVE INSIDE
 * THE THING WHOSE CALL IT VERIFIES.** [S1.10.6.5.7]
 *
 * ⚡ **Measured: delete `selfCheck();` from `run()` and NOTHING notices** — not the suite, not `typecheck`,
 * not `lint:rn`. The 542-case, two-door audit then runs with no proof it can fail at all, and its output
 * is identical minus one reassuring line. That is the exact shape `selfCheck` exists to refuse, one level
 * up: **a harness that cannot be shown to detect anything.**
 *
 * ⚠️ **`selfCheck` already reads its own source to prove `run()` calls `verdict(...)`, and its docblock
 * names the residual it could not cover — its own call.** It could not, because a check inside a function
 * nobody calls never runs. So the same idiom moves out here, where import alone is enough to fire it.
 *
 * ⚠️ Residual, named as that block names its own: this assertion can be deleted too. It is a deliberate
 * edit to a block that says what it is for, not a one-line deletion nobody would notice.
 */
const auditSource = readFileSync(__filename, 'utf8');
if (!/\n\s*selfCheck\(\);/.test(auditSource)) {
  throw new Error(
    'FAIL [audit: run() no longer calls selfCheck() — the migration audit runs with no proof it can detect anything]',
  );
}

export default async function run() {
  // ⛔ FIRST, and deliberately: prove this harness can fail before trusting it to say nothing is wrong.
  selfCheck();

  const drift: string[] = [];
  let bothProduced = 0;

  for (const testCase of cases) {
    const viaFile = importDoor(testCase.value);
    const viaKeys = await webkitDoor(testCase.value);
    record(`import/${testCase.id}`, testCase.target, viaFile);
    record(`webkit/${testCase.id}`, testCase.target, viaKeys);

    // ── 5.10.3 — the DIFFERENTIAL oracle, and it needs no expected values of its own. Two doors, one
    // dataset: whatever the right answer is, both must give it, so any disagreement is a defect in one
    // of them regardless of which.
    if (viaFile.store && viaKeys.store) {
      bothProduced++;
      if (JSON.stringify(viaFile.store) !== JSON.stringify(viaKeys.store)) drift.push(testCase.id);
    }
  }

  console.log(`\n  migration audit — ${cases.length} cases × 2 doors, ${checked} outcomes, ${INVARIANTS.length} invariants each`);
  console.log(`  differential — ${bothProduced} cases produced a store through BOTH doors, ${drift.length} disagreed`);

  // ⚠️ The healthy control must survive. A corpus that refuses EVERYTHING satisfies every invariant
  // vacuously — the shape where a suite is green because it tested nothing.
  const control = cases.find((c) => c.id === 'control:healthy')!;
  const controlFile = importDoor(control.value);
  const controlKeys = await webkitDoor(control.value);
  if (!controlFile.store) throw new Error('FAIL [the healthy control was REFUSED by the import door — the corpus is vacuous]');
  if (!controlKeys.store) throw new Error('FAIL [the healthy control did not migrate through the WebKit door]');
  if (controlFile.store.paycheck.amount !== '2100') throw new Error('FAIL [the healthy control lost its income]');
  console.log('  ✓ the healthy control survives both doors with its income intact');

  const byCause = new Map<string, { count: number; example: string }>();
  for (const row of rows) {
    const key = `${row.invariant}  ←  ${row.cause}`;
    const hit = byCause.get(key);
    if (hit) hit.count++;
    else byCause.set(key, { count: 1, example: row.example });
  }

  if (byCause.size > 0) {
    console.log(`\n  ⛔ ${rows.length} violation(s) in ${byCause.size} ROOT CAUSE(S):`);
    for (const [key, { count, example }] of [...byCause].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    ${String(count).padStart(4)} × ${key}`);
      console.log(`           e.g. ${example}`);
    }
  }
  if (drift.length) console.log(`\n  ⛔ differential drift: ${drift.slice(0, 6).join(', ')}`);

  console.log(`\n  ${rows.length === 0 && drift.length === 0 ? '✅' : '⛔'} migration audit complete.\n`);

  /**
   * ⛔ **IT PRINTED `⛔` AND RETURNED CLEANLY, so a real corruption never failed anything.**
   * [P6.8.9.7.11.12 · B-J2-3] This is the adversarial corpus that exists to prove a restore cannot corrupt
   * the user's money, and its verdict reached a console and stopped there — while `hostile.test.ts`, which
   * runs **the same invariants over the same doors**, throws. Two harnesses, one judgement, opposite
   * consequences, and only the quieter one covered the generated corpus.
   *
   * ⚠️ **Measured clean before this was armed** — 522 cases × 2 doors, zero violations and zero drift — so
   * it is not being switched on over a known failure.
   */
  verdict(rows, drift, byCause.size);
}

/**
 * ⛔ **THE VERDICT, EXTRACTED SO IT CAN BE PINNED.** [P6.8.9.7.11.18 · S0.4 · M13]
 *
 * ⚠️ **Being armed was not the same as being guarded.** `.11.12` turned this suite from report-only into
 * a throwing one, and `.11.17` then measured that **deleting the throw returned it to report-only with
 * the entire repo green** — every suite, every gate, every CI run. The invariants are shared with
 * `hostile.test.ts`, which throws independently, so a plant in `invariants.ts` reds over *there* and says
 * nothing about this file; and `runAppTests.ts` would notice the *export* vanishing, not the *throw*.
 *
 * ⚡ **`tested-helper-is-not-a-used-helper`, one level up:** the judgement existed, was correct, and its
 * CONSEQUENCE was the unguarded part.
 */
export function verdict(rows: Row[], drift: string[], causes: number): void {
  if (rows.length > 0 || drift.length > 0) {
    throw new Error(
      `FAIL [migration audit: ${rows.length} invariant violation(s) in ${causes} root cause(s)` +
        `${drift.length ? `, ${drift.length} differential drift` : ''} — see the breakdown above]`,
    );
  }
}

/**
 * ⛔ **CAN THIS HARNESS FAIL AT ALL?** The mirror of the healthy control above, and the half that was
 * missing. That one proves the corpus is not vacuous — *something survives*. This proves the verdict is
 * not vacuous — *something is caught*. **A suite needs both, and only ever had the first.**
 *
 * Two independent links, because they break independently:
 *   ① the invariants still FIRE on a deliberately corrupt outcome, and
 *   ② the verdict still THROWS when they do.
 *
 * ⚠️ Deleting the throw at `verdict` now reds link ②. Deleting this block is no longer *"four lines"* —
 * it is removing a guard that says in its own name what it is for.
 */
/**
 * ⛔ **ONE POISON PER INVARIANT — because the original self-check covered ONE OF NINE.** [S0.13 · GAP-2]
 *
 * ⚡ `selfCheck`'s poisoned outcome carries `store: null`, and **eight of the nine invariants return early
 * on a null store**, so the line it printed — *"the invariants fire (1 on a poisoned outcome)"* — was
 * literally true and covered 1/9. The other eight could be **deleted, inverted or broken with this suite
 * green**, and `INVARIANTS.length` was printed in two places and asserted nowhere, so removing one from
 * the array was silent too.
 *
 * ⚠️ **KEYED OFF `INVARIANTS` ITSELF, IN BOTH DIRECTIONS, and that is what stops the list decaying:**
 * every invariant in the array must have a poison here *(add one without a poison and this reds)*, and
 * every poison must name an invariant that still exists *(rename or delete one and this reds)*. A list
 * checked in one direction only is how every enumeration in this cluster went short.
 *
 * ⛔ **Each poison is checked against ITS OWN invariant function, never through `checkAll`** — `checkAll`
 * returning *something* proves only that **some** invariant fired, which is the vacuity this exists to
 * rule out. That is the same reasoning the `priorityGoalIsCapped` block below already applies to itself.
 */
function poisonedStore(patch: Partial<DebtStore> = {}): DebtStore {
  return { ...createDefaultStore(), ...patch };
}

const CLEAN_STORE = poisonedStore();

/** A base outcome that fires NOTHING — so a poison's own field is the only variable. */
const cleanOutcome = (): DoorOutcome => ({
  door: 'self-check',
  input: {},
  inputBefore: '{}',
  inputAfter: '{}',
  store: CLEAN_STORE,
  refused: false,
  threw: null,
  second: CLEAN_STORE,
});

const POISONS: { invariant: string; why: string; outcome: DoorOutcome }[] = [
  {
    invariant: 'neverThrows',
    why: 'a door that threw',
    outcome: { ...cleanOutcome(), threw: new Error('deliberate') },
  },
  {
    invariant: 'nothingSilentlyDropped',
    why: 'source keys unaccounted for',
    outcome: {
      ...cleanOutcome(),
      accounting: { mapped: [], dropped: [], unknown: [], unparseable: [], total: 3 },
    },
  },
  {
    invariant: 'moneyKeepsItsType',
    why: 'a debt balance arriving as a string',
    outcome: {
      ...cleanOutcome(),
      store: poisonedStore({ debts: [{ id: 'd0', name: 'X', balance: 'nope' } as never] }),
    },
  },
  {
    // ⛔ GAP-3, folded in here rather than tracked apart: `GOAL_MONEY_FIELDS` and the goals `check(...)`
    // call catch nothing on the live corpus, so deleting the field list is silent — and both real
    // goal-money defects lived behind exactly that list.
    invariant: 'moneyKeepsItsType',
    why: 'GAP-3 — a GOAL targetAmount arriving as a string, the field list nothing on the corpus reaches',
    outcome: {
      ...cleanOutcome(),
      store: poisonedStore({ goals: [{ id: 'g0', name: 'G', targetAmount: 'nope' } as never] }),
    },
  },
  {
    invariant: 'alwaysCurrentVersion',
    why: 'a store left on an older version',
    outcome: { ...cleanOutcome(), store: poisonedStore({ storeVersion: CURRENT_STORE_VERSION - 1 }) },
  },
  {
    invariant: 'sourceNotMutated',
    why: 'the input changed across the call',
    outcome: { ...cleanOutcome(), inputAfter: '{"mutated":true}' },
  },
  {
    invariant: 'refusalIsTotal',
    why: 'a door that refused and produced a store anyway',
    outcome: { ...cleanOutcome(), refused: true },
  },
  {
    invariant: 'idempotent',
    why: 'a second pass that changed the data',
    outcome: { ...cleanOutcome(), second: poisonedStore({ payoffStrategy: 'avalanche' }) },
  },
  {
    invariant: 'repairsAreNotRepeated',
    why: 'repairs re-reported on a clean second pass',
    outcome: {
      ...cleanOutcome(),
      second: poisonedStore({
        dataRepairs: [{ entity: 'debt', id: 'd0', name: 'X', field: 'balance', kind: 'lost' }],
      }),
    },
  },
  {
    invariant: 'priorityGoalIsCapped',
    why: 'a priority goal whose pace reads as uncapped',
    outcome: {
      ...cleanOutcome(),
      store: poisonedStore({
        goals: [
          { id: 'g0', priority: false } as never,
          { id: 'g1', priority: true, priorityPerPaycheck: 'not-a-number' } as never,
        ],
      }),
    },
  },
];

function checkEveryInvariantFires(): number {
  const byName = new Map(INVARIANTS.map((f) => [f.name, f]));

  // ⛔ A downward-only floor, so removing an invariant from the array is not silent.
  if (INVARIANTS.length < 9) {
    throw new Error(
      `FAIL [self-check: INVARIANTS holds ${INVARIANTS.length}, floor is 9 — one was removed]`,
    );
  }

  // Direction 1 — every poison names an invariant that still exists, and that invariant FIRES on it.
  for (const { invariant, why, outcome } of POISONS) {
    const fn = byName.get(invariant);
    if (!fn) {
      throw new Error(
        `FAIL [self-check: no invariant named ${invariant} — it was renamed or deleted, and its poison now checks nothing]`,
      );
    }
    if (fn(outcome) === null) {
      throw new Error(
        `FAIL [self-check: ${invariant} did NOT fire on ${why} — it can be deleted, inverted or broken with this suite green]`,
      );
    }
    // ⚠️ The clean base must fire nothing, or a poison proves only that SOMETHING is wrong with it.
    if (fn(cleanOutcome()) !== null) {
      throw new Error(
        `FAIL [self-check: ${invariant} fires on the CLEAN control — its poison proves nothing]`,
      );
    }
  }

  // Direction 2 — every invariant has a poison. A new one landing unpoisoned is the short enumeration.
  const poisoned = new Set(POISONS.map((x) => x.invariant));
  const unpoisoned = [...byName.keys()].filter((n) => !poisoned.has(n));
  if (unpoisoned.length > 0) {
    throw new Error(
      `FAIL [self-check: ${unpoisoned.join(', ')} is in INVARIANTS with no poison here — nothing proves it can fire]`,
    );
  }
  return POISONS.length;
}

export function selfCheck(): void {
  const poisoned: DoorOutcome = {
    door: 'self-check',
    input: {},
    inputBefore: '{}',
    inputAfter: '{}',
    store: null,
    refused: false,
    threw: new Error('deliberate: the self-check poisons invariant ①'),
  };
  const perInvariant = checkEveryInvariantFires();
  const fired = checkAll(poisoned);
  if (fired.length === 0) {
    throw new Error('FAIL [self-check: the invariants did not fire on a deliberately corrupt outcome — this harness cannot detect anything]');
  }

  let threw = false;
  try {
    verdict([{ invariant: 'self-check', cause: 'self-check', example: 'deliberate' }], [], 1);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error('FAIL [self-check: verdict() did not throw on a violation — the migration audit is REPORT-ONLY again]');
  }

  let threwOnDrift = false;
  try {
    verdict([], ['self-check-drift'], 0);
  } catch {
    threwOnDrift = true;
  }
  if (!threwOnDrift) {
    throw new Error('FAIL [self-check: verdict() ignored differential drift — the two-door oracle is unguarded]');
  }

  /**
   * ⛔ **INVARIANT ⑨'S REACHABILITY FLOOR.** [S0.13 · GAP-1 — pass 4's guard inventory, and it rated this
   * the highest-value gap on the surface *because it is the only one that reaches a user's money*.]
   *
   * ⚡ **The defect it guards against has already happened once.** [S0.6b · REVERIFY-1 finding 6] invariant
   * ⑨ could not fire on any of 554 cases: `damageNested` always damages `goals[0]`, and `goals[0]` is the
   * emergency fund the stand-down deliberately exempts — so every damaged pace landed on the one goal
   * whose pace does not govern. **⑨ could be deleted, inverted or broken with the whole repo green.**
   *
   * ⚠️ **The fix was a ten-line loop in `corpus.ts` (`goals[1].priorityPerPaycheck`), and NOTHING GUARDED
   * IT.** Pass 4 measured exactly that: delete those ten lines and the original defect returns, silently,
   * with the suite passing. **A fix with no guard is not closed** — [D67].
   *
   * **Two links, because they break independently:**
   *   ① the CORPUS still produces a case that damages the pace on a **governing** goal, and
   *   ② invariant ⑨ still FIRES on such a case rather than being deleted or inverted.
   *
   * ⚠️ ② is checked directly against `priorityGoalIsCapped` rather than through `checkAll`, because
   * `checkAll` returning *something* proves only that **some** invariant fired — which is precisely the
   * vacuity link ① exists to rule out, one level down.
   */
  const paceCases = generateV16Cases().filter((c) => c.target === 'goals[1].priorityPerPaycheck');
  if (paceCases.length === 0) {
    throw new Error(
      'FAIL [self-check: the corpus damages no pace on a GOVERNING goal — invariant ⑨ is unreachable, ' +
        'so it could be deleted or inverted with this suite green. Restore the goals[1] loop in corpus.ts]',
    );
  }

  const uncapped: DoorOutcome = {
    door: 'self-check',
    input: {},
    inputBefore: '{}',
    inputAfter: '{}',
    store: {
      // ⚠️ `priority`, not `isPriority`, and the pace must be PRESENT-but-non-positive: ⑨ returns early
      // on `undefined`/`null` because the stand-down deletes the field on both its branches. A fixture
      // that misses either detail passes ⑨ while looking like a poison — checked by reading
      // `invariants.ts:214-229`, after a first guess at the shape did not fire.
      goals: [
        { id: 'g0', priority: false },
        { id: 'g1', priority: true, priorityPerPaycheck: 'not-a-number' },
      ],
    } as unknown as DoorOutcome['store'],
    refused: false,
    threw: null,
  };
  if (priorityGoalIsCapped(uncapped) === null) {
    throw new Error(
      'FAIL [self-check: invariant ⑨ did not fire on a priority goal whose pace reads as UNCAPPED — ' +
        'the branch that decides how fast a user pays a debt is unguarded]',
    );
  }

  /**
   * ⛔ **…AND THAT THE VERDICT IS STILL CALLED.** [S0.4b · REVERIFY-1 finding 5]
   *
   * ⚠️ **S0.4 proved `verdict()` throws and stopped there, which moved the disarm from four lines to
   * ONE** — delete the `verdict(...)` call in `run()` and the audit is report-only again, now with a
   * *reassuring* self-check line printed first. **A guard that verifies the guard and not its use is the
   * `tested-helper-is-not-a-used-helper` shape reproduced by the fix for that shape.**
   *
   * ⚡ Reading its own source is unusual and it is the only thing here that can see a missing CALL: the
   * call has no return value, no observable effect on a clean run, and the runner cannot tell the
   * difference. ⚠️ **Residual, named:** someone can delete this assertion too — but that is now a
   * deliberate edit to a block that says what it is for, not a one-line deletion nobody would notice.
   */
  const selfSource = readFileSync(__filename, 'utf8');
  if (!/\n\s*verdict\(rows, drift, byCause\.size\);/.test(selfSource)) {
    throw new Error(
      'FAIL [self-check: run() no longer calls verdict(rows, drift, byCause.size) — the migration audit computes a verdict and discards it]',
    );
  }

  console.log(
    `  ✓ self-check: all ${INVARIANTS.length} invariants fire (${perInvariant} poisons, one per invariant), ` +
      `the verdict throws, and run() still calls it`,
  );
}

/**
 * ⛔ **S1.12.5.4 [pass-5 `B5-12`] — INVARIANT ③'s FIELD LISTS MUST AGREE WITH THE DECLARED INVENTORY.**
 *
 * ⚡ `invariants.ts` checked `balance`, `minimumPayment` and `apr` on a debt while
 * `REPAIRABLE_MONEY_FIELDS.debt` declares five — `originalBalance` and `scheduledPaymentAmount` were
 * outside the instrument built to prove *"a restore cannot corrupt the user's money."*
 *
 * ⛔ **The same omission had already happened in this file and been repaired BY HAND.** Its own docblock
 * records goals being invisible to this invariant — *"the field names it looked for are none of the ones a
 * goal carries"* — and the goal list was then written out correctly while the debt list stayed short.
 * Nothing tied either to the inventory, so the fix did not generalise: it was a list, not a relationship.
 *
 * ⚠️ **This ASSERTS AGREEMENT rather than sharing a constant, deliberately.** A checker derived from the
 * list it checks agrees with whatever it is handed — `D4-4`'s class, and rule 4 of this round's brief.
 * Two independently written lists that must match is a claim; one list read twice is not.
 */
{
  const declared = REPAIRABLE_MONEY_FIELDS;
  const missing = (entity: keyof typeof declared, checked: readonly string[]) =>
    [...declared[entity].required, ...declared[entity].optional].filter((f) => !checked.includes(f));

  // ⚠️ This file throws directly rather than using a helper — matching its own idiom, not importing one.
  const mustCover = (entity: keyof typeof declared, checked: readonly string[], label: string) => {
    const gap = missing(entity, checked);
    if (gap.length) throw new Error(`FAIL [⛔ B5-12 — ${label}]: invariant ③ never checks ${gap.join(', ')}`);
  };
  mustCover('debt', MONEY_FIELDS, 'every money field a DEBT declares is checked');
  mustCover('goal', GOAL_MONEY_FIELDS, '…and every one a GOAL declares');
  mustCover('requiredExpense', MONEY_FIELDS, '…and every one a requiredExpense declares');
  mustCover('livingExpense', MONEY_FIELDS, '…and every one a livingExpense declares');

  // ⭐ THE CONTROL. A `MONEY_FIELDS` listing every string anyone could think of satisfies every row above;
  // this is what makes the agreement mutual rather than one-sided, and it is why the two lists are written
  // independently instead of one being derived from the other.
  const declaredAnywhere = new Set<string>(
    Object.values(declared).flatMap((e) => [...e.required, ...e.optional] as string[]),
  );
  const stray = [...MONEY_FIELDS, ...GOAL_MONEY_FIELDS].filter((f) => !declaredAnywhere.has(f));
  if (stray.length) {
    throw new Error(`FAIL [⭐ B5-12 control — invariant ③ checks nothing the inventory does not declare]: ${stray.join(', ')}`);
  }
  console.log('  ✓ ⛔ B5-12 — invariant ③ and REPAIRABLE_MONEY_FIELDS agree, in both directions');
}
