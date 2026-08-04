/**
 * What an interactive beat does when its coached control cannot be found.
 *
 * Pure, because that is the only way this repo can assert it: `apps/rn` has no component or hook test
 * runner (its devDependencies are `typescript` and `@types/react`), so a decision left inline in a
 * `useEffect` is unassertable by construction. The house idiom is already this — see `spotlightGeometry`.
 *
 * The rule the walkthrough follows: **never remove a beat from the arc.** A subject that cannot be
 * measured means the user cannot perform the ask, not that the lesson is void — so the beat stays,
 * loses its instruction, and reads as a scripted reveal. Silently advancing past it shortens a 7-beat
 * arc with no explanation, strands the step counter, and makes Back appear dead (pressing it re-enters
 * a beat that immediately advances again).
 */

/** A verdict names the subject it was reached for. A bare boolean cannot say WHICH beat failed, and a
 *  verdict that outlives its beat is read by the next one. */
export type MeasureVerdict = string | null;

export function isSubjectMissing(a: {
  /** The subject this beat is currently coaching. */
  targetId: string | null;
  /** The subject a concluded, failed measurement was reached for. */
  unmeasurableFor: MeasureVerdict;
}): boolean {
  if (!a.targetId || a.unmeasurableFor === null) return false;
  // The identity check is the whole fix. `line` and `reserve` are adjacent interactive beats, so a bare
  // boolean surviving one commit past its beat made beat 3's failure delete beat 4 as well — a beat that
  // was never measured at all.
  return a.unmeasurableFor === a.targetId;
}

/**
 * Should this beat drop its interactive ask and render as a scripted reveal?
 *
 * Only for a beat that HAS an ask, whose subject is genuinely gone, and which the user has not already
 * acted on — a payoff on screen means they completed it, and taking that away would delete a result they
 * earned.
 */
export function shouldDegradeToScripted(a: {
  interactive: boolean;
  /** The user has already acted on this beat (a payoff is showing, or their floor write was recorded). */
  acted: boolean;
  targetId: string | null;
  unmeasurableFor: MeasureVerdict;
}): boolean {
  if (!a.interactive || a.acted) return false;
  return isSubjectMissing({ targetId: a.targetId, unmeasurableFor: a.unmeasurableFor });
}
