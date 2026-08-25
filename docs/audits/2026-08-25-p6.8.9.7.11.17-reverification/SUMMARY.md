# P6.8.9.7.11.17 — the fourth round: 2 blockers, 17 majors, and both blockers were made by the fixing

**Method.** Five independent auditors over `6736a64..c8d54fa` (93 source files, +4,114 / −409), each given
two jobs — re-verify the `.11.11`–`.11.15` fixes, then sweep the surface for **blocker and major only** —
plus the severity scale, the four reading rules this cluster paid for, and `.11.10`'s swept-clean list **as
a ratchet**. [`BRIEF.md`](BRIEF.md). ⛔ **No fixes were made. Findings only.**

⛔ **THIS FILE IS THE MAP. THE FIVE `{A,B,C,D,E}-*.md` FILES ARE THE LEDGER.** Last round's summary said
*"9 open majors"* where its auditor files held **14**, and the plan carried the wrong number for a day.
The ledger below was counted **from the report files**, not from the auditors' own digests.

---

## 🔴 BLOCKERS — 2, and **both were introduced by this fix range**

| # | finding | where |
|---|---|---|
| **1** | **An empty-string money field is classified as a RECOVERY, which switches the "Every balance cleared" guard back off.** `readMoney` returns `recovered` for `''` and `'   '` because `Number('') === 0` (`migrations.ts:60-63`); `.11.12.1` then narrowed the guard to `r.kind !== 'recovered'` (`money.tsx:360`). ⚡ **The pre-range predicate was `some(r => r.entity === 'debt')` and suppressed it.** | A · confirmed by re-reading both revisions |
| **2** | **A balance corrected DOWNWARD claims money was paid that never was, permanently.** Enter `$5,000` by typo, fix it to `$500`: `raiseOriginalBalance` is `Math.max(current, balance, 0)`, so the stamp never lowers, and `journeySelectors.ts:58` + `computeMilestones.ts:43` read **"$4,500 of $5,000 paid"**, ring **90%**. | B · confirmed by re-reading the owner + both consumers |

**User-facing consequence, #1:** a user restoring a backup whose debt balance is `""` is told *"Every
balance cleared · 1 debt paid off"* over a debt they still owe, for the life of the install.
**User-facing consequence, #2:** a user who fixes their own typo is congratulated for $4,500 they never
paid, and nothing can ever lower it.

⚡ **The result of the round, and it is about the fixing rather than the audit.** `.11.15`'s own docblock
names the deciding case as *"a typo at entry"* and reasons it through **one direction only**. The
correction case was the argument **for** the high-water mark and is also the argument **against** it; the
symmetry was never written down. ⛔ **Blocker #1 is the same shape**: a guard narrowed to fix a false
negative, opening a false positive its own justifying comment said was impossible.

---

## 🟠 MAJORS — 17 distinct (19 entries; two were found independently by two auditors)

### The app — a user meets these

