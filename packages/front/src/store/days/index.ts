import { Api } from '@/api/api'
import { DayMenu } from '@/api/days/day-menu'
import { MealPeriod } from '@/api/days/meal-period.type'
import { MenuDate } from '@/api/days/menu-date'
import { daysService } from '@/services/days.service'
import { Commit, Dispatch } from 'vuex'
import { IState } from './types'

const initialState: IState = {
  beginDate: daysService.getNow(),
  endDate: daysService.getNow(),
  isLoading: false,
  watchingDays: [],
  openedDay: null,
  status: 'OK',
}
const mutations = {
  saving(state: IState) {
    state.status = 'Saving...'
  },
  savedSuccess(state: IState) {
    state.status = 'OK'
  },
  savedFailed(state: IState) {
    state.status = 'Failed'
  },
  update(
    state: IState,
    arg: { meal: MealPeriod; date: MenuDate; value: string }
  ) {
    const day = state.openedDay
    if (day) {
      Reflect.set(day, arg.meal, arg.value)
    }
  },
  fetchDays(
    state: IState,
    { beginDate, endDate }: { beginDate: MenuDate; endDate: MenuDate }
  ) {
    state.isLoading = true
    if (state.unsubscribe) {
      state.unsubscribe()
    }
    state.beginDate = beginDate
    state.endDate = endDate
  },
  fetchDaysSuccess(
    state: IState,
    {
      beginDate,
      endDate,
      days,
    }: { beginDate: MenuDate; endDate: MenuDate; days: DayMenu[] }
  ) {
    state.isLoading = false
    // todo refacto on reçoit de la data, on met à jour les objets en local ?
    state.watchingDays = daysService.createDays(days, beginDate, endDate)
  },
  fetchDaysFail(state: IState, { error }: any) {
    state.isLoading = false
    state.error = error.message
  },
  openDay(state: IState, { day }: { day: DayMenu }) {
    state.openedDay = day
  },
  closeDay(state: IState) {
    state.openedDay = null
  },
}
const actions = {
  async loadPeriod(
    { rootGetters, state, commit }: any,
    { beginDate, endDate }: { beginDate: MenuDate; endDate: MenuDate }
  ) {
    commit('fetchDays', { beginDate, endDate })
    return new Promise<DayMenu[]>((resolve, reject) => {
      try {
        const unsubscribe =
          Api.getInstance().planningService.watchPrimaryPlanningRef(
            rootGetters['auth/uid'],
            async (
              planningRef: firebase.firestore.DocumentReference | undefined
            ) => {
              if (planningRef === undefined) {
                console.info('Profile not found, initializing...')
                const authUser = rootGetters['auth/user']
                if (authUser) {
                  try {
                    await Api.getInstance().planningService.initializeUser(
                      authUser
                    )
                    // The onSnapshot listener will trigger again once the doc is created
                  } catch (error) {
                    console.error('Failed to initialize user profile:', error)
                    commit('fetchDaysFail', { error })
                    reject(error)
                  }
                } else {
                  console.error('User is not authenticated')
                  const error = new Error('User is not authenticated')
                  commit('fetchDaysFail', { error })
                  reject(error)
                }
              } else {
                if (state.unsubscribe) {
                  state.unsubscribe()
                }
                state.planningRef = planningRef
                state.unsubscribe = Api.getInstance().dayService.watchPeriod(
                  planningRef,
                  beginDate,
                  endDate,
                  (days) => {
                    resolve(days)
                    commit('fetchDaysSuccess', { beginDate, endDate, days })
                  },
                  (error: Error) => {
                    commit('fetchDaysFail', { error })
                    reject(error)
                  }
                )
              }
            },
            (error: Error) => {
              commit('fetchDaysFail', { error })
              reject(error)
            }
          )
      } catch (error) {
        commit('fetchDaysFail', { error })
        reject(error)
      }
    })
  },
  update({ state, commit }: any, arg: any) {
    if (state.openedDay) {
      commit('saving')
      const x = {
        date: state.openedDay.date,
        dinner: state.openedDay.dinner,
        lunch: state.openedDay.lunch,
      }
      Api.getInstance()
        .dayService.updateDay(state.planningRef, x)
        .then(() => {
          commit('savedSuccess')
        })
        .catch(() => {
          commit('savedFailed')
        })
      commit('update', arg)
    }
  },
  async openDay(
    {
      state,
      commit,
      dispatch,
    }: { state: IState; commit: Commit; dispatch: Dispatch },
    date: MenuDate
  ) {
    let existingDay =
      state.watchingDays.find(
        (day) => day.date.toString() === date.toString()
      ) || null
    if (existingDay) {
      commit('openDay', { day: existingDay })
    } else {
      await dispatch('loadPeriod', {
        beginDate: daysService.getFirstDayOfWeek(date),
        endDate: daysService.getLastDayOfWeek(date),
      })
      existingDay =
        state.watchingDays.find(
          (day) => day.date.toString() === date.toString()
        ) || null
      commit('openDay', { day: existingDay })
    }
  },
  closeDay({ commit }: any) {
    commit('closeDay')
  },
  unsubscribe({ state }: any) {
    if (state.unsubscribe) {
      state.unsubscribe()
    }
  },
}
const getters = {
  watchingDays: (state: IState) => {
    return state.watchingDays
  },
  beginDate: (state: IState) => {
    return state.beginDate
  },
  isLoading: (state: IState) => {
    return state.isLoading
  },
  openedDay: (state: IState) => {
    return state.openedDay
  },
  status: (state: IState) => {
    return state.status
  },
  currentPeriod: (state: IState) => {
    return `${state.beginDate.toShortFormat()} - ${state.endDate.toShortFormat()}`
  },
}

export default {
  state: initialState,
  mutations,
  actions,
  getters,
}
