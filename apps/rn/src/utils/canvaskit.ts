/**
 * 3.5.7.8 — WHERE CANVASKIT'S WASM LIVES, OWNED ONCE.
 *
 * ⛔ IT WAS THREE LITERAL COPIES OF `(file) => \`/${file}\`` — `TrajectoryCanvas.web.tsx`,
 * `AllocationBarCanvas.web.tsx`, `CashRunwayCanvas.web.tsx`. Agreeing copies, which is this repo's
 * most-repeated defect shape: Wave A hit "two places, one rule" three times in a single wave, and each
 * time the fix was to extract a single authority.
 *
 * ⚡ AND THE COPIES WERE ABOUT TO DIVERGE FOR A REAL REASON. The marketing embed deploys to a GitHub
 * Pages **project** site under `/debt-app-v1/`, where a root-absolute `/canvaskit.wasm` 404s — so **every
 * Skia chart on the embed's arc fails**, including beat 4, which is entirely about the curve. Three
 * hand-edits would have been three chances to miss one, and the one missed would have been invisible
 * until a chart silently never rendered.
 *
 * ⛔ **THE VARIABLE MUST CARRY THE `EXPO_PUBLIC_` PREFIX, AND THE FIRST VERSION OF THIS FILE DID NOT.**
 * Metro inlines **only** `EXPO_PUBLIC_*` into the client bundle. `EXPO_BASE_URL` reaches `app.config.js`
 * — which runs in Node — but arrives in the browser as `undefined`, so this resolved to `/canvaskit.wasm`
 * and the wasm 404'd on the base path. ⚡ **Measured, not reasoned:** the probe printed
 * `HTTP 404 http://localhost:4320/canvaskit.wasm` while the document sat happily at `/debt-app-v1/`.
 * A stated mechanism is a hypothesis until an artifact agrees with it.
 *
 * ⚠️ ONE VARIABLE, TWO CONSUMERS. `app.config.js` reads this same name at export time to set
 * `experiments.baseUrl`; a second variable for the client would be two places holding one truth, and they
 * would disagree the first time someone set only one of them.
 */
const BASE = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

/**
 * The `locateFile` CanvasKit's loader calls for `canvaskit.wasm`. Root-relative when the app is served
 * from root (every native build, the app's own web export, the Playwright suite), base-prefixed when it
 * is not.
 */
export const canvasKitOpts = { locateFile: (file: string) => `${BASE}/${file}` };
