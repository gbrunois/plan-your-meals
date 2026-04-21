import firebase from 'firebase/compat/app'
import { DayMenu } from './day-menu'
import { DayMenuBuilder } from './day-menu.builder'
import { MenuDate } from './menu-date'
import type { IDayResponse } from './day-response.type'

export class DayService {
  public watchPeriod(
    planningRef: firebase.firestore.DocumentReference,
    beginDate: MenuDate,
    endDate: MenuDate,
    onSnapshot: (days: DayMenu[]) => void,
    onError: (error: Error) => void
  ) {
    return planningRef
      .collection('days')
      .where('date', '>=', beginDate.toString())
      .where('date', '<=', endDate.toString())
      .onSnapshot((querySnapshot: firebase.firestore.QuerySnapshot) => {
        const result: DayMenu[] = []
        querySnapshot.forEach(
          (doc: firebase.firestore.QueryDocumentSnapshot) => {
            result.push(DayMenuBuilder.fromDatabase(doc.data() as IDayResponse))
          }
        )
        onSnapshot(result)
      }, onError)
  }

  public updateDay(
    planningRef: firebase.firestore.DocumentReference,
    day: DayMenu
  ): Promise<void> {
    return planningRef.collection('days').doc(day.date.toString()).set({
      date: day.date.toString(),
      lunch: day.lunch,
      dinner: day.dinner,
      created: new Date(),
    })
  }
}
