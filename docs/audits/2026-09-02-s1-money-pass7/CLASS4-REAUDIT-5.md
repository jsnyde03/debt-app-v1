# Class 4 — re-audit 5

> Fresh auditor. `[D79]` step **b**. Auditing round 4 (`bc2151ff..8ccae93f`), 6 code files, +142/−25.
> Boundary verified green at `8ccae93f` before dispatch; **nothing committed by this round.**

**Worst-case spend declared before starting:** no sub-agents; all work is local greps, file reads and
plant/restore runs of `lint:finding-guards`, `prove:guards`, `test:gate-plants` and the single
`payoffCelebration` test file. Longest expected single run ~6 min (`test:gate-plants`, 26 scenarios).
Heap capped at 1536 MB throughout. No whole-monorepo typecheck.

## Status: IN PROGRESS (written incrementally)

---

## `R5-1` — the one-time exclusion is keyed on **BNPL**, so a `type: 'debt'` one-time debt still announces phantom recurring cash · **major** · **(a) reaches outside the instrument stack**

**Consequence.** Clear a **non-BNPL** debt whose `recurrence` is `one-time` and the beat renders
**"Freed $50/mo now flows to <next debt>."** — on screen, in the single VoiceOver utterance, and on the
**ShareCard**. Nothing recurring was freed: the app's own `rolloverPayCycle` never advances a `one-time`
debt's due date (`packages/core/recurrence/rolloverPayCycle.ts:121`), so it never comes due again. The
figure is not merely wrong in magnitude — the whole clause is a statement about money that does not exist.

**`file:line`** — `apps/rn/src/store/payoffCelebration.ts:109`

```ts
freed: isOneTimeBnplLump(subject) ? 0 : bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth),
```

`isOneTimeBnplLump` is `debt.type === 'bnpl' && debt.recurrence === 'one-time'`
(`packages/core/debt/bnplPayoffPace.ts:48`). The `type` half is what leaks.

**The measurement.** `class4-reaudit5-probes/r5-freed-shapes.ts` — the real `detectPayoff`, all **7**
`Recurrence` members × `{debt, bnpl}` × `cyclesPerMonth ∈ {1, 2.17}`, subject `balance 600 · minimum 50`:

| type | recurrence | cpm 1 | cpm 2.17 |
|---|---|---|---|
| debt | **one-time** | **50** ⛔ | **50** ⛔ |
| debt | monthly | 50 | 50 |
| debt | weekly | 216.67 | 216.67 |
| debt | biweekly | 108.33 | 108.33 |
| debt | per-paycheck | 50 | 108.5 |
| debt | quarterly | 16.67 | 16.67 |
| debt | annually | 4.17 | 4.17 |
| bnpl | one-time | **0** ✅ | **0** ✅ |
| bnpl | *(all others)* | *identical to `debt`* | *identical* |

The BNPL row round 4 added is the only one of the two `one-time` shapes that reaches 0.

**Reachability — measured, two independent paths, neither hypothetical:**

1. **CSV import.** `class4-reaudit5-probes/r5-csv-onetime.ts` runs the real `parseDebtCsvText` on
   `Medical bill,600,50,0,2026-09-15,debt,one-time` → **`errors: []`**, and the emitted record is
   `{"type":"debt","recurrence":"one-time","minimumPayment":50}`. `allowedTypes` includes `"debt"` and
   `allowedRecurrences` includes `"one-time"` (`packages/core/imports/debtCsv.ts:36,51`) and **nothing
   cross-checks the pair**.
2. **In-app, no CSV.** `DebtSheet` offers `one-time` in `BNPL_CADENCE`
   (`apps/rn/src/components/entities/DebtSheet.tsx:52`) and its type switch only normalises the *other*
   direction — `onTypeChange` is `if (next === 'bnpl' && recurrence === 'monthly') setRecurrence('biweekly')`
   (`DebtSheet.tsx:183`). Editing a Klarna Pay-in-30 and switching **type → Debt** therefore commits
   `type:'debt', recurrence:'one-time'`; `RECURRENCE` at line 40 deliberately omits `one-time`, so the
   Select renders a value not in its own option list and the state survives to `commit()`.

