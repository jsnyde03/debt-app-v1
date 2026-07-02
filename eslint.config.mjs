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
