import { CURRENT_STORE_VERSION, type DebtStore } from '../models';

/**
 * 5.10.2 — the invariants.
 *
 * ⛔ **This file is why the audit can be exhaustive without being expensive.** The alternative — authoring
 * an expected output per case — costs tokens linear in the corpus AND is wrong about as often as the code
 * is, because both come from the same understanding. These are properties that must hold for EVERY input
 * regardless of what it contains, so the cost is fixed at the number of properties while coverage grows
 * with the corpus.
 *
 * ⚠️ Each returns a VIOLATION or null rather than throwing. A corpus of thousands has to run to completion
 * and be reported by class; a throw would stop at the first case and tell us nothing about the shape of
 * the failure.
 */

export interface Violation {
  invariant: string;
  detail: string;
}

export type Invariant = (outcome: DoorOutcome) => Violation | null;

/** What every door hands back, normalised — so one invariant set covers all four. */
export interface DoorOutcome {
  door: string;
  /** The input as handed in, deep-frozen by the runner so a mutation throws where it happens. */
  input: unknown;
  /** A serialized snapshot of the input taken BEFORE the call — the mutation oracle. */
  inputBefore: string;
  /** Serialized snapshot taken AFTER. */
  inputAfter: string;
  /** The store the door produced, or null when it refused. */
  store: DebtStore | null;
  /** True when the door reported a refusal rather than a result. */
  refused: boolean;
  /** Anything the door threw. A door that throws has already failed invariant 1. */
  threw: Error | null;
  /** Every source key, bucketed by what the door did with it (the accounting oracle). */
  accounting?: { mapped: string[]; dropped: string[]; unknown: string[]; unparseable: string[]; total: number };
  /** The store produced by running the same door on its own output — the idempotence oracle. */
  second?: DebtStore | null;
}

const v = (invariant: string, detail: string): Violation => ({ invariant, detail });

/**
 * ① Never throws. A door is the boundary between hostile bytes and the app; a throw here surfaces as a
 * crash on a screen whose entire job is to be safe with a file the user found somewhere.
 */
export const neverThrows: Invariant = (o) =>
  o.threw ? v('never-throws', `${o.door} threw: ${o.threw.message}`) : null;

/**
 * ② Nothing is silently dropped. Four buckets must account for 100% of the source keys — a key that is
 * in none of them was neither carried nor rejected, and *"we did not think about this"* and *"we decided
 * this"* look identical in the resulting store while only one is a defect.
 */
export const nothingSilentlyDropped: Invariant = (o) => {
  if (!o.accounting) return null;
  const { mapped, dropped, unknown, unparseable, total } = o.accounting;
  const seen = mapped.length + dropped.length + unknown.length + unparseable.length;
  return seen === total
    ? null
    : v('nothing-silently-dropped', `${o.door}: ${seen} of ${total} source keys accounted for`);
};

/**
 * ③ Money and dates keep their type.
 *
 * ⛔ `runMigrations` performs NO type validation — it merges `...r` wholesale — so nothing structurally
 * prevents a string `balance` from reaching an engine that does arithmetic on it, where `"1200" + 50`
 * concatenates instead of adding. Both versions declare these as numbers; the question this settles is
 * whether anything ENFORCES that at the boundary.
 */
const MONEY_FIELDS = ['balance', 'minimumPayment', 'apr', 'amount'] as const;

/**
 * ⛔ **GOALS WERE NOT CHECKED, AND GOALS ARE WHERE BOTH MONEY DEFECTS WERE FOUND.**
 * [P6.8.9.7.11.12 · B-J2-3] This invariant looked at debts, required expenses and living expenses, and
 * the field names it looked for — `balance`, `minimumPayment`, `apr`, `amount` — are **none of the ones a
 * goal carries.** So the instrument built to prove a restore cannot corrupt the user's money ran to
 * completion without ever looking at a goal, while `migrations.ts` records two separate goal-money
 * findings in its own comments, both found by people reading rather than by this.
 *
 * ⛔ **THE PARAGRAPH THAT USED TO SIT HERE WAS FALSE, AND IT WAS LOAD-BEARING.**
 * [P6.8.9.7.11.18 · S0.6 · M16] It claimed `priorityPerPaycheck` *"is not reachable through either audited
 * door today — it is a v1.7 field and both doors take v1.6 shapes."* **Measured false at `.11.17`:**
 * `mapLegacyStore` carries `goals` **straight across**, so a goal object in a v1.6-shaped blob passes any
 * field it likes through both doors — and the hostile fixture `goal-pace-unreadable-on-a-priority-goal`
 * does exactly that, one directory over, through both.
 *
 * ⚠️ **It was load-bearing because it is the stated justification for `corpus.ts` not adding the field to
 * its nested-damage axis** — so the generated corpus produced **0 of 522** goals carrying a pace and hit
 * the stand-down **0 times.** A wrong sentence in a comment kept a whole branch out of the corpus.
 * ⚡ **`findings-cite-comments-as-evidence`, and here the comment was ours.**
 *
 * ⭐ The branch itself is now judged by invariant ⑨, `priorityGoalIsCapped`, below.
 */
