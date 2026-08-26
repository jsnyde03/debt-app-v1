# AUDITOR A — the two fix sets (jobs ⓪ and ①)

**Pinned:** `bc29dfe`, branch `v1.7-dev`. **Surface:** S1.1's five fixes (`87655e9`) and S0's five
(`REVERIFY4-1`…`-5`). **Bar:** blocker + major.

## Result

**0 blockers · 1 major.**

| | verdict |
|---|---|
| ⓪-1 `Number('')` → `recovered` | **CLOSED** |
| ⓪-2 `readMoney`'s docblock (M17a) | **CLOSED** |
| ⓪-3 `repairMoneyFields` skipped every `undefined` | **CLOSED** |
| ⓪-4 M9 — three names for one goal | **CLOSED** |
| ⓪-5 `lint:secrets` red on every committed tree | **PARTIAL · major** |
| ①-1 `REVERIFY4-1` mid-run drift | **CLOSED** |
| ①-2 `REVERIFY4-2` secrets read the working tree | **CLOSED-UNPINNED** |
| ①-3 `REVERIFY4-3` 13 stale baseline entries | **CLOSED** |
| ①-4 `REVERIFY4-4` `allowFontScaling` as a clamp | **CLOSED** |
| ①-5 `REVERIFY4-5` fail-open `if` in `lint:lane` | **CLOSED** (+ a `minor` on its docblock) |

**The one major, in one sentence:** the ⓪-5 remedy is keyed per **value**, but the class is per **audit
report** — so the next report that quotes a credential-shaped string re-reds `lint:secrets` and therefore
`lint:rn` on every committed tree, and **this report carried four such strings while the gate printed
green**, because the gate is blind to untracked files by design. Measured, and the four were removed
before this file was finished.

**Two verdicts that are not "major" but must not be read as clean:**
- **①-2 is `CLOSED-UNPINNED`.** Nothing in the tree would red if `lint:secrets` went back to reading the
  working tree; its registered token (`cat-file`) also appears in a comment, so `lint:finding-guards`
  counts it among "18 guarded" while nothing guards it. ⚠️ **Aggregating that against the other 17 is
  auditor B's job ②** — do not double-count it.
- **①-3's guard PRINTS, it does not RED.** The original 13-stale condition, restored today, would produce
  a warning and exit 0. That is the finding's own chosen remedy; it is recorded so nobody carries away
  "the stale class now reds".

---

## How this pass measured, so the numbers can be re-derived

Every value below was **printed**, not reasoned to. Ten throwaway probes were run from a scratchpad
(never written into the repo tree); the ones importing app code run with `cwd` inside `apps/rn` so the
`@core/*` and `@/*` aliases resolve. The load-bearing ones:

1. **`p1.ts`** — `runMigrations` over hand-built raw blobs, printing the repaired value and the repair
   `kind` for each input.
2. **`p2.ts`** — a **reverted copy** of `apps/rn/src/data/migrations.ts` (the two S1.1 hunks undone,
   relative imports re-pointed at the aliases) with the *new* tests' assertion tables replayed against
   it. This is the only way to answer *"would it red on the ORIGINAL defect"* with a value rather than
   a reading. ⛔ **The repo file was never touched** — the revert was applied to a copy in the
   scratchpad by a script that asserts both anchors exist before substituting.
3. **`p3.js` / `p7.js` / `p11.js`** — the four `PATTERNS` from `check-committed-secrets.ts`, copied
   verbatim, re-run over `git show HEAD:<the exempted report>`, over synthetic lines, and over the whole
   working tree under `docs/` — printing every match, its SHA-256 and whether the ledger covers it.
4. **`p5.ts` / `p6.ts`** — the real `selectTightTopUp` over seven store shapes, printing the source pot,
   `isEmergencyFund` under both the fixed and the original predicate, and the rendered button label.
5. **`p4.ts`** — `runMigrations` over `createDefaultStore()` and all three `personaScenario` sandbox
   states, printing the repair count, to answer *"who now sees a repairs card that did not before?"*.
6. **`p10.mts`** — `write-gate-status.ts`'s drift diff replayed in memory against the live fingerprint.
7. **`p12.mts`** — `isClamp` copied verbatim from `check-type-scale.ts` and run through the real
   TypeScript parser over eleven JSX spellings, against the pre-fix rule.

⛔ **Nothing in this pass wrote to the repo except this file.** The one gate that writes a committed
artifact (`gate:record`) was exercised only on its two refusal branches, and `gate-status.json`'s md5 is
identical before and after.

Gates run (all permitted, all seconds, all green): `test:app` (**ALL PASSED**) · `lint:secrets` ·
`lint:finding-guards` (18/34 guarded, 16 unguarded — the known backlog) · `lint:copy` · `lint:type-scale` ·
`lint:lane` · `lint:s1-coverage`. ⛔ **`validate:release:rn`, `test:e2e:*`, `test:regression`,
`test:scenarios` and `test:gate-plants` were NOT run** — the first four are forbidden this round, and the
fifth writes a file under `apps/`.

---

## Job ⓪ — S1.1's five fixes

### ⓪-1 — `Number('')` is `0`, so a blank balance was `recovered` — **CLOSED**

**Original finding:** `''`, `'   '`, `','` and `', ,'` reached `Number()` and returned `0`, so `readMoney`
stamped them `recovered`. `money.tsx`'s celebration guard is `r.kind !== 'recovered'`
(`apps/rn/src/app/(tabs)/money.tsx:360`), so a restored backup of blank balances rendered
**"Every balance cleared"** over debts still owed — permanently, because `acknowledgeDataRepairs` MARKS
rather than empties (`apps/rn/src/store/store.ts:752-765`) and the repaired `0`s never change back.

**What the fix did:** `apps/rn/src/data/migrations.ts:79-83` — the comma-strip-then-trim result is tested
for emptiness **before** `Number()` runs, so "no characters left to read" falls to the `lost` branch at
`:85`. The condition is a property of the cleaned string, not an enumeration of blank spellings — which
is the right shape given this repo's six-times-measured law that enumerating spellings under-reports.

**Is the original behaviour gone? Measured** (`p1.ts`, through `runMigrations`, one debt, reading
`store.debts[0].balance` and the recorded repair):

| input | value | kind |
|---|---|---|
| `""` · `"   "` · `","` · `", ,"` · `"\t"` · `"\n"` · `" "` | `0` | **`lost`** |
| `"-"` · `"."` · `"+"` · `"abc"` | `0` | `lost` |
| `"0"` | `0` | `recovered` |
| `"1,200"` | `1200` | `recovered` |

⚡ Note `"\t"`, `"\n"`, `"-"`, `"."` and `"+"` were **not** in the finding and are handled correctly —
the guard is on the condition, not on the four cited spellings.

**Preserved?** Yes, and this is the half worth pressing, because over-matching here would *re-open* the
mirrored defect `.11.12.1` closed (a genuinely cleared debt restored from string money must stay
`recovered`, or the celebration is suppressed for the life of the install). Measured: `'0'` → `recovered`,
`'0.00'` → `recovered`, `'1,200'` → `1200 recovered`, `4000` (a real number) → **no repair at all**.
Nothing that previously parsed to a finite number changed class. `NaN`/`±Infinity` as *numbers* still
fall to `lost` via the `Number.isFinite` test at `:71`.

