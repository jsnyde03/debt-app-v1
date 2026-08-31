# Pass 6 — the switch-in scan for `S1.13.5`, and what it found before an agent was spawned

**Run:** 2026-08-31, the fresh session `S1.13.4` asked for. **Tree:** `53a64d07` (`v1.7-dev`), clean.
**Predecessor record:** [`DISPATCH.md`](DISPATCH.md) — *"this record is a hypothesis about a tree that has
moved."* It was, in three ways, and one of them made the pass's own exit unreachable.

---

## 1. The two verifications `DISPATCH.md` asked for — both green

| check | result |
|---|---|
| `npm run lint:rn` | **43/43 gates pass** · `test:gate-plants` 24/24 fail closed |
| `npm run audit:route-check` | ✅ 0 missing · 0 owed · every changed tracked file accounted for |
| working tree | clean |
| diff since the route was generated (`4c0f7689..HEAD`) | docs only, plus one line of `scripts/finding-guards.json` |

## 2. ⚠️ The route on disk was stale by one file

`4c0f7689`'s route was **607**; at HEAD it is **608** — `scripts/finding-guards.json` changed, so it enters
lane D as `instrument`. Regenerated at HEAD before anything read it. **0 missing on disk · 0 duplicates
across lanes · 182 + 148 + 202 + 76 = 608 ✓.**

---

## 3. ⛔ THE PASS'S OWN EXIT WAS UNREACHABLE, AND `audit-route --check` SAID `0 owed` OVER IT

**Measured:** of the **446** money-bearing files the coverage exit demands, **12 reached no lane.**

```
apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts   packages/core/debt/cannotAmortize.ts
apps/rn/src/store/paycheckForm.ts                                  packages/core/debt/computeMilestones.ts
packages/core/debt/applyDebtPaymentProjection.ts                   packages/core/debt/computeStreak.ts
packages/core/debt/applyPaydayCapture.ts                           packages/core/debt/getDebtsWithDisplayBalances.ts
packages/core/debt/applyRolloverPayment.ts                         packages/core/debt/reconcileAutopay.ts
packages/core/debt/bnplProviders.ts                                packages/core/history/buildCycleSnapshot.ts
```

⚡ **The mechanism, verified rather than assumed: all 12 carry `s1p5`.** The router seeds `stale-read` from
the pass it *follows* — `--unread-pass=s1p5` — so a file pass 5 **did** read is excluded from the seed by
construction. `audit:read-coverage --pass=s1p6` asks the opposite and absolute question: does this file
carry **`s1p6`**? Pass 5's reads are no excuse for pass 6.

⛔ **The router's assertion is not wrong — it is a different statement than the dispatcher needs.** It
proves *"every money-bearing file the followed pass did not read reaches an origin."* Its docblock says so
in as many words. Nothing anywhere asserted *"every file the exit demands reaches a lane"*, which is the
one a dispatch is held to. **Two instruments, two populations, and the gap between them is silent in both.**

⚠️ This is `S1.13.3`'s finding one turn further on. That step fixed *"swept once, ever"* — files **no** pass
had read going unrouted. This is its complement: the files the **immediately preceding** pass read, which
the seed subtracts on purpose.

**Closed in `S1.13.5.1`** — see §6.

## 4. ⚠️ Lane D contributes ZERO to the coverage exit — 27.9k lines of it

Per-lane, against the 446:

| lane | routed | counts toward the exit | does not |
|---|---|---|---|
| **A** | 182 | 157 | 25 |
| **B** | 148 | 104 | 44 |
| **C** | 202 | 173 | 29 |
| **D** | 76 | **0** | **76** |
| | | **434 of 446** | 174 |

⛔ **Not an argument for cutting lane D.** The instruments are where `major` lives by the brief's own
definition, and *"eleven defects went into the instruments across two fixing sessions"* is the reason the
lane exists. It is an argument about **sizing**: lane D is the largest lane by lines (27.9k) and the
smallest by exit value (0), so giving it 3 of 12 sub-lanes spends a quarter of the dispatch on none of the
exit. **Recorded so the split is decided on this, not on line count alone.**

⚠️ **Lane D also holds ~8k lines of the legacy Next root surface** — `app/page.tsx` (1.5k),
`app/styles/03-nav-results-modals.css` (2.3k), `components/SnowballSection.tsx` (1.4k),
`ResultsSection.tsx`, `PaydayCaptureSheet.tsx`, `GoalsSection.tsx` — **the surface `P6.11` DELETES.**
🎯 `S1.12.6`: *"Coverage is what I want. Not unneeded files."*

## 5. ⛔ Nothing ingests `READ-<lane>.txt`, and the exit reads a file no tool writes

`DISPATCH.md` states the read-tracking contract as *"every lane emits `READ-<lane>.txt` incrementally"* and
the exit as `audit:read-coverage` at 446/446. **`check-pass-coverage.ts` never opens a `READ-*` file.** Its
population and its per-file claims both come from **`scripts/surface-coverage.s1.json`**, which
`surface-coverage.ts` only ever tells you to *"Edit"* by hand.

So the dispatch as recorded ends with **twelve lane files hand-merged into a 484-entry JSON** — the
enumeration class this project has come in short on for eight consecutive items. And the merge has a
coupling that is easy to miss: `[D5-10]` stamps a **hash of the claims file** into the inventory, so a
claims edit that is not followed by a `surface-coverage` run leaves the route refusing to read it.

**Closed in `S1.13.5.3`** — see §6.

## 6. ⚠️ 6 GB, and the OOM that killed pass 4 is a live constraint, not history

`RESUME-PROTOCOL.md` calls this *"a 6 GB box"*. **Verified rather than carried:**
`Win32_OperatingSystem` reports **6.0 GB visible, 0.5 GB free**, over physical DIMMs of 4 GB + 2 GB. Node's
default heap here is **2096 MB**, so the protocol's 1536 MB cap is a real reduction, not a formality.

⚠️ **No stale servers** — protocol rule 4 is clean; the top consumers are an editor, browsers and a chat
app, none of them mine to kill. **The ceiling does not move**, so **12 lanes do not run at once**: they run
in **two waves of six**, and the brief forbids in-lane whole-monorepo typechecks, `lint:rn`, Playwright and
any `--max-old-space-size` above 1536.

---

## What changed before dispatch, as a result

| # | change | why |
|---|---|---|
| `S1.13.5.1` | route regenerated at HEAD and re-seeded from the **target** pass | §2, §3 — 608 → **620**, and the 12 unreachable files land in their own lanes |
| `S1.13.5.2` | `--exit-pass` added to `audit-route.ts`, asserting the **absolute** population | §3 — so *"the exit is reachable"* is a check, not this document |
| `S1.13.5.3` | `audit:record-reads` built — `READ-*.txt` → claims file, with the restamp | §5 — the merge stops being twelve files hand-typed into one JSON |
| `S1.13.5.4` | the pass-6 brief | it did not exist; `S1.12.3` was its own sub-step in pass 5 |
| `S1.13.5.5` | **two waves of six**, not twelve at once | §6 — measured, not preferred |
