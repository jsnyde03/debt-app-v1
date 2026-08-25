# Cluster B — CSV import and the data model

**Diff audited:** `8e4540a..3dc3c22`, files:
`packages/core/imports/debtCsv.ts` · `packages/core/imports/testDebtCsv.ts` ·
`apps/rn/src/data/migrations.ts` · `apps/rn/src/data/models.ts` ·
`apps/rn/src/components/plan/DataRepairsCard.tsx`

Read alongside (not in the file list, but the change is judged in its site):
`packages/core/utils/amountField.ts`, `packages/core/utils/localDate.ts`,
`packages/core/debt/bnplInstallment.ts`, `packages/core/engine/allocatePaycheck.ts`,
`packages/core/engine/recommendedActions.ts`, `packages/core/storage/debtPlannerStorage.ts`,
`apps/rn/src/store/persistenceLifecycle.test.ts` (the pinning test, +38 in the same range),
`apps/rn/src/app/(tabs)/money.tsx`, `apps/rn/src/app/(tabs)/index.tsx`,
`apps/rn/src/components/entities/ImportDebtsSheet.tsx`, `apps/rn/tests/e2e/csv-import.spec.ts`,
`scripts/check-local-dates.ts`, `site/support.html`.

Sections are appended as each hunk-group is finished. Verdict tally is at the end.

---

## B-1 — `normalizeHeader` now strips spaces, underscores and hyphens

`packages/core/imports/debtCsv.ts:108-110`
```
return header.trim().toLocaleLowerCase().replace(/[\s_-]/g, "");
```

### VERDICT: `SOUND`

**Q1 — prior properties.** The site did exactly two things before: `trim()` and `toLocaleLowerCase()`.
Both survive; the `replace` is appended. The lookup keys the function has to produce are all
already separator-free — `debtCsv.ts:171-179` reads `row.name`, `row.balance`, `row.minimumpayment`,
`row.apr`, `row.duedate`, `row.type`, `row.recurrence`, `row.remainingpayments`,
`row.scheduledpaymentamount` — so every header that parsed before still parses to the same key
(`minimumPayment` -> `minimumpayment` either way). No previously-accepted spelling is lost.

**Q2 — environments.** `toLocaleLowerCase()` with no locale argument uses the host default, and for
`I` in a Turkish locale it yields the dotless `ı`. That is pre-existing (the call was already there)
and none of the four storefronts (US/CA/AU/NZ, `packages/core/utils/amountField.ts:21`) is affected;
the new `replace` is locale-independent. No timezone, theme or platform surface.

**Q3 — helper contracts.** `String.prototype.replace` with a global regex; no library contract in play.

**Q4 — side effects.** Pure function, no side effect introduced.

**Q5 — the new test.** `packages/core/imports/testDebtCsv.ts:275-283` parses
`"Name,Balance,Minimum Payment,APR,Due Date\n..."` and asserts `errors.length === 0`,
`debts[0].minimumPayment === 75`, `debts[0].dueDate === "2026-09-01"`. **It would have failed on the
defect**: without the strip, `"minimum payment"` is a key nobody reads, `rawMinimum` is `""`, and
`debtCsv.ts:200-207` pushes `"minimumPayment is required."` — `errors.length` is 1, and the very
first assert reds. It asserts the parsed *values*, not merely "no error", so it is the subject and not
a proxy. Registered in the aggregate run: `packages/core/testing/runRegressionTests.ts:40` imports
`@core/imports/testDebtCsv`, and `package.json:57` (`test:regression`) is inside
`validate:release:rn` (`package.json:46`).

**Q6 — gates.** No gate added or changed by this hunk.

**Q7 — newly possible.** Two headers that used to be distinct now collide: a file carrying both
`due date` and `duedate` (or `due_date`) resolves to one key and the **last column wins**, silently.
Nothing in the repo detects a duplicate normalised header. Very low likelihood from a real export;
recorded because nothing checks it. Also newly reachable: a header cell that is *only* separators
(`"-"`, `"_"`) normalises to `""` and writes a `""` key on the row object — inert, since no reader
asks for it.

**Note (not a verdict).** `site/support.html:285` was updated in the same range to promise exactly
this tolerance ("Capitals, spaces, underscores and hyphens in the header are all fine"), so the doc
and the parser now agree. That promise is enforced only by the unit test above; there is no gate
tying support copy to parser behaviour.

---

## B-2 — `toCount` now requires a whole positive integer

