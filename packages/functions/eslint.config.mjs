import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**', '*.js', '*.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      // Cloud Functions: a floating promise is a function that may be killed before it finishes.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'no-duplicate-imports': 'error',
      // Legacy code: tslint never enforced these, keep parity instead of a big refactor.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'prefer-spread': 'off',
      'no-cond-assign': 'error',
      'no-param-reassign': 'error',
      'no-var': 'warn',
      eqeqeq: 'warn',
    },
  },
)
