# Class 4 re-audit — `[D79]` step b

**Auditor:** fresh session, 2026-09-05. **Range:** `bc336cfd..24a444cc` on `v1.7-dev`.
**Status: COMPLETE.** 8 findings — **1 blocker · 3 major · 4 minor**. The verdict table is at the end.
⛔ **The blocker is `F2`: `npm run test:app` goes red on 2026-09-10, five days after this class closed,
with no code change — and it is class 4's OWN new guard that reds.**

## Fix set, derived from the DIFF (not the finding list)

12 commits. 15 source/script files touched:

| file | +/- |
|---|---|
| `apps/rn/src/store/inWindowMinimum.test.ts` | +192 (new) |
| `apps/rn/src/store/selectors.ts` | 30 |
| `apps/rn/src/testing/runAppTests.ts` | +5 |
| `packages/core/debt/bnplInstallment.ts` | 33 |
| `packages/core/debt/deriveRequiredActionView.ts` | 20 |
| `packages/core/debt/testBnplInstallment.ts` | 19 |
| `packages/core/debt/testDeriveRequiredActionView.ts` | 24 |
| `packages/core/engine/allocatePaycheck.ts` | 28 |
| `packages/core/guardian/testGuardianPartition.ts` | +61 |
| `packages/core/testing/testCadenceIdentity.ts` | 46 |
| `packages/core/testing/testPayCycleHistoryRegression.ts` | 41 |
| `packages/core/timeline/buildMultiCycleTimeline.ts` | 21 |
| `scripts/check-finding-guards.ts` | 2 |
| `scripts/finding-guards.json` | 61 |
| `scripts/surface-coverage.s1.json` | 3 |



---

## Membership, re-derived three ways

**Class 4's own 11 — all three derivations AGREE.**

| derivation | result |
|---|---|
| `CLASSIFICATION.md:193` §CLASS 4 table | `A2-1` `A3-1` `A3-4` `A2-2` `A2-8` `A3-2` `A3-14` `A3-12` `A3-7` `A2-3` `A2-4` — 11 |
| `A2-findings.md` + `A3-findings.md` headings, read for subject | same 11. The only near-misses (`A3-5`, `A3-6`, `A3-15`) are routed to CLASS 7 and correctly so — they are bill/rollover cadence, not the double-scaling |
| commit messages `bc336cfd..HEAD` | all 11 ids appear. `A3-7` is in `3df5614b` and `585f1866` — **the brief's claim that it "appears in no commit message in the range" was true when written and is now false**; `.4.9` fixed it |

