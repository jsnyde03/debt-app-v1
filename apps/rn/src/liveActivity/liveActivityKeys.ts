/**
 * Payday Countdown Live Activity identifiers, in a DEDICATED non-platform-split module — the SAME rule
 * as `widget/widgetKeys.ts`: a `.native`/`.web`-split constants file resolves to itself on native (the
 * `.native` extension wins for every importer, including itself) → a circular self-re-export that
 * stack-overflows on first read. A plain constants module has no platform variant, so it can't
 * self-resolve. See `feedback_platform_split_reexport_gap`.
 *
 * The Live Activity ships INSIDE the existing widget extension (joins `DebtWidgetBundle`), so it shares
 * the widget's App Group. These MUST match the Swift `PaydayActivityAttributes` + the widget target.
 */
export const LIVE_ACTIVITY_APP_GROUP = 'group.com.jasonsnyder.debtplanner';

/** Deep link the Lock Screen / Dynamic Island tap opens → the Today screen (where the Guardian lives). */
export const PAYDAY_ACTIVITY_DEEPLINK = 'debtplannerrn://';

/** Auto-start window (locked design): the Live Activity appears in the final ~3-day run-up to payday. */
export const PAYDAY_ACTIVITY_WINDOW_DAYS = 3;
