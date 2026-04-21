import firebase from 'firebase/compat/app'
import { database } from '../firebaseService'
import {
  SharedPlanning,
  SharedPlanningBuilder,
} from './planning.type'
import type {
  IFirestorePlanning,
  IFirestoreUserSharing,
} from './planning.type'
import { genericConverter } from '../api'

const sharingConverter = genericConverter<IFirestoreUserSharing>()

export class PlanningService {
  public watchPrimaryPlanningRef(
    userId: string,
    onUserChanged: (
      planningRef: firebase.firestore.DocumentReference | undefined
    ) => void,
    onError: (error: Error) => void
  ) {
    return database
      .collection('users')
      .doc(userId)
      .onSnapshot((snapshot: firebase.firestore.DocumentSnapshot) => {
        if (snapshot.exists) {
          const user = snapshot.data()
          if (user) {
            onUserChanged(user.primary_planning)
          }
        } else {
          onUserChanged(undefined)
        }
      }, onError)
  }

  /**
   * Initialize a new user profile and their first planning.
   * This is traditionally handled by a Cloud Function, but providing a frontend fallback
   * ensures the app is usable if functions are not running or delayed.
   */
  public async initializeUser(authUser: firebase.User): Promise<void> {
    const userId = authUser.uid
    const userRef = database.collection('users').doc(userId)
    const planningRef = database.collection('plannings').doc()

    const batch = database.batch()

    // 1. Create the planning document
    batch.set(planningRef, {
      owner: userId,
      created_date: new Date(),
    })

    // 2. Create the user document
    batch.set(userRef, {
      created_date: new Date(),
      primary_planning: planningRef,
      own_planning: planningRef,
    })

    // 3. Create planning sharing (the user is the owner of this planning)
    const planningSharingRef = planningRef.collection('sharings').doc(userId)
    batch.set(planningSharingRef, {
      user_display_name: authUser.displayName || 'Me',
      user_email: authUser.email,
      user_id: userId,
      is_owner: true,
    })

    // 4. Create user sharing (this planning is shared with the user)
    const userSharingRef = userRef.collection('sharings').doc()
    batch.set(userSharingRef, {
      planning: planningRef,
      is_owner: true,
      owner_name: authUser.displayName || 'Me',
    })

    return batch.commit()
  }

  public async getPrimaryPlanningRef(
    userId: string
  ): Promise<
    firebase.firestore.DocumentReference<IFirestorePlanning> | undefined
  > {
    return database
      .collection('users')
      .doc(userId)
      .get()
      .then((user) => {
        if (user.exists) {
          return user.data()!.primary_planning
        } else {
          return undefined
        }
      })
  }

  public getMyPlannings(userId: string) {
    return database
      .collection(`users/${userId}/sharings`)
      .withConverter(sharingConverter)
      .get()
      .then((querySnapshot) => {
        const result: SharedPlanning[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          result.push(SharedPlanningBuilder.build(doc.id, data))
        })
        return result
      })
  }
}
