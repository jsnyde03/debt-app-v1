# Class 1 — re-audit 6 (fresh auditor)

> Scope: the 79 cumulative class-1 findings, and round 6's own diff (`9ff5e87c..HEAD`, 15 commits,
> 26 files, +1249/-231). Written incrementally; sections appear in the order they were measured.

## Method actually used

- Fix set derived from **`git diff --stat 9ff5e87c..HEAD`** and the 15 commit messages, per the brief.
  Every commit claim treated as a HYPOTHESIS and re-derived against the code.
- Plants in BYTE mode (`open(p,'rb')`/`'wb'`), restores verified with `cmp`, never `git checkout --`.
- No sub-agents. Probes in `class1-reaudit6-probes/`.

## Baseline

- `git status --short` empty at start; branch `v1.7-dev`, HEAD `ccd1e20e`.
- `npm run lint:rn` baseline, read from its OWN summary line: **`✅ lint:rn — all 52 gates pass.`**
  (exit 0 as well, but the line is the verdict). `test:gate-plants` 25/25 MATCHED, `test:wrap-escapes`
  15 recipes, `test:plant-safety` 26 assertions, `test:joined-code` 20 assertions.
- Baseline log kept out of the tree (scratchpad), per "leave the tree clean".

> ⛔ **Read `Summary` at the bottom first if you are triaging.** 15 findings: 1 blocker, 10 major,
> 4 minor. Eight of the 79 prior findings re-open by planting and one was never fixed.

---

# NEW findings

## `W1` — `blocker` · `V7`'s fix re-opens `V7`: a deleted guard reports **present** because `stripCommentsOnly` reads a real tracked file's comments as CODE

**Consequence.** `lint:finding-guards` — the gate that decides whether every finding in this audit is
closed — prints **`✅ 280 of 281 findings carry a standing guard`, exit 0**, over a guard whose assertion
has been deleted and whose token survives only inside a `//` line comment. That is byte-for-byte the
defect `V7` was written to close, at a new address that **`V7`'s own fix created**.

**file:line.** `scripts/lib/stripCode.ts:94` (`KEYWORD_BEFORE_REGEX`), tested at `:187`, reached through
`scripts/lib/joinedCode.ts:93` (`const scanned = dropComments ? stripCommentsOnly(source) : source;`,
added by `V7`) and `scripts/check-finding-guards.ts:246` (`presentInCode`).
Live victim file: `scripts/check-scan-floors.ts:82`.

**The measurement.** Registry id `S1P4-D4-9-STRIPCONSUMERS`, guard token
`.filter((f) => importsStripper(readFileSync(join(SCRIPTS, f), 'utf8')));` at
`scripts/check-scan-floors.ts:125`. Plant = rename the callee at :125 (guard gone) **and** re-introduce
the exact token in a `//` comment at :93. Byte-mode plant, `cmp`-verified restore, three runs:

| run | plant | `lint:finding-guards` |
|---|---|---|
| **attack** | guard deleted · token in a comment **at :93** (inside the runaway) | ⛔ **exit 0** — `✅ 280 of 281 findings carry a standing guard` |
| control A | guard deleted · token nowhere | exit 1 — *the guard is gone from scripts/check-scan-floors.ts* |
| control B | guard deleted · token in a comment **at the end of the file** | exit 1 — *the guard token appears … **ONLY IN A COMMENT*** |

Control B produces the exact `M7` refusal the attack should have produced, so the verdict is about
*where the comment is*, not about the deletion. Probe: `class1-reaudit6-probes/plant6multi.py`,
specs in the session scratchpad; detector `class1-reaudit6-probes/p6-keyword-regex.ts`.

**Mechanism — MEASURED, not hypothesised.** `stripCode.ts:94` is

```
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;
```

tested against `src.slice(Math.max(0, i - 12), i)` — a window that **ends at the `/`**. Every real
spelling puts a space there, so the `$` anchor can never match. Measured directly:

```
window="  return "   matches=false     "  return /a/.test(x)"
window="  return"    matches=true      "  return/a/.test(x)"     <- nobody writes this
window="typeof "     matches=false     "typeof /a/"
window="case "       matches=false     "case /a/:"
```

⛔ **The entire keyword arm of the regex-literal detector is dead.** `regexMayFollow` does not cover it
either — the last significant character is `n`, not an operator. So at
`check-scan-floors.ts:82`, `return /\bfrom\s*['"``][^'"``]*stripCode…/` is not seen as a regex; the
`/` falls through as an ordinary character and the **three backticks inside the character classes open a
runaway template literal**. `stripCommentsOnly` does not blank string contents, so everything that
follows comes back **verbatim, as code** — comments included. Measured: `L91`, `L92` (two `//` lines) and
`L100`–`L104` (a whole docblock) survive the strip untouched.

**Blast radius, measured over 698 tracked `.ts`/`.tsx` files** (`p6-keyword-regex.ts`):

- `stripCommentsOnly`: **1 file** currently has comments surviving as code — `check-scan-floors.ts`,
  5 comment lines from L91. That file carries a registry guard, which is why the attack lands.
- `stripCommentsAndStrings`: **0** blanked runs > 400 chars today. The blind direction is not live —
  **but it is the same one line**, and the header of `stripCode.ts` records this exact class costing
  *6,966 chars over 304 lines in 22 files* the last time it fired.

⚠️ **Pre-existing in `stripCode.ts`; made consequential by round 6.** `stripCode.ts` is not in
`9ff5e87c..HEAD`. What round 6 changed is who reads it: `V7` moved `joinedCode` onto it, and
`joinedCode` feeds `check-finding-guards` and `unreadInputsCopy`. This is the same shape `V7` itself
described — *"what round 5 changed is the blast radius"* — one round later.

⚠️ **`test:joined-code`'s 20 assertions cannot see this.** They are all synthetic strings; none of them
contains a `return /…/` regex, so the harness written *for this producer* is green on the file the
producer is wrong about. `lint:scan-floors` cannot see it either — it asks *does this file import the
stripper*, not *does the stripper read this file correctly*.

**Remedy (UNVERIFIED).** Two independent parts:

1. `stripCode.ts:187` — test `KEYWORD_BEFORE_REGEX` against the window **with trailing whitespace
   trimmed**, e.g. `src.slice(Math.max(0, i - 16), i).replace(/\s+$/, '')`, and widen the window past
   12 (`instanceof` alone is 10 characters). Add a `test-strip-code` row per keyword, both spellings.
2. `check-finding-guards` should not be able to score a token as code in a file the scanner failed to
   close. Cheapest honest check: if `stripCommentsOnly(text)` leaves any line whose trimmed form still
   opens `//`, refuse the file loudly rather than answering the guard question over it.

⚠️ Do **not** fix this by reverting `V7` — the old line-prefix predicate is worse, and control A/B show
the rest of the machinery is correct.



---

## `W2` — `major` · `V1`'s `?.(`/`<T>` enumeration became the menu: **`parseAmountField(a)! ?? 0`** is a ONE-CHARACTER un-fix that `check-amount-collapse` reports green

**Consequence.** Every `D1-3`-family defect — `R5` → `T3` → `U1` → `V1`, four close/re-open cycles —
re-opens with a single `!` and `lint:amount-collapse` prints `✅ 0 site(s)`. `V1`'s own commit called
`?.(` *"a ONE-CHARACTER un-fix route for all of `D1-3`"* and closed exactly that one character.

**file:line.** `scripts/check-amount-collapse.ts:64` (`PARSER_CALL`) and `:164`
(`AFTER.test(afterEnclosingGroups(...))`); `AFTER = /^\s*\?\?\s*0\b/` at `:67`.

**The measurement.** One anchor at `apps/rn/src/components/entities/LogPaymentSheet.tsx:50`, byte-mode
plant, `cmp`-verified restore, one `lint:amount-collapse` run per spelling:

