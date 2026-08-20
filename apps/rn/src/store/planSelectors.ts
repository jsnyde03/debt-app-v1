import { EMERGENCY_FUND_NOUN } from '@core/copy/vocabulary';
import { computeStreak } from '@core/debt/computeStreak';
import { deriveRequiredActionView, type RequiredActionView, type RequiredAllocationItem } from '@core/debt/deriveRequiredActionView';
import { PROTECTED_CUSHION_CATEGORIES } from '@core/engine/allocatePaycheck';
import { DEBT_FREE_DATE_UNPAYABLE, projectDebtPayoff } from '@core/debt/projectDebtPayoff';
import { selectActiveRecommendedActions } from '@core/debt/selectActiveRecommendedActions';
import { computeState } from '@core/guardian/computeState';
import { toCushionStatus } from '@core/timeline/buildMultiCycleTimeline';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { DebtStore } from '@/data/models';

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
      .map((d) => build({ category: 'minimum_debt', targetId: d.id, debtId: d.id, label: `Pay minimum on ${d.name}`, amount: d.minimumPayment })),
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
    { key: 'overdue', title: 'Overdue', open: true },
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

export type PlanState = 'no-paycheck' | 'no-debts' | 'debt-free' | 'normal';

/** Which top-level state the Plan screen is in (drives the hero variant). */
export function selectPlanState(store: DebtStore, allocation: Allocation | null): PlanState {
  if (!allocation) return 'no-paycheck';
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  if (liveDebts.length === 0) return store.debts.length > 0 ? 'debt-free' : 'no-debts';
  return 'normal';
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
  if (optional > 0) return { value: optional, label: 'to your goals' };
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
  const cushionStatus: PlanSummary['cushionStatus'] = toCushionStatus(
    computeState(selectDiscretionary(allocation), effectivePaycheckBuffer(store), store.priorGuardianBand),
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
