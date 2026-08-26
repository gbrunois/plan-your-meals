module.exports = {
  rootDir: 'tests',
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleFileExtensions: ['js', 'ts', 'json'],
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
