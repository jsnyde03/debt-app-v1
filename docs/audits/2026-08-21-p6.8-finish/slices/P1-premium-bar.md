# P1 — THE PREMIUM BAR

> **Lens:** P1 of the P6.8 pre-release audit. Repo `debt-app-v1`, branch `v1.7-dev`, commit `dd80f70`,
> shipping as `2.0.0`. Requested by 🎯 2026-08-21: *"a lens specifically ensuring that everything is
> still at our premium bar."*

**"Premium" means two different things in this project, and this lens owns both. They are kept apart
on purpose — a finding that muddles them is not actionable.**

| Part | Question | Reference |
|---|---|---|
| **A — CRAFT** | Is the shipped app still *"at or above the rest of the portfolio"*? | `DEBT_BENCH_VISUAL_MOTION` · `DEBT_MOTION_SPEC` · `DEBT_IA_BENCHMARK` · `DEBT_BENCH_TRUST_FIRSTRUN` · `DEBT_BENCH_NATIVE` (all 2026-07-20) |
| **B — TIER** | Does the paid tier still earn its price? | `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` §1 — ***"removing it must remove WORK, not just info."*** |

**Evidence base:** `apps/rn/capture-ref/p6.8/<viewport>/<theme>/*.png` — 5 viewports × 2 themes ×
10 routes, plus 7 sheet frames × 2 themes, 14 state frames × 2 themes, and 2 Dynamic Type scales × 2 themes.
Source read for Part B.

⚠️ **Stills-blind:** motion, haptics and timing cannot be judged from frames. Everything motion-dependent is
routed to **P6.14** and listed under *What I could not judge*.

---

## ⚠️ Read this before trusting any craft finding below — three capture artifacts I ruled out

Three things look like defects in the matrix and are **not**. I checked each against source rather than
reporting it, and I am recording them so a refuter does not have to redo the work — and so no other lens
files them:

