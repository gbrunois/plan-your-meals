/// <reference lib="dom" />

import { DocumentSnapshot, DocumentReference } from '@google-cloud/firestore'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { authServices } from '../../src/services/auth-service'
import { firestoreServices } from '../../src/services/firestore-service'

import * as firebase from 'firebase/app'
import { IPlanning } from '../../src/types/types'
import { getAuth, signInWithCustomToken, connectAuthEmulator } from 'firebase/auth'

// Project id used when running against the Firebase Emulator Suite. Must be
// a "demo-*" id: firebase-tools then runs fully offline (no real GCP
// project/billing, no credentials needed) - see scripts/run-integration-tests.sh.
const EMULATOR_PROJECT_ID = 'demo-whats-for-dinner-id'

// Region the `api` HTTPS function is deployed to - keep in sync with
// src/index.ts.
const FUNCTIONS_REGION = 'europe-west1'

function isRunningAgainstEmulator() {
  return !!process.env.FIRESTORE_EMULATOR_HOST
}

export interface User {
  email: string
  idToken: string
  uid: string
  planningRef: DocumentReference<IPlanning>
}

type PromiseFunction<T> = (...args: any[]) => Promise<T>
type PredicateFunction<T> = (arg: T) => boolean

/**
 * Max duration before throw a timeout error
 */
export const DEFAULT_TIMEOUT = 10000

/**
 * Return a promise to wait
 * @param duration in milleseconds
 */
export async function wait(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

/**
 * Wait until a document exists.
 * Request firestore every 200ms
 * @param func Method to retrieve the document. Must return a promise
 * @param args Argument for the method
 * @param timeout Raise an exception after this duration
 */
export async function waitDocumentExists(func: PromiseFunction<DocumentSnapshot>, args: any[], timeout: number) {
  return waitFor<DocumentSnapshot>(func, args, (doc) => doc.exists, timeout)
}

/**
 * Wait until a document doesn't exist.
 * Request firestore every 200ms
 * @param func Method to retrieve the document. Must return a promise
 * @param args Argument for the method
 * @param timeout Raise an exception after this duration
 */
export async function waitDocumentNotExists(func: PromiseFunction<DocumentSnapshot>, args: any[], timeout: number) {
  return waitFor<DocumentSnapshot>(func, args, (doc) => !doc.exists, timeout)
}

export async function waitFor<T>(
  retrieveFunction: PromiseFunction<T>,
  retrieveFunctionArgs: any[],
  predicate: PredicateFunction<T>,
  timeout: number,
): Promise<void> {
  // Previously built its retry as a `new Promise((resolve) => ...)` that
  // never called `reject`: a timeout (or any error from retrieveFunction)
  // was thrown from inside a `.then`/`.catch` callback with nothing left to
  // catch it, so it became an unhandled rejection on a promise chain nobody
  // awaited - the outer promise this function returned just hung forever
  // instead of failing (jest only "caught" it because it attributes
  // unrelated unhandled rejections to whichever test happens to be running).
  const deadline = Date.now() + timeout
  for (;;) {
    const result = await retrieveFunction.apply(null, retrieveFunctionArgs)
    if (predicate(result)) return
    if (Date.now() >= deadline) throw new Error('timeout')
    await wait(200)
  }
}

export function initFirebaseApp() {
  if (isRunningAgainstEmulator()) {
    // No real credentials needed: FIRESTORE_EMULATOR_HOST /
    // FIREBASE_AUTH_EMULATOR_HOST (set by `firebase emulators:exec`) make the
    // Admin SDK talk to the local emulators instead of a real project.
    const projectId = process.env.GCLOUD_PROJECT || EMULATOR_PROJECT_ID
    const app = admin.initializeApp({ projectId })
    const clientApp = firebase.initializeApp({ apiKey: 'demo-api-key', projectId })
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      connectAuthEmulator(getAuth(clientApp), `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`)
    }
    return app
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SA_PROJECT_ID,
      clientEmail: process.env.SA_CLIENT_EMAIL,
      privateKey: process.env.SA_PRIVATE_KEY,
    }),
    databaseURL: process.env.SA_DATABASE_URL,
  })
  firebase.initializeApp({
    apiKey: process.env.SA_API_KEY,
    databaseURL: process.env.SA_DATABASE_URL,
  })
  return app
}

