import { IMutationWithoutPayload, IMutation, IAction } from '../types'
import { IState, IFetchSharingsResult as IFetchedSharingsResult } from './types'
import { PendingSharing, Sharing } from '@/api/sharings/sharing.type'

const fetchSharings: IMutationWithoutPayload<IState> = (state) => {
  state.pendingState.clear()
  state.isFetchingSharings = true
  state.lastFetchError = null
}

const fetchSharingsSucceeded: IMutation<IState, IFetchedSharingsResult> = (
  state,
  fetchedResult
) => {
  state.isFetchingSharings = false
  state.fetchedSharings = fetchedResult
  state.sharings = [...fetchedResult.sharings]
  state.pendingSharings = [...fetchedResult.pendingSharings]
}

const fetchSharingsFailed: IMutation<IState, Error> = (state, error) => {
  state.isFetchingSharings = false
  state.lastFetchError = error
}

const synchronizePendingRequests: IMutationWithoutPayload<IState> = (state) => {
  state.isSynchronizingPendingRequests = true
  state.lastSynchronizingPendingRequestsError = null
  state.pendingState.clear()
}

const synchronizePendingRequestsSucceeded: IMutationWithoutPayload<IState> = (
  state
) => {
  state.isSynchronizingPendingRequests = false
}

const synchronizePendingRequestsFailed: IMutation<IState, Error> = (
  state,
  error
) => {
  state.isSynchronizingPendingRequests = false
  state.lastSynchronizingPendingRequestsError = error
}

const addNewSharing: IMutation<IState, string> = async (state, email) => {
  // already exists
  if (
    state.pendingState.newSharings.indexOf(email) !== -1 ||
    state.sharings.find((s) => s.userEmail === email) !== undefined ||
    state.pendingSharings.find((s) => s.userEmail === email) !== undefined
  ) {
    return
  }
  // sharing have been deleted
  const foundInSharingsToRemove = state.pendingState.sharingsToRemove.findIndex(
    (x) => x.userEmail === email
  )
  if (foundInSharingsToRemove !== -1) {
    const [deleted] = state.pendingState.sharingsToRemove.splice(
      foundInSharingsToRemove,
      1
    )
    state.sharings.push(deleted)
    return
  }
  // pending sharing have been deleted
  const foundInPendingSharingsToRemove =
    state.pendingState.pendingSharingToRemove.findIndex(
      (x) => x.userEmail === email
    )
  if (foundInPendingSharingsToRemove !== -1) {
    const [deleted] = state.pendingState.pendingSharingToRemove.splice(
      foundInPendingSharingsToRemove,
      1
    )
    state.pendingSharings.push(deleted)
    return
  }

  state.pendingState.newSharings.push(email)
  state.pendingSharings.push(new PendingSharing('', email))
}

const removeSharing: IMutation<IState, Sharing> = async (state, sharing) => {
  // already deleted
  if (
    state.pendingState.pendingSharingToRemove.find(
      (s) => s.userEmail === sharing.userEmail
    ) !== undefined
  ) {
    return
  }

  state.pendingState.sharingsToRemove.push(sharing)

  const indexOfItem = state.sharings.findIndex((p) => p.id === sharing.id)
  if (indexOfItem !== -1) {
    state.sharings.splice(indexOfItem, 1)
  }
}

const removePendingSharing: IMutation<IState, PendingSharing> = async (
  state,
  sharing
) => {
  // already deleted
  if (
    state.pendingState.pendingSharingToRemove.find(
      (s) => s.userEmail === sharing.userEmail
    ) !== undefined
  ) {
    return
  }
  // its a new sharing
  const indexInNewSharings = state.pendingState.newSharings.indexOf(
    sharing.userEmail
  )
  if (indexInNewSharings !== -1) {
    state.pendingState.newSharings.splice(indexInNewSharings, 1)
  } else {
    state.pendingState.pendingSharingToRemove.push(sharing)
  }

  const indexOfItem = state.pendingSharings.findIndex(
    (p) => p.id === sharing.id
  )
  if (indexOfItem !== -1) {
    state.pendingSharings.splice(indexOfItem, 1)
  }
}

const cancelPendingRequests: IMutationWithoutPayload<IState> = (state) => {
  state.pendingState.clear()
  if (state.fetchedSharings) {
    state.sharings = state.fetchedSharings.sharings
    state.pendingSharings = state.fetchedSharings.pendingSharings
  }
}

export const FETCH_SHARINGS = 'FETCH_SHARINGS'
export const FETCH_SHARINGS_SUCCEEDED = 'FETCH_SHARING_SUCCEEDED'
export const FETCH_SHARINGS_FAILED = 'FETCH_SHARINGS_FAILED'
export const SYNCHRONIZE_PENDING_REQUESTS = 'SYNCHRONIZE_PENDING_REQUESTS'
export const SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED =
  'SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED'
export const SYNCHRONIZE_PENDING_REQUESTS_FAILED =
  'SYNCHRONIZE_PENDING_REQUESTS_FAILED'
export const CANCEL_PENDING_REQUESTS = 'CANCEL_PENDING_REQUESTS'
export const ADD_NEW_SHARING = 'ADD_NEW_SHARING'
export const REMOVE_PENDING_SHARING = 'REMOVE_PENDING_SHARING'
export const REMOVE_SHARING = 'REMOVE_SHARING'

export default {
  [FETCH_SHARINGS]: fetchSharings,
  [FETCH_SHARINGS_SUCCEEDED]: fetchSharingsSucceeded,
  [FETCH_SHARINGS_FAILED]: fetchSharingsFailed,
  [SYNCHRONIZE_PENDING_REQUESTS]: synchronizePendingRequests,
  [SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED]: synchronizePendingRequestsSucceeded,
  [SYNCHRONIZE_PENDING_REQUESTS_FAILED]: synchronizePendingRequestsFailed,
  [CANCEL_PENDING_REQUESTS]: cancelPendingRequests,
  [ADD_NEW_SHARING]: addNewSharing,
  [REMOVE_PENDING_SHARING]: removePendingSharing,
  [REMOVE_SHARING]: removeSharing,
}