**Mechanism (HYPOTHESIS).** `R4-1` was framed as *"`bnplMonthlyEquivalentMinimum` returns a one-time
lump's whole balance"* — a statement about the **producer's BNPL branch** — and the fix reached for the
predicate that guards that branch. But the celebration's real question is *"does this debt have a
recurring minimum at all?"*, which is `recurrence === 'one-time'`, and `type` is irrelevant to it. The
round-4 comment in this very file states the general principle — *"a one-time lump frees no recurring
monthly cash"* — while the code implements the BNPL-only special case. Round 4 answered the brief's
"what shape is still missing" lead by adding **one row** to the shapes table and did not re-enumerate the
`{type} × {recurrence}` product; the missing row is the `debt`/`one-time` cell.

**Remedy (UNVERIFIED).** Scope it to the celebration, not to `isOneTimeBnplLump`:
`freed: subject.recurrence === 'one-time' ? 0 : bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth)`,
and add `['debt · one-time', { recurrence: 'one-time', type: 'debt', balance: 600 }, 0]` to the shapes
table. ⛔ **Do NOT widen `isOneTimeBnplLump` itself** — it is read by `projectDebtPayoff.ts:120` and
`buildPayoffTrajectory.ts:68` as the `oneTimeLump` flag that drives the *month-1 clearing payment*, so
widening it changes the debt-free date and the chart for every non-BNPL one-time debt at once. That is a
separate, larger question (the projection engines treat such a debt as a recurring minimum too — see
"measured and NOT a defect / out of scope" below) and it must not ride in on a celebration fix.

**Severity: major, not blocker.** Unlike `R4-1` (whole balance, 12× on the measured shape) the
overstatement is bounded by the minimum payment, and the in-app path requires the user to convert a BNPL
to a debt. It is the same class as `R4-1`, still open, on the same line round 4 wrote.

---

## `R5-2` — the borrow waiver is a **substring** match, so a note naming a *different, longer* id waives the borrow · **minor** · **(b) instrument**

**Consequence.** `R4-3`'s tightening — *"a note that does not name it does not waive it"* — is defeated by
any note that names an id whose short form merely **contains** the real lender's short form. The waived
entry is then recorded proven while the red it rides on belongs to a sibling, which is the exact fail-open
`R4-3` exists to close. This is the harness that certifies every other finding closed.

**`file:line`** — `scripts/check-finding-guards.ts:552`

```ts
const waived = lenders.some((l) => note.includes(l) || note.includes(l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));
```

**The measurement — a real plant into the real registry, three cases, one variable.**
`class4-reaudit5-probes/r5-plant-waiver.py`. Target `S1P3-B3-UNKNOWN` (an entry with an `expect` and
**no** lender today, so it does not enter the complaint). Its `proof.expect` is pointed at
`S1-CLASS4-A3-1`'s token — `"declares NO shortfall on a $300 paycheck"` — which makes `A3-1` its lender.
**Only `proofNote` varies:**

| case | `proofNote` | exit | borrow complaint |
|---|---|---|---|
| **control** — names nothing | `this note names nothing at all` | 1 | **present** ✅ the plant fires |
| **attack** — names `A3-14` only | `shares A3-14's red` | **0** | **ABSENT** ⛔ |
| **positive** — names the real lender | `shares S1-CLASS4-A3-1's red` | 0 | absent ✅ correct |

The attack note **never mentions `A3-1`**. `A3-1` appears in it only as the first four characters of
`A3-14`, which is a *different registry entry* (`S1-CLASS4-A3-14`, a real finding with a real token).
Restore verified byte-identical to the pre-plant copy in the `finally`.

