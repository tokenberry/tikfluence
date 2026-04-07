import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // App Router project — this rule is for the legacy Pages Router and
      // misfires on every Link/anchor under src/app/[locale]/.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