`packages/core/imports/debtCsv.ts:125-131`
```
return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
```
(was `Number.isFinite(parsed) ? parsed : undefined`)

### VERDICT: `SOUND`

**Q1 — prior properties.** The old function accepted any finite number and returned `undefined`
otherwise. Everything it used to accept that mattered still passes: `"4"`, `"4.0"` (`Number` -> `4`,
`Number.isInteger(4)` is true), `" 4 "` (still trimmed at `debtCsv.ts:128`). Everything it used to
reject still returns `undefined` (`"1,200"` -> `NaN` -> rejected, same as before). The falsy-guard at
`debtCsv.ts:126` is unchanged, so an absent column is still `undefined` and not an error.

Newly rejected: `0`, negatives, and fractions. **`0` was already inert** —
`packages/core/debt/bnplInstallment.ts:33` requires `remainingPayments > 0` for
`isInstallmentNative`, so `0` and `undefined` produced identical downstream behaviour. So the only
real behavioural change is fractional and negative counts, which is the intended fix. No prior
property lost.

**Q2 — environments.** `Number()` is locale-insensitive, so a decimal-comma count (`"2,5"`) was
rejected before and is rejected now. No timezone/platform/theme surface. The value flows to
`debtCsv.ts:286` only when `type === "bnpl"`, unchanged.

**Q3 — helper contracts.** `normalizeBnplInstallment` (`debtCsv.ts:275`) documents the fallback the
change relies on: `bnplInstallment.ts:23-25` — "A BNPL WITHOUT both installment fields ... falls back
to the plain balance+minimum path unchanged." Returning `undefined` therefore keeps the row importable
rather than half-reconciled. The comment at `debtCsv.ts:121-123` states this correctly.

**Q4 — side effects.** Pure.

**Q5 — the new test.** `testDebtCsv.ts:262-273`, three cases: `2.5` -> `undefined`, `-3` ->
`undefined`, `4` -> `4`. **Would have failed on the defect**: with `Number.isFinite`, `2.5` comes back
as `2.5` and the first `eq` reds. The third case pins the non-regression.

⚠️ **The test does not exercise the mechanism its own comment names.** `testDebtCsv.ts:263-264` says
the harm is `normalizeBnplInstallment` computing `balance = scheduled x remaining` — but the fixture
row `Klarna,400,100,0,2026-09-01,bnpl,2.5` carries **no `scheduledPaymentAmount` column**, so
`isInstallmentNative` is false (`bnplInstallment.ts:31-32`) and the multiply never runs, with or
without the defect. The test pins the *parser* correctly; it does not pin the balance-rewrite. A row
with `scheduledPaymentAmount` present would have measured the stated harm (balance would have become
`100 * 2.5 = 250` instead of the typed `400`).

**Q6 — gates.** None added or changed.

**Q7 — newly possible.** For a file that *does* carry `scheduledPaymentAmount`, re-importing the same
CSV now produces a **different balance than it did before the change**: with `scheduled = 100`,
`remaining = 2.5` the old code reconciled `balance` to 250 (`bnplInstallment.ts:48`); the new code
drops the count and keeps the typed 400. That is the correct direction, but the row is accepted
silently either way — nothing pushes an error, nothing renders "a column was discarded", and no test
covers the `scheduledPaymentAmount` + fractional-count combination. A user re-importing the same file
across an app update sees a balance move with no explanation available anywhere in the app.

---

## B-3 — `dueDate` is now shape-checked and calendar-checked

`packages/core/imports/debtCsv.ts:226-231`
```
const dueDateValid =
    !!dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && toLocalISODate(parseLocalDate(dueDate)) === dueDate;
if (dueDate && !dueDateValid) { errors.push(...); return; }
```

### VERDICT: `SOUND`

**Q1 — prior properties.** The site previously did one thing with `dueDate`: refuse the row when it
was empty (`debtCsv.ts:232-235`). That branch is untouched and still runs, and the new guard is
ordered *before* it but is gated on `if (dueDate && ...)`, so a blank cell still falls through to
`"dueDate is required."` rather than to the new "not a date" message. The accepted-row assignments
(`dueDate` and `originalDueDate`, `debtCsv.ts:282-283`) are unchanged.

One ordering change worth naming: a row with **both** a bad date and a bad APR now reports the date
error instead of the APR error, because the parser returns on the first failure. That is a message
change, not a behaviour change — the row was skipped before and is skipped now.

