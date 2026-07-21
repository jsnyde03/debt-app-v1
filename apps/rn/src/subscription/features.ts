/**
 * The premium feature set (one-tier reshape — Elevation Phase 2). Free finishes the job; the single
 * Premium tier unlocks everything below. `premium_plus` is gone. New premium features are added here
 * and gated via `hasFeatureAccess` / `useHasFeature`. The basic core job is NEVER gated (see the
 * free/premium line in DEBT_PHASE0_DESIGN_SYNTHESIS §4).
 */
export type PremiumFeature =
  | 'payday_partner' // 2.2 — the automated accountability loop (reminders → verify → carry-forward)
  | 'momentum' // 2.3 — streaks + the full milestone system
  | 'drift' // 2.4 — Drift Tracker
  | 'auto_adjust' // 2.5 — auto-adjusting plan
  | 'custom_share' // 2.5 — custom share-card art (basic share stays free)
  | 'interactive_widget' // 2.6 — interactive/plan widget (the glanceable countdown widget stays free)
  | 'icloud_backup' // 2.8 — automatic iCloud backup
  | 'unlimited_history'; // full pay-cycle history (free is capped)

export const PREMIUM_FEATURES: readonly PremiumFeature[] = [
  'payday_partner',
  'momentum',
  'drift',
  'auto_adjust',
  'custom_share',
  'interactive_widget',
  'icloud_backup',
  'unlimited_history',
];
