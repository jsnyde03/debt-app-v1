import { normalizeBnplInstallment } from '@core/debt/bnplInstallment';
import { raiseOriginalBalance } from '@core/debt/originalBalanceHighWater';
import { createDefaultStore } from './defaults';
import { fundsAsSinkingFund, primaryEmergencyGoal } from '@core/engine/emergencyFund';

import { CURRENT_STORE_VERSION, type DataRepair, type DebtStore } from './models';

/**
 * Bring a raw persisted blob up to `CURRENT_STORE_VERSION`. v1 = the initial RN consolidated shape;
 * v2 adds `driftBaseline` (additive — an older blob merges onto the current defaults → `null`, and
 * gets a baseline written on its next plan-establish/rollover);
 * v3/v4 (Projection auto-maintenance, 2.3) backfill each debt's projection dates. `lastVerifiedDate`
 * (last user confirmation) defaults to the app's current date — the upgrade treats the existing
 * balance as freshly verified, so projection starts at zero drift rather than an alarming jump.
 * `balanceAsOfDate` (the projection anchor) defaults to `lastVerifiedDate` (the balance is as-of when
 * it was last confirmed). Both are backfilled together so a v2 OR the interim-v3 blob lands correct.
 * v5 (Payday Cushion Guardian substrate, 2.4.D) is purely ADDITIVE — the new store-level fields
 * (`inputsAsOf`, `genuineCycleCount`, the logs, the current-cycle carriers, `missedArrivals`) and the
 * new `PaycheckConfig` income fields (`incomeVaries`/`leanAmount`/`typicalAmount`) merge onto the
 * current defaults below (top-level via `...base`, paycheck via the explicit paycheck merge), so an
 * older blob backfills to safe values (fixed income, zero genuine cycles, empty logs) with no bespoke
 * step. `inputsAsOf` lands at the current date → an upgrade reads as freshly-entered, not stale.
 * v6 (BNPL installment-native model, 2.7.2) reconciles each installment-native BNPL — one with both
 * a `scheduledPaymentAmount` and a `remainingPayments` — so `balance` = scheduled × remaining and
 * `minimumPayment` = scheduled. Before v6 those two fields were captured but read back nowhere, so a
 * BNPL whose entered minimum differed from its real installment projected the wrong payoff; the
 * upgrade snaps the derived fields to the installment truth the user actually entered. A BNPL missing
 * either field is left untouched (the balance+minimum fallback path).
 * A raw that isn't a plain object throws → the caller quarantines it (never writes corrupt data
 * back). Older/partial shapes are merged onto the current defaults so a missing field never bricks
 * hydration. (The Capacitor per-key `debtPlanner.*` → this blob mapping is the Phase-D data bridge,
 * not here.)
 */
/**
 * 5.10 — money that cannot be read is REPAIRED and REPORTED, never trusted and never silently dropped.
 *
 * ⛔ Measured: v1.6's onboarding guards new debts with `Number(balance) <= 0`, and **`NaN <= 0` is false**,
 * so `Number("12,000")` — a comma, on the first debt a user ever types — passes and persists. `JSON`
 * writes `NaN` as `null`, so real v1.6 stores in the wild hold `balance: null` today. v1.6's *edit* path
 * documents fixing exactly this and the fix never reached onboarding.
 *
 * ⚠️ The value lands at 0 but the debt is KEPT and the repair is RECORDED. The three options were: coerce
 * silently (a $12,000 debt renders as PAID OFF — wrong and invisible, the worst of the three), drop the
 * row (destroys a record the user recognises by name), or repair-and-surface. Only the last one lets the
 * person find out, and finding out is one tap from being correct.
 */
