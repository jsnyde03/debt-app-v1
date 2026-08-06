/**
 * 3.5.4.9 [D-A] — the privacy-first funnel seam.
 *
 * Debt's moat is that your financial data never leaves your device, and analytics was kept OUT of v1.7's
 * core for exactly that reason. The demo re-opened it: a pre-purchase funnel you cannot see is a funnel
 * you cannot improve, and "did anyone finish the demo" is not a fact about anyone's money.
 *
 * So the shape is deliberate on three counts:
 *
 * 1. **No financial data — by CONSTRUCTION, not by review.** Every event's payload is a closed union of
 *    literals below. There is no `Record<string, unknown>`, no free-form string, and no number anywhere in
 *    this file's types, so a balance, a paycheck, a debt name or a date cannot be passed even by mistake.
 *    A reviewer-enforced rule would have held until the first hurried call site.
 *
 * 2. **It sends nothing.** There is no network call and no vendor SDK here — `track` forwards to a sink
 *    that is null until something installs one, and nothing does yet. [D-A] asked for the SEAM, and the
 *    Phase-6 privacy/data-flow audit is what decides whether a sink is ever attached and to whom. Wiring
 *    a provider now would put an egress into the app ahead of the audit built to trace every egress.
 *
 * 3. **Opt-out is honoured HERE**, at the single choke point, rather than at each call site — the
 *    one-member class this phase keeps paying for. A call site cannot forget the user's choice because it
 *    never gets to ask.
 */
import { appStore } from '@/store/appStore';

/** Where a run was entered from. Not a user identifier — a button. */
type Source = 'welcome' | 'paywall' | 'direct';

/** Why a run ended. `dismissed` covers backgrounding out, which is the honest majority case. */
type ExitReason = 'start_real_plan' | 'unlock_premium' | 'dismissed';

/**
 * The eight. Adding a ninth is a deliberate act — the union is the review surface, and a funnel that
 * grows a field at a time is how "no financial data" stops being checkable.
 */
export type FunnelEvent =
  | { name: 'demo_started'; source: Source }
  | { name: 'demo_stage'; stage: string }
  | { name: 'demo_completed' }
  | { name: 'demo_exited'; reason: ExitReason }
  | { name: 'tutorial_started'; audience: 'free' | 'premium' }
  | { name: 'tutorial_completed'; audience: 'free' | 'premium' }
  | { name: 'tutorial_skipped'; beat: number }
  | { name: 'paywall_viewed'; source: Source };

type FunnelSink = (event: FunnelEvent) => void;

let sink: FunnelSink | null = null;

/**
 * Install the destination. Deliberately unused in v1.7 — Phase 6 decides whether anything is attached,
 * after the privacy audit, and the store's data-flow claim has to survive whatever it chooses.
 */
export function setFunnelSink(next: FunnelSink | null): void {
  sink = next;
}

/**
 * Record a funnel event. A no-op when the user has opted out, and a no-op when nothing is listening —
 * which is every build today.
 */
export function track(event: FunnelEvent): void {
  if (!sink) return;
  if (appStore.getState().store.prefs.analyticsOptOut) return;
  sink(event);
}