| planted spelling | gate | |
|---|---|---|
| `parseAmountField(amount) ?? 0` | **exit 1** | control — the bare defect |
| `(parseAmountField(amount)) ?? 0` | **exit 1** | control — `V1` (d), still closed |
| `Number(parseAmountField(amount)) ?? 0` | exit 0 | control — correctly NOT a collapse |
| `parseAmountField(amount)! ?? 0` | ⛔ **exit 0** | **BLIND** — one character, no parens |
| `(parseAmountField(amount)!) ?? 0` | ⛔ **exit 0** | **BLIND** |
| `parseAmountField(amount) as number ?? 0` | ⛔ **exit 0** | **BLIND** |
| `(parseAmountField(amount) as number) ?? 0` | ⛔ **exit 0** | **BLIND** |
| `(parseAmountField(amount) satisfies number) ?? 0` | ⛔ **exit 0** | **BLIND** |
| `parseAmountField(amount) /* keep */ ?? 0` | exit 1 | still closed |
| the same call wrapped over three lines by Prettier | exit 1 | still closed |

**Mechanism — MEASURED.** `AFTER` is anchored at the start of whatever follows the call's closing paren.
`afterEnclosingGroups` steps out through *grouping parens* and nothing else, so a postfix `!`, `as T` or
`satisfies T` sitting between `)` and `??` defeats the anchor. The parenthesised variants fail one step
earlier: the walk stops the moment the next non-space character is not `)`.

⚠️ **`check-rounding` does NOT share the blindness, for a reason worth keeping.** The same two spellings
planted at `apps/rn/src/store/balanceSelectors.ts:44` made it **red** —
`❌ rounding: 93 inline expressions and the cap is still 94`. It is a downward-only ratchet, so a hidden
site surfaces as a *count that fell*. `check-amount-collapse` is a cap-0 gate with no equivalent signal:
a hidden site and a clean tree print the same sentence.

**Remedy (UNVERIFIED).** Do not extend the enumeration again — that is Law II, and this is its third
instance in this one matcher. Either
(a) let `afterEnclosingGroups` step over a trailing `!`, `as <type>` and `satisfies <type>` before
handing text to `AFTER`, with a recipe row per postfix; or, better,
(b) give `check-amount-collapse` the ratchet `check-rounding` already has, so *any* spelling that removes
a site from the population is visible as a count that moved — whatever the next spelling turns out to be.

---

## `W3` — `minor` · the same walk is NOISY on `f?.(parse(x)) ?? 0`, in a gate with cap 0 and no allow-list

**Consequence.** Ordinary correct code reds a release gate that has no escape route. `V1`'s commit
message states the opposite as a design property: *"`wrapper(parse(x)) ?? 0` still does not match — that
collapses wrapper's result, and reporting it would be the noisy direction, which these gates have no
escape route for."* True for `wrapper(…)`; false for `wrapper?.(…)`.

**file:line.** `scripts/lib/logicalLines.ts:165-167`.

**The measurement.** Same anchor, same harness: `fmt?.(parseAmountField(amount)) ?? 0` → **exit 1**,
`❌ amount-collapse: 1 problem(s)`, while `Number(parseAmountField(amount)) ?? 0` → exit 0. Unit probe
`class1-reaudit6-probes/p6-after-groups.ts` reproduces it directly, along with `!(parse(x)) ?? 0`.

**Mechanism — MEASURED.** The walk classifies a paren by the single non-space character before it:

```
const before = /\S$/.exec(structure.slice(0, j))?.[0] ?? '';
if (/[\w$\])]/.test(before)) break;   // identifier, `]` or `)` => a CALL
```

For `fmt?.(` that character is `.`, which is not in the class, so an optional CALL paren is walked
through as though it were a grouping paren. ⚠️ The same line means **whitespace before a call paren also
reads as grouping** — `Number (x)` is legal TS — because `/\S$/` is anchored and yields `''` when the
preceding character is a space. That second direction is why `return (parse(x)) ?? 0` happens to work:
the walk succeeds by accident, not because keywords are handled anywhere.

**Remedy (UNVERIFIED).** Classify on the token rather than the character: trim trailing whitespace first,
treat `?.` as a call marker alongside `[\w$\])]`, and put a keyword allow-list (`return`, `typeof`,
`await`, `case`, …) on the grouping side so the accidental pass becomes an intended one.

---

## `W4` — `major` · `V8`'s `CLAMPING_CALLEE` cannot see a clamp reached through a property: `dateUtils.clampDay(d.getDate(), 28)` reds `lint:month-arithmetic`

**Consequence.** The noisy direction of a release gate with **no cap and no allow-list**. `U6` filed
exactly this consequence — *"correct code was simply unshippable"* — and `V8`'s fix re-introduces it for
every clamp helper that is not a bare identifier. It is a **regression**: the rule `V8` replaced
(`/[\w$]/.test(before)`) accepted all of these.

**file:line.** `scripts/check-month-arithmetic.ts:176` —
`const CLAMPING_CALLEE = /(?:^|[^\w$.])(?:Math\.min|[\w$]*clamp[\w$]*)$/i;`

**The measurement.** `class1-reaudit6-probes/p6-clamped-day.ts` runs `clampedDay` (from `check-month-arithmetic.ts:178`) verbatim over 17 day
slots, `V8`'s own seven included as the regression control:

```
ok                     Math.min(d.getDate(), 28)             clamped=true    (V8 control)
ok                     clampDay(d.getDate(), 28)             clamped=true    (V8 control)
ok                     Math.max(1, d.getDate())              clamped=false   (V8 control)
ok                     Number(d.getDate()) / __id(...)       clamped=false   (V8 control)
ok                     d.getDate() / (d.getDate())           clamped=false   (V8 control)
FALSE-ACCUSE (noisy)   dateUtils.clampDay(d.getDate(), 28)   clamped=false
FALSE-ACCUSE (noisy)   this.clampDay(d.getDate(), 28)        clamped=false
FALSE-ACCUSE (noisy)   DateMath.clampDay(d.getDate(), 28)    clamped=false
FALSE-ACCUSE (noisy)   helpers.clamp(d.getDate(), 1, 28)     clamped=false
FALSE-ACCUSE (noisy)   Math.min (d.getDate(), 28)            clamped=false
FALSE-ACCUSE (noisy)   Math.min(Number(d.getDate()), 28)     clamped=false
FALSE-EXEMPT (blind)   unclampedDay(d.getDate())             clamped=true
FALSE-EXEMPT (blind)   isClamped(d.getDate())                clamped=true
FALSE-EXEMPT (blind)   assertNotClamped(d.getDate())         clamped=true
```

**Mechanism — MEASURED.** The lead-in is `(?:^|[^\w$.])`. The `.` is excluded from that class
specifically so `Foo.Math.min` cannot match `Math\.min` — and the same exclusion makes **every property
access unmatchable**, because the only route to `clampDay` in `dateUtils.clampDay` is across a `.`.
`Math.min` survives only because it is spelled out literally. `Math.min (` fails for a third reason: the
`$` anchor plus a trailing space, which is `W3`'s mechanism showing up in a second file.

⚠️ **The blind rows are real but low-value.** `/clamp/i` matched anywhere in the identifier exempts
`unclampedDay`, `isClamped`, `assertNotClamped`. Nobody writes those beside a `new Date(y, m + 1, …)`.
Recorded because `V8`'s docblock argues its accepted set **by name** and neither direction was measured.

⚠️ **Latent today, not live.** The repo's only clamp helper
(`packages/core/payCycle/getNextPaycheckDate.ts:16`) is a bare local `clampDay`, so the gate is green.
The first `import * as dateUtils`, or the first move of that helper onto an object, reds the release lane.

**Remedy (UNVERIFIED).** Take the callee as a token —
`/(?:^|[^\w$])(?:[\w$]+\.)*(?:min|clamp[\w$]*)$/i` after trimming trailing whitespace — and, since the
accepted set is now the load-bearing claim, move `V8`'s seven rows **plus** a member-access row out of
the docblock and into an executed self-check.

---

## `W5` — `major` · a kill in the one-statement window between the plant and its fingerprint turns a recoverable orphan into a **fatal refusal with the plant still in tracked source**

**Consequence.** `npm run lint:rn` and `npm run validate:release:rn` exit 1 and stay that way until a
human deletes a sidecar by hand — and the planted defect is left sitting in tracked production source
for the next `git add -A`, which is the exact path that shipped `check-runner-completeness.ts` as
`const missing: string[] = [];`. `V4` traded that risk away deliberately; this is the case where the
trade is not necessary, because the mechanism *could* have proved it wrote the bytes.