/**
 * ⛔ **THREE OUTCOMES, NOT TWO.** A recovery and a loss are both *repairs*, and collapsing them to one
 * boolean is what let the repairs card tell a user their `'4,000'` goal *"could not be read"* while the
 * plan ran correctly on `4000`. The caller needs to know **which**, so it is returned, not inferred.
 *
 * ⚠️ **A recovered value is exactly right, not approximately right** — the string parses or it does not,
 * and a string that does not parse falls to the loss branch. So `recovered` means the number is correct
 * and only its FORMAT was wrong; nothing downstream should treat it as suspect data.
 *
 * ⛔ **AND THAT SENTENCE WAS FALSE FOR AN EMPTY STRING UNTIL [P6.8.9.7.11.18 · S1.1].** `Number('')` is
 * `0`, not `NaN` — so `''`, `'   '` and `','` all "parsed", were stamped `recovered`, and carried a `0`
 * that nothing downstream would question. `.11.12.1` had meanwhile narrowed Money's celebration guard to
 * `r.kind !== 'recovered'` **on the strength of this docblock**, so a restore of a backup whose balances
 * were blank rendered *"Every balance cleared"* over debts still owed, for the life of the install.
 * ⚡ **The premise and the code failed together because the code was read from the comment.**
 *
 * ⚠️ **The direction this runs in:** a string holding no digits is not a number whose FORMAT was wrong —
 * nothing was read, so `lost` is the truthful class, and it is also the conservative one *(it keeps the
 * celebration suppressed and puts the field in front of the user)*. The opposite reading — *"blank means
 * zero"* — cannot be had, because the app cannot tell *"I owe nothing"* from *"this field was empty"*.
 * The costs are not symmetric: `lost` costs a user with a genuinely-zero balance one tap on the repairs
 * card; `recovered` tells them their debts are gone and never asks again.
 */
function readMoney(value: unknown): { value: number; repair: 'none' | 'recovered' | 'lost' } {
  if (typeof value === 'number' && Number.isFinite(value)) return { value, repair: 'none' };
  // Commas are stripped for the same reason v1.6's `parseDebtFormValues` tolerates them: "12,000" is a
  // real thing users type, and the JSON restore door hands this an arbitrary user-supplied file.
  if (typeof value === 'string') {
    // ⚠️ Emptiness is tested AFTER the strip, not before: `','` and `', ,'` strip to nothing and would
    // otherwise reach `Number()` as `''`. The condition is "no characters left to read", never a list of
    // blank spellings. `parseDebtFormValues.ts:19-22` reached the same guard from the form side and
    // wrote the same reason down; this path is the one that never got it.
    const cleaned = value.replace(/,/g, '').trim();
    if (cleaned !== '') {
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return { value: parsed, repair: 'recovered' };
    }
  }
  return { value: 0, repair: 'lost' };
}


/**
 * ⛔ **AN ABSENT REQUIRED MONEY FIELD IS A LOSS, NOT A SKIP.** [P6.8.9.7.11.18 · S1.1]
 *
 * This function used to `continue` past **any** `undefined` field, which is right for `originalBalance`,
 * `scheduledPaymentAmount` and `priorityPerPaycheck` — all three are optional in the schema and their
 * absence *means* something (`priorityPerPaycheck`'s own type doc: *"Absent → funds as fast as spare
 * allows"*, so repairing it to `0` would invent a cap the user never set).
 *
 * ⚡ **It is wrong for the six fields the schema declares non-optional.** Measured on the fix for
 * blocker #1: a debt row with no `balance` key survives migration as `balance: undefined`, **with no
 * repair recorded** — so `debts.filter(d => d.balance <= 0)` puts it in neither the active list nor the
 * paid-off list, and any total over the portfolio is **`NaN`**. A `$NaN` on the money screen is the
 * loudest possible version of the quiet defect blocker #1 was.
 *
 * ⚠️ **The direction this runs in:** the schema says these fields are always present, so an absent one is
 * a file that lost something — recording the loss repairs to `0` *and* puts the field in front of the
 * user. The opposite reading, *"absent means the user hasn't set it yet"*, is available only for the
 * three fields marked optional, and those keep the skip. ⛔ **The split is by SCHEMA optionality, not by
 * a judgement per field**, so a new money field cannot land in the ambiguous middle.
 *
 * ⚠️ Both lists are passed explicitly rather than one list plus an exception set: a field omitted from
 * both stops being repaired **silently**, and `migrations.test.ts` carries a per-field absent-case
 * fixture for exactly that reason.
 */
