@AGENTS.md

# Debt Planner — start here

v1.7 "The Elevation": Debt at or above the rest of the portfolio, acquisition-ready.
Ships as **ONE release** — nothing launches until Phase 6 is done and Jason is satisfied.

⚠️ The `@AGENTS.md` note above is about the **legacy Next/Capacitor surface** at the repo
root, which **5.5.1 deletes**. The live app is `apps/rn` (Expo/RN) over `packages/core`.

## ⚠️ `docs/DEBT_ELEVATION_PLAN.md` is the point of truth

It carries **▶ BUILDING NOW** (exactly one decomposed item), the phase table, the deferred
backlog and the decision log. **Read it before touching anything.**

⭐ **THE AUDIT GATE IS CLOSED (2026-08-19). T1–T8 + T3B are all done, and the [D37] exit check PASSES:
55 of 55 blocker/major findings trace to a closure or a recorded refutation** — now enforced every push by
`lint:closure`, not by memory.

⭐ **PHASE 5 IS CLOSED (2026-08-19).** The v1.6 → RN bridge is built, 5.10's adversarial audit is green, the
migration is **verified on a live device**, and the cutover is **conditionally approved** — the condition
being that cloud backup still ships, so the app is **not frozen**. ▶ **Phase 6 (launch-ready) is ACTIVE**,
decomposed as **P6.1–P6.21** at the top of the plan, and it ends at ASC submission. **This ships as
`2.0.0`** ([D38]); the internal workstream keeps the name *"the v1.7 Elevation"*.

⚠️ **Read the plan's numbering legend before quoting a step id.** `P6.n` is the sequence; **"6.C" (cloud
backup) = P6.3** and **"6.5" (repo consolidation, was 5.5) = P6.11**, so a commit or log entry naming
`5.5.1` means **P6.11.1**.

▶ **WHERE THIS SESSION LEFT OFF (2026-08-21).** P6.8's audit is closed and its BUILD is under way:
**P6.8.7a (gates) and P6.8.7b (copy) are DONE**; **next is `P6.8.7c.1`**, decomposed on the plan.
✅ **CI IS GREEN ON `dde2015`** — run `32588435337`, which is **every link of `validate:release:rn` except
`gate:record`**: typecheck (core + RN + **scripts**) · `lint:rn` · **`test:stamp`** · regression · app ·
scenarios · **`test:e2e:rn`** · **`test:e2e:embed`**. The apostrophe sweep's 12 Playwright pin edits are
therefore **verified**, and the three links added to `web-e2e.yml` this session all pass in CI.

⛔ **Two things a new session must know before touching anything:**
- **`gate-status.json` is STALE and that is correct.** CI deliberately does not run `gate:record`, and
  running it by hand forges a green — the writer is gated on `--from-gate` for exactly that reason. The
  record is refreshed by a real local `validate:release:rn` at **P6.8.8**.
- **`lint:closure` now reports the P6.8 audit too, and it says 43 of 80 high+ findings are traceable to no
  ledger.** That is **report-only by design** until **P6.8.9**, which flips it to `exit 1`. It is not a
  regression and must not be "fixed" by silencing it.

⭐ **What 🎯 owes, in one place: [`docs/DEBT_2.0_YOUR_STEPS.md`](docs/DEBT_2.0_YOUR_STEPS.md).** Every step
needing a human, an Apple login, a device or a decision — with an *"already done, do not ask twice"*
section, because three rows in this plan were still claiming to wait on him after he had answered.

⛔ **The result worth carrying out of eight items: an audit finding's site list is where to START looking,
never the class.** Measured on five consecutive items, always undercounting — T4 needed material
correction on 5 of 11 · T5's L1-12 was **2 of 9** sites · T6's formatter count went **6 → 7 → 9 → 12**,
three enumerations each short · T7's sweep found **34** sites beyond the finding · T8's L2-5 was **3 files
not 2**. **Budget the enumeration, not the list.**