**file:line.** `scripts/lib/plantSafety.ts:86` (`notePlant`), called at
`scripts/prove-guards.ts:446-448` and `scripts/test-wrap-escapes.ts:745-747` / `:767-768` — in every one
of the three, **`writeFileSync` comes first and `notePlant` second**.

**The measurement.** `class1-reaudit6-probes/p6-plant-safety.ts`, scratch git repo, kill simulated by
dropping `PLANT_SAFETY_LIVE` and writing a dead owner PID between the two statements:

```
kill BETWEEN writeFileSync and notePlant     recovered=0 refused=1 restored=false
  …sidecar left on disk for a human          true
  …target still holds the PLANT              true
```

Refusal is fatal by design: `test-wrap-escapes.ts:48-53` prints and `process.exit(1)`;
`prove-guards.ts:329` calls `fault()`.

**Mechanism — MEASURED.** `preflightRestore` requires `expected && expected === sha(onDisk)`
(`plantSafety.ts:177-180`). `notePlant` only writes `expected` **after** the plant has landed, so the
window between the two statements is a state the recovery rule has no answer for: dirty, unattributable,
refuse.

⛔ **The file's own header states the opposite rule and it is the right one:** *"the recovery information
has to be ON DISK before the plant is"*. `armPlant` obeys it for the sidecar and the owner mark; `V4`
added a third mark and put it on the wrong side of the write.

**Remedy (UNVERIFIED).** `notePlant(abs, text)` needs nothing from the filesystem — it hashes a string
the caller already holds. Call it **before** `writeFileSync` at all three sites, and assert the ordering
in `test-plant-safety.ts` (arm → note → write → simulate kill → expect `recovered`, not `refused`).

---

## `W6` — `major` · `matchesHead` compares **filtered** bytes, so under `core.autocrlf=true` — which this repo sets — a CLEAN file reads as dirty and the commonest orphan becomes a fatal, self-perpetuating refusal

**Consequence.** On a working tree materialised with CRLF, `preflightRestore` can never take its
*"clean against HEAD, nothing to recover"* branch. Every orphan sidecar — and the file's own docblock
says these are the common case, *"the signal handlers usually win, so the commonest orphan is a sidecar
beside an already-restored file"* — becomes `refused`, which is fatal in both callers. The refusal
message tells the reader **`Restoring here would discard uncommitted work`** about a file that is
byte-identical to `HEAD`, and because the refusal path deliberately deletes nothing, **it never clears
itself**: every subsequent `lint:rn` fails the same way.

**file:line.** `scripts/lib/plantSafety.ts:203-214` (`matchesHead`), consumed at `:163`.

**The measurement.** `p6-plant-safety.ts`, four scratch repos, orphan sidecar beside an untouched file:

```
orphan beside a CLEAN file  autocrlf=false worktree=lf     git-says-dirty=false  recovered=0 refused=0  sidecar-dropped=true
orphan beside a CLEAN file  autocrlf=true  worktree=crlf   git-says-dirty=false  recovered=0 refused=1  sidecar-dropped=false
orphan beside a CLEAN file  autocrlf=input worktree=crlf   git-says-dirty=false  recovered=0 refused=1  sidecar-dropped=false
orphan beside a CLEAN file  autocrlf=true  worktree=lf     git-says-dirty=false  recovered=0 refused=0  sidecar-dropped=true
```

`git status` says **clean** in all four rows. The pre-flight disagrees in two of them.

**Mechanism — MEASURED.** `git show HEAD:<path>` emits the blob **as stored** — no smudge filter, no
`autocrlf` conversion. The working tree holds the smudged bytes. `head === text` therefore compares an
LF blob against a CRLF file and returns `false` for a file `git status` calls clean. The same is true of
any `.gitattributes` `text` setting, any clean/smudge filter, and Git LFS.

⚠️ **Live status on this tree: latent, and one checkout away.** `git config core.autocrlf` returns
`true` here, but tracked source is currently LF on disk (the files were written locally, never
re-materialised), so the branch works today. Measured directly: `git show HEAD:scripts/lib/plantSafety.ts`
is byte-identical to the file. ⛔ **A fresh clone on this machine gets CRLF** — `test:gate-plants` prints
`warning: … LF will be replaced by CRLF the next time Git touches it` on every run — and
`prove-guards.ts:423`'s own comment already asserts *"this tree is checked out with CRLF"*, so one of
the two beliefs in this repo is wrong and neither was measured. CI is unaffected: `ubuntu-latest` and
`macos-15`, where `autocrlf` defaults to `false`.

**Remedy (UNVERIFIED).** Do not compare text. Ask git the question git can answer:
`git diff --quiet HEAD -- <path>` (exit 0 = clean) or `git status --porcelain -- <path>` — both apply the
same filters the working tree has. The pre-flight already shells out to `git status` once; reuse that
output rather than adding a second, differently-filtered oracle. Add a `test-plant-safety` fixture with
`core.autocrlf=true` and a CRLF worktree — the current fixture sets neither, so it cannot see this.

---

## `W7` — `major` · when a plant has been COMMITTED — the scenario this whole mechanism exists for — the pre-flight silently DELETES the sidecar, which is the only record that the file was planted

**Consequence.** `U15`'s founding incident was a plant reaching `git add -A` and being committed. In
exactly that state the pre-flight reports **nothing** (`recovered=0`, `refused=0`, exit 0), leaves the
plant on disk, and **removes the sidecar holding the original bytes**. The one artifact that would have
told the next person *"this file was planted and here is what it was"* is destroyed by the recovery
mechanism, without a word on screen.

**file:line.** `scripts/lib/plantSafety.ts:163-166` — `if (matchesHead(...)) { dropMarks(absBackup); continue; }`.

**The measurement.** `p6-plant-safety.ts`: arm, plant, `git add -A && git commit`, then run the
pre-flight.

```
the plant was COMMITTED, then the pre-flight runs   recovered=0 refused=0 plant-still-on-disk=true
  …sidecar dropped (the only record of the original)  false     <- i.e. it WAS dropped
```

**Mechanism — MEASURED.** `matchesHead` asks *"is the file what HEAD holds?"*. Once the plant is
committed, HEAD holds the plant, so the answer is yes, and the branch's comment — *"CLEAN AGAINST HEAD
MEANS THERE IS NOTHING TO RECOVER"* — is true of the working tree and false of the repository. The rule
`V4` chose distinguishes *dirty* from *clean*; it does not distinguish *clean because the plant was
undone* from *clean because the plant was committed*, and the sidecar is the only thing that could.

⚠️ The original is of course still in git history, so nothing is unrecoverable — which is why this is
`major` and not a blocker. What is lost is the **signal**, in the one situation where nobody knows to go
looking.

**Remedy (UNVERIFIED).** Before dropping the marks on a HEAD-clean file, compare the sidecar's bytes to
`HEAD`. If they differ, HEAD is not the pre-plant state: print it loudly and keep the sidecar. That is
one `git show` the function already makes, reused.

---

## `W8` — `minor` · arming the same file twice in one process leaves the PLANT on disk after `disarm()`, with every mark removed

**Consequence.** A fail-open with no residue: the planted bytes stay in tracked source, the sidecar, the
owner mark and the fingerprint are all deleted, so no later pre-flight can see anything to recover, and
`test-wrap-escapes`/`prove-guards` both report a clean restore.

**file:line.** `scripts/lib/plantSafety.ts:216-237` — `armed` is module-global and `restoreArmed`
walks it in insertion order.

**The measurement.** `p6-plant-safety.ts`:

```
same file armed twice, then disarmed     on disk == ORIGINAL? false   == PLANT_A? true
  …sidecar and marks removed             true
```

**Mechanism — MEASURED.** `restoreArmed` writes entry 1's `original` (the true original), then reads the
file again for entry 2 and finds it differs from entry 2's `original` (`PLANT_A`) — so it writes
`PLANT_A` back. The later arming wins, and the later arming's *"original"* is the earlier arming's
plant.