**Pinned?**
- `apps/rn/src/data/migrations.test.ts:39-51` — a 12-row classification table with a downward-only
  `CASE_FLOOR = 12` (`:58`, checked at `:61-62`), replayed **against the reverted copy**: rows `""`, `"   "`, `","`, `", ,"`
  **RED** (`got kind=recovered`, expected `lost`) and row `undefined` **RED** (`got kind=none
  value=undefined`). **5 of 12 rows red on the original defect.** ⚠️ Reading rule 6: `eq` throws, so the
  `""` row (index 5) is the one that carries the verdict; the later rows never execute. That is
  sufficient — but it means the *absent-field* half of ⓪-3 is pinned by row 12 of the same table and by
  `absentFieldCases()` below it, and the `""` row will always red first if both are un-fixed at once.
- `apps/rn/src/data/migrations.test.ts:85-94` — reproduces `money.tsx`'s predicate over two blank
  balances and asserts `unreadDebts === true`. Replayed against the reverted copy: **`unreadDebts =
  false` → RED**, with both repairs printed as `kind: "recovered"`. This is the assertion that carries
  the *user-facing* claim in a unit test.
- `apps/rn/tests/e2e/data-recovery.spec.ts:148-173` — the rendered-screen half. ⚡ It seeds `balance: ''`
  where every pre-existing fixture in the tree seeded `balance: null`, and it puts the **positive**
  assertion (`getByText('Chase card')).toBeVisible()`) before the `toHaveCount(0)` — reading rule 7,
  correctly applied.
- Wired: `apps/rn/src/testing/runAppTests.ts:230` imports and **calls** `migrations.test`'s default
  export; `npm run test:app` is green with it. Registered as `S1-BLOCKER-1` / `S1-BLOCKER-1-E2E` in
  `scripts/finding-guards.json:2` and `:7`; `npm run lint:finding-guards` is green.

### ⓪-2 — the `readMoney` docblock's false premise — **CLOSED**

**Original finding (M17a):** the docblock asserted *"the string parses or it does not"*, which was false
for `''` — and `.11.12.1` narrowed the celebration guard **on the strength of that sentence**.

