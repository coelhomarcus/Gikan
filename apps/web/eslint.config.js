import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { defineConfig, globalIgnores } from "eslint/config";
import { parser as eslintParserTypeScript, plugin as eslintPluginTypeScript } from "typescript-eslint";

export default defineConfig([
    globalIgnores(["dist", "e2e", "node_modules"]),

    {
        files: ["**/*.{ts,tsx,cts,mts}"],
        languageOptions: {
            parser: eslintParserTypeScript,
        },
        // Registered only so the existing `eslint-disable @typescript-eslint/*` comments resolve.
        plugins: { "@typescript-eslint": eslintPluginTypeScript },
    },

    {
        files: ["**/*.{jsx,tsx}"],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
    },

    {
        files: ["src/**/*.{ts,tsx}"],
        extends: [eslintPluginBetterTailwindcss.configs.recommended],
        rules: {
            // Class strings stay on one line (the codebase's style); wrapping them is pure noise.
            "better-tailwindcss/enforce-consistent-line-wrapping": "off",
            // First-party classes defined in plain CSS files outside the Tailwind entry point.
            "better-tailwindcss/no-unknown-classes": ["error", { ignore: ["^document-", "^issue-peek-", "^peek-", "^plane-", "^tiptap-"] }],
        },
        settings: {
            "better-tailwindcss": {
                entryPoint: "src/styles/globals.css",
            },
        },
    },
]);
