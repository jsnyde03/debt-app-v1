# L9 — refutations & corrections

The adversarial layer, applied where this project's record says it pays: **challenging findings before
they become work**, not generating more of them. Law IV (measured): *findings that arrive with a stated
MECHANISM still need measuring — 2 of 4 stated mechanisms were wrong while all 4 recommendations were
sound.* Each entry below is a claim that was checked rather than accepted.

---

### R-1 · L3-5's mechanism REFUTED; its severity upheld
- **The claim:** "`buildSmartInsights`'s sole consumer is the legacy Capacitor web app; severity rides
  entirely on whether that build ships in v1.7." (L3, self-marked as unconfirmed — correctly.)
- **Measured:** `buildSmartInsights` IS imported by the SHIPPING RN app
  (`apps/rn/src/store/analysisSelectors.ts`), so the stated mechanism is wrong. But
  `analysisSelectors.ts:138` records why it does not matter: *"Smart Insights: intentionally NOT surfaced
  (2.2.5 scrapped, Jason 2026-07-22)."* No RN surface renders it.
- **Verdict:** **mechanism wrong, recommendation sound** — the textbook Law IV shape, third confirmed
  instance. Severity stays minor, but the CLASS changes: this is **dead code carrying a latent
  capped-outcome defect**, not a live capped-outcome. It belongs with L0-4's dead code, and if the
  feature is ever unscrapped the defect ships with it.
- **Action:** do not fix the copy. Decide whether the module is deleted (with `ProgressRing` /
  `MilestonesRow`) or kept with the defect recorded against it.

### R-2 · L0-3 and L2-9 independently found the same `EXAMPLE_MONEY` bypass — with different site counts
- **The claim:** L2 (blind to the plan and to L0) reported the constant bypassed at
  `TutorialOverlay.tsx:427`. The orchestrator's tier-0 grep found that site **plus**
  `store/tutorialPath.ts:242` (the SPOKEN announcement). The plan carried "THREE sites".
- **Measured:** two production bypassers, not one and not three.
- **Verdict:** **corroborated by independent discovery**, which is the strongest signal in this audit —
  two lenses that could not see each other landed on the same defect. The site count differs because L2
  read only the strings artifact while tier-0 grepped source; the union is correct.
- **Why it matters more than either report alone:** the two bypassers are the **seen** text and the
  **heard** text, which [D6] requires to be said in exactly ONE place, and which `tutorialPath.ts:234`'s
  own comment says must stay in the same slot. An existing e2e asserts the phrase appears exactly once —
  it guards the COUNT, not the WORDING, so the constant can change and the two silently desynchronise
  while the suite stays green. Class ① — an assertion that passes either way.

### R-3 · L3 refuted one of its OWN candidate mechanisms, unprompted
- **The claim it tested:** that `toppedUp` would let a capped top-up claim "right at your $X line".
- **Measured:** it cannot — the branch sits under `state === 'clear'`, and `computeState`'s hysteresis
  only makes `clear` harder to reach.
- **Verdict:** correctly refuted and recorded, alongside 8 further candidates it cleared on inspection.
  ⭐ **Worth naming: a lens that reports what it cleared is more trustworthy than one that only reports
  hits**, because it tells you the denominator. L3 triaged all 93 conditional rows and cleared 9.

### R-4 · L1-1's BLOCKER downgraded — mechanism refuted at the source
- **The claim:** `buildGuardianBrief.ts:282` opens the `"Very tight this paycheck"` state with *"You're
  covered this paycheck"* then says the user is under their line — "the exact defect pattern the house
  rules name, firing in the state where being wrong costs real money." Filed **blocker**.
- **Measured (read the file):** the two statements are not in contradiction. *"You're covered"* means the
  required obligations ARE funded; *"under your line"* means the cushion sits below the user's chosen
  floor. Both are true at once, about different things. The site carries a comment reasoning it out:
  *"lead with 'you're covered' (obligations ARE met — this is a cushion dip, not a miss), and reassure
  that the line rebuilds."*
- **Verdict:** **not a blocker.** The house rule it was charged against — *never claim an outcome you only
  sometimes deliver* — is not violated: the claimed outcome IS delivered. Downgraded to a **minor wording
  question**: does a reader hear "covered" as "fine"? That is a taste call for the wording pass, not a
  correctness defect, and it must not be "fixed" by deleting a deliberate, documented reassurance.
- ⚡ **Second agent blocker to soften on inspection.** Both were sound observations with over-stated
  mechanisms — Law IV holding at roughly its measured rate. **Nothing from a lens should become work
  without this pass.**

### R-5 · CONFIRMED in the same read — L2-2's tier-split state name is real
- **The claim:** one Guardian state carries two names depending on tier.
- **Measured:** free renders `at-risk` as **"Tight this paycheck"** (`:263`); premium renders the same
  `at-risk` state as **"Very tight this paycheck"** (`:278`).
- **Verdict:** **confirmed.** One state, two names, split by something the user cannot see. A free user
  who upgrades watches the same financial situation get renamed to sound worse.

### R-6 · CORROBORATED across three independent lenses — the UTC date bug
- L0-2 (scripted grep, 9 production sites) · L5-9 (states lens, found via `getNextPaycheckDate`) — and the
  identical bug was fixed twice before, in `todayLocalISO` and in `allocatePaycheck:236` during 3.8.
- **Verdict:** the strongest-evidenced finding in the audit. Three lenses that could not see each other,
  plus two historical fixes of the same pattern. ⚠️ L5 adds the user-facing statement the grep could not:
  *"every paycheck date and the first debt's due date is a day early for users east of UTC."*

