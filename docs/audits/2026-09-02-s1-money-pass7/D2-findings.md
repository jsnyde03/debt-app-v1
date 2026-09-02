# D2 — pass 7 findings (proof machinery + unowned config)

Lane D2. 40 files · 13.9k lines · 0 exit-bearing.
Subject: `prove:guards`, the guard registry, route/coverage/sublane scripts, and config no surface owns.

Findings are appended as they are measured. Split by origin at the end.

---

## D2-1 — `major` · The [D78] retry — this round's repair to the proof harness — survives its own un-fix: `MAX_SERVER_ATTEMPTS` can be set to 1 and every instrument stays green

**What the instrument lets through.** `prove:guards --selftest` announces *"a dead web server faults
instead of scoring"* and the `.12.3b` docblock says the two `.12.3a` repairs are now **guarded** — the
answer to *"both fixes shipped resting on nothing."* The retry loop is one of those two repairs
(`[D78]`, cap of six, derived arithmetically in a 20-line docblock). **Nothing tests it.** The
`deadserver` self-test case asserts only `wantExit: 1` and the two strings `HARNESS FAULT` /
`never got its web server up` — both of which are produced identically after **one** attempt and after
**six**. So the repair that was written this round to let `--all` finish is un-guarded by the very
self-test written in the same sub-step to guard it.

**File and line.** `scripts/prove-guards.ts:225` (`const MAX_SERVER_ATTEMPTS = 6;`), consumed at
`scripts/prove-guards.ts:233-243` (`runUntilServed`, `while (webServerNeverStarted(r) && attempts <
MAX_SERVER_ATTEMPTS)`). Self-test case at `scripts/prove-guards.ts:527-533`.

**The measurement.**

- Control, pristine tree: `npm run prove:guards:selftest` → **exit 0**, 5/5 ✅, final line
  *"a dead web server faults instead of scoring, and an unrecordable pass says so."*
- Plant (one literal, `6` → `1`, which makes `attempts < MAX_SERVER_ATTEMPTS` false on the first
  iteration and removes the retry entirely):
  `scripts/prove-guards.ts:225` → `const MAX_SERVER_ATTEMPTS = 1;`
  Confirmed applied: `git status --porcelain scripts/prove-guards.ts` → ` M scripts/prove-guards.ts`,
  `grep -n '^const MAX_SERVER_ATTEMPTS'` → `225:const MAX_SERVER_ATTEMPTS = 1;`
- Planted run: `npm run prove:guards:selftest` → **exit 0**. Identical output, including
  `✅ selftest:a dead web server faults, never scores exit 1 (want 1) · said all of it`.
- Two adjacent instruments, also under the plant: `npm run lint:cap-literals` → **exit 0**
  (`✅ cap literals: 27 downward-only cap(s) across 68 scripts are literals`) — it checks the cap is a
  *literal*, and `1` is a literal. `npm run lint:finding-guards` → **exit 0**
  (`✅ finding-guards: 266 of 267 …`) — it is a deletion detector and the token is still there.
- Registry search: `grep -rn "MAX_SERVER_ATTEMPTS\|runUntilServed\|webServerNeverStarted\|
  faultOnDeadServer"` over the repo returns **exactly one** hit outside `prove-guards.ts` —
  `scripts/check-cap-literals.ts:129`, a *comment* recording the count going 26 → 27.
  **No registry entry, no proof block, no spec names any of the four symbols.**
- Restore: rewritten from a copy taken after the edit, then `cmp /tmp/d2-pg-pristine.ts
  /tmp/d2-pg-after.ts` → identical, `git status --porcelain scripts/prove-guards.ts` → empty.
- Control after the restore: `npm run prove:guards:selftest` → **exit 0**, 5/5 ✅. The command is not
  green unconditionally in the direction that matters — the DEAD row of the 2×2 does red — it is blind
  to *this* dimension specifically.

**Mechanism, as a hypothesis.** The self-test's dead-server case is a *terminal-state* assertion: it
checks the process faulted and named the fault. The number of attempts is only observable in
`runUntilServed`'s `console.log` (`re-attempting (n/6)`) and in `r.attempts`, which is interpolated into
the fault text as `in ${r.attempts} attempt(s)` — a value the `wantAll` list never mentions. Any un-fix
that changes *how many times* it retries, up to and including not retrying at all, is invisible to the
assertion. The docblock's own arithmetic (`k=1 (no retry) → ~100%` chance a full `--all` is killed)
states the user-facing consequence of exactly this un-fix, and nothing checks it.

**Consequence.** The claim `--all` can finish rests on a literal that no gate can see move. A revert, a
merge, or a well-meant "this retry is masking a real failure, drop it to 1" edit restores the state
`.12.3a` was written to repair, and the whole gate stack — `prove:guards --selftest`,
`lint:cap-literals`, `lint:finding-guards` — reads green over it.

**Remedy — UNVERIFIED.** Add `re-attempting (2/` (or `attempt(s)` with a count) to the `deadserver`
case's `wantAll`, so the fault text and at least one printed retry are both asserted; the deadserver
probe reds on every attempt, so the retry is already being exercised — only the assertion is missing.
⚠️ Unverified: I did not measure whether the retry log line survives the `spawnSync` capture in the
subprocess case, and asserting on `(6/6)` specifically would pin the cap in a second place, which the
`MIN_CAPS` note argues is a feature and `[D4-4]` might read as derived. Triage should pick which.

---

## D2-2 — `minor` · `prove:guards` tells the operator, on its success path, that `lint:finding-guards` is now red — it is not, and the same file says so 40 lines earlier

**What the instrument lets through.** Nothing, in the gating sense — this is a false statement printed on
a line every operator of `prove:guards` meets, and it is a *self-contradiction inside one file*. The
brief flags this class ("a comment is a carried premise") and records that a `prove-guards.ts` docblock
about the drained ratchet was measured wrong last round. **It is still there, in two places, and one of
them is runtime output rather than a comment.**

**File and line.** `scripts/prove-guards.ts`:

- **L729** (docblock heading): *"S1.12.5.1 — **RECORDING DRAINS A STRICT-EQUALITY RATCHET**, SO SAY SO
  BEFORE IT REDS."*
- **L746-748** (printed, on the success path, whenever `recorded.length`):
  `set \`MAX_AUTHORED = ${stillAuthored}\` in scripts/check-finding-guards.ts, in this same edit.` /
  `⚠️ Until you do, lint:finding-guards reds, and so does every gate that runs it as a control.`
- **L689-691**, in the *same file*, states the opposite and is the correct one: *"`MAX_AUTHORED` in
  `check-finding-guards.ts` is a **CEILING** (`authored.length > MAX_AUTHORED`) … a crash that drains the
  count pushes it further UNDER the cap, so `lint:finding-guards` stays **green**."*

**The measurement.** Planted on a *copy* of the registry, addressed through
`check-finding-guards.ts`'s own `--registry=` idiom, so the tracked `scripts/finding-guards.json` was
never written. Current true state: `MAX_AUTHORED = 10` (`scripts/check-finding-guards.ts:189`),
`authored.length = 10`, compared with `>` at `scripts/check-finding-guards.ts:439`.

| run | registry | `authored` | exit | line |
|---|---|---|---|---|
| control | verbatim copy | 10 | **0** | `✅ finding-guards: 266 of 267 …· 10 authored but never run (cap 10)` |
| **drain** (one proof gains `measured`+`sha` — exactly what a `prove:guards` pass does) | copy | **9** | **0** | `✅ … 9 authored but never run (cap 10)` |
| **raise** (one proof loses `measured` — the opposite direction) | copy | **11** | **1** | `❌ finding-guards: 1 problem(s) … 11 proof blocks have NEVER been executed; the ceiling is 10` |

Both directions planted (`plant-both-directions`), and the raise run is the **control on the verifier**:
the checker demonstrably *can* see this field and does red on it, so the drain run's green is a real
measurement of the ceiling and not a checker that never looked. Probe scripts and the three registry
copies are under `docs/audits/2026-09-02-s1-money-pass7/d2-probes/`. The tracked registry was not
modified at any point (`git status --porcelain scripts/finding-guards.json` empty throughout).

**Mechanism, as a hypothesis.** `MAX_AUTHORED` was converted from a strict-equality ratchet to a
deliberate ceiling in `check-finding-guards.ts` (its L175-186 note gives the reason: strict equality
leaves the gate red for the whole interval between running a proof and editing the cap). The nudge in
`prove-guards.ts` was written against the strict-equality version and was not revised with it; the
`.12.3a` docblock at L689 was written *after* the conversion, which is why the file now carries both
readings. The nudge is still *useful* — the cap should follow, to keep the gap small — but its stated
reason ("until you do, it reds") is false, and an operator who trusts it and then sees green diagnoses a
broken gate.

