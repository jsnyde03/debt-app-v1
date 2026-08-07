import { personaScenario, type SandboxState } from './sandboxScenarios';
import { scheduleStoryStep } from './sandboxRun';
import { seedSandbox, type SandboxScenario, type SandboxStoreInstance } from './sandboxStore';

/**
 * 3.5.4.6 — the bounded demo's script.
 *
 * The walkthrough teaches; this one SHOWS. It is watched rather than operated, which is why it is a timed
 * sequence and not a set of beats with a Next button: the same script has to serve the in-app demo, the
 * marketing embed (3.5.7) and the App-Preview capture (3.5.8), and only a timed run gives the capture
 * identical framing on every take.
 *
 * **What it shows, in the order it shows it:** a paycheck that covers everything and holds a line
 * (`clear`) → one that does not, where a single tap tops the cushion back up (`tight`) → one that cannot
 * be made to work, where the Guardian sorts what must be covered now from what can safely wait
 * (`at-risk`). That last stage is the free-tier contrast: Recovery is the thing a free user does not get,
 * shown rather than described.
 */
export interface DemoStage {
  id: string;
  state: SandboxState;
  /** Which tab this beat plays on. The script navigates; the viewer still cannot. */
  screen: '/money' | '/' | '/progress';
  /** Milliseconds from the start of the run. */
  at: number;
  /** One line of intent, for whoever reads the storyboard next. Not rendered. */
  beat: string;
  /** Optional shaping applied AFTER the stage's scenario is seeded — see `primePayoff`. */
  prime?: (sandbox: SandboxStoreInstance) => void;
}

/**
 * Put the smallest debt one tap away from being paid off.
 *
 * `isDebtProjectedPaidOff` is `balance > 0 && projectCurrentBalance(…) <= 0` — a debt whose anchor is
 * still positive but which projects to zero as of today. That state is what puts the payoff INVITATION on
 * Today, and confirming it is what fires the celebration.
 *
 * ⚠️ The celebration is deliberately NOT triggered from here, and that is the point. It is React state set
 * by `confirmPayoff`, which runs when the invitation card is confirmed — so the capture driver taps it and
 * records the real flow, invitation and all. A synthetic trigger would put the same pixels on screen
 * having skipped the mechanism, which is the one thing a store video must not do: show something the app
 * does not actually do that way.
 *
 * Deterministic by construction: anchor a balance the minimum payment clears, one month back, so the
 * projection lands at zero on any device on any day.
 */
function primePayoff(sandbox: SandboxStoreInstance): void {
  const store = sandbox.getState().store;
  const live = store.debts.filter((d) => d.balance > 0);
  if (live.length === 0) return;
  // The smallest — it is the one the payoff strategy is already working on, so its death is the story the
  // rest of the screen has been telling.
  const target = live.reduce((a, b) => (b.balance < a.balance ? b : a));
  // 35 days back — comfortably past the one whole month `projectCurrentBalance` needs to apply a payment,
  // without depending on month lengths. Inline rather than a shared helper: one caller, and the repo has
  // no add-months util to borrow.
  const back = new Date(`${store.paycheck.currentDate}T00:00:00`);
  back.setDate(back.getDate() - 35);
  const anchorDate = back.toISOString().slice(0, 10);
  // ⚠️ Only the BALANCE moves. The first version also raised `minimumPayment` to guarantee the projection
  // cleared — and that pushed the debt-free date a year later between the Progress beat and this one,
  // because a bigger minimum is a bigger required obligation and less is left to attack the other debts.
  // A date going visibly WORSE between two consecutive shots is the kind of thing a viewer notices in a
  // video without being able to say why. Anchoring below the debt's own existing minimum clears it just
  // as reliably and changes nothing else on screen.
  sandbox.getState().updateDebt(target.id, {
    balance: Math.max(1, Math.round(target.minimumPayment * 0.6)),
    balanceAsOfDate: anchorDate,
  });
}