**What the fix did:** `apps/rn/src/data/migrations.ts:55-57` keeps the sentence, and `:58-69` immediately
records that it **was false until S1.1**, names the mechanism (`Number('')`), names the consumer that
trusted it (`money.tsx`'s narrowed guard) and states the asymmetry of the two error directions.

**Is the premise now true?** Yes, and this matters more than the annotation: the sentence *"a recovered
value is exactly right"* is now a **true** description of `:79-83`. A comment that describes real
behaviour is no longer a carried premise. The corrected `readMoney` makes the old sentence accurate
rather than merely annotated.

**Preserved?** The three-outcome contract at `:47-49` is untouched, and `dataRepairsCopy`'s split
(`recovered` → *"written in a different format · your plan is using it"*, `lost` → *"could not be read"*)
still receives the same two classes.

**Pinned?** A docblock cannot be pinned by a token check, and it does not need to be here: the sentence's
truth is now enforced by `migrations.test.ts`'s table rather than by a reader. ⚠️ **`S1-BLOCKER-1`'s
registered token is a string inside the TEST, not inside the docblock** — which is the right choice,
because a guard on comment prose would be exactly the failure mode this finding is about.

### ⓪-3 — `repairMoneyFields` skipped every `undefined` — **CLOSED**

**Original finding:** a debt row with no `balance` key reached the store as `balance: undefined`, **no
repair recorded** — in neither the active nor the paid-off list, and every portfolio total `NaN`.

**What the fix did:** `apps/rn/src/data/migrations.ts:113-120` splits the one `fields` parameter into
`required` + `optional`; `:159-162` skips an absent field **only when it is in `optional`**. The four call
sites are `:225-232` (debts: required `['balance','minimumPayment','apr']`, optional
`['originalBalance','scheduledPaymentAmount']`), `:248` and `:249` (both expense lists: required
`['amount']`, optional `[]`), and `:263-269` (goals: required `['targetAmount','currentAmount']`,
optional `['priorityPerPaycheck']`).

**Is the original behaviour gone? Measured** (`p1.ts` for the fixed tree, `p2.ts` for the reverted copy):

| | original | fixed |
|---|---|---|
| debt row `{id,name,dueDate,type,recurrence}` | `balance: undefined`, `minimumPayment: undefined`, `apr: undefined`, **0 repairs** | `balance: 0`, `minimumPayment: 0`, `apr: 0`, **3 `lost` repairs** |
| `debts.reduce((a,d)=>a+d.balance,0)` | **`NaN`** | `0` |
| `filter(d=>d.balance>0).length` / `filter(d=>d.balance<=0).length` | **`0` / `0`** — in neither list | `0` / `1` |
| goal `{id,name,targetAmount:1000,type}` | `currentAmount: undefined`, 0 repairs | `currentAmount: 0`, 1 `lost` repair |

The `NaN` total and the row that is in *neither* list are printed values, not inferences.

**Preserved? — the schema check, verified against the type declarations, not against the docblock.**
`packages/core/storage/debtPlannerStorage.ts:46-68` declares `balance`, `minimumPayment` and `apr`
non-optional and `originalBalance?`/`scheduledPaymentAmount?` optional; `:103-115` (the `Goal` type) declares
`targetAmount`/`currentAmount` non-optional and `priorityPerPaycheck?` optional;
`packages/core/types/livingExpense.ts:4` declares `amount` non-optional. ⚠️ The docblock says *"the six
fields the schema declares non-optional"* — the call sites list **seven entries** over **six distinct
field names** (`amount` appears for two entities). Not a defect; noted so a future reader counting rows
does not think a field went missing.

Measured, on the fixed tree:
- **absent optional fields are still skipped** — `scheduledPaymentAmount` and `priorityPerPaycheck` stay
  **absent from the row entirely** (`'scheduledPaymentAmount' in row === false`) and record **no repair**.
  `originalBalance` comes back as the balance because `raiseOriginalBalance` stamps it *after* the repair
  pass — the test's `OPTIONAL` table states that value rather than `undefined`, which is correct and is
  the sort of thing an over-eager assertion would have got wrong.
- **repair ORDER is unchanged.** `[...required, ...optional]` reproduces the old array order exactly for
  all four call sites, so the order rows appear on the repairs card did not move.
- **a `null`, a `NaN` or an unparseable string behaves exactly as before** — those were never `undefined`
  and never took the skip.

**Who now sees a repairs card that did not before? — measured, and the answer is "no store this app or
v1.6 can produce".**
- `runMigrations(createDefaultStore())` → **0 repairs**. All three `personaScenario` sandbox states
  (`clear`, `tight`, `at-risk`) → **0 repairs** each.
- Every RN write path populates the required fields: `GoalSheet.tsx:131` builds
  `{name,targetAmount,currentAmount,type}`; `SaveForItSheet.tsx:102-110` writes `currentAmount: 0`
  explicitly; `packages/core/imports/debtCsv.ts:303-317` always writes `balance`, `minimumPayment` and
  `apr`.
- **v1.6 cannot produce one either**, checked against the branch rather than argued:
  `git show origin/v1.6-dev:lib/hooks/useGoals.ts` always writes `targetAmount` **and**
  `currentAmount: Number(goalCurrentAmount || 0)`; `lib/hooks/useDebts.ts` always writes
  `apr = Number(debtApr || 0)`; `lib/imports/debtCsv.ts:92` writes `const apr = toNumber(row.apr) ?? 0`.
  So the newly-reported population is exactly the one the finding names — hand-edited, third-party or
  externally-mutated blobs — which is the population the repairs card exists for.
- ⚠️ **The one behaviour that genuinely widened, stated:** `money.tsx:360`'s `unreadDebts` is
  **field-agnostic** — it counts *any* non-`recovered` debt repair, so an absent `apr` now suppresses the
  "Every balance cleared" hero for a genuinely debt-free user restoring such a file, permanently (the ack
  marks, it does not clear). ⛔ **This is not new to the fix**: `apr: null` did the same before it, so the
  looseness is `money.tsx`'s and pre-dates this range. Severity here is `minor` — the fallback hero is
  honest (`$0 · remaining across 0 debts`) rather than false, and the user's own file really is missing a
  number. Recorded so auditor C can judge the `money.tsx` half on its own surface.

**Pinned?** `apps/rn/src/data/migrations.test.ts:108-178` — `absentFieldCases()`, **one fixture per
field**, with downward-only `REQUIRED_FLOOR = 7` / `OPTIONAL_FLOOR = 3` (`:132-135`). Replayed against the
reverted copy: **all 7 required rows RED** (`value=undefined repair=NONE` for every one of
`debt.balance`, `debt.minimumPayment`, `debt.apr`, `goal.targetAmount`, `goal.currentAmount`,
`requiredExpense.amount`, `livingExpense.amount`). ⚠️ Reading rule 6: `absentFieldCases()` runs **after**
the `CASES` loop (`:96`), so if both S1.1 hunks were reverted together the `''` row reds first and these
never execute — but the `CASES` table's own `undefined` row (`:51`) covers the absent-field defect
independently and reds inside that loop, so the absent-field half is never unpinned. Also registered as
`S1-ABSENT-REQUIRED` in `scripts/finding-guards.json:12`. ⚠️ **That entry's token is `REQUIRED_FLOOR`,
which is a presence check on an identifier** — it survives the assertions being gutted as long as the
constant is still declared. The real guard is the test; the registry entry is an index into it.

⚠️ **One residual, and it is `minor`, not a major.** `readMoney` accepts everything `Number()` accepts,
so `'0x10'` → `16 recovered` and `'1e5'` → `100000 recovered` are stamped *"exactly right"*. More
interestingly `'1,20'` (a European decimal comma) strips to `'120'` → `120 recovered`, a 100× error the
user is never asked about. ⛔ **Pre-existing and out of this range** — the comma strip predates `74f2064`
and the app is USD-only — and I am recording it rather than rating it so the next pass has it.

### ⓪-4 — M9: three names for one goal — **CLOSED**

**Original finding:** a second `emergency`-typed goal was called three different things on three screens.

**What the fix did, in three places:**
1. `apps/rn/src/store/guardianSelectors.ts:314` — `isEmergencyFund` is now
   `goal === primaryEmergencyGoal(store.goals)` instead of `goal.type === 'emergency'`.
2. `apps/rn/src/components/entities/GoalSheet.tsx:89-97` — `canBeTheEmergencyFund` asks the engine's own
   owner (`fundsAsSinkingFund` / `primaryEmergencyGoal`, `packages/core/engine/emergencyFund.ts:30-42`)
   with the draft's type **pinned to `emergency`** — i.e. *"would picking it actually make this one?"*.
   `:164-180` renders the real two-option `Select` when the answer is yes, and a `readOnly` one-option
   `Select` with a `note` when it is no.
3. `apps/rn/src/components/ui/Select.tsx:23-45` — a `readOnly` mode whose prop type
   (`{ readOnly?: false; note?: never } | { readOnly: true; note: string }`, `:30`) makes the explanatory
   note **compulsory** at the type level, so a read-only row that says nothing will not compile.

**Is the original behaviour gone? Measured** (`p5.ts`, the real `selectTightTopUp` over a premium, tight
store with two emergency-typed pots, the second larger so `pickTopUpGoal` selects it):

```
selectTightTopUp → {"goalId":"g1","goalName":"Car repair fund","isEmergencyFund":false,…}
picked goal: Car repair fund   type: emergency
FIXED    isEmergencyFund (goal === primaryEmergencyGoal) = false
ORIGINAL isEmergencyFund (goal.type === 'emergency')     = true
button label FIXED    : Move $50 from savings
button label ORIGINAL : Move $50 from your emergency fund
money.tsx meta for that goal: Savings
```

The two screens now agree; before the fix they printed the two strings above about the same goal.

**Preserved? Measured over seven store shapes** (`p6.ts`), because a fix that flips a boolean is exactly
where an over-match lands:

| store | source picked | `isEmergencyFund` |
|---|---|---|
| lone EF | Emergency Fund | **`true`** ✅ the A3.3 case is not broken |
| lone savings | Vacation | `false` |
| EF first + savings (D24) | Vacation | `false` |
| savings first + EF | Vacation | `false` |
| two EFs, bigger **second** | Car repair | `false` |
| two EFs, bigger **first** | EF | **`true`** ✅ the primary *is* the EF, even when a sibling exists |
| two rows sharing one `id` | Vacation | `false` ✅ identity, not id, so a hostile store cannot spoof it |

The "bigger first" row is the one that shows the fix is the **owner rule** and not "always false when
there are two", and it is not asserted anywhere in the tree — recorded here.

**⚠️ `type` is never rewritten — what does that leave inconsistent? I enumerated every consumer rather
than sampling.** `grep` for `primaryEmergencyGoal|fundsAsSinkingFund` returns **20 sites** and for
`type === 'emergency'` **4** (two of which are comments and one is a timeline-item type, not a goal). The
live goal-type reads are: `emergencyFund.ts:31` (the owner itself) and nothing else in `apps/rn` or
`packages/core` outside comments. Every surface that *names* a pot now goes through the owner:
- `money.tsx:952` + `:1022` — the row meta.
- `guardianSelectors.ts:314` — the top-up button (sole consumer, `PaydayGuardianCard.tsx:365`).
- `guardianSelectors.ts:637-639` — `deployTradeoff` / `tradeoffTargetName`, which feeds
  `buildGuardianBrief.ts:378`'s `tradeoffTargetName ?? EMERGENCY_FUND_NOUN`.
- `allocatePaycheck.ts:601-702` — every rung; the labels are goal **names** (`Add to ${emergencyGoal.name}`,
  `:615`, `:688`), never the type.
- `WindfallSheet.tsx:25` and `planSelectors.ts:341` label the **allocation category** `emergency`, which
  only the primary-EF rungs can fill.
- `migrations.ts:341` — the pace stand-down.
- `GoalSheet.tsx:68` — `paceGoverns`, which reads the same rule and therefore keeps showing the pace
  controls for a second EF (correct: it *does* fund through the sinking-fund rungs).

**So the residue of leaving `type` alone is exactly one thing, and the brief already routes it:**
`pickTopUpGoal` (`guardianSelectors.ts:295`) passes `['savings','emergency']` and tests `goal.type`, so a
second emergency-typed pot is *ordered* like the safety net. That is source **selection**, not naming;
it is auditor C's, and I confirm it is the only surviving `type`-based read that a user can feel.
⚠️ I could not find a second one, and I looked for it by enumeration rather than by example.

**Pinned?**
- `apps/rn/src/store/guardianSelectors.test.ts:187-195` — the two-EF fixture. **Would red on the
  original:** the predicate is a one-liner and the printed values above show
  `goal.type === 'emergency' === true` for `Car repair fund` against the asserted `false`. ⚠️ Reading
  rule 6: the earlier assertion on the same object is `goalName === 'Car repair fund'` (`:194`), which is
  unaffected by the defect (`pickTopUpGoal` is untouched), so it passes and the `isEmergencyFund`
  assertion at `:195` is the one that fires. ⚡ Its docblock's claim that **no fixture in the repo carried
  two emergency goals on this path** matches what I found: every other `isEmergencyFund` assertion in the
  file (`:121`, `:168`, `:173`) pins a lone EF or an EF-vs-savings preference, all of which hold under
  both the defect and the fix.
- `apps/rn/tests/e2e/goal-pace-edit.spec.ts:147-172` — the sheet half. It asserts the **note string**, a
  positive assertion only the read-only branch emits, and it checks the primary EF *first* to prove the
  control was not removed for everyone. The `toHaveCount(0)` on the primary's sheet is preceded by a
  positive `getByText('Edit goal')` visibility check — reading rule 7, correctly applied.
- ⚠️ **No `Select.web.tsx` fork exists** (`find apps/rn/src -name '*.web.tsx'` returns 22 files, none of
  them `Select`), so the read-only branch is the same code on iOS native and on react-native-web. The
  e2e above therefore does cover the native rendering path's logic.
- Registered as `S1-M9-GUARDIAN` (`scripts/finding-guards.json:17`) and `S1-M9-SHEET` (`:22`).

### ⓪-5 — `lint:secrets` red on every committed tree — **PARTIAL · major**

⚠️ **The two registered values are closed and the gate is green today. The verdict is `PARTIAL` because
the remedy is per-VALUE and the class is per-AUDIT-REPORT — measured below, on this very report.**

**Original finding:** the gate fired 4 times on the audit report documenting its own plant, so `lint:rn`
was red on every committed tree from `74f2064`.

**What the fix did:** `scripts/check-committed-secrets.ts:59-81` adds a ledger keyed on
`` `${file}::${sha256(matchedText)}` `` (built once, at `:80` — the docblock records that a hand-composed
key diverged at 2 of 3 sites in the first cut). `:203-212` switches `re.test` → `re.exec` so the matched
text is in hand, and skips a hit whose key is in the ledger. `:242-249` reds on a **stale** entry;
`:250-259` reds when the count differs from `MAX_EXEMPT = 2` **in either direction**.

**Is the original behaviour gone? Measured:** `npm run lint:secrets` →
`✅ committed secrets: none across 1182 tracked files in index+HEAD (4 shapes checked, 2 exemption(s), cap 2).`
Exit 0.

**Preserved? — verified by re-running the gate's own scan logic** (`p3.js`: the four `PATTERNS` copied
verbatim, run over `git show HEAD:<the report>`):