**Consequence.** The nudge's authority is the thing at risk: the one line that says *"lower the cap now"*
is attached to a claim the operator can falsify in ten seconds, in a repo whose own rules say a carried
premise decays. It also under-states the real hazard, which L689 gets right — a drain leaves **slack a
new un-evidenced authored entry hides in**, silently.

**Remedy — UNVERIFIED.** Reword L746-748 to the true mechanism: the cap is a ceiling, so it stays green,
and lowering it is what keeps the slack from absorbing the next authored entry; and retitle L729 from
"STRICT-EQUALITY RATCHET" to "CEILING". ⚠️ Unverified: I did not check whether any registered guard or
`lint:copy`/`lint:comments` entry asserts on the current wording, so an edit may need a token updated
with it.

---

## D2-3 — `minor` · `Proof.measured`'s docblock still says the field is "written by `--record`"; the flag was removed and recording is the default

**What the instrument lets through.** A stale premise on the interface definition every author of a new
proof block reads.

**File and line.** `scripts/prove-guards.ts:70` —
`/** ISO date the proof last passed, and the sha it passed on — written by \`--record\` */`

**The measurement.** `grep -n "'record'|--record|no-record" scripts/prove-guards.ts` returns four hits.
The only argv predicate in the file is `has('no-record')` at **L662**; `arg()`/`has()` are never called
with `record`. **L664-674**, twelve lines below the stale comment, is the fix that removed it:
*"S1.12.5.1 [pass-5 D5-1] — RECORDING IS THE DEFAULT NOW, BECAUSE `--record` WAS INVOKED BY NOTHING …
`--no-record` remains for a read-only run."* Passing `--record` today is silently ignored — it is not an
error, so nothing reds and nobody finds out.

**Mechanism, as a hypothesis.** The `S1.12.5.1` fix inverted the flag and documented the inversion at
the call site, but the `interface Proof` docblock 590 lines above it was not swept — the same
"one fix voided a claim elsewhere in its own file" shape the brief records. The sibling instruction in
`scripts/check-finding-guards.ts:552` (*"Re-run them: `npm run prove:guards -- --id=<…>` --record"*)
carries the identical stale flag; **that file is D1's**, and this is the class, not the member.

**Consequence.** An author copies the flag from the interface comment, and the run behaves identically —
so the stale instruction is unfalsifiable by use, which is why it survived a whole pass.

**Remedy — UNVERIFIED.** Change L70 to "written on every pass unless `--no-record`". ⚠️ Unverified, and
⛔ **iterate the class**: sweep for `--record` repo-wide (at minimum `check-finding-guards.ts:552`) in
one edit, rather than fixing the site this finding names.

---

## D2-4 — `major` · A registered closure's proof is VOID and the ledger still counts it as evidence: `S1-ROUTE-STALE-READ` re-runs `reason=WRONG`, and `lint:finding-guards` is green over it

**What the instrument lets through.** `scripts/finding-guards.json` records `S1-ROUTE-STALE-READ`
(S1.13.3 — the `stale-read` origin, the fix that took 131 unrouted money-bearing files down to 0) as
**measured 2026-08-31 @ f7e39483**. That stamp is the ledger's only distinction between `CLOSED` and
`OPEN`. **Re-run today it does not reproduce.** `lint:finding-guards` sees this — it prints the entry on
its *stale* list — and exits **0**, because `MAX_STALE_PROOFS = 8` is a *pinned ceiling* compared with
`>` (`scripts/check-finding-guards.ts:511,549`) and there are **7**. So a proof that no longer holds sits
in the registry carrying a date and a sha, under a green gate, with nothing that forces the re-run.

**File and line.** Registry entry `S1-ROUTE-STALE-READ` in `scripts/finding-guards.json`; target
`scripts/audit-route.ts`; the two competing assertions are the `reached NO LANE:` block
(`S1-ROUTE-EXIT-REACHABLE`, S1.13.5) and the `reached NO origin:` block (S1.13.3) inside
`scripts/audit-route.ts`. Ceiling at `scripts/check-finding-guards.ts:511`.

**The measurement.** `npm run prove:guards -- --no-record --id=S1P4-D4-11-REACHABLE,S1-ROUTE-STALE-READ,S1-ROUTE-EXIT-REACHABLE`
→ **exit 1**:

```
  ✅ S1P4-D4-11-REACHABLE       plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
  ❌ S1-ROUTE-STALE-READ        plant-applied=YES · planted=exit 1 · control=exit 0 · reason=WRONG
       ⛔ it redded, but not for "reached NO origin" — the red is not attributable to this defect.
         │ ❌ audit-route: 136 money-bearing file(s) the exit demands reached NO LANE:
  ✅ S1-ROUTE-EXIT-REACHABLE    plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```

⛔ **This is not the environmental harness fault.** The proof's `cmd` is `audit:route-check`, a plain
`tsx` run — no Playwright, no web server; `webServerNeverStarted` cannot fire, and the planted output is
`audit-route`'s own assertion text, not `config.webServer`. The plant applied (`plant-applied=YES`), the
control was green (`control=exit 0`), and the harness printed the competing failure line, so the run
carries its own evidence.

Same invocation, four other stale entries whose targets are in this lane, as a control on the method —
they hold, so `reason=WRONG` here is a property of this entry and not of re-running stale proofs:

```
  ✅ S1P4-D4-10-POINTER         plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
  ✅ S1P6-D2-8-SCRIPTSRUNNER    plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```

Registry and every target verified byte-identical afterwards: `cmp` against copies taken after the runs
for `scripts/audit-route.ts`, `scripts/finding-guards.json` and `package.json`, all identical;
`git status --porcelain` empty for all three. `--no-record` was passed on every invocation so the tracked
registry was never written.

**Mechanism, as a hypothesis.** S1.13.5 (`S1-ROUTE-EXIT-REACHABLE`) added the *"reached NO LANE"*
assertion **upstream** of S1.13.3's *"reached NO origin"* assertion in `audit-route.ts`, and
`audit:route-check` now passes `--exit-pass=s1p7`. `S1-ROUTE-STALE-READ`'s un-fix — `if (false)
origin.set(f, 'stale-read')` — starves both checks at once, and the newer one fires first and exits.
This is the brief's *"a plant that reds early hides later assertions"*, arriving as one fix voiding
another's proof — the exact shape the brief records as recurring four times. ⚠️ **Note the direction:**
the guard is probably still *live* (the command does red under the un-fix); what is dead is the
**attribution**, and attribution is the entire claim `prove:guards` exists to make. A future edit that
deletes only the `reached NO origin` block would leave this proof reading `WRONG` in exactly the same
way, so the entry can no longer tell those two states apart.

**Consequence.** One of the 137 "EXECUTED" proofs — the number three passes have read as the evidence
base — does not reproduce, and the gate designed to surface that says so only as a soft, capped,
green-path advisory. Compare the same gate's own printed warning at
`scripts/check-finding-guards.ts:544`: *"'STALE' means the target moved since the proof was measured —
re-run it; **2 of 32 did not hold**."* That figure is a hardcoded literal, frozen at the moment it was
typed; with this re-run the true rate is at least 3 of 37, and the number in the gate's output will never
move on its own.

**Remedy — UNVERIFIED.** Re-derive the un-fix so it isolates the `stale-read` origin without starving the
exit-reachable check (e.g. anchor on the `--unread-pass` seed alone and drop `--exit-pass` from this
entry's `cmd`, running it as an explicit argv rather than through `audit:route-check`), then re-run with
recording. ⚠️ Unverified — I did not construct or measure that alternative un-fix, and the two seeds
share `seedStaleRead`, so isolating them may not be possible without a code change, which pass 7 does not
make. ⚠️ Separately and independently unverified: replacing the hardcoded *"2 of 32"* with a value derived
from the registry, and making a stale proof's re-run failure a hard problem rather than a capped one.

---

## D2-5 — `minor` · `audit-route.ts --surface=s0` is dead by construction: it reports all 130 of S0's own files as double-owned and sends the operator to fix a config error that does not exist

**What the instrument lets through.** Not a green-over-nothing — the reverse. One of the two surfaces
this generator declares support for cannot be routed at all, and the refusal it prints names the wrong
cause. `INVENTORY` (`scripts/audit-route.ts:99-102`) declares `s0` and `s1`; `readInventory`'s own error
advertises both (`Known: s0, s1`); `lint:s0-coverage` generates the S0 inventory this consumes. The
capability is declared, documented and unreachable.

**File and line.** `scripts/audit-route.ts:349` —
`const s0 = surface === 's0' ? inv : readInventory('s0');`
→ `:353` `const s0Files = new Set(s0.files);`
→ `:370` `const overlap = inv.files.filter((f) => s0Files.has(f));`

When `surface === 's0'`, `s0` **is** `inv`, so `s0Files` is `inv.files` and the overlap filter is a set
against itself: every file matches, and the `die()` at `:371-376` fires.

**The measurement.**

```
$ npx tsx scripts/audit-route.ts --surface=s0 --since=4c0f7689 --check
EXIT=1
❌ audit-route: 130 file(s) are on BOTH the S0 and S0 inventories:
  apps/rn/app.json
  apps/rn/eslint.config.mjs
  apps/rn/playwright.config.ts
  …
  ⛔ Two owners is no owner. Fix `excluded` in scripts/surface-coverage.ts — do not let this file
  pick a winner, because whichever it picked would be silent.
