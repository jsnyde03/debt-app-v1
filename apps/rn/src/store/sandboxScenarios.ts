import type { GuardianState } from '@core/guardian/buildGuardianBrief';
import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import type { DebtStore, Goal, LivingExpense, RequiredExpense } from '@/data/models';

import { selectPaydayGuardian } from './guardianSelectors';
import type { SandboxScenario } from './sandboxStore';

/**
 * 3.5.0.3 — the SCENARIO SCRIPTS the Phase-3.5 tutorial and demo actually drive.
 *
 * Three named states the Guardian can be in, built on one of two seeds:
 *   - **persona** — a realistic stand-in for when there are no real numbers yet (pre-purchase demo,
 *     the marketing embed, a user still mid-onboarding).
 *   - **personal** — the user's OWN income and obligations, so the tutorial teaches on their money.
 *
 * The before-scan corrected the plan's premise here: onboarding captures only a paycheck amount +
 * cadence and ONE debt-or-bill, so "seed from the user's just-entered numbers" cannot mean a full plan.
 * `personalScenario` therefore takes whatever is real and FILLS the remainder from the persona — a
 * blend, not an either/or fallback. Their paycheck is the part they'll recognise, and it's the number
 * every other figure is derived from.
 *
 * Every scenario is authored day-one honest (no cycle history, no genuine cycles). The 3.5.0.2 ceiling
 * enforces that independently at the seam, so this is belt-and-braces rather than the only guard.
 *
 * ⚠️ HONESTY (hand-off to 3.5.3): the tight and at-risk states are TAUGHT states, not the user's real
 * read. Driving them off the user's own paycheck is what makes the lesson land, and also what makes it
 * mistakable for a real warning — so the tutorial chrome must frame these unmistakably as a walkthrough.
 * Each scenario carries a human `label` for exactly that.
 */

export type SandboxState = 'clear' | 'tight' | 'at-risk';

export interface ScenarioOpts {
  premium?: boolean;
  /**
   * 3.5.0.4.1 — the scenario's honesty ceiling. Omit for the day-one bound the DEMO must keep; the
   * TUTORIAL passes `TUTORIAL_MAX_CYCLES` so a scripted payday can cross the discovery gate and the
   * safety net's release becomes a real engine event instead of a hand-set flag.
   */
  maxGenuineCycles?: number;
}

/** The frozen day every scenario is told from. A Monday, mid-month — nothing calendar-special. */
export const SCENARIO_BASE_DATE = '2026-03-02';

/** The persona's per-cycle income when there's nothing real to scale from. */
const PERSONA_INCOME = 2000;

/**
 * How the bill budget is chosen: by ASKING THE ENGINE, not by modelling it.
 *
 * Two after-scan findings killed the analytic approach. First, "tight" was aimed at exactly the cushion
 * floor — which is the CLEAR boundary (`computeState`: at-risk below floor×0.5, tight in
 * [floor×0.5, floor), clear at/above) — so the engine read `clear` while the tutorial was about to
 * narrate "tight". Second, and fatally, the cold-start safety net is DERIVED and adapts to the surplus
 * (measured at 172 / 32 / 0 across the three states), so no constant allowance can predict it.
 *
 * Reproducing that math here would couple the scenarios to engine internals and rot the moment a
 * fraction moves. Instead the solver binary-searches the bill budget against the REAL Guardian and
 * takes the band it actually reports. Self-calibrating, and it stays pure + deterministic: the search
 * is a fixed number of evaluations over pure functions, so replay is unaffected.
 */
const SOLVER_STEPS = 14;

const STATE_LABEL: Record<SandboxState, string> = {
  clear: 'A clear payday',
  tight: 'A tight payday',
  'at-risk': 'A short payday',
};