/**
 * [D19] — the approved App-Preview arc: **situation → mechanism → proof → trajectory → triumph**, ~25s,
 * inside Apple's 15–30s window.
 *
 * It opens on the PROBLEM rather than on a feature, because a stranger has to recognise themselves before
 * anything else can matter — and it deliberately leaves Today, which the Guardian-only version could not.
 * A preview that never leaves one screen is a demo of one feature, not of the app.
 *
 * **Timed, not tapped.** The in-app demo was going to be tap-through so a viewer could read at their own
 * pace; that decision died with its premise when the demo left the app ([D19]). A capture has no viewer to
 * pace and needs byte-identical takes, so timing is right again — and the re-seed-discards-interaction
 * problem goes with it, since nothing is there to interact.
 *
 * Paced to be READ. The walkthrough's story timers settled on ~1s to notice a change and ~2s to understand
 * one; a stranger reading unfamiliar money needs longer, so no beat is under 4s.
 */
export const DEMO_STAGES: DemoStage[] = [
  { id: 'debts', state: 'clear', screen: '/money', at: 0, beat: 'The situation: three debts, a number you recognise.' },
  { id: 'held', state: 'clear', screen: '/', at: 4000, beat: 'The mechanism: a paycheck lands and the cushion is held at your line, before payoff.' },
  { id: 'absorbed', state: 'tight', screen: '/', at: 9000, beat: 'The proof: a tight paycheck, and the safety net covers it.' },
  { id: 'trajectory', state: 'clear', screen: '/progress', at: 14000, beat: 'The payoff: the ring, the curve, the debt-free date.' },
  {
    id: 'payoff',
    state: 'clear',
    screen: '/',
    at: 20000,
    beat: 'The triumph: a debt one tap from zero. The capture driver confirms it, and the celebration is real.',
    prime: primePayoff,
  },
];

/**
 * The scenario for a stage.
 *
 * ⚠️ `maxGenuineCycles` is deliberately NOT passed, and that omission is the demo's central honesty
 * constraint rather than an oversight. The ceiling is what lets a scripted payday cross the discovery gate
 * so the safety net can RELEASE — the walkthrough passes it because it is teaching what the Guardian does
 * over time. A demo is a day-one view: nobody watching it has a history the app could have learned from,
 * so the reserve is shown being HELD and the scorecard is shown as a future, never as an achievement the
 * viewer has not earned. Pass a ceiling here and the demo starts claiming results.
 */
export function demoScenario(stage: DemoStage): SandboxScenario {
  return personaScenario(stage.state, { premium: true });
}

/**
 * Run the script over `sandbox`, scheduling through the shared registry so a background event cancels it
 * with everything else. `isCurrent` guards every step against landing on a replaced sandbox.
 *
 * The first stage is applied SYNCHRONOUSLY: it is the frame the viewer sees on arrival, and scheduling it
 * would show them the sandbox's default state for a beat first — which on a capture is a wasted opening
 * frame, and in the app is a flicker.
 *
 * **Returns the thing that starts the CLOCK** (3.5.8.9). `stage.at` is measured from the moment the timers
 * begin, and until cycle 8 that moment was the root layout's mount — seconds before a cold launch on a
 * shared CI runner paints anything, so the script ran ahead of the screen and the beats advanced against a
 * tree that had not rendered. `holdClock` separates "the opening state exists" from "the clock is running",
 * which is the only way a beat can be guaranteed to land on something painted. Nothing in the app passes
 * it; the capture does.
 *
 * With `holdClock` unset the returned starter has already run, and calling it is a no-op — so a caller
 * that ignores the return value behaves exactly as before.
 */
export function playDemoRun(
  sandbox: SandboxStoreInstance,
  isCurrent: () => boolean,
  onStage?: (stage: DemoStage) => void,
  opts?: { holdClock?: boolean },
): () => void {
  const apply = (stage: DemoStage) => {
    seedSandbox(sandbox, demoScenario(stage));
    // AFTER the seed — priming shapes the state the scenario just laid down, so seeding second would
    // discard it.
    stage.prime?.(sandbox);
    onStage?.(stage);
  };

  const schedule = () => {
    DEMO_STAGES.forEach((stage) => {
      if (stage.at !== 0) scheduleStoryStep(stage.at, isCurrent, () => apply(stage));
    });
  };

  apply(DEMO_STAGES[0]);

  if (!opts?.holdClock) {
    schedule();
    return () => {};
  }

  // Once. A second release would schedule the whole script a second time over the first — every beat
  // firing twice, the later copy landing mid-capture.
  let released = false;
  return () => {
    // The same staleness guard the steps themselves carry: a release that arrives after the session was
    // torn down must not resurrect its timers.
    if (released || !isCurrent()) return;
    released = true;
    schedule();
  };
}
