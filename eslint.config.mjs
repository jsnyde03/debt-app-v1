import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // CommonJS build/tooling scripts (`.cjs`) legitimately use `require()`.
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // The RN app (apps/rn) inherits this Next.js config but is React Native, not Next. The React
  // Compiler lint rules from eslint-config-next don't fit RN: Reanimated shared values are mutable
  // by design (`sv.value = withTiming(...)` is the API), the "latest-callback ref" pattern is
  // idiomatic, and the RN/Metro build doesn't run React Compiler — so these hints target an
  // optimizer that isn't active. Off for the RN tree. (Proper fix: apps/rn adopts eslint-config-expo
  // during the Phase 5.5 repo consolidation — DEBT_ELEVATION_PLAN.) Also honor the `_`-prefix
  // "intentionally unused" convention for platform stubs / placeholder params.
  {
    files: ["apps/rn/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor native project — `ios/App/App/public/` is a build-time copy of
    // `out/` (the exported web bundle), not source; linting it just duplicates
    // every `out/`-style problem. Ignore the whole native project.
    "ios/**",
  ]),
]);

export default eslintConfig;
