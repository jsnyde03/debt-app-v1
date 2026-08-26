# S1 · MONEY — pass 1. **5 blockers · 10 majors.**

**Pinned:** `bc29dfe`, branch `v1.7-dev`. Four fresh auditors ([D68]), brief at [`BRIEF.md`](BRIEF.md).
**No auditor touched a source file** — `git status` showed only the five report files.

⛔ **THIS FILE IS THE MAP. THE FOUR `{A,B,C,D}-*.md` FILES ARE THE LEDGER.** A prior round's summary said
*"9 open"* where its auditor files held **14**, and the plan carried the wrong number for a day. Every row
below was counted from the report files.

---

## 🔴 BLOCKERS — 5

| # | finding | src |
|---|---|---|
| **B1** | **"Every balance is cleared" ships on Today AND Progress over debts the app could not read.** The whole app has exactly **two** trust guards and both are in `money.tsx`. Measured on one store: `unreadDebts = true` on Money *(S1.1's fix working)* while `selectPlanState = 'debt-free'` on Today renders *"You're debt-free. Every balance is cleared."* **One tab apart, the app both refuses and makes the claim.** Permanent — the repaired `0`s never change back | C-2 |
| **B2** | **Today's "Undo" reverts the WHOLE store** to a snapshot taken earlier in the session. Log a payment, then add a debt + a goal + a bill + change strategy, then Undo → **all four gone, and persisted.** `intentRollback` snapshots the entire `DebtStore` and nothing else ever clears it | C-3 |
| **B3** | **Two one-tap money moves share ONE `cycleTopUp` record with ONE `goalId`.** Measured both ways: **$70 teleports** from goal S1 into S2 permanently, or **$50 is created from nothing** when both undos fire | C-4 |
| **B4** | **Money's `converting` flag is set once and never cleared** (one `setConverting` call site). Tap "Move to Debts", back out, add any normal debt → **the expense is silently deleted**, and the new debt skips BNPL normalisation (a $200 BNPL stored as `$0`) | C-5 |
| **B5** | **Premium + a shortfall → "You're caught up for this paycheck."** in success green over unpaid bills, under a Guardian card saying the opposite. `index.tsx:506` empties `unfunded` when a recovery plan exists and `outstanding` is computed from the emptied array. **Free is the control and behaves correctly** | D-2 |

⚡ **B2 · B3 · B4 are ONE SHAPE** *(C's observation, and it is the most useful sentence in this round)*:
**a piece of state that is correct for the one flow it was written for, reused by a second flow that
arrived later.** None is a wrong calculation; each is a **scope that outlived its occasion.**

⚡ **B1 and B5 are also one shape:** a guard or a count that is right on the screen it was written for, and
absent on the screen that says the same thing. **B1 is S1.1's own blocker on the two screens nobody gave
the guard.**

---

## 🟠 MAJORS — 10

### The app

| # | finding | src |
|---|---|---|
| M1 | **An uncategorised recurring bill renders nowhere** — the grouped Expenses list *enumerates* the seven known categories instead of partitioning — **while still consuming $50/paycheck.** Hero reads *"$436 recommended"* over rows summing to $386. Search does not rescue it | C-1 |
| M2 | **An over-funded goal's row understates what the user saved** — *"$1,000 saved"* over $5,000 — one inch under a hero that totals it correctly | C-6 |
| M3 | **An applied top-up keeps lifting `discretionary` after the cycle goes short**, so the band is no longer `at-risk`: the *"$400 short"* sentence is suppressed while the card draws the good-standing shield and *"line held"* | D-1 |
| M4 | **`PlanHero`'s paycheck split stops conserving in a shortfall** — legend reads *"Required $1,400 · Spoken for $300"* under a **$1,000** headline | D-3 |

### The instruments

| # | finding | src |
|---|---|---|
| M5 | ⛔ **`test:gate-plants` is in NO CHAIN** — not `run-gates.ts`, not `validate:release:rn`, not CI. **The only thing in the tree asserting that any gate fails CLOSED never runs**, and it is `REVERIFY4-4`'s only behavioural guard. Unlike GAP-14's gate, no docstring says this is deliberate | B ③-1 |
| M6 | **`present()`'s word-boundary fix covers only identifier-shaped tokens.** Measured fail-open on the exact rename class the file records itself failing on: `function isClamp`→`isClampLegacy`, `export function selfCheck`→`selfCheckAll`, `cat-file`→`cat-file-batched` all pass green | B ③-2 |
| M7 | **6 of 18 registry tokens do not pin the assertion they name** — 5 survive on a comment line alone; `S1-M9-GUARDIAN`'s sits on the **precondition**, so deleting the finding's own line leaves the gate green | B ③-3 |
| M8 | **`MIN_ENTRIES = 24` against 34 entries — ten slack.** All six S1 guard entries plus four `REVERIFY4-*` can be deleted in one edit, gate green. Its sibling `MAX_EXEMPT` uses strict equality and does this correctly | B ③-4 |
| M9 | **The S1 surface under-counts by construction and over-counts on a typo.** Its roots are an **inclusion list**, which the file's own docstring says fails silent: `index.tsx` (**1,087 lines, imports 19 plan modules**) is off-surface, `store/` is **6 of 88**, `data/` **3 of 21**, `(tabs)/` **1 of 4**. Separately, **any claim value not exactly `never`/`unknown`/`partial` reads as SWEPT** | B ③-5 |
| M10 | **The secrets exemption is keyed per VALUE; the class is per AUDIT REPORT.** ⚡ **A's own draft carried four credential-shaped strings while `lint:secrets` printed green** — the gate is blind to untracked files by design — so `lint:rn` would have re-reddened on every committed tree the moment this round landed. **Both exits are refused by the instrument's own text** | A ⓪-5 |

---

## ⭐ JOB ① — S0's ONLY VERIFICATION, AND IT PASSED

**`REVERIFY4-1` … `-5` are all `CLOSED`.** S0 exited on *instruments-sound* with no fifth pass, so this was
the single chance to find its fixes come undone. They have not.

⚠️ **Two verdicts that are not major and must not read as clean:**
- **`REVERIFY4-2` is `CLOSED-UNPINNED`** — nothing would red if `lint:secrets` went back to reading the
  working tree. Its token `cat-file` also appears in a comment, so the gate counts it among *"18 guarded"*.
  **Folded into M7, not double-counted.**
- **`REVERIFY4-3`'s guard PRINTS, it does not RED.** The original 13-stale condition, restored, exits 0.
  That was the finding's chosen remedy; recorded so nobody carries away *"the stale class now reds."*

**Job ⓪ — S1.1's five: ⓪-1 ⓪-2 ⓪-3 ⓪-4 all `CLOSED`.** ⓪-5 is M10.

---

## ⛔ WHAT THIS PASS SAYS ABOUT WHERE WE POINTED

**14 of the S1 surface's 72 files had ever been examined. 5 blockers and 4 app-majors came out of the
other 58** — and the two prior money rounds, sweeping the swept 14, found none of them.
⚡ **S0.12a's result reproduced exactly on a second surface: the variable is not the tree, it is where the
auditor points.**

⚠️ **And the same measurement indicts this round's own targeting** (M9): the file the B5 blocker is *wired*
in was never on the surface list at all. **A hand-written root list is an inclusion list wearing a
directory's clothes.**

## [D69] — which of these restart the count

⛔ **Exempt from the count is NOT exempt from the fix** ([D65] — no deferrals). Applied mechanically from
[`S1-SURFACE-INVENTORY.md`](S1-SURFACE-INVENTORY.md), never from an auditor's judgement:

| finding | file's claim | counts? |
|---|---|---|
| **B1** | `planSelectors.ts` `never` · `progress.tsx` **off-surface** | first-look |
| **B2** | `store.ts` `partial` | first-look |
| **B3** | `store.ts` `partial` · `guardianSelectors.ts` `r17` | ⛔ **COUNTS** |
| **B4** | `money.tsx` `r10` | ⛔ **COUNTS** |
| **B5** | `RequiredActionsCard.tsx` `never` · `index.tsx` **off-surface** | first-look |
| **M1** | `money.tsx` `r10` | ⛔ **COUNTS** |
| **M2** | `money.tsx` `r10` | ⛔ **COUNTS** |
| **M3 · M4** | `PaydayGuardianCard` · `PlanHero` both `partial` | first-look |
| **M5–M9** | the four instruments, all `never` | first-look |
| **M10** | `check-committed-secrets.ts` — **fixed at S1.1, this range** | ⛔ **COUNTS** |

**5 findings count as churn; 10 are coverage.** ⚠️ **The churn five are the ones to read hardest** — three
of them are in `money.tsx`, a file two rounds have already swept.
