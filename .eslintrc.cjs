const fs = require('fs');
const path = require('path');
const { defineConfig } = require('@antfu/eslint-define-config');

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '.prettierrc'), 'utf8').trim());

module.exports = defineConfig({
  env: { browser: true, commonjs: true, es6: true, jest: true, node: true },
  extends: ['plugin:react/recommended', 'plugin:import/errors', 'plugin:import/warnings', 'plugin:react-perf/recommended', 'prettier'],
  ignorePatterns: ['node_modules/**', '.next/**', '.next-dev/**', 'out/**', 'build/**', 'dist/**', 'coverage/**', 'next-env.d.ts', 'public/**', 'storage_data/**'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    requireConfigFile: false,
    sourceType: 'module',
    babelOptions: { presets: ['@babel/preset-react'] },
  },
  plugins: ['react', 'react-hooks', 'import', '@next/next', 'react-perf', 'sort-keys-fix', '@arthurgeron/react-usememo', 'prettier'],
  root: true,
  rules: {
    semi: ['error', 'always'],
    eqeqeq: ['error', 'always'],
    curly: 'error',
    'no-dupe-keys': 'error',
    'no-shadow': 'error',
    'no-console': ['error', { allow: ['debug', 'error'] }],
    'no-undef': 'error',
    'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'all', ignoreRestSiblings: false, vars: 'all', varsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'comma-dangle': ['error', 'always-multiline'],
    'no-debugger': 'error',
    quotes: ['error', 'single', { avoidEscape: true }],
    'import/namespace': ['off', { allowComputed: true }],
    'import/no-unresolved': 'off',
    '@next/next/no-img-element': 'warn',
    '@next/next/google-font-display': 'warn',
    '@next/next/no-css-tags': 'off',
    '@next/next/no-html-link-for-pages': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-key': 'error',
    'react/jsx-no-bind': ['warn', { allowArrowFunctions: false, ignoreRefs: false, allowBind: false, allowFunctions: false }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['error', { additionalHooks: '(useMyCustomHook)' }],
    'react-perf/jsx-no-new-array-as-prop': 'warn',
    'react-perf/jsx-no-new-function-as-prop': 'warn',
    'react-perf/jsx-no-new-object-as-prop': 'warn',
    '@arthurgeron/react-usememo/require-memo': 'off',
    '@arthurgeron/react-usememo/require-usememo': 'off',
    '@arthurgeron/react-usememo/require-usememo-children': 'off',
    'prettier/prettier': ['error', prettierConfig],
    'max-len': ['error', { code: prettierConfig.printWidth, comments: prettierConfig.printWidth, tabWidth: prettierConfig.tabWidth, ignoreComments: true, ignoreStrings: true, ignoreTrailingComments: true, ignoreRegExpLiterals: true, ignoreTemplateLiterals: true, ignoreUrls: true }],
  },
  settings: {
    import: { resolver: { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'], moduleDirectory: ['node_modules', '.'] } } },
    react: { version: 'detect' },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'], moduleDirectory: ['node_modules', '.'] } },
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'all', varsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['{src,components,pages,lib}/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'sort-keys': ['warn', 'asc', { allowLineSeparatedGroups: true }],
        'sort-keys-fix/sort-keys-fix': ['warn', 'asc'],
      },
    },
    {
      files: ['extension/**/*.{js,jsx,ts,tsx}'],
      env: { browser: true, webextensions: true },
    },
    {
      files: ['scripts/**/*.{js,mjs,cjs,ts}', '__tests__/**/*.{js,mjs,cjs,ts}'],
      env: { es2021: true },
      globals: { AudioEncoder: 'readonly', VideoEncoder: 'readonly' },
      rules: { 'no-console': 'off' },
    },
  ],
});
