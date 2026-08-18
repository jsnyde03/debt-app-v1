# L4 — numbers & visual cohesion

Covered: the 4 multi-formatter surfaces named by `slices/L4-numbers-visual.md`
(`(tabs)/index.tsx`, `(tabs)/money.tsx`, `(tabs)/progress.tsx`, `history.tsx`), the three
formatters (`formatCurrency`, `formatWhole`, `formatDisplayAmount`), and the 5 single-use
`components/ui` primitives. ~28 files read. Every finding below marked `yes-read-the-source`
was traced to the call site AND to the selector that produces the value, so "same underlying
value" means the same expression, not a guess.

⚠️ **The slice under-counts.** It tracks three named exports. The app has **nine** money
formatters — see L4-2. Every "reaches one formatter" row for a Today component is therefore
not evidence of cohesion.

The rule the codebase states for itself (in `formatCurrency.ts`'s own comment, from the App
Preview defect 3.5.8.7): **hero figures → `formatWhole`, ledger rows → `formatCurrency`**
(cents only when there are cents). Findings are judged against that rule.

---

### L4-1 · "Spoken for" is $486 on Today and $486.34 in the sheet that legend opens
- **Severity:** major
- **Class:** numbers
- **Where:** `apps/rn/src/components/plan/PlanHero.tsx:73,180` · `apps/rn/src/components/plan/SpokenForSheet.tsx:41,46` · wired in `apps/rn/src/app/(tabs)/index.tsx:641-645`
- **The inconsistency:** PlanHero computes `spokenFor = everyday + billsReserve` (lines 71–73) and renders it with its local `money0` — `$` + `Math.round(...)`, whole dollars. Tapping that same legend item opens `SpokenForSheet`, which is handed the *same two inputs* from `index.tsx` (`summary.everydayReserve`, `summary.billsReserve`), recomputes `total = everyday + billsReserve` (line 41), and renders it as its echo headline with `formatCurrency` (line 46). One tap, no state change, the same sum: `$486` becomes `$486.34`. The a11y label at `PlanHero.tsx:189` compounds it — it speaks all three figures (`Spoken for …. Everyday …, bills …`) in rounded form, so VoiceOver announces a total the sheet then contradicts.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** the sheet echoes the surface it came from — render the `SpokenForSheet` headline with `formatWhole` (it is a hero echo, not a row), keeping its per-row `formatCurrency`.

### L4-2 · Nine money formatters, not three — six of them hand-rolled inside Today's cards
- **Severity:** major
- **Class:** numbers
- **Where:** `components/plan/AffordabilityCard.tsx:20` · `components/plan/PaydayGuardianCard.tsx:492` · `components/plan/RecoveryPlanSection.tsx:12` · `components/plan/SaveForItSheet.tsx:15` · `components/plan/LeanSuggestionCard.tsx:13` · `components/plan/PlanHero.tsx:27` · vs `packages/core/utils/formatCurrency.ts` · `apps/rn/src/utils/format.ts` · `packages/core/utils/formatDisplayAmount.ts`
- **The inconsistency:** four byte-identical private copies of `function money(n)` (`$${Math.round(Math.max(0, Number.isFinite(n) ? n : 0)).toLocaleString('en-US')}`) plus two `money0` variants that have **drifted already**: `PlanHero`'s drops the `Number.isFinite` guard, `LeanSuggestionCard`'s drops *both* guards. Concretely, for the same input: `formatWhole(-45)` → `-$45`; the four `money()` copies → `$0`; `LeanSuggestionCard`'s `money0(-45)` → **`$-45`**, which is not a currency string in any locale. `money0(NaN)` in `LeanSuggestionCard` → `$NaN`, the exact output `formatCurrency`'s defensive branch exists to prevent. For positive whole values all nine agree, so this is latent rather than visible today — which is precisely why it survived a generated formatter audit that only counts three named exports.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** delete all six locals and call `formatWhole`; if the `max(0, …)` clamp is wanted, it belongs in the caller (a clamp is a *decision about the value*, not a formatting rule).

