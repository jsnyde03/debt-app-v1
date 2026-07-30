/**
 * The single seam for capturing NON-fatal subsystem errors (e.g. the widget bridge) so a background
 * failure is reported, never silently lost — and never allowed to crash the app. Sentry wiring is
 * Phase 6; for now this logs in dev and is the one place to route to Sentry later. The `__DEV__` read
 * is guarded so it's safe under the node test runner (where `__DEV__` is undefined).
 */
export function reportError(error: unknown, context?: Record<string, string>): void {
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (dev) {
    console.warn('[reportError]', context ?? {}, error);
  }
  // TODO(Phase 6): Sentry.captureException(error, { tags: context }).
}
