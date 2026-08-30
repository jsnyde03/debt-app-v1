# S1 · money · PASS 5 — SYNTHESIS

**Pin:** `e65f9c7` → **target tree `65566a09`**. **Route:** 393 files, 4 lanes, 0 unrouted.
**Four fresh agents, in parallel, no sub-agents.** Dispatch recorded verbatim in [`DISPATCH.md`](DISPATCH.md).

## The count

| lane | blocker | major | minor | total |
|---|---|---|---|---|
| **A** — the money engine | 2 | 3 | 2 | **7** |
| **B** — store · storage · formatting | 3 | 2 | 7 | **12** |
| **C** — the screens | 4 | 0 | 2 | **6** |
| **D** — the instruments | 0 | 10 | 4 | **14** |
| | **9** | **15** | **15** | **39** |

⛔ **Pass 4 found 34. Pass 5 found 39.** [D65] exits on 0/0 **twice consecutively**; pass 5 is not
0/0, so **pass 6 is owed and pass 5 is the next first-candidate.** No convergence claim is available.

### Split by ORIGIN — and this is the round's headline

| origin | blocker | major | minor | total | [D69] |
|---|---|---|---|---|---|
| **neighbour** | 4 | 3 | 6 | **13** | ✅ COUNT |
| **fix-churn** | 3 | 1 | 2 | **6** | ✅ COUNT |
| **instrument** | 0 | 10 | 4 | **14** | ✅ COUNT |
| **off-surface** | 1 | 1 | 1 | **3** | ⛔ exempt — *and for the bad reason: no claims file exists* |
| **first-look** | 0 | 0 | 0 | **0** | ⛔ exempt |
| **s0-first-look** | 0 | 0 | 2 | **2** | ⛔ exempt |

⚡ **The re-route paid on its first use.** `S1.11.6` added `neighbour` because a two-producer
disagreement was half-routed by construction. **`neighbour` is now the largest bucket and carries 4 of
the 9 blockers** — and every one of lane A's seven findings is `neighbour`. Every one of C's `neighbour`
blockers is literally *"the fix corrected one producer and nothing put the other in front of a reader."*

⛔ **`first-look` produced ZERO findings and that is not a clean bill.** B: *"15 of my 18 `first-look`
files are `*.test.ts` and I read only two."* The reservoir was not read, so it did not report. **The
zeros mean "not found", not "clean"** — every lane said so unprompted.

⚠️ **34 of 39 findings COUNT.** The exemptions are 3 `off-surface` + 2 `s0-first-look`, and the
`off-surface` three are exempt because **no inventory exists to say whether anyone read them** — the
`S1.10.6.10` hole, now on its second round.

---

## ⛔ THE ROUND'S CENTRAL RESULT — the proof ledger records nothing and cannot pass

`S1.11.3` closed with *"the guard ledger is evidence now"* — `prove:guards` executes a finding's own
defect and requires the named command to red for the named reason. **Lane D executed it, which nobody
had done, and:**

- **D5-1** — **66 of 66 registry proofs read `(never run)`.** `measured`/`sha` are written only by
  `--record`, which **is invoked by nothing**, and read only by `--list`. `prove:guards --all` is in **no
  chain.** So `MAX_UNPROVEN` drains as JSON is **authored**, not as proofs are **executed**.
- **D5-4** — of the **51 proofs D executed, the first time any of them has ever run**, 48 held and
  **3 red for the WRONG reason** — a pass-4 assertion now sits upstream of each. ⛔ **`prove:guards --all`
  cannot pass at this commit.** The drain path for the 119-entry backlog is **broken and green at the
  same time.**
- **D5-5** — `verdict()`'s `wrong-reason` check is **vacuous for 26 of the 50 checkable proofs**: the
  `expect` string is already present in the fully **green** output, because the suites print `✓ <label>`.
  Demonstrated by planting an unrelated defect carrying another finding's `expect` — the harness printed
  **`✅ … reason=MATCHED`** and *"1 guard(s) red on their own defect."*