⚡ **Refutation earned its keep SIX times** — building the findings as written would have made the app
worse: L1-16 rewrote ~20 strings for a surface **5.5.1 deletes** · half of L3-7 would have reported
**every autopay FAILED** · L1-13's own wording would have **undone T4** · L2-6's fix would make five dead
engine strings load-bearing · L4-8 would have undone the App Preview cents sweep · and T4.1b's
"it moves Guardian states" flipped the band **0 times in 1,820**.

⭐ **[D31] is now evidence, not a principle.** Gates written this phase caught what enumeration missed:
`lint:money` found **4 hand-rolled formatters on its first run** (one rendered `$1234` to VoiceOver);
`lint:copy` red on **T4.4 creating** a duplicate; `lint:closure` found **6 of 55 high+ untraceable, every
one already built**. Four gates added or extended; **e2e 184 → 196**.

⛔ **And my own instruments failed at a steady rate — assume yours will.** 7 of 7 first-cut probes in T3
were wrong in a way that PASSED · a T6 plant **passed** because the fixture had no cents · a T8 script
deleted **489 lines** (CRLF vs a bare `}`) · a baseline was set **12 too high**, leaving a +1 detector
unable to detect +1. **What caught them every time: `tsc` and mutation-planting. What caused them:
hand-rolled mechanical edits.** Prefer the Edit tool — it fails loudly where a script guesses.

⚠️ **Still owed before launch:** the **device pass** (52 rows + [T3.2]'s storage-fault row — two T3
surfaces ship on unit assertions with **no rendered proof**) · 44 baselined hand-written local parses ·
**73 baselined straight apostrophes** (`lint:apostrophes` holds the line; the sweep is P6.8).
✅ **The 62 are CLOSED** — P6.4, 2026-08-20. ⛔ **Four dead-code ids are now a P6.11 obligation** —
`formatDisplayAmount` · `projectForecast` · `buildSmartInsights` all have live ROOT-tree consumers, so they
must be deleted **with** that tree or P6.11 leaves four unreachable modules behind.

▶ **PICK UP HERE (2026-08-21) — P6.8.7, the BUILD.** ⭐ **P6.8's audit half is CLOSED**: 13 lenses, 6
adversarial refuters, 226 frames, 9 a11y trees, all in
[`docs/audits/2026-08-21-p6.8-finish/`](docs/audits/2026-08-21-p6.8-finish/). ⚠️ **Read `SYNTHESIS.md`
FIRST** — it is the decision document and carries the ranked verdict, a recommendation on all ten scope
calls, and a **do-not-build list**. ✅ P6.1 · P6.2 · P6.3 · P6.4 · P6.6 · P6.7 · R4 closed.

🎯 **2026-08-21: "put in everything except the refutations"** — A + B + C, decomposed **P6.8.7a–g** on the
plan. ⛔ **Only P6.8.7a(i) is built** (the a11y gate); implementation stopped there for a fresh session.
⚠️ 🎯 **overruled my 2.1 recommendation on C7 and C8**, so P6.8 is a BUILD phase now and must still clear
**P6.10** feature lock. ⛔ **The earliest deadline in the audit is C8's parser rescue —
`core/imports/debtCsv.ts`'s only caller dies at P6.11.** ⏭ **Then P6.8.9: a VERIFICATION audit** (🎯) —
re-audit the results, confirm each fix landed *and* that no major+ issue remains.

⛔ **THE RESULT THAT OUTRANKS EVERY FINDING, and it changes how you read any audit here.**
**Observations survive; explanations do not.** Measured six ways in one audit: W2 **0 of 3** mechanisms
held *(third consecutive audit)* · R1 **3 of 6** wrong · R2 **3 of 6** · R5 **1 of 7** · R4 **1 of 8** —
**and R4's own premise about the instrument was wrong too.** ⚡ **Twice the fix a lens proposed would not
have closed the defect it found.** ⭐ **Nobody — lens, refuter, or me — got a mechanism right by reasoning
about it; every correct one came from running something.** W2's corollary: **a carried NUMBER decays
exactly like a carried premise** (5 of 6 quoted figures were wrong).

