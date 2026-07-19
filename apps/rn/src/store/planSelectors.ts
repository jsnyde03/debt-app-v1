import { deriveRequiredActionView, type RequiredActionView } from '@core/debt/deriveRequiredActionView';
import { projectDebtPayoff } from '@core/debt/projectDebtPayoff';
import { selectActiveRecommendedActions } from '@core/debt/selectActiveRecommendedActions';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { DebtStore } from '@/data/models';

import type { Allocation } from './selectors';

type AllocItem = Allocation['allocations'][number];
export type ActiveRecommendedAction = ReturnType<typeof selectActiveRecommendedActions>[number];

const REQUIRED_CATEGORIES = ['expense', 'minimum_debt', 'autopay_expense', 'autopay_debt'];

/** A required-action row: the allocation item + its derived display state (paid/overdue/autopay/…). */
export interface RequiredRow {
  item: AllocItem;
  view: RequiredActionView;
  isAutopay: boolean;
  dueDate?: string;
}

/** Sum of one allocation category. */
function sumCategory(allocation: Allocation, category: string): number {
  return allocation.allocations.filter((a) => a.category === category).reduce((sum, a) => sum + a.amount, 0);
}

/** Sum of the "snowball" allocations — the extra beyond minimums (feeds the debt-free projection). */
export function selectExtraToDebt(allocation: Allocation): number {
  return sumCategory(allocation, 'snowball');
}

/** The estimated debt-free date under the current plan (via the shared payoff engine), or null. */
export function selectDebtFreeDate(store: DebtStore, allocation: Allocation | null): string | null {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  if (!allocation || liveDebts.length === 0) return null;
  const { estimatedDebtFreeDate } = projectDebtPayoff({
    debts: liveDebts,
    monthlyExtraPayment: selectExtraToDebt(allocation) * payCyclesPerMonth(store.paycheck.payCycle),
    strategy: store.payoffStrategy,
    startDate: store.paycheck.currentDate,
  });
  return estimatedDebtFreeDate === 'Unable to estimate' ? null : estimatedDebtFreeDate;
}

/** Required bills + debt minimums due this paycheck, each with its display state. */
export function selectRequiredRows(store: DebtStore, allocation: Allocation): RequiredRow[] {
  return allocation.allocations
    .filter((item) => REQUIRED_CATEGORIES.includes(item.category))
    .map((item) => {
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
    });
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
  if (emergency > 0) return { value: emergency, label: 'to your safety net' };
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
  return {
    heroValue: hero.value,
    heroLabel: hero.label,
    planned: allocation.paycheckAmount - cushion,
    cushion,
    requiredTotal: allocation.totalRequired,
    shortfall,
    debtFreeDate: selectDebtFreeDate(store, allocation),
    status: overdue ? 'overdue' : shortfall > 0 ? 'short' : 'on-track',
  };
}
