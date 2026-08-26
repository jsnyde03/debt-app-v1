# S1 · MONEY — pass 3. **11 blockers · 9 majors · 14 minors.**

**Pinned:** `96d1f11`, branch `v1.7-dev`. Four fresh auditors ([D68]), brief at [`BRIEF.md`](BRIEF.md).
**No auditor edited a source file** — verified after the pass: `git diff 96d1f11 -- apps packages scripts`
is **empty**. Two auditors planted defects; both cleaned up, and D ran every plant in an **isolated git
worktree at the pin** so a plant could not manufacture a false finding for the three sharing the checkout.

⛔ **THIS FILE IS THE MAP. THE FOUR `{A,B,C,D}-*.md` FILES ARE THE LEDGER.** Every row below was counted
from the report files, not from an auditor's own summary — a prior round's summary said *"9 open"* where
its auditor files held **14**.

⛔ **S1 DOES NOT CONVERGE.** [D65] exits on 0/0 twice consecutively. Pass 3 returns 20 blocker+majors, and
**9 of them restart the count**. Pass 4 is the next first-candidate.

---

## ⭐ THE RESULT THAT MATTERS MOST IS NOT THE COUNT

⚡ **Three of the four auditors independently found a gate that reports green while doing less than it
claims — and one of the three was created by pass 2's own fix.**

| | the instrument | what it cannot see |
|---|---|---|
| **B1** | `lint:money` | Its two `Intl` patterns are **unsatisfiable**. `[^)]*\)` consumes through the formatter's own closing paren, so the pattern requires `style: 'currency'` **after** the call closes. Green over a tenth hand-rolled formatter *and* over two live ones today |
| **A3** | `test:gate-plants` → `lint:secrets` | The scenario plants an **untracked** file, so the modified-tracked half **added in this very fix range** stays green when un-fixed. Measured 2×2 with a control |
| **C-1** | the pass-2 trust table | The `'row-figures'` route has **zero production consumers** — 3 grep hits, all the declaration or its own test. The fix widened the rule's **fields** and never widened its **claim sites** |
| **D3-3** | `finding-guards.json` → `S1P2-B1-REASON` | The entry guarding **B-1's own fix** is green with that fix's defect restored: the token names the line that *computes* the check, not the line that *uses* it |
| **D3-4** | `lint:secrets` `REVERIFY4-2` | Still unpinned. The un-fix leaves `lint:secrets`, `lint:finding-guards` **and** `test:gate-plants` green, and the green sentence still says *"index+HEAD"* |

⛔ **This is the third consecutive pass in which an instrument was the finding**, and it is the exact class
the S0/S1 cluster was built to end. Pass 2's `B-1` (7 of 57 guards green over their own un-fix) is
**CLOSED, seven of seven, by plant** — and its own fix produced `D3-3`. ⚡ **The fix is the most likely
place for the next defect** held again, at the instrument layer.

---

## ⚡ AND THE SECOND SHAPE: ONE RULE, WIRED TO A SUBSET, THREE PASSES RUNNING

`B1`'s rule — *never state a number about money the app could not read* — has now been widened twice and is
**still incomplete in a third direction each time.**

| pass | what was widened | what was still missed |
|---|---|---|
| pass 1 → 2 | the **claim sites** inside the app | the **fields** — `currentAmount`, `minimumPayment`, `apr` |
| pass 2 → 3 | the **fields**, into a gated claim table | the table's **`'row-figures'` route has no callers** (`C-1`), and **three claim sites the table never reached still speak** (`C-3` `C-4` `C-5`) |
| **and the direction nobody had looked** | — | ⚡ **every claim site OUTSIDE the app.** The **Home Screen widget**, the **Lock Screen**, **Siri** and the **Live Activity** (`D3-1` `D3-2`) — the two loudest surfaces the product has |

---

## 🔴 BLOCKERS — 11

