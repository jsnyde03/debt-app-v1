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
    },
  },
  // Build output, the native/e2e trees, and the Playwright harness (node/@playwright — its own tsconfig).
  globalIgnores(['dist/**', '.expo/**', 'node_modules/**', 'core/**', 'tests/**', 'playwright.config.ts']),
]);