**Q2 — environments — this is the binding case, and it is handled.**
`toLocalISODate(parseLocalDate(iso))` never touches UTC: `parseLocalDate` appends `T00:00:00`
(`packages/core/utils/localDate.ts:28`) and `toLocalISODate` reads `getFullYear/getMonth/getDate`
(`localDate.ts:16-19`). The round trip is therefore identity in every zone, including UTC+10/+12
(Sydney, Auckland). Had the obvious `new Date(dueDate).toISOString().slice(0,10)` been written, every
row would have been refused east of UTC.

⚠️ **The gate that is credited with catching this does reach this file, but only partly.**
`scripts/check-local-dates.ts:24-28` walks `packages/core` (so `imports/debtCsv.ts` is in scope), and
`check-local-dates.ts:38` bans exactly three written forms: `toISOString().slice(0,10)`,
`.substring(0,10)`, and `.toISOString().split('T')[0]`. A UTC round trip written any other way — e.g.
`new Date(dueDate).toISOString().startsWith(dueDate)` — would pass the gate green. The file's own
comment (`debtCsv.ts:219-225`) says the gate caught the first cut; I cannot verify which form that cut
used without reading the author's log, which the brief forbids. What I can state is that the gate
covers the file and covers three spellings, not the class.

Residual environment note: `parseLocalDate` produces local midnight, which does not exist on a
DST-spring-forward-at-midnight day (some non-shipping zones). Implementations shift forward within the
same calendar day, so `getDate()` is unchanged and the round trip still holds; none of the four
storefronts transitions at midnight anyway. I could not test this on a real device clock.

**Q3 — helper contracts.** `parseLocalDate` is documented to take `YYYY-MM-DD`; the `&&`
short-circuit guarantees the regex has passed before it is called (`debtCsv.ts:227`). For a
shape-valid-but-impossible date the engine may return either `Invalid Date` or a rolled-over day; in
the first case `toLocalISODate` yields `"NaN-NaN-NaN"`, in the second it yields the rolled date —
**both mismatch the input, so both refuse.** The check is correct under either host behaviour.

**Q4 — side effects.** Pure; the guard sits inside the existing per-row `forEach` alongside the
balance/minimum/APR guards, which is where this file already puts refusals.

**Q5 — the new tests.** Two, at `testDebtCsv.ts:247-260`.
- `"next friday"`: asserts `debts.length === 0` **and** that an error `includes("not a date")`. Would
  have failed on the defect — before the change that row imported cleanly and `debts.length` was 1.
  The second assert measures the message, which is the claimed subject (the FAQ-format error).
- `"2026-02-30"`: asserts `debts.length === 0`. Would have failed on a regex-only fix, which is the
  narrower defect it exists to pin. It does not assert the message, so it would also pass if the row
  were refused for an unrelated reason — a minor proxy, but the fixture differs from the passing
  happy-path row only in the date.

Both are in `test:regression` -> `validate:release:rn` (`packages/core/testing/runRegressionTests.ts:40`,
`package.json:46,57`).

**Q6 — gates.** No new gate. `lint:local-dates` is pre-existing and registered
(`package.json:15`, aggregated at `package.json:41` via `lint:rn`).

**Q7 — newly possible.**
1. ⚠️ **The most common real-world spreadsheet date is now a hard refusal.** Excel and most bank
   exports write `9/1/2026` or `01/09/2026`, and the parser accepts neither — the whole file is
   rejected row by row. Before this change those rows imported (wrongly, producing `NaN` at
   `allocatePaycheck.ts:300-304` and `rolloverPayCycle.ts:141`), so this is a strict improvement in
   correctness and a strict regression in *reach*. It also sits oddly against the stated principle one
   function earlier: `debtCsv.ts:104-106` widened the header parser precisely because "a real export
   from a bank or a spreadsheet says `Minimum Payment`". The same real export says `9/1/2026`.
   `site/support.html:286` now documents `YYYY-MM-DD`, and the error names the format, so the user is
   at least told what to do — but nothing in the repo measures how many real files this refuses.
2. A row whose date is `2026-02-30` gets the message "is not a date — use YYYY-MM-DD, e.g.
   2026-09-01", which is confusing for a value that *is* in that format. No test or gate covers the
   wording for that case.

---

## B-4 — APR strips `%` before parsing

`packages/core/imports/debtCsv.ts:253`
```
const apr = parseOptionalAmount(rawApr.replace(/%/g, ""));
```
(was `parseOptionalAmount(rawApr)`)

