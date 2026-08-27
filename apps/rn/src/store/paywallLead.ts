import type { PlanSummary } from '@/store/planSelectors';
import { formatWhole } from '@/utils/format';

export interface PaywallLead {
  /** A fact about THIS user's money, in their own numbers. */
  fact: string;
  /** What Premium does about it — scoped to what it actually does. */
  offer: string;
}

/**
 * The paywall's opening line, sourced from the reader's own plan.
 *
 * ⛔ **Audit L5-12.** The paywall was identical for a user 40 seconds in and one three months in who had
 * just hit a shortfall, and identical whether they arrived from the Guardian, from "Can I afford it?",
 * or from More. Four abstract benefit lines argued with a person already holding the evidence.
 *
 * ⚠️ **THE COPY IS THE RISK HERE, NOT THE MECHANISM.** The finding's own suggested line was *"Premium
 * keeps it at your line every payday, automatically"* — and BOTH halves of that are claims this product
 * has already retired:
 *   · *"every payday, automatically"* contradicts "Your Guardian suggests — it never moves your money",
 *     which is the differentiator (L1-2 removed "autopilot" from this very screen).
 *   · *"keeps it at your line"* is the unconditional cushion promise L1-3 removed from the benefit list,
 *     because the bullet two rows down sells a Recovery Plan for the cycles where it does NOT hold.
 * So the lead states a MEASURED fact and an offer scoped to what the tier actually changes.
 *
 * ⭐ The real, checkable differentiator — `effectivePaycheckBuffer`: free reserves a flat
 * `BASE_PAYCHECK_BUFFER`, premium reserves the floor the user chose. That is a fact about the engine,
 * it is not stated anywhere else on this screen, and it cannot be contradicted by a tight cycle.
 *
 * ⚠️ **T4.0 (glossary) — this line says "cushion", and that is load-bearing.** It first shipped as
 * *"You have $X flexible this paycheck"* while printing `summary.cushion` (= `allocation.remaining`,
 * which `planSelectors` itself labels *"cushion this paycheck"*). But **"Flexible" is `PlanHero`'s label
 * for a DIFFERENT, smaller number** (`remainingAfterRequired − spokenFor`) — so the screen called one
 * figure flexible and then said it was protected. The vocabulary and the reason it is split that way
 * live in `@core/copy/vocabulary`. ⛔ **Do not reach for "flexible", "buffer" or "breathing room" here:
 * this function only ever prints the cushion, and `paywallLead.test.ts` reds if those words return.**
 *
 * Returns `null` when there is no live plan — the route is deliberately open pre-onboarding, and a
 * viewer with no numbers must see today's paywall rather than an invented one.
 *
 * ⛔ **AND THE SAME `null` COVERS "THE APP COULD NOT READ THE PLAN'S INPUTS."** [S1.10.6.2 · pass-3 C-5]
 *
 * ⚡ Measured: a user whose imported file lost one card's $400 minimum was told **"This paycheck comes up
 * $100 short."** on a cycle that is **$500** short — and then sold a Recovery Plan sized against a number
 * wrong by 4×, on the one surface where the app asks for their money. Both branches print a figure derived
 * from allocation arrays that a repaired `$0` obligation silently leaves, which is exactly what
 * `'required-plan'` exists to gate. ⚠️ The milder reading understates it: the `cushion` branch runs on the
 * non-shortfall path too, so the same store can promise a cushion while the plan is missing an obligation.
 *
 * ⛔ **`mayStatePlanFigures` is a REQUIRED parameter, not an internal check, and that is the fix.** The
 * pass-2 remedy wired `mayClaim(store,'required-plan')` to precisely one consumer (`index.tsx:529`) and
 * this file was the second claim site of the same class on the same store. A required argument means the
 * next consumer cannot be added without answering the question — the compiler asks, rather than a person
 * remembering. This module deliberately takes no store: it is pure, and `paywallLead.test.ts` pins that.
 */
export function paywallLead(
  summary: PlanSummary | null,
  freeBuffer: number,
  mayStatePlanFigures: boolean,
  from?: string | null,
): PaywallLead | null {
  if (!summary || !mayStatePlanFigures) return null;

  // The most urgent true thing first: a cycle that does not cover itself outranks everything else.
  if (summary.shortfall > 0) {
    return {
      fact: `This paycheck comes up ${formatWhole(summary.shortfall)} short.`,
      offer: 'Recovery Plan is the guided catch-up for a cycle like this one.',
    };
  }

  const cushion = formatWhole(summary.cushion);

  // They reached for the forecast specifically — answer the thing they went looking for.
  if (from === 'cushion-forecast') {
    return {
      fact: `You have ${cushion} cushion this paycheck.`,
      offer: 'Premium plots it across your next six paydays, and marks where it dips below your line.',
    };
  }

  return {
    fact: `You have ${cushion} cushion this paycheck.`,
    offer: `Your plan protects a flat ${formatWhole(freeBuffer)} of it. Premium protects the line you choose instead.`,
  };
}
