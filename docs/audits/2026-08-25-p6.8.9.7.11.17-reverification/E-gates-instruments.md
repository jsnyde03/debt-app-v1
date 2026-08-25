# E — the instruments: gates, guards, suites, tests

**Tree:** `v1.7-dev` @ `c8d54fa`. **Fix range:** `6736a64..c8d54fa`.
**Method.** Every claim was read in the file. Every number was **measured** with a throwaway script in the
scratchpad (never in the repo tree); the probe is described inline so each figure can be re-run. No gate
and no suite was executed against the repo. The two read-only exceptions are `tsc --noEmit -p
apps/rn/tsconfig.tests.json` and `… --listFilesOnly`, which write nothing.

---

## ⛔ THE HEADLINE QUESTION — can a red gate report exit 0?

**NO.** Not through `scripts/run-gates.ts`, and not through `validate:release:rn`. Measured, not reasoned.

**What was measured.** A self-contained fake npm project in the scratchpad reproducing `run-gates.ts`'s
exact mechanism — `spawnSync('npm', ['run', <gate>], { stdio: 'inherit', shell: true })`, `const ok =
res.status === 0`, `process.exit(failed.length === 0 ? 0 : 1)` — driven by a `lint:rn` script that runs it
under `tsx`, inside a `validate` script of the form `npm run lint:rn && npm run gate:record`. Three fake
gates: green, red-with-exit-1, and red-with-exit-0.

Result, verbatim:

```
> lint:green    ✅ green gate
> lint:red      ❌ red gate
> lint:redzero  ❌ red gate that exits 0
FAILED: lint:red
VALIDATE EXIT=1
```

Line by line:

1. **A non-zero gate is seen.** `spawnSync` under `shell: true` on Windows returned
   `status=1 signal=null error=none` for the red gate (probe printed it), so `run-gates.ts:68`
   (`const ok = res.status === 0`) records the failure.
2. **The other gates still run** — all three children executed, no short-circuit (`run-gates.ts:62-70`).
3. **The harness exits 1** (`run-gates.ts:85`).
4. **`tsx` propagates it** — `npm run lint:rn` returned 1.
5. **The `&&` chain stops.** `gate:record` never executed; the probe's record script never printed its
   marker. So **`gate:record -- --from-gate` cannot record a green over a red gate**, and
   `scripts/write-gate-status.ts:1-17`'s structural claim (*"there is no code path here at all until the
   run is already green"*) holds.

Two further reads:

- **Signal death is handled.** `res.status` is `null` on a signal kill and `null === 0` is false, so it
  counts as failed — and `run-gates.ts:66-67` says exactly that, rather than relying on the accident.
- **Spawn failure is handled.** `res.error` (ENOENT) also leaves `status` null → failed.

**⚠️ The plan's row is now stale.** `docs/DEBT_ELEVATION_PLAN.md:60` still reads *"⛔ **The harness reports
exit 0 on a RED gate — nine instances**; read the gate's own summary line"*. As of `c8d54fa` that is no
longer true of the harness. **`minor`** (a stale instruction, no instrument blinded) — but worth correcting,
because it tells the next session to distrust a summary line that is now authoritative.

### ⚠️ What the harness still cannot see — and it is the class those nine instances actually were

The third probe gate printed `❌` and exited **0**, and the harness reported `FAILED: lint:red` only — it
**did not name it**. `run-gates.ts` fixes *"the first red hid the other 21"* and *"the harness's own exit
code"*. It does **not** fix *"a child gate that is red and says 0."* That class is per-gate, so I swept all
23 individually — **it is currently empty**; see *Swept and found clean*.

---

## Job 1 — the fixes, re-verified

### `.11.12.11 · D-J2-2` — the required `ready` field that gated nothing — **CLOSED**

**Original finding:** `ready` was optional on `Surface`, exactly 1 of 10 surfaces set it, the prose claimed
all did, and two of the blocks that shoot a `Surface` never called it — so eight
`textscale-{1.35,2}x-onboarding.png` frames were shot with the guard off. The `.11.12.11` fix made the field
required and justified enforcement with *"Playwright compiles this file"* — **Playwright transpiles**, and
`apps/rn/tsconfig.json:22` excluded `tests`, so nothing typechecked it.

