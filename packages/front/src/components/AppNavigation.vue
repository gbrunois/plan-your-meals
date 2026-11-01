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
    <v-app-bar fixed app dark color="primary">
      <v-app-bar-nav-icon @click.stop="onToolbarButtonClick">
        <v-icon>{{ menuIcon }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title v-if="!isCalendar" class="text-xs-center">
        {{ toolbarTitle }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-if="isCalendar">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          size="small"
          aria-label="Période précédente"
          @click="goToPreviousPeriod()"
        ></v-btn>
        <v-btn class="mx-2" variant="tonal" @click="onTodayButtonClick">
          Aujourd'hui
        </v-btn>
        <v-btn
          icon="mdi-chevron-right"
          variant="tonal"
          size="small"
          aria-label="Période suivante"
          @click="goToNextPeriod()"
        ></v-btn>
        <v-spacer></v-spacer>
      </template>
      <v-btn
        v-if="showSaveButton"
        small
        color="white"
        class="primary--text"
        @click.stop="onSaveButtonClick"
        >Enregistrer</v-btn
      >
      <v-menu v-if="isCalendar">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-horizontal"
            aria-label="Options"
            v-bind="props"
          ></v-btn>
        </template>
        <v-list>
          <v-list-subheader>Affichage</v-list-subheader>
          <v-list-item
            v-for="option in viewModes"
            :key="option.value"
            :prepend-icon="option.icon"
            :title="option.title"
            :active="option.value === viewMode"
            @click="setViewMode(option.value)"
          ></v-list-item>
        </v-list>
      </v-menu>
      <v-progress-linear
        v-if="isLoading"
        absolute
        location="bottom"
        indeterminate
        color="white"
      ></v-progress-linear>
    </v-app-bar>
    <v-snackbar v-model="showSyncErrorSnackbar" color="error" timeout="8000">
      {{ syncErrorMessage }}
    </v-snackbar>
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
import { DEFAULT_MAIN_PAGE_PATH } from '@/router-names'
import { daysService } from '@/services/days.service'
import {
  getDateFromUrlParamsOrToday,
  toCalendarRoute,
} from '@/services/router.service'

export default {
  name: 'AppNavigation',
  data() {
    return {
      drawer: false,
      version,
      dialogHasPendingRequests: false,
      showSyncErrorSnackbar: false,
      syncErrorMessage: '',
      viewModes: [
        { value: 'month', title: 'Vue mois', icon: 'mdi-calendar-month' },
        { value: 'week', title: 'Vue semaine', icon: 'mdi-calendar-week' },
      ],
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
    isCalendar() {
      return this.$route.meta.isCalendar === true
    },
    viewMode() {
      return this.$store.getters['days/viewMode']
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
      this.$router.push(toCalendarRoute(daysService.getNow()))
    },
    goToPreviousPeriod() {
      this.shiftPeriod(-1)
    },
    goToNextPeriod() {
      this.shiftPeriod(1)
    },
    shiftPeriod(direction) {
      const date = getDateFromUrlParamsOrToday(this.$route.params)
      this.$router.push(
        toCalendarRoute(daysService.shiftPeriod(date, direction, this.viewMode))
      )
    },
    setViewMode(viewMode) {
      this.$store.commit('days/setViewMode', viewMode)
    },
    async onSaveButtonClick() {
      const storeName = this.$route.meta.storeName
      if (storeName) {
        await this.$store.dispatch(`${storeName}/synchronizePendingRequests`)
        const error =
          this.$store.getters[
            `${storeName}/lastSynchronizingPendingRequestsError`
          ]
        if (error) {
          this.syncErrorMessage =
            "Erreur lors de l'enregistrement, veuillez réessayer."
          this.showSyncErrorSnackbar = true
          return
        }
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
