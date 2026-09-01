import { IState, PendingState } from './types'
import mutations from './mutations'
import actions from './actions'

const state: IState = {
  myPlannings: [],
  primaryPlanningId: '',
  pendingState: new PendingState(),
  lastFetchError: null,
  isFetchingMyPlannings: false,
  isSynchronizingPendingRequests: false,
  lastSynchronizingPendingRequestsError: null,
}

const getters = {
  myPlannings: (state: IState) => {
    return state.myPlannings
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