1. **Light-theme `today.png` is captured mid-animation.** Its hero reads `$577` where dark reads `$1,032`
   from identical seed data (`Required $450 / Flexible $1,550` match in both) — that is a count-up in flight,
   and the whole card stack is mid-entrance-fade with it. The *settled* light Today is visible in
   `phone/light/onboarding.png` (see #3) and looks correct: rich navy hero, white Guardian card, full contrast.
   **Do not read light-theme contrast off `today.png`.**
2. **`MM/DD/YYYY` + a calendar glyph in every sheet is the RN-web date input, not the product.**
   `apps/rn/src/components/ui/DateField.tsx:1` uses `@react-native-community/datetimepicker` and renders
   `toLocaleDateString(…, { month: 'short' })` — "Aug 21, 2026" plus the platform picker. `DateField.web.tsx`
   is what the harness captured.
3. ⚠️ **`onboarding.png` is not onboarding.** In *every* viewport and *both* themes it shows a settled
   **Today** screen. Filed as **P1-1** — that one is a real matrix gap, not an artifact.

Everything below survived that check.

---

## PART A — PREMIUM AS CRAFT

### P1-1
**Part:** A-craft · **Severity:** major
**Subject:** The visual matrix itself — onboarding, and every Skia-drawn emotional beat · **Evidence:** `apps/rn/capture-ref/p6.8/*/*/onboarding.png` (10 files, all showing Today); no frame anywhere for `apps/rn/src/components/plan/PaidOffFinale.tsx`, the band-milestone beat, or the tutorial overlay
**The bar:** README §"The instrument is built FIRST" — *"A surface missing from it is a surface four agents are blind to at once — which is exactly how the line-art defect and the dark-only splash both survived review."*
**Where it lands:** **below.** Three of the app's highest-craft surfaces have **zero frames**:
- **Onboarding / first run.** `onboarding.png` captured Today instead, in all 10 viewport×theme combinations.
  This is the surface `DEBT_BENCH_TRUST_FIRSTRUN` R1-T1/T3 and R2 make load-bearing, and the one 🎯 added an
  entire lens (O1) for. Four visual lenses, plus O1, plus me, are all looking at a screenshot of Today.
- **The payoff finale** — the "one licensed spectacle" of `DEBT_MOTION_SPEC` §5 Tier 3. No frame, no state, no theme.
- **The band-milestone beat** (Tier 2) — no frame.

The matrix carries 14 sheet frames and 40 Dynamic-Type frames but not one frame of the moment the entire
motion spec is built around. My brief asks *"the moments that are supposed to be special — do they land, in
stills?"* **There are no stills.**
**Confidence:** high

### P1-2
**Part:** A-craft · **Severity:** major
**Subject:** Feature-tip coach cards cover the control they describe · **Evidence:** `phone/dark/progress.png`, `phone/light/progress.png`, `phone/dark/state-progress-many.png`, `phone/dark/state-progress-huge.png`, `phone/dark/state-progress-single.png` — "Drag the curve" covers the lower half of the Cash Flow bars in all five · and `phone/dark/sheet-debt-sheet-edit.png` — "See the whole payoff" sits directly beneath an orphaned `APR %` label, where the APR input should be
**The bar:** `DEBT_BENCH_VISUAL_MOTION` Part B §1 — *"Calm = subtraction. Monarch's calm comes from removing ads/clutter and committing to one hierarchy"*; Part B §4 — *"Never animate/decorate the management surfaces… Flat, fast, legible."*
⭐ **The proof is a same-screen A/B inside the matrix itself.** `split-view/dark/progress.png` and
`ipad-portrait/dark/progress.png` render the *identical* screen on a taller viewport, and there the tip card
sits harmlessly at the **end** of the scroll. What the phone user loses behind it is now measurable — the
taller frames show the Cash Flow card actually contains: the dashed **`your $200` floor line drawn across the
bars**, the five **date labels** (Aug 21 · Sep 4 · Sep 18 · Oct 2 · Oct 16), the legend *"room after each
paycheck"*, and the verdict sentence *"Comfortable across the next few paychecks."* **None of that reaches the
phone.** The floor line is the shared token treatment §2.6 of the elevation spec specifically requires the
forecast to draw.
**Where it lands:** **below, and it is the most repeatable craft defect I found.** On the phone the tip truncates a
five-bar chart mid-bar, taking the floor line, the axis and the verdict with it; in `state-progress-many` it
covers the bar carrying a **negative** value (`−$658`), the one bar a user most needs to see. On the Edit-debt
sheet the `APR %` label is left pointing at a tip card, so a form field reads as missing. The tips themselves
are well written and well styled — their placement is not. Two independent surfaces, six frames, both themes,
and the phone is the primary device.
**Confidence:** high *(the overlap is real, repeated, and A/B-confirmed against the same screen at a taller viewport. **Medium** on the mechanism — "an anchored coach mark that flips above its target when it does not fit below" is my inference, and per the standing rule a stated mechanism is a hypothesis. The finding does not depend on it.)*

### P1-3
**Part:** A-craft · **Severity:** major
**Subject:** Payoff Trajectory — the axis domain abandons the user as the payoff gets closer · **Evidence:** `phone/dark/progress.png` (debt-free **Oct 2026**; x-axis **2027–2035**; no blue curve drawn at all) · `phone/dark/state-progress-single.png` (debt-free **Sep 2026**; x-axis **2027–2030**; the user's line compressed into a ~4px vertical sliver at the left edge with its date pill overlapping the `$0` axis label) — against `state-progress-many.png` (April 2034) and `state-progress-huge.png` (Nov 2028), where the same chart is **genuinely beautiful**
**The bar:** `DEBT_BENCH_VISUAL_MOTION` Part A, Copilot — *"charts that animate smoothly"*, *"color earns its place by carrying data, not decoration"*; `DEBT_BENCH_TRUST_FIRSTRUN` B1 — *"the core aha across the category: show the exact debt-free date the moment the first balance is added. That single computed date is the emotional payload."*
**Where it lands:** **below.** The x-domain is set by the long grey comparison curve, not by the user's plan — the
legend visible on the taller viewports names it: *"Minimum payments — **Sep 2035**"* against *"Your plan —
**Oct 2026** · ~$5,722, 9 years saved."* So the *closer* someone is to debt-free — the better their news — the
more their own trajectory collapses into an unreadable sliver, and the first axis tick lands *after* their
payoff date. In the default seed **neither** curve draws at all: three independent viewports
(`phone`, `split-view`, `ipad-portrait`) all render a card headed "PAYOFF TRAJECTORY" containing nine empty
years, a stranded "Oct 2026" pill outside the axis domain, and a legend confidently describing two lines that
are not on screen. The emotional payload of the entire Progress tab degrades exactly as the user succeeds.
**Confidence:** **high.** The axis is wrapper-rendered (RN views), so the domain behaviour is not a CanvasKit-load
artifact; and the empty plot reproduces across three independently-captured viewports while the *same chart
renders beautifully* in the `many` / `huge` / `single` seeds — which also rules out "Skia never loads in the
harness." ⚠️ The one thing I cannot separate from stills: whether the default seed's curve is *absent* or
merely *degenerate* (a near-vertical drop at x≈0 clipped by the plot edge). `state-progress-single` shows the
degenerate version as a 4px sliver, so degenerate-and-clipped is the likelier of the two — either way the
card is unreadable.

### P1-4
**Part:** A-craft · **Severity:** major
**Subject:** The shortfall Guardian card at 40 obligations · **Evidence:** `phone/dark/state-today-many.png` — the `COVER NOW` block renders `Bill 1 · Bill 2 · … · Creditor 11 — $2,658` as a 23-name run-on paragraph filling four lines
**The bar:** `DEBT_BENCH_VISUAL_MOTION` Part B §1 — *"One hero number per surface, depth behind a tap… show ONE emotionally-legible number up top and demote the amortization detail"* (Whoop/Oura progressive disclosure); Part C — *"resist the PFM urge to surface six KPIs at once."* And `DEBT_BENCH_TRUST_FIRSTRUN` A2 §6 — *"A debt-stressed user needs reassurance, not a security lecture."*
**Where it lands:** **below.** This is the one surface where the app speaks to a user who is **short this
paycheck** — the most emotionally loaded state in the product. What it delivers is an undifferentiated wall of
23 generic names with a total welded onto the end by an em-dash. No truncation, no "+14 more", no grouping,
no progressive disclosure. Everything above and below it on the same card is calm and well composed, which is
what makes the block read as a raw `join(' · ')` nobody viewed with 40 items on screen.
**Confidence:** high

### P1-5
**Part:** A-craft · **Severity:** major
**Subject:** Export backup shows the user a raw JSON blob · **Evidence:** `phone/dark/sheet-backup-sheets.png` and `phone/light/sheet-backup-sheets.png` — a monospace box reading `"format": "debt-planner-backup", "formatVersion": 1, "storeVersion": 7, "paycheck": { "amount": "2000" …`
**The bar:** `DEBT_BENCH_TRUST_FIRSTRUN` A2 §1 — *"Trust is shown, not stated… a countable, visible artifact of restraint > a claim"* (Apple's "N trackers blocked", DuckDuckGo's Fire Button); A2 §5 — *"Minimalism itself reads premium and trustworthy."*
**Where it lands:** **below, and it is the worst single frame in the matrix.** Every other sheet in this app is a
considered, human-voiced surface. This one shows engineering exhaust — internal version numbers, a quoted
string amount — inside the app's most important *trust* interaction, the one where the user is being asked to
believe their data is genuinely theirs. The benchmark's whole point is that a trust surface should let the
user **see the restraint working**; this lets them see the schema. Signal's lesson (*"minimalism is a security
posture"*) is inverted here: the surface is maximally technical at the moment it should be maximally calm.

Secondary, same frame: the button hierarchy is inverted. **"Copy to clipboard"** — the only action that
actually backs anything up — is the secondary treatment, while **"Done"**, which dismisses, gets the filled
primary. A user can leave this sheet having backed up nothing while having pressed the most prominent button.
**Confidence:** high

### P1-6
**Part:** A-craft · **Severity:** minor
**Subject:** Empty states are four different designs, not one system · **Evidence:** `phone/dark/state-progress-empty.png` (icon chip + headline + body + filled CTA) · `phone/dark/history.png` (icon chip + body; **no** headline, **no** CTA) · `ipad-landscape/dark/money-debts.png` right pane (a bare grey glyph + one grey line; no chip, no card) · `phone/dark/not-found.png` (centered text + a text link; no icon, no card, no header, **no tab bar**)
**The bar:** `DEBT_BENCH_TRUST_FIRSTRUN` B2 §6 — *"Empty states never sit blank — they teach and point at the demo / first action"*; `DEBT_IA_BENCHMARK` Q2 counter-case — *"each section needs a genuinely distinct, well-designed sub-screen… a bare tab-switcher is the anti-pattern."*
**Where it lands:** **at the bar on the best one, below on the other three.** `state-progress-empty` is exactly right
and should be the template. History teaches but points nowhere. The iPad detail pane uses none of the system.
`not-found` uses none of the system *and* strands the user — no header, no tab bar, one text link. This is the
clearest "collection, not a system" tell in the app: one component, four different completions of it.
**Confidence:** high

### P1-7
**Part:** A-craft · **Severity:** minor
**Subject:** The More hub's first three groups carry no section header while every later group does · **Evidence:** `phone/dark/more.png`, `phone/light/more.png` — "Private by design", the "Premium" row and the three-row group (Pay cycle history / How your Guardian works / Show feature tips again) float unlabeled; `DATA` and `PREFERENCES` below them are labeled
**The bar:** `DEBT_IA_BENCHMARK` Q3 — the Monarch/Finch model of a **structured** secondary hub: *"Settings/account/low-frequency extras go to a corner icon or a row inside Money, never a tab slot."*
**Where it lands:** **just below.** Three unlabeled groups followed by two labeled ones reads as a surface that
grew rather than one that was laid out. Nothing is broken; the rhythm is. It is cheap to lift, and it is the
first screen a user opens when they go looking for backup, privacy, or their subscription.
**Confidence:** high

### P1-8
**Part:** A-craft · **Severity:** polish · *(this one is my taste, and I am saying so)*
**Subject:** Back-chevron treatment on pushed routes · **Evidence:** `phone/*/more.png`, `paywall.png`, `cushion-forecast.png`, `history.png` — a small `‹` set inline before a ~28pt bold title, on a different optical baseline
**The bar:** `DEBT_BENCH_VISUAL_MOTION` Part A, Things 3 — *"thoughtful typography."* This is the weakest anchor in my slice: **no benchmark names a back-chevron property.**
**Where it lands:** **at the bar, arguably.** It is legible and identical across all four pushed routes, so the
system *is* a system here. I raise it only because the chevron's optical weight and baseline do not sit with
the title, and it is the first mark on four screens. **Preference. Treat as polish or drop it.**
**Confidence:** low

### P1-9
**Part:** A-craft · **Severity:** minor
**Subject:** The finale ships **64 pieces of two-wave confetti** against four project documents that say never to · **Evidence:** `apps/rn/src/components/plan/PaidOffFinale.tsx:44` (`const CONFETTI = 64;`), `:45` (`GOLDS`), header comment *"a deepened two-wave gold confetti layer that keeps emerging so it BREATHES ~4.7s"*; `docs/DEBT_ELEVATION_LOG.md:4348` records it as a deliberate deepening (*"B6 (deepen the finale confetti — 64 pieces, wider spread)"*)
**The bar:** `DEBT_MOTION_SPEC` §5 Tier 3, verbatim: ***"Never confetti.*** *The reward is the composition + the cascade (money doing spatial work)."* Repeated in `DEBT_PHASE0_DESIGN_SYNTHESIS` (*"Composed screen, **never confetti**"*), `DEBT_MOTION_TOOLING` (*"explicitly not confetti"*), and `DEBT_PREMIUM_STRATEGY` (*"**Drop 'confetti'** — contradicts the locked Skia-spectacle celebration"*). `DEBT_BENCH_VISUAL_MOTION` Part C: *"lead with the crafted screen and the cascade, use particles (if at all) **sparingly**."*
**Where it lands:** ⚠️ **This is not a "the app is worse" finding — it is a "a locked rule was reversed in code with no recorded decision" finding.** On the confetti literature's *own* three tests the shipped finale passes cleanly: it fires **once, ever**, on the last debt reaching $0 (the user's real win, never a company metric), and it sits at the top of a genuine escalation ladder. So I would not change it on the merits. But four documents say "never," one build-log line says "deepened," and nothing in between records 🎯 reversing the rule — which means the next person to read the motion spec will believe something untrue about the shipped app. **The fix is a decision, not a diff:** either ratify the reversal in the spec, or cut it.
**Confidence:** high on the contradiction (quoted from both sides). Deliberately **low-severity** — I am not recommending removal.

---

## PART B — PREMIUM AS TIER

### The enumeration — every premium gate as it actually ships, each run against the price test

> **The test, verbatim** (`DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` §1): *"**The price test** (run on every
> feature 2.3–2.11): removing it must remove **WORK**, not just info."* · §1 identity: *"it watches + acts so
> you don't have to."* · §5.3: *"free tells you; premium does it."*

