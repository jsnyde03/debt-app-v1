# Surfaces — what each screen is built from

> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:surfaces`.
> Input to the whole-app **cohesion** gate, not its output.
>
> ⚠️ **Reachability, not rendering.** A conditional branch counts as reachable. This over-reports
> rather than under-reports — the right direction for an audit input, but do not read a row as
> "this screen shows all of these".

## Numbers — which money formatter each surface reaches

Two are shared. The cohesion question is whether the same amount renders the same way everywhere;
a surface reaching more than one renderer is where it can stop doing so. *(Wave C · C1.)*

> ⛔ **This table counted SHARED formatters only, and reported three.** The 2026-08-17 audit
> measured **nine** — six hand-rolled file-locals, two of which had already dropped the
> non-finite guard `formatCurrency` exists to provide. A row reading "one formatter" was never
> evidence of cohesion. Local copies are listed now, because they are where cohesion breaks.

| surface | shared | hand-rolled (local) |
|---|---|---|
| `apps/rn/src/app/(tabs)/_layout.tsx` | — | — |
| `apps/rn/src/app/(tabs)/index.tsx` | formatCurrency · formatWhole | money0@apps/rn/src/components/plan/LeanSuggestionCard.tsx · money0@apps/rn/src/components/plan/PlanHero.tsx · money@apps/rn/src/components/plan/AffordabilityCard.tsx · money@apps/rn/src/components/plan/PaydayGuardianCard.tsx · money@apps/rn/src/components/plan/RecoveryPlanSection.tsx · money@apps/rn/src/components/plan/SaveForItSheet.tsx |
| `apps/rn/src/app/(tabs)/money.tsx` | formatCurrency · formatWhole | — |
| `apps/rn/src/app/(tabs)/progress.tsx` | formatCurrency · formatWhole | formatAxisBalance@apps/rn/src/components/payoff/TrajectoryChart.tsx |
| `apps/rn/src/app/+not-found.tsx` | — | — |
| `apps/rn/src/app/_layout.tsx` | formatWhole | — |
| `apps/rn/src/app/cushion-forecast.tsx` | formatWhole | — |
| `apps/rn/src/app/demo.tsx` | — | — |
| `apps/rn/src/app/history.tsx` | formatCurrency · formatWhole | — |
| `apps/rn/src/app/living-expenses.tsx` | formatCurrency | — |
| `apps/rn/src/app/more.tsx` | formatWhole | — |
| `apps/rn/src/app/onboarding.tsx` | — | — |
| `apps/rn/src/app/paywall.tsx` | — | — |
| `apps/rn/src/app/schedule/[id].tsx` | formatCurrency | — |
| `apps/rn/src/app/tutorial.tsx` | — | — |

**4** surfaces reach more than one money renderer. **7** hand-rolled formatters exist:

- `formatAxisBalance@apps/rn/src/components/payoff/TrajectoryChart.tsx`
- `money0@apps/rn/src/components/plan/LeanSuggestionCard.tsx`
- `money0@apps/rn/src/components/plan/PlanHero.tsx`
- `money@apps/rn/src/components/plan/AffordabilityCard.tsx`
- `money@apps/rn/src/components/plan/PaydayGuardianCard.tsx`
- `money@apps/rn/src/components/plan/RecoveryPlanSection.tsx`
- `money@apps/rn/src/components/plan/SaveForItSheet.tsx`

## Visual — shared primitives, and the ones that are not shared

A `components/ui` primitive reachable from exactly ONE route is either bespoke work that wants
sharing, or shared code that wants localising. Reachable from none is dead *(Wave C · C7)*.

**Reached by exactly one surface:**

- `AddRow` — only `apps/rn/src/app/(tabs)/money.tsx`
- `CheckCircle` — only `apps/rn/src/app/(tabs)/index.tsx`
- `MasterDetail` — only `apps/rn/src/app/(tabs)/money.tsx`
- `PressableScale` — only `apps/rn/src/app/more.tsx`
- `TwoColumn` — only `apps/rn/src/app/(tabs)/index.tsx`

**Reached by no surface:**

_None._

## Every surface, and its vocabulary

### `apps/rn/src/app/(tabs)/_layout.tsx`

_no shared primitives_

### `apps/rn/src/app/(tabs)/index.tsx`

`AnimatedSheet` · `AppIcon` · `AppIcon` · `Button` · `Card` · `ChartSkeleton` · `CheckCircle` · `DateField` · `DateField.web` · `FormSheet` · `Pill` · `RadioGroup` · `Select` · `SheetBackdrop` · `SheetScrim` · `Slider` · `SwitchRow` · `TextField` · `TwoColumn` · `sheet-styles`

### `apps/rn/src/app/(tabs)/money.tsx`

`AddRow` · `AnimatedSheet` · `AppIcon` · `AppIcon` · `Button` · `Card` · `ChartSkeleton` · `DateField` · `DateField.web` · `EmptyState` · `FormSheet` · `ListRow` · `MasterDetail` · `Pill` · `RowContextMenu` · `RowContextMenu` · `RowContextMenu.types` · `SegmentedToggle` · `Select` · `SheetBackdrop` · `SheetScrim` · `SwitchRow` · `TextField` · `sheet-styles`

### `apps/rn/src/app/(tabs)/progress.tsx`

`AppIcon` · `AppIcon` · `Button` · `Card` · `ChartSkeleton` · `EmptyState` · `SegmentedToggle` · `Slider`

### `apps/rn/src/app/+not-found.tsx`

_no shared primitives_

### `apps/rn/src/app/_layout.tsx`

`AppIcon` · `AppIcon` · `Button` · `Card`

### `apps/rn/src/app/cushion-forecast.tsx`

`AppIcon` · `AppIcon` · `Card` · `ChartSkeleton`

### `apps/rn/src/app/demo.tsx`

_no shared primitives_

### `apps/rn/src/app/history.tsx`

`AppIcon` · `AppIcon` · `Card`

### `apps/rn/src/app/living-expenses.tsx`

`AppIcon` · `AppIcon` · `Button` · `Card` · `EmptyState` · `FormSheet` · `ListRow` · `Pill` · `RowContextMenu` · `RowContextMenu` · `RowContextMenu.types` · `SheetBackdrop` · `SheetScrim` · `SwitchRow` · `TextField` · `sheet-styles`

### `apps/rn/src/app/more.tsx`

`AppIcon` · `AppIcon` · `Button` · `Card` · `FormSheet` · `PressableScale` · `SegmentedToggle` · `SheetBackdrop` · `SheetScrim` · `TextField` · `sheet-styles`

### `apps/rn/src/app/onboarding.tsx`

`AppIcon` · `AppIcon` · `Button` · `RadioGroup` · `SegmentedToggle` · `SwitchRow` · `TextField`

### `apps/rn/src/app/paywall.tsx`

`AppIcon` · `AppIcon` · `Button`

### `apps/rn/src/app/schedule/[id].tsx`

_no shared primitives_

### `apps/rn/src/app/tutorial.tsx`

_no shared primitives_