| # | finding | src |
|---|---|---|
| **A1** | **`cannotAmortize` re-checks against the SHRINKING active-minimum sum, not the constant budget the loop spends.** An ordinary car-loan-plus-credit-card plan reports *"Unable to estimate"* — Progress hero prints `—` — while the chart beneath it draws that same plan clearing in **30 months**. ⚡ The sibling `buildPayoffTrajectory.ts:91` already has the correct form: two producers of one fact, one directory, two guards. Measured three ways incl. app-level selectors | A-1 |
| **A2** | **`buildCycleSnapshot` sums the UNSCALED BNPL minimum** — History prints *"$100.00 paid"* for a cycle in which the plan asked for $200 and the balance fell $200 | A-2 |
| **A4** | **`bnplMonthlyEquivalentMinimum` is gated on `type === 'bnpl'` while every per-cycle seam is gated on `isInstallmentNative`** — a CSV-imported biweekly BNPL is charted at 6 months and paid down at 12 | A-4 |
| **B3** | **An `unknown` remote is let through the clobber guard, and the guard WRITES OVER IT** — another install's iCloud backup is destroyed, the sheet says *"Backed up"*, and the install then records its own clock as the file's identity so **every later backup is refused forever**. ⛔ The docblock states the opposite and is right about only one of the two ways `unknown` is produced. `npm run test:app` green with the defect present | B-3 |
| **C-1** | **The trust table's `'row-figures'` route has ZERO production consumers** — a restored backup prints *"Groceries · Counts toward reserve · $0"*, *"0% APR"* on a card charging 22%, and *"$0.00/mo"* on one demanding $150 | C-1 |
| **C-2** | **The SUM sites on the expense screens have no guard either** — a total missing an unknown addend is stated as a total, and one of them is a **recommendation** (*"of $55 recommended each paycheck"* against $1,400 of rent) | C-2 |
| **C-3** | **History's headline calls a DELETED debt money the user "paid down"** — *"$2,923 paid down"* in success green, while the same store says they paid $0 | C-3 |
| **C-4** | **The trophy shelf asks the OLD guard while the finale asks the new one** — a cleared debt whose `originalBalance` could not be read is filed as **"$0 paid off"**, and offered for sharing that way | C-4 |
| **C-5** | **The paywall states a personalised dollar fact with no trust guard** — it names a **$100** shortfall on a cycle that is **$500** short | C-5 |
| **D3-1** | **The Home-Screen and Lock-Screen widget says *"Debt-free · 100% · $0"*** over balances the app itself returns `debt-free-unverified` about. Measured on one store at one instant: `mayClaim(store,'debt-balances') === false` while the payload carries all three | D3-1 |
| **D3-2** | **Siri and the Live Activity say *"looks clear — $1,080 free to put toward debt"*** when the obligation netted out is one the app could not read | D3-2 |

## 🟠 MAJORS — 9

| # | finding | src |
|---|---|---|
| **A3** | `test:gate-plants`' `lint:secrets` scenario plants an **untracked** file, so the modified-tracked half added in this fix range stays green when un-fixed | A-3 |
| **B1** | **`lint:money`'s two `Intl` patterns cannot fire on any real call**, and it is green over two live hand-rolled formatters carrying `$NaN` / `$0.00`-clamp drift | B-1 |
| **B2** | **The RN add/edit-debt form is the ONLY APR path with no `0–100` bound** — `2599` → 2599% APR, **$10,829.17/mo** interest on a $5,000 card | B-2 |
| **B4** | **The web storage adapter reads unparseable bytes as "first launch"** instead of quarantining, and the sole e2e for that class seeds valid JSON | B-4 |
| **B7** | **The Sentry breadcrumb scrub redacts amounts and passes CREDITOR NAMES**, with its own test pinning that as correct | B-7 |
| **C-6** | A BNPL plan whose installment amount could not be read is listed as **one** upcoming payment instead of four, with no sign the list is short | C-6 |
| **C-7** | The *"Replace your data?"* confirm is **byte-identical** for an intact backup and one the reader has just recorded three losses on — **at both restore doors** (`C-7b`) | C-7 |
| **D3-3** | The registry entry guarding **B-1's own fix** is green with that fix's defect restored | D3-3 |
| **D3-4** | **`REVERIFY4-2` is still unpinned** — the un-fix leaves three gates green, and the green sentence still says *"index+HEAD"* | D3-4 |

**Minors — 14:** `A5` · `B5` `B6` · `C m1–m7` · `D3-5` `D3-6` `D3-7` `D3-8`.

---

## [D69] — which of these restart the count

⛔ **Exempt from the count is NOT exempt from the fix** ([D65] — no deferrals). Applied **mechanically**
from `scripts/surface-coverage.s1.json` / `.s0.json`, never from an auditor's judgement.

