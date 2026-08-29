// Preloaded via NODE_OPTIONS (see the "integration" script in package.json)
// for `npm run integration`.
//
// jest 24 predates Node's `node:`-prefixed core module specifiers (e.g.
// `node:events`, added in Node 14.18/16 - firebase-admin's Firestore client
// pulls in google-gax, whose dependency tree uses them). Its bundled
// isCoreModule check builds its known-core-modules set from
// `module.builtinModules` once, the first time it's required, so a bare
// `require('events')` resolves fine but `require('node:events')` doesn't:
// jest treats it as a file to look up, fails, and (worse) sometimes
// half-resolves it to a bogus non-existent path instead of erroring
// cleanly. This has to run before that set gets built, hence preloading via
// -r rather than a jest setupFile (which loads too late, and inside jest's
// sandboxed test context rather than its own driver process).
const Module = require('module')
Module.builtinModules = [...Module.builtinModules, ...Module.builtinModules.map((name) => `node:${name}`)]
