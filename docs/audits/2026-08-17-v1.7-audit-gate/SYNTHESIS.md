# v1.7 whole-app audit gate — SYNTHESIS

**117 findings across 7 lenses, plus 8 refutations.** Nothing implemented. This file is the decision
document; per-lens detail lives in `findings/`.

| lens | findings | blocker | major | minor | polish |
|---|---:|---:|---:|---:|---:|
| L0 scripted (deterministic) | 5 | 0 | 4 | 1 | 0 |
| L1 voice & tone | 35 | 4→3 | 15→16 | 12 | 4 |
| L2 duplication & drift | 23 | 0 | 8 | 10 | 5 |
| L3 proxy & capped outcomes | 7 | 0 | 4 | 3 | 0 |
| L4 numbers & visual | 16 | 0 | 5 | 7 | 4 |
| L5 states & first-run | 21 | 2 | 10 | 4 | 5 |
| L6 unclassified props | 10 | 1 | 2 | 5 | 2 |

## ⛔ What the refutation pass changed — read this before trusting any severity

**2 of 3 agent-declared blockers did not survive inspection**, and one uncertain finding flipped class.
That is Law IV holding at its measured rate, and it is why no finding here should become work
un-refuted.

- **L1-1 downgraded blocker → minor.** *"You're covered this paycheck"* under the "Very tight" title is
  not a contradiction: obligations ARE funded, the cushion is below the floor. The site reasons it out in
  a comment. Real question is whether a reader hears "covered" as "fine" — a taste call, not a defect.
- **L3-5's mechanism refuted, severity upheld.** `buildSmartInsights` is imported by the shipping RN app
  (not the legacy tree, as claimed) — but `analysisSelectors.ts:138` records it as deliberately unsurfaced.
  Reclassified: dead code carrying a latent defect.
- **L4-1 CONFIRMED, and it is four hours old.** See below.

## ⭐ The four findings that matter most

**1 · The instruments are under-reporting, and they gate everything else.** Three independent instrument
defects: **25 of 39 e2e specs seed a plan with no bills** (L0-1 — this is why `route-smoke` passed 10/10
while Today was blank); the surface inventory tracks **3 formatters when 9 exist** (L4-2), so the C1 cents
sweep was declared closed against a partial picture; and the strings gate **never consults its own origin
lists** (L6-1), leaving 31 strings unclassified that a one-line fix resolves. ⚠️ Every other number in
this audit is a floor until these are fixed.

**2 · Truthfulness — the app's entire differentiator — has 15+ live breaches.** The sharpest are L3's,
all verified in source: the tight top-up **picks the first savings goal in store-creation order**, so with
`[Vacation $10, New car $800]` it moves $10 and tells you your line can't be held while $800 sits one row
down (L3-3); *"your emergency fund tops back up"* fires when the money came from a savings goal, and the
flag that would fix it already exists unthreaded (L3-1); *"minimum + your extra"* renders over exactly the
minimum whenever extra is 0 (L3-4). Alongside them sit three **purchase-inducement** claims (L1-2/3/4)
that need a decision, not just an edit.

**3 · A named real bank in fabricated financial data, in the public web bundle.** `scan.web.ts` returns
*"Chase Freedom Unlimited / Account ending 4821 / New Balance $2,431.09 / Purchase APR 24.99%"*, imported
by `money.tsx` and `DebtSheet.tsx` (L6-2). Filed major by the lens; **I would raise it** — it is a
trademark-shaped risk on a live marketing URL and it is a two-minute fix. ⚠️ Embed navigation is held
(scripted demo), so a visitor likely cannot reach the screen — but the string ships in the bundle.

**4 · The audit paid for itself on 3.8, four hours after 3.8 shipped.** L4-1: `PlanHero` renders
"Spoken for" whole ($486); the sheet that legend opens recomputes the same sum and renders cents
($486.34). 184 tests and six lint gates could not see it — both numbers are individually correct. It is
the exact class 3.8's own after-scan filed (*two records of one thing*), committed by its author.

## Themes — the 117, grouped as work

