module.exports = {
  rootDir: 'tests',
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testRegex: '(/__tests__/.*|(\\.|/)spec)\\.(jsx?|tsx?)$',
  globalSetup: '../global-setup.js',
  moduleNameMapper: {
    // jose 6 (pulled in by jwks-rsa via firebase-admin/auth) is ESM-only, which
    // jest can't load without a transform. The integration tests never verify
    // an ID token from the jest process (that happens inside the emulated
    // functions), so a stub is enough - see the file.
    '^jwks-rsa$': '<rootDir>/../jwks-rsa-stub.js',
  },
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
}