Gating in this app is a uniform inline `subscriptionPlan === 'premium'` (`data/models.ts:45-47`). Every site:

| # | Premium feature, as shipped | Gate | Removing it removes | Verdict |
|---|---|---|---|---|
| 1 | **Cushion floor at the user's own line** (default $200) vs free's hardcoded flat $50 | `store/selectors.ts:24-26` `effectivePaycheckBuffer` | **WORK** — the engine genuinely reserves different money; the free plan spends it | ✅ pass |
| 2 | **Uncertainty holdbacks** (discovery 40%, cold-start), attestation-reduced | `store/selectors.ts:70-75` | **WORK** | ✅ pass |
| 3 | **Variable-bill buffer** (structural, premium-only) | `store/selectors.ts:79` | **WORK** | ✅ pass |
| 4 | **Pre-funded reserve / water-fill smoothing** for a future crunch | `store/selectors.ts:80`; surfaced `CashRunwayChart.tsx:189` | **WORK** | ✅ pass |
| 5 | **Recovery Plan** — a built catch-up with defer / keep-essential actions | `app/(tabs)/index.tsx:147`; `RecoveryPlanSection` | **WORK** | ✅ pass |
| 6 | **Tight-cycle one-tap top-up** (`Move $X from savings`) **+ Undo** | `PaydayGuardianCard.tsx:350`, `:377` | **WORK** | ✅ pass — and this is §2.10's round-6 R1 fix (*"an ACTION, not a readout"*) actually shipped |
| 7 | **Can I Afford It?** — apply to this paycheck · cover-from-savings & apply · build a Save-for-it plan | `AffordabilityCard.tsx:167-227`, `SaveForItSheet` | **WORK** | ✅ pass |
| 8 | **Projected balances between statements + statement re-scan** | `store/balanceSelectors.ts:19-46`; `DebtSheet.tsx:149` | **WORK** (the monthly retyping) | ✅ pass |
| 9 | **Proactive risk push**, escalate-on-change, ≤2/rolling month | `hooks/use-notification-sync.ts:56` | **WORK** (remembering to check) | ✅ pass |
| 10 | **Bills-complete attestation** (releases held cash) | `PaydayGuardianCard.tsx` `showAttest` | **WORK** | ✅ pass |
| 11 | Guardian `safeMove` / `lookahead` / proof-of-work strip | `PaydayGuardianCard.tsx:199-200`, `:458` | info | ✅ pass **by attachment** — it is the narration of 1–4, not a separate SKU |
| 12 | Cushion-forecast route (Cash Runway + Guardian scorecard) | `app/cushion-forecast.tsx:38` | info | ⚠️ pass **by attachment** — §2.0.c makes the hold's *visibility* part of the acting (*"a hold the user can't see is a hold that doesn't protect them"*). A refuter will raise this; the defence is in the spec, not in the code. |
| 13 | **Payday Countdown Live Activity** | `liveActivity/paydayActivityContent.ts:66`, `:104` | **info** | ⚠️ **borderline — see P1-11** |
| 14 | **Windfall routing view** | `WindfallSheet.tsx:56`, `:98`, `:115` | **info only** | ❌ **FAILS — see P1-10** |