**What the fix did.**
- `apps/rn/tests/shots/p6.8-matrix.shot.ts:181` — `ready: (page: Page) => Promise<unknown>;`, **required**.
- **Measured, by parsing the array rather than grepping:** `SURFACES` (`:189`–`:384`) holds **14** top-level
  entries — `today, money-debts, progress, more, history, living-expenses, cushion-forecast, paywall,
  payoff-finale, payoff-beat, band-milestone, milestone-ack, onboarding, not-found` — and **14 of 14** carry
  a `ready`.
- Both `SURFACES`-looping blocks now call it: the state block at `:665`, the text-scale block at `:726`
  (this was the concrete hole). `SHEETS`/`EXPANDED` do not shoot a `Surface` and correctly take none.
- `apps/rn/tsconfig.tests.json` (new) + `typecheck:tests` (`package.json:48`), inside `typecheck`
  (`package.json:49`), which CI runs (`.github/workflows/web-e2e.yml:89`).

**⛔ The tsconfig's reach was verified, not assumed** — a config that includes fewer files than it appears
to would be this defect a second time. `npx tsc -p apps/rn/tsconfig.tests.json --listFilesOnly` enumerates
**73** repo files: the 3 Playwright configs and **all 70** files under `apps/rn/tests` (57 `e2e/*.spec.ts` +
`e2e/helpers/seed.ts` + 3 `embed/*.spec.ts` + 10 `shots/*.shot.ts`). That is byte-for-byte the
`find apps/rn/tests -type f` list — **the config includes every file it appears to.** `include` is
`tests/**/*.ts|tsx` plus the 3 configs, and the parent's `exclude` (which listed `tests`) is **overridden**,
not merged (`tsconfig.tests.json:7-8`).

**Does the new gate currently pass?** Yes — `npx tsc --noEmit -p apps/rn/tsconfig.tests.json` exits **0**.
It is armed over a clean tree, not switched on over a known failure.

**Preserved?** Yes. Every `ready` is state-agnostic — each of the 13 scaffolded surfaces waits on its own
`role="heading"`, which `empty` and `huge` render alike (stated at `:661-664`, true of all of them); the one
surface with no `Screen` scaffold (`+not-found`) matches its own sentence with a loose apostrophe class
(`:383`), deliberately, because `lint:apostrophes` forces a curly one. Today's is the greeting's *shape*
(`:192`), not one of its three values, so the matrix does not pass or fail by the clock.

**Pinned?** `typecheck:tests`. `SURFACES` is annotated `Surface[]`, so an entry missing `ready` is TS2741 at
the object literal, not a downstream inference. **It would red on the original defect** — the original
defect *was* nine entries with no `ready`. No earlier assertion fires first: tsc reports all errors.

**Residual, `minor`:** `:565` still reads `if (s.ready) await s.ready(page);` in the route block. With the
field required the condition is always true — harmless, but it is a vestige of the optional era and reads
as though the guard were still conditional.

---

### `.11.12 · B-J2-3` — `audit.test.ts` printed `⛔` and returned cleanly — **CLOSED**

**Original finding:** the adversarial migration corpus reported violations to a console and returned
normally, while `hostile.test.ts` ran the same invariants and threw. A real corruption failed nothing.

**What the fix did.** `apps/rn/src/data/migrationAudit/audit.test.ts:99-104` — `if (rows.length > 0 ||
drift.length > 0) throw new Error(...)`, naming violation count, root-cause count and drift count.

**Is the throw actually reached?** Yes, and this is the half a code read alone would miss.
`apps/rn/src/testing/runAppTests.ts:229` is
`await (await import('../data/migrationAudit/audit.test')).default();` — the default export is **called**,
not merely imported — and `runAppTests.ts:276-279` wraps `main()` in
`.catch(err => { console.error(…); process.exit(1); })`. The throw becomes exit 1, which `run-gates` /
`validate:release:rn` / `web-e2e.yml:103` all see.

**Preserved?** Yes, and better than the finding asked. The per-root-cause breakdown (`:78-84`) still prints
**before** the throw, so the diagnostic value that motivated report-only survives; and the two vacuity
guards that make "clean" mean anything are still ahead of it — the generator floor (`:36`, `< 100 cases`
throws) and the healthy-control checks (`:65-67`), which throw on a corpus that refuses everything.

