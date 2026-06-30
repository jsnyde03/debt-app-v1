// Analytics seam. No provider is wired yet (planned for v1.6) — this is a no-op
// in production so call sites can exist now and light up later without a code
// change. PRIVACY RULE: never pass financial figures or PII; event name plus
// non-sensitive keys (e.g. a storage key name) only.
export type TrackProps = Record<string, string | number | boolean>;

export function track(event: string, props?: TrackProps): void {
    if (process.env.NODE_ENV === "development") {
        console.debug(`[track] ${event}`, props ?? {});
    }
    // Intentionally no network call until the v1.6 analytics provider lands.
}
