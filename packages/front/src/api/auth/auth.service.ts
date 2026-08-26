import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import { auth } from '../firebaseService'

class AuthService {
  public signInWithGoogleWithPopup(): Promise<void | firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider()
    return auth.signInWithPopup(provider).catch((error: unknown) => {
      console.error(error)
    })
  }

  public signInWithGoogleWithRedirect() {
    const provider = new firebase.auth.GoogleAuthProvider()
    return auth
      .signInWithRedirect(provider)
      .catch((error: unknown) => console.error(error))
    // TODO display error to client
  }

  public getRedirectResult(): Promise<firebase.auth.UserCredential> {
    return auth.getRedirectResult()
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
