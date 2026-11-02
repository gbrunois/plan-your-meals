<template>
  <v-row
    class="fill-height align-start"
    no-gutters
    style="min-width: 0; max-width: 100%"
  >
    <v-col class="pa-0" style="min-width: 0">
      <v-card rounded="lg" elevation="1" class="overflow-hidden">
        <v-card-title class="text-h6 text-primary pt-4">{{
          title
        }}</v-card-title>
        <calendar-grid
          v-touch="{
            left: () => goToNextPeriod(),
            right: () => goToPreviousPeriod(),
          }"
          :days="days"
          :reference-date="referenceDate"
          :selected-date="selectedDate"
          :view-mode="viewMode"
          @select="selectDate"
        ></calendar-grid>
      </v-card>
    </v-col>
    <v-bottom-sheet v-model="detailOpen">
      <v-card v-if="day" rounded="t-xl" class="px-4 pb-4">
        <div class="d-flex align-center py-2">
          <div class="text-h6 text-primary text-capitalize">
            {{ day.date.toLongFormat() }}
          </div>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            aria-label="Fermer"
            @click="detailOpen = false"
          ></v-btn>
        </div>
        <meal label="Midi" :day="day" meal="lunch"></meal>
        <meal label="Soir" :day="day" meal="dinner"></meal>
      </v-card>
    </v-bottom-sheet>
  </v-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { daysService } from '@/services/days.service'
import {
  getDateFromUrlParamsOrToday,
  toCalendarRoute,
} from '@/services/router.service'
import { WEEK_PAGE_NAME, DEFAULT_MAIN_PAGE_NAME } from '@/router-names'
import CalendarGrid from './components/CalendarGrid.vue'
import MealComponent from './components/MealComponent.vue'

export default {
  name: WEEK_PAGE_NAME,
  components: {
    CalendarGrid,
    meal: MealComponent,
  },
  data() {
    return {
      detailOpen: false,
      selectedDate: null,
    }
  },
  computed: {
    ...mapGetters({
      days: 'days/watchingDays',
      day: 'days/openedDay',
      viewMode: 'days/viewMode',
    }),
    // first day of the list in week mode, month shown in month mode
    referenceDate() {
      return getDateFromUrlParamsOrToday(this.$route.params)
    },
    title() {
      if (this.viewMode === 'month') {
        const title = this.referenceDate.toMonthFormat()
        return title.charAt(0).toUpperCase() + title.slice(1)
      }
      const { beginDate, endDate } = daysService.getPeriod(
        this.referenceDate,
        this.viewMode
      )
      return `${beginDate.toShortFormat()} - ${endDate.toShortFormat()}`
    },
  },
  watch: {
    $route(to) {
      // this watcher also fires while leaving for another page
      if (to.name === WEEK_PAGE_NAME || to.name === DEFAULT_MAIN_PAGE_NAME) {
        this.load()
      }
    },
    viewMode() {
      this.load()
    },
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      const { beginDate, endDate } = daysService.getPeriod(
        this.referenceDate,
        this.viewMode
      )
      const loadedBeginDate = this.$store.getters['days/beginDate']
      const loadedEndDate = this.$store.getters['days/endDate']
      if (
        loadedBeginDate.toString() !== beginDate.toString() ||
        loadedEndDate.toString() !== endDate.toString()
      ) {
        await this.$store.dispatch('days/loadPeriod', { beginDate, endDate })
      }
    },
    async selectDate(date) {
      // the day is always one of the displayed ones, so this never reloads
      await this.$store.dispatch('days/openDay', date)
      this.selectedDate = date
      this.detailOpen = true
    },
    goToPreviousPeriod() {
      this.shiftPeriod(-1)
    },
    goToNextPeriod() {
      this.shiftPeriod(1)
    },
    shiftPeriod(direction) {
      this.$router.push(
        toCalendarRoute(
          daysService.shiftPeriod(this.referenceDate, direction, this.viewMode)
        )
      )
    },
  },
}
</script>
