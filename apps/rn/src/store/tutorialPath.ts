import type { SandboxState } from './sandboxScenarios';
import type { TutorialRun } from './tutorialSelectors';

/**
 * 3.5.2 — the tutorial PATH: step sequencing, skip, and interrupt-resume, as pure logic.
 *
 * Deliberately content-agnostic. The beats themselves are 3.5.3's — this owns only "where am I, how do
 * I move, and where do I come back to". Keeping it pure means the whole path is testable without
 * rendering anything, which matters because the failure mode here is a step you can't leave or can't
 * reach, and that's exactly what a render test tends to miss.
 */

export interface TutorialStepDef {
  /** Stable id — used for resume and as the e2e's handle on a step. */
  id: string;
  /** Shown as a heading AND announced on entry (screen-reader users get the same signal sighted ones do). */
  title: string;
  /** One line of body copy. */
  body: string;
  /**
   * 3.5.3.3.1 — the registered subject this beat coaches (see `tutorialTargets`). Omitted for a beat
   * that addresses the whole screen; the overlay then falls back to an uncut scrim rather than
   * spotlighting something arbitrary.
   */
  target?: string;
  /**
   * 3.5.3.3.2 — the Guardian state this beat NARRATES. Entering the beat re-seeds the sandbox to it,
   * which is what lets one arc show a clear paycheck, then a short one, then a clear one again without
   * the user having to produce those states themselves.
   *
   * Declared per beat rather than accumulated, so entering a beat is idempotent: stepping Back and
   * forward lands on byte-identical state, and a beat can never inherit a mess left by the one before.
   * (The trade, accepted: a change the user made on an interactive beat doesn't survive stepping away
   * and returning — each beat is a fresh scripted stage.)
   */
  state?: SandboxState;
  /**
   * 3.5.3.4.2 — guidance to carry into a modal this beat sends the user into. Declared here so the
   * walkthrough's copy stays in one file rather than being smuggled into the component that happens to
   * present the sheet.
   */
  coach?: string;
  /**
   * 3.5.3.5.5 — where to look once the beat's story has PAID OFF.
   *
   * A beat that ends in something happening has two subjects, not one: the control you act on, and the
   * result. Beat 4's result — the safety-net release — renders in Today's ack slot at the top of the
   * screen, while the spotlight is holding the view down on the attestation. Without this the user never
   * sees the thing the beat exists to produce, and the ring is left framing a control that has since
   * retired along with the net.
   */
  payoffTarget?: string;
  /**
   * 3.5.3.6.2 — copy that must differ by AUDIENCE.
   *
   * Only the finale uses this, and it is the reason [D9] is honest rather than a bait-and-switch: the
   * walkthrough shows every audience a premium Guardian, so the hand-back has to say plainly that
   * premium is what did the holding, and what a free user's own card will and won't do. The
   * `PremiumInvite` doesn't render during a walkthrough, so this is where the whole conversion framing
   * lands — and where it would be a lie if it were vague.
   */
  bodyByRun?: Partial<Record<TutorialRun, string>>;
}

/**
 * The body a given audience actually reads. ONE resolver, used by both the overlay and the
 * announcement — if they each did their own lookup, a VoiceOver user could be read the premium line
 * while a free user's screen showed a different one. That exact class of drift already cost this phase
 * an entire dropped announcement (3.5.3.3.4.1).
 *
 * A beat's copy depends on the AUDIENCE and on nothing else. It deliberately cannot vary with anything
 * measured at runtime: [D15] made it vary with whether the coached control had been measured, and since
 * a different-length paragraph is a different dock height, and the dock height re-keyed the measurement,
 * the beat flipped between two paragraphs five times in eight seconds. What a beat says is now decided
 * before the app runs, and `guardianSubjects.test.ts` proves the ask is honest for every beat.
 */
export function stepBody(step: TutorialStepDef, run: TutorialRun): string {
  return step.bodyByRun?.[run] ?? step.body;
}

