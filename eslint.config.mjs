import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Теперь это один массив конфигураций
  [
    {
      ignores: ['dist/**', 'node_modules/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
    {
      name: 'custom-sort-rules', // Можно давать имена блокам для отладки
      plugins: {
        'simple-import-sort': simpleImportSort,
      },
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
      },
    },
    {
      name: 'language-options',
      languageOptions: {
        globals: {
          ...globals.node,
        },
        sourceType: 'module',
      },
    },
    {
      name: 'base-rules',
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  ],
);
