import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { REPAIRABLE_MONEY_FIELDS, runMigrations } from '@/data/migrations';
import { selectWhatIf } from '@/store/analysisSelectors';
import { selectDebtBalanceView, selectProvisionalPayoffs, withProjectedBalances } from '@/store/balanceSelectors';
import { selectAffordability, selectPaydayGuardian, selectReserveRelease, selectWindfallSplit } from '@/store/guardianSelectors';
import { selectCashTimeline, selectPayoffView } from '@/store/payoffSelectors';
import { DEFAULT_CUSHION_FLOOR, cushionLine, effectivePaycheckBuffer, selectAllocation, selectWaterFillPlan } from '@/store/selectors';
import { selectPlanState, selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectCelebration } from '@/store/celebrationSelectors';
import { detectPayoff } from '@/store/payoffCelebration';


import { createDebtStore } from '@/store/store';
import { answerableByEdit, claimFields, clearedDebts, hasUnreadDebtBalances, liveDebts, mayClaim, partitionDebts, rowFieldUnread } from '@/store/trustSelectors';
import type { DebtStore } from '@/data/models';

/** ⛔ S1.13.7.4 [pass-6 B1-1] — the unread set detectPayoff now REQUIRES. Derived from the store
 *  under test rather than typed, so a fixture that adds an unread balance is covered automatically. */
const unreadIdsOf = (s: Parameters<typeof partitionDebts>[0]) =>
  new Set(partitionDebts(s).unreadBalance.map((d) => d.id));

/**
 * ⛔ **THE THREE SCREENS THAT SAY "CLEARED" MUST AGREE ON ONE STORE.**
 * [P6.8.9.7.11.18 · S1.5 · pass-1 blocker B1]
 *
 * ⚡ **The defect this pins was measured, not imagined:** on one migrated store holding two blank
 * balances, `money.tsx` correctly refused *"Every balance cleared"* while `selectPlanState` returned
 * `'debt-free'` and Today rendered *"You're debt-free. Every balance is cleared."* **One tab apart, the
 * app both refused and made the claim** — permanently, because the repaired `0`s never change back.
 *
 * ⛔ **This test asserts AGREEMENT, not a value.** A test that checked only `selectPlanState` would go
 * green again the moment a fourth screen learned to say "cleared" without asking. The invariant is that
 * **no claim-bearing predicate disagrees with the owner**, so the assertions are written as a comparison
 * between them rather than as three independent expectations.
 */

function fail(message: string): never {
  throw new Error(message);
}
function eq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) fail(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const DAY = '2026-08-26';

/** A store whose debts carry the given raw balances, through the door a user's file actually comes in. */
function migrated(balances: unknown[], goalTarget: unknown = 1000): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: balances.map((balance, i) => ({
      id: `d${i}`, name: `Card ${i}`, balance, apr: 20, minimumPayment: 25,
      dueDate: DAY, type: 'debt', recurrence: 'monthly',
    })),
    goals: [{ id: 'g0', name: 'Fund', targetAmount: goalTarget, currentAmount: 0, type: 'savings' }],
    prefs: { onboardingComplete: true },
  });
}

/** A store whose one debt carries the given raw `minimumPayment`, plus a bill so the plan is non-trivial. */
function withMinimum(minimumPayment: unknown): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    prefs: { onboardingComplete: true },
  });
}

/** The same store with the raw `apr` varied instead — the field that must NOT gag the plan claim. */
function withApr(apr: unknown): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true },
  });
}

/** Two goals, the first carrying the raw amounts under test — so the per-ROW claim has something to miss. */
function goalsWith(first: { targetAmount: unknown; currentAmount: unknown }): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    goals: [
      { id: 'g1', name: 'House Fund', type: 'savings', ...first },
      { id: 'g2', name: 'Car', type: 'savings', targetAmount: 2000, currentAmount: 1000 },
    ],
    prefs: { onboardingComplete: true },
  });
}

/** A live store seeded with an already-migrated blob, so the real wired actions run against it. */
function storeWith(store: DebtStore): ReturnType<typeof createDebtStore> {
  const s = createDebtStore();
  s.setState({ store });
  return s;
}

