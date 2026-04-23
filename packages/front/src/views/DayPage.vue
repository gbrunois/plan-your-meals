<template>
  <v-row
    v-touch="{
      left: () => goToNextDay(),
      right: () => goToPreviousDay(),
    }"
    class="fill-height"
  >
    <v-col v-if="day" class="mt-2">
      <meal label="Midi" :day="day" meal="lunch"></meal>
      <v-divider></v-divider>
      <meal label="Soir" :day="day" meal="dinner"></meal>
    </v-col>
  </v-row>
</template>

<script>
import { getDateFromUrlParamsOrToday } from '@/services/router.service'
import { mapGetters } from 'vuex'
import MealComponent from './components/MealComponent.vue'

export default {
  name: 'Day',
  created() {
    const date = getDateFromUrlParamsOrToday(this.$route.params)
    this.$store.dispatch('days/openDay', date)
  },
  computed: {
    ...mapGetters({ day: 'days/openedDay' }),
  },
  components: {
    meal: MealComponent,
  },
  methods: {
    goToPreviousDay() {
      const previousWeek = daysService.getPreviousDay(
        this.$store.getters['days/openedDay'].date
      )
      const splits = previousWeek.toString().split('-')
      this.$router.push({
        name: 'day',
        params: {
          year: splits[0],
          month: splits[1],
          day: splits[2],
        },
      })
    },
    goToNextDay() {
      const previousWeek = daysService.getNextDay(
        this.$store.getters['days/openedDay'].date
      )
      const splits = previousWeek.toString().split('-')
      this.$router.push({
        name: 'day',
        params: {
          year: splits[0],
          month: splits[1],
          day: splits[2],
        },
      })
    },
  },
  watch: {
    $route(to) {
      const date = getDateFromUrlParamsOrToday(to.params)
      this.$store.dispatch('days/openDay', date)
    },
  },
}
</script>
