# Class 4 — re-audit **3**

**Auditor:** fresh session, never wrote round 2's fixes. `[D79]` step **b**, round 3.
**Base:** `68c348f9` → **`1cebd764`** (head of `v1.7-dev`). Tree clean at start, 0 unpushed.
**Probes:** [`class4-reaudit3-probes/`](class4-reaudit3-probes/).

Worst-case spend declared before starting: scoped `npx tsx` runs only (one test file per run, seconds
each), no whole-monorepo typecheck, no sub-agents, heap left at the node default and every run measured
well under 1536 MB.

---

## The fix set, derived from the diff (not from the finding list)

`git diff --stat 68c348f9..HEAD -- apps packages scripts` — **13 files, +559/−75**, over 10 commits
(`39e122e1` … `75d0f6fe`).

| file | Δ | what round 2 did |
|---|---|---|
| `apps/rn/src/store/guardianSelectors.ts` | +26/−3 | **`R2-1`** — the heads-up count is now `Math.round(reserved / each)` off `effectiveMinimumInWindow` |
| `apps/rn/src/store/inWindowReaders.test.ts` | **+190 (new)** | **`R2-2`** — the guard for `F3`/`F6`/`F7`/`R2-1`, and the only one |
| `apps/rn/src/store/inWindowMinimum.test.ts` | +59 | `R2-6` — `A3-1`'s $3,000 fixture cut to $300; `A3-2` given a convergence assertion |
| `analysisSelectors.ts` · `buildPayoffTrajectory.ts` · `projectCurrentBalance.ts` · `projectDebtPayoff.ts` | +81/−22 | **`R2-5`** — four sites rate every debt by cadence; the `apr` ternary beside each stays label-based |
| `packages/core/testing/testCadenceIdentity.ts` | +50 | `R2-5`'s identity 3 + a monthly control |
| `scripts/prove-guards.ts` · `check-finding-guards.ts` | +25/−5 | **`R2-6`** — `expect` defaults to the entry's own `token` |
| `scripts/finding-guards.json` | +199/−75 | 4 new entries, 6 `expect`s removed, 4 `proofNote`s added, 11 proofs re-recorded |
| `runAppTests.ts` · `surface-coverage.s1.json` | +4 | wiring the new file in |

---

## Findings

### `R3-1` — **major** · every assertion in `inWindowReaders.test.ts` — the sole guard for four registry entries — is **GREEN under a 2× defect in the one producer it is written against**

**Consequence.** The file exists because round 2's audit reverted three user-facing money fixes and
found nothing red. Its own header states the design: *"Every assertion below is written against
`effectiveMinimumInWindow`, never against a literal."* That makes all 15 assertions **an equation with
the same expression on both sides**. It detects a reader being *unwired* from the producer and nothing
else — including the producer stating twice the money.

**`file:line`** — `apps/rn/src/store/inWindowReaders.test.ts:69` (`owed`, the expectation), and the
assertions built on it at `:94`, `:126`, `:143`.

**The measurement.** Plant (byte mode; restored and `cmp`-verified IDENTICAL at 20,411 bytes):
`packages/core/debt/bnplInstallment.ts` → `bnplInstallmentAmount(debt) * 2` inside
`effectiveMinimumInWindow`. Command scoped to the file that owns the assertion.

```
npx tsx --tsconfig apps/rn/tsconfig.json apps/rn/src/store/inWindowReaders.test.ts
  ✓ ⛔ F3 · ticked=false — the row is the in-window $400 … (got $400)
  ✓ ⛔ F6 · plain weekly (n=4) — recovery covers the in-window $400 … (got $400)
  ✓ ⛔ F7 · plain debt — the heads-up names 8 payments, matching the reserve
        (got "Heads up — 8 Weekly loan payments (about $50 each) land before your next paycheck.")
✅ in-window readers: 15 assertions …                                       EXIT 0
```

⛔ **The suite prints the false sentence and calls it a pass.** The true in-window obligation on that
debt is $200; the plant makes the app announce **$400**, and the guard for the finding *"the line that
explains the reserve"* reports green.

