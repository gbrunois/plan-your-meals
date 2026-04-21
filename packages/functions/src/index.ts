import * as functions from 'firebase-functions'
import api from './api/app'
import * as _ from 'lodash'
import { onAuthUserCreated, onAuthUserDeleted } from './profile'

const region = 'europe-west1'

// Triggered when a new user is registered
exports.createProfile = functions
  .region(region)
  .auth.user()
  .onCreate(onAuthUserCreated)

// Triggered when a user is deleted
exports.deleteProfile = functions
  .region(region)
  .auth.user()
  .onDelete(onAuthUserDeleted)

// Back API
exports.api = functions.region(region).https.onRequest(api)

//TODO check data constitency when user connect
