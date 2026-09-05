# Class 4 — re-audit **2**

**Auditor:** fresh session (never wrote round 1's fixes). `[D79]` step **b**, round 2.
**Base:** `24a444cc` (round 1's brief) → **`68c348f9`** (head of `v1.7-dev`). Tree clean at start.
**Probes:** [`class4-reaudit2-probes/`](class4-reaudit2-probes/).

---

## The fix set, derived from the diff (not from the finding list)

`git diff --stat 24a444cc..HEAD -- apps packages scripts` — **9 files, +449/−38**, over 6 commits
(`e7f2fe79`, `86bf6536`, `8e670844`, `bf7274da`, `f7c53d3b`, `68c348f9`).

| file | Δ | what round 1 did |
|---|---|---|
| `packages/core/testing/testCadenceIdentity.ts` | +86 | **`F4`** — replaced a divisibility assertion with an exact expected count from a new hand-written walker `chargesInWindow`, and added a row-level assertion |
| `apps/rn/src/store/inWindowMinimum.test.ts` | +46/−4 | **`F2` blocker** — drove the projection off a `biweekly` pay cycle so every projected window is a constant 14 days; added a biweekly control |
| `apps/rn/src/store/debtFreeBand.test.ts` | +17/−2 | the 9th (unnamed) finding — pinned `nextPaycheckDate` so the window is a pair, not one end |
| `apps/rn/src/store/planSelectors.ts` | +32/−1 | **`F3`** — the paid-row re-add now uses `effectiveMinimumInWindow` (the 7th site) |
| `apps/rn/src/store/recoverySelectors.ts` | +23/−3 | **`F6`** — `scaleBnplMinimumForWindow` (singular) → `effectiveMinimumInWindow` |
| `apps/rn/src/store/guardianSelectors.ts` | +26/−3 | **`F7`** — `selectBnplBetweenPaycheck` gate widened `isInstallmentNative` → `hasKnownBnplCadence` |
| `packages/core/debt/deriveRequiredActionView.ts` | −13 | **`F8`** — a stale docblock deleted. **No code change.** |
| `scripts/finding-guards.json` | +242 | 10 new registry entries |
| `scripts/check-finding-guards.ts` | +2/−2 | — |

⚠️ **Two of the eight "fixes" changed no production behaviour** (`F8` is comment-only; `F4`/`F2`/the 9th
are instrument repairs). **Three changed user-facing money surfaces**: `planSelectors`,
`recoverySelectors`, `guardianSelectors`.

**Baseline, run clean before any plant:** `test:app` ✅ · `test:regression` ✅ · `test:scenarios` ✅ ·
`typecheck` ✅ · ⛔ **`lint:rn` FAILS — exit 1, see `R2-3`.**

---

## Findings

### `R2-1` — **blocker** · the widened Guardian heads-up states a total the user does not owe, by up to 250×

**Consequence.** On the Today screen, a nearly-paid-off weekly debt or a fallback BNPL is captioned
**"Heads up — 5 Car Loan payments (about $50 each) land before your next paycheck."** against a balance
of **$1**. The line's entire job is explaining an unexpected number honestly; it now states $250 of
outflow that the app itself reserves $1 for.

**`file:line`** — `apps/rn/src/store/guardianSelectors.ts:434` (the gate) and `:446` (the sentence).

**The measurement** — [`class4-reaudit2-probes/guardian-sentence.ts`](class4-reaudit2-probes/guardian-sentence.ts),
one $50 weekly charge, monthly payer, window `2026-08-03 → 2026-09-01`:

| shape | balance | app reserves | the line says |
|---|---|---|---|
| installment-native BNPL | $100 | $100 | "**2** Klarna payments (about $50 each)" ✅ |
| **fallback BNPL** | $100 | $100 | "**5** Afterpay payments (about $50 each)" — **$250** ✗ |
| **plain weekly debt** | $120 | $120 | "**5** Car Loan payments (about $50 each)" — **$250** ✗ |
| **plain weekly debt** | $60 | $60 | "**5** Car Loan payments (about $50 each)" — **$250** ✗ |
| **plain weekly debt** | $1 | $1 | "**5** Car Loan payments (about $50 each)" — **$250** ✗ |

⛔ **It is a REGRESSION, proven green-before / red-after.** The identical probe run against
`git show 24a444cc:apps/rn/src/store/guardianSelectors.ts` — restored byte-identically afterwards —
returns **`null` for all four shapes**, so **0 of 9** cases stated a false total before this round and
**4 of 9** do now.

⭐ **The contrast row is the proof of mechanism**: the installment-native BNPL with the *same* $100
balance says "2", correctly. Same money, two answers, and the difference is exactly the gate that moved.

**Mechanism (HYPOTHESIS — but the contrast row above measures it).** `isInstallmentNative` requires
`remainingPayments > 0`, and `bnplInstallmentsInWindow` caps its count at `remainingPayments`
(`bnplInstallment.ts:239-242` — an absent count is `Infinity`). The two shapes the widening admits carry
no `remainingPayments`, so the cap is `Infinity` and the count is uncapped by the balance. The reserve
this line explains — `effectiveMinimumInWindow` — **does** cap at the balance
(`bnplInstallment.ts:318-324`). The sentence multiplies `count × bnplInstallmentAmount` and applies no
cap at all, so it and the reserve diverge exactly when the plan is nearly paid off.

**Remedy (UNVERIFIED).** Do not revert — `F7`'s observation is sound (the widened *reserve* really was
unexplained for these two shapes). Derive the stated total from the **one producer** instead of
re-multiplying: cap the count at `Math.ceil(d.balance / bnplInstallmentAmount(d))`, or state the count
only when `effectiveMinimumInWindow(d, start, end)` divides exactly by the per-charge amount — which is
the rule `deriveRequiredActionView` already applies to this same shape, and cites for this same reason.

---

### `R2-2` — **major** · round 1's three PRODUCTION fixes shipped with **no guard**, and `lint:finding-guards` prints a green line over them

**Consequence.** `[D67]` — *"a closed finding needs a standing guard, or it is not closed"* — is
unsatisfied for exactly the three changes that touched user-facing money. `F3`, `F6` and `F7` can each be
reverted without any suite reddening.

**`file:line`** — `scripts/finding-guards.json` (10 new entries, none of them for `F1`–`F8`);
`apps/rn/src/store/planSelectors.test.ts:35` (the fixture); `apps/rn/src/store/recoverySelectors.test.ts:37`.

**The measurement — all three reverted at once, and every suite stayed green.** Planted in byte mode,
each anchor verified unique and each replacement verified applied, all three restored **byte-identical to
`HEAD`** afterwards (30,177 / 4,056 / 55,323 bytes):

| plant | |
|---|---|
| `F3` | `planSelectors.ts` → `amount: d.minimumPayment` |
| `F6` | `recoverySelectors.ts` → `Math.min(d.minimumPayment, d.balance)` |
| `F7` | `guardianSelectors.ts` → `!isInstallmentNative(d)` |

```
test:app          EXIT 0
test:regression   EXIT 0
test:scenarios    EXIT 0
typecheck:rn      EXIT 0
```

⛔ **Round 1's entire production diff can be reverted in one commit and nothing in the repo notices.**

Diffing the registry `24a444cc..HEAD` gives **exactly 10 new ids**, and every one of
them is named for a **class-4 original** (`S1-CLASS4-A2-1`, `-A2-2`, `-A2-3`, `-A2-4`, `-A2-8`, `-A3-1`,
`-A3-2`, `-A3-4`, `-A3-12`, `-A3-14`). Searching the whole registry for the three production files round 1
edited returns **zero entries**:

```
guardianSelectors.ts   0 class-4 entries
recoverySelectors.ts   0 class-4 entries
planSelectors.ts       0 class-4 entries
```

And the two test files that own those selectors cannot see the fixes either:

- **`F3`** — `planSelectors.test.ts` contains **no assertion on a row's amount at all** (`grep amount`
  returns only `paycheck.amount: '2000'`), and its only debt fixture is `recurrence: 'monthly'`, for which
  `effectiveMinimumInWindow` returns the raw `minimumPayment`. **The fix is a no-op on the one fixture
  that reaches the line it changed.** `F3`'s stated defect — the figure falling from $200 to $50 on the
  tap — needs a sub-cycle cadence to exist, and no fixture has one.
