# AUDITOR B — job ②: the guards, and the gate that cannot see them

**Pin:** brief pinned `4b58d75`; working tree at `22b4909` (one docs-only commit on top). Branch `v1.7-dev`.
**Scope taken from the instrument, not from the brief:**

```
npm run lint:finding-guards   → ✅ 57 of 73 carry a standing guard; 16 unguarded (cap 16, downward-only)
npm run lint:s1-coverage      → ✅ 188 surface files classified · 116 unswept
npm run lint:s0-coverage      → ✅  91 surface files classified ·  48 unswept
npm run test:app              → ✅ App-layer regression tests: ALL PASSED
npm run test:gate-plants      → ✅ all 5 gates fail closed on a planted defect
npx playwright test --config apps/rn/playwright.config.ts \
    bill-category-partition goal-row-saved guardian-shortfall-topup plan-hero-conserves
                              → ✅ 12 passed (2.4m) — the first execution these four have ever had
```

**Counts confirmed: 73 ids · 57 guarded · 16 unguarded.** The 57 sit in **31 distinct files** — **38 in
test files, 19 in non-test files** (16 gate scripts, 2 app sources, 1 JSON inventory). The 16 `unguarded`
are the S0.13 backlog and are not reported here, per the brief.

**Every one of the 57 was opened and its assertion located.** The per-entry ledger is at the bottom of
this file and is the deliverable the next pass extends.

---

## 1. Result

| severity | count |
|---|---|
| **blocker** | 0 |
| **major** | 1 |
| **minor** | 2 |
| could not determine | 0 (one stated limitation — §4) |

> 🎯 **The 38 test-file guards are real — every one opened at its assertion, and the `$400` vacuity the
> brief warned about is genuinely closed; the four specs written yesterday had never been executed by
> anything, so I ran them and all 12 tests pass. The hole is the other half: seven registry entries are
> guarded by an identifier inside a gate script's own source, and I measured that all seven stay GREEN with
> the original defect planted back — three of them being the three fixes to `check-finding-guards.ts`
> itself, the gate that certifies all 57.**

⛔ **Every count in this file came from the instrument or from a command I ran, never from the brief.**
The one list I built by hand (the guard files) was generated from `finding-guards.json` by a script in the
system temp dir, not typed.

---

## 2. Sweep — blocker + major

### ⛔ MAJOR — B-1 · Seven registry entries are guarded by an identifier the un-fix does not touch, and `test-gate-plants` covers none of the seven gates

**User-facing consequence.** Seven CI gates — including the three fixes that made the finding registry
itself trustworthy — can be reverted to their original fail-open behaviour with `npm run lint:rn` fully
green and the registry still printing *"57 of 73 findings carry a standing guard"*, so the guard on a
shipped money defect can quietly stop guarding while the ledger says it is closed; that is how the next
blocker ships.

**Mechanism.** `check-finding-guards.ts:128-142` proves a token is present on a non-comment line. For a
guard living in a *test*, the token names an assertion and deleting the assertion deletes the token. For a
guard living in a *gate script*, the token names an identifier in that gate's own logic — and the defect
can be restored without touching the identifier.

**Measured, both directions.** I copied each gate file to temp, applied the smallest edit that restores
the ORIGINAL defect as the registry states it, and re-ran the registry's own `present()` / `presentInCode()`
logic (transcribed verbatim from `scripts/check-finding-guards.ts:128-166`) over the reverted text. **Every
plant applied** (`plant-applied=YES` on all 14, so no row is reporting on an edit that never happened), and
**three controls red**, which is what makes the eleven greens mean something. No repo file was written —
the probe reads the repo and mutates only in memory; `git status` shows only the four auditor reports.

