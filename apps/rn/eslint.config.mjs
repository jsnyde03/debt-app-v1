// RN-scoped ESLint (flat config). The repo's root config is eslint-config-next — built for the LEGACY
// Capacitor/Next app and slow over the whole tree. This app is React Native (Expo), so it lints ONLY
// apps/rn with eslint-config-expo — the "proper fix" the root config's comment anticipated. Run:
// `npm --prefix apps/rn run lint` (or the root `lint:rn`).

import tsPlugin from '@typescript-eslint/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  ...expoConfig,
  // Honor the `_`-prefix "intentionally unused" convention (platform stubs / placeholder params).
  // The plugin is registered here (scoped to TS files) so the `@typescript-eslint/` rule resolves.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // The React Compiler lint hints don't fit RN (mirrors the root config's rationale): Reanimated
      // shared values are mutable by design, the latest-callback ref pattern is idiomatic, and the
      // RN/Metro build doesn't run React Compiler — so these target an optimizer that isn't active.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      // `accessibilityElementsHidden` and `importantForAccessibility` are dropped SILENTLY by
      // react-native-web: neither name appears in its `forwardedProps` allowlist, and `createDOMProps`
      // discards unrecognised props with no warning. Written longhand they therefore fence on iOS and
      // Android and do nothing at all on web — which is invisible to a suite whose selectors match
      // through `aria-hidden`. `aria-hidden` covers all three platforms in one prop, because RN expands
      // it into both native props itself.
      //
      // A rule, not a convention, because the convention failed: this class was fixed by enumeration and
      // the enumeration was short. The linter knows every site; a person does not.
      'no-restricted-syntax': [
        'error',
        {
          // Both key forms: `Property[key.name=…]` matches an Identifier key only, so the string-literal
          // form (`{ 'accessibilityElementsHidden': true }`) walked straight past the rule written to
          // stop it. A computed/concatenated key remains expressible — stated plainly rather than
          // claimed closed, since the grep in `lint:a11y-props` is what actually closes the class.
          // ⛔ L0-5 widened this from 2 props to 4. RNW drops all four identically: `accessibilityState`
          // and `accessibilityValue` have no mapping to `aria-*` in `createDOMProps`, so a control
          // written longhand announces its ROLE and never its STATE — a checkbox that never says whether
          // it is checked, on the build the whole e2e suite and the public embed run on. 11 longhand
          // sites across 9 files existed while the guard reported the class clean.
          selector:
            "JSXAttribute[name.name=/^(accessibilityElementsHidden|importantForAccessibility|accessibilityState|accessibilityValue)$/], Property[key.name=/^(accessibilityElementsHidden|importantForAccessibility|accessibilityState|accessibilityValue)$/], Property[key.value=/^(accessibilityElementsHidden|importantForAccessibility|accessibilityState|accessibilityValue)$/]",
          message:
            'Dropped silently by react-native-web (native-only). Use a11yHidden / a11yChecked / a11ySelected / a11yExpanded / a11yAdjustableValue / `decorative` from @/utils/a11y.',
        },
        {
          // ⛔ 3.5.7.8 — A CLASS CLOSED AT SOME OF ITS MEMBERS, MEASURED. `locateFile` was hand-written in
          // **six** `.web.tsx` canvases; a `grep | head -5` found three, and fixing those three shipped an
          // embed where Money and Progress drew and **Today did not** — `CushionBarCanvas` was in the
          // half nobody looked at. The probe printed `HTTP 404 /canvaskit.wasm` while the document sat on
          // the base path, which is the only reason it was caught before deploy.
          //
          // A rule, not a convention, for the same reason as the one above: the linter knows every site.
          selector: "Property[key.name='locateFile']",
          message:
            "CanvasKit's wasm path is owned by `canvasKitOpts` in @/utils/canvaskit — it has to honour the marketing embed's base path, and six hand-written copies is how five of them get fixed.",
        },
        {
          // ⛔ `Alert.alert` is `static alert() {}` in react-native-web — an EMPTY FUNCTION. A message
          // written with it is delivered on iOS and silently DISCARDED on web, and no Playwright
          // assertion can tell that apart from a message nobody wrote. `utils/confirm.ts` had known this
          // for the confirm direction since 3.4.4; the one-way direction had no owner, so eleven call
          // sites used the raw API — including the paywall's "purchases aren't available in this
          // preview", which is the WEB message, on the surface behind a public marketing embed.
          //
          // A rule, not a convention, for the same reason as the two above: the linter knows every site.
          selector: "MemberExpression[object.name='Alert'][property.name='alert']",
          message:
            'Alert.alert is a NO-OP on react-native-web (silently dropped). Use `notify` / `confirmDelete` / `confirmDiscard` from @/utils/confirm.',
        },
      ],
    },
  },
  // The one file that legitimately writes `locateFile` — it is what the rule above points everything at.
  { files: ['src/utils/canvaskit.ts'], rules: { 'no-restricted-syntax': 'off' } },
  // `utils/a11y.ts` is where the two props are legitimately written — it is the one file that knows what
  // `aria-hidden` expands to, and the rule above exists to keep it that way.
  { files: ['src/utils/a11y.ts'], rules: { 'no-restricted-syntax': 'off' } },
  // `utils/confirm.ts` is the one file allowed to call `Alert.alert` — it is what the rule above points
  // everything at, and the only place that knows the web fallback.
  { files: ['src/utils/confirm.ts'], rules: { 'no-restricted-syntax': 'off' } },
  // Build output, the native/e2e trees, and the Playwright harness (node/@playwright — its own tsconfig).
  // ⛔ `dist-embed/**` — 3.5.7.4's embed build. It was added to `.gitignore` and NOT here, so `lint:rn`
  // stayed green on a clean checkout and exploded with **7,578 errors** on any machine that had run
  // `test:e2e:embed` even once. CI never saw it because `lint:rn` runs BEFORE `test:e2e:embed` in
  // `validate:release:rn` — so the gate was only broken for the second local run onward, which is the
  // run a human does. "Two places, one rule": one build output, two ignore lists.
  globalIgnores(['dist/**', 'dist-embed/**', '.expo/**', 'node_modules/**', 'core/**', 'tests/**', 'playwright.config.ts']),
]);