const GOAL_MONEY_FIELDS = ['targetAmount', 'currentAmount', 'priorityPerPaycheck'] as const;

export const moneyKeepsItsType: Invariant = (o) => {
  if (!o.store) return null;
  const bad: string[] = [];
  const check = (rows: unknown, label: string, fields: readonly string[] = MONEY_FIELDS) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row, i) => {
      if (!row || typeof row !== 'object') return;
      for (const field of fields) {
        const value = (row as Record<string, unknown>)[field];
        if (value === undefined || value === null) continue;
        if (typeof value !== 'number') bad.push(`${label}[${i}].${field} is ${typeof value} (${JSON.stringify(value)})`);
        else if (!Number.isFinite(value)) bad.push(`${label}[${i}].${field} is ${value}`);
      }
    });
  };
  check(o.store.debts, 'debts');
  check(o.store.requiredExpenses, 'requiredExpenses');
  check(o.store.livingExpenses, 'livingExpenses');
  check(o.store.goals, 'goals', GOAL_MONEY_FIELDS);
  // `paycheck.amount` is deliberately a STRING on both sides (measured, 5.2) — it mirrors the input model
  // and is parsed at the engine boundary. Asserting it is a number would be asserting the wrong contract.
  const pay = o.store.paycheck?.amount;
  if (pay !== undefined && typeof pay !== 'string') bad.push(`paycheck.amount is ${typeof pay}, expected string`);
  return bad.length ? v('money-keeps-its-type', `${o.door}: ${bad.slice(0, 3).join(' · ')}${bad.length > 3 ? ` (+${bad.length - 3})` : ''}`) : null;
};

/** ④ Whatever comes out is at the current version — a door that returns an unmigrated store is a door
 *  that hands the rest of the app a shape it stopped supporting. */
export const alwaysCurrentVersion: Invariant = (o) =>
  !o.store || o.store.storeVersion === CURRENT_STORE_VERSION
    ? null
    : v('always-current-version', `${o.door}: storeVersion ${o.store.storeVersion} ≠ ${CURRENT_STORE_VERSION}`);

/**
 * ⑤ The source is never mutated. One caller's "source" is the user's own parsed file, and `runMigrations`
 * already had to be taught this once — 5.6's prefs deletion mutates a COPY precisely because the JSON
 * restore path hands it the user's object.
 */
export const sourceNotMutated: Invariant = (o) =>
  o.inputBefore === o.inputAfter
    ? null
    : v('source-not-mutated', `${o.door} mutated its input`);

/** ⑥ A refusal produces no store at all. A door that refuses AND returns something has handed the caller
 *  a partial result wearing a rejection, which is the shape most likely to be committed by accident. */
export const refusalIsTotal: Invariant = (o) =>
  o.refused && o.store !== null
    ? v('refusal-is-total', `${o.door} refused but still produced a store`)
    : null;

/** ⑦ Idempotent — running a door on its own output changes nothing. Every door can run twice in reality
 *  (a re-import, an interrupted bridge, a re-hydrate), and a door that drifts on the second pass corrupts
 *  by degrees rather than all at once, which is far harder to notice. */
/**
 * ⚠️ Compares the DATA, with `dataRepairs` excluded — and that exclusion is a finding, not a loophole.
 *
 * The first pass repairs `balance: null` → `0` and records the repair; the second pass sees a valid `0`
 * and records nothing. The stores therefore differ, and **that is the designed behaviour**: `dataRepairs`
 * describes what THIS read had to fix, deliberately not merged forward, so a field the user has since
 * corrected stops being reported. Comparing it here compares the report, not the store.
 *
 * ⛔ It cost a round to see that. The invariant fired 96 times against correct code, and the tempting read
 * was that the repair had broken idempotence. *An invariant is a claim about the system and can be wrong
 * exactly like the system can* — the same lesson as the 5.8.1 copy-gate hypothesis, one layer up.
 */