```
line 220  Sentry DSN       matched="https://0123456789abcdef0123456789ab␣cdef@o4507.ingest.us.sentry.io/4508"
          sha256=0cb4809412da07cd…  ledger=EXEMPT
line 268  ASC private key  matched="-----BEGIN PRIVATE␣KEY-----"
          sha256=3021d90eb9437b2d…  ledger=EXEMPT
```

**Exactly two matches, both exempt, no third.** ⚠️ The finding text says the gate *"fired 4 times"*; the
report holds **2 matching lines**, which fired once each in `index` and once each in `HEAD` — 4 hits, 2
values. The ledger's two entries are the right count, and the `Set`-keyed `usedExemptions` at `:72` is
why one entry covers both revisions.

**⛔ Can the ledger be widened to hide a real secret? — four routes checked, three closed.**
1. **A different value in an exempted file** — closed. The key is a SHA-256 of the *matched text*, so any
   other credential hashes differently and reds. Demonstrated (`p7.js`, case B): a fabricated live-shaped
   DSN on its own line in the exempted file is reported as a HIT.
2. **The same value in a different file** — closed. The key is scoped by path; a copy elsewhere reds, and
   the original's entry stays used.
3. **Raising the cap** — closed *as far as a gate can close it*. `MAX_EXEMPT` is a source constant and the
   count must equal it exactly, so admitting a third exemption is a deliberate two-file edit that shows up
   in review. It is a ratchet, not a lock; the docblock says so.
4. ⚠️ **A second credential on the SAME LINE as an exempted one, matching the SAME pattern — OPEN, and it
   is `minor`.** `re.exec` returns only the first match, and the exempt branch `return`s from the line's
   callback (`:208-211`), so the rest of that line is never examined for that pattern. Measured
   (`p7.js`, case C): the exempted DSN followed on the same line by
   `https://deadbeefcafebabe1234567890ab␣cdef@o9999.ingest.us.sentry.io/1234567` produces **no hit**; with
   the order reversed (case D) it is caught. ⛔ **Rated `minor`, not `major`, deliberately:** the blind
   spot is two specific lines of one closed audit report, the gate still catches the class everywhere
   else, and I cannot write an honest user-facing sentence for it. Recorded so it is not rediscovered.

**Are the two exempted values what their `why` says? — I opened both lines.**
- **Entry 1** (`scripts/secrets-exemptions.json:2-6`): the `why` says the fence is at `:218-222` and the
  key is the literal hex run with org `o4507`. ✅ The match is at line **220**, inside that fence, and the
  printed match is `…0123456789abcdef0123456789abcdef@o4507…` — an ascending-hex placeholder, not a live
  DSN. The claim checks out.
- **Entry 2** (`:7-11`): the `why` says the bare PEM header sits in a prose sentence at `:268` with no key
  material after it, *"the next characters are a backtick and the words 'and an'."* ✅ The line number and
  the substantive claim are correct — line 268 is
  `` `sk_`-prefixed RevenueCat key and a PEM `-----BEGIN PRIVATE␣KEY-----` — planted into the scratch repo: ``
  and no key material follows. ⚠️ **The corroborating detail is wrong**: after the header come a backtick
  and *"— planted into the scratch repo:"*; *"an `sntrys_` auth token, an"* is on line **267**, i.e.
  before. ⛔ This is `minor` — the security claim holds — but it is exactly reading rule 1's class inside
  the one file whose stated purpose is *"a reader must be able to check it"*, so it is recorded rather
  than waved through. **A `why` that describes the wrong side of the string is a `why` nobody re-checked.**

