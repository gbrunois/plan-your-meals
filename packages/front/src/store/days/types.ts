import type firebase from 'firebase/compat/app'
import { DayMenu } from '@/api/days/day-menu'
import { MenuDate } from '@/api/days/menu-date'

export interface IState {
  beginDate: MenuDate
  endDate: MenuDate
  isLoading: boolean
  watchingDays: DayMenu[]
  openedDay: DayMenu | null
  status: string
  error?: string
  unsubscribe?: () => void
  planningRef?: firebase.firestore.DocumentReference
}