```

130 is exactly S0's stated total — the same number the s1 run prints as `S0: 130 files`. **Control, same
binary, same pin, one flag different:** `npm run audit:route-check` (`--surface=s1 --since=4c0f7689
--unread-pass=s1p6 --exit-pass=s1p7 --check`) → **exit 0**, `639 routed · 0 missing on disk`,
`⭐ exit reachable: 457 … every one in a lane`. So the failure is a property of `--surface=s0` and not of
the tree, the pin or the inventory.

Note the message's own tell: *"on BOTH the **S0** and **S0** inventories"* — the surface name is
interpolated twice from the same value, which is the defect printing its own cause and nobody reading it.

**Mechanism, as a hypothesis.** The overlap assertion was added (docblock at `:355-368`) to replace a
precedence rule that made a collision unreachable — *"a check that could not fail"*. The repair is
correct for `--surface=s1`, where `inv` and `s0` are two different inventories. The `surface === 's0'`
short-circuit one line above exists to avoid parsing the same file twice, and the two were not composed:
the aliasing turns a disjointness check into a self-identity check, which is **always true** rather than
always false. Same class as `D4-11`, opposite polarity — a check that cannot pass instead of one that
cannot fail.

**Consequence.** S0's route can never be generated, so S0's own never-swept files are reachable only
through the `s0-first-look` origin of an **s1** run (26 of them at this pin). That works today and is
why nobody has hit this. The cost is the next person who tries — the message tells them the bug is in
`surface-coverage.ts`'s `excluded` list, and 130 names of files that are correctly owned by exactly one
surface is a convincing amount of evidence for a wrong diagnosis.

**Remedy — UNVERIFIED.** Skip the overlap assertion when `surface === 's0'` (there is no second
inventory to disagree with), or compute it from `readInventory('s0')` unconditionally and accept the
double parse. ⚠️ Unverified — I did not apply either; and `--surface=s0` may fail again further down for
independent reasons once past `:370` (the `s0Files`/`s1Files` subtraction at `:487-490` has the same
aliasing), so triage should run it to completion rather than stopping at the first green.

---

## D2-6 — `minor` · `audit-sublanes.ts`'s per-parent count assertion cannot fail, and its docblock says the opposite in the same breath — `D4-11` committed a fifth time

**What the instrument lets through.** Nothing extra — the two states it names are caught elsewhere. What
it lets through is *belief*: this is the check the file's own docblock calls **"The assertion that can
actually fail"** and explicitly defends against being a tautology. It is a tautology. This is the
recurrence the brief predicts — `D4-11` was three tautological set identities in `audit-route.ts`, its
own docblock records shipping *"a check that could not fail"* one commit earlier, and `S1.13.5` records
committing it **a fourth time** in the block warning about it. This is the fifth, in the sibling file.

**File and line.** `scripts/audit-sublanes.ts:187-194`:

```
   * ⛔ The assertion that can actually fail: a sub-lane spec edit that drops or double-counts a file.
   * ⚠️ It is NOT a tautology of the loop — the inner `die` covers "no sub-lane" and the `Map` covers
   * "twice", so this compares the two INDEPENDENT counts the manifests are written from.
   */
  const written = [...buckets.values()].reduce((n, l) => n + l.length, 0);
  if (written !== parentFiles.length) {
    die(`lane ${parent}: sub-lanes hold ${written} file(s) and the parent manifest has ${parentFiles.length}.`);
  }