### VERDICT: `DEFECT`

**The input that breaks it: an APR cell whose only content is a percent sign (or `$%`, `%%`, `% `).**

`parseOptionalAmount` returns **`0` for blank** — that is its whole reason to exist, and its own doc
says so: `packages/core/utils/amountField.ts:53-57`, *"Blank returns `0`; unparseable returns `null`
so the form can refuse it."* Stripping `%` at the call site converts `"%"` into `""`, so:

- **before:** `normalize("%")` -> `"%"` (`amountField.ts:28` strips only `,`, whitespace, `$`) ->
  `Number("%")` is `NaN` -> `null` -> the row is refused at `debtCsv.ts:254`.
- **after:** `"%".replace(/%/g,"")` -> `""` -> `parseOptionalAmount("")` returns `0` -> the row is
  **accepted with `apr: 0`**.

That is precisely the outcome this file forbids, in two of its own comments:
`debtCsv.ts:28-30` — *"blank means 0%, unreadable STOPS the row. A mistyped APR silently becoming 0
makes the engine project an interest-free payoff on a card that charges"* — and `debtCsv.ts:237-239` —
*"Blank is a real answer (0%); unreadable is not."* The change walks straight back into the trap the
file documents one line above it. `"%"` is not blank; it is unreadable, and it now imports a
card charging 20% as an interest-free one.

The same mechanism accepts garbage that merely *contains* a percent sign: `"1%2"` -> `"12"` ->
imported as a 12% APR, a number the user never typed. Before, it was refused.

**Severity.** Low likelihood (a bare `%` cell is unusual), high consequence and directly against the
site's stated invariant. The correct shape is to strip `%` only when something else remains, e.g.
refuse when `rawApr !== "" && rawApr.replace(/%/g,"").trim() === ""`.

**Q1 — otherwise preserved.** Every APR that parsed before still parses to the same number (`%` does
not appear in them), the `apr > 100` bound is untouched, and the two-message split at
`debtCsv.ts:255-260` still distinguishes out-of-range from unreadable. The `readable` recomputation on
the reject path already stripped `%` (`debtCsv.ts:255`), which is what made the pre-change message
*"APR must be between 0 and 100"* fire over a perfectly valid `19.99%` — that half of the fix is real
and correct.

**Q2 — environments.** No timezone or platform surface. Locale: `parseOptionalAmount` strips `,` as a
grouping separator (`amountField.ts:28`), so a decimal-comma APR `"19,99%"` becomes `1999` and is
refused as out of range. That is pre-existing and explicitly in scope only for US/CA/AU/NZ
(`amountField.ts:20-23`).

**Q3 — helper contracts.** The change deliberately does **not** widen `normalize` in
`amountField.ts`, and the reasoning at `debtCsv.ts:249-251` is sound — `$40%` must not become a valid
bill. But it adopted the helper's blank-is-zero contract without accounting for the fact that its own
pre-processing can *manufacture* blank. That is the defect.

**Q4 — side effects.** Pure.

**Q5 — the new test.** `testDebtCsv.ts:239-244` parses `Visa,2400,75,19.99%,2026-09-01` and asserts
`errors.length === 0` **and** `debts[0].apr === 19.99`. That would have failed on the original defect
(the row was refused, `errors.length` 1) and the second assert pins the value rather than just the
absence of an error — a good test for what it covers. **It does not cover the manufactured-blank case
above**; no test in the file passes an APR cell of `"%"`, and nothing else in the repo would notice.

**Q6 — gates.** None added or changed.

**Q7 — newly possible.** `site/support.html:286` now tells users *"An APR may include a percent
sign."* A spreadsheet column formatted as a percentage exports as `0.1999`, not `19.99%`, and that
imports silently as a **0.1999% APR** — a wrong plan with no error, the exact failure class
`debtCsv.ts:28-30` exists to prevent. That path is pre-existing, but the new doc sentence points users
at percent-formatted columns, so the change raises its likelihood. Nothing in the repo detects an APR
that is implausibly small.

---

## B-5 — the new test block in `testDebtCsv.ts` (as a block)

`packages/core/imports/testDebtCsv.ts:231-284`

### VERDICT: `SOUND`

Each individual test is graded in B-1..B-4 above; this section covers the block's own properties.