**Pinned?** ⚠️ **No — the arming itself is unpinned.** See Job 2 finding **2**.

**⚠️ A measured caveat on "measured clean at 522 cases."** True, but narrower than it reads.
`invariants.ts:60` returns `null` when `o.accounting` is absent, and `doors.ts:46-64` (`importDoor`) never
sets `accounting` — so invariant ② `nothing-silently-dropped` is **vacuous for the import door**, i.e. for
half of the outcomes. That is defensible (only the WebKit mapper does key accounting), but `audit.test.ts:57`
prints *"`${checked}` outcomes, 8 invariants each"*, which is false for the import half. **`minor`** — an
instrument mis-describing its own coverage in its own output.

---

### `.11.13.3` — `zero-egress.spec.ts`'s cast that only compiled because nothing typechecked — **CLOSED**

`apps/rn/tests/embed/zero-egress.spec.ts:86-95` now routes through `window as unknown as
Record<string, unknown>`. Confirmed by the same `typecheck:tests` run: the file is in the include set and the
project compiles clean. This is independent corroboration that `typecheck:tests` is live over this tree.
The four global assertions are unchanged and still compare against an exact object, so nothing was
weakened into an absence assertion.

---

### `.11.12.12 · D-J2-3` — `check-destructive-writes`' file-level allow-list — **CLOSED**

**Original finding:** the exemption unit was the FILE (`if (rel in ALLOWED) return;` evaluated before the
call was examined), so a second unguarded `importStore(blob)` in a sanctioned file was admitted silently,
and the staleness check could not see it either.

**What the fix did.** `scripts/check-destructive-writes.ts:51-73` — every entry declares `sites: <n>`
beside its reason, and `:130-146` compares the **exact** count found per file against the count declared,
failing in **both** directions. A second call in a sanctioned file makes `actual = 2` vs `declared = 1` →
exit 1; a removed call makes `actual = 0` → exit 1, which also subsumes the old staleness check (`:124-129`).

**Preserved?** Yes, and the over-match is now honest: `:85-91` records that the pattern also matches the
interface member and the implementation in `store.ts`, which is why that entry declares `2`. The docstring
that used to claim *"a CALL, not a mention"* was **corrected** rather than the pattern narrowed — the right
direction, since narrowing risks under-matching.

**Pinned?** No test; the gate is its own pin. It runs in `run-gates.ts:46` and in CI (`web-e2e.yml:92`), and
the drift check fails on the original defect by construction.

