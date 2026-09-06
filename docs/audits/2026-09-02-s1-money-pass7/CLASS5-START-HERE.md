# ▶ START HERE, COLD — class 5, `.12.6.5`

**Written 2026-09-06 at the close of the session that shut class 4.** The active build is
**`.12.6.5.2`**, decomposed in [`DEBT_ELEVATION_PLAN.md`](../../DEBT_ELEVATION_PLAN.md).

## ⛔ Verify the state. Do not take a row of it on trust.

⚠️ **No SHAs are quoted here on purpose.** A handoff that records its own revision is stale the moment it
is written — the round-3 doc proved that about itself twice. **Run the commands.**

```
cd /c/Users/Jason/debt-app-v1
git status --porcelain --untracked-files=all     # expect empty
git log --oneline -1 ; git rev-list --count origin/v1.7-dev..HEAD
npm run lint:rn ; npm run typecheck ; npm run test:app ; npm run test:regression
npm run lint:finding-guards
```

Expected at the close of that session: `lint:rn` **52/52** · `test:gate-plants` **26/26 fail closed** ·
typecheck **0** · both suites green · **301 of 302 guarded, 173 proofs EXECUTED, 2 stale (cap 8)**. The 2
stale are `S1-ROUTE-STALE-READ` and `S1-ROUTE-EXIT-REACHABLE` — deliberate, unfalsifiable on a swept tree,
**deferred to pass 8, not yours**.

⛔ **`R2-3`: a gate result from before the last commit is an UNRUN gate**, and *"the commits since were
documentation only"* is the exact reasoning that failure was built on. That session committed the error by
hand — it ran `test:app` after adding a guard block, skipped typecheck, and the boundary caught an
unnarrowed union access.

## What is done, and what is next

✅ **Class 4 CLOSED 2026-09-06** after five `[D79]` rounds. ⛔ **The loop was STOPPED by 🎯**, not
exhausted — findings reaching outside the instrument stack went **2 → 1 → 1**, and rounds 4 and 5 found
*only* defects the previous round's fixes had created, both on the same line.

✅ **`.5.1` DONE** — all 13 class-5 premises re-derived. **Read the log entry `.12.6.5.1` before touching
any of them**; five corrections came out and two change what gets built.

▶ **`.5.2` is the active build** — the sentinel-erasing fallback sub-sweep.

## ⛔ The five corrections `.5.1` produced — these are the live scope

1. **The class's "five different answers" has a measurable axis: which SUBSET of two claims a surface
   consults.** `widget/snapshot.ts:216` is `mayClaim(store, 'debt-balances') && mayClaim(store,
   'row-figures')` and **its docblock already explains why both** — `projectCurrentBalance` reads `apr`
   and `minimumPayment`, which route to `row-figures` *and only there*. **The answer is written; it is
   just not called anywhere else.**
2. ⛔ **`money.tsx` consults `mayClaim` NOWHERE.** It uses per-row `rowFieldUnread(store, 'row-figures',
   …)`. Its row guards are fine; the **hero** has no whole-claim guard. *"Add the missing claim"* edits
   the wrong layer.
3. ⛔ **`C1-1` is 8 sites across 2 spellings.** One `|| 200` (`buildGuardianBrief.ts:178`) and seven
   `?? 200`. **`||` swallows a legitimate `0` and `??` does not — and that `0` IS `C1-6`.** One sub-sweep,
   two findings. **Derive the population by query; do not list it.**
4. ⛔ **`C3-2` + `D2-12` are ONE root.** `buildGuardianSpoken` returns `''` for *not premium* (line 68)
   and for *cannot claim* (line 82); Siri routes `''` to the Premium upsell. A paying user with unreadable
   data is told it is a premium feature. **Fixing either alone leaves the overload.**
5. ⛔ **`C3-13`'s guard cannot live inside `selectPlanState`** — `index.tsx:141-143` hands it
   `withProjectedBalances(store, isPremium)`, so it cannot tell projected from real. **The guard belongs
   at the call site.**

## ⚠️ Read before you fix anything — what five rounds of class 4 cost

- ⛔ **A finding can be RIGHT while its fix is WRONG. Measured five rounds running.** Round 3's proposed
  `Math.floor` was **strictly worse than the bug** — it went silent over a real reserve. Round 4's report
  was right about a defect and wrong about its exposure (10 claimed, 4 measured).
- ⛔ **MEASURE A RULE'S FIRE-COUNT BEFORE WRITING IT DOWN.** Proposals over the guard registry have fired
  on **90, 84 and 30** legitimate entries. The one that shipped fires on **0**.
- ⛔ **ITERATE THE CLASS, NEVER THE MEMBER.** One line was wrong **three times** — `R3-4` sampled three
  cadences, `R4-1` added **one row**, `R5-1` was the cell they both missed. It is fixed now by **deriving
  the population from `Record<Recurrence, number>`**, so a new member is a typecheck error. **Adding a row
  is what failed, twice.**
- ⛔ **A COMMENT IS A CLAIM WITH NO EXPIRY — seven times in this workstream**, twice inside a comment
  written to replace one. **Correcting a false comment means DELETING it.**
- ⛔ **YOUR FIX WILL VOID A NEIGHBOUR'S GUARD.** It happened **five** times: re-derive the anchor and
  **re-RUN** the proof, never merely re-anchor. `lint:finding-guards` catches it; reading does not.

## ⚠️ Operating traps this repo will spring on you

- **`cd /c/Users/Jason/debt-app-v1 &&` in EVERY shell call, backgrounded ones included.** The working
  directory resets and a command in the wrong repo returns empty output that reads like a real negative.
- **Force UTF-8 on both ends of any subprocess capture** — `encoding="utf-8", errors="replace"` *and*
  `PYTHONIOENCODING=utf-8`. Two measurements were lost to cp1252 crashes that looked like the measurement.
- **Put every restore in a `finally`**, and verify it with `cmp` against a pre-plant copy. A 10-minute
  timeout stranded a plant on disk; `prove:guards --list` then printed a clean 302-entry summary **over
  the planted tree**.
- **`node -e` with a multi-line script returns empty while exiting 0.** Write probes to a file.
- **Edit `finding-guards.json` with a JSON serializer** — the `indent=2, ensure_ascii=False` round-trip is
  byte-identical here. **A guard token must be in CODE and stop before any `${`** *(four corrections)*.
- ⛔ **NEVER `git add -A` while an agent is working.** A "finished" notification means it **stopped**, not
  that it is gone. Doing so swept an auditor's in-progress work into a commit, invalidated its boundary
  and contaminated one of its measurements.
- ⚠️ **`authored` is 9 against a cap of 9 — headroom ZERO.** The next registered proof reds
  `lint:finding-guards`, and any proof whose `run` reads the ledger then has a red control. The drain that
  buys headroom is a Playwright e2e. See `.12.6.9`.

## ⛔ One open item that is not in the plan's queue and should be read first

**`R5-2`** — filed to `.12.6.9` by decision, **not fixed**. The borrow waiver in `lint:finding-guards`
matches by **substring**, so a `proofNote` saying *"shares A3-14's red"* silently waives a borrow from
**`A3-1`**; **20 of 302 short ids collide**. ⚠️ **Its remedy is already measured** — word-boundary matcher,
fire-count **0**, attack reds, legitimate waivers still honoured. **It is a live permissiveness in the gate
that certifies closures, shipped 2026-09-05.** Recommend fixing it before class 5's proofs are trusted.
