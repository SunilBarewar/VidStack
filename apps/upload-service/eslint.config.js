import js from "@eslint/js";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import perfectionist from "eslint-plugin-perfectionist";
import prettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  // Ignore patterns
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },

  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Main configuration
  {
    files: ["**/*.{ts,js}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        node: true,
        es2022: true,
      },
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier,
      // perfectionist,
      "no-relative-import-paths": noRelativeImportPaths,
    },

    rules: {
      // ==================== TYPESCRIPT ====================
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
      ],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",

      // ==================== NO RELATIVE IMPORT PATHS ====================
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
          rootDir: "src",
          prefix: "@",
        },
      ],
      // ==================== PERFECTIONIST (SORTING) ====================
      // this are kept for reference.
      // "perfectionist/sort-imports": [
      //   "error",
      //   {
      //     type: "natural",
      //     order: "asc",
      //     ignoreCase: true,
      //     groups: [
      //       "type",
      //       ["builtin", "external"],
      //       "internal-type",
      //       "internal",
      //       ["parent-type", "sibling-type", "index-type"],
      //       ["parent", "sibling", "index"],
      //       "object",
      //       "unknown",
      //     ],
      //     newlinesBetween: "always",
      //     internalPattern: ["^@/.*"],
      //   },
      // ],
      // "perfectionist/sort-named-imports": [
      //   "error",
      //   {
      //     type: "natural",
      //     order: "asc",
      //     ignoreCase: true,
      //   },
      // ],
      // "perfectionist/sort-named-exports": [
      //   "error",
      //   {
      //     type: "natural",
      //     order: "asc",
      //     ignoreCase: true,
      //   },
      // ],
      // "perfectionist/sort-exports": [
      //   "error",
      //   {
      //     type: "natural",
      //     order: "asc",
      //     ignoreCase: true,
      //   },
      // ],
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-object-types": "off",

      // ==================== GENERAL CODE QUALITY ====================
      "no-console": "warn", // Console is commonly used in backend
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "prefer-destructuring": [
        "error",
        {
          array: false,
          object: true,
        },
      ],
      "object-shorthand": ["error", "always"],
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "error",
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: [
            "state",
            "acc",
            "accumulator",
            "req",
            "res",
          ],
        },
      ],
      "padding-line-between-statements": [
        "error",
        // Require blank line after variable declarations
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        // Require blank line before return statements
        { blankLine: "always", prev: "*", next: "return" },
        // Require blank line after directive (like 'use strict')
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "any", prev: "directive", next: "directive" },
        // Require blank line before and after class declarations
        { blankLine: "always", prev: "*", next: "class" },
        { blankLine: "always", prev: "class", next: "*" },
        // Require blank line before and after function declarations
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
        // Require blank line after imports
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        // Require blank line before export statements
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "any", prev: "export", next: "export" },
        // Require blank line before block statements
        { blankLine: "always", prev: "*", next: "block-like" },
        // Require blank line before try statements
        { blankLine: "always", prev: "*", next: "try" },
      ],
      "lines-between-class-members": [
        "error",
        "always",
        { exceptAfterSingleLine: false },
      ],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "spaced-comment": ["error", "always", { markers: ["/"] }],
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["warn", 4],
      complexity: ["warn", 20],
    },
  },
);
