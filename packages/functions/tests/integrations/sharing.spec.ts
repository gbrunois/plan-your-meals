import admin = require('firebase-admin')
import { config as loadEnvFile } from 'dotenv'
import { firestoreServices } from '../../src/services/firestore-service'
import { initFirebaseApp, deleteUsers, createUser, waitDocumentExists, DEFAULT_TIMEOUT, functionsBaseUrl, postWithRetry } from './utils'
const FAKE_NAME_USER_2 = 'Existing user'
const FAKE_NAME_USER_1 = 'Invited user'

describe('sharing', () => {
  let app: admin.app.App
  let apiUrl: string
  let fakeUserEmail1: string
  let fakeUserEmail2: string

  beforeAll(async () => {
    loadEnvFile()
    app = initFirebaseApp()
    apiUrl = functionsBaseUrl()
    fakeUserEmail1 = process.env.FAKE_GMAIL_USER_1 || 'integration-test-user-1@example.com'
    fakeUserEmail2 = process.env.FAKE_GMAIL_USER_2 || 'integration-test-user-2@example.com'

    await deleteUsers(app, fakeUserEmail1, fakeUserEmail2)
  })

  afterAll(async () => {
    await app.firestore().terminate()
    await app.delete()
  })

  afterEach(async () => {
    const pendingInvitations = await firestoreServices.findPendingInvitations(fakeUserEmail1)
    await Promise.all(
      pendingInvitations.docs.map(
        async (pendingInvitation) => await firestoreServices.deletePendingInvitation(pendingInvitation.ref),
      ),
    )
    await deleteUsers(app, fakeUserEmail1, fakeUserEmail2)
  })

  it('should create pending invitation', async () => {
    try {
      const existingUser = await createUser(app, fakeUserEmail2, FAKE_NAME_USER_2)
      const response = await createSharing(apiUrl, existingUser, fakeUserEmail1)
      expect(response.status).toBe(201)

      const pendingInvitations = await firestoreServices.findPendingInvitations(fakeUserEmail1)
      expect(pendingInvitations.size).toBe(1)
      expect(pendingInvitations.docs[0].data().planning.path).toBe(existingUser.planningRef.path)
      expect(pendingInvitations.docs[0].data().user_id).toBe(existingUser.uid)
    } catch (error) {
      fail(error)
    }
  })

  it('should remove sharing when user deleted', async () => {
    try {
      const existingUser = await createUser(app, fakeUserEmail2, FAKE_NAME_USER_2)
      const response = await createSharing(apiUrl, existingUser, fakeUserEmail1)
      expect(response.status).toBe(201)

      const invitedUser = await createUser(app, fakeUserEmail1, FAKE_NAME_USER_1)

      // wait planning sharing is created (invitation accepted)
      await waitDocumentExists(
        firestoreServices.getPlanningSharing,
        [existingUser.planningRef, invitedUser.uid],
        DEFAULT_TIMEOUT,
      )
      // TODO check user sharing

      let sharedPlannings = await firestoreServices.getPlanningSharings(existingUser.planningRef)
      expect(sharedPlannings.size).toBe(2)
      // TODO Check content

      const pendingInvitations = await firestoreServices.findPendingInvitations(fakeUserEmail1)
      expect(pendingInvitations.size).toBe(0)

      await deleteUsers(app, fakeUserEmail1)

      sharedPlannings = await firestoreServices.getPlanningSharings(existingUser.planningRef)
      expect(sharedPlannings.size).toBe(1)
    } catch (error) {
      fail(error)
    }
  })

  async function createSharing(baseUrl: string, user: any, email: string) {
    const sharingUrl = new URL(`api/plannings/${user.planningRef.id}/sharings`, baseUrl).toString()
    return postWithRetry(sharingUrl, { email }, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${user.idToken}`,
      },
    })
  }
})
