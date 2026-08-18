# L2 — duplication & drift

Triaged **76** cross-file duplicate copy strings from `slices/L2-duplicated.md`.
Bucket split: **20 dangerous**, **25 should-be-shared**, **31 benign**.

Method note: 20 source files were opened to judge the non-obvious cases. Every claim about
*why* a duplicate is dangerous is a **hypothesis** unless the finding says "verified in source" —
this project has measured that confidently-stated mechanisms are wrong about half the time.

---

### L2-1 · Two independent cadence-suffix tables, already diverged
- **Severity:** major
- **Bucket:** dangerous
- **String:** "/mo", "/wk", "/qtr", "/yr", "/paycheck" (5 slice rows, one defect)
- **Sites:** `apps/rn/src/app/(tabs)/money.tsx:66-72` (`CADENCE_SUFFIX`), `apps/rn/src/store/guardianSelectors.ts:194-203` (`cadenceLabel`), plus consumers `apps/rn/src/components/entities/AmortizationView.tsx:67`, `apps/rn/src/components/payoff/WhatIfControls.tsx:83`, `apps/rn/src/components/money/BillBreakdownSheet.tsx:73,87`, `apps/rn/src/components/plan/SaveForItSheet.tsx:123`
- **What breaks if they diverge:** they **already have** — verified in source: `money.tsx` renders biweekly as `"/2 wks"` and per-paycheck as `"/check"`, while `guardianSelectors.ts` renders the same two recurrences as `"/2wks"` and `"/paycheck"`, so one obligation is described with two different cadences on two screens.
- **Confidence:** high (the divergence is read directly; the *user impact* — that both surfaces can show the same obligation — is a hypothesis)
- **Suggested fix:** one exported `cadenceSuffix(recurrence)` in `packages/core` beside the `Recurrence` type, imported by both; delete both local tables.

### L2-2 · Guardian state titles are re-typed in four places
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Looks clear this paycheck", "A little tight this paycheck", "Very tight this paycheck"
- **Sites:** `packages/core/guardian/buildGuardianBrief.ts:263,278,319,333,354` (the de-facto owner), `apps/rn/src/components/more/LiveActivityQA.tsx:24,35,39`
- **What breaks if they diverge:** these titles are the Guardian's state vocabulary — the promise attached to `clear` / `tight` / `at-risk`. Verified in source, the set **has already forked inside the owner**: the free-tier branch titles `at-risk` as `"Tight this paycheck"` (line 264) while the premium branch and the QA harness both title it `"Very tight this paycheck"` (lines 278, 39). One state, two names, depending on tier.
- **Confidence:** high on the fork; medium on shipping impact (the QA screen is `QA_TOOLS`-gated and removed before submission, so the shipping harm is the free/premium split, not the QA copy)
- **Suggested fix:** a `GUARDIAN_TITLES: Record<GuardianState, string>` exported from `buildGuardianBrief.ts`, read by both branches and the QA sampler — then decide deliberately whether free and premium are allowed different titles for one state.

### L2-3 · The privacy promise is written three ways
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Private by design" (plus three different supporting clauses)
- **Sites:** `apps/rn/src/app/more.tsx:343` ("Your financial data stays on this device — no account needed. And we'll never sell you more debt."), `apps/rn/src/components/onboarding/CompletionStep.tsx:17` ("your financial data stays on your device."), and a third phrasing of the same promise at `apps/rn/src/components/plan/DemoDock.tsx:107` ("Your money stays on your device.")
- **What breaks if they diverge:** this is a **privacy claim** — the copy class that is reviewable by Apple and legally load-bearing. Three hand-maintained wordings means any future change to the data model (a sync, an analytics SDK) can be reflected in one and left silently false in the other two.
- **Confidence:** high that three phrasings exist; medium that they should be byte-identical (the surfaces have different length budgets, so a shared claim plus per-surface framing may be the right shape)
- **Suggested fix:** one `PRIVACY_CLAIM` constant (headline + body) in a copy module, imported by all three; shorter forms derive from it rather than being retyped.

