import admin = require('firebase-admin')
import { config as loadEnvFile } from 'dotenv'
import { firestoreServices } from '../../src/services/firestore-service'
import { waitDocumentNotExists, initFirebaseApp, createUser, deleteUsers, DEFAULT_TIMEOUT } from './utils'

const FAKE_USER_NAME = 'Geoffrey'

describe('user', () => {
  let app: admin.app.App
  let fakeUserEmail: string

  beforeAll(async () => {
    loadEnvFile()
    app = initFirebaseApp()

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

  it('should create a planning and user when a user is created', async () => {
    const newUser = await createUser(app, fakeUserEmail, FAKE_USER_NAME)
    const user = await firestoreServices.getUser(newUser.uid)
    expect(user.data()).toBeDefined()
    expect(user.data().own_planning.path).toBe(user.data().primary_planning.path)
    expect(user.data().own_planning.path).toBe(newUser.planningRef.path)

    const userPlanningRef = user.data().own_planning
    const userPlanning = await firestoreServices.getPlanning(userPlanningRef)
    expect(userPlanning.data().owner).toBe(user.id)

    const planningSharings = await firestoreServices.getPlanningSharings(userPlanningRef)
    expect(planningSharings.size).toBe(1)
    const sharing = planningSharings.docs[0].data()
    expect(sharing.user_display_name).toBe(FAKE_USER_NAME)
    expect(sharing.user_email).toBe(newUser.email)
    expect(sharing.user_id).toBe(newUser.uid)
    expect(sharing.is_owner).toBeTruthy()

    const userSharings = await firestoreServices.getUserSharings(user.ref)
    expect(userSharings.size).toBe(1)
    expect(userSharings.docs[0].data().planning.path).toBe(user.data().primary_planning.path)
  })

  it('should delete the planning when the user document is deleted', async () => {
    const newUser = await createUser(app, fakeUserEmail, FAKE_USER_NAME)
    const userPlanningRef = newUser.planningRef

    // Deleting the Firestore doc directly, not the Auth account: that's
    // what the `onUserDeleted` Firestore trigger (`onDocumentDeleted`,
    // src/index.ts) actually listens for, and the only cleanup path that's
    // wired up at all.
    await firestoreServices.getUser(newUser.uid).then((doc) => doc.ref.delete())
    await waitDocumentNotExists(firestoreServices.getPlanning, [userPlanningRef], DEFAULT_TIMEOUT)

    const userPlanning = await firestoreServices.getPlanning(userPlanningRef)
    expect(userPlanning.exists).toBeFalsy()
  })
})