**Pinned?** ⚠️ **Not by `test:gate-plants`, and the file says so and gives a reason** (`:47-55`): that
harness plants by *creating* an untracked file, which this gate ignores by design. The two live guards are
the stale check and the exact-count check, both of which run on every invocation. Measured indirectly: the
gate prints `2 exemption(s), cap 2`, so both are exercised on a green run. Registered as
`S1-SECRETS-EXEMPT` (`scripts/finding-guards.json:27`) with token `MAX_EXEMPT` — a presence check on an
identifier, so it would survive the two `if` blocks being deleted while the constant stayed. ⚠️ That is a
**weak** guard for a security ratchet; it is auditor B's job ② to rate, and I flag it here because the
thing it guards is a standing permission to carry credential-shaped text in a public repo.

**Reported to a human, and true:** the success line's file count (`1182`) is `scanned.size`, a **union** of
index and HEAD paths, not "1182 files scanned twice". The wording *"across 1182 tracked files in
index+HEAD"* is accurate.

#### ⓪-5 · the open half — **the same red returns with the next report, and it returned with this one**

**User-facing consequence:** the next audit report that quotes a credential-shaped string as evidence —
**including this one, measured** — turns `lint:secrets` and therefore `lint:rn` red on every committed
tree again, and a gate that is red on every commit is a gate whose output stops being read, which is how
a real credential ships.

**Mechanism, measured.** I re-ran the gate's four `PATTERNS` verbatim over the **working tree** under
`docs/` (`p11.js`), because the gate itself only ever looks at `index` and `HEAD`:

```
TRACKED   docs/audits/2026-08-25-…-reverification/S0-REVERIFY-4.md:220   Sentry DSN        (exempt)
TRACKED   docs/audits/2026-08-25-…-reverification/S0-REVERIFY-4.md:268   ASC private key   (exempt)
untracked docs/audits/2026-08-26-s1-money/A-fixes.md:304                 Sentry DSN        ← this file
untracked docs/audits/2026-08-26-s1-money/A-fixes.md:306                 ASC private key   ← this file
untracked docs/audits/2026-08-26-s1-money/A-fixes.md:328                 Sentry DSN        ← this file
untracked docs/audits/2026-08-26-s1-money/A-fixes.md:341                 ASC private key   ← this file
total matches under docs/ in the WORKING TREE: 6
```

⛔ **Four of the six were mine, written while quoting the gate's own evidence** — the same act, in the
same folder, one day later. `npm run lint:secrets` printed **green** the whole time, because an untracked
file is invisible to it *by design* (`check-committed-secrets.ts:136`, the list comes from
`git ls-files` / `git ls-tree HEAD`). ⚡ **So an auditor gets no warning while writing, and the gate reds
only after the commit lands** — which is precisely the sequence that produced the original finding.

**And both exits are closed by the instrument's own text.** Editing the report is *"the rejected
option"* (`:56-57`, GAP-17: regenerating the baseline wider to make a red gate green). Adding two more
exemptions is refused by `:250-259`, whose message reads *"⛔ The cap is DOWNWARD-ONLY. Raising it to
admit a new exemption is the thing this gate exists to stop."* The author of the next report is between
two options the instrument itself calls wrong.

**Confidence: measured.** The six matches above are printed output, not inference. What is inference is
how often a future report will quote a credential shape — though the base rate so far is 2 audit rounds
out of 2.

**Would anything catch it?** Only after the fact, and only by redding `lint:rn`. There is no pre-commit
scan of untracked files, and the docblock's argument for why `test:gate-plants` cannot cover this gate
(`:47-55`) also explains why nothing warns during authoring.

⚠️ **I removed my own four matches rather than shipping the red**: the credential-shaped literals in this
file now carry a zero-width-visible break (`…789ab␣cdef…`, `-----BEGIN PRIVATE␣KEY-----`) so the strings
are readable to a human and match no pattern. Re-running `p11.js` after the edit reports **2 matches under
`docs/`, both the exempted pair.** ⛔ **That is a discipline, not a fix** — and `write-gate-status.ts:12-14`
is the file in this repo that argues a discipline cannot close a class: *"A documentation rule cannot fix
that, because a documentation rule is exactly what failed."* The same argument applies here, which is why
this is filed rather than waved off as "auditors should redact".

**What a remedy would have to do (not built, not proposed as the only shape):** make the gate's scan
reachable over *untracked* files behind a flag (`--working-tree`) and call it from the audit-writing
loop, so an auditor sees the hit before the commit rather than after — or teach the gate that a fenced
`git show`/transcript block inside `docs/audits/**` is evidence rather than a credential, which is a
narrower carve-out than a path exemption but a wider one than a hash.

### ⓪ · the four corrected fixtures — **are the corrections RIGHT?**

The brief asks this specifically, because a fixture "corrected" to a second wrong shape proves nothing.
All four changed a goal literal from `target` to `targetAmount`/`currentAmount`/`type`:

| fixture | claim it makes |
|---|---|
| `apps/rn/src/data/readBackup.test.ts:63-68` | *"field-for-field from v1.6's `buildBackupData()`"* |
| `apps/rn/src/data/detectBackupFormat.test.ts:47-48` | a real v1.6 backup |
| `apps/rn/src/data/legacyBridge/mapLegacyStore.test.ts:60-61` | v1.6's `localStorage` keys |
| `apps/rn/src/store/persistenceLifecycle.test.ts:181-184` | a **native** v1.7 blob |

**Checked against the branch, not against the comment** (`git -C … show origin/v1.6-dev:…`):
- `lib/hooks/useGoals.ts:5-11` declares `Goal = { id, name, targetAmount, currentAmount,
  originalCurrentAmount?, type }`, and `handleAddGoal` (`:50-62`) always writes `targetAmount`,
  `currentAmount: Number(goalCurrentAmount || 0)` and `type`. **`target` is not a key v1.6 ever wrote.**
- `app/page.tsx:578-602`'s `buildBackupData()` emits `goals` **verbatim**, so a v1.6 backup file carries
  that shape unchanged. The correction is right.
- The line the fix cites, `components/GoalsSection.tsx:57`, is
  `const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);` — it exists and says
  what the comment says it says.
- ⚠️ **One key the corrections did NOT carry: `originalCurrentAmount`.** v1.6 *does* write it
  (`useGoals.ts:57`). It is not a money field `repairMoneyFields` touches and nothing in v1.7 reads it, so
  omitting it is harmless — but the fixtures still are not *field-for-field*, and the docstring making
  that claim is where this whole class came from. `minor`, recorded.

**And one correction is more than a rename:** `persistenceLifecycle.test.ts:278-281` added `apr: 20` to
the malformed-balance fixture so the block stays about the **balance**. That is the correct move — without
it the absent `apr` raises a second repair and the assertions stop being about their subject — and the
fixture's other debt fields are complete, so no third repair is hiding. `npm run test:app` is green.

---

## Job ① — S0's five fixes. **This is S0's only verification.**

### ①-1 `REVERIFY4-1` — the freshness record was fingerprinted at the END of the run — **CLOSED**

