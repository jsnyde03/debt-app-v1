# ▶ START HERE, COLD — class 5, `.12.6.5.8.4`: round 2's fixes

**Rewritten 2026-09-14 at the close of `.5.8.3`.** Class 5's first `[D79]` re-audit ran and was recorded: **24 findings, 17
attributable to class 5's fixes, so the class does not exit.** The active build is **`.12.6.5.8.4`**, decomposed on
[`DEBT_ELEVATION_PLAN.md`](../../DEBT_ELEVATION_PLAN.md) as **8.4.1–8.4.8**.

⛔ **🎯 2026-09-14: 8.4 is built in a FRESH session, and round 2 (`.5.8.5`) is briefed and dispatched from ANOTHER one.** The
session that dispatched and recorded round 1 wrote this and stopped. Whoever builds 8.4 is the fixer, and must not write
round 2's brief.

## ⛔ Verify the state. Do not take a row of it on trust.

```
cd /c/Users/Jason/debt-app-v1
git status --porcelain --untracked-files=all          # expect empty
git log --oneline -3 ; git rev-list --count origin/v1.7-dev..HEAD     # expect 0
gh run list --branch v1.7-dev --workflow web-e2e.yml --limit 2 --json headSha,status,conclusion
npm --prefix /c/Users/Jason/debt-app-v1 run lint:rn -- --fast
npm --prefix /c/Users/Jason/debt-app-v1 run lint:finding-guards
git worktree list                                      # expect the main checkout ONLY
```

Expected: clean and pushed · CI `conclusion: success` on HEAD *(read the field)* · fast gates all green · finding-guards
**stale 2 (cap 8)** and **authored 9 (cap 9)**. ⚠️ No SHA of this handoff's own commit is quoted, on purpose. Code is
unchanged since `ea3f5e0e`, the round-1 pin.

## Read, in this order

1. **[`CLASS5-REAUDIT-ROUND1.md`](CLASS5-REAUDIT-ROUND1.md)** — all 24 findings, where each routes, 🎯's two decisions, the fix order.
2. **The lane report for each finding you pick up** — [`L1`](CLASS5-REAUDIT-L1.md) · [`L2`](CLASS5-REAUDIT-L2.md) ·
   [`L3`](CLASS5-REAUDIT-L3.md) · [`L4`](CLASS5-REAUDIT-L4.md). The consequence, `file:line`, the measurement, the
   base comparison and a **re-runnable probe** (`class5-reaudit-probes/L<n>/`) live there, not in the record.

## The 19, in order — one file group at a time

| step | ids | report | the shape |
|---|---|---|---|
| ✅ **8.4.1** | `L3-1a` **blocker** · `L3-1b` · `L3-4` + `FX-1` `FX-2` | L3 | **CLOSED 2026-09-14** — three claims per hero family, APR routed on avalanche; `L3-4`'s remedy was wrong twice. Record: log + [`class5-round2-fixes/`](class5-round2-fixes/) |
| ✅ **8.4.2** | `L3-5a` · `L3-5b` · `L3-2` · `L3-6` | L3 | **CLOSED 2026-09-14** — the tier in the route, cash flow gated; `L3-6`'s first test raced the chart and was fixed. Also fixed: `030a312b`'s crash on a non-union strategy. Record: log |
| ✅ **8.4.3** | `L1-1` · `L1-3` · `L1-4` · `L1-5` + `FX-3` `FX-4` | L1 · log | **CLOSED 2026-09-15** — one predicate for app-written plan fields, explicit setter answers, `computeState` honors a set `$0`. ⛔ A re-derived un-fix that shares a line with another fix reverts both: `B5-7` scored WRONG until scoped. Record: log |
| **8.4.4** | `L1-R1` · `L1-2` | L1 | confirmed liveness vs the estimate's ranking — Money loses a debt; the reserve release names a skipped one |
| **8.4.5** | `L2-1` · `L2-2` · `L2-3` | L2 | the dated tap after an in-window payday edit *(Swift)*; the 50-id cap; the dismissed-activity restart unpinned |
| **8.4.6** | `F4` · `F6` | L4 | a proof whose red is not its token; two scans proven one direction each |
| **8.4.7** | `F2` + every proof 8.4.1–.6 wrote | L4 | drain first, then register as ONE batch |
| **8.4.8** | — | — | full `lint:rn` · typecheck · unit suites · **full e2e + embed** · push · CI `conclusion` |

