# The guard ledger — what happened after the pass

> **This answers `SYNTHESIS.md`'s headline result**, *"the ledger cannot be cashed"*. How it went in full
> is in [`DEBT_ELEVATION_LOG.md`](../../DEBT_ELEVATION_LOG.md) under **S1.11.3**; this page exists so the
> pass's own report is not read for three more rounds as if it still stood alone.

**The pass's finding was correct and is now closed at the source.** `lint:finding-guards` was a deletion
detector being read as a closure proof: it exited 0 over every un-fix four auditors performed.

## What replaced it

`npm run prove:guards` executes a registry entry's own `proof` block — the un-fix, the command, and the
reason that command must red for — then restores, asserts the bytes, and runs the control **after** the
restore. `lint:finding-guards` now separates three states and prints them on every run:

| state | meaning |
|---|---|
| **carries a proof** | a re-runnable plant exists, and its anchor still matches its file exactly once |
| **`guardOnly`** | measured NOT to red, or unplantable — the entry's `CLOSED` rests on a token, said out loud |
| **never tested** | nobody has ever made this guard red. Downward-only cap |

## The numbers this pass produced, and where they went

| pass-4 statement | resolution |
|---|---|
| **8 guards proven to survive their own un-fix** | all 8 repaired and machine-proven. Two needed a new gate (`lint:cap-literals`), one a new invariant in `lint:gate-sources`, one a `@ts-expect-error`, one an `ORDERED` rule in `lint:destructive`; `S1P3-B3-MTIME` split in two |
| **35 entries in lanes A/B/C never tested** | 32 of them are the remainder *(three were among the eight)*. **All 32 now carry executed proofs**, including 8 whose guard is a Playwright spec |
| **`D4-6` / `C4-10` cannot fail** | repaired at `S1.11.2`; `verdict()` now has one producer, in `scripts/lib/verdict.ts`, and its self-check fires for both harnesses |

⛔ **What is NOT closed, and it is the honest residual:** **119 registry entries still carry a token and no
proof.** Their `CLOSED` means *the assertion is still present*, which is not the same claim. The count is
printed by `lint:finding-guards` on every run and capped downward-only, so it can only drain.

⚠️ **And a proof is not self-executing.** CI holds the static half — the proof exists, its anchor still
matches. Running them is `npm run prove:guards -- --all`, which is tens of minutes because an e2e-backed
proof costs ~3m40s. That gap is filed in
[`DEBT_ELEVATION_BACKLOG.md`](../../DEBT_ELEVATION_BACKLOG.md) rather than left implied.