```

The two counts are **not** independent. The loop at `:174-182` iterates `parentFiles` and, per file,
either `die`s (`subs.find` → undefined, or `assigned.has(f)`) or performs exactly one
`buckets.get(sub.id)!.push(f)`. So `written` is incremented exactly once per surviving iteration and
`written === parentFiles.length` on every path that reaches `:191` — the argument the same docblock makes
about the inner `die` and the `Map` is precisely what makes its own check unreachable.

**The measurement.** Both spec-edit states the docblock names, planted on a hermetic copy of the four
parent manifests (`d2-probes/route/`), so no lane's live manifest was touched.

- **Control**, copy unmodified: `npx tsx scripts/audit-sublanes.ts --dir=…/d2-probes/route --check` →
  **exit 0**, `12 sub-lanes · 639 files · 106.0k lines`, `⭐ exit reachable: all 457 …`.
- **"Drops a file"** — narrow the `D2` catch-all, the same un-fix that measured `D4-11`
  (`match: () => true` → `match: (f: string) => f.startsWith('scripts/')`, `scripts/audit-sublanes.ts:129`):
  → **exit 1**, `❌ audit-sublanes: ".gitignore" reached no sub-lane of D — the catch-all is broken.`
  ⛔ That is the **inner** `die` at `:177`. Execution never reaches `:191`.
- **"Double-counts a file"** — duplicate a sub-lane id inside one parent (`id: 'D1'` → `id: 'D2'`, the
  copy-paste this check is for): → **exit 1**,
  `❌ audit-sublanes: sub-lanes hold 710 file(s) and the four parent manifests hold 639.`
  ⛔ That is the **global** check at `:203`, not the per-parent one — `written` still equalled 83 for
  parent D, because both rows read the same shared bucket array.
- **Control after restore:** `cp` from the pristine copy, `cmp /tmp/d2-sublanes-pristine.ts
  /tmp/d2-sublanes-after.ts` → identical, `git status --porcelain scripts/audit-sublanes.ts` → empty,
  and the run is back to **exit 0** with the same 639/457 line. So the harness demonstrably *can* see
  edits to this file — proven twice, in both directions — and the green at `:192` is a measurement, not
  a checker that never looked.

**Mechanism, as a hypothesis.** The assertion was written by analogy with `audit-route.ts`'s surviving
checks and inherits their shape without inheriting their *unit*. `audit-route.ts`'s totality proof
(`owed`) works because its population comes from `git diff` — a **second producer**. Here both operands
descend from the same array in the same loop. The docblock's defence ("the inner `die` covers…, the `Map`
covers…") is the argument **for** unreachability stated as an argument against it: once those two states
are impossible, nothing is left for this check to catch.

**Consequence.** A reader auditing this file — which is what pass 7 is — counts three assertions in it
and finds two. The two that work (`totalFiles !== grandTotal` at `:203` and the exit check at `:212`) are
genuinely independent and I measured both firing, so the file is not unguarded; it is over-claimed by
one. In a repo whose convergence is decided by whether instruments do what they say, that gap is the
subject, not a detail.

**Remedy — UNVERIFIED.** Delete `:186-194` (the `D4-11` precedent deleted rather than repaired, on the
same reasoning), or make it independent by counting from the written manifest text rather than from
`buckets`. ⚠️ Unverified — I applied neither. ⛔ **Iterate the class, not the member:** the same
"docblock asserts non-tautology" shape should be re-checked wherever it appears; `audit-route.ts:520-522`
carries a near-identical sentence about `written`/`routedCount`'s surviving siblings.

---

## D2-7 — `major` · `resolveSpecifier` hardcodes `@/` to `apps/rn/src`, so 128 real import edges silently do not exist — and `lint:import-graph` pins the one root where that mapping is correct

**What the instrument lets through.** The `neighbour` origin — 77 files this round, and *"pass 5's largest
bucket carried 4 of 9 blockers"* — is generated entirely from this graph. Its header states the risk
itself: *"an unresolvable specifier is simply not an edge. That fails toward a SMALLER neighbourhood,
which is the wrong direction for a route."* Measured: **128 edges over 52 importing files fail exactly
that way**, `lint:import-graph` exits **0** with `23 assertions · 2396 resolved edges`, and the four
"resolution shapes" it pins all use an importer inside `apps/rn/src/`, which is the one tree where the
hardcoded mapping happens to be right.

**File and line.** `scripts/lib/importGraph.ts:37` —
`else if (spec.startsWith('@/')) base = posix.join('apps/rn/src', spec.slice('@/'.length));`
Docblock claim at `:23-24`: *"Relative specifiers and this repo's **two aliases** (`@core/`, `@/`)
resolve."* Guard at `scripts/test-import-graph.ts:54-58`.

**`@/` is not one alias. It is four, and they disagree:**

| tsconfig | `@/*` means |
|---|---|
| `apps/rn/tsconfig.json:13` | `./src/*` → `apps/rn/src/*` |
| `scripts/tsconfig.json:51` | `apps/rn/src/*` |
| **`tsconfig.json:22`** (repo root / legacy Next) | **`./*` → the repo root** |
| **`packages/core/tsconfig.json:31`** | **`../../*` → the repo root** |

`@core/` is safe by luck: `apps/rn/tsconfig.json:12` maps it to `./core/*`, and `apps/rn/core` is an
untracked **symlink to `packages/core`** (`git ls-files apps/rn/core` → 0 files;
`lrwxrwxrwx … apps/rn/core -> …/packages/core`), so the hardcoded target is the real one. ⚠️ I initially
scored 204 apps/rn `@core/` rows as wrong and refuted that myself before writing this — the symlink is
why.

**The measurement.** A runner importing the **real exported function** (not a re-implementation), against
the real `git ls-files` set:

```
EDGE  apps/rn/src/app/(tabs)/money.tsx   @/store/trustSelectors        → apps/rn/src/store/trustSelectors.ts   ← the row the gate pins
NULL  app/page.tsx                        @/components/DebtsSection     → null   (real: components/DebtsSection.tsx, tracked)
NULL  app/page.tsx                        @/lib/storage/backup          → null   (real: lib/storage/backup.ts, tracked)
NULL  packages/core/history/selectVisibleHistory.ts  @/lib/subscription/hasFeatureAccess → null (real: lib/subscription/hasFeatureAccess.ts, tracked)
NULL  packages/core/testing/testSafeStorage.ts       @/lib/storage/safeStorage           → null (real: lib/storage/safeStorage.ts, tracked)
EDGE  components/DebtsSection.tsx         @core/debt/projectDebtPayoff  → packages/core/debt/projectDebtPayoff.ts   ← @core, for contrast
```

Whole-repo sweep of `@/` specifiers whose `apps/rn/src` reading resolves nothing while the repo-root
reading resolves a **tracked** file:

```
128 dropped edges · 52 distinct importing files · 50 distinct targets
by importing tree:  app 41 · components 56 · lib 25 · packages/core 6
real graph: 2396 resolved edges over 789 source files   → 5.1% of the graph is missing
legacy-root source files: 69 · outgoing edges the graph found for them: 133
consumersOf('components/DebtsSection.tsx')                → []   (app/page.tsx imports it)
consumersOf('lib/subscription/hasFeatureAccess.ts')       → []   (two packages/core files import it)
```

`npm run lint:import-graph` → **exit 0**,
`✅ import graph: 23 assertions · 2396 resolved edges across 789 source files.`

⛔ **Why the guard cannot see it.** `scripts/test-import-graph.ts:54-58` asserts `@/` from
`apps/rn/src/app/(tabs)/money.tsx`; there is **no row** for `@/` from the legacy root or from
`packages/core`. The only population check is `check(graph.edges > 1000, …)` at `:65` — a floor of 1000
against 2396, so 128 missing edges is 5% of a number with 140% of slack. The pinned `MIN_ASSERTIONS = 23`
proves no row was *deleted*; it cannot say a needed row was never *written*.

**Mechanism, as a hypothesis.** `resolveSpecifier` was written for `A-F4`, whose pair lives in
`apps/rn/src` and `packages/core`, and the alias table was read off the tree it was written against. The
`packages/core` case is documented in that project's own tsconfig — *"three files import `@/lib/*` from
the Capacitor tree at the repo root — the **interim backward-deps**"* — and I measured **3 files, 6
specifiers**, exactly matching that note; so the true mapping was written down, in the repo, and the
resolver was not built from it.

**Consequence, stated precisely.** All 50 dropped targets are on **no claims file** (`lib/…`,
`components/…` are among the 25 homeless the route prints). The direction that costs something is the
other one: `packages/core/history/selectVisibleHistory.ts` **is** an S1 file (claims `["s1p3","s1p6"]`)
and imports `lib/subscription/plans.ts` and `lib/subscription/hasFeatureAccess.ts`. If either of those
changes, `selectVisibleHistory.ts` cannot be routed as a `neighbour` — `consumersOf` for both is empty —
so a subscription-gating change lands with its S1 consumer in no lane. That is precisely the
two-producer half-blindness this module exists to remove, surviving inside it.

**Remedy — UNVERIFIED.** Resolve `@/` per importing tree: repo root for `app|components|lib|packages/core`,
`apps/rn/src` for `apps/rn|scripts` — or better, read the mapping from the owning `tsconfig.json` so there
is one producer of the alias table. Add a `test-import-graph.ts` row per tree and raise `MIN_ASSERTIONS`
in the same edit. ⚠️ Unverified: widening the resolver adds ~128 edges and will grow the `neighbour`
bucket, and [DECISION] `S1.12.6` (*"Coverage is what I want. Not unneeded files"*) says a wider seed is a
dispatch decision, not a silent code change — most of the new edges are in the surface `P6.11` deletes.
⛔ **Iterate the class:** `scripts/surface-inventory.ts:64-65` carries the identical hardcoded pair, so
this is two producers of the wrong rule, not one site.

---

## D2-8 — `major` · `S1P1-M9-ROUTING` survives its own un-fix: 11 files route to a surface that does not exist and `lint:s1-coverage` prints `✅ 495 surface files classified`

**What the instrument lets through.** M9-C is the finding that *"13 files were routed to a surface key —
`s4` — that does not exist and never has"*, silently deleting them from every surface. Its closure rests
on a self-check whose own docblock says the first cut *"proved the PREDICATE and said nothing about the
call"* — `tested-helper-is-not-a-used-helper` — and that the repair moved the refusal into a function so
*"any edit that stops the body refusing stops the self-check refusing too."* **The body is not where the
refusal happens.** The body *collects*; the refusal is a separate `if` at the call site, and that `if` is
guarded by nothing. Neuter it and the exact M9-C state goes green.

**File and line.** `scripts/surface-coverage.ts`:
- `:648-655` `collectBadRoutes` — the shared body, and what the self-check exercises.
- `:658-664` the self-check — calls `collectBadRoutes` directly with a synthetic file and `process.exit(1)`s
  on its own. It never reaches the production path.
- `:679` `badRoutes = collectBadRoutes([...routed.keys()], (f) => routed.get(f) ?? null);`
- **`:682` `if (badRoutes.length) {` — the unguarded refusal.**
- Registry: `S1P1-M9-ROUTING`, `token: "if (r && !KNOWN_SURFACES.has(r.to))"` — a line inside the *body*,
  which the un-fix leaves exactly where it is. Its `what` states *"the behavioural proof is the
  test:gate-plants scenario / self-check"*; `scripts/test-gate-plants.ts` carries **25** scenarios,
  including `lint:s1-coverage [M9-vocab]` (`:316`) and `lint:s1-coverage [D69-inventory]` (`:328`), and
  **no routing scenario**. The self-check is the whole proof, and it does not cover the call.

**The measurement.** Two edits, one file, both directions, with the verifier controlled.

| run | edits | exit | line |
|---|---|---|---|
| control (pristine) | — | **0** | `✅ s1-coverage: 495 surface files classified · 11 unswept.` |
| **the verifier can see it** | `to: 's4'` → `to: 's9'` at `:324` only | **1** | `❌ s1-coverage: 11 exclusion(s) route to a surface that does not exist.` |
| **the un-fix** | `:324` `to: 's9'` **+** `:682` `if (false && badRoutes.length) {` | **0** | `✅ s1-coverage: 495 surface files classified · 11 unswept.` |
| `lint:finding-guards`, same planted tree | — | **0** | `✅ finding-guards: 266 of 267 findings carry a standing guard` |
| control after restore | — | **0** | `✅ s1-coverage: 495 surface files classified · 11 unswept.` |

⛔ Under the un-fix, **11 files really are routed to `s9`** — a key in no `SURFACES` entry, no claims file
and no plan — and the gate reports the surface classified. That is M9-C reproduced, in the file M9-C was
fixed in, with the fix's own self-check green.

The routing plant was chosen so nothing downstream masks it: `S4_OWNED` files are *already* routed out, so
they are in neither `files` nor `claims`, and `missing`/`stale` stay empty. (A plant that routed an
included file out would have redded at `:826 if (missing.length || stale.length)` for an unrelated
reason — the `reason=WRONG` shape.) The tracked inventory was **not** rewritten: `cmp` against
`/tmp/d2-inv-pristine.md` is identical and `git status --porcelain docs/audits/2026-08-26-s1-money/` is
empty, because the file list did not change. `scripts/surface-coverage.ts` restored from a copy taken
after the edits; `cmp` identical; `git status --porcelain scripts/` empty.

**Mechanism, as a hypothesis.** `S1.9.4`'s repair correctly identified that an inline `if` at the call
site is un-guardable by a token, and moved the *predicate* into `collectBadRoutes` so the self-check and
production share a body. But only the **collection** was shared; the **decision** — `if
(badRoutes.length) { …exit 1 }` — stayed at the call site, and it is the decision that fails open. The
self-check asserts `collectBadRoutes(…).length !== 1`, i.e. *"the body still returns a finding"*, which is
true in the planted tree. So the repair reproduced its own diagnosed defect one statement further down.

**Consequence.** A single `false &&`, a deleted line, or a merge that drops `:682-691` removes the only
enforcement that an exclusion names a real owner — and both gates that certify this file
(`lint:s1-coverage`, `lint:finding-guards`) say green. M9-C's measured cost was 13 files on no surface at
all, which is the state in which *"no audit pass can ever be pointed at these, and nothing records who
should own them."*

**Remedy — UNVERIFIED.** Move the exit into the shared body (have `collectBadRoutes` refuse rather than
return), so the self-check runs the same statement production does — the move `:658`'s own docblock argues
for, applied one line further; **or** add a `lint:s1-coverage [M9-routing]` scenario to
`scripts/test-gate-plants.ts` and raise `MIN_SCENARIOS` (`:576`, currently 25) in the same edit. ⚠️ Both
unverified — I applied neither, and the first changes control flow inside a function two other call sites
use. ⛔ **Iterate the class, not the member:** the sibling registry entries `S1P1-M9-VOCAB`
(`token: "if (!VALID_CLAIMS.has(v))"`) and `D69-INVENTORY`
(`token: "if (missing.length || stale.length)"`) pin lines with the same call-site shape, and both carry
the identical `what` sentence about *"the behavioural proof is the test:gate-plants scenario /
self-check"*. Those two DO have gate-plant scenarios; the routing one does not, and nothing detects the
asymmetry.

---

## D2-9 — `minor` · The iOS visual-regression comparator is wired to nothing, and its bootstrap path turns a wiped baseline set into a green run — which is what `P6.11` deleting `tests/` will do to it

**What the instrument lets through.** `scripts/compare-ios-screenshots.mjs` is the golden-image gate for
the iOS-Simulator smoke test — *"a layout regression the browser tests can't see (the whole point)"*. Two
things about it, each harmless alone:

1. **Nothing runs it.** No workflow, no npm script, no other script.
2. **A missing baseline is a PASS**, by design (`:6-7`, the bootstrap). With every baseline missing the run
   prints `0 compared · N new baseline(s)` and exits **0**.

Its baselines are 4 tracked PNGs under **`tests/ios-baselines/`**, and `scripts/surface-coverage.ts:481`
records `tests/` as *"legacy Next surface — **deleted at P6.11**"*. When that deletion lands, this
instrument's failure mode becomes permanent green rather than a missing file.

**File and line.** `scripts/compare-ios-screenshots.mjs:44-50` (the bootstrap branch:
`if (!existsSync(basePath)) { …copyFileSync…; created++; continue; }`) and `:72-84` (the verdict, which
only ever reads `failed`, never `compared`). The only floor is `:36` `currents.length === 0`, which is a
floor on the *input*, not on how much was checked.

**The measurement.** Hermetic, in `d2-probes/ios/`, using two of the committed baselines as the current
frames. `tests/` was never written (`git status --porcelain tests/` empty throughout).

| | current | baseline dir | exit | output |
|---|---|---|---|---|
| **A** bootstrap | 2 real frames | empty | **0** | `＋ new baseline captured` ×2 · `0 compared · 2 new baseline(s).` |
| **B** control | same 2 frames | now populated | **0** | `✓ … 0 px differ (0.000%)` ×2 · `2 compared · 0 new baseline(s).` |
| **C** control on the verifier | one frame swapped for the **dark** variant | populated | **1** | `✗ light/reconcile-current.png: 956507 px differ (95.603%) > 0.20% → diff saved` |
| **D** the P6.11 state | the **same** regressed frame as C | **deleted** | **0** | `＋ new baseline captured` ×2 · `0 compared · 2 new baseline(s).` |

⛔ **C and D differ only in whether the baseline directory exists.** A 95.6%-different frame reds in C and
passes in D, and D's output contains no ⚠️, no non-zero exit and no count of what was skipped — only
`0 compared`, a number nothing gates on.

**Mechanism, as a hypothesis.** The bootstrap was written so the first run on a new machine self-seeds,
which is reasonable when the baselines are a permanent fixture. It becomes fail-open the moment the
baseline set can be absent for any *other* reason, and `P6.11` supplies exactly that reason: the gate's
data lives inside the tree the plan deletes, and nothing connects the two — the deletion note is in
`surface-coverage.ts`, the dependency is in a `.mjs` no gate reads. Being unwired is why nobody has met
it: `lint:runner-completeness` extended its population to `scripts/` at `S1.13.7.2`, but that population
is the **name shape** `/(^|\/)test-[A-Za-z0-9._-]+\.(ts|mjs|cjs|sh)$/`
(`scripts/check-runner-completeness.ts:124`), and `compare-ios-screenshots.mjs` does not start with
`test-`. ⚠️ That is the `S1P6-D2-8` fix reaching its reported instance and leaving a sibling — the class
the brief names — and the file it lives in (`check-runner-completeness.ts`) is **D1's**, not mine.

**Consequence today: none** — it runs nowhere, so nothing is currently reported green over nothing. The
cost is deferred and precise: whoever wires this into `native-e2e.yml` inherits a gate that reports
success over an empty comparison, and `P6.11` is scheduled to put it in that state. There is also a stale
instruction on the failure path — `:82` tells the operator to *"delete the stale baseline(s) under
tests/ios-baselines"*, a hardcoded path that ignores the `[baselineDir]` argument the same file's usage
line documents.

**Remedy — UNVERIFIED.** Add a floor on `compared` (or refuse when `created > 0` and `compared === 0`)
so a bootstrap run cannot be mistaken for a comparison, and move `tests/ios-baselines/` out of the tree
`P6.11` deletes — or delete this script with that tree, if the iOS smoke lane is gone too. ⚠️ All three
unverified; I did not establish whether the Maestro iOS smoke lane it was written for still exists, and
`.github/workflows/native-e2e.yml` should be read before deciding between wiring it and deleting it.

---

## D2-10 — `major` · `preflight:xcuitest` has no floor on how many checks ran: empty its file list and three assertions — each of which cost a ~40-minute CI cycle to discover — vanish, and it still prints ✅

**What the instrument lets through.** The whole point of this pre-flight is that *"the native lane costs
~22 minutes and its characteristic failure is an unexplained timeout twenty minutes downstream."* Its
sibling `scripts/preflight-native-lane.ts:573,584-589` pins its own population — `const MIN_CHECKS = 95;`
with `if (total < MIN_CHECKS)` and the message *"Do NOT lower 95 to make this pass. Find the guard that
stopped running."* **`preflight-xcuitest-target.ts` has no such pin.** It prints
`✅ xcuitest pre-flight: N structural checks pass` and N is a free variable. This is the `lint:scan-floors`
/ `MIN_CAPS` lesson — *"a gate that finds nothing to check reports the same ✅ as a gate that checked
everything"* — in the one file in this lane whose own comments record **two CI cycles burned, one layer
apart**, on exactly the checks a shrinking population removes.

**File and line.** `scripts/preflight-xcuitest-target.ts:247-251` (the success path — `ok.length` is
printed, never compared). The population-driven blocks are `:28` (the destructure that imports
`SWIFT_FILES` from the plugin), `:70-74`, `:97-116` and `:151-165`.

**The measurement.**

- **Control:** `npm run preflight:xcuitest` → **exit 0**,
  `✅ xcuitest pre-flight: 37 structural checks pass against a real project.pbxproj.`
- **Plant** (one edit — the plugin's list arrives empty, the shape a rename or a refactor of
  `apps/rn/plugins/with-xcuitest-target.js:41` produces):
  `const { applyXcuitestTarget, applyTestableToScheme, TARGET_NAME, SWIFT_FILES } = plugin;`
  → `const { applyXcuitestTarget, applyTestableToScheme, TARGET_NAME } = plugin;` +
  `const SWIFT_FILES: string[] = [];`
  → **exit 0**, `✅ xcuitest pre-flight: 34 structural checks pass against a real project.pbxproj.`
- **The three checks that disappeared** are, per file in `SWIFT_FILES` (there is exactly one,
  `CoverageProbeUITests.swift`):
  1. `<f> is in the Sources phase`
  2. `<f> has a file reference`
  3. `<f> resolves to ios/<TARGET_NAME>/<f>, not a doubled path` — **the one added after run
     `31822453981` failed `** TEST BUILD FAILED **` with *"Build input file cannot be found"*, about
     which the file's own comment says: "⚡ 31 checks passed on that exact project."**
- **Control on the verifier** — the script is not green unconditionally: planting a must-fail assertion
  (`cfgIds.length === 2` → `=== 3`) gives **exit 1**, `⛔ xcuitest pre-flight — 1 problem: • two build
  configurations — got 2`. So the ✅ under the population plant is a measurement, not a checker that
  never ran.
- Restored from a copy taken after each edit; `cmp` identical both times;
  `git status --porcelain scripts/` empty.

**Mechanism, as a hypothesis.** Every assertion in the file is a `check(label, cond)` call that pushes
into `ok` or `problems`, and the verdict reads only `problems.length`. An assertion that never *runs*
pushes into neither — it is indistinguishable from a tree with nothing to check. Three of the four
assertion blocks are `for` loops over a population (`SWIFT_FILES`, `cfgIds`, `schemeShapes`), so any of
them collapsing is silent. The sibling file solved this and the solution was not carried across: the
`MIN_CHECKS` idiom is even cited *by name* in `scripts/test-gate-plants.ts:576`'s docblock as the model
for its own `MIN_SCENARIOS`, so the pattern was known and applied twice elsewhere while this file went
without.

**Consequence.** The number of assertions is the only thing standing between a pbxproj defect and a
~40-minute macOS cycle, and nothing pins it. The two failures this file's comments narrate — a doubled
source path and a missing `Info.plist` — were both *"fully determined by the pbxproj this script already
holds"*, and both would go undetected again under a population collapse, with the run reporting a ✅ and
a plausible-looking count.

**Remedy — UNVERIFIED.** Add `const MIN_CHECKS = 37;` and `if (ok.length < MIN_CHECKS) { …exit 1 }`
alongside the `problems` verdict, matching `preflight-native-lane.ts:573`. ⚠️ Unverified: I did not
apply it, and `scripts/check-cap-literals.ts` pins `MIN_CAPS = 27` (`:130`) — adding a cap constant here
raises the observed cap count, so `MIN_CAPS` must move in the same edit or `lint:cap-literals` reds with
the message *"A cap was added: raise MIN_CAPS to 28"*.

---

## D2-11 — `minor` · Two byte-identical Swift copies of the payday-rollover queue are kept in sync by a comment; every gate stays green over a divergence, and the pass-6 fix that landed here is the one that already recurred

**What the instrument lets through.** `PaydayLandedIntent.swift` exists twice — the app-target copy and
the widget copy — and each file's own docblock says *"the two copies must stay byte-for-byte identical
(AppIntents route by type name + shape)."* The requirement is real (ActivityKit/AppIntents route by type
name, so both binaries compile their own copy), and it is enforced by **nothing**. Same for the second
pair, `PaydayActivityAttributes.swift`. These files queue a `payday-landed` action into the App Group
that the app drains and applies via `rolloverPayCycle` — the pay-cycle rollover.

**File and line.**
- `apps/rn/modules/live-activity/ios/PaydayLandedIntent.swift:11-12` and
  `apps/rn/targets/widget/PaydayLandedIntent.swift:4-6` — the two "must stay identical" notes.
- The queue write itself: `:28-33` in the app copy, `:23-28` in the widget copy.
- `apps/rn/modules/live-activity/ios/PaydayActivityAttributes.swift:4-7` /
  `apps/rn/targets/widget/PaydayActivityAttributes.swift:7-12` — the second pair.

**The measurement.**

*State today, checked rather than assumed:* `diff` of the two `PaydayLandedIntent.swift` copies shows
**only the doc comments differ** — every executable line matches, including the `raw == nil || raw as?
[[String: Any]] != nil` guard pass 6's `C3-7` added. `PaydayActivityAttributes.swift` differs by doc
comments plus one **documented** intentional line (`@available(iOS 16.1, *)` on the app copy). So the fix
did reach both sides this time; what is missing is anything that keeps it that way.

*Coverage of these files:* `git ls-files '*.swift'` → **19** tracked files, of which exactly two
basenames are duplicated (`PaydayLandedIntent.swift`, `PaydayActivityAttributes.swift`). Looked up in
every claims file — `surface-coverage.s0/s1/s2/s3/s4.json` — **none of the four is on any surface**
(`SOURCE_EXT` at `scripts/surface-coverage.ts:151` is `.ts .tsx .mjs .cjs .json .sh`, and
`apps/rn/modules` is in `NOT_SOURCE`). They reached this lane only as `off-surface`, i.e. because they
*changed* since the pin. Only one script in the repo reads a `.swift` file at all:
`scripts/check-apostrophes.ts:238`, and it checks apostrophe characters.

*Control on the verifier — the checker CAN see this file.* Plant a straight apostrophe in the widget
copy's `IntentDescription` string → `npm run lint:apostrophes` **exit 1**:
`❌ apostrophes (Swift): 1 straight-apostrophe string(s) in shipped native copy.` /
`apps/rn/targets/widget/PaydayLandedIntent.swift:10  "Roll your plan forward now that payday's arrived."`
Restored.

*The divergence plant — the `C3-7` un-fix, applied to ONE copy only.* Replaced the widget copy's
guarded write with the pre-`C3-7` form:

```swift
var actions = defaults.object(forKey: key) as? [[String: Any]] ?? []
actions.append(["kind": "payday-landed", "id": UUID().uuidString])
defaults.set(actions, forKey: key)
```

`diff` confirmed the two copies now disagree about whether an unreadable queue is **left alone** or
**replaced with `[]` and written back**. Every gate that could plausibly see it:

```
lint:apostrophes      -> EXIT=0
lint:finding-guards   -> EXIT=0
lint:cap-literals     -> EXIT=0
lint:s1-coverage      -> EXIT=0
lint:conflict-markers -> EXIT=0
lint:control-chars    -> EXIT=0
lint:secrets          -> EXIT=0
audit:route-check     -> EXIT=0
```

Restored from a copy taken after the edit; `cmp` identical; `git status --porcelain apps/rn/` empty;
`lint:apostrophes` back to exit 0.

*A third leg of the same contract, measured:* `apps/rn/targets/widget/PaydayActivityAttributes.swift:11-12`
also requires that the `ContentState` fields *"MUST match `PaydayActivityContent` in
`src/liveActivity/paydayActivityContent.ts` (the JS builds this payload)."* Checked field by field —
`paydayDateISO`, `daysUntilPayday`, `countdownLabel`, `guardianState`, `title`, `line`, `cycleProgress`
— the TS interface at `apps/rn/src/liveActivity/paydayActivityContent.ts:20-35` agrees with both Swift
copies today. So this is a **three-way** sync requirement across two languages, and all three legs are
held by prose.

**Mechanism, as a hypothesis.** `.swift` is outside every population this repo gates: `SOURCE_EXT`
excludes it, `surface-coverage.ts`'s `NOT_SOURCE` skips `apps/rn/modules` by name (*"the native lane owns
them"*), and the native lane's own pre-flights assert on the **pbxproj and the workflow**, not on Swift
source. So the only mechanism keeping two copies of a money-mutating queue in agreement is a sentence in
each of them, and the sentence is the exact kind of artefact the brief calls a carried premise.

**Why MINOR and not more, stated so triage can re-rate it.** There is no divergence today, so nothing
is currently false about anyone's money, and there is no *instrument* here failing open — there is no
instrument at all. What raises it above a note is that the class already fired in these files: the
`C3-7` comment records *"the element type was widened on both sides; **this was not**"* — a fix that
reached one half of the pair. If triage judges "an absent guard on a queue that mutates the pay cycle"
by consequence rather than by instrument, it is higher.

**Remedy — UNVERIFIED.** A gate that asserts the two pairs' *code* (comments stripped) is identical, with
the one documented `@available` divergence written down as an allowance the way
`check-amount-collapse`'s `ALLOWED` map is — `check-apostrophes.ts` already has the Swift walker to build
it on. ⚠️ Unverified; I wrote no such gate. ⚠️ Also unverified and worth a separate decision: whether
`.swift` should join `SOURCE_EXT`, which would put 19 files onto a surface and move the unswept counts —
that is a dispatch decision, not a silent code change.

---

## D2-12 — `blocker` · Siri tells a PREMIUM user their paycheck read is "a Premium feature" when the app simply could not read their obligations — the `C3-1` fix reached two of the three intents in the file

**What the user meets.** `PaycheckCheckIntent` decides whether the user has paid by asking whether the
spoken Guardian string is empty. `buildGuardianSpoken` returns `''` for **four** distinct reasons, only
one of which is "not premium". For a premium user whose `minimumPayment` could not be parsed — pass-3
blocker `D3-2`'s exact store — Siri answers:

> *"Seeing your paycheck read is a Premium feature — open Debt Planner to unlock the Payday Guardian."*

…to somebody who has bought it. And the sentence they should have heard — *"Some of your balances
couldn't be read"* — is what **the other two intents in the same file** say on the identical store.
So the app suppresses a data-integrity warning about the user's obligations and substitutes a sales
pitch, on the one surface where they asked how their paycheck is doing.

**File and line.**
- `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:83-90` — `PaycheckCheckIntent.perform()`:
  `if snap.guardianSpoken.isEmpty { return .result(dialog: "Seeing your paycheck read is a Premium
  feature…") }`. **No `balancesUnread` branch**, unlike `:49-51` (`DebtFreeDateIntent`) and `:71-73`
  (`RemainingDebtIntent`), which both carry one.
- The producer: `apps/rn/src/widget/snapshot.ts:66-83` — `buildGuardianSpoken` returns `''` on
  (a) `subscriptionPlan !== 'premium'`, (b) `!mayClaim(store, 'required-plan')`, (c) `!brief`,
  (d) a thrown error caught at `:98`.
- The discriminator that already exists: `apps/rn/src/widget/snapshot.ts:243`
  `isPremium: store.subscriptionPlan === 'premium'` — written into the same App Group snapshot, and
  **already read by the sibling Swift file** at
  `apps/rn/plugins/app-intents-swift/LogPaymentIntent.swift:23` (`SnapshotStore.isPremium`), which uses
  it for exactly this decision.

**The measurement.** One store, one variable, with a control — the fixture is
`apps/rn/src/store/requiredPlanTrust.test.ts:67-81`'s own `withMinimum`, which is already
`subscriptionPlan: 'premium'`. Runner:
`docs/audits/2026-09-02-s1-money-pass7/d2-probes/siri-premium.ts`, run as
`npx tsx --tsconfig apps/rn/tsconfig.json …` (exit 0). The three Siri sentences are transcribed verbatim
from `SiriQueryIntents.swift` and evaluated against the real `buildWidgetSnapshot` output:

```
=== UNREAD  (premium, minimumPayment = "n/a")
  subscriptionPlan        : premium
  snapshot.isPremium      : true
  mayClaim required-plan  : false
  mayClaim row-figures    : false
  snapshot.balancesUnread : true
  snapshot.guardianSpoken : ""
  Siri · debt-free date   : Some of your balances couldn't be read, so I can't give you a date yet. …
  Siri · remaining debt   : Some of your balances couldn't be read, so I can't total them yet. …
  Siri · paycheck check   : Seeing your paycheck read is a Premium feature — open Debt Planner to unlock the Payday Guardian.

=== CONTROL (premium, minimumPayment = 2500)
  subscriptionPlan        : premium
  snapshot.isPremium      : true
  mayClaim required-plan  : true
  mayClaim row-figures    : true
  snapshot.balancesUnread : false
  snapshot.guardianSpoken : "This paycheck is very tight — you’re about $500 short of your obligations."
  Siri · debt-free date   : You're on track to be debt-free by June 2026.
  Siri · remaining debt   : You have $5,000 in debt remaining.
  Siri · paycheck check   : This paycheck is very tight — you’re about $500 short of your obligations.
```

⭐ **`isPremium: true` beside the sentence "this is a Premium feature", on the same payload, in the same
run.** The control moves every row, so the fixture is not one that agrees with itself either way.

**Mechanism, as a hypothesis.** Two fixes met and neither knew about the other.
`snapshot.ts:80` (`S1.10.6.3`, pass-3 blocker `D3-2`) added `if (!mayClaim(store, 'required-plan'))
return ''` to `buildGuardianSpoken`, and its own docblock records the reasoning: *"The `''` return
already existed and Siri already routes it to the value-led upsell (`SiriQueryIntents.swift:75-78`);
what was missing was the call."* — i.e. it deliberately routed a **data refusal** into the **paywall**
sentence, because at that moment `''` meant only "not premium". Separately, `S1.13.7.4` (pass-6 `C3-1`)
added the `balancesUnread` branch to the file's other two intents so a refusal would stop wearing a
figure's clothes. **The third intent in the same file was not given one**, so the overloaded `''` still
resolves to the upsell. This is *iterate the class, never the member you found*: a two-of-three sweep of
a three-member file.

**Why BLOCKER.** The app makes a **false statement to the user on a money surface** — that they have
not paid for a feature they have paid for — and in doing so **withholds a true one**: that the
obligations its plan is computed from could not be read. The two sibling intents treat exactly that state
as blocker-grade and say so. ⚠️ Stated for triage: the false statement is about *entitlement* rather
than about a *figure*, so if the pass's BLOCKER definition is read strictly as "a wrong number", this
is a MAJOR. I did not down-rate it, because the suppressed warning is the money half and because the
sibling intents' handling of the same state is the repo's own answer about how serious it is.

**Remedy — UNVERIFIED.** In `PaycheckCheckIntent.perform()`, branch on the payload rather than on the
empty string: `if !snap.isPremium { …upsell }` (the field exists, and `LogPaymentIntent.swift:23`
already reads it), `else if snap.balancesUnread { …the "couldn't be read" sentence its two siblings
use }`, `else if snap.guardianSpoken.isEmpty { …a neutral "no read yet" }`. ⚠️ Unverified — I applied
nothing and cannot compile Swift on this box. ⚠️ Also unverified and needed for a complete fix:
`buildGuardianSpoken` returns `''` for a fourth reason (the `catch` at `snapshot.ts:98`) and a fifth
(`!brief`), and `balancesUnread` does not cover those — `DebtSnapshotRead` would need a field that
distinguishes them, or `guardianSpoken` would need to stop being a four-way overload. ⛔ **Iterate the
class:** re-check every consumer of `guardianSpoken` for the same overload, not only this intent —
`apps/rn/src/store/requiredPlanTrust.test.ts:117` already walks `'required-plan'` across its surfaces
and lists this one as a *pure* row, so the surface list exists to extend.

---

# Measured, and NOT a finding

Recorded so the next round does not re-run them, and so the hypotheses I refuted are visible.

- **`bucketGuards` / `guardBuckets.ts`** — its module-scope self-check asserts the `unguarded`
  precedence row (`D5-2`'s subject) and the three others. Registry today: 267 entries · 147 withProof ·
  137 executed · 10 authored · 0 guardOnly · 1 unguarded · 119 untested. `prove:guards --list` and
  `lint:finding-guards` agree, and I confirmed **0** duplicate top-level keys off the raw text.
- **`audit-sublanes.ts`'s exit assertion HOLDS.** Planted a dropped exit-bearing file on a hermetic copy
  of the four parent manifests → exit 1, `1 money-bearing file(s) the exit demands are in no SUB-LANE:
  packages/core/debt/applyDebtPaymentProjection.ts`. Control on the same copy: exit 0.
- **`test-gate-plants.ts` really does run all 25 scenarios.** I hypothesised `B1_SCENARIOS` (11 rows,
  declared at `:144`) was dead because the runner iterates `SCENARIOS` only — **refuted**: `:498` spreads
  `...B1_SCENARIOS` into `SCENARIOS`, and `MIN_SCENARIOS = 25` (`:576`, compared with `!==`) would red
  otherwise.
- **`@core/` is NOT mis-resolved for `apps/rn` files.** My first sweep scored 204 apps/rn rows as wrong,
  because `apps/rn/tsconfig.json:12` maps `@core/*` to `./core/*` — **refuted by measurement**:
  `apps/rn/core` is an untracked **symlink** to `packages/core` (`git ls-files apps/rn/core` → 0
  entries), so `importGraph.ts:36`'s hardcoded target is the real one. Only `@/` is wrong (D2-7).
- **`carriesMoneyClaim` is broad but not vacuous.** 457 of 495 S1 files are money-bearing (92%), which
  looked like a predicate selecting almost everything. Measured per word: 220 match on the PATH, 237 on
  content only, and only **48** files depend on a single word (`debt` 18, `money` 5, `payday` and
  `premium` 4 each, …). Only 2 files match on path but not on content. `MIN_MONEY_BEARING = 424` is now
  92.8% of 457 rather than the 95% of 446 its comment states — slack, not a defect.
- **`ready` really is required in `p6.8-matrix.shot.ts`.** Planted a `Surface` entry with no `ready` →
  `npm run typecheck:tests` **exit 2**, `p6.8-matrix.shot.ts(198,3): error TS2741: Property 'ready' is
  missing in type '{ name: string; goto: string; }' but required in type 'Surface'`. Control before and
  after: exit 0. Not filed, though two things sit next to it: the route block still guards with
  `if (s.ready)` at `:566` while `:666` and `:727` call it unconditionally (dead code), and the
  docblock's *"both `SURFACES` loops call it"* is off by one — three blocks shoot a `Surface`.
- **`preflight:xcuitest` is not green unconditionally** — see D2-10's control on the verifier.
- **`lint:apostrophes` does see `.swift`** — see D2-11's control on the verifier.
- **The two `PaydayActivityAttributes.swift` copies agree on every field**, and the TS
  `PaydayActivityContent` interface agrees with both. Only doc comments and one documented
  `@available(iOS 16.1, *)` differ.
- **`LogPaymentIntent.swift`'s hardcoded `.currency(code: "USD")` is consistent, not a defect** —
  `packages/core/utils/formatCurrency.ts:77-78` hardcodes USD too, and no currency preference exists in
  the store.
- **The tracked registry was never written.** Every `prove:guards` invocation in this lane passed
  `--no-record`; `cmp` against a pristine copy was identical at the end.

## Observations I could NOT settle here — flagged rather than filed

- **`lint:s2-coverage` prints `✅ s2-coverage: 0 surface files classified · 0 unswept.`** and it is in
  the release gate chain (`scripts/run-gates.ts:54`), so it runs on every `lint:rn`.
  `scripts/surface-coverage.s2.json` is literally `{}`, because `S1.13.7.12.4` routed S2's only file
  back to S1. Measured: **exit 0 over a population of zero**. ⚠️ I did **not** measure whether the
  collapse of a *non-empty* derived surface would be caught (the claims cross-check at
  `surface-coverage.ts:826` suggests it would, via `stale`), so I have not filed it — but a gate in the
  release chain whose green means *"there was nothing to check"* is the class this repo files
  everywhere else, and it deserves one measurement.
- **`DebtSnapshotRead`'s default property values may not survive Swift's synthesized `Codable`.**
  `SiriQueryIntents.swift:10-18` relies on `var balancesUnread: Bool = false` being used when the key is
  absent; the docblock says *"Defaults to `false` so an OLD snapshot written before this key existed
  still speaks."* Swift's synthesized `init(from:)` is widely understood **not** to honour default
  values for missing non-optional keys — which would mean an old snapshot fails to decode entirely,
  `load()` returns the all-defaults struct with `hasData = false`, and Siri says *"Add a debt in Debt
  Planner"* to a user who has debts. ⛔ **I could not compile Swift on this box and I am not asserting
  it.** This repo's own Law IV is that a stated mechanism still needs measuring, and 2 of 4 were wrong.
  One Swift snippet on the macOS runner settles it, and the docblock changes either way.

---

# Findings SPLIT BY ORIGIN

**Totals: 12 findings — 1 blocker · 5 major · 6 minor.**

| origin | findings | blocker | major | minor |
|---|---|---|---|---|
| **`instrument`** | 7 | 0 | 3 | 4 |
| **`s0-first-look`** | 3 | 0 | 2 | 1 |
| **`off-surface`** | 2 | 1 | 0 | 1 |
| `first-look` · `fix-churn` · `neighbour` · `stale-read` | 0 | — | — | — |

### `instrument` — 7 (the checking code the fixing itself wrote)

| id | severity | file |
|---|---|---|
| D2-1 | MAJOR | `scripts/prove-guards.ts` — the [D78] retry survives its own un-fix |
| D2-4 | MAJOR | `scripts/finding-guards.json` + `scripts/audit-route.ts` — a recorded proof is VOID and the gate is green |
| D2-8 | MAJOR | `scripts/surface-coverage.ts` — `S1P1-M9-ROUTING` survives its own un-fix |
| D2-2 | MINOR | `scripts/prove-guards.ts` — the drained-ratchet claim contradicts the same file |
| D2-3 | MINOR | `scripts/prove-guards.ts` — the removed `--record` flag, still documented |
| D2-5 | MINOR | `scripts/audit-route.ts` — `--surface=s0` is dead by construction |
| D2-6 | MINOR | `scripts/audit-sublanes.ts` — a per-parent check that cannot fail |

### `s0-first-look` — 3 (never swept by any pass, S0)

| id | severity | file |
|---|---|---|
| D2-7 | MAJOR | `scripts/lib/importGraph.ts` — 128 real `@/` edges silently dropped |
| D2-10 | MAJOR | `scripts/preflight-xcuitest-target.ts` — no floor on how many assertions ran |
| D2-9 | MINOR | `scripts/compare-ios-screenshots.mjs` — unwired, and fail-open once `tests/` goes |

### `off-surface` — 2 (changed and on no inventory at all)

| id | severity | file |
|---|---|---|
| D2-12 | BLOCKER | `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift` — a premium user told to buy premium |
| D2-11 | MINOR | `apps/rn/{modules/live-activity/ios,targets/widget}/PaydayLandedIntent.swift` — two copies synced by a comment |

⚠️ **What the split says.** Seven of twelve are inside the instruments, which is where the brief
predicted them. The one **blocker** is `off-surface` — a file on **no claims file at all**, reachable by
this route only because it changed. `[D69]` would exempt a finding on it *"for the WRONG reason — not
'nobody read it' but 'nothing records whether anyone did'"*, which is `audit-route.ts`'s own printed
warning about the 25 homeless files, arriving with a blocker in it.

---

# Method notes

- **40 of 40 manifest files read.** `READ-D2.txt` also lists 4 supporting files opened outside the
  manifest — `check-finding-guards.ts`, `check-cap-literals.ts`, and the two
  `PaydayActivityAttributes.swift` copies. All 44 paths are tracked (verified with
  `git ls-files --error-unmatch`).
- The five `surface-coverage.s*.json` files were consumed **programmatically in full** — every key and
  every distinct claim value enumerated, plus the head read — rather than scrolled. Stated so the claim
  is checkable rather than taken.
- **Plants executed: 17**, each with a control and a `cmp`-verified restore.
  `MAX_SERVER_ATTEMPTS` → 1 · registry drained to 9 · registry raised to 11 · three stale `audit-route`
  proofs re-run · two `package.json` proofs re-run · a manifest file dropped from a sub-lane copy · the
  D2 sub-lane catch-all narrowed · a duplicate sub-lane id · a `surface-coverage` routing to `s9` alone ·
  that routing plus a neutered call site · a `Surface` without `ready` · `SWIFT_FILES` emptied · a
  must-fail xcuitest assertion · a straight apostrophe in a Swift string · the `C3-7` divergence in one
  Swift copy · the ios-baseline comparator in four states.
- **No tracked file was left modified.** `scripts/finding-guards.json`,
  `docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md`, `package.json`, `tests/ios-baselines/` and
  every planted source file were verified with `cmp` against a copy taken **after** the edit, with
  `git status --porcelain` checked at each step.
- Probes and their runners are under `d2-probes/`.