| # | theme | items | note |
|---|---|---|---|
| **T1** | **The instruments** | L0-1 · L4-2 · L6-1 · L6-10 · L4-11 | ⭐ Do FIRST. They decide what every later pass can see, and three of them silently narrowed this audit. |
| **T2** | **App Store / legal exposure** | L6-3 (`QA_TOOLS`) · L6-2 (Chase) · L1-2/3/4 (inducement) · L6-7 (RevenueCat key literal) | Submission-blocking or brand risk. Small, and non-negotiable. |
| **T3** | **Correctness bugs** | L0-2/L5-9 (UTC dates, **9 sites incl. the rollover**) · L3-3 (goal pick) · L5-2 (hydrate → black screen, silent save loss) · L5-1 (no-debts user loses the app) · L5-5 · L5-6 · L5-14 | Real defects with concrete repro. L5-2 and L5-1 are the two surviving blockers. |
| **T4** | **The glossary** | L1-5/6/7/14/19/26/34 · L2-6/7/16 | ⚠️ **Must precede every other wording edit.** The cushion has SIX names (one of which is a *different engine bucket*); "expenses"/"bills" are interchangeable AND "expenses" names a second thing; "floor" means two things. L1's own verdict: most other copy findings cannot be fixed cleanly before this. |
| **T5** | **Truth of claims** | L3-1..7 · L1-12/13/15/17/18 | The promise-vs-delivery class. Mostly copy edits once T4 lands; L3-3 and L3-1 are code. |
| **T6** | **Numbers cohesion** | L4-1/3/4/5/6/7/8/9/10 | One rule (whole in heroes, cents in rows), applied once, then enforced. L4-6 is the worst: a bucket header that doesn't sum its rows. |
| **T7** | **Voice & persona** | L1-8/9/10/11 · L1-16 | The Guardian speaks third-person to screen-reader users and throughout the tutorial; a third persona speaks *as* the user. |
| **T8** | **Drift / one-owner** | L2 ×23 · L0-3 | 20 dangerous, incl. two cadence tables **already diverged in production**. |
| **T9** | **a11y** | L0-5 (11 files) · L1-8 · L5-7 (no font-scale cap on the three hero figures) | The guards cover 2 of 4 native-only props; the web suite is blind to state. |
| **T10** | **Dead code** | L0-4 (`ProgressRing`, `MilestonesRow`, 0 refs) · L3-5 · L4-11 · L6-4/5 | Delete-or-keep decisions. Shrinks the surface every future audit re-reads. |
| **T11** | **States & robustness** | L5-3/4/8/11/13/15/16 | Empty/large/tier states. L5-4: 600 unvirtualized rows for a mortgage. |
| **T12** | **First-run & polish** | L5-10/12/17..21 · L1-20..35 · L2 polish · L4-12..16 | L5-12 is the best single opportunity: the paywall never mentions the user's own money. |

## ▶ Recommended sequencing

**T1 → T2 → T3 → T4 → T5/T6/T7/T8 → T9/T10/T11 → T12.**

The order is not preference; three of the four steps are *prerequisites*:
- **T1 first** or every later count is measured through a narrowed instrument.
- **T2 next** because it is small, non-negotiable, and one item is live on a public URL now.
- **T4 before T5/T7/T8**, because the glossary decides the words those passes would otherwise edit twice.

⚠️ **Not everything here belongs in v1.7.** T12 is ~40 items of genuine polish, and the executive
"fold everything now" decision was taken against a much smaller ledger. My recommendation is that
**T1–T8 are v1.7 and T9–T11 are triaged item-by-item**, with T12 defaulting to the Phase-6 FINISH sweep
which already runs on the frozen app.

## Verification status

Every L3 and L4 finding was traced in source by its lens. L1 confirmed 9 files, L5 read 26, L6 read 15,
L2 read 20. The orchestrator independently re-verified: L1-1 (refuted), L2-2 (confirmed), L3-5 (mechanism
refuted), L4-1 (confirmed), L4-2 (confirmed), L6-2 (confirmed), L0-1..5 (scripted). **Anything not listed
in `L9-refutations.md` carries only its lens's own confidence rating.**
