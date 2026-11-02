module.exports = {
  rootDir: 'src',
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testRegex: '(/__tests__/.*|(\\.|/)spec)\\.(jsx?|tsx?)$',
  globalSetup: '../global-setup.js',
}
