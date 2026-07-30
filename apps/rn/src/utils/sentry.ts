import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

import { setErrorReporter } from './reportError';

/**
 * VIS-6 — native crash/error reporting scaffold. Routes the app-wide `reportError` seam to Sentry.
 *
 * **Disabled until a DSN is set:** no-op when `EXPO_PUBLIC_SENTRY_DSN` is unset (the console reporter
 * stays in place), so nothing runs without a DSN. The real DSN + CI source-map upload care
 * (`SENTRY_DISABLE_AUTO_UPLOAD` + scoped `xcode-project use-profiles`) land at Phase 6 — this session
 * only wires the plumbing. The web build uses `sentry.web.ts` (no Sentry in the web bundle).
 *
 * Privacy: Debt's moat is on-device/private, so reports are PII-scrubbed — every `reportError` passes
 * only `{subsystem, operation}` strings; financial values never reach Sentry.
 */
export function initErrorReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      if (event.contexts) delete event.contexts.device;
      return event;
    },
    // Hardened for RN 0.85 + New Architecture (@sentry/react-native v8), per the Freedom lesson: in v7
    // these background/idle trackers threw an unhandled TurboModule exception → SIGABRT on
    // auto-lock/background. Disabled; real native + JS CRASH capture stays intact.
    enableAutoSessionTracking: false,
    enableAppHangTracking: false,
    enableWatchdogTerminationTracking: false,
    environment: __DEV__ ? 'development' : 'production',
  });
  setErrorReporter((error, context) => {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  });
}

/**
 * Wrap the root for Sentry auto-instrumentation (navigation/touch breadcrumbs → a crash trail). Safe to
 * call without a DSN — `Sentry.wrap` passes the component through until `init` runs. Passthrough on web.
 */
export function wrapRoot(Root: ComponentType): ComponentType {
  return Sentry.wrap(Root as unknown as ComponentType<Record<string, unknown>>) as unknown as ComponentType;
}