| # | finding | src |
|---|---|---|
| M1 | **A BNPL installment corrected downward reads *"4 of 8 paid"* on a 4-payment plan**, 50%-full bar, $200 counted as paid. The stamp is *dollars* divided by `scheduledPaymentAmount`, **which the user can edit** — the dimension [D63] never mentioned | B |
| M2 | **`cannotAmortize` ignores the rolled-on freed minimums.** A $6k 0% loan + a $12k card at 24% is declared *"Unable to estimate"* — hero `—`, end pill hidden, interest-saved `none`, What-If 0 months at every slider value — while `simulatePayoff` on the same inputs clears at month 29. Both existing tests are single-debt | B |
| M3 | **"Save for it" prices its pace and ready-by off `selectDiscretionary`** while the card that launched it uses `selectSpendable + appliedTopUp`: *"$1,500 · ready 31 Aug"* where the allocator will only put in $1,175 | B |
| M4 | **A WebKit container that opens cleanly and decodes to nothing is called "a fresh install"**, and `droppedRows` — the counter that says otherwise — is read by no one. `migrateFromLegacy.ts:82-96` is **byte-unchanged** by this range | C |
| M5 | **The confirm screen in front of an irreversible overwrite invents a date.** `exportedAt:"garbage"` → *"Saved recently."*; `exportedAt:"0"` → *"Saved 1/1/2000 at 12:00 AM."* `readBackup.ts:43-45`'s own docstring forbids exactly this | C |
| M6 | **A restore leaves the goal stand-down deletable with no invariant objecting** — measured `0` violations on the simulated un-fix, on the branch `migrations.ts:228` calls *"the only finding in that pass that reaches a user's money"* | C |
| M7 | ***"Show feature tips again"* still cannot re-offer one of the two tab-hosted marks on iOS.** `use-coach-mark.ts:103` sets `asked = true` **before** `show()`, which refuses while anything is active; re-armed subscriptions all replay in the same commit, so the first host wins and the second re-latches out unshown — while the app says *"Tips will appear again as you go."* | D |
| M8 | **A re-offered tip draws on top of the More screen and is spent there.** The offer effect has no focus gate; the root layer is above the `Stack`; `calloutOnScreen` says yes and `markDrawn` records it. ⚡ `use-coach-mark.ts:37-41`'s already-fixed defect returning through a new door | D |
| M9 | **A second emergency fund is called three different things on three screens** — "Savings" (`money.tsx:1022`), "Emergency fund" (`GoalSheet:28`), "your emergency fund" (`guardianSelectors.ts:301`). **A product call, not a code fix** | A |

### The instruments — how the next blocker ships

| # | finding | src |
|---|---|---|
| M10 | **`check-month-arithmetic` catches 1 of 5 spellings** — misses `new Date(y, m+n, d)`, `setUTCMonth`, and any line with `//` inside a string; `ROOTS` omits three dirs plus the legacy tree. ⛔ **`addMonths.ts:25` demonstrates the unmatched constructor as the house idiom** | **B + E** |
| M11 | **`check-destructive-writes`' `CALL` pattern misses `importStore?.(…)`**, aliased and computed calls. Its own docstring: *"What it must never do is under-match"* | E |
| M12 | **`check-audit-closure`'s SYNTHESIS fix moved its number by ZERO** — `WRONG-REMEDY`. 87 high+, **39 untraceable**; re-adding SYNTHESIS rescues **0**; deleting **one line** (`DEBT_ELEVATION_LOG.md:1209`, the fixer's own postmortem listing the twelve ids) takes it to **50**. ⚡ **The instrument counts a postmortem ABOUT twelve ids as the closure trace FOR them.** 🔴 **P6.8.9's stated exit criterion turns on this number** | E |
| M13 | **Nothing pins that `audit.test.ts` still throws.** It *is* armed — delete four lines and it returns to report-only with the whole repo green, the state it sat in all month | E |
| M14 | **`hostile.test.ts` has no non-vacuity control** — a refused corpus produces zero violations, which is its pass condition. The same door `.11.13.6`'s vacuous fixtures failed at | C |
| M15 | **8 text-scale `progress` frames are shot with a live coach mark scrolling the hero out**, though `p6.8-matrix.shot.ts:332-333` claims the block seeds `coachMarksSeen`. That is the Larger-Text corner where a fixed 112 pt ring meets an unclamped subhead — **the one corner nobody can look at** | D |
| M16 | **The migration audit still cannot judge the goal PACE branch** (`B-J2-3`, `PARTIAL`). `targetAmount`/`currentAmount` are now genuinely covered (60/522 cases); `invariants.ts:86-88`'s stated reason for excluding the pace is **false as measured** | C |

### Load-bearing documentation — a comment the next fix will trust

| # | finding | src |
|---|---|---|
| M17 | **Three docblocks state the opposite of the code they document.** *(a)* `readMoney`'s *"a recovered value is exactly right — the string parses or it does not"* (`migrations.ts:51-54`) is **false for `''`**, and is quoted almost verbatim at `money.tsx:355-359` **as the justification for the narrowing that produced blocker #1**, and a third time in `models.ts`. *(b)* `debtPlannerStorage.ts:57-60` + `migrations.ts:194-196` document a BNPL carve-out the code **does not have**. *(c)* `journeySelectors.ts:12` still says `originalBalance` *"is stamped once at creation and no edit path updates it"* — `.11.15` made that false | **A + B + E** |

