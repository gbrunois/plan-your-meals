// Minimal ambient typings for the Google Identity Services script loaded in
// index.html (https://accounts.google.com/gsi/client). Only covers the
// OAuth2 token client surface actually used by auth.service.ts.
export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              error?: string
            }) => void
          }): { requestAccessToken(): void }
        }
      }
    }
  }
}
