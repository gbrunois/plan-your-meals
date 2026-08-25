import api from './api/app'
import * as _ from 'lodash'
import { onAuthUserCreated, onAuthUserDeleted } from './profile'
import { onRequest } from 'firebase-functions/v2/https'
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { config } from './services/config-service'

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

      // Extract token and verify user
      const token = authHeader.replace('Bearer ', '')

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
      const user = {
        uid: userId,
      }
      await onAuthUserDeleted(user as any)
    } catch (error: any) {
      console.error('Error deleting user:', error)
    }
  }
)

// Main API endpoint
exports.api = onRequest({ region, cors: true }, api)

//TODO check data constitency when user connect