### R-7 · CONFIRMED — L4-1, and it is a defect 3.8 shipped four hours ago
- **Measured:** `PlanHero.tsx:27` defines a local `money0` that rounds to whole dollars; its legend renders
  `spokenFor = everyday + billsReserve` through it. `SpokenForSheet` is handed **the same two inputs**,
  recomputes the identical sum, and renders it with `formatCurrency`, which emits cents whenever cents
  exist (`minimumFractionDigits: 0, maximumFractionDigits: 2`). **$486 on the hero, $486.34 one tap
  below, no state change between them.**
- **Verdict:** **confirmed, and it is mine** — introduced in 3.8.5 when the tap was added. Neither the
  184-test suite nor six lint gates could see it, because both numbers are individually correct.
- ⚡ **This is the audit justifying its own cost.** A fresh lens found, inside four hours, a defect the
  author shipped while holding the whole feature in context. It is also the exact class 3.8's own
  after-scan filed — *two records of one thing* — committed by the person who filed it.

### R-8 · CONFIRMED, and it makes the INSTRUMENT unreliable — nine formatters, not three
- **The claim (L4-2):** the surface-inventory's premise is wrong; there are nine money formatters.
- **Measured:** **6 file-local formatters** in `components/plan/` alone — `AffordabilityCard` `money` ·
  `LeanSuggestionCard` `money0` · `PaydayGuardianCard` `money` · `PlanHero` `money0` ·
  `RecoveryPlanSection` `money` · `SaveForItSheet` `money` — plus the two named exports.
  `scripts/surface-inventory.ts` tracks only the named exports, so **a row reading "one formatter" is not
  evidence of cohesion**, and the generator's headline "4 surfaces reach more than one" is a floor.
- **Verdict:** an **instrument defect**, the same class as L0-1's fixtures and the highest-value kind:
  it decides what every future cohesion pass can see. ⚠️ The C1 cents sweep was declared closed against
  this artifact.
- **And they have already drifted:** `formatCurrency` carries an explicit non-finite guard *"never render
  $NaN/$Infinity"*. `LeanSuggestionCard`'s copy has **neither** a negative nor a finite guard (`$-45`,
  `$NaN` both reachable); `PlanHero`'s clamps negatives but not non-finites. The defensive branch the
  shared formatter exists to provide has been lost six times over.

### R-9 · L4-11 REFUTED — `formatDisplayAmount` is not dead
- **The claim:** *"`formatDisplayAmount` is dead — a third of the audited formatter surface is unreachable."*
  Filed polish by L4; carried into T1 as a delete candidate.
- **Measured:** it has **three live call sites** in `components/ResultsSection.tsx` — the **legacy
  Capacitor/Next root surface**, which is outside `apps/rn` and therefore outside every lens's slice.
  Deleting it would have broken that tree.
- **Verdict:** **half right, and the half it got wrong was the actionable half.** It is unreachable *from
  the RN app*, which is why the RN surface-inventory should not track it — that part is now fixed. It is
  not dead, and it dies on its own at **5.5.1** with the tree it serves.
- ⚡ **A lens can only be wrong in the direction of its slice.** Every lens was given `apps/rn` +
  `packages/core` artifacts, so none could see the legacy tree — and "unreferenced" silently meant
  "unreferenced *in what I was shown*". ⚠️ **Any "dead code" verdict in this audit inherits that blind
  spot**, which matters directly for parked **T10**: re-check each candidate against the root tree before
  deleting. `ProgressRing` and `MilestonesRow` were grepped across the whole repo and are genuinely 0-ref.

### R-10 · L1-4's hypothesis REFUTED — free users DO get a Guardian
- **The claim:** *"the marquee feature is gated"* — with L1 honestly self-flagging: *"hypothesis
  (unverified in full) that no free-tier Guardian output survives the gates."*
- **Measured:** `selectPaydayGuardian` has **no premium gate** — it returns a brief for any store with an
  allocation. `buildGuardianBrief` carries an explicit free branch (*"Free: the honest read for a COVERED
  paycheck … no action claimed"*) that titles the state and states the headroom. What premium buys is the
  **acting**: the hold, the lookahead, the recovery plan.
- **Verdict:** **the copy conflict is real; the stated severity was not.** Onboarding's *"core features
  never require a subscription"* against a Guardian whose *acting* half is paid is a tension worth
  resolving — but a free user is not told to install for a feature they cannot see. Downgraded blocker →
  major, and the fix is a wording clarification, not a packaging change.
- ⚡ **Third agent blocker to soften on inspection**, and the third where the lens flagged its own
  uncertainty accurately. **The self-reported confidence has been reliable; the severity has not.**

### R-11 · L6-7 REFUTED — the RevenueCat key is not a leak
- **The claim:** *"The RevenueCat iOS key is a source literal"* (polish).
- **Measured:** `purchasesClient.ts:17` already documents it — `appl_…` is RevenueCat's **public** Apple
  SDK key, designed to ship in the client bundle, and the code prefers `EXPO_PUBLIC_RC_IOS_KEY` when set.
- **Verdict:** **not a defect.** Closed, no action.

### R-12 · L6-3 de-scoped — `QA_TOOLS` is deliberate, and already filed
- **Measured:** `config/qa.ts` documents it as shipping in TestFlight *on purpose* so device QA is not
  blocked, with the flip already a Phase-6 submission step on the plan.
- **Verdict:** **correct as-is.** Flipping it during T2 would break the device pass it exists to enable.
  L6 called this right ("blocker for submission, not for TestFlight"); it is not T2 work.