```
S1P1-M8-STRICT      plant=YES · registry GREEN ⛔  revert `ids.length !== MIN_ENTRIES` → `<`   (token `keyLines` untouched)
S1P1-M7-CODELINE    plant=YES · registry GREEN ⛔  delete the CALL to presentInCode; helper stays
S1P1-M6-BOUNDARY    plant=YES · registry GREEN ⛔  revert `lead` to '' (plain containment)     (token `startsWithName` still used)
S1P1-M10-AUTHORING  plant=YES · registry GREEN ⛔  `if (false && WORKING_TREE)`
D69-INVENTORY       plant=YES · registry GREEN ⛔  `if (missing.length || stale.length)` → `if (stale.length)`
S1P1-M9-VOCAB       plant=YES · registry GREEN ⛔  `if (false && !VALID_CLAIMS.has(v))`
S1P1-M9-ROUTING     plant=YES · registry GREEN ⛔  `if (false && !KNOWN_SURFACES.has(r.to))`
--- controls, and they are what make the above falsifiable ---
REVERIFY4-1         plant=YES · registry REDS  ✅  the token IS the refusal message
S1P1-M5-CHAIN       plant=YES · registry REDS  ✅  the token IS the fix (membership in the GATES array)
REVERIFY4-4         plant=YES · registry REDS  ✅  on a rename — and see below for the behavioural case
```

**⚡ The sharpest of the seven is `S1P1-M7-CODELINE`, and it is the shape its own fix was written against.**
`check-finding-guards.ts:107-119` cites `tested-helper-is-not-a-used-helper` by name — *"the clamp existed,
was correct, and was tested while the defect shipped, because what was missing was the call."* Deleting
`if (!presentInCode(text, e.token)) {` at `check-finding-guards.ts:225` leaves the correct helper defined at
:145, leaves the token on a code line, and returns the gate to accepting a guard that exists only in prose —
the [M7] defect, verbatim, with the registry green. Measured above.

**And the harness that could have caught this covers none of them.** `scripts/test-gate-plants.ts:54-92`
holds five scenarios: `lint:month-arithmetic`, `lint:local-dates`, `lint:glossary`, `lint:a11y-props`,
`lint:type-scale`. Ran it: all five fail closed. **Not one of the seven gates above is among them.** I then
searched the whole repo for any harness that executes those gate scripts:

```
rg -l "check-audit-closure|check-committed-secrets|check-finding-guards|check-type-scale|
       preflight-native-lane|strings-inventory|surface-coverage|write-gate-status"
  →  package.json · scripts/gateSources.ts · scripts/begin-gate-run.ts · scripts/lib/stripCode.ts
     · scripts/test-gate-plants.ts · and each script's own source. Nothing else. No test file.
```

`check-type-scale.ts` is the sole exception and it is the proof of the remedy: **`REVERIFY4-4` is the one
gate-script finding with a real behavioural guard**, because `test-gate-plants.ts:83-90` plants
`fontSize: 40` + `allowFontScaling={true}` — literally REVERIFY4-4's original defect — and I measured it
`planted=exit 1 · control=exit 0`.

**Confidence: high.** The plant table is a textual property of the seven files, measured with the gate's own
matcher, and the site enumeration is a repo-root `rg` with no directory list and no `head` (rule 5).

**Would anything catch it?** No. `lint:finding-guards` is green by construction in all seven cases;
`test:gate-plants` does not touch those gates; there is no unit test. The only thing standing between these
seven and a silent regression is a human reading the diff.

**Remedy (three parts, and they fail independently).**
1. Add a `test-gate-plants` scenario per gate — the fixture for `check-finding-guards` is a temp registry
   with a comment-only guard (reds [M7]), a token that is a strict prefix of a renamed identifier (reds
   [M6]) and an entry count one above `MIN_ENTRIES` (reds [M8]).
2. For the two `surface-coverage` predicates, a scenario is a scratch claims file with an unknown claim
   word and a routing to an unknown surface.
3. Where a plant is genuinely disproportionate, re-point the registry token at the **line that would have
   to change** — e.g. `S1P1-M8-STRICT` → `ids.length !== MIN_ENTRIES` rather than `keyLines`. That is a
   registry edit, not a code change, and it converts four of the seven at zero runtime cost.

---

## 2b. Sweep — minor

### B-2 · `check-audit-closure.ts`'s two downward-only caps use `>`, which is the [M8] slack shape its sibling had fixed one file over

