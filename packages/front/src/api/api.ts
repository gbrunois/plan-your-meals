import 'firebase/compat/auth'
import 'firebase/compat/firestore'
import { DayService } from './days/day.service'
import { PlanningService } from './plannings/planning.service'
import { UserService } from './auth/user.service'
import { SharingService } from './sharings/sharing.service'
import type firebase from 'firebase/compat/app'

export class Api {
  public static getInstance() {
    if (!Api._instance) {
      Api._instance = new Api()
    }
    return Api._instance
  }

  // tslint:disable-next-line:variable-name
  private static _instance: Api
  // tslint:disable-next-line:variable-name
  private _planningService: PlanningService
  // tslint:disable-next-line:variable-name
  private _dayService: DayService
  // tslint:disable-next-line:variable-name
  private _userService: UserService
  // tslint:disable-next-line:variable-name
  private _sharingService: SharingService

  private isInitialized: boolean

  constructor() {
    this._planningService = new PlanningService()
    this._dayService = new DayService()
    this._userService = new UserService()
    this._sharingService = new SharingService()
    this.isInitialized = false
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve()
    }
    // Offline persistence (IndexedDB) was disabled: it stores DocumentReference
    // fields (e.g. IUser.primary_planning) which cannot be structured-cloned into
    // IndexedDB, causing "DataCloneError" and Firestore's
    // "INTERNAL ASSERTION FAILED: Unexpected state" crashes.
    this.isInitialized = true
    return Promise.resolve()
  }

  get planningService() {
    return this._planningService
  }

  get dayService() {
    return this._dayService
  }

  get userService() {
    return this._userService
  }

  get sharingService() {
    return this._sharingService
  }
}

export function genericConverter<
  T,
>(): firebase.firestore.FirestoreDataConverter<T> {
  return {
    toFirestore(t: T): firebase.firestore.DocumentData {
      return t as firebase.firestore.DocumentData
    },
    fromFirestore(
      snapshot: firebase.firestore.QueryDocumentSnapshot,
      options: firebase.firestore.SnapshotOptions
    ): T {
      const data = snapshot.data(options)!
      return data as T
    },
  }
}
