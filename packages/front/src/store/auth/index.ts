import authService from '@/api/auth/auth.service'
import type firebase from 'firebase/compat/app'
import { Commit, Dispatch } from 'vuex'
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
    // Note: user profile / planning initialization is NOT done here.
    // It's handled directly against Firestore (client SDK) in
    // store/days -> Api.planningService.initializeUser(), the first time
    // a user without a primary_planning is detected. The backend Cloud
    // Functions equivalent (initializeUser) currently can't be reached
    // (public HTTPS invocation is blocked by a GCP IAM/org policy on the
    // 2nd Gen Cloud Run services), so we don't depend on it client-side.
    // Neither signInWithPopup nor signInWithRedirect complete for this
    // project - both route through a Google-hosted /__/auth/handler page
    // that silently does nothing on return (see auth.service.ts). Signing
    // in via Google Identity Services + signInWithCredential avoids that
    // handler entirely.
    async signIn({ commit }: { commit: Commit }) {
      return authService
        .signInWithGoogle()
        .then((result: firebase.auth.UserCredential) => {
          if (result.user) {
            commit('setUser', result.user)
          }
        })
    },
    deleteAccount({
      commit,
      dispatch,
    }: {
      commit: Commit
      dispatch: Dispatch
    }) {
      return dispatch('days/unsubscribe', undefined, { root: true }).then(() =>
        authService.deleteAccount().then(() => {
          commit('setUser', null)
        })
      )
    },
    watchUserAuthenticated({ commit }: { commit: Commit }) {
      commit('setWaitForAuthenticatedState', true)
      authService.onAuthStateChanged((_user: firebase.User | null) => {
        commit('setUser', _user)
        commit('setWaitForAuthenticatedState', false)
      })
    },
    logout({ commit, dispatch }: { commit: Commit; dispatch: Dispatch }) {
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