⛔ **AND THE INSTRUMENT WAS WRONG TWICE.** Every `onboarding` frame was a photograph of Today — the shot
*succeeded*, so the "report your own holes" guard was blind to it. **Three mechanisms were needed; the
second was mine and I RE-SHOT ON IT** before O1 measured it false. ⚡ *"A re-shot matrix will produce Today
again, this time carrying a fix's authority"* — **a re-shoot on a wrong fix is worse than the original
bug.** And R4's second-order finding: **a known instrument defect becomes the explanation of first
resort** — three findings were killed by the lens reaching for it on frames it never touched.

⭐ **THE GATE NOW RECORDS ITSELF — stop typing gate results ([D49], P6.7).** `validate:release:rn`'s final
link writes `gate-status.json` (SHA · UTC · a content fingerprint of 580 source files) **on success only**,
and `npm run lint:gate-freshness` answers *"does that pass still describe this tree?"* in under a second.
⛔ **A remembered gate result is an unrun one** — that is what went wrong for three sessions while CI
failed every push. Quote the record, never your memory. ⚠️ `gate:record` refuses to run standalone.

✅ **R4 CLOSED 2026-08-21 — the demo wrote to the real store, and now it cannot.** Found by **Sentry, from
TestFlight, on 🎯's device**: he edited an expense inside the demo and the write went to his real plan.
⚡ **The fix is a VETO, not a better warning:** `createDebtStore` takes `opts.refuse` on the same `set`
seam as `opts.bound`, so a forbidden write is **dropped before it lands** and an action added later is
covered without anyone remembering. 15 sites converted · 4 background writers **declared**
(`allowRealStoreWrite` — under refusal an undeclared write is *dropped*, not merely reported) ·
**`lint:sandbox`** gates the 23 files allowed to import the singleton.

⛔ **What R4 measured, and it generalises past this item:**
- **The finding's own site table was 4 of 6** — `LivingExpenseSheet` and `LogPaymentSheet` missed. **Sixth
  consecutive item where an enumeration came up short**, on the item written to warn about exactly that.
- **A test can pass against the bug it was written for.** Two false greens, both caught by planting: the
  first read `localStorage` **inside the 500 ms save debounce**; the second asserted ids and amounts,
  which **survive a leak intact** because sandbox ids are `sbx-`-prefixed and collide with nothing. The
  damage was `stampInputsFresh` re-stamping read-freshness. The fixture now seeds a **stale** stamp.
- **A plant can lie.** The first one left a dangling `store_`, crashed the component, and turned both
  tests red for the wrong reason — proof-shaped and worthless.
- ⚡ **The guard reported for months and was reviewed by a 117-finding audit.** *Ask of every guard in this
  repo whether it PREVENTS or merely DESCRIBES* — filed to the backlog, aimed at P6.9.

✅ **NOTHING IS BLOCKED ON A DEVICE (🎯 2026-08-21).** Cloud backup is **verified on hardware** — iCloud rows
2–6 including the clobber guard — so **P6.3 is closed** and the app is not frozen on it. Work proceeds on
the desk.

⏭ **The next device build is OWED, not blocking.** It carries **[D51]** the light/dark splash *(supersedes
the badge version)* · the **Sentry QA test-event button** *(capture was untestable — there is **no
user-triggerable `reportError` path in the app**, so a missing event would have read as "Sentry is
broken")* · and **R3**'s demo exit, now **twice** fixed *(R3 corrected what it said; P6.4 found it was still
`caption`-sized)*. Then rows 1 and 7 of `docs/DEBT_DEVICE_PASS_2026-08-20.md`. ⏭ After a green Sentry row:
flip source-map upload in one commit. ⚠️ **None of those three is proven off-device.**

⭐ **P6.4 CLOSED 2026-08-20 — and 29 of the 62 were NOT WORK (47%).** 25 at triage, 4 more dissolved on
contact. ⛔ **The result that outranks the count: the audit gate had already fixed or refuted 18 of them,
and none of it was traceable to the low-tier id**, because `lint:closure` gates blocker+major only — so two
of five planned fix clusters were **empty**. **[D37]'s hazard lives one severity band down.**

