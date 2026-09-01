import { IState, PendingState } from './types'
import mutations from './mutations'
import actions from './actions'

const state: IState = {
  sharings: [],
  pendingSharings: [],
  pendingState: new PendingState(),
  isSynchronizingPendingRequests: false,
  lastSynchronizingPendingRequestsError: null,
  fetchedSharings: null,
  lastFetchError: null,
  isFetchingSharings: false,
}

const getters = {
  sharings: (state: IState) => {
    return state.sharings
  },
  pendingSharings: (state: IState) => {
    return state.pendingSharings
  },
  hasPendingRequests: (state: IState) => {
    return state.pendingState.hasPendingRequests()
  },
  lastSynchronizingPendingRequestsError: (state: IState) => {
    return state.lastSynchronizingPendingRequestsError
  },
}

export default {
  state,
  actions,
  mutations,
  getters,
}
