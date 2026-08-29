import { Commit, Dispatch } from 'vuex'

export interface IRootState {
  currentWeekPage: string
}

export type IMutation<S, P> = (state: S, payload: P) => void
export type IMutationWithoutPayload<S> = (state: S) => void

export type IAction<S, P> = (
  {
    commit,
    dispatch,
    state,
    rootState,
    rootGetters,
  }: {
    commit: Commit
    dispatch: Dispatch
    state: S
    rootState: IRootState
    rootGetters: Record<string, unknown>
  },
  payload: P
) => void

export type IActionWithoutPayload<S> = ({
  commit,
  dispatch,
  state,
  rootGetters,
}: {
  commit: Commit
  dispatch: Dispatch
  state: S
  rootGetters: Record<string, unknown>
}) => void
