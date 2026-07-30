import type { ComponentType } from 'react';

/**
 * Web build: no native crash reporter. Keeps the default `reportError` console sink and keeps
 * `@sentry/react-native` out of the web bundle (Metro resolves this `.web.ts` on web). Mirrors Freedom.
 */
export function initErrorReporting(): void {
  // no-op on web
}

/** Web: pass the root component through unchanged (no Sentry instrumentation). */
export function wrapRoot(Root: ComponentType): ComponentType {
  return Root;
}