| | ⛔ **COUNTS** — 9 | first-look — 11 |
|---|---|---|
| **blockers** | `C-1` *(s1p2)* · `C-3` *(s1p2)* · `C-5` *(s1p2)* · `D3-1` *(s1p2)* | `A1` `A2` `A4` *(never)* · `B3` *(never)* · `C-2` `C-4` *(never)* · `D3-2` *(never)* |
| **majors** | `A3` *(s1p1,s1p2)* · `B1` *(p3)* · `B2` *(s1p1,s1p2)* · `D3-3` *(s1p1,s1p2)* · `D3-4` *(p4,s1p1,s1p2)* | `B4` `B7` *(never)* · `C-6` `C-7` *(never)* |

⚡ **Every one of the nine that COUNTS is against a file a prior pass had read** — and five of the nine are
the instruments. **The churn in this round is concentrated almost entirely in the gate layer**, which is
what the [D69] split exists to reveal and what a raw total hides.

⚠️ **11 of 20 are coverage results on ground admitted by S1.9.5's root widening.** The brief's one number
predicted the outcome for the **fourth** consecutive time: A's three blockers, B's blocker and D3-2 are all
in `packages/core/{debt,history}`, `storage/cloudBackup` and `liveActivity` — directories that were on no
surface at all until this round's widening.

---

## Coverage — what pass 3 actually swept

⛔ **Written back in the same step as this record.** `s1p3` did not exist as a token; registering it in
`SWEPT_CLAIMS` was part of the write, exactly as `s1p2` had to be.

```
npm run lint:s1-coverage    # 470 files · 331 unswept  ->  470 files · 121 unswept
```

| lane | routed | swept | **named as NOT reached** |
|---|---|---|---|
| A | 75 | 58 | 17 — every `packages/core` test file's **assertions**; all 30 are registered and pass, none was read |
| B | 81 | 58 | 23 — 18 of the 24 store test files, 3 part-read and not claimed, 2 unopened |
| C | 66 | 56 | 10 — 5 QA-affordance readouts, the Skia chart, 3 hooks, 1 test. ⛔ **Plus the biggest hole, which is in its part-read list**: `app/_layout.tsx`, 376 lines, the app's entire bootstrap, of which exactly one fact was established |
| D | 109 | **46** | **63** — 21 `components/ui`, 7 `theme`, 4 `motion`, 4 `keyCommands`, 27 e2e specs opened only for mechanical sweeps |

⚠️ **D's own reconciliation said 48/61 and the correct figures are 46/63.** `AppIcon{,.ios}` and
`DateField{,.web}` are **two files each**; the list was counted in tokens. ⚡ **The site-count-under-reports
rule, firing inside an auditor's own self-check** — which is why the write-back was computed from the
manifests and reconciled against each auditor's stated number rather than taken from it.

⚠️ **Eight files auditor C named as PART-read are claimed `partial`, not `s1p3`** — `partial` counts as
UNSWEPT, which is why the number lands at **121 and not 113**. ⛔ `app/_layout.tsx` was *grepped, not read*:
claiming it swept would have buried the pass's own biggest hole under a green token.

⛔ **NOT-reached is not clean, it is unread.** Pass 4's highest-value targets, in the auditors' own words:
`testDeriveRequiredActionView.ts` *(the function behind "You're caught up for this paycheck" — pass 2's
`C4` class)* · `expenseReserve.test.ts` *(48 assertions)* and `planSelectors.test.ts` · `app/_layout.tsx`.

---

## What ran at this pin

⚡ **The full RN e2e suite has never been executed by any prior pass. D ran it: 310 passed (8.3 min).**
`npm run test:app` all passed · `npm run lint:rn` all **28** gates pass · `test-gate-plants` 11/11 fail
closed · `lint:gate-freshness` **exit 1**, expected mid-audit per [D74].

⛔ **All eleven blockers survive that suite.** A's three, B's one and D's two were each reproduced live in
the same tree while `test:regression` and `test:app` were green. ⚠️ **`npm run … | tail` reports *tail's*
exit status** — D measured the gate's own, which is the trap this project has hit nine times.

⚠️ **There is no current gate record and this file does not claim one** ([D74]). The last full pass is
`818f934`; `96d1f11` moved source after it.