function repairMoneyFields<T extends Record<string, unknown>>(
  rows: unknown,
  fallback: T[],
  required: readonly string[],
  optional: readonly string[],
  entity: DataRepair['entity'],
  repairs: DataRepair[],
): T[] {
  // ⛔ A non-array here used to THROW out of `runMigrations` — which the import door caught and the
  // WebKit bridge did not, so one corrupt v1.6 key silently skipped a whole migration (5.10, finding 1).
  // Being total is what makes both doors behave the same.
  if (!Array.isArray(rows)) {
    // ⛔ RECORDED, not silently swapped. The first cut of this returned `fallback` bare, and
    // `persistenceLifecycle`'s malformed-nested case caught it: a corrupt `debts` key became an empty
    // list with nothing to show for it — the precise silent drop this whole item exists to remove, added
    // by the fix for it. `rows === undefined` is the ordinary "key absent" case and is not a loss.
    if (rows !== undefined) repairs.push({ entity, id: '', name: '', field: '(whole list unreadable)', kind: 'lost' });
    return fallback;
  }
  return rows.flatMap((row) => {
    /**
     * ⛔ **A NON-OBJECT ROW IS DROPPED, NOT PASSED THROUGH — and passing it through failed two different
     * ways at once.** [P6.8.9.7.11.12 · A-J2-3] A `null` inside the array reached `debt.lastVerifiedDate`
     * and `goal.priority` and threw a `TypeError` out of `runMigrations`, which hydrate turns into a
     * whole-blob quarantine and a `data-reset` — the user's entire portfolio, gone over one row, with no
     * restore surface for the quarantined bytes. `requiredExpenses` and `livingExpenses` dereference
     * nothing here, so for them the `null` survived INTO the store instead and waited for the first
     * `g.amount` at render.
     *
     * ⚠️ **Guarding those dereferences would only move the crash.** A surviving `null` throws in
     * `goals.reduce((sum, g) => sum + g.targetAmount, 0)` on Money. The row has to leave the array, and
     * this is the one place all four lists pass through.
     *
     * ⚠️ **Dropping is the opposite of the rule for a bad AMOUNT, and that is deliberate.** A row with an
     * unreadable balance keeps a name the user recognises, so it is repaired and surfaced; 5.10 rejected
     * dropping precisely because it destroys that. This row has no id, no name and no fields — the only
     * fact about it is that it was there, and the record is how the person is told.
     *
     * How one arises: not from the app. A hand-edited or third-party backup, a `JSON.stringify` of an
     * array with a hole or an `undefined` element, or an external mutation of the stored blob.
     */
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      repairs.push({ entity, id: '', name: '', field: '(a row could not be read)', kind: 'lost' });
      return [];
    }
    const next = { ...(row as Record<string, unknown>) };
    for (const field of [...required, ...optional]) {
      // An absent OPTIONAL field stays absent — see the docblock. An absent REQUIRED one falls through to
      // `readMoney`, which classifies `undefined` as `lost` and repairs it to `0`.
      if (next[field] === undefined && optional.includes(field)) continue;
      const { value, repair } = readMoney(next[field]);
      next[field] = value;
      if (repair !== 'none') {
        repairs.push({
          entity,
          id: typeof next.id === 'string' ? next.id : '',
          name: typeof next.name === 'string' ? next.name : '',
          field,
          kind: repair,
        });
      }
    }
    return [next as T];
  });
}