**13 of 14 clear the bar, and most of them clear it comfortably.** The tier is in good shape. Two exceptions
and two commitments-not-shipped follow.

### P1-10
**Part:** B-tier · **Severity:** major
**Subject:** Windfall Autopilot is sold as a *view*, and the free tier already does the work · **Evidence:** `apps/rn/src/components/plan/WindfallSheet.tsx:115` — the free-tier invite copy reads: *"Premium **shows** exactly where your $500 lands — expenses, debt, and savings — before you confirm."* And `apps/rn/src/store/selectors.ts:54`: `paycheckAmount: income + (store.windfall ?? 0)` — **no tier gate.**
**The bar:** §1 — *"removing it must remove **WORK**, not just info."* §5.3 — *"free tells you; premium does it."*
**Where it lands:** **below, and it is inverted.** A free user adds a windfall and the engine allocates it through
the identical waterfall. The money moves either way. What the paywall gates is the **itemized display** of
where it landed, plus a submit label that changes from `Add` to `Confirm` (`WindfallSheet.tsx:81`). So on this
one feature: **free does it, and premium tells you.** That is the tier's own line, backwards.

⚠️ **The spec already ruled on this exact shape.** §2.10, round-6 finding R1, about the tight-day-one
smallest-move: *"A **readout** … is **info**, and the tier's own rule is 'premium removes work, not info' — so
a readout sits on the wrong side of the paywall (the class of the features v5 demoted to free)."* That
reasoning was applied to the smallest-move and the smallest-move was rebuilt as a one-tap action (shipped —
row 6 above). The windfall routing is the same shape and did not get the same treatment.

