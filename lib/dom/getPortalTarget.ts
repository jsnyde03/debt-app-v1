/**
 * The DOM node that React portals (sheets, overlays, and any new v1.6 capture/payday surface)
 * MUST mount into — `<main class="app">`, never `document.body`.
 *
 * Two reasons, both learned from real bugs:
 *  1. THEME SCOPE. `.dark-theme` / `.light-theme` live on `<main class="app">` and the dark CSS is
 *     descendant-scoped, so a portal mounted on `document.body` renders in LIGHT even in dark mode
 *     (the v1.5 "amortization View Schedule light-in-dark" device-QA bug). Mounting inside
 *     `main.app` keeps every portal inside the theme scope by construction.
 *  2. FIXED-POSITION CONTAINING BLOCK. The tab wrapper (`.tab-content-transition`) has a
 *     `transform`, which traps `position: fixed` to that ancestor (pushed a sheet off-screen on
 *     phones). `main.app` is outside that transform, so fixed overlays are viewport-relative.
 *
 * Centralizing this here means new overlays can't re-break either bug — route every portal through
 * `getPortalTarget()`. Falls back to `document.body` only if `main.app` isn't in the tree yet
 * (callers already gate the portal render on `typeof document !== "undefined"` / mount).
 */
export function getPortalTarget(): Element {
    return document.querySelector("main.app") ?? document.body;
}
