/**
 * T4.2 — the plan's shared user-facing vocabulary, with ONE owner.
 *
 * ⛔ **Why this file exists.** The v1.7 audit's L2 lens found the same shape 23 times: a user-facing
 * string typed into two or more surfaces, agreeing today because nobody has renamed it yet. Two of those
 * tables had **already diverged in production**. Agreeing copies are still copies.
 *
 * ⚠️ **This module owns the user-facing NOUNS — and, since T8, the CLAIMS that must not diverge
 * (`PRIVACY_CLAIM`). It does not own the engine's allocation labels.** Measured at T4.2's
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
/**
 * ⛔ **T8 / audit L2-3 — the privacy promise, which was written FOUR ways** (the finding said three; a
 * fourth was on the paywall). `more.tsx` said *"stays on this device"*, onboarding *"stays on your
 * device"*, the embed dock *"Your money stays on your device"*, the paywall *"never leaves your device"*
 * — and three of them independently re-typed the heading "Private by design".
 *
 * ⚠️ **This is the app's strongest trust claim**, which is exactly why four spellings is the wrong number:
 * a promise the user meets in four wordings reads as marketing rather than as a commitment, and a legal
 * or product change to it would have to find all four.
 *
 * ⚠️ **`short` is deliberately weaker, and must stay that way.** It is the public-embed line, and its
 * site comment records why: it avoids [D32]'s absolute ("100% private" overclaims — every host logs IPs).
 * Deriving it from `body` would re-introduce the claim [D32] refused.
 */
export const PRIVACY_CLAIM = {
    /** The heading, wherever the promise is titled. */
    headline: "Private by design",
    /** The full claim, scoped to financial data (A10) — never to "everything". */
    body: "your financial data stays on this device",
    /** The second half of the pledge. ⚠️ Passive on purpose: T7/L1-11 retired the corporate "we". */
    noSelling: "you’ll never be sold more debt",
    /** The embed's deliberately smaller claim — see the [D32] note above. */
    short: "Your money stays on your device.",
    /**
     * [C6 · T1] The line at the FIRST data-entry moment — `PaycheckStep`, where the app asks for money
     * for the first time. `DEBT_BENCH_TRUST_FIRSTRUN` §R1 pairs it with T3 as the highest-leverage trust
     * change, on Apple's principle of stating the promise at the moment of data USE rather than in a
     * settings screen nobody opens.
     *
     * ⛔ **NOT §R1's own wording, and the difference is [D41].** The doc was written 2026-07-20 and says
     * *"nothing uploaded — it works with your phone in airplane mode."* Cloud backup shipped 2026-08-21,
     * so both halves of that sentence are now false. Shipping it verbatim would have put a brand-new
     * false privacy claim at the moment a user is deciding whether to trust the app with their income.
     *
     * ⚠️ **Scoped to "our servers", deliberately, which is [D41]'s own frame.** Optional iCloud backup
     * keeps data in the user's OWN Apple account, not ours — and it is opt-in and default OFF ([D47]),
     * so at this moment in first-run it is definitionally off. "No account" is separately true: there
     * has never been one. What this must never become is [D32]'s absolute ("100% private") or a claim
     * about *everything* rather than the user's numbers.
     */
    atEntry: "No account needed — your numbers never go to our servers.",
} as const;

/**
 * The confirm on a destructive REPLACE — one wording for every door that overwrites the whole portfolio.
 *
 * ⛔ Extracted at P6.3.3.5 because `lint:copy` caught the iCloud sheet creating a second copy of the file
 * importer's label. Two doors onto one irreversible action must not be able to describe it differently:
 * the day they diverge, one of them is the weaker warning, and nobody notices until someone loses data.
 *
 * ⚠️ It names what the user is AGREEING TO, not the mechanism ("Replace", not "Import" or "Restore") —
 * the destructive half is the half that has to be unambiguous on a button.
 */
export const REPLACE_DATA_ACTION = "Replace my data";

export const GUARDIAN_STATE_LABEL = {
    clear: "Clear",
    tight: "Tight",
    "at-risk": "Very tight",
} as const;

// ── P6.4.4 · the audit's L2 "should-be-shared" tier ──────────────────────────────────────────────
//
// ⛔ **Each of these was judged one at a time against L2-6's refutation, not batched.** L2-6's suggested
// fix — export the ENGINE's allocation labels and have a card import them — would have made five dead
// strings load-bearing, and it is the reason a duplicate is not automatically a constant. Every name
// below is a string the user actually reads, on two or more shipping surfaces, where a rename that
// reached one site and not the other would be visible. ⚠️ Findings that did NOT clear that bar stayed
// out: L2-14 ("Autopay") and L2-22 ("BNPL") are domain nouns a rename would touch deliberately, and a
// constant there buys indirection with no safety → 2.1.

