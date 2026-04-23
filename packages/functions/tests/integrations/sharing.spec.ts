import admin = require('firebase-admin')
import { config as loadEnvFile } from 'dotenv'
import { firestoreServices } from '../../src/services/firestore-service'
import * as url from 'url'
import axios from 'axios'
import { initFirebaseApp, deleteUsers, createUser, waitDocumentExists, DEFAULT_TIMEOUT } from './utils'
const FAKE_NAME_USER_2 = 'Existing user'
const FAKE_NAME_USER_1 = 'Invited user'

describe('sharing', () => {
  let app: admin.app.App
  let apiUrl: string

  beforeAll(async () => {
    loadEnvFile()
    app = initFirebaseApp()
    apiUrl = process.env.CLOUD_FUNCTION_URL

    await deleteUsers(app, process.env.FAKE_GMAIL_USER_1, process.env.FAKE_GMAIL_USER_2)
  })

  afterAll(async () => {
    await app.delete()
  })

  afterEach(async () => {
    const pendingInvitations = await firestoreServices.findPendingInvitations(process.env.FAKE_GMAIL_USER_1)
    await Promise.all(
      pendingInvitations.docs.map(
        async (pendingInvitation) => await firestoreServices.deletePendingInvitation(pendingInvitation.ref),
      ),
    )
    await deleteUsers(app, process.env.FAKE_GMAIL_USER_1, process.env.FAKE_GMAIL_USER_2)
  })

  it('should create pending invitation', async () => {
    try {
      const existingUser = await createUser(app, process.env.FAKE_GMAIL_USER_2, FAKE_NAME_USER_2)
      const response = await createSharing(apiUrl, existingUser, process.env.FAKE_GMAIL_USER_1)
      expect(response.status).toBe(201)

      const pendingInvitations = await firestoreServices.findPendingInvitations(process.env.FAKE_GMAIL_USER_1)
      expect(pendingInvitations.size).toBe(1)
      expect(pendingInvitations.docs[0].data().planning.path).toBe(existingUser.planningRef.path)
      expect(pendingInvitations.docs[0].data().user_id).toBe(existingUser.uid)
    } catch (error) {
      fail(error)
    }
  })

  it('should remove sharing when user deleted', async () => {
    try {
      const existingUser = await createUser(app, process.env.FAKE_GMAIL_USER_2, FAKE_NAME_USER_2)
      const response = await createSharing(apiUrl, existingUser, process.env.FAKE_GMAIL_USER_1)
      expect(response.status).toBe(201)

      const invitedUser = await createUser(app, process.env.FAKE_GMAIL_USER_1, FAKE_NAME_USER_1)

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

      const pendingInvitations = await firestoreServices.findPendingInvitations(process.env.FAKE_GMAIL_USER_1)
      expect(pendingInvitations.size).toBe(0)

      await deleteUsers(app, process.env.FAKE_GMAIL_USER_1)

      sharedPlannings = await firestoreServices.getPlanningSharings(existingUser.planningRef)
      expect(sharedPlannings.size).toBe(1)
    } catch (error) {
      fail(error)
    }
  })

  async function createSharing(baseUrl: string, user: any, email: string) {
    const sharingUrl = url.resolve(baseUrl, `api/plannings/${user.planningRef.id}/sharings`)
    return await axios.post(
      sharingUrl,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${user.idToken}`,
        },
      },
    )
  }
})