### L2-4 · BNPL provider names are both a stored picker value and a parser dictionary
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Klarna", "Affirm", "Afterpay", "PayPal", "Zip", "Sezzle" (6 slice rows, one defect)
- **Sites:** `apps/rn/src/components/entities/DebtSheet.tsx:51-59` (`PROVIDERS` — the string is the stored `value`), `packages/core/scan/parseStatementText.ts:28` (`ISSUERS` — the OCR match dictionary)
- **What breaks if they diverge:** **hypothesis, unverified** — the scanner recognises an issuer from statement text and the debt sheet stores a provider string; if the lists drift (one added here, renamed there) a scanned statement prefills a provider the picker cannot represent, or a stored value stops round-tripping. One divergence already exists and is deliberate: `DebtSheet` labels PayPal `"PayPal Pay in 4"` while storing `"PayPal"` — exactly the shape that hides a real drift later.
- **Confidence:** medium (I did not trace the scan result into `bnplProvider`; the coupling is inferred from the identical string sets)
- **Suggested fix:** one `BNPL_PROVIDERS` array in `packages/core` carrying `{ value, label }`; `ISSUERS` composes the card issuers with `BNPL_PROVIDERS.map(p => p.value)`.

### L2-5 · The definition of "an expense" lives in two files
- **Severity:** major
- **Bucket:** dangerous
- **String:** "An ongoing cost that doesn't end."
- **Sites:** `apps/rn/src/components/entities/AddObligationSheet.tsx:41` (chooser clause), `apps/rn/src/components/entities/ExpenseSheet.tsx:85` (sheet subtitle)
- **What breaks if they diverge:** verified in source, this sentence is the **classification rule** the whole debt-vs-expense split rests on — `ExpenseSheet`'s own comment says so ("The clause is the distinguishing one, not a description: what makes this not-a-debt is that it never ends"). If chooser and sheet ever state the test differently, the user is sorted by one rule and confirmed by another. The sibling clauses ("Something with a balance you're paying down. It ends.", "Money you're setting aside for something.") are single-site today and will duplicate the same way as those sheets grow subtitles.
- **Confidence:** high
- **Suggested fix:** an `OBLIGATION_KINDS` copy constant (title, clause, examples per kind) owned beside the kind type; the chooser and all three entity sheets read it.

### L2-6 · "Safety net" is a user-facing label and an engine allocation label
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Safety net"
- **Sites:** `apps/rn/src/components/plan/PaydayGuardianCard.tsx:272` (Stat label), `packages/core/engine/allocatePaycheck.ts:579` (`allocations.push({ label: "Safety net", … })`)
- **What breaks if they diverge:** verified in source — the engine emits the string as an allocation `label` and the card hardcodes the same string for the same bucket (`brief.heldReserve`). The engine's comment records that this label was **already renamed once** (from "Settling-in") because the old word mislabeled part of the bucket; a rename reaching one site and not the other puts two names on one number, on screens a tap apart. The sibling label `"Held for an upcoming tight cycle"` (line 572) is single-site today and is the same latent shape.
- **Confidence:** high on the duplication; medium on whether any surface renders the engine's label verbatim (unverified)
- **Suggested fix:** export the allocation labels as named constants from `allocatePaycheck.ts` (or a `packages/core` copy module) and have the card import them.

### L2-7 · The reserve concept is named three ways across surfaces
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Cushion" / "Safety net" / "your emergency fund"
- **Sites:** `apps/rn/src/components/plan/PaydayGuardianCard.tsx:272,277,358`, `apps/rn/src/components/plan/FloorImpactBar.tsx:76`, `apps/rn/src/components/progress/CashFlowSection.tsx:65`, `packages/core/guardian/buildGuardianBrief.ts:348`, `packages/core/engine/allocatePaycheck.ts:579`
- **What breaks if they diverge:** the one-concept-many-names case — and here it is partly *intentional*. Verified in source, `PaydayGuardianCard` deliberately shows "Safety net" and "Cushion" as **disjoint** segments (comment COH-2: the held reserve is *within* cushion, so the Stat shows the remainder), and `PlanHero:92` renamed "Free" to "Flexible" specifically to stay "distinct from the Guardian's protected Cushion". The danger is not the naming but that the distinction is enforced only by comments in three files: an edit that treats "Cushion" as the whole reserve double-counts the safety net on screen.
- **Confidence:** medium (the disjointness rule is verified; that a future edit breaks it is a hypothesis)
- **Suggested fix:** name the three buckets once as exported constants and state the disjointness rule on that constant, instead of re-explaining it per component.

