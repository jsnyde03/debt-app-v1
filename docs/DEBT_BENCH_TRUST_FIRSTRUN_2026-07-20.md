# Debt Planner — Best-in-Class Benchmark: Trust-as-Felt + First-Run / Cold-Start

_Phase 0.1 (trust surfaces) + Phase 6 (cold-start) evidence layer for the Elevation. 2026-07-20. External first-in-class teardowns → patterns → applied recommendations for THIS app. Cited, not invented. Pairs with `DEBT_ELEVATION_READINESS_AUDIT_2026-07-20.md` (§5 Trust P1, §6 Cold-start P1)._

**The bar being served (from `DEBT_ELEVATION_PLAN.md`):** _"Trust is visible (the moat: honest, on-device, never sells you more debt) — in the app and the store"_ and _"first-run makes a cold user 'get it' in seconds."_

**Where we start (from the readiness audit):** the "never sells you more debt" moat appears **nowhere in-app** — reduced to one privacy row in More → About + a "free to use" onboarding bullet. Cold-start is a **genuine strength** already: a working **"Try with Sample Data"** demo path seeds a populated store and drops the user straight to Plan (`WelcomeStep.tsx:22-27`, `demoSeed.ts:57`), but the onboarding sells **generic PFM benefits**, not the journey or the trust stance.

---

## Part A — Trust as a felt, visible experience

The through-line across every first-in-class privacy brand: **trust is communicated structurally and by absence, not by a legal page or a preachy banner.** The interface itself is the argument.

### A1. Teardown catalog

<details>
<summary><strong>Apple — "Privacy. That's iPhone" · trust surfaced at the moment of data use</strong></summary>

- The headline is a **plain-language promise** ("What happens on your iPhone, stays on your iPhone"), and the product backs it with **on-device processing** framed as "aware of your data without collecting your data."
- Crucially, Apple surfaces trust **at the moment it's relevant, in-context**, not as a one-time disclosure: the Safari **Privacy Report** (trackers blocked) is one tap from the toolbar and on the start page; the **App Privacy Report** / Apple Intelligence Report let you *see* what left the device. Trust is a **visible, countable artifact** ("N trackers blocked"), not a claim.
- The App Store **privacy "nutrition label"** turned an invisible policy into a scannable, at-a-glance card at the decision point (before download).
- Lesson: the strongest trust signal is **letting the user SEE the restraint working** ("nothing left your device") at the surface where the sensitive thing happens.

