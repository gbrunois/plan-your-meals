<template>
  <div class="d-flex justify-space-between mx-2">
    <v-btn
      class="align-self-start"
      color="primary"
      small
      dark
      fab
      @click="goToPreviousWeek()"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <div class="my-auto">{{ currentPeriod }}</div>
    <v-btn
      class="align-self-end"
      color="primary"
      small
      dark
      fab
      @click="goToNextWeek()"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { daysService } from '@/services/days.service'
import { mapGetters } from 'vuex'
import { WEEK_PAGE_NAME } from '@/router-names'

export default {
  computed: {
    ...mapGetters({ currentPeriod: 'days/currentPeriod' }),
  },
  methods: {
    goToPreviousWeek() {
      const previousWeek = daysService.getPreviousStartDayOfWeek(
        this.$store.getters['days/beginDate']
      )
      const splits = previousWeek.toString().split('-')
      this.$router.push({
        name: WEEK_PAGE_NAME,
        params: {
          year: splits[0],
          month: splits[1],
          day: splits[2],
        },
      })
    },
    goToNextWeek() {
      const previousWeek = daysService.getNextStartDayOfWeek(
        this.$store.getters['days/beginDate']
      )
      const splits = previousWeek.toString().split('-')
      this.$router.push({
        name: WEEK_PAGE_NAME,
        params: {
          year: splits[0],
          month: splits[1],
          day: splits[2],
        },
      })
    },
  },
}
</script>