### L2-8 · "your emergency fund" is a pot identity, written twice
- **Severity:** minor
- **Bucket:** dangerous
- **String:** "your emergency fund"
- **Sites:** `apps/rn/src/components/plan/PaydayGuardianCard.tsx:358`, `packages/core/guardian/buildGuardianBrief.ts:348`
- **What breaks if they diverge:** verified in source, the card's copy is conditional on `topUp.isEmergencyFund` and its comment records a shipped defect where the button called the emergency fund "savings" while spending it. The brief uses the same phrase as a tradeoff target. Reword one and the app again gives one pot two names inside a single flow (card button, then Guardian brief).
- **Confidence:** medium
- **Suggested fix:** an `EMERGENCY_FUND_NOUN` constant beside the goal-type enum; both sites read it.

### L2-9 · The tutorial's "Example money" constant exists and is bypassed
- **Severity:** major
- **Bucket:** dangerous
- **String:** "Example money"
- **Sites:** `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:14` — `export const EXAMPLE_MONEY = 'Example money';`, commented *"The one sentence, so the spoken and written halves cannot drift"* — and `apps/rn/src/components/plan/TutorialOverlay.tsx:427`, a hardcoded literal.
- **What breaks if they diverge:** the single owner **already exists** and one of its two consumers does not use it (verified in source). This is the highest-signal instance in the slice: the fix was designed, written into a comment, and then not applied — so the marker and the overlay can disagree about the one label that tells a user the figures on screen are not their money.
- **Confidence:** high
- **Suggested fix:** import `EXAMPLE_MONEY` at `TutorialOverlay.tsx:427` (both branches of the ternary).

---

### L2-10 · The demo's exit CTA is retyped on both exits
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Start my real plan"
- **Sites:** `apps/rn/src/components/plan/DemoDock.tsx:113`, `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:73`
- **What breaks if they diverge:** verified in source, these are the two exits from the same sandbox (the scripted dock and the always-on explore row, both calling `exitDemo('/onboarding')`); different wording makes one look like a different destination.
- **Confidence:** high
- **Suggested fix:** export the label from the same module that already owns `EXAMPLE_MONEY` (L2-9).

### L2-11 · The premium entitlement is named in three files
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Premium", "Unlock Premium"
- **Sites:** `apps/rn/src/app/more.tsx:106,122,131`, `apps/rn/src/app/paywall.tsx:208` (Screen title), `apps/rn/src/components/plan/DemoDock.tsx:119`
- **What breaks if they diverge:** the tier's *name* is a product promise. `more.tsx` already carries a comment saying the three premium states live in `premiumKind` "so this screen and the paywall cannot drift apart" — the state rule was centralised, the noun was not. A rename ("Premium" → "Plus") would land in some sites and not others.
- **Confidence:** high on the duplication; medium that a rename is plausible for v1.7
- **Suggested fix:** a `TIER_NAME` / `UNLOCK_CTA` pair beside `premiumKind`.

### L2-12 · One action, two names: "Log a payment" vs "Log payment"
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Log a payment" / "Log payment"
- **Sites:** `apps/rn/src/components/entities/DebtSheet.tsx:276` and `apps/rn/src/components/entities/LogPaymentSheet.tsx:34` ("Log a payment"); `apps/rn/src/components/entities/LogPaymentSheet.tsx:46` and `apps/rn/src/components/ui/ListRow.tsx:151` ("Log payment")
- **What breaks if they diverge:** it is already two spellings of one action, on the row and in the sheet it opens. Harmless today, but it is the failure mode the audit is looking for in miniature — nobody can tell which is canonical, so a future edit picks one at random.
- **Confidence:** high
- **Suggested fix:** one `LOG_PAYMENT_LABEL` (and decide article-or-not once); row action, sheet title and submit button read it.

### L2-13 · Debt-entry field copy and its example numbers are duplicated between onboarding and the sheet
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Add a debt", "Current balance", "Minimum payment", "e.g. 2400", "e.g. 22.99"
- **Sites:** `apps/rn/src/components/entities/DebtSheet.tsx:239,320,345,346`, `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:139,145,152,163`, `apps/rn/src/app/(tabs)/index.tsx:281`, `apps/rn/src/app/(tabs)/progress.tsx:115`
- **What breaks if they diverge:** the two screens ask for the *same* four facts, so the labels are a shared contract, and the placeholders are worked examples a user reads as guidance. Verified in source, the placeholders have already partly diverged: the minimum-payment hint is `"e.g. 100"` in `DebtSheet` and `"e.g. 35"` in onboarding — plausible on purpose, but nothing records which.
- **Confidence:** high on the duplication; low on whether the placeholder split is intentional
- **Suggested fix:** a `DEBT_FIELDS` copy constant (label + placeholder per field) shared by the sheet and the onboarding step.

