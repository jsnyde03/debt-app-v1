# S1 pass 7 — lane D1 (gates & suites) — findings

_Written incrementally. Severity stated once, in the `##` heading._

## D1-1 — `major` · `lint:runner-completeness` reads `run-gates.ts` as TEXT, so a gate commented out of `GATES` is still counted as chained

**Origin:** `instrument` (`scripts/check-runner-completeness.ts`).

**What it lets through.** Any gate can be removed from `lint:rn`'s execution chain by prefixing its
line with `//`, and the only instrument that exists to catch *"a gate exists, is wired into
package.json, and is in no chain"* stays green. `lint:rn` then prints `✅ lint:rn — all 47 gates
pass.` and nobody is told that the 48th — for example `lint:money`, the money-format gate — did not
run. The user-facing consequence is the one this repo has already shipped seven times: a green push
whose scope nobody knows, over a surface (money formatting) that is no longer checked.

**File and line.** `scripts/check-runner-completeness.ts:188-192`

```ts
const runGates = readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8');
const unchained = Object.keys(pkg.scripts)
  .filter((n) => n.startsWith('lint:'))
  .filter((n) => !(n in EXEMPT_FROM_CHAIN))
  .filter((n) => !runGates.includes(`'${n}'`));
```

`runGates` is the raw file, comments included. Membership is `String.includes("'lint:money'")`, not
membership of the `GATES` array.

**The measurement.** One store: `scripts/run-gates.ts`. One variable: whether line 42's
`'lint:money',` is live, commented, or absent.

| state of `run-gates.ts:42` | `npx tsx scripts/check-runner-completeness.ts` | printed |
|---|---|---|
| baseline `    'lint:money',` | **exit 0** | `✅ runner completeness: … test:app: 84 tracked · 84 wired …` |
| **plant** `    // 'lint:money',` | **exit 0** | identical `✅` line, byte-for-byte |
| control — line deleted | **exit 1** | `❌ runner completeness: 1 problem(s).` · `[lint:rn] 1 lint script(s) exist in package.json and are in NO chain: lint:money` |

The control is the proof the checker can SEE the subject: the same edit, taken one step further,
reds for exactly the named reason. Restored from a copy taken after the plant; `cmp` clean and
`git status --porcelain scripts/run-gates.ts` empty; the gate returns to exit 0.

**Mechanism (hypothesis).** The check was written against the *deletion* shape of the defect
(`D1-8` reported `lint:webkit`, a gate that had never been added). A substring test over file text
is sufficient for "was never added" and insufficient for "was removed from the array", because
commenting out is the normal way a chain link gets disabled during debugging — and this repo's own
`check-cap-literals.ts:99-101` documents the counter-practice of blanking comments *before*
matching, so the technique to avoid this is already in the tree and was not applied here.

**Same class, not yet measured (iterate the class, not the member).** The two test-runner rows use
the same raw-text extraction — `imports: (src) => src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)`
at `:90` and `/import\s+["']([^"']+)["']/g` at `:100` — over `runAppTests.ts` and
`runRegressionTests.ts` read with no comment stripping (`:137`). Measured separately below.

**Remedy — UNVERIFIED.** Run `run-gates.ts` (and both runner files) through
`stripCommentsOnly` from `./lib/stripCode` before the membership test, exactly as
`check-cap-literals.ts` does; better, parse `GATES` by evaluating/importing `run-gates.ts`'s array
rather than grepping it. Not verified: stripping comments would also blank the *documentation* uses
of quoted gate names, and `run-gates.ts` names `'lint:gate-freshness'` inside a docblock at
`:150-151` — a stripped read may change which names are found and could red on something already
exempted. Measure before applying.

## D1-2 — `major` · same defect on the test runners: a commented-out `import` leaves the suite unexecuted and `lint:runner-completeness` still reports every file wired

**Origin:** `instrument` (`scripts/check-runner-completeness.ts`, `packages/core/testing/runRegressionTests.ts`).

**What it lets through.** The gate's entire premise — *"a test file in the tree and in NO runner is
silently unexecuted"* — is satisfied by a `//`. A whole regression file can stop running and both
`test:regression` and `lint:runner-completeness` print green. 8 registered guard proofs run
`test:regression` and 30 run `test:app`; a guard whose test file has been commented out of its
runner would be scored `failed-open` — read as *a dead guard* rather than as *an unexecuted one*,
which is the exact misreading the gate's own docblock (`:14-16`) says it exists to prevent.

**File and line.** `scripts/check-runner-completeness.ts:137` reads the runner with
`readFileSync(...,'utf8')` and hands it straight to `imports:` — `:90`
(`/import\(\s*['"]([^'"]+)['"]\s*\)/g`) and `:100` (`/import\s+["']([^"']+)["']/g`). Neither strips
comments.

**The measurement.** One store: `packages/core/testing/runRegressionTests.ts:6`. One variable: the
state of `import "./testAbuseScenarios";`.

| state | `check-runner-completeness` | `npx tsx packages/core/testing/runRegressionTests` |
|---|---|---|
| baseline | exit 0 · `test:regression: 66 tracked · 66 wired` | exit 0 · **1** line matching `abuse` |
| **plant** `// import "./testAbuseScenarios";` | **exit 0** · `test:regression: 66 tracked · 66 wired` (unchanged) | **exit 0** · **0** lines matching `abuse` · final line still `✅ All regression tests passed.` |

`packages/core/testing/testAbuseScenarios.ts` is 301 lines of break-it money assertions; it ran zero
of them and the suite announced a pass. Restored from a copy taken after the plant; `cmp` clean,
`git status --porcelain` empty, and the re-run recovers the `abuse` line.

**Control.** Proved on the sibling row in D1-1: deleting the line outright reds this same gate with
the named reason (`exit 1`, `… are in NO chain`), so the checker demonstrably reads these files and
can see this class of subject. It cannot see a comment.

**Mechanism (hypothesis).** Identical to D1-1 and not a coincidence: all three rows in `RUNNERS`
plus the `lint:rn` chain check share one raw-text extraction strategy. The docblock at `:18-23`
argues correctly that a *count* cannot see a member that never joins and replaces it with set
inclusion — but the set is built by regex over text that includes comments, so the set is not the
set of executed imports. The failure moved from *counting* to *parsing*, and only the counting half
was re-examined.

**Remedy — UNVERIFIED.** Strip comments (`stripCommentsOnly`) from the runner text before
extraction, for all three `RUNNERS` rows and the `runGates.includes` test. Not verified, and there
is a known interaction: `runAppTests.ts` carries per-import prose comments and `runRegressionTests.ts`
has comment lines directly above imports (`:22-24`, `:45`, `:70`), so the stripper's line-blanking
behaviour must be checked to confirm it does not also blank the following import line. Measure
before applying.

## D1-3 — `major` · `lint:amount-collapse` matches per LINE, so a wrapped `parseAmountField(…) ?? 0` is invisible — the exact `D5-9` line-wrap escape, in a gate written after `D5-9` was fixed

**Origin:** `instrument` (`scripts/check-amount-collapse.ts`, added at S1.13.7.8 for pass-6 `C1-6`).

**What it lets through.** The gate exists because a payday-sheet extra-payment box mapped an
unparseable entry to `$0.00`, and that figure feeds the Interest-Saved Ledger and the Drift Tracker.
Any *new* instance of that defect escapes the gate entirely if the call is wrapped across lines —
which is what Prettier does unprompted to a long call. The next `C1-6` arrives as a reflow rather
than as an edit anyone reviews, and the user is told they made a $0.00 payment they did not make.

**File and line.** `scripts/check-amount-collapse.ts:44` and `:74-76`

```ts
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/;
…
const lines = text.split('\n');
for (let i = 0; i < lines.length; i++) { if (!COLLAPSE.test(lines[i])) continue; …
```

`[^\n]*?` inside the pattern **and** `.split('\n')` at the call site: two independent line locks.

**The measurement.** One store: `apps/rn/src/utils/format.ts` (tracked, in-population, not in
`ALLOWED`). One variable: whether the appended collapse is on one line or wrapped.

| appended to `format.ts` | `npx tsx scripts/check-amount-collapse.ts` |
|---|---|
| baseline (nothing appended) | exit 0 · `✅ amount-collapse: 2 site(s) … (692 files, 60671 lines read)` |
| **control** `const n = parseAmountField(raw) ?? 0;` | **exit 1** · `❌ amount-collapse: 1 problem(s).` · `apps/rn/src/utils/format.ts:72 collapses a parsed amount to 0.` |
| **plant** `const n =\n    parseAmountField(\n      raw,\n    ) ?? 0;` | **exit 0** · `✅ amount-collapse: 2 site(s), all named with a reason (692 files, 60678 lines read)` |

The control proves the checker reads this file and sees this subject; the scan count rising from
60671 → 60678 proves it read the planted lines and matched nothing in them. Restored from a copy
taken after the plant; `cmp` clean, `git status --porcelain apps/rn/src/utils/format.ts` empty, and
the gate returns to the baseline 60671.

**Mechanism (hypothesis).** `check-cap-literals.ts:59-79` carries an entire docblock about this
exact escape — *"THIS WAS MATCHED PER LINE, AND A LINE WRAP DEFEATED IT … a formatter does unprompted
to a long declaration blinded the one gate…"* — and its fix was `[\s\S]*?` with `matchAll` over the
whole file. `check-amount-collapse.ts` was written one sub-step later, imports the same
`scanFloor`/`stripCode` helpers from that file's neighbourhood, and did not inherit the lesson. The
hypothesis is that the lesson was recorded in the *file* where it was learned rather than in a
shared matcher, so it does not travel.

