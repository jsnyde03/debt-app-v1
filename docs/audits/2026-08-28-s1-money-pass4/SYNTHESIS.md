# S1 money pass 4 — SYNTHESIS

**Status: A, B, C closed. D still running — its findings are NOT yet folded in.**
Pin `e65f9c7`. Live repo measured **0 bytes** off it; every plant restored and every restore verified.

| auditor | route | blocker | major | minor | total |
|---|---|---|---|---|---|
| **A** engine | 60 files | 2 | 3 | 0 | **5** |
| **B** store/storage | 45 files | 1 | 2 | 2 | **5** |
| **C** screens | 72 files | 4 | 6 | 1 | **11** |
| **D** instruments | 40 files | — | — | — | *running* |
| | | **7** | **11** | **3** | **21** |

---

## ⚡ The round's real result is not the count — it is that FOUR routes found ONE shape

⛔ **Fix by CLASS, not by id.** Pass 3 fixed ids one at a time and this round is the bill for it: of the 21
findings, **12 are the same defect wearing a different name** — *the fix reached the instance that was
reported and left a sibling of the same class asserting on the same store.* Fixing these one at a time
generates pass 5.

### CLASS 1 — the fix reached the named instance; a sibling of the class was left standing

The dominant class. **Every member was raised, fixed, and verified in a prior pass.**

| finding | what was fixed | what was left |
|---|---|---|
| **`F-B4`** blocker | `G-1`/`G-2`/`G-3` on the `balance` member | whole-list and whole-row loss — *strictly more data lost* |
| **`C4-9`** blocker | `B1` for the all-unread portfolio | the **mixed** portfolio; guard sits inside `if (!view.hasDebts)` |
| **`C4-7`** blocker | `D3-2` on the Lock Screen and in Siri | **the Today card it was raised about** |
| **`C4-11`** major | `C-7`/`C-7b` on two restore doors | **two more doors** exist; one can replace data just typed |
| **`C4-5`** major | `G-5` for the two-pot case | the one-pot case — offer *and* caption vanish silently |
| **`A-F5`** major | `B2` at both hand-entry paths | **guarded at only one**; the other deletes clean |
| **`A-F4`** blocker | `A1` aligned the two producers' *form* | their **phase** — one tests interest before accruing, one after |
| **`F-B3`** major | — | `describeLosses` pools two producers; a whole list reads as *"1 whole row"* |
| `C-4` `C-6` `C-7b` `D3-2` | the named instance | a sibling on the same store → all **`PARTIAL`** |

⚠️ **The remedy is not eight fixes.** It is: for each, enumerate the class first, fix every member, and add
one assertion that iterates the class rather than naming a member.

### CLASS 2 — a predicate with ONE SIDE ENUMERATED

⭐ **Three auditors on three routes found this independently.** It is Class 1's mechanism: an enumeration
is a list someone must remember to extend, and nobody does.

- **`F-B4`** — `hasUnreadDebtBalances` matches `r.field === 'balance'` **exactly**, while `poisons()` in the
  *same file* handles the parenthesised whole-row fields. Two producers of one fact.
- **`C4-3`** — the liveness ledger enumerates one side of a two-sided predicate; **13 sites live on the other.**
- **`C4-10`** — the trust **completeness gate cannot fail**: one wildcard route (`debt:'any'`) marks every new
  repairable money field "routed" by construction. Four new fields, none routed by name, suite still green.

⛔ **`C4-10` is the load-bearing one** — it is the instrument built to *prevent* Class 1, and it cannot fail.
Fix it first or the class-iterating assertions Class 1 needs will be written against a gate that rubber-stamps.

### CLASS 3 — the guard exists and does not hold (`GUARD-ONLY`)

A guard that survives its own un-fix means the next round cannot tell fixed from unfixed either. **This is a
measurement failure, not a defect count** — it is what makes every other number in the audit untrustworthy.

