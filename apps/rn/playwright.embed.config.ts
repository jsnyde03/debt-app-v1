import path from 'path';

import { defineConfig, devices } from '@playwright/test';

/**
 * 3.5.7.4 — THE EMBED'S PRIVACY GATE.
 *
 * [D32] makes 3.5.7's privacy stance **a gate, not a promise**: the embed is the one surface where
 * *"financial data never leaves your device"* is easiest to doubt, because it is a web page. So the
 * claims are held by a test that runs on every push rather than asserted in prose and re-checked at
 * review time.
 *
 * ⛔ A SEPARATE CONFIG, AND IT HAS TO BE. `EXPO_PUBLIC_EMBED` is INLINED by the bundler, so the embed is
 * a different artifact from the app — `playwright.config.ts`'s server builds without the flag. Adding a
 * spec there would have asserted the three claims against the build that does NOT ship publicly, which
 * is this repo's own "green while testing nothing" failure ([D30]'s named void condition, and the
 * 744pt-iPad-mini run that committed it).
 *
 * ⚠️ Its own `--output-dir` and its own port, so the two builds can never overwrite or shadow each
 * other. `dist-embed/` is generated; it is git-ignored alongside `dist/`.
 */

/**
 * ⭐ 3.5.7.8 — THE GATE NOW SERVES FROM THE BASE PATH, because that is what ships.
 *
 * GitHub Pages serves a **project** site under `/<repo>/`, and until this the gate proved the embed works
 * at ROOT — so the one configuration that actually ships was the one nothing tested. That is
 * `feedback_check_the_shipped_artifact` precisely: the App-Preview pipeline spent seven cycles asserting
 * evidence beside the deliverable while the deliverable opened on black.
 *
 * The build goes into `dist-embed/<BASE>` and the server is pointed at `dist-embed`, so the app answers
 * on `/<BASE>/` exactly as Pages will.
 *
 * ⛔ NO `-s` ANY MORE, AND THAT IS THE POINT. `serve -s` rewrites every 404 to `index.html` — which would
 * hand a missing `/debt-app-v1/_expo/…js` a 200 and an HTML body, making the local gate strictly MORE
 * forgiving than production. Pages does no such rewriting. The embed never needs it either: it only ever
 * loads the base URL and its router moves by `history`, with no further server round-trip.
 */
const PORT = 4320;
const BASE_SEGMENT = 'debt-app-v1'; // the repo name — GitHub Pages' project-site path
const RN_DIR = __dirname;
const SERVE_ROOT = path.join(RN_DIR, 'dist-embed');
const OUT = path.join(SERVE_ROOT, BASE_SEGMENT);

/**
 * ⭐ 3.5.7.8 — POINT THE WHOLE GATE AT THE DEPLOYED SITE.
 *
 *   EMBED_LIVE_URL=https://jsnyde03.github.io/debt-app-v1/ npm run test:e2e:embed
 *
 * A green deploy proves the bytes landed; it proves nothing about the page. This runs the SAME ten specs
 * — boot, the five-beat arc, no-404s, the CTA, the three privacy claims — against the thing a stranger
 * actually opens. `feedback_check_the_shipped_artifact`: the App-Preview pipeline spent seven cycles
 * asserting evidence beside the deliverable while the deliverable opened on black.
 *
 * ⚠️ It builds and serves nothing in this mode — pointing a `webServer` at a remote URL would rebuild
 * locally and then test the remote, which is two artifacts and one set of assertions.
 */
const LIVE = process.env.EMBED_LIVE_URL;

export default defineConfig({
  testDir: './tests/embed',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: {
    // ⚠️ THE TRAILING SLASH IS LOAD-BEARING, and so is how the specs navigate. Playwright resolves a URL
    // with `new URL(url, baseURL)`, so `goto('/')` against this base resolves to `http://localhost:4320/`
    // — ABOVE the base path, where nothing is served. The specs use `goto('./')`, which stays inside it
    // and, being relative, does not repeat the base segment anywhere a rename would have to find it.
    baseURL: LIVE ?? `http://localhost:${PORT}/${BASE_SEGMENT}/`,
    trace: 'on-first-retry',
  },
  webServer: LIVE ? undefined : {
    // ⛔ `--clear` IS LOAD-BEARING, AND IT IS MEASURED. Metro's transform cache does NOT invalidate on an
    // `EXPO_PUBLIC_*` change, so an embed export can silently reuse transforms produced by the APP build:
    //
    //     flag=0, no --clear  →  sessionStorage=1  localStorage=0   ⛔ wrong artifact
    //     flag=0, --clear     →  sessionStorage=0  localStorage=1   ✅ correct
    //
    // Without it the flag is advisory. ⚡ Found because a planted defect PASSED — and the first
    // conclusion, "the gate is vacuous", was wrong: the gate was fine and the PLANT had not changed the
    // build. Grepping the artifact settled in one command what reasoning about the test could not.
    // ⚠️ Costs a cold export on every gate run. Correctness over speed here: this is the test standing
    // behind a public privacy claim, and a cached artifact is the one failure it cannot survive.
    command:
      `npm --prefix "${RN_DIR}" run export:web -- --output-dir "${OUT}" --clear ` +
      `&& npx serve "${SERVE_ROOT}" -l ${PORT}`,
    // ⭐ THE FLAG IS SET HERE AND NOWHERE ELSE. It is what makes this build the embed: `sessionStorage`
    // instead of `localStorage` (3.5.7.3). Drop it and the storage assertion fails — the intended
    // failure, not a flake.
    // ⚠️ Playwright's own `env`, deliberately NOT a `VAR=1 cmd` prefix and NOT `cross-env`: the prefix
    // form is not portable to Windows shells, and `cross-env` is not a dependency of this repo (checked,
    // not assumed) — adding one to set a single variable Playwright already supports setting.
    // ⚠️ `EXPO_PUBLIC_BASE_URL` does TWO jobs, which is why it carries the public prefix: `app.config.js`
    // reads it in Node to set `experiments.baseUrl` (rewriting `/_expo/…` → `/debt-app-v1/_expo/…`), and
    // Metro inlines it into the bundle so CanvasKit's `locateFile` can find the wasm under the base path.
    // ⛔ Named `EXPO_BASE_URL` at first: the HTML came out right and `canvaskit.wasm` still 404'd at root,
    // because only `EXPO_PUBLIC_*` reaches the client.
    env: { EXPO_PUBLIC_EMBED: '1', EXPO_PUBLIC_BASE_URL: `/${BASE_SEGMENT}` },
    url: `http://localhost:${PORT}/${BASE_SEGMENT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'embed-chrome', use: { ...devices['Desktop Chrome'] } }],
});