**Remedy — UNVERIFIED.** Match over the whole stripped file with `matchAll` and a newline-tolerant
argument class, as `check-cap-literals.ts:79` does, deriving the line number from the match index.
Not verified, and there is a live hazard: the argument class must not be so permissive that it
spans past its own `)` into a later `?? 0` on an unrelated statement — the precise false-positive
`check-cap-literals.ts:74-77` records hitting on its first run (*"it reported four false derived
ratchets"*). Measure the new pattern against the current 692-file population before adopting it.

## D1-4 — `major` · `lint:amount-collapse`'s permission is FILE-granular while its reason is line-specific, and `break` stops the sweep at the first hit per file

**Origin:** `instrument` (`scripts/check-amount-collapse.ts`).

**What it lets through.** The header states the rule as *"Every occurrence must appear in `ALLOWED`
with a reason"* (`:16-19`) and the two entries give **line-specific** reasons — *"a PREDICATE:
`const n = parse(...) ?? 0` is consumed by `validAmount = n > 0` on the next line … Nothing stores
`n` while it is zero."* But `ALLOWED` is keyed by **file path**, and the loop `break`s after the
first match in a file. So a genuinely dishonest collapse — one that *is* stored and *does* reach a
figure the user reads — added anywhere in `WindfallSheet.tsx` or `readBackup.ts` is admitted
silently, and the printed site count does not even move.

**File and line.** `scripts/check-amount-collapse.ts:52-59` (`ALLOWED` keyed by `rel`), `:78`
(`if (!(rel in ALLOWED))`), `:85` (`break`).

**The measurement.** One store: `apps/rn/src/components/plan/WindfallSheet.tsx`. One variable: a
second, stored collapse inserted immediately below the permitted predicate at `:52`.

| state | gate |
|---|---|
| baseline | exit 0 · `✅ amount-collapse: 2 site(s), all named with a reason (692 files, 60671 lines read)` |
| **plant** — `const plantedStored = parseAmountField(amount) ?? 0;` inserted at `:53`, value stored, never compared to 0 | **exit 0** · `✅ amount-collapse: 2 site(s), all named with a reason (692 files, 60673 lines read)` |

Note `2 site(s)` in both rows: the count is a count of *files*, not of occurrences, so the gate's
own success line cannot show the new one. Line count 60671 → 60673 confirms the planted lines were
read. Restored from a copy taken after the plant; `cmp` clean, `git status --porcelain` empty, gate
back to 60671.

**Mechanism (hypothesis).** The `break` was probably added so one file could not produce many
duplicate problem lines. It has the side effect of making `found` a file set, which then makes the
stale-permission check at `:89-95` a file-level check too, which then makes `ALLOWED` file-granular
by construction. One convenience at `:85` propagated the granularity through three downstream
decisions. The reasons written into `ALLOWED` describe a *line* and are enforced over a *file*.

**Remedy — UNVERIFIED.** Drop the `break`, collect every occurrence as `rel:line`, and key `ALLOWED`
on the site rather than the file (or add a per-entry occurrence cap so an extra one reds). Not
verified: keying on line number makes the ledger churn on every unrelated edit above the site, so
the key probably has to be a normalised source snippet rather than a line — which is a design
decision, not a patch. Measure both against the two live entries before choosing.

## D1-5 — `major` · `lint:store-id-writes` walks `apps/rn/src/store` for `.ts` only, so the three `.tsx` files *inside that same directory* are never read — and the scan floor cannot see it

**Origin:** `instrument` (`scripts/check-store-id-writes.ts`, added at S1.13.7.11 for pass-6 `A3-3`).

**What it lets through.** The defect this gate names — `list.map(x => x.id === id ? patch(x) : x)`
over an array holding no such id — fires `set`, re-renders every subscriber, and *"no return value
distinguishes a miss from a hit — so the user taps, the row does not change, and nothing anywhere
says why"*. The gate's header says *"A ninth is one paste away; this is what sees it."* It does not
see one pasted into `apps/rn/src/store/StoreContext.tsx`, `tutorialShell.tsx` or
`tutorialTargets.tsx` — three store files in the directory the gate names, one of which
(`StoreContext.tsx`) is the active-store rewire that `storeContext.test.ts` exists to guard
(*"a write aimed at a sandbox must never move the real store"*, `runAppTests.ts:215-218`).

**File and line.** `scripts/check-store-id-writes.ts:65`

```ts
else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) {
```

`.tsx` never enters the walk. `:71` seeds the walk at `apps/rn/src/store` only.

**The measurement.** One plant, appended verbatim to two files in the *same directory*:

```ts
export function plantedBareIdWrite(list: { id: string }[], id: string) {
  return list.map((r) => (r.id === id ? { ...r, touched: true } : r));
}
```

| file it was appended to | `npx tsx scripts/check-store-id-writes.ts` |
|---|---|
| baseline, nothing planted | exit 0 · `✅ … across 51 store file(s) … [read 3778 lines, floor 3589]` |
| **plant** `apps/rn/src/store/StoreContext.tsx` | **exit 0** · `✅ … across 51 store file(s) … [read 3778 lines, floor 3589]` — **identical, count unchanged** |
| **control** `apps/rn/src/store/greeting.ts` | **exit 1** · `❌ store id writes: 1 bare \`x.id === id\` comparison(s) … the cap is 0` · `apps/rn/src/store/greeting.ts:51: return list.map((r) => (r.id === id ? { ...r, touched: true } : r));` |

The control proves the checker sees this subject in this directory. The `3778 lines` figure being
**byte-identical** across baseline and plant is the direct evidence the `.tsx` file was never
opened — and it also shows the scan floor cannot catch this: the floor guards a count *falling*,
and a permanently-excluded extension never contributed to the count in the first place. Both files
restored from copies taken after the plant; `cmp` clean on each, `git status --porcelain apps/rn/`
empty, gate back to 3778.

**Mechanism (hypothesis).** The walk was copied from `check-cap-literals.ts:52`
(`e.name.endsWith('.ts')`), where the population is `scripts/` — a directory that legitimately holds
no `.tsx`. The extension filter travelled with the walk into a directory where it is wrong, and the
`51 store file(s)` in the success line reads as complete because nobody counts the directory by
hand. Note the same header argues at length (`:50-57`) for a walk over `git ls-files` *specifically
so the population cannot be narrowed accidentally* — and then narrows it by extension.

**A second, larger scope question, stated but NOT measured as a defect.** The seven live instances
of this exact shape outside the gate's roots are all in the legacy Next root
(`lib/hooks/useDebts.ts:135,154,176`, `useGoals.ts:74`, `useRequiredExpenses.ts:83,101`,
`components/LivingExpensesSection.tsx:18`). Those are `P6.11` deletions and not the shipping app, so
I am not calling them a defect — but they are the reason the gate's *"no legitimate remaining site"*
sentence at `:86-89` is true only of `apps/rn/src/store/**/*.ts`, and the sentence does not say so.

**Remedy — UNVERIFIED.** Accept `.tsx` in the walk (`/\.tsx?$/` with the same `.test.` exclusion),
re-measure the scan floor, and update `gate-scan-floors.json`'s `store-id-writes` entry in the same
edit. Not verified — adding three files raises the observed count above the recorded 3778, which the
floor permits (it is downward-only) but leaves the ledger's `measuredCount: 3778` stale, and a stale
ledger figure is how the *next* narrowing goes unnoticed.

## D1-6 — `major` · `lint:rounding`'s pinned cap counts per LINE, so a wrapped `Math.round(x * 100) / 100` grows the population without moving the number

**Origin:** `s0-first-look` (`scripts/check-rounding.ts` — never swept by any pass).

**What it lets through.** This gate is the only thing holding the money-rounding population at 93
while the collapse to `roundMoney` is scheduled. Its own header states the stake — *"two producers of
one fact is the shape this repo has paid for three times — `A1`, `A2` and `A-F4` were each exactly
that"* — and the whole design is *"the copies cannot grow while the collapse is scheduled."* They
can. A 94th copy written across lines is admitted, and the gate prints `93 … (cap 93,
downward-only)`. The eventual user-facing consequence is the one the three prior findings already
cost: a second producer of a money figure that drifts from the owner.

**File and line.** `scripts/check-rounding.ts:56` and `:70-73`

```ts
const ROUNDING = /Math\.round\([^;]*?\*\s*100\s*\)\s*\/\s*100/g;
…
for (const line of code.split('\n')) { ROUNDING.lastIndex = 0; if (ROUNDING.test(line)) sites.push(…); }
```

`[^;]*?` would cross a newline — the line lock is `code.split('\n')` at `:70`, not the pattern.

**The measurement.** One store: `apps/rn/src/utils/format.ts`. One variable: whether the appended
copy is on one line or wrapped.

| appended | `npx tsx scripts/check-rounding.ts` |
|---|---|
| baseline | exit 0 · `✅ rounding: 93 inline money-rounding expressions (cap 93, downward-only) … [read 52128 lines]` |
| **control** `return Math.round(x * 100) / 100;` | **exit 1** · `❌ rounding: 94 inline money-rounding expressions; the cap is 93 and it only goes DOWN.` |
| **plant** `return (\n    Math.round(\n      x * 100,\n    ) / 100\n  );` | **exit 0** · `✅ rounding: 93 inline money-rounding expressions (cap 93, downward-only) … [read 52135 lines]` |

The scan count 52128 → 52135 proves the planted lines were read and matched nothing. Restored from a
copy taken after the plant; `cmp` clean, `git status --porcelain` empty, count back to 93/52128.

**Secondary, read not planted.** `:72` pushes **once per line**, so two copies on one line count as
one. Because the cap is pinned in both directions (`:82` and `:94`), removing one copy while adding
a two-per-line one nets to 93 and stays green with the population at 94. Same root cause.

**Mechanism (hypothesis).** Identical to D1-3: `check-cap-literals.ts:59-79` documents the line-wrap
escape and fixes it with whole-file `matchAll`; the two gates written after it
(`check-rounding.ts`, `check-amount-collapse.ts`) both kept `split('\n')`. The lesson lives in one
file's docblock rather than in a shared scanning helper, and `lib/scanFloor.ts` — the helper these
gates *do* share — measures how much was read, not how it was matched. So the shared infrastructure
cannot carry the lesson.

**Remedy — UNVERIFIED.** Match with `matchAll` over the whole stripped file and derive line numbers
from the match index; keep `[^;]*?` so the match still cannot run past a statement boundary. Not
verified: recounting over the whole file will almost certainly change the 93, because the same
per-line push that hides a wrap also collapses multi-per-line hits — so `MAX_INLINE_ROUNDING` must be
re-measured and re-pinned in the same edit, and the gate reds in both directions until it is.

## D1-7 — `major` · `lint:fixture-dates`' never-capped IMMINENT half misses a calendar literal that is line-wrapped or assigned via a variable — and counts it as `non-aging` while doing so

**Origin:** `instrument` (`scripts/check-fixture-dates.ts`, added at S1.13.7.1 for pass-6 `A1-4`/`A1-5`).

**What it lets through.** The `imminent` half is the one described as *"always fatal, never capped …
the half that fires BEFORE the damage"* — it exists because `A1-5` was found by a human two days
before its fuse blew, and *"there is no reason to depend on that again."* A fuse spelled either of
two ordinary ways is not seen. The consequence is exactly `A1-4`: on a date nobody is watching, a
fixture crosses into the past, `isOverdue` flips, and every spec inheriting that fixture silently
changes branch with no line of test code edited and nothing red.

**File and line.** `scripts/check-fixture-dates.ts:95` and `:144-150`

```ts
const AGING_KEY = /([A-Za-z_]*(?:Date|At|AsOf))\s*:\s*$/;
…
for (const m of line.matchAll(LITERAL)) {
  const before = line.slice(0, m.index);
  const key = AGING_KEY.exec(before)?.[1] ?? '';
  if (!key) { nonAging += 1; continue; }
```

The key must be an object key ending in `:` on the **same line, immediately before** the literal.
Anything else is silently reclassified `non-aging` — a bucket that is only ever printed, never
refused.

**The measurement.** One store: `apps/rn/src/utils/format.test.ts` (tracked, test-shaped, not
clock-pinned). One variable: how `dueDate: '2026-09-10'` is spelled. Today is 2026-09-02, so the
literal is 8 days out — squarely inside `IMMINENT_DAYS = 21`.

| spelling appended | `npx tsx scripts/check-fixture-dates.ts` |
|---|---|
| baseline | exit 0 · `… 0 imminent fuses · 121 aged … · 115 on non-aging fields.` |
| **control** `dueDate: '2026-09-10',` | **exit 1** · `❌ fixture-dates: 1 calendar literal(s) cross into the past within 21 days.` · `apps/rn/src/utils/format.test.ts:64  dueDate: '2026-09-10'  — fires in 8 day(s)` |
| **plant A — wrapped** `dueDate:\n    '2026-09-10',` | **exit 0** · `… 0 imminent fuses · 121 aged … · **116** on non-aging fields.` |
| **plant B — variable** `const plantedDueDate = '2026-09-10';` then `{ dueDate: plantedDueDate }` | **exit 0** · `… 0 imminent fuses · 121 aged … · **116** on non-aging fields.` |

⚡ The `non-aging` count moving **115 → 116** in both plants is the load-bearing evidence: the gate
*read* the literal, matched `LITERAL`, and then filed a live fuse under the one bucket it never
refuses. This is not a population hole — it is a misclassification the green line reports as a
feature. Restored from a copy taken after the plants; `cmp` clean, `git status --porcelain apps/rn/`
empty, `non-aging` back to 115.

**Live instances: ZERO, and I looked.** I re-ran the gate's own population rule (220 test-shaped
files, same `isTestShaped` predicate, same `fixture-date-ok:` exemption) with the two relaxed
patterns. Form A (aging key at end of line, literal on the next): **0**. Form B (variable named
`*Date`/`*At`/`*AsOf` assigned a literal): **1**, and it is
`apps/rn/src/liveActivity/paydayActivityContent.test.ts:40`'s `currentDate`, in a clock-pinned file
— a deliberate pin, not a fuse. So this is a latent hole, not a live one; I am reporting it as
`major` because the instrument's own claim (*"never capped … fires before the damage"*) is false as
stated, not because a fuse is burning today.