### L2-14 · "Autopay" appears on six surfaces
- **Severity:** polish
- **Bucket:** should-be-shared
- **String:** "Autopay"
- **Sites:** `apps/rn/src/app/(tabs)/money.tsx:470,728`, `apps/rn/src/components/entities/DebtSheet.tsx:351`, `apps/rn/src/components/entities/ExpenseSheet.tsx:105`, `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:262`, `apps/rn/src/components/plan/RequiredActionsCard.tsx:260`
- **What breaks if they diverge:** it names a debt/expense *flag* rather than a UI action, and `PaydayCaptureSheet` already extends it to `"Autopay · ran"` — a rename of the flag would need six coordinated edits.
- **Confidence:** high
- **Suggested fix:** one label constant beside the `isAutopay` field.

### L2-15 · "Payoff schedule" — a named feature written in three files
- **Severity:** polish
- **Bucket:** should-be-shared
- **String:** "Payoff schedule"
- **Sites:** `apps/rn/src/app/schedule/[id].tsx:25,31`, `apps/rn/src/components/entities/AmortizationView.tsx:102`, `apps/rn/src/components/ui/ListRow.tsx:152`
- **What breaks if they diverge:** it is a feature name — the row action, the route title and the view header must agree or the user cannot tell they arrived where they tapped.
- **Confidence:** high
- **Suggested fix:** export the title from the schedule route module; the row and the view import it.

### L2-16 · The paycheck taxonomy ("Required", "Spoken for") is retyped away from the hero
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Required", "Spoken for"
- **Sites:** `apps/rn/src/components/plan/PlanHero.tsx:89,90`, `apps/rn/src/components/plan/SpokenForSheet.tsx:44`, `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265`
- **What breaks if they diverge:** verified in source, `PlanHero` owns a three-bucket taxonomy summing to the paycheck (Required / Spoken for / Flexible), and its comment shows one segment was already renamed ("Free" → "Flexible") to protect a distinction. Two of the three names are re-typed elsewhere, so the next rename can leave the sheet titled with the old bucket name the hero no longer uses.
- **Confidence:** medium
- **Suggested fix:** export the segment labels from `PlanHero` (or a plan-copy module) and have the sheet and capture screen import them.

### L2-17 · "Overdue" is both a bucket title and a pill
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Overdue"
- **Sites:** `apps/rn/src/store/planSelectors.ts:247` (bucket title), `apps/rn/src/components/plan/RequiredActionsCard.tsx:280` (Pill label)
- **What breaks if they diverge:** verified in source, the selector both *decides* overdue-ness and names the bucket, while the card labels individual rows with the same word from its own literal. Renaming the state in the selector leaves the pill saying the old word for the same rows.
- **Confidence:** high
- **Suggested fix:** export the bucket titles from `planSelectors.ts`; the pill reads the same constant (the tone token `'overdue'` already is shared).

### L2-18 · The payoff-celebration vocabulary is mirrored by hand
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Vanquished", "Paid off", "Share your win"
- **Sites:** `apps/rn/src/components/plan/ShareCard.tsx:50,51`, `apps/rn/src/components/plan/VanquishedBeat.tsx:89,116,126,138`, `apps/rn/src/components/plan/PaidOffFinale.tsx:127`
- **What breaks if they diverge:** verified in source, `ShareCard` is a deliberate mirror of the in-app beat (same eyebrow / headline / amount-or-"Paid off" fallback). "Vanquished" is the app's signature word for a cleared debt; if the beat is reworded and the share image is not, the artifact the user posts publicly uses retired branding.
- **Confidence:** high on the mirroring; medium that the share card must always match verbatim
- **Suggested fix:** one `VANQUISHED_COPY` constant consumed by the beat, the finale and the share card.

### L2-19 · Settings rows and the sheets they open are labelled twice
- **Severity:** polish
- **Bucket:** should-be-shared
- **String:** "Export backup", "Import backup", "Living Expenses"
- **Sites:** `apps/rn/src/app/more.tsx:179,180,278`, `apps/rn/src/components/more/BackupSheets.tsx:35,77`, `apps/rn/src/app/living-expenses.tsx:34`
- **What breaks if they diverge:** row label and destination title are one promise ("tapping this gets me that"); a rename in one place makes the destination look like the wrong screen.
- **Confidence:** high
- **Suggested fix:** each destination exports its own title; the settings row imports it.