**Two honest resolutions, and I recommend the first:** (a) **demote the routing view to free** — it costs
nothing, it is the app's best "the engine is not making this up" moment, and it removes a false gate; or
(b) **[STRUCTURAL]** give premium a real windfall *action* (choose a different split and re-route), which
would make the gate earn itself. (b) adds capability and is 🎯's scope call at P6.10.
**Confidence:** high — both halves are quotable from source, and the spec supplies its own precedent.

### P1-11
**Part:** B-tier · **Severity:** minor
**Subject:** The Payday Countdown Live Activity is the one gate whose removal returns no work · **Evidence:** `apps/rn/src/liveActivity/paydayActivityContent.ts:66` (`if (store.subscriptionPlan !== 'premium') return null;`) and `:104`
**The bar:** §1 price test; §1 identity — *"it watches + acts so you don't have to."*
**Where it lands:** **at the line, defensibly.** A lock-screen countdown carrying the Guardian read removes a
*step* (opening the app), not *work*. Its own source comment makes the honest case — *"the countdown's value
IS the premium Guardian read, so it's premium-only (value-led, never a locked feature)"* — i.e. it is gated
because it renders premium-computed content, which is the "by attachment" defence rows 11–12 use. That
defence holds. I flag it only because it is the **weakest** attachment of the three: rows 11 and 12 narrate a
hold that premium is actively performing, whereas this one is a clock. **No change recommended; recorded so
the refuter and P6.10 have it named.**
**Confidence:** medium

