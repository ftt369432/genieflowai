import { ESLint } from 'eslint';

const eslint = new ESLint({
  overrideConfig: {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended',
      'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: ['@typescript-eslint', 'react'],
    rules: {
      // Add your custom rules here
    },
    overrides: [
      {
        files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
        rules: {
          // Add any specific rules for JS/JSX/TS/TSX files here
        },
      },
    ],
    settings: {
      react: {
        version: 'detect', // Automatically detect the react version
      },
    },
  },
});

export default eslint;