`check-finding-guards.ts:188-217` was corrected in this very fix range to strict equality, and its own
docstring names the mechanism: *"`MAX_UNGUARDED` was `>`, so it acquires the identical slack the moment one
backlog entry is guarded"*, and cites `check-committed-secrets.ts`'s `!==` as the sibling that had it right.
**`check-audit-closure.ts` has the same cap shape and was not touched** — `:200` `if (d37Untokenised.length >
MAX_UNTOKENISED.d37)` and `:271` `if (p68Untokenised.length > MAX_UNTOKENISED.p68)` against
`const MAX_UNTOKENISED = { d37: 55, p68: 48 }` at `:149`. This is rule 5 in its usual form: the fix enumerated
the sites it could see.

**Measured, and it is why this is `minor` and not `major`:** `npm run lint:closure` prints
`55 of 55 … (cap 55)` and `48 that DO trace, 48 … (cap 48)`. **Zero slack today**, so no instrument is
blinded right now and the gate can still catch a rise. ⚠️ **It becomes a `major` the first time either
count improves** — 55 → 54 opens one permanent slot for a closure to stop tracing unseen, with nothing
redding. Fix is two characters plus the same "lower it in the same edit" message its sibling already prints.

### B-3 · `plan-hero-conserves.spec.ts`'s docstring claims a protection the test that carries the finding does not provide

`plan-hero-conserves.spec.ts:14` states: *"The specific measured figures are asserted too, so a hero that
renders no segments at all cannot satisfy a sum of `0 === 0`."* **That is true of the healthy test (`:85`
`expect(p.required).toBe(950)`) and false of the SHORTFALL test, which is the one carrying
`S1P1-M4-CONSERVES`** — it asserts no specific figure at all (`:60-70`).

The protection is real but comes from a different mechanism than the one the comment names: `:63-64`
`expect(p.headline).not.toBeNull()` / `expect(p.required).not.toBeNull()` mean a label that failed to yield
those fields reds before the sum is compared. So **no instrument is blinded** → `minor`. It is recorded
because rule 1 is exactly this: a docblock added by a fix, asserting a measured property, that the next
reader will cite as proof. The honest repair is a measured figure in the shortfall test too — under the fix
the invariant is `required + spokenFor + flexible === 1000`, and under the original `required` alone was
`summary.requiredTotal = 1400`, so any non-negative pair of siblings gives `≥ 1400 > 1000` and the sum
assertion reds either way.

---

## 3. Measured, and NOT a defect

**No blocker or major in the 38 test-file guards.** Every one was opened, the assertion located by line, and
checked against the ORIGINAL defect as the registry states it. All 38 red. The per-entry ledger below names
each one. Specifically:

- **The `$400` vacuity the brief flagged is closed, and I re-measured the close.**
  `guardian-shortfall-topup.spec.ts:57` asserts `card.toContainText(/about \$400 short/)`. Site count over
  `apps/rn/src` + `packages/core` for `about $`: **14 sites, listed in full, not sampled.** Only
  `buildGuardianBrief.ts:290` produces `about $X short of the …`. The two near-misses are
  `AffordabilityCard.tsx:123` (`you'd come up about $X short`) and `widget/snapshot.ts:46` — and
  `AffordabilityCard` is a **sibling** of `PaydayGuardianCard` at `index.tsx:440`, not a child of
  `testID="payday-guardian-card"` (`PaydayGuardianCard.tsx:183`), so the scope holds. The `RecoveryPlanSection`
  string that made the original assertion vacuous is likewise outside the card.
- **`Your line's held`** (the covered-cycle control at :90) — 2 sites: `buildGuardianBrief.ts:342` and its own
  regression test. Unique on screen.
- **Rule 7 (absence before render) is satisfied everywhere it applies.** Every `toHaveCount(0)` in the guard
  set is preceded by a positive assertion, and in four specs the positive is the *honest state by name*
  rather than a generic marker: `progress-hero-journey.spec.ts:160` (`Some balances couldn't be read`, which
  exists exactly once in the app, `progress.tsx:204`), `goal-row-saved.spec.ts:82`, `no-bills-branch.spec.ts:151`
  (`required-outstanding-count` = `'2'`), `recovery.spec.ts:66-67`.
- **Rule 6 (an earlier assertion redding first) is handled in the one place it bites.**
  `bill-category-partition.spec.ts:51-54` deliberately waits on a **row** (`Rent`) and not a heading, with
  the reason written down: waiting on `Housing` would make the helper red first under the
  "everything resolves to Other" plant, so the in-test heading assertions would never run.