⚡ **This is why the instruments are fixed first and the money blockers wait behind them** — the same
call `S1.11` made, and it is stronger this round. **Every closure proof written for a money blocker below
would land in a ledger that does not execute it.**

⛔ **And D5-10 corrupts in the direction that makes convergence EASIER.** A **rejected**
`lint:s1-coverage` (exit 1) still rewrites the inventory; `audit-route --check` then routes from the
rewritten file at **exit 0**, upgrading a swept file to `first-look` — which under [D69] is **exempt from
the convergence count.** A protocol that can quietly promote its own exemptions is not a protocol.

---

## The fix classes — ordered, and the order is the argument

⛔ **One assertion per class that ITERATES the class, never one that names a member.** Fixing ids one at
a time is what produced pass 4's round, and then pass 5's.

### CLASS I — the proof machinery does not execute *(fix FIRST; every other closure's proof depends on it)*
`D5-1` `D5-4` `D5-3` `D5-2` `D5-11`

The ledger cannot be cashed. Until `prove:guards --all` executes, sits in a chain, records what it ran,
and can pass, **`CLOSED` and `OPEN` remain indistinguishable in the record** — the exact sentence pass 4
closed on, still true one round later.

### CLASS II — route & coverage integrity *(fix SECOND; it decides what pass 6 can see)*
`D5-10` `D5-8` `D5-6`

`D5-8`: `neighbour` is seeded by **`changed` alone**, so **72 files adjacent to never-swept files reach no
lane** — `A-F4`'s blindness survives on the `first-look` axis. `D5-6`: a fully green `lint:rn` leaves the
tree dirty (CRLF→LF rewrites of committed inventories) where **`git status` says `M` and `git diff` says
nothing**, and CI can never see it.

### CLASS III — a check that cannot fail *(the class that let everything below through)*
`A5-2` `A5-3` `A5-6` `A5-7` `B5-1` `B5-3` `D5-5` `D5-7`

⛔ **Found by planting in every case; found by reading in none.** `A5-2` is the sharpest: the
`Number.isFinite` guard **whose existence justified collapsing seven local formatters** survives its own
un-fix across all four gates that run, and renders `$NaN` / `$∞` when removed.

### CLASS IV — a population that is an enumeration, and nothing flags a non-member
`D5-13` `D5-9` `D5-12` `B5-7` `B5-12` `B5-8` `C5-1` `C5-5`

⚡ **D's own prescription, adopted:** *"the checkable form is the inversion `audit-route.ts` already uses —
enumerate what is ACCOUNTED FOR and refuse the remainder. One pattern, three sites, cheaper to state once
than to re-derive per gate."* ⛔ **An enumeration of spellings has now failed in this repo seven times.**

### CLASS V — CADENCE: a user-variable period replaced by a constant *(the biggest money class)*
`A5-1` `A5-5` `C5-4`

**Found from three ends by two lanes that could not see each other.** A monthly-paid user is shown a
debt-free date of **July 2026** over a chart that agrees while the rollover does not clear until
**January 2027** (`A5-1`); their $200 "Every paycheck" bill is charged **three times ($600)** and the app
declares a **$100 shortfall over $250 of spare cash** (`A5-5`); and a **$600 annual** payment prints
**"$600/mo"** (`C5-4`). ⛔ **`C5-4` cannot be fixed alone** — C measured that fixing the label makes Money
disagree with the required-actions list beside it. **A's proposed shape is the fix: one identity over
7 × 4 cadence pairs, which would have found `A5-1` and `A5-5` without either being named.**

### CLASS VI — two producers of one number, and only one was corrected
`C5-2` `C5-3` `A5-4`

`C5-2`: the Home Screen widget and Siri say **"$9,000 remaining"**; the app says **$11,513**. One store,
one instant, **$2,513** apart — and it is the figure a user meets **without opening the app.**
⛔ **`C5-2`'s own remedy was planted and left the whole suite GREEN**, and C warns it must not project
`live`/`cleared` or a premium estimate reaching `$0` puts **"Debt-free"** on the Home Screen before the
user confirmed anything. **The remedy is a hazard, not an instruction.**

