# S1 · AUDITOR B — the guards, and the instruments nobody has audited
**Pinned:** `bc29dfe`, branch `v1.7-dev`.  **Surface:** `scripts/finding-guards.json`'s 18 guarded
entries (job ②) + the four S0 close-out instruments `check-finding-guards.ts`, `test-gate-plants.ts`,
`surface-coverage.ts`, `begin-gate-run.ts` (job ③).  **Bar:** blocker + major.

## Result

**0 blockers · 5 majors.**

**Guard tally (job ②): 18 of 18 guarded entries would still red on their original defect — with one
qualification and one exception.** The exception is `GAP-16`, whose assertion is sound but whose file
(`scripts/test-gate-plants.ts`) is executed by no chain in the repo. The qualification is that **8 of the
18 registry tokens do not actually pin the assertion they name**, so `lint:finding-guards` would stay
green while those guards were removed — measured, not read.

All five majors are in job ③, in the instruments themselves; **no major is in the guards' assertions.**

| # | finding | file |
|---|---|---|
| ③-1 | `test:gate-plants` is in no chain — the only proof any gate fails closed never runs | `scripts/test-gate-plants.ts` |
| ③-2 | `present()`'s word-boundary fix covers only identifier-shaped tokens; 3 of 18 fail open on the exact rename class it was built for | `scripts/check-finding-guards.ts:57-60` |
| ③-3 | 6 of 18 tokens do not pin the assertion — 5 survive on a comment line, 1 sits on a precondition | `scripts/finding-guards.json` |
| ③-4 | `MIN_ENTRIES = 24` against 34 entries — ten closed findings can be deleted with the gate green | `scripts/check-finding-guards.ts:70`, `:102` |
| ③-5 | The S1 surface under-counts by construction (inclusion-list roots) and over-counts on any claim typo | `scripts/surface-coverage.ts` |

## Registry census — re-derived, not taken from the brief

`scripts/finding-guards.json` parses to **34 entries · 18 guarded · 16 unguarded**, computed by walking
the parsed JSON rather than by counting keys in the file. This matches the brief. The 16 `unguarded`
entries are `GAP-2 … GAP-15`, `GAP-17`, `GAP-18`; per the brief they are a known backlog and are not
re-reported here.

⚠️ One number in the census is load-bearing for job ③ and is recorded here: `unguarded.length` is **16**
and `MAX_UNGUARDED` (`scripts/check-finding-guards.ts:71`) is **16** — the cap is exactly tight.
`ids.length` is **34** and `MIN_ENTRIES` (`scripts/check-finding-guards.ts:70`) is **24** — that floor
carries **10 entries of slack**. See job ③ finding 4.

---

## Job ② — the 18 guarded entries: does each still RED on the original defect?

Method: for each entry I opened the guard file at the token's line, read the assertion the token sits on
**and the assertions around it**, and asked what value the assertion would take with the original defect
restored. Where the answer was mechanical I computed it (probes below). Presence of the token is reported
only as context; it is never the verdict.

### ⚡ Two measured, cross-cutting results first

Both were produced by copying `present()` (`scripts/check-finding-guards.ts:57-60`) byte-for-byte into a
scratch script and running it over the real files with a simulated edit. Nothing in the repo was touched.

**Probe 1 — delete every non-comment line carrying the token, keep the comment lines. Gate verdict:**

| entry | verdict |
|---|---|
| `S1-SECRETS-EXEMPT` | **GREEN** — survives on `check-committed-secrets.ts:47`, a docstring line |
| `REVERIFY4-2` | **GREEN** — survives on `check-committed-secrets.ts:148`, a docstring line |
| `REVERIFY4-3` | **GREEN** — survives on `strings-inventory.ts:537`, a docstring line |
| `GUARDED-1` | **GREEN** — survives on `check-audit-closure.ts:92`, a docstring line |
| `GUARDED-5` | **GREEN** — survives on `invariants.ts:98`, a docstring line |
| the other 13 | red — correctly caught |

**Probe 2 — rename the guarded identifier by APPENDING to it** (the exact class the gate's own docstring
records itself having failed open on, `check-finding-guards.ts:47-52`):

| entry | rename | gate verdict |
|---|---|---|
| `REVERIFY4-4` | `function isClamp` → `function isClampLegacy` | **GREEN — fail-open** |
| `GUARDED-3` | `export function selfCheck` → `export function selfCheckAll` | **GREEN — fail-open** |
| `REVERIFY4-2` | `cat-file` → `cat-file-batched` | **GREEN — fail-open** |
| `GAP-16`, `GUARDED-4`, `GUARDED-5`, `S1-SECRETS-EXEMPT`, `REVERIFY4-5`, `D69-INVENTORY`, `S1-ABSENT-REQUIRED`, `GUARDED-1` | identifier renames | red — correctly caught |

