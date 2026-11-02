const path = require('path')

module.exports = {
  rootDir: 'tests',
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  // jest 24 ignores package.json "exports" maps, so `firebase-admin/app`,
  // `firebase-admin/firestore`... (the modular entry points, the only API
  // left in firebase-admin 14) don't resolve - point them at the lib/ dirs.
  moduleNameMapper: {
    '^firebase-admin/(.*)$': `${path.dirname(require.resolve('firebase-admin'))}/$1`,
    // jose 6 (pulled in by jwks-rsa via firebase-admin/auth) is ESM-only.
    '^jwks-rsa$': '<rootDir>/../jwks-rsa-stub.js',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+(?:!\\.d|)\\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)spec)\\.(jsx?|tsx?)$',
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.json',
    },
  },
  globalSetup: '../global-setup.js',
  // firebase/auth (client SDK, used by tests/integrations/utils.ts) needs a
  // global fetch; jest 24's bundled jest-environment-node predates Node's
  // fetch and never copies it into the test sandbox - see the file for why
  // it polyfills from node-fetch specifically.
  setupFiles: ['../global-fetch-polyfill.js'],
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
}
