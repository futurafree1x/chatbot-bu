import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const NO_STORAGE =
  'NFR-23: never store anything in browser storage or cookies. Keep state in React memory.';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsdoc.configs['flat/recommended-typescript-error'],
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // NFR-19: every exported function, component, class, type and constant needs JSDoc.
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
            ClassDeclaration: true,
            MethodDefinition: true,
          },
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'VariableDeclaration'],
        },
      ],
      // TypeScript already documents return types; a @returns tag would just repeat them.
      'jsdoc/require-returns': 'off',
      // Destructured React props are documented on their Props interface instead.
      'jsdoc/require-param': ['error', { checkDestructuredRoots: false }],

      // NFR-13: text is always rendered as plain text, never as HTML.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'NFR-13: render message text as plain text only.',
        },
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message: 'NFR-13: render message text as plain text only.',
        },
        {
          selector: "MemberExpression[object.name='document'][property.name='cookie']",
          message: NO_STORAGE,
        },
        {
          selector: 'MemberExpression[property.name=/^(localStorage|sessionStorage|indexedDB)$/]',
          message: NO_STORAGE,
        },
      ],
      // NFR-23, for the bare globals (`localStorage.setItem(...)` with no `window.`).
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: NO_STORAGE },
        { name: 'sessionStorage', message: NO_STORAGE },
        { name: 'indexedDB', message: NO_STORAGE },
      ],
    },
  },
  {
    // Every source file gets a short @file overview (NFR-19: "every module").
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'jsdoc/require-file-overview': 'error',
    },
  },
  // Must come last: turns off ESLint rules that would fight Prettier's formatting.
  prettier,
]);
