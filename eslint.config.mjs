import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// Configurazione standard di Next.js (core-web-vitals + TypeScript) nel formato flat di ESLint 9.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"] },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
];

export default eslintConfig;
