# M4 — THE EXPECTATION GAP

> **Lens:** outside-in. Not "does this app do what it meant to" — **"what does a person arriving from
> somewhere else expect to find, and is it here?"**
> **Tree:** `v1.7-dev` @ `dd80f70`, shipping as **2.0.0** to US/CA/AU/NZ.
> **Judged against the app's OWN lane**, per `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` §1:
> **debt-first × payday-cadence × fully-automated × on-device**, with **manual entry as a deliberate
> privacy tradeoff**. "It should connect to my bank" is therefore NOT a defect and is not filed.

**Reference points used** — YNAB / EveryDollar (envelopes, rollover, every-dollar-a-job) ·
Undebt.it / Debt Payoff Planner (avalanche-vs-snowball side by side, extra-payment what-ifs, a payoff
calendar) · Mint / Copilot / Monarch (connected, auto-categorised, net worth) · **a spreadsheet**
(what most people in debt actually use, and it does exactly what they told it to).

⚠️ Nearly everything here is **[STRUCTURAL]** — a scope call for 🎯, not a fix. Each finding carries a
plain verdict: **2.0 blocker** · **2.1 candidate** · **correctly out of lane**. The third is used often
and is a real answer.

---

_(findings appended below as they are traced; this file is written incrementally)_

## Findings

