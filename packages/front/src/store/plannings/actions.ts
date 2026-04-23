import {
  FETCH_PLANNINGS,
  FETCH_PLANNINGS_SUCCEEDED,
  FETCH_PLANNINGS_FAILED,
  SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED,
  SYNCHRONIZE_PENDING_REQUESTS_FAILED,
  SYNCHRONIZE_PENDING_REQUESTS,
  CANCEL_PENDING_REQUESTS,
  SET_PRIMARY_PLANNING,
} from './mutations'
import { Api } from '@/api/api'
import type firebase from 'firebase/compat/app'
import {
  IFirestorePlanning,
  SharedPlanning,
} from '@/api/plannings/planning.type'
import { IActionWithoutPayload, IAction } from '../types'
import { IState } from './types'

// TODO use planning id in cache instead of get from FS
async function getPrimaryPlanningRef(
  rootGetters: any
): Promise<firebase.firestore.DocumentReference<IFirestorePlanning>> {
  const userPrimaryPlanningRef =
    await Api.getInstance().planningService.getPrimaryPlanningRef(
      rootGetters['auth/uid']
    )
  if (userPrimaryPlanningRef === undefined) {
    throw new Error('unknown primary planning')
  }
  return userPrimaryPlanningRef
}

const fetchMyPlannings: IActionWithoutPayload<IState> = async ({
  commit,
  rootGetters,
}) => {
  commit(FETCH_PLANNINGS)
  try {
    const planningService = Api.getInstance().planningService
    const userPrimaryPlanningRef =
      (await getPrimaryPlanningRef(rootGetters)) || {}
    const plannings = await planningService.getMyPlannings(
      rootGetters['auth/uid']
    )

    commit(FETCH_PLANNINGS_SUCCEEDED, {
      plannings,
      primaryPlanningId: userPrimaryPlanningRef.id,
    })
  } catch (error) {
    commit(FETCH_PLANNINGS_FAILED, error)
  }
}

const setAsPrimary: IAction<IState, SharedPlanning> = (
  { commit },
  planning
) => {
  commit(SET_PRIMARY_PLANNING, planning.planningId)
}

const synchronizePendingRequests: IActionWithoutPayload<IState> = async ({
  state,
  commit,
  rootGetters,
  dispatch,
}) => {
  commit(SYNCHRONIZE_PENDING_REQUESTS)
  try {
    Api.getInstance().userService.setPrimaryPlanning(
      rootGetters['auth/uid'],
      state.pendingState.newPrimaryPlanningId
    )
    commit(SYNCHRONIZE_PENDING_REQUESTS_SUCCEEDED)
    dispatch('fetchMyPlannings')
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
  fetchMyPlannings,
  synchronizePendingRequests,
  cancelPendingRequests,
  setAsPrimary,
}