⛔ **THE TRIAGE MUST READ THE LEDGER, NOT THE CODE — this cost a full re-run.** The first pass checked all 62
against the tree and was **wrong 9 times**, including **L4-8 and L1-26, both on the six-refutations list**.
⚡ **A fix that adds a BRANCH leaves the finding's quoted string in place**, so grep finds the healthy half
of a fix and reports it unfixed. `lint:closure` exists because the log *is* the ledger; read it first.

⛔ **Every enumeration made in P6.4 was wrong, in both directions** — money sites 3→5 · apostrophes 152→**73**
(a line-grep counted comments) · L2-13's list conflated two fields · L1-20's premise inverted (it claims most
eyebrows already have `textTransform`; **2 of 8** do). ⚡ **A grep answers a question about TEXT; these were
questions about CODE.** The two things that held were AST passes.

⚠️ **`lint` is now clean AND enforced** — `apps/rn` runs `--max-warnings=0` (🎯 2026-08-21), mutation-verified.
Gate is **210 e2e · 10 embed**, last RUN 2026-08-20 at P6.4.7, exit 0, read directly.

✅ **[D52]** feature lock → after **P6.10** *(P6.8 is chartered to find structural gaps and every answer was
auto-defaulting to 2.1)*; code freeze → after **P6.18**, the last step that can produce a change.
✅ **[D53] NO free trial in 2.0** (🎯) — the demo already is try-before-you-buy, and decliners stay eligible
forever, so 2.1 can add one and reach the exact cohort that bounced. ⛔ **`introPrefix(pkg, eligibility)` is
wired and DELIBERATELY INERT** — only `'eligible'` renders, every caller passes `'unknown'`. Turning a trial
on is a config change **plus** a compiler-enforced code change; thread
`checkTrialOrIntroductoryPriceEligibility` first or the paywall promises "30 days free" to someone Apple
will charge in full.

⛔ **Nothing about iCloud, Sentry capture or the splash is proven off-device** — the web suite exercises the
*unavailable* branch by construction and `expo prebuild` will not run on Windows.


Phases 0–3 · 3.5 · 3.7 · 4 · **3.8** are closed, and the **whole-app audit has RUN**:
7 lenses, **117 findings**, 12 refutations → [`docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md`](docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md).

✅ **[D37] SATISFIED 2026-08-19 — 55/55.** The exit was **not** "T1–T8 closed"; it was **all 55
blocker+major closed or explicitly refuted, each traceable to its finding id**, and that is now checked by
`lint:closure` on every push rather than by hand. ⚠️ Auditing
the plan against the findings showed **the ledger did not cover its own high+ set** — 8 majors sat
outside the gate → now **T3B**. Two more look already closed by T1 and were never recorded against their
ids; **an untraceable closure is indistinguishable from an open finding.**

⛔ **NOTHING IS PARKED** *(🎯 2026-08-18)*. **T9–T11 are SEQUENCED, not shelved** — the remaining
minor/polish findings stay live and are re-evaluated once T1–T8 lands, because several become cheaper or
moot by then. **A finding leaves this audit by being fixed or refuted on the record, never by aging out
of attention.**

⚠️ **Grep the plan's finding ids with the ranges EXPANDED.** It compresses them as `L1-5/6/7/14/19`, so a
literal search for `L1-6` matches nothing — the first pass reported ~30 unassigned high+ and the real
number was 4. ⭐ **`scripts/check-audit-closure.ts` does that expansion for you** — it is why the check is
code rather than a habit.

⛔ **3 of 4 agent-declared blockers did NOT survive refutation.** The lenses' self-reported *confidence* was
reliable every time; their *severity* was not. **No finding becomes work un-refuted** — `findings/L9-refutations.md`
records the 12 claims actually re-checked; anything not in it carries only its own lens's confidence.