⭐ **The control says the class is not left uncovered, and that is the honest scoping.** The same plant
against the sibling file reds on its own literal:
`❌ FAIL [installment-native BNPL · weekly — reserves 4 × $50 = $200, not a multiple of it (got $400)]`
(`inWindowMinimum.test.ts:134`). So `effectiveMinimumInWindow` **is** guarded — by the file round **1**
wrote, not by the file round 2 wrote for these four findings.

⭐ **And `R2-1`'s own fix is what took the last independent producer out of the `F7` row.** Before
`R2-1`, `selectBnplBetweenPaycheck` counted with `bnplInstallmentsInWindow` while the test expected
`effectiveMinimumInWindow / each` — **two producers, a real cross-check**. Measured: with the 2× plant
live *and* the registered `R2-1` un-fix applied (count back to `bnplInstallmentsInWindow`), the same row
**reds**:

```
❌ FAIL [⛔ F7 · installment-native BNPL — the heads-up names 8 payments, matching the reserve
        (got "Heads up — 4 Klarna payments (about $50 each) land before your next paycheck.")]
```

Both files restored, `cmp` IDENTICAL (56,666 / 20,411 bytes).

**Mechanism (HYPOTHESIS).** *"Assert against the producer, never against a literal"* is the correct rule
for a **wiring** claim (`F3`/`F6`: *this reader calls that producer*) and the wrong one for a **money**
claim (`F7`: *the sentence states what the app holds back*). Round 2 applied it uniformly, and the
`R2-1` fix — collapsing two producers into one, which is right for the product — removed the last
independent term in the file.

**Remedy (UNVERIFIED).** Keep the producer-derived rows as the wiring check and add **one** literal
anchor per block: the $50-weekly / 28-day fixture owes exactly `$200` and the sentence says `4`, written
as constants the test does not compute. ⚠️ The window is currently clock-relative (`day(0)`/`day(28)`),
so a literal needs the dates pinned first — which the file's own header claims is unnecessary, and is
why no literal is there.

---

### `R3-2` — **major** · `R2-1`'s rounding announces payments the balance cannot fund, and the guard it shipped with cannot see it

**Consequence.** `R2-1` closed *"the Guardian heads-up states a total the user does not owe."* On a
**$75** balance the line now says **"Heads up — 2 Car Loan payments (about $50 each) land before your
next paycheck"** — $100 announced against the $75 the app reserves, on Today. Seven of nineteen sampled
balances overstate the reserve, by up to **+$25 (33%)**.

⛔ The guard's own assertion is titled *"a debt that **cannot fund two charges** says NOTHING."* $75
cannot fund two charges. It speaks.

**`file:line`** — `apps/rn/src/store/guardianSelectors.ts:454` — `const count = Math.round(reserved / each);`

**The measurement** — [`class4-reaudit3-probes/r2-1-rounding.ts`](class4-reaudit3-probes/r2-1-rounding.ts),
$50 weekly charge, monthly payer, window `2026-08-03 → 2026-08-31` (4 charges), balance varied:

| balance | app reserves | line says | |
|---|---|---|---|
| $49 | $49 | *(silent)* | ✅ |
| $74 | $74 | *(silent)* | ✅ |
| **$75** | **$75** | **2 × $50 = $100** | **OVER +$25** |
| $99 | $99 | 2 × $50 = $100 | OVER +$1 |
| $100 | $100 | 2 × $50 = $100 | exact |
| $110 | $110 | 2 × $50 = $100 | under −$10 |
| $124 | $124 | 2 × $50 = $100 | under −$24 |
| **$125** | **$125** | **3 × $50 = $150** | **OVER +$25** |
| **$175** | **$175** | **4 × $50 = $200** | **OVER +$25** |

**Mechanism (HYPOTHESIS).** `effectiveMinimumInWindow` caps at the balance
(`bnplInstallment.ts:318-324`), so `reserved / each` is an exact integer **except** when the cap bites —
and exactly then `Math.round` rounds a half-charge *up*. The fix's stated design is that the sentence
*"agrees with the money by construction"*; construction holds only over the uncapped range, which is the
range the finding was **not** about.