**Why:** `present()` word-boundary-matches only tokens matching `/^[\w$]+$/`
(`check-finding-guards.ts:58`). A token containing a space or a hyphen falls through to plain
`text.includes()`. `function isClamp`, `export function selfCheck` and `cat-file` all contain a space or
a hyphen, so **the fix for the fail-open class does not cover three of its own registry's tokens.**
See job ③ finding 2 for the severity.

### The 18 verdicts

`HOLDS` = with the original defect restored, this assertion evaluates to a failing value and the runner
that executes it is reachable. `HOLDS (weak pin)` = the assertion still reds, but the registry token does
not pin it — see job ③.

| # | entry | guard site | would it red on the ORIGINAL defect? |
|---|---|---|---|
| 1 | `S1-BLOCKER-1` | `apps/rn/src/data/migrations.test.ts:44` + assertions at `:65-76`, `:92-94` | **HOLDS** |
| 2 | `S1-BLOCKER-1-E2E` | `apps/rn/tests/e2e/data-recovery.spec.ts:148` + `:166-171` | **HOLDS** |
| 3 | `S1-ABSENT-REQUIRED` | `apps/rn/src/data/migrations.test.ts:132` + loop at `:162-169` | **HOLDS (weak pin)** |
| 4 | `S1-M9-GUARDIAN` | `apps/rn/src/store/guardianSelectors.test.ts:194` / **assertion at `:195`** | **HOLDS (weak pin — token is on the wrong line)** |
| 5 | `S1-M9-SHEET` | `apps/rn/tests/e2e/goal-pace-edit.spec.ts:145` + `:168-171` | **HOLDS** |
| 6 | `S1-SECRETS-EXEMPT` | `scripts/check-committed-secrets.ts:60` + `:250-258` | **HOLDS** |
| 7 | `REVERIFY4-1` | `scripts/write-gate-status.ts:91-113` | **HOLDS** |
| 8 | `REVERIFY4-2` | `scripts/check-committed-secrets.ts:155` (code) / `:148` (prose) | **HOLDS (weak pin — survives on the docstring alone)** |
| 9 | `REVERIFY4-3` | `scripts/strings-inventory.ts:548-555` | **HOLDS (weak pin)** |
| 10 | `REVERIFY4-4` | `scripts/check-type-scale.ts:122-139` | **HOLDS (weak pin — token pins the NAME, not the body)** |
| 11 | `REVERIFY4-5` | `scripts/preflight-native-lane.ts:573`, `:584-590` | **HOLDS** |
| 12 | `GAP-1` | `apps/rn/src/data/migrationAudit/audit.test.ts:195-226` | **HOLDS** |
| 13 | `GAP-16` | `scripts/test-gate-plants.ts:96`, `:157-163` | ⛔ **the assertion holds, but NOTHING RUNS IT** — see job ③ finding 1 |
| 14 | `D69-INVENTORY` | `scripts/surface-coverage.ts:215`, `:257-268` | **HOLDS** for the file-list half; see job ③ finding 5 for the claim half |
| 15 | `GUARDED-1` | `scripts/check-audit-closure.ts:149`, `:200-217`, `:271-284` | **HOLDS** |
| 16 | `GUARDED-3` | `apps/rn/src/data/migrationAudit/audit.test.ts:139-249` | **HOLDS (weak pin)** |
| 17 | `GUARDED-4` | `apps/rn/src/data/migrationAudit/hostile.test.ts:32`, `:105-109` | **HOLDS** |
| 18 | `GUARDED-5` | `apps/rn/src/data/migrationAudit/invariants.ts:214-229`, `:241` | **HOLDS (weak pin)** |

**Reachability, checked rather than assumed.** `migrations.test.ts`, `audit.test.ts`, `hostile.test.ts`
and `guardianSelectors.test.ts` are imported by `apps/rn/src/testing/runAppTests.ts` at lines 230, 234,
243 and 23 — a **hand-maintained import list**, not a glob. I ran `npm run test:app`: green, all four
executed. `data-recovery.spec.ts` and `goal-pace-edit.spec.ts` run only under `test:e2e:rn`
(`package.json:17`), which is in `validate:release:rn` (`package.json:56`) and in CI
(`.github/workflows/web-e2e.yml:133`) — not in `lint:rn`. `test-gate-plants.ts` is in **none of them**.

### Why the interesting ones red — the value, printed

- **1 · `S1-BLOCKER-1`.** With `readMoney` reverted, `Number('')` is `0`, so `store.debts[0].balance` is
  still `0` and the earlier assertion at `:69` **passes** rather than masking the finding; the repair kind
  is `'recovered'`, so `eq(repair.kind, c.kind)` at `:74` is the line that reds. The second half at
  `:92-93` reproduces `money.tsx:360`'s predicate verbatim, so `unreadDebts` computes `false` and
  `eq(unreadDebts, true)` reds too. Two independent links.