- **`F6`** — every debt in `recoverySelectors.test.ts` is `recurrence: 'monthly'` with no
  `scheduledPaymentAmount`, which is precisely the shape where the old call and the new one agree.

⭐ `F5` — round 1's own finding — was *"one guard registered for eleven findings, and
`lint:finding-guards`' green line cannot see the other ten."* **The repair registered the eleven and then
left round 1's own eight in the state `F5` describes.**

**Mechanism (HYPOTHESIS).** The registry was filled from the *audited* finding list (`A2-*`/`A3-*`), which
is the list `F5` was about. Round 1's own findings were never a population anyone enumerated — the same
shape as `F5`, one level up.

**Remedy (UNVERIFIED).** Give `F3`, `F6` and `F7` fixtures with a sub-cycle cadence and a balance below
one installment (`F7` needs the latter — see `R2-1`), assert the amount, then register one entry each.

---

### `R2-3` — **major** · `lint:finding-guards` is **RED at `HEAD`**, and round 1's own `F8` commit is what pushed it over

**Consequence.** A gate in `lint:rn`'s 52 is failing on the tree the round closed on. Per this repo's own
rule, a permanently-red gate trains everyone to stop reading it.

**`file:line`** — `scripts/finding-guards.json` (the `proof.sha` stamps); the ceiling in
`scripts/check-finding-guards.ts`.