### L4-3 · The "where it goes" receipt rounds the total it is showing the work for
- **Severity:** major
- **Class:** numbers
- **Where:** `apps/rn/src/components/money/BillBreakdownSheet.tsx:55,73,86`
- **The inconsistency:** the sheet's whole purpose is "shows its work" — and the work does not add up on screen. The headline is `formatWhole(data.perPaycheckTotal)`; every category subtotal below it is `formatCurrency(cat.perPaycheck)` and every bill line `formatCurrency(b.perPaycheck)`. `perPaycheckTotal` (from `selectRecurringSmoothed`, `expenseReserveSelectors.ts:37-43`) is `Σ monthlyEquivalent(bill) / perCycle` over exactly the same recurring set the categories partition, so the visible rows *are* the addends of the headline. Smoothed figures are almost never whole (a $1,680/yr bill over 2.17 checks is $64.52), so this is the normal case, not an edge: categories reading `$210.44 · $65.13 · $18.09` sit under a headline reading `$294`.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** in this sheet only, the category/bill lines are the hero's breakdown — render them with `formatWhole` too, so the column reconciles by eye (the per-bill `formatCurrency(b.amount)` cadence line stays, it is a different quantity).

### L4-4 · The same category subtotal is "$412/paycheck" on Money and "$411.54/paycheck" in the sheet
- **Severity:** major
- **Class:** numbers
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:605,675` (section headers) · `apps/rn/src/components/money/BillBreakdownSheet.tsx:73`
- **The inconsistency:** `money.tsx`'s bill section header renders `${formatWhole(amt)}/paycheck` where `amt = perCheck(items) = bills.reduce(monthlyEquivalent) / perCycle` (line 583). `BillBreakdownSheet` renders `${formatCurrency(cat.perPaycheck)}/paycheck` where `cat.perPaycheck = catBills.reduce(monthlyEquivalent) / perCycle` (`money.tsx:551`). **Byte-identical expression, identical bill set, identical trailing label `/paycheck`, one tap apart** — one whole, one to the cent. This is the clearest failure of the "same rule on every surface" test: the whole/cents boundary sits at the same tier (a category subtotal) in both places and lands on opposite sides.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** same fix as L4-3 — category subtotals are `formatWhole` everywhere.

### L4-5 · The one-time bill total is whole on Money and to the cent in the sheet
- **Severity:** minor
- **Class:** numbers
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:539,621,675` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:98`
- **The inconsistency:** `oneTimeTotal = oneTime.reduce((s, e) => s + e.amount, 0)` (`money.tsx:539`) is rendered three ways from one variable: as the Bills hero when there are no recurring bills — `formatWhole(oneTimeTotal)` (675); as the one-time section header — `${formatWhole(amt)} one-time` (621); and in the sheet as `Plus ${formatCurrency(data.oneTimeTotal)} in N one-time bills` (98). The sheet is passed the literal same variable via `breakdownData` (563-570). One-time bills are user-entered amounts that routinely carry cents, so `$412` / `$412.37` for one number on two screens is the normal case.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** `formatWhole` in the sheet's one-time line — it is a summary sentence, not a ledger row.

### L4-6 · A required-actions bucket header does not sum the rows under it, and rounds so you can't tell why
- **Severity:** major
- **Class:** numbers
- **Where:** `apps/rn/src/components/plan/RequiredActionsCard.tsx:167,177,303` · total defined at `apps/rn/src/store/planSelectors.ts:254`
- **The inconsistency:** the bucket header shows `formatWhole(bucket.total)` where `total = rows.reduce((s, r) => s + r.item.amount, 0)` — what *this paycheck* contributes. Each row headline shows `formatCurrency(item.amount + reserveCovered)` — what the *biller* is owed (deliberate, and documented at 291-293). So on a $120 bill with $50 covered from the reserve, the row reads `$120.00` under a header reading `$70`. The two are different quantities on purpose, but they are stacked in the same visual column with no label distinguishing them, and the header's rounding removes the last cue that they were never meant to reconcile. This is the one finding here where the *formatter* split is the smaller half of the problem.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** label the bucket total for what it is (e.g. `$70 from this paycheck`) rather than leaving a bare figure that invites summing the column.

### L4-7 · One card, one toggle: Cushion shows whole dollars, Timeline shows cents
- **Severity:** minor
- **Class:** numbers
- **Where:** `apps/rn/src/components/progress/CashFlowSection.tsx:69,113,134,138` · `apps/rn/src/components/progress/TimelineLedger.tsx:80,102,113`
- **The inconsistency:** `CashFlowSection`'s own docstring says "Same `selectCashTimeline` data, user picks the view." The Cushion lens renders `formatWhole(cycle.net)` per bar and `formatWhole(floor)` in the legend; flipping the `SegmentedToggle` to Timeline renders `formatCurrency(cycle.endingBalance)` per cycle chip and `formatCurrency(item.amount)` / `formatCurrency(item.runningCash)` per row. `net` and `endingBalance` are genuinely different fields (`buildMultiCycleTimeline.ts:26,37` — `endingBalance` is clamped, `net` is not), so this is **not** the same value rendered twice. It is a granularity change inside one card triggered by a toggle, which reads as instability rather than as two lenses. The Timeline half is correctly a ledger; the Cushion half is correctly a chart. Borderline-defensible — flagged because the two sit under one heading.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** leave the formatters, but let the Timeline chip carry the `net`-style whole figure or the Cushion bars carry a cents-precise a11y label, so the toggle never changes the precision of a figure the user just read.

### L4-8 · `tabular-nums` is defeated by `minimumFractionDigits: 0`
- **Severity:** minor
- **Class:** visual
- **Where:** `packages/core/utils/formatCurrency.ts:18` · `apps/rn/src/theme/typography.ts:40` (`numericBody`) · consumed by `components/progress/TimelineLedger.tsx:134` (`amount`, `chipText`), `apps/rn/src/app/history.tsx:82`, `components/ui/ListRow.tsx`, `components/payday/PaydayCaptureSheet.tsx:268,339,418`
- **The inconsistency:** `numericBody` and TimelineLedger's `amount`/`chipText` all set `fontVariant: ['tabular-nums']`, whose only purpose is a right-aligned money column whose digits line up. `formatCurrency` emits cents *only when there are cents*, so the same column renders `$1,240` and `$45.37` — the decimal points do not align, because tabular figures equalise digit *widths*, not fraction counts. The typography choice and the formatter choice were each right and were made against each other.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** keep `minimumFractionDigits: 0` for prose/inline figures, but give aligned ledger columns a 2-decimal variant (or right-pad the fraction) so the column reads as a column.

### L4-9 · "Reserved each paycheck" is whole on Bills and to the cent on Living Expenses
- **Severity:** minor
- **Class:** numbers
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:677-683` (Bills hero + caption) vs `apps/rn/src/app/living-expenses.tsx:48-52` ("Reserve per paycheck")
- **The inconsistency:** two per-paycheck reserve figures, one tab apart, both card-headline figures in the same visual role. Bills: `formatWhole(reservedNow)` with caption `of ${formatWhole(perPaycheckTotal)} recommended each paycheck`. Living Expenses: a `Card tone="accent"` summary reading `formatCurrency(activeTotal)`. Same concept ("what this paycheck sets aside"), same tier, two granularities. Per the app's own hero rule, the Living Expenses summary is a hero and should be `formatWhole`.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** `formatWhole` on the Living Expenses "Reserve per paycheck" card; its `ListRow` amounts stay `formatCurrency`.