**Mechanism (hypothesis).** Third instance of the same root cause as D1-3 and D1-6: the matcher is
locked to a line. Here it is worse than in those two, because the fallthrough is not "no match" but
"match, then classify as harmless" — `nonAging` is a bucket with no refusal attached, so the escape
increments a printed number rather than leaving the counts unchanged. The `AGING_KEY` docblock at
`:91-93` argues the right thing (*"matched by shape … rather than by a list of the eight names that
happen to exist today"*) and then anchors that shape to `$`.

**Remedy — UNVERIFIED.** Search the stripped file text rather than per line, allowing whitespace and
newlines between the key's `:` and the literal; and treat a `const|let` binding whose *name* matches
`AGING_KEY`'s shape as an aging site. Not verified, and there is a real risk in the second half:
`CLOCK_PIN` at `:129` matches only `currentDate:` as an object key, so extending variable-name
matching without extending the clock-pin detection the same way would start refusing deterministic
tests — the precise failure `:114-127` records the first cut of this gate making, and which the
header calls *"a remedy that introduces the defect it describes."*

## D1-8 — `major` · `lint:sandbox` matches the singleton import per LINE, so a Prettier-wrapped `import {\n  appStore,\n}` — or a namespace import — leaks the real store past the guard

**Origin:** `instrument` (`scripts/check-sandbox-writes.ts`).

**What it lets through.** This gate's job is stated in its own header: *"A component that reaches the
`appStore` singleton instead reads scripted money and mutates the user's REAL plan — silently … That
shipped. A user edited an expense inside the demo from TestFlight and the write landed on their own
plan."* Both escapes below add exactly that leak with the gate green. `realWriteGuard` would still
refuse the *write* at runtime, but the header is explicit that this is the complementary half — *"a
refused write is still a broken control the user tapped, and the refusal only surfaces if someone is
reading Sentry"* — and the READ half is not refused at all: a component with a wrapped import reads
the real user's balances while rendering inside the demo.

**File and line.** `scripts/check-sandbox-writes.ts:108` and `:128-133`

```ts
const IMPORT = /^\s*import\s*\{[^}]*\bappStore\b[^}]*\}\s*from\s*['"][^'"]*appStore['"]/;
…
lines.forEach((raw, i) => { const line = code[i] ?? ''; if (!IMPORT.test(line)) return; …
```

The whole `import … from '…'` statement must be on one line. `:104-106` calls this *"one regex over
one line per file is exact"* — it is exact about the *form* it matches, not about the class.

**The measurement.** One store: `apps/rn/src/utils/format.ts` (walked, not in `ALLOWED`). One
variable: the spelling of the singleton import prepended to it.

| prepended | `npx tsx scripts/check-sandbox-writes.ts` |
|---|---|
| baseline | exit 0 · `✅ lint:sandbox — 24 sanctioned appStore consumers, no unsanctioned ones.` |
| **control** `import { appStore } from '@/store/appStore';` | **exit 1** · `❌ lint:sandbox — 1 unsanctioned reference(s) to the appStore singleton:` · `apps/rn/src/utils/format.ts:1` |
| **plant A — wrapped** `import {\n  appStore,\n} from '@/store/appStore';` | **exit 0** · `✅ lint:sandbox — 24 sanctioned appStore consumers, no unsanctioned ones.` |
| **plant B — namespace** `import * as appStoreModule from '@/store/appStore';` + `const leaked = appStoreModule.appStore;` | **exit 0** · same `✅`, `24` unchanged |

The sanctioned count staying at **24** in both plants shows the file was walked and produced no
match. Restored from a copy taken after the plants; `cmp` clean, `git status --porcelain apps/rn/`
empty, gate back to `24`.

**Live instances: ZERO, and I looked.** No multi-line import naming `appStore`, no
`import * as … from '…appStore'`, no `import('…appStore')`, and no barrel re-exporting `appStore`
anywhere in `apps/rn/src` or `packages/`. Latent, not live.

**Mechanism (hypothesis).** Same root cause as D1-3/D1-6/D1-7 — a per-line matcher — but here the
subject is an *import statement*, which is the construct a formatter is most likely to wrap, because
wrapping is triggered by the import list growing. So the escape is produced by adding a second named
import beside `appStore`, which is an ordinary edit nobody would think of as touching this gate. The
header's confidence (*"one regex over one line per file is exact"*) reads as a considered decision
about matching the import rather than the usage; the line-lock appears to be incidental to that
decision rather than part of it.

**Remedy — UNVERIFIED.** Match over the comment-stripped whole file with a newline-tolerant pattern
(`import\s*\{[^}]*\bappStore\b[^}]*\}\s*from\s*['"][^'"]*appStore['"]` with `s`-safe classes), and
add a second pattern for `import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*appStore['"]`. Not verified, and
one hazard is documented at `:122-127`: this gate must strip **comments only**, never string
contents, because blanking strings once turned `from '@/store/appStore'` into blanks and *"reported
all 24 allow-list entries stale"*. Any change to the scanning path has to be re-run against the
stale-entry check, not just the offender check.

## D1-9 — `major` · `lint:finding-guards`' duplicate-id detector is defeated by re-indenting the registry, because it matches keys with a hard-coded two-space anchor

**Origin:** `instrument` (`scripts/check-finding-guards.ts`).

**What it lets through.** The detector exists because *"`JSON.parse` silently keeps the LAST of any
repeated id … one finding is silently untracked and the count is short by one"* (`:191-197`). Under
a four-space indent it finds **zero keys** and can never fire, so a duplicated id — which overwrites
a registered closure's guard with another entry's body — is reported by nothing. A closure whose
guard has been silently replaced still reads `CLOSED` in the ledger every later pass schedules off.

**File and line.** `scripts/check-finding-guards.ts:237`

```ts
const keyLines = [...rawRegistry.matchAll(/^\s{2}"([^"]+)":/gm)].map((m) => m[1]);
```

`\s{2}` is an exact-two-whitespace anchor, not `\s+` or `\s*`.

**The measurement.** Two probe registries, byte-identical in content, differing only in indent
width. Both hold **268 key lines** parsing to **267 unique ids** — id `S1P1-B1-OWNER` appears twice.
Neither touches the tracked `scripts/finding-guards.json`; both were passed via the gate's own
`--registry=` input (`:47-50`), which exists precisely so this gate can be planted.

| probe | `npx tsx scripts/check-finding-guards.ts --registry=…` |
|---|---|
| `d1-probes/reg-indent2.json` (2-space) | **exit 1** · `❌ finding-guards: 1 problem(s).` · `duplicate id(s) in the registry: S1P1-B1-OWNER — JSON.parse keeps only the LAST…` |
| `d1-probes/reg-indent4.json` (4-space) | **exit 0** · `✅ finding-guards: 266 of 267 findings carry a standing guard` · `proof: 137 EXECUTED · 7 STALE …` — **no duplicate mentioned at all** |

The 2-space run is the control: it proves the checker sees the subject and names it. Nothing in the
tree was modified for this finding; the tracked registry was never opened for writing, and
`git status --porcelain scripts/finding-guards.json` is empty.

**Exposure, stated honestly.** For two *different* entries sharing an id, the unique count falls and
`MIN_ENTRIES`' strict equality reds anyway — with the misleading *"Entries were REMOVED … Do not
lower the floor"* message, which is exactly the outcome `:191-197` says the dupe check exists to
prevent. Full silence needs the count to be restored — a duplicate plus a new entry, with
`MIN_ENTRIES` raised in the same edit, which is the normal way a registry grows. So the practical
window is narrow; I am rating this `major` on the instrument's own terms (it reports green while
doing nothing) rather than on blast radius, per the brief's note that the two do not predict each
other.

