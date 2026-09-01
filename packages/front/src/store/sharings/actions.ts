import {
  FETCH_SHARINGS,
  FETCH_SHARINGS_SUCCEEDED,
  FETCH_SHARINGS_FAILED,
  SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED,
  SYNCHRONIZE_PENDING_REQUESTS_FAILED,
  SYNCHRONIZE_PENDING_REQUESTS,
  CANCEL_PENDING_REQUESTS,
  ADD_NEW_SHARING,
  REMOVE_SHARING,
  REMOVE_PENDING_SHARING,
} from './mutations'
import { Api } from '@/api/api'
import type firebase from 'firebase/compat/app'
import { IActionWithoutPayload, IAction } from '../types'
import { IState } from './types'
import { Sharing } from '@/api/sharings/sharing.type'
import type { IFirestorePlanning } from '@/api/plannings/planning.type'

// TODO use planning id in cache instead of get from FS
async function getPrimaryPlanningRef(
  rootGetters: Record<string, unknown>
): Promise<firebase.firestore.DocumentReference<IFirestorePlanning>> {
  const userPrimaryPlanningRef =
    await Api.getInstance().planningService.getPrimaryPlanningRef(
      rootGetters['auth/uid'] as string
    )
  if (userPrimaryPlanningRef === undefined) {
    throw new Error('unknown primary planning')
  }
  return userPrimaryPlanningRef
}

const fetchSharings: IActionWithoutPayload<IState> = async ({
  commit,
  rootGetters,
}) => {
  commit(FETCH_SHARINGS)
  try {
    const sharingsService = Api.getInstance().sharingService
    const userPrimaryPlanningRef = await getPrimaryPlanningRef(rootGetters)
    const [sharings, pendingSharings] = await Promise.all([
      sharingsService.getSharings(userPrimaryPlanningRef),
      sharingsService.getPendingSharings(userPrimaryPlanningRef),
    ])
    commit(FETCH_SHARINGS_SUCCEEDED, { sharings, pendingSharings })
  } catch (error) {
    commit(FETCH_SHARINGS_FAILED, error)
  }
}

const addNewSharing: IAction<IState, string> = async ({ commit }, email) => {
  commit(ADD_NEW_SHARING, email)
}

const removeSharing: IAction<IState, Sharing> = async ({ commit }, sharing) => {
  commit(REMOVE_SHARING, sharing)
}

const removePendingSharing: IAction<IState, Sharing> = async (
  { commit },
  sharing
) => {
  commit(REMOVE_PENDING_SHARING, sharing)
}

const synchronizePendingRequests: IActionWithoutPayload<IState> = async ({
  state,
  commit,
  rootGetters,
}) => {
  const newSharings = [...state.pendingState.newSharings]
  const sharingsToRemove = [...state.pendingState.sharingsToRemove]
  const pendingSharingToRemove = [...state.pendingState.pendingSharingToRemove]

  commit(SYNCHRONIZE_PENDING_REQUESTS)
  try {
    const sharingsService = Api.getInstance().sharingService
    const planningId = (await getPrimaryPlanningRef(rootGetters)).id

    await Promise.all(
      newSharings.map((email) => {
        sharingsService.addNewSharing(planningId, email)
      })
    )
    await Promise.all(
      await sharingsToRemove.map((sharing) => {
        sharingsService.removeSharing(planningId, sharing.id)
      })
    )
    await Promise.all(
      await pendingSharingToRemove.map((pendingSharing) => {
        sharingsService.removePendingSharing(planningId, pendingSharing.id)
      })
    )
    commit(SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED)
  } catch (error) {
    commit(SYNCHRONIZE_PENDING_REQUESTS_FAILED, error)
  }
}
const cancelPendingRequests: IActionWithoutPayload<IState> = async ({
  commit,
}) => {
  commit(CANCEL_PENDING_REQUESTS)
}

export default {
  fetchSharings,
  addNewSharing,
  removeSharing,
  removePendingSharing,
  synchronizePendingRequests,
  cancelPendingRequests,
}