- **Registered, not hand-run.** `packages/core/testing/runRegressionTests.ts:40` imports
  `@core/imports/testDebtCsv`, and the module self-executes at `testDebtCsv.ts:286`
  (`runDebtCsvTests()`). `test:regression` is inside `validate:release:rn` (`package.json:46,57`).
- **The runner is throw-based** (`testDebtCsv.ts:20-23`), so it stops at the first failing assert.
  Every block here leads with the assertion that actually distinguishes the defect
  (`errors.length === 0` / `debts.length === 0` / `remainingPayments === undefined`), so no pin is
  hidden behind a weaker one. This is the same ordering hazard the goal test at
  `apps/rn/src/store/persistenceLifecycle.test.ts:380-383` calls out, and this file does not fall into it.
- **Prior tests preserved.** Nothing above line 231 was edited; the happy-path row
  (`testDebtCsv.ts:49-59`) still asserts `apr === 19.99` and `dueDate === "2026-09-01"`, which
  independently guards the four changed code paths against a blanket loosening.
- ⚠️ **Two assertions are weaker than their comments.** The fractional-count fixture does not carry
  `scheduledPaymentAmount`, so the balance-rewrite mechanism it names never runs (B-2, Q5); and the
  `2026-02-30` case asserts only `debts.length === 0` without checking why.
- **Not covered by any test in the block:** an APR cell of `"%"` (B-4), duplicate normalised headers
  (B-1), and the `MM/DD/YYYY` date most spreadsheets emit (B-3).
- **No e2e coverage of any of the four changes.** `apps/rn/tests/e2e/csv-import.spec.ts:36` uses the
  canonical header and ISO dates throughout, so the suite is unaffected either way — correct
  (no false red) but it means these behaviours are pinned only at the core level, never through the
  sheet at `apps/rn/src/components/entities/ImportDebtsSheet.tsx:53`.

---

## B-6 — goals now run through `repairMoneyFields`

`apps/rn/src/data/migrations.ts:157-176` (the new `goals` const) and `:192` (added to the return)

### VERDICT: `SOUND`

**Q1 — prior properties.** Before, `goals` reached the returned store only through the `...r` spread
(`migrations.ts:187`). Everything that spread did correctly is preserved:

- key absent -> `repairMoneyFields` returns `fallback` (`migrations.ts:66-73`) which is `base.goals`,
  i.e. `[]` — the same value `...r` left in place, and **no repair is recorded** for the
  key-absent case (`migrations.ts:71` guards on `rows !== undefined`). An ordinary new install does not
  suddenly grow a repair card.
- an array of well-formed goals -> each row is shallow-copied (`migrations.ts:76`) with every
  non-money field carried through, so `id`, `name`, `type`, `priority` and any unknown
  forward-compatible key survive. Numeric money fields that are already finite numbers are left
  untouched (`readMoney`, `migrations.ts:45`), so no repair is recorded and the value is identical.
- the copy is a copy: `migrations.ts:76` spreads rather than mutating, which matters because one
  caller's object is the user's backup file — the property `migrations.ts:180-181` calls out for
  `prefs`. Preserved here.

**A behaviour that genuinely changes, in the right direction:** a **non-array** `r.goals` used to be
passed through raw by `...r`, so `store.goals` could be a string or an object and
`apps/rn/src/app/(tabs)/money.tsx:976` (`goals.map`) would throw on render. It now becomes `[]` plus a
recorded `(whole list unreadable)` repair (`migrations.ts:71`), matching what `debts`,
`requiredExpenses` and `livingExpenses` already did. No caller relied on the old passthrough.

**Field list is complete.** `Goal` (`packages/core/storage/debtPlannerStorage.ts:91-103`) has exactly
three numeric fields — `targetAmount`, `currentAmount`, `priorityPerPaycheck` — and all three are
listed at `migrations.ts:173`. Nothing money-shaped on `Goal` is left out.

**Q2 — environments.** No date, timezone, platform or theme surface. `readMoney` strips `,` only
(`migrations.ts:49`), consistent with `amountField.ts:18-23`'s period-decimal storefront scope.

**Q3 — helper contracts.** `repairMoneyFields`'s `entity` parameter is typed
`DataRepair['entity']` (`migrations.ts:60`), so `'goal'` only compiles because `models.ts:255` was
widened in the same change (see B-7). Idempotence — the contract
`apps/rn/src/data/migrationAudit/invariants.ts:161-163` enforces — holds: after one pass
`targetAmount` is a finite number and `priorityPerPaycheck` is `0`, both of which `readMoney` returns
with `repaired: false` on a second pass, so `repairs-not-repeated` stays green.