**Mechanism (hypothesis).** The regex was written against the file as it is formatted today and
encodes the formatter's output as a correctness assumption. It is the `check-cap-literals` line-wrap
lesson in a different alphabet: a matcher anchored to incidental layout. Nothing in the repo pins
the registry's indent — no `.editorconfig` rule, no gate — so any tool that rewrites this JSON
(`prove:guards` writes it on every recorded run) is one serializer-option away from disabling the
check permanently and silently.

**Remedy — UNVERIFIED.** Use `/^\s*"([^"]+)"\s*:/gm` and restrict to top level by tracking brace
depth, or parse with a JSON reviver / streaming parser that reports repeated keys. Not verified:
relaxing to `\s*` without a depth check will start matching *nested* object keys (`"what"`,
`"token"`, `"file"`, `"unfix"` all appear at deeper indents in every entry), which would report
hundreds of false duplicates. The depth-tracking half is the part that needs measuring.

## D1-10 — `minor` · `lint:finding-guards` prints its `✅` success line before it has decided, so a failing run emits a green tick and a red verdict together

**Origin:** `instrument` (`scripts/check-finding-guards.ts`).

**What it lets through.** Nothing, on exit code — `reportProblems()` at `:562` is the last statement
and exits 1 correctly. What it produces is the output shape this repo's brief names as a recurring
trap: *"a harness printing `reason=WRONG` beside a green tick."* Under `lint:rn`, which streams every
gate's own output with `stdio: 'inherit'` and prints a summary after, a reader scrolling for `✅
finding-guards` finds one on a failed run.

**File and line.** `scripts/check-finding-guards.ts:478-481` — the unconditional
`console.log('✅ finding-guards: …')` sits above the staleness scan (`:511-537`, which can
`problems.push`) and above `reportProblems()` (`:562`).

**The measurement.** From the D1-9 probe run against `reg-indent2.json`, in order, on one run:

```
✅ finding-guards: 266 of 267 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
…
❌ finding-guards: 1 problem(s).
  • duplicate id(s) in the registry: S1P1-B1-OWNER — …