Sources: [Apple Privacy](https://www.apple.com/privacy/) · [Apple Privacy Features](https://www.apple.com/privacy/features/) · [Apple Intelligence and privacy](https://support.apple.com/guide/iphone/apple-intelligence-and-privacy-iphe3f499e0e/ios)
</details>

<details>
<summary><strong>Signal — trust through the ABSENCE of manipulation (the strongest model for us)</strong></summary>

- Design thesis: **"security should be invisible; trust is earned through the absence of manipulation."** The user never makes a security decision — the product already made the right one. No "secure mode" toggle, no opt-in.
- Trust is communicated by **what it refuses to include**, each omission a micro-signal that the app prioritizes the user over engagement metrics: no ads, no upsells, no social feed, no algorithmic reordering, no anxiety-badge notifications, no read receipts/online status by default.
- **"Minimalism is a security posture."** The minimal UI is a *visual representation of the philosophy*: no tracking, no data harvesting. Restraint reads as trustworthy.
- The **business model IS a design choice**: nonprofit, no ad revenue required → "no business incentive to harvest data" → the whole UI can reject dark patterns. This alignment between business structure and UI restraint is called out as "Signal's most powerful trust communication."
- Concrete trust *moment*: the **Safety Number verification screen** — plain-language ("if these numbers match, your conversation is secure"), optional (casual users aren't burdened), transparent.

Sources: [Signal: Security Through Simplicity](https://blakecrosley.com/guides/design/signal) · [UX analysis of Signal](https://uxdesign.cc/a-week-on-the-signal-app-528efdc33b4)
</details>

<details>
<summary><strong>DuckDuckGo — privacy that doesn't feel restricting; a countable "fire button" + dashboard</strong></summary>

- Privacy-forward **defaults** (tracker blocking on, HTTPS enforced) + an intentionally minimal UI so non-technical users get protection **without fiddling**.
- "By engaging in a plain and simple manner, DuckDuckGo's design draws a picture of reliability, transparency and trust. Privacy is applied in a way that **doesn't feel restricting**."
- The **privacy dashboard** (per-site tracker count) and the **Fire Button** (one-tap clear-everything) make protection *tangible and satisfying* — trust you can watch working and physically enact.

Sources: [DuckDuckGo privacy dashboard case study](https://medium.com/design-bootcamp/case-study-browser-privacy-dashboard-3ddf7dcc8902) · [DuckDuckGo tracking protections](https://duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections)
</details>

<details>
<summary><strong>Proton — "we only make money if you upgrade" (incentive alignment as the message)</strong></summary>

- Core message: **"Proton doesn't sell ads and doesn't sell data in any way."** Paid plans are the *only* revenue source, so **"Proton only makes money if users decide to upgrade, aligning financial incentives with user needs."**
- Explicit contrast-positioning against the incumbents: unlike companies "that harvest user data as their business model," Proton is private by design (zero-access encryption — "even Proton can't read your data").
- Marketing tactic: **educate** about the problem to make the alternative feel obvious. "Why privacy isn't free" reframes the paid model as the *proof* of trust, not a cost.

Sources: [Why privacy isn't free (Proton)](https://proton.me/blog/ad-free-business-model) · [How Proton markets its privacy ecosystem (Digiday)](https://digiday.com/marketing/how-proton-is-marketing-its-privacy-ecosystem-to-compete-with-google-and-apple/)
</details>

<details>
<summary><strong>Oura — health-data trust via "off by default, you opt in" + honest limits</strong></summary>

- Positioning: **does not sell or rent personal data; all third-party data-sharing integrations are OFF by default** — the user must actively opt in. "Default-off" is itself the trust signal.
- Notably *honest about its limits* (independent reviews flag that the ring requires cloud, so the most intimate data lives on Oura's servers) — a reminder that **an on-device app has a stronger, cleaner claim than Oura can make**, and should press that advantage.

Sources: [Oura data privacy](https://ouraring.com/blog/health-data-privacy/) · [Mozilla review of Oura](https://www.mozillafoundation.org/en/nothing-personal/oura-ring-privacy-review/)
</details>

<details>
<summary><strong>Contrast case — predatory debt/credit apps (what our moat is positioned AGAINST)</strong></summary>

- The category we differentiate from: 11,000+ BBB complaints on debt/credit-relief; **hidden higher-than-expected fees, undelivered promises, aggressive onboarding tactics, permission abuse** (contacting the user's contacts on default), and the "attorney-model" loophole to collect advance fees.
- Predatory apps use **misleading interfaces and aggressive onboarding** to exploit low-literacy users. This is the felt experience we invert: **no fees to escalate, no data to leak, no upsell into more borrowing.**
- Our stance — *"honest, on-device, never sells you more debt"* — is a direct, credible antonym of the whole category. That's a marketing gift most finance apps don't have.

Sources: [BBB Debt Relief Study](https://www.bbb.org/all/scamstudies/debt-relief-study/debt-relief-full-study) · [The Cost of Convenience — predatory loan apps (arXiv)](https://arxiv.org/pdf/2601.12634)
</details>

### A2. Trust-as-felt — patterns synthesis

1. **Trust is shown, not stated. Prove it, don't preach it.** Apple's "N trackers blocked" and DuckDuckGo's Fire Button beat any paragraph. A *countable, visible* artifact of restraint > a claim.
2. **The most powerful trust signal is ABSENCE (Signal).** No ads, no upsell, no dark-pattern badges, no manipulation. For a debt app the killer absence is: **we never surface a "borrow more / open a card / take a loan" offer.** Name that absence explicitly — it's invisible unless you point at it.
3. **Incentive alignment is the argument (Proton).** "This app has no ads and never sells your data or you — it's on-device, so there's nothing to sell" tells the user *why* they can believe you. For us: "on-device + no lender referrals = we literally profit only if the app helps you, not if you stay in debt."
4. **Land trust at the moment of vulnerability, in-context — not as a one-time page.** The right moments are (a) **first data entry** (you're about to type debt numbers), (b) **the paywall** (where users brace for a predatory turn), and (c) **an ambient always-visible cue**. A single About row is the weakest possible placement.
5. **Minimalism itself reads premium and trustworthy** — aligns exactly with the portfolio's "less is more" bar. Don't add a trust *card* everywhere; the restraint of the whole UI is doing work. One deliberate trust *moment* beats trust clutter.
6. **Plain language, calm tone, optional depth.** Signal's "if these numbers match, you're secure" — no jargon, no fear. A debt-stressed user needs reassurance, not a security lecture.
7. **On-device is a stronger claim than even Oura/Apple can fully make — press it.** No account, nothing uploaded, works offline. That's the cleanest privacy story in consumer software; state it flatly and let it stand.

---

## Part B — First-run / onboarding / cold-start

The consensus across the best onboardings: **deliver a moment of value BEFORE asking for setup or commitment**, and make the *doing* the onboarding.

### B1. Teardown catalog

<details>
<summary><strong>Duolingo — value first, account second; the lesson IS the onboarding</strong></summary>

- Users **complete a lesson before creating an account.** Moving signup behind the first lesson **increased DAUs by 20%** — the **endowed-progress effect**: once effort is invested, abandoning feels like a loss.
- "Instead of showing users how to learn, Duolingo lets them do it." **The first lesson is the onboarding.** No feature tour — immediate doing.
- A few light personalization questions (goal, level) come first, but they *feed* the experience rather than gate it; signup is a **soft wall then a hard wall**, offered once there's progress worth saving.

Sources: [Duolingo user onboarding (Appcues)](https://goodux.appcues.com/blog/duolingo-user-onboarding) · [Duolingo onboarding teardown](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html) · [5-minute masterclass in user value (Juno)](https://www.junoschool.org/article/duolingo-onboarding-experience/)
</details>

<details>
<summary><strong>Copilot vs Monarch — easy-first beats powerful-first for time-to-value</strong></summary>

- **Monarch = faster time-to-value / smoother onboarding**; even novices are "at ease, features a few taps away." **Copilot = beautiful but a steeper learning curve**; its depth only pays off *after* the user climbs the curve.
- Direct lesson: gorgeous design does **not** rescue a slow time-to-first-value. The winner for cold-start is the one that gets a novice to "I get it" fastest. **Ease-of-comprehension is the cold-start metric, not feature depth.**

Sources: [Monarch vs Copilot (Monavio)](https://monavio.app/blog/monarch-money-vs-copilot-money/) · [Monarch vs Copilot (Modest Money)](https://www.modestmoney.com/monarch-money-vs-copilot/)
</details>

<details>
<summary><strong>Fintech onboarding best-practice — "look-around mode" before KYC/signup</strong></summary>

- **"Before prompting users to register or complete KYC, demonstrate the value."** A **"look-around mode"** / ungated access — a sample portfolio, a simulated savings plan, a budgeting widget usable without logging in — "builds early confidence and makes the decision to register feel natural."
- **76% of users who convert do so within the first 7 days**; activation probability drops sharply after. The design question is *"how do we get users to their first moment of value, fast?"* — not "how do we get them through the flow."
- Empty states should **teach and point forward** (promo cards, a demo), never sit blank.

Sources: [Fintech onboarding best practices (Userpilot)](https://userpilot.com/blog/fintech-onboarding/) · [Fintech onboarding checklist (Goodface)](https://goodface.agency/insight/fintech-mobile-app-onboarding-checklist/)
</details>

<details>
<summary><strong>Debt-payoff apps — the "debt-free date" is the aha; instant recalculation is the wow</strong></summary>

- **The core aha across the category: show the exact debt-free date the moment the first balance is added.** That single computed date is the emotional payload.
- The category's best-described *wow*: a user logs a $50 overpayment, the dashboard updates instantly, and **"seeing the debt-free date move up by 18 days"** was "a tiny, tangible victory that kept me going." → **the recalculation animation is the delight beat, and it's a trust beat too** (the math visibly works for you).
- Onboarding restraint wins: apps that **dropped income/extra questions** to reach the number faster reported better UX. Immersive ~4-minute onboarding is the *outer* bound, not the target.
- Note: this benchmark converges with the Visual/Motion benchmark — the **animated debt-free-date recalculation** is simultaneously the cold-start wow (B), the delight beat (Phase 3), and a felt trust signal (the plan visibly serves the user).

Sources: [Debt-free date apps overview (Spendify)](https://spendify.money/blog/best-debt-payoff-apps/) · [Debt Payoff Planner](https://www.debtpayoffplanner.com/) · [Ditch — "put debt on autopilot"](https://www.ditch.io/)
</details>

<details>
<summary><strong>Oura — personalize-then-deliver, but honest about the "wait for baseline"</strong></summary>

- Light personalization up front (age, goals) that *shapes* recommendations; teardowns fault it for **too many setup steps sapping the initial excitement**. Lesson: **every setup step before the wow is a tax** — keep it to what genuinely personalizes.

Sources: [Oura onboarding deep-dive (Everyday Industries)](https://everydayindustries.com/oura-ring-onboarding-user-experience-evaluation/)
</details>

### B2. First-run — patterns synthesis

1. **Value before commitment (universal).** Duolingo's lesson-first, fintech's "look-around mode," sample-data demos — all front-load a moment of value before signup/heavy setup. **We already have the mechanism** (Try with Sample Data); the gap is what it *shows* and how it's *framed*.
2. **Make the doing the onboarding.** No feature tour. Drop the user into a *populated, alive* app where the value is self-evident (Duolingo). A cold user should see a real plan, not a blank form or a carousel of bullets.
3. **Time-to-first-wow is THE metric.** For a debt app the wow is unambiguous and category-proven: **"here's your debt-free date."** Get there in the fewest possible steps. Copilot proves beauty can't buy back a slow wow.
4. **Ask the minimum that genuinely personalizes; defer the rest.** Every pre-wow question is a tax (Oura). Reach the debt-free date on the thinnest possible input, then let the app *earn* the next detail.
5. **The recalculation is the emotional hook** — the date *moving* when you add a payment ("18 days earlier") is the moment that converts and retains. Design first-run so the user experiences a *change* to the date, not just a static number.
6. **Empty states never sit blank** — they teach and point at the demo / first action.

---

## Part C — Store-presence trust (Phase 6 tie-in, brief)

- **First frame = the core promise, not a UI screenshot.** ~90% of users don't scroll past screenshot 3; the first three form a mini-story: **Value → Flow → Trust.** Never lead with a dashboard/login.
- **Lead with the emotional payload** (the debt-free date / celebration), then flow, then **close on trust** ("On-device. No account. We never sell you more debt.") — trust as the *closing* frame is the proven sequence, and it's our differentiator.
- **Never show empty/placeholder/fake-looking content** — "nothing undermines credibility faster." Shoot screenshots against the *populated demo state* (which we already have).
- Dark/high-contrast backgrounds + bold headlines read premium; blue/green convey trust. (Aligns with the portfolio's dark-mode-screenshots rule.)

Sources: [ASO screenshot best practices 2026 (AppFollow)](https://appfollow.io/blog/aso-screenshots-best-practices) · [ASO screenshots best practices (Screenhance)](https://screenhance.com/blog/aso-screenshot-best-practices-2026) · [Screenshot story flows framework](https://medium.com/@AppScreenshotStudio/in-2026-the-battle-for-user-attention-on-the-app-store-and-google-play-is-no-longer-won-by-6fe9f70c707c)

---

## Applied recommendations — for THIS app

### R1. Where the trust moat should surface in-app (specific moments, tied to precedent)

Trust should live at **three moments of vulnerability + one ambient cue**, and *nowhere else* (restraint = the Signal/less-is-more bar). Do **not** sprinkle trust cards across daily surfaces.

| # | Surface / moment | What to show | Precedent |
|---|---|---|---|
| **T1** | **First data-entry moment** (about to type debt balances, in first-run) | One calm line at the point of entry: *"This stays on your device. No account, nothing uploaded — it works with your phone in airplane mode."* Optional "why" disclosure. | Apple (trust at the moment of data use); Signal (plain language, optional depth) |
| **T2** | **The paywall** (where users brace for the predatory turn) | The incentive-alignment statement as a first-class line, not fine print: *"No ads. No selling your data. No lender referrals. We only make money if the app is worth paying for — never by keeping you in debt."* | Proton ("we only make money if you upgrade"); the whole anti-predatory contrast |
| **T3** | **Onboarding's value/close beat** (replaces the buried "free to use" bullet) | Reframe the welcome to lead with the **journey + the honest-by-design stance**: *"A debt payoff plan that's actually on your side — private, on your device, and it will never sell you more debt."* | Signal (absence-as-signal); Duolingo (value framing) |
| **T4** | **One ambient, always-available proof** — a lightweight "Your data is yours" / **Privacy at a glance** entry in the More hub, elevated from a text row to a small *felt* panel (on-device · no account · nothing uploaded · we never sell you more debt · no ads). | Countable/visible artifact of restraint | DuckDuckGo dashboard; Apple Privacy Report (a *place* that proves it) |

**The signature move (name the absence):** the moat is *"never sells you more debt."* That's invisible unless pointed at. State it explicitly at T2/T3 as the thing this app **refuses to do** — the Signal lesson that the most powerful trust signal is the manipulation you *left out*. This is the single highest-leverage trust change; the readiness audit confirms it appears nowhere today.

**Tone guardrails:** calm, plain, reassuring — never fear-based, never a security lecture, never a repeated banner. A debt-stressed user needs to exhale, not study a policy. One line per moment; depth optional behind a tap.

### R2. Recommended first-run / cold-start arc (building on the existing demo path)

Goal: **cold user sees their debt-free date and watches it move, in well under a minute**, with the trust stance felt at entry. Two lanes off the welcome, demo as the hero.

1. **Welcome (reframed).** Lead with the journey + trust stance (T3), not PFM bullets. Two clear choices: **"Try it with sample data"** (hero / recommended) and **"Set up mine."** Fix the copy/reality gaps the audit flagged (drop "Swipe to pay" until it's built).
2. **Lane A — Demo (the value-first hero, per Duolingo/fintech "look-around mode").** Drop straight into a **populated, alive Plan/Today** with a real sample debt-free date already on screen — the "get it in seconds" wow with zero data entry. Then a **single guided beat: "Add a $50 payment"** → the debt-free date **animates earlier ("18 days sooner")** — the category-proven wow + delight + trust beat in one. A gentle, honest **"This is sample data — start yours"** converts, endowed-progress style.
3. **Lane B — Real setup (minimum-to-wow).** Ask **only** what's needed to compute a date: first debt (balance, rate, min payment) — defer income/extras (per Oura's "steps sap excitement" and the debt-app "dropped questions → better UX" finding). The instant the first balance lands, **show the debt-free date** (the aha). Surface the **T1 on-device line at this exact entry moment**.
4. **Then, and only then, the ask.** No account exists (on-device) — so the "signup wall" equivalent is the **paywall/notification-permission**, offered *after* the wow, once there's a plan worth protecting (Duolingo soft-then-hard wall). Trust statement T2 lives here.
5. **Empty states point forward**, never blank — each nudges toward the demo or the first debt.

**Sequencing note (matches the readiness audit's circular dependency):** the demo's *wow* depends on the animated recalculation (Motion, Phase 2b/3) and the debt-free-date surface existing — so this arc's hero beat can't be shot for the store (Phase 6) until motion + the Progress surface ship. Build the recalculation-animation once; it serves cold-start, delight, trust, AND the store's first frame.

### R3. Store presence (Phase 6)

Three-frame story on a dark, premium background: **Frame 1** the debt-free date / celebration (emotional payload) → **Frame 2** the payday-loop flow → **Frame 3 closes on trust** ("On-device · No account · Never sells you more debt · No ads"). Shoot against the **populated demo state** (never empty/fake). Trust-as-closing-frame is both the proven ASO sequence and our differentiator.

---

## One-line handoff to the design items

- **→ 0.1 / Phase 6:** adopt R1 (four trust surfaces, "name the absence") + R2 (demo-hero, value-first, minimum-to-wow arc).
- **Convergence flag:** the **animated debt-free-date recalculation** is the shared linchpin of cold-start wow, the Phase-3 delight beat, the felt trust signal, and the store's first frame — build it once, early; everything downstream leans on it.
