# Class 4 — re-audit **4**

**Auditor:** fresh session, never wrote round 3's fixes. `[D79]` step **b**, round 4.
**Base:** `1cebd764` → **`bc2151ff`** (head of `v1.7-dev`). Tree clean at start, `origin/v1.7-dev` matched,
0 unpushed. Boundary verified green at `bc2151ff` immediately before dispatch and **I committed nothing**,
so no gate result quoted here is stale.
**Probes:** [`class4-reaudit4-probes/`](class4-reaudit4-probes/).

**Worst-case spend, declared before starting:** scoped `npx tsx` runs (one file per run, seconds each) and
`node` scripts over the registry JSON; **no whole-monorepo typecheck, no sub-agents**, `NODE_OPTIONS`
pinned to `--max-old-space-size=1536` on every run. No servers or watchers started.

---

## The fix set, derived from the diff (not from the finding list)

`git diff --stat 1cebd764..HEAD -- apps packages scripts` — **11 files, +452/−66**, over 14 commits
(`76aaf34d` … `bc2151ff`).

| file | Δ | what round 3 did |
|---|---|---|
| `scripts/check-finding-guards.ts` | +56/−5 | **`R3-3`** — the **borrow refusal**; `expect` made optional; `proofNote` declared; `MIN_ENTRIES` 296→300; `MAX_AUTHORED` 10→9 |
| `scripts/prove-guards.ts` | +41/−5 | **`R3-3`** — `proofNote` declared; the false docblock replaced; a proof with **neither** `expect` nor `token` refused at selection; `?? ''` removed |
| `scripts/test-gate-plants.ts` | +38 | `[R3-3-borrow]` scenario, `MIN_SCENARIOS` 25→26 |
| `scripts/finding-guards.json` | +151/−22 | 4 new entries (300), 4 new `proofNote`s, proofs re-recorded/drained |
| `apps/rn/src/store/guardianSelectors.ts` | +34/−9 | **`R3-2`** — `Math.round`→`Math.ceil`; the sentence states the **total** (`formatWhole(best.reserved)`) instead of `about $X each` |
| `apps/rn/src/store/inWindowReaders.test.ts` | +94 | **`R3-1`** — literal money anchors |
| `apps/rn/src/store/payoffCelebration.ts` | +20/−1 | **`R3-4`** — `freed: bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth)`, the parameter **required** |
| `payoffCelebration.test.ts` · `store.ts` · `storeActions.test.ts` · `trustSelectors.test.ts` | +84/−15 | `R3-4`'s guard and the 18 threaded call sites |

---

## Findings

### `R4-1` — **blocker** · `R3-4`'s fix makes the payoff beat announce a **one-time BNPL's whole balance as recurring monthly cash** — *"Freed $600/mo"* — and it is a **12× regression** on the exact shape the producer's own docstring says every caller must exclude

**Consequence.** `bnplMonthlyEquivalentMinimum` returns **`roundMoney(debt.balance)`** for a one-time
(pay-in-30) BNPL — deliberately, and its module header says why: *"A ONE-TIME (pay-in-30) BNPL is not a
recurring minimum at all — it's a single lump … it must be **EXCLUDED** from the recurring monthly budget
(else its balance re-appears as phantom 'freed' cash every later month). **Callers use
`isOneTimeBnplLump`** to keep it out of `totalMinimums`."*

⛔ `payoffCelebration` is the **first caller that does not**, and it is the only caller that shows the
value to a human as a **per-month** figure. Clearing a $600 Klarna Pay-in-30 whose `minimumPayment` is $50
now renders **"Freed $600/mo now flows to Next debt."** — on the full-screen beat
(`PaidOffBeat.tsx:132`), spoken to a screen reader (`:100`), and printed on a **ShareCard** (`:152`).
**Before round 3 it said $50.** The literal phantom-freed-cash sentence in the producer's own header is
now on the product's payoff screen.

