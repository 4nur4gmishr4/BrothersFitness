import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Generated/build output is not source: .next build cache, Next's typed
    // env file, and the PWA plugin's service-worker artifacts in public/.
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "public/sw.js",
      "public/swe-worker-*.js",
      "public/workbox-*.js",
      "coverage/**"
    ]
  }
];

export default eslintConfig;
