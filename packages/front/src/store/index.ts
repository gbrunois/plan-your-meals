import auth from '@/store/auth'
import days from '@/store/days'
import sharings from '@/store/sharings'
import plannings from '@/store/plannings'
import Vue from 'vue'
import Vuex from 'vuex'
import { IRootState } from './types'

const rootState: IRootState = {
  currentWeekPage: '',
}

const mutations = {
  setCurrentWeekPage(state: IRootState, pageName: string) {
    state.currentWeekPage = pageName
  },
}

const getters = {
  currentWeekPage: (state: IRootState) => {
    return state.currentWeekPage
  },
}

Vue.use(Vuex)
const store = new Vuex.Store<IRootState>({
  state: rootState,
  mutations,
  getters,
  modules: {
    days: {
      namespaced: true,
      ...days,
    },
    auth: {
      namespaced: true,
      ...auth,
    },
    sharings: {
      namespaced: true,
      ...sharings,
    },
    plannings: {
      namespaced: true,
      ...plannings,
    },
  },
})

export default store
