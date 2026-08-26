import admin = require('firebase-admin')
import { config as loadEnvFile } from 'dotenv'
import axios from 'axios'
import { firestoreServices } from '../../src/services/firestore-service'
import { initFirebaseApp, waitDocumentExists, DEFAULT_TIMEOUT, functionsBaseUrl, getIdToken, deleteUsers, postWithRetry } from './utils'

// Unlike user.spec.ts (which goes through utils.ts's `createUser`), this
// exercises the `initializeUser` HTTPS function directly - to cover
// idempotency and the missing-auth-header case, which that helper doesn't.
// There's no Auth trigger wiring `initializeUser` up automatically (see
// CLAUDE.md's "New user bootstrap" section), so a plain
// `app.auth().createUser()` never reaches it on its own.
const FAKE_USER_NAME = 'Geoffrey'

describe('initializeUser (HTTPS function)', () => {
  let app: admin.app.App
  let apiUrl: string
  let fakeUserEmail: string

  beforeAll(async () => {
    loadEnvFile()
    app = initFirebaseApp()
    apiUrl = functionsBaseUrl()
    fakeUserEmail = process.env.FAKE_GMAIL_USER_1 || 'integration-test-user-1@example.com'

    await deleteUsers(app, fakeUserEmail)
  })

  afterEach(async () => {
    await deleteUsers(app, fakeUserEmail)
  })

  afterAll(async () => {
    await app.firestore().terminate()
    await app.delete()
  })

  it('creates the user doc, planning and owner sharing', async () => {
    const newUser = await app.auth().createUser({
      email: fakeUserEmail,
      displayName: FAKE_USER_NAME,
    })
    const idToken = await getIdToken(newUser.uid)

    const response = await postWithRetry(
      new URL('initializeUser', apiUrl).toString(),
      { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(response.status).toBe(200)

    await waitDocumentExists(firestoreServices.getUser, [newUser.uid], DEFAULT_TIMEOUT)
    const user = await firestoreServices.getUser(newUser.uid)
    expect(user.data().own_planning.path).toBe(user.data().primary_planning.path)

    const userPlanningRef = user.data().own_planning
    const userPlanning = await firestoreServices.getPlanning(userPlanningRef)
    expect(userPlanning.data().owner).toBe(user.id)

    const planningSharings = await firestoreServices.getPlanningSharings(userPlanningRef)
    expect(planningSharings.size).toBe(1)
    const sharing = planningSharings.docs[0].data()
    expect(sharing.user_id).toBe(newUser.uid)
    expect(sharing.is_owner).toBeTruthy()

    const userSharings = await firestoreServices.getUserSharings(user.ref)
    expect(userSharings.size).toBe(1)
    expect(userSharings.docs[0].data().planning.path).toBe(userPlanningRef.path)
  })

  it('is idempotent when called twice for the same user', async () => {
    const newUser = await app.auth().createUser({
      email: fakeUserEmail,
      displayName: FAKE_USER_NAME,
    })
    const idToken = await getIdToken(newUser.uid)
    const body = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName }

    await postWithRetry(new URL('initializeUser', apiUrl).toString(), body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    await waitDocumentExists(firestoreServices.getUser, [newUser.uid], DEFAULT_TIMEOUT)
    const userAfterFirstCall = await firestoreServices.getUser(newUser.uid)
    const planningRef = userAfterFirstCall.data().own_planning

    const secondResponse = await postWithRetry(new URL('initializeUser', apiUrl).toString(), body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(secondResponse.status).toBe(200)

    const userAfterSecondCall = await firestoreServices.getUser(newUser.uid)
    expect(userAfterSecondCall.data().own_planning.path).toBe(planningRef.path)
    const planningSharings = await firestoreServices.getPlanningSharings(planningRef)
    expect(planningSharings.size).toBe(1)
  })

  it('rejects a request without an Authorization header', async () => {
    const newUser = await app.auth().createUser({
      email: fakeUserEmail,
      displayName: FAKE_USER_NAME,
    })

    await expect(
      axios.post(new URL('initializeUser', apiUrl).toString(), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
      }),
    ).rejects.toMatchObject({ response: { status: 401 } })
  })
})