**Q4 — side effects.** None; `runMigrations` remains pure and the new const sits with its three
siblings.

**Q5 — the new test.** `apps/rn/src/store/persistenceLifecycle.test.ts:370-405`, registered at
`apps/rn/src/testing/runAppTests.ts:44` inside `test:app` -> `validate:release:rn`
(`package.json:46`). Four of its five assertions **would have failed with goals unrepaired**:
`priorityPerPaycheck` would be the string `'Infinity'` (fails `:388-391`), `targetAmount` the string
`'4,000'` (fails `:396`), `currentAmount` `null` (fails `:397`), and `pendingDataRepairs` would carry
no `goal` entry (fails `:399-404`). It pins the fix.

⚠️ **One assertion is inert.** `persistenceLifecycle.test.ts:392-395` asserts
`priorityPerPaycheck !== undefined`. That passes **with the defect present** (`'Infinity'` is not
`undefined`), and no reachable code path could produce `undefined` anyway — `readMoney` never returns
it and `migrations.ts:78` skips fields that are already `undefined`. It measures nothing.

⛔ **Q5, the finding that matters: the fix does not do what its comment and its test say it does.**
`migrations.ts:164-168` argues this is *"a money defect and not a display one"* because a `null` pace
*"removes the cap the user signed off on and funds the goal ahead of debt at full speed."* The
corruption does exactly that. **But the repair sets the value to `0`, and `0` is treated identically
to `null` by every reader:**
- `packages/core/engine/allocatePaycheck.ts:632` —
  `goal.priorityPerPaycheck != null && goal.priorityPerPaycheck > 0 ? goal.priorityPerPaycheck : Infinity`.
  `0 > 0` is false, so the pace is `Infinity`: **uncapped, exactly as before the repair.**
- `packages/core/engine/recommendedActions.ts:80` — same `!= null && > 0` guard, same outcome.

So for `priorityPerPaycheck` the change is a **reporting** fix, not a money fix: the goal still funds
at full speed ahead of debt, and the leading assertion at `persistenceLifecycle.test.ts:388-391`
(`=== 0 || Number.isFinite(...)`) is satisfied by the very value that reproduces the uncapped
behaviour. Per the brief, the code wins and the disagreement is the finding. (`targetAmount` and
`currentAmount` *are* fixed in the ordinary sense.)

**Q7 — newly possible.** ⛔ **A savings goal can now be badged "Funded" because the app could not read
its target.** `money.tsx:978` computes `funded = g.currentAmount >= g.targetAmount` and
`money.tsx:986` renders a `Funded` badge with `formatWhole(g.targetAmount)` "saved". With the repair,
a goal whose `targetAmount` was an unreadable **string** (`'4,000'`) becomes `0`, so `0 >= 0` is true
and the goal reads **"Funded · $0 saved"**. Before the change that same goal compared `0 >= '4,000'`
-> false and rendered a broken amount instead — visibly wrong rather than falsely reassuring.

This is the same failure the repo already fixed one tab over: `money.tsx:349-354` suppresses
*"Every balance cleared"* whenever `pendingDataRepairs.some(r => r.entity === 'debt')`, with the
comment *"never congratulate over money the app could not READ."* **The goals branch has no
equivalent guard** — `unreadDebts` filters on `entity === 'debt'` only, and nothing in
`money.tsx:963-990` consults `pendingDataRepairs` at all. The Today card
(`apps/rn/src/app/(tabs)/index.tsx:557`) does name the repair, but the false "Funded" badge sits on a
different screen and survives the acknowledgement.

Nothing in the repo would notice this: no unit test covers the goals branch of `money.tsx`, and no
e2e or shot fixture seeds a goal with a repaired target.

---

## B-7 — `DataRepair['entity']` gains `goal`, and `ENTITY_NOUN` gains its noun

`apps/rn/src/data/models.ts:250-255` · `apps/rn/src/components/plan/DataRepairsCard.tsx:12-23`

### VERDICT: `DEFECT`

**The situation that breaks it: a stored goal whose `priorityPerPaycheck` is unreadable.** The card
then renders a line the app cannot honour and a sentence that is false.

