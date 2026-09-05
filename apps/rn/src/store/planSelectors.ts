import { EMERGENCY_FUND_NOUN, GOALS_DESTINATION, OVERDUE_LABEL } from '@core/copy/vocabulary';
import { effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
import { computeStreak } from '@core/debt/computeStreak';
import { deriveRequiredActionView, type RequiredActionView, type RequiredAllocationItem } from '@core/debt/deriveRequiredActionView';
import { PROTECTED_CUSHION_CATEGORIES, type UnfundedRequiredItem } from '@core/engine/allocatePaycheck';
import { DEBT_FREE_DATE_UNPAYABLE, projectDebtPayoff } from '@core/debt/projectDebtPayoff';
import { selectActiveRecommendedActions } from '@core/debt/selectActiveRecommendedActions';
import { computeState } from '@core/guardian/computeState';
import { toCushionStatus } from '@core/timeline/buildMultiCycleTimeline';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { DebtStore } from '@/data/models';
import { nettedTopUp } from '@/store/topUpSelectors';
import { debtLiveness } from '@/store/trustSelectors';

import { effectivePaycheckBuffer, selectAllocation, selectSteadyStateAllocation, type Allocation } from './selectors';

export type ActiveRecommendedAction = ReturnType<typeof selectActiveRecommendedActions>[number];

const REQUIRED_CATEGORIES = ['expense', 'minimum_debt', 'autopay_expense', 'autopay_debt'];

/** A required-action row: the allocation item + its derived display state (paid/overdue/autopay/…). */
export interface RequiredRow {
  item: RequiredAllocationItem;
  view: RequiredActionView;
  isAutopay: boolean;
  dueDate?: string;
}

/** The id a required row is checked off by — the same key the payday sheet's checkbox writes. */
export function requiredRowId(row: RequiredRow): string | undefined {
  const isExpense = row.item.category === 'expense' || row.item.category === 'autopay_expense';
  return isExpense ? row.item.targetId : (row.item.debtId ?? row.item.targetId);
}

/**
 * Split the payday sheet's required rows into what the user confirmed paid and what carries.
 *
 * ⛔ **[S1.13.7.11 · pass-6 D3-5] BOTH FIGURES COME OFF THE SAME ARRAY, and that is the whole point.**
 * The sheet used to print `allocation.totalRequired - carryForward`, and those are two different
 * populations: `totalRequired` sums the items due before the next paycheck, while `selectRequiredRows`
 * above adds the re-add block — required items marked paid this cycle whose due date lands AFTER the
 * next paycheck, restored so a paid bill never silently vanishes. Each is a tappable checkbox, so
 * unticking them drove the subtraction negative and the sheet said **`-$250 paid`** about the user's
 * own money (measured on real producers in `paydayRequiredSplit.test.ts`).
 *
 * ⛔ **A `Math.max(0, …)` clamp is the forbidden remedy** — `formatCurrency`'s own header calls that
 * "the exact hide-money behaviour", and it would read *"$0 paid"* while the user looks at rows they
 * just marked paid. Reducing the complement over the same array makes `paid` a real sum: non-negative
 * by construction, and `paid + carries` is identically the rows' total.
 *
 * A row with no id cannot be checked off, so it counts as paid — matching the `?? true` default the
 * sheet's own checkbox state uses.
 *
 * ⛔ **[S1.13.7.11 · pass-6 C1-4] NET AND GROSS ARE BOTH RETURNED, AND THEY ARE NOT INTERCHANGEABLE.**
 * `item.amount` is what THIS PAYCHECK puts in; the biller is owed `amount + reserveCovered`
 * (`allocatePaycheck.ts:101-104`). A sentence ABOUT THE BILL must use **gross** — a $350 rent fully
 * covered by the reserve has `amount === 0`, so the sheet announced *"All confirmed paid"* about a bill
 * the user had just marked *"Didn't pay"*, and showed **$0.00** for it. ⛔ But `capturedTotal` must keep
 * **net**: `allocatePaycheck.ts:330-353` nets the reserve draw out of `totalRequired` too, so subtracting
 * a gross carry from a net total would under-report the capture by the reserve share — the mirror of the
 * same bug. `RequiredActionsCard` already got this right at `[T6.6 · L4-6]`; the fix stopped at the
 * reported card while this sheet consumed the SAME `RequiredRow[]` from the same `selectRequiredRows`.
 *
 * ⛔ **`anyUnpaid` exists because a verdict about the user's own answers must not be derived from money.**
 * The sheet keyed *"All confirmed paid"* on `carryForward > 0`, which is zero for a fully-covered bill
 * whatever the user answered. It reads the `requiredPaid` map now.
 */
export function selectRequiredSplit(
  rows: RequiredRow[],
  requiredPaid: Record<string, boolean>,
): { paid: number; carries: number; paidGross: number; carriesGross: number; anyUnpaid: boolean } {
  let paid = 0;
  let carries = 0;
  let paidGross = 0;
  let carriesGross = 0;
  let anyUnpaid = false;
  for (const row of rows) {
    const id = requiredRowId(row);
    const net = row.item.amount;
    const gross = net + Math.max(0, row.item.reserveCovered ?? 0);
    if (id && requiredPaid[id] === false) {
      anyUnpaid = true;
      carries += net;
      carriesGross += gross;
    } else {
      paid += net;
      paidGross += gross;
    }
  }
  return { paid, carries, paidGross, carriesGross, anyUnpaid };
}

/** Sum of one or more allocation categories. */
export function sumCategory(allocation: Allocation, ...categories: string[]): number {
  const set = new Set(categories);
  return allocation.allocations.filter((a) => set.has(a.category)).reduce((sum, a) => sum + a.amount, 0);
}

/** Sum of the "snowball" allocations — the extra beyond minimums (feeds the debt-free projection). */
export function selectExtraToDebt(allocation: Allocation): number {
  return sumCategory(allocation, 'snowball');
}

/** Spare "put to work" toward the emergency fund + savings goals this cycle — the debt-free deploy
 *  target (2.4.8 graduation). Once there's no debt, this is where the Guardian's spare lands, so the
 *  brief's "deployed" figure reads off it instead of the (now always-$0) snowball. */
export function selectDeployedToSavings(allocation: Allocation): number {
  return sumCategory(allocation, 'starter_emergency', 'emergency', 'optional_goal');
}

/** 3.7.A3.2 — the rungs that fund BEFORE the snowball: the starter EF and any PRIORITY savings goal.
 *  Distinct from the sibling above, which also counts the post-debt rungs. These two are the ones that
 *  can zero `selectExtraToDebt` while real money leaves the cushion — which is what made the Guardian's
 *  clear-branch copy untrue ("keeps all of it as your cushion" over an $800 transfer into a goal). */
export function selectDeployedBeforeDebt(allocation: Allocation): number {
  return sumCategory(allocation, 'starter_emergency', 'optional_goal');
}

/** The single goal those rungs funded, for the copy — `null` when none or more than one took a share
 *  (the caller then says "your savings" rather than naming one of several). */
export function selectDeployedBeforeDebtGoalId(allocation: Allocation): string | null {
  const ids = new Set(
    allocation.allocations
      .filter((a) => (a.category === 'starter_emergency' || a.category === 'optional_goal') && a.amount > 0)
      .map((a) => a.goalId)
      .filter((id): id is string => !!id),
  );
  return ids.size === 1 ? [...ids][0] : null;
}

/** The protected cushion the plan KEEPS this cycle — ALL held buckets (§2.2 canonical: cushion_buffer +
 *  prefunded_reserve + discovery_holdback + true_leftover), what the floor protects. NOT the buffer alone
 *  (round-6 F1: held reserves must count as cushion or "put to work" over-counts them). */
export function selectLiquidCushion(allocation: Allocation): number {
  return sumCategory(allocation, ...PROTECTED_CUSHION_CATEGORIES);
}

/** Cash left after every obligation (required bills + minimums + living reserve) — the "will I make it" headroom. */
export function selectDiscretionary(allocation: Allocation): number {
  return Math.max(0, allocation.paycheckAmount - allocation.totalRequired - allocation.livingExpenseReserve);
}

/**
 * T4.1b — cash the user can actually SPEND this cycle.
 *
 * ⛔ **This is NOT `selectDiscretionary`, and the difference is load-bearing.** `selectDiscretionary`
 * is the PARTITION TOTAL: `testExpenseReserve.ts` asserts `sum(ALL_BUCKETS) === discretionary(r)`, so
 * every bucket — including 3.8's `expense_reserve` — sums to it. The engine's own invariant is that a
 * reserve is *"GONE from cycle 1's spendable"*, and that is asserted about `true_leftover`, never about
 * `discretionary`. **Do not "fix" `selectDiscretionary` by subtracting the hold — it would break the
 * partition invariant across the engine suite.**
 *
 * ⚠️ Measured: with $1,200 in, $350 of in-cycle rent and $175 reserved, `selectDiscretionary` reads
 * **850** while the money the user may actually spend is **675** — and the Today tab printed BOTH, as
 * "Flexible $675" (`PlanHero`) and "about $850 spare this paycheck" (`AffordabilityCard`), a tap apart.
 * Both figures were individually correct, which is why six lint gates and 187 e2e could not see it.
 *
 * The Guardian's BAND does not use this: `computeState` compares against `effectivePaycheckBuffer`, and
 * the engine clamps the hold so `discretionary − held ≥ floor` always ("clamp: cannot hold more than is
 * spare"). Those sites are bounded to a narrow hysteresis window and are recorded against T6.
 */
export function selectSpendable(allocation: Allocation): number {
  return Math.max(0, selectDiscretionary(allocation) - (allocation.expenseReserveHeld ?? 0));
}

/** The §2.0 held reserve within the cushion — the uncertainty/prefunded buckets the Guardian sets aside
 *  (the "Set aside" bar zone, §2.0.c). A subset of `selectLiquidCushion`; 0 when nothing is held back. */
export function selectHeldReserve(allocation: Allocation): number {
  return sumCategory(allocation, 'discovery_holdback', 'prefunded_reserve');
}

/** The estimated debt-free date under the current plan (via the shared payoff engine), or null.
 *  MF.4 (audit #5): projects on the STEADY-STATE deploy (temporary cold-start holdbacks stripped), not
 *  the current cycle's dampened allocation — otherwise a 3-cycle cold-start reserve is extrapolated
 *  across years and premium's date reads later than free's. */
export function selectDebtFreeDate(store: DebtStore, allocation: Allocation | null): string | null {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  if (!allocation || liveDebts.length === 0) return null;
  const steady = selectSteadyStateAllocation(store);
  const { estimatedDebtFreeDate } = projectDebtPayoff({
    debts: liveDebts,
    monthlyExtraPayment: selectExtraToDebt(steady ?? allocation) * payCyclesPerMonth(store.paycheck.payCycle),
    strategy: store.payoffStrategy,
    startDate: store.paycheck.currentDate,
    cyclesPerMonth: payCyclesPerMonth(store.paycheck.payCycle),
  });
  // [P6.4.4 · L6-6] ⚡ THIS is why the string is not copy: it is mapped to `null` before anything can
  // render it. The finding called it "a user-facing fallback"; measured, the user never sees it.
  return estimatedDebtFreeDate === DEBT_FREE_DATE_UNPAYABLE ? null : estimatedDebtFreeDate;
}

export interface DebtFreeBand {
  /** The motivational headline date (off the entered/typical income). */
  typical: string | null;
  /** The safe-floor date (off `leanAmount`) — null for fixed income. */
  lean: string | null;
  /** True only when income varies AND the two dates actually differ (else show one date). */
  hasBand: boolean;
}

/**
 * VIS-5 — the variable-income debt-free BAND. A single date over-promises for a variable-income user, so
 * this returns TWO: `typical` (headline) and `lean` (safe-floor, off `leanAmount`). "One engine, two runs"
 * — a pure derivation from data already captured (entered income · `leanAmount` from income-learning ·
 * debts · the payoff engine); NO schema/scaffolding. Fixed income (or no lean) → `hasBand` false, one date.
 */
export function selectDebtFreeBand(store: DebtStore): DebtFreeBand {
  const typical = selectDebtFreeDate(store, selectAllocation(store));
  if (!store.paycheck.incomeVaries || store.paycheck.leanAmount <= 0) {
    return { typical, lean: null, hasBand: false };
  }
  // The lean run = the SAME plan with income set to the lean figure → less extra-to-debt → a later date.
  const leanStore: DebtStore = { ...store, paycheck: { ...store.paycheck, amount: String(store.paycheck.leanAmount) } };
  const lean = selectDebtFreeDate(leanStore, selectAllocation(leanStore));
  return { typical, lean, hasBand: typical != null && lean != null && typical !== lean };
}

/** Required bills + debt minimums due this paycheck, each with its display state. */
export function selectRequiredRows(store: DebtStore, allocation: Allocation): RequiredRow[] {
  const build = (item: RequiredAllocationItem): RequiredRow => {
    const isExpense = item.category === 'expense' || item.category === 'autopay_expense';
    const dueDate = isExpense
      ? store.requiredExpenses.find((e) => e.id === item.targetId)?.dueDate
      : store.debts.find((d) => d.id === (item.debtId ?? item.targetId))?.dueDate;
    return {
      item,
      view: deriveRequiredActionView(item, store.requiredExpenses, store.debts, store.paycheck.currentDate),
      isAutopay: item.category === 'autopay_expense' || item.category === 'autopay_debt',
      dueDate,
    };
  };

  const rows = allocation.allocations.filter((item) => REQUIRED_CATEGORIES.includes(item.category)).map(build);

  // The allocation drops items already PAID this cycle — but they must stay visible (struck-through,
  // undo-able) so a paid bill never silently vanishes. Re-add any paid required item not already shown.
  const shownExpenses = new Set(
    rows.filter((r) => r.item.category === 'expense' || r.item.category === 'autopay_expense').map((r) => r.item.targetId),
  );
  const shownDebts = new Set(
    rows
      .filter((r) => r.item.category === 'minimum_debt' || r.item.category === 'autopay_debt')
      .map((r) => r.item.debtId ?? r.item.targetId),
  );
  const paidRows: RequiredRow[] = [
    ...store.requiredExpenses
      .filter((e) => e.isPaidThisCycle && !shownExpenses.has(e.id))
      .map((e) => build({ category: 'expense', targetId: e.id, label: `Pay ${e.name}`, amount: e.amount })),
    // `?? isPaidThisCycle` matches every other reader of a debt's paid state (the allocator,
    // `deriveRequiredActionView`, the rollover, autopay reconcile). `minimumPaidThisCycle` is optional
    // and pre-[D2] data carries only `isPaidThisCycle` — without the fallback the allocator drops such
    // a debt and this re-add declines to restore it, so the paid row vanishes instead of striking out.
    ...store.debts
      .filter((d) => (d.minimumPaidThisCycle ?? d.isPaidThisCycle) && d.balance > 0 && !shownDebts.has(d.id))
      /**
       * ⛔ **THE SEVENTH SITE — and the figure moved ON THE TAP.** [class 4 re-audit `F3`]
       *
       * ⚡ This row re-adds a debt the allocator dropped because its minimum is already paid, so the user
       * can see it struck through rather than vanished. It built the amount from the **raw**
       * `minimumPayment` while every other reader of the same obligation uses the in-window figure.
       * Measured, one $50 weekly debt in a 28-day window:
       *
       *     not ticked   allocator $200   the row the user reads  $200
       *     ticked       allocator $200   the row the user reads   $50
       *
       * ⛔ **Same debt, same window, same screen — the number fell 4× the instant it was tapped**, which
       * reads as "you owed less than it said" at exactly the moment the app is confirming you paid.
       *
       * ⚠️ `.4.9` corrected the site count from five to six and this was the **seventh**; the enumeration
       * has now been short three times in one class. It is `effectiveMinimumInWindow` here — the declared
       * ONE PRODUCER — capped at the balance, which is what the allocator's own row does.
       */
      .map((d) =>
        build({
          category: 'minimum_debt',
          targetId: d.id,
          debtId: d.id,
          label: `Pay minimum on ${d.name}`,
          amount: Math.min(
            effectiveMinimumInWindow(d, store.paycheck.currentDate, store.paycheck.nextPaycheckDate),
            d.balance,
          ),
        }),
      ),
  ];

  return [...rows, ...paidRows];
}

// ── On-plan streak (3.7.B.3 / F10.3) ─────────────────────────────────────────────

/**
 * A streak reads as a claim about the user's track record, so it does not start at one. At `1` the line
 * would appear the first time anyone completes a cycle and read as celebration of the ordinary; from `2`
 * it is describing an actual run. It is also what keeps the line off the demo **by construction** rather
 * than by a flag: `SANDBOX_MAX_HISTORY` clamps a sandbox to ONE cycle of history, so a day-one demo
 * cannot reach this floor however many rollovers are scripted through it.
 */
export const ON_PLAN_STREAK_MIN = 2;

/** Consecutive most-recent cycles where every AFFORDABLE required action was completed. Free-tier. */
export function selectOnPlanStreak(store: DebtStore): number {
  return computeStreak(store.cycleHistory);
}

/**
 * The Progress hero's streak caption, or `null` when there is nothing honest to say.
 *
 * ⚠️ [D27] — this is the FREE on-plan streak and it must never render beside the premium Guardian's
 * "Held your line · N paychecks" (`GuardianProofStrip`, inside `PaydayGuardianCard` on **Today**). They
 * are different claims — this one is "you did everything you could afford", that one is "your confirmed
 * cushion held" — but two streaks on one screen read as one feature said twice. Progress hosts this;
 * Today hosts that. ⚠️ The STRINGS are the wording/voice gate's, like B.2's greeting.
 */
export function selectOnPlanStreakLabel(store: DebtStore): string | null {
  const streak = selectOnPlanStreak(store);
  if (streak < ON_PLAN_STREAK_MIN) return null;
  return `${streak} paychecks on plan`;
}

// ── Required-action bucketing (Today scale, 1.5.4) ───────────────────────────────
export type RequiredBucketKey = 'overdue' | 'thisWeek' | 'nextWeek' | 'later' | 'handled';
export interface RequiredBucket {
  key: RequiredBucketKey;
  title: string;
  rows: RequiredRow[];
  total: number;
  defaultOpen: boolean;
}

/** Stable per-row identity (expense id or debt id) — for the "paid this visit" pin set. */
export function requiredRowKey(r: RequiredRow): string {
  const isExpense = r.item.category === 'expense' || r.item.category === 'autopay_expense';
  return `${isExpense ? 'e' : 'd'}:${r.item.debtId ?? r.item.targetId}`;
}

/** True when a row needs no action — paid, or an autopay presumed to have run. */
export function rowHandledNow(r: RequiredRow): boolean {
  return r.view.isPaid || (r.isAutopay && r.view.presumedPaid && !r.view.autopayFailed);
}

/** The obligation an unfunded shortfall belongs to, in `requiredRowKey`'s namespace so the two compare. */
export function unfundedItemKey(u: UnfundedRequiredItem): string {
  const isExpense = u.category === 'expense' || u.category === 'autopay_expense';
  return `${isExpense ? 'e' : 'd'}:${u.debtId ?? u.targetId}`;
}

/**
 * ⛔ S1.5.2 [B5] — THE ONE OWNER OF "how many required obligations are still outstanding this paycheck."
 *
 * ⚠️ It is a count of OBLIGATIONS, not of list entries, and the two differ in both directions:
 *
 *  - **An obligation can produce two entries.** A partially-funded bill is an `allocations` row
 *    (`Pay Electric (partial) $100`) AND an `unfundedRequiredItems` entry (`Finish Electric $200`).
 *    `rows.length + unfunded.length` counted it twice — measured at 5 for 4 obligations.
 *  - **An obligation can produce zero rows.** `allocatePaycheck` only pushes an allocation when
 *    `coveredAmount > 0 || potShare > 0`, so a bill this paycheck cannot fund AT ALL exists only in
 *    `unfundedRequiredItems`. Any caller that hands this function an emptied array is asserting the
 *    user owes nothing — which is how [B5] rendered "You're caught up for this paycheck." in success
 *    green over $1,060 of unpaid bills. ⛔ **Pass the allocation's real array. Suppressing a LIST is a
 *    render decision and belongs in the render, never in the number.**
 *
 * An obligation counts as outstanding when it has an unhandled row, or an unfunded remainder, or both.
 * A row that is handled while a remainder stands still counts — paying $100 of a $300 bill leaves $200 owed.
 */
export function countOutstandingRequired(rows: RequiredRow[], unfunded: UnfundedRequiredItem[]): number {
  const keys = new Set<string>();
  for (const r of rows) if (!rowHandledNow(r)) keys.add(requiredRowKey(r));
  for (const u of unfunded) keys.add(unfundedItemKey(u));
  return keys.size;
}

function daysBetween(fromISO: string, toISO?: string): number {
  if (!toISO) return 0; // no due date → treat as due now (this week), never hidden
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Group required rows into urgency buckets for Today (1.5.4). Overdue + This-week stay open;
 * later-in-cycle + Handled collapse. `paidThisVisit` pins rows the user just checked off so they
 * stay struck-through in place (they settle into Handled on the next visit, never vanish on tap).
 * Adapts to cycle length automatically — a weekly payer's bills all land in "this week", so the
 * later buckets are simply empty (filtered out).
 */
export function bucketRequiredRows(rows: RequiredRow[], currentDateISO: string, paidThisVisit: Set<string>): RequiredBucket[] {
  const b: Record<RequiredBucketKey, RequiredRow[]> = { overdue: [], thisWeek: [], nextWeek: [], later: [], handled: [] };
  for (const r of rows) {
    if (rowHandledNow(r) && !paidThisVisit.has(requiredRowKey(r))) {
      b.handled.push(r);
    } else if ((r.view.overdue && !r.isAutopay) || r.view.autopayFailed) {
      b.overdue.push(r);
    } else {
      const d = daysBetween(currentDateISO, r.dueDate);
      (d < 7 ? b.thisWeek : d < 14 ? b.nextWeek : b.later).push(r);
    }
  }
  const meta: { key: RequiredBucketKey; title: string; open: boolean }[] = [
    { key: 'overdue', title: OVERDUE_LABEL, open: true },
    { key: 'thisWeek', title: 'Due this week', open: true },
    { key: 'nextWeek', title: 'Due next week', open: false },
    { key: 'later', title: 'Later this cycle', open: false },
    { key: 'handled', title: 'Handled', open: false },
  ];
  return meta
    .map((m) => ({ key: m.key, title: m.title, rows: b[m.key], total: b[m.key].reduce((s, r) => s + r.item.amount, 0), defaultOpen: m.open }))
    .filter((x) => x.rows.length > 0);
}

/** The cycle's recommended extras (emergency fund + extra debt payoff + optional goals). */
export function selectRecommendedActions(store: DebtStore, allocation: Allocation): ActiveRecommendedAction[] {
  return selectActiveRecommendedActions({
    result: allocation,
    debts: store.debts,
    goals: store.goals,
    payoffStrategy: store.payoffStrategy,
    recommendationOverrides: store.recommendationOverrides,
    completedRecommendedActions: store.completedRecommendedActions,
  });
}

/**
 * ⛔ **`'debt-free-unverified'` EXISTS SO A SCREEN CANNOT FORGET TO ASK.**
 * [P6.8.9.7.11.18 · S1.5 · pass-1 blocker B1]
 *
 * Every debt whose balance the app could not read is repaired to `0`, which puts it in neither the active
 * list nor anything a user can correct — so `liveDebts.length === 0` was true of a portfolio that is
 * **entirely unread**, and Today rendered *"You're debt-free. Every balance is cleared."* over debts still
 * owed, permanently. ⚠️ The alternative — asking `hasUnreadDebtBalances` at the render site — is the shape
 * that produced M9 days earlier: a rule copied to each site that needed it, which then disagreed.
 */
export type PlanState = 'no-paycheck' | 'no-debts' | 'debt-free' | 'debt-free-unverified' | 'normal';

/** Which top-level state the Plan screen is in (drives the hero variant). */
export function selectPlanState(store: DebtStore, allocation: Allocation | null): PlanState {
  if (!allocation) return 'no-paycheck';
  // ⛔ S1.10.6.9 — the LIVENESS question now comes from the owner whole, not from the conjunct re-derived
  // here beside a call to `hasUnreadDebtBalances`. This site was already correct; it was the only one, and
  // spelling half the rule out here is what let four sibling selectors spell out the other half wrong.
  const liveness = debtLiveness(store);
  if (liveness === 'has-debt') return 'normal';
  // ⚠️ Stays here: "never had a debt" is a PLAN-hero distinction and no other caller of the owner wants it.
  if (store.debts.length === 0) return 'no-debts';
  return liveness === 'debt-free-unverified' ? 'debt-free-unverified' : 'debt-free';
}

export type PlanStatus = 'on-track' | 'overdue' | 'short';

export interface PlanSummary {
  /** The adaptive hero number + label — follows where this paycheck's flexible money actually goes. */
  heroValue: number;
  heroLabel: string;
  planned: number;
  cushion: number;
  requiredTotal: number;
  shortfall: number;
  /** Paycheck − required (bills + minimums): what's left to work with after obligations. */
  remainingAfterRequired: number;
  /** Everyday/living reserved this cycle (variable but essential — groceries, gas, life). */
  everydayReserve: number;
  /** ⛔ [L3-6] What the paycheck could ACTUALLY hold of `everydayReserve` — smaller whenever the enabled
   *  items outsize the paycheck, which the engine absorbs silently. Copy claiming money is reserved must
   *  quote this (or say it fell short); `everydayReserve` is the request, not the outcome. */
  everydayHeld: number;
  /** 3.8 — set aside this cycle for UPCOMING recurring bills. Joins `everydayReserve` in the hero's
   *  "Spoken for" segment [D36]; kept separate because the tap splits them and they have different doors. */
  billsReserve: number;
  cushionStatus: 'stable' | 'tight' | 'pressure';
  debtFreeDate: string | null;
  status: PlanStatus;
}

/**
 * The adaptive hero framing (Jason 2026-07-19): the emergency fund is funded FIRST (snowball / Baby
 * Step 1), so "extra to debt" is $0 during the safety-net phase — which undersells progress. The
 * hero instead names where the money goes this cycle: safety net → debt → goals → cushion.
 */
function heroFraming(allocation: Allocation): { value: number; label: string } {
  const snowball = sumCategory(allocation, 'snowball');
  if (snowball > 0) return { value: snowball, label: 'to debt this paycheck' };
  const emergency = sumCategory(allocation, 'emergency');
  if (emergency > 0) return { value: emergency, label: `to ${EMERGENCY_FUND_NOUN}` };
  const optional = sumCategory(allocation, 'optional_goal');
  if (optional > 0) return { value: optional, label: GOALS_DESTINATION };
  return { value: allocation.remaining, label: 'cushion this paycheck' };
}

/** The hero + summary figures. */
export function selectPlanSummary(store: DebtStore, allocation: Allocation, requiredRows: RequiredRow[]): PlanSummary {
  const cushion = allocation.remaining;
  const shortfall = allocation.shortfall ?? 0;
  const overdue = requiredRows.some((r) => r.view.overdue);
  const hero = heroFraming(allocation);
  const remainingAfterRequired = allocation.paycheckAmount - allocation.totalRequired;
  // Unified state (2.4.6.1.2): the SAME floor-relative `computeState` the card + forecast use — off
  // discretionary (after living too), NOT `remainingAfterRequired` vs a `paycheck × 0.1` threshold.
  /**
   * ⛔ **S1.9.6 [pass-2 D2-1] — THE SAME FIRST ARGUMENT AS THE OTHER TWO PRODUCERS.**
   *
   * `computeState`'s own docblock states the invariant: *"Every producer — the card, the forecast and
   * `selectPlanSummary` — must derive its band from THIS function so they can never disagree."* All three
   * did call it, **with different first arguments**, and the difference was exactly `appliedTopUp`.
   *
   * ⚡ Measured on the app's DESIGNED PATH: premium, $2,000, rent $1,850. The Guardian card offers its own
   * *"Move $50 from your emergency fund"*, sized to exactly `floor − cushion`; after the tap the card turns
   * **Clear** and its own *"See forecast"* button opens the cushion forecast on **cycle 0** reading
   * *"Tight · $50 under"* — the gap they were just told they had closed, and paid $50 of emergency fund to
   * close. `CashRunwayChart` defaults its selection to the first cycle under the line, which is cycle 0.
   *
   * 🎯 2026-08-26 chose the rule: **the band reads spendable cash.** The money is in checking and the
   * bills can be paid, so the band — whose own definition is *"can I cover what is coming"* — must see it.
   * ⚠️ `PlanHero`'s *"Flexible"* legend deliberately does NOT: that is a PARTITION of the paycheck, and
   * folding cash from savings into it would break the conservation invariant [M4] pins. The two are
   * different quantities and stay different.
   */
  const cushionStatus: PlanSummary['cushionStatus'] = toCushionStatus(
    computeState(
      selectDiscretionary(allocation) + nettedTopUp(store, allocation.shortfall).surplus,
      effectivePaycheckBuffer(store),
      store.priorGuardianBand,
    ),
  );
  return {
    heroValue: hero.value,
    heroLabel: hero.label,
    planned: allocation.paycheckAmount - cushion,
    cushion,
    requiredTotal: allocation.totalRequired,
    shortfall,
    remainingAfterRequired,
    everydayReserve: allocation.livingExpenseReserve,
    everydayHeld: allocation.livingExpenseHeld,
    billsReserve: sumCategory(allocation, 'expense_reserve'),
    cushionStatus,
    debtFreeDate: selectDebtFreeDate(store, allocation),
    status: overdue ? 'overdue' : shortfall > 0 ? 'short' : 'on-track',
  };
}