⚠️ **Latent, not live.** Both callers arm once and `disarm()` in a `finally`
(`prove-guards.ts:411/413`, `test-wrap-escapes.ts:682/776`), so `armed` is empty before the next
arming. It is recorded because `armed` is module state with no de-duplication and no assertion, and
`test-plant-safety.ts` never arms the same path twice.

**Remedy (UNVERIFIED).** In `armPlant`, refuse (or coalesce to the first-seen original) when `abs` is
already in `armed`. One `if`, plus a `test-plant-safety` row.

---

## Measured on `plantSafety` and found NOT to be a defect

- **A stale fingerprint beside real uncommitted work is refused, and the work survives.**
  `notePlant` recorded plant *P1*; the file on disk holds somebody's edit instead. Measured
  `recovered=0 refused=1 work-survives=true`. This is `V4`'s central claim and it holds.
- **`SIDECAR_SUFFIXES[1]` (`.wrapescape-backup`) beside a dirty target is refused**, as
  `test-plant-safety.ts` already asserts — re-run, holds.
- **`PLANT_SAFETY_LIVE` and the owner PID each independently suppress recovery of a live plant** —
  re-run from the existing fixture, holds.
- **`dropMarks` now removes all three marks** (the 15-committed-sidecars leak). `git ls-files` filtered
  on the four suffixes returns zero, and `test:plant-safety`'s first assertion re-checks it every run.

---

## `W9` — `major` · `S5-DEADLOCK`'s exemption makes the guard **on the stale ceiling** vacuous: kill the ceiling outright and `S1P6-D2-1-PROOFSTALE` still scores `MATCHED`

**Consequence.** The one registered proof that the stale-proof ratchet works cannot fail. It was
re-recorded during round 6's drain (`0e5cc152`, `measured: 2026-09-04`), so it currently reads as a
freshly-executed ✅ over a check that could be deleted without it noticing.

**file:line.** `scripts/prove-guards.ts:169` (`env: { ...process.env, PROVE_GUARDS_DRAINING: '1' }`),
`scripts/check-finding-guards.ts:574` (`DRAINING`) and `:583` / `:734` (the two downgrades), registry entry
`S1P6-D2-1-PROOFSTALE` — un-fix `const MAX_STALE_PROOFS = 8;` → `= -1;`, `expect: "STALE"`.

**The measurement.** `class1-reaudit6-probes/p6-proofstale.ts` reproduces `prove-guards`' scoring exactly
— control run, planted run, `introducedLines`, `expect` — with the same `PROVE_GUARDS_DRAINING=1` the
harness gives every child:

```
A · the proof as recorded
   planted=exit 1 · control=exit 0 · rightReason=true → MATCHED
B · …with the stale refusal NEUTRALISED in both runs  (`if (false && stale.length > MAX_STALE_PROOFS)`)
   planted=exit 1 · control=exit 0 · rightReason=true → MATCHED
```

⛔ **B is the whole finding.** The ceiling does nothing at all and the proof is still green.

**Mechanism — MEASURED, two independent causes, either one sufficient.**

1. **`exit 1` comes from the un-fix breaking its own registry anchor.** `p6-selfanchor.ts` lists every
   problem the planted run reports:
   `• S1P6-D2-1-PROOFSTALE — its proof's anchor matches 0× in scripts/check-finding-guards.ts:
   "const MAX_STALE_PROOFS = 8;"` — **and that is the only one.** The un-fix's `find` *is* this entry's
   own guard token, so editing it trips the gate's anchor-integrity check whatever the ceiling does.
   ⚠️ Checked on the other two `lint:finding-guards` proofs and it is specific to this one:
   `S1P7-U7-VERDICT-MARK` reds through the verdict-mark self-check (0 problems listed, `process.exit(1)`
   fires first) and `S1P7-U11-WELDED-TOKEN` reds with a genuine `ONLY IN A COMMENT` refusal. **Both are
   sound.**
2. **`rightReason` is satisfied by the gate echoing the cap it was handed.** `introducedLines` folds
   digit runs to `#`, so `… 2 of them STALE (cap 8) …` and `… 2 of them STALE (cap -1) …` have
   *different* keys — `(cap #)` vs `(cap -#)` — and the report line counts as introduced. It contains
   `STALE`. Under `DRAINING` the drain note `⚠️ OVER THE STALE CEILING (2 > -1)` is introduced too, and
   it also contains `STALE`. **The refusal the finding names is never reached: `DRAINING` routes it to
   `drainNotes` instead of `problems`.**

⛔ This is `D5-5`'s shape one level down. `D5-5` closed *"the `expect` was already in the green output"*
with `introducedLines`; this is an `expect` that is in a line **introduced by the un-fix's own literal**.
A number the report prints back is not evidence about behaviour.

**Also measured — the exemption is a plain ambient env var with no provenance check.** Nothing verifies
that the process is a `prove:guards` child. With `MAX_STALE_PROOFS` planted at 1:

```
no flag                    exit 1 · • 2 executed proof(s) … the ceiling is 1
PROVE_GUARDS_DRAINING=1    exit 0 for that problem · ⚠️ OVER THE STALE CEILING (2 > 1) — allowed only because this run is a DRAIN.
```

So `PROVE_GUARDS_DRAINING=1 npm run validate:release:rn` prints `✅ lint:rn — all 52 gates pass` with
both downward-only ratchets exceeded. The commit's claim — *"only in that process tree … CI sets
nothing, so the ceilings are enforced wherever a human reads a result"* — is a statement about **who
sets it today**, not about what enforces it, and it reads as the second. ⚠️ Also note the verdict mark:
`drainNotes` print **after** `verdictMark(problems.length)`, so the gate's own first line is ✅ and the
warning is eight lines below it, inside a 52-gate log.

**Remedy (UNVERIFIED).**
1. Re-point `S1P6-D2-1-PROOFSTALE`'s un-fix at something that is *not* its own anchor — the comparison
   `stale.length > MAX_STALE_PROOFS`, not the constant — and give it an `expect` that only the refusal
   can produce (`executed proof(s) were measured against a tree`).
2. Do not exempt a gate the harness is simultaneously using as a control. The narrower fix is for
   `prove:guards` to set the flag **only** for the run of the id currently being drained, and never for
   an id whose own `run` is `lint:finding-guards`.
3. Make the exemption prove its provenance — a nonce `prove:guards` generates per run and
   `check-finding-guards` echoes — rather than a string any shell can export.

---

## `W10` — `minor` · `prove:guards` **records by default**, so re-running a proof to verify it silently rewrites the ledger and erases the staleness this audit was told to look at

**Consequence.** The brief's own instruction — *"14 registry entries were added or repointed this round …
Re-run them. `2 of 32` did not hold the last time anyone checked"* — cannot be carried out without
mutating the thing being audited. One `npm run prove:guards -- --id=S1P6-D2-1-PROOFSTALE` left
`scripts/finding-guards.json` modified with no flag asked for it:

```
-      "sha": "0e5cc152"
+      "sha": "ccd1e20e"
```

A stale proof that a re-audit re-runs becomes fresh, and the ledger loses the evidence that it *was*
stale — including in the case where the re-run only passed for the reason `W9` describes.

**file:line.** `scripts/prove-guards.ts:706` — `} else if (!has('no-record')) {`.

**Mechanism — HYPOTHESIS, from the code and its docblock.** The default was inverted deliberately at
`S1.12.5.1 [D5-1]`: *"RECORDING IS THE DEFAULT NOW, BECAUSE `--record` WAS INVOKED BY …"*, with
`--no-record` kept *"for a read-only run (a dirty-tree check, or CI wanting no write-back)"*. The
decision is defensible for a drain; what it costs is that **the verifying reader and the draining fixer
run the same command**, and only one of them wants a write.

**Remedy (UNVERIFIED).** None to the default — it was chosen against a measured failure. Instead:
name `--no-record` in `CLASS1-REAUDIT-*-BRIEF.md`'s method section, so the next auditor re-runs proofs
without re-stamping them. ⚠️ This round's re-runs were reverted byte-precisely and `git status` is clean.

---

## `W11` — `major` · `V3`'s punctuation rule drops **240 of 1,871** JSX copy spans, and a retired word planted inside real shipped prose goes green: `T6` / `C1-9` / `R12` re-open for any sentence containing `(`, `;` or an HTML entity

