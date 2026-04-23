<template>
  <div class="d-flex justify-space-between mx-2">
    <v-btn
      class="align-self-start"
      color="primary"
      small
      dark
      fab
      @click="goToPreviousDay()"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <div v-if="openedDay" class="my-auto">
      {{ openedDay.date.toLongFormat() }}
    </div>
    <v-btn
      class="align-self-end"
      color="primary"
      small
      dark
      fab
      @click="goToNextDay()"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { daysService } from '@/services/days.service'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({ openedDay: 'days/openedDay' }),
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
}
</script>