**How wide the exposure is — measured.** `class4-reaudit5-probes/r5-waiver-attack.mjs` enumerates all
302 ids: **20 short forms are substrings of another id's short form.** The worst are the ones that
matter to this cluster —
`A3-1 ⊂ {A3-12, A3-14, A3-12-DATEDOORS, A3-12-DATEDOORS-OVERFIX, A3-17-REALBACKUP, A3-15-PARTITIONSIDE, A3-14-HYSTERESIS}`,
`B5 ⊂ 15 others`, `M1 ⊂ 6 others`, `A5 ⊂ 5 others`, `GAP-1 ⊂ 12 others`. **Live false waivers today: 0** —
all 4 entries that actually enter the branch (`A3-1`, `A3-2`, `A2-3`, `A2-4`) name their true lender, and
all 4 are waived by the **short** form only, never the full id, so the `replace()` is genuinely
load-bearing rather than decorative.

**Mechanism (HYPOTHESIS).** `R4-3` correctly moved the waiver *after* the lender computation and made it
depend on the lender's identity, but expressed "names" as `String.prototype.includes`. Registry ids are a
hierarchical `<pass>-<lane><n>-<m>[-SUFFIX]` scheme in which shorter ids are **by construction** prefixes
of longer ones, so `includes` cannot distinguish "names this entry" from "names a descendant of this
entry's number". The round-4 comment fire-counted the tightening at **0** and stopped there; a fire-count
answers "does it refuse anything legitimate", not "does it accept anything illegitimate", and this is the
second question.

**Remedy — MEASURED, not merely proposed** (`class4-reaudit5-probes/r5-remedy-waiver.py`). Require the id
to appear on a word boundary:

```ts
const namesIt = (n: string, needle: string) =>
  new RegExp(`(^|[^A-Za-z0-9-])${needle}([^A-Za-z0-9-]|$)`).test(n);
const waived = lenders.some((l) => namesIt(note, l) || namesIt(note, l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));
```

Planted into `check-finding-guards.ts` and re-run:

| run | result |
|---|---|
| **fire-count** — live registry untouched, tightened matcher | **exit 0**, `301 of 302 … (cap 1)` — **0 legitimate entries newly refused** |
| control (names nothing) | exit 1, complaint present ✅ |
| **attack** (names `A3-14` only) | **exit 1, complaint present** ✅ — the hole is closed |
| positive (names `S1-CLASS4-A3-1`) | exit 0, silent ✅ — still waived |

Both plants restored byte-identically in the `finally`; `git status --short` after the run showed only
this audit's own files. ⚠️ No regex escaping is needed because ids are `[A-Za-z0-9-]` only — that is a
premise of the remedy, and if the id alphabet ever widens the template becomes an injection.

**Severity: minor.** Latent, not live: exposure is 0 today and the fail-open needs a future entry whose
note happens to name a numeric descendant of its own lender. It is recorded because the branch's whole
purpose is to refuse exactly this, and because `A3-1`'s seven descendants make the collision the *normal*
shape in this registry rather than a contrived one.

---

## `R5-3` — the `[R3-3-borrow]` scenario's exit code is **structurally vacuous**, and round 4's comment states a failure mode that cannot occur · **minor** · **(b) instrument**

**Consequence.** A reader of `test-gate-plants.ts` is told the scenario's plant is caught because the gate
*"goes GREEN under its own plant, which `test:gate-plants` reports as **failed-open**."* Neither half is
true. The scenario can never fail open — its planted run reds on **three unrelated problems** regardless of
whether the borrow check exists at all — so anyone maintaining it who trusts the comment will believe the
exit code is load-bearing when the entire discriminating power sits in `expect: 'NEIGHBOUR'` and
`introducedLines`. That is the "comment-as-expired-claim" shape this cluster has now hit seven times,
written *inside* a round-4 fix.

**`file:line`** — `scripts/test-gate-plants.ts:336-337` (the comment round 4 added), against
`scripts/test-gate-plants.ts:317-345` (the scenario) and `scripts/check-finding-guards.ts:171`
(`MIN_ENTRIES = 302`).

**The measurement — two runs.**