⚡ **3.8 (the expense reserve) closed 2026-08-17, and its lesson generalises:** every one of its six steps found
a defect the step before it could not have found, and **three of the five were introduced by 3.8 itself**. A
before-scan catches *stale claims*; it structurally cannot catch a defect you are about to write.
⛔ **The sharpest: `route-smoke.spec.ts` — which exists verbatim for "a blank route passes silently" — passed
10/10 while Today rendered BLANK for every user with a bill**, because its fixture seeded no expenses and the
offending selector returns a stable `null` on an empty plan. *A fixture chosen for convenience decides which
defects a guard can see.* (Fixed in T1: `scenario()` now seeds a bill.)

## A pre-authored item is a HYPOTHESIS, and it fails two ways

Measured twice, on two separate authoring passes:

- **Wave A** (2026-08-11) — of **14** items, **5 did not exist** and **4 more were materially
  misdescribed**. Only ~5 of 14 were both real and accurately described.
- **Wave B** (2026-08-11) — of **4** items, **1 was refuted outright**, **1 was already half
  shipped**, **1 was wrong in 3 of its 4 stated premises**, **1 was clean.**

The ledger is reliable about **where** to look and unreliable about **what is there.**

- **The before-scan catches STALE** — already fixed, or never real. Minutes per item.
- **Only BUILDING catches MISDESCRIBED.** A before-scan confirms the code path exists and
  looks as described — which is exactly how an inverted item slips through. `A3.7` claimed a
  default was "deferrable" when it was `essential`; built as written it would have made a
  discretionary purchase *less* cuttable.

So when you reach the code, **re-read the thing the item asserts** — the default branch, the
comparison direction, the fallback. Two tells, both real here: a **stale doc comment that
contradicts the assertions beside it** (that is what generated the inverted item), and a
premise phrased as a **closed set** ("the only way is X" — there were two other ways).

⚠️ **And it is not a property of OLD items.** Wave B produced two wrong claims *the same
session they were written*: an item asserting the rollover should clear `autopayFailedThisCycle`
(the persistence is load-bearing — clearing it would silently presume a bill the user reported
never ran had been paid), and a confident "re-rendering resets the swipe pan" inferred from a
failure whose real cause was unrelated. **A claim's age is not what makes it wrong.** Check the
mechanism, not the symptom — including your own.

## The gate

```bash
npm run validate:release:rn     # typecheck:core → typecheck:rn → lint → regression → app → scenarios → e2e
```

**205 e2e + 10 embed + 10 `test:stamp` + 83 lane checks, tsc clean on both trees**, zero
`error-context.md`. CI runs it on every push. ~15 min locally.

⛔ **A REMEMBERED GATE RESULT IS INDISTINGUISHABLE FROM AN UNRUN ONE.** Found 2026-08-20: the gate had been
**red since `f4e5e11` (2026-08-19)** — a route-guard fix landed with unit coverage while the e2e that
contradicted it was never run — and **three consecutive sessions recorded it green**, each reasoning *"no
source touched this session, so the state is unchanged from CI `32287042685`."* True about the session,
false about the tree: **no source touched BY ME ≠ no source touched SINCE the last green.** `gh run list`
had been reporting a failure on every push the whole time. **Run it, or say you did not.**

⚠️ **It ran no `tsc` at all until 2026-08-11**, and two commits shipped green with real type
errors before that was found. `packages/core` had been unchecked since `validate:release:legacy`
was retired 2026-07-24. Both typechecks now run FIRST so they fail fast.

⛔ **AND THE RULE APPLIES TO THE PROBE YOU JUST WROTE. Measured across T3: 7 of 7 first-cut instruments
were wrong in a way that would have PASSED.** A `TZ` that never changed (5 zones measured as 1) · a
mutation that matched two functions and died on a `ReferenceError` · a probe writing to a field that does
not exist · a fixture whose valid answer equalled the bug's answer · assertions that would pass a
"take the last item" implementation · a test poking `localStorage` the hydrated app never re-reads · a
message API that no-ops on web. **Every one was caught by asking *which failure would this catch?* —
so treat a fresh instrument as wrong until it has been shown to fail on the defect.**