⚠️ **The guard cannot reach it, by fixture choice rather than by accident:**
`inWindowReaders.test.ts:158` samples `[1, 20, 49]` — all below **one** charge — and its control is
`2 * EACH = $100`, exactly on the boundary. The whole interval `(1.5 × each, 2 × each)` where the defect
lives is unsampled.

**Remedy (UNVERIFIED).** `Math.floor(reserved / each)` — a partial charge the balance cannot cover is
not a payment that lands. ⚠️ That moves the residue to the *under* side over the capped range ($199 →
"3"), which is the conservative direction for a sentence explaining held-back money but is still a
disagreement; stating `reserved` itself rather than `count × each` is the only form with no residue.
Either way the guard needs a `$75` row, or it will not see the next version of this either.

---

### `R3-3` — **major** · `R2-6`'s remedy shipped **half in code and half as a claim**, and the half written as a claim is a rule that would fire on **84 legitimate entries**

**Consequence.** `prove-guards.ts` — the harness that certifies every one of the 296 closures — now
carries a docblock stating a safeguard that **exists nowhere in the repo**. Anyone reading the harness
to decide whether a closure is trustworthy is told a check is running that is not, and that is the
`R2-6` shape one level up: *a check that cannot fail reads exactly like a check.*

**`file:line`** — `scripts/prove-guards.ts:78-80`:

> *"⚠️ A value that is not a substring of the token is refused by `check-finding-guards` unless the entry
> carries a `proofNote` saying why."*

**The measurement.**

1. `grep -rn "proofNote" scripts/*.ts scripts/lib/*.ts` → **one hit, and it is that sentence.** No code
   anywhere reads `proofNote`. `grep -n "expect" scripts/check-finding-guards.ts` → the only occurrence
   is the type declaration at `:82`. **There is no refusal, for any value of `expect`.**
2. [`class4-reaudit3-probes/registry-expect-census.mjs`](class4-reaudit3-probes/registry-expect-census.mjs)
   over the live registry:

```
entries=296  withProof=176  noExpect=10  noExpectNoToken=0
expectNotSubstringOfToken=88   ofWhichNoProofNote=84
```

⛔ **Implemented as written, the rule reds 84 entries** — `S1P3-M2` (token
`eq(formatMonths(30), '2 years',` · expect *"30 months is 2.5 years and must not be sold as 3"*),
`S1P6-A2-6-NANBLIND` (token `requireFinite` · expect *"not a finite number"*), and 82 more. Every one is
**correct**: the `token` is a *code fragment* that must survive in the file, the `expect` is the *message
the run prints*, and the two are different kinds of string by design. ⭐ **This is `R2-6`'s own failure
mode repeating** — round 2 recorded that its proposed gate *"fired on 90 legitimate entries"*, declined
to build it, and then wrote it into the harness's documentation as though it had been built.

