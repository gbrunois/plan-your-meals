<template>
  <v-row
    class="fill-height"
    v-touch="{
      left: () => goToNextWeek(),
      right: () => goToPreviousWeek(),
    }"
  >
    <v-col class="pa-0">
      <v-list lines="two">
        <template v-for="(item, index) in items" :key="item.date.toString()">
          <v-list-item @click="openPopupDay(item)">
            <v-list-item-title>{{
              item.date.toLongFormat()
            }}</v-list-item-title>
            <v-list-item-subtitle>Midi {{ item.lunch }}</v-list-item-subtitle>
            <v-list-item-subtitle
              >Soir {{ item.dinner }}</v-list-item-subtitle
            >
          </v-list-item>
          <v-divider
            v-if="index + 1 < items.length"
          ></v-divider>
        </template>
      </v-list>
    </v-col>
  </v-row>
</template>

<script>
import { daysService } from '@/services/days.service'
import { getDateFromUrlParamsOrToday } from '@/services/router.service'
import { WEEK_PAGE_NAME } from '../router'

export default {
  name: WEEK_PAGE_NAME,
  created() {
    const date = getDateFromUrlParamsOrToday(this.$route.params)
    this.$store.dispatch('days/loadPeriod', {
      beginDate: daysService.getFirstDayOfWeek(date),
      endDate: daysService.getLastDayOfWeek(date),
    })
  },
  computed: {
    items() {
      return this.$store.getters['days/watchingDays']
    },
    status() {
      return this.$store.getters['days/status']
    },
  },
  methods: {
    openPopupDay(day) {
      const splits = day.date.toString().split('-')
      this.$router.push({
        name: 'day',
        params: {
          year: splits[0],
          month: splits[1],
          day: splits[2],
        },
      })
    },
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
  watch: {
    $route(to) {
      const date = getDateFromUrlParamsOrToday(to.params)
      this.$store.dispatch('days/loadPeriod', {
        beginDate: daysService.getFirstDayOfWeek(date),
        endDate: daysService.getLastDayOfWeek(date),
      })
    },
  },
}
</script>