- **`S1P1-B2-CARD`'s token points at the CONTROL test, not at the blocker test** (`intent-undo.spec.ts:53`,
  not :76). This is **deliberate and the registry says so** — its `what` reads *"This is the property that
  must SURVIVE the fix."* The blocker itself is tokenised twice at unit level (`S1P1-B2-INVALIDATE`,
  `S1P1-B2-DOORS`), and `index.tsx:622` renders the card only when `intentRollback` is non-null, so pinning
  `intentRollback === null` pins the card. The untokenised e2e at :76 is redundancy, not the only guard.
- **`GUARDED-5`'s token is an implementation identifier** (`invariants.ts:214`) — but the class is genuinely
  covered next door: `audit.test.ts:221` calls `priorityGoalIsCapped` directly on an uncapped fixture and
  throws, and `GAP-1` (`audit.test.ts:196`) guards its *reachability*. Dropping it from the `INVARIANTS`
  array alone is still silent — that is `GAP-2`, already on the unguarded backlog. **Not a new finding.**
- **`S1P1-M1-CALL`'s token is a call site in `money.tsx`** — presence-only, but it is the right shape
  (`tested-helper-is-not-a-used-helper`: the missing CALL was the whole defect) and the behaviour is
  independently pinned by `bill-category-partition.spec.ts` on **both** the list and the receipt.
- **`S1P1-M9-ROOTS` has a two-key lock and is sound.** The token is the literal path
  `apps/rn/src/app/(tabs)/index.tsx` inside `scripts/surface-coverage.s1.json`. Narrow the roots back to an
  inclusion list and the file leaves the walk, the entry becomes `STALE`, and `surface-coverage.ts:439` reds
  (`for (const f of stale) … process.exit(1)`); delete the JSON line instead and `lint:finding-guards` reds.
  Either move is caught.
- **`REVERIFY4-3` still prints and does not red** — confirmed at `strings-inventory.ts:549-554`
  (`console.log`, no `process.exit`), and `:541-547` records that the direction is deliberate, copied from
  `check-apostrophes.ts:296-301`. Auditor A's item; I am confirming it is unchanged, not re-opening it.
- **The four self-ratcheting constants are honest human ratchets, not blind guards.**
  `MAX_UNTOKENISED` (`check-audit-closure.ts:149`), `MIN_CHECKS` (`preflight-native-lane.ts:573`),
  `MIN_SCENARIOS` (`test-gate-plants.ts:96`), `MAX_EXEMPT` (`check-committed-secrets.ts:60`) all red when the
  thing they count moves; only a human editing the constant defeats them, and each docstring says exactly
  that. My plants against these four moved the constant, which is not a fair plant. **They are excluded from
  B-1's seven for that reason.** (`MAX_UNTOKENISED` carries a separate craft issue — see B-2.)

**Measured green at HEAD (so no guard in this set is red-for-an-unrelated-reason):** `npm run test:app`
(all app-layer suites, which is where 16 of the 38 live), `npm run test:gate-plants` (5/5 fail closed, tree
clean afterwards), `lint:finding-guards`, `lint:s0-coverage`, `lint:s1-coverage`, `lint:closure`, `lint:lane`,
and the four never-before-run Playwright specs (**12 passed, 2.4m** — see §4).

**Every guard file is reachable from a runner, checked rather than assumed.** `runAppTests.ts` registers
`guardianSelectors.test` :23, `storeActions.test` :39, `migrations.test` :230, `trustSelectors.test` :235,
`migrationAudit/audit.test` :239, `migrationAudit/hostile.test` :248. `testBuildGuardianBrief` is imported by
`packages/core/testing/runRegressionTests.ts` (the only non-registry reference in the repo).
`playwright.config.ts` sets `testDir: './tests/e2e'`, so all 11 spec files are in scope by directory, not by
an inclusion list. `lint:finding-guards` itself is in the `lint:rn` chain at `run-gates.ts:56`.

---

## 4. Could not determine

**Nothing is left undetermined, but one limitation must be stated so the next pass does not read more into
this file than it earned.**

### The e2e guards are argued red-on-defect by reading plus a green run — not by a plant, because I am read-only