/**
 * Base URL of the `api` HTTPS function: the local Functions emulator when
 * running against the emulator suite, otherwise CLOUD_FUNCTION_URL (.env).
 */
export function functionsBaseUrl() {
  if (isRunningAgainstEmulator()) {
    const projectId = process.env.GCLOUD_PROJECT || EMULATOR_PROJECT_ID
    return `http://127.0.0.1:5001/${projectId}/${FUNCTIONS_REGION}/`
  }
  return process.env.CLOUD_FUNCTION_URL
}

/**
 * Delete a user and everything `initializeUser` (see `createUser` below)
 * creates for them. `app.auth().deleteUser()` alone doesn't touch
 * Firestore at all - there's no Auth trigger wired for 2nd-gen functions
 * (see CLAUDE.md's "New user bootstrap") - so this mirrors what
 * `onUserDeleted` (src/index.ts) does for the planning/sharings instead of
 * waiting on a cascade that never happens.
 */
export async function deleteUsers(app: admin.app.App, ...userEmails: string[]) {
  return Promise.all(
    userEmails.map(async (userEmail) => {
      const authUser = await authServices.getUserByEmail(userEmail)
      if (!authUser) return
      const user = await firestoreServices.getUser(authUser.uid)
      if (user.exists) {
        const ownPlanningRef = user.data().own_planning
        if (ownPlanningRef) {
          await firestoreServices.deletePlanning(ownPlanningRef)
        }
        await firestoreServices.deleteUser(authUser.uid)
      }
      await app.auth().deleteUser(authUser.uid)
    }),
  )
}

export async function getIdToken(userId) {
  const customToken = await admin.auth().createCustomToken(userId)
  const userCredentials = await signInWithCustomToken(getAuth(), customToken)
  return userCredentials.user.getIdToken()
}

/**
 * POST that retries once on a 404. The very first HTTP request on a fresh
 * connection through this Docker/Colima setup (see CLAUDE.md's
 * "Integration tests against the emulator") occasionally comes back as a
 * spurious 404 - the emulator's own router seems to sometimes misread the
 * first packet(s) of a new connection. This never reproduces on a warm
 * connection, so a single retry is enough.
 */
export async function postWithRetry(reqUrl: string, data: unknown, options: Record<string, unknown>) {
  try {
    return await axios.post(reqUrl, data, options)
  } catch (error) {
    if (error.response?.status === 404) {
      return await axios.post(reqUrl, data, options)
    }
    throw error
  }
}

/**
 * Create an Auth user and initialize their Firestore profile (own
 * planning, owner sharing...) by explicitly calling the `initializeUser`
 * HTTPS function - `app.auth().createUser()` alone doesn't do this either,
 * for the same reason `deleteUsers` above has to clean up explicitly.
 */
export async function createUser(app: admin.app.App, email: string, displayName: string): Promise<User> {
  const u = await app.auth().createUser({
    email,
    displayName,
  })
  const idToken = await getIdToken(u.uid)

  await postWithRetry(
    new URL('initializeUser', functionsBaseUrl()).toString(),
    { uid: u.uid, email, displayName },
    { headers: { Authorization: `Bearer ${idToken}` } },
  )

  await waitDocumentExists(firestoreServices.getUser, [u.uid], DEFAULT_TIMEOUT)
  const user = await firestoreServices.getUser(u.uid)

  return {
    email,
    uid: u.uid,
    idToken,
    planningRef: user.data().own_planning,
  }
}