**Consequence.** `lint:glossary` is the gate that stops a retired word returning to user-facing copy.
Two of this app's commonest prose habits — a parenthetical, and `&rsquo;` — remove the sentence from the
population entirely. `V3` replaced a line bound that lost 8 prose blocks with a rule that loses 240 spans,
and it measured only the 8 it recovered.

**file:line.** `scripts/check-glossary.ts:132` —
`const CODE_PUNCTUATION = /[;=(){}`]|=>|\|\||&&/;` — consumed at `:137`.

**The measurement — one file, one line, one phrase, three runs.** Anchor:
`apps/rn/src/components/plan/RecoveryPlanSection.tsx:171`, real shipped copy:
*"This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or
cancel it)."*

| plant | `lint:glossary` |
|---|---|
| the line untouched | exit 0 (control) |
| `breathing room` in that sentence, **parenthetical removed** | **exit 1** — `❌ 1 retired word(s) back in user-facing copy` |
| `breathing room` in that sentence, **parenthetical kept** | ⛔ **exit 0** — `✅ no retired words in copy` |

Repeated on the HTML-entity class at `apps/rn/src/components/StorageErrorScreen.tsx:43`
(*"the app just couldn&rsquo;t read it this time"*):

| plant | `lint:glossary` |
|---|---|
| `breathing room`, entity rewritten as `could not` | **exit 1** |
| `breathing room`, `&rsquo;` left in place | ⛔ **exit 0** |

**Mechanism — MEASURED.** `class1-reaudit6-probes/p6-glossary.ts` over all 141 `.tsx` files:

```
>…< spans: 1871;  rejected by CODE_PUNCTUATION: 240
rejected by which token:  "("=109  ")"=83  ";"=19  "="=14  "`"=9  "&&"=6
```

⛔ **`;` is the one nobody would predict**: every HTML entity ends in a semicolon, and this repo has a
gate (`lint:apostrophes`) that pushes copy toward `&rsquo;`. So the two gates work against each other —
the more `&rsquo;` in a sentence, the less the glossary gate can see it.

Prose-shaped spans the rule now rejects, from the real tree:

```
components/plan/RecoveryPlanSection.tsx   "…remember to handle it with the biller (pay it late, or cancel it)."
components/plan/PaidOffFinale.tsx         "You&rsquo;re debt-free"
components/SaveFailedBanner.tsx           "Couldn&rsquo;t save your last change to this device…"
components/StorageErrorScreen.tsx         "Couldn&rsquo;t open your data"
components/plan/PaydayGuardianCard.tsx    "…what to cover first, and what (if anything) can safely wait."
```

⚠️ **`PaydayGuardianCard.tsx` is one of the eight blocks `V3`'s commit lists as RECOVERED.** It has a
prose block on both sides of the line: one the rule recovered, one it still rejects. The commit's table
(*"code punctuation … of the 8 prose blocks kept: 8"*) counted the blocks it was looking for and not the
population.

**The noisy direction, also measured — 20 code-shaped spans are now IN the population**, including
`"| null | undefined, fields: Omit"` (a type annotation), `"0 ?"`, `"1 ?"`, `":"`, `"d.balance"`,
`"p.balance"`. A ternary or comparison chain contains none of the banned characters, so
`> b ? plural : singular <` is admitted as copy. Nothing red today; it is the direction `U2` was filed
for and it is not closed, only narrowed.

⚠️ **`V3`'s self-check cannot see either direction.** Its two synthetic cases are a wrapped two-word
phrase and `<View>{items.filter((x) => x.n > 0).length}</View>` — one prose sample with no punctuation
at all, and one weld carrying four banned tokens at once. Both directions of this finding sit between
them.

**Remedy (UNVERIFIED).** The population question is *"is this a JSX text node?"*, and the file already
imports the machinery that answers it — `stringLiterals` comes from the real scanner. A punctuation
blacklist is the third heuristic tried on this question and, like `T2`/`T3`/`U2` before it, it was
chosen against a sample rather than measured against the population. Interim, if a heuristic must stay:
drop `(`, `)` and `;` from the class (which is 211 of the 240 spans), decode HTML entities before
testing, and make the self-check assert on **counts over the real tree** rather than on two strings —
a rule that drops more than N spans reds by name.

---

## `W12` — `major` · `V9`'s exemption is applied on ONE of the two paths that produce names, so `const { apr } = editing ?? prefill ?? null;` — a destructure off the sanctioned merge — is reported as a defect

**Consequence.** `debtPrefill.test.ts` asserts `eq(fromEditing.length, 0)` with no allow-list, so a false
positive makes correct code unshippable — the same consequence `U9` was filed for
(*"an ordinary refactor of CORRECT code that still honours the prefill was reported as a defect by a
release gate with no allow-list"*), one round later, one path over.

**file:line.** `apps/rn/src/components/entities/debtPrefill.test.ts:225` (`SANCTIONED_MERGE`), applied
at `:229` inside the hoist closure — and **not applied** at `:243-248`, where `destructured` is built.

**The measurement.** `class1-reaudit6-probes/p6-debtprefill.ts` runs the detector copied verbatim
(both paths). `V9`'s own three rows are the regression control and all three pass:

```
ok                         V9 a: hoist merely NAMED seed                     hits=1
ok                         V9 b: second seed in a nested scope               hits=1
ok                         V9 c: destructure renamed to seed                 hits=1
ok                         the sanctioned shape itself                       hits=0

NOISY (false accusation)   destructure OFF the sanctioned merge              hits=1   <- W12
NOISY (false accusation)   sanctioned merge off props   (props.editing ?? props.prefill)   hits=1
NOISY (false accusation)   sanctioned merge, prefill renamed on import  (editing ?? prefillDebt)  hits=1
NOISY (false accusation)   sanctioned merge, ternary spelling  (editing ? editing : prefill)     hits=1
ok                         sanctioned merge with a cast  ((editing ?? prefill) as Debt | null)   hits=0

