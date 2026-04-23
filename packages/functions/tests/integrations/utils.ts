/// <reference lib="dom" />

import { DocumentSnapshot, DocumentReference } from '@google-cloud/firestore'
import * as admin from 'firebase-admin'
import { authServices } from '../../src/services/auth-service'
import { firestoreServices } from '../../src/services/firestore-service'

import * as firebase from 'firebase/app'
import { IPlanning } from '../../src/types/types'

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
) {
  if (timeout < 0) throw new Error('timeout')
  return new Promise<void>((resolve) => {
    const promise: Promise<T> = retrieveFunction.apply(null, retrieveFunctionArgs)
    promise
      .then((result: T) => {
        if (predicate(result)) {
          resolve()
        } else {
          wait(200)
            .then(() => waitFor(retrieveFunction, retrieveFunctionArgs, predicate, timeout - 200))
            .then(() => resolve())
            .catch((error) => {
              console.error(error)
              throw error
            })
        }
      })
      .catch((error) => {
        console.error(error)
        throw error
      })
  })
}

export function initFirebaseApp() {
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
  firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
  return app
}

export async function deleteUsers(app: admin.app.App, ...userEmails: string[]) {
  return Promise.all(
    userEmails.map(async (userEmail) => {
      const user = await authServices.getUserByEmail(userEmail)
      if (user) {
        await app.auth().deleteUser(user.uid)
        await waitDocumentNotExists(firestoreServices.getUser, [user.uid], DEFAULT_TIMEOUT)
      }
    }),
  )
}

async function getIdToken(userId) {
  const customToken = await admin.auth().createCustomToken(userId)
  const userCredentials = await firebase.auth().signInWithCustomToken(customToken)
  return userCredentials.user.getIdToken()
}

export async function createUser(app: admin.app.App, email: string, displayName: string): Promise<User> {
  const u = await app.auth().createUser({
    email,
    displayName,
  })

  await waitDocumentExists(firestoreServices.getUser, [u.uid], DEFAULT_TIMEOUT)
  const user = await firestoreServices.getUser(u.uid)

  return {
    email,
    uid: u.uid,
    idToken: await getIdToken(u.uid),
    planningRef: user.data().own_planning,
  }
}
