export class Sharing {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly userEmail: string,
    readonly userDisplayName: string,
    readonly isOwner: boolean
  ) {}

  toString(): string {
    return this.id
  }
}
export class PendingSharing {
  constructor(
    readonly id: string,
    readonly userEmail: string
  ) {}

  toString(): string {
    return this.id
  }
}

export class SharingBuilder {
  /**
   * Build a sharing from firestore object
   */
  public static build(
    id: string,
    firestoreSharing: IFirestoreSharing
  ): Sharing {
    return new Sharing(
      id,
      firestoreSharing.user_id,
      firestoreSharing.user_email,
      firestoreSharing.user_display_name,
      firestoreSharing.is_owner
    )
  }
}

export class PendingSharingBuilder {
  /**
   * Build a pending sharing from firestore object
   */
  public static build(
    id: string,
    firestoreSharing: IFirestorePendingSharing
  ): PendingSharing {
    return new PendingSharing(id, firestoreSharing.email)
  }
}

export interface IFirestoreSharing {
  user_id: string
  user_email: string
  user_display_name: string
  is_owner: boolean
}

export interface IFirestorePendingSharing {
  email: string
}
