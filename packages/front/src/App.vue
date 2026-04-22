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
import router from './router'
import { SIGNIN_PAGE_NAME, DEFAULT_MAIN_PAGE_PATH } from '@/router-names'
import SplashScreen from './views/SplashScreen.vue'

export default {
  name: 'App',
  components: {
    AppNavigation,
    SplashScreen,
  },
  data: () => {
    return {
      isApiLoading: true,
    }
  },
  created() {
    console.info('App.created: Initializing API...')
    this.isApiLoading = true
    Api.getInstance()
      .init()
      .then(() => {
        console.info(
          'App.created: API initialized. Dispatching watchUserAuthenticated...'
        )
        store.dispatch('auth/watchUserAuthenticated')
        this.isApiLoading = false
      })
      .catch((err) => {
        console.error('App.created: API initialization failed:', err)
        this.isApiLoading = false
      })
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      waitForAuthenticatedState: 'auth/waitForAuthenticatedState',
    }),
    isLoading() {
      return this.isApiLoading || this.waitForAuthenticatedState
    },
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
  },
}
</script>
<style>
.v-toolbar__extension {
  padding: 0;
}
</style>
