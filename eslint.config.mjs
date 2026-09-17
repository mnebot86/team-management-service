import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
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
    plugins: {
      stylistic,
    },
    rules: {
      semi: ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'no-mixed-spaces-and-tabs': 'error',
      indent: ['error', 2],
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
      'no-multi-spaces': 'error',
      'no-nested-ternary': 'error',
      'key-spacing': ['error', { mode: 'strict' }],
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        functions: 'only-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
      }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-trailing-spaces': 'error',
      'space-infix-ops': 'error',
      'eol-last': ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: 'const' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'never', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: 'try' },
      ],
    },
  },
];