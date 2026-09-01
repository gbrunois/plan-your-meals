[![CI/CD](https://github.com/gbrunois/plan-your-meals/actions/workflows/deploy.yml/badge.svg)](https://github.com/gbrunois/plan-your-meals/actions/workflows/deploy.yml)

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

# plan-your-meals

Plan your meals is an application to plan the meals of the week

# Projects

## Front

[README](https://github.com/gbrunois/plan-your-meals/blob/master/packages/front/README.md)

## Firebase cloud functions

[README](https://github.com/gbrunois/plan-your-meals/blob/master/packages/functions/README.md)

# Installation

## Firebase

- Create a [firebase project](https://firebase.google.com/docs/web/setup) for
  development, and later a separate one for production
- Enable Firestore
- Enable billing on Google Cloud Project
- Configure Consent Screen [https://console.cloud.google.com/apis/credentials/consent]

This repo is public: **no project ID, API key, or service account secret is
ever committed**. Everything environment-specific lives in local, gitignored
files. Each of these has a tracked `*.example` template to copy from.

## Environment setup

1. **`.firebaserc`** (repo root) — copy from `.firebaserc.example` and fill in
   your Firebase project ID(s):
   ```json
   {
     "projects": {
       "default": "your-dev-project-id",
       "dev": "your-dev-project-id",
       "prod": "your-prod-project-id"
     }
   }
   ```
   `default` should always point at `dev`, so any `firebase` command run
   without an explicit `--project`/`firebase use` never touches production by
   accident.

2. **Front** (`packages/front/`) — copy `.env.example` to `.env.development`
   with your dev project's web app config (Firebase console > Project
   settings > General > Your apps), and to `.env.production` with the prod
   project's config once it exists. Vite loads the matching file
   automatically: `npm run front` / `vite` uses `.env.development`, `vite
   build` uses `.env.production` by default.

3. **Functions** (`packages/functions/`) — copy `.env.example` to `.env.dev`
   (matching the `.firebaserc` alias) and fill in a service account key
   generated from the dev project (Project settings > Service accounts >
   Generate new private key). Do the same for `.env.prod` once the
   production project exists. `firebase deploy`/`emulators:start` load the
   file matching the currently targeted project automatically. **Never reuse
   a key across environments.**

## Running locally

```
npm install
npm run front
```

The dev server talks directly to the dev Firebase project (Firestore, Auth) —
no emulator required. Open http://localhost:5173.

## Deploying

```
npm run deploy:dev    # builds in development mode, deploys --project dev
npm run deploy:prod   # builds in production mode, deploys --project prod
```

`deploy:prod` only works once `.firebaserc`'s `prod` alias and
`packages/front/.env.production` / `packages/functions/.env.prod` are filled
in (see above).

## Continuous delivery

- Linked with GitHub Actions (`.github/workflows/deploy.yml`)
- Project IDs are **not** in the workflow file — set them as repository
  secrets: `FIREBASE_DEV_PROJECT_ID`, `FIREBASE_PROD_PROJECT_ID`
- Firebase CI tokens: `FIREBASE_DEV_TOKEN`, `FIREBASE_PROD_TOKEN` — generate
  with [`firebase login:ci`](https://firebase.google.com/docs/cli#sign-in-test-token)