⚠️ **A green suite often means untested, not correct.** Before trusting a pass, ask whether any
test *would have failed*. The offline-Lifetime mislabel shipped green because nothing covered
the Lifetime row, the manage link, or the offline path. The same trap works at the level of a
single assertion: an a11y check passed while spreading `{...a11yHidden}` — the *function*, so no
props at all — because the query it used happened to find nothing either way. **A green assertion
is not evidence until you know which failure it would have caught.**

## Environment quirks that cost real time

- **`cwd` drifts.** Prefer `git -C /c/Users/Jason/debt-app-v1 …` and absolute paths.
- **Throwaway `tsx` probes must run with `apps/rn` as cwd** — the `@/*` and `@core/*` aliases
  resolve from `apps/rn/tsconfig.json`. A probe in the scratchpad, or run from the repo root,
  dies with `MODULE_NOT_FOUND`. Core tests run the same way:
  `cd apps/rn && npx tsx ../../packages/core/debt/testX.ts`.
- ⛔ **`TZ=… node …` through Git Bash is DROPPED here; assign `process.env.TZ` at RUNTIME instead.**
  Measured both ways 2026-08-18: the env-prefix form left the host zone in place (offset unchanged),
  while a runtime assignment took effect immediately. A timezone test written the natural way therefore
  runs every case in one zone and reports a pass per case. **Assert the zone actually changed before
  trusting anything measured in it** (`packages/core/utils/testLocalDate.ts` does). Restore the original
  `TZ` in a `finally` — `runRegressionTests` imports every suite into one process, so a leaked zone
  silently re-times the ones that follow.
- **Measure, don't derive.** Engine figures compose through `effectivePaycheckBuffer` and the
  §2.5 waterfall and are **not** predictable by reading. Two test fixtures this session were
  wrong on the first try from reasoning that looked sound. Write a probe, print the numbers,
  then write the assertion.
  ⛔ **But `tsx` does NOT typecheck, so a probe can write to a field that does not exist and print
  confident nonsense.** One assigned `store.expenses` — the field is `requiredExpenses` — and reported
  `totalRequired: 0` against a rent that was really being counted, which reads exactly like a finding.
  **A probe's output is evidence about the probe until its fixture is checked.** Print the fixture back,
  or run `tsc` over it.
- ⚡ **On an e2e failure, read `error-context.md` BEFORE touching the code.** Its page snapshot says what
  actually rendered. It has twice now shown the FIX working and the TEST wrong — without it the obvious
  next move is to debug working code. ⚠️ And prefer a container `testID` over a stat inside it for
  presence checks: `guardian-reserve-amount` renders in most Guardian states but **not** in `clear`,
  which is exactly the state a new user is in.
- ⛔ **A COPY RENAME IS NOT DONE WHEN THE APP COMPILES — sweep by RETIRED STRING, and in four places.**
  T4.4 renamed one vocabulary and needed **four** rounds to actually land, each caught by a different
  instrument after the previous one went green:
  1. `head -30` on the enumeration **hid half the class** — the reported blast radius was 5× too small.
  2. A **case-sensitive** spec grep missed `getByText(/Bills confirmed/)`.
  3. `lint:copy` caught the rename **creating** a new 3-file duplicate ("Everyday spending").
  4. The **Maestro** flow `06-tutorial-interactions.yaml` asserted copy no web test can see, and
     `route-smoke` pinned a screen title nothing else did.
  **The reliable sweep is: list every string you RETIRED, then grep each one, case-insensitively, with no
  `head`, across `apps/rn/tests` AND `apps/rn/.maestro` AND `packages/core/**/test*.ts`.** Term-by-term
  greps ("bill") miss the sites; retired-string greps do not. ⚠️ And the unit suites, `tsc` and 45 targeted
  e2e were **all green** while three of those four were still broken.
