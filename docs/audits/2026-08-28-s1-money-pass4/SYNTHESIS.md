# S1 money pass 4 — SYNTHESIS

**All four routes closed.** Pin `e65f9c7`. Live repo measured **0 bytes** off it; every plant restored and
every restore verified in the step that made it.

| auditor | route | blocker | major | minor | total |
|---|---|---|---|---|---|
| **A** engine | 60 files | 2 | 3 | 0 | **5** |
| **B** store/storage | 45 files | 1 | 2 | 2 | **5** |
| **C** screens | 72 files | 4 | 6 | 1 | **11** |
| **D** instruments | 40 files | 1 | 8 | 4 | **13** |
| | **217** | **8** | **19** | **7** | **34** |

---

## ⛔ THE RESULT OF THIS ROUND IS NOT A DEFECT. IT IS THAT THE LEDGER CANNOT BE CASHED.

**`lint:finding-guards` exited 0 over every single un-fix auditor D performed.** It is a **deletion
detector** — it proves a token string still exists in a file — and it has been read for three passes as a
**closure proof**. Those are different claims, and only the first one is true.

⚡ **Eight registered guards were proven to survive their own un-fix**, by four auditors working
independently:

| guard | proof it does not hold |
|---|---|
| **`S1P3-B6`** | `DemoStageId = string` restores the defect exactly; `funnel.ts` untouched so the token survives. `check-finding-guards` **exit 0** *and* `tsc --noEmit` **exit 0** |
| **`S1P3-M7`** | defect restored verbatim → *"150 of 151 findings carry a standing guard"*. Registry says it guards the **ordering**; a substring on a line cannot |
| **`S1P3-D3-CAPS`** | caps reverted to `Object.keys(X).length`; ledger holds 2 against a cap of 1; gate green |
| **`S1P3-G-LIVENESSLEDGER`** | reverted to a derived sum; **14 sites accepted against a cap of 13**, and the green line prints `cap 14` |
| **`S1P3-G6-SCRIPTSREACH`** | token pins `include`; reach is `include` **minus `exclude`** — `tsc` exit 0, 0 errors |
| **`S1P2-B1-REASON`** | still guard-only **after the `D3-3` fix that was raised about exactly this** |
| **`S1P3-A2-INWINDOW`** | CLOSED for the helper, **GUARD-ONLY for the call** |
| **`S1P3-B3-MTIME`** | token pins **one of the finding's two directions** |

⛔ **`D4-6`, the round's structural blocker, is inside `test:gate-plants` itself** — the harness built to
prove the gates fail closed. Neutering pass-3 `D3-3`'s entire remedy is caught **only** by a `rightReason`
string compare. Compose `D4-1`'s one-clause un-fix and the harness prints **`reason=WRONG` next to a green
tick**, then announces **`✅ all 21 gates fail closed`, exit 0**, with `lint:finding-guards` green beside it.
Two lines of change, three registered guards in a chain, and the only load-bearing one is a token that
survives its own un-fix.

⚠️ **And 35 guard entries in lanes A, B and C were never tested by anyone** — not this round, not before.
The 8 proven-dead guards come from the ~46 that *were* tested.

**What this costs:** every `CLOSED` in every prior pass rests on this instrument. Until a guard is proven to
red, "fixed" and "unfixed" are indistinguishable in the record. **This is a measurement failure, and it
invalidates counts rather than adding to them.**

---

## The defect classes — fix by CLASS, never by id

Of the 34 findings, **13 are one defect wearing different names**: *the fix reached the instance that was
reported and left a sibling of the same class asserting on the same store.* Pass 3 fixed ids one at a time
and this round is the invoice. **Fixing these individually generates pass 5.**

### CLASS 1 — the fix reached the named instance; a sibling of the class was left standing

| finding | fixed | left |
|---|---|---|
| **`F-B4`** blocker | `G-1`/`G-2`/`G-3` on the `balance` member | whole-list / whole-row loss — *strictly more data lost* |
| **`C4-9`** blocker | `B1` for the all-unread portfolio | the **mixed** portfolio; guard sits inside `if (!view.hasDebts)` |
| **`C4-7`** blocker | `D3-2` on the Lock Screen and in Siri | **the Today card it was raised about** |
| **`A-F4`** blocker | `A1` aligned the two producers' *form* | their **phase** — one tests interest before accruing, one after |
| **`C4-11`** major | `C-7`/`C-7b` on two restore doors | **two more doors**; one can replace data just typed |
| **`C4-5`** major | `G-5` for the two-pot case | the one-pot case — offer *and* caption vanish silently |
| **`A-F5`** major | `B2` at both hand-entry paths | **guarded at only one** |
| **`F-B3`** major | — | `describeLosses` pools two producers; a whole list reads as *"1 whole row"* |
| `C-4` `C-6` `C-7b` `D3-2` `G-6` | the named instance | a sibling on the same store → **`PARTIAL`** |

**Remedy is not nine fixes.** For each: enumerate the class, fix every member, and add one assertion that
**iterates** the class instead of naming a member.

### CLASS 2 — a predicate with ONE SIDE ENUMERATED  ⭐ four auditors, independently

Class 1's mechanism. An enumeration is a list someone must remember to extend, and nobody does.

- **`F-B4`** — `hasUnreadDebtBalances` matches `r.field === 'balance'` exactly; `poisons()` in the **same
  file** handles the parenthesised whole-row fields. Two producers of one fact.
