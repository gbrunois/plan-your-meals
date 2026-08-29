# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plan Your Meals — a Vue 3 + Firebase app to plan weekly meals and share
plannings with others. npm workspaces monorepo:
- `packages/front` — Vue 3 / Vuetify / Vuex SPA (Vite)
- `packages/functions` — Firebase Cloud Functions (Express API + a couple of
  HTTPS/Firestore triggers)

## Commands

Run from repo root unless noted.

```bash
npm install                      # bootstrap all workspaces
npm run front                    # start the front dev server (vite, :5173)
npm run build                    # build all workspaces
npm run lint                     # lint all workspaces
npm run test                     # unit tests, all workspaces
```

Front (`cd packages/front`):
```bash
npm run test                                    # vitest run
npx vitest run tests/unit/services/menu-date.spec.ts   # single test file
npx vitest run -t "<test name>"                 # single test by name
npm run lint                                    # eslint --fix
npm run build -- --mode production              # prod-mode build
```

Functions (`cd packages/functions` — jest's ts-jest config resolution needs
this as the cwd, running from repo root fails):
```bash
npm run test                                    # jest unit tests (*.spec.ts, co-located with source)
npx jest --config ./jest.conf.js src/services/string-utils.spec.ts   # single test file
npx jest --config ./jest.conf.js -t "<test name>"                    # single test by name
npm run integration                             # jest integration tests (tests/integrations); real Firestore via a service account (needs .env) unless FIRESTORE_EMULATOR_HOST etc. point it at a local emulator — see "Integration tests against the emulator" below
npm run build                                   # tsc -> lib/
```

Deploying:
```bash
npm run deploy:dev     # build + firebase deploy --project dev
npm run deploy:prod    # build (production mode) + firebase deploy --project prod
```
See `README.md` for the required local `.firebaserc` / `.env.*` files —
none of them are committed (this repo is public; no project ID, API key, or
service-account secret is ever hardcoded in source).

## Architecture

### Data model (Firestore)

- `users/{uid}` — `own_planning` and `primary_planning` are
  `DocumentReference`s to a planning; has a `sharings` subcollection listing
  every planning shared with this user.
- `plannings/{planningId}` — `owner` uid + `created_date`; subcollections:
  - `days/{date}` — `{ date, lunch, dinner, created }`, one doc per day
  - `sharings/{uid}` — one doc per user with access, doc ID = that user's uid
    (this is load-bearing: `existsSharing()` in `firestore.rules` and most
    access checks key off `sharings/{request.auth.uid}` existing)
  - `pending_sharings/{id}` — invite-by-email entries not yet claimed
- `pending_invitations/{id}` — top-level; links a not-yet-registered email to
  a planning, consumed once that email signs up (see "New user bootstrap").

`firestore.rules` grants access to a planning (read/write on the planning
itself and its `days`) purely by checking `sharings/{request.auth.uid}`
exists — there's no separate "isOwner" check against the planning doc. This
is intentional: a `get()` on a sibling/parent document inside a security rule
never sees writes from the same atomic batch/transaction, so any rule that
tried to read the planning's `owner` field during the same batch that
creates it would always fail closed. Keep new rules for this collection tree
free of cross-document `get()`s that depend on data written in the same
batch.

### New user bootstrap (no Cloud Function in the critical path)

When a user signs in and has no `users/{uid}` doc yet,
`packages/front/src/store/days/index.ts` (`loadPeriod`) detects the missing
`primary_planning` and calls
`packages/front/src/api/plannings/planning.service.ts#initializeUser`, which
runs a single Firestore **batch** from the client to create the user doc, a
new planning, and the owner's `sharings` entry. This is the only bootstrap
path that actually runs — there is no client-side dependency on a Cloud
Function for this.

