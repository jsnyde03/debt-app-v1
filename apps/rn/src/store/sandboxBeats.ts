import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { DISCOVERY_CYCLES } from '@/store/guardianPredictionCore';
import { recordSurpriseOutflow } from '@/store/substrateProducers';

import type { SandboxStoreInstance } from './sandboxStore';

/**
 * 3.5.0.4 — the scripted "next payday arrives" BEATS the Phase-3.5 tutorial and demo are driven by.
 *
 * The point of this file is what it does NOT do: it never hand-writes a visual's trigger. A beat calls
 * the same `rolloverPayCycle` / surprise-outflow producers the real app calls, so "the safety net
 * absorbed that" and "you've got it back" are things the ENGINE decided, exactly as they would be on
 * the user's own third payday. A faked flag would look identical on day one and then drift silently
 * from real behaviour, with no test able to tell.
 *
 * The tutorial therefore needs a ceiling that lets the discovery gate actually cross — see
 * `TUTORIAL_MAX_CYCLES` and `SandboxScenario.maxGenuineCycles`.
 */

/**
 * The tutorial's honesty ceiling. `DISCOVERY_CYCLES` is the real gate at which the settling-in reserve
 * retires, so a tutorial capped below it could never show the release — the payoff that explains why
 * holding money back was worth it. The DEMO deliberately does not use this (it stays day-one bounded).
 */
export const TUTORIAL_MAX_CYCLES = DISCOVERY_CYCLES;

/** What a single payday beat changed — enough for a beat to narrate itself truthfully. */
export interface BeatResult {
  /** Genuine cycles the sandbox has now lived (post-ceiling). */
  cycle: number;
  /** The scripted "today" after the payday landed. */
  date: string;
  /** Is the settling-in reserve still being held? */
  reserveHeld: boolean;
  /** The reserve's one-time release ack, when THIS beat is the one that freed it. */
  released: { tapped: boolean; covered: number } | null;
  /** The Guardian's band after the roll. */
  state: string | undefined;
}


/**
 * 3.5.0.4.3 — the SURPRISE beat: an un-modelled outflow lands mid-cycle, exactly as
 * `recordSurpriseOutflow` records it at a real payday check-in. This is what makes "your safety net
 * absorbed that" a fact about the plan rather than a line of copy — and it's also what branches the
 * eventual release ack into its "covered a surprise" form.
 */
export function scriptSurprise(store: SandboxStoreInstance, amount: number): void {
  const s = store.getState().store;
  store.setState({
    store: recordSurpriseOutflow(s, { cycleEndDate: s.paycheck.nextPaycheckDate, amount }),
  });
}

/**
 * 3.5.0.4.2 — advance one scripted payday through the REAL rollover, and report what moved.
 *
 * Reads the held-state before and after so a beat can say "still held" / "just released" without
 * inspecting store internals. The release itself is produced inside `applyRollover`; this only observes.
 */
export function advanceSandboxCycle(store: SandboxStoreInstance, surprise?: number): BeatResult {
  // 3.5.3.5.6 — CHECK IN, then roll. A payday in the real app is two moves: `capturePayday` records what
  // happened (bills and minimums settled, income recorded, any surprise reported), and only then does
  // `rolloverPayCycle` close the cycle. This used to call the roll alone, which is not a payday — it is
  // a payday nobody attended. Three scripted rolls of that left the taught plan reading "Overdue
  // payments need attention" with the debt-free date pushed eight months out: the walkthrough's own
  // story was making the example plan visibly worse while narrating the Guardian looking after it.
  //
  // Settling everything is the honest script here: this is a user who paid their bills, which is exactly
  // the case the beat is about. The surprise rides in as `actuals` — the same door the payday check-in
  // uses — rather than being written separately, so the whole beat now goes through one real path.
  const s0 = store.getState().store;
  store.getState().capturePayday([], {
    expensePaid: Object.fromEntries(s0.requiredExpenses.map((e) => [e.id, true])),
    debtPaid: Object.fromEntries(s0.debts.map((d) => [d.id, true])),
  }, surprise ? { surpriseOutflow: { cycleEndDate: s0.paycheck.nextPaycheckDate, amount: surprise } } : undefined);
  store.getState().rolloverPayCycle();

  const s = store.getState().store;
  return {
    cycle: s.genuineCycleCount,
    date: s.paycheck.currentDate,
    // `priorReserveHeld` is stamped BY the rollover, so this is the engine's own answer.
    reserveHeld: s.priorReserveHeld ?? false,
    // Set inside `applyRollover` only on the beat that actually freed it — never written here.
    released: s.pendingReserveRelease ?? null,
    state: selectPaydayGuardian(s)?.state,
  };
}

/**
 * Run a whole scripted sequence and hand back every beat, so a caller can drive the arc without
 * managing the loop. Deterministic: same sandbox + same script ⇒ same beats.
 */
export function runBeats(store: SandboxStoreInstance, beats: number, surprise?: number): BeatResult[] {
  const out: BeatResult[] = [];
  // The surprise belongs to the FIRST payday only — it's one unexpected bill, not a recurring one, and
  // repeating it every cycle would be the engine absorbing three surprises rather than telling the story
  // of one net doing its job.
  for (let i = 0; i < beats; i++) out.push(advanceSandboxCycle(store, i === 0 ? surprise : undefined));
  return out;
}
