<template>
  <v-app>
    <app-navigation />
    <v-main>
      <splash-screen :is-loading="isLoading" />
      <v-container fluid class="bg-grey-lighten-4 fill-height" v-if="!isLoading">
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import AppNavigation from '@/components/AppNavigation.vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import { Api } from './api/api'
import router, { SIGNIN_PAGE_NAME, DEFAULT_MAIN_PAGE_PATH } from './router'
import SplashScreen from './views/SplashScreen.vue'

export default {
  name: 'App',
  components: {
    AppNavigation,
    SplashScreen,
  },
  data: () => {
    return {
      isLoading: true,
    }
  },
  created() {
    console.info('App.created: Initializing API...')
    this.isLoading = true
    Api.getInstance()
      .init()
      .then(() => {
        console.info('App.created: API initialized. Dispatching watchUserAuthenticated...')
        store.dispatch('auth/watchUserAuthenticated')
      })
      .catch((err) => {
        console.error('App.created: API initialization failed:', err)
      })
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      waitForAuthenticatedState: 'auth/waitForAuthenticatedState',
    }),
  },
  watch: {
    user() {
      if (
        store.state.auth.user &&
        this.$router.currentRoute.value.name === SIGNIN_PAGE_NAME
      ) {
        // user is connected. redirect on main page if current page is SignIn page
        router.push(DEFAULT_MAIN_PAGE_PATH)
      }
    },
    waitForAuthenticatedState() {
      this.isLoading = store.state.auth.waitForAuthenticatedState
    },
  },
}
</script>
<style>
.v-toolbar__extension {
  padding: 0;
}
</style>