**Mechanism (HYPOTHESIS).** The remedy conflated two populations. Where the `token` is an assertion
**label** (class 4's entries), token-as-`expect` is exactly right and round 2's default is a real repair.
Where the `token` is a code **identifier** (most of passes 1–7), the token can never appear in run
output, so the substring rule is not merely unenforced — it is **unimplementable as stated**. The
docblock generalised from the ten entries in front of it.

⚠️ **Two live residuals, both measured:**

- **`expect` is optional in `prove-guards.ts` and still `expect: string` (required) in
  `check-finding-guards.ts:82`.** That is the identical *"one shape, two hand-written types"* defect
  `check-finding-guards.ts`'s own docblock records for `measured`/`sha`, re-created in the other
  direction by the same round.
- **`prove-guards.ts:525` is `p.expect ?? e.token ?? ''`,** and `verdict()` skips the reason check
  entirely on a falsy `expect` (`lib/verdict.ts:113`, asserted by its own self-check row *"no expect
  means no reason check"*). An entry with a `proof` and **no `token`** therefore gets **no attributability
  check at all**, prints `✅` with no `reason=` field, and counts as proven. `check-finding-guards`
  `continue`s past any `unguarded` entry before it ever looks at `proof` (`:366-370`), and
  `prove-guards.ts:700-705` requires only `proof` — so the combination is representable. Not currently
  instantiated (`noExpectNoToken=0`), which is why this is a residual and not a finding of its own. ⚠️
  This is precisely what `S1P5-D5-7-EXPECTREQUIRED` closed — *"being optional is what let it spread"* —
  reopened in the sibling harness while `D5-7`'s own guard, scoped to `test-gate-plants.ts`, stays green.

**Remedy (UNVERIFIED).** Delete the claim, or make it true in the only form that survives the 84: refuse
an `expect` **only when the entry's `token` is itself label-shaped** (contains a space and is not a code
fragment) and the `expect` is not a substring of it — and require `proofNote` there. ⚠️ Round 2's own
lesson applies to this remedy: **measure the fire-count before writing it down**, in either place.
Separately: make `token` required whenever `proof` is present, so the `?? ''` branch is unreachable
rather than merely unused.

---

### `R3-4` — **major** · the payoff celebration states a **per-month** figure built from the **per-installment** minimum — the `R2-5` class at a site the class has never enumerated

**Consequence.** When a debt is cleared, the full-screen beat reads **"Freed $50/mo now flows to Next
debt."**, says the same sentence to a screen reader, and puts it on a **ShareCard**. On a weekly debt
the money actually freed per month is **$216.67**. The app under-states the user's own win by **4.33×**,
on the one screen the product is built toward.

**`file:line`** — `apps/rn/src/store/payoffCelebration.ts:78` — `freed: subject.minimumPayment,` —
rendered as `freedPerMonth` at `apps/rn/src/components/plan/PaidOffBeat.tsx:132`, spoken at `:100`,
shared at `:152`, mounted at `apps/rn/src/app/(tabs)/index.tsx:582-586`.

**The measurement** — [`class4-reaudit3-probes/freed-per-month.ts`](class4-reaudit3-probes/freed-per-month.ts),
through `detectPayoff` itself (the production producer), monthly payer (`cyclesPerMonth = 1`):

| shape | says freed /mo | truly freed /mo | |
|---|---|---|---|
| plain · monthly *(control)* | $50 | $50 | ✅ |
| **plain · weekly** | **$50** | **$216.67** | **4.33×** |
| **plain · biweekly** | **$50** | **$108.33** | **2.17×** |
| **BNPL · weekly** | **$50** | **$216.67** | **4.33×** |

⭐ **The control row is the proof of axis**: the monthly debt is exact, so the error is *cadence*, not
arithmetic. ⚠️ **And the BNPL row shows this is not a `R2-5` regression** — the site was wrong for BNPL
before round 2 touched anything. It is in cumulative scope because `A3-1`'s stated rule (*a cadence is a
fact about the SCHEDULE, not about the debt's label*) and `R2-5`'s enumeration are both false here.
**This is the sixth consecutive undercount of this site list** (5 → 6 → 7 → 8, 9 → 10).

**Mechanism (HYPOTHESIS).** `bnplMonthlyEquivalentMinimum` is the declared producer of *"this debt's cost
per month"* and has 4 call sites, all of them projection engines. `payoffCelebration` computes a
per-month figure without going near it — it is not a projection, so it was never in the population
anybody enumerated. The field name (`freed`) does not carry the unit; the unit only appears two files
away, in the prop name `freedPerMonth` and the string `/mo`.

**Remedy (UNVERIFIED).** `freed: bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth)` — which needs
`cyclesPerMonth` threaded into `detectPayoff`, and per `A5-1` that parameter must be **required**, so
every caller becomes a typecheck error rather than a silent monthly assumption. ⚠️ A second, smaller
defect rides along and the remedy must not miss it: the producer itself reads `debt.minimumPayment`
rather than `bnplInstallmentAmount(debt)` (`bnplPayoffPace.ts:69`), so an installment-native plan whose
`scheduledPaymentAmount` differs from `minimumPayment` is under-read again — measured $50 where the
per-charge figure is $80. Round 2 graded that shape near-unreachable (the normalizer equalises them on
any ordinary write), so it is recorded, not claimed.

---

## Measured, and found NOT to be a defect

### ⭐ `R2-6`'s repair of `A3-1` and `A3-2` is real — both own assertions fail when reached

The brief asked for this to be **re-measured**, not taken from the `proofNote`. Applied the shared
registered plant (`selectors.ts`, both parts) **and** replaced `inWindowMinimum.test.ts`'s `assert` throw
with a non-throwing `WOULD-FAIL` log, so every row is evaluated instead of the suite stopping at its
first red. Both files restored, `cmp` IDENTICAL (12,534 / 14,311 bytes).

```
XX WOULD-FAIL [fallback BNPL · weekly — reserves 4 × $50 = $200, not a multiple of it (got $800)]   ← A2-1
XX WOULD-FAIL [⛔ A3-1 · fallback BNPL — and declares NO shortfall on a $300 paycheck … (got $500)]   ← A3-1's OWN
XX WOULD-FAIL [⛔ A3-2 · fallback BNPL — the production path and a direct allocator call … ($800 vs $200)] ← A3-2's OWN
```

`A3-1`'s $3,000 → $300 fixture cut is a genuine repair: the assertion that was **green under its own
defect** now prints a $500 shortfall and fails. `A3-2`'s convergence assertion likewise. ⚠️ The
installment-native shape passes all three rows, which is why the first red is the *fallback* one — worth
knowing before reading a future `prove:guards` line.

### ⚠️ `A2-3` and `A2-4` are still proven by a sibling's red — **disclosed, and I re-measured that it is a disclosure rather than a claim**

Same technique, each against its own registered plant:

| entry | its own token's assertion, under its own plant | the row that actually reds |
|---|---|---|
| `S1-CLASS4-A2-3` | `✓ a 2-installment window → '2 × $100'` — **passes** | `A2-8`'s *"a PLAIN debt's multiplied row explains itself as 4 × $100 (got undefined)"* |
| `S1-CLASS4-A2-4` | `✓ History reports the money the rollover actually deducted (S1P3-A2)` — **passes** | `A3-14`'s *"a WEEKLY debt reports its full in-window paydown … expected 125, got 25"* |

Round 2 **claimed exactly this** in both `proofNote`s and set each `expect` to the sibling's token, so the
record is honest and `R2-6`'s stated remedy (*"say so in `proofNote` instead of borrowing a neighbour's"*)
was followed. ⚠️ **The residual is that nothing distinguishes them mechanically**: `lint:finding-guards`
reports *"166 proofs EXECUTED"* with these four counted the same as an entry proven on its own assertion.
That is a ledger precision gap, not a false closure — and it is the same gap `R3-3` describes, so it is
recorded there rather than opened twice.

⚠️ **One thing worth noting rather than filing:** `A2-3`'s token guards the **BNPL** row (`2 × $100`)
while its finding is about **plain debts**, and `A2-8`'s token guards the plain-debt row while its finding
is about the pinning assertion. The tokens are effectively crossed. Coverage is complete between the two
and either deletion still reds the gate, so there is nothing to fix; it will mislead the next reader.

### ⭐ `R2-5`'s new identity 3 can fail, and its control is the reason

`testCadenceIdentity.ts:271-320` asserts a plain weekly debt projects identically to a weekly BNPL. Both
sides now run the same code path, so **that assertion alone is true by construction** — it is a deletion
detector for the `type` ternary and nothing more. ⭐ **The control saves it**: *"a MONTHLY debt still pays
down more slowly than a weekly one"* (`<=` throws). Under the obvious wrong fix — flatten everything to
`minimumPayment` — `plainMonthly === plainWeekly` and the control throws. So *"rate everything by
cadence"* is distinguishable from *"rate everything the same"*, which is exactly what the comment beside
it claims. Sound.

### ⛔ `buildSmartInsights` carries the same `R3-4` defect and is **NOT a finding, because nothing renders it**

`packages/core/insights/buildSmartInsights.ts:94-95` states *"Eliminating it would free
{minimumPayment} in future minimums"* and `:32-40` ranks the candidate by `minimumPayment / balance` —
both cadence-blind, both the `R3-4` class, and the ranking would mis-order a weekly debt against a
monthly one. ⛔ **`analysisSelectors.ts:143` records it as intentionally not surfaced (2.2.5 scrapped,
🎯 2026-07-22)** and `grep` finds no other consumer in `apps/rn/src`. **Reported as dead code, not as
money on a screen.** ⚠️ I checked the mount before writing the finding precisely because the sibling
site (`PaidOffBeat`) *is* mounted — the two look identical in a grep.

### The `R2-5` widening pairs correctly with the `apr` gate at all four sites, including the shapes the brief named

Read against `bnplPayoffPace.ts:52-70` and `bnplInstallment.ts:188-232`:

- **`one-time`** — `isOneTimeBnplLump` still requires `type === 'bnpl'`, so a **plain** one-time debt
  takes `BNPL_MONTHLY_FACTOR['one-time'] ?? 1` → factor **1**, unchanged by the widening. Its reserve
  agrees: `bnplInstallmentsInWindow` counts exactly 1 (`advanceDueDateOnce` returns the same date).
  `buildPayoffTrajectory`'s `oneTimeLump:` stays label-gated beside the now-cadence-gated
  `minimumPayment:`, and that pairing is still consistent.
- **`per-paycheck`** — factor is `cyclesPerMonth`, and the reserve counts exactly one charge per
  pay-cycle window. They agree. All live callers pass a real `payCyclesPerMonth(store.paycheck.payCycle)`
  (`balanceSelectors.ts:22`, `:52`); no caller passes a constant.
- **no `recurrence` at all** — `recurrence ?? 'monthly'` → factor 1, and `hasKnownBnplCadence` is false,
  so the reserve returns the stored minimum. They agree.
- The `apr` ternary is a different rule (BNPL carries no interest) and is untouched at all four sites.

⚠️ **One consequence of `R2-5` that is real and that I am recording rather than filing:**
`projectCurrentBalance` is the *estimate* of an unverified balance, and the repo's stated bias for it is
conservative — over-state what is owed (`testProjectCurrentBalance.ts:78`). Rating a plain sub-monthly
debt at 4.33× pays the estimate down faster, so it now **under**-states, and `isDebtProjectedPaidOff`
(`projectCurrentBalance.ts:126` → `balanceSelectors.ts:118`) fires the provisional payoff gate
correspondingly sooner. That is the *correct* behaviour if the cadence is real — which is `A3-1`'s
premise and 🎯's 2026-08-29 call — so it is a consequence of a settled decision, not a defect. Naming it
because nothing in round 2's write-up does.

### The harness's `expect` default changed nothing for passes 1–7

All **10** entries carrying no explicit `expect` are class-4 entries (`A3-7`, `A2-1`, `A3-4`, `A2-2`,
`A3-14`, `A3-12`, `F3`, `F6`, `F7`, `R2-1-CAP`); `prove-guards.ts:525` is `p.expect ?? …`, so every one of
the 166 explicit values is preserved unchanged. ⚠️ The change landed in `2560ddec` and six entries were
re-recorded **at that same sha**, so the record cannot say whether they were proven before or after the
edit — re-run read-only to settle it:

```
npx tsx --tsconfig tsconfig.json scripts/prove-guards.ts \
  --id=S1-CLASS4-F7-HEADSUP,S1-CLASS4-R2-1-CAP --no-record
  ✅ S1-CLASS4-F7-HEADSUP   plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
  ✅ S1-CLASS4-R2-1-CAP     plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```

⭐ The default is **sound for a label-shaped token**, and the reason is `introducedLines`: the green run
prints `✓ <label>` and the planted run prints `FAIL [<label>]`, which is a different line, so the token
is found in a line the plant introduced. It would be unsound for a code-shaped token — which is why the
84 entries in `R3-3` keep their explicit `expect`, and why the rule round 2 documented cannot be made
uniform.

---

## Not re-opened, per `ROUND-3-START-HERE.md`

`S1-ROUTE-STALE-READ` / `S1-ROUTE-EXIT-REACHABLE` (the two permanently-stale proofs, unfalsifiable on a
swept tree) and the mechanical derivation of the cumulative count (`.12.6.9`) were left alone
deliberately. I did not touch either.

## The cumulative count, derived two ways

The brief asks for two derivations and says a disagreement is itself a finding. **They agree at 120.**

| | |
|---|---|
| **A — from the brief's own arithmetic** | class 1 = 11 + 15 + 11 + 14 + 16 + 12 + 15 + `W9b` = **95**; + class 4's 11 + round 1's 8 + round 2's 6 = **120** |
| **B — enumerated out of the files** | `CLASSIFICATION.md`'s class table: class 1 = 11, class 4 = 11 · `CLASS1-REAUDIT` `R1…R15` = 15 · `-2` `N-1…N-11` = 11 · `-3` `T1…T14` = 14 · `-4` `U1…U16` = 16 · `-5` `V1…V12` = 12 · `-6` `W1…W15` = 15 → 94, **+ `W9b` (`DEBT_ELEVATION_LOG.md` only) = 95**; + 11 + 8 + 6 = **120** |

⚠️ **B took two attempts, and the first was silently short.** Counting `### \`ID\`` headings returns
**0** for `CLASS1-REAUDIT` through `-4`, because those four rounds head their findings differently
(`### D1-1 — CLOSED`, prose ids) — a heading-shaped enumeration reports *zero findings* over four files
and does not error. Re-run as a regex over the id spellings themselves, the six counts are 15 / 11 / 14 /
16 / 12 / 15, complete and contiguous. **A structural enumeration over documents whose structure varied
is the same failure as the `grep | head` one, and it fails silently in the same direction.**

⚠️ **And B is only reachable because the brief told me `W9b` exists.** A file-driven enumeration of this
directory returns **94 + 11 + 8 + 6 = 119** and reports no error, which is exactly why the count has been
wrong in three consecutive briefs. The two derivations here are not independent — they share the same
out-of-band fact — so **this agreement is weaker evidence than it looks**, and `.12.6.9` remains the real
fix. With this round's 4 findings the population becomes **124**.

---

## Summary

| id | severity | |
|---|---|---|
| `R3-1` | **major** | the sole guard for `F3`/`F6`/`F7`/`R2-1` is green under a 2× defect in the one producer every one of its 15 assertions is written against — and `R2-1`'s own fix is what removed the last independent term |
| `R3-2` | **major** | `R2-1`'s `Math.round` announces 2 payments of $50 against a $75 balance; its guard samples only balances below one charge, so the interval where the defect lives is unsampled |
| `R3-3` | **major** | `R2-6`'s remedy is half code, half a docblock claim — the claimed check exists nowhere and would fire on **84 legitimate entries**; `expect` is optional again in one harness and required in the other |
| `R3-4` | **major** | the payoff celebration says *"Freed $50/mo"* where a weekly debt frees $216.67 — the `R2-5` class at the sixth undercounted site, on screen, in speech, and on a ShareCard |

**Closed, and proven closed:** `R2-6` for `A3-1`/`A3-2` (both own assertions re-measured red);
`R2-2` in the narrow sense — the three production fixes now revert red, via
`inWindowReaders.test.ts` — ⚠️ **but see `R3-1` for what that file cannot see.**
**Closed with a residual:** `R2-1` (`R3-2`), `R2-5` (`R3-4`), `R2-6` (`R3-3`).
**Not re-audited:** `R2-3` and `R2-4` — the boundary was verified green at `1cebd764` before dispatch
and I committed nothing, so no gate result here is stale; the count is re-derived above.

**Tree left clean:** only `CLASS4-REAUDIT-3.md` and `class4-reaudit3-probes/`. **Six plants across five
files, every one restored and verified with `cmp` against a copy taken before the plant** — never
`git diff`, never `git checkout --`: `bnplInstallment.ts` (20,411) · `guardianSelectors.ts` (56,666) ·
`selectors.ts` (12,534) · `inWindowMinimum.test.ts` (14,311) · `deriveRequiredActionView.ts` (7,283) ·
`testDeriveRequiredActionView.ts` (10,113) · `testPayCycleHistoryRegression.ts` (11,044). All probe files
live outside `apps/rn/`. Nothing committed, nothing recorded to `finding-guards.json`
(`prove:guards --no-record`).
