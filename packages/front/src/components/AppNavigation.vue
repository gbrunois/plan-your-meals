<template>
  <div>
    <v-navigation-drawer v-if="user" v-model="drawer" temporary app>
      <v-list class="pa-0" subheader>
        <v-list-item
          v-if="user !== null"
          class="light"
          :prepend-avatar="user.photoURL"
          :title="user.displayName"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-share"
          title="Mes partages"
          @click="navigateToSharingsPage()"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-calendar-multiple-check"
          title="Mes plannings"
          @click="navigateToMyPlannings()"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-settings"
          title="Paramètres"
          @click="navigateToSettings()"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Déconnecter"
          @click="logout()"
        ></v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-list class="pt-0" dense>
        <div class="container">
          <div class="text-xs-center">
            <h4 class="grey--text">Version {{ version }}</h4>
          </div>
        </div>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar fixed app dark color="primary" :extended="showToolbarExtension">
      <v-app-bar-nav-icon @click.stop="onToolbarButtonClick">
        <v-icon>{{ menuIcon }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title class="text-xs-center">
        {{ toolbarTitle }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="showSaveButton"
        small
        color="white"
        class="primary--text"
        @click.stop="onSaveButtonClick"
        >Enregistrer</v-btn
      >
      <v-app-bar-nav-icon
        v-if="showToolbarExtension"
        @click.stop="onTodayButtonClick"
      >
        <v-icon>mdi-calendar</v-icon>
      </v-app-bar-nav-icon>
      <template #extension>
        <v-row v-if="showToolbarExtension" no-gutters>
          <v-col cols="12">
            <component :is="currentTabComponent"></component>
          </v-col>
          <v-col class="flex-progress-linear" cols="12">
            <v-progress-linear
              v-if="isLoading"
              class="mx-0 my-1"
              :indeterminate="true"
              color="white"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </template>
    </v-app-bar>
    <v-dialog v-model="dialogHasPendingRequests" persistent>
      <v-card>
        <v-card-title class="body-1"
          >Voulez-vous quitter cette page sans enregistrer ?</v-card-title
        >

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            class="font-weight-black"
            text
            @click="dialogHasPendingRequests = false"
            >NON</v-btn
          >
          <v-btn color="primary" text @click="forceGoBack">OUI</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { version } from '../../package.json'
import DayNavigation from '../views/components/DayNavigation.vue'
import WeekNavigation from '../views/components/WeekNavigation.vue'
import { DEFAULT_MAIN_PAGE_PATH, DEFAULT_MAIN_PAGE_NAME } from '@/router-names'

export default {
  name: 'AppNavigation',
  components: {
    weekNavigation: WeekNavigation,
    dayNavigation: DayNavigation,
  },
  data() {
    return {
      drawer: false,
      version,
      dialogHasPendingRequests: false,
    }
  },
  computed: {
    user() {
      return this.$store.getters['auth/user']
    },
    isLoading() {
      return this.$store.getters['days/isLoading']
    },
    menuIcon() {
      if (this.$route.meta.showBackButton === true) {
        return 'mdi-arrow-left'
      } else {
        return 'mdi-menu'
      }
    },
    toolbarTitle() {
      return this.$route.meta.title
    },
    showToolbarExtension() {
      return this.$route.meta.showToolbarExtension === true
    },
    /**
     * Return the sub navigator component
     */
    currentTabComponent() {
      return this.$route.meta.navigationComponent
    },
    showSaveButton() {
      const storeName = this.$route.meta.storeName
      if (!storeName) return false
      return this.$store.getters[`${storeName}/hasPendingRequests`]
    },
  },
  methods: {
    logout() {
      this.$store
        .dispatch('auth/logout')
        .then(() => this.$router.push('signIn'))
    },
    navigateToSharingsPage() {
      this.$router.push({
        name: 'sharings',
      })
    },
    navigateToSettings() {
      this.$router.push({
        name: 'settings',
      })
    },
    navigateToMyPlannings() {
      this.$router.push({
        name: 'my-plannings',
      })
    },
    onToolbarButtonClick() {
      if (this.$route.meta.showBackButton === true) {
        this.goBack()
      } else {
        this.drawer = !this.drawer
      }
    },
    onTodayButtonClick() {
      if (this.$route.name !== DEFAULT_MAIN_PAGE_NAME) {
        this.$router.push({
          path: DEFAULT_MAIN_PAGE_PATH,
        })
      }
    },
    onSaveButtonClick() {
      const storeName = this.$route.meta.storeName
      if (storeName) {
        this.$store.dispatch(`${storeName}/synchronizePendingRequests`)
      }
      this.goBack()
    },
    goBack() {
      const storeName = this.$route.meta.storeName
      const hasPendingRequests =
        storeName && this.$store.getters[`${storeName}/hasPendingRequests`]
      if (hasPendingRequests) {
        this.dialogHasPendingRequests = true
      } else {
        const lastVisitedPage =
          this.$store.getters.currentWeekPage || DEFAULT_MAIN_PAGE_PATH
        this.$router.push({
          path: lastVisitedPage,
        })
      }
    },
    forceGoBack() {
      this.dialogHasPendingRequests = false
      const storeName = this.$route.meta.storeName
      this.$store.dispatch(`${storeName}/cancelPendingRequests`)
      const lastVisitedPage =
        this.$store.getters.currentWeekPage || DEFAULT_MAIN_PAGE_PATH
      this.$router.push({
        path: lastVisitedPage,
      })
    },
  },
}
</script>

<style scoped>
.flex-progress-linear {
  height: 7px;
}
</style>
