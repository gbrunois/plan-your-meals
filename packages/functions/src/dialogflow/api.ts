import * as admin from 'firebase-admin'

import { UserRecord } from 'firebase-functions/lib/providers/auth'
import { DayMenu } from '../entities/day-menu'
import { DayMenuService } from './day-menu.service'

import { Utils } from './utils/date-utils'
import { MealPeriod } from '../entities/meal-periods'

export class Api {
  auth: admin.auth.Auth
  db: FirebaseFirestore.Firestore

  init(): void {
    admin.initializeApp()
    this.auth = admin.auth()
    this.db = admin.firestore()

    const settings = { timestampsInSnapshots: true }
    this.db.settings(settings)
  }

  private static _instance: Api

  public static getInstance() {
    if (!Api._instance) {
      Api._instance = new Api()
    }
    return Api._instance
  }

  public async getPrimaryPlanningRef(userId: string): Promise<FirebaseFirestore.DocumentReference | undefined> {
    return this.db
      .collection('users')
      .doc(userId)
      .get()
      .then((document) => {
        if (document.exists) {
          return document.data()
        } else {
          return undefined
        }
      })
      .then((data) => {
        return (data && data.primary_planning) || undefined
      })
  }

  public async getDay(planningRef: FirebaseFirestore.DocumentReference, menuDate: Date): Promise<DayMenu | undefined> {
    const aDate = Utils.toLocaleStringDateFormat(menuDate)
    return await planningRef
      .collection('days')
      .where('date', '==', aDate)
      .get()
      .then((querySnapshot) => {
        const result: DayMenu[] = []
        querySnapshot.forEach((doc) => {
          const { date, dinner, lunch } = doc.data()
          const id = doc.id
          result.push(
            DayMenuService.toDayMenu({
              id,
              date,
              dinner,
              lunch,
            }),
          )
        })
        return result
      })
      .then((days) => days[0])
  }

  public createUser(email: string): Promise<UserRecord> {
    return this.auth.createUser({ email })
  }

  public getUserByEmail(email: string): Promise<UserRecord> {
    return this.auth.getUserByEmail(email)
  }

  public async createOrUpdateMenu(planningId: string, menuDate: Date, mealPeriod: MealPeriod, mealDescription: string) {
    console.log('createOrUpdateMenu', planningId, menuDate, mealPeriod, mealDescription)

    const dayRef = this.db
      .collection('plannings')
      .doc(planningId)
      .collection('days')
      .doc(Utils.toLocaleStringDateFormat(menuDate))
    const document = await dayRef.get()

    if (document.exists) {
      const day = {}
      day[mealPeriod] = mealDescription
      return dayRef.update(day)
    } else {
      const day = {
        date: Utils.toLocaleStringDateFormat(menuDate),
        lunch: '',
        dinner: '',
        created: new Date(),
      }
      day[mealPeriod] = mealDescription
      return dayRef.set(day)
    }
  }
}
