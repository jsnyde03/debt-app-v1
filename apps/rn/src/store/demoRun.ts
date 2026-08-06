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
 */
export function playDemoRun(sandbox: SandboxStoreInstance, isCurrent: () => boolean, onStage?: (stage: DemoStage) => void): void {
  DEMO_STAGES.forEach((stage) => {
    const apply = () => {
      seedSandbox(sandbox, demoScenario(stage));
      onStage?.(stage);
    };
    if (stage.at === 0) apply();
    else scheduleStoryStep(stage.at, isCurrent, apply);
  });
}
