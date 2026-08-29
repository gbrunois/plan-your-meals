import * as admin from 'firebase-admin'
import { DocumentReference } from '@google-cloud/firestore'
import { UserRecord } from 'firebase-admin/auth'

import { firestoreServices } from '../services/firestore-service'
import { IPlanning } from '../types/types'
import { invitationServices } from '../services/invitation-service'

// Type for firebase-functions v1 auth trigger event
interface AuthUserEvent {
  data: UserRecord
  eventId: string
  timestamp: string
  eventName: string
}

export function onAuthUserCreated(user: UserRecord | AuthUserEvent) {
  const userData = (user as any).data || (user as UserRecord)
  console.info('onAuthUserCreated', { userId: userData.uid, userEmail: userData.email })
  return firestoreServices
    .getUser(userData.uid)
    .then(async (existingUser) => {
      if (existingUser.exists) {
        // TODO user exist but planning is well created ???
        return null
      } else {
        const newPlanningRef: DocumentReference<IPlanning> = firestoreServices.buildNewPlanningReference()
        return newPlanningRef
          .set({
            owner: userData.uid,
            created_date: new Date(),
          })
          .then(() => {
            return admin.firestore().runTransaction(async (t) => {
              await firestoreServices.createPlanningSharing(userData, newPlanningRef, true, t)
              await firestoreServices.createUser(userData.uid, newPlanningRef, t)
              await firestoreServices.createUserSharing(userData, newPlanningRef, true, userData.displayName, t)
            })
          })
          .then(() => invitationServices.acceptPendingInvationIfExists(userData))
      }
    })
    .catch((reason: Error) => {
      console.error(reason)
    })
}

export async function onAuthUserDeleted(user: UserRecord | AuthUserEvent) {
  /**
   * On user deleted
   * Delete user own planning
   * Delete user identity
   */
  const userData = (user as any).data || (user as UserRecord)
  console.info('onAuthUserDeleted', { userId: userData.uid, userEmail: userData.email })
  const userId = userData.uid
  // TODO Use transaction
  await firestoreServices
    .getUser(userData.uid)
    .then(async (doc) => {
      if (doc.exists) {
        const ownPlanningRef = doc.data().own_planning
        if (ownPlanningRef) {
          await firestoreServices.deletePlanning(ownPlanningRef)
        }
      }
    })
    .then(() => firestoreServices.deleteUser(userId))
}