/**
 * ⛔ A store carrying a WORKING plan has been onboarded — found on a real device (🎯 2026-08-19).
 *
 * v1.6's `buildBackupData()` never emitted `hasCompletedOnboarding`, so a genuine v1.6 backup FILE cannot
 * carry it. The import therefore landed `onboardingComplete: false`, and `_layout.tsx`'s route guard
 * (`Stack.Protected guard={!onboardingComplete}`) sent the user to onboarding **with the whole restored
 * portfolio imported but invisible behind the gate.** It reads as "the import did nothing" — the worst way
 * a successful restore can present.
 *
 * ⚠️ It lives HERE, at the single choke point every door passes through, rather than in the import path.
 * The first cut put it in `readBackup` and the differential oracle immediately caught it: the two doors
 * onto the same data started disagreeing. Fixing it at the root is what makes them agree by construction —
 * the same lesson as the non-array `debts` throw earlier in 5.10.
 *
 * ⛔ **Income AND an obligation, not either.** A looser "has any debt" signal wrongly skipped onboarding
 * for a user mid-setup who had entered one debt and no income — they cannot be shown a plan, so they must
 * finish onboarding. An explicit `true` is always honoured; this only ever promotes, never demotes.
 */
function inferOnboarding(
  r: Partial<DebtStore>,
  incomingPrefs: Record<string, unknown>,
  paycheck: DebtStore['paycheck'],
): boolean {
  if (incomingPrefs.onboardingComplete === true) return true;
  const hasIncome = typeof paycheck.amount === 'string' && paycheck.amount.trim() !== '';
  const hasObligation =
    (Array.isArray(r.debts) && r.debts.length > 0) ||
    (Array.isArray(r.requiredExpenses) && r.requiredExpenses.length > 0);
  return hasIncome && hasObligation;
}

