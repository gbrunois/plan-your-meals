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
npm run integration                             # jest integration tests (tests/integrations), hits real Firestore via a service account — needs packages/functions/.env
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