I am forbidden from editing source, so I could not do for the e2e guards what I did for the gate scripts:
restore the original defect and watch the assertion red. What I did instead, for each of the 22 e2e guards:
located the assertion, established what the ORIGINAL defect renders, and checked what **else** on the page
could satisfy the locator (rule 10) — including the `about $` site count and the `AffordabilityCard`
sibling check in §3. **The remaining risk is a locator that resolves to the right element for the wrong
reason under a defect I cannot instantiate.** What would close it: a `--plant` mode for the e2e suite in the
shape of `test-gate-plants.ts`, or one plant-and-revert per guard by whoever holds write access.

**The one open question I had here is now closed by measurement.** The commit carrying all four new specs
(`e2b6627`) is **local only** — `git branch -a --contains e2b6627` returns only `v1.7-dev`, the newest CI run
(`32971726870`) is against `78c6020`, and `gate-status.json` records `sha: 78c6020…` with `"dirty": true`.
So nothing had ever executed them. I ran them: **12 passed (2.4m)**. In particular `getByRole('dialog')` —
which appears at `bill-category-partition.spec.ts:102` / `:126` and **nowhere else in the whole e2e tree**,
so it had no precedent — resolves cleanly with no strict-mode violation, as
`react-native-web/dist/exports/Modal/ModalContent.js:44` (`role: active ? 'dialog' : null`) predicts for the
RN `Modal`s at `FormSheet.tsx:125` / `AnimatedSheet.tsx:95`. `git status` after the run: clean but for the
four auditor reports.

---

## 5. Swept and found clean — BY PATH

Every path I opened. A file listed here has been read at the parts named; extend rather than re-read.

**The registry and the gates that consume it**
- `scripts/finding-guards.json` — all 73 entries enumerated mechanically, grouped by guard file
- `scripts/check-finding-guards.ts` — read in full; `present` :128, `presentInCode` :145, floors :188-217
- `scripts/run-gates.ts` — `GATES` :31-74, incl. `lint:finding-guards` :56 and `test:gate-plants` :73
- `scripts/test-gate-plants.ts` — read in full; 5 scenarios :54-92, `MIN_SCENARIOS` :96, harness :120-169
- `scripts/surface-coverage.ts` — `KNOWN_SURFACES` :100, `VALID_CLAIMS` :121, roots :172/:203, verdict :439-450
- `scripts/surface-coverage.s1.json` — head + the `(tabs)/index.tsx` entry :5
- `scripts/check-audit-closure.ts` — `MAX_UNTOKENISED` :149 and its two comparisons :200, :271
- `scripts/check-committed-secrets.ts` — `MAX_EXEMPT` :60 + :305, `cat-file` :148-155, `WORKING_TREE` :206-208
- `scripts/check-type-scale.ts` — `isClamp` :122-139
- `scripts/preflight-native-lane.ts` — `MIN_CHECKS` :573-589
- `scripts/strings-inventory.ts` — the stale-baseline block :534-556
- `scripts/write-gate-status.ts` — the refusal :97
- `gate-status.json`, `package.json`, `apps/rn/package.json`, `apps/rn/playwright.config.ts`,
  `apps/rn/src/testing/runAppTests.ts` (registration lines for every unit guard file)

**Test-file guards (all opened at the assertion)**
- `apps/rn/src/store/guardianSelectors.test.ts` :1-60, :190-215, :265-345
- `apps/rn/src/store/storeActions.test.ts` :150-270, :640-730
- `apps/rn/src/store/trustSelectors.test.ts` :30-70
- `apps/rn/src/data/migrations.test.ts` :25-215
- `apps/rn/src/data/migrationAudit/audit.test.ts` :135-235
- `apps/rn/src/data/migrationAudit/hostile.test.ts` :32, :107
- `apps/rn/src/data/migrationAudit/invariants.ts` :214-241
- `packages/core/guardian/testBuildGuardianBrief.ts` :32-72
- `apps/rn/tests/e2e/bill-category-partition.spec.ts` — full
- `apps/rn/tests/e2e/goal-row-saved.spec.ts` — full
- `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` — full
- `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` — full
- `apps/rn/tests/e2e/no-bills-branch.spec.ts` — full
- `apps/rn/tests/e2e/misfiled-expense.spec.ts` :100-257
- `apps/rn/tests/e2e/intent-undo.spec.ts` :38-107
- `apps/rn/tests/e2e/data-recovery.spec.ts` :118-190
- `apps/rn/tests/e2e/progress-hero-journey.spec.ts` :136-170
- `apps/rn/tests/e2e/goal-pace-edit.spec.ts` :137-172
- `apps/rn/tests/e2e/recovery.spec.ts` :38-90

