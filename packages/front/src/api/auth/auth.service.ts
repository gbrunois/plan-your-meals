import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import { auth } from '../firebaseService'
import config from '../../../config'

class AuthService {
  // Firebase's own signInWithPopup/signInWithRedirect route through a
  // Google-hosted /__/auth/handler page (served from authDomain) to finish
  // the OAuth exchange. On this project that handler silently does nothing
  // on return - no console error, no network call, no sign-in recorded in
  // the Firebase console - a failure inside Google's own hosted JS, not
  // something in this app to fix. Google Identity Services
  // (accounts.google.com/gsi/client, loaded in index.html) gets an access
  // token directly client-side with no dependency on that handler; we then
  // hand it to Firebase via signInWithCredential, which talks to
  // identitytoolkit.googleapis.com directly (confirmed working
  // independently of the handler).
  public signInWithGoogle(): Promise<firebase.auth.UserCredential> {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services script failed to load'))
        return
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: config.googleOAuthClientId,
        scope: 'email profile',
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'No access token returned'))
            return
          }
          const credential = firebase.auth.GoogleAuthProvider.credential(
            null,
            response.access_token
          )
          auth.signInWithCredential(credential).then(resolve).catch(reject)
        },
      })
      client.requestAccessToken()
    })
  }

  public signOut() {
    return auth.signOut()
  }

  public onAuthStateChanged(callback: (user: firebase.User | null) => void) {
    return auth.onAuthStateChanged(callback)
  }

  public async deleteAccount() {
    const user = auth.currentUser
    if (user) {
      return user.delete() // handle auth error
    }
  }
}
export default new AuthService()
