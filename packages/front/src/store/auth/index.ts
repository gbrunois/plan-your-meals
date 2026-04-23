import authService from '@/api/auth/auth.service'
import type firebase from 'firebase/compat/app'
import { IState } from './types'

const inLocalStorageUid = localStorage.getItem('authUser')

export default {
  state: {
    user: null,
    uid: inLocalStorageUid === null ? null : JSON.parse(inLocalStorageUid),
    waitForAuthenticatedState: false,
  },
  mutations: {
    setUser(state: IState, authUser: firebase.User | null) {
      if (authUser) {
        localStorage.setItem('authUser', JSON.stringify(authUser.uid))
        state.uid = authUser.uid
      } else {
        localStorage.removeItem('authUser')
      }
      state.user = authUser
    },
    setWaitForAuthenticatedState(
      state: IState,
      waitForAuthenticatedState: boolean
    ) {
      state.waitForAuthenticatedState = waitForAuthenticatedState
    },
  },
  actions: {
    async signIn() {
      return authService.signInWithGoogleWithRedirect()
    },
    deleteAccount({ commit, dispatch }: any) {
      return dispatch('days/unsubscribe', undefined, { root: true }).then(() =>
        authService.deleteAccount().then(() => {
          commit('setUser', null)
        })
      )
    },
    watchUserAuthenticated({ commit }: any) {
      commit('setWaitForAuthenticatedState', true)
      authService
        .getRedirectResult()
        .then((result) => {
          if (result.user) {
            commit('setUser', result.user)
          }
        })
        .catch((error) => {
          console.error('Redirect sign-in error:', error)
        })
        .finally(() => {
          authService.onAuthStateChanged((_user: firebase.User | null) => {
            commit('setWaitForAuthenticatedState', false)
          })
        })
    },
    logout({ commit, dispatch }: any) {
      return dispatch('days/unsubscribe', undefined, { root: true }).then(() =>
        authService.signOut().then(() => {
          commit('setUser', null)
        })
      )
    },
  },
  getters: {
    user: (state: IState) => {
      return state.user
    },
    isLoggedIn: (state: IState) => {
      return state.uid !== null
    },
    uid: (state: IState): string | null => {
      return state.uid
    },
    waitForAuthenticatedState: (state: IState): boolean => {
      return state.waitForAuthenticatedState
    },
  },
}