**App sources read to check what could satisfy an assertion (rule 10) and to confirm a selector exists**
- `packages/core/guardian/buildGuardianBrief.ts` :290, :342
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx` :183 (the `testID` the M3 guard scopes to)
- `apps/rn/src/components/plan/AffordabilityCard.tsx` :123-126 (the near-miss copy)
- `apps/rn/src/components/plan/RequiredActionsCard.tsx` :123, :141, :169 (the three B5 testIDs)
- `apps/rn/src/app/(tabs)/index.tsx` :165, :245, :440, :622-627 (`intentRollback` consumers, `AffordabilityCard` placement)
- `apps/rn/src/app/(tabs)/progress.tsx` :204
- `apps/rn/src/app/(tabs)/money.tsx` :171, :760 (the testIDs the B4 / receipt guards drive)
- `apps/rn/src/store/store.ts` :321-351, :643-674 (the `set`-wrapper invalidation B2 turns on)
- `apps/rn/src/components/ui/FormSheet.tsx` :125, `apps/rn/src/components/ui/AnimatedSheet.tsx` :95
- `apps/rn/node_modules/react-native-web/dist/exports/Modal/ModalContent.js` :42-44

**Not opened, and deliberately:** the 16 `unguarded` registry entries' backlog (brief says confirm the count
and move on — confirmed at 16), and `S0-GUARDS-4.md` / `S0-REVERIFY-4.md` (auditor A's job ①).

---

## Appendix — the per-entry ledger, all 57

Legend — **SOUND**: the assertion was located and it reds on the ORIGINAL defect. **PRESENCE-ONLY**: the
token names an identifier, not an assertion. **RATCHET**: a downward/upward-only constant that reds when the
thing it counts moves.

### Test-file guards — 38 of 38 SOUND

| file (runner) | id | the assertion, by line | why it reds on the original |
|---|---|---|---|
| `store/guardianSelectors.test.ts` (`test:app`) | `S1-M9-GUARDIAN` | :212 `eq(twoEfs?.isEmergencyFund, false)` | fixture is **two** emergency goals, larger second (:204-211); `goal.type === 'emergency'` returns `true` |
| | `S1P1-M3-SELECTOR` | :299 `eq(brief?.state,'at-risk')` | own anti-vacuity precondition at :298; controls at :309/:315/:320 kill a blanket `at-risk` |
| | `S1P1-M3-AFFORD` | :334 `verdict === 'short'` | + `shortBy === 150` :335 and a covered counter-fixture :340 that a blanket `0` reds |
| `guardian/testBuildGuardianBrief.ts` (`test:regression`) | `S1P1-M3-BAND` | :72 `at-risk` on `{shortfall:180, discretionary:400}` | the repair of pass 1's rule-2 miss; the old `discretionary: 0` row survives at :57 |
| `store/storeActions.test.ts` (`test:app`) | `S1P1-B2-INVALIDATE` | :701 `intentRollback === null` after an unrelated `addGoal` | + :703 the edit survives, :704 the payment is not reversed; survive-control :694 |
| | `S1P1-B2-DOORS` | :711 `importStore`, :718 `reset()` | + :713 the restored portfolio is not replaced |
| | `S1P1-B3-SOURCES` | :202 `.amount === 70`, :203 `.goalId === 'S1'` | the $70 teleport, on the two-goal fixture the old coverage never had |
| | `S1P1-B3-DOUBLEUNDO` | :223 `bal('S1') === 500` | the "$50 from nothing"; + :227 a repeated undo is a no-op |
| | `S1P1-B3-INVARIANT` | :237 `cycleTopUp.amount === moved` (computed) | + :238 `moved === 130`, so `0 === 0` cannot satisfy it |
| | `S1P1-B3-LEGACY` | :255 an `entries`-less blob still reads/undoes | over-match guard for a mid-cycle upgrade |
| | `S1P1-B4-PREPARE` | :669 `viaConvert.balance === 200` as EQUIVALENCE to `addDebt` | control bill deliberately seeded :661 so "did not delete" ≠ "nothing to delete" |
| `store/trustSelectors.test.ts` (`test:app`) | `S1P1-B1-OWNER` | :55 `'debt-free-unverified'` from two blank balances; :58 `'debt-free'` false | celebrate-anyway control :69 stops the blanket suppression |
| `data/migrations.test.ts` (`test:app`) | `S1-BLOCKER-1` | :44 table row + loop :68-77 + predicate :91 | `Number('')` is 0 → original stamps `recovered`; `CASE_FLOOR = 12` :57 stops row deletion |
| | `S1-ABSENT-REQUIRED` | :132 floor; substantive loop :162-169 | `rows[0][field] === 0` and `repair.kind === 'lost'` per field, one fixture each |
| `data/migrationAudit/audit.test.ts` | `GAP-1` | :196-201 the pace-case corpus filter must be non-empty | exactly the "delete the goals[1] loop in corpus.ts" defect |
| | `GUARDED-3` | :139 `selfCheck`, **called at :41** | poisons `checkAll`, proves `verdict()` throws on a violation and on drift |
| `data/migrationAudit/hostile.test.ts` | `GUARDED-4` | :32 `HOSTILE_FLOOR = 32`, asserted :107 | anti-vacuity: a corpus refused at the door satisfies every invariant |
| `e2e/bill-category-partition.spec.ts` | `S1P1-M1-LIST` | :64-66 + :70-72 | 9 bills crosses the grouping threshold; both classes asserted; helper waits on a row not a heading |
| | `S1P1-M1-RECEIPT` | :124-130 scoped to `getByRole('dialog')` | unscoped, the list behind the sheet satisfies all three — the source says so |
| | `S1P1-M1-SHEET` (AS-1) | :107-113 `expect.poll` on stored `category === 'other'` | AS-1 round-trips `'groceries'`; :103 reds first under the same defect |
| `e2e/goal-row-saved.spec.ts` | `S1P1-M2-SAVED` | :39 accessible name `/\$5,000 saved/` | original printed `$1,000 saved`; scoped to the row, not the hero |
| | `S1P1-M2-BRANCHES` | :55 `$2,000 saved`, :58 `$1,500 left` | anti-over-match pair |
| | `S1P1-M2-UNREADTARGET` (AS-2) | :82-83 positive, :85 absence, :88 neighbour | rule 7 in the right order |
| `e2e/guardian-shortfall-topup.spec.ts` | `S1P1-M3-RENDER` | :57 `card.toContainText(/about \$400 short/)` | the repaired vacuity — see §3 for the 14-site count |
| `e2e/plan-hero-conserves.spec.ts` | `S1P1-M4-CONSERVES` | :67 `sum === headline`, guarded :63-64, fixture proved short :70 | original `required = 1400` under a `$1,000` headline |
| | `S1P1-M4-NOTZERO` | :85 `required === 950` | anti-`required = 0` |
| `e2e/no-bills-branch.spec.ts` | `S1P1-B5-COUNT` | :148 absence + :151 `required-outstanding-count === '2'` | both-branches marker :145 first; the honest state asserted by name |
| | `S1P1-B5-TIER` | :163-164 free behaves identically | if these two disagree, the tier decides what is owed |
| | `S1P1-B5-MF6` | :177-181 obligations present, advice absent | reds a fix that deletes `shortfallAdviceOwnedElsewhere` |
| | `S1P1-B5-OBLIGATIONS` | :232 count `=== '5'` | 5 obligations / 6 list entries; the Water bill is what stops the two error modes cancelling |
| `e2e/misfiled-expense.spec.ts` | `S1P1-B4-FLAG` | :131-144 `.toEqual({debts:[…], expenses:['Mortgage','Rent']})` | original deletes exactly one bill; two bills seeded so deletion ≠ never-had-it |
| | `S1P1-B4-ONEWRITE` | :245-256 `.toEqual({debts:['Card:5000','Mortgage:1600'], expenses:[]})` | the `expenses: []` half is load-bearing; the debt appearing already worked |
| | `S1P1-B4-PREFILL` | :208-211 name, amount, and `Quarterly` on the select trigger | original seeded `recurrence` from `editing?.recurrence ?? 'monthly'` with `editing === null` |
| `e2e/intent-undo.spec.ts` | `S1P1-B2-CARD` | :58-68 (the CONTROL, by design — see §3) | reds an over-eager invalidation that deletes the card from the product |
| `e2e/data-recovery.spec.ts` | `S1-BLOCKER-1-E2E` | :167 positive, :168-171 absence | `balance: ''` — the member of the class every prior fixture missed |
| `e2e/goal-pace-edit.spec.ts` | `S1-M9-SHEET` | :168-171 the NOTE asserted positively | `toHaveCount(0)` on the old option would pass on a sheet that never rendered |
| `e2e/progress-hero-journey.spec.ts` | `S1P1-B1-PROGRESS` | :160 positive (`progress.tsx:204`, one site), :161-169 three absences | the positive also caught the first fix's *"Add a debt"* second falsehood |
| `e2e/recovery.spec.ts` | `S1P1-B5-PROXY` | :63 scoped to `recovery-cover-now-names`; :66-70; reveal round-trip :72-74 | was a page-wide proxy that B5 reddened without `summariseNames` changing |

### Non-test guards — 19

| file | id | verdict |
|---|---|---|
| `app/(tabs)/money.tsx` | `S1P1-M1-CALL` | **PRESENCE-ONLY**, correct shape; behaviour pinned by `bill-category-partition.spec.ts` on both sites |
| `data/migrationAudit/invariants.ts` | `GUARDED-5` | **PRESENCE-ONLY**; class covered by `audit.test.ts:221` + `GAP-1`. Residual hole = `GAP-2`, already backlogged |
| `scripts/surface-coverage.s1.json` | `S1P1-M9-ROOTS` | **SOUND** — two-key lock (`STALE` reds, or the token goes) |
| `scripts/run-gates.ts` | `S1P1-M5-CHAIN` | **SOUND** — the token IS the fix; plant reds |
| `scripts/write-gate-status.ts` | `REVERIFY4-1` | **SOUND** — the token IS the refusal message; plant reds |
| `scripts/check-type-scale.ts` | `REVERIFY4-4` | **PRESENCE-ONLY at the registry**, but behaviourally guarded by `test-gate-plants.ts:83-90`; measured `planted=exit 1 · control=exit 0` |
| `scripts/check-audit-closure.ts` | `GUARDED-1` | **RATCHET** — see B-2 for the `>` vs `!==` craft issue |
| `scripts/preflight-native-lane.ts` | `REVERIFY4-5` | **RATCHET** — `total < MIN_CHECKS` reds when a guard stops running; measured 95/95 |
| `scripts/test-gate-plants.ts` | `GAP-16` | **RATCHET** — `SCENARIOS.length < MIN_SCENARIOS`; measured 5/5 |
| `scripts/check-committed-secrets.ts` | `S1-SECRETS-EXEMPT` | **RATCHET**, and the strict-equality (`!==`) one; reds in both directions |
| | `REVERIFY4-2` | auditor A's — `CLOSED-UNPINNED`, not re-opened here |
| | `S1P1-M10-AUTHORING` | ⛔ **BLIND** — B-1 |
| `scripts/check-finding-guards.ts` | `S1P1-M6-BOUNDARY` | ⛔ **BLIND** — B-1 |
| | `S1P1-M7-CODELINE` | ⛔ **BLIND** — B-1, and the sharpest of the seven |
| | `S1P1-M8-STRICT` | ⛔ **BLIND** — B-1 |
| `scripts/surface-coverage.ts` | `D69-INVENTORY` | ⛔ **BLIND** — B-1 |
| | `S1P1-M9-VOCAB` | ⛔ **BLIND** — B-1 |
| | `S1P1-M9-ROUTING` | ⛔ **BLIND** — B-1 |
| `scripts/strings-inventory.ts` | `REVERIFY4-3` | auditor A's — confirmed still *prints*, does not red (`:549-554`) |
