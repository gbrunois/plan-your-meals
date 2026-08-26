import {
  DocumentReference,
  Transaction,
  DocumentSnapshot,
  WriteResult,
} from '@google-cloud/firestore'
import admin = require('firebase-admin')
import {
  IPlanning,
  IUser,
  IDbUser,
  IDbPlanning,
  IPlanningSharing,
  IPendingInvitation,
  IUserSharing,
  IPlanningPendingSharing,
  IDbPlanningSharing,
  IDbPlanningPendingSharing,
  IDbUserSharing,
  IDbPendingInvitation,
} from '../types/types'
import * as _ from 'lodash'
import { removeDotsInEmail } from './string-utils'
import { FirestoreDataConverter, QueryDocumentSnapshot, DocumentData, WithFieldValue } from 'firebase-admin/firestore'


const planningSharingConverter = {
    toFirestore(value: IPlanningSharing): IDbPlanningSharing {
      return value as IDbPlanningSharing
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): IPlanningSharing {
      const data = snapshot.data() as IDbPlanningSharing
      return {
        ...data,
        id: snapshot.id,
      } as IPlanningSharing
    }
}
const userSharingConverter = {
    toFirestore(value: IUserSharing): IDbUserSharing {
      return value as IDbUserSharing
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): IUserSharing {
      const data = snapshot.data() as IDbUserSharing
      return {
        ...data,
        id: snapshot.id,
      } as IUserSharing
    }
}

const userConverter = {
  toFirestore(value: IUser): IDbUser {
    return value as IDbUser
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): IUser {
    const data = snapshot.data() as IDbUser
    return {
      ...data,
      id: snapshot.id,
    } as IUser
  }
} 

const planningConverter = {
    toFirestore(value: IPlanning): IDbPlanning {
      return value as IDbPlanning
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): IPlanning {
      const data = snapshot.data() as IDbPlanning
      return {
        ...data,
        id: snapshot.id,
      } as IPlanning
    }
}

const planningPendingSharingConverter = {
    toFirestore(value: IPlanningPendingSharing): IDbPlanningPendingSharing {
      return value as IDbPlanningPendingSharing
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): IPlanningPendingSharing {
      const data = snapshot.data() as IDbPlanningPendingSharing
      return {
        ...data,
        id: snapshot.id,
      } as IPlanningPendingSharing
    }
}

const pendingInvitationConverter = {
    toFirestore(value: IPendingInvitation): IDbPendingInvitation {
      return value as IDbPendingInvitation
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): IPendingInvitation {
      const data = snapshot.data() as IDbPendingInvitation
      return {
        ...data,
        id: snapshot.id,
      } as IPendingInvitation
    }
}

