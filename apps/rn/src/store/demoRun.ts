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
  /** Milliseconds from the start of the run. */
  at: number;
}

/**
 * Paced to be READ, not to be brisk. Each stage changes a headline figure and a colour, and a viewer who
 * has never seen the app needs to find the number before it moves — the walkthrough's own story timers
 * settled on ~1s to notice a change and ~2s to understand one, and this is the same eye.
 */
export const DEMO_STAGES: DemoStage[] = [
  { id: 'clear', state: 'clear', at: 0 },
  { id: 'tight', state: 'tight', at: 3200 },
  { id: 'at-risk', state: 'at-risk', at: 6400 },
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