/**
 * 3.5.3.3.3 — the arc's copy.
 *
 * Two rules it is written to, both learned the hard way in this phase:
 *
 *  1. **Every line must be true of what is actually on the screen behind it.** The placeholder copy
 *     promised "what to cover first, and what can safely wait" over a card reading "Nothing here can
 *     safely wait this paycheck" — the scenario had no deferrable bill. Copy that describes a screen it
 *     doesn't match teaches the user to distrust the screen.
 *  2. **True of the SANDBOX screen, and reconciled with the tier at the finale.** ⚠️ This rule used to
 *     read "true on BOTH tiers", on the premise that a free user saw gated beats — an invitation where
 *     a premium user saw a built Recovery plan. [D9] retired that split: every audience now runs the
 *     same premium Guardian on scripted money, so SIX of the seven beats render identically and there is
 *     no per-tier screen for the copy to straddle. (Six, not all seven — the finale differs by audience
 *     via `bodyByRun`, which is the mechanism described 30 lines above this paragraph. An absolute
 *     contradicted by its own file.) The obligation moved rather than disappeared, and got
 *     sharper: the beats describe what the GUARDIAN does, and the FINALE (`bodyByRun`) is the one place
 *     that says which of it was premium. Vagueness there is what would make [D9] a bait-and-switch.
 *     Flagged by the [E1–E4] claim-vs-code lens: the [D9] change updated the code and the LOG, not the
 *     comments in this file that argued for the old shape.
 *
 * Deliberately not word-perfect: the whole-app wording/voice audit polishes every string in one pass
 * ([[don't over-lock wording mid-build]]). These are solid, professional, and honest — that's the bar here.
 */
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  // Opens on the card itself rather than on a claim about it — the first thing to establish is that
  // this number is decided BEFORE payoff, which is the one genuinely unfamiliar idea in the app.
  { id: 'intro', title: 'Money set aside first', body: 'Every payday, your Guardian keeps a cushion back before anything extra goes to your debt.', target: 'guardian-card', state: 'clear' },
  // [A3] NOT "the whole paycheck" — the bar's domain is `cushion + deployedToDebt`, i.e. what's left
  // AFTER bills and minimums. The old line was ~$740 of a $2,000 paycheck with the real figure in the
  // hero directly above it: a user either builds a wrong model or notices it doesn't add up and stops
  // trusting the bar. Naming the three zones also covers the "Safety net" segment the old copy ignored.
  { id: 'bar', title: 'Where this paycheck went', body: 'After your expenses and minimums, this is what was left — held back as your cushion and safety net, or sent to your debt.', target: 'guardian-bar', state: 'clear' },
  // "Your line" is the app's own term for the floor, so the beat teaches the word as well as the control.
  // Interactive. Spotlights the CONTROL, not the readout — on a beat where the user has to do something,
  // pointing at the number tells them where to look but not what to do.
  {
    id: 'line',
    title: 'Your line',
    body: 'This is the least you want to keep. Open it and move the line — the whole plan re-solves around it.',
    target: 'guardian-adjust',
    state: 'clear',
    coach: 'Drag the line, then Save — your plan re-solves around it.',
  },
  // Interactive ([D10]). A surprise is an EVENT, not a control — the real app records one at the payday
  // check-in — so the thing the user DOES here is the real Guardian control that changes the reserve:
  // confirming their bills. The surprise, the absorb and the release then play as the scripted payoff.
  {
    id: 'reserve',
    title: 'A little extra, at first',
    // [B1] The old line stopped at "it holds less", and then the scripted surprise visibly UNDID that:
    // `recordSurpriseOutflow` un-attests and restores the full hold, so the net jumped back up and the
    // control reverted — reading as if the user's tap had silently failed.
    //
    // That walk-back is CORRECT behaviour, not a bug: a surprise proves the bills weren't complete after
    // all, so the Guardian puts the net back. The honest fix is to teach it rather than hide it — this is
    // the app being protective, which is the whole point of the beat. So the copy now names the full
    // shape: you say the bills are in, it holds less, a surprise proves otherwise, it restores the net.
    body: 'While your Guardian is learning your expenses it holds a bit more back. Tell it your expenses are all in and it holds less — and if a surprise proves otherwise, it puts the net straight back.',
    target: 'guardian-reserve',
    payoffTarget: 'today-ack',
    state: 'clear',
  },
  // The one beat that deliberately puts the card into trouble — the Recovery glimpse. It's also the
  // beat the Example marker was built for: a real-looking shortfall, on figures scaled from their pay.
  // Says what the GUARDIAN does rather than naming the rendered plan. Post-[D9] every audience sees the
  // built plan here (the sandbox is premium for everyone), so this is no longer straddling two screens —
  // it is keeping the promise at the level the finale can honestly settle up on.
  { id: 'recovery', title: "When it won't stretch", body: 'Some paychecks come up short. Your Guardian works out what has to be covered now, and what can safely wait.', target: 'guardian-card', state: 'at-risk' },
  // …and back out of trouble deliberately: nobody should be handed back to their own money while the
  // last thing they saw was a red card.
  // "…is yours to overrule" invited a tap this beat can't honour: it's scripted, so the cutout lights the
  // card without passing touches, and a user taking the line literally got silence on the one beat whose
  // message is that they're in control. The claim is about the app, not about right now — so it says so.
  { id: 'yourcall', title: 'Always your call', body: 'Your Guardian suggests — it never moves your money. Every number here stays yours to overrule, once this tour is done.', target: 'guardian-card', state: 'clear' },
  // The hand-back. Both lines end by orienting ("debts live in Money…"), and the free one names what
  // premium actually did — because for the last seven beats it was premium doing it.
  {
    id: 'handback',
    title: 'Over to your plan',
    body: 'That was example money. This is your own paycheck, and your Guardian is already watching it.',
    bodyByRun: {
      // [A4, round 2] "with your real paycheck" was the same defect the free line had been rewritten to
      // avoid, left standing one line above it. The invitation gates on `onboardingComplete` and NOT on
      // having a paycheck, so a premium user can finish onboarding without one, take the walkthrough,
      // and be told their Guardian is already doing this "with your real paycheck" — then hand back to a
      // card reading "Set up your paycheck". Fixing an audience-specific claim in one branch of a
      // per-audience string and not the other is how the [A4] class survives its own fix.
      premium: 'That was example money — your Guardian does exactly this with every paycheck you add, all on your device. Your debts live in Money, your progress in Progress.',
      // [A1/A2] The audit caught two lies in the previous version of this line.
      //  1. It said "you decide what to hold". A free user CANNOT: `showAdjust` is premium-gated and the
      //     card's sheet is the only route to `setCushionFloor` in the whole app. It named a capability
      //     they do not have, in the one beat [D9]'s honesty depends on.
      //  2. It named only the HOLDING. The walkthrough demonstrates three premium behaviours — holding
      //     the line, holding extra while the Guardian learns their bills, and building the catch-up
      //     plan when a paycheck is short. Naming one of three is not naming what premium did.
      // It also no longer asserts what their own card shows: the invitation is offered to users who have
      // finished onboarding WITHOUT a paycheck [A4], and those land on "Set up your paycheck", not a card.
      // Tightened after LOOKING at it: the honest version ran six lines in the dock, which made the one
      // beat that has to land — the hand-back, where a free user learns what they just saw was premium —
      // the least readable moment in the arc. Every one of the three behaviours survives; only the words
      // around them went. (Final polish still belongs to the whole-app wording audit.)
      free: 'That was example money — premium is what did the holding: your cushion kept at your line, a little extra held while it learns your expenses, and a catch-up plan when a paycheck comes up short. Your own plan is next — your debts live in Money, your progress in Progress.',
    },
    target: 'guardian-card',
    state: 'clear',
  },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;

