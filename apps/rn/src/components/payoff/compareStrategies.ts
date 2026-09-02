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
/**
 * ⛔ **[S1.13.7.11 · pass-6 `C2-1`] — DOES THE SEQUENCE ACTUALLY CHANGE?** The takeaway's third arm used
 * to fire on `firstWinSooner === 0` alone, which is *"the first debt clears in the same month"* and says
 * nothing about the order. So a user whose two strategies clear **the same debts in the same sequence**,
 * differing only in the month the LAST one lands, was told *"and the order they clear in changes"* — the
 * one sentence on that card whose whole job is to name what actually differs, naming a difference that is
 * not there.
 *
 * ⚠️ **NAMES ONLY, and deliberately.** `differs` compares `name@month`, so it is true when the same
 * sequence lands on different months — which is a real difference and is what the `finishSooner` clause
 * above already says. This arm is about the ORDER, so it compares the order.
 */
function orderDiffers(cmp: StrategyComparison): boolean {
  const names = (x: StrategySummary) => x.clears.map((c) => c.name).join('|');
  return names(cmp.snowball) !== names(cmp.avalanche);
}

export function comparisonTakeaway(cmp: StrategyComparison): string {
  if (!cmp.differs) return 'On your debts, these two produce exactly the same plan.';

  const parts: string[] = [];

  /**
   * ⛔ **ONLY ONE OF THEM REACHES ZERO — the largest difference there is, and the delta arithmetic below
   * cannot express it.** `finishSooner` needs TWO dates to subtract, so it is `null` here, and before
   * P6.8.9.7.4 this whole function then returned the literal string `"."` — measured on **16 of 960
   * realistic two-card portfolios**, i.e. exactly where the strategies most disagree.
   *
   * ⚡ `strategy-compare.spec.ts` asserted `text.length > 0` and passed straight over it: `"."` has length
   * 1. A proxy for "the takeaway says something" is not the same claim as "the takeaway says something".
   */
  const sClears = cmp.snowball.debtFreeMonth != null;
  const aClears = cmp.avalanche.debtFreeMonth != null;
  if (sClears !== aClears) {
    parts.push(`Only ${sClears ? 'snowball' : 'avalanche'} clears your debt in this projection`);
  } else if (cmp.finishSooner != null && cmp.finishSooner > 0) {
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
  } else if (parts.length > 0 && orderDiffers(cmp)) {
    parts.push('and the order they clear in changes');
  }

  /**
   * ⛔ **THE BACKSTOP, AND IT IS NOT DEAD CODE.** `differs` can be true on facts none of the branches
   * above can phrase — neither strategy reaching zero within the horizon, or an identical first-win month
   * with a different clear ORDER. Both left `parts` empty, and `parts.join(', ')` then produced `"."`.
   *
   * ⚠️ Whatever is true here, the ORDER differs — that is what `differs` means when the dates cannot be
   * compared — so saying exactly that is honest in every case that reaches this line.
   */
  if (parts.length === 0) return 'These two clear your debts in a different order.';

  return `${parts.join(', ')}.`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
