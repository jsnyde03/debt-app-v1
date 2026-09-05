# Round-2 working notes (incremental)

Base 24a444cc -> HEAD 68c348f9. Diff touches 9 files:
- apps/rn/src/store/debtFreeBand.test.ts        (+17/-2)  pin nextPaycheckDate
- apps/rn/src/store/guardianSelectors.ts        (+26)     selectBnplBetweenPaycheck widened
- apps/rn/src/store/inWindowMinimum.test.ts     (+46)     biweekly projection + control
- apps/rn/src/store/planSelectors.ts            (+32)     effectiveMinimumInWindow
- apps/rn/src/store/recoverySelectors.ts        (+23)     effectiveMinimumInWindow
- packages/core/debt/deriveRequiredActionView.ts(-13)     removal
- packages/core/testing/testCadenceIdentity.ts  (+86)     chargesInWindow oracle + row assert
- scripts/check-finding-guards.ts               (+2/-2)
- scripts/finding-guards.json                   (+242)    10 new entries

Commits: e7f2fe79 f7c53d3b bf7274da 8e670844 86bf6536 68c348f9

## Clock walk (probe: clockwalk.ts)
⛔ FIRST HARNESS WAS BROKEN: `import(mod?cw=N)` does NOT bust the module cache under tsx.
It reported 0 RED / 365 days on the PRE-FIX file the fixer measured red on 288 of 365.
Found by running the control on the verifier. Rewritten to copy the module per day.

Control (pre-fix inWindowMinimum.test.ts, 60d from 2026-09-05): 48 RED (80%) — matches 288/365.
  cycle-1 essentials measured at $150/$100/$50/$0 vs expected $200. F2 was REAL.

Current files:
  inWindowMinimum.test.ts   400 days  0 RED  -> F2 closed, date-stable
  debtFreeBand.test.ts      800 days  0 RED  -> both ends pinned, holds
  celebrationSelectors.test.ts 1200 days 0 RED -> has the SAME shape (currentDate pinned
    '2026-09-01', nextPaycheckDate from createDefaultStore = clock) but no assertion reads
    the window. Measured, NOT a defect.
  Sweep: only 5 test files pin currentDate without nextPaycheckDate; 4 of them take
    currentDate FROM createDefaultStore (both ends clock-derived -> window constant).

## Guard registry (10 new entries, all named for CLASS-4 ORIGINALS, none for F1-F8)
S1-CLASS4-{A2-1,A2-2,A2-3,A2-4,A2-8,A3-1,A3-2,A3-4,A3-12,A3-14}
- NONE of the three PRODUCTION files round 1 changed (planSelectors/recoverySelectors/
  guardianSelectors) appears in ANY class-4 registry entry.
- token vs expect mismatch candidates:
  A3-2  token '- the allocation resolves'   expect 'reserves'      (different assertion)
  A2-4  file testPayCycleHistoryRegression  proof runs test:app / inWindowMinimum (different FILE)
  A3-12 expect 'debt matrix' matches all THREE debt-matrix assertions
  A3-4  expect 'projected cycle' matches the weekly rows AND the control
- prove:guards WRITES to finding-guards.json by default; --no-record for a read-only run.
- ⛔ `git checkout -- scripts/finding-guards.json` is safe here after all: core.autocrlf=true,
  the clean worktree form is all-CRLF 388531 bytes. Writing the HEAD BLOB (LF, 384580) makes it dirty.

## lint:finding-guards is RED AT HEAD (baseline)
"9 executed proof(s) were measured against a tree their target has since left, ceiling is 8"
Two of the nine are S1-CLASS4-A2-3 and S1-CLASS4-A2-8, stale because
packages/core/debt/deriveRequiredActionView.ts moved since 86bf6536 -- moved by round 1's OWN
commit bf7274da (F8, a comment-only deletion). f7c53d3b re-recorded five others and not these two.
⚠️ my first lint:rn baseline was piped to `tail`, so its exit code was tail's. Re-running.

## planSelectors.test.ts asserts NO amount (grep 'amount' -> only paycheck.amount)
and its fixture is recurrence:'monthly' -> effectiveMinimumInWindow == minimumPayment, so F3's
fix is a NO-OP on the only fixture that exercises the line. Plant pending.

## ⛔ SELF-INFLICTED: 3 of the 4 lint:rn reds are MY OWN scaffolding
lint:local-dates  <- apps/rn/src/testing/__clockwalk.ts:15 `new Date().toISOString().slice(0,10)`
lint:s0-coverage  <- apps/rn/src/testing/__clockwalk.ts UNCLASSIFIED
lint:s1-coverage  <- apps/rn/src/store/__prefix_inWindowMinimum.test.ts UNCLASSIFIED
lint:finding-guards <- GENUINE baseline red (stale proof shas; nothing to do with my files),
  corroborated independently by test:gate-plants: "control=exit 1 ... the gate reds
  regardless of the plant" on all THREE of its finding-guards plants [D3-3][M7][M6].
Putting a probe inside the linted tree IS the defect the repo gates for. Remove before finishing
and re-run lint:finding-guards clean.