**(1) The revert, through the real harness.** `class4-reaudit5-probes/r5-plant-borrow-scenario.py` plants
`const waived = note.trim().length > 0;` (the pre-`R4-3` "has a note" semantics) into
`check-finding-guards.ts` and runs the real `npm run test:gate-plants`. Harness's own line:

```
❌ lint:finding-guards [R3-3-borrow] plant-applied=YES · planted=exit 1 · control=exit 0 · reason=WRONG
     ⛔ it redded for the WRONG REASON — expected output containing "NEIGHBOUR".
```

**`planted=exit 1`, `reason=WRONG`.** Not green, and not `failed-open`. Guard restored byte-identically in
the `finally`.

**(2) Why exit 1 is guaranteed.** The scenario runs `check-finding-guards.ts` against a **2-entry**
fixture registry. Run directly on that same fixture
(`class4-reaudit5-probes/r5-borrow-fixture-registry.json`):

```
❌ finding-guards: 5 problem(s).
  • PLANT-LENDER — guard file is GONE …                 (absent in the scenario, which creates the file)
  • PLANT-BORROWER — guard file is GONE …               (likewise)
  • the registry holds 2 findings; 302 are expected. Entries were REMOVED …
  • 0 findings are unguarded and the cap is still 1. Lower it to 0 …
  • 0 findings are unproven … and the cap is still 119. Lower it to 0 …
```

**Three of those five survive inside the scenario** (`MIN_ENTRIES` + both downward-only cap complaints),
and none of them is the borrow. The gate reds on the fixture's *shape*, unconditionally.

⚠️ **And it is not one scenario.** **Six** scenarios run `check-finding-guards.ts` against
`--registry=scripts/__gate_plant_registry__.json` (`[D3-3]`, `[M7]`, `[M6]`, `[S1.11.3.2-void]`,
`[R3-3-borrow]`, `[M8]` — `test-gate-plants.ts:226,237,250,284,317,346`). Every one of them feeds a
fixture registry of 0–2 entries into a gate whose floor is 302, so `failed-open` is dead for **all six**
and each rests entirely on its `expect` string. Only `[M8]`, whose `expect` **is** the entry-count
message, is testing what its exit code reds for.

**Mechanism (HYPOTHESIS).** `MIN_ENTRIES` was raised to `302` in the same round-4 diff
(`check-finding-guards.ts:171`, `300 → 302`), and `--registry=` overrides the registry **without**
relaxing the floors that describe the real one (`check-finding-guards.ts:54` vs `:602`). Every fixture
registry is therefore red-by-construction, so `verdict()`'s `failed-open` leg is dead for this whole
family of scenarios and only `wrong-reason` can ever discriminate. Round 4 reasoned about the plant
locally — "remove the requirement, the complaint disappears, the scenario stops passing" — which is true,
and then named the wrong mechanism for how it stops passing.

⚠️ **The registry's own note is correct.** `S1P7-R3-3-BORROW`'s `proofNote` says
*"reverting `waived` to 'has a note' makes the scenario report reason=WRONG and test:gate-plants exit 1"* —
exactly what I measured. **The two artifacts round 4 wrote in the same commit disagree with each other**,
and only the one nobody reads while editing the scenario is right.

**Remedy (UNVERIFIED).** Correct the comment to say what carries the scenario: *the planted run reds
either way on the fixture registry's floors, so `expect: 'NEIGHBOUR'` is the whole check — reverting the
naming requirement reports `reason=WRONG`, not `failed-open`.* ⚠️ **Do not "fix" this by making fixture
registries satisfy `MIN_ENTRIES`** — that would be a 302-entry fixture per scenario, and the floors are
deliberately absolute. ⛔ **And do not add a guard entry for it**: `authored` is 9 against a cap of 9
(measured below), so any new proof re-enters the record-deadlock.

**Severity: minor.** No behaviour is wrong; the scenario does catch its own plant. What is wrong is the
written mechanism, on the file a maintainer edits.

---

# Measured, and found **NOT** to be a defect

### ⭐ `freed: 0` is safe at **every** reader — enumerated, not sampled

