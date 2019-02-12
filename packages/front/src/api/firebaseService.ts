import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

import config from '../../config'

const app = firebase.initializeApp(config)

const database = app.firestore()

const settings = {
}
database.settings(settings)

// todo : call this before any request
database
  .enablePersistence({ experimentalTabSynchronization: true })
  .catch((err: any) => {
    console.error(err)
  })

const auth = app.auth()

export { database, auth }