/** The premium CTA. ⚠️ `paywall.tsx` composes it with a price (`"Unlock Premium — $29.99"`), so this is
 *  the phrase, never the whole button. Three shipping surfaces: More, the paywall, the demo dock. */
export const UNLOCK_PREMIUM_CTA = "Unlock Premium";

/**
 * The log-a-payment action, as its ENTRY POINTS name it.
 *
 * ⚠️ Deliberately not applied to the submit button. `LogPaymentSheet`'s title is a noun phrase
 * ("Log a payment") and its button is an imperative ("Log payment") — that is correct English, not
 * drift. What WAS drift is the two doors *into* that sheet disagreeing: the debt sheet's link said
 * "Log a payment" and the row menu said "Log payment", so one entry point named the destination and
 * the other did not. Both now read the sheet's own title.
 */
export const LOG_PAYMENT_ENTRY = "Log a payment";

/** The per-debt amortization feature. Three surfaces: the route header, the iPad pane's own title (it
 *  has no route header), and the row menu that opens them. A rename must reach all three or the user
 *  cannot tell they arrived where they tapped. */
export const PAYOFF_SCHEDULE_TITLE = "Payoff schedule";

/** The overdue bucket. ⚠️ `planSelectors` both DECIDES overdue-ness and names the bucket; the card
 *  labelled individual rows from its own literal, so renaming the state left the pill saying the old
 *  word for the same rows. The tone token `'overdue'` was already shared — only the word was not. */
export const OVERDUE_LABEL = "Overdue";

/** The privacy-policy link label. ⚠️ The URL was ALREADY shared and the label was not, so the label is
 *  the half that could drift — on the paywall, where its exact wording is part of App Review compliance
 *  (it sits beside Terms as the required legal pair). */
export const PRIVACY_POLICY_LABEL = "Privacy Policy";

/** The demo's entry point, from both doors (Welcome and the paywall). Two wordings would turn one
 *  sandbox into what reads as two different features. */
export const SEE_IT_IN_ACTION_CTA = "See it in action";

/**
 * [L2-19] Destination titles — the promise a settings row makes ("tapping this gets me *that*").
 *
 * ⛔ **The gate proved this one while it was being created.** L1-21 put the history screen into sentence
 * case, and `lint:copy` went red the same run: the title now matched the More row's label, so one rename
 * had produced the exact two-owner duplicate L2-19 describes. **Extracted rather than baselined** — a
 * row and its destination disagreeing makes the destination look like the wrong screen.
 */
export const PAY_CYCLE_HISTORY_TITLE = "Pay cycle history";
export const EXPORT_BACKUP_TITLE = "Export backup";
export const IMPORT_BACKUP_TITLE = "Import backup";

/**
 * [L2-13] The debt-entry fields, asked identically by onboarding and the debt sheet.
 *
 * ⚠️ **The finding's site list conflated two fields.** It reported the minimum-payment placeholder as
 * `"e.g. 100"` in the sheet against `"e.g. 35"` in onboarding — but `"e.g. 100"` is the **BNPL payment
 * amount**, a different field. Measured, the sheet said `"e.g. 65"`.
 *
 * ⛔ **The real defect is worse than a mismatched hint:** both screens offer the SAME example balance
 * (`e.g. 2400`) and then disagree about what its minimum would be — $65 (≈2.7%, a realistic card minimum)
 * versus $35 (≈1.5%). Two worked examples of one arithmetic. Aligned on 65.
 *
 * ⚠️ These labels were *baselined* duplicates in `lint:copy`, i.e. accepted — and an accepted duplicate is
 * still only protected from being **created**, never from **diverging** (see L2-10, which diverged under
 * exactly that protection). Extracting is what actually holds them together.
 */
export const DEBT_FIELD = {
    balanceLabel: "Current balance",
    balancePlaceholder: "e.g. 2400",
    minimumLabel: "Minimum payment",
    minimumPlaceholder: "e.g. 65",
    aprPlaceholder: "e.g. 22.99",
} as const;

/** [L2-18] The payoff celebration, mirrored by hand across the beat, the finale and the share card.
 *  ⚠️ At 8 characters "Paid off" is far below `lint:copy`'s 14-char floor, so the gate is blind to it —
 *  and `ShareCard` is the artifact a user posts PUBLICLY, so a reworded beat with a stale share image
 *  ships retired branding to an audience the app never sees. ⭐ "Vanquished" (the finding's headline
 *  word) is already gone app-wide; the hand-mirroring it described is what survived. */
export const PAID_OFF_LABEL = "Paid off";
export const SHARE_WIN_CTA = "Share your win";

/** Where spare money goes once there is no debt left — the debt-free half of the destination pair
 *  (`to debt` / `to your goals`). ⚠️ The hero renders it as a LABEL and the Guardian brief embeds it
 *  mid-sentence, so this is the noun phrase only; each caller supplies its own surrounding words. */
export const GOALS_DESTINATION = "to your goals";
