import { Sharing, PendingSharing } from '@/api/sharings/sharing.type'

function clearArray<T>(array: T[]) {
  array.splice(0, array.length)
}

export class PendingState {
  clear() {
    clearArray(this.newSharings)
    clearArray(this.pendingSharingToRemove)
    clearArray(this.sharingsToRemove)
  }
  hasPendingRequests() {
    return (
      this.newSharings.length > 0 ||
      this.pendingSharingToRemove.length > 0 ||
      this.sharingsToRemove.length > 0
    )
  }
  /**
   * List of email to add
   */
  public readonly newSharings: string[] = []
  /**
   * List of sharing id to remove
   */
  public readonly sharingsToRemove: Sharing[] = []
  /**
   * List of emails of pending sharings to remove
   */
  public readonly pendingSharingToRemove: PendingSharing[] = []
}

export interface IState {
  lastSynchronizingPendingRequestsError: Error | null
  isSynchronizingPendingRequests: boolean
  fetchedSharings: IFetchSharingsResult | null
  lastFetchError: Error | null
  isFetchingSharings: boolean
  sharings: Sharing[]
  pendingSharings: PendingSharing[]
  pendingState: PendingState
}

export interface IFetchSharingsResult {
  sharings: Sharing[]
  pendingSharings: PendingSharing[]
}
