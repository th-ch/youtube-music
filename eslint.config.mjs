//@ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from "@stylistic/eslint-plugin-js"
import * as importPlugin from "eslint-plugin-import"

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommendedTypeChecked,
  { ignores: ["dist", "node_modules", "*.config.*js"] },
  {
    plugins: {
      stylistic,
      importPlugin
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        sourceType: "module",
        ecmaVersion: "latest"
      }
    },
    rules: {
      "stylistic/arrow-parens": ["error", "always"],
      "stylistic/object-curly-spacing": ["error", "always"],
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": ["off", { checksVoidReturn: false }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "importPlugin/first": "error",
      "importPlugin/newline-after-import": "off",
      "importPlugin/no-default-export": "off",
      "importPlugin/no-duplicates": "error",
      "importPlugin/no-unresolved": ["error", { ignore: ['^virtual:', '\\?inline$', '\\?raw$', '\\?asset&asarUnpack'] }],
      "importPlugin/order": ["error", {
        'groups': ['builtin', 'external', ['internal', 'index', 'sibling'], 'parent', 'type'],
        'newlines-between': 'always-and-inside-groups',
        'alphabetize': { order: 'ignore', caseInsensitive: false }
      }],
      "importPlugin/prefer-default-export": "off",
      "camelcase": ["error", { properties: "never" }],
      "class-methods-use-this": "off",
      "stylistic/lines-around-comment": ["error", {
        beforeBlockComment: false,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
      }],
      "stylistic/max-len": "off",
      "stylistic/no-mixed-operators": "error",
      "stylistic/no-multi-spaces": ["error", { ignoreEOLComments: true }],
      "stylistic/no-tabs": "error",
      "no-void": "error",
      "no-empty": "off",
      "prefer-promise-reject-errors": "off",
      "stylistic/quotes": ["error", "single", {
        avoidEscape: true,
        allowTemplateLiterals: false,
      }],
      "stylistic/quote-props": ["error", "consistent"],
      "stylistic/semi": ["error", "always"],
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts']
      },
      'import/resolver': {
        typescript: {},
        exports: {},
      },
    },
  },
);