The brief's lead asked whether any surface renders `freed` without a `> 0` guard or treats 0 as
"unknown". Every reader of the payoff `freed`, from a repo-wide grep (`freedPerMonth|\.freed\b|freed:`,
`apps` + `packages`, `.ts`/`.tsx`):

| reader | guard |
|---|---|
| `app/(tabs)/index.tsx:586` | passes it straight to `PaidOffBeat` |
| `plan/PaidOffBeat.tsx:81` | `showCascade = nextDebtName != null && freedPerMonth > 0` |
| `plan/PaidOffBeat.tsx:100` (**the a11y utterance**) | gated on the same `showCascade` |
| `plan/PaidOffBeat.tsx:132` (the visible clause) | gated on the same `showCascade` |
| `plan/ShareCard.tsx:56` | its own `data.freedPerMonth > 0` |
| `tests/shots/p6.8-matrix.shot.ts:308` | a fixture, not a surface |

⚠️ `index.tsx:937/1104-1105`, `FloorImpactBar.tsx:36`, `TutorialOverlay.tsx:113` and
`tutorialShell.tsx:37` are a **different** `freed` (the cushion/floor impact) and do not read the payoff
one. Nothing treats 0 as "unknown"; nothing renders the clause at 0.

### ⭐ The "older build wrote a stale `freed`" exposure is **ZERO** — measured, and the lead is refuted

`pendingPayoff` **is** persisted, **and** `runMigrations` never mentions it
(`apps/rn/src/data/migrations.ts` — zero hits for `pendingPayoff`), so a stored beat's `freed` is
carried through `{ ...base, ...r }` verbatim with no reader-side clamp. `selectCelebration` even reasons
about *"a beat with no `debtId` … stamped by an earlier build"*, so the class is real here.

**But no build can have written the bad value.** `git log`: `R3-4` — the change that made `freed` a
whole-balance figure for a one-time lump — landed in `383444a6`, and `R4-1` corrected it in `affb8a01`.
Both are on **`v1.7-dev`**, an unreleased dev branch, and the defective producer existed for **under one
day** (2026-09-05 → 2026-09-06). The persisted-blob path needs a *shipped* build to have stamped one.
⚠️ **Recorded as a standing property, not a finding:** any future change to what `freed` means is
retroactively wrong for an unacknowledged beat, and nothing in the codebase would notice.

### ⭐ `R4-2`'s refusal is correct in **both** directions — 0 live entries lost

`class4-reaudit5-probes/r5-resolved-expect.mjs`, over all 302 entries / **182 proofs**:

| question | measured |
|---|---|
| entries the OLD rule (`!expect && !token`) refused | **0** |
| entries the NEW rule (`(expect ?? token ?? '').trim()`) refuses | **0** |
| entries with `expect: ""` | 0 |
| entries with a non-string `expect` | 0 |
| entries whose resolved expectation is whitespace-only | 0 |

**No live registry entry became unprovable.** And `npm run prove:guards:selftest` — re-run, not
remembered — passes all **six** controls including the new `selftest:a blank expect is refused`; the two
controls round 3's first cut broke (`a guard that holds`, `two edits, one file`) are green.

### ⭐ Round 4's three guards are red on their own defect — **re-run, not remembered**

`npx tsx scripts/prove-guards.ts --id=<ID> --no-record` (`--no-record` so the registry is not written;
verified byte-identical afterward with `cmp`):

| id | result |
|---|---|
| `S1P7-R4-1-ONETIMELUMP` | `plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED` ✅ |
| `S1P7-R4-2-EMPTYEXPECT` | `plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED` ✅ |

⚠️ `R4-1`'s un-fix reds on the **one-time row specifically**: under
`freed: bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth)` the monthly/weekly/biweekly/BNPL-weekly
rows are all still exact (measured in `r5-freed-shapes.ts`), so the row that fires is the one the finding
names. The defect is refused for the reason that names it.

### ⭐ The borrow waiver refuses correctly when the note names a **different** entry