const withoutRepairs = (store: DebtStore) => {
  const { dataRepairs: _dataRepairs, ...rest } = store;
  return JSON.stringify(rest);
};

export const idempotent: Invariant = (o) => {
  if (!o.store || o.second === undefined || o.second === null) return null;
  return withoutRepairs(o.store) === withoutRepairs(o.second)
    ? null
    : v('idempotent', `${o.door}: second pass changed the data`);
};

/**
 * ⑧ A repair is reported EXACTLY ONCE. The second pass over already-repaired data must record nothing —
 * otherwise the app nags about a field the user already fixed, and a notice that will not go away is one
 * people learn to dismiss. This is the property the idempotence exclusion above hands off to.
 */
export const repairsAreNotRepeated: Invariant = (o) => {
  if (!o.store || !o.second) return null;
  return o.second.dataRepairs.length === 0
    ? null
    : v('repairs-not-repeated', `${o.door}: ${o.second.dataRepairs.length} repair(s) re-reported on a clean second pass`);
};

/**
 * ⑨ **A PRIORITY GOAL MAY NOT EMERGE UNCAPPED.** [P6.8.9.7.11.18 · S0.6 · M16]
 *
 * ⛔ **The branch this judges is the one `migrations.ts:228` calls *"the only finding in that pass that
 * reaches a user's money"*, and ZERO of the eight invariants above could see it.** Measured at `.11.17`:
 * simulate the stand-down being deleted, so a goal keeps `priority: true` with a pace repaired to `0`, and
 * `checkAll` returns `[]`. `moneyKeepsItsType` passes because `0` is a finite number; `idempotent` and
 * `repairsAreNotRepeated` pass because a second pass over a finite `0` records nothing.
 *
 * ⚡ **`0` is not one repair — it is fail-VISIBLE for a balance and fail-SILENT for a pace.** A $12,000
 * card repaired to $0 is obviously wrong to whoever is looking. A pace repaired to $0 looks like nothing
 * and quietly redirects every spare dollar away from the user's debt.
 *
 * ⛔ **NOT `=== 0` — `> 0` is the real gate, so NEGATIVE is uncapped too.** `allocatePaycheck.ts:635` is
 * `pace != null && pace > 0 ? pace : Infinity` and `recommendedActions.ts:80` guards identically. An
 * invariant written against `0` alone would have left the negative half of the same hole open, which is
 * the enumerate-the-spellings mistake this cluster has now paid for four times.
 *
 * ⚠️ **Cannot false-positive on legitimate data:** the stand-down `delete`s `priorityPerPaycheck` on BOTH
 * of its branches — whether or not the goal is `governed` — so no correctly-migrated store can carry
 * `priority: true` with a non-positive pace. A goal with `priority: false` is skipped deliberately: its
 * pace governs nothing.
 */
export const priorityGoalIsCapped: Invariant = (o) => {
  if (!o.store) return null;
  const bad: string[] = [];
  const goals: unknown = o.store.goals;
  if (!Array.isArray(goals)) return null;
  goals.forEach((row, i) => {
    if (!row || typeof row !== 'object') return;
    const g = row as Record<string, unknown>;
    if (g.priority !== true) return;
    const pace = g.priorityPerPaycheck;
    if (pace === undefined || pace === null) return;
    if (typeof pace !== 'number' || !(pace > 0)) {
      bad.push(`goals[${i}] is priority with priorityPerPaycheck ${JSON.stringify(pace)} — reads as UNCAPPED`);
    }
  });
  return bad.length ? v('priority-goal-is-capped', bad.join('; ')) : null;
};

export const INVARIANTS: Invariant[] = [
  neverThrows,
  nothingSilentlyDropped,
  moneyKeepsItsType,
  alwaysCurrentVersion,
  sourceNotMutated,
  refusalIsTotal,
  idempotent,
  repairsAreNotRepeated,
  priorityGoalIsCapped,
];

export function checkAll(outcome: DoorOutcome): Violation[] {
  return INVARIANTS.map((f) => f(outcome)).filter((x): x is Violation => x !== null);
}