Severities in the class table: 3 blocker (`A2-1` `A3-1` `A3-4`) / 6 major / 2 minor = 11. Heading agrees.
`A3-7` is `major` in the class table; checked against `A3-findings.md:297` — also `major`. (The brief's
warning that the log's ledger calls it `minor` is recorded below as **F5**.)

**Cumulative scope — the brief's 105 does not reconcile. See finding `F1`.**

---

## Baseline (clean, before any plant)

`npm run typecheck` 0 · `npm run test:app` PASS · `npm run test:regression` PASS · `npm run lint:rn` exit 0 (52 gates).

---

# Findings

## `F2` — `blocker` · class 4's own new guard **reds on 288 of 365 calendar days**, and today is one of the 77 that pass

**consequence** · `apps/rn/src/store/inWindowMinimum.test.ts:172-181`. The instrument this class installed
to keep the seam from being re-introduced — *"Re-introduce a pre-scaling seam and that test reds by name"*
(`bnplInstallment.ts:216`) — **fails for a reason that has nothing to do with the seam, four days out of
five.** It is wired into `test:app` (`runAppTests.ts:105`), which `validate:release:rn` runs
(`package.json:87`) and which CI runs directly (`.github/workflows/web-e2e.yml:103`) — **all three are red
on 79% of dates.** The class was closed on a green run taken on one of the 21% of days it passes.

**the measurement** ·
`class4-reaudit-probes/p2-run-test-at-date.ts` + `fakeclock.mjs` run the **real suite**, unmodified, with
`new Date()` pinned. Nothing else changed:

```
FAKE_TODAY=2026-09-05  → in-window minimum: all rows ✓            (today; matches the clean baseline)
FAKE_TODAY=2026-06-20  → ❌ FAIL [installment-native BNPL · projected cycle 1 —
                             essentials are the in-window $200 … (got $100)]
FAKE_TODAY=2026-01-01  → an EARLIER app test reds first (see F3), masking this one
```

`class4-reaudit-probes/p1b-fail-calendar.ts` walks 365 consecutive start dates through
`allocatePaycheck` + `buildMultiCycleTimeline` with the fixture the test builds:

```
RED on 288 of 365 calendar days (79%)
first failing assertion, tallied:   288  proj c1 <every shape>
CONTROL — today 2026-09-05: totalRequired 200 · c0 200 · c1 200   (agrees with the green suite)
```

The observed cycle-1 `essentials`: **$0, $50, $100, $150, $250** as well as the asserted $200.

**mechanism (HYPOTHESIS — but this half is measured, not inferred)** · `day(0)`/`day(28)`/`day(3)` fix
**cycle 0**'s window at exactly 28 days, which is why the nine `totalRequired` rows and the monthly control
are genuinely date-stable (0 failures in 365 days — verified). **Cycle 1's window is not 28 days and never
was.** `buildForecastCycles` passes `payCycleConfig.monthlyPayDay`, which `createDefaultStore()` sets to
`'1'`; `buildMultiCycleTimeline:212` then computes `projNextDate = getNextPaycheckDate({payCycle:'monthly',
currentDate: day(28), monthlyPayDay: 1})` — **the 1st of the month after `today+28`**. That window runs
**1 to 31 days** depending only on where `today+28` lands in the month, so a weekly debt charges 0–5 times:

```
today 2026-01-01 → c1 window 2026-01-29 .. 2026-02-01  (3 days)  → essentials $0
today 2026-01-08 → c1 window 2026-02-05 .. 2026-03-01  (24 days) → essentials $150
today 2026-09-05 → c1 window                            (28 days) → essentials $200 ✓
```

⚠️ **The $0 case is worse than a scale error**: `rolloverDebts` advances the due date past `NEXT`, the next
weekly occurrence lands *on* `projNextDate`, `isDueBeforeNextPaycheck` is false, and the debt leaves
`upcomingMinimums` entirely. The assertion's own message would then read *"essentials are the in-window
$200 … (got $0)"* — which looks exactly like a **deleted** scaling, i.e. the guard's red does not name its
own defect. That is the same trap `[D79]`'s method section warns about, arriving from the other side.

**remedy (UNVERIFIED)** · the fixture must pin the projected cycle's window the way it pins cycle 0's.
Either set `paycheck.monthlyPayDay` so the projected payday is `day(56)`, or assert cycle 1 against a
window length **derived** from `getNextPaycheckDate` rather than the literal `CHARGES.weekly`. ⛔ Do not
"fix" it by dropping the cycle-1 rows — they are the only coverage `A3-4`'s third site has.

⚠️ **The brief's lead was directionally right and wrong about the size.** It asked *"what does it do on the
29th–31st of a month, across a DST boundary, or when `day(28)` crosses a year?"* Measured: the **year
boundary and DST are non-issues** (`setDate` + local Y/M/D read are exact), and the failing set is not an
edge — it is the majority. The clock-derived cycle-0 fixture is sound; it is the *projected* cycle that was
never date-pinned at all.

### F2, corrected and sharpened after measuring FORWARD

`p1b` originally walked 2026-01-01 onward; a calendar in the past is not a risk. Re-run **from today**:
identical — **RED on 288 of the next 365 days**. Verified against the real suite:

```
FAKE_TODAY=2026-09-06  ALL PASSED
FAKE_TODAY=2026-09-08  ALL PASSED
FAKE_TODAY=2026-09-10  FAIL [installment-native BNPL · projected cycle 1 — … (got $150)]
FAKE_TODAY=2026-09-17  FAIL [installment-native BNPL · projected cycle 1 — … (got $100)]
```

⛔ **`npm run test:app` goes red on 2026-09-10 — five days after the class was closed** — and stays red
for 288 of the next 365 days, with no code change.

⭐ **The probe is validated against the suite, value for value.** `p1b` predicted cycle-1 `essentials` of
**$150** on 2026-09-10 and **$100** on 2026-09-17; the real suite reported `got $150` and `got $100` on
those dates. The 288 is therefore a measurement of the suite, not a model of it.

⛔ **And it voids `A3-4`'s proof, which is the second half of this.** `A3-4`'s plant (P-C below) reds on
the assertion `projected cycle 1`. On any of the 288 red days that assertion is **already red for F2's
reason**, so re-proving `A3-4` after 2026-09-09 returns a red that names the wrong defect — exactly the
`reason=WRONG` shape the brief's method section describes, arriving through the calendar instead of
through an added assertion.

---

## The plants — what is closed, measured

Every run below was taken from a **verified-clean** tree (`git status --porcelain` empty before and
after; restore is `shutil.copyfile` from a backup held **outside the repo**, then byte-compared).
Plant helper: `class4-reaudit-probes/plant.py`. **Both directions were planted**, per `[D79]`.

| # | plant (direction) | file | result |
|---|---|---|---|
| **P-A** | `minimumDueInWindow(debt)` → `debt.minimumPayment` — **`A3-7` un-fixed** *(deleted)* | `allocatePaycheck.ts:572` | ✅ `testGuardianPartition` → `FAIL [⛔ A3-7 · weekly — the buckets reconcile …]: expected $500, got $700` |
| **P-B** | `debts: store.debts` → `scaleBnplMinimumsForWindow(…)` — **`A2-1`/`A3-1` re-introduced** *(doubled)* | `selectors.ts:85` | ✅ `inWindowMinimum.test.ts` → `FAIL [fallback BNPL · weekly — reserves 4 × $50 = $200 … (got $800)]` |
| **P-C** | `debts: projDebts` → `scaledProjDebts` — **`A3-4`'s third site un-fixed** *(doubled)* | `buildMultiCycleTimeline.ts:250` | ✅ `inWindowMinimum.test.ts` → `FAIL [fallback BNPL · projected cycle 1 … (got $800)]` |
| **P-D** | the `type === "bnpl"` gate restored — **`A2-3`/`A2-8` un-fixed** | `deriveRequiredActionView.ts:129` | ✅ `testDeriveRequiredActionView` → `FAIL [a PLAIN debt's multiplied row explains itself as 4 × $100 (got undefined)]` |
| **P-E** | `if (false && hasKnownBnplCadence…)` — **the scaling DELETED at its one producer** *(deleted)* | `bnplInstallment.ts:316` | ✅ `testGuardianPartition` → `expected $250, got $50` · `testBnplInstallment` → `expected 200, got 100` · `inWindowMinimum.test.ts` → `(got $50)` |

| **P-F** | `Math.max(1, n) *` → `Math.max(1, n) ** 2 *` — **the producer DOUBLE-applies** *(doubled)* | `bnplInstallment.ts:320` | ✅ `testGuardianPartition` → `expected $250, got $750` |

**Every plant made an assertion FAIL by name.** None threw past an assertion; none produced a stack trace
in place of a verdict. Restores were `cmp`-verified (byte-identical) and `git status` was empty after each.

### ⚠️ Who stayed SILENT, and it matters

- **P-A** (`A3-7`): `inWindowMinimum.test.ts` **PASSED**. The class's flagship new instrument does not
  cover `A3-7` at all — the row site does not move `totalRequired`, and `totalRequired` is what it asserts.
  Only `testGuardianPartition`'s new block sees it, and that block is the class's single registered guard.
  ⛔ So the class has **exactly one** assertion standing between `A3-7` and a repeat.
- **P-B** (the seam re-introduced): `bnplCadence.test.ts` **PASSED**, confirming the class's own diagnosis
  — its fixture is installment-native, so `bnplInstallmentAmount` prefers `scheduledPaymentAmount` and the
  corrupted `minimumPayment` is never read. `testBnplInstallment` and `testDeriveRequiredActionView` also
  passed under P-A. Coverage of each site rests on **one** instrument, not several.

**Closed, by planting:** `A2-1` `A3-1` `A3-4` `A2-3` `A2-8` `A3-7` — and the *behaviour* half of `A2-2`
(`testBnplInstallment`'s lockstep control reds in the deleted direction, so it is no longer vacuous).

---

## `F3` — `major` · **THE SEVENTH SITE.** The row for a ticked minimum prints **$50** against a **$250** obligation, and the figure changes on the tap

**consequence** · `apps/rn/src/store/planSelectors.ts:255`. `.4.9`'s comment
(`allocatePaycheck.ts:549`) says pass 6 *"replaced `Math.min(debt.minimumPayment, debt.balance)` at five
sites. There were six"* — and adds *"This sentence is left standing because the count it states is the
finding."* ⛔ **The corrected count is short too.** A seventh producer of the required row's amount lives
in the RN store layer, outside `allocatePaycheck.ts`, and it is the one the user sees after they tick.

**the measurement** · `class4-reaudit-probes/p4-seventh-site.ts`, one plain weekly $50 debt, monthly
window `2026-10-01 → 2026-11-01` (5 charges):

```
minimumPaidThisCycle=false | engine totalRequired $250 | VISIBLE ROW $250 | caption 5 x $50
minimumPaidThisCycle=true  | engine totalRequired $250 | VISIBLE ROW  $50 | caption none
```

The engine's `paidDebtMinimumTotal` counts this debt at **$250** on both rows (it reads
`minimumDueInWindow`), so the receipt attributes $250 paid while the row beside it reads $50 — which is
`C1-13`'s shape (*"Required expenses & minimums $60.00 directly above its own $410.00 paid"*) and `A3-7`'s
consequence, one screen further out. **The caption vanishes with it**, so nothing on the row explains the
change either.

**mechanism (HYPOTHESIS)** · the allocator DROPS an already-paid minimum from `allocations`, so
`selectRequiredRows` re-adds it from the store to keep it visible and undo-able — and builds that
re-added item from `d.minimumPayment` raw. The allocator's own paid-side total went in-window at pass 6;
this re-add did not, and it is invisible to every `allocatePaycheck.ts` grep because it is not in that
file.

**remedy (UNVERIFIED)** · the re-add must use the same producer: `effectiveMinimumInWindow(d,
store.paycheck.currentDate, store.paycheck.nextPaycheckDate)` capped at `d.balance`. ⚠️ **Not
`scaleBnplMinimumForWindow`** — see `F6`, that is a second expression, not the owner.

⚠️ **Not caused by class 4** (it pre-dates the range), but squarely inside it: same defect, same cycle,
same screen, and the class's own enumeration missed it a second time. This is
`audit-site-lists-undercount` — *measured on five consecutive items, always short* — recurring on the
item whose subject IS the undercount.

---

## `F4` — `major` · `A3-12`'s repair gave the cadence matrix debts and **no assertion that can fail**

**consequence** · `packages/core/testing/testCadenceIdentity.ts:148-190`. `A3-12` was *"the instrument
written to close the cadence CLASS walks 28 pairs and passes `debts: []` to every one."* The fix adds a
56-pair debt matrix. Its only two assertions are `r.totalRequired % 50 !== 0` and `r.shortfall !== 0` —
and **every scaling error in the class satisfies both**: 50, 200 and 800 are all multiples of 50, and the
fixture's $5,000 paycheck covers all of them. The finding moved from *"passes no debts"* to *"passes
debts and asks them nothing"*, which is class 9's name.

**the measurement** · three plants, each proven live by a sibling suite reddening on the same tree:

| plant | direction | `testCadenceIdentity` | proven live by |
|---|---|---|---|
| **P-A** the row site reverted | split total/row | ✅ **green** | `testGuardianPartition` → `$500 vs $700` |
| **P-E** `if (false && hasKnownBnplCadence…)` | scaling **deleted** | ✅ **green** | `testGuardianPartition` → `expected $250, got $50` |
| **P-F** `Math.max(1, n) ** 2 *` | scaling **doubled** | ✅ **green** | `testGuardianPartition` → `expected $250, got $750` |

Control on the clean tree: green. **A check that is green on the clean tree and green under every
direction of its own defect is measuring nothing.**

**mechanism (HYPOTHESIS)** · `% 50 === 0` is a divisibility test over a quantity that is *always* an
integer multiple of the charge, whatever multiplier is applied — the assertion is structurally satisfiable
by the defect. ⚠️ And the fixture is `paycheckAmount: 5000` against a `$50` charge, so the shortfall row
has ~100× of headroom before it can fire.

**remedy (UNVERIFIED)** · assert the **value**, as the sibling matrices do:
`r.totalRequired === 50 * chargesIn(recurrence, currentDate, next)`, with the count derived from
`bnplInstallmentsInWindow`. ⛔ Derived, not a third table of literals — `F2` is what a hand-written
cadence table costs.

---

## `F5` — `major` · one guard registered for eleven findings, and `lint:finding-guards`' green line cannot see the other ten

**consequence** · `scripts/finding-guards.json`. The whole class registered **`S1-CLASS4-A3-7` and
nothing else** (`MIN_ENTRIES` 281 → 282 — exactly one). The three **blockers** — `A2-1`, `A3-1`, `A3-4` —
carry no entry, nor do `A2-2` `A2-3` `A2-8` `A3-2` `A3-12` `A3-14`. For comparison, class 1 registered
**14** (`S1P7-*`).

`lint:finding-guards` prints `✅ 281 of 282 findings carry a standing guard`. ⛔ **Its denominator is the
registry, not the class** — a finding with no entry is not "unguarded", it is not counted. So the class
closed under a green line that is silent about ten of its eleven members: `a-pass-that-cannot-fail`, in
the ledger rather than in a gate.

**the measurement** · `grep -oE '"S1-CLASS4-[A-Z0-9-]+"' scripts/finding-guards.json | sort -u` returns
one id. `git diff bc336cfd..HEAD -- scripts/check-finding-guards.ts` shows `MIN_ENTRIES` +1.

**mechanism (HYPOTHESIS)** · the class's plan step `.4.5` reads *"each control fails when the defect is
planted, proven by planting"* — satisfiable by running a plant by hand, which leaves nothing standing.
Registration belonged to `.4.8` (*"guards derived from the diff"*), and `.4.8` was marked ✅ at the
boundary, before `.4.9` even found `A3-7`; the one guard that exists is `.4.9`'s.

**remedy (UNVERIFIED)** · register the plants this audit ran — P-B (`selectors.ts`), P-C
(`buildMultiCycleTimeline.ts`), P-D (`deriveRequiredActionView.ts`), P-E (the producer) — beside the
existing P-A, each with `proof.cmd` **scoped to the owning file**. ⛔ Not `proof.run: "test:app"` for
anything asserting through `inWindowMinimum.test.ts` until `F2` is fixed: after 2026-09-09 that suite reds
first, for the wrong reason.

---

## `F6` — `minor` · a SECOND live expression of the in-window minimum, and it **disagrees** with the declared one producer

**consequence** · `apps/rn/src/store/recoverySelectors.ts:50`. `effectiveMinimumInWindow`'s own docblock
(`bnplInstallment.ts:305`) says *"⛔ Do not re-derive this expression at a third site — call this. Two
producers of one fact is the shape that produced both A1 and A2 in the same pass."* The recovery plan
re-derives it. ⚠️ **It survived every grep in this class because the class searched for
`scaleBnplMinimum` + `s` + `ForWindow` (plural) and this call is the SINGULAR** — the same
truncated-search shape as `truncated-search-hides-a-class`.

**the measurement** · `p4-seventh-site.ts` section B:

```
plain weekly, n=4                                 owner $250   recoverySelectors $250   agree
installment-native, MONTHLY (n=1),
  scheduledPaymentAmount 80 != minimumPayment 50  owner  $80   recoverySelectors  $50   DISAGREE
```

**mechanism (HYPOTHESIS)** · `scaleBnplMinimumForWindow` short-circuits `if (n <= 1) return debt`, so at
one charge it yields the **stored** `minimumPayment`. `effectiveMinimumInWindow` has no such short-circuit
— it computes `Math.max(1, n) × bnplInstallmentAmount(debt)`, and `bnplInstallmentAmount` **prefers
`scheduledPaymentAmount`**. The two agree only while the two fields agree.

⚠️ **Reachability of `scheduled !== minimum` is a HYPOTHESIS, not measured here.**
`normalizeBnplInstallment` equalises them at write seams — but `A2-9` (class 6, **open**) records
`verifyDebtBalance`/`verifyDebtBalances` skipping exactly that call. Latent until that is measured.

**remedy (UNVERIFIED)** · call `effectiveMinimumInWindow(d, windowStart, nextPayday)` capped at
`d.balance` — `minimumDueInWindow`'s expression. ⚠️ Only then does `selectors.ts:62`'s claim *"the
in-window minimum has exactly ONE owner"* become true; while `F6` and `F3` stand it is a false statement
in shipped source, which is `[D17]`'s class.

---

## `F7` — `minor` · the reserve was widened past the type gate twice; the Guardian line that EXPLAINS the reserve still carries it

**consequence** · `apps/rn/src/store/guardianSelectors.ts:419`. `selectBnplBetweenPaycheck` — the
between-paycheck heads-up whose docblock says *"the Guardian's crunch read already reflects that (2.7.4),
and this line explains the cause"* — still gates on `isInstallmentNative(d)`. Pass-6 `A3-1` widened the
reserve to any cadence; class 4 widened the caption in `deriveRequiredActionView` to any debt. This third
surface was not widened, so the two shapes the widening admitted get the multiplied reserve with the
Guardian silent about why.

**the measurement** · `class4-reaudit-probes/p5-guardian-headsup.ts`, one $50 weekly debt, monthly window:

```
installment-native BNPL | reserved 250 | row 250 | caption 5 x $50 | Heads up — 5 Klarna payments (about $50 each) land before your next paycheck.
fallback BNPL           | reserved 250 | row 250 | caption 5 x $50 | null
plain debt (weekly)     | reserved 250 | row 250 | caption 5 x $50 | null
```

Identical money, identical caption, and the explanation fires for one shape of three.

**mechanism (HYPOTHESIS)** · `isInstallmentNative` requires `type === "bnpl"` **and** both installment
fields; `hasKnownBnplCadence` requires neither. The line also reads `d.scheduledPaymentAmount as number`
directly, so widening the gate alone would print `undefined` — the fix is the gate **and**
`bnplInstallmentAmount`, together.

**remedy (UNVERIFIED)** · `hasKnownBnplCadence(d)` + `bnplInstallmentAmount(d)`, and re-word the provider
clause: `d.bnplProvider || 'BNPL'` would say *"5 BNPL payments"* about a plain loan — absurd on exactly
the shape this widening admits. ⚠️ That is the copy question `A2-3` answered for the row and never asked
for the card.

---

## `F8` — `minor` · two stacked docblocks on one statement, and the outer one is now false

**consequence** · `packages/core/debt/deriveRequiredActionView.ts:113-137`. The class replaced the
statement and left pass-6 `A2-8`'s docblock standing above its own. That block says *"The row's amount is
doubled by CADENCE — `scaleBnplMinimumForWindow` multiplies by the installments that fall in the
window."* ⛔ **That is no longer the mechanism**: `scaleBnplMinimumForWindow` runs on no path that
produces `item.amount` — the allocator's `minimumDueInWindow` does. It also describes a
`scheduledPaymentAmount` gate and a `type === "bnpl"` gate, neither of which exists in the code beneath
it. `[D17]` says a false comment is **deleted**, not annotated; `deletions-must-be-silent` says the
reasoning goes to the log.

**the measurement** · read, then confirmed by call-graph: the only production callers of
`scaleBnplMinimumForWindow`/`...sForWindow` are `recoverySelectors.ts:50` (see `F6`) and
`buildMultiCycleTimeline`'s two ITEMS calls. Neither is on the required-row path.

**remedy (UNVERIFIED)** · delete the outer block; the surviving one already states the rule and its
history.

---

## `F1` — `minor` · the brief's cumulative count is **106**, not 105

Re-derived from the files: class 4's 11 · `R1`–`R15` 15 · `N-1`–`N-11` 11 · `T1`–`T14` 14 · `U1`–`U16` 16
· `V1`–`V12` 12 · round 6's `W1`–`W15` 15 — **and `W9b`, which is a 16th**. The brief's row reads
"`W1`–`W15` *(incl. `W9b`)* | 15", which folds `W9b` into a range that already holds 15 ids.

⚠️ **`W9b` is not in `CLASS1-REAUDIT-6.md` at all** — `grep -rn "W9b"` over the audit directory returns
only the brief. It exists solely at `DEBT_ELEVATION_LOG.md:31842` (*"`W9b` — the fix for `S5-DEADLOCK` was
itself a fail-open"*): a distinct finding with its own remedy and its own fix. So the file-based
enumeration gives 15 and the true count is 16 — **the id is real and its home is the log, not the round
file**, which is how a file-driven re-audit skips it.

Consequence is one id, but it is the failure mode the brief itself names (its first draft said 90 because
it stopped at `V*`).

---

# Measured and found NOT to be a defect

⚠️ Recorded so the next round does not re-derive them. Four of these are the brief's own leads, and
**three of the four were wrong as stated** — Law IV again, on a brief rather than on an agent.

### ⛔ REFUTED — "`selectors.ts` no longer scales, and that is the largest blast radius in the diff… every consumer of the store's debt list now receives raw `minimumPayment`s. **Find a third [reader].**"

**There is no third reader, and there was never a second.** The scaled list was a *local argument
expression* inside `buildAllocation`, never a value any consumer could hold: it was written inline into
the `allocatePaycheck({...})` call, and `allocatePaycheck`'s return object (`allocatePaycheck.ts:840-862`)
carries `allocations`, `unfundedRequiredItems`, `totalRequired`, `remaining`, `livingExpense*`,
`shortfall`, `affordableUnpaidRequiredCount` and the three `expenseReserve*` fields — **no `debts`**. So
cards, widgets, the Live Activity, the paywall lead, CSV/export and notifications all read
`store.debts`, and always did. Nothing lost a scaling.

### ⛔ REFUTED — "`buildTimelineItems:109` reads `debt.minimumPayment` RAW… Find a path that reaches it unscaled, or a test that does."

There is no such production path. `grep -rn "buildTimelineItems"` returns exactly **two** production call
sites, both in `buildMultiCycleTimeline` (`:157` cycle 0, `:256` projected), and **both pre-scale**. The
other 30 call sites are in `testTimelineRegression` / `testV11Regression` / `testFullAppRegression` /
`testMultiCycleTimelineRegression`, and those that pass debts at all pass monthly fixtures for which the
scaling is a no-op. The contract is undeclared but not violated. ⚠️ It stays a latent hazard, which is
what `F5`'s missing guards would have pinned.

### ⛔ REFUTED — "the **`unfundedAmount`/shortfall copy** — the required figure grew, so a user who previously saw no shortfall may now see one. Is that surfaced honestly, or does some screen still print the old number beside the new one?"

`.4.9` made the two agree at **every** funding level, which is the opposite of the feared outcome.
`class4-reaudit-probes/p6-shortfall-copy.ts`, one $50 weekly debt in a 5-charge window:

```
paycheck $3000  totalRequired $250  row $250  unfunded $0    shortfall $0    OK
paycheck  $200  totalRequired $250  row $200  unfunded $50   shortfall $50   OK
paycheck  $120  totalRequired $250  row $120  unfunded $130  shortfall $130  OK
paycheck   $60  totalRequired $250  row  $60  unfunded $190  shortfall $190  OK
paycheck    $0  totalRequired $250  row   $0  unfunded $250  shortfall $250  OK
```

`row + unfunded === totalRequired` and `unfunded === shortfall` hold throughout. **Before `.4.9` they
could not**: `shortfall` already read `minimumDueInWindow` while the row read the raw minimum, so the two
disagreed by `(n−1) × installment`. The `A3-7` fix closed the copy gap as a side effect, and this is the
assertion that states it.

### ⛔ REFUTED — "`A3-7` is recorded as `major` in the class table while the log's severity ledger lists it `minor`. Never schedule or dismiss off a label."

**The rule is right and the example is an id collision.** `DEBT_ELEVATION_LOG.md:30494`'s `minor` row
belongs to the **`S1.13.7.11`** census dated 2026-09-02 — pass **6**'s survivors, built by *"subtract every
id named by any class section in `CLASSIFICATION.md`"*, so by construction it cannot contain a pass-7 id
that IS in a class section. Pass 7's `A3-7` is `major` in `CLASSIFICATION.md:217` **and** `major` in its
own heading at `A3-findings.md:297`. Both agree. ⚠️ This is precisely the hazard
`CLASSIFICATION.md:60` opens with — *"⛔ IDS COLLIDE ACROSS PASSES"* — reaching the brief that quotes it.

### ✅ CONFIRMED SOUND — `testGuardianPartition`'s three hand-written `charges` (5 / 3 / 1)

The brief asked *"Are they right, and do they stay right?"* — **yes to both.** Window
`2026-06-01 → 2026-07-01`, due `2026-06-02`: weekly `06-02·09·16·23·30` = 5; biweekly `06-02·16·30` = 3;
monthly `06-02` = 1. All three dates are **literals**, so no clock reaches this block and the numbers are
fixed forever. `A3-7`'s plant reds on `expected $250, got $50` — the `5 × $50` row — so the literals are
load-bearing rather than decorative.

### ✅ CONFIRMED SOUND — `inWindowMinimum.test.ts`'s **cycle-0** rows, and the DST / year-boundary worry

`p1b-fail-calendar.ts` walked 365 consecutive dates: the nine `totalRequired` rows, the nine `shortfall`
rows and the monthly control failed on **0 of 365**. `day(offset)` uses `Date.setDate` and reads local
`Y/M/D` back, so it is exact across DST and across a year end, and a 28-day window holds 4 weekly / 2
biweekly / 1 monthly charge on **every** date (a monthly advance's minimum gap is 28 days, so the second
charge always lands at or beyond `day(31)`). ⛔ **The clock-relative fixture is not the defect** —
`F2` is the *projected* cycle, which was never pinned at all.

### ✅ CONFIRMED SOUND — `bnplInstallmentAmount` made public; nothing else holds a drifting copy

Two production sites read `scheduledPaymentAmount` without the fallback —
`guardianSelectors.ts:423` and `bnplSchedule.ts:58` — and **both sit inside an `isInstallmentNative(d)`
branch**, where the field is present by definition. Neither is a copy of the rule. ⚠️ The real defect near
`guardianSelectors.ts:423` is the *gate*, not the read — see `F7`.

### ✅ CONFIRMED SOUND — `A3-14`'s History control, and `A2-2`'s and `A2-8`'s repairs

`A3-14`: `WINDOW_START 2026-01-01 → WINDOW_END 2026-02-01`, the monthly fixture moved **into** the
window, and a weekly sibling asserted at `5 × $25 = $125`. Literal dates; stable. `A2-2`: the new
`plainWeekly` row asserts a plain `type: "debt"` weekly debt scales `50 → 200`, so it now varies **type**
and not alignment — proven by P-E reddening its lockstep sibling (`expected 200, got 100`). `A2-8`:
proven by P-D (`4 × $100 (got undefined)`).

### ✅ CONFIRMED SOUND — `A3-2`, closed by addition rather than repair

`A3-2` was *"the guard for `A3-4` runs the allocator on a path production never takes."* The registered
guard `S1P6-A3-4-DEBTCADENCE` is **unchanged** by this class (only its `measured`/`sha` moved); what
closed the finding is the new `inWindowMinimum.test.ts` going through `selectAllocation`. That is a valid
close — a production-path assertion now exists — but it inherits `F2` entirely: the addition is unreliable
288 days a year, and it carries no registry entry (`F5`).

### ⚠️ RE-CONFIRMED, not new — `prove:guards` records by default (`W10`, already filed to class 9)

`npm run prove:guards -- --id=S1-CLASS4-A3-7` rewrote `finding-guards.json` (`sha` 3df5614b → 24a444cc)
during a read-only audit. Restored; `--no-record` used for everything after. Recording it only because it
cost this round a tree-dirtying step and the next auditor will hit it identically.

### ⚠️ RE-CONFIRMED, not new — `W5` reproduced by accident: killing `lint:rn` leaves plant sidecars in tracked source

Interrupting `npm run lint:rn` (Ctrl-C equivalent) part-way left two orphans in the app source tree:

```
apps/rn/src/store/guardianSelectors.test.ts.plant-backup
apps/rn/src/store/guardianSelectors.test.ts.plant-backup.plant-owner
```

`scripts/test-wrap-escapes.ts:325` plants into that file as part of the gate sweep. **The recovery worked
as designed** — verified before deleting anything, rather than assumed:

```
cmp HEAD:guardianSelectors.test.ts  guardianSelectors.test.ts          BYTE-IDENTICAL
cmp HEAD:guardianSelectors.test.ts  ...ts.plant-backup                 BYTE-IDENTICAL  (nothing lost)
```

so the source was restored and only the sidecars survived. ⛔ **But they land in `apps/rn/src/store/`, one
`git add -A` from being committed — and `test:plant-safety` reds on a *tracked* sidecar.** They are
untracked here, so the gate stayed green (31 assertions, re-run after cleanup) and the tree is clean.

⚠️ Recorded because it is `W5`'s scenario arriving from ordinary operator behaviour rather than from an
artificial `fault()`, and because **an auditor who interrupts a gate run and then commits will red the
next round's `test:plant-safety` with no idea why.** Not a class-4 defect; noted for class 9's owner.

---

# Cumulative scope — `[D79]` step c

**11 registered guards pin a file this class touched, and all 11 re-proved `MATCHED`** (`--no-record`,
one at a time, from a verified-clean tree):

```
S1P4-A-F3-WINDOWSTART · S1P4-C4-1-COUNT · S1P3-A2-INWINDOW · S1P3-A4-CADENCE · S1P3-B5
S1P5-A5-6-PROJBNPL · S1P5-CADENCE-IDENTITY · S1P6-A3-15-PARTITIONSIDE · S1P6-A3-4-DEBTCADENCE
S1P6-C1-15-ESSENTIALS-READ · S1-CLASS4-A3-7
```

Each: `plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED`. **No class-1 or earlier
closure was broken by class 4's fixes.** `lint:finding-guards`' 6 STALE rows and its 1 unguarded row are
unchanged from the boundary and belong to classes 2/9 (`S1-ROUTE-STALE-READ`, `S1-ROUTE-EXIT-REACHABLE`,
four `check-finding-guards.ts` movers, `GAP-14`).

⚠️ **A caveat that is itself `F2`'s consequence:** every one of those 11 verdicts was taken **today**.
**Two registered guards have `proof.run: "test:app"` — `S1P3-B5` and `S1P4-C4-1-COUNT`** (checked by
reading the registry). From 2026-09-10 their *control* run — the unplanted one — reds, which is verbatim
the state the brief's own method section describes: *"a command string there is red unconditionally and
reads as 'the control redded too, so this run measured nothing.'"* Both scored `control=exit 0 · MATCHED`
today and neither can again until `F2` is fixed. **Fix `F2` before the next `prove:guards` sweep, or its
verdicts are unreadable — and note that this is a THIRD way `F2` costs a proof**, after voiding `A3-4`'s
plant and reddening CI.

---

# Boundary

Taken after every plant was restored and byte-compared:

| | |
|---|---|
| `git status --porcelain --untracked-files=all` | only this audit's own files — no `*.plant-backup` / `*.plant-owner` / `*.plant-hash` (backups were held in `%TEMP%`, outside the repo, by design) |
| `npm run typecheck` | 0 errors |
| `npm run test:app` | ✅ ALL PASSED |
| `npm run test:regression` | ✅ All regression tests passed |
| `npm run lint:rn` | `✅ lint:rn — all 52 gates pass.` exit 0 |

⛔ **And that boundary is the finding.** It is identical to the one class 4 closed on, and it will be
**red on 2026-09-10** with not one byte changed.

---

# Verdict

| id | sev | one line |
|---|---|---|
| `F2` | **blocker** | the class's own new guard reds on **288 of the next 365 days** — `test:app` goes red on **2026-09-10** with no code change, and `A3-4`'s proof is void from that date |
| `F3` | major | **the SEVENTH site** — the ticked-minimum row prints **$50** against a **$250** obligation, and changes on the tap |
| `F4` | major | `A3-12`'s repair gave the cadence matrix debts and no assertion that can fail — green under **all three** directions of its own defect |
| `F5` | major | **one** guard registered for eleven findings; the three blockers carry none, and the gate's green line cannot see the gap |
| `F6` | minor | a second live expression of the in-window minimum in `recoverySelectors`, disagreeing **$50 vs $80** |
| `F7` | minor | the Guardian line that exists to EXPLAIN the widened reserve still carries the gate the reserve dropped |
| `F8` | minor | a stale docblock left stacked above its replacement, stating a mechanism that no longer runs |
| `F1` | minor | the brief's cumulative count is **106**, not 105 — `W9b` lives in the log, not in the round file |

**8 findings · 1 blocker · 3 major · 4 minor.**

⛔ **Six of the eleven are genuinely closed by planting** — `A2-1` `A3-1` `A3-4` `A2-3` `A2-8` `A3-7` —
plus `A2-2`'s behaviour half and `A3-14`. **The money root is fixed, in all three sites, in both
directions.** What is not fixed is the *durability* of the fix: `F2` makes the instrument unusable within
a week, `F4` makes the second instrument unfalsifiable, and `F5` leaves ten of eleven findings with
nothing standing. And `F3` says the enumeration that `.4.9` corrected from five to six is still short.
