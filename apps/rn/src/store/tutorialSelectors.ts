import type { DebtStore } from '@/data/models';

/**
 * 3.5.1 — WHO is offered the Guardian tutorial, and WHICH run they get.
 *
 * The design gate (Jason 2026-07-30) settled two things: the tutorial arrives as an **invitation in the
 * VIS-4 ack-slot on the first Today view — never a takeover** — and **all four audiences** get exactly
 * one offer: new-premium · new-free · free→premium upgraders · existing v1.6 users.
 *
 * The whole matrix lives here as a pure function so it's testable without rendering anything, and so
 * "who sees this" can never drift between the card, the replay entries and the tests.
 *
 * Why `prefs.tutorialSeen` and not `guardianIntroSeen`: the latter is already `true` for every existing
 * v1.6 user (the old static intro), so reusing it would silently exclude precisely the audience the gate
 * chose to include. And why a value rather than a boolean: someone who saw the FREE run and later
 * upgrades is re-offered once.
 *
 * ⚠️ [E4] What that re-offer is worth CHANGED, and this comment used to state the old reason as fact:
 * "the premium run reaches beats free never does (the held reserve, Recovery, the release)". That was
 * true before [D9], when a free user's walkthrough ran on their own gated card. [D9] made every audience
 * run the same premium Guardian on scripted money, so the two runs are now beat-identical and differ in
 * exactly ONE string — the finale's `bodyByRun`, where the free run names premium as what did the
 * holding and the premium run speaks to someone who already has it. (This used to quote the premium line
 * verbatim as "…with your real paycheck" — the exact phrasing [A4] later removed as untrue of a premium
 * user with no paycheck yet. A comment written to correct a stale claim had acquired one; quoting copy
 * is how that keeps happening, so it doesn't any more.)
 *
 * So the re-offer still has a real payload for an upgrader — the finale is the beat written for who they
 * now are, and it's the conversion-honesty beat — but it is one paragraph, not four beats. Whether that
 * justifies replaying all seven is a DESIGN question belonging to the 3.5.1 gate that set this matrix,
 * not something to quietly flip here. Behaviour is unchanged; only the false justification is corrected.
 */

export type TutorialRun = 'free' | 'premium';

export interface TutorialInvite {
  /** Which run to open — also what gets recorded when they finish or dismiss it. */
  run: TutorialRun;
}

/** The run this user would get right now, based purely on their tier. */
export function tutorialRunFor(store: DebtStore): TutorialRun {
  return store.subscriptionPlan === 'premium' ? 'premium' : 'free';
}

/**
 * The first-run invitation, or `null` when they've already been offered the run they'd get.
 *
 * Gated on `onboardingComplete` so the offer can't appear over the onboarding flow — a user still
 * entering their numbers has no plan for the tutorial to hand back to at its finale.
 */
export function selectTutorialInvite(store: DebtStore): TutorialInvite | null {
  if (!store.prefs.onboardingComplete) return null;

  const run = tutorialRunFor(store);
  const seen = store.prefs.tutorialSeen;

  // Never offered → offer.
  if (seen === null) return { run };
  // Saw the free run, now premium → offer the premium run once (its finale is the one written for them).
  if (seen === 'free' && run === 'premium') return { run: 'premium' };
  // Otherwise they've had the run they'd get. Replay stays reachable from the "?" and More.
  return null;
}

/** Record that a run was seen — on completion OR dismissal (a dismissed offer is an answer). */
export function markTutorialSeen(prefs: DebtStore['prefs'], run: TutorialRun): DebtStore['prefs'] {
  // Never downgrade a recorded premium run to free: a premium user who later lapses shouldn't be
  // re-offered the lesser run as if they'd never seen the fuller one.
  if (prefs.tutorialSeen === 'premium') return prefs;
  return { ...prefs, tutorialSeen: run };
}
