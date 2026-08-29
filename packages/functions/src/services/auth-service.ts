
import admin = require('firebase-admin')
import { Response, Request, NextFunction } from 'express'
import { UserRecord } from 'firebase-admin/auth'

export interface AuthenticatedRequest extends Request {
  user: admin.auth.DecodedIdToken
}

export const authServices = {
  /**
   * Return a user by email or return null if user doesn't exist
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    console.log('authServices.getUserByEmail', email)
    try {
      const userFound = await admin.auth().getUserByEmail(email)
      return userFound
    } catch (error) {
      if (error.code === 'auth/user-not-found') return Promise.resolve(null)
      else {
        console.log('getUserByEmail', error)
        throw error
      }
    }
  },
  async getUser(uid: string): Promise<UserRecord> {
    console.log('authServices.getUser', uid)
    return admin.auth().getUser(uid)
  },
}

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    console.log('Unauthorized', { headers: req.headers })
    res.status(403).send('Unauthorized')
    return
  }
  try {
    const idToken = req.headers.authorization.split('Bearer ')[1]
    const decodedIdToken = await admin.auth().verifyIdToken(idToken)
    req.user = decodedIdToken
    console.log('Authorized', { decodedIdToken })
    next()
    return
  } catch (e) {
    console.log('Unauthorized', e)
    res.status(403).send('Unauthorized')
    return
  }
}