export function runMigrations(raw: unknown): DebtStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('runMigrations: persisted store is not an object');
  }
  const base = createDefaultStore();
  const r = raw as Partial<DebtStore>;
  const repairs: DataRepair[] = [];
  const paycheck = { ...base.paycheck, ...(r.paycheck ?? {}) };
  // `paycheck.amount` is deliberately a STRING on both sides — it mirrors the input model and is parsed at
  // the engine boundary — so it is normalised to a string rather than to a number.
  if (paycheck.amount !== undefined && typeof paycheck.amount !== 'string') {
    paycheck.amount = paycheck.amount === null || typeof paycheck.amount === 'object' ? '' : String(paycheck.amount);
  }
  // v3/v4 backfill: a debt with no user-confirmation date is treated as confirmed "now"; the projection
  // anchor defaults to that same date (balance is as-of when it was last confirmed).
  const debts = repairMoneyFields(
    r.debts,
    base.debts,
    ['balance', 'minimumPayment', 'apr'],
    ['originalBalance', 'scheduledPaymentAmount'],
    'debt',
    repairs,
  ).map((debt) => {
    const lastVerifiedDate = debt.lastVerifiedDate ?? paycheck.currentDate;
    const balanceAsOfDate = debt.balanceAsOfDate ?? lastVerifiedDate;
    // v6: reconcile an installment-native BNPL's balance+minimum to its scheduled × remaining truth.
    // ⚠️ Runs AFTER the money repair, deliberately: it multiplies `scheduledPaymentAmount × remaining`,
    // and multiplying an unrepaired `null` would produce a plausible-looking 0 balance from arithmetic
    // rather than from a value anyone can point at.
    // [P6.8.9.7.11.15 · D62] The high-water invariant, and it is the half that reaches anyone ALREADY in
    // the broken state — a stamp left behind by a correction made before this shipped. ⚠️ It runs on
    // every hydrate rather than once, so it also self-heals; the store seams exist because an in-memory
    // session is not re-hydrated between the edit and the render.
    // ⛔ AFTER `normalizeBnplInstallment`, which re-derives an installment BNPL's balance — the helper
    // carves those out, and asking it about a balance the line below is about to change would be asking
    // the wrong question.
    return raiseOriginalBalance(normalizeBnplInstallment({ ...debt, lastVerifiedDate, balanceAsOfDate }));
  });
  const requiredExpenses = repairMoneyFields(r.requiredExpenses, base.requiredExpenses, ['amount'], [], 'requiredExpense', repairs);
  const livingExpenses = repairMoneyFields(r.livingExpenses, base.livingExpenses, ['amount'], [], 'livingExpense', repairs);
  /**
   * ⛔ **GOALS WERE NEVER REPAIRED — B1's other half, found by the P6.8.9.2 verification.** Debts, required
   * expenses and living expenses all ran through `repairMoneyFields`; goals fell through `...r` untouched,
   * and `mapLegacyStore.ts:76` carries `goals: 'goals'` **straight across from v1.6**. So the one class of
   * blob that cannot be fixed by reinstalling — an existing user's stored data — was the class with no
   * repair.
   *
   * ⚠️ **`priorityPerPaycheck` is why this is a money defect and not a display one.** Its own type doc:
   * *"Absent → no cap (funds as fast as spare allows)."* An unreadable value serialises to `null`, `null`
   * is not `undefined`, and every `??` reader treats it as absent — so a corrupt pace does not show a
   * wrong number, it **removes the cap the user signed off on** and funds the goal ahead of debt at full
   * speed. `targetAmount` and `currentAmount` are the ordinary display half.
   */
  const goals = repairMoneyFields(
    r.goals,
    base.goals,
    ['targetAmount', 'currentAmount'],
    ['priorityPerPaycheck'],
    'goal',
    repairs,
  );
  /**
   * ⛔ **REPAIRING THE PACE TO `0` LEFT THE HARM EXACTLY WHERE IT WAS.** The paragraph above states the
   * defect correctly — a corrupt pace *"removes the cap the user signed off on and funds the goal ahead of
   * debt at full speed"* — and then `readMoney` returns `0` for anything unreadable, and **`0` is the
   * uncapped value**: `allocatePaycheck.ts:632` reads `priorityPerPaycheck != null && > 0 ? pace : Infinity`
   * and `recommendedActions.ts:80` guards identically, falling through to the whole remaining goal. The
   * repaired store allocates **identically to the corrupt one.** Found by two independent verifiers from
   * opposite directions at P6.8.9.7.10 (C-2 and B-1), and it is the only finding in that pass that reaches
   * a user's money.
   *
   * ⚡ **The insight is that `0` is not one repair — it is fail-VISIBLE for a balance and fail-SILENT for a
   * pace.** A $12,000 card repaired to $0 is obviously wrong to the person looking at it. A pace repaired
   * to $0 looks like nothing at all and quietly redirects every spare dollar away from their debt. Same
   * value, same helper, opposite consequence — so the pace needs a repair of its own.
   *
   * ⛔ **Stand the priority DOWN rather than guess a number.** Any pace we invent is a claim about what the
   * user chose; the one thing we know is that we can no longer read it. So the goal keeps its name, target
   * and balance, and stops being funded ahead of debt until the person says otherwise — the safe direction,
   * because it leaves the money with the debt rather than taking it.
   *
   * ⚠️ The repair's `field` becomes a SENTENCE here. Every other entry renders as `"Roof — targetAmount"`,
   * and a camel-cased identifier is already poor copy; for this one the consequence is the part the reader
   * needs, and it is not guessable from the field name.
   */
  /**
   * ⛔ **MATCHED ON THE VALUE, NOT ON THE REPAIR RECORD — and the record is the wrong question twice.**
   * [P6.8.9.7.11.9 · B-1] A **successful recovery** and a loss are both repairs: `'200'` and `'1,200'`
   * parse to their real amounts and are still recorded, because the *format* was repaired. Standing a goal
   * down on the record therefore destroyed caps that had been read **correctly** — a user who chose
   * `$200 a paycheck` and restored a backup file holding it as a string lost the plan they signed off on.
   * That is worse than the defect it was fixing.
   *
   * ⚡ The value answers both questions the record cannot. `0` is the only thing an unreadable pace
   * becomes, so it identifies a real loss — **and it also catches the stores a previous build already
   * wrote**, which hold `priority: true` with a pace of `0` and carry no repair record at all (a finite
   * `0` re-reads as `repaired: false`). Those would otherwise fund uncapped forever.
   */
  for (const goal of goals) {
    /**
     * ⛔ **`<= 0`, NOT `=== 0` — and the corpus found the gap the moment it could reach this branch.**
     * [P6.8.9.7.11.18 · S0.6b · REVERIFY-1 finding 6]
     *
     * The uncapped condition is not "the pace is zero". `allocatePaycheck.ts:635` is
     * `pace != null && pace > 0 ? pace : Infinity`, and `recommendedActions.ts:80` guards identically —
     * so **every non-positive number is uncapped**, and this loop only ever caught one of them.
     *
     * ⚡ **Found by the instrument, not by reading.** Adding a priority goal to the audit corpus made
     * invariant ⑨ reachable, and its first run reported `priorityPerPaycheck: -1` surviving as
     * `priority: true` through **both** doors. A negative pace is a finite number, so `readMoney` reports
     * no repair at all — nothing upstream flags it, and the branch built to catch exactly this harm
     * stepped over it.
     *
     * ⚠️ **`undefined` is deliberately NOT stood down.** `priority: true` with no pace is the legitimate
     * "fund it fully" state a user can choose; the allocator reads it as uncapped **on purpose**. What is
     * being repaired here is a pace that is *present and nonsensical*, not an absent one.
     */
    const pace = goal.priorityPerPaycheck;
    if (goal.priority !== true || typeof pace !== 'number' || pace > 0) continue;
    /**
     * ⛔ **THE PRIORITY RUNG DOES NOT GOVERN *THE* EMERGENCY FUND, so it is a different story.**
     * [P6.8.9.7.11.9 · B-4] The sinking-fund rung skips it, so its pace never governed anything and
     * standing it down changes nothing. It is still funded ahead of debt — by the **starter-EF rung**,
     * which consults neither `priority` nor the pace and is capped at `starterEmergencyTarget`. So the
     * cap-removal harm does not apply, and claiming *"no longer funded ahead of your debt"* would be
     * false of it.
     *
     * ⚠️ **Asked of the engine's own rule rather than of `type`.** [P6.8.9.7.11.12 · A-J2-4] A SECOND
     * `emergency`-typed goal now funds through the sinking-fund rung, so its pace DOES govern — and a
     * `type === 'savings'` test here would have quietly gone on treating it as ungoverned.
     */
    const governed = fundsAsSinkingFund(goal, primaryEmergencyGoal(goals));
    if (governed) goal.priority = false;
    delete goal.priorityPerPaycheck;
    const rep = repairs.find((r) => r.entity === 'goal' && r.id === goal.id && r.field === 'priorityPerPaycheck');
    /**
     * ⛔ **[P6.8.9.7.11.13.5 · J1-1 Q2] THE LEGACY BRANCH CHANGED THE USER'S PLAN AND TOLD THEM NOTHING.**
     *
     * A store an earlier build already wrote carries `priority: true` with a pace of `0` and **no repair
     * record at all** — a finite `0` re-reads as `repaired: false`. That is the exact population the
     * value-match above exists to catch, and for it the goal stopped being funded ahead of debt with no
     * entry in `pendingDataRepairs` and no card. **This module's opening rule is *"money that cannot be
     * read is REPAIRED and REPORTED, never trusted and never silently dropped"* — this branch was the
     * silent drop, inside the file that forbids it.**
     *
     * ⚠️ **The old reasoning was that inventing a line would date the loss to today.** That is a true
     * objection to a *timestamp*, not to a record: no repair entry carries one, the card speaks in the
     * present tense about what the plan is doing NOW, and *"say nothing"* and *"say when"* were never the
     * only two options. The sentence below claims only what is still true at this moment.
     *
     * ⚡ **`kind: 'lost'` is what makes this safe to add** — `.11.12.1` split recovered from lost, so this
     * lands under *"An amount could not be read · your plan is running without it until you set it again"*
     * rather than under *"written in a different format · your plan is using it"*. ⚠️ And *"until you set
     * it again"* became a followable instruction at `.11.13.4`, which is why this is reportable now and
     * was not before: `GoalSheet` can set the pace.
     */
    if (!rep) {
      repairs.push({
        entity: 'goal',
        id: goal.id,
        name: goal.name,
        field: governed
          ? 'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt'
          : 'the per-paycheck amount could not be read',
        kind: 'lost',
      });
    }
    if (rep) {
      rep.field = governed
        ? 'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt'
        : 'the per-paycheck amount could not be read';
      // ⛔ A pace of `'0'` RECOVERS to a real `0` — the string parsed — but `0` is not a cap, so the goal
      // is stood down all the same and the person has genuinely lost the pace they chose. The record must
      // say `lost` or this line renders under "read in a different format", which reads as no action
      // needed while the plan has already changed underneath them.
      rep.kind = 'lost';
    }
  }
  // v7 (5.6) — DROP two inert prefs. Both were measured at zero production reads, and the merge below
  // would otherwise carry them forward forever: `{ ...base.prefs, ...r.prefs }` preserves any extra key
  // an older blob happens to hold, so deleting them from the TYPE alone would leave them in the data.
  // ⚠️ Deleted from a copy — mutating `r.prefs` would edit the caller's object, and one caller is the
  // JSON-restore path where that object is the user's file.
  const { isDemoMode: _isDemoMode, guardianIntroSeen: _guardianIntroSeen, ...incomingPrefs } = (r.prefs ??
    {}) as Record<string, unknown>;

  return {
    ...base,
    ...r,
    storeVersion: CURRENT_STORE_VERSION,
    debts,
    requiredExpenses,
    livingExpenses,
    goals,
    paycheck,
    prefs: { ...base.prefs, ...incomingPrefs, onboardingComplete: inferOnboarding(r, incomingPrefs, paycheck) },
    // ⚠️ REPLACED, not merged with whatever the blob carried. This describes what THIS read had to
    // repair; carrying a previous run's list forward would keep re-reporting a field the user has since
    // fixed, and a notice that will not go away is one people learn to dismiss.
    dataRepairs: repairs,
    // ⛔ MERGED, which is the exact opposite rule to the line above, on purpose. `dataRepairs` answers
    // "what did this read fix"; this answers "what has the user not been told yet", and the second
    // question outlives the read that raised it — the list above is empty again as soon as anything
    // saves. Only an acknowledgement empties this one.
    //
    // ⚠️ Deduped by entity+id+field so a blob re-migrated before the user acknowledges cannot stack the
    // same repair twice. That is also what keeps a second pass identical to the first, which the
    // `idempotent` invariant compares on every field except `dataRepairs`.
    pendingDataRepairs: mergeRepairs(Array.isArray(r.pendingDataRepairs) ? r.pendingDataRepairs : [], repairs),
  };
}

/** Union of already-pending repairs and this read's, keyed by the field a repair actually identifies. */
function mergeRepairs(pending: DataRepair[], fresh: DataRepair[]): DataRepair[] {
  const out: DataRepair[] = [];
  const seen = new Set<string>();
  for (const rep of [...pending, ...fresh]) {
    if (!rep || typeof rep !== 'object') continue;
    const key = `${rep.entity}|${rep.id}|${rep.field}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rep);
  }
  return out;
}