**Not yours — routed onward, do not fix here:** `L2-4` → class 6 · `F3` `F5` `F5b` `L3-13c` → class 9 · `F1` → backlog.

## ⛔ Traps, most of them paid for in round 1

- ⛔ **Every remedy in the lane reports is UNVERIFIED — measure it before building.** Pass 4 counted five remedies that
  would have introduced the defect they described. Named hazards already: `L1-1`'s explicit answer must **not** fire from
  `runMigrations`, hydrate or `importStore`, and the ack must still not clear it · `L2-2`'s second remedy alone does not fix
  the growth shape · `L3-4` is two claims, not a wider one. ⚡ **Measured at 8.4.1: `L3-4`'s remedy was wrong twice** — the
  split is exact on `'required-plan'`, not `'paycheck-plan'`, and the suggestion on it would have shipped `FX-1`. Probe first.
- ⛔ **These files are CRLF.** A multi-line plant anchor spelled with `\n` matches nothing — spell `\r\n`, and count every
  anchor before spending an export. `class5-round2-fixes/plant.py` refuses a zero count; keep it that way.
- ⛔ **A closure is closed only when a plant of EXACTLY ITS REVERT reds.** `L3-6` survived because the date is gated twice:
  the spec's one assertion was satisfied by the gate that was not the fix's subject. Plant the fix line, not a neighbour.
- ⛔ **Iterate the surfaces, never add one.** `L3-5a`/`L3-5b` exist because Progress's cash-flow bars are not in
  `trustSelectors.test.ts`' `SURFACES` — a typed list. `L3-4` exists because that test serialises two figure families as
  one. Ask what would make the population derived.
- ⛔ **The five kept "reproduces" findings are class 5's by 🎯's decision.** Their base comparison says the defect predates
  the class; what is attributable is the closure that stopped short. Fix them as closures, with the class's own predicate.
- ⚠️ **`authored` is 9 of cap 9.** Any new registry proof deadlocks until a drain. `.5.7 ⑦`'s order: prove new entries and
  stale non-readers first, gate-check, then readers; a `MIN_ENTRIES` raise stales the six proofs that plant into
  `check-finding-guards.ts`.
- ⚠️ **`L2-1` touches Swift** (`PaydayLiveActivity.swift`, the activity's `ContentState`). Swift cannot compile here, and
  `native-e2e` has not yet compiled `.5.7`'s Swift either: batch one manual `native-e2e` dispatch with 8.4.5.
- ⚠️ **`:4319` is one port** for e2e and every `prove:guards` run — one at a time.
- ⛔ **If you make a worktree, run the teardown check against a KNOWN junction first.** Round 1's driver gated
  `git worktree remove` on a check that built `"$W\\$J"` inside a quoted heredoc: bash produced `…L1$J`, all twelve junctions
  read `absent`, and four removes ran over live links into the main `node_modules`. Only git's refusal to descend them saved it.
- **[D81]:** per fix `npm run lint:rn -- --fast`; full `lint:rn` at a sub-step's close or after a gate script changes.
- **The Edit and Write tools decode a backslash-u escape.** **`cd` to an absolute path in every shell call.** **NEVER
  `git add -A`.** ⛔ **Pass-6 and pass-7 ids COLLIDE** — a bare id means pass 7.

## What round 2's brief (`.5.8.5`) must carry — for the session that writes it

- **Range:** from the commit that closes 8.4.8's boundary back to the round-1 pin `ea3f5e0e` — derived with `git diff --stat`.
- **The attribution addition:** a finding that reproduces at the base must also answer *"is this a surface a class-5
  closure claims?"* — round 1's rule alone would have filed `L3-1a`, a blocker, onward.
- **Round 1's measured non-defects**, so they are not re-derived: listed per lane under *Measured non-defects*.
- **The dispatch shape that worked:** 4 lanes by generated manifest, each in its own worktree, one lane on `:4319` —
  ~1.5M tokens, ~3 h wall clock for the longest lane.
