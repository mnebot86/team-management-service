const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: globals.node,
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
    },
  },

  {
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  {
    ignores: ['node_modules', 'dist'],
  },
];