**Reach, measured** (whole result counted, not `| head`): `importStore` appears **35 times in 19 files**
repo-wide. 16 of those files are under `apps/rn/src` (the gate's `ROOTS`), 2 are e2e specs, 1 is the gate.
Nothing sits outside the walked tree. But see Job 2 finding **1b** for a call spelling the pattern cannot
match.

---

### `.11.12.13 · D-J2-4` — `strings-inventory --gate` discarded its own self-check — **CLOSED**

`scripts/strings-inventory.ts:530-533` — the `--gate` branch now re-tests `badOrigins` and calls
`process.exit(1)` **before** the `✅` line and the `process.exit(0)` at `:537`. The origin self-check's
`process.exitCode = 1` (`:465`) is no longer overridden in gate mode.

**Preserved?** Yes — the report path (`npm run audit:strings`) still falls through, writes its markdown and
exits 1 via `exitCode`; `--update-baseline` is unaffected.

**The fixer's class claim was independently re-measured, not trusted.** `strings-inventory.ts` is the only
script under `scripts/` that sets `process.exitCode` at all (3 hits, all in that file; **0** across the other
22 registered gate scripts). The other four `process.exit(0)` sites — `check-apostrophes.ts:160,170`,
`check-sandbox-writes.ts:130`, `check-icon-glyphs.ts:148` — were each read: two are non-gate `--fix` /
`--baseline` modes, two are guarded by `offenders.length === 0 && stale.length === 0`. **The claim is correct.**

---

### `.11.12.14 · D-J2-5` — `check-audit-closure` counted SYNTHESIS headings as closures — **⛔ WRONG-REMEDY · `major`**

Reported in full as Job 2 finding **3**: the remedy is present and correct in the code, and the number it
exists to move **did not move**.

---

### `.11.13.4`'s shape — *"a guard whose precondition another layer already enforces, with a test that would pass without it"* — **searched, one candidate, NOT-A-DEFECT**

The nearest match in the range is `packages/core/debt/originalBalanceHighWater.ts:52` —
`if (current === undefined && next === balance && balance <= 0) return debt;`. **The `balance <= 0` clause
looks redundant and is not.** `next = Math.max(current ?? 0, balance, 0)`, so with `current === undefined`,
`next === balance` already implies `balance >= 0`; dropping `balance <= 0` would make **every** unstamped
positive-balance debt return unchanged, i.e. never seed its stamp. `testOriginalBalanceHighWater.ts:68`
(*"an unstamped debt seeds from its balance"*, 800) **would red** if the clause were deleted, and `:70`
(*"a $0 unstamped debt is left alone"*) pins the other side. **Load-bearing and pinned in both directions.**

The other new guards in the range are not of this shape: `summariseNames`' `max < 1` (`format.ts:62`) is a
caller-facing degenerate case with its own test, and `addMonthsToDate`'s `anchorDay ?? date.getDate()` is a
default, not a guard.

---

### `check-comment-convention` / `check-local-dates` — the two ratchet-list files this range edited

**`check-comment-convention.ts` — clean.** The changed part is `commentBlocks()` (`:127-138`, with
`CommentBlock` at `:121`) and the matcher loop (`:179-186`). It joins adjacent comment lines before matching, because every docblock here is
hard-wrapped at ~110 chars and the dominant written form of the banned phrases splits across the wrap — the
guard was blind to its own house style. **The rules did not widen:** every pattern still bounds the gap with
`[^.]{0,60}`, and a full stop still ends the reach, so no pattern spans two sentences. Reporting moved from
the whole line to `…${match[0]}…` at the **block's** start line, which costs a little navigability and is
called out in the code. **Strictly more reach than before; no blind spot introduced.**

**`check-local-dates.ts` — clean for its own class, one unenforced claim.** The changed part is
`HAND_PARSE_BASELINE`, `44 → 41` (`:80`), plus a new docstring line: *"⛔ **The baseline RATCHETS DOWN.**
Work that routes a hand-parse through the owner must lower it in the same edit."* **Nothing enforces that
sentence.** `:105` is `if (handParseCount > HAND_PARSE_BASELINE)` — the gate fires only on a rise, so ground
gained is silently re-spendable back up to 41. Given this repo's own [D49] thesis (*"a documentation rule
cannot fix that, because a documentation rule is exactly what failed"*), the mechanism the sentence
describes is one line: fail on `handParseCount < BASELINE` with *"lower the baseline."* **`minor`** — the
class the gate exists for (growth) is still caught and there is no user consequence — but it is the same
shape as the `strings-inventory` self-check that just cost a round. `BANNED`, `ROOTS`, `EXEMPT` and
`stripComments` are untouched, so the ratchet list's Sydney/Auckland sweep is undisturbed.

---

## Job 2 — sweep for blocker + major

### 1. `check-month-arithmetic` matches one spelling of month-stepping, and the owner file writes the other — **major**

**User-facing consequence:** a future month-step written as `new Date(y, m + n, day)` — the other standard
JS idiom, and the one demonstrated inside this gate's own owner module — overflows Jan 31 into Mar 3 exactly
as `setMonth` does, so a user reads a debt-free date, a chart pill or a schedule row naming the wrong month,
and the gate built to make that impossible stays green.

**Mechanism.** `scripts/check-month-arithmetic.ts:39` — `const BANNED =
/\.\s*(setMonth|setFullYear)\s*\(/`. The class the file names for itself (`:1-8`) is *"stepping a calendar
date by months"*, and the `Date` constructor produces it identically:
`new Date(d.getFullYear(), d.getMonth() + n, d.getDate())` normalises the overflow forward for the same
reason. Nothing in the file matches that form.

**⚡ And it is the spelling the owner file uses.** `packages/core/utils/addMonths.ts:25` is
`const target = new Date(date.getFullYear(), date.getMonth() + months, 1);` and `:27` is
`new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();`. Both are *safe* — day `1` and day `0`
cannot overflow, which is precisely the trick that makes `addMonths` correct — but an author who reds on
`lint:month-arithmetic` opens the owner module to learn the house form and finds `new Date(y, m + n, …)`.
Substituting `d.getDate()` for the `1` reproduces the original blocker with the gate green. **This is the
same shape as last round's bare-`announce` gate missing `announceForAccessibility?.(…)` — the miss is the
spelling a new author copies from the file they are told to copy.**

**Confidence:** measured. `grep -rn "getMonth()"` over `packages/core`, `apps/rn/src` and `apps/rn/tests`
returns **13** sites (full result counted). The only `getMonth() + n` inside a `Date` constructor are
`addMonths.ts:25` and `:27`; `Date.UTC` appears twice. **There is no live offending site today** — the
finding is that the guard cannot hold the line, not that the line is currently crossed.

**Would anything catch it?** No. `packages/core/utils/testAddMonths.ts` pins `addMonthsToDate`'s own
behaviour; nothing asserts that other modules route through it, and `monthLabels.test.ts` pins one call
site's label. A new site written with the constructor spelling is invisible to all of them.

**Same file, lower stakes:** `:17-18` says `setFullYear` is banned *"so the first one written is refused"* —
but `new Date(y + n, m, d)` carries the identical Feb-29 trap and is likewise unmatched.

### 1b. `check-destructive-writes`' `CALL` pattern misses the optional-call spelling — **major**

**User-facing consequence:** an `importStore` reached as `…?.importStore?.(blob)` is not counted, so a new
unsanctioned caller of the one operation that replaces the user's entire portfolio and cannot be undone is
admitted with no review and no red gate.

**Mechanism.** `scripts/check-destructive-writes.ts:93` —
`const CALL = /(?<![\w.])importStore\s*\(|\.\s*importStore\s*\(/`. The second alternative requires `(` after
optional whitespace following the dot, so `.importStore?.(` does not match; the first is blocked by the
`(?<![\w.])` lookbehind because the character before `importStore` is `.`. The same gap swallows an aliased
call (`const fn = s.importStore; fn(blob)`) and a computed access (`s['importStore'](blob)`).

**Confidence:** read-only inference from the regex, verified against the full `importStore` site list
(35 occurrences / 19 files) — **no live site uses those spellings today**, so this is a reach gap, not a
current hole. The file's own docstring states the standard it is failing: *"**What it must never do is
under-match**"* (`:91`).

**Would anything catch it?** No — the count check at `:130-146` compares against the same `found` map, so an
unmatched call is invisible to the drift check too, in both directions.

---

### 2. Nothing pins that `audit.test.ts` still throws — the arming is unpinned by construction — **major**

**User-facing consequence:** the adversarial corpus that exists to prove a v1.6→v1.7 upgrade cannot corrupt
someone's balances can be returned to report-only by deleting four lines, and every suite, gate and CI run
stays green — which is exactly the state it sat in for the month this round just closed.

**Mechanism.** `apps/rn/src/data/migrationAudit/audit.test.ts:99-104` is the **only** thing that turns a
violation into a failure. The invariants themselves (`invariants.ts:181-194`) are shared with
`hostile.test.ts`, which throws independently — so a plant in `invariants.ts` reds via hostile and says
nothing about this file. **A plant that removes only the throw at `:99` leaves the whole repo green.** This
is the `tested-helper-is-not-a-used-helper` shape one level up: the judgement exists, is correct, and its
*consequence* is what is unguarded.

**Confidence:** read-only inference, structurally certain — nothing else reads `rows` or `drift`, and
`record()` (`:28-33`) writes module-level state with no other consumer.

**Would anything catch it?** No. `runAppTests.ts:229` calls `.default()` and would notice the *export*
disappearing, not the *throw* disappearing.

**⚠️ It is a class, and only half of the class has an instrument.** Measured with a scratchpad probe over
the whole corpus: **67** `*.test.ts(x)` under `apps/rn/src` and **64** `test*.ts` under `packages/core`;
**0 orphans** in either runner, and **all 13** app-layer files that default-export a runner are invoked with
`.default()` (each printed `ok`) — so *registration* is genuinely clean and nothing is silently unimported.
What has **no** instrument at all is *"this suite's verdict reaches a non-zero exit."* Hand-found vacuous
instruments in this one cluster: three (`.11.12`'s `audit.test.ts`, `.11.13.6`'s two). Nothing mechanical
looks for the fourth.

---

### 3. `check-audit-closure`'s SYNTHESIS fix moved the number it exists to move by **zero** — **major · WRONG-REMEDY**

**User-facing consequence:** P6.8.9's stated mechanical exit criterion — *"no other major+ issue remains"*,
and the flip of this gate to `process.exit(1)` when the untraceable count reaches zero — currently counts
**11 blocker/major findings as traceable because of one sentence in the log that lists them as untraceable**,
so those eleven can be signed off as closed without anyone ever examining them.

**Mechanism.** The remedy is present and correct in the code: `scripts/check-audit-closure.ts:151-156`
builds `p68Recorded` from `SOURCES` only (`:61-65` — the plan, the log, `L9-refutations.md`), and
`SYNTHESIS.md` is no longer appended. The docstring records the intended effect at `:41-49`: *"Measured by
running this gate with and without it: **39 with, 51 without**, and the 12 that turn on it alone are
`M1-1 M1-2 M1-5 M1-6 M2-1 M2-2 M2-5 M2-6 O1-9 V1-0 V1-1 V4-7`."*

**Re-measured against `c8d54fa`** with a scratchpad probe that reproduces the gate's slice parser and both
of its regexes verbatim, so the numbers are the gate's own:

| | |
|---|---|
| P6.8 slice findings parsed | **170** (12 blocker · 75 major · 72 minor · 11 polish), across 12 lenses |
| high+ (blocker + major) | **87** |
| **untraceable, as shipped** | **39** |
| untraceable if `SYNTHESIS.md` were re-added | **39** — it now rescues **0** |
| **untraceable without ONE line of the log** | **50** |

That one line is **`docs/DEBT_ELEVATION_LOG.md:1209`**, quoted exactly as it appears:

> ``that turn on SYNTHESIS alone are `M1-1 M1-2 M1-5 M1-6 M2-1 M2-2 M2-5 M2-6 O1-9 V1-0 V1-1 V4-7` — the same``

It is the fixer's own postmortem **of this very finding**, written into a file that **is** a closure source.
The ids it alone rescues, measured: `M1-1 M1-2 M1-6 M2-1 M2-2 M2-5 M2-6 O1-9 V1-0 V1-1 V4-7` — eleven;
`M1-5` is also carried by `:1204`, the same paragraph. **The gate's count went 39 → 51 → 39 inside one
commit range, and the second move was made by the documentation of the first.**

**Confidence:** measured twice, with the gate's own parser and both of its regexes.

**Preserved?** Yes — the `[D37]` half (`:93-112`, the `L*-*` findings) is untouched and still gates at
`process.exit(1)`. Nothing correct was over-matched away.

**Would anything catch it?** No, and structurally it cannot: the gate is a **mention** check over prose that
discusses findings by id. The file already says so at `:51-56` (*"traceability by coincidental mention"*),
having rejected an alias map for exactly that reason — and then reintroduced the coincidence from the other
end. The file also already contains the remedy in prose (`:55-56`: *"the alias has to be recorded where the
closure is"*); making it mechanical means requiring the id to appear on a line that **also** carries a
closure marker (`✅` / `CLOSED` / `REFUTED` / a `P6.*` step id), not merely somewhere in the file.
⛔ **No fix applied — this round does not edit source.**

**⚠️ Second-order, same instrument, and it is the steady state rather than an accident:** **25 of the 87**
high+ findings are traceable **only** via `DEBT_ELEVATION_LOG.md` (measured), and this range added **1,926
lines** to that file, much of it audit postmortem prose that names finding ids. A gate whose corpus grows by
quoting the ledger it checks will keep doing this.

---

### 4. `debtPlannerStorage.ts`'s `originalBalance` docstring instructs the next writer to reintroduce the defect `.11.15` closed — **major** *(escalated-comment clause; adjacent to my surface)*

**User-facing consequence:** the type declaration of a persisted money field tells a future writer that BNPL
is carved out of the high-water rule, so the seventh writer skips it, a corrected installment plan keeps
`paid = original − balance` negative, and the user's journey ring reads 0% for the rest of that plan's life.

**Mechanism.** `packages/core/storage/debtPlannerStorage.ts:57-59` says: *"⛔ An installment-native BNPL is
**carved out and stays undefined** — `bnplPaymentsTotal` divides this to say 'payment 2 of 4', and filling
it there changes the count."* The module the same commit range designates as the single owner says the
opposite, at length: `packages/core/debt/originalBalanceHighWater.ts:19-31` — *"⚠️ **ONE RULE, INCLUDING
BNPL — and the case for exempting it was measured false**"*, with the measurement, and *"Reading that
exemption as being about `bnplPaymentsTotal` is an inference, and it was wrong."* The commit message for
`5a5fa8c` says the same: *"the carve-out I recommended was wrong."*

And the code follows the owner, not the docstring: `raiseOriginalBalance` has **no** BNPL branch, and it is
applied unconditionally at `apps/rn/src/data/migrations.ts:197` (every debt, every hydrate) and at
`apps/rn/src/store/store.ts:425`, `:447`, `:464`. So *"stays undefined"* is false for any BNPL row that is
ever edited, verified, or simply re-hydrated. `packages/core/debt/testOriginalBalanceHighWater.ts:97` and
`:102` assert precisely the stamping the docstring forbids.

**Confidence:** measured — all four `raiseOriginalBalance` call sites read, no BNPL condition at any of them.
**⚠️ Not a live number change:** the surviving carve-out at `store.ts:395`
(`debt.originalBalance ?? (isInstallmentNative(debt) ? undefined : debt.balance)`) is now dead — the next
hydrate stamps it — but for a *fresh* plan `bnplPaymentsTotal`'s basis is the same either way, so no user
sees a count move. The defect is the instruction, not today's arithmetic.

**Would anything catch it?** No — no gate compares a docstring against the function it describes, and
`check-comment-convention` bans meta-comments and counts-of-code, not contradictions.

**⚠️ A reader could rate this `minor`.** I rate it `major` under the brief's explicit clause — *"a wrong
comment is minor unless it is load-bearing for a future maintainer's safety decision"* — because it sits on
the field's own type declaration, which is where writer number seven will look, and it contradicts the
single owner the same range created to stop exactly that.

**Same class, same range, lower reach, `minor` and not counted above:** `apps/rn/src/store/journeySelectors.ts:12`
still asserts *"`originalBalance` is stamped once at creation and **no edit path updates it**"* — the premise
`.11.15` retired four commits later.

---

## Swept and found clean — at the blocker/major bar

Extending the ratchet. Each was read or measured this round; none produced a blocker or major.

- **`scripts/run-gates.ts`** — exit-code handling, signal death, spawn failure, no short-circuit, and the
  23-entry `GATES` list (`:32-58`) checked against every `lint:*` script in `package.json`. Proven by
  scratchpad experiment, not by reading.
- **`validate:release:rn`'s `&&` chain** (`package.json:50`) vs **`.github/workflows/web-e2e.yml`** — the
  header's equivalence claim (`web-e2e.yml:3-14`) is **true as of this range**, compared link by link: the
  workflow runs `typecheck`, `lint:rn`, `test:stamp`, `test:regression`, `test:app`, `test:scenarios`,
  `test:e2e:rn`, `test:e2e:embed` — every link except `gate:record`, the one documented omission. Note that
  `typecheck` now pulls in the **new** `typecheck:tests`, so the `ready` gate does run on every push.
- **Which gates run in CI vs only locally** — all 23 in `run-gates.ts` run in CI via `lint:rn`. Only two
  `lint:*` scripts are outside it, and **both are correct**: `lint:gate-freshness` reads the record that
  `gate:record` writes at the end of the same chain, so it cannot live inside it (documented); and
  `lint:webkit` (`check-webkit-flex-controls.ts`) scans `REPO_ROOT/components`, `REPO_ROOT/app` and
  `app/styles` — the **legacy Capacitor/Next tree** that P6.11 deletes and that no longer ships, so its
  absence from the RN lane is right. *(Two stale prose claims attach to it —
  `check-webkit-flex-controls.ts:13` still says "Runs in `npm run lint` and the CI gate", and
  `apps/rn/src/store/tutorialPath.test.ts:118` cites it as "the repo's existing `lint:webkit` scan" — both
  `minor`.)*
- **`.github/workflows/embed-pages.yml` — the Pages deploy IS gated.** The [D44] guard is structural, not an
  `if:`: `guard` is its own job, `build` carries `needs: guard` (`:122`), `deploy` carries `needs: build`
  (`:182`), and the guard queries `web-e2e.yml/runs?head_sha=<sha>` filtering
  `status == "completed" and .conclusion == "success"`, refusing on zero (`:103-119`). It is
  `workflow_dispatch`-only, deliberately.
- **`scripts/write-gate-status.ts`** — the `--from-gate` speed bump (`:32-40`) and the dirty-tree disclosure
  (`:74-80`); its on-success-only claim is confirmed by the exit-code experiment above.
- **Every `process.exit(0)` in the 23 registered gate scripts** — `check-apostrophes.ts:160,170`,
  `check-sandbox-writes.ts:130`, `check-icon-glyphs.ts:148`, `strings-inventory.ts:537`. All four are either
  non-gate modes or guarded by a zero-offender condition. **No registered gate currently prints `❌` and
  exits 0.**
- **Test registration, measured** — 67 `*.test.ts(x)` under `apps/rn/src`, 64 `test*.ts` under
  `packages/core`: **0 orphans** in either runner; **all 13** default-exporting app-layer suites are invoked
  with `.default()`; **0** core test files carry an uncalled default export. The range's additions
  (`testOriginalBalanceHighWater`, `testAddMonths`; `journeySelectors.test`, `monthLabels.test`,
  `dataRepairsCopy.test`, `format.test`, `decodeCandidates.test`) are all present and all invoked in the
  idiom their export shape requires.
- **`apps/rn/tsconfig.tests.json`'s reach** — 73 files, the complete `apps/rn/tests` tree plus 3 configs,
  verified against `--listFilesOnly` **and** against `find`; the project compiles clean.
- **The range's new/changed e2e specs, against the `absence-assertions-pass-before-render` class** —
  `backup.spec.ts:154-158`, `data-recovery.spec.ts:140-145`, `goal-pace-edit.spec.ts:122-125` and
  `recovery.spec.ts:56-63` each place a **positive** render assertion immediately before every
  `toHaveCount(0)`, and three of them name the class in a comment. `recovery.spec.ts:63` additionally
  asserts on the *last* name rather than a length, which is the assertion that would red on the original
  run-on defect. `progress-hero-journey.spec.ts` contains no absence assertion at all. No `test.skip`,
  `test.fixme` or `.only` anywhere in the changed specs; the single `.catch()`
  (`tutorial-invite.spec.ts:112`) resolves to `true` and feeds a later assertion rather than swallowing one.
- **`check-comment-convention.ts`'s and `check-local-dates.ts`'s changed parts** — see Job 1. More reach and
  a lower baseline respectively; no blind spot introduced by either edit, and the ratchet list's
  Sydney/Auckland sweep is undisturbed.
- **`check-press-opacity.ts`** — the two spellings it cannot match, `activeOpacity={0.7}` and
  `pressed && { opacity: 0.7 }`, have **zero live sites**: measured, `activeOpacity` = 0 hits and
  `TouchableOpacity` = 0 hits across `apps/rn/src`. *(Its docstring's claim at `:37` that "the state word may
  sit either side of the number" is not quite true of the regex at `:42`, which requires the state word
  after `opacity:` — `minor`, and it currently costs nothing.)*
- **`packages/core/debt/originalBalanceHighWater.ts:51-52`** — the two early-return clauses, checked
  specifically for the `.11.13.4` unreachable-guard shape. Both load-bearing, both pinned in both directions
  by `testOriginalBalanceHighWater.ts:68` and `:70`.

---

## Could not determine

- **Whether `run-gates.ts` behaves identically on the CI runner (`ubuntu-latest`).** The experiment ran on
  Windows, which is the harder case — `shell: true` exists *because* of `npm.cmd`. POSIX `spawnSync` exit
  propagation is stricter, not looser, so the conclusion should hold, but it was not measured there.
- **Whether the 39 untraceable high+ findings are actually open.** The gate answers *"is this id written
  down"*, never *"is it fixed"*; settling that needs the code, per finding 3.
- **Whether `lint:copy`, `lint:closure` and the rest are green on this tree right now.** I did not execute
  any registered gate (round is read-only), so every verdict above is about what the instrument *can* catch,
  not about today's pass/fail.
- **Whether `check-webkit-flex-controls.ts` should be registered or deleted.** I established only that
  nothing runs it and that its roots are the legacy tree; whether its class is dead with that tree is the
  owner's call.
