import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import './registerServiceWorker'
import router from './router'
import store from './store'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(vuetify)

if (import.meta.env.VITE_SKIP_AUTH === 'true') {
  console.info('Force-enabling Mock Auth from main.ts')
  const mockUser = {
    uid: 'mock-user-123',
    displayName: 'Dev User',
    email: 'dev@example.com',
  }
  store.commit('auth/setUser', mockUser)
  store.commit('auth/setWaitForAuthenticatedState', false)
}

app.mount('#app')
