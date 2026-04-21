import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'

import config from '../../config'

const app = firebase.initializeApp(config)

const database = app.firestore()

const auth = app.auth()

export { database, auth }
