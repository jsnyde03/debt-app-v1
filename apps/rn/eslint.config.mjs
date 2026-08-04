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
          selector:
            "JSXAttribute[name.name='accessibilityElementsHidden'], JSXAttribute[name.name='importantForAccessibility'], Property[key.name='accessibilityElementsHidden'], Property[key.name='importantForAccessibility']",
          message:
            'Dropped silently by react-native-web (fences native only). Use a11yHidden(flag) or `decorative` from @/utils/a11y.',
        },
      ],
    },
  },
  // `utils/a11y.ts` is where the two props are legitimately written — it is the one file that knows what
  // `aria-hidden` expands to, and the rule above exists to keep it that way.
  { files: ['src/utils/a11y.ts'], rules: { 'no-restricted-syntax': 'off' } },
  // Build output, the native/e2e trees, and the Playwright harness (node/@playwright — its own tsconfig).
  globalIgnores(['dist/**', '.expo/**', 'node_modules/**', 'core/**', 'tests/**', 'playwright.config.ts']),
]);
