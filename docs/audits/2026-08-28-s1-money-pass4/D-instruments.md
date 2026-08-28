# S1 pass 4 — auditor D — THE INSTRUMENTS

**Pin:** `e65f9c7` · **route:** `ROUTING-D.txt`, 40 files / 10,629 lines — all of `scripts/`
plus the repo-root config no surface owns.

**Isolation.** Every plant in this report was run in an isolated detached worktree at the pin,
`C:\Users\Jason\audit-d-wt` (`git worktree add --detach … e65f9c7`), with `node_modules` and
`apps/rn/node_modules` junctioned from the main checkout. **No source file in
`C:\Users\Jason\debt-app-v1` was edited, committed or pushed.** The closing
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` check is recorded at
the end of this file.

> Status: IN PROGRESS — written incrementally.

---

## 1. Findings

### D4-1 — `major` · `S1P2-B1-REASON` is STILL guard-only after the D3-3 fix that was raised about it

**Origin:** `instrument` (`scripts/test-gate-plants.ts`, `scripts/check-finding-guards.ts`).
**User-facing consequence:** the one instrument in the tree that proves a gate fails *closed* can be
silently reverted to scoring a gate green when it reds for the wrong reason — so the next
green `test:gate-plants` line stops meaning what it says, and a blind money gate ships behind it.

**What pass 3's `D3-3` said:** `S1P2-B1-REASON` named the line that *computes* the check
(`const rightReason = …`) rather than the line that *uses* it, so the entry was green with B-1's own
defect restored. The fixing session re-pointed the token and added a declaration-vs-use check.

**Where it landed.** `scripts/finding-guards.json` → `S1P2-B1-REASON.token` is now
`"if (!ok) failures++;"` — `scripts/test-gate-plants.ts:555`. The line that actually *uses*
`rightReason` is line 554:

```ts
const rightReason = !s.expect || withPlant.out.includes(s.expect);          // 553  computes
const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0 && rightReason;  // 554  USES
if (!ok) failures++;                                                        // 555  the token
```

**The measurement (plant, in the clone at the pin).** Deleted `&& rightReason` from line 554 —
B-1's defect verbatim — and left everything else alone:

```
grep -n 'PLANT B-1' scripts/test-gate-plants.ts
  554:    const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0; // PLANT B-1 un-fix
npm run lint:finding-guards   →  rc=0
  ✅ finding-guards: 150 of 151 findings carry a standing guard
npx tsc --noEmit -p scripts/tsconfig.json  →  rc=0   (the now-unused local does not red typecheck)
npm run test:gate-plants                   →  no scenario attributable to the un-fix redded
```

⛔ **The token survived its own un-fix.** The re-point moved the token one line *further away* from
the use, not onto it.

**Why the new D3-3 check cannot see it, and this is the interesting half.**
`check-finding-guards.ts:208-224` only fires when the token's line matches
`/^\s*(?:export\s+)?(?:const|let|var|(?:async\s+)?function)\s+([A-Za-z_$][\w$]*)/`. Line 555 is an
`if`, so the check never runs. And the *correct* target — line 554 — **is itself a `const`
declaration whose name `ok` is used on line 555**, so pointing the token there would make the D3-3
check red the entry. ⚡ **The D3-3 remedy made the right line untargetable and the entry was moved to
a wrong one that the remedy is structurally blind to.** That is reading rule 8 (observation, premise
and remedy fail independently) and rule 13 (correcting the losing copy buys the next recurrence).

**Remedy, as a hypothesis (not verified):** point the token at the *expression*, not the line —
`"&& rightReason"`. `present()` gives it a trailing word boundary and no leading one, so it reds on
the un-fix. Separately, the D3-3 check is narrower than its own class: extend it beyond
declaration-shaped token lines, e.g. red when the token line contains no identifier that any *other*
code line defines (an "is this line downstream of the thing being guarded" test), or require that
tokens for a boolean-composition fix name the operand.

---

### D4-2 — `minor` · `test:gate-plants` crashes in a linked git worktree, which is the environment the audit protocol mandates

**Origin:** `instrument` (`scripts/test-gate-plants.ts:535`).
**Consequence:** not user-facing. The harness dies with an uncaught `ENOENT` and 10 of its 21
scenarios never run; the failure is loud, so nothing goes green while doing less.

`const tmpIndex = …; copyFileSync(join(REPO_ROOT, '.git', 'index'), tmpIndex)` assumes `.git` is a
directory. In a linked worktree `.git` is a **file** holding `gitdir: …`.

**The measurement.** In `C:\Users\Jason\audit-d-wt` (worktree at the pin):

```
npm run test:gate-plants  → 11 scenarios green, then
Error: ENOENT: no such file or directory, copyfile 'C:\Users\Jason\audit-d-wt\.git\index' -> …
    at test-gate-plants.ts:535
```

The same command in a full clone at the same pin runs all 21 green. ⚠️ The brief tells every auditor
to plant "in an isolated git worktree at the pin"; in that environment this harness cannot run, and
the crash reads as a broken harness rather than as "these 10 gates are unverified here".

**Remedy hypothesis:** resolve the index path from git —
`execFileSync('git', ['rev-parse', '--git-path', 'index'])` — instead of `join(REPO_ROOT, '.git', 'index')`.

---

---

## 2. Closure verdicts

_(appended as confirmed)_

---

## 3. Findings tally by origin

_(at the end)_

---

## 4. Swept and found clean — BY PATH

_(at the end)_

---

## 5. Measured, and NOT a defect

_(at the end)_

---

## 6. Not reached — BY PATH

_(at the end)_
