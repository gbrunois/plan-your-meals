module.exports = {
  root: true,

  ignorePatterns: [
    'node_modules/',
    'dist/',
    '*.config.js',
    '*.config.ts',
    'coverage/',
    'public/',
  ],

  env: {
    node: true,
    browser: true, // ajout recommandé pour un projet front
    es2022: true,
  },

  parser: 'vue-eslint-parser', // parser principal pour les fichiers .vue

  parserOptions: {
    parser: '@typescript-eslint/parser', // parser pour le <script> TypeScript
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  plugins: ['@typescript-eslint'],

  extends: [
    'plugin:vue/vue3-recommended', // règles Vue 3
    'plugin:@typescript-eslint/recommended', // règles TypeScript
    'plugin:prettier/recommended', // prettier en dernier
  ],

  rules: {
    'no-console': [
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      { allow: ['error'] }, // console.error is legitimate error reporting; console.log/info/debug are not
    ],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
}