- **2 · `S1-BLOCKER-1-E2E`.** The positive assertion (`Chase card` visible, `:167`) precedes the absence
  assertion — reading rule 7 satisfied. And its premise is verified in code, not taken from the comment:
  `money.tsx:337` pushes the `PAID OFF` section unconditionally, so the debt row renders in the
  celebrating branch too. Under the defect `money.tsx:361` `allCleared` is `true` and `:366` renders
  *"Every balance cleared"*, so `toHaveCount(0)` reds.
- **3 · `S1-ABSENT-REQUIRED`.** With `repairMoneyFields` reverted to skipping every `undefined`, a debt
  row with no `balance` key leaves `rows[0].balance === undefined`, so `eq(rows[0][field], 0)` at `:166`
  reds — and `if (!repair) fail(...)` at `:167` reds independently. The `REQUIRED_FLOOR = 7` /
  `OPTIONAL_FLOOR = 3` pair matches the table lengths exactly (7 and 3), so no slack.
- **4 · `S1-M9-GUARDIAN`.** Under `isEmergencyFund = goal.type === 'emergency'`, `twoEfs.goalName` is
  still `'Car repair fund'` — line `:194`, the line the registry names, **passes** — and `:195`
  (`isEmergencyFund === false`) is the line that reds. The finding is guarded; the *registry entry* is
  not pinning it.
- **11 · `REVERIFY4-5`.** Measured, not reasoned: `npm run lint:lane` prints
  `✅ native-lane pre-flight: 95 structural checks pass.` and `MIN_CHECKS = 95`
  (`preflight-native-lane.ts:573`). **Zero slack.** The original defect dropped 87 → 83; any such drop
  now reds.
- **13 · `GAP-16`.** `MIN_SCENARIOS = 5` and `SCENARIOS.length = 5` — tight. The assertion is sound. The
  problem is not the assertion.
- **15 · `GUARDED-1`.** Measured: `npm run lint:closure` prints `55 of 55 trace ONLY by an unmarked
  mention (cap 55, downward-only). 0 carry an explicit [closes: …] token.` The cap equals the count, so
  one new untokenised finding reds it — the guard's stated job. ⚠️ Recorded for the next pass: the ✅ line
  above it (`check-audit-closure.ts:197`) reads *"all 55 high+ findings trace to a closure"* while the
  very next line says none of them carries a closure token. That is `check-audit-closure.ts`, not one of
  my four instruments; flagged, not opened.
- **17 · `GUARDED-4`.** `HOSTILE_FLOOR = 32` and the assertion is `openedFile >= 32 && openedKeys >= 32`
  (`hostile.test.ts:106-109`) — it reds if the corpus stops reaching the migration logic, which is the
  finding. GAP-7 (the floor can be *lowered*) is already registered `unguarded`; not re-reported.
- **18 · `GUARDED-5`.** `priorityGoalIsCapped` (`invariants.ts:214-229`) tests `pace > 0` rather than
  `pace === 0`, so the negative half is covered; it is registered in `INVARIANTS`
  (`invariants.ts:241`) and `GAP-1`'s self-check calls it **directly** rather than through `checkAll`
  (`audit.test.ts:221`), which is the right choice — `checkAll` returning something proves only that
  *some* invariant fired.


---

## Job ③ — the four instruments S0's convergence rests on

### 1. `test:gate-plants` is in NO chain — the only proof any gate fails closed never runs — **major**

**User-facing consequence:** The one instrument that proves a gate reds on a real defect is executed by
nothing, so any gate can go blind between now and release while `lint:rn`, `validate:release:rn` and CI
all report green — which is the exact shape of all fifteen of S0's majors.

**Mechanism.** `test:gate-plants` is defined at `package.json:36` and referenced nowhere that runs it:

- `scripts/run-gates.ts:32-64` — the `GATES` list that *is* `lint:rn` — does not contain it.
- `package.json:56` — `validate:release:rn` — does not contain it.
- `.github/workflows/web-e2e.yml:89-145` runs `typecheck`, `lint:rn`, `test:stamp`, `test:regression`,
  `test:app`, `test:scenarios`, `test:e2e:rn`, `test:e2e:embed`. Not this.

