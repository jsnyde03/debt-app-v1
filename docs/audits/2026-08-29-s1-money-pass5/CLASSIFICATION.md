# S1.12.4 — pass 5 RECORDED and CLASSIFIED

Target tree `65566a09`. Written **in the same step as the record**, per the standing rule that every
`s1pN` must be registered in `SWEPT_CLAIMS` first — twice nearly missed before.

## What was written

- ⭐ **`s1p5` registered in `SWEPT_CLAIMS`** (`scripts/surface-coverage.ts`) — it was absent.
- **Claims written back to BOTH files**, because the route spans two surfaces:
  `surface-coverage.s1.json` **90 entries updated · 88 now carry `s1p5`** ·
  `surface-coverage.s0.json` **67 entries updated · 26 now carry `s1p5`**.
- **Coverage moved: S1 `68 → 63` unswept · S0 `57 → 41` unswept.** All three gates green
  (`lint:s1-coverage`, `lint:s0-coverage`, `lint:surface-complete`, each read from its **own** summary
  line, not a pipeline's status).

⚠️ **The plan's carried figure for S0 was `50` unswept after pass 4; the committed inventory said `57`.**
Not reconciled here and not quoted forward — [D49] exists for exactly this: **quote the gate, never the
document.** The numbers above are the gates' own output at this tree.

---

## ⛔ THE METHOD CHANGED, DELIBERATELY — evidenced-swept, not swept-unless-named

**Pass 4 defaulted a routed file to SWEPT unless a lane named it as not-reached.** That default failed
inside pass 4 itself: lane C disclaimed three whole *directories* in prose, a per-file matcher
structurally could not see a directory statement, and **30 files had to be moved to `partial` by hand**
because *silence read as swept*.

Pass 5's lane D found the same shape three more times as live defects — `D5-13` (a population that is a
4-name enumeration), `D5-9` (a cap whose floor absorbs its own population drop), `D5-12` (a test file in
no runner) — and prescribed the cure:

> *"The checkable form is the inversion `audit-route.ts` already uses: enumerate what is ACCOUNTED FOR
> and refuse the remainder. One pattern, three sites, cheaper to state once than to re-derive per gate."*

**This classification applies that to itself.** A routed file earns `s1p5` **only where its lane's own
report evidences a sweep**; everything else is `partial`. The remainder is refused rather than assumed.

### The result, and it is not flattering

| lane | routed | evidenced `s1p5` | `partial` | share evidenced |
|---|---|---|---|---|
| **A** — engine | 108 | 51 | 57 | 47% |
| **B** — store · storage | 113 | 28 | 85 | 25% |
| **C** — screens | 122 | 19 | 103 | 16% |
| **D** — instruments | 50 | 28 | 22 | 56% |
| | **393** | **126** | **267** | **32%** |

⛔ **Pass 4 evidenced 130 of 217 files (60%). Pass 5 evidenced 126 of 393 (32%).** The route nearly
doubled when `neighbour` and `s0-first-look` were added; **the reading did not.** In absolute terms pass 5
read about as many files as pass 4 — it simply had far more in front of it.

⚡ **That is the honest reading of "39 findings from 32% of the route", and it cuts both ways:** the
finding count is not evidence of a worse tree, and a clean pass 6 over the same route would not be
evidence of a swept one. **What would make it checkable is a per-lane budget stated in files, not lanes.**

### Why so few newly-swept files, when 126 were swept

**Only 21 of the 126 were previously unswept** (S1 5 · S0 16). The rest already carried a claim from an
earlier pass. This is the round's coverage result stated plainly: ⛔ **pass 5 re-read ground that had been
read before and barely touched the never-swept reservoir** — which is precisely why **`first-look`
produced zero findings.** The reservoir was not read, so it did not report.

**Newly swept, S1 (5):** `TrajectoryChart.tsx` · `whereText.ts` · `debtIds.test.ts` · `cannotAmortize.ts` ·
`plural.ts`
**Newly swept, S0 (16):** `prove-guards.ts` · `lib/verdict.ts` · `lib/anchor.ts` · `check-cap-literals.ts` ·
`check-ci-chain.ts` · `check-restore-doors.ts` · `test-stamp-coverage.ts` · `make-cutover-backups.ts` ·
`migrationAudit/run.ts` · `testEngineFuzz.ts` · `e2e-fresh.cjs` · `e2e-fresh-rn.cjs` ·
`playwright.embed.config.ts` · `playwright.shots.config.ts` · `copy-canvaskit.mjs` ·
`secrets-exemptions.json`

---

## ⚠️ THREE CORRECTIONS, ALL FOUND BY READING THE MATCHES — and all mine

