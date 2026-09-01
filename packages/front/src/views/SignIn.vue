<template>
  <v-row class="fill-height">
    <v-col cols="12" class="text-center">
      <v-img
        :src="`${publicPath}img/icons/android-chrome-512x512.png`"
        class="my-3"
        contain
        height="200"
      ></v-img>
    </v-col>
    <v-col cols="12" class="text-center">
      <div>
        <h1 class="display-2 font-weight-bold mb-3">Plan your meals</h1>
        <p class="subheading font-weight-regular mx-3">
          Plannifier vous repas de la semaine et partager vos plannings avec vos
          proches
        </p>
        <p class="subheading font-weight-regular mx-3">
          Pour continuer, vous devez vous authentifier avec un compte Google
        </p>
      </div>
    </v-col>
    <v-col cols="12" class="text-center">
      <v-btn color="secondary" :disabled="signingIn" @click="authenticate">
        <v-icon left dark>mdi-google</v-icon>Me connecter avec Google
      </v-btn>
    </v-col>
    <v-col cols="12">
      <v-row>
        <v-col class="text-center">
          <a class="mx-1" href="terms-of-service">Condition d'utilisation</a>
          <a class="mx-1" href="privacy-policy">Politique de confidentialité</a>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import store from '@/store'
import { mapGetters } from 'vuex'
import { DEFAULT_MAIN_PAGE_PATH } from '@/router-names'

export default {
  name: 'SignSin',
  async beforeRouteEnter(to, from, next) {
    if (store.state.auth.user) {
      next(DEFAULT_MAIN_PAGE_PATH)
    } else {
      next()
    }
  },
  data() {
    return {
      publicPath: import.meta.env.BASE_URL,
      signingIn: false,
    }
  },
  computed: {
    ...mapGetters({ user: 'auth/user' }),
  },
  methods: {
    authenticate() {
      // Guard against a repeat click firing a second sign-in attempt while
      // the first is still in flight.
      if (this.signingIn) return
      this.signingIn = true
      this.$store
        .dispatch('auth/signIn')
        .catch((error) => console.error('Sign in failed:', error)) // TODO display error to client
        .finally(() => {
          this.signingIn = false
        })
    },
  },
}
</script>