/** The persona's obligations, as fractions of the bill budget the state solves for. */
const BILL_MIX: { name: string; category: RequiredExpense['category']; weight: number }[] = [
  { name: 'Rent', category: 'housing', weight: 0.62 },
  { name: 'Utilities', category: 'utilities', weight: 0.12 },
  { name: 'Phone', category: 'utilities', weight: 0.08 },
  { name: 'Car insurance', category: 'insurance', weight: 0.11 },
  { name: 'Streaming', category: 'other', weight: 0.07 },
];

const round = (n: number) => Math.round(n * 100) / 100;

/** The persona's debts — small, recognisable, and payable, so the payoff beats resolve in-tutorial. */
function personaDebts(currentDate: string): DebtStore['debts'] {
  return [
    { id: 'sbx-card', name: 'Credit card', balance: 1840, originalBalance: 2400, minimumPayment: 55, apr: 22.99, dueDate: currentDate, type: 'debt', recurrence: 'monthly', balanceAsOfDate: currentDate, lastVerifiedDate: currentDate },
    { id: 'sbx-store', name: 'Store card', balance: 420, originalBalance: 600, minimumPayment: 25, apr: 26.99, dueDate: currentDate, type: 'debt', recurrence: 'monthly', balanceAsOfDate: currentDate, lastVerifiedDate: currentDate },
  ] as DebtStore['debts'];
}

/**
 * Everyday spending, as a SHARE of the paycheck rather than a fixed figure. The after-scan found the
 * fixed version ($370) swamped a small income — at ~$700 the bill budget bottomed out on its clamp and
 * all three states collapsed into the same read, so a low-earning user would have been walked through
 * three identical "different" states.
 */
const LIVING_SHARE = 0.185;

function personaLiving(income: number): LivingExpense[] {
  const total = income * LIVING_SHARE;
  return [
    { id: 'sbx-groceries', name: 'Groceries', amount: round(total * 0.7), enabled: true },
    { id: 'sbx-gas', name: 'Gas', amount: round(total * 0.3), enabled: true },
  ] as LivingExpense[];
}

function personaGoals(): Goal[] {
  return [{ id: 'sbx-ef', name: 'Emergency fund', targetAmount: 1000, currentAmount: 240, type: 'emergency' }] as Goal[];
}

/**
 * Binary-search the bill budget for the boundary where the engine's verdict stops satisfying `stillOk`.
 * The band is monotonic in the budget (more bills ⇒ never a better band), which is what makes this
 * sound. Returns the last budget that still satisfied it.
 */