### M4-1 — Snowball vs Avalanche is a SWITCH, never a COMPARISON — and the app already computes both
**Severity:** major · **[STRUCTURAL]** · **Verdict:** **2.1 candidate** *(strong one — the cheapest high-value item on this page)*
**Expectation:** Undebt.it, Debt Payoff Planner, Vertex42's spreadsheet and every "debt snowball
calculator" on the web open with the **same** hook: *pick a method, and here is what the other one
would have cost you.* Undebt.it's comparison page is literally its landing pitch. A newcomer arrives
knowing the two words and wanting **one number**: *which is better for me, and by how much?*
**What the app does:** `apps/rn/src/app/(tabs)/money.tsx:356-370` — a `SegmentedToggle` between
Snowball and Avalanche, captioned with a **generic textbook definition** (*"Smallest balance first —
quick wins"* / *"Highest APR first — least interest"*). Switching re-orders the list and re-draws the
curve. ⚡ **`apps/rn/src/store/payoffSelectors.ts:66-96` runs BOTH simulations on every render** —
`snowballSim` and `avalancheSim`, each with points + per-debt clear months — and
`apps/rn/src/components/payoff/TrajectoryChart.tsx:133` then discards one: `const active = strategy ===
'snowball' ? snowball : avalanche;`. The chart's ghost line (`:136-137`) is the **minimums** baseline,
not the other strategy.
**Gap:** the delta between the two strategies — months, interest, debt-free date — is **computed on
every render and never expressed**; the user is asked to choose between two options the app has
already priced and won't tell them the price of.
**Cost if unaddressed:** the comparison-shopper bounces at the Money tab, ~40 seconds in, having
concluded the app is a *worse* calculator than the free web tool they came from — because the one
question they arrived with is the one it declines to answer. Worse, it costs money: the user who
picks Snowball for the feeling and is never shown the interest it costs is *less* well served than by
a spreadsheet.
**Confidence:** high *(both sims traced, and the discard is one line)*

---

### M4-2 — The spreadsheet cannot come with them: no CSV/paste import, 7 fields × 12 debts
**Severity:** major · **[STRUCTURAL]** · **Verdict:** **2.1 candidate**
**Expectation:** the reference user for this app is **someone with a spreadsheet full of debts** — the
tool most people in debt actually use. Every rival meets them: Undebt.it imports CSV, YNAB imports
CSV/QFX, EveryDollar and Monarch both do CSV. The spreadsheet-holder's first question is *"can I get
my list in without retyping it?"*
**What the app does:** onboarding collects **exactly one** debt or bill
(`apps/rn/src/app/onboarding.tsx:38` → `FirstDebtOrBillStep`); after that every debt is the Add sheet,
which is **7 fields** — Name · Type · Balance · Minimum · APR · Due date · Recurrence
(frame `capture-ref/p6.8/phone/light/sheet-debt-sheet-add.png`). The `many` frame
(`state-money-debts-many.png`) shows the destination state — 12 debts, $39,246 — i.e. **~84 typed
fields** to reach it. More → **Import backup** accepts only the app's own JSON
(`apps/rn/src/data/detectBackupFormat.ts:26` — `envelope` · `v16-file` · `raw-v17`, and it is
deliberately built to *refuse when unsure*). **Scan a statement** is one debt per scan and iOS-only
(`apps/rn/src/lib/scan.ts:12-21`, `money.tsx:296-315`).
⚡ **And a CSV parser already exists in the codebase** — `apps/rn/core/imports/debtCsv.ts` /
`packages/core/imports/debtCsv.ts`, `parseDebtCsv(file)` — wired **only** into the legacy root tree
(`lib/hooks/useDebts.ts:6,188`), which **P6.11 deletes**. So this is not just a gap in the RN app; on
the current plan a shipped capability leaves with the old surface.
**Gap:** there is no path from a spreadsheet into this app that isn't typing, and the parser that
would provide one is about to be deleted along with its only caller.
**Cost if unaddressed:** the highest-intent user — the one organised enough to already track their
debts — hits the largest wall, at minute two. They will not type 84 fields on a phone to evaluate an
app they haven't paid for; they bounce **before** ever seeing the Guardian, which is the thing that
would have sold them.
**Confidence:** high *(the deletion consequence is traced; whether P6.11 intends to carry `debtCsv`
forward is a question for that item, not a claim here)*

---

### M4-3 — No trial, no guarantee: a $79.99 Lifetime asked for on description alone
**Severity:** major · **[STRUCTURAL]** · **Verdict:** **2.0 blocker** *(the smallest version of it is copy, not a feature)*
**Expectation:** YNAB gives 34 days free. Undebt.it has a permanently free tier. Copilot and Monarch
both trial. Nobody in this category asks for money before use. The app's **own** elevation spec
anticipated exactly this and specified the answer:
*"a **proof-window money-back guarantee** … so the annual/Lifetime buyer isn't staking a
no-safety-net commitment on a deliberately-throttled first month"*
(`docs/DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` §2.10, recorded as **Jason's round-6 decision**).
**What the app does:** `apps/rn/src/app/paywall.tsx:83-84` — *"2.0 ships with NO trial, so this is
`'unknown'` and `introPrefix` returns ''"* ([D53]). The paywall
(`capture-ref/p6.8/phone/light/paywall.png`) leads **Annual $29.99 · Lifetime $79.99 · Monthly
$4.99** with no trial and **no guarantee copy anywhere in the file** (grepped: no
`guarantee` / `refund` / `money-back`). The only alternative to deciding now is *"See it in action"*
→ the sandbox demo (`paywall.tsx:356-364`), which is a **demo**, not use.
**Gap:** the de-risker the strategy called launch-critical is absent, and what replaced it is nothing —
so the ask is a cold $79.99 against a free-tier competitor.
**Cost if unaddressed:** not a bounce — a **non-conversion**, and it is invisible. The user keeps the
free app and never buys, which is precisely the ~0-conversion outcome
`DEBT_PREMIUM_STRATEGY_2026-07-21.md` opens by describing. Note the guarantee is **Apple's refund
flow plus a sentence** — the honest minimum here is copy, not machinery.
**Confidence:** medium-high *(the absence is certain; whether 🎯 consciously dropped the guarantee
with [D53] is not visible in the tree — overlaps M1's "is what we say true" and P1's tier bar)*

---

### M4-4 — The month is never reconciled to the paycheck for DEBT (it is, well, for expenses)
**Severity:** minor · **[STRUCTURAL]** · **Verdict:** **2.1 candidate** *(and the smallest fix is one caption)*
**Expectation:** every rival organises around the **month**. YNAB and EveryDollar budget a month.
Statements are monthly. Rent is monthly. The number a person in debt actually carries in their head is
*"I pay about $850 a month on my cards."* They arrive expecting to find that number and check it.
**What the app does:** the paycheck frame is taught **relentlessly and well** — `THIS PAYCHECK · SEP 4`
(`PlanHero.tsx:143`), *"Bills and minimums due this paycheck"* (`RequiredActionsCard.tsx:99`),
`CASH FLOW · NEXT 5 PAY CYCLES` on Progress, and the cushion forecast axis is **real dates**, not cycle
numbers (`capture-ref/p6.8/phone/light/cushion-forecast.png`). ⭐ **Expenses bridges the two units
explicitly:** `money.tsx:709-711` renders *"of $X recommended each paycheck · **≈ $Y/mo**"*, suppressed
as redundant for monthly-paid users (`:561`), with a per-bill receipt sheet that "shows its work"
(`BillBreakdownSheet.tsx:46-60`). The code has clearly already fought this battle
(`money.tsx:686` — *"The number was never the lie; the VERB was"*).
**Gap:** that bridge exists **only on the Expenses tab**. Debts show a bare `/mo` per row
(`money.tsx:495`) that is **never summed**, and the Debts hero is a balance, not a rate — so
*"what am I paying per month on debt"* has no answer anywhere, and the Today hero's `Required` figure
legitimately swings paycheck to paycheck (**$450** in `today.png` vs **$2,658** in
`state-today-many.png`) with nothing that says *why this paycheck is different from the last one*.
**Cost if unaddressed:** not a bounce — a **slow trust leak**. In week three the user sees Required
jump, cannot reconcile it to the monthly figure they know, and quietly concludes the app's numbers
"move around." That is exactly the class of doubt the Guardian's whole confidence layer is built to
prevent, arriving from the one direction it does not watch.
**Confidence:** medium *(the absence is traced; whether users actually need the monthly debt total is
a judgement, not a measurement)*

---

### M4-5 — No 0% / promotional APR, and no credit limit: the balance-transfer user cannot be modelled
**Severity:** minor · **[STRUCTURAL]** · **Verdict:** **2.1 candidate** *(promo APR)* + **correctly out of lane** *(utilisation)*
**Expectation:** two of the most common things a person in credit-card debt has actually **done**:
(a) moved a balance to a **0% intro card that expires** — Undebt.it and Debt Payoff Planner both model a
promo rate with an end date, because a plan that ignores the cliff is wrong on the exact month it
matters; (b) watched **utilisation** to protect a credit score — the Credit-Karma/Mint reflex, and a real
reason people choose which card to attack.
**What the app does:** `apps/rn/core/storage/debtPlannerStorage.ts:46-90` — `Debt` carries a single flat
`apr: number`. No intro rate, no rate-change date, no `creditLimit`. Repo-wide grep for
`promo` / `intro.*apr` / `balance transfer` returns nothing in the engine. ⚠️ Note the *expense* sheet
**does** have a "Free trial or intro price" toggle (`sheet-expense-sheet-add.png`) — so the app models a
rate cliff for a $12 subscription and not for a $6,000 balance transfer.
**Gap:** a 0% balance sitting at `apr: 0` makes Avalanche rank it **last forever** and the payoff date
silently assumes free money past the cliff; the user with the most urgent deadline in their portfolio is
the one the engine is blindest to.
**Cost if unaddressed:** the balance-transfer user gets a **confidently wrong** payoff date rather than a
missing feature, which is worse — and they find out at the cliff, not at install. Utilisation is a
different story: it needs a bureau or a limit the user must maintain by hand, it optimises a *score*
rather than a *payoff*, and it is **correctly out of this app's lane**.
**Confidence:** high on the model gap · medium on how many users it bites

---

### M4-6 — The data is a one-way door: JSON in, JSON out, and nothing a spreadsheet can open
**Severity:** minor · **[STRUCTURAL]** · **Verdict:** **2.1 candidate**
**Expectation:** the app leads with **"Private by design — your financial data stays on this device"**
(`capture-ref/p6.8/phone/light/more.png`). A person who chooses a tool *for* that reason is, definitionally,
a person who thinks about custody of their own data — and their next question is *"can I get it out."*
YNAB, Undebt.it and Monarch all export CSV. The spreadsheet user's baseline is that data is portable by
default.
**What the app does:** Export backup writes the store as **JSON** — *"shows the full store as selectable
JSON to copy somewhere safe"* (`apps/rn/src/components/more/BackupSheets.tsx:27-59`), plus a file share.
Import accepts only the app's own three self-identifying JSON shapes
(`apps/rn/src/data/detectBackupFormat.ts:26`). There is no CSV on either side.
**Gap:** "your data stays on your device" is true, and "your data is *yours to use*" is not quite — the
only artifact the app will hand back is one no other tool the user owns can read.
**Cost if unaddressed:** low bounce, real **positioning friction**. It is the one place where the privacy
claim and the user's experience of ownership come apart, and it is the kind of thing a reviewer or a
Reddit comment names. Pairs with **M4-2**: CSV both ways is one parser (`core/imports/debtCsv.ts`
already exists) and closes both.
**Confidence:** high

---

### M4-7 — "Am I better off than last month?" exists, is free, and is two taps into a settings menu
**Severity:** minor · **[STRUCTURAL]** · **Verdict:** **2.1 candidate** *(a placement call, not a build)*
**Expectation:** the single most-wanted number in every money app — *did I move?* Mint's monthly
summary, Copilot's month-over-month, YNAB's Age of Money. It is what brings people **back**, and every
rival puts it on the home screen.
**What the app does:** it is **built and generous** — `apps/rn/src/store/historySelectors.ts:36-48`
gives every finished cycle a `debtDelta` vs the previous one, and `selectHistorySummary` (`:24-28`)
computes total `paidDown` across the whole record, explicitly **ungated and uncapped** (*"the 2026-07-21
premium reshape makes history a generous FREE surface"*, `:30-33`). But it lives at
**More → Pay cycle history** (`more.png`), a settings-tab leaf, and reads *"See how far you've
come, one cycle at a time"* — a review surface you go and look for. Today and Progress never carry it:
the Progress hero is `0% paid · DEBT-FREE October 2026 · $5,000 to go` (`progress.png`) — a
**forecast**, not a **delta**. ⚠️ And `computeCycleDelta` — the v1.6 engine function for exactly this —
has **no consumer in the shipping RN tree**: its only caller is the legacy root
`components/ResultsSection.tsx:11,649`, which **P6.11 deletes**.
**Gap:** the app's best retention beat is filed under settings, and the returning user's first screen
answers *"what next?"* without ever answering *"did last time work?"*
**Cost if unaddressed:** invisible, and it costs **retention** rather than installs. The user who has
been diligent for two cycles gets no acknowledgement on the screen they actually open, so nothing
rewards the habit at the moment the habit is formed.
**Confidence:** high *(placement is traced; the retention claim is reasoning, not measurement)*

---

### M4-8 — The manual-entry tradeoff is never named at the moment the user pays it
**Severity:** major · **[STRUCTURAL]** · **Verdict:** **2.0 blocker** *(it is two sentences, and the app's own benchmark already wrote them)*
⚠️ **This is NOT "it should connect to my bank."** The lane is right. The finding is that the lane is
never *declared* to the one person who most needs to hear it.
**Expectation:** the Mint/Copilot/Monarch refugee's first 60 seconds are a **hunt for the link-account
button**. Not finding one, they need to land on *"it's deliberate"* — otherwise the only remaining
explanation is *"unfinished."* Same user, second beat: they are about to type their **income** into an
app they installed four minutes ago, and every instinct says *where is this going?*
**What the app does:** onboarding is Welcome → Paycheck → First debt/bill → Completion
(`apps/rn/src/app/onboarding.tsx:22-41`). Grepped across all four steps for
`device` / `private` / `account` / `bank` / `sync`: **one hit, and it is an unrelated code comment**
(`OnboardingLayout.tsx:24`). `WelcomeStep.tsx:47-53` opens *"Will you make it to payday? Debt Planner
watches your cushion every paycheck…"* — a benefit, with no stance. `PaycheckStep.tsx:83` asks *"When
do you get paid?"* and takes the number cold. The privacy line exists — but only at the
**paywall** (`paywall.png`) and at **More** (`more.png`, *"Private by design… no account needed. And
you'll never be sold more debt"*), i.e. **after** the data is in.
⚡ **The app's own benchmark specified exactly this and it shipped half:**
`docs/DEBT_BENCH_TRUST_FIRSTRUN_2026-07-20.md` §R1 names four trust surfaces —
**T1** *"first data-entry moment… 'This stays on your device. No account, nothing uploaded'"*,
**T2** paywall, **T3** *"reframe the welcome to lead with the journey + the honest-by-design stance"*,
**T4** the More panel. **T2 and T4 shipped. T1 and T3 did not.** The doc calls the T2/T3 move
*"the single highest-leverage trust change."*
**Gap:** the two trust surfaces the benchmark placed at the **moment of vulnerability** are the two
that are missing, so the app's strongest differentiator is stated only where it reads as a sales line
and never where it would read as a reason.
**Cost if unaddressed:** the highest-value convert — a person actively leaving a connected app over
privacy — types their income with no reassurance and abandons at step 2, or completes onboarding
reading the app as an unfinished budget tracker rather than a deliberate one. **This is the cheapest
finding in the file and the one with the best ratio**: it is copy, the wording is already written in
the repo, and it lands before any number is typed.
**Confidence:** high *(the absence is grepped; the "highest-leverage" claim is the repo's own)*

---

### M4-9 — The product's own marketing promises three things 2.0 does not do — and two of them are M4-1 and M4-2
**Severity:** major · **[STRUCTURAL]** · **Verdict:** **2.0 blocker for the DECISION** *(build it or unsay it — but not silence)*
**Expectation:** whatever the store page says. That is the only promise a newcomer has read before
launch, and it is the specification they audit the app against in the first two minutes.
**What the app does:** the tree's only listing artifact is
`docs/release-notes/app-store-listing.md` — the **v1.6** copy. It advertises, in the app's own words:
| promised | where | 2.0 reality |
|---|---|---|
| *"full backup + **CSV import**"* — listed under **free** | Description, "Also free" line | **absent** — RN import is JSON-only (`detectBackupFormat.ts:26`), and the parser's only caller is the tree P6.11 deletes. **M4-2** |
| *"**Strategy Comparison** — Snowball vs. avalanche, **side-by-side**, using your real balances and APRs — not a generic rule of thumb"* — a **paid** premium bullet | Description, PREMIUM | **absent** — a toggle with a textbook caption (`money.tsx:356-370`). **M4-1** |
| *"**Since-Last-Cycle Delta** — see how much total debt you knocked down since the last one"* | v1.5 What's New | **absent from the RN tree** — `computeCycleDelta`'s only consumer is legacy `ResultsSection.tsx`. **M4-7** |
| *"Smart Insights — adaptive recommendations…"* — a **paid** premium bullet | Description, PREMIUM | **deliberately not surfaced** — `analysisSelectors.ts:139`, 2.2.5 scrapped 🎯 2026-07-22. A decided call, listed here only for completeness |
The plan is aware in principle — **P6.21** carries *"Listing · release notes (lead with the rewrite — a
2.0 with 1.7-shaped notes re-creates the expectation problem)"* — but that row is scoped to the
**notes**, and the losses above are in the **description**.
**Gap:** three features this product has already sold — one of them **behind the paywall**, one of them
free — do not exist in the build that inherits their App Store page and their existing users.
**Cost if unaddressed:** two distinct bounces. **(a)** The newcomer arrives having read
*"snowball vs avalanche side-by-side"* — the exact reason they picked this app over Undebt.it — and finds
a toggle; that is not a missing feature, it is a **broken promise**, and it is the first thing they
check. **(b)** The **upgrading v1.6 user** loses free CSV import and the since-last-cycle delta in a
release that also removes the trial ([D53]) — the shape that produces 1-star "they took features away"
reviews, which are the hardest kind to recover from at launch.
⚠️ **This reframes M4-1 and M4-2:** they are not gaps against a competitor, they are **regressions
against a shipped, paid promise**, and should be severity-rated as such.
**Handoff:** M1 owns *"is what we say true."* This finding is the **outside-in** half — what the claim
causes a newcomer to look for. The two should be read together and not double-counted.
**Confidence:** high on the delta · medium on whether 🎯 already intends to cut these bullets at P6.21

---

### M4-10 — Spending lives in two places, and the split is the app's model rather than the user's
**Severity:** polish · **[STRUCTURAL]** · **Verdict:** **correctly out of lane** *(the model is right; only the naming leaks)*
**Expectation:** the YNAB/EveryDollar user opens the category picker looking for **Groceries**.
**What the app does:** money you spend is modelled **twice, on two surfaces**. Recurring bills live on
**Money → Expenses**, categorised from a fixed 7-value enum —
`housing · utilities · insurance · subscriptions · discretionary · medical · other`
(`apps/rn/core/storage/debtPlannerStorage.ts:3-13`), with no custom categories. Day-to-day money lives
on a **separate screen**, *Everyday spending* (`/living-expenses`, reachable from Today, Money and
More), whose empty state reads *"Add groceries, gas, or fun money"*
(`capture-ref/p6.8/phone/light/living-expenses.png`).
**Gap:** groceries is not in the category list because groceries is not that kind of thing here — the
enum exists to rank **what gets cut in a shortfall** (`classifyDeferability`, per the
`debtPlannerStorage.ts:41-42` comment), not to budget. That is a **better** model for a debt app. But it
is never said, so the picker reads as an incomplete budgeting taxonomy.
**Cost if unaddressed:** a few seconds of "where's groceries" on the expense sheet, recoverable. **Not
worth building for** — the fix, if ever, is one caption on the picker, not a category system.
**Confidence:** medium

---

### M4-11 — The Mint/Copilot/Monarch cluster: connected accounts · auto-categorisation · net worth · credit score
**Severity:** — · **[STRUCTURAL]** · **Verdict:** **correctly out of lane, all four**
**Expectation:** the four things a Mint refugee names first.
**What the app does / why each is right to be absent:**
- **Connected accounts** — the declared tradeoff (§1: *"Manual entry is the deliberate privacy tradeoff,
  not a hidden weakness"*), with the economics measured, not asserted
  (`DEBT_PREMIUM_STRATEGY_2026-07-21.md`: Plaid ~$0.40–0.90/user against a $4.99 sub, plus GLBA custodian
  liability and ~34%@90d re-auth churn). Already homed as **Premium Connected, ~v1.8**, priced as its own
  tier. ✅ Right call, and the ladder already has the slot.
- **Automatic categorisation** — needs the transaction stream connection would provide; the same doc
  homes it *"where the work-saving version needs transactions"*. ✅
- **Net worth** — requires assets, which this app deliberately does not model. It is the *cash-flow /
  net-worth future's* job, explicitly. ✅
- **Credit score / utilisation** — needs a bureau, and optimises a **score** rather than a **payoff**.
  ✅ Out of lane. *(The `creditLimit` half of this is noted in **M4-5** only because it changes which
  debt to attack, not because the score should be shown.)*
**Gap:** none of these is a defect. ⚠️ **The only real cost is M4-8** — that the tradeoff behind all
four is never stated where the user experiences it.
**Cost if unaddressed:** zero, provided M4-8 is closed. If M4-8 is *not* closed, all four read as
absence rather than as choice, and that is the whole risk.
**Confidence:** high

---

### M4-12 — What a newcomer DOES find, faster than the competition (recorded so the gaps are weighed against something)
**Verdict:** **no action** — a countervailing record, not a finding.
An outside-in lens that only lists absences misrepresents the product. Traced, and each is a genuine
first-60-seconds win against the named references:
- **The debt-free date arrives before the app is even set up.** `CompletionStep.tsx:33-34` lands *their
  real projected date* on the last onboarding screen — the "aha" `DEBT_BENCH_TRUST_FIRSTRUN` §R2 asked
  for, shipped. Undebt.it needs a full portfolio first.
- **What-If is free, uncapped and honest.** `WhatIfControls.tsx` — the extra-payment amount is
  **directly typeable with no artificial ceiling** (*"nobody can know what a given person can
  afford"*), and it bends a live curve with date · $ saved · months sooner. This is the Undebt.it
  headline feature, free, and better executed.
- **Pay-cycle history is free and uncapped** (`historySelectors.ts:30-33`) — a **deliberate
  de-monetisation** of what v1.5 sold as Premium.
- **Goals fund before debt, with the cost shown.** `Goal.priority` /
  `priorityPerPaycheck` (`debtPlannerStorage.ts:97-105`) — the Ramsey "$1,000 first" reflex is
  modelled, *and the honest debt-free-date cost is shown at opt-in*. EveryDollar's core promise, met.
- **A demo that ships to users**, reversing an earlier pull ([D21], `config/qa.ts` `isDemoReachable()`),
  reachable from both Welcome and the paywall.
- **Per-paycheck envelopes without envelope work** — `Required · Spoken for · Flexible` summing to the
  paycheck (`PlanHero.tsx:95-101`). "Give every dollar a job," with the app doing the assigning. That is
  the lane, executed.

---

## What I could not judge

1. **Whether P6.21 already intends to cut the three dead bullets (M4-9).** The plan row reads
   *"Listing · release notes (lead with the rewrite…)"* — scoped to the **notes**. The losses are in the
   **description**, and no 2.0 description exists in the tree to compare against. This is a question for
   🎯, not a claim I can settle by reading.
2. **Whether the monthly debt total (M4-4) is actually wanted.** I can prove the number is absent; I
   cannot prove anyone looks for it. Needs a user, not a repo.
3. **Real entry time for 12 debts.** I counted **fields** (7 × 12 ≈ 84), not seconds, and not on a
   device with a thumb. The `state-money-debts-many.png` frame shows the destination, never the cost of
   reaching it. **Device-owed → P6.14.**
4. **Whether the demo substitutes for a trial (M4-3).** It is a *scripted five-beat run of someone
   else's money*, and whether that converts where a trial would is a motion/feel question stills cannot
   answer.
5. **Whether the Guardian is worth $29.99/yr.** That is **P1's** question (*"is it good enough"*), not
   mine (*"is it what they came for"*). I have deliberately not judged it.
6. **Non-US expectation deltas.** 2.0 ships to **US · CA · AU · NZ**. My reference set is
   US-centric — Undebt.it, EveryDollar and Ramsey framing especially. AU/NZ users arrive from a
   different competitive set I did not sample.

**Noted outside my lens, so it is not lost:** `apps/rn/src/config/qa.ts:9` still has
`export const QA_TOOLS = true` under a comment reading *"⚠️ FLIP TO `false` BEFORE THE APP STORE
SUBMISSION (Phase 6)."* Not an expectation gap — **W1's**, or P6.21's checklist.

---

## Ranked: the three gaps I would spend on

**1 · M4-8 — put the trust line at the first data-entry moment (and the stance on Welcome).**
The best ratio in this file by a wide margin: it is **copy**, the wording is **already written** in
`DEBT_BENCH_TRUST_FIRSTRUN_2026-07-20.md` §R1 (T1 and T3), it carries no engine risk, and it lands
**before** the moment the highest-value convert abandons. It is also the load-bearing dependency for
M4-11 — close this and four "missing" features become four visible choices; leave it and the app's
single strongest differentiator is stated only in the two places that read as sales copy.

**2 · M4-1 — show the snowball-vs-avalanche delta.**
Both simulations already run on every render (`payoffSelectors.ts:66-96`) and one is discarded one line
later. The output is **months and dollars from data already in hand** — no new model, no new input. It
converts the app's most comparison-shopped screen from *worse than a free web calculator* into *the
reason to use this one*, and the store page has **already sold it** (M4-9), so it is closer to
delivering a promise than to adding a feature.

**3 · M4-2 + M4-6 — CSV in and CSV out, as one item.**
The parser exists (`core/imports/debtCsv.ts`) and is currently scheduled to be **deleted with its only
caller** at P6.11 — so the cheapest moment to decide this is *now*, while the code is still there. It is
the only door the spreadsheet user can walk through, it closes a **shipped, advertised, free** v1.6
capability that 2.0 otherwise silently removes, and the export half repairs the one seam where "private
by design" and "your data is yours" come apart.

**Deliberately not in the ranked three, and not because they don't matter:**
- **M4-9** is not a *spend* — it is a **decision** (build the bullets or unsay them), and unsaying costs
  nothing but must not be left to drift into submission.
- **M4-3** (no trial, no guarantee) is copy-sized in its honest minimum — Apple's refund flow plus a
  sentence — but it is a **pricing** call that belongs to 🎯 and overlaps M1/P1, so I have named it
  rather than ranked it.
