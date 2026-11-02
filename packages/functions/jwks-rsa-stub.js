// Test-only stand-in for `jwks-rsa`, wired in via moduleNameMapper in
// jest.conf.integration.js.
//
// firebase-admin 14's auth module requires jwks-rsa, which requires jose 6 -
// ESM-only, which jest 24 can't load ("Cannot use import statement outside a
// module"). The integration tests never verify an ID token from the jest
// process (that happens inside the emulated functions, a separate Node
// process that isn't affected), so nothing ever calls this.
module.exports = function JwksClient() {
  throw new Error('jwks-rsa is stubbed out in the jest integration tests')
}
module.exports.JwksClient = module.exports
