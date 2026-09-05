# ▶ START HERE — class 4, round 3

**Written 2026-09-05 at the close of round 2, for the session that runs round 3.**

## State, verified — not inherited

| | |
|---|---|
| branch | `v1.7-dev`, HEAD `ae64325d` |
| tree | **clean** (`git status --porcelain --untracked-files=all` empty) |
| `lint:rn` | **exit 0 · 52/52** |
| `typecheck` · `test:app` · `test:regression` | **0 errors · green · green** |
| registry | **296 entries · 15/15 class-4 guards hold · 2 stale (cap 8)** |
| ⚠️ **unpushed** | **102 commits.** Nothing has been pushed and no push has been authorised. |

⛔ **RE-RUN THE BOUNDARY BEFORE TRUSTING THAT TABLE.** It was true at `ae64325d` and this is exactly the
failure `R2-3` recorded: a gate result from before the last commit is an unrun gate. Two commits after a
green run made seven proofs stale and `lint:rn` was red while the previous session was reporting 52/52.

## What to do

1. **Verify the state above**, then read [`CLASS4-REAUDIT-3-BRIEF.md`](CLASS4-REAUDIT-3-BRIEF.md).
2. **Dispatch a FRESH agent** with it. `[D79]` step b: the session that writes the brief records the
   result and never runs the pass. Both prior rounds found the fixer's own work to be the worst defect.
3. Record findings → fix per class → re-audit. The active item is **`.4.15`** in
   `docs/DEBT_ELEVATION_PLAN.md`.

## The two open threads round 2 deliberately did NOT close

- **Deriving the cumulative count mechanically** — filed to `.12.6.9`. The count has been wrong in three
  consecutive briefs because `W9b` lives only in `DEBT_ELEVATION_LOG.md` and no file-driven enumeration
  can see it. **Not built mid-round on purpose:** this cluster is closing findings *about instruments*,
  and inventing an instrument to fix an instrument finding is where that recursion has no floor.
- **`S1-ROUTE-STALE-READ` / `S1-ROUTE-EXIT-REACHABLE`** — the two permanently-stale proofs. **Not broken:
  unfalsifiable on a swept tree.** `audit-route --check` reports `0 stale-read`, so the seeding logic both
  plants remove is a no-op. **Re-measure at pass 8 switch-in**, when the route opens with unswept files.
  Do not "fix" them against a swept route.

## ⭐ What these two rounds are actually teaching, in one line each

- **A window is a PAIR, and pinning one end is not pinning the window.** Four separate defects.
- **A gate can be doing two jobs while only one is visible** — `R2-1`: widening `isInstallmentNative`
  dropped the installment cap nobody knew it was providing.
- **A check that cannot fail looks exactly like a check that passes.** `% 50` over 50/200/800; a $3,000
  fixture for a finding about a shortfall; a guard whose control was red either way.
- **A comment is a claim with no expiry.** Four sites stated *"Non-BNPL minimums are already monthly"*
  long after `A3-1` retired it.
- **An audit's remedy can be wrong while its finding is right.** `R2-6`'s proposed gate fired on 90
  legitimate entries.