```

Exit 1.

**Mechanism (hypothesis).** The `✅` line and the `proof:` line were both added to print on the
*green path* deliberately (`:483-488`, `:546-548` — *"a number nobody sees is a number nobody
drains"*), and the file's own `:455-469` docblock records moving the verdict to the end precisely so
that later `problems.push` calls are not dead. Those two decisions compose into printing the success
line before the verdict exists: the fix for the dead-code problem moved the verdict down without
moving the ✅ with it.

**Remedy — UNVERIFIED.** Buffer the summary lines and emit them after `reportProblems()` returns, or
gate the `✅` prefix on `problems.length === 0`. Not verified — the stale/unguarded listings are
deliberately printed on the green path and some are emitted between the ✅ and the verdict, so the
ordering change has to keep those visible on a passing run.

> **Reproducing D1-9 / D1-10.** `d1-probes/mkreg-D1-9.py` regenerates both probe registries
> (`python d1-probes/mkreg-D1-9.py indent2` / `indent4`, run from the repo root); the two 320 KB JSON
> files were deleted after measuring rather than committed. It reads the tracked registry and never
> writes to it.

## D1-11 — `major` · every proof and plant certifying the six gates above exercises the ONE spelling the gate already catches, so `prove:guards` reports `EXECUTED` over matchers that miss their own class

**Origin:** `instrument` (`scripts/finding-guards.json` proofs + `scripts/test-gate-plants.ts`
scenarios, over the gates in `ROUTING-D1.txt`).

**What it lets through.** This is the finding that explains D1-1 and D1-3 through D1-8 rather than
repeating them. Six line-locked or population-narrowed matchers are each certified by a proof the
ledger badges `EXECUTED` — 137 of them are so badged, and the `proof:` line prints that number on
every green run. The badge means *the guard redded on one planted spelling*, and in every case
below that spelling is the one the gate was written against. The result is a ledger in which the
recurring defect of this project — *a check that cannot fail* — is invisible by construction,
because the plant that would expose it is never the plant that gets written.

**The measurement — six instruments, read out of `scripts/finding-guards.json` and
`scripts/test-gate-plants.ts`, each paired with the sibling spelling I planted this round:**

| gate | what its registered proof / scenario plants | sibling spelling I planted | result |
|---|---|---|---|
| `lint:runner-completeness` | `S1P6-D1-8-GATECHAIN` — **deletes** `    'lint:fixture-dates',\n` from `run-gates.ts` | the same line **commented out** | exit 0 (D1-1) |
| `lint:amount-collapse` | `S1P6-C1-6-AMOUNTCOLLAPSE` — a **single-line** `parseNonNegativeAmount(next) ?? 0` in `PaydayCaptureSheet.tsx` | the same call **wrapped** across lines | exit 0 (D1-3) |
| `lint:amount-collapse` | (no proof exercises a second site in an `ALLOWED` file) | a stored collapse **below** the permitted predicate in `WindfallSheet.tsx` | exit 0 (D1-4) |
| `lint:store-id-writes` | `test-gate-plants.ts:559-570` — writes `apps/rn/src/store/__gate_plant_id_write__.ts`, a **`.ts`** file | the same body in `StoreContext.**tsx**`, same directory | exit 0 (D1-5) |
| `lint:rounding` | `S1P5-A5-4-ROUNDINGCAP` — raises `MAX_INLINE_ROUNDING` 93 → 94; **it never plants a rounding copy at all**, so the matcher is untested | a **wrapped** `Math.round(x * 100) / 100` | exit 0 (D1-6) |
| `lint:fixture-dates` | `S1-FIXTURE-DATE-FUSE` — a **single-line** `dueDate: '2026-09-10'` in `seed.ts` | the same literal wrapped, and via a variable | exit 0 twice (D1-7) |
| `lint:sandbox` | **nothing.** No `test:gate-plants` scenario (`grep "gate: '"` returns 25 and none is `lint:sandbox`); the only registry entry, `S1P6-B2-2-EXEMPTION-REASON`, pins a **prose sentence** inside the `ALLOWED` map and runs `test:app` | a **wrapped** and a **namespace** import of the singleton | exit 0 twice (D1-8) |

Every "sibling spelling" column is a measurement written up in the finding it cites, each with its
own control proving the checker sees the file.

**Mechanism (hypothesis).** The un-fix for a proof is derived by taking the defect *as it was
reported* and re-inserting it. A reported defect is a specific line someone found, so the un-fix is
a specific line — and a matcher written against that same specific line will always red on it. The
proof therefore measures agreement between two artefacts derived from the same example, not the
matcher's coverage of its class. `check-runner-completeness.ts:111-114` records this exact failure
once already (*"`test-gate-plants.ts` planted its proof of this very gate into … one of the two
populations it already covered. The scenario could not discover the third by construction."*), and
`prove-guards.ts`'s 2×2 is designed to catch a plant that lands and changes nothing — not a plant
that lands on the only member of the class the gate can see.

**Remedy — UNVERIFIED.** For every matcher-based gate, require **two** un-fixes in the proof: the
reported spelling, and one sibling spelling that a formatter would produce (wrapped, re-indented,
different extension, second occurrence). `S1P5-D5-9-CAPWRAP` already does exactly this and is the
model — it carries two `unfix` edits and its `what` explains why one alone is invisible. Not
verified: adding a second un-fix to a proof means the proof reds if **either** lands, so a gate that
legitimately only covers one spelling would start failing `prove:guards` and the ledger's
`MAX_UNPROVEN`/`MAX_AUTHORED` ratchets would move. Measure the cost on one entry before sweeping.

## D1-12 — `major` · the pass exit and the pass route have TWO DIFFERENT POPULATIONS: 76 money-bearing files were routed to lanes and are in no claims file, so `audit:read-coverage` can print "all money-bearing files read" without them

**Origin:** `instrument` (`scripts/check-pass-coverage.ts`).

**What it lets through.** `check-pass-coverage.ts` is *the exit line* — its own header says it exists
because *"'I swept the surface' is exactly the unfalsifiable claim this round has spent itself
killing."* Its population is `Object.keys(claims)` (`:65-66`), i.e. whatever is in
`scripts/surface-coverage.s1.json`. `audit-route.ts` routed **639** files into the twelve sub-lane
manifests. **86 of those are in neither `surface-coverage.s1.json` nor `surface-coverage.s0.json`,
and 76 of the 86 are money-bearing by the exit's own `carriesMoneyClaim` predicate.** A pass can
therefore be declared converged with `✅ pass-coverage [s1 · s1p7]: all N money-bearing file(s)
read` while 76 money-bearing files it handed to auditors were never in the population the exit
counted. Among them: `packages/core/imports/debtCsv.ts`, `packages/core/scan/parseStatementText.ts`,
`apps/rn/src/store/demoRun.ts`, `apps/rn/src/store/sandboxRun.ts`, and eleven `apps/rn/tests/e2e/*.spec.ts`.

**File and line.** `scripts/check-pass-coverage.ts:65-66` (population), `:91` (`money`
classification), `:123-133` (the exit assertion). The route's population is
`scripts/audit-route.ts`; the two are never compared.

**The measurement.** Runner: `docs/audits/2026-09-02-s1-money-pass7/d1-probes/money-check-D1-12.ts`,
which imports the exit's **own** predicate (`carriesMoneyClaim`, `MIN_MONEY_BEARING`) from
`scripts/lib/moneyClaim` and reads the twelve `ROUTING-*.txt` manifests beside it. `npx tsx` on it
prints:

```
MIN_MONEY_BEARING = 424
routed (12 sub-lanes) = 639
routed but in NEITHER claims file = 86
of those, MONEY-BEARING by the exit's own predicate = 76
```

Per sub-lane (`in s1 claims` / `in s0 only` / `in neither`):

```
A1 68→53/4/11   A2 55→55/0/0   A3 79→65/10/4    B1 40→38/0/2
B2 51→35/0/16   B3 64→40/4/20  C1 52→44/0/8     C2 72→72/0/0
C3 75→73/2/0    D1 31→0/31/0   D2 40→0/27/13    D3 12→0/0/12
```

⚠️ **Lane D1 (this lane) contributes ZERO to the S1 exit by construction** — all 31 of its files are
S0-claimed, and `package.json`'s `audit:record-reads` and `audit:read-coverage` are hard-wired to
`--surface=s1`. `record-reads.ts:116-119` handles that correctly and honestly (off-surface paths are
*reported and not recorded*, `:29-31`), so this half is documented behaviour, not a defect. The
defect is the **86 in neither file**, which no surface's exit can ever claim.

**⚠️ And the brief's own number for this is wrong in count and in membership.** `BRIEF.md:121-123`
states *"**25 more** are owned by no claims file at all; they are listed in
`UNSEEN-NEIGHBOURS.txt`."* That file holds **9** lines; the measured figure is **86**; and the
intersection of the two sets is **0** — not one of the 86 appears in the file said to list them.
This is the *class's-own-label-is-unreliable* shape the brief itself opens with, applied to the
brief.

**Mechanism (hypothesis).** `record-reads.ts:29-31` names the intended three off-surface categories
— *"S0 instruments, off-surface config and the legacy root"* — and the claims files were built to
hold S1 and S0. The route's buckets were later widened (neighbours, first-look, off-surface) without
a corresponding widening of the claims files, so a file can be *routed as owed a read* and
*unclaimable* at the same time. Nothing compares the two populations: `audit:route-check` validates
the route against itself and `audit:read-coverage` validates claims against themselves.

**Remedy — UNVERIFIED.** Make the route's own output the exit's population, or add an assertion that
every routed path is a key in one of the claims files and red on the difference — the shape
`check-runner-completeness.ts` already uses for a set difference. Not verified: 86 files would have
to be classified into a surface first, and doing that by hand is the enumeration this project has
measured short on six consecutive items. Derive the membership two independent ways and check they
agree before writing either claims file.

## D1-13 — `major` · `lint:trust-claims`' ledger population is joined by `.debts`-style property access, so a money surface that DESTRUCTURES the entity lists is never considered — and the green line's sentence is false while it is there

**Origin:** `instrument` (`scripts/check-trust-claims.ts`).

**What it lets through.** A production file that sums the user's balances, prints the total with a
sanctioned formatter and never asks `trustSelectors` — i.e. *"states a number about money the app
could not read"*, the rule this gate exists to enforce. That is the shipped defect the file's own
header records: Money printing *"0% APR"* on a card charging 22%. The gate then prints
`⭐ 0 claim sites open — all 6 money-printing files that read the user's entities call the guard`,
a sentence that is **false as printed** while the escape is present.

**File and line.** `scripts/check-trust-claims.ts:243` (absolute) —

```ts
const READS_ENTITIES = /\.(debts|goals|requiredExpenses|livingExpenses)\b/;
```

and its use at `:333` (`if (!PRINTS_MONEY.test(src) || !READS_ENTITIES.test(src)) continue;`). The
leading `\.` requires property access; `const { debts } = store` has no dot.

**The measurement.** One store: `apps/rn/src/store/greeting.ts`. One variable: how the same planted
money surface reaches the entity list. Both plants import `formatWhole` (a derived, sanctioned
formatter), sum `d.balance`, print it, and never call the guard.

| how the plant reads the list | `npx tsx scripts/check-trust-claims.ts` |
|---|---|
| baseline, nothing planted | exit 0 · `⭐ 0 claim sites open — all **6** money-printing files … call the guard` |
| **control** `store.debts.reduce(…)` | **exit 1** · `❌ trust claims: 1 problem(s)` · `[ledger] apps/rn/src/store/greeting.ts reads the user's entity lists and prints money without asking trustSelectors.` |
| **plant** `const { debts } = store;` then `debts.reduce(…)` | **exit 0** · `⭐ 0 claim sites open — all **6** money-printing files … call the guard` — the count does not move, so the file was never in the population |

Restored from a copy taken after the plant; `cmp` clean, `git status --porcelain apps/rn/` empty,
gate back to the baseline two lines.

**Live instances: ZERO, and I looked.** `d1-probes/destructure-sweep-D1-13.ts` re-implements the
gate's own `PRINTS_MONEY`, `ASKS_GUARD` and `isTest` predicates over the same `git ls-files`
population and adds a destructuring pattern: **6 files in the population, 0 escapes**. Latent, not
live.

**⚠️ And `MIN_POPULATION` cannot catch it — the file says so about a sibling of this exact hole.**
`:329-358` records `D5-13`: a money file using an unlisted formatter *"was never *considered*, so it
could never be *unguarded*"*, and *"`MIN_POPULATION` cannot save it. A floor sees the population
SHRINK; it is structurally blind to a money file that never joins."* The remedy taken was to derive
the **formatter** names from the format modules' exports. The **entity-read** half of the same
conjunction was left as a hand-written regex and carries the identical property.

**Two smaller things measured in the same pass, reported here rather than as separate rows.**
1. `MONEY_FORMATTERS` derives from `FORMAT_MODULES`, a hard-coded list of exactly three paths
   (`:242`), and the docblock at `:211-213` describes it as *"Adding a formatter to
   `utils/format*.ts` now enrols it automatically"* — a glob claim over a literal list. A formatter
   in a **new** module is not enrolled. Measured: the three modules export exactly
   `formatWhole`, `formatCurrency`, `formatDisplayAmount` — three, against a `< 3` guard, so the
   fail-open check has zero slack in the other direction too.
2. The derivation matches only `export function format\w+`. An `export const formatX = …` in any of
   the three modules would not be derived. Measured: none of the three uses that form today.

**Mechanism (hypothesis).** The population is a **conjunction**, and the `D5-13` repair hardened one
conjunct and not the other. A conjunction is only as narrow as its narrowest term, so the file's own
lesson — *"do not repair this by adding `formatDisplayAmount` to the regex; a fifth name would have
closed the finding and left the class exactly as it was"* — applies verbatim to `READS_ENTITIES`,
and adding `debts` to a regex is what the fix would look like.

**Remedy — UNVERIFIED.** Widen `READS_ENTITIES` to match the entity names as identifiers regardless
of access form (destructuring, `store['debts']`, a typed parameter named `debts`). Not verified, and
the risk is the one `:186-193` already measured and rejected once: the first cut of this ledger
matched loosely, returned **16** files *"most of them matching on the word 'balance' in JSX prose"*,
and was thrown away because *"a ledger whose rows mostly say false positive … reads as coverage and
is a list of noise."* Any widening has to be measured against the current 6 before it is adopted.

## D1-14 — `minor` · `lint:contrast` enforces "a token nothing paints is arithmetic about nothing" for exactly one token, and `text.inverse` is defined with zero consumers and named nowhere in the grid

**Origin:** `neighbour` (`scripts/check-contrast.ts` — the one non-`instrument` file in this lane).

**What it lets through.** Nothing user-facing today: the token is unused, so no pair renders. What it
lets through is the gate's own stated failure mode, applied unevenly. `:259-264` reads *"`border.control`
has to be USED, or this whole file is arithmetic about a colour nothing paints … The token existing
and the token being reachable are different claims, and only the second one is worth a passing
gate."* That reachability assertion exists for **one** token. `text.inverse` is defined, is in no
`FOREGROUNDS` row, is in no `EXTRA_PAIRS` row, and has no consumer — so the very state
`border.control`'s check refuses is present one group over and nothing says so.

**File and line.** `apps/rn/src/theme/colors.ts:45` — `inverse: { light: '#ffffff', dark: '#0f172a' }`.
`scripts/check-contrast.ts:98-108` (`FOREGROUNDS`, nine hand-typed entries),
`:214-222` (`EXTRA_PAIRS`, seven hand-typed pairs), `:259-264` (the single reachability assertion).

**The measurement.** `d1-probes/contrast-tokens-D1-14.ts` enumerates `colors.ts`'s own groups and
diffs them against every token the gate names:

```
text:       5 tokens · 4 named ·  1 named nowhere   → text.inverse
accent:     7 tokens · 7 named ·  0
background: 6 tokens · 4 named ·  2 named nowhere   → background.overlay, background.scrim
surface:    6 tokens · 6 named ·  0
border:     4 tokens · 0 named ·  4 named nowhere   → subtle, default, strong, control
```

⚠️ **Only the first row is a finding.** `overlay`/`scrim` are excluded with a stated reason at `:93`
(*"translucent and are not grounds"*), and all four `border.*` are covered by `:407-425`'s own
section, three of them with an enumerated justification at `:410-425`. `text.inverse` has no such
sentence anywhere in the file. Consumers: `grep -rn "\.inverse\b" apps/rn/src` → **0 hits**; the ten
files `git grep -l inverse` returns use the word in unrelated senses (`inverseRequired`, prose).

**Mechanism (hypothesis).** `FOREGROUNDS` and `EXTRA_PAIRS` are inclusion lists over a token file
that is edited independently. The gate has no assertion that every `text.*`/`accent.*` token appears
in one of them, so a token added — or, here, left behind — is simply absent. The reachability check
was written for the one token whose *arithmetic* the author was worried about, not as a rule about
the token set.

**Remedy — UNVERIFIED.** Assert that every key of `colors.text` and `colors.accent` appears in
`FOREGROUNDS`, `EXTRA_PAIRS` or a named exclusion — the `EXEMPT_FROM_CHAIN` idiom
`check-runner-completeness.ts:175-185` uses — so a new token reds until someone says which it is.
Not verified: `text.onAccent` is deliberately in `EXTRA_PAIRS` rather than `FOREGROUNDS` because it
is never painted on a `background.*` ground, so the completeness check has to accept membership in
either list, and whether every existing token lands cleanly in one of the three buckets is
unmeasured.

## D1-15 — `major` · `testSubscriptionGating.ts`'s tier-split guard is vacuous: emptying `premiumPlusOnlyFeatures` collapses the split and the test written to catch exactly that prints zero assertions and passes

**Origin:** `instrument` (`packages/core/testing/testSubscriptionGating.ts`).

**What it lets through.** `premiumPlusOnlyFeatures` emptying means a **Premium** subscriber is
granted every Premium+-only feature — the tier split, which the file's own comment calls *"the whole
point of the v1.5 gating work"*, silently gone. The test named for that failure iterates the list
itself, so an empty list is an empty loop.

**File and line.** `packages/core/testing/testSubscriptionGating.ts:66-73`

```ts
// Guard against the premiumPlusOnlyFeatures list silently emptying - the
// tier split is the whole point of the v1.5 gating work.
function testPremiumPlusOnlyFeaturesAreActuallyExclusive() {
    for (const feature of premiumPlusOnlyFeatures) { … }
}
```

**The measurement.** One store: `lib/subscription/features.ts:17-19`. One variable:
`premiumPlusOnlyFeatures = ["unlimited_history"]` → `[]`.

| state | `npx tsx packages/core/testing/runRegressionTests`, subscription block |
|---|---|
| baseline | `✓ premium denied Premium+-only "unlimited_history"` · `✓ premium_plus granted "unlimited_history"` · `✅ All subscription gating regression tests passed.` |
| **plant** `= []` | `✓ premium plan granted "unlimited_history"` ← **the split is gone, asserted as correct** · **zero** `premium denied Premium+-only` lines · `✅ All subscription gating regression tests passed.` |

The `premium denied Premium+-only` line count goes 1 → **0** with no failure: the guard did not weaken,
it ceased to execute. The plant was verified applied (`grep` showed
`premiumPlusOnlyFeatures: PremiumFeature[] = [];` at `:17`; an earlier attempt asserted and aborted
because the file is CRLF, so nothing was written). Restored from a copy taken after the plant; `cmp`
clean, `git status --porcelain lib/ packages/ apps/ scripts/` empty, and the re-run is exit 0 with
the `premium denied Premium+-only` line back at 1.

**⚠️ What actually held the line, stated because it is the point.** The plant did red
`test:regression` overall — at **exit 1**, from `testPayCycleHistoryRegression.ts:194`,
`FAIL [premium sees exactly 6 cycles]: expected 6, got 8` — a suite about pay-cycle history, not
about gating. So the release gate does catch this today, **by an unrelated assertion in a different
file**. That is `B2-1`'s shape (*"what actually holds the line is an unrelated flag"*): the guard
that names the failure is dead, and the one that catches it does not name it, so a future edit that
touches only the gating tree would ship the collapse.

**And the same derivation runs through the rest of the suite.** `:52-57`'s expectation is
`const expected = !premiumPlusOnlyFeatures.includes(feature);` — computed from the **same array**
`hasFeatureAccess:19` consults, so for any data change the two move together. `:45-49` and `:60-64`
assert against `return false` and `return true`, which are unconditional in `hasFeatureAccess:14-22`.
And `ALL_PREMIUM_FEATURES` (`:34-42`) is a hand-typed copy of the `PremiumFeature` union carrying the
comment *"If a future feature is added without being listed here, that's a real gating bug this test
exists to catch immediately"* — the test iterates that array, so a feature absent from it is simply
not tested. **That comment is false as written.**

**Mechanism (hypothesis).** `hasFeatureAccess` is fully derived (two constant returns and one
`includes` on the exported list), so there is no independently-stated expectation anywhere for the
test to check against. Writing the expectation from the same source is then the only thing left to
do, which is `D4-4`'s *cap derived from the list it caps* transposed onto a test. The one figure that
is NOT derived — *which* feature is Premium+-only — is exactly the one no assertion pins.

**Remedy — UNVERIFIED.** State the split as a literal in the test (`assertEqual(premiumPlusOnlyFeatures,
["unlimited_history"], …)`) plus a non-empty floor, so the data is asserted rather than consulted.
Not verified, and there is a caveat that may make it moot: `:1-19` records this suite's subject as
`@/lib/subscription/**`, the **legacy root `P6.11` deletes**, with `grep -rn "hasFeatureAccess\|PremiumFeature"
apps/rn/src` returning zero — so the right remedy may be to delete this suite with the tree rather
than to repair it, and the gap it leaves (nothing asserts the 11 real `subscriptionPlan === 'premium'`
sites) is already filed to `P6.11`. Decide that before fixing.

## D1-16 — `major` · the `SKIP` fix converted three of six not-applicable returns; `moneyKeepsItsType`, `alwaysCurrentVersion` and `priorityGoalIsCapped` still return `null` when they check nothing, and `checkAllTracked` counts them as EVALUATED

**Origin:** `instrument` (`apps/rn/src/data/migrationAudit/invariants.ts`).

**What it lets through.** `EVALUATION_FLOORS` (`audit.test.ts:53-63`) is the whole defence against
*"an invariant that stops evaluating reads exactly like one that keeps passing, which is the state
three of the nine shipped in."* Three invariants can satisfy their floor of 500 without checking
anything, because their not-applicable branch returns `null` and `checkAllTracked:314-315` only
skips `SKIP`. Among them is `moneyKeepsItsType` — the invariant whose stated job is to prove *"a
restore cannot corrupt the user's money"* — and `priorityGoalIsCapped`, which `invariants.ts:247-248`
calls *"the only finding in that pass that reaches a user's money."*

**File and line.** `apps/rn/src/data/migrationAudit/invariants.ts`

| invariant | not-applicable branch | returns |
|---|---|---|
| `nothingSilentlyDropped` `:81` | `if (!o.accounting)` | **`SKIP`** ✅ |
| `idempotent` `:224` | `if (!o.store \|\| o.second == null)` | **`SKIP`** ✅ |
| `repairsAreNotRepeated` `:237` | `if (!o.store \|\| !o.second)` | **`SKIP`** ✅ |
| `moneyKeepsItsType` **`:154`** | `if (!o.store) return null;` | **`null`** ⛔ |
| `alwaysCurrentVersion` **`:181-184`** | `!o.store \|\| …` | **`null`** ⛔ |
| `priorityGoalIsCapped` **`:268`, `:271`** | `if (!o.store) return null;` · `if (!Array.isArray(goals)) return null;` | **`null`** ⛔ |

**The measurement.** `d1-probes/skip-vs-null-D1-16.ts` calls the shipped `checkAllTracked` on two
hand-built outcomes and prints `evaluated`:

```
outcome A — the door REFUSED (store === null):
   evaluated = neverThrows, moneyKeepsItsType, alwaysCurrentVersion, sourceNotMutated,
               refusalIsTotal, priorityGoalIsCapped
   violations = 0

outcome B — store present but `goals` is not an array:
   evaluated = neverThrows, moneyKeepsItsType, alwaysCurrentVersion, sourceNotMutated,
               refusalIsTotal, priorityGoalIsCapped
```

On a refused outcome — where there is no store, so nothing about money, version or pace can be
examined — all three are counted as having evaluated. Nothing in the tree was modified; the probe
only imports.

**Live exposure today: ZERO, and I measured it.** `npm --prefix apps/rn run test:app` prints
`migration audit — 542 cases × 2 doors, 1084 outcomes`, `differential — 542 cases produced a store
through BOTH doors`, and `moneyKeepsItsType:1084`. Every outcome in the current corpus produces a
store, so the `null` branch is never taken and the counts are honest **today**. The floor is
protecting a property the corpus happens not to exercise, and `refusalIsTotal` exists precisely
because refusals are an expected outcome — so the day a door starts refusing (a tightened validator,
a hostile fixture added), the three counts stay at 1084 and the floor keeps passing over
unevaluated invariants.

**Mechanism (hypothesis).** `D1-4` was reported against the invariants whose not-applicable
condition was a **missing optional field** (`accounting`, `second`). The fix was applied to exactly
those, and the three whose not-applicable condition is a **null store** were not re-examined — the
condition looks different (`!o.store` reads like a guard clause, not like "not applicable") while
being the identical fact. `ITERATE THE CLASS, NEVER THE MEMBER YOU FOUND`, at one level down from
where the class was named.

**Remedy — UNVERIFIED.** Return `SKIP` from all six not-applicable branches. Not verified, and there
is a specific hazard the file already records: `audit.test.ts:365-367` had to introduce
`fired = (r) => r !== null && r !== SKIP` after *"testing `!== null` alone … read `SKIP` as a
violation and failed the clean control … on the first run of this change."* The `selfCheck` poisons
for `moneyKeepsItsType`, `alwaysCurrentVersion` and `priorityGoalIsCapped` all carry a store, so they
should be unaffected — but `EVALUATION_FLOORS` for those three would need re-measuring against
whatever fraction of the corpus produces a store, and today that fraction is 100%, which is exactly
the state that makes the change look like a no-op.

## D1-17 — `major` · `cutoverFiles.test.ts`'s `NOT_IN_V17` exempts seven fields that ARE in the envelope, so the six paycheck-schedule fields the loop was written to cover are asserted by nothing — and the assert count does not move

**Origin:** `instrument` (`apps/rn/src/data/migrationAudit/cutoverFiles.test.ts`).

**What it lets through.** These three files are what 🎯's device cutover session is measured against —
*"a typo in one turns a real migration failure into 'the fixture was wrong' — or worse, the reverse."*
The `v17-envelope` block was widened at `D2-10` because *"the committed bytes carry every field, not
just three"*, and its docblock states the rule as *"every field the v1.6 portfolio HAS must survive
the move, and the paycheck block is where most of them land."* The exemption list then removes the
paycheck block from that rule. `payCycle`, `currentDate`, `nextPaycheckDate`,
`semiMonthlyFirstDay`, `semiMonthlySecondDay` and `monthlyPayDay` — the fields that decide **when the
user gets paid** — can be missing from the committed envelope and nothing reds.

**File and line.** `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts:144-151`

```ts
const NOT_IN_V17 = new Set([
  'version', 'exportedAt', 'amount', 'payCycle', 'currentDate', 'nextPaycheckDate',
  'semiMonthlyFirstDay', 'semiMonthlySecondDay', 'monthlyPayDay',
]);
for (const field of Object.keys(seed)) {
  if (NOT_IN_V17.has(field)) continue;
  assert(field in store || field in paycheck, `v17-envelope carries the v1.6 field \`${field}\``);
}
```

**The measurement — the exemptions are unnecessary, which is how I found this.** Read out of the
committed fixtures: seven of the nine exempted names are **present** in `store.paycheck`, so the
loop's own `|| field in paycheck` clause would have passed them unaided.

```
amount                in seed=True  in store=False  in paycheck=True
currentDate           in seed=True  in store=False  in paycheck=True
monthlyPayDay         in seed=True  in store=False  in paycheck=True
nextPaycheckDate      in seed=True  in store=False  in paycheck=True
payCycle              in seed=True  in store=False  in paycheck=True
semiMonthlyFirstDay   in seed=True  in store=False  in paycheck=True
semiMonthlySecondDay  in seed=True  in store=False  in paycheck=True
exportedAt            in seed=True  in store=False  in paycheck=False   ← genuinely absent
version               in seed=True  in store=False  in paycheck=False   ← genuinely absent
```

Only 8 of the seed's 17 fields reach the assertion.

**The plant.** One store: `docs/cutover/v17-envelope.json`. One variable: which field is deleted.

| deletion | `npm --prefix apps/rn run test:app` |
|---|---|
| baseline | exit 0 · `✅ 5.11 cutover backup files verified (**46** asserts).` |
| **plant** `store.paycheck.payCycle` removed | **exit 0** · `✅ 5.11 cutover backup files verified (**46** asserts).` — identical, including the count |
| **control** `store.payoffStrategy` removed (not exempt) | **exit 1** · `FAIL [v17-envelope carries the v1.6 field \`payoffStrategy\`]` at `cutoverFiles.test.ts:150` |

⚡ The assert count is **46 in all three rows**, because the loop iterates the *seed's* keys, not the
envelope's — so even the printed number cannot see a missing envelope field. Restored from a copy
taken after the plants; `cmp` clean, `git status --porcelain docs/cutover/` empty, and the re-run is
exit 0 at 46 asserts.

**Mechanism (hypothesis).** `NOT_IN_V17` reads as *"fields the v1.7 store does not have"*, and its
author appears to have checked them against `store` alone — where all nine are indeed absent —
rather than against the disjunction the assertion actually evaluates (`store` **or** `paycheck`).
Two of the nine are right for that reason; the other seven were swept in with them. Nothing checks
an exemption for being unnecessary, which the sibling gates in this repo do
(`check-amount-collapse.ts:89-95`, `check-sandbox-writes.ts:143`,
`check-runner-completeness.ts:203-205` all red on a permission that covers nothing).

**Remedy — UNVERIFIED.** Add the stale-exemption half: for each name in `NOT_IN_V17`, assert it is
*not* in `store` and *not* in `paycheck`, so an unnecessary exemption reds. That alone would red
today on all seven and force them out of the list, at which point the loop covers them. Not
verified: `amount` is separately asserted by value at `:122` and may have been listed deliberately to
avoid a duplicate check, so removing it from the set is a judgement rather than a mechanical fix, and
whether the v1.6 `semiMonthly*`/`monthlyPayDay` fields are always emitted by v1.6's own
`buildBackupData()` is unmeasured — a fixture that legitimately lacks one would then red.

## D1-18 — `major` · `assertNumeric`'s sweep reached five tolerance helpers and missed a sixth: `testPayCyclesPerMonth.ts`'s `assertClose` is still `NaN`-blind, and it prints ✅ over a pay cycle that returns `NaN`

**Origin:** `instrument` (`packages/core/testing/assertNumeric.ts` — the owner of the rule; the
un-swept site is `packages/core/payCycle/testPayCyclesPerMonth.ts:3-7`).

**What it lets through.** `assertNumeric.ts` exists because *"a guard written as a comparison cannot
see `NaN`"* and *"the user never sees `NaN` — `formatWhole` renders it as `$0`, to the screen and to
VoiceOver. So the failure mode is not a visible crash; it is a confident zero."* `payCyclesPerMonth`
is what converts a per-paycheck extra into a monthly-equivalent for `projectDebtPayoff` — its own
docblock records an 8% error here pushing *"the projected debt-free date LATER than reality."* A
`NaN` from it is a debt-free date and a monthly-equivalent that are not numbers, and the suite whose
whole subject is that function says it passed.

**File and line.** `packages/core/payCycle/testPayCyclesPerMonth.ts:3-7`

```ts
function assertClose(actual: number, expected: number, label: string) {
    if (Math.abs(actual - expected) > 1e-9) { throw new Error(…); }
}
```

No `requireFinite`. Compare `packages/core/debt/testComputeDrift.ts:9-14`, which is the same helper
with `requireFinite(actual, label);` as its first line.

**The measurement.** One store: `packages/core/payCycle/payCyclesPerMonth.ts:20`. One variable: the
`semimonthly` return. (`semimonthly` chosen deliberately: `weekly` and `biweekly` are additionally
asserted with `>` at `:23-24`, which *does* catch `NaN`; `semimonthly` is covered by `assertClose`
alone.)

| `case "semimonthly":` returns | this suite's own line | overall `test:regression` |
|---|---|---|
| baseline `2` | `✅ payCyclesPerMonth regression tests passed.` | exit 0 |
| **plant** `NaN` | **`✅ payCyclesPerMonth regression tests passed.`** — unchanged | exit 1, **at a different file** |
| **control** `3` | `Error: semimonthly = 2 failed. Expected 2, received 3` | exit 1, at `assertClose` |

The control proves the helper fires on a wrong number and that the plant applied. Restored from a
copy taken after the plant; `cmp` clean, `git status --porcelain packages/` empty, re-run exit 0 with
`✅ All regression tests passed.`

**⚠️ What caught the `NaN`, stated because it is the whole point.** `test:regression` did red — at
`packages/core/testing/testCadenceIdentity.ts:36`,
`FAIL [⛔ A5-1 · semimonthly — the BNPL pace is installment × the user's OWN cycles per month]:
**expected $NaN, got $NaN**`. An unrelated suite, via `assertMoney`'s `!==` (which catches `NaN`
because `NaN !== NaN`), printing a message that says two identical values disagree. So the release
gate is not open today — but the suite that owns this function is blind to it, and the suite that
catches it names the wrong subject and prints a message a reader would take for a harness bug.

**Mechanism (hypothesis).** `assertNumeric.ts`'s header says *"There were five copies of the tolerance
helper across three directories under two different signatures (`assertClose(a, e, tol, label)` and
`assertApprox(a, e, msg, tolerance = 0.01)`)."* This sixth has a **third** signature —
`assertClose(actual, expected, label)`, no tolerance parameter, the constant `1e-9` inline — so a
sweep keyed on the two known signatures would not match it. *Budget the enumeration, not the list*:
the count came in short by one, in the file written to close the class. Verified call sites of
`requireFinite`: `testComputeDrift.ts`, `testProjectCurrentBalance.ts`, `testDebtMathRegression.ts`,
`testForecastRegression.ts`, `testRecommendedActionsRegression.ts`, and two inline calls in
`testMultiCycleTimelineRegression.ts` — six files, and `testPayCyclesPerMonth.ts` is not among them.

**Remedy — UNVERIFIED.** Add `requireFinite(actual, label);` as the first line of
`testPayCyclesPerMonth.ts:3`. Not verified as *sufficient*: the enumeration that found this one was
a grep for `function assertClose|assertApprox`, which is the same shape of search that came in short
before. A lint that requires every `Math.abs(x - y) >` comparison inside a `packages/core/**/test*.ts`
to be preceded by a finiteness check would refuse the class rather than the member — but that is a
new gate, and this repo's own record says such a gate needs a plant per spelling before it is
trusted (see D1-11).

## D1-19 — `major` · nothing in `lint:rn` / `validate:release:rn` lints `packages/core`, `scripts/` or `apps/rn/tests` — and the root `lint` that could reports the same defect as a warning and exits 0

**Origin:** `instrument` (`scripts/run-gates.ts:33`, `apps/rn/eslint.config.mjs`, `eslint.config.mjs`).

**What it lets through.** `packages/core` is the money engine — the allocator, the projections, the
rollovers, and 66 of the repo's test files. `apps/rn/tests` is the whole Playwright e2e tree.
`scripts/` is every gate in this lane. None of them is linted by anything the release gate runs, so
`run-gates.ts` prints `✅ lint:rn — all 48 gates pass` over three trees no linter looked at. There is
no live defect attached to this — I am reporting the reach of the instrument, per the `major`
definition.

**File and line.**
- `scripts/run-gates.ts:33` — the only eslint link is `npm --prefix apps/rn run lint`.
- `apps/rn/package.json` — that script is `eslint . --max-warnings=0`, run with cwd `apps/rn`.
- `apps/rn/eslint.config.mjs`, last line — `globalIgnores(['dist/**', 'dist-embed/**', '.expo/**', 'node_modules/**', 'core/**', 'tests/**', 'playwright.config.ts'])`, which also drops `apps/rn/tests`.
- `package.json` — the root `lint` (`eslint && npm run lint:webkit`) appears only in
  `validate:release:legacy`. It is not `lint:`-prefixed, so
  `check-runner-completeness.ts:189-192`'s unchained-gate check — which filters
  `.startsWith('lint:')` — cannot see that it is in no chain.

**The measurement.** One plant, appended verbatim to one file in each tree:

```ts
const plantedUnusedVariable = 1;
debugger;
```

| file | command | result |
|---|---|---|
| `packages/core/utils/formatCurrency.ts` | `npm --prefix apps/rn run lint` | **exit 0**, no output beyond the npm banner |
| `apps/rn/src/utils/format.ts` (**control**) | `npm --prefix apps/rn run lint` | **exit 1** · `71:7  error  'plantedUnusedVariable' is assigned a value but never used … @typescript-eslint/no-unused-vars` · `✖ 1 problem (1 error, 0 warnings)` |
| `packages/core/utils/formatCurrency.ts` | `npx eslint packages/core/utils/formatCurrency.ts` (root config) | **exit 0** · `83:7  warning  'plantedUnusedVariable' is assigned a value but never used` · `✖ 1 problem (0 errors, 1 warning)` |

⚡ The third row is the part worth reading twice: the root config *does* reach `packages/core`, but
its `@typescript-eslint/no-unused-vars: 'error'` override is scoped to `files: ["apps/rn/**/*.{ts,tsx}"]`
(`eslint.config.mjs:23-30`), so outside `apps/rn` the same defect is a **warning** and the root
`lint` script carries no `--max-warnings=0`. `debugger` was not reported at all by either config.
Both plants restored from copies taken after; `cmp` clean on each, `git status --porcelain apps/
packages/` empty.

**Mechanism (hypothesis).** `apps/rn/eslint.config.mjs`'s header explains the split honestly — the
root config *"is eslint-config-next — built for the LEGACY Capacitor/Next app and slow over the whole
tree. This app is React Native (Expo), so it lints ONLY apps/rn."* The RN lane was carved out
correctly; what was never carved out is a lane for `packages/core` and `scripts/`, which belonged to
the root config and stayed there when the root chain stopped being run. The gate list moved and the
config did not, and the one check that would notice a gate leaving a chain is keyed on the `lint:`
prefix, which `lint` does not have.

**Remedy — UNVERIFIED.** Either add `packages/core` and `scripts` to `apps/rn`'s eslint scope, or add
a `lint:core` script over them with `--max-warnings=0` and chain it in `run-gates.ts`; and widen
`check-runner-completeness.ts:190`'s filter beyond `startsWith('lint:')` so a non-prefixed gate
script cannot leave the chain unnoticed. Not verified, and there is a stated hazard in the config
itself: `dist-embed/**` was added to `.gitignore` and not to `globalIgnores`, and `lint:rn` then
*"exploded with 7,578 errors on any machine that had run `test:e2e:embed` even once."* Widening scope
over two never-linted trees should be measured for volume before it is chained, or it becomes the
permanently-red gate `web-e2e.yml`'s header records killing a lane.

---

## Measured and NOT a defect — recorded so the next pass does not re-derive them

These cost real measurement and all came back clean. Recording them is the point of a pass that
converges.

1. **`lint:runner-completeness`'s "bare `await import` of a default-exporting test file".** The
   runner's own docblock (`runAppTests.ts:185-188`) records this as `D5-12` at one-function
   granularity. Swept all 84 imports in `runAppTests.ts`: **65 bare, 19 `.default()`, 0 bare imports
   of a module with an `export default`, and 0 `.default()` calls on a module without one.** The hole
   is real (nothing guards it) but has no live instance. Probe logic is in this finding's method, not
   kept as a file.
2. **`lint:fixture-dates`' two escape spellings (D1-7).** 220 test-shaped files swept with the
   relaxed patterns: **0** wrapped, **1** variable-form, and that one is a deliberate `currentDate`
   clock pin. Latent only.
3. **`lint:sandbox`'s two escape spellings (D1-8).** No multi-line, namespace, dynamic or re-exported
   import of `appStore` anywhere in `apps/rn/src` or `packages/`. Latent only.
4. **`lint:trust-claims`' destructuring escape (D1-13).** 6 files in the population, **0** escapes.
   Latent only.
5. **`check-store-id-writes`' class outside its roots (D1-5).** The 7 live `list.map(x => x.id === id
   ? … : x)` sites are all in the legacy Next root (`lib/hooks/useDebts.ts:135,154,176`,
   `useGoals.ts:74`, `useRequiredExpenses.ts:83,101`, `components/LivingExpensesSection.tsx:18`) —
   `P6.11` deletions, not the shipping app.
6. **The migration audit's evaluation floors (D1-16).** `542 cases × 2 doors, 1084 outcomes`,
   `differential — 542 cases produced a store through BOTH doors`, and every invariant's evaluation
   count is honest today (`moneyKeepsItsType:1084` = `checked`). The `null`-vs-`SKIP` hole has no
   live exposure.
7. **`EVALUATION_FLOORS` completeness, both directions.** I expected the usual one-directional check
   and was wrong: `audit.test.ts:129-132` asserts every floor names a real invariant **and**
   `:141-146` asserts every invariant has a floor. `POISONS` is checked in both directions too
   (`:349-357`, `:370-377`). Nothing to report.
8. **`testTextDateDoors.ts`'s `DOORS` population.** Only two text→date entry points exist —
   `debtCsv.ts:249` and `parseStatementText.ts:109` are the sole consumers of `isRealCalendarDate` —
   so the hand-written `DOORS` list is complete today, and a door missing from `IMPOSSIBLE`/`ACCEPTED`
   throws on `for…of undefined` rather than passing.
9. **The `D1-5` conditional-assertion class in `testMultiCycleTimelineRegression.ts`.** Six bodies sit
   behind an `if`/loop guard with no floor (`:271`, `:297`, `:394`, `:416`, `:437`, `:705`) — the
   exact shape `testTimelineRegression.ts:381-400`'s docblock was written for. I instrumented all six
   with `console.log` markers and ran `test:regression`: **every one is reached** (2·2·1·1·2·2
   executions). The guards are unnecessary, not vacuous. File restored, `cmp` clean, 0 markers in the
   final run.
10. **`assertMoney`'s `NaN` behaviour across the 24 money helpers.** `Math.round(NaN*100)/100 !== e`
    is `true`, so every `assertMoney` throws on `NaN`. Only *tolerance* helpers are blind, which is
    what narrowed D1-18 to one file.

---

## Findings SPLIT BY ORIGIN

⚠️ **Counted twice, independently, because this round's brief opens on a class whose own label was
wrong in four numbers.** First by reading the list back; second by
`grep -o '^## D1-[0-9]* — \`[a-z]*\`'` over the file. **The first count was wrong** — it said 18
findings / 16 majors. The grep says **19 findings · 17 `major` · 2 `minor` · 0 `blocker`**, over 19
distinct ids, and every severity appears exactly once in a `##` heading and nowhere else in that
form. The grep is the number below.

| origin | files in this lane | findings | blocker | major | minor |
|---|---|---|---|---|---|
| **`instrument`** | 29 | **17** | 0 | **16** | **1** |
| **`s0-first-look`** | 1 (`check-rounding.ts`) | **1** | 0 | **1** | 0 |
| **`neighbour`** | 1 (`check-contrast.ts`) | **1** | 0 | 0 | **1** |
| **totals** | **31** | **19** | **0** | **17** | **2** |

**`instrument` (17):** D1-1, D1-2, D1-3, D1-4, D1-5, D1-7, D1-8, D1-9, D1-10 *(minor)*, D1-11,
D1-12, D1-13, D1-15, D1-16, D1-17, D1-18, D1-19 — D1-19 spans `run-gates.ts` (instrument) and two
eslint configs that are off this lane's manifest.
**`s0-first-look` (1):** D1-6 *(major)*.
**`neighbour` (1):** D1-14 *(minor)*.

⚠️ **Zero blockers is a statement about this lane's SUBJECT, not about the money.** Lane D1 holds no
exit-bearing product file — all 31 are instruments or suites — so a `blocker` (*the app states
something false about the user's money*) is not a verdict this lane can reach. The `major` count is
the one to read.

⚡ **The dominant class, and it is one class.** **Eight of the seventeen `major`s are the same
defect: a matcher locked to a line.** D1-1 (comment-out), D1-2 (comment-out), D1-3 (wrap), D1-6
(wrap), D1-7 (wrap + variable), D1-8 (wrap + namespace), D1-9 (indent), D1-17 (an exemption list
excusing what the disjunction already covered). `check-cap-literals.ts:59-79` documents this escape,
fixes it correctly with whole-file `matchAll`, and carries a proven guard for it
(`S1P5-D5-9-CAPWRAP`) — and **every gate written after it kept a per-line `split`.** The lesson was
recorded in the file where it was learned rather than in the shared scanning helper those gates
actually import (`lib/scanFloor`, `lib/stripCode`), so it did not travel. **D1-11 is why nothing
caught that:** every proof and plant certifying these gates plants the one spelling the gate already
catches.

⚡ **The second class, three members:** a fix applied to the members that were reported and not to
their siblings — D1-16 (`SKIP` reached 3 of 6 not-applicable returns), D1-18 (`requireFinite`
reached 5 of 6 tolerance helpers), D1-5 (the walk's extension filter travelled from a directory
where it was right into one where it is not).

## Method

- **28 plant/control edits executed** — 17 defect plants, 10 controls, and one six-marker
  reachability instrumentation — across `scripts/run-gates.ts`,
  `packages/core/testing/runRegressionTests.ts`, `apps/rn/src/utils/format.ts`,
  `apps/rn/src/utils/format.test.ts`, `apps/rn/src/components/plan/WindfallSheet.tsx`,
  `apps/rn/src/store/StoreContext.tsx`, `apps/rn/src/store/greeting.ts`,
  `lib/subscription/features.ts`, `packages/core/payCycle/payCyclesPerMonth.ts`,
  `packages/core/utils/formatCurrency.ts`, `docs/cutover/v17-envelope.json` and
  `packages/core/testing/testMultiCycleTimelineRegression.ts` — plus two probe registries handed to
  `check-finding-guards.ts` through its own `--registry=` input, so the tracked
  `scripts/finding-guards.json` was never written.
- **Every restore was from a copy taken AFTER the plant and `cmp`-verified**, then followed by a
  re-run of the affected gate or suite to confirm the baseline figure returned (not merely that it
  exited 0). `git status --porcelain` shows no tracked file modified.
- **Every "the gate did not catch this" claim carries a control** in the same file, proving the
  checker can see the subject.
- One plant **failed to apply and said so** (`lib/subscription/features.ts` is CRLF and the anchor was
  LF); it was re-derived rather than assumed. `verify-the-plant-applied`.
- `npm run prove:guards` was **not** run. `npm run test:gate-plants` was **not** run.
- No sub-agents. Heap capped at 1536 MB throughout; no OOM. No Playwright, no whole-monorepo
  typecheck, no `npm run lint:rn`. No server started.
- **31 of 31 manifest files read in full**, plus `scripts/lib/scanFloor.ts` (tracked, off both claims
  files — it is the shared helper D1-3/D1-6 point at). Listed in `READ-D1.txt`.