- ⛔ **A COPY-PIN ASSERTION USES `.includes()`, NEVER A REGEX — the escape does not survive the trip.** A
  `\b…\b` written through a heredoc → node → file chain landed in the spec as literal **backspace bytes**,
  so the pin read `/\x08flexible\x08/` and could never match. The suite stayed **green with the defect
  restored**. `cat -A` is how you see it (`^H`), and `.includes()` is how you avoid it — there is nothing to
  escape. **8th first-cut instrument here that was wrong in a way that PASSED.**
- ⚠️ **Line endings are PER FILE, and `cat -A` does not show you.** `planSelectors.ts` / `guardianSelectors.ts`
  are **CRLF**; `paywallLead.ts` is **LF**. Writing LF text into a CRLF file yields mixed endings and a diff
  that looks like whole-file churn. **Detect first** (`s.includes('\r\n')`), match the file, and confirm with a
  bare-LF count — not with `cat -A`, which showed clean `$` on a CRLF file here.
- ⛔ **`git commit -m "…"` SUBSTITUTES BACKTICKS, and the commit still succeeds.** Measured 2026-08-20: a
  message written with `-m` containing `` `L5-10/12/17–21` `` and `` `(?:\d+\/)*` `` committed and pushed with
  **both segments simply GONE** — bash ran them as command substitution, one erroring to empty and one dying
  on a syntax error, and neither stopped the commit. ⚠️ **The failure is silent and one-way**: the message
  reads fluently with the two load-bearing specifics missing, which is worse than a mangled one nobody would
  trust. **Use `git commit -F -` with a quoted heredoc** (`<<'EOF'`) — the quoting is what disables
  substitution, and every other commit in that session did it correctly. Same family as the `\s`-eating
  heredoc and `cmd | tail` reporting on `tail`: **the shell is a participant, not a pipe.**
- ⚠️ **Node and Git Bash disagree about `/tmp`.** `node /tmp/x.mjs` runs, but `readFileSync('/tmp/x.md')`
  inside it resolves to `C:\tmp\…` and dies `ENOENT`. Pass absolute Windows paths to node, or keep scratch
  files where both agree.
- **Prove a test fails before trusting it.** Revert *only the source* — `git stash` takes the
  test with it and proves nothing. ⛔ **And read WHY it went red.** A mutation here reported
  `plant-applied=YES` and turned the suite red while proving nothing: the `sed` matched the same line in
  two functions and the run died on `ReferenceError`, a compile error rather than the defect.
  **Confirming a plant applied is not the same as confirming it applied ONLY where you meant.**
  ⛔ **And grep for something UNIQUE TO THE PLANT, never for text the file may already contain.** A
  plant check for `every payday, automatically` matched the module's own doc comment — which quotes the
  phrase while explaining why it is banned — so it reported `plant-applied=YES` on a file where nothing
  had been planted. Prefer a line-numbered edit (`sed -i '65c\…'`) over a pattern.
  ⚠️ These runners are throw-based and stop at the FIRST failure, so an assertion ordered behind another
  is only ever proven by that other one — put the assertion that matters most first.
- **e2e:** `webServer` spawns its own `serve` on :4319 and can reuse a STALE one, serving an
  outdated `dist`. Force a fresh `export:web` when adding a route. ⚠️ Run the RN suite through
  its own config (`npm run test:e2e:rn`) — a bare `npx playwright test` picks up the ROOT config,
  which builds the legacy Next tree and dies on a pre-existing type error.
- ⏱ **THE REBUILD IS THE COST, NOT THE TESTS — measured 2026-08-18.** Full suite **6.0m** for 184
  tests; a targeted two-spec run **2.3m** for 17. The tests in that second run take ~25s — the other
  two minutes is `export:web --clear` running again, so splitting the suite alone still pays the tax
  every time. ⛔ And do NOT hand-run `export:web` before `test:e2e:rn`: Playwright's `webServer`
  exports again, so you pay it **twice**.
  **The pattern:** export once after a source change, leave `serve` up on :4319, then run targeted
  specs against it — `reuseExistingServer` is on locally, so those runs skip the export entirely
  (~25s). ⚠️ The guardrail is the stale-`dist` trap above, and it fails SILENTLY: specs pass against
  the previous bundle. Re-export deliberately whenever `src/**` changes.
  **Stagger by blast radius, not by clock:** app-wide changes (root layout, store, navigation, theme,
  persistence) get the full suite; a single surface gets its own specs; the full suite runs at the
  item boundary before commit. ⛔ **Do not raise `workers` to buy speed** — 4 cores, and this repo has
  already spent three CI cycles on a timing-sensitive flake.