**The measurement.** `npm run lint:finding-guards` on a clean `68c348f9`:

```
❌ finding-guards: 1 problem(s).
  • 9 executed proof(s) were measured against a tree their target has since left, and the ceiling is 8.
```

Two of the nine are round 1's own, recorded four commits earlier:

```
stale: S1-CLASS4-A2-8 — packages/core/debt/deriveRequiredActionView.ts has moved since 86bf6536
stale: S1-CLASS4-A2-3 — packages/core/debt/deriveRequiredActionView.ts has moved since 86bf6536
```

⛔ **What moved that file is round 1's own `F8`** — commit `bf7274da`, whose entire change to
`deriveRequiredActionView.ts` is the **deletion of a 13-line docblock. No code.** A comment-only edit
invalidated two proofs recorded two commits earlier and took the stale count from 7 to 9 against a
ceiling of 8. Commit `f7c53d3b` ("Proof ledger: the five stale re-proofs recorded") came **after**
`bf7274da` and re-recorded five *other* entries without re-recording these two.

⚠️ **This was not in my own first baseline, and that is its own lesson.** I ran
`npm run test:regression | tail -12 && echo … && npm run lint:rn | tail -25` — **a pipe, so the exit code
reported was `tail`'s, not the gate's.** The compound returned 0 and I recorded `lint:rn` green. Re-run
without a pipe, capturing `$?` directly, it is not.

**Mechanism (HYPOTHESIS).** `proof.sha` pins a proof to the tree its *target file* had at the moment of
recording, and staleness is computed from whether the file has moved — **not from whether anything
semantic in it moved.** A pure-comment deletion is indistinguishable from a behavioural change to that
check, so a docs-only fix can red a proof gate.

**Remedy (UNVERIFIED).** Re-run the two: `npm run prove:guards -- --id=S1-CLASS4-A2-3,S1-CLASS4-A2-8`.
⚠️ Run them **solo**, not batched — `prove-guards.ts:169-180` records a measured case where the same guard
read `WRONG` solo and `MATCHED` batched. Separately worth considering whether `proof.sha` should pin a
content hash that ignores comment-only movement, since `F8`-shaped fixes will keep doing this.

---

### `R2-4` — **minor** · the cumulative scope is **114**, not 113

**The measurement.** Counting ids out of the class-1 round files:

| population | file | n |
|---|---|---|
| class 1's own | `CLASSIFICATION.md` class table | 11 |
| `R1`–`R15` | `CLASS1-REAUDIT.md` | 15 |
| `N-1`–`N-11` | `CLASS1-REAUDIT-2.md` | 11 |
| `T1`–`T14` | `CLASS1-REAUDIT-3.md` | 14 |
| `U1`–`U16` | `CLASS1-REAUDIT-4.md` | 16 |
| `V1`–`V12` | `CLASS1-REAUDIT-5.md` | 12 |
| `W1`–`W15` | `CLASS1-REAUDIT-6.md` | 15 |
| `W9b` | ⚠️ **`DEBT_ELEVATION_LOG.md:31842` only** — absent from this directory | 1 |
| | **class 1 total** | **95** |

