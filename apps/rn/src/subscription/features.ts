/**
 * The premium feature set (one-tier reshape — Elevation Phase 2). Free finishes the job; the single
 * Premium tier unlocks everything below. `premium_plus` is gone. New premium features are added here
 * and gated via `hasFeatureAccess` / `useHasFeature`. The basic core job is NEVER gated (see the
 * free/premium line in DEBT_PHASE0_DESIGN_SYNTHESIS §4).
 */
// NOTE: the version refs in the older comments below are PRE-reshape (the automation-tier reshape
// re-slotted these — e.g. Payday Partner folded into the Cushion Guardian). The full feature-set ↔
// reshaped-order reconciliation lands with the revenue spine (2.10); new keys use the reshaped order.
export type PremiumFeature =
  | 'always_current_balances' // 2.3 — projection auto-maintenance: live estimated balances between verifications
  | 'payday_partner' // the automated accountability loop (reminders → verify → carry-forward)
  | 'momentum' // streaks + the full milestone system
  | 'drift' // Drift Tracker
  | 'auto_adjust' // auto-adjusting plan
  | 'custom_share' // custom share-card art (basic share stays free)
  | 'interactive_widget' // interactive/plan widget (the glanceable countdown widget stays free)
  | 'icloud_backup' // automatic iCloud backup
  | 'unlimited_history'; // full pay-cycle history (free is capped)

export const PREMIUM_FEATURES: readonly PremiumFeature[] = [
  'always_current_balances',
  'payday_partner',
  'momentum',
  'drift',
  'auto_adjust',
  'custom_share',
  'interactive_widget',
  'icloud_backup',
  'unlimited_history',
];