**Original finding (`major`):** nothing fingerprinted the tree at the START, so a source file edited during
the ~15-minute run was hashed into `gate-status.json` as though the suites had seen it.

**What the fix did:** a new `scripts/begin-gate-run.ts` writes `fingerprintDetail()` to `GATE_RUN_FILE`;
`package.json:55` makes `npm run gate:begin` the **first** link of `validate:release:rn`;
`scripts/write-gate-status.ts:77-88` **refuses to record** when no start record exists, `:90-113` refuses
and prints every drifted path when the two fingerprints differ, and `:130` `rmSync`s the start record so
one capture cannot license repeated hand-run records.

**Is the original behaviour gone? Measured end-to-end, twice, with no repo write:**

```
$ npx tsx scripts/write-gate-status.ts                # no --from-gate
   gate:record is not a standalone command.                                          EXIT=1
$ npx tsx scripts/write-gate-status.ts --from-gate    # no start record present
   gate:record — no start-of-run record, so what the suites ran against is unknown.   EXIT=1

gate-status.json md5 before = 5ec8016f2caa2f444ab5a10679b872b1
gate-status.json md5 after  = 5ec8016f2caa2f444ab5a10679b872b1     <- unchanged, both times
```

⚠️ **`GATE_RUN_FILE` lives in `tmpdir()`, not the repo** (`gateSources.ts:187-198`) and no such file
existed on this machine, so the refusal branch above is the real one, not a simulated one.

The **drift** branch I replayed in memory rather than by doctoring the tmp record (`p10.mts`, which writes
nothing anywhere):

```
live tree: 798 source files · 003100020f658ba7…
start.sourceHash !== hash -> true   (the refuse branch is taken)
     CHANGED apps/rn/src/data/migrations.ts
   1 changed · 0 added · 0 removed
```

**Preserved?** The happy path is untouched, and the direction is the safe one — the new failure mode is a
**false red** (refusing to record a genuinely green run), which costs a re-run and is loud, versus the
false green it replaces. `begin-gate-run.ts:18-22` states that asymmetry explicitly and it is right.

**Pinned? — and this one guards itself, which is the strongest answer available.** Registered as
`REVERIFY4-1` (`scripts/finding-guards.json:32-36`, token `SOURCE MOVED WHILE THE SUITES WERE RUNNING`).
⛔ **That token is a presence check and would survive the `if` around it being deleted** — but the
structural guard does not depend on it: **remove `gate:begin` from the chain and `gate:record` refuses, so
`validate:release:rn` goes red.** Un-fixing the finding breaks the release gate rather than silently
restoring the window. Measured above (exit 1, no write). ⚠️ Not covered by `test:gate-plants` — its five
scenarios are `lint:month-arithmetic`, `lint:local-dates`, `lint:glossary`, `lint:a11y-props`,
`lint:type-scale` (`scripts/test-gate-plants.ts:54-92`), and none of them is this.

### ①-2 `REVERIFY4-2` — `lint:secrets` read content from the working tree — **CLOSED-UNPINNED**

**Original finding (`major`):** the file **list** came from git and the **content** from `readFileSync`,
so the gate printed clean over a `HEAD` holding a live credential.

**What the fix did:** `scripts/check-committed-secrets.ts:134-142` takes the list from `git ls-files -z`
(index) and `git ls-tree -r --name-only -z HEAD`; `:148-176` reads every blob through **one**
`git cat-file --batch` call; `:198-217` scans both revisions.

**Is the original behaviour gone? Verified exhaustively rather than by example.** `readFileSync` appears
in this file at **exactly one line — `:71`, which reads the exemption ledger.** No source content is read
from the filesystem anywhere in the script; the only content source is `execFileSync('git', ['cat-file',
'--batch'], …)` at `:155`. The other occurrences of the string `cat-file` are the docblock at `:148`.

**Preserved?** Yes, and it has a measurable side effect: the gate now scans **1182** paths — the union of
the two revisions — where the old list was `git ls-files` alone. Running it confirms both the count and
the green.

**Pinned? — NO, and that is why the verdict is `CLOSED-UNPINNED`.** Registered as `REVERIFY4-2` with token
`cat-file` (`scripts/finding-guards.json:37-41`). ⛔ **That token would survive the defect being restored**,
because `cat-file` also appears in the docblock at `:148` — re-introducing `readFileSync` for content while
leaving the comment keeps `lint:finding-guards` green. And `test:gate-plants` **cannot** cover this gate by
construction: its plants are untracked files, which this gate ignores by design
(`check-committed-secrets.ts:47-55`). **Nothing in the tree would red if this fix came undone.**
⚠️ I could not construct a discriminating runtime measurement without writing to the repo, which this round
forbids; the exhaustive-grep argument above is the strongest read-only proof available.

### ①-3 `REVERIFY4-3` — 13 stale duplicate-copy baseline entries — **CLOSED**

**Original finding (`major`):** 16 baselined phrases, 3 live, 13 stale — each stale entry a standing
permission to re-duplicate a phrase, including *"Private by design"*.

**What the fix did:** the baseline was **re-recorded**, and `scripts/strings-inventory.ts:548-559` now
computes and prints every stale entry (not a sample) alongside the count.

**Is the original behaviour gone? Measured:**

```
$ node -e "console.log(require('./scripts/duplicate-copy-baseline.json').length)"   ->  3
$ npm run lint:copy
duplicate copy: no new cross-file phrases (3 baselined).
```

**3 entries, 0 stale** — exactly the 3 the prior round computed as live (`"A little tight this paycheck"`,
`"Looks clear this paycheck"`, `"Very tight this paycheck"`). The 13 standing permissions are **gone**, not
merely reported.

**Preserved?** The scanner, the `DUP_MIN_LEN = 14` threshold and the `fresh` computation at `:500` are
untouched, so nothing that was caught before stopped being caught.

**Pinned? — it would PRINT, not RED, and that needs stating plainly.** Registered as `REVERIFY4-3` (token
`no longer duplicate`, `scripts/finding-guards.json:42-46`). Against the original defect state (16
baselined, 13 stale) the fixed code takes the `if (stale.length)` branch at `:549`, prints the 13 phrases,
and then `process.exit(0)` at `:562`. ⛔ **So a return of the exact original condition is reported and
green.** ⚠️ **That is the finding's own recommended remedy** (*"or simply print `N baselined · M stale` the
way `check-apostrophes` does"*), and `:542-546` gives the reason — a gate that reds on copy being swept is
a gate that gets reverted. I record it as correct-by-decision, not as a hole; but a reader must not carry
away "the stale class now reds", because it does not.
⚠️ `--update-baseline` (`:494-496`) still writes wholesale with no downward-only assertion, so the
regenerate-wider escape hatch is unchanged — **registered as `GAP-17`**, the known backlog, not a new
finding.

### ①-4 `REVERIFY4-4` — `lint:type-scale` treated any `allowFontScaling` as a clamp — **CLOSED**

**Original finding (`major`):** `clamped = true` for either prop whatever its value, so
`allowFontScaling={true}` — and the bare spelling, which *means* `={true}` — was reported `ok`.

