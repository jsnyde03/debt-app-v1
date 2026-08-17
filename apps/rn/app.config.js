/**
 * 3.5.7.8 — THE BASE URL, AND NOTHING ELSE.
 *
 * ⛔ WHY THIS FILE EXISTS AT ALL. `expo export --platform web` emits assets as absolute paths from ROOT
 * (`src="/_expo/static/js/web/…"`). A GitHub Pages **project** site serves under `/<repo>/`, so every one
 * of those 404s and the page renders blank — this repo's nastiest regression class, arriving by
 * deployment rather than by code. `experiments.baseUrl` rewrites them, measured: with
 * `EXPO_BASE_URL=/debt-app-v1` the emitted HTML reads `/debt-app-v1/_expo/…`.
 *
 * ⚠️ IT IS AN OVERLAY, NOT A REPLACEMENT. `app.json` stays the config; Expo hands it here as `config` and
 * this adds one key. With `EXPO_BASE_URL` unset the result is byte-identical to `app.json`, which is what
 * keeps every native build, `prebuild`, and the app's own web export unaffected by a file that exists for
 * one deploy target.
 *
 * ⚠️ ON WINDOWS, GIT BASH MANGLES A LEADING SLASH. `EXPO_PUBLIC_BASE_URL=/debt-app-v1` arrived as
 * `C:/Program Files/Git/debt-app-v1` and the export happily wrote that into the HTML — an artifact that
 * looks plausible and is wrong. Local Windows builds need `MSYS_NO_PATHCONV=1`; CI is Linux and immune.
 *
 * ⛔ **THE `EXPO_PUBLIC_` PREFIX IS DELIBERATE AND LOAD-BEARING.** This file runs in Node and would read
 * any variable name — but the CLIENT needs the same value (CanvasKit's `locateFile` has to find the wasm
 * under the base path), and Metro inlines **only** `EXPO_PUBLIC_*` into the bundle. The first version
 * used `EXPO_BASE_URL`: the HTML was rewritten correctly and the wasm still 404'd at root, because the
 * browser saw `undefined`. **One variable, two consumers** — a second name would be two places holding
 * one truth.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    // `|| undefined` rather than `?? undefined`: an EMPTY string must also mean "no base URL", or a
    // workflow that sets the variable to nothing would emit `//_expo/…` — a protocol-relative URL
    // pointing at a host that does not exist.
    baseUrl: process.env.EXPO_PUBLIC_BASE_URL || undefined,
  },
});