BLIND (missed)             defect + the sanctioned substring appended        hits=0
BLIND (missed)             defect guarded by the sanctioned test             hits=0
BLIND (missed)             sanctioned merge that then reads editing          hits=0
ok                         destructure off editing alone (a real defect)     hits=1
```

**Mechanism — MEASURED.**

- **The destructuring path has no exemption at all.** `destructured` is
  `src.matchAll(/const\s*\{([^}]*)\}\s*=\s*[^;]*\bediting\b[^;]*;/g)` — it tests for `editing` and
  nothing else, then the names go straight into the returned list. `V9`'s docblock says *"the exemption
  is a BINDING's own initialiser, applied in the closure above"*; there are two producers of bindings and
  it is applied in one. ⚠️ `N-8` added the destructuring path; `U9` and `V9` both edited only the hoist
  path.
- **The other three noisy rows are the exemption being a literal-substring test.**
  `/\bediting\s*\?\?\s*prefill\b/` requires the two identifiers adjacent and spelled exactly. A property
  access on either side, an import alias, or the ternary spelling of the same merge all fail it.
- **The blind rows are the mirror**: the test is `SANCTIONED_MERGE.test(b.init)` over the WHOLE
  initialiser, so any initialiser that contains the substring anywhere is exempt in full — including
  `const seed = { base: editing ?? prefill, apr: editing.apr };`.

⚠️ **`V9`'s three rows cannot see any of this**, and that is the pattern: each of `N-8`, `U9`, `V9`
added rows for the spelling it had just been shown, and the row set has never been derived from the
detector's own structure.

**Remedy (UNVERIFIED).** Apply the exemption where the names are produced, not where one kind of name is
produced: run `destructured`'s initialiser through the same `SANCTIONED_MERGE` test. Then widen the
sanctioned shape from a literal pair to *"a `??` chain whose first operand mentions `editing` and whose
last operand mentions `prefill`"*, which survives a property access, an alias and a wrap. And add a row
for each of the four noisy spellings above — `R11`'s lesson is that the rows asserting *what must still
be caught* matter; this finding is the other half, the rows asserting what must not be accused.

---

## `W13` — `major` · `V12`'s new pin `PER_LINE_OK_PINNED = 13` is invisible to `check-cap-literals`, so it can be rewritten as a **derived** ratchet — `D4-4`'s exact defect — with the gate green

**Consequence.** The gate whose whole job is *"a count of the caps themselves, because a gate that finds
nothing to check reports the same ✅ as a gate that checked everything"* does not know this cap exists.
`D4-4`'s defect — *"a cap computed from the population it caps agrees with whatever it is handed: the
comparison becomes `n > n` and the ratchet stops existing"* — can be written into `V12`'s pin and nothing
objects.

**file:line.** `scripts/check-cap-literals.ts:79` —
`const DECL = /^[^\S\n]*(?:export\s+)?const\s+((?:MAX|MIN)_[A-Z0-9_]+)\s*…/gm` — and
`scripts/test-wrap-escapes.ts:479`, `const PER_LINE_OK_PINNED = 13;`.

**The measurement.** Byte-mode plants into `scripts/test-wrap-escapes.ts`, `cmp`-verified restores:

| plant | `lint:cap-literals` |
|---|---|
| untouched | exit 0 — `✅ cap literals: 28 downward-only cap(s) across 74 scripts are literals` |
| `const PER_LINE_OK_PINNED = Object.keys(PER_LINE_OK).length;` | ⛔ **exit 0 — still `28`** |
| `const MAX_UNREVIEWED = PER_LINE_UNREVIEWED.size;` (control) | **exit 1** — `❌ 1 derived ratchet(s)` |

⚠️ The count does not move either: 28 with the pin and 28 with it derived, because it was never in the
population. So `MIN_CAPS` cannot see the departure any more than the derivation.

**Mechanism — MEASURED.** `check-cap-literals`' population is defined by a **name prefix**. Every one of
this cluster's other ratchets happens to be called `MAX_…` or `MIN_…`; `V12` named its new one
`PER_LINE_OK_PINNED`, and that one word is the whole difference. ⛔ This is the enumeration-of-spellings
class the same file records paying for at `D5-9` — *"budget the enumeration, not the list"* — applied to
its own population rather than to its subject.

⚠️ **`PER_LINE_OK_PINNED` is not the only one.** A sweep of `scripts/` for
`const <ALL_CAPS> = <number>;` outside the `MAX_`/`MIN_` convention finds
`scripts/check-local-dates.ts:107`, `const HAND_PARSE_BASELINE = 43;` — whose own docblock says
*"raising a downward-only baseline is otherwise the defect it exists to catch"*. It is outside the
population for the same reason. (Pre-existing; `V12`'s addition made it two.)

**Remedy (UNVERIFIED).** Widen `DECL` to any `const <ALL_CAPS> = <numeric literal>;` in `scripts/`, or —
better, since the property being asserted is *"this ratchet is a literal"* and not *"this name looks like
a cap"* — key the population on the RHS rather than the identifier. Either way `MIN_CAPS` will move by
more than one, and the arithmetic should be recorded on the same line, as `D5-9` requires.

---

## `W14` — `minor` · `V6`'s `!== 1` reds on a **second legitimate call** with the message `production no longer calls …`, which is the opposite of what happened

**Consequence.** An ordinary refactor that calls `chainedGatesFrom(runGatesFile)` twice reds
`lint:runner-completeness` — a release gate with no allow-list — and the message sends the reader to look
for a deleted call that is still there, twice.

**file:line.** `scripts/check-runner-completeness.ts:364` — `if (selfSrc.split(site).length - 1 !== 1)`.

**The measurement.** Byte-mode plants at `scripts/check-runner-completeness.ts:395`:

| plant | gate | |
|---|---|---|
| `const __decoy = 'chainedGatesFrom(runGatesFile)';` beside the real call | exit 0 | ✅ **`V6` holds** — a decoy in a string is no longer an occurrence |
| the call deleted, the string decoy left behind | exit 1 | ✅ **`V6` holds** — `D1-1`'s un-fix is refused |
| a second, real call: `const runGatesAgain = chainedGatesFrom(runGatesFile);` | exit 1 | ⛔ `❌ production no longer calls …` |

**Mechanism — MEASURED.** `V6` replaced `< 2` with `!== 1` and blanked strings, which correctly makes a
string decoy a non-occurrence. The commit says so, and calls the remaining direction safe: *"a decoy
written as CODE makes it two and reds in the NOISY direction, which is the safe one."* That reasoning is
about a decoy; the same arithmetic cannot tell a decoy from a second real call, and the message assumes
it can.

**Remedy (UNVERIFIED).** Keep `!== 1` — it is the honest requirement — and fix the sentence: *"expected
exactly one call to `X` and found N"*, with the two readings spelled out. Cheap, and it is the whole
defect.

---

## `W15` — `major` · `V2` is **not closed**. It was recorded closed with no fix, no measurement and no commit — *"(minor, folded into `U2`'s neighbourhood)"* — in the round whose headline is *"12 V-findings closed"*

**Consequence.** `check-glossary` reds on correct code, with no cap and no allow-list, and the ledger says
it does not. `V2` reached the round-6 record as a table row with a parenthetical instead of a fix; nothing
in `9ff5e87c..HEAD` touches its file for its reason, and no commit message mentions it.

**file:line.** unchanged from `V2`: `scripts/lib/stripCode.ts:171`
(`literals?.push({ text: src.slice(opened, i), … })`) feeding `scripts/check-glossary.ts:113`.
Record: `docs/DEBT_ELEVATION_LOG.md`, round-6 table — `| V2 | *(minor, folded into U2's neighbourhood)* |`.

**The measurement — `V2`'s own three rows, re-run verbatim.** Plants appended to
`apps/rn/src/components/plan/GraduationCards.tsx`, byte mode, `cmp`-verified restores:

| plant | `lint:glossary` | |
|---|---|---|
| `` (s: { crunch: boolean }) => `state=${s.crunch}` `` | ⛔ **exit 1** — `❌ 1 retired word(s) back in user-facing copy` | **the false positive, still live** |
| `export const crunch = 1;` — same identifier, not interpolated | exit 0 | control |
| `` `state=${'crunch'}` `` — the word as a string literal | exit 1 | control: a true positive, correctly red |

**Mechanism — MEASURED, and it is `V2`'s stated one, still standing.** `stringLiterals` returns
`src.slice(opened, i)`, and `scan` deliberately does *not* blank `${…}` (that is `V1`'s fix), so the
interpolated **code** comes back inside the literal's text and is matched against retired-*copy*
patterns. `check-glossary`'s own docblock declares identifiers exempt; `stripCode`'s two exports disagree
about what a template literal contains, and nothing records the disagreement.

⚠️ **The realism is `U2`'s, not mine**: `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx:23` already
ships a `crunch: boolean` field. Reading it inside a template is one refactor away.

⛔ **The finding this generalises is about the ledger, not the gate.** Six rounds have relied on the
round record to say what is closed. This is the first measured case of an entry recorded closed with no
fix at all, and it survived because a `minor` with a parenthetical beside it reads like a decision.
`lint:finding-guards` cannot catch it: there is no registry entry for `V2`, so its deletion detector has
nothing to detect.

**Remedy (UNVERIFIED).** Two parts, and the second is the load-bearing one:
1. `V2`'s own remedy stands — have `scan` record the interpolation spans it skipped and give
   `stringLiterals` a variant that blanks them, with a fixture in both directions.
2. A finding may not be recorded closed without either a registry id or an explicit
   `closed-without-a-fix` marker carrying the measurement that says so. *"Folded into X's
   neighbourhood"* is a sentence, and this cluster has now priced sentences at 8 of 28 false.

---

# Part 1 — question 1: is each of the 79 actually closed?

⛔ **No. Eight of the 79 re-open by planting, and one was never fixed.** The list below records what was
*measured*, and separates it from what was only read.

## Re-opened, measured by planting

| prior finding | how it re-opens now | this round |
|---|---|---|
| `V7` — a comment read as code satisfies a deleted guard | plant the token in a `//` comment at `check-scan-floors.ts:93` → `lint:finding-guards` exit 0, `✅ 280 of 281` | `W1` |
| `R5` → `T3` → `U1` → `V1` — a collapse hidden from `check-amount-collapse` | `parseAmountField(a)! ?? 0` — one character | `W2` |
| `U6` — a clamped day reported as unclamped | `dateUtils.clampDay(d.getDate(), 28)` | `W4` |
| `T6` / `C1-9` / `R12` — a retired phrase invisible to `check-glossary` | put it in a sentence containing `(`, `;` or `&rsquo;` | `W11` |
| `U9` — correct prefill code accused | `const { apr } = editing ?? prefill ?? null;` | `W12` |
| `U15` — a plant surviving an interrupted run | kill between `writeFileSync` and `notePlant`: refused, plant left in tracked source | `W5` |
| `D4-4` — a ratchet derived from the population it caps | write it on `PER_LINE_OK_PINNED`, which `check-cap-literals` cannot see | `W13` |
| `D5-5` — an `expect` that cannot fail | `S1P6-D2-1-PROOFSTALE` scores MATCHED with its ceiling neutralised | `W9` |

Plus **`V2`, never fixed at all** (`W15`) — recorded closed in the log with a parenthetical.

## Verified still closed, by planting

- **`V6`** — a decoy string literal beside the real call no longer restores the count (exit 0), and the
  `D1-1` un-fix with the decoy still reds. Both directions run. *(The `!== 1` rule has a message defect —
  `W14` — but the closure holds.)*
- **`V1` (a)–(d) as written** — the bare collapse, `(parseAmountField(x)) ?? 0`, and the `Number(...)`
  non-defect all behave as the commit claims. What is open is the class beyond its three spellings (`W2`).
- **`V8`'s seven rows** — all seven of the commit's measured spellings reproduce exactly
  (`p6-clamped-day.ts`). What is open is the direction it did not measure (`W4`).
- **`V9`'s three rows** — all three reproduce, including the nested-scope one the commit says needed a
  second repair (`p6-debtprefill.ts`). What is open is the second name-producing path (`W12`).
- **`V12`'s pin** — `PER_LINE_OK` holds 13 gates and the pin is 13; `MAX_UNREVIEWED` 12 against 12 seen.
  Both hold. What is open is that the pin itself is unguarded (`W13`).
- **`V10`** — `MIN_ENTRIES = 281` against exactly 281 registry entries; the round-5→6 arithmetic in the
  note (`268 → 280 → 281`) matches the diff (280 entries at `9ff5e87c`, 281 at `HEAD`, one added:
  `S1P7-U1-INTERPOLATION-IS-CODE`). ✅ closed.
- **`V4`'s central claim** — a dirty target the mechanism cannot attribute is refused and the work
  survives. Re-measured on a stale fingerprint and on the legacy suffix; both hold. What is open is the
  three states around it (`W5`, `W6`, `W7`).
- **`V5`** — re-run as `S1P7-U4-CONTRAST-COMMENTS`, MATCHED. The memoisation holds: the gate reports
  `read 32345 lines`, not the doubled ~64.5k the un-memoised second reader produced. (`V5`'s commit
  quotes 32328; the 17-line difference is ordinary drift in the tree since, not a regression.)

## Verified by re-running the registered proof

**13 of the 20 proofs round 6 recorded were re-executed** (`--no-record`, so the ledger is unchanged) —
every proof recorded in `9ff5e87c..HEAD` except the five whose `run` is `test:wrap-escapes` (~10 min
each), one `test:gate-plants` and one `test:app`:

```
✅ S1P4-D4-10-POINTER   ✅ S1P5-D5-9-CAPWRAP    ✅ S1P5-A5-4-ROUNDINGCAP  ✅ S1P6-D2-8-SCRIPTSRUNNER
✅ S1P6-D1-8-GATECHAIN  ✅ S1P6-D2-1-PROOFSTALE ✅ S1P7-U7-VERDICT-MARK   ✅ S1P7-U4-CONTRAST-COMMENTS
✅ S1P7-U6-CLAMPED-DAY  ✅ S1P7-U8-COMPOSITION-PINNED  ✅ S1P7-U11-WELDED-TOKEN
✅ S1P7-U15-PLANT-SAFETY  ✅ S1P7-U1-INTERPOLATION-IS-CODE
```

13/13 `plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED`, and the tree was clean
afterwards — no `.plant-backup`, `.plant-owner` or `.plant-hash` left behind, so round 6's `dropMarks`
repair holds. ⚠️ **One of those thirteen is vacuous** — see `W9`; a green proof row is not evidence on its
own, which is this finding's point.

## Not re-derived this round, and named as such

- The **48 prior findings** `CLASS1-REAUDIT-5.md` Part 1 covered and this round did not re-plant. They
  are guarded by registry tokens and `lint:finding-guards` reports 280 of 281 standing — ⛔ **but `W1`
  shows what that number is worth**: it is a deletion detector, and one of its producers can be made to
  read a comment as code.
- **`V11`** — read, not measured. Its own commit says *"nothing is waved through today"*, and the three
  multi-matcher gates it names (`check-contrast`, `check-amount-collapse`, `check-rounding`) are indeed
  absent from `sameLineCovered`. The `oneMatcher` test is on the number of **wrap-escape recipes**, not
  on the number of matchers, which is a second latent mismatch of the same shape; it costs nothing today.
- The **five `test:wrap-escapes` proofs** recorded this round (`S1P7-CLASS1-LOGICALJOIN`,
  `S1P7-U5-REASON-VACUITY`, `S1P7-U10-INK-WHOLE-FILE`, `S1P7-U12-CENSUS-BOTH-HELPERS`,
  `S1P7-U16-SAMELINE-DERIVED`) — each needs a ~10-minute run twice. The full harness ran green once in
  the baseline (`15 matcher recipes · 12 red on the WRAPPED spelling · 0 MEASURED BLIND`).

---

# Measured and found NOT to be a defect — recorded so round 7 does not re-derive it

- **`matchesHead` on THIS tree.** `core.autocrlf` is `true`, but tracked source is LF on disk and
  `git show HEAD:<path>` is byte-identical to the file (`cmp`, on `scripts/lib/plantSafety.ts`). The
  comparison works today. `W6` is about the config, not about the current bytes. ⚠️ `prove-guards.ts:423`
  says *"this tree is checked out with CRLF"* — that comment is wrong about the tree as it stands.
- **`stripCommentsAndStrings` runaways are at zero.** The blind direction of `W1`'s mechanism: 0 blanked
  runs over 400 characters across 698 files. Only `stripCommentsOnly` is currently affected, in one file.
- **`test:joined-code`'s 20 assertions all hold** and the producer swap is otherwise faithful: over the
  same 698 files, the only files whose joined text gains code are `check-scan-floors.ts` (`W1`) and
  `coverage-split.ts` — and the second is a *correct* improvement (markdown lines inside a template
  literal that the old `t.startsWith('*')` predicate wrongly dropped).
- **`afterEnclosingGroups` handles the keyword cases**, though by accident: `return (parse(x)) ?? 0`,
  `await (…)`, `yield (…)`, `case (…)`, `((…))` and `() => (…)` are all correctly seen as collapses,
  because `/\S$/` returns `''` when a space precedes the paren. The mechanism is `W3`'s; the outcome here
  is right.
- **A comment or a Prettier wrap between the call and `??` does not hide it** —
  `parseAmountField(a) /* keep */ ?? 0` and the three-line wrap both red.
- **`prove:guards` leaves no sidecar behind.** 13 proofs, 2 tracked files planted, `git status
  --untracked-files=all` clean afterwards.
- **`PROVE_GUARDS_DRAINING` does not leak into a full gate chain.** No registered proof's `run` is
  `lint:rn` or `validate:release:rn`, and `prove:guards:selftest` — the only one inside `lint:rn` — uses
  a hermetic probe (`scripts/__fixtures__/prove-guards-probe.mjs`), not a real gate.
- **`check-amount-collapse` really has no escape route**, which `W2` and `W3` depend on and which arrived
  as a commit-message claim. Verified: `ALLOWED` at `scripts/check-amount-collapse.ts:90` is `{}`, and
  `:97-108` exits 1 if it is ever non-empty (`T9` — *"the only durable state for this map is empty, and
  that is now asserted rather than asked for"*). So a false positive there is unshippable, not merely
  noisy.
- **`check-month-arithmetic` has no cap either** — hits go straight to `problems` and the only exemption
  is a fixed `EXEMPT` file list plus the self-retiring `PENDING_DELETION` tree. `W4`'s consequence stands.
- **`MIN_CAPS = 28` is exact, not slack** — `lint:cap-literals` reports 28 caps against a pin of 28.
- **The 15-committed-sidecars leak is repaired.** `git ls-files` filtered on the four suffixes returns
  zero, `test:plant-safety` asserts it every run, and it survived 13 live plants this session.

---

# Question 2 — what did round 6's fixes break?

Derived from the diff, not from the finding list, per the brief. Every entry below is a behaviour a
round-6 commit changed, and what would notice if it were reverted.

| round-6 change | what it broke | |
|---|---|---|
| `V7` moved `joinedCode` onto `stripCommentsOnly` | imported a live scanner defect into `check-finding-guards` and `unreadInputsCopy`; the gate that decides whether every finding is closed can now be fooled by a comment | `W1` **blocker** |
| `V3` deleted `MAX_JSX_FRAGMENT_LINES` for a punctuation test | removed 240 of 1,871 JSX copy spans from `check-glossary`'s population, including sentences using `&rsquo;` — which a *different* gate pushes copy toward | `W11` |
| `V8` replaced `/[\w$]/` with `CLAMPING_CALLEE` | a clamp reached through a property now reds `lint:month-arithmetic`; the old rule accepted it | `W4` **regression** |
| `V4` added the plant fingerprint | created a one-statement window in which a kill is unrecoverable and fatal; made `matchesHead` the oracle for cleanliness, which filters break; and made a committed plant delete its own sidecar | `W5` `W6` `W7` |
| `S5-DEADLOCK`'s `PROVE_GUARDS_DRAINING` | made `S1P6-D2-1-PROOFSTALE` a proof that cannot fail, and put an ambient env-var bypass on two release ratchets | `W9` |
| `V12` added `PER_LINE_OK_PINNED` | a new downward-only ratchet outside `check-cap-literals`' population, so it can be made derived with the gate green | `W13` |
| `V9` moved the exemption onto the initialiser | applied it on the hoist path only; the destructuring path `N-8` added still has none | `W12` |
| `V6` tightened the pin to `!== 1` | correct behaviour, wrong message: a second real call reports *"production no longer calls"* | `W14` |
| `V1` widened `PARSER_CALL` and added `afterEnclosingGroups` | closed three spellings and left `!`, `as T`, `satisfies T`; and made `f?.(…)` a false positive | `W2` `W3` |

**Nothing round 6 changed came back clean except `V6`, `V10` and `V5`.**

---

# Summary

**15 new findings: 1 blocker, 10 major, 4 minor.**

| severity | ids |
|---|---|
| **blocker** | `W1` |
| **major** | `W2` `W4` `W5` `W6` `W7` `W9` `W11` `W12` `W13` `W15` |
| **minor** | `W3` `W8` `W10` `W14` |

**Question 1 — are the 79 closed?** No. **Eight re-open by planting** (`W1` `W2` `W4` `W5` `W9` `W11`
`W12` `W13`) and **one was never fixed at all** (`W15`). Ten of the twelve `V*` findings were verified
by re-planting rather than by reading; `V6`, `V10` and `V5` came back genuinely closed.

**The three that most change what happens next:**

1. ⛔ **`W1` — `lint:finding-guards` can be made to certify a deleted guard.** Every "N of 281 findings
   carry a standing guard" reading in this cluster rests on `joinCodeLines`, and one line in
   `stripCode.ts` — a keyword window anchored at the wrong end — lets a real tracked file's comments come
   back as code. It is one file today. It is the instrument the whole audit reports through.
2. ⛔ **`W9` — a proof scored MATCHED with the thing it proves deleted.** The `S5-DEADLOCK` exemption
   routes the stale refusal away from `problems`, and the proof's `exit 1` comes from the un-fix breaking
   its own registry anchor. Green proof rows have been this cluster's closure currency for six rounds;
   this is the first one measured to be worthless, and its two causes (**a self-anchoring un-fix**, and
   **an `expect` satisfied by a number the report echoes back**) are both classes, not instances.
3. ⛔ **`W15` — a finding was recorded closed with no fix, no measurement and no commit.** *"(minor,
   folded into `U2`'s neighbourhood)"* in the round record; the false positive reproduces on `V2`'s own
   three rows. Nothing mechanical could have caught it, because a finding without a registry id is
   invisible to the deletion detector. That is a hole in the ledger, not in a gate.

**The pattern across all fifteen, stated once.** Round 6 fixed nine mechanisms and eight of the nine
carry a new defect of the *same shape as the one they repaired* — an enumeration widened by the spellings
just observed (`W2` `W4` `W12`), a rule chosen against the sample that motivated it and never checked
against the population (`W11` `W13`), a producer swapped without re-measuring its consumers (`W1`), and a
brake fitted whose failure direction was never exercised (`W5` `W6` `W7`). ⚡ **Law II again, and the
commit messages name it while doing it**: `V8`'s own docblock argues its callee list *by name*, `V3`'s
own table counts *the eight blocks it went looking for*, `V1`'s own remedy lists *three spellings*.

**One method note for round 7, and it is cheap.** Every finding above that took the most work to
establish came from **running the fix's own control rows and then one row nobody had written**.
`p6-clamped-day.ts`, `p6-debtprefill.ts` and `p6-after-groups.ts` all begin by reproducing the commit's
measured table verbatim — which caught one of my own probes being wrong (`p6-debtprefill.ts` initially
omitted the `destructured` path and produced a false BLIND row). ⛔ **Reproduce the commit's own table
before adding a row to it**; a probe that cannot reproduce the known result is measuring something else.

---

# Method notes

- **Baseline:** `npm run lint:rn` → `✅ lint:rn — all 52 gates pass.` (its own summary line, not the exit
  status), run before any plant. **Re-run in full at the end of the audit: `✅ lint:rn — all 52 gates
  pass.` again** — `test:gate-plants` 25/25, `test:wrap-escapes` 15 recipes / 0 MEASURED BLIND,
  `test:plant-safety` 26 assertions, `test:joined-code` 20 assertions. Nothing this audit did
  changed the tree.
- **Plants:** byte mode throughout (`open(p,'rb')` / `'wb'`) via
  `class1-reaudit6-probes/plant6.py` and `plant6multi.py`. Every restore verified with `cmp` **and** a
  sha256 comparison; `git checkout --` was never used, and `git diff` was never used to verify a restore.
- **No plant threw.** Every one made an assertion fail or a gate exit non-zero on its own terms. The one
  probe that produced a stack trace was the harness's own cp1252 stdout, fixed before any verdict was
  taken from it.
- **Sidecars:** `git status --untracked-files=all` checked after every planting session. No
  `.plant-backup`, `.plant-owner`, `.plant-hash` or `.wrapescape-backup` was created in the tree by this
  audit, and the 13 live `prove:guards` plants cleaned up after themselves.
- **`prove:guards` was run with `--no-record`** after the first invocation (without it) modified
  `scripts/finding-guards.json`; that modification was reverted byte-precisely — see `W10`.
- ⚠️ **Two probes write to tracked files** — `p6-proofstale.ts` and `p6-selfanchor.ts` plant into
  `scripts/check-finding-guards.ts` (and `apps/rn/src/store/trustSelectors.test.ts`) and restore in a
  `finally`, printing whether the restore held. They do **not** use `plantSafety`'s sidecars, so a kill
  mid-run would leave a plant — the `T13`/`U15` hazard. Both were run to completion and both reported
  `restored: … byte-identical = true`; `git status` confirms it. A future round re-running them should
  either arm them through `armPlant`/`notePlant` or run them on a scratch copy.
- **No sub-agents.** No dev server started. No commit made.
- **Probes** are in `class1-reaudit6-probes/`: `p6-after-groups.ts`, `p6-clamped-day.ts`,
  `p6-joined-oldnew.ts`, `p6-exposed.ts`, `p6-keyword-regex.ts`, `p6-plant-safety.ts`, `p6-proofstale.ts`,
  `p6-selfanchor.ts`, `p6-glossary.ts`, `p6-debtprefill.ts`, plus the two plant harnesses.