**What the fix did:** `scripts/check-type-scale.ts:122-139` adds `isClamp(prop)`, judged on the **value**;
`:162` uses `clamped ||= isClamp(prop)` so an element carrying both props keeps a real cap.

**Is the original behaviour gone? Measured over eleven spellings** (`p12.mts` — `isClamp` copied verbatim
from `:122-139` and run through the real TypeScript parser, against `(p) => true`, the pre-fix rule):

```
<Text allowFontScaling />                                    fixed=false original=true  <- DIFFERS
<Text allowFontScaling={true} />                             fixed=false original=true  <- DIFFERS
<Text allowFontScaling={false} />                            fixed=true  original=true
<Text allowFontScaling="false" />                            fixed=false original=true  <- DIFFERS
<Text allowFontScaling={isBig} />                            fixed=false original=true  <- DIFFERS
<Text maxFontSizeMultiplier={1.3} />                         fixed=true  original=true
<Text maxFontSizeMultiplier={LABEL_SCALE_MAX} />             fixed=true  original=true
<Text maxFontSizeMultiplier={undefined} />                   fixed=false original=true  <- DIFFERS
<Text maxFontSizeMultiplier={null} />                        fixed=false original=true  <- DIFFERS
<Text maxFontSizeMultiplier />                               fixed=false original=true  <- DIFFERS
<Text allowFontScaling={true} maxFontSizeMultiplier={1.3} /> fixed=true  original=true
```

⚡ **Seven spellings changed verdict and none of the correct ones did.** `allowFontScaling="false"` — the
*string*, truthy in JS and therefore not a cap — is correctly rejected, and it is a spelling the finding
never mentioned. `{LABEL_SCALE_MAX}` still counts, so the five live sites that use it are not red-gated:
the over-match the fix explicitly set out to avoid did not happen.

**Preserved?** `npm run lint:type-scale` → `every large figure carries a font-scale cap (19 checked).`
No correctly-clamped site was newly flagged.

**Pinned? — YES, by a real plant.** `scripts/test-gate-plants.ts:83-91` plants
`const styles = { hero: { fontSize: 40 } }` plus `<Text style={styles.hero} allowFontScaling={true}>` and
requires `lint:type-scale` to exit non-zero. **Would it fail on the original defect?** Yes — the table
above prints `original=true` for exactly that spelling, so the pre-fix gate exits 0 and the harness reds.
⚠️ **I did not run `test:gate-plants`**: it creates `apps/rn/src/__gate_plant__.tsx`, and this round forbids
me writing under `apps/`. The plant's *sufficiency* is established by the table, not by running it.

### ①-5 `REVERIFY4-5` — `lint:lane`'s ordering checks sat inside a fail-open `if` — **CLOSED**, with a `minor` on its own docblock

**Original finding (`major`):** four flow-ordering assertions inside `if (iphoneList.length)`; a
path-spelling refactor emptied the list and the four checks silently did not run — `87 → 83`, exit 0.

**What the fix did:** three preconditions became **assertions** instead of `if`s —
`scripts/preflight-native-lane.ts:356-361` (`iphoneList.length > 0`), `:362-364` (each of flows
`01/07/08/09/10` is present, so `at()` cannot return `-1` and make `at('07') < at('08')` true *by
absence*), plus the `native-e2e.yml` `jobs:` map and the `terminal flow` step. `:573` adds
`MIN_CHECKS = 95` and `:584-591` reds when fewer assertions ran than expected.

**Is the original behaviour gone?** Yes, and the mechanism is unambiguous: `check()` (`:34-36`) pushes a
false condition into `problems`, and `:576-581` exits 1 **before** the floor is even consulted. An empty
`iphoneList` is now the loudest state rather than the quietest.

**Measured:** `npm run lint:lane` → `native-lane pre-flight: 95 structural checks pass.` —
**95 checks against a floor of 95, i.e. zero slack today.**

**Preserved?** The assertions' contents are unchanged; only their reachability moved. The added
`at(f) !== -1` conjuncts strictly tighten `07 < 08` and `10 < 09` — they cannot pass anything that failed
before.

**Pinned?** Registered as `REVERIFY4-5` with token `MIN_CHECKS` (`scripts/finding-guards.json:52-56`). The
real guard is structural: restoring the `if` drops the count and the floor reds.

⚠️ **`minor` — the floor's docblock claims an enforcement the code does not have.**
`preflight-native-lane.ts:569-571` says the number *"only goes UP … unlike that one it is enforced rather
than described: **see the `>` below**."* ⛔ **There is no `>`.** `grep -rn "MIN_CHECKS" scripts/` returns
five sites and the only comparison is `total < MIN_CHECKS` at `:584` — a floor on the *count*, not a
ratchet on the *constant*. Compare `check-committed-secrets.ts:250`, which really is two-directional
(`exemptions.length !== MAX_EXEMPT`). Two consequences: (a) nothing reds if `MIN_CHECKS` is lowered to
absorb a drop — the error text's *"Do NOT lower"* is a documentation rule, in a repo whose own
`write-gate-status.ts:12-14` argues those cannot close a class; (b) once the check count rises above 95
without the constant following, the difference becomes silent headroom and the original `87 → 83` shape
returns *above* the floor. **Today the gap is zero, so this is latent, and it is the registered `GAP-7`
class** (*"`HOSTILE_FLOOR` can be LOWERED to absorb a fixture that stopped opening"*) **at a different
site** — which is why I file it `minor` and cross-reference rather than minting a major. ⚠️ **`MIN_CHECKS`
is named by no registry entry other than as `REVERIFY4-5`'s token**, so this site is not in the backlog.

---

## Measured, and NOT a defect — recorded so the next pass does not re-open them

1. **`repairMoneyFields`'s repair ORDER did not move.** `[...required, ...optional]`
   (`migrations.ts:159`) reproduces the pre-fix `fields` array exactly for all four call sites
   (`balance, minimumPayment, apr, originalBalance, scheduledPaymentAmount` ·
   `amount` · `amount` · `targetAmount, currentAmount, priorityPerPaycheck`), so the order repairs appear
   on the card is unchanged. Checked by reading both revisions of the call sites, not inferred.
2. **An absent `originalBalance` comes back as the balance, and that is a different, correct feature.**
   Measured: `'originalBalance' in row === true`, value `100`, **0 repairs** — `raiseOriginalBalance`
   (`.11.15`'s high-water mark) stamps it *after* the repair pass. `migrations.test.ts:127-129` asserts
   that value rather than `undefined`, which is the non-obvious right call.
3. **A negative money value is still `repair: 'none'`.** Measured: `balance: -5` → `-5`, no repair.
   Unchanged by S1.1 and already inside the ratchet's `allocatePaycheck` boundary set.
4. **No `Select.web.tsx` fork exists.** `find apps/rn/src -name '*.web.tsx' -o -name '*.web.ts'` returns
   **22** files; `Select` is not among them, so ⓪-4's read-only branch is the same code on iOS native and
   on react-native-web.
5. **`check-committed-secrets.ts`'s four `PATTERNS` carry no `/g` flag** (`:87`, `:92`, `:97`, `:102` — the
   only flag anywhere is `i` on the DSN). ⚡ This matters *because* the fix switched `re.test` → `re.exec`:
   with `/g` the shared `lastIndex` would advance across lines and silently skip them. It does not. Worth
   recording as a trap the next edit to that file can walk into.