The `.some()` is over the **actual** lenders, so a note naming an unrelated id waives nothing —
demonstrated by the control arm of `r5-plant-waiver.py` (a note that names nothing reds) and by the
positive arm (a note naming the true lender is silent). The failure mode is *only* the substring
collision recorded as `R5-2`.

### ⭐ `MIN_ENTRIES = 302` matches the registry exactly

`Object.keys(registry).length === 302` (`r5-borrow-census.mjs`), and the gate's own summary line reads
`301 of 302 … 1 unguarded (cap 1)`. The `300 → 302` raise in the round-4 diff is the two entries the
round added (`S1P7-R4-1-ONETIMELUMP`, `S1P7-R4-2-EMPTYEXPECT`); `R4-3`'s closure re-anchored the existing
`S1P7-R3-3-BORROW` rather than minting a new entry.

### ⚠️ A latent throw in the borrow branch — pre-existing, fails CLOSED, not filed

`check-finding-guards.ts:547` is `!e.token.includes(expect)` with no optional chaining. Measured: **1**
entry has no string `token` (`GAP-14`, the one deliberately unguarded entry) and **0** entries pair an
`expect` with a missing token, so nothing throws today. The line predates round 4 (the same expression is
in the pre-`bc2151ff` text). If it ever fired it would crash the gate, i.e. **fail closed**, which is the
safe direction. Recorded, not filed.

### ⚠️ `authored` has ZERO headroom, and it constrains every remedy above