`packages/functions/src/index.ts` also exposes an `initializeUser` HTTPS
function and `packages/functions/src/profile/index.ts` (meant to replace the
Auth `onCreate`/`onDelete` triggers, which firebase-functions v7 doesn't
expose the same way for 2nd-gen). **Both 2nd-gen HTTPS functions
(`api` and `initializeUser`) currently return 403 on every request** —
looks like a GCP IAM/org policy blocking unauthenticated Cloud Run
invocation, not an application bug. Don't assume calls to
`config.cloudFunctionsUrl` succeed; the app is written to tolerate that
(profile bootstrap doesn't depend on it) but the sharing-by-email API
(`app.ts`'s `/plannings/:planningid/sharings` routes) does, so invite-by-email
is effectively broken until that's resolved. See `TODO.md`.

### Integration tests against the emulator

`tests/integrations/utils.ts#initFirebaseApp`/`functionsBaseUrl` switch to the
Firebase Emulator Suite (no real project/creds) whenever
`FIRESTORE_EMULATOR_HOST` is set. To run `npm run integration` that way:

1. Start the emulators in Docker (the image already bundles a compatible
   JDK + firebase-tools + Node — see
   https://github.com/AndreySenov/firebase-tools-docker):
   ```bash
   docker run -p 9199:9199 -p 9099:9099 -p 9005:9005 -p 9000:9000 -p 8085:8085 \
     -p 8080:8080 -p 5001:5001 -p 5000:5000 -p 4000:4000 \
     -e EMAIL_TRANSPORT=json \
     -v $PWD:/home/node --name firebase-tools andreysenov/firebase-tools \
     firebase emulators:start
   ```
   `-e EMAIL_TRANSPORT=json` is for the container's own process (the actual
   `sendInvitation`/`createSharing` code runs *inside* it) - passing that
   var to `npm run integration` on the host later only affects jest's own
   process, not this one; without it here every sharing-creation call 500s
   trying real Gmail SMTP.

   That `docker run` only works once - `--name firebase-tools` fails on a
   name already in use if the container still exists (stopped or running).
   To reuse it later, `docker start firebase-tools` (container currently
   stopped) or `docker restart firebase-tools` (currently running).
   Either way this re-runs `firebase emulators:start` from scratch, so
   Firestore/Auth data (in-memory, no `--export-on-exit`/`--import`) is
   reset regardless - there's no "resume where I left off" here. Repeat
   step 3's readiness poll after either. Only `docker rm firebase-tools` +
   the `docker run` above again if you need to change its flags (ports,
   env, mounted path).
   `.firebaserc`'s `default` project alias must be a `demo-*` id (this repo
   uses `demo-whats-for-dinner-id`) so firebase-tools runs fully offline.
   `firebase.json`'s `emulators.*.host` are set to `0.0.0.0` — without that,
   auth/functions/UI bind to the container's loopback only and are
   unreachable from outside it even with the ports published (firestore
   happens to default to `0.0.0.0` already, which is why only that one
   "worked" before this was added).
2. **If you're on Colima (`docker context ls` shows `colima` current) rather
   than Docker Desktop**: gRPC (gRPC-js talking to the Firestore emulator,
   i.e. anything through `firebase-admin`/`firestore-service.ts`) fails with
   `14 UNAVAILABLE: ... Protocol error` when reached through the published
   port — reproduces with a bare `curl --http2-prior-knowledge
   http://127.0.0.1:8080/`, works fine with the same command run inside the
   container (`docker exec`). Neither `--network host` nor Colima's
   `--port-forwarder grpc` (vs. its default `ssh`) fix it - this looks
   inherent to relaying raw HTTP/2 "prior knowledge" (no ALPN negotiation)
   through *any* userspace proxy. The fix is `colima start
   --network-address`, then point `FIRESTORE_EMULATOR_HOST` /
   `FIREBASE_AUTH_EMULATOR_HOST` at the VM's own routable IP (`colima
   status`, e.g. `192.168.64.2`) instead of `127.0.0.1` - that reaches the
   container through the VM's real kernel NAT instead of a relayed port,
   and HTTP/2 survives intact.
3. **Important: give every exported function time to become routable, not
   just `api`.** Each one (`api`, `initializeUser`, `onUserDeleted`) seems
   to finish registering independently a few seconds apart; polling only
   `api` and then immediately running tests reliably fails *every* test
   that calls `initializeUser` (`Request failed with status code 404`)
   even though the emulator UI already reports "all emulators ready". Poll
   `initializeUser` too (expect 401, not 404, for a bare unauthenticated
   POST) before running anything:
   ```bash
   until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5001/demo-whats-for-dinner-id/europe-west1/api)" != "000" ]; do sleep 1; done
   until [ "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:5001/demo-whats-for-dinner-id/europe-west1/initializeUser)" != "404" ]; do sleep 1; done
   ```
4. Run the tests with those env vars, e.g.:
   ```bash
   FIRESTORE_EMULATOR_HOST=192.168.64.2:8080 \
   FIREBASE_AUTH_EMULATOR_HOST=192.168.64.2:9099 \
   GCLOUD_PROJECT=demo-whats-for-dinner-id \
   EMAIL_TRANSPORT=json \
   npm run integration
   ```
   (this `EMAIL_TRANSPORT=json` is for jest's own process, in addition to
   the one passed to `docker run` above)

   `jest.conf.integration.js` also loads
   `../global-fetch-polyfill.js` (jest 24's bundled `jest-environment-node`
   predates Node's global `fetch`, needed by the `firebase/auth` client SDK)
   and `../patch-node-builtin-prefix.js` via `NODE_OPTIONS` in the
   `integration` npm script (jest 24's module resolver predates `node:`-
   prefixed core imports, which `firebase-admin`'s current
   Firestore/`google-gax` dependency chain uses).

All of `tests/integrations/*.spec.ts` pass against the emulator with the
above. Getting there surfaced (and fixed) real bugs nothing had ever
exercised before, since both HTTPS functions return 403 in production
before reaching this code (see above) and nothing had run them locally
end-to-end either:
- `src/index.ts` never called `admin.initializeApp()` at all - every
  `admin.firestore()`/`admin.auth()` call from *inside* a Cloud Function
  (as opposed to the test driver, which initializes its own) threw "The
  default Firebase app does not exist".
- `firestore-service.ts#resetUserPrimaryPlanningWithOwnPlanning` did
  `if (user) { user.data()... }` - `getUser()` always resolves to a
  `DocumentSnapshot`, even when the doc doesn't exist, so this crashed
  instead of skipping, on precisely the case (a just-deleted user) that
  the delete-cascade code path exists to handle.
- `onUserDeleted` (`onDocumentDeleted('users/{userId}', ...)`) delegated to
  `profile/index.ts#onAuthUserDeleted`, which only deletes the owner's
  planning `if (doc.exists)` - written for an *Auth* onDelete trigger where
  the Firestore doc would still exist, but by the time a *Firestore*
  delete trigger fires the doc is already gone, so that branch was dead
  code. Fixed by reading `own_planning` from the trigger event's own
  pre-deletion snapshot (`event.data`) instead of re-fetching.
- `utils.ts`'s `createUser`/`deleteUsers` assumed Auth user
  creation/deletion has Firestore-side effects (auto-provisioning /
  auto-cleanup) that don't exist - see "New user bootstrap" above. They now
  call `initializeUser` and delete the Firestore data explicitly instead of
  polling for a cascade that was never going to happen.
- `tests/integrations/utils.ts#waitFor`'s retry was a
  `new Promise((resolve) => ...)` that never called `reject`: any error
  (including its own timeout) was thrown from inside a `.then`/`.catch`
  with nothing left to catch it, becoming an unhandled rejection on a
  promise chain nobody awaited. The outer promise just hung forever
  instead of failing (jest only ever "caught" it by misattributing the
  unhandled rejection to whichever test happened to be running).
- Through this same Docker/Colima path, the *first* HTTP/1.1 request on a
  fresh connection occasionally comes back as a spurious 404 (the
  emulator's own router seems to sometimes misread the first packet(s) of
  a new connection) - `utils.ts#postWithRetry` retries once on a 404 to
  paper over it; this is an environment quirk, not an application bug, and
  never reproduces on a warm connection.

### Front (`packages/front`)

- Vuex modules under `src/store/{auth,days,plannings,sharings}`; each pairs
  with an `src/api/**/*.service.ts` that talks to Firestore directly via the
  `firebase/compat` SDK (`src/api/firebaseService.ts` exports `database`/`auth`).
  There is no offline persistence (`enablePersistence`) — it was removed
  because it stores `DocumentReference` fields (e.g. `primary_planning`)
  that can't be structured-cloned into IndexedDB, which crashed Firestore
  with `INTERNAL ASSERTION FAILED`.
- `src/store/days/index.ts`'s `update` action mutates local state (`commit`)
  *before* reading `state.openedDay` to build the payload sent to Firestore —
  if that order is ever reversed, the write sent is always one edit behind
  the field currently being typed (this exact regression happened once;
  `MealComponent.vue` debounces each textarea independently, which is what
  made it visible).
- `router.ts` gates routes via `meta.authRequired` + the `auth/isLoggedIn`
  getter; `App.vue` drives the sign-in redirect by watching `auth/user`.
- Config (Firebase web app keys, Cloud Functions base URL) comes from
  `config.ts` reading `import.meta.env.VITE_*`, populated by Vite's
  mode-based env files: `.env.development` (dev server) / `.env.production`
  (`vite build`, which defaults to production mode even without `--mode`).

### Functions (`packages/functions`)

- `src/api/app.ts` — Express app mounted at the `api` HTTPS function;
  every route runs through `authServices`'s `authenticate` middleware
  (verifies the Firebase ID token) and, for planning-scoped routes,
  `ensurePlanningIsOwnByUser`.
- `src/services/firestore-service.ts` — all Firestore reads/writes go
  through here, using `FirestoreDataConverter`s per collection
  (`I*`/`IDb*` interface pairs in `src/types/types.ts` — `IDb*` is the
  on-disk shape, e.g. `DocumentReference<IDbPlanning>` instead of the
  richer runtime type).
- `src/services/invitation-service.ts` + `email-service.ts` — invite-by-email
  flow: renders `src/api/resources/invitation.html` with Mustache and sends
  via `nodemailer`. `acceptPendingInvationIfExists` is called on new-user
  bootstrap to convert any `pending_invitations` matching the new user's
  email into real `sharings`.
- `src/services/config-service.ts` loads env vars via `dotenv.config()` (reads the
  plain `.env`, not the project-scoped `.env.<alias>` files Firebase CLI uses
  at deploy time — see README for how those two mechanisms relate).