⚡ **M17 is `findings-cite-comments-as-evidence` with the arrow reversed.** The rule was written about
*auditors* quoting stale comments as evidence. Here the **fixer wrote the comment and then reasoned from it
one file over, inside the same cluster** — and a blocker came out.

---

## ⛔ A PLAN LINE IS RETIRED: "the harness reports exit 0 on a RED gate — nine instances"

**Measured false as of `run-gates.ts`.** Proven by reproduction — a fake three-gate npm project running the
harness's exact mechanism — and confirmed by reading: `run-gates.ts:68` sets `ok = res.status === 0`
(so a signal death's `null` reads as **not** a pass), collects every failure, and `process.exit(1)`s at
`:85`. The `&&` chain then stops and `gate:record` never runs, so **it cannot record a green over a red.**

⚠️ **The residual is what those instances actually were:** the harness is blind to a *child* gate that
prints `❌` and exits 0. **All 23 registered gates were swept individually — that class is currently empty.**

⚠️ And the count itself never agreed with itself: the plan says **nine**, `run-gates.ts`'s own docblock
says **seven**. Two hand-typed counts of one class, disagreeing — `audit-site-lists-undercount`, fifth phase.

---

## ✅ What is genuinely closed, and PROVEN rather than asserted

⚡ **The standard of proof moved this round.** Last round a closure meant *"a test exists"*; these were
measured:

- **`.11.11` (the `setMonth` blocker) — CLOSED, pinned.** All 7 RN/core sites converted, correct at every
  boundary in **5 timezones**. ⚠️ **But the whole-repo count is 24 matching lines and the shipping figure
  of 7 is short by two for the REPO** — 2 live unconverted sites remain in the legacy root Next surface
  (`components/AmortizationCalendar.tsx:24`, `components/Onboarding/FirstDebtOrBillStep.tsx:15`), which the
  gate does not scan. Out of `2.0.0`; **P6.11 deletes that tree**, so the open question is scope, not risk.
- **`ready` is on 14 of 14 surfaces** — counted by parsing the array, not by reading the claim.
- **`typecheck:tests` covers 73 files — the complete `apps/rn/tests` tree**, verified with `--listFilesOnly`
  against `find`, and compiles clean. That gate is real.
- **All 23 gates run in CI on every push**; `web-e2e.yml` matches `validate:release:rn` link-for-link except
  `gate:record`; the Pages deploy is gated by structural `needs:` edges on a success conclusion for the
  exact SHA. **0 orphan test files** (67 app + 64 core); all 13 default-exporting suites invoked.
- **Three `.11.13` self-reports re-measured and ACCURATE** — `.13.5`, `.13.6` (all 7 fixtures open the
  door; assertion 3 runs on all 7), `.13.8` (exactly five producers, three nameless).
- **`.11.14`'s craft set — P1-4, P1-5, P1-1 — all CLOSED**, and `C-A` and `C-C` with them.
- **`B-J2-1` and `B-J2-2` CLOSED** — `importStore` clears `data-reset` without touching `read-failed`, and
  the date reaches the confirm sheet.

---

## ⚡ THE PATTERN WORTH MORE THAN THE COUNT

⛔ **The instruments keep passing by selecting the member of the class that works.** Three sightings, all
this round, none adjacent:

1. **The coach-mark e2e moved from *"the one mark whose host remounts"* to *"the one platform with one
   claimant"*** — a new test, written to close exactly this, reproduced it one level up. `debt-row-actions`
   is `Platform.OS === 'ios'`-gated, so on web the race **cannot occur** and the suite is green.
2. **`hostile.test.ts` passes on a corpus that was refused wholesale** — zero violations is its pass
   condition.
3. **`testOriginalBalanceHighWater.ts:92`** — *"a stamp cannot inflate it"* — **holds `scheduled` fixed at
   100 in every case**, which is the one variable that breaks the claim. A test that passes with its own
   defect present.

### ⛔ Read the count by ORIGIN, and against the pool it was drawn from

⚠️ **A first draft of this file called the count "flat (2+15 → 2+17)" and that framing was wrong** (🎯
2026-08-25: *"we also fixed things that were hanging out and the tail of 1.9, so the count is down
comparatively"*). Two corrections, both real:

**(1) The pool shrank.** `.11.10` swept the **whole app** after clusters a–g — 13 lenses, 34 observations,
a build that had just landed. This round swept a **93-file range** plus its surfaces. A comparable count
against a much smaller denominator is a genuine improvement, and stating it as "flat" hid that.

**(2) Twelve of the seventeen are RESERVOIR, not new damage.**

| origin | n | which |
|---|---|---|
| **pre-existing, surfaced for the first time** | **12** | M2 · M3 · M4 *(a **byte-unchanged** file)* · M5 · M6 · M7 · M8 · M9 · M11 · M14 · M15 · M16 |
| **made by recent work** | **7** | 🔴 both blockers · M1 · M10 · M12 · M13 · M17 |

⚡ **So the number worth tracking round-over-round is 7, not 19.** The audit *is* converging on the code —
the reservoir drains and does not refill. What it is **not** yet converging on is the process that changes
the code: seven defects, including both blockers, were authored by the fixing inside a single range, and
that is where the remaining cost lives. **It is a claim about the fix loop, not about the trend.**

---

## 🔵 Two open questions this round could not answer, and one is a blocker gate

- 🔴 **`expo-sqlite`'s on-device BLOB representation.** On the captured iOS 26.2 container under
  `node:sqlite`: 22 rows, all `Uint8Array`, **0 dropped**. But it is a **driver** property, not a row
  property, so the failure is **all-or-nothing** — a Buffer-shaped return drops 22/22. ⛔ **One log line on
  the existing device probe decides whether M4 is a major or the round's third blocker.**
- **Whether the 39 untraceable findings are actually open**, or merely unwritable by a 2-character id.

---

## Swept and found clean — EXTEND THIS LIST, do not repeat it

Carried from `.11.10` and **re-checked where this range edited them**: `coachMarks.ts` · `tutorialTargets`
· the callout's touch model · `progress.tsx`'s scroll host · `check-comment-convention` ·
`check-local-dates` · `check-money-format` · `check-a11y-collapse` · `check-committed-secrets` ·
`check-rn-style-divergence` · `check-copy-owners` · `check-icon-glyphs` · `gateSources`/`write-gate-status`.

**Added this round:** the **allocation engine's boundary set** — 14 inputs, no negative, non-finite or
double-counted allocation · the nine **plan cards** + `AddObligationSheet` · `packages/core/imports/`
(unchanged in range; APR cells re-measured) · `zero-egress`'s cast · `check-destructive-writes`' per-site
counts · `strings-inventory`'s self-check · **every new e2e absence assertion is preceded by a positive
render assertion** · `raiseOriginalBalance`'s identity-preservation and negative-balance clamp ·
`addMonths` across 5 timezones · `lint:webkit`'s CI absence *(rated major, then **retracted** after reading
its roots — it scans the legacy tree, not `apps/rn`)*.

## The capture corpus — a call this round owes, answered

**Do NOT shoot the route block in both mark states. Add one `STATES` entry** (2 frames; merges cleanly;
changes no existing frame; leaves the live-mark frames that found P1-2 alone). ⚡ **The premise had already
moved and nobody wrote it down:** `.11.14.3`'s `band-milestone` seeds `coachMarksSeen`, so the Progress
hero is **already in 18 frames** — the hole half-closed as a side effect while the log filed it forward as
open. What those 18 never show is the ring **resting** and the **"$X to go"** wording. **M15 is the part
that still needs fixing.**