function findBoundary(
  base: DebtStore,
  opts: { income: number; debts: DebtStore['debts']; premium: boolean; payCycle?: DebtStore['paycheck']['payCycle'] },
  livingExpenses: LivingExpense[],
  stillOk: (state: GuardianState) => boolean,
): number {
  let lo = 0;
  let hi = opts.income * 1.5; // beyond any bill load that leaves a plan standing
  for (let i = 0; i < SOLVER_STEPS; i++) {
    const mid = (lo + hi) / 2;
    const verdict = selectPaydayGuardian(assemble(base, opts, livingExpenses, mid))?.state;
    if (verdict && stillOk(verdict)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** The bill budget that makes the engine actually report `state`, or `null` if it can't be reached. */
function solveBillBudget(
  base: DebtStore,
  opts: { income: number; debts: DebtStore['debts']; state: SandboxState; premium: boolean; payCycle?: DebtStore['paycheck']['payCycle'] },
  livingExpenses: LivingExpense[],
): number | null {
  // The two band boundaries, found against the real engine.
  const lastClear = findBoundary(base, opts, livingExpenses, (s) => s === 'clear');
  const lastTight = findBoundary(base, opts, livingExpenses, (s) => s !== 'at-risk');

  const budget =
    opts.state === 'clear'
      ? lastClear * 0.6 // comfortably inside clear, so the surplus story is visible
      : opts.state === 'tight'
        ? (lastClear + lastTight) / 2 // the middle of the tight band
        : lastTight + opts.income * 0.15; // clearly short — a real gap for Recovery to solve

  // A payday with (almost) no bills teaches nothing, and signals this income can't carry the state
  // (e.g. real minimums already eat the paycheck). The caller falls back to the persona rather than
  // silently rendering three identical "different" states — the low-income collapse the after-scan hit.
  if (budget < opts.income * 0.12) return null;

  // Confirm the engine agrees before we commit: the band must be exactly what was asked for, or the
  // scenario's NAME would contradict the card the tutorial is pointing at.
  const got = selectPaydayGuardian(assemble(base, opts, livingExpenses, budget))?.state;
  return got === opts.state ? budget : null;
}

function billsFrom(budget: number, currentDate: string): RequiredExpense[] {
  return BILL_MIX.map((b, i) => ({
    id: `sbx-bill-${i}`,
    name: b.name,
    amount: round(budget * b.weight),
    dueDate: currentDate,
    recurrence: 'monthly',
    category: b.category,
  })) as RequiredExpense[];
}

/** Shared assembly for both seeds — everything except which income/debts we're standing on. */
function build(
  base: DebtStore,
  opts: {
    income: number;
    debts: DebtStore['debts'];
    state: SandboxState;
    premium: boolean;
    /** Carry the user's real cadence — "every 2 weeks" reading as monthly would break recognition. */
    payCycle?: DebtStore['paycheck']['payCycle'];
  },
): DebtStore | null {
  const livingExpenses = personaLiving(opts.income);
  const budget = solveBillBudget(base, opts, livingExpenses);
  // Infeasible on these numbers → tell the story with the persona instead of a misleading scaled one.
  if (budget === null) return null;
  return assemble(base, opts, livingExpenses, budget);
}

/** Assemble the store for a GIVEN bill budget — the thing the solver evaluates and then returns. */
function assemble(
  base: DebtStore,
  opts: { income: number; debts: DebtStore['debts']; premium: boolean; payCycle?: DebtStore['paycheck']['payCycle'] },
  livingExpenses: LivingExpense[],
  budget: number,
): DebtStore {
  const currentDate = base.paycheck.currentDate;
  const payCycle = opts.payCycle ?? base.paycheck.payCycle;
  return {
    ...base,
    subscriptionPlan: opts.premium ? 'premium' : 'free',
    paycheck: {
      ...base.paycheck,
      amount: String(opts.income),
      payCycle,
      // Re-derive: `createSandboxBase` computed this from the DEFAULT cadence, so carrying the user's
      // real one over without this would leave the next payday describing a different schedule. The
      // day-of-month fields are required for the monthly/semi-monthly cadences (they're stored as
      // strings, hence the coercion) — omitting them throws "Monthly pay day must be between 1 and 31".
      nextPaycheckDate: getNextPaycheckDate({
        payCycle,
        currentDate,
        semiMonthlyFirstDay: Number(base.paycheck.semiMonthlyFirstDay),
        semiMonthlySecondDay: Number(base.paycheck.semiMonthlySecondDay),
        monthlyPayDay: Number(base.paycheck.monthlyPayDay),
      }),
    },
    debts: opts.debts,
    requiredExpenses: billsFrom(budget, currentDate),
    livingExpenses,
    goals: personaGoals(),
    prefs: { ...base.prefs, onboardingComplete: true },
    // Day-one by construction (the 3.5.0.2 ceiling also enforces this at the seam).
    genuineCycleCount: 0,
    cycleHistory: [],
    incomeActualsLog: [],
    surpriseOutflowLog: [],
    onboardedAt: currentDate,
  };
}

/** The stand-in scenario: no real numbers needed. */
export function personaScenario(state: SandboxState, opts: ScenarioOpts = {}): SandboxScenario {
  return {
    id: `persona-${state}`,
    label: STATE_LABEL[state],
    baseDate: SCENARIO_BASE_DATE,
    maxGenuineCycles: opts.maxGenuineCycles,
    build: (base) => {
      // The persona's own numbers are chosen to carry every state, so this can't legitimately fail —
      // but `build` is nullable, and silently rendering an empty plan would be worse than being loud.
      const built = build(base, { income: PERSONA_INCOME, debts: personaDebts(base.paycheck.currentDate), state, premium: opts.premium ?? true });
      if (!built) throw new Error(`[sandbox] persona scenario "${state}" is infeasible — the persona constants no longer carry it.`);
      return built;
    },
  };
}

// Feasibility is no longer predicted separately — `build` returns null when the solver can't reach the
// requested band on these numbers, and the personal scenario falls back to the persona at that point.
// One source of truth beats a predictor that can disagree with the thing it predicts.

/**
 * The user's own money, scaled into the requested state. Their income (and their debts, when they have
 * any) carry over; everything else is filled from the persona so the beats still have something to act
 * on. Falls back to the persona outright when there's no usable income to stand on.
 */
export function personalScenario(store: DebtStore, state: SandboxState, opts: ScenarioOpts = {}): SandboxScenario {
  const income = Number(store.paycheck.amount);
  if (!Number.isFinite(income) || income <= 0) return personaScenario(state, opts);

  // Their real debts if they have them; otherwise the persona's, so there IS a payoff story to tell.
  const real = store.debts.filter((d) => d.balance > 0);
  return {
    id: `personal-${state}`,
    label: STATE_LABEL[state],
    baseDate: SCENARIO_BASE_DATE,
    maxGenuineCycles: opts.maxGenuineCycles,
    build: (base) => {
      const currentDate = base.paycheck.currentDate;
      const debts = (real.length
        ? real.map((d) => ({ ...d, dueDate: currentDate, balanceAsOfDate: currentDate, lastVerifiedDate: currentDate, minimumPaidThisCycle: false }))
        : personaDebts(currentDate)) as DebtStore['debts'];
      const built = build(base, {
        income,
        debts,
        state,
        premium: opts.premium ?? store.subscriptionPlan === 'premium',
        payCycle: store.paycheck.payCycle,
      });
      // The solver couldn't reach this band on their numbers (a small paycheck whose minimums and
      // everyday spending already consume it) → stand on the persona rather than walk them through
      // three states that all read identically. The low-income collapse the after-scan caught.
      return built ?? personaScenario(state, opts).build(base);
    },
  };
}

/**
 * The one entry point the tutorial/demo should call: their numbers when there's something real to
 * stand on, the persona otherwise. Callers don't have to know which they got.
 */
export function scenarioFor(store: DebtStore | null, state: SandboxState, opts: ScenarioOpts = {}): SandboxScenario {
  return store ? personalScenario(store, state, opts) : personaScenario(state, opts);
}

/** Every named state, for the demo's scripted run and for determinism sweeps. */
export const SANDBOX_STATES: SandboxState[] = ['clear', 'tight', 'at-risk'];

/**
 * 3.5.3.3.2 — which scenario a BEAT should be staged with.
 *
 * Two rules, and the second is the one that isn't obvious:
 *  - a beat that declares no state leaves the sandbox alone (null → the caller doesn't re-seed), so a
 *    beat can be purely narrative without silently resetting whatever the last one set up;
 *  - **a harness-named scenario pins the state for the WHOLE run.** The harness exists so a test or a
 *    screenshot script can say "show me the at-risk card"; if beat 1's declared `clear` overrode that,
 *    the pin would survive exactly until the first render and every such script would quietly shoot the
 *    wrong state. Pinning also keeps `persona-*` fixtures on the persona seed rather than sliding onto
 *    the user's numbers mid-arc.
 *
 * Pure, so the whole staging policy is assertable without a store or a renderer.
 */
export function scenarioForBeat(
  realStore: DebtStore | null,
  beatState: SandboxState | undefined,
  opts: ScenarioOpts & { pinned?: SandboxState | null } = {},
): SandboxScenario | null {
  const { pinned, ...scenarioOpts } = opts;
  if (!beatState) return null;
  if (pinned) return personaScenario(pinned, scenarioOpts);
  return scenarioFor(realStore, beatState, scenarioOpts);
}