| id | proof |
|---|---|
| **`S1P3-B6`** | defect restored verbatim → `check-finding-guards` **exit 0** *and* `tsc --noEmit` **exit 0** |
| **`S1P3-M7`** | defect restored verbatim → *"150 of 151 findings carry a standing guard"*. Registry claims it guards the **ordering**; a substring on a line cannot. |
| **`S1P2-B1-REASON`** | still guard-only **after the `D3-3` fix that was raised about exactly this** |
| **`S1P3-A2-INWINDOW`** | CLOSED for the helper, **GUARD-ONLY for the call** |
| **`C4-4`** | `MAX_OPEN = 0` is real, but the claim-site ledger **regrows silently** and the green line says otherwise |
| **`F-B2`** | `S1P3-B3-MTIME`'s token pins **one of the finding's two directions** |

### CLASS 4 — the docblock states a mechanism the code does not have

Carried premises, not measurements. Both were believed by a prior pass.

- **`A-F2`** — `sanitizeAmountInput` does **not** keep "only the first point"; the single test row is the one
  member of the class where the regex happens to work.
- **`F-B1`** — the iOS provider's docblock states a mechanism the code lacks.
- **`A-F1`** — `buildCycleSnapshot`'s window is an **optional** parameter; dropping it at the only shipping
  caller is silent across all three suites.
- **`A-F3`** blocker — `bnplInstallmentsInWindow` accepts `windowStartISO` and **never reads it**.
  Measured **$1,200 required against a true $300**; `applyRolloverPayment` then zeroes the balance.

### CLASS 5 — one-off

`C4-1` blocker (installment count stated from a field recorded unreadable) · `C4-2` blocker (trophy shelf
files a debt owed in full as *"$12,000 paid off"* and offers it for sharing) · `C4-6` major (race: confirm
renders byte-identical to the un-fixed state while the pre-read is in flight) · `C4-8` minor (*"across 1 cycles"*).

---

## ⛔ The dispatch was half-blind, and two auditors proved it independently

**`audit-route.ts` routes files CHANGED since the pin.** A two-producer disagreement is therefore
**half-routed by construction**: the fix touches one producer, the route sees one producer, and the
disagreement is only visible from the side that moved.

- **A** — `A-F4` is `projectDebtPayoff.ts` (changed → routed) vs `buildPayoffTrajectory.ts`
  (**unchanged → routed to nobody**).
- **C** — a **fifth origin bucket** surfaced: `unrouted`. Two findings including a blocker sit in files in
  **no row** of `ROUTING-ORIGINS.tsv`. `(tabs)/progress.tsx` and `(tabs)/index.tsx` — **the two primary money
  screens** — are unrouted because they did not change. **3 of C's 4 blockers are a stale claim on an
  unchanged screen beside a changed producer.**

⚡ **This is the same shape as Class 2, one level up.** The route is an enumeration of changed paths; the
defect lives on the side that did not change. **Pass 5 must route the CONSUMERS of every changed producer,
not only the changed files.**

---

## The origin measurement held for a fifth consecutive round

| auditor | route split | where the findings came from |
|---|---|---|
| **A** | 45 first-look · 14 fix-churn · 1 off-surface | **4 of 5 from the 14** — 45 first-look files produced nothing, swept and evidenced in §4 |
| **B** | — | **4 fix-churn · 1 off-surface · 0 first-look** |
| **C** | — | 5 fix-churn · 2 instrument · 2 first-look · **2 unrouted** |

⚠️ **The confound is now answered.** The brief starred `fix-churn`, so attention was not uniform — but A
swept all 45 of its first-look files and **evidenced them clean by path**. The signal survives its own
control.

---

## What pass 5 gets for free

- `apps/rn/dist` is **byte-current for the pin** → `npx serve -l 4319 -s` runs the e2e specs with no
  `expo export` rebuild. C named the six Playwright-pinned guards it could not un-fix without one.
- `store/guardianSubjects.test.ts` — 120 lines, 8 assertions, lowest density on B's route.
- Heap capped at 1536 MB and "an OOM is a finding, not a retry" cost nothing and prevented a repeat of the
  01:30 death. Keep both.
