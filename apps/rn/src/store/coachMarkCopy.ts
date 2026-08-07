/**
 * 3.5.5.1 — what each coach-mark says, keyed by the `TutorialTarget` id it points at.
 *
 * Separate from the layer that renders it because the INVENTORY is its own step (3.5.5.4): every entry
 * here has to be verified reachable before it earns a mark, and the parked list had two entries that did
 * not resolve against the code. Keeping the copy in one table makes "which affordances do we claim to
 * teach" answerable by reading one file rather than by grepping components.
 *
 * House voice: direct "you". The Guardian is the app's only first-person "I", and a coach-mark is the app
 * pointing at a control — not the Guardian speaking.
 *
 * ⚠️ Deliberately starts nearly EMPTY. 3.5.5.1 ships the primitive; 3.5.5.4 fills this table, one entry
 * per affordance that has been confirmed to exist and be reachable. Shipping a full list now would be
 * writing marks for controls nobody has re-verified since the inventory drifted — which is how the parked
 * decomposition ended up promising a toggle that did not exist (→ 3.7.A9).
 */
export interface CoachMarkCopy {
  /** A short name for the thing, not a sentence. */
  title: string;
  /** One sentence on what it does — never on how to tap it. */
  body: string;
}

export const COACH_MARKS: Record<string, CoachMarkCopy> = {
  // The first entry, and the one 3.5.5.5 exists for: 3.7.A0 MOVED this control for discoverability and it
  // is currently off-screen on the largest iPhone. The mark is written; it is not registered anywhere
  // until L5 puts the row where a finger can reach it.
  'payoff-schedule': {
    title: 'See the whole payoff',
    body: 'Every payment from here to debt-free, month by month.',
  },
};