Pass 4 made exactly three corrections this way and every one inflated coverage. **Pass 5's classifier made
three of its own, in the same direction.** Recorded because a classifier that is not itself audited is one
more instrument reporting green while doing less than it claims.

| # | the error | what it did |
|---|---|---|
| 1 | the matcher treated only `.ts` / `.tsx` / `.mjs` as full filenames | **`app.json`, `conform-app-preview.sh` and `test-conform-assertions.sh` — all three on lane D's explicit *"nine files no pass has ever swept, and this one did not either"* list — silently failed to match and were marked SWEPT** |
| 2 | the `s1p5` path stripped `partial` but not `never` | **24 entries** were written as the self-contradictory `["never", "s1p5"]`. The gate counts it swept, so no gate could see it; the next auditor reads a record that says both |
| 3 | a name written without its extension (`skia-ready`) could not match a file carrying two (`skia-ready.web.ts`) | one of lane B's named-unread files was marked SWEPT |

All three are the **same class as `D5-13`/`D5-9`/`D5-12`**: an enumeration that cannot see a member whose
spelling it did not anticipate. ⛔ **An enumeration of spellings has now failed in this repo eight times,
and the eighth was in the code written to record the seventh.** The matcher is now one anchored rule —
`base == name || base.startswith(name + '.')` — which keeps pass 4's correction (`Card` matches `Card.tsx`
and not `AffordabilityCard.tsx`, because the anchor is the basename boundary).

⚠️ **A fourth property was verified rather than assumed:** the writer is **additive only**, so re-running
it after a correction **cannot retract a wrong claim.** Both re-runs were therefore done from a
`git checkout --`'d baseline, and the restore was verified before each. The first attempt's restore
**silently failed** — a `cd` from an earlier step had persisted and the pathspecs did not resolve — and the
run that followed reported *"0 entries updated"* over the uncorrected file. **That is `verify-the-restore`,
live, and it is why the counts above were taken after a confirmed reset.**

---

## ⛔ 50 ROUTED FILES ARE IN NEITHER CLAIMS FILE — including a blocker and a major

**No inventory owns them, so no gate can ever state whether anyone read them.** This is `S1.10.6.10`
(S2/S3/S4 have no claims file), now on its second round and **wider than that item describes** — 38 of the
50 are `neighbour`, on S1's own import graph.

⚠️ **Two of them carry pass-5 findings:**

| file | origin | finding |
|---|---|---|
| `apps/rn/src/data/readBackup.ts` | `off-surface` | **`B5-1`, a blocker** — nine lost debt rows described as *"1 whole row"*, one line above **Replace my data** |
| `packages/core/scan/parseStatementText.ts` | `neighbour` | **`A5-3`, a major** — the `0–100` APR bound cannot fire; `"129.99% APR"` is read as `29.99` |

⛔ **This is what makes the three `off-surface` [D69] exemptions exempt for a bad reason.** They are not
exempt because nobody read them — they are exempt because **no file exists in which to say whether anyone
did.** A blocker on a file the coverage protocol cannot describe is not an exemption; it is a hole in the
protocol.

The other 48: the `sandbox`/`demo`/`tutorial` store cluster (21), the `data/legacyBridge` + backup cluster
(13), five `components/plan` demo components, the three legacy root `components/`, `app/page.tsx`,
`packages/core/imports/debtCsv.ts`, `scripts/__fixtures__/*` (2), and the two claims files themselves
(excluded by design — *"this gate's own claim files are its record rather than its subject"*).

---

## [D69] — 34 of 39 findings COUNT

| origin | blocker | major | minor | total | swept before pass 5? | [D69] |
|---|---|---|---|---|---|---|
| **neighbour** | 4 | 3 | 6 | **13** | yes — routed for the first time, but claimed by earlier passes | ✅ **COUNT** |
| **fix-churn** | 3 | 1 | 2 | **6** | yes — a claim exists; the bytes moved under it | ✅ **COUNT** |
| **instrument** | 0 | 10 | 4 | **14** | yes — S0 claims | ✅ **COUNT** |
| **off-surface** | 1 | 1 | 1 | **3** | ⛔ **no claims file exists** | ⛔ exempt |
| **first-look** | 0 | 0 | 0 | **0** | no | ⛔ exempt |
| **s0-first-look** | 0 | 0 | 2 | **2** | no | ⛔ exempt |
| | **8** | **15** | **15** | **39** | | **34 COUNT · 5 exempt** |

⛔ **Exempt from the CONVERGENCE COUNT is not exempt from being FIXED.** All five are real defects and all
five are on the fix list.

⛔ **[D65] exits on 0/0 twice consecutively. Pass 5 is 8 blockers / 15 majors that count.** It is not a
first clean pass; **pass 6 is owed, and a clean pass 6 would still owe a pass 7.**