The gate's own line: `9 authored but never run (cap 9)`. The caps are downward-only, so **any new proof
entry re-enters the record-deadlock.** Both remedies above are deliberately written to need **no new
registry entry**: `R5-1` extends an existing guarded table (`S1P7-R4-1-ONETIMELUMP`'s file), and `R5-2`
and `R5-3` are a matcher change and a comment correction inside files that already carry guards.

### The cumulative count is **127**, derived two ways — and their agreement is **not** confirmation

`class4-reaudit5-probes/r5-cumulative-count.mjs`:

| derivation | value |
|---|---|
| **A — the brief's arithmetic** | `95 + 11 + 8 + 6 + 4 + 3` = **127** |
| **B — id spellings read out of the files**, contiguity checked | class-1 base 11 + class-4 base 11 + `R1..R15`(15) `N-1..N-11`(11) `T1..T14`(14) `U1..U16`(16) `V1..V12`(12) `W1..W15`(15) `F1..F8`(8) `R2-1..R2-6`(6) `R3-1..R3-4`(4) `R4-1..R4-3`(3) = 104 + `W9b`(1) = **127** |

**Every one of the ten id runs is contiguous from 1 with no gaps and no strays.** ⛔ **They agree and
that proves nothing**, exactly as the brief warns: both add `W9b` from the same out-of-band fact.
Re-measured this round: `W9b` is **absent from `CLASS1-REAUDIT-6.md`**, its own round's findings file, so
a purely file-driven enumeration of the class-1 rounds returns **126** and reports no error.
⚠️ **The heading-shaped control still returns a SILENT ZERO** on five of the six class-1 rounds
(`CLASS1-REAUDIT-5.md` returns 3, which is worse than zero — it looks like an answer).

### Not re-opened

`S1-ROUTE-STALE-READ` / `S1-ROUTE-EXIT-REACHABLE` — the two permanently-stale route proofs, deferred to
pass 8 by the dispatch. Confirmed still 2 of a cap of 8 in the boundary line; untouched.

### Already recorded by round 4, still open, folded into `R5-1` rather than re-filed

Round 4 measured that **all 18 test call sites pass `cyclesPerMonth: 1`**, so `per-paycheck` — the only
recurrence the parameter changes — is asserted nowhere, and wrote *"that row belongs in `R4-1`'s remedy
alongside the one-time rows."* **The round-4 diff does not contain it.** My own shapes sweep confirms the
gap (`debt · per-paycheck`: 50 at `cpm=1`, 108.5 at `cpm=2.17`) and the production seam is correct
(`store.ts:79` passes `payCyclesPerMonth(next.paycheck.payCycle)`). Not filed as a new finding — it is
round 4's own recorded deferral, and `R5-1`'s remedy carries the row.

---

# Method notes, recorded because two of them cost time

- ⚠️ **`scripts/finding-guards.json` is LF, not CRLF**, unlike the rest of this repo, and the round-4
  brief's claim that the `json.dumps(indent=2, ensure_ascii=False)` round-trip is **byte-identical** is
  off by one byte: it drops the trailing newline. Measured (`r5-roundtrip-check.py`): orig **403,336**
  bytes, round-trip **403,335**, `CRLF count 0`. `json.dumps(...) + '\n'` is byte-identical. Every plant
  here used that form and every restore was verified with a byte comparison against a pre-plant copy
  inside a `finally`.
- ⚠️ **The Bash heredoc mangles backslashes in this environment.** Two probes carrying a JS regex
  character class (`/[.*+?^${}()|[\]\]/g`) reached disk with one backslash eaten and died with
  `SyntaxError: Invalid regular expression`, through **both** a quoted `<<'EOF'` heredoc and a quoted
  Python `<<'PY'` heredoc containing an `r'''` string. Both failures read as a broken probe rather than a
  broken pipe. Probes with backslashes were written with the file-writing tool instead, and the final
  matcher avoids escaping entirely (registry ids are `[A-Za-z0-9-]`).
- ⚠️ **`npx tsx scripts/prove-guards.ts --id=S1P7-R3-3-BORROW` exceeds a 9-minute tool timeout** — it runs
  `test:gate-plants`' 26 scenarios **twice** (planted + control). The timeout killed it; the tree was
  checked immediately and was clean, and it was re-run in the background. `--no-record` is what keeps a
  re-proof from writing to the registry.

---

# Summary

**3 findings — 0 blocker · 1 major · 2 minor.**

| id | severity | reach | one line |
|---|---|---|---|
| `R5-1` | **major** | **(a) outside the instrument stack** | the one-time exclusion is keyed on **BNPL**, so a `type:'debt'` one-time debt still announces *"Freed $50/mo"* for money that does not recur — reachable by CSV import **and** by converting a BNPL to a debt in `DebtSheet` |
| `R5-2` | minor | (b) instrument | the borrow waiver matches by **substring**, so a note naming `A3-14` waives a borrow from `A3-1` — planted and confirmed silent; 20 of 302 short ids collide |
| `R5-3` | minor | (b) instrument | the `[R3-3-borrow]` scenario's exit code is vacuous (its fixture registry reds on `MIN_ENTRIES` regardless), and round 4's comment names `failed-open` where the harness reports `reason=WRONG` — measured |

**The (a)/(b) split: 1 (a) · 2 (b).**

⚠️ **The (a) finding is the same defect class as the round-4 blocker it audits**, one shape over — the
`{type} × {recurrence}` product still has an unvisited cell — and it is the **fifth consecutive round** in
which the round's own fix carried a member of the class it closed.

**Round 4's three findings are all genuinely closed** — every guard re-run rather than remembered, each
red for the reason that names it, and `R4-2`'s refusal measured correct in both directions with **0** live
entries lost. Nothing round 4 changed broke anything already closed: no reader of `freed` mishandles `0`,
no registry entry became unprovable, `MIN_ENTRIES` matches the registry exactly, and the two stale route
proofs are untouched at 2 of a cap of 8.

**Refuted.** The brief's persisted-`pendingPayoff` lead: real mechanism, **zero exposure** — the
defective producer lived under one day on an unreleased dev branch, so no build can have stamped a stale
`freed`. Round 4's own worry that the `[R3-3-borrow]` fixture might be redding for `MIN_ENTRIES` rather
than the borrow: **half right** — it *is* redding for `MIN_ENTRIES`, and `reason=WRONG` is nevertheless
the correct discriminator, which is why the finding is against the comment and not the scenario.

**Cumulative scope after this round: 130** (127 + 3).

**Tree:** `git status --short` shows only `CLASS4-REAUDIT-5.md` and `class4-reaudit5-probes/`.
**Nothing committed.**
