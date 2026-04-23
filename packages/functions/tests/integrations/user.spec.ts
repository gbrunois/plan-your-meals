import admin = require('firebase-admin')
import { config as loadEnvFile } from 'dotenv'
import { firestoreServices } from '../../src/services/firestore-service'
import { waitDocumentExists, waitDocumentNotExists, initFirebaseApp, deleteUsers, DEFAULT_TIMEOUT } from './utils'

const FAKE_USER_NAME = 'Geoffrey'

describe('user', () => {
  let app: admin.app.App
  let fakeUserEmail: string
  let apiUrl: string

  beforeAll(async () => {
    loadEnvFile()
    app = initFirebaseApp()

    fakeUserEmail = process.env.FAKE_GMAIL_USER_1
    apiUrl = process.env.CLOUD_FUNCTION_URL

    await deleteUsers(app, fakeUserEmail)
  })

  afterEach(async () => {
    await deleteUsers(app, fakeUserEmail)
  })

  afterAll(async () => {
    await app.delete()
  })

  it('should create a planning and user when a user is created', async () => {
    const newUser = await app.auth().createUser({
      email: fakeUserEmail,
      displayName: FAKE_USER_NAME,
    })
    await waitDocumentExists(firestoreServices.getUser, [newUser.uid], DEFAULT_TIMEOUT)
    const user = await firestoreServices.getUser(newUser.uid)
    expect(user.data()).toBeDefined()
    expect(user.data().own_planning.path).toBe(user.data().primary_planning.path)

    const userPlanningRef = user.data().own_planning

    await waitDocumentExists(firestoreServices.getPlanning, [userPlanningRef], DEFAULT_TIMEOUT)
    const userPlanning = await firestoreServices.getPlanning(userPlanningRef)
    expect(userPlanning.data().owner).toBe(user.id)

    const planningSharings = await firestoreServices.getPlanningSharings(userPlanningRef)
    expect(planningSharings.size).toBe(1)
    const sharing = planningSharings.docs[0].data()
    expect(sharing.user_display_name).toBe(newUser.displayName)
    expect(sharing.user_email).toBe(newUser.email)
    expect(sharing.user_id).toBe(newUser.uid)
    expect(sharing.is_owner).toBeTruthy()

    const userSharings = await firestoreServices.getUserSharings(user.ref)
    expect(userSharings.size).toBe(1)
    expect(userSharings.docs[0].data().planning.path).toBe(user.data().primary_planning.path)
  })

  it('should delete a planning and user when a user is deleted', async () => {
    const newUser = await app.auth().createUser({
      email: fakeUserEmail,
      displayName: FAKE_USER_NAME,
    })
    await waitDocumentExists(firestoreServices.getUser, [newUser.uid], DEFAULT_TIMEOUT)
    let user = await firestoreServices.getUser(newUser.uid)
    const userPlanningRef = user.data().own_planning

    await app.auth().deleteUser(newUser.uid)
    await waitDocumentNotExists(firestoreServices.getUser, [newUser.uid], DEFAULT_TIMEOUT)

    const userPlanning = await firestoreServices.getPlanning(userPlanningRef)
    expect(userPlanning.exists).toBeFalsy()

    user = await firestoreServices.getUser(newUser.uid)
    expect(user.exists).toBeFalsy()
  })
})