export default function run(): void {
  /**
   * ⛔ **S1.11.4.2 [pass-4 blocker `C4-2`] — THE PARTITION IS TOTAL, AND THAT IS THE WHOLE REASON IT IS A
   * PARTITION RATHER THAN A `clearedDebts` FILTER.**
   *
   * ⚡ The finding's stated remedy was to exclude the unread row from *"paid off"*. Doing only that
   * **deletes the debt from Money's list**: it is not in `active` either, because `view.order` ranks
   * `balance > 0`. `migrations.ts:99` already records that exact shape — *"puts it in neither the active
   * list nor the paid-off list"* — as what a `$NaN` came out of. ⛔ **A remedy that would have introduced
   * a defect, which is the third one this round, and this is the assertion that makes it unrepeatable.**
   */
  {
    const store = migrated([0, 'twelve thousand', 500]);
    const p = partitionDebts(store);
    eq(
      p.live.length + p.cleared.length + p.unreadBalance.length,
      store.debts.length,
      '⛔ C4-2 — every debt lands in exactly one group; a row cannot fall between them',
    );
    eq(p.unreadBalance.map((d) => d.id).join(), 'd1', '⛔ C4-2 — the repaired-to-0 balance is UNREAD, not cleared');
    eq(p.cleared.map((d) => d.id).join(), 'd0', '⛔ C4-2 — …and the genuine 0 beside it still IS cleared');
    eq(p.live.map((d) => d.id).join(), 'd2', 'the live row is untouched');
    // ⛔ ONE PRODUCER, ASSERTED RATHER THAN ASSUMED. `liveDebts` is the owner of "is this debt live?" and
    // the partition must not become a second answer to it — that is the two-producers class this round
    // has collapsed everywhere else, and it would be introduced by the very fix for it.
    eq(
      p.live.map((d) => d.id).join(),
      liveDebts(store).map((d) => d.id).join(),
      '⛔ C4-2 — the partition live group IS `liveDebts`, never a second copy of the expression',
    );
  }

  /**
   * ⭐ **THE CONTROL.** With every balance readable there is no third group at all, so the partition
   * degrades to exactly the two lists the app had before — a suppression that never lets the good state
   * through is a second false statement, not a fix.
   */
  {
    const store = migrated([0, 12000, 500]);
    const p = partitionDebts(store);
    eq(p.unreadBalance.length, 0, '⭐ control — a store the app read in full has nothing in the third group');
    eq(p.cleared.length, 1, '⭐ control — …the genuinely cleared debt is still cleared');
    eq(clearedDebts(store).map((d) => d.id).join(), 'd0', '⭐ control — and the sugar agrees with the partition');
  }

  /**
   * ⛔ **THE CASE THAT SHIPPED.** Two blank balances → both repaired to `0` → `liveDebts.length === 0`.
   * Money refused; Today did not.
   */
  {
    const store = migrated(['', '   ']);
    eq(store.debts.every((d) => d.balance === 0), true, 'both blank balances repaired to 0');
    eq(hasUnreadDebtBalances(store), true, 'the owner says these balances were not read');
    const state = selectPlanState(store, selectAllocation(store));
    eq(state, 'debt-free-unverified', '⛔ B1 — Today must NOT reach the debt-free celebration');
    // The one consumer of 'debt-free' is `index.tsx:303`'s `planState === 'debt-free'`, so this is the
    // assertion that keeps `GraduationBanner` and `FreedomNextChapterCard` off the screen.
    eq(state === 'debt-free', false, '…and `isDebtFree` is false, which is what gates the banner');
  }

  /**
   * ⛔ **THE CONTROL, AND IT IS THE HALF THAT STOPS THIS BECOMING A BLANKET SUPPRESSION.** A genuinely
   * cleared portfolio must still celebrate — a guard that never lets the good state through is a second
   * false statement, not a fix.
   */
  {
    const store = migrated([0, 0]);
    eq(hasUnreadDebtBalances(store), false, 'a genuinely cleared portfolio has nothing unread');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '⭐ …and it DOES reach the celebration');
  }

  /**
   * ⛔ **A RECOVERED VALUE IS NOT AN UNREAD ONE.** `'0'` parses to a real `0`, so a genuinely cleared debt
   * restored from a file holding string money must still celebrate. This is the exclusion that made
   * blocker ⓪-1 possible, so it is asserted in both directions rather than assumed.
   */
  {
    const store = migrated(['0', '0']);
    eq(store.pendingDataRepairs.every((r) => r.kind === 'recovered'), true, "'0' is a recovery, not a loss");
    eq(hasUnreadDebtBalances(store), false, 'a recovered balance does not suppress the claim');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '…so the celebration still fires');
  }

  /**
   * ⛔ **FIELD-SPECIFICITY, WHICH IS A FIX AND NOT A NARROWING.** [A ⓪-5's minor] S1.1's ⓪-3 made an
   * absent required `apr` record a repair. The inline guard tested only `entity === 'debt'`, so it began
   * suppressing a TRUE celebration over a field that says nothing about whether balances were read.
   */
  {
    const store = runMigrations({
      version: 8,
      paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
      // no `apr` key → a required-field loss is recorded, on a debt whose balance is perfectly readable
      debts: [{ id: 'd0', name: 'Card', balance: 0, minimumPayment: 25, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
      prefs: { onboardingComplete: true },
    });
    const aprRepair = store.pendingDataRepairs.find((r) => r.field === 'apr');
    if (!aprRepair) fail('the fixture no longer produces an apr repair — ⓪-3 may have changed');
    eq(hasUnreadDebtBalances(store), false, '⛔ an unread APR does not make the BALANCES unread');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '…so a real celebration is not suppressed');
  }

  /** The goals branch — `0 >= 0` badges a goal Funded, which is the claim `unreadGoals` guards. */
  {
    const lost = migrated([100], 'wat');
    eq(mayClaim(lost, 'goal-amounts'), false, 'an unreadable goal target is unread');
    const recovered = migrated([100], '1,000');
    eq(recovered.goals[0]!.targetAmount, 1000, "'1,000' is read correctly");
    eq(mayClaim(recovered, 'goal-amounts'), true, '⛔ …and a recovered target does NOT suppress "Funded"');
  }

  /**
   * ⛔ **THE COMPLETENESS GATE — every field the repair layer can write must be ROUTED to a claim.**
   * [S1.9.2 · pass-2 C2 · C4]
   *
   * ⚡ Pass 2 found the trust rule wired to a SUBSET of fields three separate ways in one round. A list of
   * fields decays silently; this makes it red instead. `migrations.ts` declares what it can repair,
   * `trustSelectors.ts` declares where each one lands, and the two are compared here — so adding a money
   * field to `REPAIRABLE_MONEY_FIELDS` without deciding which claim it poisons fails the build's tests.
   *
   * ⚠️ Asserted in BOTH directions. A claim routing a field the repair layer cannot produce is a stale
   * entry, and a stale entry is a rule nobody has read since the field was renamed.
   */
  {
    /**
     * ⛔ **S1.11.2 [pass-4 C4-10] — A WILDCARD NO LONGER SATISFIES COMPLETENESS, BECAUSE IT SATISFIED
     * EVERYTHING.**
     *
     * The forward loop used to accept `routed.has(`${entity} *`)`, and `'row-figures'` routes
     * `debt: 'any'`, `requiredExpense: 'any'`, `livingExpense: 'any'` and `goal: 'any'` — **all four
     * entities**. So every repairable field of every entity passed by construction and **the loop could
     * not fail.** Measured: four new repairable money fields, one per entity, none routed by name, and
     * this block stayed green. ⚡ The only thing that redded was the hard-coded count below, whose
     * message says *raise the number* — the one action that clears it **without** deciding anything.
     *
     * ⚠️ **The wildcard is not wrong** — `'row-figures'` genuinely does poison any repaired money figure
     * a row prints. What was wrong is letting it answer a question it was never asked: *which claims does
     * this new field poison, beyond the catch-all?*
     *
     * ⛔ So completeness is now decided by **named** routes only, and a field whose sole route really is
     * the catch-all must say so **out loud, here, with a reason.** Adding a money field to
     * `REPAIRABLE_MONEY_FIELDS` now fails this test until someone chooses one or the other.
     */
    const CATCH_ALL_IS_THE_DECISION = new Map<string, string>([
      // ⛔ [.5.4a] `debt apr`, `debt scheduledPaymentAmount`, and the plan's cushionFloor · leanAmount ·
      // windfall · expenseReserveBalance are NAMED now, by `projected-balance` / `solved-projection`. Each
      // was recorded here as having no claim but the catch-all, and each moves a projected figure.
      // `goal-amounts` routes the goal entity wholesale and is the claim ABOUT goal money, so a goal
      // money field has no second claim to be decided against.
      ['goal targetAmount', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      ['goal currentAmount', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      ['goal priorityPerPaycheck', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      // ⛔ S1.13.7.6 [pass-6 B3-1] — the store's OWN money. The catch-all is genuinely the whole answer
      // here, for `goal-amounts`' reason: a repaired $0 in ANY of these makes the plan claim false,
      // because they are the line it is solved against, the income it is solved from, and the money it
      // allocates. There is no second claim to decide them against.
      // ⚠️ [.5.4a] Measured across six plan shapes: a lost `typicalAmount` moves no projected figure — its one
      // reader is `incomeLearning`'s lean suggestion — so no projection claim names it.
      ['plan typicalAmount', 'row-figures routes the plan entity wholesale; nothing that solves or requires the plan reads it, so no other claim names it'],
    ]);

    const named = new Set<string>();
    const wildcardEntities = new Set<string>();
    for (const route of Object.values(claimFields())) {
      for (const [entity, fields] of Object.entries(route)) {
        if (fields === 'any') wildcardEntities.add(entity);
        else for (const f of fields) named.add(`${entity} ${f}`);
      }
    }
    const repairable: string[] = [];
    for (const [entity, lists] of Object.entries(REPAIRABLE_MONEY_FIELDS)) {
      for (const f of [...lists.required, ...lists.optional]) repairable.push(`${entity} ${f}`);
    }
    // ⚠️ Counted by the test, not by me — my own hand count of this list was 9 and the assertion said 10.
    // ⛔ Its message no longer says "raise it": raising it clears this line and the loop below still reds,
    // because the new field is neither named by a claim nor recorded as a catch-all decision.
    eq(repairable.length, 15, 'the fixture knows how many repairable money fields there are (a new one must ALSO be routed or recorded below)');
    for (const key of repairable) {
      if (named.has(key)) continue;
      if (CATCH_ALL_IS_THE_DECISION.has(key)) continue;
      fail(
        `⛔ S1.11.2 [C4-10] — \`${key}\` can be repaired and NO claim NAMES it. A catch-all ('any') does ` +
          `not count: it routes every field of its entity, so it answers this question for everything and ` +
          `therefore for nothing. Name it in a claim in trustSelectors.ts, or add it to ` +
          `CATCH_ALL_IS_THE_DECISION with the reason the catch-all is genuinely the whole answer.`,
      );
    }
    for (const key of named) {
      if (!repairable.includes(key)) fail(`⛔ S1.9.2 — a claim routes \`${key}\`, which migrations.ts can no longer repair. Stale route.`);
    }
    // ⚠️ The reverse direction for the ledger itself: an entry naming a field the repair layer no longer
    // writes is a decision nobody has read since the field was renamed — the same staleness the loop
    // above refuses for named routes.
    for (const key of CATCH_ALL_IS_THE_DECISION.keys()) {
      if (!repairable.includes(key)) fail(`⛔ S1.11.2 [C4-10] — CATCH_ALL_IS_THE_DECISION records \`${key}\`, which migrations.ts can no longer repair. Stale entry.`);
      if (named.has(key)) fail(`⛔ S1.11.2 [C4-10] — \`${key}\` is BOTH named by a claim and recorded as catch-all-only. Remove the record; the claim decided it.`);
    }
    // ⚠️ And a wildcard route for an entity the repair layer cannot write at all is equally stale.
    for (const entity of wildcardEntities) {
      if (!repairable.some((k) => k.startsWith(`${entity} `))) fail(`⛔ S1.11.2 [C4-10] — a claim routes \`${entity} 'any'\`, but migrations.ts repairs no field of that entity. Stale route.`);
    }
  }

  /**
   * ⛔ **[.5.7 ② · backlog from `.5.4`'s `C3-11` before-scan] — THE CONTAINMENT LATTICE, PINNED.**
   *
   * `.5.3`'s `mayClaim('debt-balances') && mayClaim('row-figures')` was a no-op for 102 of 102 repair variants, because
   * `'row-figures'` routes every field of every entity. The outcomes were right and the reason was false, so no outcome
   * test could see it. ⚡ **Measured at `.5.7`: 12 ordered pairs where one claim's routes contain another's** — not only
   * "anything with row-figures". Pinned both ways: narrowing or widening any route reds with the pairs that moved, and
   * `lint:trust-claims` refuses a production conjunction over any pair below.
   */
  {
    const EXPECTED_CONTAINMENTS = [
      'debt-balances ⊑ row-figures',
      'goal-amounts ⊑ paycheck-plan',
      'goal-amounts ⊑ row-figures',
      'goal-amounts ⊑ solved-projection',
      'paycheck-plan ⊑ row-figures',
      'paycheck-plan ⊑ solved-projection',
      'projected-balance ⊑ row-figures',
      'projected-balance ⊑ solved-projection',
      'required-plan ⊑ paycheck-plan',
      'required-plan ⊑ row-figures',
      'required-plan ⊑ solved-projection',
      'solved-projection ⊑ row-figures',
    ];
    const cover = (claim: string): Set<string> => {
      const out = new Set<string>();
      for (const [entity, fields] of Object.entries(claimFields()[claim as keyof ReturnType<typeof claimFields>])) {
        const lists = (REPAIRABLE_MONEY_FIELDS as Record<string, { required: readonly string[]; optional: readonly string[] }>)[entity];
        const all = fields === 'any' ? [...(lists?.required ?? []), ...(lists?.optional ?? []), '(any)'] : [...fields];
        for (const f of all) out.add(`${entity}.${f}`);
      }
      return out;
    };
    const claims = Object.keys(claimFields());
    const measured: string[] = [];
    for (const a of claims) {
      for (const b of claims) {
        if (a === b) continue;
        const outer = cover(b);
        if ([...cover(a)].every((k) => outer.has(k) || (!k.endsWith('.(any)') && outer.has(`${k.split('.')[0]}.(any)`)))) measured.push(`${a} ⊑ ${b}`);
      }
    }
    measured.sort();
    eq(measured.join(' | '), EXPECTED_CONTAINMENTS.join(' | '), '⛔ the claim containment lattice is the one measured at .5.7 — a route that moved changes which conjunctions are vacuous');
    eq(measured.includes('debt-balances ⊑ solved-projection'), false, '⭐ the widget\'s debt-balances && solved-projection is a REAL conjunction — neither contains the other');
  }

  /**
   * ⛔ **[.5.7 ② · backlog from `.5.4a`] — EVERY LOST MONEY FIELD IS RECORDED UNDER A NAME `rowFieldUnread` CAN ASK FOR.**
   *
   * A lost pace is recorded under a SENTENCE, never under `priorityPerPaycheck`, so a named route or
   * `rowFieldUnread(…, 'priorityPerPaycheck')` is silently blind to it — which is why the goal routes are `'any'`.
   * ⚡ Measured at `.5.7` across all 15 repairable money fields: **14 recorded under their own name, 1 under a sentence.**
   * The one is named below with its reason; the NEXT field recorded under anything but its name reds here until it is.
   */
  {
    const SENTENCE_IS_THE_RECORD = new Map<string, string>([
      ['goal priorityPerPaycheck', 'the repairs card renders `field` as the sentence, and the stand-down consequence ("no longer funded ahead of your debt") is part of it; every goal route is `any` for this reason'],
    ]);
    const rows: Record<string, Record<string, unknown>> = {
      debt: { id: 'x', name: 'Row', balance: 100, minimumPayment: 25, apr: 20, originalBalance: 200, scheduledPaymentAmount: 50, dueDate: DAY, type: 'debt', recurrence: 'monthly' },
      goal: { id: 'x', name: 'Row', targetAmount: 1000, currentAmount: 100, type: 'savings', priority: true, priorityPerPaycheck: 50 },
      requiredExpense: { id: 'x', name: 'Row', amount: 100, dueDate: DAY, recurrence: 'monthly' },
      livingExpense: { id: 'x', name: 'Row', amount: 100 },
    };
    const listKey: Record<string, string> = { debt: 'debts', goal: 'goals', requiredExpense: 'requiredExpenses', livingExpense: 'livingExpenses' };
    const planPlacement: Record<string, (v: unknown) => Record<string, unknown>> = {
      cushionFloor: (v) => ({ cushionFloor: v }),
      leanAmount: (v) => ({ paycheck: { amount: '2000', incomeVaries: true, leanAmount: v, typicalAmount: 2000 } }),
      typicalAmount: (v) => ({ paycheck: { amount: '2000', incomeVaries: true, leanAmount: 1500, typicalAmount: v } }),
      windfall: (v) => ({ windfall: v }),
      expenseReserveBalance: (v) => ({ expenseReserve: { balance: v } }),
    };
    let checked = 0;
    for (const [entity, lists] of Object.entries(REPAIRABLE_MONEY_FIELDS)) {
      for (const field of [...lists.required, ...lists.optional]) {
        const raw: Record<string, unknown> =
          entity === 'plan'
            ? (planPlacement[field] ?? fail(`⛔ .5.7 — plan field \`${field}\` has no placement here; add where a v8 store holds it`))('not a number')
            : { [listKey[entity]]: [{ ...rows[entity], [field]: 'not a number' }] };
        const store = runMigrations({ version: 8, ...raw });
        const lost = store.pendingDataRepairs.filter((r) => r.entity === entity && r.kind === 'lost');
        const key = `${entity} ${field}`;
        checked++;
        if (SENTENCE_IS_THE_RECORD.has(key)) {
          if (!(lost.length > 0 && !lost.some((r) => r.field === field))) fail(`⭐ ${key} is no longer recorded under a sentence — the exception is dead; remove it from SENTENCE_IS_THE_RECORD`);
          continue;
        }
        if (!lost.some((r) => r.field === field)) fail(`⛔ .5.7 — a LOST ${key} is recorded under ${JSON.stringify(lost.map((r) => r.field))}, not under its own name, so rowFieldUnread cannot ask for it. Record it under the field, or add it to SENTENCE_IS_THE_RECORD with the reason.`);
      }
    }
    eq(checked, 15, '⭐ every repairable money field was lost and read back — or the loop proves nothing');
  }

  /**
   * ⛔ **C4 — the SENTENCE was right about arrays that were wrong.** A `minimumPayment` the app could not
   * read repairs to `$0`, and `allocatePaycheck` emits neither an allocation row nor an unfunded item for
   * an obligation of `$0` — so the debt leaves the plan, `countOutstandingRequired` honestly returns 0,
   * and Today rendered [B5]'s exact sentence, *"You're caught up for this paycheck."*, in success green
   * over an unpaid $5,000 card. ⚠️ [B5]'s remedy is intact and untouched; this is the arrays.
   */
  {
    const unread = withMinimum('n/a');
    eq(hasUnreadDebtBalances(unread), false, 'the BALANCE was perfectly readable — B1’s guard is right to stay quiet');
    eq(mayClaim(unread, 'required-plan'), false, '⛔ C4 — …and the app may not state what this paycheck must cover');
    // ⚠️ THE CONTROL, and it is the whole point: the same fixture with a readable minimum must still let
    // the app say "caught up", or the fix has bought its correctness by refusing to speak at all.
    const read = withMinimum(150);
    eq(read.pendingDataRepairs.length, 0, 'control — a readable minimum records no repair');
    eq(mayClaim(read, 'required-plan'), true, '⭐ control — …and the plan claim is still allowed');
    // ⚠️ NOT the member of the class where the answers agree: an unread APR must NOT gag this claim.
    // It changes no obligation this cycle, and gagging on it is the over-match A1 was raised for.
    eq(mayClaim(withApr('n/a'), 'required-plan'), true, '⛔ C4 — an unread APR does not touch what is DUE');
    eq(mayClaim(withApr('n/a'), 'row-figures'), false, '…but the row may not print "0% APR" as if it read one');
  }

  /**
   * ⛔ **C2 — the guard was on one FIELD and absent from its twin.** `trustSelectors`' own docblock said
   * both sides of `currentAmount >= targetAmount` repair to `0`; both `money.tsx` consumers narrowed it to
   * `targetAmount === 0`, so a goal whose SAVED amount was lost printed its entire target as a remainder
   * with no caption at all.
   */
  {
    const store = goalsWith({ targetAmount: 1000, currentAmount: 'wat' });
    eq(rowFieldUnread(store, 'goal-amounts', 'goal', 'g1', 'targetAmount'), false, 'the TARGET was read — the old guard’s only question');
    eq(rowFieldUnread(store, 'goal-amounts', 'goal', 'g1', 'currentAmount'), true, '⛔ C2 — …and the SAVED amount was not, which nothing asked');
    // The other goal on the same store is untouched — the suppression is per ROW, never per screen.
    eq(rowFieldUnread(store, 'goal-amounts', 'goal', 'g2', 'currentAmount'), false, '⭐ control — a healthy goal beside it still states its number');
    const recovered = goalsWith({ targetAmount: 1000, currentAmount: '1,500' });
    eq(recovered.goals[0]!.currentAmount, 1500, "'1,500' is read correctly");
    eq(rowFieldUnread(recovered, 'goal-amounts', 'goal', 'g1', 'currentAmount'), false, '⭐ control — a RECOVERED amount is not an unread one');
  }

  /**
   * ⛔ **C3 — the finale was the claim site B1's owner never reached.** Measured on one store at one
   * instant: `selectPlanState` returned `debt-free-unverified` while the full-screen finale printed
   * *"$12,400 paid off · 2 debts"* over a $12,000 card the app could not read.
   */
  {
    const store = migrated(['n/a', 400]);
    const after = store.debts.map((d) => (d.id === 'd1' ? { ...d, balance: 0 } : d));
    const pending = { ...store, debts: after, pendingPayoff: detectPayoff(store.debts, after, store.payoffStrategy, unreadIdsOf(store), 1) };
    /**
     * ⛔ **S1.13.7.4 [pass-6 `B1-1`] — THIS ROW ASSERTED `finale` AND THAT WAS THE DEFECT.**
     *
     * The old reasoning was *"stamp the crossing, gate the render, so the moment survives the repair."*
     * ⚡ Measured: the gate is a **delay, not a filter**. The record outlives the condition it was gated
     * on, so the user answering the repair card — retyping the lost **$12,000** — is the very event that
     * both makes the record false *and* lifts the gag. The full-screen once-ever finale then fired over a
     * live $12,000 debt, reading *"$15,000 paid off · 1 debt"*, and it cannot be got back.
     *
     * ⚠️ **The moment is not lost by refusing to stamp it.** A portfolio with an unread balance is not
     * debt-free, so this crossing is a **beat**; the true finale fires later, at the real moment, when
     * that debt is actually cleared — asserted below.
     */
    eq(pending.pendingPayoff?.kind, 'beat', '⛔ B1-1 — an UNREAD balance is not a cleared one, so this is a beat and not the finale');
    eq(selectCelebration(pending)?.kind, 'beat', '…and a beat about the debt that really was paid is still honest');
    eq(selectPlanState(pending, selectAllocation(pending)), 'debt-free-unverified', '…which is what the banner was already saying');
    /**
     * ⭐ **THE ASSERTION THE SUITE STOPPED ONE SHORT OF** — the step B1-1 had to run by hand. Answer the
     * repair, and the finale must still not be claimed, because the debt is now known to be LIVE.
     */
    const repaired = {
      ...pending,
      debts: pending.debts.map((d) => (d.id === 'd0' ? { ...d, balance: 12000 } : d)),
      pendingDataRepairs: [],
    };
    eq(
      detectPayoff(pending.debts, repaired.debts, repaired.payoffStrategy, unreadIdsOf(repaired), 1)?.kind ?? null,
      null,
      '⛔ B1-1 — answering the repair reveals a LIVE debt; nothing about that is a debt-free finale',
    );
    // ⭐ THE CONTROL: the same crossing with every balance read must still celebrate.
    const clean = migrated([400]);
    const cleanAfter = clean.debts.map((d) => ({ ...d, balance: 0 }));
    const celebrating = { ...clean, debts: cleanAfter, pendingPayoff: detectPayoff(clean.debts, cleanAfter, clean.payoffStrategy, unreadIdsOf(clean), 1) };
    eq(selectCelebration(celebrating)?.kind, 'finale', '⭐ control — a real debt-free moment is NOT withheld');
  }

  /**
   * ⛔ **C3's beat half asks about ITS OWN debt, not the portfolio.** A beat names one debt and states that
   * debt's figures, so withholding it over an unrelated debt's repair would be the over-match A1 was
   * raised for — on the moment the product is built toward.
   */
  {
    const store = migrated(['n/a', 400, 900]);
    const after = store.debts.map((d) => (d.id === 'd1' ? { ...d, balance: 0 } : d));
    const beat = { ...store, debts: after, pendingPayoff: detectPayoff(store.debts, after, store.payoffStrategy, unreadIdsOf(store), 1) };
    eq(beat.pendingPayoff?.kind, 'beat', 'clearing one of several live debts is a beat');
    eq(selectCelebration(beat)?.kind, 'beat', '⭐ C3 — a beat about a READ debt survives another debt being unread');
    // …and the same beat about the unread debt does not.
    const own = store.debts.map((d) => (d.id === 'd0' ? { ...d, balance: 0 } : d));
    const ownBeat = { ...store, debts: own, pendingPayoff: detectPayoff(store.debts, own, store.payoffStrategy, unreadIdsOf(store), 1) };
    eq(ownBeat.pendingPayoff?.kind, undefined, 'a debt repaired to 0 never CROSSES, so no beat is stamped for it');
  }

  /**
   * ⛔ **C1 — a repair is a question, and nothing could answer it.** Retyping the balance the card asks for
   * changed nothing: `pendingDataRepairs` only ever grew, so the graduation banner, Money's cleared hero
   * and the Progress trophy were withheld for the life of the install.
   */
  {
    const s = storeWith(migrated(['']));
    eq(hasUnreadDebtBalances(s.getState().store), true, 'A — the import records the loss');
    s.getState().acknowledgeDataRepairs();
    // ⛔ THE CONTROL THAT MATTERS MOST. A-J2-1 is the blocker where one "Got it" tap restored "Every
    // balance cleared" over debts still owed; the ack must still change nothing for the guards.
    eq(hasUnreadDebtBalances(s.getState().store), true, '⭐ A-J2-1 — the ACK hides the card and answers nothing');
    s.getState().updateDebt('d0', { name: 'Renamed' });
    eq(hasUnreadDebtBalances(s.getState().store), true, '⭐ control — …and an edit to a DIFFERENT field answers nothing either');
    s.getState().updateDebt('d0', { balance: 1200 });
    eq(hasUnreadDebtBalances(s.getState().store), false, '⛔ C1 — retyping the number ANSWERS it');
    s.getState().updateDebt('d0', { balance: 0 });
    eq(selectPlanState(s.getState().store, selectAllocation(s.getState().store)), 'debt-free', '…so paying it off is celebrated, which it never was');
    // …and it stays answered across a reload, which is where C1 was measured.
    const reloaded = runMigrations(JSON.parse(JSON.stringify(s.getState().store)));
    eq(hasUnreadDebtBalances(reloaded), false, '⛔ C1 — the answer SURVIVES the round-trip that used to re-merge it');
  }

  /**
   * ⛔ **CONFIRMING A BALANCE IS THE ONE ANSWER THAT MOVES NOTHING**, so the class rule cannot see it and
   * the action states it. ⚠️ The fixture confirms at the SAME date `runMigrations` stamped and to the SAME
   * `0` the repair wrote — the member of the class where a `lastVerifiedDate` heuristic silently fails,
   * which is how the first cut measured green.
   */
  {
    const s = storeWith(migrated(['']));
    s.getState().verifyDebtBalance('d0', 0, DAY);
    eq(hasUnreadDebtBalances(s.getState().store), false, '⛔ C1 — a confirmed balance answers the repair, same value, same date');
    const batch = storeWith(migrated(['', 500]));
    batch.getState().verifyDebtBalances([{ id: 'd0', balance: 0 }], DAY);
    eq(hasUnreadDebtBalances(batch.getState().store), false, '⛔ C1 — …and the BATCH path answers it too, which is the flow the app asks for');
  }

  /**
   * ⛔ **A REPAIR NOTHING CAN BE OPENED FOR NEEDS AN ANSWER THAT IS NOT A DISMISSAL.** A `migration` record
   * names no row; a whole-row loss names no field. Neither can ever be re-supplied, so without an exit they
   * are permanent and every guard stays armed for the life of the install — and with the WRONG exit the app
   * resumes celebrating a portfolio it never read. ⚠️ `migration` keeps the ack; a whole-row loss takes the
   * explicit confirmation ([S1.11.4.8]).
   *
   * ⚠️ **The first cut dropped them at BOOTSTRAP** — `findRow` returns nothing for a `migration` entity, so
   * every v1.6 bridge loss read as *"the row is gone"*. `persistenceLifecycle.test.ts` caught it.
   */
  /**
   * ⛔ **S1.12.5.4 [pass-5 `B5-7`] — A DEBT WITH A BLANK NAME LOST ITS RECORD TO ONE "GOT IT" TAP, AND THE
   * APP THEN CALLED IT CLEARED.**
   *
   * `answerableByEdit` read `!!r.name` — whether the row's NAME STRING is empty, not whether the repair
   * names a row. `repairMoneyFields` writes `name: ''` when the key is absent, empty or not a string,
   * while the row still exists, still renders and is still editable. So `clearResuppliedRepairs` treated
   * the generic acknowledgement as a valid ANSWER, deleted the record, and `partitionDebts` moved the debt
   * into **`cleared`** — the app stating that a debt whose balance it could not read is **paid off**,
   * unlocking the debt-free framing, the trophy shelf and the once-ever finale over it.
   * ⚡ That is blocker `A-J2-1` verbatim, on the member of its class with a blank name.
   *
   * ⛔ **THE WHOLE CLASS IS ASSERTED, because every blank-name fixture in this repo paired the blank name
   * with a SYNTHETIC field or a `migration` entity — never with a real field on a real row.** Six such
   * fixtures were enumerated, and in every one the name half does not decide: `isWholeRowLoss` or the
   * entity test returns the same verdict either way. **The assertion pinning the name half was written on
   * the one shape where the name half is irrelevant.**
   */
  {
    const nameless = (name: unknown): DebtStore =>
      runMigrations({
        version: 8,
        paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
        debts: [{ id: 'd0', ...(name === undefined ? {} : { name }), balance: 'not-a-number', apr: 20, minimumPayment: 25, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
        goals: [],
        prefs: { onboardingComplete: true },
      }) as DebtStore;

    for (const [label, name] of [['absent', undefined], ['empty string', ''], ['not a string', 42]] as [string, unknown][]) {
      const s = storeWith(nameless(name));
      eq(hasUnreadDebtBalances(s.getState().store), true, `B5-7 premise — a debt whose name is ${label} still arms the unread guard`);
      // ⛔ ONE tap. `acknowledgeDataRepairs` moves the store, and the `set` wrapper runs
      // `clearResuppliedRepairs` on every patch that does — no second action is needed.
      s.getState().acknowledgeDataRepairs();
      eq(
        hasUnreadDebtBalances(s.getState().store),
        true,
        `⛔ B5-7 — "Got it" is not an ANSWER to an unreadable balance on an editable row (name ${label})`,
      );
      eq(
        mayClaim(s.getState().store, 'debt-balances'),
        false,
        `⛔ B5-7 — …so the portfolio claim stays gagged (name ${label})`,
      );
      eq(partitionDebts(s.getState().store).cleared.length, 0, `⛔ B5-7 — …and the debt is NOT called paid off (name ${label})`);
    }

    /**
     * ⭐ **THE CONTROL, and it is the whole reason `id` replaced `name` rather than the clause being
     * deleted.** A record that genuinely names no ROW — a whole-row loss, a whole-list loss, a `migration`
     * count — has no screen to open, and the acknowledgement IS its only possible answer. Dropping the
     * clause outright (the finding's own suggested plant) would strand those forever.
     */
    const migrationOnly = storeWith({
      ...migrated([100]),
      pendingDataRepairs: [{ entity: 'migration', id: '', name: '', field: '3 items were not recognised', kind: 'lost' }],
    });
    migrationOnly.getState().acknowledgeDataRepairs();
    eq(
      migrationOnly.getState().store.pendingDataRepairs.length,
      0,
      '⭐ B5-7 control — a migration count names no row, so the ack really is its only answer and still clears it',
    );
  }

  {
    const base = migrated([100]);
    // A whole ROW of the debts list was unreadable: no id, no name, no field — the loudest loss there is.
    const rowLost: DebtStore = {
      ...base,
      pendingDataRepairs: [{ entity: 'debt', id: '', name: '', field: '(a row could not be read)', kind: 'lost' }],
    };
    const s = storeWith(rowLost);
    eq(mayClaim(s.getState().store, 'debt-balances'), false, 'a lost ROW gags the portfolio claim — there is a debt nobody can see');
    s.getState().updateDebt('d0', { balance: 900 });
    eq(s.getState().store.pendingDataRepairs.length, 1, '⭐ control — editing a debt that CAN be read answers nothing about the one that cannot');
    eq(mayClaim(s.getState().store, 'debt-balances'), false, '⭐ control — …so the claim stays gagged');
    /**
     * ⛔ **S1.11.4.8 [🎯 2026-08-28] — THIS ASSERTION USED TO READ `length, 0`, AND THAT WAS THE DEFECT.**
     *
     * ⚡ Dropping the record on the ack ends the SUPPRESSION with it, so one *"Got it"* over an unreadable
     * portfolio put the app back on *"every balance is cleared"* — the sentence this whole module exists
     * to prevent. Measured at `S1.11.4.1`, taken to Jason as a product call, and decided: **the ack
     * silences the card and does not verify the data.**
     *
     * ⚠️ The old comment argued the ack was *"the only answer that exists for a record naming nothing"*.
     * It was the only answer OFFERED; `resolveUnreadableRows` is the one that actually settles the
     * question, and it says something true — *these are all my debts* — rather than merely dismissing.
     */
    s.getState().acknowledgeDataRepairs();
    eq(s.getState().store.pendingDataRepairs.length, 1, '⛔ the ack does NOT settle it — the card hides and the data is still unread');
    eq(mayClaim(s.getState().store, 'debt-balances'), false, '⛔ …so the claim stays gagged through the acknowledgement');
    s.getState().resolveUnreadableRows('debt');
    eq(s.getState().store.pendingDataRepairs.length, 0, '⭐ the user confirming their portfolio is what settles it');
    eq(mayClaim(s.getState().store, 'debt-balances'), true, '⭐ …and the claim comes back, so the state has an exit');
    eq(mayClaim(s.getState().store, 'debt-balances'), true, '…so the app can speak again, which under C1 it never could');

    // ⚠️ A `migration` record is settled the same way — and DELIBERATELY gags nothing while it stands.
    // It reports keys the v1.6 bridge never understood ("debtPlanner.rolloverCount"), which says nothing
    // about whether a balance was misread; gagging on it would be the over-match A1 was raised for.
    const bridge = storeWith({
      ...base,
      pendingDataRepairs: [{ entity: 'migration', id: '', name: '', field: '3 items from your old version were not recognised', kind: 'lost' }],
    });
    eq(mayClaim(bridge.getState().store, 'debt-balances'), true, '⚠️ a v1.6 bridge loss is not a claim about a MONEY FIELD');
    bridge.getState().acknowledgeDataRepairs();
    eq(bridge.getState().store.pendingDataRepairs.length, 0, '…and it settles on the ack, so it cannot accumulate forever');
  }

  /**
   * ⛔ **THE PLAN'S OWN MONEY — the suite's FIRST `plan`-entity fixtures.**
   * [S1.13.7.12.6.5.2 · pass-7 `C1-1` `C1-2`]
   *
   * ⚡ **Measured before these were written**: across all 8 files that construct repairs the entities used
   * were **debt 24 · goal 6 · migration 4 · requiredExpense 2 · livingExpense 1 · plan 0** — while
   * `migrations.ts:299` emits plan repairs in production and `CLAIM_FIELDS['required-plan'].plan` routes
   * them wholesale. **The entire plan-money trust path was exercised by nothing**, which is how `C1-2`
   * stayed open through seven passes: no test could have failed.
   */
  {
    const withFloor = (cushionFloor: unknown): DebtStore =>
      runMigrations({
        version: 8,
        paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
        debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
        cushionFloor,
        prefs: { onboardingComplete: true },
      });

    const lost = withFloor('abc');
    const real = withFloor(350);
    const zero = withFloor(0);

    /**
     * ⛔ **A LOST `$0` AND A LEGITIMATE `$0` ARE BYTE-IDENTICAL, and only the repair record separates
     * them.** `setCushionFloor` clamps with `Math.max(0, …)` so a user can genuinely hold a `$0` line,
     * and `readMoney` repairs an unreadable one to `0`. ⚡ **This pair is why no fallback spelling could
     * have fixed `C1-1`**: `??` fires on neither (both are numbers) and `||` converts both to the
     * default. The findings' remedy — *"make `??` catch the repaired 0"* — was unbuildable.
     */
    eq(lost.cushionFloor, 0, 'an unreadable line is repaired to 0…');
    // ⚠️ [`.5.4d`] Asked of `'paycheck-plan'`, the claim `cushionLine` asks now — `'required-plan'` no longer routes the line.
    eq(rowFieldUnread(lost, 'paycheck-plan', 'plan', '', 'cushionFloor'), true, '…and the REPAIR RECORD is what says so');
    eq(zero.cushionFloor, 0, '⛔ a LEGITIMATE $0 line holds the same value as the lost one…');
    eq(rowFieldUnread(zero, 'paycheck-plan', 'plan', '', 'cushionFloor'), false, '⛔ …and is NOT unread — the pair the whole fix rests on');
    eq(rowFieldUnread(real, 'paycheck-plan', 'plan', '', 'cushionFloor'), false, '⭐ control — a readable line is not unread');

    // The owner reports both halves, and substitutes the default ONLY when the line was lost.
    eq(cushionLine(lost).unread, true, 'the owner reports the loss…');
    eq(cushionLine(lost).value, DEFAULT_CUSHION_FLOOR, '…and computes on the default, never the sentinel 0');
    eq(cushionLine(zero).value, 0, '⛔ …while a real $0 line stays $0 — substituting there would INVENT a line');
    eq(cushionLine(real).value, 350, '⭐ control — a readable line is itself');

    eq(
      answerableByEdit({ entity: 'plan', id: '', name: 'your cushion line', field: 'cushionFloor', kind: 'lost' }),
      true,
      '⛔ C1-2 — the plan is answerable: it has a sheet, even though it is not a ROW',
    );
    eq(
      answerableByEdit({ entity: 'debt', id: '', name: '', field: '(a row could not be read)', kind: 'lost' }),
      false,
      '⛔ …and a whole-ROW loss still is NOT — it shares `id: \'\'`, so `isWholeRowLoss` stays load-bearing',
    );
  }

  {
    /**
     * ⛔ **THE EXIT, AND THE FAIL-OPEN GUARD BESIDE IT.** [`C1-2`]
     *
     * `clearResuppliedRepairs` settles on signal 1 (*the number moved*) or signal 2 (*the row is gone*).
     * ⚠️ **The plan owns no list**, so `findRow` returns `undefined` and signal 2 would read "the row is
     * gone" — **dropping every plan-money repair on the next store write.** ⛔ That is a fail-OPEN the
     * `C1-2` fix INTRODUCES unless the plan is branched before `findRow`, and the second case is what
     * refuses it: delete the `r.entity === 'plan'` branch and it goes red.
     */
    const seed = withPlanRepair();
    eq(seed.pendingDataRepairs.filter((r) => r.field === 'cushionFloor').length, 1, 'the fixture really does carry a plan repair');

    // ⭐ The answer: the user sets their line again, through the REAL wired action, so the patch goes
    // through the `set` wrapper where `clearResuppliedRepairs` lives.
    const answered = storeWith(seed);
    answered.getState().setCushionFloor(350);
    eq(
      answered.getState().store.pendingDataRepairs.filter((r) => r.field === 'cushionFloor').length,
      0,
      '⛔ C1-2 — re-entering the line ANSWERS the repair; before this it stood until the ack',
    );

    // ⛔ THE GUARD. Same action, same store, a value that MOVES NOTHING (already 0, snapped to 0).
    const untouched = storeWith(seed);
    untouched.getState().setCushionFloor(0);
    eq(
      untouched.getState().store.pendingDataRepairs.filter((r) => r.field === 'cushionFloor').length,
      1,
      '⛔ …and a write that moves NOTHING may not settle it — `findRow` would have dropped it as "the row is gone"',
    );
  }

  /**
   * ⛔ **`.5.4a` — A PROJECTION CLAIM REFUSES EXACTLY WHEN ITS FIGURE MOVES.** [pass-7 class 5]
   *
   * `.5.3`'s predicate was `mayClaim('debt-balances') && mayClaim('row-figures')`, and `'row-figures'` routes
   * `'any'` for every entity — so the first conjunct never decided anything and a lost GOAL target blanked
   * the user's debt total. ⚡ The obvious narrowing to debt fields is the opposite error: a lost rent amount
   * moves the debt-free date EARLIER and a debt-only route states it.
   *
   * ⭐ **So the claim is asserted against the figure, per repair variant, in both directions.** A route that
   * refuses on a variant no fixture can move is over-suppression; a variant that moves the figure on any
   * fixture while the route says yes is a hole. ⚠️ The fixture set is part of the proof — the first probe's
   * zero-length pay window moved nothing a plan reads, which is why each input below is shown to be consumed
   * and why "moves" is the union across six shapes rather than one.
   */
  {
    type Shape = { name: string; income: number; variable: boolean; big: boolean; pace: boolean; clearing?: boolean; filling?: boolean; capping?: boolean; autopay?: boolean };
    const BASE_SHAPES: Shape[] = [
      { name: 'tight-fixed', income: 1400, variable: false, big: true, pace: true },
      { name: 'tight-var', income: 1400, variable: true, big: true, pace: true },
      { name: 'tight-nopace', income: 1400, variable: false, big: true, pace: false },
      { name: 'loose-fixed', income: 2400, variable: false, big: false, pace: true },
      { name: 'loose-nopace', income: 2400, variable: false, big: false, pace: false },
      { name: 'loose-var', income: 2400, variable: true, big: false, pace: true },
      // ⛔ [`.5.4b` · `C3-11`] A runway only feels an APR when a debt CLEARS inside it, and a saved amount only
      // when a goal FILLS inside it. Without these two, the forecast read both as over-suppression.
      { name: 'clearing', income: 1800, variable: false, big: false, pace: true, clearing: true },
      { name: 'filling', income: 2400, variable: false, big: false, pace: false, filling: true },
      // ⛔ [`.5.4d`] A capped snowball, a short paycheck and one at the floor — each found movers the shapes above
      // could not show: groceries move the required rows only on a short paycheck.
      { name: 'capping', income: 2600, variable: false, big: false, pace: false, capping: true },
      { name: 'short', income: 900, variable: false, big: true, pace: true },
      { name: 'at-floor', income: 1250, variable: false, big: true, pace: false },
    ];
    // ⚠️ Every shape twice — an autopay amount SHADOWS the minimum, so a lost minimum is invisible on the half that has one.
    const SHAPES: Shape[] = [...BASE_SHAPES.map((s) => ({ ...s, autopay: true })), ...BASE_SHAPES.map((s) => ({ ...s, name: `${s.name}+noautopay`, autopay: false }))];
    const NEXT = '2026-09-09';
    const ANCHOR = '2026-03-01';
    const LIST: Record<string, string> = { debt: 'debts', requiredExpense: 'requiredExpenses', livingExpense: 'livingExpenses', goal: 'goals' };
    type Raw = Record<string, any>;
    // ⚠️ Every date is the fixture's own clock — `currentDate: DAY` — so nothing here ages against the run date.
    const rawShape = (sh: Shape): Raw => {
      const b = sh.big ? 3 : 1;
      return {
        version: 8,
        paycheck: { amount: String(sh.income), currentDate: DAY, nextPaycheckDate: NEXT, incomeVaries: sh.variable, leanAmount: Math.round(sh.income * 0.75), typicalAmount: sh.income },
        debts: [
          { id: 'd0', name: 'Chase', balance: 5000 * b, originalBalance: 6000 * b, minimumPayment: 150 * b, ...(sh.autopay ? { scheduledPaymentAmount: 200 * b } : {}), apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
          { id: 'd1', name: 'Visa', balance: sh.clearing ? 420 : sh.capping ? 900 : 3000 * b, originalBalance: 3500 * b, minimumPayment: sh.capping ? 25 : 90 * b, ...(sh.autopay ? { scheduledPaymentAmount: 120 * b } : {}), apr: sh.capping ? 29 : 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
        ],
        requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 600, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
        livingExpenses: [{ id: 'l0', name: 'Groceries', amount: 150, enabled: true }],
        goals: [{ id: 'g0', name: 'Trip', targetAmount: 1000, currentAmount: sh.filling ? 930 : 200, ...(sh.pace ? { priorityPerPaycheck: 40 } : {}), priority: true, type: 'savings' }],
        cushionFloor: 250,
        windfall: 300,
        expenseReserve: { balance: 300 },
        prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
      };
    };
    const premium = (raw: unknown): DebtStore => ({ ...runMigrations(raw), subscriptionPlan: 'premium' });

    /** Where each repairable field lives in a raw file, keyed by the names `REPAIRABLE_MONEY_FIELDS` declares. */
    const setField = (r: Raw, entity: string, row: number, field: string, to: (old: unknown) => unknown): void => {
      if (LIST[entity]) r[LIST[entity]][row][field] = to(r[LIST[entity]][row][field]);
      else if (field === 'leanAmount' || field === 'typicalAmount') r.paycheck[field] = to(r.paycheck[field]);
      else if (field === 'expenseReserveBalance') r.expenseReserve.balance = to(r.expenseReserve.balance);
      else r[field] = to(r[field]);
    };
    const summaryOf = (e: DebtStore) => {
      const a = selectAllocation(e);
      return a ? selectPlanSummary(e, a, selectRequiredRows(e, a)) : null;
    };

    /**
     * The figures each claim licenses — what a surface asking it goes on to print. ⛔ [`.5.4b` · `C3-11`] Asserted
     * PER SURFACE, not per claim: `'solved-projection'` was first validated against its whole family, and a
     * surface drawing only part of that family can be over-suppressed by a repair that moves the rest.
     */
    const SURFACES: { claim: 'projected-balance' | 'solved-projection' | 'paycheck-plan' | 'required-plan'; name: string; figure: (s: DebtStore) => string }[] = [
      {
        claim: 'projected-balance',
        name: "Money's total",
        figure: (s) => {
          const cpm = payCyclesPerMonth(s.paycheck.payCycle);
          return String(s.debts.filter((d) => d.balance > 0).reduce((t, d) => t + selectDebtBalanceView(d, s.paycheck.currentDate, true, cpm).currentBalance, 0));
        },
      },
      {
        claim: 'solved-projection',
        name: 'the payoff family',
        figure: (s) => {
          const engine = withProjectedBalances(s, true);
          // ⚠️ `order` and `focus` carry whole debt objects, so a lost `originalBalance` changes their JSON without
          // changing the ranking — measured on both. Compared by id, which is what a surface prints.
          const { order, focus, ...view } = selectPayoffView(engine);
          return JSON.stringify([view, order.map((d) => d.id), focus?.id, selectWhatIf(engine, 100), selectCashTimeline(engine, 6), selectWaterFillPlan(engine), effectivePaycheckBuffer(engine)]);
        },
      },
      {
        claim: 'solved-projection',
        name: 'the cushion forecast',
        // Exactly what `cushion-forecast.tsx` draws. The scorecard beside it is stored history and asks nothing.
        figure: (s) => {
          const engine = withProjectedBalances(s, true);
          return JSON.stringify([selectCashTimeline(engine, 6), selectWaterFillPlan(engine), effectivePaycheckBuffer(engine)]);
        },
      },
      /**
       * ⛔ [`.5.4d` · DECISION 🎯 2026-09-13] The askers of the old `'required-plan'`, each on the claim measured exact
       * for its RENDERED fields — never the whole selector result, which carries debt objects a surface does not print.
       */
      {
        claim: 'solved-projection',
        name: "Today's plan hero",
        figure: (s) => {
          const m = summaryOf(withProjectedBalances(s, true));
          return m ? JSON.stringify([m.billsReserve, m.debtFreeDate, m.everydayHeld, m.remainingAfterRequired, m.requiredTotal, m.shortfall, m.status]) : 'null';
        },
      },
      {
        claim: 'required-plan',
        name: 'Required actions',
        figure: (s) => {
          const e = withProjectedBalances(s, true);
          const a = selectAllocation(e);
          return a ? JSON.stringify(selectRequiredRows(e, a).map((r) => [r.item.amount, r.item.category, r.item.label, r.item.reserveCovered, r.item.targetId, r.isAutopay, r.dueDate, r.view.isPaid, r.view.overdue, r.view.presumedPaid, r.view.autopayFailed])) : 'null';
        },
      },
      { claim: 'paycheck-plan', name: 'the Guardian brief', figure: (s) => JSON.stringify(selectPaydayGuardian(withProjectedBalances(s, true))) },
      { claim: 'paycheck-plan', name: 'Affordability', figure: (s) => JSON.stringify(selectAffordability(withProjectedBalances(s, true), 500)) },
      { claim: 'paycheck-plan', name: 'Windfall routing', figure: (s) => JSON.stringify(selectWindfallSplit(withProjectedBalances(s, true), 1000)) },
      {
        claim: 'paycheck-plan',
        name: 'the paywall lead',
        // `paywall.tsx` builds this summary off the RAW store.
        figure: (s) => {
          const m = summaryOf(s);
          return m ? JSON.stringify([m.shortfall, m.cushion, effectivePaycheckBuffer(s)]) : 'null';
        },
      },
    ];

    /**
     * ⚠️ **The over-suppressions the decision accepted, by exact key.** Each is asserted to STILL be one — a listed
     * key whose figure starts moving would otherwise be a hole the list hides — and any over-suppression NOT
     * listed reds as before. The paywall lead's seven are stated in the log: the only exact alternative was a
     * fifth claim for one pitch sentence.
     */
    const ACCEPTED_OVER = new Set<string>([
      "solved-projection · Today's plan hero · plan.leanAmount LOST",
      'paycheck-plan · Windfall routing · plan.windfall LOST',
      ...['debt[0].minimumPayment', 'debt[1].minimumPayment', 'goal.targetAmount', 'goal.currentAmount', 'goal.priorityPerPaycheck', 'goal WHOLE-ROW', 'goal WHOLE-LIST'].map(
        (v) => `paycheck-plan · the paywall lead · ${v}${v.includes('WHOLE') ? '' : ' LOST'}`,
      ),
    ]);

    type Variant = { name: string; lost: boolean; mutate: (r: Raw) => void };
    const variants: Variant[] = [];
    for (const [entity, lists] of Object.entries(REPAIRABLE_MONEY_FIELDS)) {
      // ⚠️ Every debt in turn: the debt that clears in-horizon is the SECOND one, and a first-debt-only sweep never reaches it.
      const rows = entity === 'debt' ? [0, 1] : [0];
      for (const field of [...lists.required, ...lists.optional]) {
        for (const row of rows) {
          const label = entity === 'debt' ? `debt[${row}].${field}` : `${entity}.${field}`;
          variants.push({ name: `${label} LOST`, lost: true, mutate: (r) => setField(r, entity, row, field, () => 'abc') });
          variants.push({ name: `${label} recovered`, lost: false, mutate: (r) => setField(r, entity, row, field, (o) => (o === undefined ? o : Number(o).toLocaleString('en-US'))) });
        }
      }
      if (LIST[entity]) {
        variants.push({ name: `${entity} WHOLE-ROW`, lost: true, mutate: (r) => { r[LIST[entity]][0] = 'garbage'; } });
        variants.push({ name: `${entity} WHOLE-LIST`, lost: true, mutate: (r) => { r[LIST[entity]] = 'garbage'; } });
      }
    }

    let sawBand = false;
    // ⚠️ A UNION, not per shape: a short paycheck funds no goal, and that is the shape's point. What the proof needs
    // is that SOME shape consumes each input, so its loss can be seen moving something.
    const consumed = new Set<string>();
    const verdict = new Map<string, { refused: Set<boolean>; moved: boolean }>();
    for (const sh of SHAPES) {
      const base = premium(rawShape(sh));
      eq(base.pendingDataRepairs.length, 0, `${sh.name} — the base fixture reads clean`);
      const alloc = selectAllocation(base);
      for (const a of alloc?.allocations ?? []) consumed.add(a.category);
      if ((alloc?.livingExpenseReserve ?? 0) > 0) consumed.add('living-expense');
      if (selectPayoffView(withProjectedBalances(base, true)).lean.length > 0) sawBand = true;
      const baseFigures = SURFACES.map((surface) => surface.figure(base));

      for (const v of variants) {
        const r = rawShape(sh);
        v.mutate(r);
        const s = premium(r);
        eq(s.pendingDataRepairs.some((x) => x.kind === 'lost'), v.lost, `${sh.name} · ${v.name} — the variant records ${v.lost ? 'a LOST' : 'no lost'} repair`);
        SURFACES.forEach((surface, i) => {
          const key = `${surface.claim} · ${surface.name} · ${v.name}`;
          const at = verdict.get(key) ?? { refused: new Set<boolean>(), moved: false };
          at.refused.add(!mayClaim(s, surface.claim));
          if (surface.figure(s) !== baseFigures[i]) at.moved = true;
          verdict.set(key, at);
        });
      }
    }
    for (const c of ['expense', 'minimum_debt', 'optional_goal', 'living-expense']) {
      eq(consumed.has(c), true, `some shape CONSUMES ${c} — a fixture set that ignores an input cannot show it moving`);
    }
    eq(sawBand, true, 'at least one shape draws the variable-income band, so a lost lean paycheck can move it');

    for (const [key, { refused, moved }] of verdict) {
      eq(refused.size, 1, `⛔ ${key} — a route's verdict is a property of the REPAIR, never of the fixture`);
      const refuses = [...refused][0];
      if (ACCEPTED_OVER.has(key)) {
        eq(refuses && !moved, true, `⛔ .5.4d — ${key} is listed as an ACCEPTED over-suppression and is no longer one`);
        continue;
      }
      if (refuses && !moved) fail(`⛔ .5.4a OVER-SUPPRESSION — ${key}: the claim refuses and no shape's figure moves`);
      if (!refuses && moved) fail(`⛔ .5.4a HOLE — ${key}: the figure moves and the claim still says yes`);
    }
    for (const key of ACCEPTED_OVER) eq(verdict.has(key), true, `⛔ .5.4d — ACCEPTED_OVER names ${key}, which no surface × variant produces`);

    // ⚠️ The split `C3-9` rests on: a lost APR moves every projection and says nothing about the balances.
    eq(mayClaim(withApr('n/a'), 'debt-balances'), true, '`debt-balances` still says YES on an unread APR — the confirmed figures survive');
    eq(mayClaim(withApr('n/a'), 'projected-balance'), false, '⛔ C3-8 — …and the projected total may not be stated');
    eq(mayClaim(withApr('n/a'), 'solved-projection'), false, '⛔ C3-9 — …nor the debt-free date');
  }

  /**
   * ⛔ **`.5.4c` — A PROJECTED $0 IS NOT A PAYOFF.** [pass-7 `C3-13` · DECISION 🎯 2026-09-13]
   *
   * A premium user with $100 left on a $120 minimum, verified two months ago, projects to $0 — and Today said
   * *"You're debt-free · Every balance is cleared"* four inches above the card asking them to confirm that very
   * payoff. ⚡ **Three readers, one cause**: plan state, the Guardian's *"To savings"* and the reserve release's
   * *"your savings"* all asked liveness of the PROJECTED store, where `balance` is the estimate.
   *
   * ⭐ **Fixed at the projection, so it is asserted over every reader at once**: handed a projected store, each
   * reader must answer exactly as it does on the confirmed store. ⚠️ Equality alone cannot tell a correct fix from
   * one that stopped projecting, so the controls below pin what must NOT change: the projection still reaches $0,
   * the invitation still names the debt, and a genuinely confirmed $0 still celebrates.
   */
  {
    const TWO_MONTHS_AGO = '2026-06-26';
    const lastCard = (balance: number, verified: string, plan: 'free' | 'premium'): DebtStore => ({
      ...runMigrations({
        version: 8,
        paycheck: { amount: '2200', currentDate: DAY, nextPaycheckDate: '2026-09-09' }, // fixture-date-ok: the store's clock is DAY; this suite passes with the run date pinned to 2020 and to 2031

        debts: [{ id: 'd0', name: 'Chase', balance, originalBalance: 5000, minimumPayment: 120, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: verified, lastVerifiedDate: verified }],
        requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
        cushionFloor: 200,
        prefs: { onboardingComplete: true },
      }),
      subscriptionPlan: plan,
      // A freed reserve is pending, so `selectReserveRelease` has a target to name.
      pendingReserveRelease: { tapped: false, covered: 100 },
    });

    const READERS: { name: string; read: (s: DebtStore) => string }[] = [
      { name: 'plan state', read: (s) => String(selectPlanState(s, selectAllocation(s))) },
      { name: "the Guardian brief's debt-free framing", read: (s) => String(selectPaydayGuardian(s)?.debtFree) },
      { name: "the reserve release's target", read: (s) => String(selectReserveRelease(s)?.targetName) },
    ];
    const CASES: { name: string; store: DebtStore }[] = [
      { name: 'premium · $100 left · projects to $0', store: lastCard(100, TWO_MONTHS_AGO, 'premium') },
      { name: 'premium · confirmed $0', store: lastCard(0, DAY, 'premium') },
      { name: 'premium · $4,000 · projects above $0', store: lastCard(4000, TWO_MONTHS_AGO, 'premium') },
      { name: 'free · $100 left', store: lastCard(100, TWO_MONTHS_AGO, 'free') },
    ];

    for (const { name, store } of CASES) {
      const isPremium = store.subscriptionPlan === 'premium';
      const projected = withProjectedBalances(store, isPremium);
      // ⚠️ Twice: a record that did not chain through would store the FIRST projection's $0 as "confirmed".
      const reprojected = withProjectedBalances(projected, isPremium);
      for (const reader of READERS) {
        eq(reader.read(projected), reader.read(store), `⛔ C3-13 · ${name} · ${reader.name} — a projection answers liveness from the confirmed balance`);
        eq(reader.read(reprojected), reader.read(store), `⛔ C3-13 · ${name} · ${reader.name} — …and so does a projection of a projection`);
      }
    }

    // ⭐ What must NOT change — each one is a way to make the equality above pass by breaking something else.
    const owed = lastCard(100, TWO_MONTHS_AGO, 'premium');
    eq(withProjectedBalances(owed, true).debts[0].balance, 0, 'control — the projection itself still reaches $0 (the fix may not stop projecting)');
    eq(selectPlanState(withProjectedBalances(owed, true), selectAllocation(withProjectedBalances(owed, true))), 'normal', '⛔ C3-13 — $100 still owed is not "debt-free"');
    eq(selectProvisionalPayoffs(owed, true).map((d) => d.name).join(), 'Chase', '⭐ control — the invitation to CONFIRM the payoff still names the debt');
    const confirmed = lastCard(0, DAY, 'premium');
    eq(selectPlanState(withProjectedBalances(confirmed, true), selectAllocation(withProjectedBalances(confirmed, true))), 'debt-free', '⭐ control — a genuinely confirmed $0 still celebrates');
  }
}

/** A migrated store whose cushion line could not be read — the plan-entity repair, through the real door. */
function withPlanRepair(): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
    cushionFloor: 'abc',
    prefs: { onboardingComplete: true },
  });
}