**Q1 — prior properties.** The type change is purely additive and every existing consumer still
compiles and behaves identically: `DataRepairsCard.tsx:29` (the `migration` early return),
`apps/rn/src/app/(tabs)/money.tsx:354` (`some(r => r.entity === 'debt')`), and
`migrations.ts:217`'s dedupe key. `describe()`'s two shapes — `"Your <noun> list — <field>"` and
`"<name> — <field>"` (`DataRepairsCard.tsx:31-32`) — are unchanged.

The exhaustive `Record<Exclude<DataRepair['entity'], 'migration'>, string>` at
`DataRepairsCard.tsx:18` does work as its new comment claims: omitting `goal` is a compile error, so
the `?? 'item'` fallback at `:30` stays unreachable. That is a real, compiler-enforced gate for this
one class, and it fired.

**Q2 — environments.** Copy only; no timezone, locale or platform surface. `'savings goal'` is
lower-case and lands mid-sentence in both templates, matching its three siblings. Not
`QA_TOOLS`-gated: the card renders from `index.tsx:557` whenever
`activeAck === 'data-repairs'` (`index.tsx:235-238`), which is ordinary shipping Today.

**Q3 / Q4.** No helper contracts, no side effects; the `Record` is module-scope const data.

⛔ **Q5/Q7 — THE DEFECT: the card's fixed copy is false for the field this change newly admits.**
`DataRepairsCard.tsx:64-67` states, over every line in the list:

> *"They are showing as $0, so your plan is leaving them out. Open each one and enter the real amount."*

and the a11y label at `:58` repeats *"These are showing as $0 until you set them."* For a repaired
`priorityPerPaycheck` **both halves are wrong**:

1. **The plan is not leaving it out.** `allocatePaycheck.ts:632` maps `0` to `Infinity`, so the goal
   funds *without a cap*, ahead of debt — the opposite of being left out (see B-6).
2. **There is nothing to open.** The goal row on Money (`money.tsx:987`) opens `GoalSheet`, which
   edits `name`, `targetAmount`, `currentAmount` and `type` only
   (`apps/rn/src/components/entities/GoalSheet.tsx:49,73-80`). `priorityPerPaycheck` is written **only
   at goal creation**, by `SaveForItSheet.tsx:103-110`. **No screen in the app can set the pace on an
   existing goal**, so the instruction is unfollowable.

The line the user actually reads is `"Roof — priorityPerPaycheck"` (`DataRepairsCard.tsx:32`, with
`repair.field` coming straight from `migrations.ts:86`). Raw field identifiers were already
user-visible for debts (`balance`, `minimumPayment`, `scheduledPaymentAmount`), so this is not new in
kind — but `priorityPerPaycheck` is the least readable of them and the only one with no editor behind
it.

**Nothing would catch this.** No test asserts the card's copy against the entity it is describing;
`DataRepairsCard` has no unit test, `apps/rn/tests/e2e/data-recovery.spec.ts` seeds a **debt** repair
only (`:114`), and `scripts/check-copy-owners.ts:34+` is a hard-coded pairing list that does not
include this file. `lint:copy` / `lint:glossary` read string literals and would see `'savings goal'`
as ordinary copy.

**A smaller companion finding.** `models.ts:255` widens a union that `money.tsx:354` switches on, and
that switch is **not** exhaustiveness-checked — it filters `entity === 'debt'` and silently ignores
every other member. B-6's "Funded" badge is exactly the case that needed a `'goal'` arm there. The
compiler gate the new comment celebrates protects one call site; the other one took the widening
without a word.

---

## B-8 — cross-cutting residuals (Q7 across the cluster)

Not a hunk-group verdict; these are situations the cluster's changes leave newly or still possible,
each with whether anything in the repo would notice.

1. ⚠️ **The money-repair enumeration is still short, in the same way the goal fix says it was.**
   `migrations.ts:140-176` repairs `debts`, `requiredExpenses`, `livingExpenses` and now `goals`.
   Every one of these is a stored money field that is **still** unrepaired and unreported:
   - `RequiredExpense.fullAmount` (`packages/core/storage/debtPlannerStorage.ts:37`) — the trial /
     intro-price jump the Guardian reserves against. `migrations.ts:155` passes `['amount']` only.
   - `RecommendationOverride.amount` (`debtPlannerStorage.ts:108`), reached via
     `apps/rn/src/data/models.ts:270`.
   - `IncomeActual.plannedIncome` / `actualIncome` (`debtPlannerStorage.ts:183-184`), reached via
     `models.ts:343` (`incomeActualsLog`).
   - `SurpriseOutflow.amount` (`debtPlannerStorage.ts:192`), reached via `models.ts:345`.
   Nothing enumerates money fields against the repair list, so the next omission is found the same
   way this one was — by a person looking.

