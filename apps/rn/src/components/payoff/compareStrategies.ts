import type { DebtClearPoint, TrajectoryPoint } from '@/store/payoffSelectors';

/**
 * C7 / [D59] — snowball vs avalanche, compared by WHAT ACTUALLY DIFFERS.
 *
 * ⛔ **The obvious build was a second curve, and it was measured and rejected.** Both simulations already
 * run on every render and `TrajectoryChart` discarded one, so drawing it was nearly free — which is
 * exactly why it was worth asking what it would show. Measured across realistic portfolios: the two
 * total-balance curves separate by **≤2.8% of chart height and usually <0.1%**, and the debt-free date is
 * **identical in 5 of 6**. Two lines nobody can tell apart, on a card P1-3 had just been fixed for being
 * unreadable. Evidence: `docs/evidence/2026-08-24-c7-strategy-divergence/`.
 *
 * ⚡ **What does differ is WHICH DEBT CLEARS WHEN, and it is large.** On one portfolio the first cleared
 * debt lands at **month 1** under snowball and **month 20** under avalanche — same curve, same date, and a
 * nineteen-month difference in when the user gets their first win. On another the order reshuffles
 * outright. That is the entire snowball-vs-avalanche argument and it lives in the waypoints.
 *
 * ⛔ **NO INTEREST FIGURE IS PRODUCED HERE, deliberately.** Avalanche's whole case is that it costs less,
 * and [D59] recorded that the dollar difference was **never measured** — at month granularity both
 * strategies finish the same month spending the same budget. Stating a saving this module cannot support
 * would be the app inventing a number about the user's money. If that figure is ever wanted, it gets
 * measured first.
 */

export type StrategyKey = 'snowball' | 'avalanche';

export type StrategySummary = {
  strategy: StrategyKey;
  /** The month the whole plan reaches zero, or `null` if it never does. */
  debtFreeMonth: number | null;
  /** Each debt with the month it clears, soonest first. */
  clears: { name: string; month: number }[];
  /** The month the FIRST debt clears — the "first win". `null` when nothing clears. */
  firstWinMonth: number | null;
};

export type StrategyComparison = {
  snowball: StrategySummary;
  avalanche: StrategySummary;
  /** Months sooner the first debt clears under snowball. Negative = avalanche is sooner. */
  firstWinSooner: number | null;
  /** Months sooner the whole plan finishes under avalanche. Negative = snowball is sooner. */
  finishSooner: number | null;
  /** ⚠️ False when the two produce the same dates AND the same order — there is nothing to choose between. */
  differs: boolean;
};

function summarize(strategy: StrategyKey, points: TrajectoryPoint[], clears: DebtClearPoint[]): StrategySummary {
  const ordered = clears
    .filter((c) => c.month > 0)
    .map((c) => ({ name: c.name ?? 'Debt', month: c.month }))
    .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name));
  return {
    strategy,
    debtFreeMonth: points.find((p) => p.balance <= 0)?.month ?? null,
    clears: ordered,
    firstWinMonth: ordered[0]?.month ?? null,
  };
}

export function buildStrategyComparison(args: {
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  snowballClears: DebtClearPoint[];
  avalancheClears: DebtClearPoint[];
}): StrategyComparison {
  const s = summarize('snowball', args.snowball, args.snowballClears);
  const a = summarize('avalanche', args.avalanche, args.avalancheClears);

  const firstWinSooner = s.firstWinMonth != null && a.firstWinMonth != null ? a.firstWinMonth - s.firstWinMonth : null;
  const finishSooner = s.debtFreeMonth != null && a.debtFreeMonth != null ? s.debtFreeMonth - a.debtFreeMonth : null;

  // ⚠️ Compared as a SEQUENCE, not as a set: the same debts in the same order at different months is a
  // real difference to the user (their first win moves), and it is the common case.
  const key = (x: StrategySummary) => x.clears.map((c) => `${c.name}@${c.month}`).join('|');
  const differs = key(s) !== key(a) || s.debtFreeMonth !== a.debtFreeMonth;

  return { snowball: s, avalanche: a, firstWinSooner, finishSooner, differs };
}

/**
 * The one-line takeaway under the two lists.
 *
 * ⚠️ **It is allowed to say "these are the same", and that matters more than it sounds.** Most portfolios
 * genuinely produce the same date and the same order, and a comparison that manufactures a distinction in
 * that case is the app arguing for a choice that does not exist.
 */
export function comparisonTakeaway(cmp: StrategyComparison): string {
  if (!cmp.differs) return 'On your debts, these two produce exactly the same plan.';

  const parts: string[] = [];
  if (cmp.finishSooner != null && cmp.finishSooner > 0) {
    parts.push(`Avalanche finishes ${plural(cmp.finishSooner, 'month')} sooner`);
  } else if (cmp.finishSooner != null && cmp.finishSooner < 0) {
    parts.push(`Snowball finishes ${plural(-cmp.finishSooner, 'month')} sooner`);
  } else if (cmp.finishSooner != null) {
    parts.push('Same debt-free date');
  }

  if (cmp.firstWinSooner != null && cmp.firstWinSooner > 0) {
    parts.push(`snowball clears your first debt ${plural(cmp.firstWinSooner, 'month')} sooner`);
  } else if (cmp.firstWinSooner != null && cmp.firstWinSooner < 0) {
    parts.push(`avalanche clears your first debt ${plural(-cmp.firstWinSooner, 'month')} sooner`);
  } else if (parts.length > 0) {
    parts.push('and the order they clear in changes');
  }

  return `${parts.join(', ')}.`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
