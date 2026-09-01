import { REPAIRABLE_MONEY_FIELDS, runMigrations } from '@/data/migrations';
import { selectAllocation } from '@/store/selectors';
import { selectPlanState } from '@/store/planSelectors';
import { selectCelebration } from '@/store/celebrationSelectors';
import { detectPayoff } from '@/store/payoffCelebration';


import { createDebtStore } from '@/store/store';
import { claimFields, clearedDebts, hasUnreadDebtBalances, liveDebts, mayClaim, partitionDebts, rowFieldUnread } from '@/store/trustSelectors';
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
      // `apr` changes no obligation this cycle — it is stated by the row and nothing else, which is
      // exactly `row-figures`. `trustSelectors.ts` already records this as its only routing.
      ['debt apr', 'stated by the row and by nothing else — row-figures IS the decision'],
      // Autopay's scheduled amount is displayed on the row; it is not what the plan requires this
      // cycle (that is `minimumPayment`, which `required-plan` names).
      ['debt scheduledPaymentAmount', 'a displayed figure, not an obligation — required-plan names minimumPayment instead'],
      // `goal-amounts` routes the goal entity wholesale and is the claim ABOUT goal money, so a goal
      // money field has no second claim to be decided against.
      ['goal targetAmount', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      ['goal currentAmount', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      ['goal priorityPerPaycheck', 'goal-amounts is the claim about goal money; there is no second claim to decide'],
      // ⛔ S1.13.7.6 [pass-6 B3-1] — the store's OWN money. The catch-all is genuinely the whole answer
      // here, for `goal-amounts`' reason: a repaired $0 in ANY of these makes the plan claim false,
      // because they are the line it is solved against, the income it is solved from, and the money it
      // allocates. There is no second claim to decide them against.
      ['plan cushionFloor', 'required-plan routes the plan entity wholesale — every one of these is money the plan is solved FROM or AGAINST'],
      ['plan leanAmount', 'required-plan routes the plan entity wholesale — every one of these is money the plan is solved FROM or AGAINST'],
      ['plan typicalAmount', 'required-plan routes the plan entity wholesale — every one of these is money the plan is solved FROM or AGAINST'],
      ['plan windfall', 'required-plan routes the plan entity wholesale — every one of these is money the plan is solved FROM or AGAINST'],
      ['plan expenseReserveBalance', 'required-plan routes the plan entity wholesale — every one of these is money the plan is solved FROM or AGAINST'],
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
    const pending = { ...store, debts: after, pendingPayoff: detectPayoff(store.debts, after, store.payoffStrategy, unreadIdsOf(store)) };
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
      detectPayoff(pending.debts, repaired.debts, repaired.payoffStrategy, unreadIdsOf(repaired))?.kind ?? null,
      null,
      '⛔ B1-1 — answering the repair reveals a LIVE debt; nothing about that is a debt-free finale',
    );
    // ⭐ THE CONTROL: the same crossing with every balance read must still celebrate.
    const clean = migrated([400]);
    const cleanAfter = clean.debts.map((d) => ({ ...d, balance: 0 }));
    const celebrating = { ...clean, debts: cleanAfter, pendingPayoff: detectPayoff(clean.debts, cleanAfter, clean.payoffStrategy, unreadIdsOf(clean)) };
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
    const beat = { ...store, debts: after, pendingPayoff: detectPayoff(store.debts, after, store.payoffStrategy, unreadIdsOf(store)) };
    eq(beat.pendingPayoff?.kind, 'beat', 'clearing one of several live debts is a beat');
    eq(selectCelebration(beat)?.kind, 'beat', '⭐ C3 — a beat about a READ debt survives another debt being unread');
    // …and the same beat about the unread debt does not.
    const own = store.debts.map((d) => (d.id === 'd0' ? { ...d, balance: 0 } : d));
    const ownBeat = { ...store, debts: own, pendingPayoff: detectPayoff(store.debts, own, store.payoffStrategy, unreadIdsOf(store)) };
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
}
