# Pass 4 — RESUME PROTOCOL (auditors A, C, D)

**Why this file exists.** The first dispatch of A, C and D died at **01:28–01:30** to **host memory
exhaustion**, not to any defect in the tree. Windows logged `Event 2004 — low virtual memory` at 01:09,
01:19 and 01:30. Three auditors were each running whole-monorepo `tsc --noEmit` and vitest concurrently on
a **6 GB** box. Auditor C's transcript records the terminal sequence verbatim:

```
npx tsc --noEmit -p scripts/tsconfig.json   →   Fatal process out of memory: Zone   (EXIT=3)
NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p scripts/tsconfig.json   →   EXIT=3
```

⛔ **Asking for 6 GB of heap on a 6 GB machine is what ended the run.** The retry was the kill, not the
diagnosis.

**Nothing was lost.** All three auditors wrote incrementally, as the brief required, so **11 findings
survive on disk**. Two auditors died with plants still applied (`A` → `apps/rn/src/storage/createAdapter.web.ts`,
`D` → `scripts/check-money-format.ts`); both were restored and the restore was **verified**, not assumed.
Main repo measured **0 bytes** off the pin `e65f9c7`.

---

## ⛔ HARD RULES ADDED FOR THE RESUME — these bind in addition to `BRIEF.md`

1. **`NODE_OPTIONS="--max-old-space-size=1536"` on every node/npm/npx invocation.** No exceptions.
2. ⛔ **An OOM is a FINDING, never a retry.** If a command dies with `Fatal process out of memory`,
   `JS heap out of memory`, or exit 3 — **do not re-run it with more memory.** Record it, scope the
   command down (a single `tsconfig`, a single test file, a single suite), and move on. If it cannot be
   scoped down, write it up in §5 as *measured and not reached* and say so plainly.
3. ⛔ **Never run a whole-monorepo typecheck.** `npm run typecheck` chains four projects. Run only the
   one project your claim needs, and prefer `--incremental false --pretty false`.
4. **Kill every server you start, in the same step that starts it.** The first dispatch left three `serve`
   processes listening on port **4319** — two of them from **Aug 8 and Aug 10**, weeks stale. Check the
   port is free before binding and free it when done.
5. **No sub-agents.** You are the only agent on your route.
6. **Keep writing incrementally.** It is the only reason the first dispatch cost analysis and not work.
7. **Stay in your own tree.** `A` → `C:/Users/Jason/audit-a-wt` · `C` → `C:/Users/Jason/audit-c-wt` ·
   `D` → `C:/Users/Jason/audit-d-clone` (D uses a **clone**, not a linked worktree — that is deliberate,
   see finding `D4-2`: `test:gate-plants` crashes in a linked worktree). All three are at `e65f9c7`
   with `node_modules` already installed. **Do not reinstall.**
8. **Verify every restore.** After un-planting, run `git status --porcelain` and confirm it is empty.
   A plant that is not verified-restored is a plant that shipped.

---

## What "resume" means

Your partial report already on disk is **yours** and its findings **stand** — do not re-derive them, do not
renumber them, do not delete them. Continue from where it stops.

⚠️ **But you may not credit coverage you cannot evidence.** The dead run left §4 *(swept and found clean)*
**empty**, so there is no record of what was actually read. By this audit's own standard — a sweep is
recorded against **bytes**, not against a path, and an unevidenced sweep is not a sweep — **re-sweep your
whole route.** Finding nothing new on a stretch is a cheap outcome to write down; assuming it was covered
is not.

**Fill every section**, not just §1: closure verdicts (§2), the origin tally (§3), swept-and-clean by path
(§4), measured-and-not-a-defect (§5), and not-reached by path (§6).

## Findings that already stand

| auditor | findings on disk | report |
|---|---|---|
| **A** | 2 (`A-F1`, `A-F2`) | `A-engine.md` |
| **C** | 7 (`C4-1` … `C4-7`) — 3 blockers, 4 majors | `C-screens.md` |
| **D** | 2 (`D4-1`, `D4-2`) | `D-instruments.md` |

Auditor **B** completed and is closed: 1 blocker, 2 majors, 2 minors. Its report is committed at `ee1f5052`
and is **not** to be re-run. If your route touches a `B` finding, cite it; do not re-audit it.