### CLASS VII — id & record lifecycle (data loss)
`B5-9` `B5-2`

`B5-9`: delete a debt and add another **in the same pay cycle** and the dead id is re-issued — the
rollover ends at **$10,967.54** instead of **$11,467.54**, and four more records follow the id. ⛔
`storeActions.test.ts` contains **zero** `removeDebt` occurrences and every `debtIds` fixture is
contiguous; **a gap is the only shape that collides and no fixture has one.**

### CLASS VIII — copy, formatting and stale premises *(minors)*
`B5-4` `B5-5` `B5-6` `B5-10` `B5-11` `B5-13` `C5-6` `D5-14`

---

## ⛔ PASS 5 IS A PARTIAL SWEEP, AND THE CLASSIFICATION MUST SAY SO

Every lane named its own gaps unprompted. **This is not a complete reading of the route**, and
`s1p5` is claimed only where a lane evidenced a sweep:

| lane | what was NOT reached |
|---|---|
| **A** | ⛔ **ZERO Playwright specs run** — all **14 e2e + 9 `.shot.ts`** files, `first-look`/`s0-first-look`, read but **never planted against.** *"The largest hole in my pass, and exactly where reading is weakest."* |
| **B** | ~**50 of 113** files opened. `migrationAudit/cutoverFiles.test.ts` and `interruption.test.ts` **remain never-swept by any pass.** ~26 of 30 `*.test.ts` unread |
| **C** | **12 money-bearing files** not read line by line — ⚠️ **`PaydayGuardianCard.tsx` (712 lines, `fix-churn`, the subject of pass-4 `C4-5`/`C4-7`)** is the one to send the next reader to first |
| **D** | **15 of 66 proofs not executed** (11 playwright, 2 typecheck, 2 gate-plants) · 9 `s0-first-look` scripts unread · **`lint:rn` never run end to end** |

⚠️ **One registered proof's command is forbidden by this round's own resource rules** —
`S1P4-A-F1-WINDOWREQUIRED` is `run: typecheck`, a whole-monorepo typecheck. Two live rules in direct
conflict; resolved in CLASS I.

## Hypotheses formed and NOT measured — recorded so they are not re-derived

- **B:** `MemoryStorageAdapter` (`storage/adapter.ts:28-38`) stores the object **by reference**, so every
  persistence test in lane B round-trips an object that was **never serialised**, while production goes
  through `JSON.stringify`/`JSON.parse`. Hypothesised to hide a class — `undefined` dropped, `NaN`/`Infinity`
  → `null`, `-0` → `0`. **Not measured.** B: *"the first thing I would do with more time."*
- **A:** cycle 0's BNPL scaling (`buildMultiCycleTimeline.ts:137`) is a separate call from `A5-6`'s and was
  not planted. `A5-6`'s coverage claim covers `:197` only.
- **A:** plant `P8` (`plural`'s `n === 1` → `n === 0`) survived, but its guard runs under
  `test:e2e:trust-claims`, which A did not run. ⛔ **Recorded as unmeasured, NOT as a finding.**

## Process notes earned this round *(folded into `RESUME-PROTOCOL.md` in the same step)*

1. ⛔ A fresh worktree needs **`mklink /J apps\rn\core packages\core`** before `tsx` resolves `@core/*`.
   The junction is gitignored, so **a fresh worktree cannot run `test:app` at all**; the failure reads as
   `Cannot find module '@core/debt/bnplInstallment'`.
2. ⛔ **Detach every junction with `rmdir` BEFORE `git worktree remove`** — a recursive delete follows a
   junction and would take the main checkout's `node_modules` with it.
3. **MSYS rewrites a leading `//`** and turned one plant into a fake syntax red.
4. **A tool timeout killed a batch runner *between* mutate and restore**, so one plant's red was actually
   the previous plant's. Both re-ran clean — but a batch plant runner must restore in a `trap`, not a
   trailing line.

**No OOM occurred in any lane.** Every invocation ran under `--max-old-space-size=1536`; no retry with a
larger heap was attempted by anyone. All four worktrees removed; no listeners left on any port.