### P1-12
**Part:** B-tier · **Severity:** major · **[STRUCTURAL]**
**Subject:** The proof-window money-back guarantee does not exist, and the Lifetime SKU it was supposed to precede does · **Evidence:** `grep -i "guarantee|money.back|refund"` across `apps/rn/src` returns **zero** user-facing hits (only unrelated engineering comments and the *user's own* "bonus, refund, or side gig" windfall copy). Meanwhile `apps/rn/src/premium/purchases.ts:19` defines `LIFETIME_PRODUCT_ID = 'paycheck_debt_planner_premium_lifetime'` and `app/paywall.tsx:74` ships **Lifetime $79.99**.
**The bar:** §2.10, Jason's round-6 call: *"**a proof-window money-back guarantee** backs the earn-trust narrative with real skin — 'if the Guardian doesn't prove itself, get your money back' — so the annual/Lifetime buyer isn't staking a no-safety-net commitment on a deliberately-throttled first month."* And §4: ***"[BUILD/DECISION at 2.10, BEFORE any Lifetime SKU is created (lock strategy before irreversible setup)…]"***
**Where it lands:** **below.** The spec's sequencing instruction was explicit and it has been passed: the SKU
exists, the guarantee does not. The design reason it existed is live and unchanged — §2.0's confidence layer
*deliberately throttles month one* (40% discovery holdback for N=3 cycles, cold-start holdback until N≥4
actuals), and §3.6 forbids the demo from showing a matured Guardian. So the highest-price buyer ($79.99,
non-refundable by default) is being asked for the largest commitment at the exact moment the product is
designed to be least impressive, with no stated way back. **Whether to ship a guarantee is a commercial call
that is 🎯's alone** — I am not making it. What I am reporting is that a spec decision recorded as a
prerequisite was not met and nothing records it being reversed. Feature lock closes at **P6.10**, so it still
has somewhere to go.
**Confidence:** high on the facts (absence is grep-provable; the SKU is in source). No confidence claim on the commercial merits — not mine.

### P1-13
**Part:** B-tier · **Severity:** minor
**Subject:** The paywall's lead card uses the user's $0 cushion as the hook · **Evidence:** `phone/*/paywall.png` — *"**You have $0 cushion this paycheck.** Your plan protects a flat $50 of it. Premium protects the line you choose instead."* (`store/paywallLead.ts`, `effectivePaycheckBuffer` at `selectors.ts:24-26`)
**The bar:** `DEBT_BENCH_TRUST_FIRSTRUN` A2 §2 — the moat is *"the killer absence: we never surface a 'borrow more' offer"*; and the spec's §2.10 **priority-not-outcome promise**: *"the day-one claim is a first-claim guarantee, not an outcome a tight converter can't get — 'your floor is always first in line before a dollar moves,' NOT 'you'll have your $200 from day one.' **A buyer who's genuinely short this paycheck must not meet a promise that just failed.**"*
**Where it lands:** **at the bar — and I want to be precise about why, because this is the one that looks worst and is actually correct.** The copy is *"Premium protects the **line you choose**"* — a priority claim, not an
outcome claim. It does not promise the user will have $200. That is exactly what §2.10 mandates, and the
sentence appears to have been written to that rule. The gate is also real work (row 1), not information.
**What I am flagging is narrower:** it is still the app's sharpest moment of leverage — a personalised
statement of the user's own precarity, at the top of a purchase screen — and it is the closest this product
comes to the predatory contrast case the trust benchmark positions the whole moat against. It clears the bar
today because the *claim* is honest. It is worth 🎯 re-reading once, in the frame, with that in mind.
**Confidence:** high that it is compliant with §2.10. Low that it needs any change — **this is a "look once, then close it" item, not work.**

### P1-14 — [D53] verified clean
**Part:** B-tier · **Severity:** *(none — a check that passed)*
**Subject:** Nothing in the app implies a free trial exists · **Evidence:** `app/paywall.tsx:83` — `introPrefix(pkg, 'unknown')` returns `""`, correctly documented as deliberately inert. Every subnote is a plain billing statement: *"Billed yearly · $2.50/mo"*, *"Billed monthly"*, *"Pay once — all today's Premium, forever"*. `AUTO_RENEW_DISCLOSURE` (`:45`) contains no trial language.
**Where it lands:** **at the bar.** I swept every `trial` hit in `apps/rn/src`: all remaining ones belong to the
**user's own** subscriptions — the `Free trial or intro price` toggle in `ExpenseSheet.tsx:105` and the Today
trial-conversion card at `app/(tabs)/index.tsx:571-593` (*"Your Netflix trial has ended…"*). Those are the app
tracking *their* trials, never offering ours, and nothing on the paywall sits near them. **No trial is
implied anywhere.**
**Confidence:** high

### P1-15 — the two "is anything free that is doing premium's job?" checks, both clean
**Part:** B-tier · **Severity:** *(none — checks that passed)*
- **Is a trust or safety feature behind the paywall?** The obvious candidate is the **shortfall warning**. It
  is not gated: the Guardian card renders `brief.state` and `brief.detail` for **both** tiers
  (`PaydayGuardianCard.tsx:300-303`) — `phone/dark/state-today-many.png` shows *"This paycheck won't cover
  everything"* with the full shortfall paragraph. Only the *push notification* and the *fix* are premium. A
  free user is never left unwarned about their own money, which is the line that matters.
- **Is anything free doing premium's job?** The free layer is deliberate and consistent with §2.10: the
  what-if readout (`WhatIfControls.tsx:34` — *"A free tool (the pull readout); the premium Guardian is the
  proactive push layer"*), the basic cash-flow glance (`CashFlowSection.tsx:81`), BNPL handling (explicitly
  all-tiers, and the paywall's bullet list deliberately omits it), the tutorial's free run, and a real $50
  floor. Free genuinely helps. **The only inversion I found is the windfall (P1-10).**
**Confidence:** high

---

## The three things most below the bar

Ranked by *distance below the bar × how many users meet it*, not by how hard they were to find.

**1 · P1-2 — the coach marks cover the content they describe (craft, phone-primary).**
The highest damage per line of code in the whole slice. On the phone it takes the `$200` floor line, the five
date labels, the "room after each paycheck" legend and the verdict sentence *"Comfortable across the next few
paychecks"* off the Cash Flow card — all of which the taller viewports prove are there — and on the Edit-debt
sheet it takes the APR field. Both are first-run-visible on the primary device.
**Cost to lift:** small. A placement/ordering rule in the tip layer, plus one matrix re-capture to verify. It
is a layout fix, not a design decision, and it needs no new capability.

**2 · P1-3 — the Payoff Trajectory abandons the user as they get closer to debt-free (craft).**
The Progress tab exists to carry *"the emotional payload"* the trust benchmark names, and the chart is
Copilot-tier at long horizons. At short ones it renders nine empty years with a stranded date pill and a
legend describing two lines that are not on screen — and it fails *in the direction of the user doing well*.
Three independent viewports reproduce it on the default seed.
**Cost to lift:** medium. Clamp the x-domain to the plan (or break/dual-scale the axis against the min-only
comparison) and add the degenerate/near-term case. Needs a design call on how to keep the "9 years saved"
contrast legible once the domain is clamped — so it is a small design decision plus a small change.

**3 · P1-5 — the Export backup sheet shows a raw JSON blob (craft, and it is a trust surface).**
The single worst frame in the matrix, on the screen where the app's whole moat — *"your financial data stays
on this device"* — is supposed to be felt rather than argued. Compounded by an inverted button hierarchy that
makes "Done" more prominent than the action that performs the backup.
**Cost to lift:** small-to-medium. A human summary card (*"Your plan · 2 debts · 6 expenses · saved 21 Aug"*)
with Copy/Share promoted to primary, and the blob demoted behind a "show raw data" disclosure. No engine or
format change — the payload is unchanged, only what is shown.

**Runner-up, and it is cheap: P1-1.** The matrix has **no frame** of onboarding, the payoff finale, or the
milestone beat. That is not a defect in the app; it is a hole in the instrument that blinds four visual
lenses, O1, and me simultaneously — the exact failure mode the README opens by naming. Adding three captures
is hours, and it retroactively raises the confidence of five other slices.

## What is genuinely excellent

A bar report that only lists faults cannot calibrate anything, so: **the answer to the mandate question is
yes.** *"Debt at or above the rest of the portfolio"* — it clears that, and in three places it sets the bar
rather than meeting it.

- ⭐ **The celebration ladder is spec-complete, and it is the best thing in this codebase.**
  `MilestoneAckCard` (a calm gold Today card at 25/50/75, one success haptic) → `PaidOffBeat` (a *contained*
  per-debt overlay, deliberately light because a snowball clears several in a row) → `PaidOffFinale` (the
  once-ever navy takeover: Skia journey ring swept to gold 100%, mesh-gradient depth, an honest count-up trio
  that **refuses to fabricate an interest-saved figure**, a bespoke Core Haptics crescendo, opt-in sound).
  Every one of the three snaps to its final state under Reduce Motion **and keeps its haptic** — which is
  `DEBT_MOTION_SPEC` §2.4's exact rule (*"haptics are retained under Reduce Motion; they're an accessibility
  channel, not decoration"*), honoured three times without exception. And `PaidOffBeat` carries
  `freedPerMonth` + `nextDebtName`, i.e. the **cascade** — the spec's "money doing spatial work" reward,
  actually built. The escalation ladder in the benchmark (`routine → payday → band → paid off → debt-free`)
  ships intact, tier for tier.
- ⭐ **The iPad build is a real adaptation, not a stretched phone.** `ipad-landscape/*/today.png` and
  `money-debts.png`: a proper sidebar, a two-column Today, and a genuine master-detail on Money with a
  "Select a debt to edit, or add one" pane. Most apps at this stage ship a centered phone layout.
- ⭐ **The Payoff Trajectory at long horizons is category-leading.** `state-progress-many.png`: a gradient
  area under a curve with **per-creditor dots labelled along it** ("Creditor 1 … Creditor 5 … Creditor 10")
  and the debt-free date glowing at the terminus. That is the Copilot bar — *"charts that… make color earn
  its place by carrying data"* — and it is the reason P1-3 is worth fixing rather than cutting.
- ⭐ **Honesty is enforced at the line level, not asserted at the doc level.** Reading source, string after
  string carries a comment recording a claim that was *retired because it was not true*: `A3.6` changing
  "Cover $X" to "Move $X" when the draw is capped short of the gap; `A3.3 [D24]` refusing to call the
  emergency fund "savings" while spending it; `L1-3` deleting the unconditional cushion promise from the
  paywall because the bullet two rows down contradicted it; `paywallLead.ts`'s docblock forbidding three
  synonyms with a test that reds if they return. `DEBT_BENCH_TRUST_FIRSTRUN`'s whole thesis is that trust is
  structural rather than stated — this is what that looks like implemented.
- **The Guardian's cold-start voice.** `cushion-forecast.png`, both themes: *"Reserved since day one — I've
  set your line aside on every paycheck since the first one. I'm still learning your patterns; I'll show my
  track record once I've seen a few more paychecks."* That is §2.0.d's *"cold-start is a protection state,
  not an apology"* landed exactly, with no hedge-stacking and no fabricated number.
- **The tier earns its price.** 13 of 14 gates remove work, and the two the spec itself was worried about —
  the tight-day-one smallest move (§2.10 R1) and the un-closeable-gap branch — shipped as **actions with an
  Undo**, not readouts.
- **The obligation chooser sheet** (`sheet-add-obligation-chooser.png`) is the best-composed surface in the
  app: three cards, each a plain-language definition plus real examples, no jargon, no icons competing with
  the words. It answers "what am I even adding?" better than any incumbent I have seen.
- **Compression is handled.** `state-money-debts-long-names.png` truncates cleanly and reflows the Focus pill
  rather than crushing the row; `state-*-huge` carries $847,363 and $18,231 without a single broken layout.

## What I could not judge

Stills are blind to most of what `DEBT_MOTION_SPEC` specifies, and to everything native. All of the
following is **device-owed → P6.14**, and it should get a row there, not a hope:

| | |
|---|---|
| **All motion** | Count-ups · spring vs default curves · the 40ms list stagger · Linear's asymmetric in/out (~300 / ~150ms) · whether tab switches are genuinely instant (§2.5's black-screen trap) · the ring sweep · the finale's ~4.7s choreography and whether the peak lands as the ring reads 100% |
| **All haptics** | The six-event map, and specifically whether the bespoke Core Haptics payoff crescendo reads as *a rising two-tap resolve* rather than a buzz |
| **Reduce Motion** | The code paths are there and read correctly; whether the static fallbacks still *feel* like celebrations is a device question |
| **Sound** | `playDebtFreeSound()` — opt-in, no-op on web, never captured |
| **Live Activity** | The Payday Countdown renders on a lock screen this matrix cannot photograph (see P1-11) |
| **Native chrome** | `RowContextMenu.ios` (the long-press UIMenu with a lifted row preview), the platform date picker, sheet detents/rubber-banding, safe-area behaviour with a home indicator |
| **Three whole surfaces** | Onboarding, the payoff finale, the milestone beat — **no frames exist** (P1-1). My judgement on the finale is from *source*, and is marked as such |
| **One ambiguity in P1-3** | Whether the default seed's trajectory curve is genuinely absent or merely degenerate-and-clipped. `state-progress-single` suggests the latter; only a device or a taller plot can settle it |
| **Fidelity in general** | Every frame is RN-web. Real typography, subpixel rendering, and Skia at 60fps are not in evidence here — the harness was honest enough to show me its own `ChartSkeleton` when CanvasKit had not loaded, which is how I caught the artifacts at the top of this file |

---

*P1 complete — 15 entries: **7 major** (P1-1 · P1-2 · P1-3 · P1-4 · P1-5 · P1-10 · P1-12, of which **P1-12 is
`[STRUCTURAL]`** and therefore 🎯's scope call, not work) · **5 minor** (P1-6 · P1-7 · P1-9 · P1-11 · P1-13) ·
**1 polish** (P1-8, flagged as my taste) · **2 checks that passed clean** (P1-14 · P1-15), plus the Part-B
enumeration table. Nothing here is work until it survives refutation.*