**`file:line`** — `apps/rn/src/store/payoffCelebration.ts:96` —
`freed: bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth),`

**The measurement** — [`class4-reaudit4-probes/r4-freed-shapes.ts`](class4-reaudit4-probes/r4-freed-shapes.ts),
through `detectPayoff` itself, `subject` taken from `crossed ⊂ liveBefore` so its balance is the
**pre-payoff** one:

| shape | OLD `freed` | NEW `freed` | rendered |
|---|---|---|---|
| monthly plain *(control)* | $50 | $50 | ✅ *"Freed $50/mo"* |
| weekly plain *(the fix's target)* | $50 | $216.67 | ✅ |
| **one-time BNPL · bal $600 · min $50** | **$50** | **$600** | ⛔ *"Freed **$600**/mo"* — **12×, a REGRESSION** |
| one-time BNPL · bal $600 · min $600 | $600 | $600 | ⛔ still a lump stated per month |
| one-time **plain** · bal $600 · min $50 | $50 | $50 | ✅ `isOneTimeBnplLump` requires `type === 'bnpl'` |

⚠️ **`min ≠ balance` is representable on exactly the shape that reaches this**: a **fallback** one-time
BNPL (`type: 'bnpl'` + `recurrence` + `dueDate`, no installment fields) is **not** `isInstallmentNative`,
so `normalizeBnplInstallment` returns it **unchanged** and never equalises `minimumPayment` to the
balance. That is the CSV-import / pre-2.7.2-backup shape this cluster has been chasing since `A3-1`.

⛔ **The guard `R3-4` shipped cannot see it, in EITHER direction.** `payoffCelebration.test.ts:157-205`
iterates `monthly / weekly / biweekly / BNPL-weekly` — no `one-time` row. Baseline **green, 28 asserts**;
with the *correct* behaviour planted (`isOneTimeBnplLump → 0`), the suite is **still green, 28 asserts**.
Nothing pins this value at all. Plant restored, `cmp`-verified **identical to `HEAD`** at 5,928 bytes.

**Mechanism (HYPOTHESIS).** `bnplMonthlyEquivalentMinimum` has **two return contracts in one function**:
a monthly rate for a recurring plan, and *the whole lump* for a one-time one. The second is only correct
for a caller that feeds it to a payoff loop **and** carries the `oneTimeLump:` flag beside it —
`buildPayoffTrajectory.ts:66-68` and `projectDebtPayoff.ts:116-120` both do; `projectCurrentBalance.ts:87`
and `analysisSelectors.ts:194` are unpaired but harmless because clearing the lump in month 1 is what
they want. Round 3 read that pairing at four sites, wrote *"the `R2-5` widening pairs correctly with the
`apr` gate at all four sites"* — **and then created the fifth site without the pairing, in the same
round.** ⚠️ **This is `audit-site-lists-undercount` at the seventh consecutive undercount**, and this time
the undercount was committed by the round that was writing about it.

**Remedy (UNVERIFIED).** `freed: isOneTimeBnplLump(subject) ? 0 : bnplMonthlyEquivalentMinimum(…)`.
⭐ **I checked the render before proposing the number, because `0` is normally a falsehood of its own
here:** both consumers already gate on it — `PaidOffBeat.tsx:81` is
`showCascade = nextDebtName != null && freedPerMonth > 0` (screen **and** the spoken string at `:100`) and
`ShareCard.tsx:56` is `data.freedPerMonth > 0`. So `0` **drops the "Freed …" clause everywhere** rather
than rendering *"Freed $0/mo"*, which is the honest outcome: a lump frees no recurring money. ⚠️ **This is
the half of the remedy to re-verify first** — it is a claim about three render sites, not about the
selector. ⛔ **Whichever is chosen,
add a `one-time BNPL` row AND a `one-time plain` row to `payoffCelebration.test.ts`'s iteration** — the
`type === 'bnpl'` half of `isOneTimeBnplLump` is the only thing keeping the plain shape correct and
nothing asserts it.

**Severity: blocker.** It is a money figure on the product's payoff moment, it is a regression introduced
by this round, and it is on the ShareCard — the one surface that leaves the app.

### `R4-2` — **major** · `R3-3`'s own fix left the hole it was written to close **half open**, and the comment stating it is shut is the SIXTH comment-as-expired-claim in this workstream — measured: `expect: ""` still prints ✅ with **no `reason=` at all**

**Consequence.** `prove:guards` is the harness that certifies all **300** registry closures. An entry whose
proof carries **`expect: ""`** and a `token` is selected, planted, and scored **`✅ … plant-applied=YES ·
planted=exit 1 · control=exit 0`** — **exit 0, and no `reason=` field on the line.** The attributability
check never runs: the entry is recorded proven off nothing but a non-zero exit code, which is precisely
the state `R3-3` was closed to make unrepresentable. ⛔ **A run that reds for an unrelated reason —
a compile error, a wrong tsconfig, a dead server — is indistinguishable from the guard doing its job.**

**`file:line`** — `scripts/prove-guards.ts:536-539`

> *"The `?? ''` that used to close this expression is gone: a proof with no token is refused at selection
> now, so **there is no path here that reaches `verdict()` with nothing to attribute the red to** [R3-3]."*
> `const expected = p.expect ?? e.token!;`

…and the refusal it points at, `scripts/prove-guards.ts:735`:
`if (registry[id].proof && !registry[id].proof.expect && !registry[id].token)`.

**The measurement** — [`class4-reaudit4-probes/r4-empty-expect.mjs`](class4-reaudit4-probes/r4-empty-expect.mjs).
Four hermetic entries against the harness's own `__fixtures__` target, each run as a real subprocess
(`npx tsx scripts/prove-guards.ts --registry=… --id=FIXTURE --no-record`), registry file removed after
every case:

| fixture | exit | verdict line | `reason=` |
|---|---|---|---|
| **A** · `expect` **absent**, token present *(control)* | 1 | `❌ … reason=WRONG` | YES |
| ⛔ **B** · **`expect: ""`**, token present | **0** | **`✅ … planted=exit 1 · control=exit 0`** | **NONE** |
| **C** · `expect: ""`, **no** token *(control)* | 1 | `HARNESS FAULT … carries a proof with neither` | — |
| **D** · `expect` a string nothing prints *(control)* | 1 | `❌ … reason=WRONG` | YES |

⭐ **Three controls, and they are what make row B mean something**: A and D prove the reason check is
live and can fail on this exact fixture, C proves the new selection fault does fire when **both** are
absent. Only the empty-string-with-a-token combination slips through.

**Mechanism (HYPOTHESIS).** Two operators disagree about what "absent" means.
`p.expect ?? e.token!` uses **`??`**, which falls through on `null`/`undefined` **only** — so `''` is kept
rather than replaced by the token. `verdict()` then gates on **truthiness**:
`if (expect && withPlant.status !== 0 && …)` and `const reason = expect ? … : null`
(`scripts/lib/verdict.ts:113,117`). The new selection fault uses truthiness on `expect` but **ANDs it with
`!token`**, so it only catches the both-absent case — which was the case round 3 measured at 0 and made
unrepresentable, while the sibling case at the same 0 was left representable. ⚠️ **The borrow refusal
cannot cover it either**: `e.token.includes('')` is `true` for every token, so
`check-finding-guards.ts:534` skips an empty `expect` unconditionally.

⚠️ **Not currently instantiated — `emptyExpect = 0` of 180 proofs** — which is round 3's own stated
trigger for closing it: *"0 such entries exist, which is exactly when to make it unrepresentable."*

**Remedy (UNVERIFIED).** Refuse a proof whose **effective expectation is blank**, at selection, beside the
existing fault:

```ts
const eff = registry[id].proof?.expect ?? registry[id].token;
if (registry[id].proof && (eff === undefined || !eff.trim())) fault(id, …);
```

⭐ **Fire-count measured BEFORE writing it down**, per this cluster's standing rule —
[`r4-blank-expect-firecount.mjs`](class4-reaudit4-probes/r4-blank-expect-firecount.mjs) over the live
registry: **0 of 180** (blank `expect` 0 · both-absent 0 · blank `token` 0). It subsumes the current fault
rather than sitting beside it. ⚠️ **It needs a `--selftest` case**, because `.16.5` records that round 3's
first cut of this same fault broke two of five existing controls — the narrowed form that shipped is
**still unguarded**, and this widening would be too.

### `R4-3` — **minor** · the borrow refusal's `proofNote` exemption is tested **before the lenders are computed**, so ANY non-empty note waives it unconditionally — **10 entries hold that waiver today, 3 of them minted by round 3, and none of the 10 is a borrow**

**Consequence.** `proofNote`'s declared contract is *"a disclosure, **not a waiver**: it must say which
entry's assertion fires and why this finding has none of its own"* (`prove-guards.ts:92-95`). The code
implements a waiver: any non-empty string on any entry disables the borrow check for that entry
**forever**, whatever the note is about. ⛔ **A borrow written into one of those 10 entries is invisible to
both harnesses** — `lint:finding-guards` skips it, and `prove:guards` cannot catch it either, because a
borrowed `expect` is *by definition* printed by the sibling's red, so `verdict()` returns
`reason=MATCHED`. That is the exact defect `R3-3` was built to refuse.

**`file:line`** — `scripts/check-finding-guards.ts:534`

```ts
if (expect !== undefined && !e.token.includes(expect) && !e.proof.proofNote?.trim()) {
  const lenders = …                       // ← computed INSIDE, after the exemption already passed
```

**The measurement** — [`class4-reaudit4-probes/r4-proofnote-exemption.mjs`](class4-reaudit4-probes/r4-proofnote-exemption.mjs)
over the live registry:

| | |
|---|---|
| entries carrying `proofNote` | **14** |
| of those, actually borrow-shaped *(an `expect` in another entry's token)* | **4** — `A3-1`, `A3-2`, `A2-3`, `A2-4` |
| ⛔ **holding an unconditional waiver while not being a borrow at all** | **10** |
| of those 10, **minted by round 3** | **3** — `S1P7-R3-1-ANCHOR`, `S1P7-R3-2-HEADSUPTOTAL`, `S1P7-R3-4-FREEDPERMONTH` |

The 10 all have `expect: undefined` today, so **nothing is wrongly exempted right now** — this is a latent
fail-open that one later edit turns live, which is the same posture round 3 used to justify closing the
`token`/`expect` hole at 0 instantiations (*"0 such entries exist, which is exactly when to make it
unrepresentable"*). ⚠️ Round 3's own three notes are about **anchor derivation** (*"the bare token appears
TWICE in the producer"*, *"TWO-PART UN-FIX"*, *"the earlier assertion at :54 also reads `freed`"*) — good
disclosures, about something else entirely, that happen to buy a permanent exemption from a different gate.

⭐ **And I checked the four real ones before claiming anything about them:** each note **does** name its
lender (`"SHARES A2-1's RED"`, `"SHARES A2-8's RED"`, `"SHARES A3-14 RED"`) — in the short id spelling, not
the registry-key spelling. **The disclosures are genuine.** A first pass matching full ids reported *"names
a lender: NO"* on all four; that was **my matcher, not their notes**, and it is exactly the
`run-the-control-on-the-verifier` shape.

**Mechanism (HYPOTHESIS).** The exemption and the detection are at two different altitudes. *"Is this a
borrow?"* is a property of `(expect, lenders)`; *"has it been disclosed?"* is a property of the note. Round
3 short-circuited on the cheaper test first, which is the natural way to write it and which makes the
expensive test — the one that defines the class — unreachable for any entry carrying a note.

**Remedy (UNVERIFIED).** Move the `proofNote` test **inside**, past `lenders`, and require the note to
**name one of them**:

```ts
if (expect !== undefined && expect.trim() && !e.token.includes(expect)) {
  const lenders = …;
  const discloses = lenders.some((l) => note.includes(l) || note.includes(short(l)));
  if (lenders.length && !discloses) problems.push(…);
}
```

⭐ **Fire-count measured BEFORE writing it down** — **0**: all four real borrows name their lender in the
short spelling, and the 10 waiver-holders stop being exempt without becoming problems, because none of
them is borrow-shaped. ⚠️ **The `short()` spelling is the load-bearing half of this remedy and it is a
heuristic** (`S1-CLASS4-A2-1` → `A2-1`); test it against the four before shipping, and prefer requiring
the **full id** in new notes over widening the matcher. `expect.trim()` is folded in per `R4-2` — an empty
`expect` must not be silently borrow-clean.

---

## Measured, and found NOT to be a defect

### ⛔ The brief's highest-value lead is **REFUTED**: `formatWhole(best.reserved)` never misstates the reserve by as much as a dollar, and `Math.ceil` is right at every edge round 3 did not sample

The brief asked what the sentence says when the reserve is `$75.49`, or when `roundMoney` leaves cents.
[`class4-reaudit4-probes/r4-headsup-edges.ts`](class4-reaudit4-probes/r4-headsup-edges.ts) — **40 cases**
through `selectBnplBetweenPaycheck` itself, scored against a truth model written independently of the
code (*full charges of `each` land until the balance runs out, then a short final one*):

| attack | cases | count wrong | total wrong |
|---|---|---|---|
| fractional `each` — $33.33 · $16.67 · $12.49 · $41.66 · $8.33 · $24.99 · $66.67 · $3.33, at a large balance and at exactly 2× / 3× each | 24 | **0** | **0** |
| cents balances against a whole `each` — $75.49 · $75.50 · $75.51 · $99.99 · $100.01 · $149.49 · $149.50 · $50.50 · $0.50 | 9 | **0** | **0** ≥ $1 |
| `each` **larger than the balance** ($500 vs $120) | 1 | — | silent, correctly |
| **one-time** BNPL (`bnplInstallmentsInWindow` counts exactly 1) | 1 | — | silent, correctly |
| installment-native where `scheduledPaymentAmount` ≠ `minimumPayment`; `remainingPayments` capping below the cadence count | 5 | **0** | **0** |

⭐ **The "hair over a multiple" attack the brief named cannot occur**, and the reason is mechanical rather
than lucky: `effectiveMinimumInWindow` returns `roundMoney(…)` (`bnplInstallment.ts:318`), so `reserved` is
always an exact hundredth. `150.00000000000003` is not representable as its output —
`roundMoney(150.00000000000003) === 150` — so `ceil(reserved / each)` never sees a float residue. The eight
fractional `each` values are the direct test of the same claim, and all 24 rows agree.

⚠️ **The only disagreement anywhere is the formatter's exact-half round**: a $75.50 reserve prints
*"about $76"*, $149.50 prints *"about $150"*, $50.50 prints *"about $51"* — **50¢, hedged by the word
"about"**, on a whole-dollar formatter chosen deliberately. ⚠️ **One degenerate hole exists and I am
recording it rather than filing it:** `formatWhole` clamps anything rounding to zero (`format.ts:20`), so a
reserve under $0.50 would print *"about $0"*. Reaching it needs `count ≥ 2` on a reserve under 50¢, i.e.
`each < $0.25` — a sub-quarter installment plan. Not a shape this app can produce.

### ⭐ The literal anchors' clock-safety argument is **TRUE**, walked rather than reasoned — including the three-`new Date()` skew

`inWindowReaders.test.ts:35-43` builds `CURRENT`/`NEXT`/`DUE` from **three separate `new Date()` calls**,
and its header argues from arithmetic that the window always holds four charges.
[`r4-clock-walk.ts`](class4-reaudit4-probes/r4-clock-walk.ts) reproduces `day()` exactly and asks the real
producer over **730 consecutive start days** (both DST transitions twice, leap February):

```
charges-in-window histogram: [ [4, 730] ]      owed histogram: [ [200, 730] ]
rows disagreeing with CHARGES_IN_WINDOW=4 / OWED_WEEKLY=200: 0
```

⭐ **And the skew the brief pointed at is enumerated, not assumed** — every pattern of which of the three
`day()` calls landed on the later side of a midnight crossing (`DUE` only · `NEXT`+`DUE` · all three) is
`[[4, 730]]`. `day()` uses `setDate(getDate() + n)` and formats local `Y-M-D`, so every offset is a whole
calendar day and DST cannot move it. **Sound.**

### ⭐ All eight registry entries in this cluster red on their own defect — verified with the instrument that GATES

`npx tsx scripts/prove-guards.ts --id=… --no-record`, tree clean, nothing recorded:

```
✅ S1P7-R3-1-ANCHOR        ✅ S1P7-R3-2-HEADSUPTOTAL   ✅ S1P7-R3-3-BORROW      ✅ S1P7-R3-4-FREEDPERMONTH
✅ S1-CLASS4-R2-1-CAP      ✅ S1-CLASS4-F7-HEADSUP     ✅ S1-CLASS4-F3-PAIDROW  ✅ S1-CLASS4-F6-RECOVERY
   all: plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ prove:guards — 8 guard(s) red on their own defect, and the control is green.
```

⚠️ **This does not make `R4-1` any less true.** `S1P7-R3-4-FREEDPERMONTH` reds on the *weekly* axis, which
is the axis it was written for; the one-time shape is in none of its four rows, and I measured separately
that planting the **correct** behaviour leaves the suite green at the same 28 asserts.

### ⭐ `R2-1-CAP`'s re-derived plant restores the ORIGINAL defect, not a neighbouring one

`.16.5` records that `R3-2`'s fix voided this entry's anchor (`const count = Math.round(reserved / each);`
was the exact line it changed) and that the anchor was re-derived and the proof re-run. Read against the
finding: the two-part un-fix restores `bnplInstallmentsInWindow(d, start, end)` as the count **and** the
import it needs, which is precisely `R2-1`'s defect — an **uncapped, pure-cadence** count. The assertion
that reds is `R2-1`'s own (`inWindowReaders.test.ts:216`, a $1 balance must stay silent), not a neighbour's.
⚠️ **The import half is load-bearing and correctly disclosed**: without it eslint reds on an unused import
and the plant would fail to **compile** — *"a plant must make an assertion fail, never throw past it."*

### The `cyclesPerMonth` production seam is correct — and its only live effect is asserted **nowhere**

`store.ts:79` passes `payCyclesPerMonth(next.paycheck.payCycle)`, the identical expression used at every
other call site (`balanceSelectors.ts:22`, `analysisSelectors.ts:54`, `planSelectors.ts:186`, …), and
`payCyclesPerMonth` returns the true annual counts (52/12 · 26/12 · 2 · 1). **Correct.**
⚠️ **But `cyclesPerMonth` is read by `bnplMonthlyEquivalentMinimum` for exactly one recurrence —
`per-paycheck` — and all 18 test call sites pass the literal `1`, including the four rows `R3-4` added.**
Measured through `detectPayoff`: a `per-paycheck` debt under a weekly payer gives $216.67 and under a
biweekly payer $108.33 — **right, and nothing in the suite would notice if it stopped being right.** That
row belongs in `R4-1`'s remedy alongside the one-time rows.

### The plan row's `N × $X` caption cannot contradict the new Guardian sentence

`deriveRequiredActionView.ts:129-134` states the caption **only when `count × scheduled === item.amount`
exactly** (within half a cent) — so on the balance-capped shapes `R3-2` added ($75, $110, $199) the row
shows a bare figure and no multiple, while the Guardian says *"2 payments totalling about $75"*. No
two-screen disagreement. ⚠️ It uses `Math.round` where `guardianSelectors` now uses `Math.ceil`, which
would be the `R2-5` shape — but the exactness test makes the two indistinguishable here. Checked because
they look like one rule spelled two ways.

### The borrow refusal really does fire on **0 undisclosed** entries — and the 84 / 30 misfires really were misfires

[`r4-borrow-census.mjs`](class4-reaudit4-probes/r4-borrow-census.mjs): 300 entries · 180 proofs · 167 with
an explicit `expect` · **89** whose `expect` is not in their own token *(the rule as `R2-6` documented it —
measured at 89 now rather than 84, because round 3 added entries)* · **4** borrow-shaped · **0** firing.
Round 3's claim holds.

⚠️ **Two blind spots in it, recorded rather than filed** — neither is a defect the round introduced, both
are limits of a new check: (a) if a **lender's token is edited** after the borrow is written, `lenders`
goes empty and the borrow stops being detectable statically — and this cluster has corrected tokens **four
times**; (b) the check sits after several `continue`s, so an entry whose token is comment-only, or whose
guard file is gone, is never asked. Both fail toward silence.

### Not re-opened, per the brief

`S1-ROUTE-STALE-READ` / `S1-ROUTE-EXIT-REACHABLE` (the two permanently-stale route proofs) and the
two-pass drain / drain-exemption narrowing filed to `.12.6.9`. ⚠️ **One number worth handing forward
without opening it:** [`r4-ratchet-headroom.mjs`](class4-reaudit4-probes/r4-ratchet-headroom.mjs) —
`authored = 9` against `MAX_AUTHORED = 9`, so the **headroom is 0** and the very next registered proof
re-enters `.16.1`'s deadlock (author → `lint:finding-guards` red → `test:gate-plants` controls red →
`prove:guards` refuses to record the thing that would clear it). Round 3 ratcheted 10→9 while standing at
9, which is what the cap's own docblock instructs. Stated, not filed.

### Refuted suspicions

- **A registry `expect` deleted rather than disclosed.** The diff shows one `-"expect": "1 cycle"` line.
  [`r4-find-expect-owner.mjs`](class4-reaudit4-probes/r4-find-expect-owner.mjs) parses **both** revisions
  and compares per entry: **no existing entry's `expect` changed**, 4 ids added, 0 removed. The line is a
  trailing-comma reflow inside an entry that kept its value.
- **`S1-CLASS4-R2-1-CAP`'s `what` gone stale.** It still says *"the sentence agrees with the money by
  construction"*, which `R3-2` refuted as a claim about `Math.round`. Read against the shipped code: the
  count **is** still derived from `effectiveMinimumInWindow`, and the sentence **does** now state that
  figure. Still true. Not filed.
- **The Guardian sentence asserted somewhere round 3 did not update.** Searched the repo for the old and
  new spellings: the only consumers are `guardianSelectors.ts`, `inWindowReaders.test.ts` and the
  registry's own un-fix strings. `PaydayGuardianCard.tsx:77` paraphrases it in a comment only.
- **`e.token.includes(expect)` crashing on a token-less entry.** `check-finding-guards.ts:384` `continue`s
  past `!e.file || !e.token` long before the borrow block, so `e.token` is non-`undefined` there. Sound.
- **The four disclosed borrows not naming their lenders.** My first matcher said *"names a lender: NO"* on
  all four. **That was my matcher, not their notes** — they name the lender in the short id spelling
  (`"SHARES A2-1's RED"`). `run-the-control-on-the-verifier`, caught before it became a finding.

---

## The cumulative count, derived two ways

[`r4-cumulative-count.mjs`](class4-reaudit4-probes/r4-cumulative-count.mjs). **They agree at 124.**

| | |
|---|---|
| **A — the brief's arithmetic** | class 1 = 11 + 15 + 11 + 14 + 16 + 12 + 15 + `W9b` = **95**; + class 4's 11 + round 1's 8 + round 2's 6 + round 3's 4 = **124** |
| **B — regex over the id SPELLINGS, out of the files** | `R1…R15` = 15 · `N-1…N-11` = 11 · `T1…T14` = 14 · `U1…U16` = 16 · `V1…V12` = 12 · `W1…W15` = 15, **every run contiguous from 1, no gaps and no strays** → 83; + 11 base + `W9b` + 11 + 8 + 6 + 4 = **124** |

⛔ **I re-ran the control the brief demands, and it is WORSE than recorded.** A heading-shaped enumeration
(``### `ID` ``) returns **0 for five of the six** class-1 rounds — round 3 reported four — and exits 0 with
no error. **A structural enumeration over documents whose structure varied fails silently, in the
direction of reporting nothing.**

⚠️ **The agreement remains weaker than it looks, and I verified the reason mechanically rather than taking
it from the brief:** `W9b` is present in `docs/DEBT_ELEVATION_LOG.md` and in **no findings file in this
directory**. A file-driven enumeration of this directory alone therefore returns **123** and reports no
error. Both derivations depend on that one out-of-band fact, so they are **not independent**. `.12.6.9`
remains the real fix.

**With this round's 3 findings the population becomes 127.**

---

## Summary

| id | severity | |
|---|---|---|
| `R4-1` | **blocker** | `R3-4`'s fix makes the payoff beat announce a one-time BNPL's **whole balance** as recurring monthly cash — *"Freed $600/mo"* against a $50 minimum, a **12× regression**, on screen, in speech and on a **ShareCard**. The producer's own header says every caller must exclude this shape with `isOneTimeBnplLump`, and `payoffCelebration` is the first that does not |
| `R4-2` | **major** | `R3-3` left its own hole half open: `expect: ""` with a token still reaches `verdict()` and prints **✅ with no `reason=` at all** — measured in a subprocess against three controls — while the comment above it states there is no such path. **Sixth comment-as-expired-claim, inside a comment written to replace one** |
| `R4-3` | **minor** | the borrow refusal tests `proofNote` **before** computing the lenders, so any note waives it unconditionally — **10 entries hold that waiver, 3 minted by round 3**, none of them a borrow. Latent until one later edit, and neither harness would catch it then |

**Closed, and proven closed:** `R3-1` (the anchors red under the 2× producer plant, and the clock-safety
argument holds over 730 days and every midnight-skew pattern) · `R3-2` (`ceil` and the stated total are
correct at all 40 edge cases, including every one the brief named) · `R3-3` **in part** (the borrow
refusal is real, fires on 0 undisclosed entries, and is guarded by a gate plant proven both directions) ·
`R3-4` **in part** (the weekly/biweekly axis is fixed and guarded).
**Closed with a residual:** `R3-3` (`R4-2`, `R4-3`) · `R3-4` (`R4-1`).

⚠️ **Two of round 3's four audit remedies would have introduced a defect; I held mine to the same
standard.** `R4-1`'s `0` is only safe because **three** render sites already gate on `freedPerMonth > 0` —
I read them before proposing the number, and my first draft warned against exactly the fix that turns out
to be correct. `R4-2`'s and `R4-3`'s rules were **fire-counted on the live registry before being written
down** (0 and 0), per this cluster's standing rule.

**Tree left clean:** only `CLASS4-REAUDIT-4.md` and `class4-reaudit4-probes/`. **One plant, in byte mode,
restored and verified with `cmp` against `HEAD`** — `payoffCelebration.ts` (5,928 bytes); never
`git diff`, never `git checkout --`. `prove:guards` run `--no-record`; `git diff --stat` against `HEAD` is
empty. All probe files live outside `apps/rn/`. ⚠️ **One stray zero-byte file was created inside
`apps/rn/` by a `tsx -e` invocation whose braces the shell expanded** — found by `git status`, removed;
recorded because it is the same class as the auditor whose three red gates turned out to be its own.
**Nothing committed.**
