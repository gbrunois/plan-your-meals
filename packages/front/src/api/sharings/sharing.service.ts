import firebase from 'firebase/compat/app'
import { database } from '../firebaseService'
import {
  Sharing,
  SharingBuilder,
  PendingSharingBuilder,
  PendingSharing,
} from '../sharings/sharing.type'
import type {
  IFirestoreSharing,
  IFirestorePendingSharing,
} from '../sharings/sharing.type'
import axios from 'axios'
import { auth } from '../firebaseService'
import type { IFirestorePlanning } from '../plannings/planning.type'
import { genericConverter } from '../api'
import config from '../../../config'

const sharingConverter = genericConverter<IFirestoreSharing>()
const pendingSharingConverter = genericConverter<IFirestorePendingSharing>()

const apiUrl = config.cloudFunctionsUrl

// TODO Move it to another file
type HttpMethod = 'put' | 'post' | 'delete'
async function requestApi<T>(method: HttpMethod, endPoint: string, data?: any) {
  const url = `${apiUrl}/${endPoint}`
  const user = auth.currentUser
  if (!user) {
    throw new Error(`Current user is not defined / requestApi / ${url}`)
  }
  let idToken
  try {
    idToken = await user.getIdToken()
  } catch (error) {
    console.error('Error caught getIdToken', error.message)
    throw error
  }
  const response = await axios.request<T>({
    url,
    method,
    data,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  })
  return response.data
}

export class SharingService {
  public async addNewSharing(planningId: string, email: string) {
    return requestApi('post', `api/plannings/${planningId}/sharings`, { email })
  }

  public async removeSharing(planningId: string, sharingId: string) {
    return requestApi(
      'delete',
      `api/plannings/${planningId}/sharings/${sharingId}`
    )
  }

  public async removePendingSharing(planningId: string, sharingId: string) {
    return requestApi(
      'delete',
      `api/plannings/${planningId}/pending-sharings/${sharingId}`
    )
  }

  //TODO use planningId
  public getSharings(
    planningRef: firebase.firestore.DocumentReference<IFirestorePlanning>
  ): Promise<Sharing[]> {
    return planningRef
      .collection('sharings')
      .withConverter(sharingConverter)
      .get()
      .then((querySnapshot) => {
        const result: Sharing[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          result.push(SharingBuilder.build(doc.id, data))
        })
        return result
      })
  }

  //TODO use planningId
  public getPendingSharings(
    planningRef: firebase.firestore.DocumentReference<IFirestorePlanning>
  ): Promise<PendingSharing[]> {
    return planningRef
      .collection('pending_sharings')
      .withConverter(pendingSharingConverter)
      .get()
      .then((querySnapshot) => {
        const result: PendingSharing[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          result.push(PendingSharingBuilder.build(doc.id, data))
        })
        return result
      })
  }
}