export const firestoreServices = {
  createUser(userId: string, newPlanningRef: DocumentReference<IPlanning>, t: Transaction = null) {
    const userObject: IUser = {
      created_date: new Date(),
      primary_planning: newPlanningRef,
      own_planning: newPlanningRef,
    }
    const userRef = firestoreServices.buildUserReference(userId)
    if (t) {
      return t.create(userRef, userObject)
    } else {
      return userRef.set(userObject)
    }
  },

  /**
   * Add a user reference in the sharings list of a planning
   * @param user User to add
   * @param planningRef The planning reference
   */
  createPlanningSharing(
    user: admin.auth.UserRecord,
    planningRef: DocumentReference,
    isOwner: boolean = false,
    t: Transaction = null,
  ) {
    console.log('createPlanningSharing', { userId: user.uid, planningRef: planningRef.path })
    const sharingRef = firestoreServices.buildPlanningSharingReference(planningRef, user.uid)
    const sharing: IPlanningSharing = {
      user_display_name: user.displayName,
      user_email: user.email,
      user_id: user.uid,
      is_owner: isOwner,
    }
    if (t) {
      return t.create(sharingRef, sharing)
    } else {
      return sharingRef.set(sharing)
    }
  },

  /**
   * Add a planning reference in the sharings list of a user
   * @param user The user to add the shared planning
   * @param planningRef The planning reference
   * @param isOwner Is the user own planning
   * @param ownerName The display name of the planning owner
   * @returns A promise resolved when is written
   */
  createUserSharing(
    user: admin.auth.UserRecord,
    planningRef: DocumentReference<IPlanning>,
    isOwner: boolean,
    ownerName: string,
    t: Transaction = null,
  ) {
    console.log('createUserSharing', { userId: user.uid, planningRef: planningRef.path })
    const sharing: IUserSharing = {
      planning: planningRef,
      is_owner: isOwner,
      owner_name: ownerName,
    }
    const newSharingRef = firestoreServices.buildNewUserSharingReference(user.uid)
    if (t) {
      return t.create(newSharingRef, sharing)
    } else {
      return newSharingRef.set(sharing)
    }
  },

  /**
   * Return the sharing for a planning
   * @param planningRef PlanningRef
   * @param sharingId Id
   * @returns A promise resolved with the sharing object or null if not exists
   */
  getPlanningSharing(planningRef: DocumentReference, sharingId: string): Promise<DocumentSnapshot<IPlanningSharing>> {
    return planningRef
      .collection('sharings')
      .withConverter(planningSharingConverter)
      .doc(sharingId)
      .get()
  },
  /**
   * Return the pending-sharing for a planning
   * @param planningRef PlanningRef
   * @param sharingId Id
   * @returns A promise resolved with the sharing object or null if not exists
   */
  getPlanningPendingSharing(
    planningRef: DocumentReference,
    sharingId: string,
  ): Promise<DocumentSnapshot<IPlanningPendingSharing>> {
    return planningRef
      .collection('pending_sharings')
      .withConverter(planningPendingSharingConverter)
      .doc(sharingId)
      .get()
  },
  /**
   * Return all planning sharings
   * @param planningRef Planning reference
   * @returns A promise resolved with the query sharings of a planning
   */
  getPlanningSharings(planningRef: DocumentReference<IPlanning>) {
    return planningRef
      .collection('sharings')
      .withConverter(planningSharingConverter)
      .get()
  },
  getPlanning(planningRef: DocumentReference<IPlanning>): Promise<DocumentSnapshot<IPlanning>> {
    console.log('getPlanning', { ref: planningRef.path })
    return planningRef.get()
  },
  async existsPendingPlanningSharingReferences(planningRef: DocumentReference, email: string) {
    return (
      (await planningRef
        .collection('pending_sharings')
        .where('email', '==', email)
        .select()
        .get()).size > 0
    )
  },
  async findPendingPlanningSharing(planningRef: DocumentReference, email: string) {
    return planningRef
      .collection('pending_sharings')
      .where('email', '==', email)
      .get()
  },
  createPendingPlanningSharing(planningRef: DocumentReference, email: string) {
    return planningRef
      .collection('pending_sharings')
      .doc()
      .create({
        email,
        created_at: new Date(),
      })
  },
  /**
   * Return the user sharing
   * @param userRef User reference
   * @param planningRef Planning reference
   * @returns A promise resolved with the sharing object or null if not exists
   */
  getUserSharing(
    userRef: DocumentReference<IUser>,
    planningRef: DocumentReference<IPlanning>,
  ): Promise<DocumentSnapshot<IUserSharing> | null> {
    return userRef
      .collection('sharings')
      .withConverter(userSharingConverter)
      .where('planning', '==', planningRef)
      .get()
      .then((queryResult) => (queryResult.docs.length && queryResult.docs[0] ? queryResult.docs[0] : null))
  },
  /**
   * Return all user sharings
   * @param userRef User reference
   * @returns A promise resolved with the query sharings of a user
   */
  getUserSharings(userRef: DocumentReference<IUser>) {
    return userRef
      .collection('sharings')
      .withConverter(userSharingConverter)
      .get()
  },
  /**
   * Return the user document
   * @param uid User identifier
   * @returns A promise resolved with the user object or null if not exists
   */
  getUser(uid: string): Promise<DocumentSnapshot<IUser>> {
    console.log('getUser', uid)
    return admin
      .firestore()
      .collection('users')
      .withConverter(userConverter)
      .doc(uid)
      .get()
  },

  /**
   * Delete a user and all of his sharings
   * @param userId User identifier
   */
  async deleteUser(userId: string) {
    // TODO use a transaction
    const database = admin.firestore()
    await database
      .collection(`users/${userId}/sharings`)
      .withConverter(userSharingConverter)
      .listDocuments()
      .then(async (documents) => {
        console.log('delete user sharings', `users/${userId}/sharings`)
        await Promise.all(
          documents.map(async (userSharingRef) => {
            const userSharing = await userSharingRef.get()
            if (userSharing.exists) {
              const sharedPlanningRef = userSharing.data().planning
              await firestoreServices.deletePlanningSharing(sharedPlanningRef, userId)
            }
          }),
        )
        await Promise.all(documents.map((doc) => doc.delete()))
      })
      .catch((error) => {
        console.error('error occurs when delete user sharings', `users/${userId}/sharings`, error)
      })
      .then(() => {
        console.log('delete user', database.collection('users').doc(`${userId}`).path)
        return database
          .collection('users')
          .doc(`${userId}`)
          .delete()
      })
      .catch((error) => {
        console.error('error occurs when delete user', database.collection('users').doc(`${userId}`).path, error)
      })
  },
  async deletePlanningPendingSharing(planningRef: DocumentReference, sharingId: string, t: Transaction = null) {
    console.log('delete planning pending-sharing', planningRef.path, sharingId)
    const sharingRef = firestoreServices.buildPlanningPendingSharingReference(planningRef, sharingId)
    try {
      const pendingSharing = await firestoreServices.getPlanningPendingSharing(planningRef, sharingId)
      if (pendingSharing.exists) {
        const invitationRef = pendingSharing.data().invitation
        if (t) {
          await t.delete(pendingSharing.ref)
        } else {
          await pendingSharing.ref.delete()
        }
        if (invitationRef) await invitationRef.delete()
      }
    } catch (error) {
      console.log('error occurs when delete planning pending-sharing', sharingRef.path, error)
      throw error
    }
  },
  /**
   * Delete all planning sharings of a planning and then delete users sharings references
   * @param ownPlanningRef
   */
  async deletePlanningSharings(ownPlanningRef: DocumentReference<IPlanning>) {
    // TODO use a transaction
    // TODO Rewrite . Scenario. share a planning with user2, delete planning. what's for user2 ?
    const sharings = await ownPlanningRef
      .collection('sharings')
      .withConverter(planningSharingConverter)
      .listDocuments()
    await Promise.all(
      sharings.map(async (planningSharingRef) => {
        await firestoreServices.deletePlanningSharing(ownPlanningRef, planningSharingRef.id)
      }),
    )
  },

  async deletePlanningSharing(planningRef: DocumentReference<IPlanning>, sharingId: string, t: Transaction = null) {
    console.log(`delete users/${sharingId}/sharings where planning == ${planningRef.path}`)
    const planningSharingRef = firestoreServices.buildPlanningSharingReference(planningRef, sharingId)
    const userRef = firestoreServices.buildUserReference(sharingId)
    try {
      const userSharing = await firestoreServices.getUserSharing(userRef, planningRef)
      if (userSharing && userSharing.exists) {
        console.log('delete user sharing', userSharing.ref.path)
        if (t) {
          t.delete(userSharing.ref)
        } else {
          await userSharing.ref.delete()
        }
      }
      console.log('delete planning sharing', planningSharingRef.path)
      if (t) {
        t.delete(planningSharingRef)
      } else {
        await planningSharingRef.delete()
      }
      await resetUserPrimaryPlanningWithOwnPlanning(userRef, planningRef)
    } catch (error) {
      console.log('error occurs when delete planning sharing', planningSharingRef.path, error)
      throw error
    }
  },

  // async deletePlanningSharing(planningRef: DocumentReference, sharingId: string, t: Transaction = null) {
  //   console.log('delete planning sharing', planningRef.path, sharingId)
  //   const sharingRef = firestoreServices.buildPlanningSharingReference(planningRef, sharingId)
  //   try {
  //     if (t) {
  //       await t.delete(sharingRef)
  //     } else {
  //       await sharingRef.delete()
  //     }
  //   } catch (error) {
  //     console.log('error occurs when delete planning sharing', sharingRef.path, error)
  //     throw error
  //   }
  // },

  async deleteUserSharing(
    userRef: DocumentReference<IUser>,
    planningRef: DocumentReference<IPlanning>,
    t: Transaction = null,
  ) {
    console.log('delete user sharing', userRef.path, planningRef.path)
    const userSharing = await firestoreServices.getUserSharing(userRef, planningRef)
    if (userSharing !== null) {
      console.log('delete user sharing', userSharing.ref.path)
      try {
        if (t) await t.delete(userSharing.ref)
        else await userSharing.ref.delete()
      } catch (error) {
        console.log('error occurs when delete user sharing', userSharing.ref.path, error)
        throw error
      }
    }
  },

  /**
   * Delete a planning
   * - delete all planning sharing
   * - delete all pending sharing (that will remove all pending invitations for this planning)
   * - delete all planning days
   */
  async deletePlanning(planningRef: DocumentReference<IPlanning>) {
    // TODO add transaction
    console.log('delete planning', planningRef.path)
    try {
      await Promise.all([
        firestoreServices.deletePlanningSharings(planningRef),
        firestoreServices.deletePlanningPendingSharings(planningRef),
        firestoreServices.deletePlanningDays(planningRef),
      ])
      await planningRef.delete()
    } catch (error) {
      console.error('error occurs when delete planning', planningRef.path, error)
      throw error
    }
  },

  async deletePlanningDays(planningRef: DocumentReference) {
    const days = await planningRef.collection('days').listDocuments()
    return firestoreServices.removeEntries(days)
  },
  /**
   * Delete all planning pending sharing and delete associed pending invitation
   * @param planningRef
   */
  async deletePlanningPendingSharings(planningRef: DocumentReference) {
    const pendingSharings = await planningRef
      .collection('pending_sharings')
      .withConverter(planningPendingSharingConverter)
      .listDocuments()
    return Promise.all(
      pendingSharings.map((doc) => firestoreServices.deletePlanningPendingSharing(planningRef, doc.id)),
    )
  },

  /**
   * Return all pending invitations for a user email
   * @param guestEmail Email to find
   * @returns A promise resolved with the pending invitations query
   */
  async findPendingInvitations(guestEmail: string) {
    return admin
      .firestore()
      .collection('pending-invitations')
      .withConverter(pendingInvitationConverter)
      .where('guest_email', '==', removeDotsInEmail(guestEmail))
      .get()
  },

  async setPrimaryPlanning(userId: string, planningRef: DocumentReference<IPlanning>) {
    console.log('setPrimaryPlanning', { userId, planningRef: planningRef.path })
    const user = await firestoreServices.getUser(userId)
    return user.ref.update({ primary_planning: planningRef })
  },

  async deletePendingInvitation(ref: DocumentReference<IPendingInvitation>) {
    return ref.delete()
  },
  // TODO Add types
  async deletePendingPlanningSharings(references: DocumentReference[]) {
    return Promise.all(references.map(async (ref) => await ref.delete()))
  },

  buildUserReference(uid: string): DocumentReference<IUser> {
    return admin
      .firestore()
      .collection('users')
      .withConverter(userConverter)
      .doc(uid)
  },

  buildPlanningReference(planningId: string): DocumentReference<IPlanning> {
    return admin
      .firestore()
      .collection('plannings')
      .withConverter(planningConverter)
      .doc(planningId)
  },
  buildNewPlanningReference(): DocumentReference<IPlanning> {
    return admin
      .firestore()
      .collection('plannings')
      .withConverter(planningConverter)
      .doc()
  },
  /**
   * The planning sharing id is the user unique identifier
   * @param planningRef Planning reference
   * @param sharingId Sharing identifier
   */
  buildPlanningSharingReference(
    planningRef: DocumentReference,
    sharingId: string,
  ): DocumentReference<IPlanningSharing> {
    return planningRef
      .collection('sharings')
      .withConverter(planningSharingConverter)
      .doc(sharingId)
  },
  /**
   * The planning pending-sharing id is the user unique identifier
   * @param planningRef Planning reference
   * @param sharingId Sharing identifier
   */
  buildPlanningPendingSharingReference(
    planningRef: DocumentReference,
    sharingId: string,
  ): DocumentReference<IPlanningPendingSharing> {
    return planningRef
      .collection('pending_sharings')
      .withConverter(planningPendingSharingConverter)
      .doc(sharingId)
  },
  buildNewPendingInvitationReference(): DocumentReference<IPendingInvitation> {
    return admin
      .firestore()
      .collection('pending-invitations')
      .withConverter(pendingInvitationConverter)
      .doc()
  },
  buildNewUserSharingReference(userId: string) {
    return admin
      .firestore()
      .collection(`users/${userId}/sharings/`)
      .withConverter(userSharingConverter)
      .doc()
  },
  /**
   *
   * @param entries Remove all entries with batch
   */
  async removeEntries(entries: DocumentReference[]): Promise<WriteResult[][]> {
    async function removeEntriesChunk(
      db: FirebaseFirestore.Firestore,
      entriesChunk: DocumentReference[],
    ): Promise<WriteResult[]> {
      if (entriesChunk.length >= 500) {
        throw new Error('batch cannot accept more 500 operations')
      }
      const batch = db.batch()
      entriesChunk.forEach((entry) => {
        batch.delete(entry)
      })
      return batch.commit()
    }

    const database = admin.firestore()
    const entriesChunks = _.chunk(entries, 400)
    const batchPromises = entriesChunks.map((entriesChunk) => removeEntriesChunk(database, entriesChunk))
    return Promise.all(batchPromises)
  },
}

/**
 *
 * @param userRef If the primary planning for the user is the planning specified in parameter, reset the primary planning to the own planning
 * @param oldPlanningRef Planning to remove for the user
 */
async function resetUserPrimaryPlanningWithOwnPlanning(
  userRef: DocumentReference<IUser>,
  oldPlanningRef: DocumentReference<IPlanning>,
) {
  const user = await firestoreServices.getUser(userRef.id)
  // `getUser()` always resolves to a DocumentSnapshot, even when the doc
  // doesn't exist (e.g. this user was already deleted) - `if (user)` was
  // always true, so `user.data()` being undefined crashed here instead of
  // just skipping the reset.
  if (user.exists) {
    const userData = user.data()
    if (userData.primary_planning.id === oldPlanningRef.id) {
      await user.ref.update({ primary_planning: userData.own_planning })
    }
  }
}
