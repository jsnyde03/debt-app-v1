/**
 * The single seam for capturing NON-fatal subsystem errors (e.g. the widget bridge, share) so a
 * background failure is reported, never silently lost — and never allowed to crash the app.
 *
 * A thin indirection so the storage/engine/UI layers report errors WITHOUT importing Sentry (which is
 * native and would break node tests + the web bundle). The default sink is a dev-only `console.warn`;
 * VIS-6 registers a real handler via `setErrorReporter` (→ `Sentry.captureException`) at app init once a
 * DSN is configured (Phase 6). Call sites use `reportError(err, context)` regardless.
 */

export type ErrorContext = Record<string, string>;

type Reporter = (error: unknown, context?: ErrorContext) => void;

// The `__DEV__` read is guarded so it's safe under the node test runner (where `__DEV__` is undefined).
const defaultReporter: Reporter = (error, context) => {
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (dev) console.warn('[reportError]', context ?? {}, error);
};

let reporter: Reporter = defaultReporter;

/** Register the real reporter (e.g. Sentry) at app init. */
export function setErrorReporter(next: Reporter): void {
  reporter = next;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  reporter(error, context);
}