### L4-10 · History's anchor rounds a difference the rows state to the cent
- **Severity:** polish
- **Class:** numbers
- **Where:** `apps/rn/src/app/history.tsx:42,82` · `apps/rn/src/store/historySelectors.ts:26`
- **The inconsistency:** the anchor is `formatWhole(summary.paidDown)` where `paidDown = h[0].totalDebtBalance - h[last].totalDebtBalance`; the row balances that are its two operands are `formatCurrency(row.totalDebtBalance)`. A user subtracting the oldest row from the newest gets a figure up to $0.50 off the headline. Correct hero/row split per the stated rule, and the drift is sub-dollar — recording it so the reconcile question is answered rather than left open.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** none needed; if it ever reads badly, round the operands rather than the result.

### L4-11 · `formatDisplayAmount` is dead — a third of the audited formatter surface is unreachable
- **Severity:** polish
- **Class:** numbers
- **Where:** `packages/core/utils/formatDisplayAmount.ts`
- **The inconsistency:** zero call sites anywhere in `apps/` or `packages/` (grepped for the identifier across all `.ts`/`.tsx`). It splits an amount into `{ dollars, cents }` for a large-dollars/small-cents hero treatment that nothing renders. It counts as one of the "three formatters" the slice measures against, so its presence inflates the apparent formatter spread while contributing nothing. Note it is also the only one of the three with no `Number.isFinite` guard.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** delete it, and re-run `audit:surfaces` so the gate's own input says "two formatters".