Counted, not sampled: a repo-wide search for `gate-plants` returns **11 files** — `package.json`,
`scripts/test-gate-plants.ts` itself, `scripts/finding-guards.json` (GAP-16's registration),
`scripts/check-committed-secrets.ts:51` (a prose reference), `scripts/surface-coverage.s0.json`, and
**six prose files**. There is no runner, no CI step, no hook.

**And it is not deliberate.** `check-gate-freshness` is the file in this tree that *is* deliberately
outside every chain, and it says so in its own docstring — GAP-14 records exactly that reasoning.
`test-gate-plants.ts` carries no such statement, and `docs/DEBT_ELEVATION_LOG.md:1112-1114` describes it
as a delivered guard (*"5 gates proven to fail closed on a real planted defect, each with a control"*).

**Consequence for job ②.** `GAP-16`'s registry entry (`MIN_SCENARIOS`) is a presence check on a file that
nothing executes, so `lint:finding-guards`' green line — *"18 of 34 findings carry a standing guard"* —
counts an entry whose guard is inert. The same is true one level down: **`REVERIFY4-4`'s only behavioural
guard is `test:gate-plants` scenario 5** (`scripts/test-gate-plants.ts:83-91`, which plants
`allowFontScaling={true}` on a 40 pt style — the S0.13 finding-4 shape exactly). Its registry token pins
only the *name* `function isClamp`. So REVERIFY4-4 currently has a name-pin that survives a rewrite and a
behaviour-pin that never runs.

**Would anything catch it?** No. Nothing asserts that a gate is in a chain. This is the class GAP-14
already names for one gate and nobody generalised.

**Also recorded, not at the bar.** `scripts/test-gate-plants.ts:132` scores a scenario `ok` on
`planted && withPlant !== 0 && withoutPlant === 0` — **any** non-zero exit counts as detection, so a plant
that makes a gate *crash* scores identically to a plant the gate *catches*. Nothing checks that the gate's
output names the planted path. Confidence: read-only inference; I could not demonstrate it without writing
into `apps/rn`.

### 2. `present()`'s word-boundary fix does not cover its own registry — 3 of 18 tokens fail open on exactly the rename class it was built for — **major**

**User-facing consequence:** Renaming `isClamp` or `selfCheck` — an ordinary refactor with no bad intent —
silently removes the standing guard on two S0 fixes, so a 40 pt figure with font scaling switched on, or a
migration audit that computes a verdict and discards it, can ship with `lint:rn` green.

**Mechanism.** `scripts/check-finding-guards.ts:57-60`. The word-boundary branch is reached **only** when
the whole token matches `/^[\w$]+$/` (line 58). A token containing a space or a hyphen takes the
`text.includes` branch — the exact implementation the docstring at `:47-52` records this gate having
already failed open on. Three of the eighteen registered tokens contain a space or a hyphen **and name an
identifier**:

| entry | token | rename | measured verdict |
|---|---|---|---|
| `REVERIFY4-4` | `function isClamp` | → `function isClampLegacy` | **GREEN — guard gone, gate passes** |
| `GUARDED-3` | `export function selfCheck` | → `export function selfCheckAll` | **GREEN — guard gone, gate passes** |
| `REVERIFY4-2` | `cat-file` | → `cat-file-batched` | **GREEN** |

Measured with `present()` copied byte-for-byte into a scratch script and run over the real file contents;
the eight identifier-shaped tokens were put through the same probe and all eight correctly redded.

⚠️ **The observation and the remedy are separate.** The remedy is *not* "make every token an identifier" —
`S1-BLOCKER-1` and `S1-M9-SHEET` use sentence tokens correctly, because a sentence cannot be renamed into
a longer identifier. The failing three are **identifier-prefixed** tokens: a keyword plus a name, where the
name can grow. The condition to judge is *"could this token still be a substring of the renamed thing"*,
not *"does it contain a space"* — reading rule 4.

**Would anything catch it?** No. `lint:finding-guards` is the only consumer of these tokens.

### 3. Six of eighteen tokens do not pin the assertion they are registered to guard — **major**

**User-facing consequence:** Deleting one line — `apps/rn/src/store/guardianSelectors.test.ts:195` —
removes the only assertion in the repo that a second emergency-typed pot is *not* called *"your emergency
fund"*, and `lint:rn` stays green, so M9's three-screens-disagree defect can ship again unobserved.

**Mechanism A — the token sits on the wrong line.** `S1-M9-GUARDIAN`'s token is
`the larger of two emergency pots is the source`, which is the message of line 194:

```
194  eq(twoEfs?.goalName, 'Car repair fund', 'the larger of two emergency pots is the source');
195  eq(twoEfs?.isEmergencyFund, false, '⛔ …and it is NOT called the emergency fund — Money calls it Savings');
```

`:194` is the **precondition** — it asserts `pickTopUpGoal` chose the second pot. `:195` is the finding.
Delete `:195` and the token, the file and the gate are all untouched. This is the shape
`scripts/check-finding-guards.ts:14-19` states the whole gate exists for: *"the assertion inside it is
what guards the finding, and deleting the assertion leaves the file in place."*

**Mechanism B — the token survives on a comment line alone.** Measured: delete every non-comment line
carrying the token, re-run `present()`. Five entries stay GREEN:

| entry | the line that keeps it green | what is left after the code goes |
|---|---|---|
| `REVERIFY4-2` | `scripts/check-committed-secrets.ts:148` | a docstring sentence; the one code use is `:155` |
| `S1-SECRETS-EXEMPT` | `scripts/check-committed-secrets.ts:47` | a docstring sentence |
| `REVERIFY4-3` | `scripts/strings-inventory.ts:537` | a docstring sentence |
| `GUARDED-1` | `scripts/check-audit-closure.ts:92` | a docstring sentence |
| `GUARDED-5` | `apps/rn/src/data/migrationAudit/invariants.ts:98` | a docstring sentence |

`GUARDED-5` is the sharpest of these, because the removal is already a known-silent edit: **GAP-2**
(registered `unguarded`) records that *"deleting any invariant from `INVARIANTS` is silent."* Delete
`priorityGoalIsCapped` from `invariants.ts:241` and its `export` at `:214`, and `:98`'s docstring mention
keeps `lint:finding-guards` green — the two holes compose into a fully silent removal of invariant ⑨.

**Union: 8 of 18 entries** are defeated by finding 2 or finding 3 (`REVERIFY4-2` is in both). These counts
are the whole result, not a sample: all 18 entries were run through both probes.

**Would anything catch it?** No.

### 4. `MIN_ENTRIES = 24` against a 34-entry registry — ten closed findings can be deleted with the gate green — **major**

**User-facing consequence:** All six S1 guard entries — including blocker #1 and both halves of the M9
naming fix — plus four of S0's five `REVERIFY4-*` entries can be deleted from `finding-guards.json` in one
edit and `lint:rn` stays green, so the record that those fixes are guarded can vanish with no signal.

**Mechanism.** `scripts/check-finding-guards.ts:70` sets `MIN_ENTRIES = 24`; the registry parses to **34**
entries. The check at `:102` is `ids.length < MIN_ENTRIES`, so there are **10 entries of slack**. The
docstring directly above it, at `:66-68`, says: *"`MIN_ENTRIES` may only rise — a finding dropping out of
the registry is how a closure stops being tracked."* Nothing makes it rise, and nothing reds when the
count exceeds it.

⚠️ **Its sibling in the same commit range does this correctly, which is what makes it a defect rather than
a style choice.** `scripts/check-committed-secrets.ts:250` is `if (exemptions.length !== MAX_EXEMPT)` — a
strict equality that reds in **both** directions, with the error text at `:257` telling the human to lower
the cap. `MAX_UNGUARDED` (`:71`) happens to be tight today (16 vs 16, measured) but is written as `>` at
`:108`, so it acquires the same latent slack the moment one backlog entry is guarded.

⚠️ **Second-order, same mechanism:** because `MAX_UNGUARDED` only counts, an `unguarded` backlog entry can
be "drained" by **deleting** it rather than by writing a guard, and the printed green number goes down.
The gate cannot distinguish those two.

⚠️ **And `JSON.parse` silently keeps the last of any duplicate key** (`:62`), so two entries sharing an id
would drop one and lower `ids.length` — invisible inside ten entries of slack. No duplicate ids exist
today: 34 keys parse to 34 entries.

**Would anything catch it?** No.

### 5. `surface-coverage.ts` under-counts the S1 surface by construction, and over-counts on any typo — **major**

**User-facing consequence:** S1 can be declared converged without anyone having read the 1,087-line screen
that renders every plan card, because that file is not on the surface the [D69] lookup reports on — and
the generated inventory will still say *"72 files on the S1 surface."*

**Mechanism A — the S1 scope is an INCLUSION list, and the file itself says an inclusion list fails
silent.** `scripts/surface-coverage.ts:54-57` states the model: *"Scope is an exclusion list … an
inclusion list fails **silent** — a surface file nobody thought to enumerate is simply absent."* But
`SURFACES.s1.roots` (`:115-130`) is four directories **plus ten hand-named individual files**. For
`apps/rn/src/store`, `apps/rn/src/data` and `apps/rn/src/app/(tabs)` the scope is an enumeration, and it
is short. Measured:

| directory | entries on disk | on the S1 surface |
|---|---|---|
| `apps/rn/src/store/` | 88 | 6 |
| `apps/rn/src/data/` | 21 | 3 |
| `apps/rn/src/app/(tabs)/` | 4 | 1 |

Two named omissions, both money:

- ⛔ **`apps/rn/src/app/(tabs)/index.tsx` — 1,087 lines, importing 19 distinct `components/plan` modules**
  (16 of them on the S1 surface) — is the screen that *composes* every plan card Auditor D is sweeping,
  and it is on no surface at all. `money.tsx` was named individually at `:120`; the plan screen was not.
- ⛔ **`apps/rn/src/store/planSelectors.test.ts`** is absent while `planSelectors.ts` is present at `:125`.
  For `guardianSelectors`, `journeySelectors` and `migrations` the list names **both** the source and its
  test; for `planSelectors` it names only the source. That asymmetry is the enumeration failing, inside the
  file that warns about enumeration failing.

⚡ **This contradicts a claim made to a human in two places.** `scripts/surface-coverage.ts:43-44` says
*"The FILE LIST is walked from disk — mechanical, **cannot undercount**"*, and
`docs/DEBT_ELEVATION_LOG.md:1109-1110` repeats it. The walk is mechanical **within a root**; the roots are
hand-written, so the file list under-counts exactly as far as the root list does — and the gate cannot
notice, because a file that is on no root is never compared against anything.

**Mechanism B — the claim vocabulary is unvalidated, so a typo reads as SWEPT.** `:217-220` computes
`unswept` as `c.every((v) => v === 'never' || v === 'unknown' || v === 'partial')`. Any string that is not
exactly one of those three is **swept**. `"Never"`, `"nevr"`, `" never"`, `"partial (diff only)"` and
`"r17-partial"` all silently convert an unread file into a read one — in the gate's own count *and* in the
generated inventory the next auditor reads. There is no allow-list check anywhere in the file.

⚠️ **Measured: today's data is clean, and the documented vocabulary already differs from the enforced one.**
`scripts/surface-coverage.s0.json` uses `never · p1 · p2 · p3 · p4 · r17` across 58 entries;
`scripts/surface-coverage.s1.json` uses `never · partial · r10 · r17` across 72. No empty or non-array
claims in either. But `:193` documents **`g4` — pass 4's guard inventory** as a value, and `g4` appears in
neither file — so the docstring's vocabulary and the data's have already drifted, with nothing to catch it.

**Mechanism C — an exclusion can route a file to a surface that does not exist.** `:13-16` and `:76` state
the rule (*"every `true` must name the surface that owns the file"*) and nothing enforces it. Measured: 13
real files are excluded from S1 — `AppStoreCta.tsx`, `AppStoreCta.web.tsx`, and the 11 `S4_OWNED` names at
`:95-100` — and **there is no `s4` surface**: `SURFACES` has exactly `s0` and `s1` (`:102-144`), and
`scripts/surface-coverage.s4.json` does not exist. All 11 names do currently match a real file, so nothing
is mis-typed today; the gap is that a future exclusion could name nothing, or name a surface that never
arrives, with no red.

**Verified sound, so the next pass does not re-open it:** `SOURCE_EXT` (`:80`) drops **0** files on either
surface — I walked both root sets with no extension filter: S0 is 62/62, S1 is 85/85, and 85 − 13
exclusions = the 72 the gate prints. The `missing` / `stale` reconciliation at `:215-216` is genuinely
two-directional. The root-does-not-exist path **reds** rather than skipping (`:180-185`) — the right call,
and the deliberate opposite of `scripts/gateSources.ts:102-103`.

**Would anything catch it?** `D69-INVENTORY`'s registered token (`UNCLASSIFIED`, `:260`) pins the
reconciliation, which is the half that works. Nothing pins the root list or the vocabulary.

### 6. `begin-gate-run.ts` — swept, and its findings are below the bar

`scripts/begin-gate-run.ts` is 45 lines and makes no decision: it calls `fingerprintDetail()` (`:34`) and
writes the record (`:43`). **All of its protective value is realised in `scripts/write-gate-status.ts`**,
which I read at `:76-113`: it reds on drift and *refuses* rather than records when the start record is
missing (`:80-87`) — the correct asymmetry, argued explicitly at `begin-gate-run.ts:18-21`.

What I probed, and the result:

- ⚠️ **A second `gate:begin` re-baselines a run already in flight.** `GATE_RUN_FILE` is keyed on
  `hash(REPO_ROOT)` (`scripts/gateSources.ts:195-198`) — deliberately shared across runs in one checkout —
  and `begin-gate-run.ts:43` overwrites it unconditionally. Two concurrent `validate:release:rn` runs in
  the same working copy therefore share one start record, and the second run's `gate:begin` resets the
  baseline the first will be judged against. Nothing detects this: no run id, no lock, and the record is
  never consumed or deleted by `gate:record`. **`minor`** — it needs concurrency or a manual invocation,
  and the docstring at `:23-26` already scopes the instrument to *"the accidental path"*, of which this is
  arguably one. Recorded so the next pass can decide rather than rediscover.
- ⚠️ **The fingerprint is lossy for non-UTF-8 bytes.** `scripts/gateSources.ts:176` reads with `'utf8'`, so
  every invalid byte becomes U+FFFD before hashing. Measured — two different files, one digest:
  bytes `6578706f7274202f2f20e90a` → `fc26d6147e4a06b4`, bytes `6578706f7274202f2f20f10a` →
  `fc26d6147e4a06b4`. Changing one invalid byte to another mid-run is invisible to the drift check.
  **`minor`, and latent**: I walked all **773** gate-source files — **0** fail to round-trip through UTF-8,
  **0** contain a NUL byte, and **0** contain a lone CR (which the `\r\n`-only normalisation at `:176`
  would also not fold).
- ✅ **All ten `ROOTS` (`scripts/gateSources.ts:53-78`) resolve on disk**, including the three the docstring
  flags as bypassing `skipDir` — `apps/rn/.maestro`, `.github/workflows`, `.github/actions`. No root is
  currently dead. *(GAP-13 registers "a root can be lost silently" as `unguarded`; this is a measurement of
  the present state, not a re-report of it.)*
- ✅ **`lint:s0-coverage` / `lint:s1-coverage` write into `docs/`, and `docs/` is not fingerprinted**, so a
  gate that writes a file during `validate:release:rn` cannot trip its own drift check. Verified by running
  `npm run lint:s1-coverage` and comparing `git status --porcelain` before and after: identical, four
  untracked audit reports and nothing else. *(The write does reach `scripts/write-gate-status.ts:53`'s
  `git status --porcelain`, so a run in which the claims changed would be stamped `dirty: true` for a
  reason the run itself caused — recorded, `minor`.)*

---

## Measured, and NOT a defect — recorded so the next pass does not re-open them

- **`present()`'s word-boundary fix works for identifier tokens.** Eight tokens
  (`MIN_SCENARIOS`, `HOSTILE_FLOOR`, `priorityGoalIsCapped`, `MAX_EXEMPT`, `MIN_CHECKS`, `UNCLASSIFIED`,
  `REQUIRED_FLOOR`, `MAX_UNTOKENISED`) were renamed by appending and **all eight redded.** The recorded
  fail-open (`scripts/check-finding-guards.ts:47-52`) is genuinely closed for the case it names.
- **`MAX_UNGUARDED` is tight.** 16 unguarded entries, cap 16 (`scripts/check-finding-guards.ts:71`). Zero
  headroom today.
- **`MIN_CHECKS` in `preflight-native-lane.ts` is tight.** `npm run lint:lane` prints 95 checks; the floor
  is 95 (`:573`). Zero headroom.
- **`MIN_SCENARIOS` in `test-gate-plants.ts` is tight.** 5 scenarios, floor 5 (`:96`). The floor check at
  `:157` runs *after* the loop, so an emptied `SCENARIOS` array still reds.
- **`MAX_EXEMPT` is the strongest ratchet in the set.** `scripts/check-committed-secrets.ts:250` reds on a
  count that is above **or below** the cap, and `:242-249` reds on any exemption matching nothing. This is
  the shape the other floors should copy.
- **The 16 `unguarded` entries are the known S0.13 backlog** — confirmed by parsing the registry (16, and
  they are `GAP-2 … GAP-15`, `GAP-17`, `GAP-18`), and not re-reported per the brief.
- **`SOURCE_EXT` in `surface-coverage.ts` drops nothing.** Walked both root sets with no extension filter:
  S0 62/62, S1 85/85. The extension list is not currently hiding a file.
- **`run-gates.ts` uses `stdio: 'inherit'` (`:72`), so a passing gate's warnings are visible.** I checked
  this specifically because `REVERIFY4-3`'s fix reports stale baseline entries on the **pass** path
  (`strings-inventory.ts:549-555`); a summarising wrapper would have swallowed it. It does not.
- **`selfCheck()` is called.** `apps/rn/src/data/migrationAudit/audit.test.ts:41` — checked, because the
  `tested-helper-is-not-a-used-helper` lesson is what `GUARDED-3` exists for and the token pins only the
  definition at `:139`.
- **The four migration/guardian guard files are actually executed.** `apps/rn/src/testing/runAppTests.ts`
  is a hand-written import list, not a glob; lines 23, 230, 234, 243. `npm run test:app` ran green.
- **No non-UTF-8 bytes, NUL bytes or lone CRs in any of the 773 gate-source files** — so the fingerprint's
  lossy decode (job ③-6) and the NUL-makes-a-file-binary class the brief warns about are both latent here.
- **`lint:s1-coverage` is idempotent against the committed tree.** Ran it; `git status --porcelain` was
  identical before and after.

## Swept and found clean — BY PATH

Read in full at the blocker/major bar. These are coverage claims for `surface-coverage.s0.json`; note that
none of these paths are on the **S1** surface — they are S0 instrument files, swept here because job ③
assigned them.

- `scripts/check-finding-guards.ts` — **NOT clean**: findings ③-2, ③-3, ③-4. Read in full (128 lines).
- `scripts/test-gate-plants.ts` — **NOT clean**: finding ③-1. Read in full (169 lines).
- `scripts/surface-coverage.ts` — **NOT clean**: finding ③-5. Read in full (273 lines).
- `scripts/begin-gate-run.ts` — clean at the bar. Read in full (45 lines). Two `minor`s recorded in ③-6.
- `scripts/gateSources.ts` — clean at the bar. Read in full (217 lines); it is `begin-gate-run.ts`'s only
  dependency and cannot be judged separately from it. One `minor` (the lossy UTF-8 decode at `:176`).
- `scripts/finding-guards.json` — **NOT clean**: finding ③-3 (token selection). All 34 entries parsed and
  all 18 guard sites opened.
- `scripts/run-gates.ts` — clean at the bar. Read in full (92 lines). Read to answer "is this gate in a
  chain" and "is a passing gate's output visible"; both answered from the code.
- `scripts/surface-coverage.s0.json`, `scripts/surface-coverage.s1.json` — clean as data; both parsed and
  their full value vocabularies enumerated.

Read at the guard site only — **`partial`, and recorded as such** (I opened the assertion the registry
names plus its surrounding block, not the whole file):

- `scripts/check-committed-secrets.ts` — `:30-80`, `:135-175`, `:235-280` (guards `S1-SECRETS-EXEMPT`,
  `REVERIFY4-2`). ⚠️ Auditor A owns `⓪-5` and the exemption ledger; I did not duplicate that.
- `scripts/write-gate-status.ts` — `:60-120` (guards `REVERIFY4-1`).
- `scripts/strings-inventory.ts` — `:520-565` (guards `REVERIFY4-3`).
- `scripts/check-type-scale.ts` — `:100-175` (guards `REVERIFY4-4`).
- `scripts/preflight-native-lane.ts` — `:555-600` (guards `REVERIFY4-5`).
- `scripts/check-audit-closure.ts` — `:140-155`, `:190-225` (guards `GUARDED-1`).
- `apps/rn/src/data/migrations.test.ts` — read in full (178 lines); guards `S1-BLOCKER-1`,
  `S1-ABSENT-REQUIRED`. ⚠️ Auditor A owns whether the *fixtures* are right; I judged only whether the
  assertions red.
- `apps/rn/src/data/migrationAudit/audit.test.ts` — `:125-249` (guards `GAP-1`, `GUARDED-3`).
- `apps/rn/src/data/migrationAudit/hostile.test.ts` — `:20-40`, `:95-120` (guards `GUARDED-4`).
- `apps/rn/src/data/migrationAudit/invariants.ts` — `:205-250` (guards `GUARDED-5`).
- `apps/rn/src/store/guardianSelectors.test.ts` — `:160-240` (guards `S1-M9-GUARDIAN`). ⚠️ This file is
  `never` on the S1 inventory and is **Auditor C's**; my read is guard-site only and does not make it swept.
- `apps/rn/tests/e2e/data-recovery.spec.ts` — `:120-200` (guards `S1-BLOCKER-1-E2E`).
- `apps/rn/tests/e2e/goal-pace-edit.spec.ts` — `:115-171` (guards `S1-M9-SHEET`).
- `apps/rn/src/app/(tabs)/money.tsx` — `:224`, `:337`, `:348-366` only, to verify the e2e guard's premise.
  **This file is Auditor C's and my read does not make it swept.**
- `apps/rn/src/testing/runAppTests.ts` — the import list only, to establish reachability.
- `package.json`, `.github/workflows/web-e2e.yml` — the script and job definitions, to establish which
  chains run what.

## Could not determine

- **Whether `test:gate-plants` currently passes.** Running it creates and deletes files under
  `apps/rn/src/`, which this round's read-only rule forbids. Its five scenarios are sound *as written*; I
  verified the code, not the run. ⚠️ **This matters more than it sounds:** nothing else in the tree runs it
  either, so **no evidence exists that it passes at `bc29dfe`** — its last recorded green is
  `docs/DEBT_ELEVATION_LOG.md`, from S0.13.
- **Whether `REVERIFY4-4`'s `isClamp` body is behaviourally correct against the live tree.** I read the
  function (`scripts/check-type-scale.ts:122-139`) and it rejects `allowFontScaling={true}`, which is the
  finding. Confirming it against the 39 live spellings its docstring tabulates would mean running the gate
  with a plant, which is the previous item.
- **Whether the `S4_OWNED` routing at `scripts/surface-coverage.ts:95-100` is correct.** The 11 names all
  match real files, but there is no `s4` surface to check them against, so "S4 owns these" is currently
  unfalsifiable. It becomes checkable the moment an `s4` entry exists.
- **Whether the two-concurrent-runs `gate:begin` re-baseline (③-6) has ever happened.** The start record
  lives in `tmpdir()` and is overwritten, so there is no history to inspect.