### L2-20 · "Privacy Policy" link label written twice
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "Privacy Policy"
- **Sites:** `apps/rn/src/app/more.tsx:284`, `apps/rn/src/app/paywall.tsx:331`
- **What breaks if they diverge:** verified in source, the paywall version is an Apple-required legal link next to Terms (EULA), and the URL constant (`PRIVACY_POLICY_URL`) *is* already shared while the label is not — so the label is the one half that can drift, on a screen where its exact wording is part of review compliance.
- **Confidence:** high
- **Suggested fix:** export `PRIVACY_POLICY_LABEL` from wherever `PRIVACY_POLICY_URL` lives; both sites read the pair.

### L2-21 · "See it in action" — the demo entry point, twice
- **Severity:** polish
- **Bucket:** should-be-shared
- **String:** "See it in action"
- **Sites:** `apps/rn/src/app/paywall.tsx:315`, `apps/rn/src/components/onboarding/WelcomeStep.tsx:39`
- **What breaks if they diverge:** both open the same sandbox; two wordings turn one entry point into what reads as two features.
- **Confidence:** high
- **Suggested fix:** same demo-copy module as L2-10.

### L2-22 · "BNPL" fallback label vs the domain term
- **Severity:** polish
- **Bucket:** should-be-shared
- **String:** "BNPL"
- **Sites:** `apps/rn/src/app/(tabs)/money.tsx:470` (pill fallback when no provider is set), `apps/rn/src/store/guardianSelectors.ts:329`, `packages/core/debt/bnplSchedule.ts:42,65`
- **What breaks if they diverge:** the user-facing abbreviation is the same token the core uses internally; if the display term is ever spelled out ("Pay in 4", "Buy now, pay later" — the phrase `AddObligationSheet:34` already uses) the two spellings will coexist.
- **Confidence:** medium (only the `money.tsx` instance is verified user-facing)
- **Suggested fix:** a display constant for the pill fallback, separate from the internal token.

### L2-23 · "to your goals" — the debt-free destination phrase, in the selector and the brief
- **Severity:** minor
- **Bucket:** should-be-shared
- **String:** "to your goals"
- **Sites:** `apps/rn/src/store/planSelectors.ts:313`, `packages/core/guardian/buildGuardianBrief.ts:323`
- **What breaks if they diverge:** verified in source, both are the debt-free branch of the same destination decision — the hero's framing label and the Guardian's safe-move sentence. The pair `to debt` / `to your goals` encodes where money goes when the user has no debts; two owners means the hero can say one destination while the brief promises another.
- **Confidence:** medium (the two are composed differently — a label vs. a sentence fragment — so a shared constant may only cover the noun phrase)
- **Suggested fix:** one `destinationNoun(debtFree)` helper in `packages/core`, used by both.

---

## Summary

**Bucket split (76 duplicates triaged):** 20 dangerous · 25 should-be-shared · 31 benign.
The 31 benign are generic UI verbs and nouns that genuinely recur — Add, Save, Cancel, Close, Done,
Delete, Undo, Share, Back, Continue, Got it, Not now, Paid, Keep going, Name, Amount, Type,
Due date, Recurrence, Your name, About, More, Money, Progress, Today, Tomorrow, Weekly, Monthly,
Other, e.g. 100, e.g. 1200 — plus the `copy+unclassified` coincidences the slice warned about.

**23 findings, by severity:** 0 blocker · 8 major · 10 minor · 5 polish.

**The single most dangerous duplicate: L2-1, the two cadence-suffix tables.** It is the only one in
the slice that is not a latent risk but an **already-shipped inconsistency** — verified in source,
`money.tsx` says `"/2 wks"` and `"/check"` where `guardianSelectors.ts` says `"/2wks"` and
`"/paycheck"` for the same two recurrences. It also encodes a *monetary* rule: `money.tsx` carries a
comment explaining that a biweekly BNPL must not be suffixed `"/mo"` because that would misstate the
outflow — which is precisely the kind of correctness the second, uncommented table has no reason to
preserve.

**Runner-up, and the most instructive: L2-9.** A single-owner constant (`EXAMPLE_MONEY`) was created
*specifically* to stop this drift, its comment says so, and the second consumer hardcodes the literal
anyway. Centralising a string does not hold unless the last call site is converted.
