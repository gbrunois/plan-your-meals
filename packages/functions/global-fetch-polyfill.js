// jest 24's jest-environment-node predates Node's global fetch (added in
// Node 18) and never copies it into the sandboxed test global. The
// integration tests import the `firebase/auth` client SDK (via
// tests/integrations/utils.ts), which requires `fetch`/`Headers`/`Request`/
// `Response` to exist globally - polyfill them here.
//
// Not undici (the implementation backing Node's own global fetch): its
// module graph uses `node:`-prefixed core imports (e.g. `node:assert`),
// which jest 24's bundled module resolver - also written before that
// specifier syntax existed - can't resolve. node-fetch@2 predates that
// syntax too, so it works with this jest version.
const fetch = require('node-fetch')
const { Headers, Request, Response } = fetch

if (typeof globalThis.fetch === 'undefined') {
  Object.assign(globalThis, { fetch, Headers, Request, Response })
}