2. **A `null` or non-object row *inside* `goals` still passes through untouched**
   (`migrations.ts:75` returns `row as T`), so `money.tsx:977` (`g.targetAmount`) would throw on
   render. Unchanged by this diff — `...r` did the same — but it is now inside a function whose job is
   to make lists safe, and no test covers a null element in any of the four lists.

3. ⚠️ **The in-app CSV instructions were not updated with the support page.**
   `site/support.html:286` now documents `YYYY-MM-DD` and the percent-sign tolerance, but
   `apps/rn/src/components/entities/ImportDebtsSheet.tsx:118-120` still reads *"Columns: name,
   balance, minimumPayment, apr, dueDate. APR can be left blank for 0%"* and says nothing about the
   date format — which is now a **hard refusal** for the `9/1/2026` most spreadsheets emit (B-3, Q7).
   The user who imports from inside the app is told less than the one who reads the website, and the
   parser is now stricter than the caption. Nothing gates app copy against site copy.

4. **Goal repairs take the top acknowledgement slot on Today.** `index.tsx:237-238` ranks
   `data-repairs` above milestone, celebration, trial and tutorial. A corrupt goal — a class that
   produced no repair before this change — now suppresses all of those until the user taps "Got it".
   That is consistent with the stated design (`index.tsx:232-234`), and is recorded only because it
   is newly reachable from goal data.

---

## Verdict tally

| verdict | count | sections |
|---|---|---|
| `SOUND` | 5 | B-1 headers · B-2 `toCount` · B-3 `dueDate` · B-5 test block · B-6 goal repair |
| `DEFECT` | 2 | B-4 APR `%` strip · B-7 repair card copy for `goal` |
| `SOUND-UNPINNED` | 0 | |
| `REGRESSION` | 0 | |
| `WEAK-TEST` | 0 | (two inert assertions noted inside otherwise-pinning blocks: B-2 Q5, B-6 Q5) |
| `DEAD` | 0 | |
| `UNREACHABLE-GATE` | 0 | (no gate added or changed in this cluster) |

### Defects, most severe first

1. **B-7 — the repairs card tells the user something false and unactionable for a repaired goal
   pace.** `DataRepairsCard.tsx:64-67` claims the value "is showing as $0, so your plan is leaving it
   out"; `allocatePaycheck.ts:632` maps `0` to `Infinity`, so the goal funds **uncapped ahead of
   debt**, and `GoalSheet.tsx:49` offers no field to correct it. Nothing tests the card's copy against
   the entity.
2. **B-4 — an APR cell of `"%"` now imports as 0%.** `debtCsv.ts:253` strips `%` before
   `parseOptionalAmount`, whose blank contract returns `0` (`amountField.ts:53-57`), so an unreadable
   rate becomes an interest-free card — the exact outcome `debtCsv.ts:28-30` and `:237-239` forbid.
   Narrow input, wrong-plan consequence.
3. **B-6/Q7 — a savings goal can be badged "Funded" over money the app could not read.**
   `money.tsx:978` (`0 >= 0`) after `targetAmount` is repaired to `0`; the debts branch guards this
   at `money.tsx:354` and the goals branch has no equivalent.
4. **B-6/Q5 — the goal-pace fix is a reporting fix, not the money fix its comment and test claim.**
   `migrations.ts:164-168` vs `allocatePaycheck.ts:632` / `recommendedActions.ts:80`.
5. **B-3/Q7 — `MM/DD/YYYY` is now a total import failure**, while the same change widened the header
   parser explicitly to accommodate real spreadsheet exports. Correct direction, unmeasured reach.

### What I could not determine

- Which written form the first cut of the `dueDate` round-trip used, and therefore whether
  `scripts/check-local-dates.ts:38` actually caught it — the gate bans three spellings, not the class,
  and confirming the claim would mean reading the author's log, which the brief forbids.
- Whether a shape-valid impossible date (`2026-02-30`) reaches `parseLocalDate` as `Invalid Date` or
  as a rolled-over day on every JS engine this ships to. I did not execute anything to find out; the
  check refuses correctly under either behaviour, so the verdict does not depend on it.
- Anything requiring a real device clock or a non-shipping timezone with a midnight DST transition.