95 + class 4's 11 + round 1's `F1`–`F8` = **114**. This brief says *"class 1 (94, incl `W9b`)… = 113"*,
which is **the exact off-by-one `F1` corrected last round** (`F1`: *"the cumulative count is 106, not
105"* — i.e. 95 + 11, not 94 + 11). ⛔ **The correction did not survive into the next brief**, so the same
id is missing twice in a row. ⚠️ And `F1`'s own text labels that leading 11 *"class 4's 11"* where the
arithmetic requires it to be **class 1's** — 11 + 15 + 11 + 14 + 16 + 12 + 16 = 95, and only
95 + 11 = 106.

---

### `R2-5` — **major** · the `type === 'bnpl'` gate that `A3-1` and `A2-3` removed still stands at two PROJECTION sites, and the app reserves money it then projects as unpaid

**Consequence.** A plain **weekly** debt and a **weekly BNPL** with the identical $50 per-charge amount
are projected 12 months out at **$4,450** and **$2,616.63** — **$1,833 apart**, decided by a `type` field
that this repo has twice ruled irrelevant to cadence. The app **reserves $250 a cycle for both**
(that is what pass-6 `A3-1` fixed) and then amortises the plain one as if it paid $50.

**`file:line`**
- `apps/rn/src/store/analysisSelectors.ts:181` — `selectDebtAmortization`, read by
  `components/entities/AmortizationView.tsx:46` (the per-debt payoff schedule).
- `packages/core/debt/projectCurrentBalance.ts:74` — read by `store/balanceSelectors.ts:52`
  (**the balance a premium user is shown**) and `:22` (`projectDebtsToDate`, which rewrites the whole
  store's debt list before the engine runs on it).

Both spell the same expression:
`debt.type === 'bnpl' ? bnplMonthlyEquivalentMinimum(debt, cyclesPerMonth) : debt.minimumPayment`.

**The measurement** — [`class4-reaudit2-probes/cadence-gate-projection.ts`](class4-reaudit2-probes/cadence-gate-projection.ts),
$50 per charge, $5,000 balance, 0% APR, monthly payer:

| debt | amortises at | cadence-true | reserve, one monthly window | balance after 12 mo |
|---|---|---|---|---|
| **plain · weekly** | **$50/mo** | $216.67/mo | $250 | **$4,450** |
| **plain · biweekly** | **$50/mo** | $108.33/mo | $150 | **$4,450** |
| plain · monthly *(control)* | $50/mo | $50/mo | $50 | $4,450 |
| **BNPL · weekly** *(control)* | $216.67/mo | $216.67/mo | $250 | **$2,616.63** |

⭐ The two control rows are the proof: the monthly plain debt is unaffected (so the axis is **cadence**,
not type), and the weekly BNPL — same cadence, same per-charge figure — is projected 1.7× lower.

**Mechanism (HYPOTHESIS).** `bnplMonthlyEquivalentMinimum` is purely cadence-driven — it reads
`debt.type` only for the one-time lump (`bnplPayoffPace.ts:64-70`), so the gate at the *call site* is the
only thing holding a plain debt on a 1× monthly figure. `hasKnownBnplCadence`'s own docblock names this
exact divergence as the reason the gate was removed from the reserve: *"reserved and paid down at
$100/cycle while the chart and the debt-free date rated it at $216.67/month — one debt, two screens, 2×
apart."* The reserve moved; **the chart did not**, so the sentence is now true in the other direction.

⚠️ **Scope, stated honestly.** These two sites are not in round 1's diff — this is not a regression. They
are in cumulative scope because `A2-3`/`A2-8` are recorded closed with the remedy *"the `type` gate is
gone,"* and `A3-1`'s stated rule is *"a cadence is a fact about the SCHEDULE, not about the debt's
label."* Both statements are false at these two sites. The class's enumeration was short at five sites,
then six, then seven (`F3`) — **this is eight and nine.**

**Remedy (UNVERIFIED).** Drop the `debt.type === 'bnpl'` conditional at both sites and call
`bnplMonthlyEquivalentMinimum(debt, cyclesPerMonth)` unconditionally, which is already correct for a
monthly debt (factor 1) and for an absent recurrence (`?? 'monthly'`). ⚠️ The `apr` ternary beside it is a
**different** rule (BNPL carries no interest) and must not move with it.

---

### `R2-6` — **major** · three of the ten new registry entries are proven by a red on an assertion that is not the one registered as their guard — and `A3-1`'s registered assertion is **green under its own plant**

**Consequence.** `F5` closed *"one guard registered for eleven findings, and `lint:finding-guards`' green
line cannot see the other ten."* The repair registered eleven entries. **Four of them share one plant and
one red**, and for three the red lands on a different assertion than the one their entry names.

**`file:line`** — `scripts/finding-guards.json`, entries `S1-CLASS4-A3-1`, `-A3-2`, `-A2-4`.

**The measurement.** Their shared `proof.unfix` (re-scaling `store.debts` at
`apps/rn/src/store/selectors.ts`) applied verbatim from the registry, `npm run test:app`:

```
❌ FAIL [fallback BNPL · weekly — reserves 4 × $50 = $200, not a multiple of it (got $800)]
```

One assertion reds. Against what each entry registers as **its** guard:

| entry | its registered `token` | reached by the plant? |
|---|---|---|
| `A2-1` | `not a multiple of it (got` | ✅ **this is the assertion that redded** |
| `A3-1` | `no phantom shortfall on a paycheck that covers it` | ❌ never reached — and see below |
| `A3-2` | `— the allocation resolves` | ❌ passes; asserts only `alloc !== null` |
| `A2-4` | `History reports the money the rollover actually deducted (S1P3-A2)` | ❌ lives in `packages/core/testing/testPayCycleHistoryRegression.ts`, **a file `test:app` does not run** |

⛔ **`A3-1`'s registered assertion is not merely unreached — it is GREEN with `A3-1`'s own defect
planted.** Measured directly against `selectAllocation` on the same fixture while the plant was live:

```
totalRequired = $800   shortfall = $0
```

The fixture pays **$3,000** against an inflated reserve of **$800**, so *"no phantom shortfall on a
paycheck that covers it"* is satisfied by construction. `A3-1`'s finding is *"the same seam measured to
the printed shortfall on four surfaces"* — and the guard registered for it **cannot print a shortfall**.

**Mechanism (HYPOTHESIS).** The two checks are disjoint by design and nothing joins them.
`lint:finding-guards` proves the `token` string exists in the named `file`; `prove:guards` proves the
plant reds and that the *run's output* contains `expect`. `expect` is matched against the whole run, so a
neighbour's assertion satisfies it — `A3-2` and `A2-4` both use `expect: "reserves"`, which is a substring
of `A2-1`'s label. **Nothing anywhere asserts that the line which redded is the line the `token` names.**
`A3-12`'s `expect: "debt matrix"` has the same looseness — it matches all three debt-matrix assertions —
though I planted its un-fix and confirmed the red does land on its own token
(`the ROW reserves $50 where totalRequired says $100`), so that one is sound in fact if not by
construction.

**Remedy (UNVERIFIED).** Make `expect` default to the entry's own `token` rather than a free string, so
the two checks are the same string by construction; where a finding genuinely has no assertion of its own,
say so in `proofNote` instead of borrowing a neighbour's. `A3-1` additionally needs a fixture whose
paycheck does **not** cover the inflated reserve, or its assertion is untestable.

---

## Measured, and found NOT to be a defect

### ⭐ `chargesInWindow` is a CORRECT oracle inside the space the matrix asserts

The brief's largest worry: *"if it is wrong, the matrix agrees with it and reports green."*

[`class4-reaudit2-probes/oracle-vs-producer.ts`](class4-reaudit2-probes/oracle-vs-producer.ts) counts the
same fact **three** ways — **A** the test's walker (copied verbatim), **B** the producer
`bnplInstallmentsInWindow`, **C** a brute-force day enumeration written from the cadence definition
sharing no helper with either.

**All 28 matrix pairs agree A = B = C**, including the boundaries the brief named: `one-time`,
`per-paycheck`, and `quarterly`/`annually` in a ≤29-day window (all 1), `weekly` at 1/2/2/5, `biweekly`
at 1/1/1/3. The half-open boundary is right in both: a charge on `start` counts, one on `end` does not.
The month-overflow bug it once shipped is genuinely gone — `addMonthsISO` with a fixed `anchorDay`.

### ⭐ `F4`'s repaired assertion can fail, and the pre-repair one could not — measured both ways

Plant: `2 *` on the reserve at `packages/core/engine/allocatePaycheck.ts:394` (byte mode; restored and
verified **byte-identical to HEAD**, 38,707 bytes). It touches only the debt path, so no earlier
assertion in the file fires first.

- **current file → RED**, at `testCadenceIdentity.ts:245`, the assertion that names the defect:
  `FAIL [⭐ debt matrix · debt · one-time × weekly]: reserved $100, expected $50`.
- **`git show 24a444cc:` version of the same file, same plant → GREEN** ("✅ Cadence identity tests
  passed"), because `100 % 50 === 0`.

That is the green-before / red-after the brief requires for an instrument-repair finding. `F4` is closed.

### ⭐ `F2` and the 9th finding hold against a long clock walk

⛔ **My first walk harness was broken and the control is what caught it.** `` import(`mod?cw=${i}`) ``
does **not** bust the module cache under tsx: the module evaluated **once** and the walk reported
*"0 RED, green on every sampled day"* over 365 days — **for the pre-fix file the fixer measured red on
288 of them.** A harness that agrees with a fix on a file containing no fix. Rewritten to copy the
module to a fresh filename per day.

| file | walk | result |
|---|---|---|
| **control** — `git show 24a444cc:inWindowMinimum.test.ts` | 60 days | **48 RED (80%)** — matches the fixer's 288/365. Cycle-1 `essentials` measured at $150 / $100 / $50 / $0 against $200 |
| `inWindowMinimum.test.ts` (current) | **400 days** | 0 RED |
| `debtFreeBand.test.ts` (current) | **800 days** | 0 RED |

The `biweekly` claim checks out structurally too: `getNextPaycheckDate` steps `biweekly` by exactly
`+14` days from any date (`getNextPaycheckDate.ts:41-45`), and `buildMultiCycleTimeline` derives each
projected window from the previous one, so every window is 14 days. And `debtFreeBand.test.ts`'s `over`
parameter never overrides `currentDate` / `nextPaycheckDate` / `payCycle` — only `incomeVaries` and
`leanAmount` — so the new pin holds for all three of its assertion blocks.

### The `F2` class swept across the rest of the app-layer suite

The fuse is *"one end of the window pinned, the other left to `createDefaultStore()`, which reads the
clock."* Of the 31 app-layer tests using `createDefaultStore`, only **5** name `currentDate` without
`nextPaycheckDate`, and **4 of those take `currentDate` from `createDefaultStore()` itself** — both ends
clock-derived, so the window is constant. The 5th, `celebrationSelectors.test.ts:23`, has the exact
shape (`currentDate: '2026-09-01'` literal, `nextPaycheckDate` unpinned) — but a **1,200-day** clock walk
is **0 RED**: none of its assertions read the window. Recorded, not a finding.

### `bnplInstallmentsInWindow`'s month step is un-anchored — real, but NOT reachable

`bnplInstallmentsInWindow` calls `advanceDueDateOnce(due, recurrence)` with **no `anchorDay`**
(`bnplInstallment.ts:278` and `:287`), so `addMonthsISO` anchors on the *running* date: a Jan-31 plan
walks Jan 31 → Feb 28 → **Mar 28** and sticks on the 28th permanently. That is precisely what
`addMonths.ts:17-19` says `anchorDay` exists to prevent, and the rollover path
(`rolloverPayCycle.ts:70`) *does* pass one — two walkers over one due-date sequence, one anchored.

Measured over 1,540 (recurrence × window) combinations: **34 latent disagreements**, all
`monthly`/`quarterly` with a month-end anchor over windows of 60 days or more (e.g. `2026-01-31`, one
year: the producer counts **13**, the oracle and the brute force both count **12** — ⚠️ **the test's
oracle is the more correct of the two**).

⚠️ **My first reachability probe over-claimed and I am recording that.**
[`arrears-drift.ts`](class4-reaudit2-probes/arrears-drift.ts) used *synthetic* 28–31-day windows and
reported **122 mismatches in 35,040 cases**, in both directions ($100 reserved where $200 was due, and
$200 where $100 was). But those window pairs are not ones the app can produce.
[`arrears-drift-real.ts`](class4-reaudit2-probes/arrears-drift-real.ts) re-ran it with every window
built by `getNextPaycheckDate` itself — 730 consecutive start days × 8 month-end arrears due dates ×
{monthly, quarterly} × 4 pay cycles = **46,720 cases, 0 mismatches.** A real pay-cycle window is short
enough that the drifted and the anchored sequences each hold exactly one occurrence.

**So: mechanism confirmed, consequence not reproduced.** Latent, worth a comment, not a finding.


### `testGuardianPartition`'s fixtures are fully pinned, and its `charges` are right

Not in this round's diff (last moved by `3df5614b`), so it is here on cumulative scope. Every date is a
literal (`currentDate: "2026-06-01"`, `nextPaycheckDate: "2026-07-01"`, `dueDate: "2026-06-02"`) — no
clock dependency at all — and its three hand-written counts check out by enumeration: weekly = Jun 2, 9,
16, 23, 30 = **5**; biweekly = Jun 2, 16, 30 = **3**; monthly = Jun 2 = **1**. Round 1 confirmed this and
it still holds.

### `F6`'s divergence is real but its shape is near-unreachable

`scaleBnplMinimumForWindow` and `effectiveMinimumInWindow` differ **only** when
`scheduledPaymentAmount ≠ minimumPayment` at `n ≤ 1` — and `normalizeBnplInstallment` sets
`minimumPayment := scheduledPaymentAmount` at every write seam (`bnplInstallment.ts:87`), so the shape is
eliminated by the normalizer on any ordinary write. For every other input the two agree, including `n = 0`
(both yield the stored minimum). The change is right on principle — one producer — but `F6`'s `minor`
grading was, if anything, generous.

---

## ⛔ Three of my own probes were wrong before they were right — recorded, because that is the pattern

1. **The clock-walk harness agreed with a fix on a file that had no fix in it.** `` import(`mod?cw=${i}`) ``
   does not bust the module cache under tsx. 365 days, 0 red, on the file the fixer measured red on 288.
   Caught only by running the control.
2. **`arrears-drift.ts` reported 122 reachable mismatches and they were not reachable.** It built windows
   by adding 28–31 days to a start date; re-run with every window produced by `getNextPaycheckDate`
   itself, **46,720 cases, 0 mismatches**. The mechanism was real and the consequence was mine.
3. **Three of `lint:rn`'s six red gates were red because of my own probe files.** `__clockwalk.ts` sat in
   `apps/rn/src/testing/` and contains `new Date().toISOString().slice(0, 10)` — the exact pattern
   `lint:local-dates` bans — and both it and `__prefix_inWindowMinimum.test.ts` were UNCLASSIFIED on the
   S0/S1 coverage tables. Removed, and re-run individually: `lint:local-dates` **exit 0**,
   `lint:s0-coverage` **exit 0**, `lint:s1-coverage` **exit 0**, `lint:finding-guards` **exit 1**.
   ⚠️ **Only report the fourth as a finding**; the other three were self-inflicted. The remaining two
   (`test:gate-plants`, `test:wrap-escapes`) both fail with `FAULT-BASELINE-ALREADY-RED` **downstream of
   `lint:finding-guards`** — so **one genuinely red gate reds three of the 52.**

---

## Summary

| id | severity | |
|---|---|---|
| `R2-1` | **blocker** | the widened Guardian heads-up states $250 against a $1 balance — a regression, proven green-before / red-after |
| `R2-2` | **major** | round 1's three production fixes revert cleanly with `test:app`, `test:regression`, `test:scenarios` and `typecheck` all green |
| `R2-3` | **major** | `lint:finding-guards` is red at `HEAD`, pushed over by round 1's own comment-only `F8` commit |
| `R2-5` | **major** | the `type === 'bnpl'` gate survives at two projection sites; a plain weekly debt projects $1,833 off |
| `R2-6` | **major** | three of ten new registry entries red on a neighbour's assertion; `A3-1`'s own is green under its own plant |
| `R2-4` | minor | the cumulative scope is 114, not 113 — `F1`'s correction did not survive into this brief |

**Closed, and proven closed:** `F2` (400-day walk), `F4` (green-before / red-after), `F8`, the 9th
(800-day walk).
**Closed in the code, unproven by any instrument:** `F3`, `F6`, `F7` — see `R2-2`.
**`F5` is closed for the eleven it named and open for the shape it described** — see `R2-6`.

**Tree left clean:** only this file and `class4-reaudit2-probes/`. Every plant restored **byte-identical
to `HEAD`** and verified by comparing bytes against `git show HEAD:<file>`, never `git diff`. No
`*.plant-backup` / `*.plant-owner` / `*.plant-hash` sidecars remain.

⚠️ **`git checkout -- scripts/finding-guards.json` is safe here and the brief's warning is one version
stale**: `core.autocrlf=true`, and the clean working form is uniformly CRLF (388,531 bytes, 3,951 CRLF, 0
bare LF). Writing the HEAD *blob* (LF, 384,580 bytes) is what makes it dirty. ⚠️ **`prove:guards` still
writes to the registry by default** — pass `--no-record` for a read-only run; my one recording run was
reverted.