6. **`text.split(/\r?\n/)` (`:199`) handles CRLF**, and a NUL byte in a blob does not blind the scan —
   `git cat-file --batch` hands back raw bytes and `buf.toString('utf8', …)` keeps the surrounding text,
   so the regexes still run. (The brief's NUL warning is about `git diff`/`grep`, not this path.)
7. **`secrets-exemptions.json` is itself scanned** — only `scripts/check-committed-secrets.ts` is in
   `SELF` (`:108`). Its two `why` strings contain no pattern-matching text, confirmed by the repo-wide
   scan that returned exactly 2 matches under `docs/` and none elsewhere.
8. **`MAX_EXEMPT` is genuinely two-directional** (`:250`, `exemptions.length !== MAX_EXEMPT`), unlike
   `MAX_UNTOKENISED` (`check-audit-closure.ts:200`, `:271`, `>` only) and unlike `MIN_CHECKS`. The
   docblock's GAP-6 claim about its own cap is true.
9. **No app-generated store produces a new repairs card.** `runMigrations(createDefaultStore())` → 0
   repairs; `personaScenario('clear'|'tight'|'at-risk')` → 0 repairs each.
10. **⓪-4's owner rule is not "always false when there are two".** Measured: with two emergency-typed
    pots and the **larger one first**, `pickTopUpGoal` selects the primary and `isEmergencyFund` is
    correctly **`true`**. No test in the tree covers that row.
12. **The corrected-fixture sweep is complete.** A repo-wide search for a goal literal carrying a bare
    `target:` returns **2** remaining sites — `guardianSelectors.test.ts:78` and `:237` — and both are the
    file's own test-helper DSL, mapped at `:47` to `targetAmount: g.target ?? 5000`. No persisted-shape
    fixture still carries the key v1.6 never wrote.
11. **`eachBlob`'s 8 MB skip (`:175`) is silent** — a tracked blob larger than that is never scanned and
    nothing says so. Pre-existing, outside `74f2064..bc29dfe`, and its own comment states the trade-off
    (*"an inlined secret appears in the emitted JS, well under this"*). Recorded, not rated.

---

## Swept and found clean — BY PATH

⛔ **Split by depth, because "swept clean" is a claim about a SUBJECT and coverage is a property of a
FILE.** Only the first list should be recorded as a full sweep in `surface-coverage.s1.json`.

**Read in full, blocker/major bar, nothing found:**

```
apps/rn/src/data/migrations.test.ts
apps/rn/src/components/ui/Select.tsx
packages/core/engine/emergencyFund.ts
packages/core/types/livingExpense.ts
scripts/begin-gate-run.ts
scripts/check-committed-secrets.ts
scripts/secrets-exemptions.json
scripts/finding-guards.json
```

**Read at the changed part / the region the job named — `partial`, and must NOT be recorded as swept:**

```
apps/rn/src/data/migrations.ts                      (readMoney, repairMoneyFields, all 4 call sites, the pace stand-down)
apps/rn/src/data/readBackup.test.ts                 (the v1.6 fixture + the headline block)
apps/rn/src/data/detectBackupFormat.test.ts         (the v1.6 fixture)
apps/rn/src/data/legacyBridge/mapLegacyStore.test.ts(the legacy-store fixture)
apps/rn/src/data/migrationAudit/corpus.ts           (the healthy base + the DAMAGE axis)
apps/rn/src/store/persistenceLifecycle.test.ts      (the two corrected fixtures)
apps/rn/src/store/guardianSelectors.ts              (selectTightTopUp :288-320; the brief block :625-680)
apps/rn/src/store/guardianSelectors.test.ts         (the selectTightTopUp block :95-196)
apps/rn/src/store/store.ts                          (hydrate :330-350; acknowledgeDataRepairs + importStore :735-830)
apps/rn/src/components/entities/GoalSheet.tsx       (:20-180 — state, paceGoverns, canBeTheEmergencyFund, submit, the Type row)
apps/rn/src/app/(tabs)/money.tsx                    (the celebration guard :340-380; the goals list :940-1040)
apps/rn/src/testing/runAppTests.ts                  (the added registration)
apps/rn/tests/e2e/data-recovery.spec.ts             (the added test)
apps/rn/tests/e2e/goal-pace-edit.spec.ts            (the added test)
apps/rn/src/components/plan/PaydayGuardianCard.tsx  (:360-370, the only isEmergencyFund consumer)
packages/core/storage/debtPlannerStorage.ts         (the Debt and Goal types)
packages/core/engine/allocatePaycheck.ts            (the Debt/Goal/Expense types; the EF rungs :601-702)
packages/core/imports/debtCsv.ts                    (:290-330, the row constructor)
scripts/write-gate-status.ts                        (:1-140)
scripts/gateSources.ts                              (:36-215)
scripts/strings-inventory.ts                        (:470-565, the gate + baseline block)
scripts/check-type-scale.ts                         (:94-165)
scripts/preflight-native-lane.ts                    (:32-40, :337-370, :545-595)
scripts/run-gates.ts                                (the added gate registration)
```

**Gates run green on this tree:** `test:app` · `lint:secrets` · `lint:finding-guards` · `lint:copy` ·
`lint:type-scale` · `lint:lane` · `lint:s1-coverage`.

---

## Could not determine

1. **Whether a real mid-run drift reds inside a real `validate:release:rn`.** The refusal branches are
   measured end-to-end and the drift *diff* is replayed in memory, but the full chain is forbidden this
   round (~15 min). What is unmeasured is only the plumbing between the two, which is a single `&&`.
2. **Whether `test:gate-plants` currently passes.** It creates `apps/rn/src/__gate_plant__.tsx`, and this
   round forbids writing under `apps/`. ⚠️ **This is auditor B's job ③** and I flag it only so nobody
   reads my `REVERIFY4-4 = CLOSED` as "the plant harness was run".
3. **Whether the two new e2e specs pass.** `test:e2e:*` is forbidden. I verified their *shape* (positive
   assertion before the absence assertion; the note string is emitted only by the read-only branch) but
   not their result.
4. **How the read-only `Select` renders on device.** It drops the `Pressable` and the chevron and adds a
   caption; whether that reads as "stated" rather than "broken" at real Dynamic Type sizes is
   **only observable on device**.
5. **How often a real backup omits a required money field.** ⓪-3's newly-reported population is
   hand-edited / third-party / externally-mutated blobs. I established that neither this app nor v1.6 can
   produce one; I cannot establish the rate at which users produce them.
6. **Whether `pickTopUpGoal`'s `goal.type` ordering has consequences beyond top-up ordering.** The brief
   routes it to auditor C and I did not follow it past confirming it is the only surviving `type`-based
   read a user can feel.
7. **Whether `lint:finding-guards`'s "18 guarded" claim is true of the other 17 entries.** I measured it
   for `REVERIFY4-2` (it is not — see ①-2) and for the six S1 entries. **The remaining eleven are auditor
   B's job ②**, and my one data point should be folded into their count, not counted twice.
