import * as admin from 'firebase-admin'
import api from './api/app'
import * as _ from 'lodash'
import { onAuthUserCreated } from './profile'
import { onRequest } from 'firebase-functions/v2/https'
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { config } from './services/config-service'
import { firestoreServices } from './services/firestore-service'
import { IUser } from './types/types'

// Every service in src/ (firestore-service.ts, auth-service.ts...) calls
// admin.firestore()/admin.auth() assuming a default app already exists, but
// nothing was ever calling admin.initializeApp() - masked until now because
// both HTTPS functions return 403 in production before reaching this code
// (see CLAUDE.md), and nothing exercised onUserDeleted/initializeUser
// end-to-end either.
admin.initializeApp()

const region = 'europe-west1'

// Firebase Functions v2 (2nd Gen) API
// Auth triggers are not directly supported, so we use:
// 1. An HTTPS endpoint for profile creation (called from frontend after auth)
// 2. Firestore triggers for cleanup

// Allowed origins come from the CORS_ORIGIN env var (see .env.example), kept
// per-environment (.env.<project-id>) rather than hardcoded here.
const allowedOrigins = config.app.corsOrigin

// Initialize user profile after authentication
// This replaces the auth.user().onCreate trigger
exports.initializeUser = onRequest(
  { region, cors: allowedOrigins },
  async (req, res) => {
    try {
      console.info('initializeUser called with body:', req.body)

      const authHeader = req.headers.authorization
      if (!authHeader) {
        console.error('No authorization header')
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Get user data from request body
      const { uid, email, displayName } = req.body || {}

      if (!uid) {
        console.error('Missing uid in request body')
        res.status(400).json({ error: 'Missing uid' })
        return
      }

      // Create a mock UserRecord object with minimal required properties
      const user = {
        uid,
        email: email || '',
        displayName: displayName || '',
        emailVerified: false,
        disabled: false,
        metadata: {},
        customClaims: null,
        providerData: [],
      } as any

      console.info('Calling onAuthUserCreated with user:', { uid: user.uid, email: user.email })
      await onAuthUserCreated(user)

      console.info('User profile initialized successfully for:', uid)
      res.json({ success: true, uid })
    } catch (error: any) {
      console.error('Error initializing user:', error.message || error)
      res.status(500).json({ error: error.message || 'Unknown error' })
    }
  }
)

// Cleanup when user document is deleted from Firestore
exports.onUserDeleted = onDocumentDeleted(
  'users/{userId}',
  async (event) => {
    try {
      const userId = event.params.userId
      // `firestoreServices.getUser(userId)` would always come back
      // not-found here - the deletion that triggered this already
      // committed by the time this runs - so `own_planning` has to come
      // from the event's own last-known snapshot instead of a re-fetch
      // (this is also why `profile/index.ts#onAuthUserDeleted`, written
      // for an Auth-side onDelete trigger where the doc still exists, was
      // never actually deleting the planning when wired to this trigger).
      const deletedUser = event.data?.data() as IUser | undefined
      if (deletedUser?.own_planning) {
        await firestoreServices.deletePlanning(deletedUser.own_planning)
      }
      await firestoreServices.deleteUser(userId)
    } catch (error: any) {
      console.error('Error deleting user:', error)
    }
  }
)

// Main API endpoint
exports.api = onRequest({ region, cors: true }, api)

//TODO check data constitency when user connect