### L4-12 · `AddRow` replaced the chunky end-of-list button — on Money only
- **Severity:** minor
- **Class:** visual
- **Where:** `apps/rn/src/components/ui/AddRow.tsx` (docstring) · used at `(tabs)/money.tsx:320,383,385,744,924` · vs `apps/rn/src/app/living-expenses.tsx:68`
- **The inconsistency:** `AddRow`'s own docstring: *"Replaces the chunky secondary button at the foot of the Money sections."* Living Expenses — a list screen reached from the Money tab's own reserve tile — still ends in exactly that: `<Button label="Add spending item" variant="secondary" />`. Same job (append an item to this list), same position (foot of the list), two affordances: a dashed full-width add row vs a filled secondary button. This is the single-use primitive that most clearly wants sharing rather than localising.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** `<AddRow label="Add spending item" onPress={…} />` at `living-expenses.tsx:68`.

### L4-13 · Two press-feedback vocabularies and six pressed-opacity constants, none of them tokens
- **Severity:** minor
- **Class:** visual
- **Where:** `components/ui/PressableScale.tsx` (used only by `components/more/SettingRow.tsx:71`) · `(tabs)/money.tsx:852` (0.85), `:965` (0.8) · `components/ui/AddRow.tsx:33` (0.6) · `components/ui/CheckCircle.tsx:69` (0.7) · `components/ui/ListRow.tsx:86` (0.9) · `components/ui/Pill.tsx:25` (0.8) · `components/ui/Button.tsx:68` (0.85) · `components/entities/AddObligationSheet.tsx:83` and `DebtSheet.tsx:275,287` (0.7)
- **The inconsistency:** `PressableScale`'s docstring claims the house rule for "tappable cards/rows" — a spring press-scale. Exactly one component adopts it (More's `SettingRow`). Every other tappable card/row dims instead, at six different values (0.6 / 0.7 / 0.8 / 0.85 / 0.9, plus `Button`'s hover 0.9 and disabled 0.5), all inline literals with no `theme/` token. Concretely: the More tab's rows spring under a finger; Money's tappable hero card (`money.tsx:961-965`, same target class, same size) dims to 0.8; the Living reserve card right above it dims to 0.85. This is not a fork of `PressableScale` — I grepped for hand-rolled `onPressIn` scale animations and found none — it is a shared primitive that never got adopted, which is the same drift with the opposite sign.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** put the pressed opacity in `theme/` as one token, and decide whether card-sized targets use `PressableScale` app-wide or nowhere.

### L4-14 · `TwoColumn`'s docstring names Progress; Progress does not use it
- **Severity:** polish
- **Class:** visual
- **Where:** `apps/rn/src/components/ui/TwoColumn.tsx:10-11` · `(tabs)/index.tsx:295` · `(tabs)/progress.tsx:57,158`
- **The inconsistency:** the primitive documents itself as *"Used by the single-object dashboards (Today, Progress) that reflow to two columns"*. Progress instead does `maxWidth={isExpanded ? 980 : undefined}` with an explicit comment (3.6.4: *"a wider centered column on iPad (not two-column)"*). **The divergence itself is justified** — a ring plus two time-series charts want width, not columns. The docstring is stale, and it is the kind of stale that makes a reader believe two dashboards share a reflow rule they do not. This is why `TwoColumn` shows as single-use in the slice: correct, and the reason is a deliberate later decision the primitive's own header never learned about.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** drop "Progress" from the docstring and name the 3.6.4 exception.

### L4-15 · `livingTotal` is derived twice from the same rule
- **Severity:** minor
- **Class:** numbers
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:527` · `apps/rn/src/app/living-expenses.tsx:30`
- **The inconsistency:** `living.filter((l) => l.enabled).reduce((s, l) => s + l.amount, 0)` appears verbatim in both files. Today they agree and both render through `formatCurrency`, so **there is no visible defect** — filed because `expenseReserveSelectors.ts:11-15` documents "two places, one rule" as this codebase's repeat failure mode and says the smoothing math was pulled into a selector for exactly this reason. This one was missed.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** one `selectLivingReserveTotal(store)` selector, both callers.

### L4-16 · `CheckCircle`, `MasterDetail`, `PressableScale` as single-use — three verdicts
- **Severity:** polish
- **Class:** visual
- **Where:** `components/ui/CheckCircle.tsx` · `components/ui/MasterDetail.tsx` · `components/ui/PressableScale.tsx`
- **The inconsistency:** none, for two of the three. **`CheckCircle` is a justified special case** and is the model for how this should look: it is reached only via Today because check-off only exists on Today (`RequiredActionsCard`, `RecommendedActionsCard`), and it already *exports its own feedback rule* (`checkOffHaptic`) so the alternate swipe affordance at `RequiredActionsCard.tsx:252` cannot drift from the tap — the file's comment names the risk exactly ("an agreeing copy is still a copy, it just has not diverged yet"). **`MasterDetail` is a justified special case** under an explicit design lock (3.6, Money-only); note its compact branch (`:52`) is documented-unreachable from its only caller, so the file carries a second owner of a rule decided above it — filed there already, not endorsed. **`PressableScale` is the one that is not fine** — see L4-13.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** no action for `CheckCircle`/`MasterDetail`.

---

## Summary

**Counts by severity:** **0 blocker · 5 major · 7 minor · 4 polish** (16 findings).
- major: L4-1, L4-2, L4-3, L4-4, L4-6
- minor: L4-5, L4-7, L4-8, L4-9, L4-12, L4-13, L4-15
- polish: L4-10, L4-11, L4-14, L4-16

**Verdict on the 4 multi-formatter surfaces:**

| surface | verdict |
|---|---|
| `(tabs)/index.tsx` (Today) | **Accidental, and worse than the slice can see.** The row says two formatters; Today actually reaches **eight** — the two named ones plus six private copies in `components/plan/` (L4-2), two of which have already drifted their guards. On top of that the hero→sheet handoff renders one value two ways (L4-1) and a bucket header does not sum its rows (L4-6). This is the surface to fix first. |
| `(tabs)/money.tsx` | **Accidental.** The hero/row rule is applied correctly at the top level (`MoneyHero` whole, `ListRow` cents, and the `isEstimate ? ~formatWhole : formatCurrency` split at `:462` is a good deliberate use). It breaks at the *group-subtotal* tier: the same expression renders whole in the section header and to the cent in the sheet one tap away (L4-4, L4-5), and the sheet whose job is itemising rounds its own total (L4-3). |
| `(tabs)/progress.tsx` | **Deliberate, with one wrinkle.** `formatWhole` on the journey headline is explicitly annotated (HON-1, `:180`) and correct; `formatCurrency` arrives only through `TimelineLedger`, which is a true ledger. The one issue is that both live inside one toggled card, so precision changes under a toggle (L4-7). Closest to clean of the four. |
| `history.tsx` | **Deliberate and correct.** Whole-dollar anchor, cents in the cycle rows — textbook application of the stated rule. Only residue is sub-dollar arithmetic drift between the anchor and its two operands (L4-10). No action needed. |

**Also clean, stated explicitly:** the Living reserve pair (`money.tsx:858` tile ↔ `living-expenses.tsx:51` summary) renders the identically-derived total through the same formatter — same value, same treatment, two surfaces. That is what the rest of these should look like.

⚠️ **One instrument note for the gate:** `slices/L4-numbers-visual.md` reports formatter reach by tracking three named exports. Six of the app's nine money formatters are file-local functions and are invisible to it, all six on the highest-traffic surface. A row reading "one formatter" is not evidence of cohesion. Consider extending `scripts/surface-inventory.ts` to flag any local function returning a `$`-prefixed string.
