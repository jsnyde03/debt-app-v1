/**
 * T4.2 — the plan's shared user-facing vocabulary, with ONE owner.
 *
 * ⛔ **Why this file exists.** The v1.7 audit's L2 lens found the same shape 23 times: a user-facing
 * string typed into two or more surfaces, agreeing today because nobody has renamed it yet. Two of those
 * tables had **already diverged in production**. Agreeing copies are still copies.
 *
 * ⚠️ **This module owns NOUNS THE USER READS — not the engine's allocation labels.** Measured at T4.2's
 * before-scan: every consumer of `allocation.allocations` filters by **`category`**, never by `label`,
 * and the only labels that reach a screen are the REQUIRED ones (`expense`, `minimum_debt`,
 * `autopay_*`), which are built per-item from the user's own data. The engine's five reserve labels —
 * "Keep cash buffer", "Reserved for upcoming bills", "Held for an upcoming tight cycle", "Safety net",
 * "Leftover cash" — are **never rendered**. ⛔ **So do NOT couple a component to an engine label:**
 * L2-6 proposed exactly that, and it would make five dead strings load-bearing while fixing nothing.
 * The engine's contract is its `category`; its `label` is diagnostic.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * ⚡ **THE DISJOINTNESS RULE — stated here once, and nowhere else.**
 *
 * The Guardian's protected money is TWO nested things, and the UI shows them as two SEPARATE segments:
 *
 *   · **Cushion**  — the whole protected pot (`PROTECTED_CUSHION_CATEGORIES`).
 *   · **Safety net** — the §2.0 held reserve, which is *inside* the cushion (`heldReserve ≤ cushion`).
 *
 * Because the bar draws them side by side, the "Cushion" segment renders the **non-reserve remainder**
 * (`cushion − heldReserve`), so the two read as disjoint and sum to the pot. ⛔ **An edit that treats
 * "Cushion" as the whole reserve double-counts the safety net on screen.**
 *
 * ⚠️ Before T4.2 this rule was prose in FOUR files — `PaydayGuardianCard`, `guardianSubjects`,
 * `PlanHero`, and `paywallLead` — which is the same one-rule-many-owners defect, applied to the
 * explanation instead of the string. Those comments now point here.
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 */

/**
 * The three buckets that partition a paycheck on the Today hero. `PlanHero` owns the visual; these own
 * the words. ⚠️ "Free" was renamed to "Flexible" (Jason ✓) specifically so the discretionary remainder
 * stays distinct from the Guardian's protected cushion — do not reintroduce "Free", and do not reuse
 * "Flexible" for any figure that is protected.
 *
 * ⛔ These are NOT interchangeable with each other's numbers: measured at T4.1, "Flexible"
 * (`remainingAfterRequired − spokenFor`) and the affordability card's spendable figure differ by the
 * held bills reserve. One word per figure.
 */
export const PAYCHECK_SEGMENT = {
    /** Bills + minimums that must be paid this cycle. */
    required: "Required",
    /** Accounted-for but not yet spent: everyday spending + money set aside for upcoming bills. */
    spokenFor: "Spoken for",
    /** The truly discretionary remainder. */
    flexible: "Flexible",
} as const;

/** The whole protected pot, mid-sentence. See the disjointness rule above before pairing with SAFETY_NET. */
export const CUSHION_NOUN = "cushion";

/** The same pot as a Stat/segment label. ⚠️ The Guardian card renders this beside SAFETY_NET_LABEL, so
 *  the disjointness rule above governs the NUMBER it is given — not just the word. */
export const CUSHION_LABEL = "Cushion";

/**
 * The §2.0 held reserve WITHIN the cushion (`discovery_holdback`). ⚠️ The engine emits a matching
 * string, but it is never rendered — this is the one the user reads. Renaming this does not require
 * touching the engine, and renaming the engine's does not change anything on screen.
 */
export const SAFETY_NET_LABEL = "Safety net";

/**
 * The emergency-fund pot, as the user reads it. ⚠️ Written at five sites before T4.2 — the Guardian
 * card's move button, the windfall sheet, the hero framing, and twice in the brief — and the card's
 * own comment records a SHIPPED defect where the button called this pot "savings" while spending it.
 * Lower-case: it appears mid-sentence ("Move $150 from your emergency fund").
 */
export const EMERGENCY_FUND_NOUN = "your emergency fund";

/**
 * The everyday-spending half of `PAYCHECK_SEGMENT.spokenFor` — the living-expenses reserve, and the
 * screen that manages it. ⚠️ Added in T4.4 because **the strings gate caught the duplication as it was
 * being created**: retiring "Living Expenses" put this phrase in three files at once. It is the tab-level
 * name; the surrounding sentences ("…reserved each paycheck") stay local to their screens.
 */
export const EVERYDAY_SPENDING_LABEL = "Everyday spending";

/**
 * The Guardian's three cash states, as the user reads them (T4.5 / audit L1-7). The engine's states are
 * `clear` | `tight` | `at-risk`; "Crunch" was a fourth name for the third one.
 *
 * ⛔ **A SHORTFALL IS NOT ONE OF THESE.** L1-7 lists `PlanHero`'s "Short this paycheck" among the names
 * for this state — it is not. That string fires on `summary.status === 'short'` (`shortfall > 0`: the plan
 * cannot cover its obligations), while `at-risk` is a floor-relative *cushion* read that can happen with
 * no shortfall at all. Folding them together would put one word on two different conditions. The Guardian
 * already words the shortfall separately, as *"This paycheck won't cover everything"*.
 */
export const GUARDIAN_STATE_LABEL = {
    clear: "Clear",
    tight: "Tight",
    "at-risk": "Very tight",
} as const;