- **`C4-3`** — the liveness ledger enumerates one side of a two-sided predicate; **13 sites live on the other.**
- **`C4-10`** — the trust **completeness gate cannot fail**: one wildcard route (`debt:'any'`) marks every
  new repairable money field "routed" by construction.
- **`D4-3`** — `lint:trust-claims` counts `packages/core/**/testX.ts` (40+ files) as production consumers.
- **`D4-9`** — `lint:scan-floors` misses a double-quoted import and anything in `scripts/lib/`.

⛔ **`C4-10` and `D4-6` are load-bearing** — they are the instruments built to *prevent* Class 1, and neither
can fail. Fix them **first**, or the class-iterating assertions Class 1 needs get written against a gate
that rubber-stamps.

### CLASS 3 — the docblock states a mechanism the code does not have

- **`A-F3`** blocker — `bnplInstallmentsInWindow` accepts `windowStartISO` and **never reads it**. Measured
  **$1,200 required against a true $300**; `applyRolloverPayment` then zeroes the balance in one cycle.
- **`A-F2`** — `sanitizeAmountInput` does not keep "only the first point"; the one test row is the single
  member of the class where the regex happens to work.
- **`A-F1`** — `buildCycleSnapshot`'s window is **optional**; dropping it at the only shipping caller is
  silent across all three suites.
- **`F-B1`** — the iOS provider's docblock states a mechanism the code lacks.

### CLASS 4 — a gate that reports success while doing less than it says

`D4-5` (`lint:ci-chain` passes `if: false` and `continue-on-error: true`) · `D4-8` (the claim-site ledger
cannot tell a mention from a use, and prints *"every money surface asks the guard"* over `D3-1` restored) ·
`C4-4` (`MAX_OPEN = 0` is real but the ledger regrows silently) · `D4-2` (`test:gate-plants` crashes in a
linked worktree — the environment the protocol mandates).

### CLASS 5 — one-off

`C4-1` blocker · `C4-2` blocker (trophy shelf files a debt owed in full as *"$12,000 paid off"* and offers
it for sharing) · `C4-6` major (race) · `C4-8` minor.

---

## ⛔ The dispatch was half-blind — THREE independent proofs

**`audit-route.ts` routes files CHANGED since the pin.** A two-producer disagreement is **half-routed by
construction**: the fix touches one producer, the route sees one producer, and the disagreement is only
visible from the side that moved.

- **A** — `A-F4` is `projectDebtPayoff.ts` (changed → routed) vs `buildPayoffTrajectory.ts` (**unchanged →
  routed to nobody**).
- **C** — a **fifth origin bucket**, `unrouted`: two findings including a blocker sit in files in **no row**
  of `ROUTING-ORIGINS.tsv`. `(tabs)/progress.tsx` and `(tabs)/index.tsx` — the two primary money screens —
  are unrouted **because they did not change**. **3 of C's 4 blockers are a stale claim on an unchanged
  screen beside a changed producer.**
- **D** — `D4-7`: `audit-route.ts` emits `first-look` for S1 and **never S0**. **49 never-swept S0 files sit
  in no lane at all.**

⚡ **This is Class 2 one level up.** The route is an enumeration of changed paths; the defect lives on the
side that did not change. **Pass 5 must route the CONSUMERS of every changed producer, and S0.**

---

## The origin measurement held for a fifth round — and survived its own control

| auditor | route split | where findings came from |
|---|---|---|
| **A** | 45 first-look · 14 fix-churn · 1 off-surface | **4 of 5 from the 14**; all 45 first-look files swept and **evidenced clean by path** |
| **B** | — | 4 fix-churn · 1 off-surface · **0 first-look** |
| **C** | — | 5 fix-churn · 2 instrument · 2 first-look · **2 unrouted** |
| **D** | 33 instrument · 7 off-surface | 12 instrument · 1 off-surface |

⚠️ **Two honest caveats.** D's `first-look`/`fix-churn` zeros are **not results** — neither bucket has a file
on route D. And the brief starred `fix-churn`, so attention was not uniform; the control is A, which swept
its 45 first-look files anyway and evidenced them clean. **The signal survives.**

---

## Corrections to the record

- **Auditor C's `tsc` exit 3 was host contention, not the project.** D measured `typecheck:scripts` clean at
  1536 MB. C's OOM belongs to the 6 GB crash, not to `scripts/tsconfig.json`.
- **`m3` (currency) is agreed out of scope, now measured twice.** C and D independently confirmed all four
  launch storefronts (`$`/`CA$`/`A$`/`NZ$`) render correctly; every wrong row in pass 3's table is a
  storefront 2.0 does not sell in. Residual: nothing in the tree enforces the availability list.
- **`MAX_OPEN = 0` is real and cannot regrow** (D), *and* the claim-site ledger it governs regrows silently
  (`C4-4`). Both are true — different objects.

---

## What pass 5 gets for free

- `apps/rn/dist` is **byte-current for the pin** → `npx serve -l 4319 -s` runs the e2e specs with **no
  `expo export` rebuild**. C named the six Playwright-pinned guards it could not un-fix without one.
- `store/guardianSubjects.test.ts` — 120 lines, 8 assertions, lowest density on B's route.
- Heap capped at **1536 MB** and **"an OOM is a finding, never a retry"** cost nothing and prevented a repeat
  of the 01:30 death. Keep both permanently.
