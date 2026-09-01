import firebase from 'firebase/compat/app'

export class SharedPlanning {
  constructor(
    readonly id: string,
    readonly planningId: string,
    readonly ownerName: string,
    readonly isOwner: boolean
  ) {}

  public primary: boolean = false

  toString(): string {
    return this.id
  }
}

export class SharedPlanningBuilder {
  /**
   * Build a planning from firestore object
   */
  public static build(
    id: string,
    firestorePlanning: IFirestoreUserSharing
  ): SharedPlanning {
    return new SharedPlanning(
      id,
      firestorePlanning.planning.id,
      firestorePlanning.owner_name,
      firestorePlanning.is_owner
    )
  }
}

export interface IFirestorePlanning {
  id: string
}

export interface IFirestoreUserSharing {
  owner_name: string
  is_owner: boolean
  planning: firebase.firestore.DocumentReference<IFirestorePlanning>
}
