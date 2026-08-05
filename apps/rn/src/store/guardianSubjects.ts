import type { GuardianState } from './guardianSelectors';

/**
 * 3.5.3.9 — which coachable subjects the Guardian card puts on screen, as pure logic.
 *
 * This exists to make one thing provable at build time: **every beat's seeded state renders the subject
 * that beat coaches.** The walkthrough's states are scripted, so that is a static property of the arc —
 * not something to discover at runtime and apologise for.
 *
 * The previous shape discovered it at runtime: the beat measured its subject, and if the measurement
 * came back empty the copy changed to a version that doesn't ask for the missing control. That coupled
 * the copy to the layout — different copy is a different dock height, and the dock height re-keyed the
 * measurement — so on a degraded beat the two chased each other: five copy flips in eight seconds, the
 * dock jumping ~45px, the haptic and the whole VoiceOver announcement re-firing on each one. A runtime
 * answer to a build-time question bought a feedback loop and nothing else.
 *
 * The card renders from this function and `guardianSubjects.test.ts` asserts the arc against it, so the
 * assertion cannot drift from the render the way two hand-written lists do.
 */

export interface GuardianSubjectInputs {
  /** Post-[D9] the sandbox runs premium for every audience, so inside a walkthrough this is always true. */
  isPremium: boolean;
  state: GuardianState;
  /** §2.0.d — a stale advisory withdraws the verdict, and with it the "adjust your line" move. */
  stale: boolean;
  /** §2.6 — a built catch-up plan (premium, shortfall cycles). */
  hasRecovery: boolean;
  /** §2.10 — the "move $X from savings" one-tap. */
  hasTopUp: boolean;
  /** §2.0.c — a discovery safety net is held, so the bills-complete affordance is offered. */
  attestationShown: boolean;
}

/** Subjects the card owns. `guardian-card` is registered by the host and included here for completeness
 *  of the arc's inventory — it renders whenever there is a brief to render at all.
 *  ⚠️ Hand-maintained, and NOT read by `guardianSubjects()` below, which builds its own set. The real
 *  orphan check — every registered `TutorialTarget` is coached by some beat, and vice versa — is
 *  `spotlight.test.ts`, which derives the registered set by scanning the source. */
export const GUARDIAN_CARD_SUBJECTS = ['guardian-card', 'guardian-bar', 'guardian-adjust', 'guardian-reserve'] as const;

/**
 * The number the Guardian card LABELS "Cushion".
 *
 * Not `brief.cushion`. The held reserve is WITHIN cushion, and the card deliberately shows the
 * non-reserve remainder so "Safety net" and "Cushion" read as disjoint segments matching the bar
 * (COH-2). Anything that narrates a cushion figure to the user must resolve it the same way, or it
 * quotes numbers that appear nowhere on screen — which is what the walkthrough's floor payoff did:
 * "Cushion $413 → $323" over a card reading "Cushion $50", on the one beat whose job is to teach this
 * vocabulary. The delta was right; the absolutes were unfindable.
 */
export function displayCushion(brief: { cushion: number; heldReserve: number }): number {
  return brief.heldReserve > 0 ? brief.cushion - brief.heldReserve : brief.cushion;
}

/**
 * The ids actually mounted for a given Guardian read. Mirrors the render conditions in
 * `PaydayGuardianCard` — which calls this rather than repeating them.
 */
export function guardianSubjects(i: GuardianSubjectInputs): Set<string> {
  const ids = new Set<string>(['guardian-card', 'guardian-bar']);
  // "Adjust your line" only makes sense when you're covered: lowering your safety line is the wrong move
  // in a shortfall, and while stale the move is "update your numbers" instead.
  if (i.isPremium && !i.stale && i.state !== 'at-risk') ids.add('guardian-adjust');
  // At most one of recovery / top-up / attestation ever renders — they are different Guardian states.
  if (i.isPremium && !i.hasRecovery && !i.hasTopUp && i.attestationShown) ids.add('guardian-reserve');
  return ids;
}