/**
 * 3.5.3 gate (Jason 2026-07-31) — the TWO beats where the user actually does something; the other five
 * are scripted reveals. On these the scrim is CUT AROUND the subject so the real control underneath is
 * reachable through the hole (3.5.3.5.9 — it used to drop the scrim entirely, which left every other
 * control on screen live too), and each must be VoiceOver-OPERABLE, not merely readable — which is
 * precisely why the count is two: every added control multiplies that obligation and the ways a step can
 * trap someone.
 */
export const INTERACTIVE_STEP_IDS: string[] = ['line', 'reserve'];

/** Clamp a persisted resume point back into range — a shorter arc must never strand a returning user. */
export function resumeIndex(saved: number | null | undefined, count: number = TUTORIAL_STEP_COUNT): number {
  if (saved == null || !Number.isFinite(saved)) return 0;
  const i = Math.floor(saved);
  if (i <= 0) return 0;
  // Resuming ON the last step is fine; past it means the arc shrank → start over rather than dead-end.
  return i < count ? i : 0;
}

export function isLastStep(index: number, count: number = TUTORIAL_STEP_COUNT): boolean {
  return index >= count - 1;
}

export function nextIndex(index: number, count: number = TUTORIAL_STEP_COUNT): number {
  return Math.min(index + 1, count - 1);
}

export function prevIndex(index: number): number {
  return Math.max(index - 1, 0);
}

/**
 * What a screen reader hears on entering a step. Position is spoken FIRST because a VoiceOver user has
 * no progress dots to glance at — without it they can't tell whether they're two steps in or six.
 */
export function stepAnnouncement(
  index: number,
  run: TutorialRun = 'premium',
  steps: TutorialStepDef[] = TUTORIAL_STEPS,
): string {
  const step = steps[index];
  if (!step) return '';
  // 3.5.3.11 — "Example money" is spoken in the same slot the dock shows it. The visible marker and the
  // spoken one must not diverge: a sighted user reads it in the progress row on every beat, so a
  // VoiceOver user hears it on every beat. Without this the one user who cannot see the card's Example
  // chip would be the only one never told the money is fictional — on a screen that, by beat 5, is
  // reciting their real debts inside an invented shortfall.
  //
  // Through the SAME resolver the screen uses — a VoiceOver user must hear the line their screen shows,
  // and the finale is precisely where those diverge by audience.
  return `Step ${index + 1} of ${steps.length}. Example money. ${step.title}. ${stepBody(step, run)}`;
}