- ⛔ **`force: true` does NOT mean "send this event to this element."** It skips actionability but still
  clicks **coordinates**, does not wait for the element to stop moving, and delivers to whatever is
  topmost at that instant. That flaked `tutorial-invite › the tabs are held…` **three times** (CI
  2026-08-10 · local 08-11 · local 08-18, the last one red a release gate) — the test's subject was the
  tab-press LISTENER, but measured with `elementFromPoint` the topmost node there is
  `tutorial-scrim-blocker`, so it was really asserting on the scrim's layout. ✅ **Fixed 2026-08-18** with
  `dispatchEvent('click')`, which fires on the ELEMENT — no coordinates, no stability requirement.
  ⚠️ The failure mechanism was never reproduced (an instrumented full-suite run came back green), and
  the old "the session had ended" note was never proven — **`shell` is ruled out** (provider and coach are
  both in the root layout). **When the subject is a handler rather than a hit-target, use `dispatchEvent`.**
- **Driving gestures in e2e:** gesture-handler's pan is a **touch** gesture — a Playwright mouse
  drag registers as a tap. Drive real touch via CDP (`Input.dispatchTouchEvent`). ⚠️ **Those
  coordinates are VIEWPORT-relative**, and `boundingBox()` on a row far down a long screen returns
  a y outside the viewport, so the touch lands on nothing: the gesture never fires and the symptom
  is a bogus "subtree intercepts pointer events". **`scrollIntoViewIfNeeded()` first, measure after.**

## Standing constraints

- **Never push to `release/v1`** — it is the default branch and gated on an approved version.
  Work happens on `v1.7-dev`.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission**
  (`git grep QA_TOOLS`). It is what makes the demo reachable at all.
- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT
  (3.2.x ships broken) · `react-native-ios-utilities ^5.2.0`.
- **`expo.name` stays `"Debt Planner (RN)"`** — it derives the Xcode project name, hardcoded
  10× across three pipelines. The Home-Screen name is `ios.infoPlist.CFBundleDisplayName`.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

## ⛔ react-native-web silently drops native APIs — and this class has bitten THREE times

`accessibilityElementsHidden` (fences nothing) · `locateFile` (six hand-written copies) · and now
**`Alert.alert`, which is literally `static alert() {}` in `react-native-web@0.21`** — an empty function.
A message written with it ships on iOS and is **discarded on web**, and no Playwright assertion can tell
that apart from a message nobody wrote. It was found only because a new e2e failed against a fix that was
correct. **11 raw call sites existed, 8 of them in `paywall.tsx`** — behind the live public embed, where
a visitor taps Buy and nothing happens.

All three are now `no-restricted-syntax` rules in `apps/rn/eslint.config.mjs`; `notify` /
`confirmDelete` / `confirmDiscard` in `@/utils/confirm` are the owners.
⚡ **The general rule: the FIRST time an RN API is used, check what react-native-web does with it —
before trusting a green suite.** The web build is what every Playwright test runs against, so anything
RNW drops is invisible to the whole gate.

## Two rules the engine keeps re-teaching

- **One rule, one owner.** "Two places, one rule" produced three separate defects in Wave A
  alone — two debt shapes in one directory, one premium ternary on two screens, one claim in
  four strings. Agreeing copies are still copies; they just have not diverged *yet*.
- **Never claim an outcome you only sometimes deliver.** Two shapes of this shipped: an
  affordance gated on a **proxy** rather than the thing it promised, and one whose **resource
  was bounded** so a `Math.min` capped it short of its own claim. Both read as honest code.
