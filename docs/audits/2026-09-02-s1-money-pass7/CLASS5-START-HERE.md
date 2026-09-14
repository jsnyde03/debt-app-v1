# ▶ START HERE, COLD — class 5, `.12.6.5`

**Rewritten 2026-09-14 at the close of the session that shut `.5.7` steps ①–③.** The active build is
**`.12.6.5.7`**, the row marked ▶ in [`DEBT_ELEVATION_PLAN.md`](../../DEBT_ELEVATION_PLAN.md). Its Done line and its
Remaining list are the sequence. Detail lives in `DEBT_ELEVATION_LOG.md`, searchable by `.12.6.5.7`.

## ⛔ Verify the state. Do not take a row of it on trust.

⚠️ **No SHAs are quoted here on purpose.** A handoff that records its own revision goes stale the moment it is
written. **Run the commands.**

```
cd /c/Users/Jason/debt-app-v1
git status --porcelain --untracked-files=all     # expect empty
git log --oneline -3 ; git rev-list --count origin/v1.7-dev..HEAD   # expect 0
gh run list --branch v1.7-dev --limit 3 --json headSha,workflowName,status,conclusion
npm run lint:rn ; npm run typecheck ; npm run test:app ; npm run test:regression
npm run lint:finding-guards
```

Expected: `lint:rn` all gates · typecheck **0** · both suites green · finding-guards **3 stale (cap 8)**. The three
stale proofs are `S1-ROUTE-STALE-READ` and `S1-ROUTE-EXIT-REACHABLE`, which are unfalsifiable on a swept tree and
belong to **pass 8**, not you, plus `S1P6-C2-3-CONVERTFIELDS-E2E`. `authored` is **9 of cap 9**, so headroom is zero.
⛔ **CI: read the CONCLUSION, not a watcher's exit code.** `gh run watch --exit-status` returned 0 on a run that had
been CANCELLED by a later push, and it was reported green.

## What is done, and what is next

✅ **`.5.1`–`.5.6` CLOSED.** ✅ **`.5.7` ①** native flows 03/08 + Siri `isPremium`, native-e2e iPhone tier green ·
✅ **②** four instruments (`finding-guards --projected`, the debt-spread ledger, the claim lattice + vacuous-conjunct
scan, lost fields under their names), proven and pushed.

✅ **`.5.7` ③ — the render proofs, written, green, and planted.** A free-tier `C3-8` twin (`data-recovery.spec`), the
widget's stated direction (`widgetSync.test`), and the affordability + windfall refusals over a lost goal target,
each with a readable control. Four plants, each red for its own reason, all restored byte-identical. ⚠️ **Not yet
registered in `finding-guards.json`.** Registering them is `③`'s last act. `authored` is at its cap, so read
`.12.6.9`'s note on headroom first, and prove in two passes (non-readers, then the ledger readers).

▶ **`.5.7` ④ is the active step, and it opens on a MEASURED DEFECT.** The census of swallowing native bridges found
**`.5.7.4a-1`: a Siri-logged payment is applied TWICE when the App Group clear fails** (`drainPendingActions` applies,
then its swallowed `clear()` leaves the queue in place for the next drain). Backlog row `⤵ surfaced by .5.7.4a's census`
holds the measurement, the scope correction (the payday half is very likely guarded by pass-6 `C3-6`, unmeasured),
and the recommended JS-only remedy: persist applied intent ids in the same store write as the mutation. **Measure
through the REAL store first.** The census measurement used a stub api that counted calls, and that is how the
payday half was overstated before it was corrected.

Then ④(b) the future-amount census · ⑤ `hero-date-fit` in both fonts · ⑥ drop the plan's quoted backlog counts ·
⑦ boundary gates → **`.5.8`**, the `[D79]` re-audit by a fresh agent.

## ⚠️ What this session cost, so the next one does not pay it again

- ⛔ **A plant driver must run the SAME command the proof will.** A route un-fix went red for its own reason when the
  driver ran one test file, then went red FIRST on an earlier file's control under `prove:guards`' full `test:app`
  (`reason=WRONG`). Score by the line the run actually dies on. A run with no captured red is UNREAD, not a verdict.
  The same session lost two measurement rounds to a `cmd /c` launcher that never ran anything, and then to a scorer
  that matched one helper's `FAIL [..]` format while the target file throws bare messages.
- ⛔ **The finding-guards stale cap deadlocks a close.** A floor raise in `check-finding-guards.ts` stales every proof
  that targets it. Readers cannot prove while stale is above 8, so re-prove old non-readers first to buy headroom.
  Proofs set aside as "baseline" are not inert; they are that headroom.
- ⛔ **A stub that counts calls is not the store.** A guard can live on the mutation, and a stub skips it.

## ⚠️ Read before you fix anything — what five rounds of class 4 cost

- ⛔ **A finding can be RIGHT while its fix is WRONG. Measured five rounds running.** Round 3's proposed
  `Math.floor` was **strictly worse than the bug** — it went silent over a real reserve.
- ⛔ **MEASURE A RULE'S FIRE-COUNT BEFORE WRITING IT DOWN.** Proposals over the guard registry have fired
  on **90, 84 and 30** legitimate entries. The one that shipped fires on **0**.
- ⛔ **ITERATE THE CLASS, NEVER THE MEMBER.** Derive the population by query; adding a row is what failed, twice.
- ⛔ **A COMMENT IS A CLAIM WITH NO EXPIRY.** Correcting a false comment means DELETING it.
- ⛔ **YOUR FIX WILL VOID A NEIGHBOUR'S GUARD.** Re-derive the anchor and **re-RUN** the proof, never merely
  re-anchor. `lint:finding-guards --projected` says so BEFORE the commit.

## ⚠️ Operating traps this repo will spring on you

- **`cd /c/Users/Jason/debt-app-v1 &&` in EVERY shell call, backgrounded ones included.**
- **On Windows, `cmd` splits a `|` inside a quoted arg**, even through Volta's `node` shim. For Playwright with
  a `-g` alternation, use `~/AppData/Local/Volta/tools/image/node/<ver>/node.exe node_modules/@playwright/test/cli.js`.
  The RN e2e suite is not parallel-safe: `--workers=1` for plants.
- **Any chain whose tail writes to git gets `step || { echo STOP; exit 1; }` on EVERY step.** Echoing an exit code
  stops nothing.
- **Force UTF-8 on both ends of any subprocess capture**, and **put every restore in a `finally`**, verified by sha.
- **`node -e` and heredocs mangle scripts.** Write probes to a file with the Write tool.
- **Edit `finding-guards.json` only through the byte-identical serializer** (`indent=2, ensure_ascii=False`).
- ⛔ **NEVER `git add -A`.** Stage explicit paths. Untracked `apps/rn/src/testing/__run_*_once.ts` runners are never
  committed.
- **Don't edit files while `lint:rn`, `test:gate-plants`, `prove:guards` or a plant run is going.** They read them.
